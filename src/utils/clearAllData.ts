import { getDuckDB, checkpoint } from '../db/duckdb-init';

/**
 * Selective data clear - removes workout data while preserving
 * exercise and gym definitions:
 * - Deletes non-exercise/gym events from DuckDB
 * - Clears workout-related localStorage keys
 * - Checkpoints and reloads
 */
export async function clearHistoricalData(): Promise<void> {
  try {
    const db = getDuckDB();
    if (db) {
      const conn = await db.connect();
      try {
        await conn.query(`
          DELETE FROM events WHERE event_type NOT IN (
            'exercise_created', 'exercise_updated', 'exercise_deleted',
            'gym_created', 'gym_updated', 'gym_deleted'
          )
        `);
        console.log('Deleted historical workout data (preserved exercises and gyms)');
      } finally {
        await conn.close();
      }
    }
  } catch (err) {
    console.warn('Failed to delete historical data:', err);
  }

  // Clear workout-related localStorage keys
  try {
    const keysToRemove = [
      'gymlog-workout',
      'gymlog-rotations',
      'gymlog-backup',
      'gymlog-progression-alerts',
      'gymlog-volume-thresholds',
      'gymlog-analytics-timerange',
    ];

    for (const key of keysToRemove) {
      localStorage.removeItem(key);
    }
    console.log('Cleared workout-related localStorage keys');
  } catch (err) {
    console.warn('Failed to clear localStorage:', err);
  }

  // Checkpoint to persist changes
  try {
    await checkpoint();
  } catch (err) {
    console.warn('Failed to checkpoint:', err);
  }

  // Reload page to reinitialize
  window.location.reload();
}
