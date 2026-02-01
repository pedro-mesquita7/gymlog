import { useState, useEffect, useCallback } from 'react';
import { uuidv7 } from 'uuidv7';
import { writeEvent } from '../db/events';
import { getPlans } from '../db/queries';
import type { Plan, PlanExercise } from '../types/plan';
import type {
  PlanCreatedEvent,
  PlanUpdatedEvent,
  PlanDeletedEvent,
  PlanArchivedEvent,
} from '../types/events';

interface CreatePlanData {
  name: string;
  exercises: PlanExercise[];
}

interface UpdatePlanData {
  name: string;
  exercises: PlanExercise[];
}

interface UsePlansReturn {
  plans: Plan[];
  activePlans: Plan[];  // Non-archived only
  isLoading: boolean;
  error: string | null;
  createPlan: (data: CreatePlanData) => Promise<string>;  // Returns template_id
  updatePlan: (id: string, data: UpdatePlanData) => Promise<void>;
  deletePlan: (id: string) => Promise<void>;
  archivePlan: (id: string, archive: boolean) => Promise<void>;
  duplicatePlan: (id: string, newName: string) => Promise<string>;  // Returns new template_id
  refresh: () => Promise<void>;
}

export function usePlans(): UsePlansReturn {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getPlans();
      setPlans(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load plans');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createPlan = useCallback(async (data: CreatePlanData): Promise<string> => {
    const planId = uuidv7();
    const event: Omit<PlanCreatedEvent, '_event_id' | '_created_at'> = {
      event_type: 'template_created',
      template_id: planId,
      name: data.name,
      exercises: data.exercises,
    };
    await writeEvent(event);
    await refresh();
    return planId;
  }, [refresh]);

  const updatePlan = useCallback(async (id: string, data: UpdatePlanData) => {
    const event: Omit<PlanUpdatedEvent, '_event_id' | '_created_at'> = {
      event_type: 'template_updated',
      template_id: id,
      name: data.name,
      exercises: data.exercises,
    };
    await writeEvent(event);
    await refresh();
  }, [refresh]);

  const deletePlan = useCallback(async (id: string) => {
    const event: Omit<PlanDeletedEvent, '_event_id' | '_created_at'> = {
      event_type: 'template_deleted',
      template_id: id,
    };
    await writeEvent(event);
    await refresh();
  }, [refresh]);

  const archivePlan = useCallback(async (id: string, archive: boolean) => {
    const event: Omit<PlanArchivedEvent, '_event_id' | '_created_at'> = {
      event_type: 'template_archived',
      template_id: id,
      is_archived: archive,
    };
    await writeEvent(event);
    await refresh();
  }, [refresh]);

  const duplicatePlan = useCallback(async (id: string, newName: string): Promise<string> => {
    const original = plans.find(t => t.template_id === id);
    if (!original) throw new Error('Plan not found');

    return createPlan({
      name: newName,
      exercises: original.exercises,
    });
  }, [plans, createPlan]);

  // Filter out archived plans for activePlans
  const activePlans = plans.filter(t => !t.is_archived);

  return {
    plans,
    activePlans,
    isLoading,
    error,
    createPlan,
    updatePlan,
    deletePlan,
    archivePlan,
    duplicatePlan,
    refresh,
  };
}
