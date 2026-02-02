# Phase 25: Exercise Notes - Research

**Researched:** 2026-02-02
**Domain:** Event-sourced note storage + workout logging UI extension
**Confidence:** HIGH

## Summary

This phase adds free-text notes per exercise per workout session, stored via event sourcing in the existing DuckDB events table. The codebase already has a well-established pattern: new event types are added to `types/events.ts`, written via `writeEvent()` in `db/events.ts`, and queried via SQL CTEs against the `events` table's JSON `payload` column.

The UI integration point is `ExerciseView.tsx`, which renders below `SetGrid` for each exercise. A new `ExerciseNote` component will live in the workout folder, containing: (1) a tap-to-reveal note input with auto-save, and (2) a collapsible "Previous notes" history section. Notes are stored in the Zustand workout store during the active session and written as `exercise_note_logged` events on workout completion, alongside the existing `set_logged` events.

The history query follows the exact same CTE pattern as `useLastSessionData` -- join `exercise_note_logged` events with `workout_started` events, filter by exercise ID, and order by session date.

**Primary recommendation:** Add a new `ExerciseNoteLoggedEvent` type, extend `WorkoutSession` with a `notes: Record<string, string>` map (keyed by `original_exercise_id`), write note events during workout completion in `WorkoutComplete.tsx`, and create a `useExerciseNotes` hook for history queries.

## Standard Stack

No new libraries needed. This phase uses only existing project dependencies.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| zustand | ^5.0.10 | Store note text during active session | Already used for all workout state |
| @duckdb/duckdb-wasm | 1.32.0 | Event storage and history queries | Already the project's event store |
| react | ^19.2.0 | UI components | Already the project's framework |
| framer-motion | ^12.29.2 | Expand/collapse animations | Already used by CollapsibleSection |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| uuidv7 | ^1.1.0 | Event IDs | Already used for all event IDs |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Zustand store for in-session notes | React local state only | Zustand persists to localStorage, so notes survive page refresh during active workout -- critical for UX |

**Installation:**
```bash
# No new packages needed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  types/
    events.ts              # ADD ExerciseNoteLoggedEvent to union
    workout-session.ts     # ADD notes: Record<string, string> to WorkoutSession
  stores/
    useWorkoutStore.ts     # ADD setNote action + notes field in session
  components/
    workout/
      ExerciseNote.tsx     # NEW - note input + history display
      ExerciseView.tsx     # MODIFY - render ExerciseNote below SetGrid
      WorkoutComplete.tsx  # MODIFY - write exercise_note_logged events
  hooks/
    useExerciseNotes.ts    # NEW - query note history from events table
  db/
    demo-data.ts           # MODIFY - optionally add notes to demo workouts
```

### Pattern 1: Event Type Extension
**What:** Add a new event type to the existing event sourcing system.
**When to use:** Any time new data needs to be persisted.
**Example:**
```typescript
// In types/events.ts
export interface ExerciseNoteLoggedEvent extends BaseEvent {
  event_type: 'exercise_note_logged';
  workout_id: string;
  exercise_id: string;           // Actual exercise used (may be substitution)
  original_exercise_id: string;  // Plan's exercise
  note: string;                  // Plain text, max ~70 chars
}

// Add to GymLogEvent union
export type GymLogEvent =
  | ...existing types...
  | ExerciseNoteLoggedEvent;
```

### Pattern 2: Zustand Session State Extension
**What:** Add notes to the active workout session, persisted to localStorage.
**When to use:** Data that needs to survive page refreshes during active workout.
**Example:**
```typescript
// In types/workout-session.ts - add to WorkoutSession interface
export interface WorkoutSession {
  // ...existing fields...
  notes: Record<string, string>;  // original_exercise_id -> note text
}

// In useWorkoutStore.ts - add action
setNote: (originalExerciseId: string, note: string) => {
  const session = get().session;
  if (!session) return;
  set({
    session: {
      ...session,
      notes: {
        ...session.notes,
        [originalExerciseId]: note,
      },
    },
  });
},
```

### Pattern 3: Event Writing at Workout Completion
**What:** Write note events alongside set events in the completion handler.
**When to use:** Notes are saved to the event store only when workout is saved (not during active logging).
**Example:**
```typescript
// In WorkoutComplete.tsx handleSave(), after writing set_logged events:
for (const [originalExerciseId, noteText] of Object.entries(session.notes)) {
  if (noteText.trim()) {
    const actualExerciseId = session.exerciseSubstitutions[originalExerciseId] ?? originalExerciseId;
    await writeEvent<ExerciseNoteLoggedEvent>({
      event_type: 'exercise_note_logged',
      workout_id: session.workout_id,
      exercise_id: actualExerciseId,
      original_exercise_id: originalExerciseId,
      note: noteText.trim(),
    });
  }
}
```

### Pattern 4: History Query Hook (CTE pattern from useLastSessionData)
**What:** Query all historical notes for an exercise from the events table.
**When to use:** Displaying "Previous notes" in the ExerciseNote component.
**Example:**
```typescript
// useExerciseNotes.ts
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
  SELECT
    n.note,
    w.started_at AS session_date
  FROM note_events n
  JOIN workout_events w ON n.workout_id = w.workout_id
  WHERE n.original_exercise_id = '${exerciseId}'
  ORDER BY w.started_at DESC
`;
```

### Pattern 5: Tap-to-Reveal UI (Discretionary Recommendation)
**What:** Icon button that expands to a textarea when tapped. Auto-saves on blur with debounce.
**Recommended icon:** Use a filled pencil/edit icon when note has content, outline when empty. A simple SVG inline icon (no icon library needed since the project uses no icon library currently -- the existing UI uses text characters like the "X" in SetRow).
**Recommended debounce:** 500ms -- fast enough to feel responsive, slow enough to avoid excessive store updates.
**Recommended textarea:** 2 rows, full width below the "Add Set" button, with `resize-none` for mobile friendliness.
**Character counter:** Show as `{remaining}` below the textarea, using `text-warning` color when <= 15 chars remain, `text-error` when at limit.

### Anti-Patterns to Avoid
- **Writing events during active logging:** Notes should only be persisted as events on workout completion. During the active session, notes live only in the Zustand store (persisted to localStorage). This matches the existing pattern where `set_logged` events are written in `WorkoutComplete.tsx`, not on each set input.
- **Separate note save button:** The user explicitly decided on auto-save via blur/debounce. No save button.
- **Rich text / markdown:** Explicitly excluded. Plain text only, ~70 char limit.
- **Per-set notes:** Explicitly excluded. One note per exercise per session.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Expand/collapse animation | Custom CSS transitions | Framer Motion `AnimatePresence` (same pattern as `CollapsibleSection.tsx`) | Already in the project, handles mount/unmount animation correctly |
| Debounce | Custom setTimeout logic | Simple `setTimeout`/`clearTimeout` in a `useEffect` or `useCallback` | The debounce here is trivial (one field, one callback). No library needed -- just a 5-line pattern |
| Character counting | Custom substring logic | `value.length` with conditional rendering | Trivial -- just show remaining chars when approaching limit |

**Key insight:** This feature is primarily a UI component + one new event type. Everything else (event writing, querying, store persistence) uses established patterns already in the codebase. The main risk is overcomplicating what should be a simple text field.

## Common Pitfalls

### Pitfall 1: Missing Notes Field in Existing Session Migrations
**What goes wrong:** Users with an active workout in localStorage (from before this change) will have sessions without the `notes` field, causing `undefined` access errors.
**Why it happens:** Zustand's `persist` middleware restores the old session shape from localStorage.
**How to avoid:** Initialize `notes` with a default empty object in `startWorkout`, AND add a merge guard in the Zustand persist config: `notes: (persistedState as any)?.session?.notes ?? {}`.
**Warning signs:** `Cannot read property of undefined` errors when accessing `session.notes`.

### Pitfall 2: SQL Injection via Note Content
**What goes wrong:** Notes containing single quotes break the SQL query string interpolation pattern used throughout the codebase.
**Why it happens:** The `writeEvent` function escapes single quotes in the JSON payload (`JSON.stringify(event).replace(/'/g, "''")`), so event WRITING is safe. But the history QUERY hook must also handle exercise IDs safely (already escaped via UUIDs, so this is low risk for the query itself).
**How to avoid:** The note text goes into the payload JSON via `JSON.stringify`, which properly escapes quotes. The `writeEvent` function then SQL-escapes the whole JSON string. No additional escaping needed for writes. For reads, exercise IDs are UUIDs (no user-controlled SQL interpolation).
**Warning signs:** Events fail to insert when notes contain apostrophes.

### Pitfall 3: Textarea Auto-Focus Stealing on Mobile
**What goes wrong:** If the textarea auto-focuses when expanded, the mobile keyboard pops up and obscures the set logging area, disrupting the primary workflow.
**Why it happens:** Expanding the note area and immediately focusing the textarea.
**How to avoid:** Do NOT auto-focus the textarea on expand. Let the user tap into it explicitly. The expand action just reveals the field.
**Warning signs:** Users report the keyboard popping up unexpectedly when they tap the note icon.

### Pitfall 4: Empty Notes Written as Events
**What goes wrong:** Saving events for exercises where the user expanded the note area but typed nothing (or only whitespace).
**Why it happens:** The store saves `""` or `"  "` as the note text.
**How to avoid:** In `WorkoutComplete.tsx`, filter out empty/whitespace-only notes before writing events: `if (noteText.trim())`.
**Warning signs:** Ghost "empty" entries appearing in note history.

### Pitfall 5: History Shows Notes for Wrong Exercise After Substitution
**What goes wrong:** If a user substitutes Bench Press for Dumbbell Press, note history might show notes from the wrong exercise.
**Why it happens:** Confusion between `exercise_id` (actual) and `original_exercise_id` (plan's exercise).
**How to avoid:** Always query history by `original_exercise_id`, consistent with how `useLastSessionData` and set logging already work. The note event stores both IDs for completeness.
**Warning signs:** Note history showing notes from a different exercise than expected.

## Code Examples

### ExerciseNote Component Structure
```typescript
// Source: Codebase pattern analysis
interface ExerciseNoteProps {
  originalExerciseId: string;
  exerciseId: string;  // actual (possibly substituted)
}

export function ExerciseNote({ originalExerciseId, exerciseId }: ExerciseNoteProps) {
  const notes = useWorkoutStore(state => state.session?.notes ?? {});
  const setNote = useWorkoutStore(state => state.setNote);
  const [isExpanded, setIsExpanded] = useState(!!notes[originalExerciseId]);
  const [text, setText] = useState(notes[originalExerciseId] ?? '');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const MAX_LENGTH = 70;
  const COUNTER_THRESHOLD = 15;

  const handleChange = (value: string) => {
    if (value.length > MAX_LENGTH) return;
    setText(value);
    // Debounced save to store
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setNote(originalExerciseId, value);
    }, 500);
  };

  const handleBlur = () => {
    // Immediate save on blur
    clearTimeout(debounceRef.current);
    setNote(originalExerciseId, text);
  };

  const remaining = MAX_LENGTH - text.length;
  const showCounter = remaining <= COUNTER_THRESHOLD;

  // ... render logic
}
```

### Integration in ExerciseView
```typescript
// In ExerciseView.tsx, after SetGrid and before Navigation:
{session && (
  <ExerciseNote
    originalExerciseId={planExercise.exercise_id}
    exerciseId={actualExerciseId}
  />
)}
```

### Note History Hook
```typescript
// useExerciseNotes.ts
export interface ExerciseNoteHistory {
  note: string;
  session_date: string;  // ISO timestamp
}

export function useExerciseNotes(exerciseId: string): {
  notes: ExerciseNoteHistory[];
  isLoading: boolean;
} {
  const [notes, setNotes] = useState<ExerciseNoteHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchNotes() {
      const db = getDuckDB();
      if (!db || !exerciseId) { setIsLoading(false); return; }
      const conn = await db.connect();
      try {
        const result = await conn.query(`
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
        `);
        setNotes(result.toArray().map(row => ({
          note: row.note as string,
          session_date: row.session_date as string,
        })));
      } finally {
        await conn.close();
      }
      setIsLoading(false);
    }
    fetchNotes();
  }, [exerciseId]);

  return { notes, isLoading };
}
```

### Date Formatting for History Entries
```typescript
// Use date-fns (already in project) for history entry dates
import { format, parseISO } from 'date-fns';

// In history display:
<div className="text-xs text-text-muted">
  {format(parseISO(entry.session_date), 'MMM d, yyyy')}
</div>
<div className="text-sm text-text-primary">{entry.note}</div>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| N/A | First implementation | Phase 25 | New feature |

This is a net-new feature. No migration from old approaches needed.

## Open Questions

1. **Should demo data include exercise notes?**
   - What we know: The demo data generator creates workout events with sets. Notes would add realism.
   - What's unclear: Whether this is worth the effort for demo purposes.
   - Recommendation: Add 2-3 sample notes to demo workouts for exercises like Bench Press ("Shoulder tight today", "New grip width") to demonstrate the feature. Low effort, good demo impact.

2. **Should cancelled workouts discard notes?**
   - What we know: `cancelWorkout()` sets `session: null`, which would lose notes. This is correct because cancelled workouts don't write any events.
   - What's unclear: Nothing -- this is the expected behavior.
   - Recommendation: No special handling needed. Cancelled = discarded, including notes.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `src/types/events.ts` - Event type union pattern
- Codebase analysis: `src/db/events.ts` - `writeEvent()` pattern with JSON payload escaping
- Codebase analysis: `src/stores/useWorkoutStore.ts` - Zustand persist pattern, session state shape
- Codebase analysis: `src/components/workout/WorkoutComplete.tsx` - Event writing on completion
- Codebase analysis: `src/hooks/useLastSessionData.ts` - CTE query pattern for exercise history
- Codebase analysis: `src/components/ui/CollapsibleSection.tsx` - Expand/collapse animation pattern
- Codebase analysis: `src/components/workout/ExerciseView.tsx` - Integration point below SetGrid
- Codebase analysis: `src/components/workout/SetGrid.tsx` - Auto-save on blur pattern
- Codebase analysis: `src/types/workout-session.ts` - Session interface structure

### Secondary (MEDIUM confidence)
- None needed -- this is entirely a codebase-pattern-following feature

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new libraries, all existing project deps
- Architecture: HIGH - Direct pattern replication from existing event types and session state
- Pitfalls: HIGH - Derived from actual code analysis (localStorage migration, SQL escaping, substitution IDs)

**Research date:** 2026-02-02
**Valid until:** 2026-03-04 (30 days -- stable patterns, no external dependencies)
