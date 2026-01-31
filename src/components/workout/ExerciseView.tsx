import { useState, useMemo } from 'react';
import { useWorkoutStore } from '../../stores/useWorkoutStore';
import { SetGrid } from './SetGrid';
import { ExerciseSubstitution } from './ExerciseSubstitution';
import { ExerciseHistory } from '../history/ExerciseHistory';
import { FeatureErrorBoundary } from '../ui/FeatureErrorBoundary';
import type { TemplateExercise } from '../../types/template';
import type { Exercise } from '../../types/database';

interface ExerciseViewProps {
  templateExercise: TemplateExercise;
  exercise: Exercise | undefined;  // Looked up from exercises list
  exercises: Exercise[];  // Full exercise library for substitution
  exerciseIndex: number;
  totalExercises: number;
  onPrev: () => void;
  onNext: () => void;
  onSetComplete?: () => void;  // Callback to trigger rest timer
}

export function ExerciseView({
  templateExercise,
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
  const [showSubstitution, setShowSubstitution] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Get substituted exercise ID if any
  const substitutedId = session?.exerciseSubstitutions[templateExercise.exercise_id];
  const actualExerciseId = substitutedId ?? templateExercise.exercise_id;

  // Get sets for this exercise (by original template exercise ID)
  // Select raw array from store (referentially stable), filter with useMemo to avoid infinite loop
  const allSets = useWorkoutStore(state => state.session?.sets);
  const sets = useMemo(
    () => allSets?.filter(s => s.original_exercise_id === templateExercise.exercise_id) ?? [],
    [allSets, templateExercise.exercise_id]
  );

  const handleSaveSet = (
    data: { weight_kg: number | null; reps: number | null; rir: number | null },
    index: number
  ) => {
    // Auto-save on blur
    updateSet(actualExerciseId, templateExercise.exercise_id, index, data);

    // Trigger rest timer if set has valid data
    if (data.weight_kg !== null && data.reps !== null && onSetComplete) {
      onSetComplete();
    }
  };

  const handleRemoveRow = (index: number) => {
    removeSetsByExercise(templateExercise.exercise_id, index);
  };

  const exerciseName = exercise?.name ?? 'Unknown Exercise';

  // Determine template set count (use suggested_sets from template, default to 3)
  const templateSetCount = templateExercise.suggested_sets ?? 3;

  return (
    <div className="space-y-6">
      {/* Exercise header */}
      <div className="text-center">
        <div className="text-xs text-zinc-500 mb-1">
          Exercise {exerciseIndex + 1} of {totalExercises}
        </div>
        <div data-testid="active-exercise-name" className="text-2xl font-bold">
          {exerciseName}
          {substitutedId && <span className="text-accent text-sm ml-2">(sub)</span>}
        </div>
        {exercise?.muscle_group && (
          <div className="text-sm text-zinc-500">{exercise.muscle_group}</div>
        )}
        {/* Action buttons */}
        <div className="flex gap-2 justify-center mt-2">
          <button
            onClick={() => setShowSubstitution(true)}
            className="px-3 py-1 text-xs text-zinc-400 hover:text-accent border border-zinc-700 hover:border-accent rounded-full transition-colors"
          >
            Swap Exercise
          </button>
          <button
            onClick={() => setShowHistory(true)}
            className="px-3 py-1 text-xs text-zinc-400 hover:text-blue-400 border border-zinc-700 hover:border-blue-400 rounded-full transition-colors"
          >
            History
          </button>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="flex gap-1 justify-center">
        {Array.from({ length: totalExercises }).map((_, i) => (
          <div
            key={i}
            className={`h-1 w-8 rounded-full ${
              i < exerciseIndex ? 'bg-accent' :
              i === exerciseIndex ? 'bg-accent/50' :
              'bg-zinc-700'
            }`}
          />
        ))}
      </div>

      {/* Set grid - card-based batch logging */}
      {session && (
        <SetGrid
          exerciseId={actualExerciseId}
          originalExerciseId={templateExercise.exercise_id}
          templateSetCount={templateSetCount}
          gymId={session.gym_id}
          sets={sets}
          onSaveSet={handleSaveSet}
          onRemoveRow={handleRemoveRow}
        />
      )}

      {/* Navigation */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={onPrev}
          disabled={exerciseIndex === 0}
          className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors disabled:opacity-30"
        >
          Previous
        </button>
        <button
          onClick={onNext}
          disabled={exerciseIndex === totalExercises - 1}
          className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors disabled:opacity-30"
        >
          Next
        </button>
      </div>

      {/* Substitution modal */}
      {showSubstitution && (
        <ExerciseSubstitution
          originalExerciseId={templateExercise.exercise_id}
          originalExerciseName={exercises.find(e => e.exercise_id === templateExercise.exercise_id)?.name ?? 'Unknown'}
          replacementExerciseId={templateExercise.replacement_exercise_id}
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
                exerciseId={templateExercise.exercise_id}
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
