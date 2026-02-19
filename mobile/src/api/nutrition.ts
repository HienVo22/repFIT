/**
 * Nutrition API functions.
 */

import { apiClient } from './client';
import { NutritionLogCreate, NutritionLog, DailyNutritionSummary } from '@/types';

export const createNutritionLog = async (data: NutritionLogCreate): Promise<NutritionLog> => {
  const response = await apiClient.post<NutritionLog>('/nutrition', data);
  return response.data;
};

export const getNutritionByDate = async (date: string): Promise<DailyNutritionSummary> => {
  const response = await apiClient.get<DailyNutritionSummary>('/nutrition', {
    params: { date },
  });
  return response.data;
};

export const deleteNutritionLog = async (id: number): Promise<void> => {
  await apiClient.delete(`/nutrition/${id}`);
};
