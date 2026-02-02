import { useState } from 'react';
import { useRotationStore } from '../../stores/useRotationStore';
import { usePlans } from '../../hooks/usePlans';

import { RotationEditor } from '../rotation/RotationEditor';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export function RotationSection() {
  const { activePlans } = usePlans();
  const rotations = useRotationStore((state) => state.rotations);
  const activeRotationId = useRotationStore((state) => state.activeRotationId);
  const createRotation = useRotationStore((state) => state.createRotation);
  const updateRotation = useRotationStore((state) => state.updateRotation);
  const deleteRotation = useRotationStore((state) => state.deleteRotation);
  const setActiveRotation = useRotationStore((state) => state.setActiveRotation);
  const resetPosition = useRotationStore((state) => state.resetPosition);

  const [newRotationName, setNewRotationName] = useState('');
  const [selectedPlanIds, setSelectedPlanIds] = useState<string[]>([]);
  const [editingRotationId, setEditingRotationId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleCreateRotation = () => {
    if (!newRotationName.trim() || selectedPlanIds.length === 0) return;

    createRotation(newRotationName.trim(), selectedPlanIds);
    setNewRotationName('');
    setSelectedPlanIds([]);
  };

  const handleTogglePlanSelection = (planId: string) => {
    setSelectedPlanIds((prev) =>
      prev.includes(planId)
        ? prev.filter((id) => id !== planId)
        : [...prev, planId]
    );
  };

  const handleReorder = (rotationId: string, newPlanIds: string[]) => {
    updateRotation(rotationId, { template_ids: newPlanIds });
  };

  const handleRemovePlan = (rotationId: string, planId: string) => {
    const rotation = rotations.find((r) => r.rotation_id === rotationId);
    if (!rotation) return;

    const newPlanIds = rotation.template_ids.filter((id) => id !== planId);
    if (newPlanIds.length === 0) {
      // If no plans left, delete the rotation
      deleteRotation(rotationId);
      setEditingRotationId(null);
    } else {
      updateRotation(rotationId, { template_ids: newPlanIds });
    }
  };

  const handleDeleteRotation = (rotationId: string) => {
    deleteRotation(rotationId);
    setDeleteConfirmId(null);
    setEditingRotationId(null);
  };

  return (
    <section>
      <h2 className="text-lg font-semibold mb-4 text-text-primary">Workout Rotations</h2>

      <div className="space-y-6">
        {/* Create Rotation Form */}
        <div className="bg-bg-secondary rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-medium text-text-primary">Create New Rotation</h3>

          <Input
            placeholder="Rotation name (e.g., Push Pull Legs)"
            value={newRotationName}
            onChange={(e) => setNewRotationName(e.target.value)}
          />

          {/* Plan Selection */}
          <div>
            <label className="text-xs text-text-secondary mb-2 block">
              Select Plans (in order)
            </label>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {activePlans.map((plan) => (
                <label
                  key={plan.template_id}
                  className="flex items-center gap-2 p-2 rounded hover:bg-bg-tertiary cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedPlanIds.includes(plan.template_id)}
                    onChange={() => handleTogglePlanSelection(plan.template_id)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-text-primary">{plan.name}</span>
                  <span className="text-xs text-text-secondary ml-auto">
                    {plan.exercises.length} exercises
                  </span>
                </label>
              ))}
            </div>
          </div>

          <Button
            onClick={handleCreateRotation}
            disabled={!newRotationName.trim() || selectedPlanIds.length === 0}
            size="md"
            variant="primary"
          >
            Create Rotation
          </Button>
        </div>

        {/* Existing Rotations */}
        {rotations.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-text-primary">Your Rotations</h3>

            {rotations.map((rotation) => (
              <div
                key={rotation.rotation_id}
                className="bg-bg-secondary rounded-xl p-4 space-y-3"
              >
                {/* Rotation Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-text-primary">{rotation.name}</h4>
                    <p className="text-xs text-text-secondary mt-1">
                      {rotation.template_ids.length} plans · Position {rotation.current_position + 1}/{rotation.template_ids.length}
                    </p>
                  </div>

                  {activeRotationId === rotation.rotation_id && (
                    <span className="text-xs bg-accent text-white px-2 py-1 rounded">
                      Active
                    </span>
                  )}
                </div>

                {/* Controls */}
                <div className="flex gap-2 flex-wrap">
                  <Button
                    onClick={() =>
                      setActiveRotation(
                        activeRotationId === rotation.rotation_id ? null : rotation.rotation_id
                      )
                    }
                    variant={activeRotationId === rotation.rotation_id ? 'secondary' : 'primary'}
                    size="sm"
                  >
                    {activeRotationId === rotation.rotation_id ? 'Deactivate' : 'Set Active'}
                  </Button>

                  <Button
                    onClick={() => resetPosition(rotation.rotation_id)}
                    variant="secondary"
                    size="sm"
                  >
                    Reset Position
                  </Button>

                  <Button
                    onClick={() =>
                      setEditingRotationId(
                        editingRotationId === rotation.rotation_id ? null : rotation.rotation_id
                      )
                    }
                    variant="ghost"
                    size="sm"
                  >
                    {editingRotationId === rotation.rotation_id ? 'Hide Editor' : 'Edit Order'}
                  </Button>

                  <Button
                    onClick={() => setDeleteConfirmId(rotation.rotation_id)}
                    variant="danger"
                    size="sm"
                  >
                    Delete
                  </Button>
                </div>

                {/* Drag-and-drop Editor */}
                {editingRotationId === rotation.rotation_id && (
                  <div className="pt-2">
                    <RotationEditor
                      templateIds={rotation.template_ids}
                      plans={activePlans}
                      onReorder={(newIds) => handleReorder(rotation.rotation_id, newIds)}
                      onRemove={(planId) => handleRemovePlan(rotation.rotation_id, planId)}
                    />
                  </div>
                )}

                {/* Delete Confirmation */}
                {deleteConfirmId === rotation.rotation_id && (
                  <div className="bg-bg-tertiary rounded-xl p-3 border border-error/20">
                    <p className="text-sm text-text-primary mb-3">
                      Delete "{rotation.name}"? This cannot be undone.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleDeleteRotation(rotation.rotation_id)}
                        variant="danger"
                        size="sm"
                      >
                        Confirm Delete
                      </Button>
                      <Button
                        onClick={() => setDeleteConfirmId(null)}
                        variant="secondary"
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {rotations.length === 0 && (
          <p className="text-sm text-text-secondary text-center py-4">
            No rotations yet. Create one above to get started.
          </p>
        )}
      </div>
    </section>
  );
}
