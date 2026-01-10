import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
const API_URL = Constants.expoConfig?.extra?.API_URL || 'http://192.168.8.109:3001/api';//'http://localhost:3001/api';
const TOKEN_KEY = '@bergvlei_token';

// Type definitions matching backend
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    username: string | null;
    subscriptionTier: 'FREE' | 'PREMIUM';
    isPremium: boolean;
    createdAt: string;
  };
  token: string;
}

export interface RiddleResponse {
  id: string;
  question: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  category: string | null;
  hints: string[];
}

export interface SubmitAnswerRequest {
  riddleId: string;
  answer: string;
  timeSpent: number;
  hintsUsed: number;
}

export interface SubmitAnswerResponse {
  correct: boolean;
  score: number;
  totalScore: number;
  riddlesSolved: number;
  streak: number;
  message: string;
}

export interface UserStats {
  totalRiddlesSolved: number;
  totalAttempts: number;
  totalHintsUsed: number;
  totalTimeSpent: number;
  easyRiddlesSolved: number;
  mediumRiddlesSolved: number;
  hardRiddlesSolved: number;
  expertRiddlesSolved: number;
  averageTime: number | null;
  accuracy: number | null;
  currentStreak: number;
  longestStreak: number;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  score: number;
  riddlesSolved: number;
  averageTime: number | null;
  rank: number | null;
}

// API Client Class
class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.loadToken();
  }

  private async loadToken() {
    try {
      this.token = await AsyncStorage.getItem(TOKEN_KEY);
    } catch (error) {
      console.error('Error loading token:', error);
    }
  }

  async setToken(token: string) {
    this.token = token;
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } catch (error) {
      console.error('Error saving token:', error);
    }
  }

  async clearToken() {
    this.token = null;
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
    } catch (error) {
      console.error('Error clearing token:', error);
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    // Add auth token if available
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || { message: 'An error occurred' },
        };
      }

      return data;
    } catch (error) {
      console.error('API request error:', error);
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Network error',
        },
      };
    }
  }

  // Auth endpoints
  async register(email: string, password: string, username?: string): Promise<ApiResponse<AuthResponse>> {
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, username }),
    });

    if (response.success && response.data) {
      await this.setToken(response.data.token);
    }

    return response;
  }

  async login(email: string, password: string): Promise<ApiResponse<AuthResponse>> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.success && response.data) {
      await this.setToken(response.data.token);
    }

    return response;
  }

  async getProfile(): Promise<ApiResponse<AuthResponse['user']>> {
    return this.request<AuthResponse['user']>('/auth/profile');
  }

  async logout() {
    await this.clearToken();
  }

  // Riddle endpoints
  async getRiddle(difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT'): Promise<ApiResponse<RiddleResponse>> {
    const params = difficulty ? `?difficulty=${difficulty}` : '';
    return this.request<RiddleResponse>(`/riddles${params}`);
  }

  async submitAnswer(data: SubmitAnswerRequest): Promise<ApiResponse<SubmitAnswerResponse>> {
    return this.request<SubmitAnswerResponse>('/riddles/submit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getHint(riddleId: string): Promise<ApiResponse<{ hint: string; hintsRemaining: number }>> {
    return this.request<{ hint: string; hintsRemaining: number }>(`/riddles/${riddleId}/hint`);
  }

  async getStats(): Promise<ApiResponse<UserStats>> {
    return this.request<UserStats>('/riddles/stats');
  }

  // AI-powered endpoints
  async getAIHint(riddleId: string): Promise<ApiResponse<{ hint: string; confidence: number; isAIGenerated: boolean }>> {
    return this.request<{ hint: string; confidence: number; isAIGenerated: boolean }>(`/riddles/${riddleId}/ai-hint`);
  }

  async validateAnswerWithAI(riddleId: string, answer: string): Promise<ApiResponse<{ isCorrect: boolean; similarity: number; feedback?: string }>> {
    return this.request<{ isCorrect: boolean; similarity: number; feedback?: string }>('/riddles/validate-ai', {
      method: 'POST',
      body: JSON.stringify({ riddleId, answer }),
    });
  }

  async generateAIRiddle(difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT', category?: string, customAnswer?: string): Promise<ApiResponse<RiddleResponse>> {
    const params = new URLSearchParams();
    if (difficulty) params.append('difficulty', difficulty);
    if (category) params.append('category', category);
    if (customAnswer) params.append('customAnswer', customAnswer);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return this.request<RiddleResponse>(`/riddles/generate-ai${queryString}`);
  }

  async saveCustomRiddle(riddleId: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>('/riddles/save-custom', {
      method: 'POST',
      body: JSON.stringify({ riddleId }),
    });
  }

  async getSavedRiddles(): Promise<ApiResponse<{ savedRiddles: RiddleResponse[] }>> {
    return this.request<{ savedRiddles: RiddleResponse[] }>('/riddles/saved-riddles');
  }

  // Leaderboard endpoints
  async getLeaderboard(period: 'daily' | 'weekly' | 'monthly' | 'all-time' = 'all-time'): Promise<ApiResponse<{ leaderboard: LeaderboardEntry[] }>> {
    return this.request<{ leaderboard: LeaderboardEntry[] }>(`/leaderboard?period=${period}`);
  }

  async getUserRank(): Promise<ApiResponse<{ rank: number; score: number }>> {
    return this.request<{ rank: number; score: number }>('/leaderboard/rank');
  }

  // Subscription endpoints (RevenueCat)
  async getSubscriptionStatus(): Promise<ApiResponse<{
    isPremium: boolean;
    tier: 'FREE' | 'PREMIUM';
    riddlesPerDayLimit: number;
    hasActiveEntitlements: boolean;
    subscription: any;
  }>> {
    return this.request<{
      isPremium: boolean;
      tier: 'FREE' | 'PREMIUM';
      riddlesPerDayLimit: number;
      hasActiveEntitlements: boolean;
      subscription: any;
    }>('/subscription/status');
  }

  async syncSubscription(): Promise<ApiResponse<{
    isPremium: boolean;
    tier: 'FREE' | 'PREMIUM';
    riddlesPerDayLimit: number;
    hasActiveEntitlements: boolean;
  }>> {
    return this.request<{
      isPremium: boolean;
      tier: 'FREE' | 'PREMIUM';
      riddlesPerDayLimit: number;
      hasActiveEntitlements: boolean;
    }>('/subscription/sync', {
      method: 'POST',
    });
  }

  async getOfferings(): Promise<ApiResponse<{
    message: string;
    products: any;
  }>> {
    return this.request<{
      message: string;
      products: any;
    }>('/subscription/offerings');
  }
}

// Export singleton instance
export const api = new ApiClient(API_URL);
