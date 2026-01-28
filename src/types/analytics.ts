// Analytics types for Phase 3: History & Analytics

export interface SetHistory {
  set_id: string;
  workout_id: string;
  exercise_id: string;
  exercise_name: string;
  weight_kg: number;
  reps: number;
  rir: number | null;
  estimated_1rm: number | null;
  is_pr: boolean;
  is_anomaly: boolean;
  logged_at: string;
  workout_gym_id: string;
  is_global: boolean;
  matches_gym_context: boolean;
}

export interface PRRecord {
  set_id: string;
  workout_id: string;
  exercise_id: string;
  weight_kg: number;
  reps: number;
  estimated_1rm: number | null;
  pr_type: 'weight' | '1rm' | 'weight_and_1rm';
  logged_at: string;
}

export interface ExerciseMax {
  max_weight: number | null;
  max_1rm: number | null;
}

// For grouping history by date
export interface HistoryByDate {
  date: string;  // YYYY-MM-DD
  sets: SetHistory[];
}
