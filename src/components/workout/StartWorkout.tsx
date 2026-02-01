import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useWorkoutStore } from '../../stores/useWorkoutStore';
import { useRotationStore, selectNextTemplate } from '../../stores/useRotationStore';
import type { Template } from '../../types/template';
import type { Gym } from '../../types/database';
import { Button } from '../ui/Button';
import { Select } from '../ui/Input';
import { QuickStartCard } from '../rotation/QuickStartCard';
import { RecentWorkoutCard } from './RecentWorkoutCard';

interface StartWorkoutProps {
  templates: Template[];
  gyms: Gym[];
  onStarted: () => void;  // Callback when workout starts
}

export function StartWorkout({ templates, gyms, onStarted }: StartWorkoutProps) {
  // Read rotation state for pre-fill
  const defaultGymId = useRotationStore(state => state.defaultGymId);
  const nextTemplate = useRotationStore(useShallow(selectNextTemplate));

  // Pre-fill from rotation if available
  const [selectedGymId, setSelectedGymId] = useState<string>(() => defaultGymId || '');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(() => nextTemplate?.templateId || '');
  const startWorkout = useWorkoutStore(state => state.startWorkout);

  // Filter to only active (non-archived) templates
  const activeTemplates = templates.filter(t => !t.is_archived);

  const handleStart = () => {
    if (!selectedGymId || !selectedTemplateId) return;
    startWorkout(selectedTemplateId, selectedGymId);
    onStarted();
  };

  // Quick-start handler for rotation card
  const handleQuickStart = (templateId: string, gymId: string) => {
    startWorkout(templateId, gymId);
    onStarted();
  };

  const canStart = selectedGymId && selectedTemplateId;

  return (
    <div className="space-y-4">
      {/* Quick Start Hero Card */}
      <QuickStartCard templates={templates} gyms={gyms} onStart={handleQuickStart} />

      {/* Recent Workout Summary */}
      <RecentWorkoutCard />

      {/* Browse All Templates Accordion */}
      <details className="group">
        <summary className="cursor-pointer text-text-secondary hover:text-text-primary text-sm font-medium py-3 flex items-center gap-2">
          <span className="transition-transform group-open:rotate-90">&#9654;</span>
          Browse all templates
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

          {/* Template selection */}
          <div>
            <label htmlFor="template-select" className="block text-sm font-medium text-text-secondary mb-2">
              What workout?
            </label>
            {activeTemplates.length === 0 ? (
              <p className="text-text-muted text-sm">
                No templates yet. Create one in the Templates tab.
              </p>
            ) : (
              <Select
                id="template-select"
                data-testid="template-select"
                value={selectedTemplateId}
                onChange={e => setSelectedTemplateId(e.target.value)}
              >
                <option value="">Select template...</option>
                {activeTemplates.map(template => (
                  <option key={template.template_id} value={template.template_id}>
                    {template.name} ({template.exercises.length} exercises)
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
