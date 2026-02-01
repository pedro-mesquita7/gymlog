import { useState, useEffect } from 'react';
import { useSwipeable } from 'react-swipeable';
import { useWorkoutStore } from '../../stores/useWorkoutStore';
import { ExerciseView } from './ExerciseView';
import { WorkoutComplete } from './WorkoutComplete';
import { RestTimer } from './RestTimer';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { FeatureErrorBoundary } from '../ui/FeatureErrorBoundary';
import type { Template } from '../../types/template';
import type { Exercise } from '../../types/database';

interface ActiveWorkoutProps {
  template: Template;
  exercises: Exercise[];  // For name lookup
  onFinish: () => void;
  onCancel: () => void;
}

export function ActiveWorkout({ template, exercises, onFinish, onCancel }: ActiveWorkoutProps) {
  const session = useWorkoutStore(state => state.session);
  const currentIndex = useWorkoutStore(state => state.session?.current_exercise_index ?? 0);
  const setCurrentExerciseIndex = useWorkoutStore(state => state.setCurrentExerciseIndex);
  const completeWorkout = useWorkoutStore(state => state.completeWorkout);
  const cancelWorkout = useWorkoutStore(state => state.cancelWorkout);

  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [restTimerTrigger, setRestTimerTrigger] = useState(0);

  const templateExercises = template.exercises;
  const totalExercises = templateExercises.length;

  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentExerciseIndex(currentIndex - 1);
    }
  };

  const goToNext = () => {
    if (currentIndex < totalExercises - 1) {
      setCurrentExerciseIndex(currentIndex + 1);
    }
  };

  const handleSetComplete = () => {
    // Trigger rest timer by incrementing counter
    setRestTimerTrigger(prev => prev + 1);
  };

  const handleFinishWorkout = () => {
    setShowCompleteDialog(true);
  };

  const handleCancelWorkout = () => {
    setShowCancelDialog(true);
  };

  const confirmCancelWorkout = () => {
    cancelWorkout();
    onCancel();
  };

  // Swipe handlers
  const swipeHandlers = useSwipeable({
    onSwipedLeft: goToNext,
    onSwipedRight: goToPrev,
    trackMouse: false,  // Touch only for workout
    preventScrollOnSwipe: true,
  });

  if (!session) return null;

  // Main workout view
  const currentTemplateExercise = templateExercises[currentIndex];
  const substitutedId = session.exerciseSubstitutions[currentTemplateExercise.exercise_id];
  const actualExerciseId = substitutedId ?? currentTemplateExercise.exercise_id;

  // Look up exercise (check custom exercises first, then library)
  const exerciseData = session.customExercises[actualExerciseId]
    ? { exercise_id: actualExerciseId, name: session.customExercises[actualExerciseId], muscle_group: '', is_global: true }
    : exercises.find(e => e.exercise_id === actualExerciseId);

  // Calculate workout stats for completion dialog
  const totalSets = session.sets.length;

  // Check for partial sets (weight but no reps, or vice versa)
  // Note: Sets in store are already complete, so this is for future enhancement
  const partialSets: Array<{ exerciseName: string; issue: string }> = [];

  return (
    <div {...swipeHandlers} className="min-h-[60vh]">
      {/* Rest timer banner - sticky at top */}
      <RestTimer
        restSeconds={currentTemplateExercise.rest_seconds}
        autoStartTrigger={restTimerTrigger}
      />

      {/* Workout header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-sm text-text-muted">Workout</div>
          <div className="font-semibold">{template.name}</div>
        </div>
        <div className="text-right">
          <div className="text-sm text-text-muted">Duration</div>
          <WorkoutTimer startedAt={session.started_at} />
        </div>
      </div>

      {/* Exercise view */}
      <FeatureErrorBoundary feature="Set Logger" key={actualExerciseId}>
        <ExerciseView
          templateExercise={currentTemplateExercise}
          exercise={exerciseData}
          exercises={exercises}
          exerciseIndex={currentIndex}
          totalExercises={totalExercises}
          onPrev={goToPrev}
          onNext={goToNext}
          onSetComplete={handleSetComplete}
        />
      </FeatureErrorBoundary>

      {/* Finish/Cancel buttons */}
      <div className="flex gap-3 mt-8 pt-6 border-t border-border-primary">
        <Button
          variant="secondary"
          size="md"
          onClick={handleCancelWorkout}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          data-testid="btn-finish-workout"
          variant="primary"
          size="md"
          onClick={handleFinishWorkout}
          className="flex-1 bg-success hover:bg-success/90"
        >
          Finish Workout
        </Button>
      </div>

      {/* Completion dialog */}
      <Dialog
        isOpen={showCompleteDialog}
        onClose={() => setShowCompleteDialog(false)}
        title="Workout Complete"
      >
        <WorkoutComplete
          session={session}
          template={template}
          exercises={exercises}
          partialSets={partialSets}
          onSaved={() => {
            completeWorkout();
            onFinish();
          }}
          onCancel={() => setShowCompleteDialog(false)}
        />
      </Dialog>

      {/* Cancel confirmation dialog */}
      <Dialog
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        title="Cancel Workout?"
      >
        <div className="space-y-4">
          <p className="text-text-primary">
            This will discard your workout progress. {totalSets} set{totalSets !== 1 ? 's' : ''} will be lost.
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              size="md"
              onClick={() => setShowCancelDialog(false)}
              className="flex-1"
            >
              Go Back
            </Button>
            <Button
              variant="danger"
              size="md"
              onClick={confirmCancelWorkout}
              className="flex-1"
            >
              Cancel Workout
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

// Simple workout timer display
function WorkoutTimer({ startedAt }: { startedAt: string }) {
  const [, setTick] = useState(0);

  // Update every second
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const start = new Date(startedAt).getTime();
  const now = Date.now();
  const diffSeconds = Math.floor((now - start) / 1000);
  const minutes = Math.floor(diffSeconds / 60);
  const seconds = diffSeconds % 60;

  return (
    <div className="font-mono">
      {minutes}:{seconds.toString().padStart(2, '0')}
    </div>
  );
}
