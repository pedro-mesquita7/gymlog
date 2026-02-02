import { useState, useEffect, useCallback, useRef } from 'react';
import { getDuckDB } from '../db/duckdb-init';
import { weekComparisonSubtitleSQL } from '../db/compiled-queries';

interface WeekComparisonResult {
  subtitle: string;
  isLoading: boolean;
  /** Raw data for component-level styling (null when no data) */
  data: {
    weightChangePct: number | null;
    volumeChangePct: number | null;
    currentMaxWeight: number;
    currentVolume: number;
    currentSetCount: number;
    hasPreviousWeek: boolean;
  } | null;
}

/**
 * Lightweight hook returning a formatted week-over-week comparison subtitle.
 * Always compares last 7 days vs 8-14 days ago (independent of time range picker).
 *
 * Returns:
 * - Both weeks have data: "+5% weight, +12% volume vs last week"
 * - Only current week: "First week"
 * - No current week data: empty string
 */
export function useWeekComparisonSubtitle({ exerciseId }: { exerciseId: string }): WeekComparisonResult {
  const [subtitle, setSubtitle] = useState('');
  const [data, setData] = useState<WeekComparisonResult['data']>(null);
  const [isLoading, setIsLoading] = useState(true);
  const abortRef = useRef(false);

  const fetchData = useCallback(async () => {
    if (!exerciseId) {
      setSubtitle('');
      setData(null);
      setIsLoading(false);
      return;
    }

    const db = getDuckDB();
    if (!db) {
      setSubtitle('');
      setData(null);
      setIsLoading(false);
      return;
    }

    abortRef.current = false;
    setIsLoading(true);

    try {
      const conn = await db.connect();
      const sql = weekComparisonSubtitleSQL(exerciseId);
      const result = await conn.query(sql);
      const rows = result.toArray();
      await conn.close();

      if (abortRef.current) return;

      if (rows.length === 0) {
        // No data at all
        setSubtitle('');
        setData(null);
        setIsLoading(false);
        return;
      }

      const row = rows[0] as any;
      const currentMaxWeight = row.current_max_weight != null ? Number(row.current_max_weight) : null;
      const currentVolume = row.current_total_volume != null ? Number(row.current_total_volume) : null;
      const currentSetCount = row.current_set_count != null ? Number(row.current_set_count) : null;
      const previousMaxWeight = row.previous_max_weight != null ? Number(row.previous_max_weight) : null;
      const previousVolume = row.previous_total_volume != null ? Number(row.previous_total_volume) : null;

      // No current week data -- hide subtitle
      if (currentMaxWeight == null || currentMaxWeight === 0) {
        setSubtitle('');
        setData(null);
        setIsLoading(false);
        return;
      }

      // Current week has data but no previous week
      if (previousMaxWeight == null || previousMaxWeight === 0) {
        setSubtitle('First week');
        setData({
          weightChangePct: null,
          volumeChangePct: null,
          currentMaxWeight,
          currentVolume: currentVolume ?? 0,
          currentSetCount: currentSetCount ?? 0,
          hasPreviousWeek: false,
        });
        setIsLoading(false);
        return;
      }

      // Both weeks have data -- compute percentage changes
      const weightPct = Math.round(((currentMaxWeight - previousMaxWeight) / previousMaxWeight) * 100);
      const volumePct = previousVolume && previousVolume > 0
        ? Math.round(((currentVolume! - previousVolume) / previousVolume) * 100)
        : null;

      const formatPct = (pct: number): string => {
        const sign = pct > 0 ? '+' : '';
        return `${sign}${pct}%`;
      };

      let parts: string[] = [];
      parts.push(`${formatPct(weightPct)} weight`);
      if (volumePct !== null) {
        parts.push(`${formatPct(volumePct)} volume`);
      }

      setSubtitle(`${parts.join(', ')} vs last week`);
      setData({
        weightChangePct: weightPct,
        volumeChangePct: volumePct,
        currentMaxWeight,
        currentVolume: currentVolume ?? 0,
        currentSetCount: currentSetCount ?? 0,
        hasPreviousWeek: true,
      });
    } catch (err) {
      if (!abortRef.current) {
        console.error('Error fetching week comparison:', err);
        setSubtitle('');
        setData(null);
      }
    } finally {
      if (!abortRef.current) {
        setIsLoading(false);
      }
    }
  }, [exerciseId]);

  useEffect(() => {
    abortRef.current = false;
    fetchData();
    return () => { abortRef.current = true; };
  }, [fetchData]);

  return { subtitle, isLoading, data };
}
