/**
 * Authentication API functions.
 * 
 * 🎓 INTERVIEW: These are "service" functions that abstract API calls.
 * The UI components don't need to know about HTTP methods or endpoints.
 */

import { apiClient, storeTokens, clearTokens } from './client';
import { AuthTokens, LoginCredentials, User, UserCreate } from '@/types';

/**
 * Register a new user account.
 */
export const register = async (data: UserCreate): Promise<User> => {
  const response = await apiClient.post<User>('/auth/register', data);
  return response.data;
};

/**
 * Login with email and password.
 * 
 * 🎓 INTERVIEW: Note we use URLSearchParams for OAuth2 password flow.
 * The standard requires application/x-www-form-urlencoded format.
 */
export const login = async (credentials: LoginCredentials): Promise<AuthTokens> => {
  // OAuth2 password flow requires form data, not JSON
  const formData = new URLSearchParams();
  formData.append('username', credentials.email); // OAuth2 uses 'username' field
  formData.append('password', credentials.password);
  
  const response = await apiClient.post<AuthTokens>('/auth/login', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  
  // Store tokens securely
  await storeTokens(response.data);
  
  return response.data;
};

/**
 * Logout - clear stored tokens.
 * 
 * 🎓 INTERVIEW: With stateless JWT, "logout" is client-side only.
 * The token is still valid until it expires.
 * 
 * For true token invalidation, you'd need:
 * - Token blacklist (requires server-side storage)
 * - Short token expiry + refresh token rotation
 */
export const logout = async (): Promise<void> => {
  await clearTokens();
};

/**
 * Get current user profile.
 */
export const getCurrentUser = async (): Promise<User> => {
  const response = await apiClient.get<User>('/users/me');
  return response.data;
};
