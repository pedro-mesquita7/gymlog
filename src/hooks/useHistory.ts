import { useState, useEffect } from 'react';
import { useDuckDB } from './useDuckDB';
import { CURRENT_MAX_SQL, PR_LIST_SQL } from '../db/compiled-queries';

interface ExerciseMax {
  max_weight: number | null;
  max_1rm: number | null;
}

interface PRRecord {
  set_id: string;
  workout_id: string;
  exercise_id: string;
  weight_kg: number;
  reps: number;
  estimated_1rm: number;
  pr_type: 'weight' | '1rm' | 'weight_and_1rm';
  logged_at: string;
}

/**
 * Get current max weight and 1RM for an exercise
 */
export function useExerciseMax(exerciseId: string | null) {
  const { conn } = useDuckDB();
  const [data, setData] = useState<ExerciseMax | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!conn || !exerciseId) {
      setData(null);
      return;
    }

    let isMounted = true;

    async function fetchMax() {
      setIsLoading(true);
      try {
        const result = await conn!.query(CURRENT_MAX_SQL, [exerciseId]);
        const row = result.toArray()[0];

        if (isMounted) {
          setData({
            max_weight: row?.max_weight ?? null,
            max_1rm: row?.max_1rm ?? null,
          });
        }
      } catch (error) {
        console.error('Failed to fetch exercise max:', error);
        if (isMounted) {
          setData(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchMax();

    return () => {
      isMounted = false;
    };
  }, [conn, exerciseId]);

  return { data, isLoading };
}

/**
 * Get list of all PRs for an exercise
 */
export function usePRList(exerciseId: string | null) {
  const { conn } = useDuckDB();
  const [data, setData] = useState<PRRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!conn || !exerciseId) {
      setData([]);
      return;
    }

    let isMounted = true;

    async function fetchPRs() {
      setIsLoading(true);
      try {
        const result = await conn!.query(PR_LIST_SQL, [exerciseId]);
        const rows = result.toArray();

        if (isMounted) {
          setData(rows.map(row => ({
            set_id: row.set_id,
            workout_id: row.workout_id,
            exercise_id: row.exercise_id,
            weight_kg: row.weight_kg,
            reps: row.reps,
            estimated_1rm: row.estimated_1rm,
            pr_type: row.pr_type,
            logged_at: row.logged_at,
          })));
        }
      } catch (error) {
        console.error('Failed to fetch PR list:', error);
        if (isMounted) {
          setData([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchPRs();

    return () => {
      isMounted = false;
    };
  }, [conn, exerciseId]);

  return { data, isLoading };
}
