// TOON Export Service
// Pure async functions -- no React, no hooks.
// Queries DuckDB for workout data and encodes as TOON-formatted strings
// for LLM consumption (copy/paste into ChatGPT/Claude).

import { encode } from '@toon-format/toon';
import { getDuckDB } from '../db/duckdb-init';
import type { AsyncDuckDBConnection } from '@duckdb/duckdb-wasm';

// ── Interfaces ──────────────────────────────────────────────────────────

interface ToonExportData {
  metadata: {
    app: string;
    exported_at: string;
    scope: string;
    date_range: { from: string; to: string };
  };
  exercises: Array<{
    name: string;
    muscle_group: string;
    equipment: string;
  }>;
  workouts: Array<{
    date: string;
    gym: string;
    template: string;
    sets: Array<{
      exercise: string;
      weight: number;
      reps: number;
      set_number: number;
      pr_type: string | null;
    }>;
  }>;
}

interface ExerciseRow {
  exercise_id: string;
  name: string;
  muscle_group: string;
}

interface GymRow {
  gym_id: string;
  name: string;
}

interface TemplateRow {
  template_id: string;
  name: string;
}

interface WorkoutRow {
  workout_id: string;
  template_id: string;
  gym_id: string;
  started_at: string;
}

interface SetWithPrRow {
  set_id: string;
  workout_id: string;
  exercise_id: string;
  original_exercise_id: string;
  weight_kg: number;
  reps: number;
  estimated_1rm: number;
  is_weight_pr: boolean;
  is_1rm_pr: boolean;
  logged_at: string;
}

// ── SQL Queries ─────────────────────────────────────────────────────────

const EXERCISES_SQL = `
WITH all_exercise_events AS (
    SELECT
        payload->>'exercise_id' AS exercise_id,
        payload->>'name' AS name,
        payload->>'muscle_group' AS muscle_group,
        event_type,
        ROW_NUMBER() OVER (
            PARTITION BY payload->>'exercise_id'
            ORDER BY _created_at DESC
        ) AS rn
    FROM events
    WHERE event_type IN ('exercise_created', 'exercise_updated', 'exercise_deleted')
)
SELECT exercise_id, name, muscle_group
FROM all_exercise_events
WHERE rn = 1 AND event_type != 'exercise_deleted'
`;

const GYMS_SQL = `
WITH all_gym_events AS (
    SELECT
        payload->>'gym_id' AS gym_id,
        payload->>'name' AS name,
        event_type,
        ROW_NUMBER() OVER (
            PARTITION BY payload->>'gym_id'
            ORDER BY _created_at DESC
        ) AS rn
    FROM events
    WHERE event_type IN ('gym_created', 'gym_updated', 'gym_deleted')
)
SELECT gym_id, name
FROM all_gym_events
WHERE rn = 1 AND event_type != 'gym_deleted'
`;

const TEMPLATES_SQL = `
WITH template_events AS (
    SELECT
        payload->>'template_id' AS template_id,
        payload->>'name' AS name,
        event_type,
        ROW_NUMBER() OVER (
            PARTITION BY payload->>'template_id'
            ORDER BY _created_at DESC
        ) AS rn
    FROM events
    WHERE event_type IN ('template_created', 'template_updated', 'template_deleted')
)
SELECT template_id, name
FROM template_events
WHERE rn = 1 AND event_type != 'template_deleted'
`;

const SETS_WITH_PRS_SQL = `
WITH set_events AS (
    SELECT
        payload->>'set_id' AS set_id,
        payload->>'workout_id' AS workout_id,
        payload->>'exercise_id' AS exercise_id,
        payload->>'original_exercise_id' AS original_exercise_id,
        CAST(payload->>'weight_kg' AS DOUBLE) AS weight_kg,
        CAST(payload->>'reps' AS INTEGER) AS reps,
        COALESCE(payload->>'logged_at', CAST(_created_at AS VARCHAR)) AS logged_at,
        _created_at
    FROM events
    WHERE event_type = 'set_logged'
),
sets_with_1rm AS (
    SELECT
        *,
        weight_kg * (1 + reps / 30.0) AS estimated_1rm
    FROM set_events
),
sets_with_prev AS (
    SELECT
        s.*,
        MAX(weight_kg) OVER (
            PARTITION BY original_exercise_id
            ORDER BY logged_at
            ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
        ) AS previous_max_weight,
        MAX(estimated_1rm) OVER (
            PARTITION BY original_exercise_id
            ORDER BY logged_at
            ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
        ) AS previous_max_1rm
    FROM sets_with_1rm s
),
sets_with_pr_flags AS (
    SELECT
        *,
        CASE
            WHEN previous_max_weight IS NULL THEN true
            WHEN weight_kg > previous_max_weight THEN true
            ELSE false
        END AS is_weight_pr,
        CASE
            WHEN previous_max_1rm IS NULL AND estimated_1rm IS NOT NULL THEN true
            WHEN estimated_1rm IS NOT NULL AND estimated_1rm > previous_max_1rm THEN true
            ELSE false
        END AS is_1rm_pr
    FROM sets_with_prev
)
SELECT
    set_id,
    workout_id,
    exercise_id,
    original_exercise_id,
    weight_kg,
    reps,
    estimated_1rm,
    is_weight_pr,
    is_1rm_pr,
    logged_at
FROM sets_with_pr_flags
`;

// ── Shared Helper ───────────────────────────────────────────────────────

async function queryWorkoutData(
  workoutWhereClause: string,
  scope: string,
): Promise<ToonExportData | null> {
  const db = getDuckDB();
  if (!db) return null;

  let conn: AsyncDuckDBConnection | null = null;

  try {
    conn = await db.connect();

    // 1. Query workouts matching the where clause
    const workoutsResult = await conn.query(`
      SELECT
          payload->>'workout_id' AS workout_id,
          payload->>'template_id' AS template_id,
          payload->>'gym_id' AS gym_id,
          COALESCE(payload->>'started_at', CAST(_created_at AS VARCHAR)) AS started_at
      FROM events
      WHERE event_type = 'workout_started'
        AND ${workoutWhereClause}
      ORDER BY _created_at DESC
    `);

    const workouts = workoutsResult.toArray().map(row => ({
      workout_id: row.workout_id as string,
      template_id: row.template_id as string,
      gym_id: row.gym_id as string,
      started_at: row.started_at as string,
    })) as WorkoutRow[];

    if (workouts.length === 0) return null;

    // 2. Get workout IDs for filtering sets
    const workoutIds = workouts.map(w => w.workout_id);
    const workoutIdList = workoutIds.map(id => `'${id.replace(/'/g, "''")}'`).join(',');

    // 3. Query sets with PR calculations for these workouts
    const setsResult = await conn.query(`
      WITH all_sets AS (${SETS_WITH_PRS_SQL})
      SELECT * FROM all_sets
      WHERE workout_id IN (${workoutIdList})
      ORDER BY logged_at ASC
    `);

    const sets = setsResult.toArray().map(row => ({
      set_id: row.set_id as string,
      workout_id: row.workout_id as string,
      exercise_id: row.exercise_id as string,
      original_exercise_id: row.original_exercise_id as string,
      weight_kg: Number(row.weight_kg),
      reps: Number(row.reps),
      estimated_1rm: Number(row.estimated_1rm),
      is_weight_pr: Boolean(row.is_weight_pr),
      is_1rm_pr: Boolean(row.is_1rm_pr),
      logged_at: row.logged_at as string,
    })) as SetWithPrRow[];

    // 4. Query exercise definitions
    const exercisesResult = await conn.query(EXERCISES_SQL);
    const exercises = exercisesResult.toArray().map(row => ({
      exercise_id: row.exercise_id as string,
      name: row.name as string,
      muscle_group: row.muscle_group as string,
    })) as ExerciseRow[];

    // 5. Query gym names
    const gymsResult = await conn.query(GYMS_SQL);
    const gyms = gymsResult.toArray().map(row => ({
      gym_id: row.gym_id as string,
      name: row.name as string,
    })) as GymRow[];

    // 6. Query template names
    const templatesResult = await conn.query(TEMPLATES_SQL);
    const templates = templatesResult.toArray().map(row => ({
      template_id: row.template_id as string,
      name: row.name as string,
    })) as TemplateRow[];

    // ── Build lookup maps ──

    const exerciseMap = new Map(exercises.map(e => [e.exercise_id, e]));
    const gymMap = new Map(gyms.map(g => [g.gym_id, g]));
    const templateMap = new Map(templates.map(t => [t.template_id, t]));

    // ── Collect unique exercise IDs referenced by sets ──

    const referencedExerciseIds = new Set<string>();
    for (const s of sets) {
      referencedExerciseIds.add(s.exercise_id);
    }

    // ── Build date range ──

    const dates = workouts.map(w => w.started_at).sort();
    const dateFrom = dates[0] ?? '';
    const dateTo = dates[dates.length - 1] ?? '';

    // ── Group sets by workout ──

    const setsByWorkout = new Map<string, SetWithPrRow[]>();
    for (const s of sets) {
      const existing = setsByWorkout.get(s.workout_id);
      if (existing) {
        existing.push(s);
      } else {
        setsByWorkout.set(s.workout_id, [s]);
      }
    }

    // ── Assemble ToonExportData ──

    const exerciseList = Array.from(referencedExerciseIds).map(id => {
      const ex = exerciseMap.get(id);
      return {
        name: ex?.name ?? 'Unknown',
        muscle_group: ex?.muscle_group ?? 'Unknown',
        equipment: 'barbell', // Equipment not tracked in events; placeholder
      };
    });

    const workoutList = workouts.map(w => {
      const workoutSets = setsByWorkout.get(w.workout_id) ?? [];
      let setNumber = 0;

      return {
        date: w.started_at.split('T')[0] ?? w.started_at,
        gym: gymMap.get(w.gym_id)?.name ?? 'Unknown Gym',
        template: templateMap.get(w.template_id)?.name ?? 'Unknown Template',
        sets: workoutSets.map(s => {
          setNumber += 1;
          const prType = derivePrType(s.is_weight_pr, s.is_1rm_pr);
          return {
            exercise: exerciseMap.get(s.exercise_id)?.name ?? 'Unknown',
            weight: s.weight_kg,
            reps: s.reps,
            set_number: setNumber,
            pr_type: prType,
          };
        }),
      };
    });

    return {
      metadata: {
        app: 'GymLog',
        exported_at: new Date().toISOString(),
        scope,
        date_range: { from: dateFrom, to: dateTo },
      },
      exercises: exerciseList,
      workouts: workoutList,
    };
  } finally {
    if (conn) {
      await conn.close();
    }
  }
}

function derivePrType(isWeightPr: boolean, is1rmPr: boolean): string | null {
  if (isWeightPr && is1rmPr) return 'weight_and_1rm';
  if (isWeightPr) return 'weight';
  if (is1rmPr) return '1rm';
  return null;
}

// ── Public Export Functions ──────────────────────────────────────────────

/**
 * Export the most recent workout as a TOON-formatted string.
 * Returns empty string if no workouts exist.
 */
export async function exportLastWorkoutToon(): Promise<string> {
  const db = getDuckDB();
  if (!db) return '';

  let conn: AsyncDuckDBConnection | null = null;
  try {
    conn = await db.connect();

    // Find most recent workout_started event
    const latestResult = await conn.query(`
      SELECT payload->>'workout_id' AS workout_id
      FROM events
      WHERE event_type = 'workout_started'
      ORDER BY _created_at DESC
      LIMIT 1
    `);

    const rows = latestResult.toArray();
    if (rows.length === 0) return '';

    const workoutId = rows[0].workout_id as string;
    await conn.close();
    conn = null;

    const escapedId = workoutId.replace(/'/g, "''");
    const data = await queryWorkoutData(
      `payload->>'workout_id' = '${escapedId}'`,
      'last_workout',
    );

    if (!data) return '';
    return encode(data, { keyFolding: 'safe' });
  } catch (err) {
    console.warn('TOON export (last workout) failed:', err);
    return '';
  } finally {
    if (conn) {
      await conn.close();
    }
  }
}

/**
 * Export rotation cycle data as a TOON-formatted string.
 * Finds the last N complete passes through the template list.
 * Returns empty string if no rotation data exists.
 */
export async function exportRotationCycleToon(
  rotationCount: number,
  rotationTemplateIds: string[],
  _currentPosition: number,
): Promise<string> {
  if (rotationTemplateIds.length === 0) return '';

  const totalWorkouts = rotationCount * rotationTemplateIds.length;
  const templateIdList = rotationTemplateIds
    .map(id => `'${id.replace(/'/g, "''")}'`)
    .join(',');

  // We need a subquery approach: find the N most recent workouts
  // matching any of the rotation template IDs, then filter the main
  // queryWorkoutData to just those workout IDs.
  const db = getDuckDB();
  if (!db) return '';

  let conn: AsyncDuckDBConnection | null = null;
  try {
    conn = await db.connect();

    const matchingResult = await conn.query(`
      SELECT payload->>'workout_id' AS workout_id
      FROM events
      WHERE event_type = 'workout_started'
        AND payload->>'template_id' IN (${templateIdList})
      ORDER BY _created_at DESC
      LIMIT ${totalWorkouts}
    `);

    const workoutIds = matchingResult.toArray().map(row => row.workout_id as string);
    await conn.close();
    conn = null;

    if (workoutIds.length === 0) return '';

    const workoutIdList = workoutIds
      .map(id => `'${id.replace(/'/g, "''")}'`)
      .join(',');

    const data = await queryWorkoutData(
      `payload->>'workout_id' IN (${workoutIdList})`,
      'rotation_cycle',
    );

    if (!data) return '';
    return encode(data, { keyFolding: 'safe' });
  } catch (err) {
    console.warn('TOON export (rotation cycle) failed:', err);
    return '';
  } finally {
    if (conn) {
      await conn.close();
    }
  }
}

/**
 * Export workout data for a time range as a TOON-formatted string.
 * @param days - Number of days to look back (30, 90, 180, 365), or null for all time.
 * Returns empty string if no data exists in range.
 */
export async function exportTimeRangeToon(days: number | null): Promise<string> {
  const timeFilter = days !== null
    ? `CAST(COALESCE(payload->>'started_at', CAST(_created_at AS VARCHAR)) AS TIMESTAMPTZ) >= CURRENT_DATE - INTERVAL '${days} days'`
    : '1=1';

  try {
    const data = await queryWorkoutData(timeFilter, 'time_range');
    if (!data) return '';
    return encode(data, { keyFolding: 'safe' });
  } catch (err) {
    console.warn('TOON export (time range) failed:', err);
    return '';
  }
}
