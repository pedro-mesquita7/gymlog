import { useState } from 'react';
import { getDuckDB } from '../db/duckdb-init';
import { FACT_SETS_SQL } from '../db/compiled-queries';

interface DataQualityTest {
  name: string;
  description: string;
  sql: string;
  category: 'custom' | 'schema' | 'anomaly';
}

interface DataQualityResult {
  name: string;
  description: string;
  category: string;
  status: 'pass' | 'fail' | 'error' | 'pending';
  failureCount: number;
  errorMessage?: string;
  durationMs: number;
}

interface DataQualityState {
  results: DataQualityResult[];
  isRunning: boolean;
  lastRunAt: Date | null;
  anomalyCount: number;
  runChecks: () => Promise<void>;
}

// Test definitions with compiled dbt SQL
const DATA_QUALITY_TESTS: DataQualityTest[] = [
  // Custom tests from dbt
  {
    name: 'Weight Positive',
    description: 'All logged weights must be positive',
    category: 'custom',
    sql: `
      WITH fact_sets AS (${FACT_SETS_SQL})
      SELECT set_id, exercise_id, weight_kg, logged_at
      FROM fact_sets
      WHERE weight_kg <= 0
    `,
  },
  {
    name: 'Reps Reasonable',
    description: 'Reps must be between 1 and 100',
    category: 'custom',
    sql: `
      WITH fact_sets AS (${FACT_SETS_SQL})
      SELECT set_id, exercise_id, reps, logged_at
      FROM fact_sets
      WHERE reps < 1 OR reps > 100
    `,
  },
  // Schema tests
  {
    name: 'Events ID Not Null',
    description: 'All events must have an ID',
    category: 'schema',
    sql: `
      SELECT _event_id
      FROM events
      WHERE _event_id IS NULL
    `,
  },
  {
    name: 'Events ID Unique',
    description: 'Event IDs must be unique',
    category: 'schema',
    sql: `
      SELECT _event_id, COUNT(*) as count
      FROM events
      GROUP BY _event_id
      HAVING COUNT(*) > 1
    `,
  },
  // Anomaly detection
  {
    name: 'Anomaly Count',
    description: 'Count sets with 50%+ weight changes',
    category: 'anomaly',
    sql: `
      WITH fact_sets AS (${FACT_SETS_SQL})
      SELECT COUNT(*) as anomaly_count
      FROM fact_sets
      WHERE is_anomaly = true
    `,
  },
];

export function useDataQuality(): DataQualityState {
  const [results, setResults] = useState<DataQualityResult[]>(
    DATA_QUALITY_TESTS.map((test) => ({
      name: test.name,
      description: test.description,
      category: test.category,
      status: 'pending' as const,
      failureCount: 0,
      durationMs: 0,
    }))
  );
  const [isRunning, setIsRunning] = useState(false);
  const [lastRunAt, setLastRunAt] = useState<Date | null>(null);
  const [anomalyCount, setAnomalyCount] = useState(0);

  const runChecks = async () => {
    setIsRunning(true);
    const db = getDuckDB();

    if (!db) {
      // Database not initialized - mark all as error
      setResults(
        DATA_QUALITY_TESTS.map((test) => ({
          name: test.name,
          description: test.description,
          category: test.category,
          status: 'error' as const,
          failureCount: 0,
          errorMessage: 'Database not initialized',
          durationMs: 0,
        }))
      );
      setIsRunning(false);
      return;
    }

    const newResults: DataQualityResult[] = [];
    let detectedAnomalyCount = 0;

    for (const test of DATA_QUALITY_TESTS) {
      const startTime = performance.now();

      try {
        const conn = await db.connect();
        const result = await conn.query(test.sql);
        const durationMs = Math.round(performance.now() - startTime);
        await conn.close();

        if (test.category === 'anomaly') {
          // For anomaly count query, extract the count value
          const count = result.numRows > 0 ? Number(result.toArray()[0]?.anomaly_count || 0) : 0;
          detectedAnomalyCount = count;

          newResults.push({
            name: test.name,
            description: test.description,
            category: test.category,
            status: 'pass',
            failureCount: count,
            durationMs,
          });
        } else {
          // For other tests, row count indicates failures
          const failureCount = result.numRows;

          newResults.push({
            name: test.name,
            description: test.description,
            category: test.category,
            status: failureCount === 0 ? 'pass' : 'fail',
            failureCount,
            durationMs,
          });
        }
      } catch (err) {
        const durationMs = Math.round(performance.now() - startTime);
        const errorMessage = err instanceof Error ? err.message : String(err);

        // Check if error is due to missing table/view (expected when no data)
        const isTableMissing = errorMessage.includes('does not exist') ||
                               errorMessage.includes('not found') ||
                               errorMessage.includes('no such table');

        newResults.push({
          name: test.name,
          description: test.description,
          category: test.category,
          status: 'error',
          failureCount: 0,
          errorMessage: isTableMissing ? 'No data' : errorMessage,
          durationMs,
        });
      }
    }

    setResults(newResults);
    setAnomalyCount(detectedAnomalyCount);
    setLastRunAt(new Date());
    setIsRunning(false);
  };

  return {
    results,
    isRunning,
    lastRunAt,
    anomalyCount,
    runChecks,
  };
}
