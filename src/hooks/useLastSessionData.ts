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
  previousData: LastSessionSet[] | null;
  isLoading: boolean;
}

export function useLastSessionData(
  exerciseId: string,
  gymId: string
): UseLastSessionDataReturn {
  const [data, setData] = useState<LastSessionSet[] | null>(null);
  const [previousData, setPreviousData] = useState<LastSessionSet[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchLastTwoSessions() {
      if (!exerciseId || !gymId) {
        setData(null);
        setPreviousData(null);
        setIsLoading(false);
        return;
      }

      const db: AsyncDuckDB | null = getDuckDB();
      if (!db) {
        console.error('[useLastSessionData] Database not initialized');
        setData(null);
        setPreviousData(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const conn = await db.connect();

        // Fetch sets from the last TWO workout sessions for this exercise+gym
        // session_rank 1 = most recent (ghost text), session_rank 2 = second-to-last (delta comparison)
        const sql = `
          WITH ranked_workouts AS (
            SELECT DISTINCT w.workout_id,
              MAX(s.logged_at) as last_set_at
            FROM fact_sets s
            JOIN dim_workouts w ON s.workout_id = w.workout_id
            WHERE s.exercise_id = '${exerciseId}'
              AND w.gym_id = '${gymId}'
            GROUP BY w.workout_id
            ORDER BY last_set_at DESC
            LIMIT 2
          )
          SELECT
            rw.session_rank,
            ROW_NUMBER() OVER (PARTITION BY rw.session_rank ORDER BY s.logged_at ASC) as set_number,
            s.weight_kg,
            s.reps,
            s.rir
          FROM fact_sets s
          JOIN (
            SELECT workout_id,
              ROW_NUMBER() OVER (ORDER BY last_set_at DESC) as session_rank
            FROM ranked_workouts
          ) rw ON s.workout_id = rw.workout_id
          WHERE s.exercise_id = '${exerciseId}'
          ORDER BY rw.session_rank ASC, s.logged_at ASC
        `;

        const result = await conn.query(sql);
        const rows = result.toArray();

        if (rows.length === 0) {
          setData(null);
          setPreviousData(null);
        } else {
          const mapRow = (row: any): LastSessionSet => ({
            set_number: Number(row.set_number),
            weight_kg: Number(row.weight_kg),
            reps: Number(row.reps),
            rir: row.rir !== null ? Number(row.rir) : null,
          });

          const lastSets = rows
            .filter((row: any) => Number(row.session_rank) === 1)
            .map(mapRow);
          const prevSets = rows
            .filter((row: any) => Number(row.session_rank) === 2)
            .map(mapRow);

          setData(lastSets.length > 0 ? lastSets : null);
          setPreviousData(prevSets.length > 0 ? prevSets : null);
        }

        await conn.close();
      } catch (err) {
        console.error('[useLastSessionData] Error fetching last session:', err);
        setData(null);
        setPreviousData(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchLastTwoSessions();
  }, [exerciseId, gymId]);

  return { data, previousData, isLoading };
}
