import { useState, useMemo } from 'react';
import { useWorkoutStore } from '../../stores/useWorkoutStore';
import { SetGrid } from './SetGrid';
import { ExerciseSubstitution } from './ExerciseSubstitution';
import { ExerciseNote } from './ExerciseNote';
import { WarmupHint } from './WarmupHint';
import { ExerciseHistory } from '../history/ExerciseHistory';
import { FeatureErrorBoundary } from '../ui/FeatureErrorBoundary';
import type { PlanExercise } from '../../types/plan';
import type { Exercise } from '../../types/database';

interface ExerciseViewProps {
  planExercise: PlanExercise;
  exercise: Exercise | undefined;  // Looked up from exercises list
  exercises: Exercise[];  // Full exercise library for substitution
  exerciseIndex: number;
  totalExercises: number;
  onPrev: () => void;
  onNext: () => void;
  onSetComplete?: () => void;  // Callback to trigger rest timer
}

export function ExerciseView({
  planExercise,
  exercise,
  exercises,
  exerciseIndex,
  totalExercises,
  onPrev,
  onNext,
  onSetComplete,
}: ExerciseViewProps) {
  const session = useWorkoutStore(state => state.session);
  const updateSet = useWorkoutStore(state => state.updateSet);
  const removeSetsByExercise = useWorkoutStore(state => state.removeSetsByExercise);
  const setNote = useWorkoutStore(state => state.setNote);
  const currentNote = useWorkoutStore(
    state => state.session?.notes?.[planExercise.exercise_id] ?? ''
  );
  const [showSubstitution, setShowSubstitution] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Get substituted exercise ID if any
  const substitutedId = session?.exerciseSubstitutions[planExercise.exercise_id];
  const actualExerciseId = substitutedId ?? planExercise.exercise_id;

  // Get sets for this exercise (by original plan exercise ID)
  // Select raw array from store (referentially stable), filter with useMemo to avoid infinite loop
  const allSets = useWorkoutStore(state => state.session?.sets);
  const sets = useMemo(
    () => allSets?.filter(s => s.original_exercise_id === planExercise.exercise_id) ?? [],
    [allSets, planExercise.exercise_id]
  );

  const handleSaveSet = (
    data: { weight_kg: number | null; reps: number | null; rir: number | null },
    index: number
  ) => {
    // Auto-save on blur
    updateSet(actualExerciseId, planExercise.exercise_id, index, data);

    // Trigger rest timer if set has valid data
    if (data.weight_kg !== null && data.reps !== null && onSetComplete) {
      onSetComplete();
    }
  };

  const handleRemoveRow = (index: number) => {
    removeSetsByExercise(planExercise.exercise_id, index);
  };

  const exerciseName = exercise?.name ?? 'Unknown Exercise';

  // Determine plan set count (use suggested_sets from plan, default to 3)
  const planSetCount = planExercise.suggested_sets ?? 3;

  return (
    <div className="space-y-6">
      {/* Exercise header */}
      <div className="text-center">
        <div className="text-xs text-text-muted mb-1">
          Exercise {exerciseIndex + 1} of {totalExercises}
        </div>
        <div data-testid="active-exercise-name" className="text-2xl font-bold">
          {exerciseName}
          {substitutedId && <span className="text-accent text-sm ml-2">(sub)</span>}
        </div>
        {exercise?.muscle_group && (
          <div className="text-sm text-text-muted">{exercise.muscle_group}</div>
        )}
        {/* Action buttons */}
        <div className="flex gap-2 justify-center mt-2">
          <button
            onClick={() => setShowSubstitution(true)}
            className="px-3 py-1 text-xs text-text-secondary hover:text-accent border border-border-primary hover:border-accent rounded-full transition-colors"
          >
            Swap Exercise
          </button>
          <button
            onClick={() => setShowHistory(true)}
            className="px-3 py-1 text-xs text-text-secondary hover:text-info border border-border-primary hover:border-info rounded-full transition-colors"
          >
            History
          </button>
        </div>

        {/* Warmup hint */}
        {session && (
          <WarmupHint originalExerciseId={planExercise.exercise_id} />
        )}
      </div>

      {/* Progress indicator */}
      <div className="flex gap-1 justify-center">
        {Array.from({ length: totalExercises }).map((_, i) => (
          <div
            key={i}
            className={`h-1 w-8 rounded-full ${
              i < exerciseIndex ? 'bg-accent' :
              i === exerciseIndex ? 'bg-accent/50' :
              'bg-bg-elevated'
            }`}
          />
        ))}
      </div>

      {/* Set grid - card-based batch logging */}
      {session && (
        <SetGrid
          exerciseId={actualExerciseId}
          originalExerciseId={planExercise.exercise_id}
          planSetCount={planSetCount}
          gymId={session.gym_id}
          sets={sets}
          onSaveSet={handleSaveSet}
          onRemoveRow={handleRemoveRow}
        />
      )}

      {/* Exercise note */}
      {session && (
        <ExerciseNote
          originalExerciseId={planExercise.exercise_id}
          currentNote={currentNote}
          onNoteChange={(note) => setNote(planExercise.exercise_id, note)}
        />
      )}

      {/* Navigation */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={onPrev}
          disabled={exerciseIndex === 0}
          className="flex-1 py-3 bg-bg-tertiary hover:bg-bg-elevated rounded-xl transition-colors disabled:opacity-30"
        >
          Previous
        </button>
        <button
          onClick={onNext}
          disabled={exerciseIndex === totalExercises - 1}
          className="flex-1 py-3 bg-bg-tertiary hover:bg-bg-elevated rounded-xl transition-colors disabled:opacity-30"
        >
          Next
        </button>
      </div>

      {/* Substitution modal */}
      {showSubstitution && (
        <ExerciseSubstitution
          originalExerciseId={planExercise.exercise_id}
          originalExerciseName={exercises.find(e => e.exercise_id === planExercise.exercise_id)?.name ?? 'Unknown'}
          replacementExerciseId={planExercise.replacement_exercise_id}
          exercises={exercises}
          onClose={() => setShowSubstitution(false)}
        />
      )}

      {/* History modal */}
      {showHistory && session && (
        <div className="fixed inset-0 bg-black/80 z-40 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <FeatureErrorBoundary feature="Exercise History">
              <ExerciseHistory
                exerciseId={planExercise.exercise_id}
                exerciseName={exerciseName}
                currentGymId={session.gym_id}
                onClose={() => setShowHistory(false)}
              />
            </FeatureErrorBoundary>
          </div>
        </div>
      )}
    </div>
  );
}
