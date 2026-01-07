import { Router } from 'express';
import { riddleController } from '../controllers/riddle.controller';
import { authenticate } from '../middleware/auth';
import { validate, riddleSchemas } from '../middleware/validation';
import { riddleLimiter } from '../middleware/rateLimiter';

const router = Router();

/**
 * @swagger
 * /api/riddles:
 *   get:
 *     summary: Get a new riddle
 *     tags: [Riddles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [EASY, MEDIUM, HARD]
 *         description: Filter by difficulty level
 *     responses:
 *       200:
 *         description: Riddle retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Riddle'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Daily riddle limit reached
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', authenticate, riddleLimiter, riddleController.getRiddle);

/**
 * @swagger
 * /api/riddles/submit:
 *   post:
 *     summary: Submit an answer to a riddle
 *     tags: [Riddles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - riddleId
 *               - answer
 *             properties:
 *               riddleId:
 *                 type: string
 *                 format: uuid
 *                 example: 123e4567-e89b-12d3-a456-426614174000
 *               answer:
 *                 type: string
 *                 example: The answer to the riddle
 *     responses:
 *       200:
 *         description: Answer submitted successfully
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
 *                     correct:
 *                       type: boolean
 *                     points:
 *                       type: integer
 *                     streak:
 *                       type: integer
 *       400:
 *         description: Invalid answer format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/submit', authenticate, validate(riddleSchemas.submit), riddleController.submitAnswer);

/**
 * @swagger
 * /api/riddles/{riddleId}/hint:
 *   get:
 *     summary: Get a hint for a specific riddle
 *     tags: [Riddles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: riddleId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The riddle ID
 *     responses:
 *       200:
 *         description: Hint retrieved successfully
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
 *                     hint:
 *                       type: string
 *                     hintNumber:
 *                       type: integer
 *       400:
 *         description: No more hints available
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Riddle not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:riddleId/hint', authenticate, validate(riddleSchemas.getHint), riddleController.getHint);

/**
 * @swagger
 * /api/riddles/stats:
 *   get:
 *     summary: Get user riddle statistics
 *     tags: [Riddles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
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
 *                     totalAttempted:
 *                       type: integer
 *                     totalSolved:
 *                       type: integer
 *                     currentStreak:
 *                       type: integer
 *                     longestStreak:
 *                       type: integer
 *                     totalPoints:
 *                       type: integer
 *                     riddlesToday:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/stats', authenticate, riddleController.getStats);

export default router;
