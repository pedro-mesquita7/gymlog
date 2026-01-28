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
        <label className="block text-sm font-medium text-zinc-400 mb-3">
          Where are you training?
        </label>
        {gyms.length === 0 ? (
          <p className="text-zinc-500 text-sm">
            No gyms yet. Add a gym in the Workouts tab.
          </p>
        ) : (
          <div className="grid gap-2">
            {gyms.map(gym => (
              <button
                key={gym.gym_id}
                type="button"
                onClick={() => setSelectedGymId(gym.gym_id)}
                className={`p-4 rounded-lg text-left transition-colors ${
                  selectedGymId === gym.gym_id
                    ? 'bg-accent/20 border-2 border-accent'
                    : 'bg-zinc-800/50 border-2 border-transparent hover:border-zinc-700'
                }`}
              >
                <div className="font-medium">{gym.name}</div>
                {gym.location && (
                  <div className="text-sm text-zinc-500">{gym.location}</div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Template selection */}
      <div>
        <label className="block text-sm font-medium text-zinc-400 mb-3">
          What workout?
        </label>
        {activeTemplates.length === 0 ? (
          <p className="text-zinc-500 text-sm">
            No templates yet. Create a template in the Templates tab.
          </p>
        ) : (
          <div className="grid gap-2">
            {activeTemplates.map(template => (
              <button
                key={template.template_id}
                type="button"
                onClick={() => setSelectedTemplateId(template.template_id)}
                className={`p-4 rounded-lg text-left transition-colors ${
                  selectedTemplateId === template.template_id
                    ? 'bg-accent/20 border-2 border-accent'
                    : 'bg-zinc-800/50 border-2 border-transparent hover:border-zinc-700'
                }`}
              >
                <div className="font-medium">{template.name}</div>
                <div className="text-sm text-zinc-500">
                  {template.exercises.length} exercises
                </div>
              </button>
            ))}
          </div>
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
