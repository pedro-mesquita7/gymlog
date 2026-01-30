import { useState, useEffect, useCallback } from 'react';
import { getDuckDB } from '../db/duckdb-init';
import { VOLUME_BY_MUSCLE_GROUP_SQL, MUSCLE_HEAT_MAP_SQL } from '../db/compiled-queries';
import type { VolumeByMuscleGroup, MuscleHeatMapData, UseVolumeAnalyticsReturn } from '../types/analytics';

// Standard muscle groups to always include (even with zero data)
const STANDARD_MUSCLE_GROUPS = ['Chest', 'Back', 'Shoulders', 'Legs', 'Arms', 'Core'];

/**
 * Hook for fetching volume analytics data (VOL-01, VOL-02, VOL-03)
 * Returns weekly sets per muscle group and 4-week aggregate heat map data
 */
export function useVolumeAnalytics(): UseVolumeAnalyticsReturn {
  const [volumeData, setVolumeData] = useState<VolumeByMuscleGroup[]>([]);
  const [heatMapData, setHeatMapData] = useState<MuscleHeatMapData[]>([]);
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

      // Fetch volume by muscle group (weekly sets per muscle group)
      const volumeResult = await conn.query(VOLUME_BY_MUSCLE_GROUP_SQL);
      const rawVolumeRows = volumeResult.toArray();
      console.log('[useVolumeAnalytics] volume raw rows:', rawVolumeRows.length, 'first row:', rawVolumeRows[0], 'week_start type:', typeof rawVolumeRows[0]?.week_start, 'week_start value:', rawVolumeRows[0]?.week_start);

      const volumeRows = rawVolumeRows.map((row: any) => {
        // DuckDB-WASM DATE returns millisecond-epoch integers (number or BigInt)
        const wsVal = row.week_start;
        let weekStartStr: string;
        if (typeof wsVal === 'number') {
          weekStartStr = new Date(wsVal).toISOString().split('T')[0];
        } else if (typeof wsVal === 'bigint') {
          weekStartStr = new Date(Number(wsVal)).toISOString().split('T')[0];
        } else {
          const d = new Date(wsVal);
          weekStartStr = !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : String(wsVal).split('T')[0];
        }
        return {
          muscleGroup: String(row.muscle_group),
          weekStart: weekStartStr,
          setCount: Number(row.set_count),
        };
      }) as VolumeByMuscleGroup[];

      // Backfill zero-data muscle groups for each week
      const weeks = Array.from(new Set(volumeRows.map(r => r.weekStart)));
      const backfilledVolumeData: VolumeByMuscleGroup[] = [];

      for (const week of weeks) {
        const weekData = volumeRows.filter(r => r.weekStart === week);
        const presentGroups = new Set(weekData.map(r => r.muscleGroup));

        // Add existing data
        backfilledVolumeData.push(...weekData);

        // Add missing standard muscle groups with zero sets
        for (const muscleGroup of STANDARD_MUSCLE_GROUPS) {
          if (!presentGroups.has(muscleGroup)) {
            backfilledVolumeData.push({
              muscleGroup,
              weekStart: week,
              setCount: 0,
            });
          }
        }
      }

      setVolumeData(backfilledVolumeData);

      // Fetch muscle heat map (4-week aggregate)
      const heatMapResult = await conn.query(MUSCLE_HEAT_MAP_SQL);
      const rawHeatMapRows = heatMapResult.toArray();
      console.log('[useVolumeAnalytics] heat map raw rows:', rawHeatMapRows.length, 'first row:', rawHeatMapRows[0]);

      const heatMapRows = rawHeatMapRows.map((row: any) => ({
        muscleGroup: String(row.muscle_group),
        totalSets: Number(row.total_sets),
      })) as MuscleHeatMapData[];

      // Backfill zero-data muscle groups for heat map
      const heatMapGroups = new Set(heatMapRows.map(r => r.muscleGroup));
      const backfilledHeatMapData: MuscleHeatMapData[] = [...heatMapRows];

      for (const muscleGroup of STANDARD_MUSCLE_GROUPS) {
        if (!heatMapGroups.has(muscleGroup)) {
          backfilledHeatMapData.push({
            muscleGroup,
            totalSets: 0,
          });
        }
      }

      setHeatMapData(backfilledHeatMapData);

      await conn.close();
    } catch (err) {
      console.error('Error fetching volume analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch volume analytics');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { volumeData, heatMapData, isLoading, error, refresh: fetchData };
}
