import { useState, useEffect, useRef } from 'react';
import type { Exercise } from '../../types/database';

interface ExerciseMultiSelectProps {
  exercises: Exercise[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  maxSelections?: number;
}

/**
 * Multi-select exercise picker with chip/tag UI for comparison feature.
 * Dropdown with checkboxes, enforces 2-4 selection limit.
 */
export function ExerciseMultiSelect({
  exercises,
  selectedIds,
  onChange,
  maxSelections = 4,
}: ExerciseMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function toggleExercise(id: string) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(sid => sid !== id));
    } else if (selectedIds.length < maxSelections) {
      onChange([...selectedIds, id]);
    }
  }

  function removeExercise(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    onChange(selectedIds.filter(sid => sid !== id));
  }

  const selectedExercises = exercises.filter(ex => selectedIds.includes(ex.exercise_id));
  const atMax = selectedIds.length >= maxSelections;

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger area */}
      <div
        data-testid="comparison-exercise-select"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-bg-tertiary border border-border-primary rounded-xl px-4 py-3 cursor-pointer min-h-[48px] flex items-center flex-wrap gap-2"
      >
        {selectedExercises.length === 0 ? (
          <span className="text-text-muted text-sm">Select exercises to compare...</span>
        ) : (
          <>
            {selectedExercises.map(ex => (
              <span
                key={ex.exercise_id}
                className="inline-flex items-center gap-1 bg-accent/20 text-text-primary text-sm px-3 py-1 rounded-full"
              >
                {ex.name}
                <button
                  onClick={(e) => removeExercise(ex.exercise_id, e)}
                  className="ml-0.5 text-text-muted hover:text-text-primary"
                  aria-label={`Remove ${ex.name}`}
                >
                  x
                </button>
              </span>
            ))}
          </>
        )}
        <span className="ml-auto text-xs text-text-muted shrink-0">
          {selectedIds.length}/{maxSelections} selected
        </span>
      </div>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute z-20 mt-1 w-full bg-bg-tertiary border border-border-primary rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {exercises.map(ex => {
            const isSelected = selectedIds.includes(ex.exercise_id);
            const isDisabled = !isSelected && atMax;

            return (
              <label
                key={ex.exercise_id}
                className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer ${
                  isDisabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-bg-elevated'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  disabled={isDisabled}
                  onChange={() => toggleExercise(ex.exercise_id)}
                  className="accent-accent w-4 h-4 shrink-0"
                />
                <span className="text-sm text-text-primary truncate">{ex.name}</span>
                <span className="text-xs text-text-muted shrink-0">({ex.muscle_group})</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
