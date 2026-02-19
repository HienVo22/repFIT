/**
 * Calendar API functions.
 */

import { apiClient } from './client';
import { CalendarDay } from '@/types';

export const getCalendarData = async (month: string): Promise<CalendarDay[]> => {
  const response = await apiClient.get<CalendarDay[]>('/calendar', {
    params: { month },
  });
  return response.data;
};
