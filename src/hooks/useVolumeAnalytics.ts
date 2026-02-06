import { useState, useEffect, useCallback, useRef } from 'react';
import { getDuckDB } from '../db/duckdb-init';
import { volumeByMuscleGroupSQL, muscleHeatMapSQL } from '../db/compiled-queries';
import type { VolumeByMuscleGroup, VolumeByMuscleGroupAvg, MuscleHeatMapData, UseVolumeAnalyticsReturn } from '../types/analytics';

// Standard muscle groups to always include (even with zero data)
const STANDARD_MUSCLE_GROUPS = ['Chest', 'Back', 'Shoulders', 'Legs', 'Arms', 'Core'];

/**
 * Hook for fetching volume analytics data (VOL-01, VOL-02, VOL-03)
 * Returns averaged weekly sets per muscle group and heat map data for given time range
 */
export function useVolumeAnalytics(days?: number | null): UseVolumeAnalyticsReturn {
  const [volumeData, setVolumeData] = useState<VolumeByMuscleGroup[]>([]);
  const [volumeAvgData, setVolumeAvgData] = useState<VolumeByMuscleGroupAvg[]>([]);
  const [heatMapData, setHeatMapData] = useState<MuscleHeatMapData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef(false);

  // Resolve undefined to default 28 days; null = all time
  const resolvedDays = days === undefined ? 28 : days;

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

      // Fetch averaged volume by muscle group (new schema: muscle_group, avg_weekly_sets)
      const volumeSQL = volumeByMuscleGroupSQL(resolvedDays);
      const volumeResult = await conn.query(volumeSQL);
      const rawVolumeRows = volumeResult.toArray();

      // Map to averaged data (new format from Plan 01 SQL)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const avgRows = rawVolumeRows.map((row: any) => ({
        muscleGroup: String(row.muscle_group),
        avgWeeklySets: Number(row.avg_weekly_sets),
      })) as VolumeByMuscleGroupAvg[];

      // Backfill zero-data muscle groups for avg data
      const avgGroups = new Set(avgRows.map(r => r.muscleGroup));
      const backfilledAvgData: VolumeByMuscleGroupAvg[] = [...avgRows];
      for (const muscleGroup of STANDARD_MUSCLE_GROUPS) {
        if (!avgGroups.has(muscleGroup)) {
          backfilledAvgData.push({ muscleGroup, avgWeeklySets: 0 });
        }
      }

      // Also maintain backward-compat volumeData (convert avg to single-week format)
      // This keeps existing components working until they migrate to volumeAvgData
      const backfilledVolumeData: VolumeByMuscleGroup[] = backfilledAvgData.map(r => ({
        muscleGroup: r.muscleGroup,
        weekStart: new Date().toISOString().split('T')[0], // placeholder
        setCount: Math.round(r.avgWeeklySets),
      }));

      // Fetch muscle heat map
      const heatMapSQL = muscleHeatMapSQL(resolvedDays);
      const heatMapResult = await conn.query(heatMapSQL);
      const rawHeatMapRows = heatMapResult.toArray();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

      if (!abortRef.current) {
        setVolumeData(backfilledVolumeData);
        setVolumeAvgData(backfilledAvgData);
        setHeatMapData(backfilledHeatMapData);
      }

      await conn.close();
    } catch (err) {
      if (!abortRef.current) {
        console.error('Error fetching volume analytics:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch volume analytics');
      }
    } finally {
      if (!abortRef.current) {
        setIsLoading(false);
      }
    }
  }, [resolvedDays]);

  useEffect(() => {
    abortRef.current = false;
    fetchData();
    return () => { abortRef.current = true; };
  }, [fetchData]);

  return { volumeData, volumeAvgData, heatMapData, isLoading, error, refresh: fetchData };
}
