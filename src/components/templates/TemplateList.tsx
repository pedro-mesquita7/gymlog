import { useState } from 'react';
import { useTemplates } from '../../hooks/useTemplates';
import { useExercises } from '../../hooks/useExercises';
import { TemplateCard } from './TemplateCard';
import { TemplateBuilder } from './TemplateBuilder';
import type { TemplateFormData } from './TemplateBuilder';

export function TemplateList() {
  const { templates, activeTemplates, createTemplate, updateTemplate, deleteTemplate, archiveTemplate, duplicateTemplate, isLoading } = useTemplates();
  const { exercises } = useExercises();

  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const displayTemplates = showArchived ? templates : activeTemplates;
  const editingTemplate = editingTemplateId
    ? templates.find(t => t.template_id === editingTemplateId)
    : undefined;

  const handleCreate = async (data: TemplateFormData) => {
    await createTemplate({
      name: data.name,
      exercises: data.exercises.map((e, i) => ({
        ...e,
        order_index: i,
        rest_seconds: e.rest_seconds ?? null,
        replacement_exercise_id: e.replacement_exercise_id ?? null,
      })),
    });
    setView('list');
  };

  const handleUpdate = async (data: TemplateFormData) => {
    if (!editingTemplateId) return;
    await updateTemplate(editingTemplateId, {
      name: data.name,
      exercises: data.exercises.map((e, i) => ({
        ...e,
        order_index: i,
        rest_seconds: e.rest_seconds ?? null,
        replacement_exercise_id: e.replacement_exercise_id ?? null,
      })),
    });
    setView('list');
    setEditingTemplateId(null);
  };

  const handleDuplicate = async (templateId: string) => {
    const template = templates.find(t => t.template_id === templateId);
    if (!template) return;
    await duplicateTemplate(templateId, `${template.name} (Copy)`);
  };

  // Create/Edit form view - renders TemplateBuilder component
  if (view === 'create' || view === 'edit') {
    return (
      <div>
        <h2 className="text-lg font-semibold mb-6">
          {view === 'create' ? 'Create Template' : 'Edit Template'}
        </h2>
        <TemplateBuilder
          exercises={exercises}
          template={editingTemplate}
          onSubmit={view === 'create' ? handleCreate : handleUpdate}
          onCancel={() => { setView('list'); setEditingTemplateId(null); }}
        />
      </div>
    );
  }

  // List view
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">Templates</h2>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-text-muted">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="rounded border-border-secondary"
            />
            Show archived
          </label>
          <button
            onClick={() => setView('create')}
            className="px-4 py-2 bg-accent hover:bg-accent/90 text-black text-sm font-medium rounded-lg transition-colors"
          >
            + New Template
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-text-muted">Loading templates...</div>
      ) : displayTemplates.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-text-muted mb-4">
            {showArchived ? 'No templates yet' : 'No active templates'}
          </p>
          <button
            onClick={() => setView('create')}
            className="text-accent hover:text-accent/80"
          >
            Create your first template
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {displayTemplates.map(template => (
            <TemplateCard
              key={template.template_id}
              template={template}
              exercises={exercises}
              onEdit={() => { setEditingTemplateId(template.template_id); setView('edit'); }}
              onDuplicate={() => handleDuplicate(template.template_id)}
              onArchive={(archive) => archiveTemplate(template.template_id, archive)}
              onDelete={() => deleteTemplate(template.template_id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
