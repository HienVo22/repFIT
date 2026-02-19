/**
 * Nutrition API functions.
 */

import { apiClient } from './client';
import {
  NutritionLogCreate,
  NutritionLog,
  DailyNutritionSummary,
  FoodSearchResponse,
  AIParseFoodResponse,
} from '@/types';

export const createNutritionLog = async (data: NutritionLogCreate): Promise<NutritionLog> => {
  const response = await apiClient.post<NutritionLog>('/nutrition/', data);
  return response.data;
};

export const getNutritionByDate = async (date: string): Promise<DailyNutritionSummary> => {
  const response = await apiClient.get<DailyNutritionSummary>('/nutrition/', {
    params: { date },
  });
  return response.data;
};

export const deleteNutritionLog = async (id: number): Promise<void> => {
  await apiClient.delete(`/nutrition/${id}`);
};

export const searchFoods = async (query: string): Promise<FoodSearchResponse> => {
  const response = await apiClient.get<FoodSearchResponse>('/nutrition/search', {
    params: { query },
  });
  return response.data;
};

export const parseFood = async (text: string): Promise<AIParseFoodResponse> => {
  const response = await apiClient.post<AIParseFoodResponse>('/nutrition/parse', { text });
  return response.data;
};
