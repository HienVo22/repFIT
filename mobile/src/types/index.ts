/**
 * TypeScript interfaces matching backend Pydantic schemas.
 * 
 * 🎓 INTERVIEW CONCEPT: End-to-End Type Safety
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * These types mirror the Pydantic schemas exactly.
 * This ensures:
 * 1. Compile-time errors if API contract changes
 * 2. IDE autocomplete for API responses
 * 3. Self-documenting code
 * 
 * In a larger project, you might generate these automatically
 * from OpenAPI spec using tools like openapi-typescript.
 */

// ============================================================
// User Types
// ============================================================

export interface User {
  id: number;
  email: string;
  username: string;
  full_name: string | null;
  is_active: boolean;
  is_verified: boolean;
  created_at: string; // ISO date string
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

// ============================================================
// Routine Types
// ============================================================

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

// ============================================================
// Workout Session Types
// ============================================================

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

// ============================================================
// Nutrition Types
// ============================================================

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

export interface NutritionInput {
  raw_input: string;
  meal_type?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

// ============================================================
// Daily Log Types
// ============================================================

export interface DailyLog {
  id: number;
  user_id: number;
  log_date: string; // YYYY-MM-DD
  notes: string | null;
  workout_sessions: WorkoutSession[];
  nutrition_logs: NutritionLog[];
  created_at: string;
  updated_at: string;
}

// ============================================================
// Calendar Types (for react-native-calendars)
// ============================================================

export interface CalendarMarking {
  marked: boolean;
  dotColor?: string;
  selected?: boolean;
  selectedColor?: string;
}

export type MarkedDates = Record<string, CalendarMarking>;

// ============================================================
// API Response Types
// ============================================================

export interface ApiError {
  detail: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}
