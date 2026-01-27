import { getDuckDB } from './duckdb-init';
import type { Exercise, Gym } from '../types/database';

// Get current state of all exercises (derived from events)
// This is a simplified version - full implementation uses dbt-compiled SQL
export async function getExercises(): Promise<Exercise[]> {
  const db = getDuckDB();
  if (!db) {
    throw new Error('Database not initialized');
  }

  const conn = await db.connect();

  try {
    // Get latest state of each exercise by replaying events
    const result = await conn.query(`
      WITH exercise_events AS (
        SELECT
          payload->>'exercise_id' as exercise_id,
          payload->>'name' as name,
          payload->>'muscle_group' as muscle_group,
          CAST(payload->>'is_global' AS BOOLEAN) as is_global,
          payload->>'gym_id' as gym_id,
          event_type,
          _created_at,
          ROW_NUMBER() OVER (PARTITION BY payload->>'exercise_id' ORDER BY _created_at DESC) as rn
        FROM events
        WHERE event_type IN ('exercise_created', 'exercise_updated', 'exercise_deleted')
      )
      SELECT exercise_id, name, muscle_group, is_global, gym_id
      FROM exercise_events
      WHERE rn = 1 AND event_type != 'exercise_deleted'
      ORDER BY name
    `);

    return result.toArray().map(row => ({
      exercise_id: row.exercise_id as string,
      name: row.name as string,
      muscle_group: row.muscle_group as string,
      is_global: row.is_global as boolean,
      gym_id: row.gym_id as string | null,
    }));
  } finally {
    await conn.close();
  }
}

// Get current state of all gyms (derived from events)
export async function getGyms(): Promise<Gym[]> {
  const db = getDuckDB();
  if (!db) {
    throw new Error('Database not initialized');
  }

  const conn = await db.connect();

  try {
    const result = await conn.query(`
      WITH gym_events AS (
        SELECT
          payload->>'gym_id' as gym_id,
          payload->>'name' as name,
          payload->>'location' as location,
          event_type,
          _created_at,
          ROW_NUMBER() OVER (PARTITION BY payload->>'gym_id' ORDER BY _created_at DESC) as rn
        FROM events
        WHERE event_type IN ('gym_created', 'gym_updated', 'gym_deleted')
      )
      SELECT gym_id, name, location
      FROM gym_events
      WHERE rn = 1 AND event_type != 'gym_deleted'
      ORDER BY name
    `);

    return result.toArray().map(row => ({
      gym_id: row.gym_id as string,
      name: row.name as string,
      location: row.location as string | null,
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
