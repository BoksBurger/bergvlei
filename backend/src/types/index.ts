import { Request } from 'express';

export interface AuthRequest extends Request {
  userId?: string;
  user?: {
    id: string;
    email: string;
    isPremium: boolean;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

export enum SubscriptionTier {
  FREE = 'FREE',
  PREMIUM = 'PREMIUM',
}

export enum DifficultyLevel {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
  EXPERT = 'EXPERT',
}

export interface RiddleData {
  id: string;
  question: string;
  answer: string;
  difficulty: DifficultyLevel;
  category?: string;
  hints: string[];
  aiGenerated: boolean;
}

export interface UserStats {
  totalRiddlesSolved: number;
  streak: number;
  longestStreak: number;
  averageTime: number;
  accuracy: number;
}
