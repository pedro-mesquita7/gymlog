import { uuidv7 } from 'uuidv7';
import { getDuckDB, checkpoint } from './duckdb-init';
import type { GymLogEvent } from '../types/events';

// Generate timestamp-sortable event ID (DATA-07)
function createEventId(): string {
  return uuidv7();
}

// Generate ISO timestamp for _created_at
function createTimestamp(): string {
  return new Date().toISOString();
}

// Write a single event to the events table (DATA-04, DATA-08)
export async function writeEvent<T extends GymLogEvent>(
  eventData: Omit<T, '_event_id' | '_created_at'>
): Promise<T> {
  const db = getDuckDB();
  if (!db) {
    throw new Error('Database not initialized');
  }

  const event = {
    ...eventData,
    _event_id: createEventId(),
    _created_at: createTimestamp(),
  } as T;

  const conn = await db.connect();

  try {
    // Escape single quotes in JSON payload
    const payloadJson = JSON.stringify(event).replace(/'/g, "''");

    await conn.query(`
      INSERT INTO events (_event_id, _created_at, event_type, payload)
      VALUES ('${event._event_id}', '${event._created_at}', '${event.event_type}', '${payloadJson}')
    `);
  } finally {
    await conn.close();
  }

  // Flush to OPFS (non-blocking, fire-and-forget)
  checkpoint();

  return event;
}
