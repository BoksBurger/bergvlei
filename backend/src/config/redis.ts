import Redis from 'ioredis';
import { config } from './env';

export const redis = new Redis(config.redis.url, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  reconnectOnError(err) {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      return true;
    }
    return false;
  },
});

redis.on('connect', () => {
  console.log('Redis connected successfully');
});

redis.on('error', (error) => {
  console.error('Redis connection error:', error);
});

export const CACHE_KEYS = {
  USER_PROFILE: (userId: string) => `user:profile:${userId}`,
  USER_STATS: (userId: string) => `user:stats:${userId}`,
  RIDDLE: (riddleId: string) => `riddle:${riddleId}`,
  DAILY_LIMIT: (userId: string, date: string) => `limit:${userId}:${date}`,
  LEADERBOARD: (period: string) => `leaderboard:${period}`,
  AI_HINT: (riddleId: string, hintNumber: number) => `hint:${riddleId}:${hintNumber}`,
};

export const CACHE_TTL = {
  SHORT: 60 * 5,
  MEDIUM: 60 * 30,
  LONG: 60 * 60 * 24,
  WEEK: 60 * 60 * 24 * 7,
};

export const disconnectRedis = async () => {
  try {
    await redis.quit();
    console.log('Redis disconnected');
  } catch (error) {
    console.error('Failed to disconnect from Redis:', error);
  }
};
