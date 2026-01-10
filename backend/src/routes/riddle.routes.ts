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

/**
 * @swagger
 * /api/riddles/{riddleId}/ai-hint:
 *   get:
 *     summary: Generate an AI-powered hint for a riddle (Premium only)
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
 *         description: AI hint generated successfully
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
 *                     confidence:
 *                       type: number
 *                     isAIGenerated:
 *                       type: boolean
 *       403:
 *         description: Premium subscription required
 */
router.get('/:riddleId/ai-hint', authenticate, riddleController.generateAIHint);

/**
 * @swagger
 * /api/riddles/validate-ai:
 *   post:
 *     summary: Validate answer with AI fuzzy matching
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
 *               answer:
 *                 type: string
 *     responses:
 *       200:
 *         description: Answer validated successfully
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
 *                     isCorrect:
 *                       type: boolean
 *                     similarity:
 *                       type: number
 *                     feedback:
 *                       type: string
 */
router.post('/validate-ai', authenticate, riddleController.validateAnswerWithAI);

/**
 * @swagger
 * /api/riddles/generate-ai:
 *   get:
 *     summary: Generate a new riddle using AI
 *     tags: [Riddles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [EASY, MEDIUM, HARD, EXPERT]
 *         description: Difficulty level
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Riddle category
 *       - in: query
 *         name: customAnswer
 *         schema:
 *           type: string
 *         description: Custom answer to generate riddle around
 *     responses:
 *       200:
 *         description: AI riddle generated successfully
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
 *                     riddle:
 *                       type: object
 */
router.get('/generate-ai', authenticate, riddleLimiter, riddleController.generateAIRiddle);

/**
 * @swagger
 * /api/riddles/save-custom:
 *   post:
 *     summary: Save a custom riddle to user's collection
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
 *             properties:
 *               riddleId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Riddle saved successfully
 */
router.post('/save-custom', authenticate, riddleController.saveCustomRiddle);

/**
 * @swagger
 * /api/riddles/saved-riddles:
 *   get:
 *     summary: Get user's saved riddles
 *     tags: [Riddles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Saved riddles retrieved successfully
 */
router.get('/saved-riddles', authenticate, riddleController.getSavedRiddles);

export default router;
