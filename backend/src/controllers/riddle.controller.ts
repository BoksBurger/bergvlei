import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { riddleService } from '../services/riddle.service';
import { DifficultyLevel } from '../types';

export class RiddleController {
  async getRiddle(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { difficulty } = req.query;
      const riddle = await riddleService.getRandomRiddle(
        req.userId!,
        difficulty as DifficultyLevel
      );

      res.json({
        success: true,
        data: { riddle },
      });
    } catch (error) {
      next(error);
    }
  }

  async submitAnswer(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { riddleId, answer, timeSpent, hintsUsed } = req.body;
      const result = await riddleService.submitAnswer(
        req.userId!,
        riddleId,
        answer,
        timeSpent,
        hintsUsed
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getHint(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { riddleId } = req.params;
      const { hintNumber } = req.query;
      const hint = await riddleService.getHint(
        req.userId!,
        riddleId,
        parseInt(hintNumber as string, 10)
      );

      res.json({
        success: true,
        data: hint,
      });
    } catch (error) {
      next(error);
    }
  }

  async getStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const stats = await riddleService.getUserStats(req.userId!);

      res.json({
        success: true,
        data: { stats },
      });
    } catch (error) {
      next(error);
    }
  }

  async generateAIHint(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { riddleId } = req.params;
      const hint = await riddleService.generateAIHint(req.userId!, riddleId);

      res.json({
        success: true,
        data: hint,
      });
    } catch (error) {
      next(error);
    }
  }

  async validateAnswerWithAI(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { riddleId, answer } = req.body;
      const validation = await riddleService.validateAnswerWithAI(riddleId, answer);

      res.json({
        success: true,
        data: validation,
      });
    } catch (error) {
      next(error);
    }
  }

  async generateAIRiddle(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { difficulty, category, customAnswer } = req.query;
      const riddle = await riddleService.generateAIRiddle(
        req.userId!,
        difficulty as DifficultyLevel,
        category as string,
        customAnswer as string
      );

      res.json({
        success: true,
        data: { riddle },
      });
    } catch (error) {
      next(error);
    }
  }

  async saveCustomRiddle(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { riddleId } = req.body;
      const result = await riddleService.saveCustomRiddle(req.userId!, riddleId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getSavedRiddles(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const savedRiddles = await riddleService.getSavedRiddles(req.userId!);

      res.json({
        success: true,
        data: { savedRiddles },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const riddleController = new RiddleController();
