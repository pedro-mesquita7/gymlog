import { useState, useEffect, useCallback } from 'react';
import { getDuckDB } from '../db/duckdb-init';
import { EXERCISE_HISTORY_SQL, PR_LIST_SQL, CURRENT_MAX_SQL } from '../db/compiled-queries';
import type { SetHistory, PRRecord, ExerciseMax, HistoryByDate } from '../types/analytics';

interface UseHistoryOptions {
  exerciseId: string;
  currentGymId: string;  // For gym-specific filtering
}

interface UseHistoryReturn {
  history: SetHistory[];
  historyByDate: HistoryByDate[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useHistory({ exerciseId, currentGymId }: UseHistoryOptions): UseHistoryReturn {
  const [history, setHistory] = useState<SetHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!exerciseId) return;

    const db = getDuckDB();
    if (!db) {
      setError('Database not initialized');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const conn = await db.connect();

      // Query with gym filtering parameter
      const result = await conn.query(EXERCISE_HISTORY_SQL, [currentGymId, exerciseId]);
      const rows = result.toArray().map((row: any) => ({
        set_id: row.set_id,
        workout_id: row.workout_id,
        exercise_id: row.exercise_id,
        exercise_name: row.exercise_name,
        weight_kg: Number(row.weight_kg),
        reps: Number(row.reps),
        rir: row.rir !== null ? Number(row.rir) : null,
        estimated_1rm: row.estimated_1rm !== null ? Number(row.estimated_1rm) : null,
        is_pr: Boolean(row.is_pr),
        is_anomaly: Boolean(row.is_anomaly),
        logged_at: String(row.logged_at),
        workout_gym_id: row.workout_gym_id,
        is_global: Boolean(row.is_global),
        matches_gym_context: Boolean(row.matches_gym_context),
      })) as SetHistory[];

      // Filter by gym context (global exercises show all, gym-specific show only matching gym)
      const filteredHistory = rows.filter(row => row.matches_gym_context);

      setHistory(filteredHistory);
      await conn.close();
    } catch (err) {
      console.error('Error fetching history:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch history');
    } finally {
      setIsLoading(false);
    }
  }, [exerciseId, currentGymId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Group history by date for display
  const historyByDate: HistoryByDate[] = history.reduce((acc, set) => {
    const date = set.logged_at.split('T')[0];  // Extract YYYY-MM-DD
    const existing = acc.find(d => d.date === date);
    if (existing) {
      existing.sets.push(set);
    } else {
      acc.push({ date, sets: [set] });
    }
    return acc;
  }, [] as HistoryByDate[]);

  return {
    history,
    historyByDate,
    isLoading,
    error,
    refresh: fetchHistory,
  };
}

// Separate hook for PR list (HIST-05)
export function usePRList(exerciseId: string): {
  prs: PRRecord[];
  isLoading: boolean;
  error: string | null;
} {
  const [prs, setPrs] = useState<PRRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPRs() {
      if (!exerciseId) return;

      const db = getDuckDB();
      if (!db) {
        setError('Database not initialized');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const conn = await db.connect();
        const result = await conn.query(PR_LIST_SQL, [exerciseId]);
        const rows = result.toArray().map((row: any) => ({
          set_id: row.set_id,
          workout_id: row.workout_id,
          exercise_id: row.exercise_id,
          weight_kg: Number(row.weight_kg),
          reps: Number(row.reps),
          estimated_1rm: row.estimated_1rm !== null ? Number(row.estimated_1rm) : null,
          pr_type: row.pr_type as PRRecord['pr_type'],
          logged_at: String(row.logged_at),
        })) as PRRecord[];

        setPrs(rows);
        await conn.close();
      } catch (err) {
        console.error('Error fetching PRs:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch PRs');
      } finally {
        setIsLoading(false);
      }
    }

    fetchPRs();
  }, [exerciseId]);

  return { prs, isLoading, error };
}

// Hook for getting current max (for PR detection during logging)
export function useExerciseMax(exerciseId: string): ExerciseMax | null {
  const [max, setMax] = useState<ExerciseMax | null>(null);

  useEffect(() => {
    async function fetchMax() {
      if (!exerciseId) return;

      const db = getDuckDB();
      if (!db) return;

      try {
        const conn = await db.connect();
        const result = await conn.query(CURRENT_MAX_SQL, [exerciseId]);
        const rows = result.toArray();

        if (rows.length > 0) {
          const row = rows[0] as any;
          setMax({
            max_weight: row.max_weight !== null ? Number(row.max_weight) : null,
            max_1rm: row.max_1rm !== null ? Number(row.max_1rm) : null,
          });
        }
        await conn.close();
      } catch (err) {
        console.error('Error fetching exercise max:', err);
      }
    }

    fetchMax();
  }, [exerciseId]);

  return max;
}
