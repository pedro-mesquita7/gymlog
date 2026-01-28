import { useState, useEffect, useCallback } from 'react';
import { uuidv7 } from 'uuidv7';
import { writeEvent } from '../db/events';
import { getTemplates } from '../db/queries';
import type { Template, TemplateExercise } from '../types/template';
import type {
  TemplateCreatedEvent,
  TemplateUpdatedEvent,
  TemplateDeletedEvent,
  TemplateArchivedEvent,
} from '../types/events';

interface CreateTemplateData {
  name: string;
  exercises: TemplateExercise[];
}

interface UpdateTemplateData {
  name: string;
  exercises: TemplateExercise[];
}

interface UseTemplatesReturn {
  templates: Template[];
  activeTemplates: Template[];  // Non-archived only
  isLoading: boolean;
  error: string | null;
  createTemplate: (data: CreateTemplateData) => Promise<string>;  // Returns template_id
  updateTemplate: (id: string, data: UpdateTemplateData) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  archiveTemplate: (id: string, archive: boolean) => Promise<void>;
  duplicateTemplate: (id: string, newName: string) => Promise<string>;  // Returns new template_id
  refresh: () => Promise<void>;
}

export function useTemplates(): UseTemplatesReturn {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getTemplates();
      setTemplates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createTemplate = useCallback(async (data: CreateTemplateData): Promise<string> => {
    const templateId = uuidv7();
    const event: Omit<TemplateCreatedEvent, '_event_id' | '_created_at'> = {
      event_type: 'template_created',
      template_id: templateId,
      name: data.name,
      exercises: data.exercises,
    };
    await writeEvent(event);
    await refresh();
    return templateId;
  }, [refresh]);

  const updateTemplate = useCallback(async (id: string, data: UpdateTemplateData) => {
    const event: Omit<TemplateUpdatedEvent, '_event_id' | '_created_at'> = {
      event_type: 'template_updated',
      template_id: id,
      name: data.name,
      exercises: data.exercises,
    };
    await writeEvent(event);
    await refresh();
  }, [refresh]);

  const deleteTemplate = useCallback(async (id: string) => {
    const event: Omit<TemplateDeletedEvent, '_event_id' | '_created_at'> = {
      event_type: 'template_deleted',
      template_id: id,
    };
    await writeEvent(event);
    await refresh();
  }, [refresh]);

  const archiveTemplate = useCallback(async (id: string, archive: boolean) => {
    const event: Omit<TemplateArchivedEvent, '_event_id' | '_created_at'> = {
      event_type: 'template_archived',
      template_id: id,
      is_archived: archive,
    };
    await writeEvent(event);
    await refresh();
  }, [refresh]);

  const duplicateTemplate = useCallback(async (id: string, newName: string): Promise<string> => {
    const original = templates.find(t => t.template_id === id);
    if (!original) throw new Error('Template not found');

    return createTemplate({
      name: newName,
      exercises: original.exercises,
    });
  }, [templates, createTemplate]);

  // Filter out archived templates for activeTemplates
  const activeTemplates = templates.filter(t => !t.is_archived);

  return {
    templates,
    activeTemplates,
    isLoading,
    error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    archiveTemplate,
    duplicateTemplate,
    refresh,
  };
}
