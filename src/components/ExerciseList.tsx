import { useState } from 'react';
import { MUSCLE_GROUPS } from '../types/events';
import type { Exercise } from '../types/database';
import { ExerciseForm, type ExerciseFormData } from './ExerciseForm';
import { DeleteConfirmation } from './DeleteConfirmation';

interface ExerciseListProps {
  exercises: Exercise[];
  isLoading: boolean;
  onCreateExercise: (data: ExerciseFormData) => Promise<void>;
  onUpdateExercise: (id: string, data: ExerciseFormData) => Promise<void>;
  onDeleteExercise: (id: string) => Promise<void>;
}

export function ExerciseList({
  exercises,
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
    <section>
      <div className="flex items-baseline justify-between mb-6">
        <div>
          <h2 className="text-xs font-mono uppercase tracking-widest text-text-muted mb-1">
            Library
          </h2>
          <p className="text-xl font-semibold">Exercises</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="text-sm font-medium text-accent hover:text-accent/80 transition-colors"
        >
          + Add
        </button>
      </div>

      {/* Filter */}
      <div className="mb-6">
        <select
          value={filterMuscleGroup}
          onChange={(e) => setFilterMuscleGroup(e.target.value)}
          className="bg-transparent border border-border-primary px-3 py-2 text-sm text-text-secondary focus:outline-none focus:border-border-secondary"
        >
          <option value="" className="bg-bg-secondary">All muscles</option>
          {MUSCLE_GROUPS.map((group) => (
            <option key={group} value={group} className="bg-bg-secondary">
              {group}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="text-text-muted text-sm">Loading exercises...</div>
      ) : filteredExercises.length === 0 ? (
        <div className="border border-dashed border-border-primary py-8 px-6">
          <p className="text-text-muted text-sm">
            {exercises.length === 0
              ? 'No exercises added yet'
              : 'No exercises match this filter'}
          </p>
        </div>
      ) : (
        <div className="space-y-px">
          {filteredExercises.map((exercise) => (
            <div
              key={exercise.exercise_id}
              className="group flex items-center justify-between py-4 border-b border-border-primary/50 hover:bg-bg-secondary/30 -mx-3 px-3 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-1 h-8 ${
                    exercise.is_global ? 'bg-bg-elevated' : 'bg-accent'
                  }`}
                />
                <div>
                  <h3 className="font-medium">{exercise.name}</h3>
                  <p className="text-sm text-text-muted mt-0.5">
                    {exercise.muscle_group}
                    <span className="mx-2 text-border-primary">·</span>
                    <span className={exercise.is_global ? 'text-text-muted' : 'text-accent'}>
                      {exercise.is_global ? 'Global' : 'Per-gym'}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setEditingExercise(exercise)}
                  className="text-xs text-text-muted hover:text-text-primary transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => setDeletingExercise(exercise)}
                  className="text-xs text-text-muted hover:text-error transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <ExerciseForm
          onSubmit={handleCreateSubmit}
          onCancel={() => setShowForm(false)}
        />
      )}

      {editingExercise && (
        <ExerciseForm
          exercise={editingExercise}
          onSubmit={handleUpdateSubmit}
          onCancel={() => setEditingExercise(null)}
        />
      )}

      <DeleteConfirmation
        isOpen={!!deletingExercise}
        title="Delete Exercise"
        message={`Delete "${deletingExercise?.name}"? This cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingExercise(null)}
        isDeleting={isDeleting}
      />
    </section>
  );
}
