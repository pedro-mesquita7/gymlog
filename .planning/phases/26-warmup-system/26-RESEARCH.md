# Phase 26: Warmup System - Research

**Researched:** 2026-02-03
**Domain:** Warmup weight calculation, display-only hints in workout logging UI, settings tier configuration
**Confidence:** HIGH

## Summary

This phase adds auto-calculated warmup hints to the workout logging UI. The warmup system is **display-only** -- no new event types, no logged sets, just computed hints shown during active workouts. The key technical challenges are: (1) querying DuckDB for the most recent session's max working weight for the *original* exercise (not substituted), (2) computing warmup weights with configurable tier percentages and rounding to 2.5kg, (3) placing a compact tap-to-reveal warmup hint in the exercise header area, and (4) adding a tier editor inside Settings > Workout Preferences.

The existing codebase provides strong patterns to follow. The `useLastSessionData` hook already queries recent session data by `original_exercise_id` and `gym_id` -- the warmup hook will use a similar but simpler query (just max weight from the most recent session). The `ExerciseNote` component demonstrates the exact tap-to-reveal expand/collapse pattern with framer-motion that warmup hints should use. Tier configuration state belongs in `useWorkoutStore` alongside other workout preferences (weightUnit, defaultRestSeconds, soundEnabled).

**Primary recommendation:** This requires NO new event types and NO schema changes. Warmup is purely a read-time computation + UI display. Store warmup tier config in `useWorkoutStore`, create a `useWarmupData` hook for the DuckDB query, and add a `WarmupHint` component to `ExerciseView`.

## Standard Stack

No new libraries needed. This phase uses only existing project dependencies.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| zustand | ^5.0.10 | Store warmup tier config (percentages, reps) | Already used for all app state |
| @duckdb/duckdb-wasm | 1.32.0 | Query last session max weight | Already used for all data queries |
| framer-motion | ^12.29.2 | Tap-to-reveal animation | Already used for ExerciseNote expand/collapse |
| react | ^19.2.0 | Component rendering | Project framework |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| N/A | -- | -- | No new dependencies needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Storing tier config in useWorkoutStore | New dedicated useWarmupStore | Unnecessary -- only 2 fields (tier1, tier2), fits naturally with workout preferences |
| DuckDB query for max weight | Reusing useLastSessionData hook | useLastSessionData returns full set arrays; warmup only needs MAX(weight_kg) -- a dedicated hook is cleaner and more efficient |

**Installation:**
```bash
# No new packages needed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── hooks/
│   └── useWarmupData.ts         # DuckDB query: max working weight from last session
├── components/
│   ├── workout/
│   │   └── WarmupHint.tsx       # Tap-to-reveal warmup display in ExerciseView
│   └── settings/
│       └── WarmupTierEditor.tsx  # Inline editor for tier percentages/reps
├── stores/
│   └── useWorkoutStore.ts       # Extended: warmupTiers field added
└── utils/
    └── warmup.ts                # Pure functions: calculateWarmupSets, roundToNearest
```

### Pattern 1: Warmup Data Hook (DuckDB Query)
**What:** A custom hook that queries the most recent completed session for a given `original_exercise_id` and returns the max `weight_kg` from that session's sets.
**When to use:** Called by `WarmupHint` component for each exercise during active workout.
**Key design decisions:**
- Query by `original_exercise_id` (NOT the substituted exercise ID)
- Walk back through ALL sessions to find the most recent one where the original exercise was actually performed
- Do NOT filter by gym_id -- warmup weight should be based on the exercise regardless of which gym
- Only consider completed workouts (join with `workout_completed` events)
- If no sessions exist for this exercise, return null (triggers placeholder message)

**Example:**
```typescript
// Source: Codebase pattern from useLastSessionData.ts + useExerciseNotes.ts
export function useWarmupData(originalExerciseId: string): {
  maxWeight: number | null;
  isLoading: boolean;
} {
  // DuckDB query: find max weight_kg from the most recent completed session
  // WHERE original_exercise_id matches AND exercise_id = original_exercise_id
  // (i.e., the set was logged for the ORIGINAL exercise, not a substitution)
  const sql = `
    WITH completed_workouts AS (
      SELECT payload->>'workout_id' AS workout_id
      FROM events
      WHERE event_type = 'workout_completed'
    ),
    set_events AS (
      SELECT
        payload->>'workout_id' AS workout_id,
        payload->>'original_exercise_id' AS original_exercise_id,
        payload->>'exercise_id' AS exercise_id,
        CAST(payload->>'weight_kg' AS DOUBLE) AS weight_kg,
        COALESCE(payload->>'logged_at', CAST(_created_at AS VARCHAR)) AS logged_at
      FROM events
      WHERE event_type = 'set_logged'
    ),
    -- Find the most recent workout where this exercise was performed as itself (not substituted)
    recent_session AS (
      SELECT s.workout_id, MAX(s.logged_at) AS session_date
      FROM set_events s
      JOIN completed_workouts cw ON s.workout_id = cw.workout_id
      WHERE s.original_exercise_id = '${originalExerciseId}'
        AND s.exercise_id = '${originalExerciseId}'
      GROUP BY s.workout_id
      ORDER BY session_date DESC
      LIMIT 1
    )
    SELECT MAX(s.weight_kg) AS max_weight
    FROM set_events s
    JOIN recent_session rs ON s.workout_id = rs.workout_id
    WHERE s.original_exercise_id = '${originalExerciseId}'
      AND s.exercise_id = '${originalExerciseId}'
  `;
  // ... standard hook pattern with useState/useEffect like useExerciseNotes
}
```

### Pattern 2: Pure Calculation Functions
**What:** Stateless utility functions for warmup weight math.
**When to use:** Called by the WarmupHint component after receiving max weight from hook.

```typescript
// src/utils/warmup.ts

export interface WarmupTier {
  percentage: number; // 0-100, e.g., 50
  reps: number;       // e.g., 5
}

export const DEFAULT_WARMUP_TIERS: [WarmupTier, WarmupTier] = [
  { percentage: 50, reps: 5 },
  { percentage: 75, reps: 3 },
];

export function roundToNearest(value: number, increment: number): number {
  return Math.round(value / increment) * increment;
}

export interface WarmupSet {
  weight: number;     // Rounded to nearest 2.5kg
  reps: number;
  percentage: number; // For display
}

export function calculateWarmupSets(
  maxWeight: number,
  tiers: [WarmupTier, WarmupTier]
): [WarmupSet, WarmupSet] {
  return tiers.map(tier => ({
    weight: roundToNearest(maxWeight * (tier.percentage / 100), 2.5),
    reps: tier.reps,
    percentage: tier.percentage,
  })) as [WarmupSet, WarmupSet];
}
```

### Pattern 3: Tap-to-Reveal UI (Following ExerciseNote Pattern)
**What:** A compact button that expands to show warmup info on tap.
**When to use:** Inside ExerciseView, positioned between the exercise header and the SetGrid.

```typescript
// Follows exact pattern from ExerciseNote.tsx
// - Collapsed: small button/text hint in exercise header area
// - Expanded: shows warmup tiers inline
// - Uses framer-motion AnimatePresence for expand/collapse
```

### Pattern 4: Zustand Store Extension for Tier Config
**What:** Add warmupTiers to useWorkoutStore state, persisted to localStorage.
**When to use:** Store-level config read by WarmupHint and edited by WarmupTierEditor.

```typescript
// In useWorkoutStore.ts, add to WorkoutState interface:
warmupTiers: [WarmupTier, WarmupTier];

// Default value in store:
warmupTiers: DEFAULT_WARMUP_TIERS,

// Actions:
setWarmupTiers: (tiers: [WarmupTier, WarmupTier]) => void;
resetWarmupTiers: () => void;

// Add to partialize for persistence:
warmupTiers: state.warmupTiers,

// Migration guard in merge (for existing users):
if (!merged.warmupTiers) {
  merged.warmupTiers = DEFAULT_WARMUP_TIERS;
}
```

### Anti-Patterns to Avoid
- **Creating a new event type for warmup:** Warmup is display-only, not logged data. No schema extension needed.
- **Filtering by gym_id in warmup query:** Per context decisions, warmup uses original exercise history regardless of gym.
- **Using all-time best weight:** Per context decisions, use max weight from LAST SESSION only (most recent), not all-time PR.
- **Querying substituted exercise history:** Must walk back to find sessions where the original exercise was actually performed (exercise_id = original_exercise_id in set_logged events).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Weight rounding | Custom floor/ceil logic | `Math.round(value / 2.5) * 2.5` | Simple one-liner, no edge cases |
| Expand/collapse animation | CSS transitions | framer-motion AnimatePresence | Already used everywhere in project (ExerciseNote, CollapsibleSection) |
| Settings persistence | Manual localStorage | Zustand persist middleware | Already configured in useWorkoutStore with partialize + merge |
| "No data" placeholder | Complex conditional rendering | Simple null check on hook return | Pattern established by SetGrid's showFirstTimeHint |

**Key insight:** This phase is almost entirely UI + query work. The warmup system does NOT create events, does NOT modify the schema, and does NOT need a new store. It reads existing data and computes display values.

## Common Pitfalls

### Pitfall 1: Querying Substituted Exercise Data Instead of Original
**What goes wrong:** Warmup shows wrong weight because it looked up the substituted exercise's history instead of the original.
**Why it happens:** The `exercise_id` in `set_logged` events may differ from `original_exercise_id` when a substitution was made.
**How to avoid:** The warmup query MUST filter `WHERE exercise_id = original_exercise_id` to find sessions where the exercise was performed as itself. The user decision states: "Always uses the original (non-substituted) exercise's history."
**Warning signs:** Warmup shows unexpected weights or "no data" for exercises that have been substituted in past workouts.

### Pitfall 2: Using All-Time Max Instead of Last Session Max
**What goes wrong:** Warmup suggests weights based on a PR from months ago, which may be much higher than recent working weight.
**Why it happens:** Confusing "max weight ever" with "max weight from most recent session."
**How to avoid:** The SQL query must find the most recent workout_id first (ORDER BY session_date DESC LIMIT 1), THEN get MAX(weight_kg) from only that session.
**Warning signs:** Warmup weights seem unreasonably high compared to recent training.

### Pitfall 3: Missing Migration Guard for Existing Users
**What goes wrong:** App crashes or shows undefined for users who had useWorkoutStore persisted before warmupTiers was added.
**Why it happens:** Zustand persist loads old state that doesn't have the warmupTiers field.
**How to avoid:** Add migration guard in the `merge` function of useWorkoutStore's persist config, exactly like the notes migration: `if (!merged.warmupTiers) { merged.warmupTiers = DEFAULT_WARMUP_TIERS; }`
**Warning signs:** Console errors about accessing properties of undefined.

### Pitfall 4: Showing Warmup for Zero-Weight (Bodyweight) Exercises
**What goes wrong:** Warmup shows "5x0kg (50%) -> 3x0kg (75%)" for bodyweight exercises.
**Why it happens:** Not checking if the reference weight is zero or null before calculating.
**How to avoid:** Skip warmup display when maxWeight is 0 or null. Per context: "Skip bodyweight exercises -- only show warmup hints when there's a non-zero weight to calculate from."
**Warning signs:** Ridiculous 0kg warmup hints appearing.

### Pitfall 5: Forgetting to Include Completed-Workout Filter
**What goes wrong:** Warmup calculation uses data from cancelled or in-progress workouts.
**Why it happens:** Querying `set_logged` events without joining to `workout_completed`.
**How to avoid:** Always join with `workout_completed` events to ensure only finished sessions are considered.
**Warning signs:** Warmup data changes unexpectedly or uses partial session data.

## Code Examples

### Warmup Hint Component (WarmupHint.tsx)
```typescript
// Source: Follows ExerciseNote.tsx expand/collapse pattern
import { useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { useWarmupData } from '../../hooks/useWarmupData';
import { useWorkoutStore } from '../../stores/useWorkoutStore';
import { calculateWarmupSets } from '../../utils/warmup';

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const DURATION = prefersReducedMotion ? 0 : 0.2;

interface WarmupHintProps {
  originalExerciseId: string;
}

export function WarmupHint({ originalExerciseId }: WarmupHintProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { maxWeight, isLoading } = useWarmupData(originalExerciseId);
  const warmupTiers = useWorkoutStore(state => state.warmupTiers);

  // No data yet (new exercise)
  if (!isLoading && maxWeight === null) {
    return (
      <button
        type="button"
        onClick={() => setIsExpanded(prev => !prev)}
        className="flex items-center gap-1.5 text-text-muted transition-colors px-1 py-1"
      >
        <span className="text-xs">Warmup</span>
      </button>
      // Expanded: "Log your first session to see warmup suggestions"
    );
  }

  // Skip bodyweight (0kg)
  if (!isLoading && maxWeight === 0) return null;

  if (isLoading) return null; // Or a small skeleton

  const sets = calculateWarmupSets(maxWeight!, warmupTiers);

  // Compact format: "Warmup: 5x30kg (50%) -> 3x45kg (75%)"
  const summaryText = `${sets[0].reps}x${sets[0].weight}kg (${sets[0].percentage}%) → ${sets[1].reps}x${sets[1].weight}kg (${sets[1].percentage}%)`;

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsExpanded(prev => !prev)}
        className="flex items-center gap-1.5 text-text-muted hover:text-accent transition-colors px-1 py-1"
        aria-expanded={isExpanded}
      >
        <span className="text-xs">Warmup</span>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <m.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: DURATION, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <p className="text-xs text-text-secondary py-1">
              {summaryText}
            </p>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

### Warmup Tier Editor in Settings (WarmupTierEditor.tsx)
```typescript
// Source: Follows BackupSettings.tsx inline editing pattern
// Nested inside "Workout Preferences" CollapsibleSection
// Two rows: Tier 1 (percentage input + reps input), Tier 2 (same)
// "Reset to defaults" button

import { useWorkoutStore } from '../../stores/useWorkoutStore';
import { DEFAULT_WARMUP_TIERS } from '../../utils/warmup';
import { Input } from '../ui/Input';

export function WarmupTierEditor() {
  const warmupTiers = useWorkoutStore(state => state.warmupTiers);
  const setWarmupTiers = useWorkoutStore(state => state.setWarmupTiers);
  const resetWarmupTiers = useWorkoutStore(state => state.resetWarmupTiers);

  const handleTierChange = (index: 0 | 1, field: 'percentage' | 'reps', value: number) => {
    const updated = [...warmupTiers] as [typeof warmupTiers[0], typeof warmupTiers[1]];
    updated[index] = { ...updated[index], [field]: value };
    setWarmupTiers(updated);
  };

  const isDefault =
    warmupTiers[0].percentage === DEFAULT_WARMUP_TIERS[0].percentage &&
    warmupTiers[0].reps === DEFAULT_WARMUP_TIERS[0].reps &&
    warmupTiers[1].percentage === DEFAULT_WARMUP_TIERS[1].percentage &&
    warmupTiers[1].reps === DEFAULT_WARMUP_TIERS[1].reps;

  return (
    <div className="space-y-3">
      <label className="text-sm text-text-primary">Warmup Tiers</label>
      {/* Tier 1 */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-text-muted w-10">Tier 1</span>
        <Input type="number" /* percentage */ />
        <span className="text-xs text-text-muted">%</span>
        <Input type="number" /* reps */ />
        <span className="text-xs text-text-muted">reps</span>
      </div>
      {/* Tier 2 - same pattern */}
      {/* Reset button */}
      {!isDefault && (
        <button onClick={resetWarmupTiers} className="text-xs text-accent">
          Reset to defaults
        </button>
      )}
    </div>
  );
}
```

### Integration Point in ExerciseView.tsx
```typescript
// Add WarmupHint between exercise header and SetGrid
// In ExerciseView.tsx, after the action buttons div and before the progress indicator:

{/* Warmup hint - tap to reveal */}
<WarmupHint originalExerciseId={planExercise.exercise_id} />
```

### Zustand Store Extension
```typescript
// In useWorkoutStore.ts WorkoutState interface, add:
warmupTiers: [WarmupTier, WarmupTier];
setWarmupTiers: (tiers: [WarmupTier, WarmupTier]) => void;
resetWarmupTiers: () => void;

// In store initializer:
warmupTiers: DEFAULT_WARMUP_TIERS,

setWarmupTiers: (tiers) => {
  set({ warmupTiers: tiers });
},

resetWarmupTiers: () => {
  set({ warmupTiers: DEFAULT_WARMUP_TIERS });
},

// In partialize:
warmupTiers: state.warmupTiers,

// In merge function, add migration guard:
if (!merged.warmupTiers) {
  merged.warmupTiers = DEFAULT_WARMUP_TIERS;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Log warmup as real sets | Display-only warmup hints | User decision | No event schema change needed |
| Per-exercise warmup toggle | Global always-on warmup | User decision | Simpler implementation, no plan editor changes |
| All-time PR reference | Last session max weight | User decision | More practical warmup weights |

**Key architectural note:** The STATE.md blocker "Warmup system needs event sourcing schema extension (new event type)" is resolved by the user's decision to make warmup display-only. No events are written, no schema changes needed. This blocker can be cleared.

## Open Questions

1. **Exact placement of warmup tap target in exercise header**
   - What we know: Goes in the exercise header area, tap-to-reveal pattern
   - Recommendation: Place between the action buttons row ("Swap Exercise" / "History") and the progress indicator dots. This keeps it visible but not intrusive, consistent with where ExerciseNote sits below the SetGrid.

2. **Settings section nesting for warmup tiers**
   - What we know: Must be nested inside an existing settings group, not top-level
   - Recommendation: Nest inside "Workout Preferences" CollapsibleSection alongside Weight Unit, Default Rest Timer, and Sound settings. This is the natural home for workout configuration.

3. **Tier editor UI: inline inputs vs tap-to-edit modal**
   - What we know: Claude's discretion on this choice
   - Recommendation: Use **inline inputs** (two rows with number inputs for % and reps). This matches the existing Rest Timer pattern in Workout Preferences (inline Input component + label). A modal would be overkill for 4 small fields.

4. **Placeholder message wording**
   - Recommendation: "Log your first session to see warmup suggestions" -- matches the SetGrid's "First time - no previous data" tone.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `src/stores/useWorkoutStore.ts` -- Zustand store pattern with persist, merge migration guards
- Codebase analysis: `src/hooks/useLastSessionData.ts` -- DuckDB query pattern for session data by original_exercise_id
- Codebase analysis: `src/hooks/useExerciseNotes.ts` -- DuckDB query hook pattern
- Codebase analysis: `src/components/workout/ExerciseNote.tsx` -- Tap-to-reveal expand/collapse pattern
- Codebase analysis: `src/components/workout/ExerciseView.tsx` -- Component integration point
- Codebase analysis: `src/components/backup/BackupSettings.tsx` -- Settings page structure, Workout Preferences section
- Codebase analysis: `src/types/events.ts` -- Event schema (confirms no warmup events needed)
- Codebase analysis: `src/db/compiled-queries.ts` -- DuckDB SQL query patterns

### Secondary (MEDIUM confidence)
- N/A (all findings based on direct codebase analysis)

### Tertiary (LOW confidence)
- N/A

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- No new libraries, all existing project dependencies
- Architecture: HIGH -- All patterns directly derived from existing codebase (ExerciseNote, useLastSessionData, useWorkoutStore)
- Pitfalls: HIGH -- Derived from explicit user decisions in CONTEXT.md and understanding of event sourcing data model

**Research date:** 2026-02-03
**Valid until:** 2026-03-05 (30 days, stable domain -- no external dependencies to change)
