import { useState, useEffect, useCallback } from 'react';
import { uuidv7 } from 'uuidv7';
import { writeEvent } from '../db/events';
import { getGyms } from '../db/queries';
import type { Gym } from '../types/database';
import type {
  GymCreatedEvent,
  GymUpdatedEvent,
  GymDeletedEvent,
} from '../types/events';

interface UseGymsReturn {
  gyms: Gym[];
  isLoading: boolean;
  error: string | null;
  createGym: (data: CreateGymData) => Promise<void>;
  updateGym: (id: string, data: UpdateGymData) => Promise<void>;
  deleteGym: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

interface CreateGymData {
  name: string;
  location: string | null;
}

interface UpdateGymData {
  name: string;
  location: string | null;
}

export function useGyms(): UseGymsReturn {
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getGyms();
      setGyms(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load gyms');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createGym = useCallback(async (data: CreateGymData) => {
    const event: Omit<GymCreatedEvent, '_event_id' | '_created_at'> = {
      event_type: 'gym_created',
      gym_id: uuidv7(),
      name: data.name,
      location: data.location,
    };

    await writeEvent(event);
    await refresh();
  }, [refresh]);

  const updateGym = useCallback(async (id: string, data: UpdateGymData) => {
    const event: Omit<GymUpdatedEvent, '_event_id' | '_created_at'> = {
      event_type: 'gym_updated',
      gym_id: id,
      name: data.name,
      location: data.location,
    };

    await writeEvent(event);
    await refresh();
  }, [refresh]);

  const deleteGym = useCallback(async (id: string) => {
    const event: Omit<GymDeletedEvent, '_event_id' | '_created_at'> = {
      event_type: 'gym_deleted',
      gym_id: id,
    };

    await writeEvent(event);
    await refresh();
  }, [refresh]);

  return {
    gyms,
    isLoading,
    error,
    createGym,
    updateGym,
    deleteGym,
    refresh,
  };
}
