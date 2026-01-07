import { create } from 'zustand';
import { api, AuthResponse } from '../services/api';
import { purchasesService } from '../services/purchases';

interface AuthState {
  user: AuthResponse['user'] | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, username?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.login(email, password);

      if (response.success && response.data) {
        set({
          user: response.data.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        // Initialize RevenueCat with user ID
        try {
          await purchasesService.identifyUser(response.data.user.id);
        } catch (error) {
          console.error('Failed to identify user in RevenueCat:', error);
        }

        return true;
      } else {
        set({
          error: response.error?.message || 'Login failed',
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

  register: async (email: string, password: string, username?: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.register(email, password, username);

      if (response.success && response.data) {
        set({
          user: response.data.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        // Initialize RevenueCat with user ID
        try {
          await purchasesService.identifyUser(response.data.user.id);
        } catch (error) {
          console.error('Failed to identify user in RevenueCat:', error);
        }

        return true;
      } else {
        set({
          error: response.error?.message || 'Registration failed',
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

  logout: async () => {
    await api.logout();

    // Logout from RevenueCat
    try {
      await purchasesService.logoutUser();
    } catch (error) {
      console.error('Failed to logout from RevenueCat:', error);
    }

    set({
      user: null,
      isAuthenticated: false,
      error: null,
    });
  },

  loadUser: async () => {
    // Check if we have a token
    const token = api.getToken();
    if (!token) {
      set({ isAuthenticated: false, user: null });
      return;
    }

    set({ isLoading: true });

    try {
      const response = await api.getProfile();

      if (response.success && response.data) {
        set({
          user: response.data,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        // Token might be invalid
        await api.logout();
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  refreshUser: async () => {
    try {
      const response = await api.getProfile();

      if (response.success && response.data) {
        set({
          user: response.data,
        });
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  },

  clearError: () => set({ error: null }),
}));
