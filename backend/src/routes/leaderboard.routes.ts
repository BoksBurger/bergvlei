import { Router } from 'express';
import { leaderboardController } from '../controllers/leaderboard.controller';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * /api/leaderboard:
 *   get:
 *     summary: Get global leaderboard
 *     tags: [Leaderboard]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Number of entries to return
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly, alltime]
 *           default: alltime
 *         description: Leaderboard timeframe
 *     responses:
 *       200:
 *         description: Leaderboard retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       rank:
 *                         type: integer
 *                       username:
 *                         type: string
 *                       points:
 *                         type: integer
 *                       riddlesSolved:
 *                         type: integer
 */
router.get('/', optionalAuth, leaderboardController.getLeaderboard);

/**
 * @swagger
 * /api/leaderboard/rank:
 *   get:
 *     summary: Get current user's rank
 *     tags: [Leaderboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User rank retrieved successfully
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
 *                     rank:
 *                       type: integer
 *                     points:
 *                       type: integer
 *                     totalUsers:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/rank', authenticate, leaderboardController.getUserRank);

export default router;
