import { Router } from 'express';
import authRoutes from './auth.routes';
import riddleRoutes from './riddle.routes';
import leaderboardRoutes from './leaderboard.routes';
import subscriptionRoutes from './subscription.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/riddles', riddleRoutes);
router.use('/leaderboard', leaderboardRoutes);
router.use('/subscription', subscriptionRoutes);

export default router;
