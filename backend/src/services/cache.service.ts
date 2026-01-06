import { redis, CACHE_KEYS, CACHE_TTL } from '../config/redis';

export class CacheService {
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttl: number = CACHE_TTL.MEDIUM): Promise<void> {
    try {
      await redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  async deletePattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error('Cache delete pattern error:', error);
    }
  }

  async increment(key: string, ttl?: number): Promise<number> {
    try {
      const value = await redis.incr(key);
      if (ttl && value === 1) {
        await redis.expire(key, ttl);
      }
      return value;
    } catch (error) {
      console.error('Cache increment error:', error);
      return 0;
    }
  }

  async getDailyRiddleCount(userId: string): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    const key = CACHE_KEYS.DAILY_LIMIT(userId, today);
    const count = await redis.get(key);
    return count ? parseInt(count, 10) : 0;
  }

  async incrementDailyRiddleCount(userId: string): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    const key = CACHE_KEYS.DAILY_LIMIT(userId, today);
    const count = await this.increment(key, CACHE_TTL.LONG);
    return count;
  }

  async resetDailyRiddleCount(userId: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const key = CACHE_KEYS.DAILY_LIMIT(userId, today);
    await this.delete(key);
  }
}

export const cacheService = new CacheService();
