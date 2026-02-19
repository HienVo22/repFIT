/**
 * TanStack Query hooks for routines.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as routinesApi from '@/api/routines';
import { RoutineCreate, DayOfWeek, RoutineExerciseCreate } from '@/types';

const routineKeys = {
  all: ['routines'] as const,
  lists: () => [...routineKeys.all, 'list'] as const,
  list: (filters: { dayOfWeek?: DayOfWeek }) => [...routineKeys.lists(), filters] as const,
  details: () => [...routineKeys.all, 'detail'] as const,
  detail: (id: number) => [...routineKeys.details(), id] as const,
};

export const useRoutines = (dayOfWeek?: DayOfWeek) => {
  return useQuery({
    queryKey: routineKeys.list({ dayOfWeek }),
    queryFn: () => routinesApi.getRoutines(dayOfWeek),
    staleTime: 5 * 60 * 1000,
  });
};

export const useRoutine = (id: number) => {
  return useQuery({
    queryKey: routineKeys.detail(id),
    queryFn: () => routinesApi.getRoutine(id),
    enabled: id > 0,
  });
};

export const useCreateRoutine = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RoutineCreate) => routinesApi.createRoutine(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: routineKeys.lists() });
    },
  });
};

export const useUpdateRoutine = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<RoutineCreate> }) =>
      routinesApi.updateRoutine(id, data),
    onSuccess: (updatedRoutine) => {
      queryClient.setQueryData(
        routineKeys.detail(updatedRoutine.id),
        updatedRoutine
      );
      queryClient.invalidateQueries({ queryKey: routineKeys.lists() });
    },
  });
};

export const useDeleteRoutine = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => routinesApi.deleteRoutine(id),
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: routineKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: routineKeys.lists() });
    },
  });
};

export const useAddExercise = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ routineId, data }: { routineId: number; data: RoutineExerciseCreate }) =>
      routinesApi.addExercise(routineId, data),
    onSuccess: (_, { routineId }) => {
      queryClient.invalidateQueries({ queryKey: routineKeys.detail(routineId) });
    },
  });
};

export const useDeleteExercise = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ routineId, exerciseId }: { routineId: number; exerciseId: number }) =>
      routinesApi.deleteExercise(routineId, exerciseId),
    onSuccess: (_, { routineId }) => {
      queryClient.invalidateQueries({ queryKey: routineKeys.detail(routineId) });
    },
  });
};
