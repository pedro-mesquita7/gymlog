import { useState, useEffect, useCallback } from 'react';
import { uuidv7 } from 'uuidv7';
import { writeEvent } from '../db/events';
import { getExercises } from '../db/queries';
import type { Exercise } from '../types/database';
import type {
  ExerciseCreatedEvent,
  ExerciseUpdatedEvent,
  ExerciseDeletedEvent,
  MuscleGroup,
} from '../types/events';

interface UseExercisesReturn {
  exercises: Exercise[];
  isLoading: boolean;
  error: string | null;
  createExercise: (data: CreateExerciseData) => Promise<void>;
  updateExercise: (id: string, data: UpdateExerciseData) => Promise<void>;
  deleteExercise: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

interface CreateExerciseData {
  name: string;
  muscle_group: MuscleGroup;
  is_global: boolean;
}

interface UpdateExerciseData {
  name: string;
  muscle_group: MuscleGroup;
  is_global: boolean;
}

export function useExercises(): UseExercisesReturn {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getExercises();
      setExercises(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load exercises');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createExercise = useCallback(async (data: CreateExerciseData) => {
    const event: Omit<ExerciseCreatedEvent, '_event_id' | '_created_at'> = {
      event_type: 'exercise_created',
      exercise_id: uuidv7(),
      name: data.name,
      muscle_group: data.muscle_group,
      is_global: data.is_global,
    };

    await writeEvent(event);
    await refresh();
  }, [refresh]);

  const updateExercise = useCallback(async (id: string, data: UpdateExerciseData) => {
    const event: Omit<ExerciseUpdatedEvent, '_event_id' | '_created_at'> = {
      event_type: 'exercise_updated',
      exercise_id: id,
      name: data.name,
      muscle_group: data.muscle_group,
      is_global: data.is_global,
    };

    await writeEvent(event);
    await refresh();
  }, [refresh]);

  const deleteExercise = useCallback(async (id: string) => {
    const event: Omit<ExerciseDeletedEvent, '_event_id' | '_created_at'> = {
      event_type: 'exercise_deleted',
      exercise_id: id,
    };

    await writeEvent(event);
    await refresh();
  }, [refresh]);

  return {
    exercises,
    isLoading,
    error,
    createExercise,
    updateExercise,
    deleteExercise,
    refresh,
  };
}
