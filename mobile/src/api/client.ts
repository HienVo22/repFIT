/**
 * Centralized HTTP client with token management and automatic refresh.
 */

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

import { AuthTokens } from '@/types';

function resolveApiUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  if (Platform.OS === 'web') {
    return 'http://localhost:8000/api/v1';
  }

  const debuggerHost =
    Constants.expoConfig?.hostUri ?? Constants.manifest2?.extra?.expoGo?.debuggerHost;
  if (debuggerHost) {
    const host = debuggerHost.split(':')[0];
    return `http://${host}:8000/api/v1`;
  }

  return 'http://localhost:8000/api/v1';
}

const API_BASE_URL = resolveApiUrl();
// #region agent log
console.log('[DEBUG-e83d22] API_BASE_URL resolved to:', API_BASE_URL);
// #endregion

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

// SecureStore doesn't work on web -- fall back to localStorage
const storage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  deleteItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Attach auth token before every request
  client.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      const token = await storage.getItem(ACCESS_TOKEN_KEY);
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // On 401, attempt a token refresh then retry the original request
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const refreshToken = await storage.getItem(REFRESH_TOKEN_KEY);
          if (refreshToken) {
            const response = await axios.post<AuthTokens>(
              `${API_BASE_URL}/auth/refresh`,
              { refresh_token: refreshToken }
            );

            await storage.setItem(ACCESS_TOKEN_KEY, response.data.access_token);
            await storage.setItem(REFRESH_TOKEN_KEY, response.data.refresh_token);

            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${response.data.access_token}`;
            }
            return client(originalRequest);
          }
        } catch (refreshError) {
          await clearTokens();
        }
      }

      return Promise.reject(error);
    }
  );

  return client;
};

export const apiClient = createApiClient();

export const storeTokens = async (tokens: AuthTokens): Promise<void> => {
  await storage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
  await storage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
};

export const clearTokens = async (): Promise<void> => {
  await storage.deleteItem(ACCESS_TOKEN_KEY);
  await storage.deleteItem(REFRESH_TOKEN_KEY);
};

export const getAccessToken = async (): Promise<string | null> => {
  return storage.getItem(ACCESS_TOKEN_KEY);
};

export const hasStoredTokens = async (): Promise<boolean> => {
  const token = await storage.getItem(ACCESS_TOKEN_KEY);
  return token !== null;
};
