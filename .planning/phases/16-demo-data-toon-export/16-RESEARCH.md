# Phase 16: Demo Data UX & TOON Export - Research

**Researched:** 2026-02-01
**Domain:** Destructive-action UX patterns, TOON format SDK, clipboard/file download APIs
**Confidence:** HIGH

## Summary

This phase has two independent workstreams: (1) improving the existing demo data import/clear UX with proper confirmation dialogs and destructive-action styling, and (2) adding TOON format export capabilities for LLM-optimized data sharing. Both live on the Settings page.

The demo data work is primarily a UX/styling refactor of the existing `DemoDataSection` component -- the logic already exists (import via `loadDemoData()`, clear via `clearAllData()`). The changes involve replacing `window.confirm()` with the existing `Dialog` component, adding warning gradient styling, and modifying `clearAllData` to be selective (keep exercises/gyms, delete workout data). The TOON export is a new feature requiring a new dependency (`@toon-format/toon`), SQL queries to extract workout data by scope, and clipboard/download output.

The project already has established patterns for DuckDB queries, Blob-based file downloads, and the Dialog UI primitive. The TOON SDK has a simple `encode()` API that converts JavaScript objects to token-efficient text. The main complexity is building the SQL queries for the three export scopes (last workout, rotation cycle, time range) and structuring the data for TOON encoding.

**Primary recommendation:** Lean heavily on existing patterns -- reuse Dialog for confirmations, reuse Blob download pattern from useBackupExport, and build TOON export as a standalone service module with a thin React hook wrapper.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @toon-format/toon | 2.1.0 | Encode workout data to TOON format | Official TypeScript SDK; project already committed to this library |
| Existing Dialog component | N/A | Confirmation dialogs for destructive actions | Already in `src/components/ui/Dialog.tsx`; uses native `<dialog>` element |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| navigator.clipboard API | Web API | Copy TOON text to clipboard | Primary export action |
| Blob + createObjectURL | Web API | Download .toon file | Secondary export action |
| DuckDB-WASM | 1.32.0 | Query workout data for export | Already installed, all queries go through this |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @toon-format/toon | Manual string formatting | TOON has array-tabular syntax that is non-trivial to hand-roll; SDK handles quoting/escaping |
| Dialog component | window.confirm() | Currently used, but lacks styling control and feels generic; Dialog already exists |

**Installation:**
```bash
npm install @toon-format/toon
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  components/settings/
    DemoDataSection.tsx      # MODIFIED - gradient button, Dialog confirmation, selective clear
    ToonExportSection.tsx    # NEW - scope picker, copy/download buttons
  services/
    toon-export.ts           # NEW - SQL queries + TOON encoding logic
  utils/
    clearAllData.ts          # MODIFIED - new clearHistoricalData() for selective wipe
    clipboard.ts             # NEW (optional) - clipboard + download helpers
```

### Pattern 1: Service Module for TOON Export
**What:** Pure async functions that query DuckDB and return TOON-formatted strings. No React hooks or state -- just data in, string out.
**When to use:** For the three export scopes (last workout, rotation cycle, time range).
**Example:**
```typescript
// src/services/toon-export.ts
import { encode } from '@toon-format/toon';
import { getDuckDB } from '../db/duckdb-init';

interface ToonExportResult {
  toonText: string;
  filename: string;
}

export async function exportLastWorkout(): Promise<ToonExportResult> {
  const db = getDuckDB();
  if (!db) throw new Error('Database not initialized');
  const conn = await db.connect();

  try {
    // Query last completed workout with all sets
    const workoutResult = await conn.query(`
      WITH started AS (
        SELECT
          payload->>'workout_id' AS workout_id,
          payload->>'template_id' AS template_id,
          payload->>'gym_id' AS gym_id,
          payload->>'started_at' AS started_at
        FROM events
        WHERE event_type = 'workout_started'
      ),
      completed AS (
        SELECT
          payload->>'workout_id' AS workout_id,
          payload->>'completed_at' AS completed_at
        FROM events
        WHERE event_type = 'workout_completed'
      ),
      latest AS (
        SELECT s.*, c.completed_at
        FROM started s
        JOIN completed c ON c.workout_id = s.workout_id
        ORDER BY s.started_at DESC
        LIMIT 1
      )
      SELECT * FROM latest
    `);
    // ... build data structure, then encode
    const data = buildToonStructure(workout, sets, exercises);
    return {
      toonText: encode(data),
      filename: `gymlog-workout-${date}.toon`,
    };
  } finally {
    await conn.close();
  }
}
```

### Pattern 2: Confirmation Dialog with Destructive Styling
**What:** Reuse existing Dialog component with action-specific button styling inside.
**When to use:** For both Import Demo Data and Clear Historical Data confirmations.
**Example:**
```typescript
// Inside DemoDataSection.tsx
const [showImportDialog, setShowImportDialog] = useState(false);

<Dialog isOpen={showImportDialog} onClose={() => setShowImportDialog(false)} title="Import Demo Data">
  <p>This will replace all your data with demo data. This cannot be undone.</p>
  <div className="flex gap-3 mt-4">
    <Button variant="secondary" onClick={() => setShowImportDialog(false)}>Cancel</Button>
    <button
      onClick={handleConfirmImport}
      className="py-2 px-4 rounded-lg font-medium bg-gradient-to-r from-warning to-error text-white"
    >
      Import Demo Data
    </button>
  </div>
</Dialog>
```

### Pattern 3: Clipboard + Download Dual Output
**What:** Copy to clipboard as primary, download .toon file as secondary, matching the existing Parquet export pattern.
**When to use:** For all TOON export scopes.
**Example:**
```typescript
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function downloadToonFile(text: string, filename: string): void {
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
```

### Anti-Patterns to Avoid
- **Putting SQL in React components:** Keep all DuckDB queries in the service module, not in component files
- **Using window.confirm() for destructive actions:** Always use the Dialog component for confirmable destructive operations
- **Encoding data inside the component:** The encode() call should be in the service layer; components receive ready strings

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| TOON encoding | Custom string builder | `encode()` from @toon-format/toon | TOON tabular syntax has quoting rules, array length declarations, field headers -- non-trivial to get right |
| Confirmation dialogs | window.confirm() | Existing Dialog component | Already exists, supports custom styling, better UX |
| File download | Custom download logic | Copy pattern from useBackupExport (Blob + createObjectURL) | Already proven in codebase |
| Clipboard access | document.execCommand('copy') | navigator.clipboard.writeText() | Modern API, async, supported in all target browsers |

**Key insight:** The TOON SDK handles the hard part (token-optimal encoding with proper escaping). The app's job is just structuring the data correctly as JavaScript objects and calling encode().

## Common Pitfalls

### Pitfall 1: Selective Clear Missing Event Types
**What goes wrong:** The "Clear Historical Data" must delete workout-related events but keep exercise/gym events. Missing an event type (e.g., `template_created`, `template_archived`) leads to orphaned or missing data.
**Why it happens:** The event sourcing model has many event types: `workout_started`, `workout_completed`, `set_logged`, `template_created`, `template_updated`, `template_deleted`, `template_archived`. The CONTEXT.md says "Wipes everything except exercises and gyms (plans, templates, workout logs, sets, PRs all deleted)" -- meaning templates ARE deleted too.
**How to avoid:** Use a whitelist approach -- DELETE events WHERE event_type NOT IN ('exercise_created', 'exercise_updated', 'exercise_deleted', 'gym_created', 'gym_updated', 'gym_deleted'). This is safer than a blacklist.
**Warning signs:** After clearing, exercises or gyms are missing; after clearing, old templates still appear.

### Pitfall 2: LocalStorage Not Cleared on Historical Clear
**What goes wrong:** Clearing historical data from DuckDB but leaving rotation state, workout state, progression alerts in localStorage causes stale references.
**Why it happens:** The current `clearAllData()` clears specific localStorage keys, but the new selective clear must also clear rotation state (references template_ids that were deleted) and workout state.
**How to avoid:** Clear all gymlog-* localStorage keys except any that are purely preference-based. The rotation store (`gymlog-rotations`) and workout store (`gymlog-workout`) must be cleared; progression alerts and volume thresholds should be cleared too.

### Pitfall 3: TOON Export with Empty Data
**What goes wrong:** User tries to export "Last Workout" but has no completed workouts, or "Rotation Cycle" but has no active rotation.
**Why it happens:** Export button is enabled but query returns empty.
**How to avoid:** Disable export button when no data is available for the selected scope. Query for data availability before enabling the button, or show an inline message.

### Pitfall 4: Clipboard API Permission Denied
**What goes wrong:** navigator.clipboard.writeText() fails in some contexts (non-HTTPS, iframe, no user gesture).
**Why it happens:** Clipboard API requires secure context and user activation.
**How to avoid:** Always wrap in try/catch, show fallback message if clipboard fails. The app runs on HTTPS (GitHub Pages) so this is mainly a dev concern, but handle gracefully.

### Pitfall 5: DuckDB Connection Left Open
**What goes wrong:** Error during export leaves connection unclosed, causing subsequent queries to fail.
**Why it happens:** Missing try/finally around conn.close().
**How to avoid:** Always use try/finally pattern as seen in existing hooks (useBackupExport, useRecentWorkout).

### Pitfall 6: Rotation Cycle Export Without Active Rotation
**What goes wrong:** User selects "Rotation Cycle" scope but has no active rotation configured.
**Why it happens:** Rotation state is in Zustand/localStorage, not DuckDB. Must check rotation store first.
**How to avoid:** Read from useRotationStore to get active rotation, template_ids, and current_position. If no active rotation, disable or hide this scope option.

## Code Examples

### TOON Encode for Workout Data
```typescript
// Source: @toon-format/toon README + STACK-v1.3.md
import { encode } from '@toon-format/toon';

// Structure workout data as nested objects with uniform arrays
const workoutData = {
  export: {
    app: 'GymLog',
    format: 'TOON v1',
    exported_at: '2026-02-01T10:30:00Z',
    scope: 'last_workout',
  },
  context: {
    gym: 'Iron Works Gym',
    plan: 'Upper Lower 4x',
    date: '2026-01-31',
    duration_min: 62,
  },
  exercises: [
    { name: 'Bench Press', muscle_group: 'Chest', equipment: 'Barbell' },
    { name: 'Barbell Row', muscle_group: 'Upper Back', equipment: 'Barbell' },
  ],
  sets: [
    { exercise: 'Bench Press', set: 1, weight_kg: 80, reps: 8, rir: 2, pr: '' },
    { exercise: 'Bench Press', set: 2, weight_kg: 80, reps: 7, rir: 1, pr: '' },
    { exercise: 'Bench Press', set: 3, weight_kg: 85, reps: 6, rir: 0, pr: 'weight' },
    { exercise: 'Barbell Row', set: 1, weight_kg: 60, reps: 10, rir: 2, pr: '' },
  ],
};

const toon = encode(workoutData);
// Output (approx):
// export:
//   app: GymLog
//   format: TOON v1
//   exported_at: 2026-02-01T10:30:00Z
//   scope: last_workout
// context:
//   gym: Iron Works Gym
//   plan: Upper Lower 4x
//   date: 2026-01-31
//   duration_min: 62
// exercises[2]{name,muscle_group,equipment}:
//   Bench Press,Chest,Barbell
//   Barbell Row,Upper Back,Barbell
// sets[4]{exercise,set,weight_kg,reps,rir,pr}:
//   Bench Press,1,80,8,2,
//   Bench Press,2,80,7,1,
//   Bench Press,3,85,6,0,weight
//   Barbell Row,1,60,10,2,
```

### Selective Clear SQL (Whitelist Approach)
```typescript
// Delete all events EXCEPT exercise and gym lifecycle events
async function clearHistoricalData(): Promise<void> {
  const db = getDuckDB();
  if (!db) throw new Error('Database not initialized');
  const conn = await db.connect();
  try {
    await conn.query(`
      DELETE FROM events
      WHERE event_type NOT IN (
        'exercise_created', 'exercise_updated', 'exercise_deleted',
        'gym_created', 'gym_updated', 'gym_deleted'
      )
    `);
    await checkpoint();
  } finally {
    await conn.close();
  }

  // Clear localStorage state that references deleted data
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
}
```

### Warning Gradient Button Styling
```typescript
// OKLCH gradient for destructive one-time action (import demo data)
// Uses warning -> error gradient to signal "this is different from normal buttons"
<button className="w-full py-3 px-4 rounded-lg font-medium transition-all
  bg-gradient-to-r from-warning/80 to-error/80
  hover:from-warning hover:to-error
  text-white shadow-lg shadow-error/20">
  Import Demo Data
</button>
```

### File Download Pattern (from existing codebase)
```typescript
// Source: src/hooks/useBackupExport.ts (adapted for .toon text files)
function downloadToonFile(text: string, filename: string): void {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
```

### Scope Picker UI (Segmented Control)
```typescript
// Radio-style segmented control, matching the weight unit toggle pattern in BackupSettings
type ExportScope = 'last_workout' | 'rotation_cycle' | 'time_range';

<div className="flex rounded-lg overflow-hidden">
  {(['last_workout', 'rotation_cycle', 'time_range'] as const).map((scope) => (
    <button
      key={scope}
      onClick={() => setSelectedScope(scope)}
      className={`px-3 py-1.5 text-sm font-medium transition-colors ${
        selectedScope === scope
          ? 'bg-accent text-black'
          : 'bg-bg-tertiary text-text-secondary'
      }`}
    >
      {scopeLabels[scope]}
    </button>
  ))}
</div>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| window.confirm() | Native `<dialog>` element via Dialog component | Already in codebase | Better styling, accessibility, consistent UX |
| document.execCommand('copy') | navigator.clipboard.writeText() | Clipboard API widely supported since 2020 | Async, cleaner API, secure context required |
| JSON for LLM data | TOON format | 2025 | 30-60% fewer tokens, 73.9% vs 69.7% LLM accuracy |

**Deprecated/outdated:**
- `document.execCommand('copy')`: Deprecated, use Clipboard API instead
- `window.confirm()`: Not deprecated but cannot be styled; use Dialog for destructive actions

## Open Questions

1. **TOON encode() bundle size impact**
   - What we know: STACK-v1.3.md says ~13MB unpacked but tree-shakeable; only `encode` needed at runtime
   - What's unclear: Actual gzipped bundle contribution when only importing `encode`
   - Recommendation: Import only `encode`, verify bundle impact with `npx vite-bundle-visualizer` after installation. If too large, consider lazy-loading the TOON export section.

2. **PR marker format in TOON sets**
   - What we know: CONTEXT.md says "85kg x 6 [PR: weight]" format
   - What's unclear: Whether to use this human format or put PR as a column in the tabular array (more TOON-native)
   - Recommendation: Use a `pr` column in the tabular array with values like "weight", "1rm", "weight+1rm", or empty string. This is more TOON-native (tabular) and LLMs parse columns better than inline annotations.

3. **Rotation cycle query complexity**
   - What we know: Need to find N most recent complete rotations from workout history, matching template_ids order from rotation store
   - What's unclear: Exact SQL to identify rotation boundaries in the event stream
   - Recommendation: Query all workouts with matching template_ids from the active rotation, ordered by date. Group into rotations by tracking position sequence. This may need iterative refinement.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `src/components/settings/DemoDataSection.tsx`, `src/utils/clearAllData.ts`, `src/db/demo-data.ts` -- existing demo data patterns
- Codebase analysis: `src/components/ui/Dialog.tsx`, `src/components/ui/Button.tsx` -- existing UI primitives
- Codebase analysis: `src/hooks/useBackupExport.ts` -- Blob download pattern
- Codebase analysis: `src/db/compiled-queries.ts` -- SQL query patterns and event type catalog
- Codebase analysis: `src/stores/useRotationStore.ts` -- rotation state structure
- Codebase analysis: `src/index.css` -- OKLCH design tokens (warning, error, accent colors)
- `.planning/research/STACK-v1.3.md` -- @toon-format/toon v2.1.0 API surface and decision

### Secondary (MEDIUM confidence)
- GitHub toon-format/toon README (via WebFetch) -- encode() API, EncodeOptions, format examples
- toonformat.dev landing page -- format overview, tabular array syntax, performance claims
- WebSearch results for TOON format -- version confirmation, community adoption

### Tertiary (LOW confidence)
- TOON encode() actual bundle size after tree-shaking -- stated as ~13MB unpacked but tree-shakeable; actual gzipped size unknown

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - @toon-format/toon already decided in STACK-v1.3.md; all other tools are existing codebase patterns
- Architecture: HIGH - follows established codebase patterns (service modules, hooks, Dialog component)
- Pitfalls: HIGH - identified from direct codebase analysis of event types, localStorage keys, and existing clear logic

**Research date:** 2026-02-01
**Valid until:** 2026-03-01 (stable domain -- browser APIs and TOON SDK unlikely to change)
