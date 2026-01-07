import { config } from '../config/env';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { SubscriptionStatus, SubscriptionTier } from '../types';
import { cacheService } from './cache.service';
import { CACHE_KEYS } from '../config/redis';

interface RevenueCatSubscriber {
  subscriber: {
    entitlements: Record<string, any>;
    subscriptions: Record<string, any>;
    non_subscriptions: Record<string, any>;
  };
}

export class RevenueCatService {
  private apiKey: string;
  private baseUrl = 'https://api.revenuecat.com/v1';

  constructor() {
    if (!config.revenueCat.apiKey) {
      throw new Error('RevenueCat API key is required');
    }
    this.apiKey = config.revenueCat.apiKey;
  }

  /**
   * Get subscriber from RevenueCat REST API
   */
  private async getSubscriber(userId: string): Promise<RevenueCatSubscriber | null> {
    try {
      const response = await fetch(`${this.baseUrl}/subscribers/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`RevenueCat API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('RevenueCat API error:', error);
      throw error;
    }
  }

  /**
   * Get or create subscriber in RevenueCat
   */
  async getOrCreateSubscriber(userId: string) {
    try {
      const subscriber = await this.getSubscriber(userId);
      if (!subscriber) {
        // Subscriber doesn't exist, create initial subscription record
        await this.ensureSubscriptionRecord(userId);
        return null;
      }
      return subscriber;
    } catch (error: any) {
      console.error('Get or create subscriber error:', error);
      await this.ensureSubscriptionRecord(userId);
      return null;
    }
  }

  /**
   * Ensure subscription record exists in database
   */
  private async ensureSubscriptionRecord(userId: string) {
    const existingSubscription = await prisma.subscription.findFirst({
      where: { userId },
    });

    if (!existingSubscription) {
      await prisma.subscription.create({
        data: {
          userId,
          tier: SubscriptionTier.FREE,
          status: SubscriptionStatus.ACTIVE,
        },
      });
    }
  }

  /**
   * Get subscription status from RevenueCat
   */
  async getSubscriptionStatus(userId: string) {
    try {
      const subscriber = await this.getSubscriber(userId);

      const subscription = await prisma.subscription.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          isPremium: true,
          subscriptionTier: true,
          riddlesPerDayLimit: true,
        },
      });

      // Check if user has any active entitlements
      const hasActiveEntitlements = subscriber?.subscriber?.entitlements
        && Object.keys(subscriber.subscriber.entitlements).length > 0;

      return {
        subscription,
        isPremium: user?.isPremium || false,
        tier: user?.subscriptionTier || SubscriptionTier.FREE,
        riddlesPerDayLimit: user?.riddlesPerDayLimit || 5,
        revenueCatData: subscriber,
        hasActiveEntitlements,
      };
    } catch (error) {
      console.error('RevenueCat get subscription status error:', error);
      // Return local database data if RevenueCat fails
      const subscription = await prisma.subscription.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          isPremium: true,
          subscriptionTier: true,
          riddlesPerDayLimit: true,
        },
      });

      return {
        subscription,
        isPremium: user?.isPremium || false,
        tier: user?.subscriptionTier || SubscriptionTier.FREE,
        riddlesPerDayLimit: user?.riddlesPerDayLimit || 5,
        revenueCatData: null,
        hasActiveEntitlements: false,
      };
    }
  }

  /**
   * Handle RevenueCat webhook events
   */
  async handleWebhook(event: any) {
    try {
      const eventType = event.event?.type;
      const appUserId = event.event?.app_user_id;
      const productId = event.event?.product_id;
      const expirationDate = event.event?.expiration_at_ms;
      const purchaseDate = event.event?.purchased_at_ms;

      if (!appUserId) {
        console.log('Webhook missing app_user_id');
        return;
      }

      console.log(`Processing RevenueCat webhook: ${eventType} for user ${appUserId}`);

      switch (eventType) {
        case 'INITIAL_PURCHASE':
          await this.handleInitialPurchase(appUserId, productId, purchaseDate, expirationDate);
          break;

        case 'RENEWAL':
          await this.handleRenewal(appUserId, productId, expirationDate);
          break;

        case 'CANCELLATION':
          await this.handleCancellation(appUserId);
          break;

        case 'UNCANCELLATION':
          await this.handleUncancellation(appUserId, expirationDate);
          break;

        case 'NON_RENEWING_PURCHASE':
          await this.handleNonRenewingPurchase(appUserId, productId);
          break;

        case 'EXPIRATION':
          await this.handleExpiration(appUserId);
          break;

        case 'BILLING_ISSUE':
          await this.handleBillingIssue(appUserId);
          break;

        case 'PRODUCT_CHANGE':
          await this.handleProductChange(appUserId, productId, expirationDate);
          break;

        default:
          console.log(`Unhandled webhook event type: ${eventType}`);
      }
    } catch (error) {
      console.error('RevenueCat webhook handling error:', error);
      throw error;
    }
  }

  private async handleInitialPurchase(
    userId: string,
    productId: string,
    purchaseDate?: number,
    expirationDate?: number
  ) {
    await this.ensureSubscriptionRecord(userId);

    await prisma.subscription.updateMany({
      where: { userId },
      data: {
        revenueCatProductId: productId,
        status: SubscriptionStatus.ACTIVE,
        tier: SubscriptionTier.PREMIUM,
        currentPeriodStart: purchaseDate ? new Date(purchaseDate) : new Date(),
        currentPeriodEnd: expirationDate ? new Date(expirationDate) : undefined,
        cancelAtPeriodEnd: false,
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

  private async handleRenewal(userId: string, productId: string, expirationDate?: number) {
    await prisma.subscription.updateMany({
      where: { userId },
      data: {
        revenueCatProductId: productId,
        status: SubscriptionStatus.ACTIVE,
        tier: SubscriptionTier.PREMIUM,
        currentPeriodEnd: expirationDate ? new Date(expirationDate) : undefined,
        cancelAtPeriodEnd: false,
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

  private async handleCancellation(userId: string) {
    // User cancelled but subscription remains active until period end
    await prisma.subscription.updateMany({
      where: { userId },
      data: {
        cancelAtPeriodEnd: true,
      },
    });

    await cacheService.delete(CACHE_KEYS.USER_PROFILE(userId));
  }

  private async handleUncancellation(userId: string, expirationDate?: number) {
    await prisma.subscription.updateMany({
      where: { userId },
      data: {
        status: SubscriptionStatus.ACTIVE,
        cancelAtPeriodEnd: false,
        currentPeriodEnd: expirationDate ? new Date(expirationDate) : undefined,
      },
    });

    await cacheService.delete(CACHE_KEYS.USER_PROFILE(userId));
  }

  private async handleNonRenewingPurchase(userId: string, productId: string) {
    // Handle one-time purchases (e.g., hint packs)
    console.log(`Non-renewing purchase for user ${userId}: ${productId}`);
    // This could be used for hint packs or other one-time IAPs
    await cacheService.delete(CACHE_KEYS.USER_PROFILE(userId));
  }

  private async handleExpiration(userId: string) {
    await prisma.subscription.updateMany({
      where: { userId },
      data: {
        status: SubscriptionStatus.EXPIRED,
        tier: SubscriptionTier.FREE,
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: {
        isPremium: false,
        subscriptionTier: SubscriptionTier.FREE,
        riddlesPerDayLimit: 5,
      },
    });

    await cacheService.delete(CACHE_KEYS.USER_PROFILE(userId));
  }

  private async handleBillingIssue(userId: string) {
    // Mark subscription as having billing issues
    console.log(`Billing issue for user ${userId}`);
    await prisma.subscription.updateMany({
      where: { userId },
      data: {
        status: SubscriptionStatus.EXPIRED,
      },
    });

    await cacheService.delete(CACHE_KEYS.USER_PROFILE(userId));
  }

  private async handleProductChange(
    userId: string,
    productId: string,
    expirationDate?: number
  ) {
    await prisma.subscription.updateMany({
      where: { userId },
      data: {
        revenueCatProductId: productId,
        currentPeriodEnd: expirationDate ? new Date(expirationDate) : undefined,
      },
    });

    await cacheService.delete(CACHE_KEYS.USER_PROFILE(userId));
  }

  /**
   * Verify webhook signature (if using RevenueCat webhook authentication)
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    // RevenueCat uses authorization bearer tokens for webhooks
    // In production, you should verify the webhook signature
    // For now, we'll implement basic validation
    if (!signature) {
      throw new AppError(400, 'Missing webhook signature');
    }
    // TODO: Implement proper signature verification based on RevenueCat docs
    return true;
  }
}

export const revenueCatService = new RevenueCatService();
