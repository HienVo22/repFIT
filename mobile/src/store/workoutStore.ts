/**
 * Active Workout Session Store.
 * 
 * 🎓 INTERVIEW CONCEPT: State Machines & Complex UI State
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * An active workout session has multiple states:
 * - Not started
 * - In progress (timer running)
 * - Paused
 * - Completed
 * 
 * This is essentially a finite state machine (FSM).
 * Each state has valid transitions:
 * - Not started -> In progress (start workout)
 * - In progress -> Paused (pause) | Completed (finish)
 * - Paused -> In progress (resume)
 * 
 * This is a common interview topic for complex UI logic.
 */

import { create } from 'zustand';
import { Routine, RoutineExercise, CompletedSet } from '@/types';

// Set status for the bubble UI
type SetStatus = 'pending' | 'completed' | 'skipped';

interface ActiveSet {
  exerciseIndex: number;
  setNumber: number;
  targetReps: number;
  targetWeight: number | null;
  status: SetStatus;
  actualReps?: number;
  actualWeight?: number;
}

interface WorkoutState {
  // Session state
  isActive: boolean;
  isPaused: boolean;
  routine: Routine | null;
  startTime: Date | null;
  elapsedSeconds: number;
  
  // Exercise tracking
  sets: ActiveSet[];
  currentSetIndex: number;
  
  // Actions
  startWorkout: (routine: Routine) => void;
  pauseWorkout: () => void;
  resumeWorkout: () => void;
  endWorkout: () => { duration: number; completedSets: ActiveSet[] };
  
  // Set management
  completeSet: (index: number, actualReps?: number, actualWeight?: number) => void;
  skipSet: (index: number) => void;
  editSet: (index: number, reps: number, weight: number) => void;
  
  // Timer
  tick: () => void;
}

/**
 * Generate all sets from a routine's exercises.
 * 
 * 🎓 INTERVIEW: This transforms hierarchical data (routine -> exercises -> sets)
 * into a flat list for easier UI rendering and state management.
 */
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
  // Initial state
  isActive: false,
  isPaused: false,
  routine: null,
  startTime: null,
  elapsedSeconds: 0,
  sets: [],
  currentSetIndex: 0,
  
  /**
   * Start a new workout session.
   * 
   * 🎓 INTERVIEW: This initializes all the state at once.
   * Using a single set() call ensures atomic state update.
   */
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
  
  /**
   * End workout and return summary.
   * 
   * 🎓 INTERVIEW: Notice we return data AND reset state.
   * The caller can use the returned data to save to the API.
   */
  endWorkout: () => {
    const { elapsedSeconds, sets } = get();
    
    // Reset state
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
    };
  },
  
  /**
   * Mark a set as completed.
   * 
   * 🎓 INTERVIEW CONCEPT: Optimistic Updates
   * We update the UI immediately without waiting for API.
   * If the API fails, we could revert (not implemented here).
   */
  completeSet: (index: number, actualReps?: number, actualWeight?: number) => {
    set((state) => {
      const newSets = [...state.sets];
      newSets[index] = {
        ...newSets[index],
        status: 'completed',
        actualReps: actualReps ?? newSets[index].targetReps,
        actualWeight: actualWeight ?? newSets[index].targetWeight ?? undefined,
      };
      
      // Move to next pending set
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
  
  /**
   * Increment elapsed time (called every second when active).
   */
  tick: () => {
    const { isActive, isPaused } = get();
    if (isActive && !isPaused) {
      set((state) => ({ elapsedSeconds: state.elapsedSeconds + 1 }));
    }
  },
}));
