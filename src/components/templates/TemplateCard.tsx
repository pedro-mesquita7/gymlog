import { useState } from 'react';
import type { Template } from '../../types/template';
import type { Exercise } from '../../types/database';
import { DeleteConfirmation } from '../DeleteConfirmation';

interface TemplateCardProps {
  template: Template;
  exercises: Exercise[];  // For name lookup
  onEdit: () => void;
  onDuplicate: () => void;
  onArchive: (archive: boolean) => void;
  onDelete: () => void;
}

export function TemplateCard({ template, exercises, onEdit, onDuplicate, onArchive, onDelete }: TemplateCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const getExerciseName = (exerciseId: string) =>
    exercises.find(e => e.exercise_id === exerciseId)?.name ?? 'Unknown';

  // Preview first 3 exercises
  const exercisePreview = template.exercises
    .slice(0, 3)
    .map(e => getExerciseName(e.exercise_id));
  const moreCount = Math.max(0, template.exercises.length - 3);

  return (
    <div className={`bg-zinc-800/50 rounded-lg p-4 ${template.is_archived ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 cursor-pointer" onClick={onEdit}>
          <h3 className="font-medium flex items-center gap-2">
            {template.name}
            {template.is_archived && (
              <span className="text-xs bg-zinc-700 px-2 py-0.5 rounded">Archived</span>
            )}
          </h3>
          <p className="text-sm text-zinc-500 mt-1">
            {template.exercises.length} exercise{template.exercises.length !== 1 ? 's' : ''}
          </p>
          {exercisePreview.length > 0 && (
            <p className="text-xs text-zinc-600 mt-2">
              {exercisePreview.join(', ')}
              {moreCount > 0 && ` +${moreCount} more`}
            </p>
          )}
        </div>

        {/* Actions menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 text-zinc-500 hover:text-zinc-300"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>

          {showMenu && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />

              {/* Menu */}
              <div className="absolute right-0 mt-1 w-40 bg-zinc-700 rounded-lg shadow-lg z-20 py-1">
                <button
                  onClick={() => { setShowMenu(false); onEdit(); }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-zinc-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => { setShowMenu(false); onDuplicate(); }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-zinc-600"
                >
                  Duplicate
                </button>
                <button
                  onClick={() => { setShowMenu(false); onArchive(!template.is_archived); }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-zinc-600"
                >
                  {template.is_archived ? 'Restore' : 'Archive'}
                </button>
                <button
                  onClick={() => { setShowMenu(false); setShowDeleteConfirm(true); }}
                  className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-zinc-600"
                >
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Delete confirmation - uses existing DeleteConfirmation with isOpen prop */}
      <DeleteConfirmation
        isOpen={showDeleteConfirm}
        title="Delete Template"
        message={`Are you sure you want to delete "${template.name}"? This cannot be undone.`}
        onConfirm={() => { setShowDeleteConfirm(false); onDelete(); }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
