import { useState } from 'react';
import { writeEvent } from '../../db/events';
import { useBackupStore } from '../../stores/useBackupStore';
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
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const incrementWorkoutCount = useBackupStore((state) => state.incrementWorkoutCount);

  // Calculate workout stats
  const totalSets = session.sets.length;
  const uniqueExercises = new Set(session.sets.map(s => s.original_exercise_id)).size;
  const totalVolume = session.sets.reduce((sum, s) => sum + (s.weight_kg * s.reps), 0);

  // Find exercises with no logged sets
  const exercisesWithSets = new Set(session.sets.map(s => s.original_exercise_id));
  const incompleteExercises = template.exercises.filter(
    te => !exercisesWithSets.has(te.exercise_id)
  );

  const getExerciseName = (exerciseId: string) =>
    exercises.find(e => e.exercise_id === exerciseId)?.name ?? 'Unknown';

  const handleSave = async () => {
    setIsSaving(true);
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

      onSaved();
    } catch (err) {
      console.error('Failed to save workout:', err);
      setError(err instanceof Error ? err.message : 'Failed to save workout');
      setIsSaving(false);
    }
  };

  // Calculate duration
  const durationMs = Date.now() - new Date(session.started_at).getTime();
  const durationMins = Math.floor(durationMs / 60000);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Workout Complete</h2>
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
        Total volume: <span className="text-zinc-300 font-medium">{totalVolume.toLocaleString()} kg</span>
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
          variant="secondary"
          size="md"
          onClick={onCancel}
          disabled={isSaving}
          className="flex-1"
        >
          Go Back
        </Button>
        <Button
          variant="primary"
          size="md"
          onClick={handleSave}
          disabled={isSaving || totalSets === 0}
          className="flex-1 bg-green-600 hover:bg-green-500"
        >
          {isSaving ? 'Saving...' : 'Save Workout'}
        </Button>
      </div>

      {totalSets === 0 && (
        <p className="text-center text-sm text-zinc-500">
          Log at least one set to save this workout
        </p>
      )}
    </div>
  );
}
