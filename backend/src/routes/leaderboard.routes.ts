import { Router } from 'express';
import { leaderboardController } from '../controllers/leaderboard.controller';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = Router();

router.get('/', optionalAuth, leaderboardController.getLeaderboard);
router.get('/rank', authenticate, leaderboardController.getUserRank);

export default router;
