import { getDuckDB } from './duckdb-init';
import { DIM_EXERCISE_SQL, DIM_GYM_SQL } from './compiled-queries';
import type { Exercise, Gym } from '../types/database';

// Get current state of all exercises using dbt-equivalent SQL
export async function getExercises(): Promise<Exercise[]> {
  const db = getDuckDB();
  if (!db) {
    throw new Error('Database not initialized');
  }

  const conn = await db.connect();

  try {
    const result = await conn.query(DIM_EXERCISE_SQL);

    return result.toArray().map(row => ({
      exercise_id: row.exercise_id as string,
      name: row.name as string,
      muscle_group: row.muscle_group as string,
      is_global: row.is_global as boolean,
    }));
  } finally {
    await conn.close();
  }
}

// SQL query to get gyms with exercise counts
const GYMS_WITH_EXERCISE_COUNT_SQL = `
WITH all_gym_events AS (
    SELECT
        _event_id,
        _created_at,
        event_type,
        payload->>'gym_id' AS gym_id,
        payload->>'name' AS name,
        NULLIF(payload->>'location', 'null') AS location
    FROM events
    WHERE event_type IN ('gym_created', 'gym_updated', 'gym_deleted')
),

deduplicated AS (
    SELECT
        *,
        ROW_NUMBER() OVER (
            PARTITION BY gym_id
            ORDER BY _created_at DESC
        ) AS _rn
    FROM all_gym_events
),

active_gyms AS (
    SELECT
        gym_id,
        name,
        location
    FROM deduplicated
    WHERE _rn = 1 AND event_type != 'gym_deleted'
),

-- Get gym-specific exercises (is_global = false)
gym_exercises AS (
    SELECT
        payload->>'gym_id' AS gym_id,
        payload->>'exercise_id' AS exercise_id
    FROM events
    WHERE event_type = 'exercise_created'
        AND CAST(payload->>'is_global' AS BOOLEAN) = false
        AND payload->>'exercise_id' NOT IN (
            SELECT payload->>'exercise_id'
            FROM events
            WHERE event_type = 'exercise_deleted'
        )
)

SELECT
    g.gym_id,
    g.name,
    g.location,
    COALESCE(COUNT(ge.exercise_id), 0) AS exercise_count
FROM active_gyms g
LEFT JOIN gym_exercises ge ON g.gym_id = ge.gym_id
GROUP BY g.gym_id, g.name, g.location
ORDER BY g.name
`;

// Get current state of all gyms using dbt-equivalent SQL
export async function getGyms(): Promise<Gym[]> {
  const db = getDuckDB();
  if (!db) {
    throw new Error('Database not initialized');
  }

  const conn = await db.connect();

  try {
    const result = await conn.query(GYMS_WITH_EXERCISE_COUNT_SQL);

    return result.toArray().map(row => ({
      gym_id: row.gym_id as string,
      name: row.name as string,
      location: row.location as string | null,
      exercise_count: Number(row.exercise_count) || 0,
    }));
  } finally {
    await conn.close();
  }
}

// Get event count (for status display)
export async function getEventCount(): Promise<number> {
  const db = getDuckDB();
  if (!db) {
    throw new Error('Database not initialized');
  }

  const conn = await db.connect();

  try {
    const result = await conn.query('SELECT COUNT(*) as count FROM events');
    return Number(result.toArray()[0].count);
  } finally {
    await conn.close();
  }
}
