import { useState, useEffect } from 'react';
import type { AsyncDuckDB } from '@duckdb/duckdb-wasm';
import { getDuckDB } from '../db/duckdb-init';

export interface ExerciseNoteEntry {
  note: string;
  session_date: string;
}

interface UseExerciseNotesReturn {
  notes: ExerciseNoteEntry[];
  isLoading: boolean;
}

export function useExerciseNotes(exerciseId: string): UseExerciseNotesReturn {
  const [notes, setNotes] = useState<ExerciseNoteEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchNotes() {
      if (!exerciseId) {
        setNotes([]);
        setIsLoading(false);
        return;
      }

      const db: AsyncDuckDB | null = getDuckDB();
      if (!db) {
        console.error('[useExerciseNotes] Database not initialized');
        setNotes([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      let conn;

      try {
        conn = await db.connect();

        const sql = `
          WITH note_events AS (
            SELECT
              payload->>'workout_id' AS workout_id,
              payload->>'original_exercise_id' AS original_exercise_id,
              payload->>'note' AS note,
              _created_at
            FROM events
            WHERE event_type = 'exercise_note_logged'
          ),
          workout_events AS (
            SELECT
              payload->>'workout_id' AS workout_id,
              payload->>'started_at' AS started_at
            FROM events
            WHERE event_type = 'workout_started'
          )
          SELECT n.note, w.started_at AS session_date
          FROM note_events n
          JOIN workout_events w ON n.workout_id = w.workout_id
          WHERE n.original_exercise_id = '${exerciseId}'
          ORDER BY w.started_at DESC
        `;

        const result = await conn.query(sql);
        const rows = result.toArray();

        if (rows.length === 0) {
          setNotes([]);
        } else {
          setNotes(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            rows.map((row: any) => ({
              note: String(row.note),
              session_date: String(row.session_date),
            }))
          );
        }
      } catch (err) {
        console.error('[useExerciseNotes] Error fetching notes:', err);
        setNotes([]);
      } finally {
        if (conn) {
          await conn.close();
        }
        setIsLoading(false);
      }
    }

    fetchNotes();
  }, [exerciseId]);

  return { notes, isLoading };
}
