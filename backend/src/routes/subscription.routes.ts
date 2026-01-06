import { Router } from 'express';
import { subscriptionController } from '../controllers/subscription.controller';
import { authenticate } from '../middleware/auth';
import express from 'express';

const router = Router();

router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  subscriptionController.handleWebhook
);

router.post('/checkout', authenticate, subscriptionController.createCheckoutSession);
router.post('/portal', authenticate, subscriptionController.createPortalSession);
router.get('/status', authenticate, subscriptionController.getSubscriptionStatus);

export default router;
