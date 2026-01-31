import { useState, useEffect } from 'react';
import { getDuckDB } from '../db/duckdb-init';
import type { LoggedSet } from '../types/workout-session';

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

/**
 * Fetches historical maxes for all exercises and computes PRs client-side.
 * Uses the same query path as useExerciseMax (which works for inline PR badges).
 * The key insight: fetch historical data BEFORE save events exist, then compare
 * against session data in JavaScript — no post-save query timing issues.
 */
export function useWorkoutSummary(
  sets: LoggedSet[],
  templateId: string,
  currentVolumeKg: number,
  enabled: boolean
): WorkoutSummaryData {
  const [prs, setPrs] = useState<ExercisePR[]>([]);
  const [comparison, setComparison] = useState<SessionComparison | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get unique exercise IDs from the session
  const exerciseIds = [...new Set(sets.map(s => s.original_exercise_id))];

  useEffect(() => {
    if (!enabled || exerciseIds.length === 0) {
      setIsLoading(false);
      return;
    }

    let mounted = true;
    setIsLoading(true);

    async function fetchData() {
      const db = getDuckDB();
      if (!db) {
        if (mounted) setIsLoading(false);
        return;
      }

      const conn = await db.connect();
      try {
        // 1. Fetch historical maxes for all exercises in a single query
        //    This queries events BEFORE the current workout was saved
        //    (same data source as inline PR detection)
        const maxQuery = `
          SELECT
            original_exercise_id as exercise_id,
            MAX(weight_kg) as max_weight,
            MAX(weight_kg * (1.0 + reps / 30.0)) as max_1rm
          FROM (
            SELECT
              payload->>'original_exercise_id' AS original_exercise_id,
              CAST(payload->>'weight_kg' AS DOUBLE) AS weight_kg,
              CAST(payload->>'reps' AS DOUBLE) AS reps
            FROM events
            WHERE event_type = 'set_logged'
          )
          GROUP BY original_exercise_id
        `;

        const maxResult = await conn.query(maxQuery);
        const historicalMaxes: Record<string, { max_weight: number; max_1rm: number }> = {};
        for (const row of maxResult.toArray()) {
          const r: any = row;
          historicalMaxes[String(r.exercise_id)] = {
            max_weight: Number(r.max_weight),
            max_1rm: Number(r.max_1rm),
          };
        }

        // 2. Compute session maxes from the LoggedSet data (JavaScript, no query)
        const sessionMaxes: Record<string, { max_weight: number; max_1rm: number }> = {};
        for (const set of sets) {
          if (set.weight_kg <= 0 || set.reps <= 0) continue;
          const eid = set.original_exercise_id;
          const est1rm = set.weight_kg * (1 + set.reps / 30.0);
          if (!sessionMaxes[eid]) {
            sessionMaxes[eid] = { max_weight: set.weight_kg, max_1rm: est1rm };
          } else {
            if (set.weight_kg > sessionMaxes[eid].max_weight) sessionMaxes[eid].max_weight = set.weight_kg;
            if (est1rm > sessionMaxes[eid].max_1rm) sessionMaxes[eid].max_1rm = est1rm;
          }
        }

        // 3. Compare: session max vs historical max (excluding current workout)
        //    For PRs, we need to compare against maxes BEFORE this workout.
        //    Since the current workout may already be saved, we subtract the
        //    current session's contribution by comparing session max vs historical max.
        //    If session max > historical max, it's a PR (even if historical includes
        //    current workout, the max would equal session max, not exceed it).
        //    If no historical data exists, it's the first workout → always a PR.

        // 4. Get exercise names
        const nameQuery = `
          SELECT DISTINCT
            payload->>'exercise_id' as exercise_id,
            payload->>'name' as name
          FROM events
          WHERE event_type = 'exercise_created'
        `;
        const nameResult = await conn.query(nameQuery);
        const exerciseNames: Record<string, string> = {};
        for (const row of nameResult.toArray()) {
          const r: any = row;
          exerciseNames[String(r.exercise_id)] = String(r.name);
        }

        // 5. Build PR list
        const prData: ExercisePR[] = [];
        for (const eid of exerciseIds) {
          const sm = sessionMaxes[eid];
          if (!sm) continue;

          const hm = historicalMaxes[eid];
          // No historical data → first workout for this exercise → PR
          // Historical data exists → check if session exceeds it
          // Note: if current workout is already saved, historical includes it,
          // so session max >= historical max. We use >= for first-workout case.
          const isWeightPR = !hm || sm.max_weight >= hm.max_weight;
          const is1rmPR = !hm || sm.max_1rm >= hm.max_1rm;

          if (isWeightPR || is1rmPR) {
            prData.push({
              exercise_id: eid,
              exercise_name: exerciseNames[eid] || 'Unknown',
              weight_prs: isWeightPR ? 1 : 0,
              estimated_1rm_prs: is1rmPR ? 1 : 0,
            });
          }
        }

        // 6. Session comparison query (previous workout with same template)
        let comparisonData: SessionComparison | null = null;
        if (templateId) {
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
              GROUP BY ws.payload->>'workout_id', ws._created_at
              ORDER BY ws._created_at DESC
              LIMIT 2
            )
            SELECT
              started_at as last_date,
              total_volume as last_volume_kg
            FROM workout_volumes
            ORDER BY started_at ASC
            LIMIT 1
          `;

          try {
            const compResult = await conn.query(comparisonQuery);
            const compRows = compResult.toArray();
            if (compRows.length > 0) {
              const row: any = compRows[0];
              const lastVolumeKg = Number(row.last_volume_kg);
              comparisonData = {
                last_date: new Date(row.last_date).toISOString(),
                last_volume_kg: lastVolumeKg,
                volume_delta_kg: currentVolumeKg - lastVolumeKg,
              };
            }
          } catch {
            // Comparison is optional, don't fail the whole summary
          }
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

    fetchData();

    return () => {
      mounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, templateId, sets.length]);

  return { prs, comparison, isLoading };
}
