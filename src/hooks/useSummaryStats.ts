import { useState, useEffect, useCallback, useRef } from 'react';
import { getDuckDB } from '../db/duckdb-init';
import { summaryStatsSQL } from '../db/compiled-queries';
import type { SummaryStats } from '../types/analytics';

/**
 * Hook for fetching summary stats for dashboard cards
 * Returns totalWorkouts, totalVolumeKg, totalPrs, streakWeeks for given time range
 * Streak is calculated in JS by counting consecutive weeks with workouts backward from current week
 */
export function useSummaryStats(days: number | null) {
  const [data, setData] = useState<SummaryStats>({ totalWorkouts: 0, totalVolumeKg: 0, totalPrs: 0, streakWeeks: 0 });
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

      // Calculate streak: count consecutive weeks with >= 1 workout, backwards from current
      const streakSQL = `
        WITH workout_dates AS (
          SELECT DISTINCT DATE_TRUNC('week', CAST(
            COALESCE(payload->>'logged_at', CAST(_created_at AS VARCHAR)) AS TIMESTAMPTZ
          ))::DATE AS week_start
          FROM events
          WHERE event_type = 'workout_started'
        )
        SELECT week_start FROM workout_dates ORDER BY week_start DESC
      `;
      const streakResult = await conn.query(streakSQL);
      const streakRows = streakResult.toArray();

      let streakWeeks = 0;
      if (streakRows.length > 0) {
        // Get current week start (Monday)
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0=Sun
        const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const currentWeekStart = new Date(now);
        currentWeekStart.setDate(now.getDate() - mondayOffset);
        currentWeekStart.setHours(0, 0, 0, 0);

        // Convert DB rows to week start timestamps
        const weekStarts = streakRows.map((r: any) => {
          const val = r.week_start;
          if (typeof val === 'number') return val;
          if (typeof val === 'bigint') return Number(val);
          return new Date(val).getTime();
        });

        // Count consecutive weeks backward from current
        const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
        let expectedWeek = currentWeekStart.getTime();

        for (const weekMs of weekStarts) {
          // Allow tolerance for timezone differences
          if (Math.abs(weekMs - expectedWeek) < ONE_WEEK_MS * 0.5) {
            streakWeeks++;
            expectedWeek -= ONE_WEEK_MS;
          } else if (weekMs < expectedWeek) {
            // Skipped a week, streak broken
            break;
          }
          // If weekMs > expectedWeek, it's a future week entry, skip
        }
      }

      if (!abortRef.current) {
        setData({
          totalWorkouts: Number(row?.total_workouts || 0),
          totalVolumeKg: Number(row?.total_volume_kg || 0),
          totalPrs: Number(row?.total_prs || 0),
          streakWeeks,
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
