import { Router } from 'express';
import { subscriptionController } from '../controllers/subscription.controller';
import { authenticate } from '../middleware/auth';
import express from 'express';

const router = Router();

/**
 * @swagger
 * /api/subscription/webhook:
 *   post:
 *     summary: RevenueCat webhook endpoint
 *     tags: [Subscription]
 *     description: Receives webhook events from RevenueCat for subscription updates (no authentication required - verified by webhook signature)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: RevenueCat webhook payload
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       400:
 *         description: Invalid webhook payload
 */
router.post(
  '/webhook',
  express.json(),
  subscriptionController.handleWebhook
);

/**
 * @swagger
 * /api/subscription/status:
 *   get:
 *     summary: Get current user's subscription status
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     subscription:
 *                       $ref: '#/components/schemas/Subscription'
 *                     isPremium:
 *                       type: boolean
 *                     tier:
 *                       type: string
 *                       enum: [FREE, PREMIUM]
 *                     riddlesPerDayLimit:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/status', authenticate, subscriptionController.getSubscriptionStatus);

/**
 * @swagger
 * /api/subscription/sync:
 *   post:
 *     summary: Sync subscription status from RevenueCat
 *     tags: [Subscription]
 *     description: Call this endpoint after a purchase to sync subscription status from RevenueCat
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription synced successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     subscription:
 *                       $ref: '#/components/schemas/Subscription'
 *                     isPremium:
 *                       type: boolean
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/sync', authenticate, subscriptionController.syncSubscription);

/**
 * @swagger
 * /api/subscription/offerings:
 *   get:
 *     summary: Get available subscription offerings
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Offerings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     offerings:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           description:
 *                             type: string
 *                           price:
 *                             type: string
 *                           duration:
 *                             type: string
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/offerings', authenticate, subscriptionController.getOfferings);

export default router;
