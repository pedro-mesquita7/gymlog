import { getDuckDB, checkpoint } from '../db/duckdb-init';

/**
 * Full application reset - clears ALL persistence layers:
 * - DuckDB events table
 * - OPFS files
 * - All localStorage keys
 * Then reloads the page to reinitialize
 */
export async function clearAllData(): Promise<void> {
  // 1. Drop DuckDB events table
  try {
    const db = getDuckDB();
    if (db) {
      const conn = await db.connect();
      try {
        await conn.query('DROP TABLE IF EXISTS events');
        console.log('Dropped events table');
      } finally {
        await conn.close();
      }
    }
  } catch (err) {
    console.warn('Failed to drop events table:', err);
  }

  // 2. Clear OPFS files
  try {
    const root = await navigator.storage.getDirectory();
    for (const name of ['gymlog.db', 'gymlog.db.wal']) {
      try {
        await root.removeEntry(name);
        console.log(`Deleted OPFS file: ${name}`);
      } catch {
        // File may not exist, ignore
      }
    }
  } catch (err) {
    console.warn('Failed to clear OPFS:', err);
  }

  // 3. Clear ALL localStorage keys
  try {
    const keysToRemove = [
      'gymlog-workout',
      'gymlog-rotations',
      'gymlog-backup',
      'gymlog-progression-alerts',
      'gymlog-volume-thresholds',
    ];

    for (const key of keysToRemove) {
      localStorage.removeItem(key);
    }
    console.log('Cleared localStorage keys');
  } catch (err) {
    console.warn('Failed to clear localStorage:', err);
  }

  // 4. Reload page to reinitialize everything
  window.location.reload();
}

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
