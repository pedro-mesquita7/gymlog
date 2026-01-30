import { uuidv7 } from 'uuidv7';
import { getDuckDB, checkpoint } from './duckdb-init';
import type { GymLogEvent } from '../types/events';

// Generate timestamp-sortable event ID (DATA-07)
export function createEventId(): string {
  return uuidv7();
}

// Generate ISO timestamp for _created_at
export function createTimestamp(): string {
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

// Read all events of a specific type
export async function readEvents<T extends GymLogEvent>(
  eventType: T['event_type']
): Promise<T[]> {
  const db = getDuckDB();
  if (!db) {
    throw new Error('Database not initialized');
  }

  const conn = await db.connect();

  try {
    const result = await conn.query(`
      SELECT payload
      FROM events
      WHERE event_type = '${eventType}'
      ORDER BY _created_at ASC
    `);

    return result.toArray().map(row => JSON.parse(row.payload as string) as T);
  } finally {
    await conn.close();
  }
}

// Read all events (for debugging/export)
export async function readAllEvents(): Promise<GymLogEvent[]> {
  const db = getDuckDB();
  if (!db) {
    throw new Error('Database not initialized');
  }

  const conn = await db.connect();

  try {
    const result = await conn.query(`
      SELECT payload
      FROM events
      ORDER BY _created_at ASC
    `);

    return result.toArray().map(row => JSON.parse(row.payload as string) as GymLogEvent);
  } finally {
    await conn.close();
  }
}
