import { useWorkoutStore, selectSetsForExercise } from '../../stores/useWorkoutStore';
import { SetLogger } from './SetLogger';
import type { TemplateExercise } from '../../types/template';
import type { Exercise } from '../../types/database';

interface ExerciseViewProps {
  templateExercise: TemplateExercise;
  exercise: Exercise | undefined;  // Looked up from exercises list
  exerciseIndex: number;
  totalExercises: number;
  onPrev: () => void;
  onNext: () => void;
}

export function ExerciseView({
  templateExercise,
  exercise,
  exerciseIndex,
  totalExercises,
  onPrev,
  onNext,
}: ExerciseViewProps) {
  const session = useWorkoutStore(state => state.session);
  const logSet = useWorkoutStore(state => state.logSet);
  const removeSet = useWorkoutStore(state => state.removeSet);

  // Get substituted exercise ID if any
  const substitutedId = session?.exerciseSubstitutions[templateExercise.exercise_id];
  const actualExerciseId = substitutedId ?? templateExercise.exercise_id;

  // Get sets for this exercise (by original template exercise ID)
  const sets = useWorkoutStore(selectSetsForExercise(templateExercise.exercise_id));

  const handleLogSet = (data: { weight_kg: number; reps: number; rir: number | null }) => {
    logSet(actualExerciseId, templateExercise.exercise_id, data);
  };

  const exerciseName = exercise?.name ?? 'Unknown Exercise';

  return (
    <div className="space-y-6">
      {/* Exercise header */}
      <div className="text-center">
        <div className="text-xs text-zinc-500 mb-1">
          Exercise {exerciseIndex + 1} of {totalExercises}
        </div>
        <h2 className="text-2xl font-bold">{exerciseName}</h2>
        {exercise?.muscle_group && (
          <div className="text-sm text-zinc-500">{exercise.muscle_group}</div>
        )}
        {substitutedId && (
          <div className="text-xs text-accent mt-1">Substituted</div>
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
              'bg-zinc-700'
            }`}
          />
        ))}
      </div>

      {/* Set logger */}
      <SetLogger
        exerciseId={actualExerciseId}
        originalExerciseId={templateExercise.exercise_id}
        targetRepsMin={templateExercise.target_reps_min}
        targetRepsMax={templateExercise.target_reps_max}
        onLogSet={handleLogSet}
      />

      {/* Logged sets list */}
      {sets.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm text-zinc-400 font-medium">
            Sets logged ({sets.length})
          </div>
          {sets.map((set, i) => (
            <div
              key={set.set_id}
              className="flex items-center justify-between bg-zinc-800/50 rounded-lg px-4 py-3"
            >
              <div className="flex items-center gap-4">
                <span className="text-zinc-500 text-sm w-8">#{i + 1}</span>
                <span className="font-medium">{set.weight_kg} kg</span>
                <span className="text-zinc-400">x {set.reps}</span>
                {set.rir !== null && (
                  <span className="text-zinc-500 text-sm">RIR {set.rir}</span>
                )}
              </div>
              <button
                onClick={() => removeSet(set.set_id)}
                className="text-zinc-500 hover:text-red-400 p-1"
                title="Remove set"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
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
    </div>
  );
}
