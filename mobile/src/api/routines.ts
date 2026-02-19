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
  AvailableSplit,
  GenerateRoutineResponse,
} from '@/types';

export const getRoutines = async (dayOfWeek?: DayOfWeek): Promise<RoutineListItem[]> => {
  const params = dayOfWeek ? { day_of_week: dayOfWeek } : {};
  const response = await apiClient.get<RoutineListItem[]>('/routines/', { params });
  return response.data;
};

export const getRoutine = async (id: number): Promise<Routine> => {
  const response = await apiClient.get<Routine>(`/routines/${id}`);
  return response.data;
};

export const createRoutine = async (data: RoutineCreate): Promise<Routine> => {
  const response = await apiClient.post<Routine>('/routines/', data);
  return response.data;
};

export const updateRoutine = async (
  id: number,
  data: Partial<RoutineCreate>
): Promise<Routine> => {
  const response = await apiClient.patch<Routine>(`/routines/${id}`, data);
  return response.data;
};

export const deleteRoutine = async (id: number): Promise<void> => {
  await apiClient.delete(`/routines/${id}`);
};

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

export const deleteExercise = async (
  routineId: number,
  exerciseId: number
): Promise<void> => {
  await apiClient.delete(`/routines/${routineId}/exercises/${exerciseId}`);
};

export const getAvailableSplits = async (days?: number): Promise<AvailableSplit[]> => {
  const params = days ? { days } : {};
  const response = await apiClient.get<{ splits: AvailableSplit[] }>('/routines/splits', { params });
  return response.data.splits;
};

export const generateRoutine = async (
  days_per_week: number,
  split_type: string,
  intensity: string,
): Promise<GenerateRoutineResponse> => {
  const response = await apiClient.post<GenerateRoutineResponse>('/routines/generate', {
    days_per_week,
    split_type,
    intensity,
  });
  return response.data;
};

export const getCoachNotes = async (routineData: object): Promise<{ tips: string[] }> => {
  const response = await apiClient.post<{ tips: string[] }>('/routines/coach-notes', {
    routine_data: routineData,
  });
  return response.data;
};
