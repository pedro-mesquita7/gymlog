import { useState, useEffect } from 'react';
import { MUSCLE_GROUPS, type MuscleGroup } from '../types/events';
import type { Exercise, Gym } from '../types/database';

interface ExerciseFormProps {
  exercise?: Exercise | null;
  gyms: Gym[];
  onSubmit: (data: ExerciseFormData) => Promise<void>;
  onCancel: () => void;
}

export interface ExerciseFormData {
  name: string;
  muscle_group: MuscleGroup;
  is_global: boolean;
  gym_id: string | null;
}

export function ExerciseForm({ exercise, gyms, onSubmit, onCancel }: ExerciseFormProps) {
  const [name, setName] = useState(exercise?.name ?? '');
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>(
    (exercise?.muscle_group as MuscleGroup) ?? 'Chest'
  );
  const [isGlobal, setIsGlobal] = useState(exercise?.is_global ?? true);
  const [gymId, setGymId] = useState<string | null>(exercise?.gym_id ?? null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!exercise;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Exercise name is required');
      return;
    }

    if (!isGlobal && !gymId) {
      setError('Please select a gym for gym-specific exercises');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        name: name.trim(),
        muscle_group: muscleGroup,
        is_global: isGlobal,
        gym_id: isGlobal ? null : gymId,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save exercise');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {isEditing ? 'Edit Exercise' : 'New Exercise'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Exercise Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Bench Press"
              autoFocus
            />
          </div>

          {/* Muscle Group */}
          <div>
            <label htmlFor="muscleGroup" className="block text-sm font-medium text-gray-700 mb-1">
              Primary Muscle Group
            </label>
            <select
              id="muscleGroup"
              value={muscleGroup}
              onChange={(e) => setMuscleGroup(e.target.value as MuscleGroup)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {MUSCLE_GROUPS.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          </div>

          {/* Global vs Gym-Specific */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Exercise Type
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={isGlobal}
                  onChange={() => setIsGlobal(true)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">
                  Global (comparable across all gyms)
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={!isGlobal}
                  onChange={() => setIsGlobal(false)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">
                  Gym-specific (equipment varies)
                </span>
              </label>
            </div>
          </div>

          {/* Gym Selection (only for gym-specific) */}
          {!isGlobal && (
            <div>
              <label htmlFor="gym" className="block text-sm font-medium text-gray-700 mb-1">
                Associated Gym
              </label>
              {gyms.length === 0 ? (
                <p className="text-sm text-yellow-600">
                  No gyms available. Create a gym first before adding gym-specific exercises.
                </p>
              ) : (
                <select
                  id="gym"
                  value={gymId ?? ''}
                  onChange={(e) => setGymId(e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a gym...</option>
                  {gyms.map((gym) => (
                    <option key={gym.gym_id} value={gym.gym_id}>
                      {gym.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded text-sm">{error}</div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
