import Stripe from 'stripe';
import { config } from '../config/env';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { SubscriptionStatus, SubscriptionTier } from '../types';
import { cacheService } from './cache.service';
import { CACHE_KEYS } from '../config/redis';

export class StripeService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(config.stripe.secretKey, {
      apiVersion: '2024-12-18.acacia',
    });
  }

  async createCustomer(userId: string, email: string) {
    try {
      const customer = await this.stripe.customers.create({
        email,
        metadata: {
          userId,
        },
      });

      await prisma.subscription.create({
        data: {
          userId,
          stripeCustomerId: customer.id,
          tier: SubscriptionTier.FREE,
          status: SubscriptionStatus.ACTIVE,
        },
      });

      return customer;
    } catch (error) {
      console.error('Stripe create customer error:', error);
      throw new AppError(500, 'Failed to create customer');
    }
  }

  async createCheckoutSession(userId: string, email: string) {
    try {
      let subscription = await prisma.subscription.findFirst({
        where: { userId },
      });

      if (!subscription || !subscription.stripeCustomerId) {
        const customer = await this.createCustomer(userId, email);
        subscription = await prisma.subscription.findFirst({
          where: { userId },
        });
      }

      const session = await this.stripe.checkout.sessions.create({
        customer: subscription!.stripeCustomerId!,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: config.stripe.premiumPriceId,
            quantity: 1,
          },
        ],
        success_url: `${config.apiUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${config.apiUrl}/subscription/cancel`,
        metadata: {
          userId,
        },
      });

      return session;
    } catch (error) {
      console.error('Stripe create checkout session error:', error);
      throw new AppError(500, 'Failed to create checkout session');
    }
  }

  async createPortalSession(userId: string) {
    try {
      const subscription = await prisma.subscription.findFirst({
        where: { userId },
      });

      if (!subscription || !subscription.stripeCustomerId) {
        throw new AppError(404, 'No subscription found');
      }

      const session = await this.stripe.billingPortal.sessions.create({
        customer: subscription.stripeCustomerId,
        return_url: `${config.apiUrl}/profile`,
      });

      return session;
    } catch (error) {
      console.error('Stripe create portal session error:', error);
      throw new AppError(500, 'Failed to create portal session');
    }
  }

  async handleWebhook(event: Stripe.Event) {
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
          break;

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;

        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;

        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error('Webhook handling error:', error);
      throw error;
    }
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.userId;
    if (!userId) return;

    const subscriptionId = session.subscription as string;

    await prisma.subscription.updateMany({
      where: { userId },
      data: {
        stripeSubscriptionId: subscriptionId,
        status: SubscriptionStatus.ACTIVE,
        tier: SubscriptionTier.PREMIUM,
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: {
        isPremium: true,
        subscriptionTier: SubscriptionTier.PREMIUM,
        riddlesPerDayLimit: 999999,
      },
    });

    await cacheService.delete(CACHE_KEYS.USER_PROFILE(userId));
  }

  private async handleSubscriptionUpdate(subscription: Stripe.Subscription) {
    const userId = subscription.metadata?.userId;
    if (!userId) return;

    const status = this.mapStripeStatus(subscription.status);
    const isPremium = subscription.status === 'active' || subscription.status === 'trialing';

    await prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status,
        tier: isPremium ? SubscriptionTier.PREMIUM : SubscriptionTier.FREE,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });

    await prisma.user.updateMany({
      where: {
        subscriptions: {
          some: {
            stripeSubscriptionId: subscription.id,
          },
        },
      },
      data: {
        isPremium,
        subscriptionTier: isPremium ? SubscriptionTier.PREMIUM : SubscriptionTier.FREE,
        riddlesPerDayLimit: isPremium ? 999999 : 5,
      },
    });

    if (userId) {
      await cacheService.delete(CACHE_KEYS.USER_PROFILE(userId));
    }
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    await prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: SubscriptionStatus.EXPIRED,
        tier: SubscriptionTier.FREE,
      },
    });

    await prisma.user.updateMany({
      where: {
        subscriptions: {
          some: {
            stripeSubscriptionId: subscription.id,
          },
        },
      },
      data: {
        isPremium: false,
        subscriptionTier: SubscriptionTier.FREE,
        riddlesPerDayLimit: 5,
      },
    });
  }

  private async handlePaymentSucceeded(invoice: Stripe.Invoice) {
    console.log('Payment succeeded:', invoice.id);
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice) {
    console.log('Payment failed:', invoice.id);
  }

  private mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
    switch (status) {
      case 'active':
        return SubscriptionStatus.ACTIVE;
      case 'canceled':
        return SubscriptionStatus.CANCELED;
      case 'trialing':
        return SubscriptionStatus.TRIAL;
      default:
        return SubscriptionStatus.EXPIRED;
    }
  }

  verifyWebhookSignature(payload: Buffer, signature: string): Stripe.Event {
    try {
      return this.stripe.webhooks.constructEvent(
        payload,
        signature,
        config.stripe.webhookSecret
      );
    } catch (error) {
      throw new AppError(400, 'Invalid webhook signature');
    }
  }
}

export const stripeService = new StripeService();
