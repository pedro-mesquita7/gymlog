import { useState } from 'react';
import { MUSCLE_GROUPS } from '../types/events';
import type { Exercise, Gym } from '../types/database';
import { ExerciseForm, type ExerciseFormData } from './ExerciseForm';
import { DeleteConfirmation } from './DeleteConfirmation';

interface ExerciseListProps {
  exercises: Exercise[];
  gyms: Gym[];
  isLoading: boolean;
  onCreateExercise: (data: ExerciseFormData) => Promise<void>;
  onUpdateExercise: (id: string, data: ExerciseFormData) => Promise<void>;
  onDeleteExercise: (id: string) => Promise<void>;
}

export function ExerciseList({
  exercises,
  gyms,
  isLoading,
  onCreateExercise,
  onUpdateExercise,
  onDeleteExercise,
}: ExerciseListProps) {
  const [filterMuscleGroup, setFilterMuscleGroup] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [deletingExercise, setDeletingExercise] = useState<Exercise | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredExercises = filterMuscleGroup
    ? exercises.filter((e) => e.muscle_group === filterMuscleGroup)
    : exercises;

  const getGymName = (gymId: string | null) => {
    if (!gymId) return null;
    return gyms.find((g) => g.gym_id === gymId)?.name ?? 'Unknown Gym';
  };

  const handleCreateSubmit = async (data: ExerciseFormData) => {
    await onCreateExercise(data);
    setShowForm(false);
  };

  const handleUpdateSubmit = async (data: ExerciseFormData) => {
    if (editingExercise) {
      await onUpdateExercise(editingExercise.exercise_id, data);
      setEditingExercise(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (deletingExercise) {
      setIsDeleting(true);
      try {
        await onDeleteExercise(deletingExercise.exercise_id);
      } finally {
        setIsDeleting(false);
        setDeletingExercise(null);
      }
    }
  };

  return (
    <div className="bg-white shadow rounded-lg">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-lg font-semibold text-gray-900">Exercises</h2>

          <div className="flex flex-col sm:flex-row gap-2">
            {/* Filter */}
            <select
              value={filterMuscleGroup}
              onChange={(e) => setFilterMuscleGroup(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Muscle Groups</option>
              {MUSCLE_GROUPS.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>

            {/* Add Button */}
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
            >
              + Add Exercise
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Loading exercises...</div>
        ) : filteredExercises.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {exercises.length === 0
              ? 'No exercises yet. Create your first exercise!'
              : 'No exercises match the selected filter.'}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredExercises.map((exercise) => (
              <div
                key={exercise.exercise_id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100"
              >
                <div>
                  <div className="font-medium text-gray-900">{exercise.name}</div>
                  <div className="text-sm text-gray-500">
                    {exercise.muscle_group}
                    {exercise.is_global ? (
                      <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                        Global
                      </span>
                    ) : (
                      <span className="ml-2 px-2 py-0.5 bg-gray-200 text-gray-600 rounded text-xs">
                        {getGymName(exercise.gym_id)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingExercise(exercise)}
                    className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeletingExercise(exercise)}
                    className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Form */}
      {showForm && (
        <ExerciseForm
          gyms={gyms}
          onSubmit={handleCreateSubmit}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Edit Form */}
      {editingExercise && (
        <ExerciseForm
          exercise={editingExercise}
          gyms={gyms}
          onSubmit={handleUpdateSubmit}
          onCancel={() => setEditingExercise(null)}
        />
      )}

      {/* Delete Confirmation */}
      <DeleteConfirmation
        isOpen={!!deletingExercise}
        title="Delete Exercise"
        message={`Are you sure you want to delete "${deletingExercise?.name}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingExercise(null)}
        isDeleting={isDeleting}
      />
    </div>
  );
}
