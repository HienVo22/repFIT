/**
 * Authentication API functions.
 */

import { apiClient, storeTokens, clearTokens } from './client';
import { AuthTokens, LoginCredentials, User, UserCreate } from '@/types';

export const register = async (data: UserCreate): Promise<User> => {
  const response = await apiClient.post<User>('/auth/register', data);
  return response.data;
};

export const login = async (credentials: LoginCredentials): Promise<AuthTokens> => {
  // OAuth2 password flow requires form-urlencoded
  const formData = new URLSearchParams();
  formData.append('username', credentials.email);
  formData.append('password', credentials.password);

  const response = await apiClient.post<AuthTokens>('/auth/login', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  await storeTokens(response.data);

  return response.data;
};

export const logout = async (): Promise<void> => {
  await clearTokens();
};

export const getCurrentUser = async (): Promise<User> => {
  const response = await apiClient.get<User>('/users/me');
  return response.data;
};
