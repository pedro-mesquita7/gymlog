import type { SetHistory, PRRecord, ProgressPoint } from '../../types/analytics';
import type { LoggedSet, WorkoutSession } from '../../types/workout-session';

/**
 * Factory function for creating test SetHistory records
 * Provides realistic defaults with optional overrides
 */
export function makeSetHistory(overrides: Partial<SetHistory> = {}): SetHistory {
  return {
    set_id: 'set-' + Math.random().toString(36).substring(7),
    workout_id: 'workout-' + Math.random().toString(36).substring(7),
    exercise_id: 'ex-squat',
    exercise_name: 'Barbell Back Squat',
    weight_kg: 100,
    reps: 5,
    rir: 2,
    estimated_1rm: 112.5,
    is_pr: false,
    is_anomaly: false,
    logged_at: '2026-01-31T10:00:00Z',
    workout_gym_id: 'gym-1',
    is_global: false,
    matches_gym_context: true,
    ...overrides,
  };
}

/**
 * Factory function for creating test PR records
 * Provides realistic defaults with optional overrides
 */
export function makePRRecord(overrides: Partial<PRRecord> = {}): PRRecord {
  return {
    set_id: 'set-pr-' + Math.random().toString(36).substring(7),
    workout_id: 'workout-' + Math.random().toString(36).substring(7),
    exercise_id: 'ex-bench',
    weight_kg: 80,
    reps: 5,
    estimated_1rm: 90,
    pr_type: 'weight_and_1rm',
    logged_at: '2026-01-31T10:00:00Z',
    ...overrides,
  };
}

/**
 * Factory function for creating test ProgressPoint records
 * Provides realistic defaults with optional overrides
 */
export function makeProgressPoint(overrides: Partial<ProgressPoint> = {}): ProgressPoint {
  return {
    date: '2026-01-31',
    maxWeight: 100,
    max1rm: 112.5,
    totalVolume: 1500,
    setCount: 3,
    ...overrides,
  };
}

/**
 * Factory function for creating test LoggedSet records
 * Provides realistic defaults with optional overrides
 */
export function makeLoggedSet(overrides: Partial<LoggedSet> = {}): LoggedSet {
  return {
    set_id: 'set-' + Math.random().toString(36).substring(7),
    exercise_id: 'ex-bench',
    original_exercise_id: 'ex-bench',
    weight_kg: 60,
    reps: 8,
    rir: 2,
    logged_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Factory function for creating test WorkoutSession records
 * Provides realistic defaults with optional overrides
 */
export function makeWorkoutSession(overrides: Partial<WorkoutSession> = {}): WorkoutSession {
  return {
    workout_id: 'workout-' + Math.random().toString(36).substring(7),
    template_id: 'template-1',
    gym_id: 'gym-1',
    started_at: new Date().toISOString(),
    current_exercise_index: 0,
    sets: [],
    exerciseSubstitutions: {},
    customExercises: {},
    ...overrides,
  };
}
