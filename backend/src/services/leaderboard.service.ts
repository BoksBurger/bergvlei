import { redis, CACHE_KEYS, CACHE_TTL } from '../config/redis';
import { prisma } from '../config/database';

export interface LeaderboardEntry {
  userId: string;
  username: string;
  score: number;
  riddlesSolved: number;
  averageTime?: number;
  rank: number;
}

export class LeaderboardService {
  async addScore(
    userId: string,
    username: string,
    score: number,
    period: 'daily' | 'weekly' | 'monthly' | 'alltime' = 'daily'
  ): Promise<void> {
    try {
      const key = CACHE_KEYS.LEADERBOARD(period);
      await redis.zadd(key, score, `${userId}:${username}`);

      if (period === 'daily') {
        await redis.expire(key, CACHE_TTL.LONG);
      } else if (period === 'weekly') {
        await redis.expire(key, CACHE_TTL.WEEK);
      }
    } catch (error) {
      console.error('Leaderboard add score error:', error);
    }
  }

  async getTopPlayers(
    period: 'daily' | 'weekly' | 'monthly' | 'alltime' = 'daily',
    limit: number = 100
  ): Promise<LeaderboardEntry[]> {
    try {
      const key = CACHE_KEYS.LEADERBOARD(period);
      const results = await redis.zrevrange(key, 0, limit - 1, 'WITHSCORES');

      const leaderboard: LeaderboardEntry[] = [];
      for (let i = 0; i < results.length; i += 2) {
        const [userId, username] = results[i].split(':');
        const score = parseInt(results[i + 1], 10);

        leaderboard.push({
          userId,
          username,
          score,
          riddlesSolved: score,
          rank: Math.floor(i / 2) + 1,
        });
      }

      return leaderboard;
    } catch (error) {
      console.error('Leaderboard get top players error:', error);
      return [];
    }
  }

  async getUserRank(
    userId: string,
    period: 'daily' | 'weekly' | 'monthly' | 'alltime' = 'daily'
  ): Promise<number | null> {
    try {
      const key = CACHE_KEYS.LEADERBOARD(period);
      const members = await redis.zrevrange(key, 0, -1);

      const rank = members.findIndex((member) => member.startsWith(`${userId}:`));
      return rank >= 0 ? rank + 1 : null;
    } catch (error) {
      console.error('Leaderboard get user rank error:', error);
      return null;
    }
  }

  async syncLeaderboardToDatabase(period: string): Promise<void> {
    try {
      const leaderboard = await this.getTopPlayers(period as any, 1000);

      await prisma.$transaction(
        leaderboard.map((entry) =>
          prisma.leaderboard.upsert({
            where: {
              userId_period: {
                userId: entry.userId,
                period,
              },
            },
            update: {
              score: entry.score,
              riddlesSolved: entry.riddlesSolved,
              rank: entry.rank,
              updatedAt: new Date(),
            },
            create: {
              userId: entry.userId,
              username: entry.username,
              period,
              score: entry.score,
              riddlesSolved: entry.riddlesSolved,
              rank: entry.rank,
            },
          })
        )
      );

      console.log(`Leaderboard synced to database: ${period}`);
    } catch (error) {
      console.error('Leaderboard sync error:', error);
    }
  }
}

export const leaderboardService = new LeaderboardService();
