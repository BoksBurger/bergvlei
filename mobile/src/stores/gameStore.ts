import { create } from 'zustand';
import { Riddle, RiddleAttempt } from '../types/riddle';
import { api, RiddleResponse, UserStats } from '../services/api';

interface GameState {
  currentRiddle: RiddleResponse | null;
  currentHints: string[];
  riddleAttempts: RiddleAttempt[];
  riddlesSolvedToday: number;
  hintsUsed: number;
  hintsRemaining: number;
  score: number;
  isLoading: boolean;
  error: string | null;
  currentDifficulty: 'EASY' | 'MEDIUM' | 'HARD';
  stats: UserStats | null;
  riddleStartTime: number | null;
  customRiddleMode: boolean;
  savedCustomRiddles: RiddleResponse[];

  // Actions
  fetchNewRiddle: (difficulty?: 'EASY' | 'MEDIUM' | 'HARD') => Promise<boolean>;
  submitAnswer: (answer: string) => Promise<{ correct: boolean; message: string }>;
  requestHint: () => Promise<string | null>;
  fetchStats: () => Promise<void>;
  setCurrentRiddle: (riddle: RiddleResponse | null) => void;
  addHint: (hint: string) => void;
  clearHints: () => void;
  addAttempt: (attempt: RiddleAttempt) => void;
  incrementRiddlesSolved: () => void;
  useHint: () => void;
  addScore: (points: number) => void;
  setLoading: (loading: boolean) => void;
  setDifficulty: (difficulty: 'EASY' | 'MEDIUM' | 'HARD') => void;
  resetDailyProgress: () => void;
  resetCurrentGame: () => void;
  clearError: () => void;
  generateCustomRiddle: (difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT', categoryOrAnswer: string, isCustomAnswer: boolean) => Promise<RiddleResponse | null>;
  saveCustomRiddle: (riddleId: string) => Promise<boolean>;
  playCustomRiddle: (riddle: RiddleResponse) => void;
  loadSavedRiddles: () => Promise<void>;
}

export const useGameStore = create<GameState>((set, get) => ({
  currentRiddle: null,
  currentHints: [],
  riddleAttempts: [],
  riddlesSolvedToday: 0,
  hintsUsed: 0,
  hintsRemaining: 3,
  score: 0,
  isLoading: false,
  error: null,
  currentDifficulty: 'EASY',
  stats: null,
  riddleStartTime: null,
  customRiddleMode: false,
  savedCustomRiddles: [],

  // Fetch a new riddle from backend
  fetchNewRiddle: async (difficulty?: 'EASY' | 'MEDIUM' | 'HARD') => {
    set({ isLoading: true, error: null });

    try {
      const diff = difficulty || get().currentDifficulty;
      const response = await api.getRiddle(diff);

      if (response.success && response.data) {
        set({
          currentRiddle: response.data,
          currentHints: [],
          hintsUsed: 0,
          hintsRemaining: 3,
          riddleStartTime: Date.now(),
          isLoading: false,
          error: null,
        });
        return true;
      } else {
        set({
          error: response.error?.message || 'Failed to fetch riddle',
          isLoading: false,
        });
        return false;
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'An error occurred',
        isLoading: false,
      });
      return false;
    }
  },

  // Submit answer to backend
  submitAnswer: async (answer: string) => {
    const state = get();
    if (!state.currentRiddle || !state.riddleStartTime) {
      return { correct: false, message: 'No active riddle' };
    }

    set({ isLoading: true, error: null });

    try {
      const timeSpent = Math.floor((Date.now() - state.riddleStartTime) / 1000);
      const response = await api.submitAnswer({
        riddleId: state.currentRiddle.id,
        answer,
        timeSpent,
        hintsUsed: state.hintsUsed,
      });

      if (response.success && response.data) {
        const { correct, score, totalScore, riddlesSolved, streak, message } = response.data;

        if (correct) {
          set((state) => ({
            score: totalScore,
            riddlesSolvedToday: riddlesSolved,
            isLoading: false,
          }));
        } else {
          set({ isLoading: false });
        }

        return { correct, message };
      } else {
        set({
          error: response.error?.message || 'Failed to submit answer',
          isLoading: false,
        });
        return { correct: false, message: response.error?.message || 'Failed to submit answer' };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      set({
        error: errorMessage,
        isLoading: false,
      });
      return { correct: false, message: errorMessage };
    }
  },

  // Request a hint from backend
  requestHint: async () => {
    const state = get();
    if (!state.currentRiddle) {
      return null;
    }

    set({ isLoading: true, error: null });

    try {
      const response = await api.getHint(state.currentRiddle.id);

      if (response.success && response.data) {
        const { hint, hintsRemaining } = response.data;

        set((state) => ({
          currentHints: [...state.currentHints, hint],
          hintsUsed: state.hintsUsed + 1,
          hintsRemaining,
          isLoading: false,
        }));

        return hint;
      } else {
        set({
          error: response.error?.message || 'Failed to get hint',
          isLoading: false,
        });
        return null;
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'An error occurred',
        isLoading: false,
      });
      return null;
    }
  },

  // Fetch user stats
  fetchStats: async () => {
    try {
      const response = await api.getStats();

      if (response.success && response.data) {
        set({ stats: response.data });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  },

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
    riddleStartTime: null,
    customRiddleMode: false,
  }),

  clearError: () => set({ error: null }),

  // Generate custom AI riddle
  generateCustomRiddle: async (difficulty, categoryOrAnswer, isCustomAnswer) => {
    set({ isLoading: true, error: null });

    try {
      const response = isCustomAnswer
        ? await api.generateAIRiddle(difficulty, undefined, categoryOrAnswer)
        : await api.generateAIRiddle(difficulty, categoryOrAnswer);

      if (response.success && response.data) {
        set({ isLoading: false });
        return response.data;
      } else {
        set({
          error: response.error?.message || 'Failed to generate riddle',
          isLoading: false
        });
        return null;
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'An error occurred',
        isLoading: false,
      });
      return null;
    }
  },

  // Save custom riddle for later
  saveCustomRiddle: async (riddleId) => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.saveCustomRiddle(riddleId);

      if (response.success) {
        set({ isLoading: false });
        // Reload saved riddles
        await get().loadSavedRiddles();
        return true;
      } else {
        set({
          error: response.error?.message || 'Failed to save riddle',
          isLoading: false
        });
        return false;
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'An error occurred',
        isLoading: false,
      });
      return false;
    }
  },

  // Play a custom riddle immediately
  playCustomRiddle: (riddle) => {
    set({
      currentRiddle: riddle,
      currentHints: [],
      hintsUsed: 0,
      hintsRemaining: 3,
      riddleStartTime: Date.now(),
      customRiddleMode: true,
      error: null,
    });
  },

  // Load user's saved riddles
  loadSavedRiddles: async () => {
    try {
      const response = await api.getSavedRiddles();

      if (response.success && response.data) {
        set({ savedCustomRiddles: response.data.savedRiddles });
      }
    } catch (error) {
      console.error('Error loading saved riddles:', error);
    }
  },
}));
