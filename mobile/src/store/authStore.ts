/**
 * Global auth state (Zustand).
 */

import { create } from 'zustand';
import { User } from '@/types';
import { getCurrentUser, logout as logoutApi } from '@/api/auth';
import { hasStoredTokens, clearTokens } from '@/api/client';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  initialize: () => Promise<void>;
  setUser: (user: User) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  initialize: async () => {
    set({ isLoading: true });

    try {
      const hasTokens = await hasStoredTokens();

      if (hasTokens) {
        const user = await getCurrentUser();
        set({ user, isAuthenticated: true, isLoading: false });
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  setUser: (user: User) => {
    set({ user, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    await clearTokens();
    set({ user: null, isAuthenticated: false });
  },
}));
