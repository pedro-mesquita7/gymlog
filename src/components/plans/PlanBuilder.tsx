import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { ExerciseList } from './ExerciseList';
import type { Exercise } from '../../types/database';
import type { Plan } from '../../types/plan';

// Coerce NaN/empty to null for optional numeric fields
const nanToNull = z.preprocess(
  (val) => (val === '' || val === undefined || (typeof val === 'number' && isNaN(val)) ? null : val),
  z.number().nullable()
);

// Coerce empty string to null for optional string fields
const emptyToNull = z.preprocess(
  (val) => (val === '' ? null : val),
  z.string().nullable()
);

// Zod schema for validation
const planExerciseSchema = z.object({
  exercise_id: z.string().min(1),
  order_index: z.number(),
  target_reps_min: z.number().min(1),
  target_reps_max: z.number().min(1),
  suggested_sets: z.number().min(1),
  rest_seconds: nanToNull,
  replacement_exercise_id: emptyToNull,
});

const planSchema = z.object({
  name: z.string().min(1, 'Plan name is required'),
  exercises: z.array(planExerciseSchema).min(1, 'Add at least one exercise'),
}).superRefine((data, ctx) => {
  // Validate each exercise appears only once
  const exerciseIds = data.exercises.map(e => e.exercise_id);
  const duplicates = exerciseIds.filter((id, i) => exerciseIds.indexOf(id) !== i);
  if (duplicates.length > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Each exercise can only appear once in plan',
      path: ['exercises'],
    });
  }

  // Validate min <= max for each exercise
  data.exercises.forEach((ex, i) => {
    if (ex.target_reps_min > ex.target_reps_max) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Min reps must be <= max reps',
        path: ['exercises', i, 'target_reps_max'],
      });
    }
  });
});

export type PlanFormData = z.infer<typeof planSchema>;

interface PlanBuilderProps {
  exercises: Exercise[];  // Available exercises to add
  plan?: Plan;    // Existing plan for edit mode
  onSubmit: (data: PlanFormData) => Promise<void>;
  onCancel: () => void;
}

export function PlanBuilder({ exercises, plan, onSubmit, onCancel }: PlanBuilderProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExercisePicker, setShowExercisePicker] = useState(false);

  const defaultExercises: PlanFormData['exercises'] = plan?.exercises.map((e, i) => ({
    exercise_id: e.exercise_id,
    order_index: i,
    target_reps_min: e.target_reps_min,
    target_reps_max: e.target_reps_max,
    suggested_sets: e.suggested_sets,
    rest_seconds: e.rest_seconds,
    replacement_exercise_id: e.replacement_exercise_id,
  })) ?? [];

  const { control, register, handleSubmit, setValue, watch, formState: { errors } } = useForm<PlanFormData>({
    resolver: zodResolver(planSchema) as any,
    defaultValues: {
      name: plan?.name ?? '',
      exercises: defaultExercises,
    },
  });

  const fieldArray = useFieldArray({
    control,
    name: 'exercises',
  });

  const selectedExerciseIds = new Set(fieldArray.fields.map(f => f.exercise_id));

  const handleAddExercise = (exerciseId: string) => {
    if (selectedExerciseIds.has(exerciseId)) return;

    fieldArray.append({
      exercise_id: exerciseId,
      order_index: fieldArray.fields.length,
      target_reps_min: 8,
      target_reps_max: 12,
      suggested_sets: 3,
      rest_seconds: null,
      replacement_exercise_id: null,
    });
  };

  const handleFormSubmit = async (data: PlanFormData) => {
    setIsSubmitting(true);
    try {
      // Update order_index based on current position
      const exercises = data.exercises.map((e, i) => ({
        ...e,
        order_index: i,
      }));
      await onSubmit({ ...data, exercises });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sort exercises alphabetically for picker
  const sortedExercises = [...exercises].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Plan name */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Plan Name
        </label>
        <input
          {...register('name')}
          data-testid="plan-name-input"
          type="text"
          placeholder="e.g., Upper A, Push Day"
          className="w-full bg-bg-tertiary border border-border-secondary rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-error">{errors.name.message}</p>
        )}
      </div>

      {/* Exercise list with drag-drop */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <label className="text-sm font-medium text-text-secondary">
            Exercises ({fieldArray.fields.length})
          </label>
          <button
            type="button"
            onClick={() => setShowExercisePicker(!showExercisePicker)}
            className="text-sm text-accent hover:text-accent/80"
          >
            {showExercisePicker ? 'Hide' : 'Add Exercises'}
          </button>
        </div>

        {errors.exercises && typeof errors.exercises.message === 'string' && (
          <p className="mb-2 text-sm text-error">{errors.exercises.message}</p>
        )}

        {/* CRITICAL: ExerciseList component renders here */}
        <ExerciseList
          fieldArray={fieldArray}
          exercises={exercises}
          register={register}
          setValue={setValue}
          watch={watch}
        />
      </div>

      {/* Exercise picker (checkbox list) */}
      {showExercisePicker && (
        <div className="bg-bg-tertiary/50 rounded-xl p-4 max-h-64 overflow-y-auto">
          <div className="space-y-2">
            {sortedExercises.map(exercise => (
              <label
                key={exercise.exercise_id}
                className="flex items-center gap-3 p-2 rounded hover:bg-bg-tertiary cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedExerciseIds.has(exercise.exercise_id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      handleAddExercise(exercise.exercise_id);
                    } else {
                      const index = fieldArray.fields.findIndex(f => f.exercise_id === exercise.exercise_id);
                      if (index >= 0) fieldArray.remove(index);
                    }
                  }}
                  className="rounded border-border-secondary text-accent focus:ring-accent"
                />
                <span>{exercise.name}</span>
                <span className="text-xs text-text-muted">{exercise.muscle_group}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Form actions */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-3 bg-bg-tertiary hover:bg-bg-tertiary/80 rounded-xl transition-colors"
        >
          Cancel
        </button>
        <button
          data-testid="btn-create-plan"
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-4 py-3 bg-accent hover:bg-accent/90 text-black font-medium rounded-xl transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : plan ? 'Update Plan' : 'Create Plan'}
        </button>
      </div>
    </form>
  );
}
