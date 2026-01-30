import { useState } from 'react';
import { useWorkoutStore } from '../../stores/useWorkoutStore';
import type { Template } from '../../types/template';
import type { Gym } from '../../types/database';

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
        <label className="block text-sm font-medium text-zinc-400 mb-2">
          Where are you training?
        </label>
        {gyms.length === 0 ? (
          <p className="text-zinc-500 text-sm">
            No gyms yet. Add a gym below.
          </p>
        ) : (
          <select
            value={selectedGymId}
            onChange={e => setSelectedGymId(e.target.value)}
            className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-accent"
          >
            <option value="">Select gym...</option>
            {gyms.map(gym => (
              <option key={gym.gym_id} value={gym.gym_id}>
                {gym.name}{gym.location ? ` — ${gym.location}` : ''}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Template selection */}
      <div>
        <label className="block text-sm font-medium text-zinc-400 mb-2">
          What workout?
        </label>
        {activeTemplates.length === 0 ? (
          <p className="text-zinc-500 text-sm">
            No templates yet. Create one in the Templates tab.
          </p>
        ) : (
          <select
            value={selectedTemplateId}
            onChange={e => setSelectedTemplateId(e.target.value)}
            className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-accent"
          >
            <option value="">Select template...</option>
            {activeTemplates.map(template => (
              <option key={template.template_id} value={template.template_id}>
                {template.name} ({template.exercises.length} exercises)
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Start button */}
      <button
        onClick={handleStart}
        disabled={!canStart}
        className="w-full py-4 bg-accent hover:bg-accent/90 text-black font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Start Workout
      </button>
    </div>
  );
}
