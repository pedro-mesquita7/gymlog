import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { uuidv7 } from 'uuidv7';
import type { WorkoutSession, LoggedSet } from '../types/workout-session';

// Global default rest time in seconds (2 minutes)
const DEFAULT_REST_SECONDS = 120;

interface WorkoutState {
  // Session data (null when no active workout)
  session: WorkoutSession | null;

  // Rest timer config
  defaultRestSeconds: number;

  // Actions
  startWorkout: (templateId: string, gymId: string) => void;
  logSet: (
    exerciseId: string,
    originalExerciseId: string,
    data: { weight_kg: number; reps: number; rir: number | null }
  ) => void;
  updateSet: (
    exerciseId: string,
    originalExerciseId: string,
    index: number,
    data: { weight_kg: number | null; reps: number | null; rir: number | null }
  ) => void;
  removeSet: (setId: string) => void;
  removeSetsByExercise: (originalExerciseId: string, index: number) => void;
  setCurrentExerciseIndex: (index: number) => void;
  substituteExercise: (originalId: string, replacementId: string) => void;
  revertSubstitution: (originalId: string) => void;
  addCustomExercise: (exerciseId: string, name: string) => void;
  setDefaultRestSeconds: (seconds: number) => void;
  completeWorkout: () => WorkoutSession | null;  // Returns session for event writing
  cancelWorkout: () => void;
}

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set, get) => ({
      session: null,
      defaultRestSeconds: DEFAULT_REST_SECONDS,

      startWorkout: (templateId, gymId) => {
        set({
          session: {
            workout_id: uuidv7(),
            template_id: templateId,
            gym_id: gymId,
            started_at: new Date().toISOString(),
            current_exercise_index: 0,
            sets: [],
            exerciseSubstitutions: {},
            customExercises: {},
          },
        });
      },

      logSet: (exerciseId, originalExerciseId, data) => {
        const session = get().session;
        if (!session) return;

        const newSet: LoggedSet = {
          set_id: uuidv7(),
          exercise_id: exerciseId,
          original_exercise_id: originalExerciseId,
          weight_kg: data.weight_kg,
          reps: data.reps,
          rir: data.rir,
          logged_at: new Date().toISOString(),
        };

        set({
          session: {
            ...session,
            sets: [...session.sets, newSet],
          },
        });
      },

      updateSet: (exerciseId, originalExerciseId, index, data) => {
        const session = get().session;
        if (!session) return;

        // Find sets for this exercise
        const exerciseSets = session.sets.filter(
          s => s.original_exercise_id === originalExerciseId
        );

        // Check if a set exists at this index
        const existingSet = exerciseSets[index];

        if (existingSet) {
          // Update existing set
          const updatedSets = session.sets.map(s =>
            s.set_id === existingSet.set_id
              ? {
                  ...s,
                  weight_kg: data.weight_kg ?? s.weight_kg,
                  reps: data.reps ?? s.reps,
                  rir: data.rir ?? s.rir,
                }
              : s
          );

          set({
            session: {
              ...session,
              sets: updatedSets,
            },
          });
        } else if (data.weight_kg !== null && data.reps !== null) {
          // Create new set if data is non-null (upsert behavior)
          const newSet: LoggedSet = {
            set_id: uuidv7(),
            exercise_id: exerciseId,
            original_exercise_id: originalExerciseId,
            weight_kg: data.weight_kg,
            reps: data.reps,
            rir: data.rir,
            logged_at: new Date().toISOString(),
          };

          set({
            session: {
              ...session,
              sets: [...session.sets, newSet],
            },
          });
        }
      },

      removeSet: (setId) => {
        const session = get().session;
        if (!session) return;

        set({
          session: {
            ...session,
            sets: session.sets.filter(s => s.set_id !== setId),
          },
        });
      },

      removeSetsByExercise: (originalExerciseId, index) => {
        const session = get().session;
        if (!session) return;

        // Find sets for this exercise
        const exerciseSets = session.sets.filter(
          s => s.original_exercise_id === originalExerciseId
        );

        // Get the set at the specific index
        const setToRemove = exerciseSets[index];

        if (setToRemove) {
          set({
            session: {
              ...session,
              sets: session.sets.filter(s => s.set_id !== setToRemove.set_id),
            },
          });
        }
      },

      setCurrentExerciseIndex: (index) => {
        const session = get().session;
        if (!session) return;

        set({
          session: {
            ...session,
            current_exercise_index: index,
          },
        });
      },

      substituteExercise: (originalId, replacementId) => {
        const session = get().session;
        if (!session) return;

        set({
          session: {
            ...session,
            exerciseSubstitutions: {
              ...session.exerciseSubstitutions,
              [originalId]: replacementId,
            },
          },
        });
      },

      revertSubstitution: (originalId) => {
        const session = get().session;
        if (!session) return;

        const { [originalId]: _, ...rest } = session.exerciseSubstitutions;
        set({
          session: {
            ...session,
            exerciseSubstitutions: rest,
          },
        });
      },

      addCustomExercise: (exerciseId, name) => {
        const session = get().session;
        if (!session) return;

        set({
          session: {
            ...session,
            customExercises: {
              ...session.customExercises,
              [exerciseId]: name,
            },
          },
        });
      },

      setDefaultRestSeconds: (seconds) => {
        set({ defaultRestSeconds: seconds });
      },

      completeWorkout: () => {
        const session = get().session;
        set({ session: null });
        return session;  // Return for event writing
      },

      cancelWorkout: () => {
        set({ session: null });
      },
    }),
    {
      name: 'gymlog-workout',  // sessionStorage key
      storage: createJSONStorage(() => sessionStorage),  // Clear on tab close
      partialize: (state) => ({
        session: state.session,
        defaultRestSeconds: state.defaultRestSeconds,
      }),
    }
  )
);

// Selector for checking if workout is active
export const selectIsWorkoutActive = (state: WorkoutState) => state.session !== null;

// Selector for getting sets for a specific exercise
export const selectSetsForExercise = (exerciseId: string) => (state: WorkoutState) =>
  state.session?.sets.filter(s => s.original_exercise_id === exerciseId) ?? [];
