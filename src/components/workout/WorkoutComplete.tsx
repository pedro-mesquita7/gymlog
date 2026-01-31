import { useState } from 'react';
import { writeEvent } from '../../db/events';
import { useBackupStore } from '../../stores/useBackupStore';
import { useWorkoutStore } from '../../stores/useWorkoutStore';
import { useRotationStore } from '../../stores/useRotationStore';
import { useWorkoutSummary } from '../../hooks/useWorkoutSummary';
import { Button } from '../ui/Button';
import type { WorkoutSession } from '../../types/workout-session';
import type { Template } from '../../types/template';
import type { Exercise } from '../../types/database';
import type {
  WorkoutStartedEvent,
  SetLoggedEvent,
  WorkoutCompletedEvent,
} from '../../types/events';

interface WorkoutCompleteProps {
  session: WorkoutSession;
  template: Template;
  exercises: Exercise[];
  onSaved: () => void;
  onCancel: () => void;
  partialSets?: Array<{ exerciseName: string; issue: string }>;  // Warning for partial sets
}

export function WorkoutComplete({
  session,
  template,
  exercises,
  onSaved,
  onCancel,
  partialSets = []
}: WorkoutCompleteProps) {
  const [phase, setPhase] = useState<'review' | 'saving' | 'saved'>('review');
  const [error, setError] = useState<string | null>(null);
  const incrementWorkoutCount = useBackupStore((state) => state.incrementWorkoutCount);
  const weightUnit = useWorkoutStore((state) => state.weightUnit);

  // Calculate workout stats
  const totalSets = session.sets.length;
  const uniqueExercises = new Set(session.sets.map(s => s.original_exercise_id)).size;
  const totalVolume = session.sets.reduce((sum, s) => sum + (s.weight_kg * s.reps), 0);
  const displayVolume = weightUnit === 'lbs' ? totalVolume * 2.20462 : totalVolume;

  // Fetch PR and comparison data — enabled immediately so data is ready by save time
  const { prs, comparison, isLoading: summaryLoading } = useWorkoutSummary(
    session.sets,
    session.template_id,
    totalVolume,
    true
  );

  // Find exercises with no logged sets
  const exercisesWithSets = new Set(session.sets.map(s => s.original_exercise_id));
  const incompleteExercises = template.exercises.filter(
    te => !exercisesWithSets.has(te.exercise_id)
  );

  const getExerciseName = (exerciseId: string) =>
    exercises.find(e => e.exercise_id === exerciseId)?.name ?? 'Unknown';

  const handleSave = async () => {
    setPhase('saving');
    setError(null);

    try {
      // Write workout_started event
      await writeEvent<WorkoutStartedEvent>({
        event_type: 'workout_started',
        workout_id: session.workout_id,
        template_id: session.template_id,
        gym_id: session.gym_id,
        started_at: session.started_at,
      });

      // Write all set_logged events
      for (const set of session.sets) {
        await writeEvent<SetLoggedEvent>({
          event_type: 'set_logged',
          workout_id: session.workout_id,
          set_id: set.set_id,
          exercise_id: set.exercise_id,
          original_exercise_id: set.original_exercise_id,
          weight_kg: set.weight_kg,
          reps: set.reps,
          rir: set.rir,
        });
      }

      // Write workout_completed event
      await writeEvent<WorkoutCompletedEvent>({
        event_type: 'workout_completed',
        workout_id: session.workout_id,
        completed_at: new Date().toISOString(),
      });

      // Increment backup counter after successful save
      incrementWorkoutCount();

      // Advance rotation if active
      const activeRotationId = useRotationStore.getState().activeRotationId;
      if (activeRotationId) {
        useRotationStore.getState().advanceRotation(activeRotationId);
      }

      // Transition to saved phase to show enhanced summary
      setPhase('saved');
    } catch (err) {
      console.error('Failed to save workout:', err);
      setError(err instanceof Error ? err.message : 'Failed to save workout');
      setPhase('review');
    }
  };

  // Calculate duration
  const durationMs = Date.now() - new Date(session.started_at).getTime();
  const durationMins = Math.floor(durationMs / 60000);

  // Review/saving phase: pre-save with warnings and save button
  if (phase === 'review' || phase === 'saving') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 data-testid="workout-complete-heading" className="text-2xl font-bold mb-2">Workout Complete</h2>
          <p className="text-zinc-500">{template.name}</p>
        </div>

        {/* Stats summary */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-zinc-800/50 rounded-lg p-4">
            <div className="text-2xl font-bold text-accent">{totalSets}</div>
            <div className="text-xs text-zinc-500">Sets</div>
          </div>
          <div className="bg-zinc-800/50 rounded-lg p-4">
            <div className="text-2xl font-bold text-accent">{uniqueExercises}</div>
            <div className="text-xs text-zinc-500">Exercises</div>
          </div>
          <div className="bg-zinc-800/50 rounded-lg p-4">
            <div className="text-2xl font-bold text-accent">{durationMins}</div>
            <div className="text-xs text-zinc-500">Minutes</div>
          </div>
        </div>

        {/* Total volume */}
        <div className="text-center text-zinc-500">
          Total volume: <span className="text-zinc-300 font-medium">{Math.round(displayVolume).toLocaleString()} {weightUnit}</span>
        </div>

        {/* Warning for partial sets (incomplete data) */}
        {partialSets.length > 0 && (
          <div className="bg-yellow-600/10 border border-yellow-600/30 rounded-lg p-4">
            <div className="text-yellow-500 font-medium mb-2">
              Incomplete sets detected:
            </div>
            <ul className="text-sm text-zinc-400">
              {partialSets.map((ps, i) => (
                <li key={i}>• {ps.exerciseName}: {ps.issue}</li>
              ))}
            </ul>
            <p className="text-sm text-zinc-500 mt-2">
              Partial sets will be discarded. Go back to complete them.
            </p>
          </div>
        )}

        {/* Warning for incomplete exercises */}
        {incompleteExercises.length > 0 && (
          <div className="bg-yellow-600/10 border border-yellow-600/30 rounded-lg p-4">
            <div className="text-yellow-500 font-medium mb-2">
              {incompleteExercises.length} exercise{incompleteExercises.length !== 1 ? 's' : ''} with no sets:
            </div>
            <ul className="text-sm text-zinc-400">
              {incompleteExercises.map(te => (
                <li key={te.exercise_id}>• {getExerciseName(te.exercise_id)}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-red-600/10 border border-red-600/30 rounded-lg p-4 text-red-400">
            {error}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            data-testid="btn-go-back"
            variant="secondary"
            size="md"
            onClick={onCancel}
            disabled={phase === 'saving'}
            className="flex-1"
          >
            Go Back
          </Button>
          <Button
            data-testid="btn-save-workout"
            variant="primary"
            size="md"
            onClick={handleSave}
            disabled={phase === 'saving' || totalSets === 0}
            className="flex-1 bg-green-600 hover:bg-green-500"
          >
            {phase === 'saving' ? 'Saving...' : 'Save Workout'}
          </Button>
        </div>

        {totalSets === 0 && (
          <p data-testid="no-sets-warning" className="text-center text-sm text-zinc-500">
            Log at least one set to save this workout
          </p>
        )}
      </div>
    );
  }

  // Saved phase: enhanced summary with PRs and comparison
  const displayComparison = comparison && weightUnit === 'lbs'
    ? { ...comparison, volume_delta_kg: comparison.volume_delta_kg * 2.20462 }
    : comparison;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 data-testid="workout-saved-heading" className="text-2xl font-bold mb-2">Workout Saved!</h2>
        <p className="text-zinc-500">{template.name}</p>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="bg-zinc-800/50 rounded-lg p-4">
          <div className="text-2xl font-bold text-accent">{totalSets}</div>
          <div className="text-xs text-zinc-500">Sets</div>
        </div>
        <div className="bg-zinc-800/50 rounded-lg p-4">
          <div className="text-2xl font-bold text-accent">{uniqueExercises}</div>
          <div className="text-xs text-zinc-500">Exercises</div>
        </div>
        <div className="bg-zinc-800/50 rounded-lg p-4">
          <div className="text-2xl font-bold text-accent">{durationMins}</div>
          <div className="text-xs text-zinc-500">Minutes</div>
        </div>
      </div>

      {/* Total volume with comparison */}
      <div className="text-center">
        <div className="text-zinc-500">
          Total volume: <span className="text-zinc-300 font-medium">{Math.round(displayVolume).toLocaleString()} {weightUnit}</span>
        </div>
        {displayComparison && !summaryLoading && (
          <div className={`text-sm mt-1 ${
            displayComparison.volume_delta_kg > 0 ? 'text-green-500' :
            displayComparison.volume_delta_kg < 0 ? 'text-red-500' :
            'text-zinc-500'
          }`}>
            vs last {template.name}: {displayComparison.volume_delta_kg > 0 ? '+' : ''}{Math.round(displayComparison.volume_delta_kg).toLocaleString()} {weightUnit}
          </div>
        )}
      </div>

      {/* Personal Records section */}
      {!summaryLoading && prs.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <div className="font-bold mb-3 text-yellow-500">Personal Records</div>
          <div className="space-y-2">
            {prs.map((pr) => (
              <div key={pr.exercise_id} className="flex items-center justify-between">
                <span className="text-sm text-zinc-300">{pr.exercise_name}</span>
                <div className="flex gap-2">
                  {pr.weight_prs > 0 && (
                    <span className="bg-yellow-500 text-black text-xs px-2 py-0.5 rounded-full font-medium">
                      Weight PR
                    </span>
                  )}
                  {pr.estimated_1rm_prs > 0 && (
                    <span className="bg-yellow-500 text-black text-xs px-2 py-0.5 rounded-full font-medium">
                      Est. 1RM PR
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Done button */}
      <div className="pt-4">
        <Button
          data-testid="btn-done-workout"
          variant="primary"
          size="md"
          onClick={onSaved}
          className="w-full"
        >
          Done
        </Button>
      </div>
    </div>
  );
}
