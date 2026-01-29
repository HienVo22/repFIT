/**
 * Authentication Store using Zustand.
 * 
 * 🎓 INTERVIEW CONCEPT: Global State Management
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * When to use global state (Zustand) vs server state (TanStack Query)?
 * 
 * Global State (Zustand):
 * - Authentication status (logged in/out)
 * - User preferences (theme, language)
 * - Active workout session (needs to persist across screens)
 * - UI state (modals, sidebar open)
 * 
 * Server State (TanStack Query):
 * - Data fetched from API (routines, exercises)
 * - Cached responses
 * - Loading/error states for API calls
 * 
 * 🎓 Why Zustand over Redux?
 * - Less boilerplate (no action creators, reducers)
 * - No Provider wrapper needed
 * - Built-in TypeScript support
 * - Simpler async actions
 */

import { create } from 'zustand';
import { User } from '@/types';
import { getCurrentUser, logout as logoutApi } from '@/api/auth';
import { hasStoredTokens, clearTokens } from '@/api/client';

interface AuthState {
  // State
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Actions
  initialize: () => Promise<void>;
  setUser: (user: User) => void;
  logout: () => Promise<void>;
}

/**
 * Zustand store with typed state and actions.
 * 
 * 🎓 INTERVIEW: Zustand uses immer under the hood (optionally),
 * allowing you to "mutate" state directly. The mutations are
 * converted to immutable updates.
 */
export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state
  user: null,
  isLoading: true,
  isAuthenticated: false,
  
  /**
   * Initialize auth state on app start.
   * Checks for stored tokens and fetches user profile.
   */
  initialize: async () => {
    set({ isLoading: true });
    
    try {
      const hasTokens = await hasStoredTokens();
      
      if (hasTokens) {
        // Try to fetch user profile with stored token
        const user = await getCurrentUser();
        set({ user, isAuthenticated: true, isLoading: false });
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch (error) {
      // Token invalid or expired - clear and go to login
      await clearTokens();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
  
  /**
   * Set user after successful login.
   */
  setUser: (user: User) => {
    set({ user, isAuthenticated: true });
  },
  
  /**
   * Logout and clear all auth state.
   */
  logout: async () => {
    await logoutApi();
    set({ user: null, isAuthenticated: false });
  },
}));
