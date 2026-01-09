import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { createId } from '@paralleldrive/cuid2';
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

    const userId = createId();
    const user = await prisma.user.create({
      data: {
        id: userId,
        email,
        password: hashedPassword,
        username,
        updatedAt: new Date(),
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
        id: createId(),
        userId: user.id,
        updatedAt: new Date(),
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
      expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'],
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

  async requestPasswordReset(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Return success even if user doesn't exist to prevent email enumeration
      return { message: 'If an account with that email exists, a password reset link has been sent.' };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // Token expires in 1 hour
    const resetExpires = new Date(Date.now() + 3600000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: resetExpires,
        updatedAt: new Date(),
      },
    });

    // In production, send email with reset link containing the unhashed token
    // For now, return the token (in production, this should be sent via email)
    console.log(`Password reset token for ${email}: ${resetToken}`);
    
    // TODO: Integrate with email service to send reset link
    // const resetUrl = `${config.frontendUrl}/reset-password?token=${resetToken}`;
    // await emailService.sendPasswordResetEmail(email, resetUrl);

    return { message: 'If an account with that email exists, a password reset link has been sent.' };
  }

  async resetPassword(token: string, newPassword: string) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new AppError(400, 'Invalid or expired password reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        updatedAt: new Date(),
      },
    });

    // Clear user cache
    await cacheService.delete(CACHE_KEYS.USER_PROFILE(user.id));

    return { message: 'Password has been reset successfully' };
  }
}

export const authService = new AuthService();
