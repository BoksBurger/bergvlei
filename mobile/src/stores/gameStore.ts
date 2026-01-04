import { create } from 'zustand';
import { Riddle, RiddleAttempt } from '../types/riddle';

interface GameState {
  currentRiddle: Riddle | null;
  riddleAttempts: RiddleAttempt[];
  riddlesSolvedToday: number;
  hintsUsed: number;
  score: number;

  // Actions
  setCurrentRiddle: (riddle: Riddle) => void;
  addAttempt: (attempt: RiddleAttempt) => void;
  incrementRiddlesSolved: () => void;
  useHint: () => void;
  addScore: (points: number) => void;
  resetDailyProgress: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  currentRiddle: null,
  riddleAttempts: [],
  riddlesSolvedToday: 0,
  hintsUsed: 0,
  score: 0,

  setCurrentRiddle: (riddle) => set({ currentRiddle: riddle }),

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

  resetDailyProgress: () => set({
    riddlesSolvedToday: 0,
    hintsUsed: 0,
  }),
}));
