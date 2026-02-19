// User types

export interface User {
  id: number;
  email: string;
  username: string;
  full_name: string | null;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface UserCreate {
  email: string;
  username: string;
  full_name?: string;
  password: string;
}

export interface UserUpdate {
  email?: string;
  username?: string;
  full_name?: string;
  password?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

// Routine types

export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export interface RoutineExercise {
  id: number;
  routine_id: number;
  exercise_name: string;
  target_sets: number;
  target_reps: number;
  target_weight: number | null;
  order: number;
  notes: string | null;
}

export interface RoutineExerciseCreate {
  exercise_name: string;
  target_sets?: number;
  target_reps?: number;
  target_weight?: number;
  order?: number;
  notes?: string;
}

export interface Routine {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  day_of_week: DayOfWeek | null;
  exercises: RoutineExercise[];
  created_at: string;
  updated_at: string;
}

export interface RoutineCreate {
  name: string;
  description?: string;
  day_of_week?: DayOfWeek;
  exercises?: RoutineExerciseCreate[];
}

export interface RoutineListItem {
  id: number;
  name: string;
  description: string | null;
  day_of_week: DayOfWeek | null;
  exercise_count: number;
  created_at: string;
}

// Workout session types

export interface CompletedSetData {
  exercise_name: string;
  set_number: number;
  reps_completed: number;
  weight_used: number | null;
  is_completed: boolean;
}

export interface WorkoutSessionCreate {
  routine_id: number | null;
  routine_name: string;
  started_at: string;
  ended_at: string;
  duration_seconds: number;
  notes?: string;
  completed_sets: CompletedSetData[];
}

export interface CompletedSet {
  id: number;
  workout_session_id: number;
  exercise_name: string;
  set_number: number;
  reps_completed: number;
  weight_used: number | null;
  is_completed: boolean;
  completed_at: string;
  notes: string | null;
}

export interface WorkoutSession {
  id: number;
  daily_log_id: number;
  routine_id: number | null;
  routine_name: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  notes: string | null;
  completed_sets: CompletedSet[];
}

// Nutrition types

export interface NutritionLogCreate {
  raw_input: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g?: number;
  meal_type?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

export interface NutritionLog {
  id: number;
  daily_log_id: number;
  raw_input: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  meal_type: string | null;
  logged_at: string;
}

export interface DailyNutritionSummary {
  date: string;
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  logs: NutritionLog[];
}

// Daily log types

export interface DailyLog {
  id: number;
  user_id: number;
  log_date: string;
  notes: string | null;
  workout_sessions: WorkoutSession[];
  nutrition_logs: NutritionLog[];
  created_at: string;
  updated_at: string;
}

// Calendar types

export interface CalendarMarking {
  marked: boolean;
  dotColor?: string;
  selected?: boolean;
  selectedColor?: string;
}

export type MarkedDates = Record<string, CalendarMarking>;

export interface CalendarDay {
  date: string;
  has_workout: boolean;
  has_nutrition: boolean;
}

// Routine generation types

export interface AvailableSplit {
  key: string;
  label: string;
  min_days: number;
  max_days: number;
  day_names: string[];
}

export interface GeneratedExercise {
  exercise_name: string;
  muscle_group: string;
  target_sets: number;
  target_reps: string;
  equipment: string;
  order: number;
}

export interface GeneratedDay {
  name: string;
  day_of_week: string;
  exercises: GeneratedExercise[];
}

export interface GenerateRoutineResponse {
  split_type: string;
  split_label: string;
  intensity: string;
  days: GeneratedDay[];
}

// Food search types

export interface FoodSearchResult {
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  serving_size: string;
  fdc_id: number;
}

export interface FoodSearchResponse {
  foods: FoodSearchResult[];
  query: string;
}

// AI types

export interface AIParsedFoodItem {
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface AIParseFoodResponse {
  items: AIParsedFoodItem[];
  raw_text: string;
}

export interface AICoachNotes {
  tips: string[];
}

export interface AIWorkoutSummary {
  summary: string;
  tips: string[];
}

// API types

export interface ApiError {
  detail: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}
