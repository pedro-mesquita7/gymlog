import type * as duckdb from '@duckdb/duckdb-wasm';
import { vi } from 'vitest';

export interface MockQueryResult {
  toArray: () => unknown[];
}

export interface MockConnection {
  query: (sql: string) => Promise<MockQueryResult>;
  close: () => Promise<void>;
}

export interface MockAsyncDuckDB {
  connect: () => Promise<MockConnection>;
}

/**
 * Create a mock DuckDB instance for testing
 *
 * @param queryResults - Map of SQL query patterns to their mock results
 * @returns Mock AsyncDuckDB instance
 *
 * @example
 * const mockDB = createMockDuckDB({
 *   'SELECT * FROM exercises': [{ exercise_id: '1', name: 'Bench Press' }],
 * });
 */
export function createMockDuckDB(
  queryResults: Record<string, unknown[]> = {}
): MockAsyncDuckDB {
  const mockQuery = vi.fn(async (sql: string): Promise<MockQueryResult> => {
    // Find matching query result (supports partial match for flexibility)
    const matchingKey = Object.keys(queryResults).find(key =>
      sql.includes(key) || key === '*'
    );

    const data = matchingKey ? queryResults[matchingKey] : [];

    return {
      toArray: () => data,
    };
  });

  const mockClose = vi.fn(async () => {});

  const mockConnection: MockConnection = {
    query: mockQuery,
    close: mockClose,
  };

  const mockConnect = vi.fn(async () => mockConnection);

  return {
    connect: mockConnect,
  };
}

/**
 * Mock the getDuckDB() function with custom query results
 *
 * @param queryResults - Map of SQL query patterns to their mock results
 * @returns The mock DuckDB instance
 *
 * @example
 * // In test file:
 * vi.mock('./db/duckdb-init', () => ({
 *   getDuckDB: mockGetDuckDB({
 *     'SELECT * FROM exercises': [{ exercise_id: '1', name: 'Squat' }],
 *   }),
 * }));
 */
export function mockGetDuckDB(
  queryResults: Record<string, unknown[]> = {}
): () => MockAsyncDuckDB {
  const mockDB = createMockDuckDB(queryResults);
  return vi.fn(() => mockDB as unknown as duckdb.AsyncDuckDB);
}
