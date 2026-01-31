import { useState } from 'react';
import { useWorkoutStore } from '../../stores/useWorkoutStore';
import type { Template } from '../../types/template';
import type { Gym } from '../../types/database';
import { Button } from '../ui/Button';
import { Select } from '../ui/Input';

interface StartWorkoutProps {
  templates: Template[];
  gyms: Gym[];
  onStarted: () => void;  // Callback when workout starts
}

export function StartWorkout({ templates, gyms, onStarted }: StartWorkoutProps) {
  const [selectedGymId, setSelectedGymId] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const startWorkout = useWorkoutStore(state => state.startWorkout);

  // Filter to only active (non-archived) templates
  const activeTemplates = templates.filter(t => !t.is_archived);

  const handleStart = () => {
    if (!selectedGymId || !selectedTemplateId) return;
    startWorkout(selectedTemplateId, selectedGymId);
    onStarted();
  };

  const canStart = selectedGymId && selectedTemplateId;

  return (
    <div className="space-y-6">
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold mb-2">Start Workout</h2>
        <p className="text-zinc-500">Select gym and template to begin</p>
      </div>

      {/* Gym selection */}
      <div>
        <label htmlFor="gym-select" className="block text-sm font-medium text-zinc-400 mb-2">
          Where are you training?
        </label>
        {gyms.length === 0 ? (
          <p className="text-zinc-500 text-sm">
            No gyms yet. Add a gym below.
          </p>
        ) : (
          <Select
            id="gym-select"
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
        <label htmlFor="template-select" className="block text-sm font-medium text-zinc-400 mb-2">
          What workout?
        </label>
        {activeTemplates.length === 0 ? (
          <p className="text-zinc-500 text-sm">
            No templates yet. Create one in the Templates tab.
          </p>
        ) : (
          <Select
            id="template-select"
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
        onClick={handleStart}
        disabled={!canStart}
        variant="primary"
        size="lg"
      >
        Start Workout
      </Button>
    </div>
  );
}
