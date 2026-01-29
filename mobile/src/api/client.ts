/**
 * API Client - Centralized HTTP communication layer.
 * 
 * 🎓 INTERVIEW CONCEPT: Separation of Concerns
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Why a dedicated API client?
 * 1. Single place for base URL, headers, interceptors
 * 2. Automatic token refresh handling
 * 3. Consistent error handling across the app
 * 4. Easy to mock in tests
 * 
 * This follows the Repository Pattern - abstracting data access.
 */

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';

import { AuthTokens } from '@/types';

// Base URL for API
// In production, use environment variables
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Token storage keys
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

/**
 * Create configured Axios instance.
 * 
 * 🎓 INTERVIEW: Axios interceptors are middleware for HTTP requests.
 * They run BEFORE every request and AFTER every response.
 */
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000, // 10 second timeout
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor - attach auth token
  client.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor - handle token refresh
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
      
      // If 401 and we haven't retried yet, try to refresh token
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        
        try {
          const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
          if (refreshToken) {
            // Attempt token refresh
            const response = await axios.post<AuthTokens>(
              `${API_BASE_URL}/auth/refresh`,
              { refresh_token: refreshToken }
            );
            
            // Store new tokens
            await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, response.data.access_token);
            await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, response.data.refresh_token);
            
            // Retry original request with new token
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${response.data.access_token}`;
            }
            return client(originalRequest);
          }
        } catch (refreshError) {
          // Refresh failed - clear tokens and redirect to login
          await clearTokens();
          // The auth store will handle redirect
        }
      }
      
      return Promise.reject(error);
    }
  );

  return client;
};

// Singleton instance
export const apiClient = createApiClient();

// ============================================================
// Token Management
// ============================================================

export const storeTokens = async (tokens: AuthTokens): Promise<void> => {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.access_token);
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refresh_token);
};

export const clearTokens = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
};

export const getAccessToken = async (): Promise<string | null> => {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
};

export const hasStoredTokens = async (): Promise<boolean> => {
  const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  return token !== null;
};
