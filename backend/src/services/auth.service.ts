import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { config } from '../config/env';
import { AppError } from '../middleware/errorHandler';
import { cacheService } from './cache.service';
import { CACHE_KEYS, CACHE_TTL } from '../config/redis';

export interface JwtPayload {
  userId: string;
  email: string;
  isPremium: boolean;
}

export class AuthService {
  async register(email: string, password: string, username?: string) {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new AppError(400, 'User already exists');
    }

    if (username) {
      const existingUsername = await prisma.user.findUnique({
        where: { username },
      });
      if (existingUsername) {
        throw new AppError(400, 'Username already taken');
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        username,
      },
      select: {
        id: true,
        email: true,
        username: true,
        subscriptionTier: true,
        isPremium: true,
        createdAt: true,
      },
    });

    await prisma.userStats.create({
      data: {
        userId: user.id,
      },
    });

    const token = this.generateToken({
      userId: user.id,
      email: user.email,
      isPremium: user.isPremium,
    });

    return { user, token };
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AppError(401, 'Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new AppError(401, 'Invalid credentials');
    }

    const token = this.generateToken({
      userId: user.id,
      email: user.email,
      isPremium: user.isPremium,
    });

    await cacheService.set(
      CACHE_KEYS.USER_PROFILE(user.id),
      {
        id: user.id,
        email: user.email,
        username: user.username,
        subscriptionTier: user.subscriptionTier,
        isPremium: user.isPremium,
      },
      CACHE_TTL.LONG
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        subscriptionTier: user.subscriptionTier,
        isPremium: user.isPremium,
      },
      token,
    };
  }

  generateToken(payload: JwtPayload): string {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });
  }

  verifyToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, config.jwt.secret) as JwtPayload;
    } catch (error) {
      throw new AppError(401, 'Invalid or expired token');
    }
  }

  async getUserById(userId: string) {
    const cached = await cacheService.get(CACHE_KEYS.USER_PROFILE(userId));
    if (cached) {
      return cached;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        subscriptionTier: true,
        isPremium: true,
        riddlesPerDayLimit: true,
        riddlesTodayCount: true,
        totalRiddlesSolved: true,
        currentStreak: true,
        longestStreak: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    await cacheService.set(CACHE_KEYS.USER_PROFILE(userId), user, CACHE_TTL.LONG);

    return user;
  }
}

export const authService = new AuthService();
