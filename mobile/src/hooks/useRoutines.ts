/**
 * TanStack Query hooks for Routines.
 * 
 * 🎓 INTERVIEW CONCEPT: Server State Management
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * TanStack Query (formerly React Query) handles:
 * 1. Caching: Responses are cached to avoid duplicate requests
 * 2. Deduplication: Multiple components requesting same data = 1 request
 * 3. Background refetching: Data stays fresh automatically
 * 4. Optimistic updates: Update UI before API confirms
 * 5. Error/loading states: Built-in state machine
 * 
 * 🎓 Key concepts for interviews:
 * - Query keys: How cache invalidation works
 * - Stale time: When to refetch
 * - Mutations: How to update server state
 * - Optimistic updates: Better UX pattern
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as routinesApi from '@/api/routines';
import { RoutineCreate, DayOfWeek, RoutineExerciseCreate } from '@/types';

// Query keys factory
// 🎓 INTERVIEW: Consistent key structure enables precise cache invalidation
const routineKeys = {
  all: ['routines'] as const,
  lists: () => [...routineKeys.all, 'list'] as const,
  list: (filters: { dayOfWeek?: DayOfWeek }) => [...routineKeys.lists(), filters] as const,
  details: () => [...routineKeys.all, 'detail'] as const,
  detail: (id: number) => [...routineKeys.details(), id] as const,
};

/**
 * Hook to fetch all routines.
 * 
 * 🎓 INTERVIEW: useQuery automatically handles:
 * - Loading state (isLoading)
 * - Error state (isError, error)
 * - Data caching (won't refetch if fresh)
 * - Refetch on window focus (configurable)
 */
export const useRoutines = (dayOfWeek?: DayOfWeek) => {
  return useQuery({
    queryKey: routineKeys.list({ dayOfWeek }),
    queryFn: () => routinesApi.getRoutines(dayOfWeek),
    staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
  });
};

/**
 * Hook to fetch a single routine with exercises.
 */
export const useRoutine = (id: number) => {
  return useQuery({
    queryKey: routineKeys.detail(id),
    queryFn: () => routinesApi.getRoutine(id),
    enabled: id > 0, // Don't fetch if id is invalid
  });
};

/**
 * Hook to create a routine.
 * 
 * 🎓 INTERVIEW CONCEPT: Mutations & Cache Invalidation
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * After creating a routine, we need to update the cache:
 * 
 * Option 1: Invalidate queries (refetch from server)
 * - Simpler, guaranteed consistency
 * - Extra network request
 * 
 * Option 2: Update cache directly
 * - No extra request
 * - More complex, risk of inconsistency
 * 
 * We use Option 1 here for simplicity.
 */
export const useCreateRoutine = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: RoutineCreate) => routinesApi.createRoutine(data),
    onSuccess: () => {
      // Invalidate all routine lists to refetch
      queryClient.invalidateQueries({ queryKey: routineKeys.lists() });
    },
  });
};

/**
 * Hook to update a routine.
 */
export const useUpdateRoutine = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<RoutineCreate> }) =>
      routinesApi.updateRoutine(id, data),
    onSuccess: (updatedRoutine) => {
      // Update the specific routine in cache
      queryClient.setQueryData(
        routineKeys.detail(updatedRoutine.id),
        updatedRoutine
      );
      // Invalidate lists in case name/day changed
      queryClient.invalidateQueries({ queryKey: routineKeys.lists() });
    },
  });
};

/**
 * Hook to delete a routine.
 * 
 * 🎓 INTERVIEW CONCEPT: Optimistic Updates
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * For delete, we could:
 * 1. Remove from UI immediately (optimistic)
 * 2. Show loading state until confirmed
 * 3. Revert if delete fails
 * 
 * This example uses simple invalidation, but optimistic
 * would use onMutate to update cache before API call.
 */
export const useDeleteRoutine = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => routinesApi.deleteRoutine(id),
    onSuccess: (_, deletedId) => {
      // Remove from detail cache
      queryClient.removeQueries({ queryKey: routineKeys.detail(deletedId) });
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: routineKeys.lists() });
    },
  });
};

/**
 * Hook to add an exercise to a routine.
 */
export const useAddExercise = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ routineId, data }: { routineId: number; data: RoutineExerciseCreate }) =>
      routinesApi.addExercise(routineId, data),
    onSuccess: (_, { routineId }) => {
      // Invalidate the routine detail to refetch with new exercise
      queryClient.invalidateQueries({ queryKey: routineKeys.detail(routineId) });
    },
  });
};

/**
 * Hook to delete an exercise from a routine.
 */
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
