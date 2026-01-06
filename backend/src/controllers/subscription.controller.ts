import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { stripeService } from '../services/stripe.service';
import { prisma } from '../config/database';

export class SubscriptionController {
  async createCheckoutSession(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.userId! },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: { message: 'User not found' },
        });
      }

      const session = await stripeService.createCheckoutSession(user.id, user.email);

      res.json({
        success: true,
        data: {
          sessionId: session.id,
          url: session.url,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async createPortalSession(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const session = await stripeService.createPortalSession(req.userId!);

      res.json({
        success: true,
        data: {
          url: session.url,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getSubscriptionStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const subscription = await prisma.subscription.findFirst({
        where: { userId: req.userId! },
        orderBy: { createdAt: 'desc' },
      });

      const user = await prisma.user.findUnique({
        where: { id: req.userId! },
        select: {
          isPremium: true,
          subscriptionTier: true,
          riddlesPerDayLimit: true,
        },
      });

      res.json({
        success: true,
        data: {
          subscription,
          isPremium: user?.isPremium || false,
          tier: user?.subscriptionTier || 'FREE',
          riddlesPerDayLimit: user?.riddlesPerDayLimit || 5,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async handleWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const signature = req.headers['stripe-signature'] as string;

      if (!signature) {
        return res.status(400).json({
          success: false,
          error: { message: 'Missing stripe signature' },
        });
      }

      const event = stripeService.verifyWebhookSignature(req.body, signature);
      await stripeService.handleWebhook(event);

      res.json({ received: true });
    } catch (error) {
      next(error);
    }
  }
}

export const subscriptionController = new SubscriptionController();
