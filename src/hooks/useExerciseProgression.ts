import { useState, useEffect, useCallback } from 'react';
import { getDuckDB } from '../db/duckdb-init';
import { PROGRESSION_STATUS_SQL } from '../db/compiled-queries';
import type { ProgressionStatus, UseExerciseProgressionReturn } from '../types/analytics';

interface UseExerciseProgressionParams {
  exerciseId: string;
  gymId: string;
}

/**
 * Hook for fetching single exercise progression status
 * Filters results in JavaScript after query (simpler than parameterized SQL)
 * Used by ProgressionAlert component (Plan 03)
 */
export function useExerciseProgression({
  exerciseId,
  gymId,
}: UseExerciseProgressionParams): UseExerciseProgressionReturn {
  const [data, setData] = useState<ProgressionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    // Skip fetch if no exerciseId provided
    if (!exerciseId) {
      setData(null);
      setIsLoading(false);
      return;
    }

    const db = getDuckDB();
    if (!db) {
      setError('Database not initialized');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const conn = await db.connect();
      const result = await conn.query(PROGRESSION_STATUS_SQL);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rows = result.toArray().map((row: any) => ({
        exerciseId: String(row.original_exercise_id),
        gymId: String(row.gym_id || ''),
        status: String(row.status) as 'progressing' | 'plateau' | 'regressing' | 'unknown',
        lastPrDate: row.last_pr_date ? String(row.last_pr_date) : null,
        sessionCount4wk: Number(row.session_count_4wk || 0),
        weightDropPct: row.weight_drop_pct ? Number(row.weight_drop_pct) : null,
        volumeDropPct: row.volume_drop_pct ? Number(row.volume_drop_pct) : null,
      })) as ProgressionStatus[];

      // Filter for matching exercise + gym
      // For global exercises, gym_id may be empty - match on exercise_id only
      // For gym-specific exercises, match on both exercise_id and gym_id
      const match = rows.find(
        (row) =>
          row.exerciseId === exerciseId &&
          (row.gymId === gymId || row.gymId === '')
      );

      setData(match || null);
      await conn.close();
    } catch (err) {
      console.error('Error fetching exercise progression:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch exercise progression');
    } finally {
      setIsLoading(false);
    }
  }, [exerciseId, gymId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error };
}
