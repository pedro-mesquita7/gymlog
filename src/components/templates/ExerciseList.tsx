import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { UseFieldArrayReturn, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { ExerciseRow } from './ExerciseRow';
import type { Exercise } from '../../types/database';
import type { TemplateFormData } from './TemplateBuilder';

interface ExerciseListProps {
  fieldArray: UseFieldArrayReturn<TemplateFormData, 'exercises'>;
  exercises: Exercise[];  // Full exercise list for lookups
  register: UseFormRegister<TemplateFormData>;
  setValue: UseFormSetValue<TemplateFormData>;
  watch: UseFormWatch<TemplateFormData>;
}

export function ExerciseList({ fieldArray, exercises, register, setValue, watch }: ExerciseListProps) {
  const { fields, move, remove } = fieldArray;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },  // Prevent accidental drags
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex(f => f.id === active.id);
      const newIndex = fields.findIndex(f => f.id === over.id);
      move(oldIndex, newIndex);
    }
  };

  const getExercise = (exerciseId: string) =>
    exercises.find(e => e.exercise_id === exerciseId);

  if (fields.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-500">
        No exercises added yet. Select exercises below.
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={fields.map(f => f.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {fields.map((field, index) => (
            <ExerciseRow
              key={field.id}  // CRITICAL: Use field.id, not index
              id={field.id}
              index={index}
              exercise={getExercise(field.exercise_id)}
              exercises={exercises}
              register={register}
              setValue={setValue}
              watch={watch}
              onRemove={() => remove(index)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
