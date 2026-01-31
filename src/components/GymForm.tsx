import { useState } from 'react';
import type { Gym } from '../types/database';

interface GymFormProps {
  gym?: Gym | null;
  onSubmit: (data: GymFormData) => Promise<void>;
  onCancel: () => void;
}

export interface GymFormData {
  name: string;
  location: string | null;
}

export function GymForm({ gym, onSubmit, onCancel }: GymFormProps) {
  const [name, setName] = useState(gym?.name ?? '');
  const [location, setLocation] = useState(gym?.location ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!gym;

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
        location: location.trim() || null,
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
            {isEditing ? 'Edit Gym' : 'Add Gym'}
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
                placeholder="Downtown Fitness"
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="location" className="block text-xs font-mono uppercase tracking-widest text-text-muted mb-2">
                Location <span className="text-text-muted">(optional)</span>
              </label>
              <input
                type="text"
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-transparent border-b border-border-secondary pb-2 text-text-primary focus:outline-none focus:border-accent transition-colors"
                placeholder="123 Main Street"
              />
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
                {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Add Gym'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
