import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface NutritionGoals {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface BodyStats {
  sex: 'male' | 'female';
  age: number;
  weight_kg: number;
  height_cm: number;
  activityLevel: string;
}

export interface WorkoutPrefs {
  preferredSplit: string;
  daysPerWeek: number;
  defaultIntensity: string;
}

interface PreferencesState {
  nutritionGoals: NutritionGoals | null;
  bodyStats: BodyStats | null;
  workoutPrefs: WorkoutPrefs | null;

  setNutritionGoals: (goals: NutritionGoals) => void;
  setBodyStats: (stats: BodyStats) => void;
  setWorkoutPrefs: (prefs: WorkoutPrefs) => void;
  clearNutritionGoals: () => void;
  clearAll: () => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      nutritionGoals: null,
      bodyStats: null,
      workoutPrefs: null,

      setNutritionGoals: (goals) => set({ nutritionGoals: goals }),
      setBodyStats: (stats) => set({ bodyStats: stats }),
      setWorkoutPrefs: (prefs) => set({ workoutPrefs: prefs }),
      clearNutritionGoals: () => set({ nutritionGoals: null, bodyStats: null }),
      clearAll: () => set({ nutritionGoals: null, bodyStats: null, workoutPrefs: null }),
    }),
    {
      name: 'repfit-preferences',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
