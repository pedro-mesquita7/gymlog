import { useState, useEffect } from 'react';
import { useSwipeable } from 'react-swipeable';
import { useWorkoutStore } from '../../stores/useWorkoutStore';
import { ExerciseView } from './ExerciseView';
import { WorkoutComplete } from './WorkoutComplete';
import { DeleteConfirmation } from '../DeleteConfirmation';
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

  const [view, setView] = useState<'workout' | 'complete'>('workout');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

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

  // Swipe handlers
  const swipeHandlers = useSwipeable({
    onSwipedLeft: goToNext,
    onSwipedRight: goToPrev,
    trackMouse: false,  // Touch only for workout
    preventScrollOnSwipe: true,
  });

  if (!session) return null;

  // Show complete view
  if (view === 'complete') {
    return (
      <WorkoutComplete
        session={session}
        template={template}
        exercises={exercises}
        onSaved={() => {
          completeWorkout();
          onFinish();
        }}
        onCancel={() => setView('workout')}
      />
    );
  }

  // Main workout view
  const currentTemplateExercise = templateExercises[currentIndex];
  const substitutedId = session.exerciseSubstitutions[currentTemplateExercise.exercise_id];
  const actualExerciseId = substitutedId ?? currentTemplateExercise.exercise_id;

  // Look up exercise (check custom exercises first, then library)
  const exerciseData = session.customExercises[actualExerciseId]
    ? { exercise_id: actualExerciseId, name: session.customExercises[actualExerciseId], muscle_group: '', is_global: true }
    : exercises.find(e => e.exercise_id === actualExerciseId);

  return (
    <div {...swipeHandlers} className="min-h-[60vh]">
      {/* Workout header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-sm text-zinc-500">Workout</div>
          <div className="font-semibold">{template.name}</div>
        </div>
        <div className="text-right">
          <div className="text-sm text-zinc-500">Duration</div>
          <WorkoutTimer startedAt={session.started_at} />
        </div>
      </div>

      {/* Exercise view */}
      <ExerciseView
        templateExercise={currentTemplateExercise}
        exercise={exerciseData}
        exercises={exercises}
        exerciseIndex={currentIndex}
        totalExercises={totalExercises}
        onPrev={goToPrev}
        onNext={goToNext}
      />

      {/* Finish/Cancel buttons */}
      <div className="flex gap-3 mt-8 pt-6 border-t border-zinc-800">
        <button
          onClick={() => setShowCancelConfirm(true)}
          className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => setView('complete')}
          className="flex-1 py-3 bg-green-600 hover:bg-green-500 font-medium rounded-lg transition-colors"
        >
          Finish Workout
        </button>
      </div>

      {/* Cancel confirmation - uses isOpen prop to control visibility */}
      <DeleteConfirmation
        isOpen={showCancelConfirm}
        title="Cancel Workout?"
        message={`This will discard your workout progress. ${session.sets.length} set${session.sets.length !== 1 ? 's' : ''} will be lost.`}
        onConfirm={() => {
          cancelWorkout();
          onCancel();
        }}
        onCancel={() => setShowCancelConfirm(false)}
      />
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
