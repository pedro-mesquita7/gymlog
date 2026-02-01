import { useState, useEffect, useCallback, useRef } from 'react';
import { getDuckDB } from '../db/duckdb-init';
import { comparisonStatsSQL } from '../db/compiled-queries';
import type { ComparisonStats, UseComparisonStatsReturn, ProgressionStatus } from '../types/analytics';

/**
 * Hook for fetching comparison stats for multiple exercises.
 * Returns PR, volume, frequency data from DuckDB, merged with
 * progression status from the provided progressionData prop
 * (avoids duplicate 9-week progression SQL query).
 */
export function useComparisonStats(
  exerciseIds: string[],
  days: number | null,
  progressionData: ProgressionStatus[] = []
): UseComparisonStatsReturn {
  const [data, setData] = useState<ComparisonStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef(false);

  // Stabilize dependency on exerciseIds array (Pitfall 1)
  const idsKey = exerciseIds.join(',');

  const fetchData = useCallback(async () => {
    if (exerciseIds.length === 0) {
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

    let conn;
    try {
      conn = await db.connect();
      const sql = comparisonStatsSQL(exerciseIds, days);
      const result = await conn.query(sql);

      const rows = result.toArray().map((row: any) => {
        const exerciseId = String(row.exercise_id);
        const progression = progressionData.find(p => p.exerciseId === exerciseId);

        return {
          exerciseId,
          exerciseName: String(row.exercise_name),
          muscleGroup: String(row.muscle_group || ''),
          maxWeight: Number(row.max_weight || 0),
          maxEstimated1rm: Number(row.max_estimated_1rm || 0),
          totalVolume: Number(row.total_volume || 0),
          totalSets: Number(row.total_sets || 0),
          sessionCount: Number(row.session_count || 0),
          sessionsPerWeek: Number(row.sessions_per_week || 0),
          progressionStatus: progression?.status ?? 'unknown',
        } as ComparisonStats;
      });

      if (!abortRef.current) {
        setData(rows);
      }
    } catch (err) {
      if (!abortRef.current) {
        console.error('Error fetching comparison stats:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch comparison stats');
      }
    } finally {
      if (conn) {
        await conn.close();
      }
      if (!abortRef.current) {
        setIsLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey, days, progressionData]);

  useEffect(() => {
    abortRef.current = false;
    fetchData();
    return () => { abortRef.current = true; };
  }, [fetchData]);

  return { data, isLoading, error, refresh: fetchData };
}
