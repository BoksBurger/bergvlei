import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { leaderboardService } from '../services/leaderboard.service';

export class LeaderboardController {
  async getLeaderboard(req: Request, res: Response, next: NextFunction) {
    try {
      const { period = 'daily', limit = '100' } = req.query;
      const leaderboard = await leaderboardService.getTopPlayers(
        period as any,
        parseInt(limit as string, 10)
      );

      res.json({
        success: true,
        data: { leaderboard },
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserRank(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { period = 'daily' } = req.query;
      const rank = await leaderboardService.getUserRank(req.userId!, period as any);

      res.json({
        success: true,
        data: { rank },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const leaderboardController = new LeaderboardController();
