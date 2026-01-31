import { useState, useEffect } from 'react';
import type { AsyncDuckDB } from '@duckdb/duckdb-wasm';
import { getDuckDB } from '../db/duckdb-init';

export interface LastSessionSet {
  set_number: number;
  weight_kg: number;
  reps: number;
  rir: number | null;
}

interface UseLastSessionDataReturn {
  data: LastSessionSet[] | null;
  isLoading: boolean;
}

export function useLastSessionData(
  exerciseId: string,
  gymId: string
): UseLastSessionDataReturn {
  const [data, setData] = useState<LastSessionSet[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchLastSession() {
      if (!exerciseId || !gymId) {
        setData(null);
        setIsLoading(false);
        return;
      }

      const db: AsyncDuckDB | null = getDuckDB();
      if (!db) {
        console.error('[useLastSessionData] Database not initialized');
        setData(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const conn = await db.connect();

        // Find the most recent workout_id for this exercise+gym combination
        // Then fetch all sets from that workout, ordered by logged_at
        const sql = `
          WITH last_workout AS (
            SELECT w.workout_id
            FROM fact_sets s
            JOIN dim_workouts w ON s.workout_id = w.workout_id
            WHERE s.exercise_id = '${exerciseId}'
              AND w.gym_id = '${gymId}'
            ORDER BY s.logged_at DESC
            LIMIT 1
          )
          SELECT
            ROW_NUMBER() OVER (ORDER BY s.logged_at ASC) as set_number,
            s.weight_kg,
            s.reps,
            s.rir
          FROM fact_sets s
          WHERE s.workout_id = (SELECT workout_id FROM last_workout)
            AND s.exercise_id = '${exerciseId}'
          ORDER BY s.logged_at ASC
        `;

        const result = await conn.query(sql);
        const rows = result.toArray();

        if (rows.length === 0) {
          setData(null);
        } else {
          const sets = rows.map((row: any) => ({
            set_number: Number(row.set_number),
            weight_kg: Number(row.weight_kg),
            reps: Number(row.reps),
            rir: row.rir !== null ? Number(row.rir) : null,
          }));
          setData(sets);
        }

        await conn.close();
      } catch (err) {
        console.error('[useLastSessionData] Error fetching last session:', err);
        setData(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchLastSession();
  }, [exerciseId, gymId]);

  return { data, isLoading };
}
