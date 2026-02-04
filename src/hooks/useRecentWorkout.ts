import { useState, useEffect, useCallback } from 'react';
import { getDuckDB } from '../db/duckdb-init';
import { formatDistanceToNow } from 'date-fns';

export interface RecentWorkoutData {
  planName: string;
  date: string;
  exerciseCount: number;
  totalVolume: number;
  durationMinutes: number;
  totalSets: number;
}

/**
 * Hook that queries the most recent completed workout from DuckDB.
 * Returns summary data for the RecentWorkoutCard, or null if no completed workouts exist.
 */
export function useRecentWorkout(): {
  data: RecentWorkoutData | null;
  isLoading: boolean;
} {
  const [data, setData] = useState<RecentWorkoutData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const db = getDuckDB();
    if (!db) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const conn = await db.connect();

      const query = `
        WITH completed AS (
          SELECT
            payload->>'workout_id' AS workout_id,
            payload->>'template_id' AS template_id,
            payload->>'started_at' AS started_at,
            _created_at AS completed_at
          FROM events
          WHERE event_type = 'workout_completed'
          ORDER BY _created_at DESC
          LIMIT 1
        ),
        template_names AS (
          SELECT
            payload->>'template_id' AS template_id,
            payload->>'name' AS name
          FROM events
          WHERE event_type = 'template_created'
        ),
        workout_sets AS (
          SELECT
            payload->>'workout_id' AS workout_id,
            payload->>'exercise_id' AS exercise_id,
            CAST(payload->>'weight_kg' AS DOUBLE) AS weight_kg,
            CAST(payload->>'reps' AS INTEGER) AS reps
          FROM events
          WHERE event_type = 'set_logged'
        )
        SELECT
          COALESCE(t.name, 'Unknown Plan') as plan_name,
          c.started_at,
          c.completed_at,
          COUNT(DISTINCT s.exercise_id) as exercise_count,
          COALESCE(SUM(s.weight_kg * s.reps), 0) as total_volume,
          COUNT(*) as total_sets
        FROM completed c
        LEFT JOIN template_names t ON c.template_id = t.template_id
        LEFT JOIN workout_sets s ON c.workout_id = s.workout_id
        GROUP BY c.workout_id, t.name, c.started_at, c.completed_at
      `;

      const result = await conn.query(query);
      const rows = result.toArray();

      if (rows.length > 0) {
        const row: any = rows[0];

        // Parse timestamps — DuckDB-WASM may return various formats
        const startedAt = new Date(
          typeof row.started_at === 'bigint'
            ? Number(row.started_at)
            : row.started_at
        );
        const completedAt = row.completed_at
          ? new Date(
              typeof row.completed_at === 'bigint'
                ? Number(row.completed_at)
                : row.completed_at
            )
          : null;

        // Calculate duration in minutes
        const durationMinutes =
          completedAt && startedAt
            ? Math.round(
                (completedAt.getTime() - startedAt.getTime()) / (1000 * 60)
              )
            : 0;

        // Format relative date
        const dateStr = !isNaN(startedAt.getTime())
          ? formatDistanceToNow(startedAt, { addSuffix: true })
          : 'Unknown date';

        setData({
          planName: String(row.plan_name),
          date: dateStr,
          exerciseCount: Number(row.exercise_count),
          totalVolume: Math.round(Number(row.total_volume)),
          durationMinutes,
          totalSets: Number(row.total_sets),
        });
      } else {
        setData(null);
      }

      await conn.close();
    } catch (err) {
      console.error('Error fetching recent workout:', err);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading };
}
