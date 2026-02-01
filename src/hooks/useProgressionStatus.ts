import { useState, useEffect, useCallback, useRef } from 'react';
import { getDuckDB } from '../db/duckdb-init';
import { progressionStatusSQL } from '../db/compiled-queries';
import type { ProgressionStatus, UseProgressionStatusReturn } from '../types/analytics';

/**
 * Hook for fetching all exercises' progression status
 * Returns progressing/plateau/regressing/unknown status for each exercise
 * Used by ProgressionDashboard (Plan 02)
 */
export function useProgressionStatus(days: number | null = null): UseProgressionStatusReturn {
  const [data, setData] = useState<ProgressionStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef(false);

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
      const sql = progressionStatusSQL(days);
      const result = await conn.query(sql);

      const rows = result.toArray().map((row: any) => ({
        exerciseId: String(row.original_exercise_id),
        gymId: String(row.gym_id || ''),
        status: String(row.status) as 'progressing' | 'plateau' | 'regressing' | 'unknown',
        lastPrDate: row.last_pr_date ? String(row.last_pr_date) : null,
        sessionCount4wk: Number(row.session_count_4wk || 0),
        weightDropPct: row.weight_drop_pct ? Number(row.weight_drop_pct) : null,
        volumeDropPct: row.volume_drop_pct ? Number(row.volume_drop_pct) : null,
      })) as ProgressionStatus[];

      if (!abortRef.current) {
        setData(rows);
      }
      await conn.close();
    } catch (err) {
      if (!abortRef.current) {
        console.error('Error fetching progression status:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch progression status');
      }
    } finally {
      if (!abortRef.current) {
        setIsLoading(false);
      }
    }
  }, [days]);

  useEffect(() => {
    abortRef.current = false;
    fetchData();
    return () => { abortRef.current = true; };
  }, [fetchData]);

  return { data, isLoading, error, refresh: fetchData };
}
