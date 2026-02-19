/**
 * Centralized HTTP client with token management and automatic refresh.
 */

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';

import { AuthTokens } from '@/types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Attach auth token before every request
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

  // On 401, attempt a token refresh then retry the original request
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
          if (refreshToken) {
            const response = await axios.post<AuthTokens>(
              `${API_BASE_URL}/auth/refresh`,
              { refresh_token: refreshToken }
            );

            await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, response.data.access_token);
            await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, response.data.refresh_token);

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
