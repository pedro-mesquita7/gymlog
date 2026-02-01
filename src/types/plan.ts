// Plan exercise in a workout plan
export interface PlanExercise {
  exercise_id: string;           // References dim_exercise
  order_index: number;           // Position in plan (0-based)
  target_reps_min: number;       // e.g., 8
  target_reps_max: number;       // e.g., 12
  suggested_sets: number;        // Default number of sets (e.g., 3)
  rest_seconds: number | null;   // Override global rest time, null = use global default
  replacement_exercise_id: string | null;  // Optional predefined replacement
}

// Workout plan (e.g., "Upper A", "Push Day")
export interface Plan {
  template_id: string;
  name: string;
  exercises: PlanExercise[];
  is_archived: boolean;          // Hidden but not deleted
}
