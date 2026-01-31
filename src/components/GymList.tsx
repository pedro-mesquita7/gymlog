import { useState } from 'react';
import type { Gym } from '../types/database';
import { GymForm, type GymFormData } from './GymForm';
import { DeleteConfirmation } from './DeleteConfirmation';

interface GymListProps {
  gyms: Gym[];
  isLoading: boolean;
  onCreateGym: (data: GymFormData) => Promise<void>;
  onUpdateGym: (id: string, data: GymFormData) => Promise<void>;
  onDeleteGym: (id: string) => Promise<void>;
}

export function GymList({
  gyms,
  isLoading,
  onCreateGym,
  onUpdateGym,
  onDeleteGym,
}: GymListProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingGym, setEditingGym] = useState<Gym | null>(null);
  const [deletingGym, setDeletingGym] = useState<Gym | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  return (
    <section>
      <div className="flex items-baseline justify-between mb-6">
        <div>
          <h2 className="text-xs font-mono uppercase tracking-widest text-text-muted mb-1">
            Locations
          </h2>
          <p className="text-xl font-semibold">Your Gyms</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="text-sm font-medium text-accent hover:text-accent/80 transition-colors"
        >
          + Add
        </button>
      </div>

      {isLoading ? (
        <div className="text-text-muted text-sm">Loading...</div>
      ) : gyms.length === 0 ? (
        <div className="border border-dashed border-border-primary py-8 px-6">
          <p className="text-text-muted text-sm">No gyms added yet</p>
        </div>
      ) : (
        <div className="space-y-px">
          {gyms.map((gym) => (
            <div
              key={gym.gym_id}
              className="group flex items-center justify-between py-4 border-b border-border-primary/50 hover:bg-bg-secondary/30 -mx-3 px-3 transition-colors"
            >
              <div>
                <h3 className="font-medium">{gym.name}</h3>
                {gym.location && (
                  <p className="text-sm text-text-muted mt-0.5">{gym.location}</p>
                )}
                <p className="text-xs text-text-muted mt-0.5">
                  {gym.exercise_count} {gym.exercise_count === 1 ? 'exercise' : 'exercises'}
                </p>
              </div>

              <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setEditingGym(gym)}
                  className="text-xs text-text-muted hover:text-text-primary transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => setDeletingGym(gym)}
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
        <GymForm
          onSubmit={handleCreateSubmit}
          onCancel={() => setShowForm(false)}
        />
      )}

      {editingGym && (
        <GymForm
          gym={editingGym}
          onSubmit={handleUpdateSubmit}
          onCancel={() => setEditingGym(null)}
        />
      )}

      <DeleteConfirmation
        isOpen={!!deletingGym}
        title="Delete Gym"
        message={`Delete "${deletingGym?.name}"?${deletingGym?.exercise_count ? ` This will affect ${deletingGym.exercise_count} gym-specific exercise${deletingGym.exercise_count === 1 ? '' : 's'}.` : ''} This cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingGym(null)}
        isDeleting={isDeleting}
      />
    </section>
  );
}
