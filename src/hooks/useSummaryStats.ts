import { useState, useEffect, useCallback, useRef } from 'react';
import { getDuckDB } from '../db/duckdb-init';
import { summaryStatsSQL } from '../db/compiled-queries';
import type { SummaryStats } from '../types/analytics';

/**
 * Hook for fetching summary stats for dashboard cards
 * Returns totalWorkouts, totalVolumeKg, totalPrs for given time range
 */
export function useSummaryStats(days: number | null) {
  const [data, setData] = useState<SummaryStats>({ totalWorkouts: 0, totalVolumeKg: 0, totalPrs: 0 });
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

    abortRef.current = false;
    setIsLoading(true);
    setError(null);

    try {
      const conn = await db.connect();

      // Get summary stats from SQL
      const sql = summaryStatsSQL(days);
      const result = await conn.query(sql);
      const rows = result.toArray();
      const row = rows[0] as any;

      if (!abortRef.current) {
        setData({
          totalWorkouts: Number(row?.total_workouts || 0),
          totalVolumeKg: Number(row?.total_volume_kg || 0),
          totalPrs: Number(row?.total_prs || 0),
        });
      }

      await conn.close();
    } catch (err) {
      if (!abortRef.current) {
        console.error('Error fetching summary stats:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch summary stats');
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
