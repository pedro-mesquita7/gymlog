import { useState, useEffect, useCallback } from 'react';
import { getDuckDB } from '../db/duckdb-init';
import { EXERCISE_PROGRESS_SQL, WEEKLY_COMPARISON_SQL } from '../db/compiled-queries';
import type { ProgressPoint, WeeklyComparison, UseExerciseProgressReturn, UseWeeklyComparisonReturn } from '../types/analytics';

interface UseExerciseProgressOptions {
  exerciseId: string;
}

/**
 * Hook for fetching exercise progress data for charts (CHART-01, CHART-02, CHART-03)
 * Returns daily aggregates: max weight, estimated 1RM, volume for last 28 days
 */
export function useExerciseProgress({ exerciseId }: UseExerciseProgressOptions): UseExerciseProgressReturn {
  const [data, setData] = useState<ProgressPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!exerciseId) {
      setData([]);
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

      // Replace $1 parameter with actual value (DuckDB-WASM limitation)
      const sql = EXERCISE_PROGRESS_SQL.replace('$1', `'${exerciseId}'`);
      const result = await conn.query(sql);

      const rows = result.toArray().map((row: any) => {
        // DuckDB DATE returns epoch-day integers (number or BigInt); convert to ISO date string
        const dateVal = row.date;
        let dateStr: string;
        if (typeof dateVal === 'number') {
          dateStr = new Date(dateVal * 86400000).toISOString().split('T')[0];
        } else if (typeof dateVal === 'bigint') {
          dateStr = new Date(Number(dateVal) * 86400000).toISOString().split('T')[0];
        } else {
          // Could be a Date object or string
          const d = new Date(dateVal);
          dateStr = !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : String(dateVal).split('T')[0];
        }
        return {
          date: dateStr,
          maxWeight: Number(row.max_weight),
          max1rm: row.max_1rm !== null ? Number(row.max_1rm) : 0,
          totalVolume: Number(row.total_volume),
          setCount: Number(row.set_count),
        };
      }) as ProgressPoint[];

      setData(rows);
      await conn.close();
    } catch (err) {
      console.error('Error fetching exercise progress:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch progress data');
    } finally {
      setIsLoading(false);
    }
  }, [exerciseId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refresh: fetchData };
}

/**
 * Hook for fetching week-over-week comparison data (CHART-04)
 * Returns current week vs previous week metrics with percentage changes
 */
export function useWeeklyComparison(): UseWeeklyComparisonReturn {
  const [data, setData] = useState<WeeklyComparison[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
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
      const result = await conn.query(WEEKLY_COMPARISON_SQL);

      const rows = result.toArray().map((row: any) => {
        const wsVal = row.week_start;
        let weekStartStr: string;
        if (typeof wsVal === 'number') {
          weekStartStr = new Date(wsVal * 86400000).toISOString().split('T')[0];
        } else if (typeof wsVal === 'bigint') {
          weekStartStr = new Date(Number(wsVal) * 86400000).toISOString().split('T')[0];
        } else {
          const d = new Date(wsVal);
          weekStartStr = !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : String(wsVal).split('T')[0];
        }
        return {
        exerciseId: String(row.exercise_id),
        exerciseName: String(row.exercise_name),
        muscleGroup: String(row.muscle_group),
        weekStart: weekStartStr,
        maxWeight: Number(row.max_weight),
        max1rm: row.max_1rm !== null ? Number(row.max_1rm) : 0,
        totalVolume: Number(row.total_volume),
        setCount: Number(row.set_count),
        prevMaxWeight: row.prev_max_weight !== null ? Number(row.prev_max_weight) : null,
        prevVolume: row.prev_volume !== null ? Number(row.prev_volume) : null,
        weightChangePct: row.weight_change_pct !== null ? Number(row.weight_change_pct) : null,
        volumeChangePct: row.volume_change_pct !== null ? Number(row.volume_change_pct) : null,
        };
      }) as WeeklyComparison[];

      setData(rows);
      await conn.close();
    } catch (err) {
      console.error('Error fetching weekly comparison:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch weekly comparison');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refresh: fetchData };
}
