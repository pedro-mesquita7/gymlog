// A single logged set during active workout
export interface LoggedSet {
  set_id: string;                // Unique ID for this set
  exercise_id: string;           // Which exercise (may be substituted)
  original_exercise_id: string;  // Plan's exercise (before substitution)
  weight_kg: number;
  reps: number;
  rir: number | null;            // Reps in reserve (optional)
  logged_at: string;             // ISO timestamp
}

// Active workout session state
export interface WorkoutSession {
  workout_id: string;
  template_id: string;  // Preserved: stored in localStorage as template_id
  gym_id: string;
  started_at: string;            // ISO timestamp
  current_exercise_index: number;
  sets: LoggedSet[];
  // Map of original_exercise_id -> substituted_exercise_id
  exerciseSubstitutions: Record<string, string>;
  // One-off custom exercises added during workout (name only, not saved to library)
  customExercises: Record<string, string>;  // exercise_id -> name
}
