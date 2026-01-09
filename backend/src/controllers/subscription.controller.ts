import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { revenueCatService } from '../services/revenuecat.service';

export class SubscriptionController {
  /**
   * Get subscription status
   * Called by mobile app to check if user has premium access
   */
  async getSubscriptionStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const subscriptionData = await revenueCatService.getSubscriptionStatus(userId);

      res.json({
        success: true,
        data: subscriptionData,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle RevenueCat webhook events
   * This endpoint receives subscription events from RevenueCat
   * No authentication required (verified by webhook signature)
   */
  async handleWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers['authorization'];

      if (!authHeader) {
        res.status(400).json({
          success: false,
          error: { message: 'Missing authorization header' },
        });
        return;
      }

      // RevenueCat sends webhooks with Authorization: Bearer <token>
      // Verify the webhook is from RevenueCat
      try {
        const isValid = revenueCatService.verifyWebhookSignature(
          JSON.stringify(req.body),
          authHeader
        );

        if (!isValid) {
          res.status(401).json({
            success: false,
            error: { message: 'Invalid webhook signature' },
          });
          return;
        }
      } catch (error) {
        res.status(401).json({
          success: false,
          error: { message: 'Webhook verification failed' },
        });
        return;
      }

      // Process the webhook event
      await revenueCatService.handleWebhook(req.body);

      res.json({ received: true });
    } catch (error) {
      console.error('Webhook handling error:', error);
      next(error);
    }
  }

  /**
   * Sync subscription status from RevenueCat
   * Called by mobile app after a purchase to immediately sync status
   */
  async syncSubscription(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;

      // Fetch latest subscriber info from RevenueCat
      await revenueCatService.getOrCreateSubscriber(userId);

      // Get updated status
      const subscriptionData = await revenueCatService.getSubscriptionStatus(userId);

      res.json({
        success: true,
        data: subscriptionData,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get available offerings (products)
   * Returns subscription products configured in RevenueCat
   * Note: In RevenueCat, offerings are typically fetched client-side
   * This endpoint is for reference only
   */
  async getOfferings(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // In RevenueCat, offerings are typically fetched from the mobile SDK
      // This endpoint returns metadata for the frontend
      res.json({
        success: true,
        data: {
          message: 'Offerings should be fetched from RevenueCat SDK on mobile',
          products: {
            premium_monthly: {
              identifier: 'premium_monthly',
              price: 4.99,
              currency: 'USD',
              description: 'Premium Monthly Subscription',
              features: [
                'Unlimited riddles per day',
                'No advertisements',
                'Priority support',
                'Exclusive riddle categories',
              ],
            },
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const subscriptionController = new SubscriptionController();
