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
import type { Template } from '../../types/template';

interface RotationEditorProps {
  templateIds: string[];
  templates: Template[];
  onReorder: (ids: string[]) => void;
  onRemove: (id: string) => void;
}

interface SortableItemProps {
  id: string;
  templateName: string;
  onRemove: () => void;
}

function SortableItem({ id, templateName, onRemove }: SortableItemProps) {
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
      <span className="flex-1 text-text-primary">{templateName}</span>
      <button
        onClick={onRemove}
        className="text-text-secondary hover:text-error transition-colors"
        aria-label="Remove template"
      >
        ✕
      </button>
    </div>
  );
}

export function RotationEditor({ templateIds, templates, onReorder, onRemove }: RotationEditorProps) {
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

  // Create a lookup map for quick template name resolution
  const templateMap = new Map(templates.map(t => [t.template_id, t.name]));

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
              templateName={templateMap.get(templateId) || 'Unknown Template'}
              onRemove={() => onRemove(templateId)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
