import { useShallow } from 'zustand/react/shallow';
import { useRotationStore, selectNextTemplate } from '../../stores/useRotationStore';
import type { Template } from '../../types/template';
import type { Gym } from '../../types/database';
import { Button } from '../ui/Button';

interface QuickStartCardProps {
  templates: Template[];
  gyms: Gym[];
  onStart: (templateId: string, gymId: string) => void;
}

export function QuickStartCard({ templates, gyms, onStart }: QuickStartCardProps) {
  const nextTemplate = useRotationStore(useShallow(selectNextTemplate));
  const defaultGymId = useRotationStore(state => state.defaultGymId);

  // Case 1: No rotation configured
  if (!nextTemplate) {
    return (
      <div className="bg-bg-secondary border border-border-primary rounded-lg p-4">
        <p className="text-sm text-text-muted">
          Set up a workout rotation in Settings for quick-start
        </p>
      </div>
    );
  }

  // Case 2: Rotation exists but no default gym
  if (!defaultGymId) {
    return (
      <div className="bg-bg-secondary border border-border-primary rounded-lg p-4">
        <p className="text-sm text-text-muted">
          Set a default gym in Settings to enable quick-start
        </p>
      </div>
    );
  }

  // Case 3: Rotation and default gym both configured
  const template = templates.find(t => t.template_id === nextTemplate.templateId);
  const gym = gyms.find(g => g.gym_id === defaultGymId);

  if (!template || !gym) {
    return (
      <div className="bg-bg-secondary border border-border-primary rounded-lg p-4">
        <p className="text-sm text-text-muted">
          Rotation configured but template or gym not found
        </p>
      </div>
    );
  }

  return (
    <div data-testid="quick-start-card" className="border-2 border-accent bg-accent/5 rounded-lg p-4 space-y-3">
      <div data-testid="rotation-info" className="text-sm text-text-secondary">
        Workout {nextTemplate.position + 1} of {nextTemplate.total} in {nextTemplate.rotationName}
      </div>
      <div className="text-xl font-bold">{template.name}</div>
      <div className="text-text-secondary">at {gym.name}</div>
      <Button
        data-testid="btn-quick-start"
        variant="primary"
        size="lg"
        className="w-full"
        onClick={() => onStart(nextTemplate.templateId, defaultGymId)}
      >
        Start Workout
      </Button>
    </div>
  );
}
