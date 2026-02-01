import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import type { Exercise } from '../../types/database';
import type { PlanFormData } from './PlanBuilder';

interface ExerciseRowProps {
  id: string;           // field.id from useFieldArray
  index: number;
  exercise: Exercise | undefined;  // Looked up from exercises list
  exercises: Exercise[];  // Full list for replacement picker
  register: UseFormRegister<PlanFormData>;
  setValue: UseFormSetValue<PlanFormData>;
  watch: UseFormWatch<PlanFormData>;
  onRemove: () => void;
}

export function ExerciseRow({ id, index, exercise, exercises, register, setValue, watch, onRemove }: ExerciseRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const [expanded, setExpanded] = useState(false);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-bg-tertiary/50 rounded-xl p-4 ${isDragging ? 'ring-2 ring-accent' : ''}`}
    >
      <div className="flex items-center gap-3">
        {/* Drag handle */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none text-text-muted hover:text-text-primary"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/>
          </svg>
        </button>

        {/* Exercise name */}
        <div className="flex-1">
          <div className="font-medium">{exercise?.name ?? 'Unknown'}</div>
          <div className="text-xs text-text-muted">{exercise?.muscle_group}</div>
        </div>

        {/* Rep range */}
        <div className="flex items-center gap-1">
          <input
            type="number"
            {...register(`exercises.${index}.target_reps_min`, { valueAsNumber: true })}
            className="w-12 bg-bg-elevated rounded px-2 py-1 text-center text-sm"
            min={1}
          />
          <span className="text-text-muted">-</span>
          <input
            type="number"
            {...register(`exercises.${index}.target_reps_max`, { valueAsNumber: true })}
            className="w-12 bg-bg-elevated rounded px-2 py-1 text-center text-sm"
            min={1}
          />
          <span className="text-xs text-text-muted ml-1">reps</span>
        </div>

        {/* Sets */}
        <div className="flex items-center gap-1">
          <input
            type="number"
            {...register(`exercises.${index}.suggested_sets`, { valueAsNumber: true })}
            className="w-12 bg-bg-elevated rounded px-2 py-1 text-center text-sm"
            min={1}
          />
          <span className="text-xs text-text-muted">sets</span>
        </div>

        {/* Expand/Remove buttons */}
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-text-muted hover:text-text-primary p-1"
          title="Options"
        >
          <svg className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <button
          type="button"
          onClick={onRemove}
          className="text-text-muted hover:text-error p-1"
          title="Remove"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Expanded options */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-border-primary space-y-3">
          {/* Rest time override (input in minutes, stored as seconds) */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-text-secondary w-24">Rest time:</label>
            <input
              type="number"
              value={watch(`exercises.${index}.rest_seconds`) != null ? Math.round((watch(`exercises.${index}.rest_seconds`) as number) / 60 * 10) / 10 : ''}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '') {
                  setValue(`exercises.${index}.rest_seconds`, null);
                } else {
                  const mins = parseFloat(val);
                  if (!isNaN(mins)) setValue(`exercises.${index}.rest_seconds`, Math.round(mins * 60));
                }
              }}
              placeholder="2"
              className="w-20 bg-bg-elevated rounded px-2 py-1 text-sm"
              min={0}
              step={0.5}
            />
            <span className="text-xs text-text-muted">min</span>
          </div>

          {/* Replacement exercise */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-text-secondary w-24">Replacement:</label>
            <select
              {...register(`exercises.${index}.replacement_exercise_id`)}
              className="flex-1 bg-bg-elevated rounded px-2 py-1 text-sm"
            >
              <option value="">None</option>
              {exercises
                .filter(e => e.exercise_id !== exercise?.exercise_id)
                .map(e => (
                  <option key={e.exercise_id} value={e.exercise_id}>
                    {e.name}
                  </option>
                ))}
            </select>
          </div>
        </div>
      )}

      {/* Hidden fields */}
      <input type="hidden" {...register(`exercises.${index}.exercise_id`)} />
      <input type="hidden" {...register(`exercises.${index}.order_index`)} value={index} />
    </div>
  );
}
