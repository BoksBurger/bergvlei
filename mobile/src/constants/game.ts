// Game configuration constants

// Freemium limits
export const FREE_DAILY_RIDDLE_LIMIT = 5;

// Pricing
export const PREMIUM_MONTHLY_PRICE = 4.99;
export const HINT_PACK_PRICE = 0.99;
export const HINTS_PER_PACK = 10;

// Ad configuration
export const AD_FREQUENCY = 3; // Show ad every N riddles for free users

// Scoring
export const POINTS_PER_RIDDLE = {
  easy: 10,
  medium: 25,
  hard: 50,
} as const;

export const HINT_PENALTY = 5; // Points deducted per hint used

// Streaks
export const STREAK_BONUS_MULTIPLIER = 1.1;

// Daily challenge
export const DAILY_CHALLENGE_BONUS = 50;
