import { useState, useEffect } from 'react';
import { getDuckDB } from '../db/duckdb-init';

export interface ExercisePR {
  exercise_id: string;
  exercise_name: string;
  weight_prs: number;
  estimated_1rm_prs: number;
}

export interface SessionComparison {
  last_date: string;
  last_volume_kg: number;
  volume_delta_kg: number;
}

export interface WorkoutSummaryData {
  prs: ExercisePR[];
  comparison: SessionComparison | null;
  isLoading: boolean;
}

export function useWorkoutSummary(
  workoutId: string,
  templateId: string,
  currentVolumeKg: number
): WorkoutSummaryData {
  const [prs, setPrs] = useState<ExercisePR[]>([]);
  const [comparison, setComparison] = useState<SessionComparison | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!workoutId) {
      setIsLoading(false);
      return;
    }

    let mounted = true;
    setIsLoading(true);

    async function fetchSummaryData() {
      const db = getDuckDB();
      if (!db) {
        console.error('DuckDB not initialized');
        if (mounted) setIsLoading(false);
        return;
      }

      const conn = await db.connect();
      try {
        // PR Detection Query
        const prQuery = `
          WITH all_sets AS (
            SELECT
              payload->>'workout_id' as workout_id,
              payload->>'original_exercise_id' as exercise_id,
              CAST(payload->>'weight_kg' AS DOUBLE) as weight_kg,
              CAST(payload->>'reps' AS INTEGER) as reps,
              CAST(payload->>'weight_kg' AS DOUBLE) * (1 + CAST(payload->>'reps' AS INTEGER) / 30.0) as estimated_1rm,
              ROW_NUMBER() OVER (ORDER BY _created_at, _event_id) as rowid
            FROM events
            WHERE event_type = 'set_logged'
          ),
          ranked AS (
            SELECT *,
              MAX(weight_kg) OVER (PARTITION BY exercise_id ORDER BY rowid ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING) as prev_max_weight,
              MAX(estimated_1rm) OVER (PARTITION BY exercise_id ORDER BY rowid ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING) as prev_max_1rm
            FROM all_sets
          )
          SELECT exercise_id,
            COUNT(CASE WHEN weight_kg > COALESCE(prev_max_weight, 0) THEN 1 END) as weight_prs,
            COUNT(CASE WHEN estimated_1rm > COALESCE(prev_max_1rm, 0) THEN 1 END) as estimated_1rm_prs
          FROM ranked
          WHERE workout_id = '${workoutId}'
            AND (weight_kg > COALESCE(prev_max_weight, 0) OR estimated_1rm > COALESCE(prev_max_1rm, 0))
          GROUP BY exercise_id
        `;

        const prResult = await conn.query(prQuery);
        const prRows = prResult.toArray().map((row: any) => ({
          exercise_id: String(row.exercise_id),
          weight_prs: Number(row.weight_prs),
          estimated_1rm_prs: Number(row.estimated_1rm_prs),
        }));

        // Get exercise names
        const exerciseNameQuery = `
          SELECT DISTINCT
            payload->>'exercise_id' as exercise_id,
            payload->>'name' as name
          FROM events
          WHERE event_type = 'exercise_created'
        `;

        const exerciseNameResult = await conn.query(exerciseNameQuery);
        const exerciseNames = exerciseNameResult.toArray().reduce((map: Record<string, string>, row: any) => {
          map[String(row.exercise_id)] = String(row.name);
          return map;
        }, {} as Record<string, string>);

        // Combine PR data with exercise names
        const prData: ExercisePR[] = prRows.map(row => ({
          exercise_id: row.exercise_id,
          exercise_name: exerciseNames[row.exercise_id] || 'Unknown',
          weight_prs: row.weight_prs,
          estimated_1rm_prs: row.estimated_1rm_prs,
        }));

        // Session Comparison Query
        const comparisonQuery = `
          WITH workout_volumes AS (
            SELECT
              ws.payload->>'workout_id' as workout_id,
              ws._created_at as started_at,
              SUM(CAST(sl.payload->>'weight_kg' AS DOUBLE) * CAST(sl.payload->>'reps' AS INTEGER)) as total_volume
            FROM events ws
            JOIN events wc ON wc.event_type = 'workout_completed'
              AND wc.payload->>'workout_id' = ws.payload->>'workout_id'
            JOIN events sl ON sl.event_type = 'set_logged'
              AND sl.payload->>'workout_id' = ws.payload->>'workout_id'
            WHERE ws.event_type = 'workout_started'
              AND ws.payload->>'template_id' = '${templateId}'
              AND ws.payload->>'workout_id' != '${workoutId}'
            GROUP BY ws.payload->>'workout_id', ws._created_at
            ORDER BY ws._created_at DESC
            LIMIT 1
          )
          SELECT
            started_at as last_date,
            total_volume as last_volume_kg
          FROM workout_volumes
        `;

        const comparisonResult = await conn.query(comparisonQuery);
        const comparisonRows = comparisonResult.toArray();

        let comparisonData: SessionComparison | null = null;
        if (comparisonRows.length > 0) {
          const row: any = comparisonRows[0];
          const lastVolumeKg = Number(row.last_volume_kg);
          comparisonData = {
            last_date: new Date(row.last_date).toISOString(),
            last_volume_kg: lastVolumeKg,
            volume_delta_kg: currentVolumeKg - lastVolumeKg,
          };
        }

        if (mounted) {
          setPrs(prData);
          setComparison(comparisonData);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Failed to fetch workout summary:', err);
        if (mounted) {
          setPrs([]);
          setComparison(null);
          setIsLoading(false);
        }
      } finally {
        await conn.close();
      }
    }

    fetchSummaryData();

    return () => {
      mounted = false;
    };
  }, [workoutId, templateId, currentVolumeKg]);

  return { prs, comparison, isLoading };
}
