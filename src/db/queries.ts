import { getDuckDB } from './duckdb-init';
import { DIM_EXERCISE_SQL, DIM_GYM_SQL } from './compiled-queries';
import type { Exercise, Gym } from '../types/database';
import type { Template, TemplateExercise } from '../types/template';

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

// Get current state of all templates using event replay pattern
export async function getTemplates(): Promise<Template[]> {
  const db = getDuckDB();
  if (!db) {
    throw new Error('Database not initialized');
  }

  const conn = await db.connect();

  try {
    // Get latest template state using event replay
    const result = await conn.query(`
      WITH template_events AS (
        SELECT
          payload->>'template_id' as template_id,
          payload->>'name' as name,
          payload->'exercises' as exercises,
          event_type,
          _created_at,
          ROW_NUMBER() OVER (
            PARTITION BY payload->>'template_id'
            ORDER BY _created_at DESC
          ) as rn
        FROM events
        WHERE event_type IN ('template_created', 'template_updated', 'template_deleted')
      ),
      archive_status AS (
        SELECT
          payload->>'template_id' as template_id,
          CAST(payload->>'is_archived' AS BOOLEAN) as is_archived,
          ROW_NUMBER() OVER (
            PARTITION BY payload->>'template_id'
            ORDER BY _created_at DESC
          ) as rn
        FROM events
        WHERE event_type = 'template_archived'
      )
      SELECT
        t.template_id,
        t.name,
        t.exercises,
        COALESCE(a.is_archived, false) as is_archived
      FROM template_events t
      LEFT JOIN archive_status a ON t.template_id = a.template_id AND a.rn = 1
      WHERE t.rn = 1 AND t.event_type != 'template_deleted'
      ORDER BY t.name ASC
    `);

    return result.toArray().map(row => ({
      template_id: row.template_id as string,
      name: row.name as string,
      exercises: JSON.parse(row.exercises as string) as TemplateExercise[],
      is_archived: row.is_archived as boolean,
    }));
  } finally {
    await conn.close();
  }
}
