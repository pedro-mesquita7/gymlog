import { useState, useEffect, useCallback, useRef } from 'react';
import { getDuckDB } from '../db/duckdb-init';
import { exerciseProgressSQL } from '../db/compiled-queries';
import type { ProgressPoint, UseExerciseProgressReturn } from '../types/analytics';

interface UseExerciseProgressOptions {
  exerciseId: string;
  days?: number | null;  // null = all time, undefined = default 28
}

/**
 * Hook for fetching exercise progress data for charts (CHART-01, CHART-02, CHART-03)
 * Returns daily aggregates: max weight, estimated 1RM, volume for given time range
 */
export function useExerciseProgress({ exerciseId, days }: UseExerciseProgressOptions): UseExerciseProgressReturn {
  const [data, setData] = useState<ProgressPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef(false);

  // Resolve undefined to default 28 days; null = all time
  const resolvedDays = days === undefined ? 28 : days;

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

      // Generate SQL dynamically with days parameter
      const sql = exerciseProgressSQL(resolvedDays).replace('$1', `'${exerciseId}'`);
      const result = await conn.query(sql);

      const rawRows = result.toArray();
      const rows = rawRows.map((row: any) => {
        // DuckDB-WASM DATE returns millisecond-epoch integers (number or BigInt)
        const dateVal = row.date;
        let dateStr: string;
        if (typeof dateVal === 'number') {
          dateStr = new Date(dateVal).toISOString().split('T')[0];
        } else if (typeof dateVal === 'bigint') {
          dateStr = new Date(Number(dateVal)).toISOString().split('T')[0];
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

      if (!abortRef.current) {
        setData(rows);
      }
      await conn.close();
    } catch (err) {
      if (!abortRef.current) {
        console.error('Error fetching exercise progress:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch progress data');
      }
    } finally {
      if (!abortRef.current) {
        setIsLoading(false);
      }
    }
  }, [exerciseId, resolvedDays]);

  useEffect(() => {
    abortRef.current = false;
    fetchData();
    return () => { abortRef.current = true; };
  }, [fetchData]);

  return { data, isLoading, error, refresh: fetchData };
}
