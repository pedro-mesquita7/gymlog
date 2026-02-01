import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useWorkoutStore } from '../../stores/useWorkoutStore';
import { useRotationStore, selectNextPlan } from '../../stores/useRotationStore';
import type { Plan } from '../../types/plan';
import type { Gym } from '../../types/database';
import { Button } from '../ui/Button';
import { Select } from '../ui/Input';
import { QuickStartCard } from '../rotation/QuickStartCard';
import { RecentWorkoutCard } from './RecentWorkoutCard';

interface StartWorkoutProps {
  plans: Plan[];
  gyms: Gym[];
  onStarted: () => void;  // Callback when workout starts
}

export function StartWorkout({ plans, gyms, onStarted }: StartWorkoutProps) {
  // Read rotation state for pre-fill
  const defaultGymId = useRotationStore(state => state.defaultGymId);
  const nextPlan = useRotationStore(useShallow(selectNextPlan));

  // Pre-fill from rotation if available
  const [selectedGymId, setSelectedGymId] = useState<string>(() => defaultGymId || '');
  const [selectedPlanId, setSelectedPlanId] = useState<string>(() => nextPlan?.templateId || '');
  const startWorkout = useWorkoutStore(state => state.startWorkout);

  // Filter to only active (non-archived) plans
  const activePlans = plans.filter(t => !t.is_archived);

  const handleStart = () => {
    if (!selectedGymId || !selectedPlanId) return;
    startWorkout(selectedPlanId, selectedGymId);
    onStarted();
  };

  // Quick-start handler for rotation card
  const handleQuickStart = (planId: string, gymId: string) => {
    startWorkout(planId, gymId);
    onStarted();
  };

  const canStart = selectedGymId && selectedPlanId;

  return (
    <div className="space-y-4">
      {/* Quick Start Hero Card */}
      <QuickStartCard plans={plans} gyms={gyms} onStart={handleQuickStart} />

      {/* Recent Workout Summary */}
      <RecentWorkoutCard />

      {/* Browse All Plans Accordion */}
      <details className="group">
        <summary className="cursor-pointer text-text-secondary hover:text-text-primary text-sm font-medium py-3 flex items-center gap-2">
          <span className="transition-transform group-open:rotate-90">&#9654;</span>
          Manual select workout
        </summary>
        <div className="pt-4 space-y-4">
          {/* Gym selection */}
          <div>
            <label htmlFor="gym-select" className="block text-sm font-medium text-text-secondary mb-2">
              Where are you training?
            </label>
            {gyms.length === 0 ? (
              <p className="text-text-muted text-sm">
                No gyms yet. Add a gym below.
              </p>
            ) : (
              <Select
                id="gym-select"
                data-testid="gym-select"
                value={selectedGymId}
                onChange={e => setSelectedGymId(e.target.value)}
              >
                <option value="">Select gym...</option>
                {gyms.map(gym => (
                  <option key={gym.gym_id} value={gym.gym_id}>
                    {gym.name}{gym.location ? ` — ${gym.location}` : ''}
                  </option>
                ))}
              </Select>
            )}
          </div>

          {/* Plan selection */}
          <div>
            <label htmlFor="plan-select" className="block text-sm font-medium text-text-secondary mb-2">
              What workout?
            </label>
            {activePlans.length === 0 ? (
              <p className="text-text-muted text-sm">
                No plans yet. Create one in the Plans tab.
              </p>
            ) : (
              <Select
                id="plan-select"
                data-testid="plan-select"
                value={selectedPlanId}
                onChange={e => setSelectedPlanId(e.target.value)}
              >
                <option value="">Select plan...</option>
                {activePlans.map(plan => (
                  <option key={plan.template_id} value={plan.template_id}>
                    {plan.name} ({plan.exercises.length} exercises)
                  </option>
                ))}
              </Select>
            )}
          </div>

          {/* Start button */}
          <Button
            data-testid="btn-start-workout"
            onClick={handleStart}
            disabled={!canStart}
            variant="primary"
            size="lg"
          >
            Start Workout
          </Button>
        </div>
      </details>
    </div>
  );
}
