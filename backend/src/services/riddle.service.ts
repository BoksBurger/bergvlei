import { createId } from '@paralleldrive/cuid2';
import { prisma } from '../config/database';
import { cacheService } from './cache.service';
import { leaderboardService } from './leaderboard.service';
import { aiService } from './ai.service';
import { AppError } from '../middleware/errorHandler';
import { DifficultyLevel } from '../types';
import { CACHE_KEYS, CACHE_TTL } from '../config/redis';

export class RiddleService {
  async getRandomRiddle(userId: string, difficulty?: DifficultyLevel) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    const dailyCount = await cacheService.getDailyRiddleCount(userId);

    if (!user.isPremium && dailyCount >= user.riddlesPerDayLimit) {
      throw new AppError(403, 'Daily riddle limit reached. Upgrade to premium for unlimited riddles.');
    }

    const solvedRiddleIds = await prisma.riddleAttempt.findMany({
      where: {
        userId,
        solved: true,
      },
      select: {
        riddleId: true,
      },
    });

    const riddle = await prisma.riddle.findFirst({
      where: {
        isActive: true,
        difficulty: difficulty || undefined,
        id: {
          notIn: solvedRiddleIds.map((r) => r.riddleId),
        },
      },
      orderBy: {
        timesAttempted: 'asc',
      },
    });

    if (!riddle) {
      throw new AppError(404, 'No riddles available. Try a different difficulty level.');
    }

    await prisma.riddle.update({
      where: { id: riddle.id },
      data: {
        timesAttempted: {
          increment: 1,
        },
      },
    });

    await prisma.riddleAttempt.create({
      data: {
        id: createId(),
        userId,
        riddleId: riddle.id,
      },
    });

    await cacheService.incrementDailyRiddleCount(userId);

    return {
      id: riddle.id,
      question: riddle.question,
      difficulty: riddle.difficulty,
      category: riddle.category,
      hintsAvailable: riddle.hints.length,
    };
  }

  async submitAnswer(userId: string, riddleId: string, answer: string, timeSpent?: number, hintsUsed?: number) {
    const riddle = await prisma.riddle.findUnique({
      where: { id: riddleId },
    });

    if (!riddle) {
      throw new AppError(404, 'Riddle not found');
    }

    const attempt = await prisma.riddleAttempt.findFirst({
      where: {
        userId,
        riddleId,
        solved: false,
      },
      orderBy: {
        startedAt: 'desc',
      },
    });

    if (!attempt) {
      throw new AppError(404, 'No active attempt found for this riddle');
    }

    const isCorrect = answer.toLowerCase().trim() === riddle.answer.toLowerCase().trim();

    await prisma.riddleAttempt.update({
      where: { id: attempt.id },
      data: {
        solved: isCorrect,
        attempts: {
          increment: 1,
        },
        hintsUsed: hintsUsed || 0,
        timeSpent: timeSpent,
        completedAt: isCorrect ? new Date() : undefined,
      },
    });

    if (isCorrect) {
      await prisma.riddle.update({
        where: { id: riddleId },
        data: {
          timesSolved: {
            increment: 1,
          },
        },
      });

      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          totalRiddlesSolved: {
            increment: 1,
          },
        },
      });

      await prisma.userStats.update({
        where: { userId },
        data: {
          totalRiddlesSolved: {
            increment: 1,
          },
          totalAttempts: {
            increment: 1,
          },
          totalHintsUsed: {
            increment: hintsUsed || 0,
          },
          totalTimeSpent: {
            increment: timeSpent || 0,
          },
        },
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await prisma.dailyProgress.upsert({
        where: {
          userId_date: {
            userId,
            date: today,
          },
        },
        update: {
          riddlesSolved: {
            increment: 1,
          },
          riddlesAttempted: {
            increment: 1,
          },
        },
        create: {
          id: createId(),
          userId,
          date: today,
          riddlesSolved: 1,
          riddlesAttempted: 1,
        },
      });

      await leaderboardService.addScore(
        userId,
        user.username || user.email,
        user.totalRiddlesSolved,
        'daily'
      );

      await leaderboardService.addScore(
        userId,
        user.username || user.email,
        user.totalRiddlesSolved,
        'alltime'
      );

      await cacheService.delete(CACHE_KEYS.USER_STATS(userId));
    }

    return {
      correct: isCorrect,
      answer: isCorrect ? riddle.answer : undefined,
      message: isCorrect ? 'Correct! Well done!' : 'Incorrect. Try again!',
    };
  }

  async getHint(userId: string, riddleId: string, hintNumber: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    const riddle = await prisma.riddle.findUnique({
      where: { id: riddleId },
    });

    if (!riddle) {
      throw new AppError(404, 'Riddle not found');
    }

    if (hintNumber < 0 || hintNumber >= riddle.hints.length) {
      throw new AppError(400, 'Invalid hint number');
    }

    if (!user.isPremium && hintNumber > 0) {
      throw new AppError(403, 'Upgrade to premium to access more hints');
    }

    return {
      hint: riddle.hints[hintNumber],
      hintNumber,
      totalHints: riddle.hints.length,
    };
  }

  async getUserStats(userId: string) {
    const cached = await cacheService.get(CACHE_KEYS.USER_STATS(userId));
    if (cached) {
      return cached;
    }

    const stats = await prisma.userStats.findUnique({
      where: { userId },
    });

    if (!stats) {
      throw new AppError(404, 'User stats not found');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        totalRiddlesSolved: true,
        currentStreak: true,
        longestStreak: true,
      },
    });

    const result = {
      ...stats,
      currentStreak: user?.currentStreak || 0,
      longestStreak: user?.longestStreak || 0,
    };

    await cacheService.set(CACHE_KEYS.USER_STATS(userId), result, CACHE_TTL.MEDIUM);

    return result;
  }

  /**
   * Generate an AI-powered dynamic hint for a riddle
   * This supplements static hints with contextual AI-generated hints
   */
  async generateAIHint(userId: string, riddleId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    const riddle = await prisma.riddle.findUnique({
      where: { id: riddleId },
    });

    if (!riddle) {
      throw new AppError(404, 'Riddle not found');
    }

    // Get previous attempts to understand what hints were used
    const attempt = await prisma.riddleAttempt.findFirst({
      where: {
        userId,
        riddleId,
        solved: false,
      },
      orderBy: {
        startedAt: 'desc',
      },
    });

    if (!attempt) {
      throw new AppError(404, 'No active attempt found for this riddle');
    }

    // Check if user can access AI hints (premium feature)
    if (!user.isPremium) {
      throw new AppError(403, 'Upgrade to premium to access AI-powered hints');
    }

    // Use existing hints as context for AI
    const previousHints = riddle.hints.slice(0, attempt.hintsUsed || 0);

    try {
      const aiHint = await aiService.generateHint({
        riddle: riddle.question,
        answer: riddle.answer,
        previousHints,
        difficulty: riddle.difficulty as 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT',
      });

      return {
        hint: aiHint.hint,
        confidence: aiHint.confidence,
        isAIGenerated: true,
      };
    } catch (error) {
      console.error('Error generating AI hint:', error);
      throw new AppError(500, 'Failed to generate AI hint');
    }
  }

  /**
   * Validate answer with AI fuzzy matching
   * Handles spelling variations and synonyms
   */
  async validateAnswerWithAI(riddleId: string, userAnswer: string) {
    const riddle = await prisma.riddle.findUnique({
      where: { id: riddleId },
    });

    if (!riddle) {
      throw new AppError(404, 'Riddle not found');
    }

    try {
      const validation = await aiService.validateAnswer({
        userAnswer,
        correctAnswer: riddle.answer,
      });

      return validation;
    } catch (error) {
      console.error('Error validating answer with AI:', error);
      // Fallback to simple string comparison
      const isCorrect = userAnswer.toLowerCase().trim() === riddle.answer.toLowerCase().trim();
      return {
        isCorrect,
        similarity: isCorrect ? 1.0 : 0.0,
        feedback: isCorrect ? 'Correct!' : 'Incorrect',
      };
    }
  }

  /**
   * Generate a new riddle using AI
   * This creates riddles on-demand rather than from database
   */
  async generateAIRiddle(userId: string, difficulty?: DifficultyLevel, category?: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    // Check daily limit
    const dailyCount = await cacheService.getDailyRiddleCount(userId);
    if (!user.isPremium && dailyCount >= user.riddlesPerDayLimit) {
      throw new AppError(403, 'Daily riddle limit reached. Upgrade to premium for unlimited riddles.');
    }

    try {
      const aiRiddle = await aiService.generateRiddle({
        difficulty: (difficulty || 'MEDIUM') as 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT',
        category,
      });

      // Store AI-generated riddle in database for tracking
      const riddle = await prisma.riddle.create({
        data: {
          id: createId(),
          question: aiRiddle.question,
          answer: aiRiddle.answer,
          difficulty: difficulty || 'MEDIUM',
          category: aiRiddle.category,
          hints: aiRiddle.hints,
          isActive: true,
          aiGenerated: true,
          updatedAt: new Date(),
        },
      });

      // Create attempt
      await prisma.riddleAttempt.create({
        data: {
          id: createId(),
          userId,
          riddleId: riddle.id,
        },
      });

      await cacheService.incrementDailyRiddleCount(userId);

      return {
        id: riddle.id,
        question: riddle.question,
        difficulty: riddle.difficulty,
        category: riddle.category,
        hintsAvailable: riddle.hints.length,
        isAIGenerated: true,
      };
    } catch (error) {
      console.error('Error generating AI riddle:', error);
      throw new AppError(500, 'Failed to generate AI riddle');
    }
  }
}

export const riddleService = new RiddleService();
