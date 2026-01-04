export interface Riddle {
  id: string;
  question: string;
  answer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category?: string;
  hints: string[];
  createdAt: Date;
}

export interface RiddleAttempt {
  riddleId: string;
  userAnswer: string;
  isCorrect: boolean;
  hintsUsed: number;
  timeSpent: number;
  attemptedAt: Date;
}

export interface DailyChallenge {
  id: string;
  riddle: Riddle;
  date: string;
  completed: boolean;
}
