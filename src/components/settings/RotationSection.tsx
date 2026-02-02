import { useState } from 'react';
import { useRotationStore } from '../../stores/useRotationStore';
import { usePlans } from '../../hooks/usePlans';

import { RotationEditor } from '../rotation/RotationEditor';
import { CollapsibleSection } from '../ui/CollapsibleSection';
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
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const activeRotation = rotations.find((r) => r.rotation_id === activeRotationId);
  const inactiveRotations = rotations.filter((r) => r.rotation_id !== activeRotationId);

  const handleCreateRotation = () => {
    if (!newRotationName.trim() || selectedPlanIds.length === 0) return;

    createRotation(newRotationName.trim(), selectedPlanIds);
    setNewRotationName('');
    setSelectedPlanIds([]);
    setShowCreateForm(false);
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

  const renderRotationCard = (
    rotation: (typeof rotations)[number],
    isActive: boolean
  ) => (
    <div
      key={rotation.rotation_id}
      className={
        isActive
          ? 'bg-bg-secondary border border-accent/30 rounded-xl p-4 space-y-3'
          : 'space-y-3'
      }
    >
      {/* Rotation Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-text-primary">{rotation.name}</h4>
            {isActive && (
              <span className="text-xs bg-accent text-white px-2 py-0.5 rounded-full font-medium">
                Active
              </span>
            )}
          </div>
          <p className="text-xs text-text-secondary mt-1">
            {rotation.template_ids.length} plan{rotation.template_ids.length !== 1 ? 's' : ''} · Position {rotation.current_position + 1}/{rotation.template_ids.length}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-2 flex-wrap">
        {isActive ? (
          <>
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
              onClick={() => setActiveRotation(null)}
              variant="secondary"
              size="sm"
            >
              Deactivate
            </Button>
            <Button
              onClick={() => setDeleteConfirmId(rotation.rotation_id)}
              variant="danger"
              size="sm"
            >
              Delete
            </Button>
          </>
        ) : (
          <>
            {confirmingId === rotation.rotation_id ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-text-secondary">Set as active?</span>
                <Button
                  onClick={() => {
                    setActiveRotation(rotation.rotation_id);
                    setConfirmingId(null);
                  }}
                  variant="primary"
                  size="sm"
                >
                  Yes
                </Button>
                <Button
                  onClick={() => setConfirmingId(null)}
                  variant="secondary"
                  size="sm"
                >
                  No
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => setConfirmingId(rotation.rotation_id)}
                variant="primary"
                size="sm"
              >
                Set Active
              </Button>
            )}
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
          </>
        )}
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
            Delete &ldquo;{rotation.name}&rdquo;? This cannot be undone.
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
  );

  return (
    <div className="space-y-4">
      {/* Section header with count and "+" button */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-text-secondary">
          {rotations.length === 0
            ? 'No rotations yet'
            : `${rotations.length} rotation${rotations.length !== 1 ? 's' : ''}`}
        </span>
        <button
          type="button"
          onClick={() => setShowCreateForm((prev) => !prev)}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-bg-tertiary hover:bg-bg-elevated text-text-primary transition-all"
          aria-label={showCreateForm ? 'Close create form' : 'Create new rotation'}
        >
          <span
            className="text-lg leading-none transition-transform duration-200"
            style={{ transform: showCreateForm ? 'rotate(45deg)' : 'rotate(0deg)' }}
          >
            +
          </span>
        </button>
      </div>

      {/* Create Rotation Form (collapsed by default) */}
      {showCreateForm && (
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
      )}

      {/* Active Rotation (always visible, prominent) */}
      {activeRotation && renderRotationCard(activeRotation, true)}

      {/* Inactive Rotations (each in a CollapsibleSection accordion) */}
      {inactiveRotations.map((rotation) => (
        <CollapsibleSection
          key={rotation.rotation_id}
          title={rotation.name}
          count={rotation.template_ids.length}
        >
          {renderRotationCard(rotation, false)}
        </CollapsibleSection>
      ))}

      {rotations.length === 0 && !showCreateForm && (
        <p className="text-sm text-text-secondary text-center py-4">
          No rotations yet. Tap + to create one.
        </p>
      )}
    </div>
  );
}
