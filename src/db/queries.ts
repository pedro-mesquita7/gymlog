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
      gym_id: row.gym_id as string | null,
    }));
  } finally {
    await conn.close();
  }
}

// Get current state of all gyms using dbt-equivalent SQL
export async function getGyms(): Promise<Gym[]> {
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
