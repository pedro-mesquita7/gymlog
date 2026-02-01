import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Plan } from '../../types/plan';

interface RotationEditorProps {
  templateIds: string[];
  plans: Plan[];
  onReorder: (ids: string[]) => void;
  onRemove: (id: string) => void;
}

interface SortableItemProps {
  id: string;
  planName: string;
  onRemove: () => void;
}

function SortableItem({ id, planName, onRemove }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 bg-bg-secondary rounded-2xl p-3 border border-border-primary"
    >
      <button
        {...attributes}
        {...listeners}
        className="text-text-secondary hover:text-text-primary cursor-grab active:cursor-grabbing touch-none"
        aria-label="Drag to reorder"
      >
        ⠿
      </button>
      <span className="flex-1 text-text-primary">{planName}</span>
      <button
        onClick={onRemove}
        className="text-text-secondary hover:text-error transition-colors"
        aria-label="Remove plan"
      >
        ✕
      </button>
    </div>
  );
}

export function RotationEditor({ templateIds, plans, onReorder, onRemove }: RotationEditorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = templateIds.indexOf(active.id as string);
      const newIndex = templateIds.indexOf(over.id as string);

      const newOrder = arrayMove(templateIds, oldIndex, newIndex);
      onReorder(newOrder);
    }
  };

  // Create a lookup map for quick plan name resolution
  const planMap = new Map(plans.map(t => [t.template_id, t.name]));

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={templateIds}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {templateIds.map((templateId) => (
            <SortableItem
              key={templateId}
              id={templateId}
              planName={planMap.get(templateId) || 'Unknown Plan'}
              onRemove={() => onRemove(templateId)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
