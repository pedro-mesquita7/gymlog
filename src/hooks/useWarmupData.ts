import { useState, useEffect } from 'react';
import type { AsyncDuckDB } from '@duckdb/duckdb-wasm';
import { getDuckDB } from '../db/duckdb-init';

interface UseWarmupDataReturn {
  maxWeight: number | null;
  isLoading: boolean;
}

export function useWarmupData(originalExerciseId: string): UseWarmupDataReturn {
  const [maxWeight, setMaxWeight] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchMaxWeight() {
      if (!originalExerciseId) {
        setMaxWeight(null);
        setIsLoading(false);
        return;
      }

      const db: AsyncDuckDB | null = getDuckDB();
      if (!db) {
        console.error('[useWarmupData] Database not initialized');
        setMaxWeight(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      let conn;

      try {
        conn = await db.connect();

        const sql = `
          WITH completed_workouts AS (
            SELECT payload->>'workout_id' AS workout_id
            FROM events
            WHERE event_type = 'workout_completed'
          ),
          set_events AS (
            SELECT
              payload->>'workout_id' AS workout_id,
              payload->>'original_exercise_id' AS original_exercise_id,
              payload->>'exercise_id' AS exercise_id,
              CAST(payload->>'weight_kg' AS DOUBLE) AS weight_kg,
              COALESCE(payload->>'logged_at', CAST(_created_at AS VARCHAR)) AS logged_at
            FROM events
            WHERE event_type = 'set_logged'
          ),
          recent_session AS (
            SELECT s.workout_id, MAX(s.logged_at) AS session_date
            FROM set_events s
            JOIN completed_workouts cw ON s.workout_id = cw.workout_id
            WHERE s.original_exercise_id = '${originalExerciseId}'
              AND s.exercise_id = '${originalExerciseId}'
            GROUP BY s.workout_id
            ORDER BY session_date DESC
            LIMIT 1
          )
          SELECT MAX(s.weight_kg) AS max_weight
          FROM set_events s
          JOIN recent_session rs ON s.workout_id = rs.workout_id
          WHERE s.original_exercise_id = '${originalExerciseId}'
            AND s.exercise_id = '${originalExerciseId}'
        `;

        const result = await conn.query(sql);
        const rows = result.toArray();

        if (rows.length > 0 && rows[0].max_weight !== null && rows[0].max_weight !== undefined) {
          setMaxWeight(Number(rows[0].max_weight));
        } else {
          setMaxWeight(null);
        }
      } catch (err) {
        console.error('[useWarmupData] Error fetching max weight:', err);
        setMaxWeight(null);
      } finally {
        if (conn) {
          await conn.close();
        }
        setIsLoading(false);
      }
    }

    fetchMaxWeight();
  }, [originalExerciseId]);

  return { maxWeight, isLoading };
}
