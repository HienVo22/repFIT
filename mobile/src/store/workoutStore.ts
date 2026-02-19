/**
 * Active workout session state (Zustand).
 */

import { create } from 'zustand';
import { Routine } from '@/types';

type SetStatus = 'pending' | 'completed' | 'skipped';

export interface ActiveSet {
  exerciseIndex: number;
  setNumber: number;
  targetReps: number;
  targetWeight: number | null;
  status: SetStatus;
  actualReps?: number;
  actualWeight?: number;
}

interface WorkoutState {
  isActive: boolean;
  isPaused: boolean;
  routine: Routine | null;
  startTime: Date | null;
  elapsedSeconds: number;

  sets: ActiveSet[];
  currentSetIndex: number;

  startWorkout: (routine: Routine) => void;
  pauseWorkout: () => void;
  resumeWorkout: () => void;
  endWorkout: () => { duration: number; completedSets: ActiveSet[]; routine: Routine | null; startTime: Date | null };

  completeSet: (index: number, actualReps?: number, actualWeight?: number) => void;
  skipSet: (index: number) => void;
  editSet: (index: number, reps: number, weight: number) => void;

  tick: () => void;
}

const generateSets = (routine: Routine): ActiveSet[] => {
  const sets: ActiveSet[] = [];

  routine.exercises.forEach((exercise, exerciseIndex) => {
    for (let setNum = 1; setNum <= exercise.target_sets; setNum++) {
      sets.push({
        exerciseIndex,
        setNumber: setNum,
        targetReps: exercise.target_reps,
        targetWeight: exercise.target_weight,
        status: 'pending',
      });
    }
  });

  return sets;
};

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  isActive: false,
  isPaused: false,
  routine: null,
  startTime: null,
  elapsedSeconds: 0,
  sets: [],
  currentSetIndex: 0,

  startWorkout: (routine: Routine) => {
    set({
      isActive: true,
      isPaused: false,
      routine,
      startTime: new Date(),
      elapsedSeconds: 0,
      sets: generateSets(routine),
      currentSetIndex: 0,
    });
  },

  pauseWorkout: () => {
    set({ isPaused: true });
  },

  resumeWorkout: () => {
    set({ isPaused: false });
  },

  endWorkout: () => {
    const { elapsedSeconds, sets, routine, startTime } = get();

    set({
      isActive: false,
      isPaused: false,
      routine: null,
      startTime: null,
      elapsedSeconds: 0,
      sets: [],
      currentSetIndex: 0,
    });

    return {
      duration: elapsedSeconds,
      completedSets: sets.filter(s => s.status === 'completed'),
      routine,
      startTime,
    };
  },

  completeSet: (index: number, actualReps?: number, actualWeight?: number) => {
    set((state) => {
      const newSets = [...state.sets];
      newSets[index] = {
        ...newSets[index],
        status: 'completed',
        actualReps: actualReps ?? newSets[index].targetReps,
        actualWeight: actualWeight ?? newSets[index].targetWeight ?? undefined,
      };

      const nextIndex = newSets.findIndex((s, i) => i > index && s.status === 'pending');

      return {
        sets: newSets,
        currentSetIndex: nextIndex >= 0 ? nextIndex : state.currentSetIndex,
      };
    });
  },

  skipSet: (index: number) => {
    set((state) => {
      const newSets = [...state.sets];
      newSets[index] = { ...newSets[index], status: 'skipped' };
      return { sets: newSets };
    });
  },

  editSet: (index: number, reps: number, weight: number) => {
    set((state) => {
      const newSets = [...state.sets];
      newSets[index] = {
        ...newSets[index],
        actualReps: reps,
        actualWeight: weight,
      };
      return { sets: newSets };
    });
  },

  tick: () => {
    const { isActive, isPaused } = get();
    if (isActive && !isPaused) {
      set((state) => ({ elapsedSeconds: state.elapsedSeconds + 1 }));
    }
  },
}));
