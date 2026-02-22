import { apiClient } from './client';
import { CalendarDay } from '@/types';

export interface DayDetailWorkout {
  id: number;
  routine_name: string;
  started_at: string | null;
  ended_at: string | null;
  duration_seconds: number | null;
  sets_completed: number;
}

export interface DayDetailNutritionMeal {
  id: number;
  raw_input: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  logged_at: string | null;
}

export interface DayDetailResponse {
  date: string;
  workouts: DayDetailWorkout[];
  nutrition: {
    meals: DayDetailNutritionMeal[];
    totals: {
      calories: number;
      protein_g: number;
      carbs_g: number;
      fat_g: number;
    };
  };
}

export const getCalendarData = async (month: string): Promise<CalendarDay[]> => {
  const response = await apiClient.get<CalendarDay[]>('/calendar/', {
    params: { month },
  });
  return response.data;
};

export const getDayDetail = async (date: string): Promise<DayDetailResponse> => {
  const response = await apiClient.get<DayDetailResponse>('/calendar/day', {
    params: { date },
  });
  return response.data;
};
