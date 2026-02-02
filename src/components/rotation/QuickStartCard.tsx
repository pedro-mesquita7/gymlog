import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useRotationStore, selectNextPlan } from '../../stores/useRotationStore';
import type { Plan } from '../../types/plan';
import type { Gym } from '../../types/database';
import { Button } from '../ui/Button';
import { Select } from '../ui/Input';

interface QuickStartCardProps {
  plans: Plan[];
  gyms: Gym[];
  onStart: (planId: string, gymId: string) => void;
}

export function QuickStartCard({ plans, gyms, onStart }: QuickStartCardProps) {
  const nextPlan = useRotationStore(useShallow(selectNextPlan));
  const defaultGymId = useRotationStore(state => state.defaultGymId);
  const [isEditing, setIsEditing] = useState(false);
  const [editPlanId, setEditPlanId] = useState('');
  const [editGymId, setEditGymId] = useState('');

  // Filter to only active (non-archived) plans
  const activePlans = plans.filter(t => !t.is_archived);

  // Case 1: No rotation configured
  if (!nextPlan) {
    return (
      <div className="bg-bg-secondary border border-border-primary rounded-xl p-6">
        <p className="text-sm text-text-muted">
          No workout plan yet. Set up a rotation in Settings.
        </p>
      </div>
    );
  }

  // Case 2: Rotation exists but no default gym
  if (!defaultGymId) {
    return (
      <div className="bg-bg-secondary border border-border-primary rounded-xl p-6">
        <p className="text-sm text-text-muted">
          Set a default gym in Settings to enable quick-start.
        </p>
      </div>
    );
  }

  // Case 3: Rotation and default gym both configured
  const plan = plans.find(t => t.template_id === nextPlan.planId);
  const gym = gyms.find(g => g.gym_id === defaultGymId);

  if (!plan || !gym) {
    return (
      <div className="bg-bg-secondary border border-border-primary rounded-xl p-6">
        <p className="text-sm text-text-muted">
          Rotation configured but plan or gym not found.
        </p>
      </div>
    );
  }

  // Determine effective IDs (edit overrides or rotation defaults)
  const effectivePlanId = editPlanId || nextPlan.planId;
  const effectiveGymId = editGymId || defaultGymId;
  const effectivePlan = plans.find(t => t.template_id === effectivePlanId) || plan;
  const effectiveGym = gyms.find(g => g.gym_id === effectiveGymId) || gym;

  const handleToggleEdit = () => {
    if (!isEditing) {
      // Entering edit mode — pre-fill with current values
      setEditPlanId(nextPlan.planId);
      setEditGymId(defaultGymId);
    }
    setIsEditing(!isEditing);
  };

  return (
    <div data-testid="quick-start-card" className="border-2 border-accent bg-accent/5 rounded-xl p-6 space-y-3 relative">
      {/* Edit toggle */}
      <button
        data-testid="btn-edit-quick-start"
        onClick={handleToggleEdit}
        className="absolute top-4 right-4 p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-colors"
        aria-label={isEditing ? 'Close edit' : 'Edit workout selection'}
      >
        {isEditing ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
          </svg>
        )}
      </button>

      <div data-testid="rotation-info" className="text-sm text-text-secondary">
        Workout {nextPlan.position + 1} of {nextPlan.total} in {nextPlan.rotationName}
      </div>
      <div className="text-2xl font-bold">{effectivePlan.name}</div>
      <div className="text-text-secondary">at {effectiveGym.name}</div>

      {/* Edit mode: gym and plan selectors */}
      {isEditing && (
        <div className="space-y-3 pt-1">
          <Select
            value={editGymId}
            onChange={e => setEditGymId(e.target.value)}
            aria-label="Select gym"
          >
            {gyms.map(g => (
              <option key={g.gym_id} value={g.gym_id}>
                {g.name}{g.location ? ` — ${g.location}` : ''}
              </option>
            ))}
          </Select>
          <Select
            value={editPlanId}
            onChange={e => setEditPlanId(e.target.value)}
            aria-label="Select plan"
          >
            {activePlans.map(t => (
              <option key={t.template_id} value={t.template_id}>
                {t.name} ({t.exercises.length} exercises)
              </option>
            ))}
          </Select>
        </div>
      )}

      <Button
        data-testid="btn-quick-start"
        variant="primary"
        size="lg"
        className="w-full"
        onClick={() => onStart(effectivePlanId, effectiveGymId)}
      >
        Start Workout
      </Button>
    </div>
  );
}
