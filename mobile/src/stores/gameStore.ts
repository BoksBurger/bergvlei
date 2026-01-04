import { create } from 'zustand';
import { Riddle, RiddleAttempt } from '../types/riddle';

interface GameState {
  currentRiddle: Riddle | null;
  currentHints: string[];
  riddleAttempts: RiddleAttempt[];
  riddlesSolvedToday: number;
  hintsUsed: number;
  score: number;
  isLoading: boolean;
  currentDifficulty: 'easy' | 'medium' | 'hard';

  // Actions
  setCurrentRiddle: (riddle: Riddle) => void;
  addHint: (hint: string) => void;
  clearHints: () => void;
  addAttempt: (attempt: RiddleAttempt) => void;
  incrementRiddlesSolved: () => void;
  useHint: () => void;
  addScore: (points: number) => void;
  setLoading: (loading: boolean) => void;
  setDifficulty: (difficulty: 'easy' | 'medium' | 'hard') => void;
  resetDailyProgress: () => void;
  resetCurrentGame: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  currentRiddle: null,
  currentHints: [],
  riddleAttempts: [],
  riddlesSolvedToday: 0,
  hintsUsed: 0,
  score: 0,
  isLoading: false,
  currentDifficulty: 'easy',

  setCurrentRiddle: (riddle) => set({ currentRiddle: riddle }),

  addHint: (hint) => set((state) => ({
    currentHints: [...state.currentHints, hint],
  })),

  clearHints: () => set({ currentHints: [] }),

  addAttempt: (attempt) => set((state) => ({
    riddleAttempts: [...state.riddleAttempts, attempt],
  })),

  incrementRiddlesSolved: () => set((state) => ({
    riddlesSolvedToday: state.riddlesSolvedToday + 1,
  })),

  useHint: () => set((state) => ({
    hintsUsed: state.hintsUsed + 1,
  })),

  addScore: (points) => set((state) => ({
    score: state.score + points,
  })),

  setLoading: (loading) => set({ isLoading: loading }),

  setDifficulty: (difficulty) => set({ currentDifficulty: difficulty }),

  resetDailyProgress: () => set({
    riddlesSolvedToday: 0,
    hintsUsed: 0,
  }),

  resetCurrentGame: () => set({
    currentRiddle: null,
    currentHints: [],
    hintsUsed: 0,
  }),
}));
