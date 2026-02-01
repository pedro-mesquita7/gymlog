import { useState } from 'react';
import { uuidv7 } from 'uuidv7';
import { useWorkoutStore } from '../../stores/useWorkoutStore';
import type { Exercise } from '../../types/database';

interface ExerciseSubstitutionProps {
  originalExerciseId: string;
  originalExerciseName: string;
  replacementExerciseId: string | null;  // Predefined replacement from template
  exercises: Exercise[];  // Full exercise library
  onClose: () => void;
}

export function ExerciseSubstitution({
  originalExerciseId,
  originalExerciseName,
  replacementExerciseId,
  exercises,
  onClose,
}: ExerciseSubstitutionProps) {
  const session = useWorkoutStore(state => state.session);
  const substituteExercise = useWorkoutStore(state => state.substituteExercise);
  const revertSubstitution = useWorkoutStore(state => state.revertSubstitution);
  const addCustomExercise = useWorkoutStore(state => state.addCustomExercise);

  const [showCustom, setShowCustom] = useState(false);
  const [customName, setCustomName] = useState('');

  const currentSubstitution = session?.exerciseSubstitutions[originalExerciseId];
  const replacementExercise = replacementExerciseId
    ? exercises.find(e => e.exercise_id === replacementExerciseId)
    : null;

  const handleSelectReplacement = (exerciseId: string) => {
    substituteExercise(originalExerciseId, exerciseId);
    onClose();
  };

  const handleRevert = () => {
    revertSubstitution(originalExerciseId);
    onClose();
  };

  const handleAddCustom = () => {
    if (!customName.trim()) return;
    const customId = uuidv7();
    addCustomExercise(customId, customName.trim());
    substituteExercise(originalExerciseId, customId);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
      <div className="bg-bg-secondary rounded-t-2xl w-full max-w-lg max-h-[70vh] overflow-hidden">
        <div className="p-4 border-b border-border-primary flex items-center justify-between">
          <h3 className="font-semibold">Substitute Exercise</h3>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto max-h-[50vh]">
          {/* Current selection */}
          <div className="text-sm text-text-muted">
            Original: <span className="text-text-primary">{originalExerciseName}</span>
            {currentSubstitution && (
              <span className="text-accent ml-2">(substituted)</span>
            )}
          </div>

          {/* Revert option */}
          {currentSubstitution && (
            <button
              onClick={handleRevert}
              className="w-full p-3 bg-bg-tertiary hover:bg-bg-elevated rounded-xl text-left transition-colors"
            >
              <div className="font-medium">Revert to Original</div>
              <div className="text-sm text-text-muted">{originalExerciseName}</div>
            </button>
          )}

          {/* Predefined replacement */}
          {replacementExercise && (
            <div>
              <div className="text-xs text-text-muted mb-2">Suggested Replacement</div>
              <button
                onClick={() => handleSelectReplacement(replacementExercise.exercise_id)}
                className="w-full p-3 bg-accent/10 border border-accent/30 hover:bg-accent/20 rounded-xl text-left transition-colors"
              >
                <div className="font-medium">{replacementExercise.name}</div>
                <div className="text-sm text-text-muted">{replacementExercise.muscle_group}</div>
              </button>
            </div>
          )}

          {/* Other exercises from library */}
          <div>
            <div className="text-xs text-text-muted mb-2">From Exercise Library</div>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {exercises
                .filter(e => e.exercise_id !== originalExerciseId && e.exercise_id !== replacementExerciseId)
                .map(exercise => (
                  <button
                    key={exercise.exercise_id}
                    onClick={() => handleSelectReplacement(exercise.exercise_id)}
                    className="w-full p-2 bg-bg-tertiary/50 hover:bg-bg-elevated rounded-xl text-left text-sm transition-colors"
                  >
                    <span className="font-medium">{exercise.name}</span>
                    <span className="text-text-muted ml-2">{exercise.muscle_group}</span>
                  </button>
                ))}
            </div>
          </div>

          {/* Custom one-off exercise */}
          <div>
            <div className="text-xs text-text-muted mb-2">Or add custom (one-time only)</div>
            {showCustom ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Exercise name"
                  className="flex-1 bg-bg-tertiary border border-border-primary rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  autoFocus
                />
                <button
                  onClick={handleAddCustom}
                  disabled={!customName.trim()}
                  className="px-4 py-2 bg-accent hover:bg-accent/90 text-black text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowCustom(true)}
                className="w-full p-2 bg-bg-tertiary/50 hover:bg-bg-elevated rounded-xl text-sm text-text-secondary transition-colors"
              >
                + Add custom exercise
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
