import { Router } from 'express';
import { subscriptionController } from '../controllers/subscription.controller';
import { authenticate } from '../middleware/auth';
import express from 'express';

const router = Router();

// RevenueCat webhook endpoint (no auth - verified by webhook signature)
router.post(
  '/webhook',
  express.json(),
  subscriptionController.handleWebhook
);

// Get subscription status for current user
router.get('/status', authenticate, subscriptionController.getSubscriptionStatus);

// Sync subscription status from RevenueCat (call after purchase)
router.post('/sync', authenticate, subscriptionController.syncSubscription);

// Get available offerings (informational)
router.get('/offerings', authenticate, subscriptionController.getOfferings);

export default router;
