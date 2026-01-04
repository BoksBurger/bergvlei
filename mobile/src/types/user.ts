export interface User {
  id: string;
  email: string;
  displayName?: string;
  isPremium: boolean;
  subscriptionEndDate?: Date;
  createdAt: Date;
}

export interface UserProgress {
  userId: string;
  totalRiddlesSolved: number;
  currentStreak: number;
  longestStreak: number;
  riddlesPerDifficulty: {
    easy: number;
    medium: number;
    hard: number;
  };
  lastRiddleDate?: Date;
}

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  score: number;
  rank: number;
}
