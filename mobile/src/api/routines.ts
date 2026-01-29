/**
 * Routines API functions.
 */

import { apiClient } from './client';
import { 
  Routine, 
  RoutineCreate, 
  RoutineListItem, 
  DayOfWeek,
  RoutineExercise,
  RoutineExerciseCreate,
} from '@/types';

/**
 * Get all routines for the current user.
 */
export const getRoutines = async (dayOfWeek?: DayOfWeek): Promise<RoutineListItem[]> => {
  const params = dayOfWeek ? { day_of_week: dayOfWeek } : {};
  const response = await apiClient.get<RoutineListItem[]>('/routines', { params });
  return response.data;
};

/**
 * Get a single routine with all exercises.
 */
export const getRoutine = async (id: number): Promise<Routine> => {
  const response = await apiClient.get<Routine>(`/routines/${id}`);
  return response.data;
};

/**
 * Create a new routine.
 */
export const createRoutine = async (data: RoutineCreate): Promise<Routine> => {
  const response = await apiClient.post<Routine>('/routines', data);
  return response.data;
};

/**
 * Update a routine.
 */
export const updateRoutine = async (
  id: number, 
  data: Partial<RoutineCreate>
): Promise<Routine> => {
  const response = await apiClient.patch<Routine>(`/routines/${id}`, data);
  return response.data;
};

/**
 * Delete a routine.
 */
export const deleteRoutine = async (id: number): Promise<void> => {
  await apiClient.delete(`/routines/${id}`);
};

/**
 * Add an exercise to a routine.
 */
export const addExercise = async (
  routineId: number,
  data: RoutineExerciseCreate
): Promise<RoutineExercise> => {
  const response = await apiClient.post<RoutineExercise>(
    `/routines/${routineId}/exercises`,
    data
  );
  return response.data;
};

/**
 * Update an exercise.
 */
export const updateExercise = async (
  routineId: number,
  exerciseId: number,
  data: Partial<RoutineExerciseCreate>
): Promise<RoutineExercise> => {
  const response = await apiClient.patch<RoutineExercise>(
    `/routines/${routineId}/exercises/${exerciseId}`,
    data
  );
  return response.data;
};

/**
 * Delete an exercise from a routine.
 */
export const deleteExercise = async (
  routineId: number,
  exerciseId: number
): Promise<void> => {
  await apiClient.delete(`/routines/${routineId}/exercises/${exerciseId}`);
};
