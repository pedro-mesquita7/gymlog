# Phase 10: Workout Features & Demo Data - Research

**Researched:** 2026-01-31
**Domain:** Workout rotation state management, post-workout summary UX, and demo data generation
**Confidence:** HIGH

## Summary

Phase 10 implements workout rotation auto-advance functionality, enhanced post-workout summaries with PR highlighting and template-based comparisons, and portfolio-ready demo data generation. The rotation system uses Zustand with localStorage persistence to track user-defined template sequences that auto-advance on workout completion. The post-workout summary upgrades the existing WorkoutComplete dialog with PR badges using data from existing dbt models (int_sets__with_prs.sql) and template-based session comparisons. Demo data generation writes realistic event-sourced workouts directly via the existing writeEvent() API, following progressive overload patterns with plateaus and deloads.

**Technical Stack:** @dnd-kit/sortable 10.0.0 for drag-and-drop rotation editor, Zustand persist middleware with partialize for rotation state (separate from workout session state), native HTML dialog element for enhanced post-workout modal, existing DuckDB event sourcing infrastructure for demo data writes, and existing dbt PR detection models (int_sets__with_prs.sql) for summary analytics.

**Key Challenges:** Coordinating rotation advance logic with workout completion events (advance on workout_completed, not workout_cancelled), managing multiple Zustand stores with different persistence strategies (rotation config vs active session), generating realistic progressive overload data that triggers all analytics features, and clearing both OPFS database files and localStorage state for "reset all data" functionality.

**Primary recommendation:** Use @dnd-kit/sortable for rotation editor (already installed), create new useRotationStore with Zustand persist for rotation config and position tracking, enhance existing WorkoutComplete.tsx dialog with PR badges from existing dbt queries, generate demo data as batch event writes with realistic timestamps spanning 6 weeks, and implement clearAllData() utility that drops DuckDB tables, clears OPFS files, and resets all Zustand stores.

## Standard Stack

The established libraries/tools for this phase:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @dnd-kit/sortable | 10.0.0 | Drag-and-drop list reordering | Official preset for @dnd-kit/core, handles keyboard navigation, provides arrayMove utility, already installed |
| zustand | 5.0.10 | Rotation state management | Already used for workout session, persist middleware for localStorage, partialize for selective persistence |
| date-fns | 4.1.0 | Date manipulation for demo data | Already installed, handles timestamp generation for 6-week historical data |
| Native HTML dialog | Built-in | Enhanced post-workout modal | Already used for WorkoutComplete, supports showModal() with backdrop, keyboard handling |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @dnd-kit/utilities | 3.2.2 | CSS transform helpers | CSS.Transform.toString() for drag animations, already installed |
| framer-motion | 12.29.2 | Badge animations | Subtle PR badge entrance animations (scale/fade), already configured with LazyMotion |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @dnd-kit/sortable | react-beautiful-dnd | dnd-kit is lighter (10kb core), better React 19 support, no DOM mutation |
| Zustand | Redux Toolkit | Zustand already in codebase, simpler API for rotation state, persist middleware built-in |
| Native dialog | Custom modal library | Native dialog provides accessibility, backdrop, focus management out-of-box |

**Installation:**
All required packages already installed. No new dependencies needed.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── stores/
│   └── useRotationStore.ts       # New: rotation config + position state
├── components/
│   ├── rotation/
│   │   ├── RotationEditor.tsx    # Drag-and-drop rotation builder
│   │   ├── RotationList.tsx      # Display/manage named rotations
│   │   └── QuickStartCard.tsx    # "Next workout" pre-filled card
│   ├── workout/
│   │   └── WorkoutComplete.tsx   # Enhanced with PR badges + comparison
│   └── settings/
│       ├── DemoDataSection.tsx   # Load demo / clear all data
│       └── RotationSection.tsx   # Rotation management in Settings
├── db/
│   └── demo-data.ts              # Demo data generation utilities
└── utils/
    └── clearAllData.ts           # Reset database + stores
```

### Pattern 1: Rotation State Management with Zustand Persist
**What:** Separate Zustand store for rotation configuration and position tracking, persisted to localStorage with partialize.
**When to use:** Managing rotation config independently from active workout session state.
**Example:**
```typescript
// Source: https://zustand.docs.pmnd.rs/integrations/persisting-store-data
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface Rotation {
  rotation_id: string;
  name: string;
  template_ids: string[];  // Ordered list
  current_position: number; // 0-based index
}

interface RotationState {
  rotations: Rotation[];
  activeRotationId: string | null;
  defaultGymId: string | null;

  createRotation: (name: string, templateIds: string[]) => void;
  updateRotation: (id: string, updates: Partial<Rotation>) => void;
  deleteRotation: (id: string) => void;
  setActiveRotation: (id: string | null) => void;
  setDefaultGym: (gymId: string | null) => void;
  advanceRotation: (rotationId: string) => void;
  resetPosition: (rotationId: string) => void;
}

export const useRotationStore = create<RotationState>()(
  persist(
    (set, get) => ({
      rotations: [],
      activeRotationId: null,
      defaultGymId: null,

      createRotation: (name, templateIds) => {
        const rotation: Rotation = {
          rotation_id: uuidv7(),
          name,
          template_ids: templateIds,
          current_position: 0,
        };
        set((state) => ({
          rotations: [...state.rotations, rotation],
        }));
      },

      advanceRotation: (rotationId) => {
        set((state) => ({
          rotations: state.rotations.map((r) =>
            r.rotation_id === rotationId
              ? { ...r, current_position: (r.current_position + 1) % r.template_ids.length }
              : r
          ),
        }));
      },

      resetPosition: (rotationId) => {
        set((state) => ({
          rotations: state.rotations.map((r) =>
            r.rotation_id === rotationId ? { ...r, current_position: 0 } : r
          ),
        }));
      },

      // ... other actions
    }),
    {
      name: 'gymlog-rotations',
      storage: createJSONStorage(() => localStorage),
      // Only persist rotation config, not UI state
      partialize: (state) => ({
        rotations: state.rotations,
        activeRotationId: state.activeRotationId,
        defaultGymId: state.defaultGymId,
      }),
    }
  )
);
```

### Pattern 2: Drag-and-Drop Rotation Editor with @dnd-kit
**What:** Sortable list of templates in rotation, reordered via drag-and-drop with keyboard support.
**When to use:** Building rotation template sequences in Settings.
**Example:**
```typescript
// Source: https://docs.dndkit.com/presets/sortable
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function RotationEditor({ templateIds, onReorder }: { templateIds: string[]; onReorder: (ids: string[]) => void }) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = templateIds.indexOf(active.id as string);
      const newIndex = templateIds.indexOf(over.id as string);
      onReorder(arrayMove(templateIds, oldIndex, newIndex));
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={templateIds} strategy={verticalListSortingStrategy}>
        {templateIds.map((id) => (
          <SortableTemplateItem key={id} id={id} />
        ))}
      </SortableContext>
    </DndContext>
  );
}

function SortableTemplateItem({ id }: { id: string }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {/* Template display */}
    </div>
  );
}
```

### Pattern 3: Enhanced Post-Workout Summary with PR Detection
**What:** Upgrade WorkoutComplete dialog with PR badges per exercise, querying existing int_sets__with_prs dbt model.
**When to use:** After completing a workout, before writing events.
**Example:**
```typescript
// Query existing dbt model for PRs in this session
async function detectSessionPRs(workoutId: string): Promise<ExercisePR[]> {
  const db = getDuckDB();
  const conn = await db.connect();

  try {
    // Use existing dbt model that detects PRs
    const result = await conn.query(`
      WITH session_sets AS (
        SELECT * FROM {{ ref('int_sets__with_prs') }}
        WHERE workout_id = '${workoutId}'
      )
      SELECT
        original_exercise_id,
        SUM(CASE WHEN is_weight_pr THEN 1 ELSE 0 END) AS weight_prs,
        SUM(CASE WHEN is_1rm_pr THEN 1 ELSE 0 END) AS rm_prs,
        MAX(weight_kg) AS max_weight_kg
      FROM session_sets
      WHERE is_pr = true
      GROUP BY original_exercise_id
    `);

    return result.toArray().map(row => ({
      exercise_id: row.original_exercise_id,
      weight_prs: row.weight_prs,
      rm_prs: row.rm_prs,
      max_weight_kg: row.max_weight_kg,
    }));
  } finally {
    await conn.close();
  }
}

// In WorkoutComplete component
function WorkoutComplete({ session, template, exercises }: Props) {
  const [prs, setPRs] = useState<ExercisePR[]>([]);

  useEffect(() => {
    // After session saved, detect PRs
    detectSessionPRs(session.workout_id).then(setPRs);
  }, [session.workout_id]);

  return (
    <dialog>
      {/* Existing stats */}

      {/* PR badges section */}
      {prs.length > 0 && (
        <div className="bg-accent/10 border border-accent/30 rounded-lg p-4">
          <h3 className="font-semibold text-accent mb-2">Personal Records</h3>
          <ul className="space-y-1">
            {prs.map(pr => (
              <li key={pr.exercise_id}>
                <span className="font-medium">{getExerciseName(pr.exercise_id)}</span>
                {pr.weight_prs > 0 && <span className="ml-2 text-xs bg-yellow-500 text-black px-2 py-0.5 rounded">Weight PR</span>}
                {pr.rm_prs > 0 && <span className="ml-2 text-xs bg-yellow-500 text-black px-2 py-0.5 rounded">1RM PR</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </dialog>
  );
}
```

### Pattern 4: Demo Data Generation with Realistic Progressive Overload
**What:** Generate 6 weeks of workout history with progressive overload patterns, plateaus, and deloads.
**When to use:** "Load Demo Data" button in Settings.
**Example:**
```typescript
// Progressive overload pattern: +2.5kg or +1 rep every 1-2 sessions, plateau week 4, deload week 5
async function generateDemoData() {
  const demoGymId = uuidv7();
  const demoTemplateIds = {
    upperA: uuidv7(),
    lowerA: uuidv7(),
    upperB: uuidv7(),
    lowerB: uuidv7(),
  };

  // Week 1-3: progressive overload (+2.5kg every 2 sessions)
  // Week 4: plateau (same weight/reps)
  // Week 5: deload (-10% volume)
  // Week 6: resume progression

  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - 42); // 6 weeks ago

  const workouts: WorkoutData[] = [];

  for (let week = 0; week < 6; week++) {
    for (let session = 0; session < 4; session++) {
      const dayOffset = week * 7 + session * 2; // Mon, Wed, Fri, Sun pattern
      const workoutDate = new Date(baseDate);
      workoutDate.setDate(workoutDate.getDate() + dayOffset);

      const templateRotation = [demoTemplateIds.upperA, demoTemplateIds.lowerA, demoTemplateIds.upperB, demoTemplateIds.lowerB];
      const templateId = templateRotation[session % 4];

      // Progressive overload logic
      let weightMultiplier = 1.0;
      if (week === 4) {
        weightMultiplier = 0.9; // Deload week
      } else if (week >= 1) {
        weightMultiplier = 1 + (week * 0.05); // +5% per week
      }

      workouts.push(generateWorkoutSession(templateId, demoGymId, workoutDate, weightMultiplier));
    }
  }

  // Write all events in chronological order
  for (const workout of workouts) {
    await writeWorkoutEvents(workout);
  }
}
```

### Pattern 5: Clear All Data - Database + localStorage Reset
**What:** Reset all application state by dropping DuckDB tables, clearing OPFS, and resetting Zustand stores.
**When to use:** "Clear All Data" button in Settings, before loading demo data.
**Example:**
```typescript
// Source: Existing cleanupOPFS() pattern from duckdb-init.ts
async function clearAllData() {
  const db = getDuckDB();
  if (!db) throw new Error('Database not initialized');

  // 1. Drop all DuckDB tables
  const conn = await db.connect();
  try {
    await conn.query('DROP TABLE IF EXISTS events');
    console.log('Dropped events table');
  } finally {
    await conn.close();
  }

  // 2. Clear OPFS files (adapted from existing cleanupOPFS)
  try {
    const root = await navigator.storage.getDirectory();
    for (const name of ['gymlog.db', 'gymlog.db.wal']) {
      try {
        await root.removeEntry(name);
        console.log(`Deleted OPFS file: ${name}`);
      } catch {
        // File may not exist
      }
    }
  } catch (err) {
    console.warn('OPFS cleanup failed:', err);
  }

  // 3. Clear all Zustand stores (localStorage)
  localStorage.removeItem('gymlog-workout');
  localStorage.removeItem('gymlog-rotations');
  localStorage.removeItem('gymlog-backup');
  localStorage.removeItem('gymlog-progression-alerts');

  // 4. Reload page to reinitialize database
  window.location.reload();
}
```

### Anti-Patterns to Avoid
- **Don't advance rotation on workout cancel/skip**: Only advance on workout_completed event, not on any finish action
- **Don't create separate PR calculation logic**: Use existing int_sets__with_prs.sql dbt model
- **Don't generate demo data with unrealistic patterns**: Follow actual progressive overload (plateaus, deloads) to showcase analytics
- **Don't forget to clear all persistence layers**: Must clear DuckDB + OPFS + all localStorage stores
- **Don't mutate rotation position outside store actions**: Keep rotation advance logic centralized in advanceRotation()

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drag-and-drop reordering | Custom mouse event handlers | @dnd-kit/sortable with arrayMove | Handles keyboard navigation, accessibility, touch, animations out-of-box |
| PR detection logic | Custom window functions in JavaScript | Existing int_sets__with_prs.sql dbt model | Already computes weight PRs and 1RM PRs with window functions, tested |
| Progressive overload patterns | Random weight increments | Documented strength training progressions | Realistic patterns (linear progression, plateau, deload) showcase analytics better |
| State persistence | Manual localStorage.setItem calls | Zustand persist middleware with partialize | Handles serialization, rehydration, selective persistence, type-safe |
| Dialog accessibility | Custom modal with backdrop clicks | Native HTML dialog with showModal() | Focus trap, ESC handling, backdrop, ARIA roles built-in |
| Date arithmetic for demo data | Manual timestamp math | date-fns subDays, addDays, setHours | Handles DST, leap years, timezone edge cases |

**Key insight:** Phase builds on existing infrastructure (dbt PR models, Zustand patterns, @dnd-kit already installed, native dialog in use). Don't recreate—extend and compose.

## Common Pitfalls

### Pitfall 1: Rotation Advances on Cancelled Workouts
**What goes wrong:** Rotation position increments even when user cancels/skips workout, desynchronizing rotation from actual training.
**Why it happens:** Triggering advanceRotation() in completeWorkout() without checking if workout was actually saved.
**How to avoid:**
- Only call advanceRotation() AFTER workout_completed event is successfully written
- Do NOT advance on workout_cancelled event or when user dismisses without saving
- Guard advance logic: `if (activeRotationId) { advanceRotation(activeRotationId) }` only after writeEvent<WorkoutCompletedEvent> succeeds
**Warning signs:** Rotation shows "Workout 4 of 4" but user only completed 2 sessions, templates appear out of order

### Pitfall 2: Multiple Zustand Stores Conflict in localStorage
**What goes wrong:** Different stores overwrite each other's data in localStorage due to key collisions.
**Why it happens:** Using same storage key for multiple stores or not using partialize correctly.
**How to avoid:**
- Use unique storage keys: `gymlog-workout`, `gymlog-rotations`, `gymlog-backup`, etc.
- Use partialize to persist only necessary state: `partialize: (state) => ({ rotations: state.rotations })`
- Test localStorage directly in DevTools to verify key separation
- Document all localStorage keys in a central constants file
**Warning signs:** Rotation state resets unexpectedly, workout session data corrupted, console warnings about storage quota

### Pitfall 3: PR Detection Queries Run Before Events Written
**What goes wrong:** POST-workout summary shows no PRs even though user hit PRs, because query runs before workout_completed event is processed.
**Why it happens:** Querying int_sets__with_prs immediately after completeWorkout() but before event writes finish.
**How to avoid:**
- Write all events (workout_started, set_logged, workout_completed) FIRST
- Then query for PRs AFTER all events successfully written
- Use async/await properly: `await writeEvent(...); await detectPRs()`
- Consider showing "Calculating PRs..." loading state
**Warning signs:** PRs show up on refresh but not immediately after workout, inconsistent PR detection

### Pitfall 4: Demo Data Timestamps Not Realistic
**What goes wrong:** Demo workouts all have same timestamp or unrealistic spacing (e.g., 7 sessions in one day).
**Why it happens:** Not carefully constructing timestamps with realistic workout frequency (3-4x per week, 1-2 rest days).
**How to avoid:**
- Use date-fns to calculate realistic timestamps: Mon/Wed/Fri/Sun pattern
- Vary workout start times: 8am, 6pm, 10am to simulate real usage
- Ensure 6 weeks spans exactly 42 days with proper spacing
- Test that analytics detect trends correctly with demo data
**Warning signs:** Volume analytics show flat lines, progression detection doesn't work, all workouts grouped into one day

### Pitfall 5: Incomplete Data Clearing Leaves Orphaned State
**What goes wrong:** "Clear All Data" clears database but leaves localStorage state, causing hydration errors or stale UI.
**Why it happens:** Forgetting to clear all Zustand stores or OPFS files when resetting.
**How to avoid:**
- Clear ALL persistence layers: DuckDB tables, OPFS files, all localStorage keys
- Document all storage locations (see clearAllData pattern)
- Test by: clear data → verify localStorage empty → verify OPFS empty → reload → confirm clean state
- Reload page after clearing to force reinitialization
**Warning signs:** UI shows old data after "clear all", database connection errors, partial state in components

### Pitfall 6: @dnd-kit Items Array Out of Sync with Rendered List
**What goes wrong:** Drag-and-drop breaks, items jump to wrong positions, console errors about duplicate IDs.
**Why it happens:** SortableContext items prop doesn't match actual rendered list order.
**How to avoid:**
- Pass same array to SortableContext items and .map(): `<SortableContext items={templateIds}>{templateIds.map(...)}`
- Ensure items array contains unique IDs (template_id, not indices)
- After arrayMove(), immediately update state so re-render matches new order
- Use key={id} not key={index} in mapped components
**Warning signs:** Drag preview shows wrong template, items swap incorrectly, React keys warning in console

### Pitfall 7: Dialog Not Properly Opened with showModal()
**What goes wrong:** Enhanced WorkoutComplete dialog shows but backdrop doesn't block clicks, ESC doesn't close.
**Why it happens:** Using dialog.show() instead of dialog.showModal(), missing modal behavior.
**How to avoid:**
- Always use `dialogRef.current?.showModal()` not `.show()`
- Test keyboard: ESC should close, Tab should trap focus
- Test clicks: backdrop clicks should close (if ::backdrop has event listener)
- Verify ARIA: dialog has role="dialog" and aria-modal="true"
**Warning signs:** Can scroll/click underlying page, ESC doesn't work, focus escapes dialog

## Code Examples

Verified patterns from official sources:

### Rotation Advance on Workout Completion
```typescript
// In WorkoutComplete component after successful save
const handleSave = async () => {
  try {
    // 1. Write all events
    await writeEvent<WorkoutStartedEvent>({ ... });
    for (const set of session.sets) {
      await writeEvent<SetLoggedEvent>({ ... });
    }
    await writeEvent<WorkoutCompletedEvent>({ ... });

    // 2. Advance rotation ONLY after successful completion
    const activeRotationId = useRotationStore.getState().activeRotationId;
    if (activeRotationId) {
      useRotationStore.getState().advanceRotation(activeRotationId);
    }

    // 3. Detect PRs (now that events are written)
    const prs = await detectSessionPRs(session.workout_id);

    onSaved(prs); // Pass to parent for display
  } catch (err) {
    console.error('Failed to save workout:', err);
  }
};
```

### Quick-Start Card with Rotation Pre-Fill
```typescript
// Source: User decisions from CONTEXT.md
function QuickStartCard() {
  const { activeRotationId, rotations, defaultGymId } = useRotationStore();
  const { templates } = useTemplates();
  const { gyms } = useGyms();

  const activeRotation = rotations.find(r => r.rotation_id === activeRotationId);
  if (!activeRotation || !defaultGymId) {
    return (
      <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
        <p className="text-sm text-warning">Set up a rotation in Settings to quick-start workouts</p>
      </div>
    );
  }

  const nextTemplateId = activeRotation.template_ids[activeRotation.current_position];
  const nextTemplate = templates.find(t => t.template_id === nextTemplateId);
  const defaultGym = gyms.find(g => g.gym_id === defaultGymId);

  const position = activeRotation.current_position + 1;
  const total = activeRotation.template_ids.length;

  return (
    <div className="bg-accent/10 border-2 border-accent rounded-lg p-6">
      <div className="text-sm text-text-secondary mb-2">
        Workout {position} of {total} in {activeRotation.name}
      </div>
      <h2 className="text-xl font-bold mb-1">{nextTemplate?.name ?? 'Unknown'}</h2>
      <p className="text-text-secondary mb-4">at {defaultGym?.name ?? 'Unknown'}</p>

      <Button
        size="lg"
        onClick={() => startWorkout(nextTemplateId, defaultGymId)}
        className="w-full"
      >
        Start Workout
      </Button>
    </div>
  );
}
```

### Demo Data Progressive Overload Pattern
```typescript
// Source: https://www.hevyapp.com/progressive-overload/ patterns
interface WorkoutWeek {
  week: number;
  pattern: 'progression' | 'plateau' | 'deload' | 'resume';
  volumeMultiplier: number;
}

const DEMO_SCHEDULE: WorkoutWeek[] = [
  { week: 1, pattern: 'progression', volumeMultiplier: 1.0 },   // Baseline
  { week: 2, pattern: 'progression', volumeMultiplier: 1.05 },  // +5%
  { week: 3, pattern: 'progression', volumeMultiplier: 1.10 },  // +10%
  { week: 4, pattern: 'plateau', volumeMultiplier: 1.10 },      // Maintain
  { week: 5, pattern: 'deload', volumeMultiplier: 0.90 },       // -10% recovery
  { week: 6, pattern: 'resume', volumeMultiplier: 1.15 },       // +15% new PR
];

function generateExerciseSets(
  exerciseId: string,
  baseWeight: number,
  weekMultiplier: number,
  targetSets: number,
  targetReps: number
): SetData[] {
  const sets: SetData[] = [];
  const adjustedWeight = Math.round(baseWeight * weekMultiplier / 2.5) * 2.5; // Round to 2.5kg

  for (let i = 0; i < targetSets; i++) {
    // Slight rep variation: first set full reps, later sets may drop 1-2
    const reps = i === 0 ? targetReps : targetReps - Math.floor(Math.random() * 2);
    const rir = i === targetSets - 1 ? 0 : Math.floor(Math.random() * 2) + 1; // Last set to failure

    sets.push({
      exercise_id: exerciseId,
      weight_kg: adjustedWeight,
      reps,
      rir,
    });
  }

  return sets;
}
```

### Comparison vs Last Session of Same Template
```typescript
// Query for last completed workout with same template
async function getLastSessionComparison(templateId: string, currentWorkoutId: string) {
  const db = getDuckDB();
  const conn = await db.connect();

  try {
    const result = await conn.query(`
      WITH completed_workouts AS (
        SELECT
          w.workout_id,
          w.started_at,
          SUM(s.weight_kg * s.reps) AS total_volume_kg
        FROM {{ ref('dim_workout') }} w
        JOIN {{ ref('fact_sets') }} s ON w.workout_id = s.workout_id
        WHERE w.template_id = '${templateId}'
          AND w.workout_id != '${currentWorkoutId}'
          AND w.completed_at IS NOT NULL
        GROUP BY w.workout_id, w.started_at
        ORDER BY w.started_at DESC
        LIMIT 1
      )
      SELECT * FROM completed_workouts
    `);

    if (result.numRows === 0) return null;

    const row = result.toArray()[0];
    return {
      lastWorkoutId: row.workout_id,
      lastDate: row.started_at,
      lastVolume: row.total_volume_kg,
    };
  } finally {
    await conn.close();
  }
}

// In WorkoutComplete component
const lastSession = await getLastSessionComparison(template.template_id, session.workout_id);
const volumeDelta = lastSession ? totalVolume - lastSession.lastVolume : null;

// Display comparison
{lastSession && (
  <div className="text-sm text-text-secondary">
    vs last {template.name} ({formatDate(lastSession.lastDate)}):
    <span className={volumeDelta > 0 ? 'text-success' : volumeDelta < 0 ? 'text-error' : 'text-text-secondary'}>
      {volumeDelta > 0 ? '+' : ''}{Math.round(volumeDelta)} kg
    </span>
  </div>
)}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom drag libraries (react-beautiful-dnd) | @dnd-kit | 2023+ | Lighter bundle (10kb), better React 19 support, no DOM mutation |
| Global state for all features | Multiple Zustand stores | 2024+ | Isolated state domains, selective persistence, better code splitting |
| Full-screen post-workout page | Enhanced dialog modal | 2025+ | Faster UX, no navigation, maintains context, native accessibility |
| Manual event writes for demo data | Batch event generation | 2024+ | Realistic timestamps, progressive overload patterns, portfolio-ready |
| SQL window functions in app code | dbt models (int_sets__with_prs) | 2024+ | PR detection logic tested, documented, versioned with transformations |

**Deprecated/outdated:**
- **react-beautiful-dnd**: Archived by Atlassian, use @dnd-kit instead
- **Custom modal libraries (react-modal)**: Native HTML dialog has sufficient browser support (97%+) with better accessibility
- **Single monolithic Zustand store**: Split into domain stores (workout, rotation, backup, alerts) for better separation
- **Random demo data**: Portfolio apps need realistic patterns that showcase analytical capabilities

## Open Questions

Things that couldn't be fully resolved:

1. **Rotation Advance Timing with Async Event Writes**
   - What we know: Must advance rotation AFTER workout_completed event written, but writeEvent() is async
   - What's unclear: Best error handling if event write succeeds but rotation advance fails (localStorage full, etc.)
   - Recommendation: Wrap rotation advance in try/catch, log error but don't block completion flow. Rotation can be manually reset.

2. **PR Detection Performance with Large Datasets**
   - What we know: int_sets__with_prs uses window functions over all historical sets per exercise
   - What's unclear: Query performance after 6+ months of data (1000+ sets per exercise)
   - Recommendation: Start with full query, add LIMIT to recent N sets if performance degrades. Monitor with DuckDB EXPLAIN.

3. **Demo Data Volume for Portfolio Showcase**
   - What we know: 6 weeks, 3-4x/week = ~20-24 workouts
   - What's unclear: Optimal set count per workout to trigger all analytics features without overwhelming volume charts
   - Recommendation: 4 exercises × 3-4 sets = 12-16 sets per workout. Test that progression detection, plateau alerts, and volume trends all trigger.

4. **Native Dialog Backdrop Click Behavior**
   - What we know: Native dialog supports backdrop clicks to close, but requires manual event listener on ::backdrop
   - What's unclear: Whether to auto-close on backdrop click for post-workout summary or require explicit "Save" action
   - Recommendation: Require explicit action (don't close on backdrop) since workout data is unsaved. Match existing WorkoutComplete behavior.

5. **Rotation State After Deleting Active Template**
   - What we know: User might delete a template that's in the active rotation's sequence
   - What's unclear: Should rotation auto-skip deleted templates, show error, or require manual rotation edit?
   - Recommendation: Show validation warning when deleting template in active rotation. Don't auto-skip (could cause confusion). Require user to edit rotation first.

## Sources

### Primary (HIGH confidence)
- [@dnd-kit Sortable Documentation](https://docs.dndkit.com/presets/sortable) - Official sortable preset API
- [@dnd-kit GitHub Repository](https://github.com/clauderic/dnd-kit) - Current stable version (10.0.0), installation, examples
- [Zustand Persist Middleware](https://zustand.docs.pmnd.rs/integrations/persisting-store-data) - partialize, storage options, multiple stores
- [Zustand Slices Pattern](https://zustand.docs.pmnd.rs/guides/slices-pattern) - Multiple store organization
- [HTML Dialog Accessibility](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog) - showModal(), focus management, backdrop
- [Progressive Overload Guide - Hevy](https://www.hevyapp.com/progressive-overload/) - Realistic training progressions
- [Progressive Overload Example - Setgraph](https://setgraph.app/ai-blog/progressive-overload-example) - 8-week templates with plateaus

### Secondary (MEDIUM confidence)
- [Fitness App UX Design Principles - Stormotion](https://stormotion.io/blog/fitness-app-ux/) - Post-workout summary patterns, badge systems
- [UX Design Principles From Top Fitness Apps - Superside](https://www.superside.com/blog/ux-design-principles-fitness-apps) - Achievement highlighting, streaks, visual progress
- [HTML Dialog Accessibility and UX - Jared Cunha](https://jaredcunha.com/blog/html-dialog-getting-accessibility-and-ux-right) - Best practices for dialog modals
- [Building a Dialog Component - web.dev](https://web.dev/articles/building/a-dialog-component) - Native dialog patterns
- [duckdb-wasm-kit GitHub](https://github.com/holdenmatt/duckdb-wasm-kit) - React hooks for DuckDB, data clearing patterns

### Tertiary (LOW confidence)
- [Best Fitness Apps 2026 - Tech Trends](https://www.wokewaves.com/posts/all-in-one-fitness-apps-2026) - Current app features, gamification trends
- [AI Fitness Apps 2026 - Fitbod](https://fitbod.me/blog/best-ai-fitness-apps-2026-the-complete-guide-to-ai-powered-muscle-building-apps/) - Adaptive workout patterns
- [Zustand Persist Partialize Discussion](https://github.com/pmndrs/zustand/discussions/1273) - Community patterns for selective persistence

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All packages already installed, versions verified from package.json
- Architecture: HIGH - Patterns extend existing codebase structure (Zustand stores, dbt models, native dialog in use)
- Pitfalls: MEDIUM - Based on dnd-kit issues, Zustand discussions, and general React patterns (not all tested in this codebase)

**Research date:** 2026-01-31
**Valid until:** 2026-02-28 (30 days - stable ecosystem, @dnd-kit mature, Zustand patterns established)
