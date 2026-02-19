/**
 * Workout session API functions.
 */

import { apiClient } from './client';
import { WorkoutSessionCreate, WorkoutSession, AIWorkoutSummary } from '@/types';

export const saveWorkoutSession = async (data: WorkoutSessionCreate): Promise<WorkoutSession> => {
  const response = await apiClient.post<WorkoutSession>('/workouts/', data);
  return response.data;
};

export const getWorkoutSessions = async (date?: string): Promise<any[]> => {
  const params = date ? { date } : {};
  const response = await apiClient.get('/workouts/', { params });
  return response.data;
};

export const getWorkoutSession = async (id: number): Promise<WorkoutSession> => {
  const response = await apiClient.get<WorkoutSession>(`/workouts/${id}`);
  return response.data;
};

export const getWorkoutSummary = async (workoutData: {
  routine_name: string;
  duration_seconds: number;
  completed_sets: object[];
}): Promise<AIWorkoutSummary> => {
  const response = await apiClient.post<AIWorkoutSummary>('/workouts/summary', workoutData);
  return response.data;
};
