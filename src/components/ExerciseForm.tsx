import { useState } from 'react';
import { MUSCLE_GROUPS, type MuscleGroup } from '../types/events';
import type { Exercise } from '../types/database';

interface ExerciseFormProps {
  exercise?: Exercise | null;
  onSubmit: (data: ExerciseFormData) => Promise<void>;
  onCancel: () => void;
}

export interface ExerciseFormData {
  name: string;
  muscle_group: MuscleGroup;
  is_global: boolean;
}

export function ExerciseForm({ exercise, onSubmit, onCancel }: ExerciseFormProps) {
  const [name, setName] = useState(exercise?.name ?? '');
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>(
    (exercise?.muscle_group as MuscleGroup) ?? 'Chest'
  );
  const [isGlobal, setIsGlobal] = useState(exercise?.is_global ?? true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!exercise;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        name: name.trim(),
        muscle_group: muscleGroup,
        is_global: isGlobal,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-bg-secondary border border-border-primary">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-6">
            {isEditing ? 'Edit Exercise' : 'Add Exercise'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-xs font-mono uppercase tracking-widest text-text-muted mb-2">
                Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-transparent border-b border-border-secondary pb-2 text-text-primary focus:outline-none focus:border-accent transition-colors"
                placeholder="Bench Press"
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="muscleGroup" className="block text-xs font-mono uppercase tracking-widest text-text-muted mb-2">
                Muscle Group
              </label>
              <select
                id="muscleGroup"
                value={muscleGroup}
                onChange={(e) => setMuscleGroup(e.target.value as MuscleGroup)}
                className="w-full bg-transparent border-b border-border-secondary pb-2 text-text-primary focus:outline-none focus:border-accent transition-colors cursor-pointer"
              >
                {MUSCLE_GROUPS.map((group) => (
                  <option key={group} value={group} className="bg-bg-secondary">
                    {group}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-text-muted mb-3">
                Weight Tracking
              </label>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setIsGlobal(true)}
                  className={`flex-1 py-3 text-sm font-medium border transition-colors ${
                    isGlobal
                      ? 'border-border-secondary text-text-primary bg-bg-tertiary'
                      : 'border-border-primary text-text-muted hover:text-text-secondary'
                  }`}
                >
                  Global
                  <span className="block text-xs font-normal text-text-muted mt-0.5">
                    Same everywhere
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsGlobal(false)}
                  className={`flex-1 py-3 text-sm font-medium border transition-colors ${
                    !isGlobal
                      ? 'border-accent text-accent bg-orange-950/30'
                      : 'border-border-primary text-text-muted hover:text-text-secondary'
                  }`}
                >
                  Per-Gym
                  <span className="block text-xs font-normal text-text-muted mt-0.5">
                    Different per gym
                  </span>
                </button>
              </div>
            </div>

            {error && (
              <p className="text-error text-sm">{error}</p>
            )}

            <div className="flex justify-end gap-4 pt-4">
              <button
                type="button"
                onClick={onCancel}
                disabled={isSubmitting}
                className="text-sm text-text-muted hover:text-text-primary transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="text-sm font-medium text-accent hover:text-accent/80 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Add Exercise'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
