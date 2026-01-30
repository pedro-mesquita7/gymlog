import { getDuckDB } from './duckdb-init';
import { DIM_EXERCISE_SQL, DIM_GYM_SQL } from './compiled-queries';
import type { Exercise } from '../types/database';
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

// Get current state of all gyms using dbt-equivalent SQL
export async function getGyms(): Promise<{ gym_id: string; name: string; location: string | null; exercise_count: number }[]> {
  const db = getDuckDB();
  if (!db) {
    throw new Error('Database not initialized');
  }

  const conn = await db.connect();

  try {
    const result = await conn.query(DIM_GYM_SQL);

    return result.toArray().map(row => ({
      gym_id: row.gym_id as string,
      name: row.name as string,
      location: row.location as string | null,
      exercise_count: 0,
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
