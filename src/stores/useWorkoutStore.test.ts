import { describe, test, expect, beforeEach, vi } from 'vitest';
import { useWorkoutStore, selectSetsForExercise } from './useWorkoutStore';

// Mock uuidv7 to return predictable IDs
let mockIdCounter = 0;
vi.mock('uuidv7', () => ({
  uuidv7: vi.fn(() => {
    mockIdCounter++;
    return `mock-uuid-${mockIdCounter}`;
  }),
}));

// Mock Date for deterministic timestamps
const MOCK_DATE = '2026-01-31T10:00:00.000Z';
const mockDate = new Date(MOCK_DATE);

describe('useWorkoutStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useWorkoutStore.setState({ session: null, defaultRestSeconds: 120 });

    // Reset UUID counter
    mockIdCounter = 0;

    // Mock Date.now() and new Date()
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('startWorkout', () => {
    test('creates session with correct shape', () => {
      const { startWorkout, session } = useWorkoutStore.getState();

      expect(session).toBeNull();

      startWorkout('template-1', 'gym-1');

      const newSession = useWorkoutStore.getState().session;
      expect(newSession).toEqual({
        workout_id: 'mock-uuid-1',
        template_id: 'template-1',
        gym_id: 'gym-1',
        started_at: MOCK_DATE,
        current_exercise_index: 0,
        sets: [],
        exerciseSubstitutions: {},
        customExercises: {},
      });
    });

    test('generates unique workout_id using uuidv7', () => {
      const { startWorkout } = useWorkoutStore.getState();

      startWorkout('template-1', 'gym-1');
      const session1 = useWorkoutStore.getState().session;

      startWorkout('template-2', 'gym-2');
      const session2 = useWorkoutStore.getState().session;

      expect(session1?.workout_id).toBe('mock-uuid-1');
      expect(session2?.workout_id).toBe('mock-uuid-2');
    });
  });

  describe('logSet', () => {
    beforeEach(() => {
      useWorkoutStore.getState().startWorkout('template-1', 'gym-1');
    });

    test('adds set with correct fields', () => {
      const { logSet } = useWorkoutStore.getState();

      logSet('ex-bench', 'ex-bench', { weight_kg: 60, reps: 8, rir: 2 });

      const session = useWorkoutStore.getState().session;
      expect(session?.sets).toHaveLength(1);
      expect(session?.sets[0]).toEqual({
        set_id: 'mock-uuid-2', // UUID counter starts at 2 (1 was for workout_id)
        exercise_id: 'ex-bench',
        original_exercise_id: 'ex-bench',
        weight_kg: 60,
        reps: 8,
        rir: 2,
        logged_at: MOCK_DATE,
      });
    });

    test('handles null RIR correctly', () => {
      const { logSet } = useWorkoutStore.getState();

      logSet('ex-squat', 'ex-squat', { weight_kg: 100, reps: 5, rir: null });

      const session = useWorkoutStore.getState().session;
      expect(session?.sets[0].rir).toBeNull();
    });

    test('appends sets in order', () => {
      const { logSet } = useWorkoutStore.getState();

      logSet('ex-bench', 'ex-bench', { weight_kg: 60, reps: 8, rir: 2 });
      logSet('ex-bench', 'ex-bench', { weight_kg: 65, reps: 6, rir: 1 });

      const session = useWorkoutStore.getState().session;
      expect(session?.sets).toHaveLength(2);
      expect(session?.sets[0].weight_kg).toBe(60);
      expect(session?.sets[1].weight_kg).toBe(65);
    });

    test('does nothing when no active session', () => {
      useWorkoutStore.setState({ session: null });
      const { logSet } = useWorkoutStore.getState();

      logSet('ex-bench', 'ex-bench', { weight_kg: 60, reps: 8, rir: 2 });

      const session = useWorkoutStore.getState().session;
      expect(session).toBeNull();
    });
  });

  describe('removeSet', () => {
    beforeEach(() => {
      const { startWorkout, logSet } = useWorkoutStore.getState();
      startWorkout('template-1', 'gym-1');
      logSet('ex-bench', 'ex-bench', { weight_kg: 60, reps: 8, rir: 2 });
      logSet('ex-bench', 'ex-bench', { weight_kg: 65, reps: 6, rir: 1 });
    });

    test('removes correct set by ID', () => {
      const session = useWorkoutStore.getState().session;
      const setIdToRemove = session?.sets[0].set_id;

      const { removeSet } = useWorkoutStore.getState();
      removeSet(setIdToRemove!);

      const updatedSession = useWorkoutStore.getState().session;
      expect(updatedSession?.sets).toHaveLength(1);
      expect(updatedSession?.sets[0].weight_kg).toBe(65); // Second set remains
    });

    test('does nothing when set ID not found', () => {
      const { removeSet } = useWorkoutStore.getState();
      removeSet('non-existent-id');

      const session = useWorkoutStore.getState().session;
      expect(session?.sets).toHaveLength(2); // Both sets still present
    });

    test('does nothing when no active session', () => {
      useWorkoutStore.setState({ session: null });
      const { removeSet } = useWorkoutStore.getState();

      removeSet('mock-uuid-2');

      const session = useWorkoutStore.getState().session;
      expect(session).toBeNull();
    });
  });

  describe('completeWorkout', () => {
    test('returns session and clears state to null', () => {
      const { startWorkout, logSet, completeWorkout } = useWorkoutStore.getState();

      startWorkout('template-1', 'gym-1');
      logSet('ex-bench', 'ex-bench', { weight_kg: 60, reps: 8, rir: 2 });

      const sessionBeforeComplete = useWorkoutStore.getState().session;
      expect(sessionBeforeComplete).not.toBeNull();

      const returnedSession = completeWorkout();

      expect(returnedSession).toEqual(sessionBeforeComplete);
      expect(useWorkoutStore.getState().session).toBeNull();
    });

    test('returns null when no active session', () => {
      const { completeWorkout } = useWorkoutStore.getState();

      const returnedSession = completeWorkout();

      expect(returnedSession).toBeNull();
      expect(useWorkoutStore.getState().session).toBeNull();
    });
  });

  describe('cancelWorkout', () => {
    test('clears session to null', () => {
      const { startWorkout, cancelWorkout } = useWorkoutStore.getState();

      startWorkout('template-1', 'gym-1');
      expect(useWorkoutStore.getState().session).not.toBeNull();

      cancelWorkout();

      expect(useWorkoutStore.getState().session).toBeNull();
    });

    test('does nothing when no active session', () => {
      const { cancelWorkout } = useWorkoutStore.getState();

      cancelWorkout();

      expect(useWorkoutStore.getState().session).toBeNull();
    });
  });

  describe('substituteExercise', () => {
    beforeEach(() => {
      useWorkoutStore.getState().startWorkout('template-1', 'gym-1');
    });

    test('maps original to replacement exercise ID', () => {
      const { substituteExercise } = useWorkoutStore.getState();

      substituteExercise('ex-bench', 'ex-dumbbell-bench');

      const session = useWorkoutStore.getState().session;
      expect(session?.exerciseSubstitutions).toEqual({
        'ex-bench': 'ex-dumbbell-bench',
      });
    });

    test('handles multiple substitutions', () => {
      const { substituteExercise } = useWorkoutStore.getState();

      substituteExercise('ex-bench', 'ex-dumbbell-bench');
      substituteExercise('ex-squat', 'ex-leg-press');

      const session = useWorkoutStore.getState().session;
      expect(session?.exerciseSubstitutions).toEqual({
        'ex-bench': 'ex-dumbbell-bench',
        'ex-squat': 'ex-leg-press',
      });
    });

    test('overwrites existing substitution', () => {
      const { substituteExercise } = useWorkoutStore.getState();

      substituteExercise('ex-bench', 'ex-dumbbell-bench');
      substituteExercise('ex-bench', 'ex-incline-bench');

      const session = useWorkoutStore.getState().session;
      expect(session?.exerciseSubstitutions['ex-bench']).toBe('ex-incline-bench');
    });
  });

  describe('revertSubstitution', () => {
    beforeEach(() => {
      const { startWorkout, substituteExercise } = useWorkoutStore.getState();
      startWorkout('template-1', 'gym-1');
      substituteExercise('ex-bench', 'ex-dumbbell-bench');
      substituteExercise('ex-squat', 'ex-leg-press');
    });

    test('removes mapping for specific exercise', () => {
      const { revertSubstitution } = useWorkoutStore.getState();

      revertSubstitution('ex-bench');

      const session = useWorkoutStore.getState().session;
      expect(session?.exerciseSubstitutions).toEqual({
        'ex-squat': 'ex-leg-press',
      });
    });

    test('does nothing when exercise not substituted', () => {
      const { revertSubstitution } = useWorkoutStore.getState();

      revertSubstitution('ex-deadlift');

      const session = useWorkoutStore.getState().session;
      expect(session?.exerciseSubstitutions).toEqual({
        'ex-bench': 'ex-dumbbell-bench',
        'ex-squat': 'ex-leg-press',
      });
    });
  });

  describe('selectSetsForExercise', () => {
    beforeEach(() => {
      const { startWorkout, logSet } = useWorkoutStore.getState();
      startWorkout('template-1', 'gym-1');

      // Log sets for bench (some substituted to dumbbell bench)
      logSet('ex-bench', 'ex-bench', { weight_kg: 60, reps: 8, rir: 2 });
      logSet('ex-dumbbell-bench', 'ex-bench', { weight_kg: 50, reps: 10, rir: 1 });

      // Log sets for squat
      logSet('ex-squat', 'ex-squat', { weight_kg: 100, reps: 5, rir: 3 });
    });

    test('filters sets by original_exercise_id', () => {
      const state = useWorkoutStore.getState();
      const benchSets = selectSetsForExercise('ex-bench')(state);

      expect(benchSets).toHaveLength(2);
      expect(benchSets.every(s => s.original_exercise_id === 'ex-bench')).toBe(true);
    });

    test('includes sets with substituted exercise_id', () => {
      const state = useWorkoutStore.getState();
      const benchSets = selectSetsForExercise('ex-bench')(state);

      const substitutedSet = benchSets.find(s => s.exercise_id === 'ex-dumbbell-bench');
      expect(substitutedSet).toBeDefined();
      expect(substitutedSet?.original_exercise_id).toBe('ex-bench');
    });

    test('returns empty array when no sets match', () => {
      const state = useWorkoutStore.getState();
      const deadliftSets = selectSetsForExercise('ex-deadlift')(state);

      expect(deadliftSets).toEqual([]);
    });

    test('returns empty array when no active session', () => {
      useWorkoutStore.setState({ session: null });
      const state = useWorkoutStore.getState();
      const sets = selectSetsForExercise('ex-bench')(state);

      expect(sets).toEqual([]);
    });
  });
});
