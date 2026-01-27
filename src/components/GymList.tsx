import { useState } from 'react';
import type { Gym, Exercise } from '../types/database';
import { GymForm, type GymFormData } from './GymForm';
import { DeleteConfirmation } from './DeleteConfirmation';

interface GymListProps {
  gyms: Gym[];
  exercises: Exercise[];
  isLoading: boolean;
  onCreateGym: (data: GymFormData) => Promise<void>;
  onUpdateGym: (id: string, data: GymFormData) => Promise<void>;
  onDeleteGym: (id: string) => Promise<void>;
}

export function GymList({
  gyms,
  exercises,
  isLoading,
  onCreateGym,
  onUpdateGym,
  onDeleteGym,
}: GymListProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingGym, setEditingGym] = useState<Gym | null>(null);
  const [deletingGym, setDeletingGym] = useState<Gym | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Count exercises associated with each gym
  const getExerciseCount = (gymId: string) => {
    return exercises.filter((e) => e.gym_id === gymId).length;
  };

  const handleCreateSubmit = async (data: GymFormData) => {
    await onCreateGym(data);
    setShowForm(false);
  };

  const handleUpdateSubmit = async (data: GymFormData) => {
    if (editingGym) {
      await onUpdateGym(editingGym.gym_id, data);
      setEditingGym(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (deletingGym) {
      setIsDeleting(true);
      try {
        await onDeleteGym(deletingGym.gym_id);
      } finally {
        setIsDeleting(false);
        setDeletingGym(null);
      }
    }
  };

  // Check if gym has associated exercises
  const getDeleteWarning = (gym: Gym): string => {
    const exerciseCount = getExerciseCount(gym.gym_id);
    if (exerciseCount > 0) {
      return `This gym has ${exerciseCount} associated exercise(s). Deleting it will not remove those exercises, but they will no longer be associated with any gym.`;
    }
    return `Are you sure you want to delete "${gym.name}"? This action cannot be undone.`;
  };

  return (
    <div className="bg-white shadow rounded-lg">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Gyms</h2>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
          >
            + Add Gym
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Loading gyms...</div>
        ) : gyms.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No gyms yet. Add your first gym to get started!
          </div>
        ) : (
          <div className="space-y-2">
            {gyms.map((gym) => {
              const exerciseCount = getExerciseCount(gym.gym_id);
              return (
                <div
                  key={gym.gym_id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100"
                >
                  <div>
                    <div className="font-medium text-gray-900">{gym.name}</div>
                    <div className="text-sm text-gray-500">
                      {gym.location && <span>{gym.location}</span>}
                      {!gym.location && <span className="italic">No location</span>}
                      <span className="mx-2">·</span>
                      <span>
                        {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingGym(gym)}
                      className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeletingGym(gym)}
                      className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Form */}
      {showForm && (
        <GymForm
          onSubmit={handleCreateSubmit}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Edit Form */}
      {editingGym && (
        <GymForm
          gym={editingGym}
          onSubmit={handleUpdateSubmit}
          onCancel={() => setEditingGym(null)}
        />
      )}

      {/* Delete Confirmation */}
      <DeleteConfirmation
        isOpen={!!deletingGym}
        title="Delete Gym"
        message={deletingGym ? getDeleteWarning(deletingGym) : ''}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingGym(null)}
        isDeleting={isDeleting}
      />
    </div>
  );
}
