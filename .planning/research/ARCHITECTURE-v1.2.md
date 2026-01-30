# Architecture Integration: v1.2 UX & Portfolio Polish

**Project:** GymLog PWA
**Milestone:** v1.2 UX & Portfolio Polish
**Researched:** 2026-01-30
**Confidence:** HIGH

## Executive Summary

This architecture research addresses how v1.2 UX and infrastructure features integrate with GymLog's existing React + DuckDB-WASM + event sourcing architecture. The existing architecture is well-suited for these enhancements with minimal structural changes required.

**Key finding:** Most v1.2 features are additive patterns that extend existing components rather than replace them. The event sourcing foundation, hook-based data access, and Zustand state management provide clear integration points for batch logging, workout rotation, testing, and observability.

## Existing Architecture Foundation

### Current Patterns Summary

```
┌─────────────────────────────────────────────────┐
│ App.tsx (routing + error boundary)              │
│ └── Navigation (tabs)                           │
└─────────────────────┬───────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────┐
│ Feature Pages                                   │
│ ├── StartWorkout / ActiveWorkout                │
│ ├── TemplateList                                │
│ ├── AnalyticsPage (lazy loaded)                 │
│ └── BackupSettings                              │
└─────────────────────┬───────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────┐
│ Custom Hooks (data access)                      │
│ ├── useExercises, useGyms, useTemplates         │
│ ├── useHistory, useExerciseMax                  │
│ └── useVolumeByMuscleGroup, etc.                │
└─────────────────────┬───────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────┐
│ Zustand Stores (client state)                   │
│ ├── useWorkoutStore (session storage)           │
│ └── useBackupStore (localStorage)               │
└─────────────────────┬───────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────┐
│ DuckDB-WASM + Event Sourcing                    │
│ ├── OPFS persistence (or in-memory fallback)   │
│ ├── events table (Parquet-backed)              │
│ └── dbt-compiled SQL queries                    │
└─────────────────────────────────────────────────┘
```

**Proven patterns to preserve:**
- Hook-based data access (no prop drilling)
- Zustand for mutable client state (session, preferences)
- Event sourcing for all data mutations
- dbt-compiled SQL (manual copy to compiled-queries.ts)
- Feature-based component folders
- Lazy loading for heavy features (Analytics)

---

## Feature 1: Batch Set Logging

### Current State (One-at-a-Time)

**SetLogger.tsx** (lines 1-202):
- Three NumberStepper components (weight, reps, RIR)
- `handleSubmit()` logs one set, resets reps
- PR detection runs on every set submission

**Data flow:**
```
SetLogger → onLogSet callback → ExerciseView → useWorkoutStore.logSet()
→ session.sets.push(newSet) → sessionStorage update
```

### Proposed Architecture (Batch Grid)

#### Component Structure

Replace single-set form with grid that shows last session + current session:

```typescript
// src/components/workout/BatchSetLogger.tsx
interface BatchSetLoggerProps {
  exerciseId: string;
  originalExerciseId: string;
  targetRepsMin: number;
  targetRepsMax: number;
  onLogSets: (sets: LogSetData[]) => void;
}

interface SetRow {
  id: string;  // temp ID for row key
  weight_kg: number;
  reps: number;
  rir: number | null;
  isLogged: boolean;  // false = pending, true = saved
}

export function BatchSetLogger({ ... }: BatchSetLoggerProps) {
  const [pendingSets, setPendingSets] = useState<SetRow[]>([]);
  const { lastSessionSets, isLoading } = useLastSessionSets(originalExerciseId);

  // Initialize with ghost row pre-filled from last session
  useEffect(() => {
    if (lastSessionSets.length > 0 && pendingSets.length === 0) {
      setPendingSets([{
        id: uuidv7(),
        weight_kg: lastSessionSets[0].weight_kg,
        reps: lastSessionSets[0].reps,
        rir: null,
        isLogged: false,
      }]);
    }
  }, [lastSessionSets]);

  const handleLogPendingSets = () => {
    const toLog = pendingSets.filter(s => !s.isLogged && s.weight_kg > 0 && s.reps > 0);
    onLogSets(toLog.map(({ weight_kg, reps, rir }) => ({ weight_kg, reps, rir })));

    // Mark as logged
    setPendingSets(prev => prev.map(s => ({ ...s, isLogged: true })));
  };

  return (
    <div className="space-y-4">
      {/* Last session reference (ghost data) */}
      <GhostSetGrid sets={lastSessionSets} />

      {/* Current session grid */}
      <CurrentSetGrid
        sets={pendingSets}
        onChange={setPendingSets}
        onAddRow={() => setPendingSets(prev => [...prev, createEmptyRow()])}
      />

      {/* Batch log button */}
      <button onClick={handleLogPendingSets} disabled={...}>
        Log {pendingSets.filter(s => !s.isLogged).length} Sets
      </button>
    </div>
  );
}
```

#### Data Source for Last Session Sets

**New hook:** `useLastSessionSets(exerciseId)`

```typescript
// src/hooks/useLastSessionSets.ts
export function useLastSessionSets(exerciseId: string) {
  const [sets, setSets] = useState<LastSessionSet[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchLastSession() {
      const db = getDuckDB();
      if (!db) return;

      const conn = await db.connect();
      const sql = LAST_SESSION_SETS_SQL.replace('$1', `'${exerciseId}'`);
      const result = await conn.query(sql);
      setSets(result.toArray().map(convertRow));
      await conn.close();
    }
    fetchLastSession();
  }, [exerciseId]);

  return { lastSessionSets: sets, isLoading };
}
```

**New dbt model:** `vw_last_session_sets.sql`

```sql
-- Returns most recent session's sets for a given exercise
WITH recent_workouts AS (
    SELECT DISTINCT
        workout_id,
        logged_at AS workout_date
    FROM {{ ref('fact_sets') }}
    WHERE original_exercise_id = $1
    ORDER BY logged_at DESC
    LIMIT 1
),

last_session_sets AS (
    SELECT
        fs.set_id,
        fs.weight_kg,
        fs.reps,
        fs.rir,
        fs.logged_at,
        ROW_NUMBER() OVER (ORDER BY fs.logged_at) AS set_number
    FROM {{ ref('fact_sets') }} fs
    INNER JOIN recent_workouts rw ON fs.workout_id = rw.workout_id
    WHERE fs.original_exercise_id = $1
)

SELECT * FROM last_session_sets
ORDER BY set_number
```

**Compile and add to:** `src/db/compiled-queries.ts`

```typescript
export const LAST_SESSION_SETS_SQL = `
WITH recent_workouts AS (
    SELECT DISTINCT
        workout_id,
        logged_at AS workout_date
    FROM (${FACT_SETS_SQL}) fact_sets
    WHERE original_exercise_id = $1
    ORDER BY logged_at DESC
    LIMIT 1
),
last_session_sets AS (
    SELECT
        fs.set_id,
        fs.weight_kg,
        fs.reps,
        fs.rir,
        fs.logged_at,
        ROW_NUMBER() OVER (ORDER BY fs.logged_at) AS set_number
    FROM (${FACT_SETS_SQL}) fs
    INNER JOIN recent_workouts rw ON fs.workout_id = rw.workout_id
    WHERE fs.original_exercise_id = $1
)
SELECT * FROM last_session_sets
ORDER BY set_number
`;
```

#### Grid Input Components

**Pattern: React Hook Form for grid validation**

```typescript
// src/components/workout/CurrentSetGrid.tsx
import { useForm, useFieldArray } from 'react-hook-form';

interface SetFormData {
  sets: { weight_kg: number; reps: number; rir: number | null }[];
}

export function CurrentSetGrid({ sets, onChange, onAddRow }: ...) {
  const { control, register, watch } = useForm<SetFormData>({
    defaultValues: { sets },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'sets',
  });

  // Sync form state back to parent
  useEffect(() => {
    const subscription = watch((value) => onChange(value.sets));
    return () => subscription.unsubscribe();
  }, [watch, onChange]);

  return (
    <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2">
      <div className="text-xs text-zinc-500">Weight (kg)</div>
      <div className="text-xs text-zinc-500">Reps</div>
      <div className="text-xs text-zinc-500">RIR</div>
      <div></div>

      {fields.map((field, idx) => (
        <Fragment key={field.id}>
          <input
            type="number"
            step="2.5"
            {...register(`sets.${idx}.weight_kg`, { valueAsNumber: true })}
            className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-center"
          />
          <input
            type="number"
            {...register(`sets.${idx}.reps`, { valueAsNumber: true })}
            className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-center"
          />
          <input
            type="number"
            {...register(`sets.${idx}.rir`, { valueAsNumber: true })}
            className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-center"
          />
          <button onClick={() => remove(idx)} className="text-red-400">×</button>
        </Fragment>
      ))}

      <button onClick={() => append({ weight_kg: 0, reps: 0, rir: null })} className="col-span-4">
        + Add Set
      </button>
    </div>
  );
}
```

**Source:** [Best Practices for Complex Forms with React Hook Form](https://orizens.com/blog/best_practices_for_developing_complex_form-based_apps_with_react_hook_form_and_typescript_support/)

#### Integration Point

**ExerciseView.tsx modification:**

```typescript
// Add toggle between single-set and batch mode
const [logMode, setLogMode] = useState<'single' | 'batch'>('single');

return (
  <div>
    <div className="flex justify-end mb-2">
      <button onClick={() => setLogMode(m => m === 'single' ? 'batch' : 'single')}>
        {logMode === 'single' ? 'Switch to Batch' : 'Switch to Single'}
      </button>
    </div>

    {logMode === 'single' ? (
      <SetLogger ... />
    ) : (
      <BatchSetLogger
        onLogSets={(sets) => {
          sets.forEach(set => handleLogSet(set));
        }}
      />
    )}
  </div>
);
```

#### PR Detection with Batch

**Challenge:** Current PR detection runs per set. Batch logging needs to detect PRs across all sets in batch.

**Solution:** Defer PR indicator until after batch submission, show summary.

```typescript
// After logging batch
const prSets = sets.filter(set => detectIfPR(set, maxData));
if (prSets.length > 0) {
  showPRSummary(prSets);  // "3 PRs in this batch!"
}
```

### Build Order (Batch Logging)

1. Create `vw_last_session_sets.sql` dbt model
2. Compile and add to `compiled-queries.ts`
3. Create `useLastSessionSets` hook
4. Create `GhostSetGrid` presentational component
5. Create `CurrentSetGrid` with React Hook Form
6. Create `BatchSetLogger` smart component
7. Add mode toggle to `ExerciseView.tsx`
8. Update PR detection for batch context

---

## Feature 2: Workout Rotation

### Current State

**No rotation logic.** User manually selects template each workout from dropdown.

### Proposed Architecture

#### Rotation State Management

**New Zustand store:** `useRotationStore`

```typescript
// src/stores/useRotationStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface Rotation {
  rotation_id: string;
  name: string;
  template_ids: string[];  // Ordered list
  current_index: number;   // Which template is next
  is_active: boolean;
}

interface RotationState {
  rotations: Rotation[];
  activeRotationId: string | null;

  createRotation: (name: string, templateIds: string[]) => void;
  deleteRotation: (id: string) => void;
  setActiveRotation: (id: string | null) => void;
  advanceRotation: (rotationId: string) => void;  // Move to next template
  getNextTemplate: (rotationId: string) => string | null;
}

export const useRotationStore = create<RotationState>()(
  persist(
    (set, get) => ({
      rotations: [],
      activeRotationId: null,

      createRotation: (name, templateIds) => {
        const rotation: Rotation = {
          rotation_id: uuidv7(),
          name,
          template_ids: templateIds,
          current_index: 0,
          is_active: true,
        };
        set(state => ({ rotations: [...state.rotations, rotation] }));
      },

      deleteRotation: (id) => {
        set(state => ({
          rotations: state.rotations.filter(r => r.rotation_id !== id),
          activeRotationId: state.activeRotationId === id ? null : state.activeRotationId,
        }));
      },

      setActiveRotation: (id) => {
        set({ activeRotationId: id });
      },

      advanceRotation: (rotationId) => {
        set(state => ({
          rotations: state.rotations.map(r =>
            r.rotation_id === rotationId
              ? { ...r, current_index: (r.current_index + 1) % r.template_ids.length }
              : r
          ),
        }));
      },

      getNextTemplate: (rotationId) => {
        const rotation = get().rotations.find(r => r.rotation_id === rotationId);
        if (!rotation) return null;
        return rotation.template_ids[rotation.current_index];
      },
    }),
    {
      name: 'gymlog-rotations',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
```

**Why separate store:** Rotation state is long-lived (persists across sessions) and unrelated to active workout state (session-scoped). Follows existing pattern of separating concerns (workout vs backup stores).

**Source:** [State Management in 2026: Redux, Context API, and Modern Patterns](https://www.nucamp.co/blog/state-management-in-2026-redux-context-api-and-modern-patterns)

#### Integration with StartWorkout

**StartWorkout.tsx modification:**

```typescript
import { useRotationStore } from '../../stores/useRotationStore';

export function StartWorkout({ templates, gyms, onStarted }: ...) {
  const activeRotationId = useRotationStore(state => state.activeRotationId);
  const getNextTemplate = useRotationStore(state => state.getNextTemplate);
  const advanceRotation = useRotationStore(state => state.advanceRotation);

  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  // If rotation is active, auto-select next template
  useEffect(() => {
    if (activeRotationId) {
      const nextTemplateId = getNextTemplate(activeRotationId);
      if (nextTemplateId) {
        setSelectedTemplateId(nextTemplateId);
      }
    }
  }, [activeRotationId]);

  const handleStartWorkout = () => {
    startWorkout(selectedTemplateId, selectedGymId);

    // Advance rotation after starting workout
    if (activeRotationId) {
      advanceRotation(activeRotationId);
    }

    onStarted();
  };

  return (
    <div>
      {activeRotationId && (
        <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-3 mb-4">
          <div className="text-sm text-blue-200">
            Rotation Active: Next template auto-selected
          </div>
        </div>
      )}

      {/* Template dropdown (disabled if rotation active) */}
      <select
        value={selectedTemplateId}
        onChange={(e) => setSelectedTemplateId(e.target.value)}
        disabled={!!activeRotationId}
        className="..."
      >
        {/* ... */}
      </select>

      <button onClick={handleStartWorkout}>Start Workout</button>
    </div>
  );
}
```

#### New UI: Rotation Builder

```typescript
// src/components/templates/RotationBuilder.tsx
import { useRotationStore } from '../../stores/useRotationStore';
import { useTemplates } from '../../hooks/useTemplates';

export function RotationBuilder() {
  const { templates } = useTemplates();
  const { rotations, createRotation, deleteRotation, setActiveRotation } = useRotationStore();

  const [name, setName] = useState('');
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);

  const handleCreate = () => {
    createRotation(name, selectedTemplates);
    setName('');
    setSelectedTemplates([]);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Workout Rotations</h2>

      {/* Create rotation form */}
      <div className="space-y-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Rotation name (e.g., Push/Pull/Legs)"
          className="..."
        />

        {/* Multi-select templates */}
        <TemplatePicker
          templates={templates}
          selectedIds={selectedTemplates}
          onChange={setSelectedTemplates}
        />

        <button onClick={handleCreate} disabled={!name || selectedTemplates.length < 2}>
          Create Rotation
        </button>
      </div>

      {/* Existing rotations */}
      <div className="space-y-3">
        {rotations.map(rotation => (
          <RotationCard
            key={rotation.rotation_id}
            rotation={rotation}
            templates={templates}
            onActivate={() => setActiveRotation(rotation.rotation_id)}
            onDeactivate={() => setActiveRotation(null)}
            onDelete={() => deleteRotation(rotation.rotation_id)}
          />
        ))}
      </div>
    </div>
  );
}
```

**Add to TemplateList navigation:**

```typescript
// src/components/templates/TemplateList.tsx
const [view, setView] = useState<'templates' | 'rotations'>('templates');

return (
  <div>
    <div className="flex gap-2 mb-6">
      <button onClick={() => setView('templates')}>Templates</button>
      <button onClick={() => setView('rotations')}>Rotations</button>
    </div>

    {view === 'templates' ? <TemplateGrid /> : <RotationBuilder />}
  </div>
);
```

### Build Order (Workout Rotation)

1. Create `useRotationStore` with localStorage persistence
2. Create `RotationBuilder` component with multi-select
3. Add rotation view toggle to `TemplateList`
4. Modify `StartWorkout` to consume rotation state
5. Test rotation advancement on workout start

---

## Feature 3: Visual Overhaul (Tailwind Systematization)

### Current State

**Existing Tailwind usage:** Custom classes with no component library. Some inconsistencies:
- Button styles duplicated across components
- Spacing varies (some use `gap-4`, others `gap-6`)
- Color palette mixed (`zinc-700`, `zinc-800`, custom `accent`)

### Proposed Architecture

**Goal:** Systematize Tailwind without migrating to full component library (Shadcn, DaisyUI). Preserve existing custom components.

#### Design Token Layer

**Create:** `src/styles/design-tokens.css`

```css
@layer base {
  :root {
    /* Spacing scale (extend Tailwind defaults) */
    --spacing-section: 3rem;  /* 48px - between major sections */
    --spacing-component: 1.5rem;  /* 24px - between components */
    --spacing-input: 0.75rem;  /* 12px - input padding */

    /* Color semantic tokens (map to Tailwind zinc + custom accent) */
    --color-bg-primary: theme('colors.zinc.950');
    --color-bg-secondary: theme('colors.zinc.900');
    --color-bg-input: theme('colors.zinc.800');
    --color-border: theme('colors.zinc.700');
    --color-text-primary: theme('colors.zinc.100');
    --color-text-secondary: theme('colors.zinc.400');
    --color-accent: theme('colors.orange.500');
    --color-accent-hover: theme('colors.orange.400');

    /* Component-specific tokens */
    --button-height-sm: 2rem;
    --button-height-md: 2.5rem;
    --button-height-lg: 3rem;
    --border-radius: 0.5rem;
  }
}

@layer components {
  /* Button variants */
  .btn-primary {
    @apply px-4 py-2 bg-accent hover:bg-accent/90 text-black font-medium rounded-lg transition-colors;
  }

  .btn-secondary {
    @apply px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-lg transition-colors;
  }

  .btn-danger {
    @apply px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors;
  }

  /* Input variants */
  .input-default {
    @apply w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg
           text-zinc-100 placeholder-zinc-500
           focus:outline-none focus:ring-2 focus:ring-accent;
  }

  /* Card variants */
  .card {
    @apply bg-zinc-900 border border-zinc-800 rounded-lg p-4;
  }

  .card-hover {
    @apply bg-zinc-900 border border-zinc-800 rounded-lg p-4
           hover:border-zinc-700 transition-colors;
  }
}
```

**Integrate into:** `src/index.css`

```css
@import 'tailwindcss';
@import './styles/design-tokens.css';
```

**Source:** [Tailwind CSS Design System Best Practices](https://sancho.dev/blog/tailwind-and-design-systems)

#### Component Refactoring Strategy

**Phase 1: Extract reusable primitives**

```typescript
// src/components/ui/Button.tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ variant = 'secondary', size = 'md', className, ...props }: ButtonProps) {
  const baseClasses = 'font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary: 'bg-accent hover:bg-accent/90 text-black',
    secondary: 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100',
    danger: 'bg-red-600 hover:bg-red-500 text-white',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    />
  );
}
```

```typescript
// src/components/ui/Input.tsx
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <div className="space-y-1">
      {label && <label className="text-sm text-zinc-400">{label}</label>}
      <input
        className={`input-default ${error ? 'border-red-500' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
```

**Phase 2: Migrate existing components incrementally**

```typescript
// Before (SetLogger.tsx line 193-199)
<button
  onClick={handleSubmit}
  disabled={!canLog}
  className="w-full py-4 bg-accent hover:bg-accent/90 text-black font-bold text-lg rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
>
  Log Set
</button>

// After
<Button variant="primary" size="lg" onClick={handleSubmit} disabled={!canLog} className="w-full">
  Log Set
</Button>
```

**Phase 3: Document component API**

Create `src/components/ui/README.md` with component usage examples and props.

### Build Order (Visual Overhaul)

1. Create `design-tokens.css` with semantic color/spacing tokens
2. Extract `Button`, `Input`, `Card` primitives to `src/components/ui/`
3. Migrate high-traffic components (SetLogger, StartWorkout, TemplateCard)
4. Document component API in README
5. Visual QA pass on all screens

---

## Feature 4: Testing Infrastructure

### Current State

**No tests.** No Vitest config, no test files.

### Proposed Architecture

#### Test Framework Setup

**Install dependencies:**

```bash
npm install -D vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

**Create:** `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['src/tests/**', 'src/**/*.test.tsx'],
    },
  },
});
```

**Create:** `src/tests/setup.ts`

```typescript
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock DuckDB-WASM (too heavy for unit tests)
vi.mock('@duckdb/duckdb-wasm', () => ({
  AsyncDuckDB: vi.fn(),
  getJsDelivrBundles: vi.fn(() => ({})),
  selectBundle: vi.fn(() => ({ mainModule: '', mainWorker: '' })),
  ConsoleLogger: vi.fn(),
  LogLevel: { WARNING: 1 },
  DuckDBAccessMode: { READ_WRITE: 0 },
}));
```

**Add to package.json:**

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

**Source:** [Unit Test React Components with Vitest and React Testing Library](https://oneuptime.com/blog/post/2026-01-15-unit-test-react-vitest-testing-library/view)

#### Testing Strategy

**Unit tests:** Component logic, hook logic, utility functions
**Integration tests:** Component + hook interactions
**NO E2E tests:** DuckDB-WASM too complex for CI environment

#### Testing Zustand Stores

**Pattern:** Mock Zustand stores in tests

```typescript
// src/tests/mocks/zustand.ts
import { vi } from 'vitest';
import * as zustand from 'zustand';

const { create: actualCreate } = await vi.importActual<typeof zustand>('zustand');

// Store created with actualCreate for tests
export const storeResetFns = new Set<() => void>();

export const create = (<T>(initializer: zustand.StateCreator<T>) => {
  const store = actualCreate(initializer);
  const initialState = store.getState();
  storeResetFns.add(() => store.setState(initialState, true));
  return store;
}) as typeof zustand.create;

// Reset all stores between tests
export function resetAllStores() {
  storeResetFns.forEach(fn => fn());
}
```

**In each test file:**

```typescript
import { afterEach, beforeEach } from 'vitest';
import { resetAllStores } from '../mocks/zustand';

beforeEach(() => {
  resetAllStores();
});
```

**Source:** [Testing Zustand with Vitest](https://zustand.docs.pmnd.rs/guides/testing)

#### Testing Components with Hooks (Mock DuckDB)

**Pattern:** Mock hook return values, test component behavior

```typescript
// src/components/workout/__tests__/SetLogger.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SetLogger } from '../SetLogger';
import * as useHistoryModule from '../../../hooks/useHistory';

// Mock the hook
vi.spyOn(useHistoryModule, 'useExerciseMax').mockReturnValue({
  max_weight: 100,
  max_1rm: 120,
});

describe('SetLogger', () => {
  it('should call onLogSet with correct data', () => {
    const onLogSet = vi.fn();

    render(
      <SetLogger
        exerciseId="ex1"
        originalExerciseId="ex1"
        targetRepsMin={8}
        targetRepsMax={12}
        onLogSet={onLogSet}
      />
    );

    // Simulate user input
    const weightInput = screen.getByLabelText(/weight/i);
    const repsInput = screen.getByLabelText(/reps/i);
    const logButton = screen.getByText(/log set/i);

    fireEvent.change(weightInput, { target: { value: '80' } });
    fireEvent.change(repsInput, { target: { value: '10' } });
    fireEvent.click(logButton);

    expect(onLogSet).toHaveBeenCalledWith({
      weight_kg: 80,
      reps: 10,
      rir: null,
    });
  });

  it('should detect PR when weight exceeds max', () => {
    // ...test PR indicator appears
  });
});
```

**No real DuckDB queries in unit tests.** Too slow, too complex. Mock hook return values.

#### Testing Hooks in Isolation

**Pattern:** Use `renderHook` from React Testing Library

```typescript
// src/hooks/__tests__/useHistory.test.tsx
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useHistory } from '../useHistory';
import * as duckdbInit from '../../db/duckdb-init';

// Mock DuckDB connection
const mockConn = {
  query: vi.fn(() => ({
    toArray: () => [
      { set_id: 's1', weight_kg: 100, reps: 10, logged_at: '2026-01-30T10:00:00Z' },
    ],
  })),
  close: vi.fn(),
};

vi.spyOn(duckdbInit, 'getDuckDB').mockReturnValue({
  connect: vi.fn(() => Promise.resolve(mockConn)),
} as any);

describe('useHistory', () => {
  it('should fetch and return history', async () => {
    const { result } = renderHook(() => useHistory({ exerciseId: 'ex1', currentGymId: 'g1' }));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0].weight_kg).toBe(100);
  });
});
```

**Source:** [Vitest and Zustand Testing Strategies](https://github.com/pmndrs/zustand/discussions/1918)

### Build Order (Testing)

1. Install Vitest + React Testing Library
2. Create `vitest.config.ts` and `src/tests/setup.ts`
3. Create Zustand mock helper (`src/tests/mocks/zustand.ts`)
4. Write tests for presentational components (Button, NumberStepper)
5. Write tests for smart components with mocked hooks (SetLogger, StartWorkout)
6. Write tests for hooks with mocked DuckDB (useHistory, useExerciseMax)
7. Add test scripts to package.json

---

## Feature 5: CI/CD Pipeline

### Current State

**No GitHub Actions workflow.** Manual deployment.

### Proposed Architecture

**Create:** `.github/workflows/deploy.yml`

```yaml
name: Build and Deploy

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test -- --run

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        if: success()
        with:
          files: ./coverage/coverage-final.json

  build:
    runs-on: ubuntu-latest
    needs: test
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/master'
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Compile dbt models
        run: npm run dbt:compile

      - name: Build Vite app
        run: npm run build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/master'
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

**Update:** `vite.config.ts`

```typescript
export default defineConfig({
  // Set base path for GitHub Pages (repo name)
  base: process.env.NODE_ENV === 'production' ? '/gymlog/' : '/',
  // ... rest of config
});
```

**Source:** [Deploying Vite to GitHub Pages with GitHub Actions](https://savaslabs.com/blog/deploying-vite-github-pages-single-github-action)

### Build Order (CI/CD)

1. Create `.github/workflows/deploy.yml`
2. Configure GitHub Pages settings (Actions source)
3. Update `vite.config.ts` base path
4. Test workflow on feature branch (PR)
5. Merge to main and verify deployment

---

## Feature 6: Demo Data Seeding

### Current State

**Empty database on first load.** User must manually create gyms, exercises, templates.

### Proposed Architecture

#### Demo Data as Static Parquet

**Pattern:** Bundle demo Parquet file, load on first run.

**Create:** `public/demo/events.parquet`

Generate from Python script:

```python
import pyarrow as pa
import pyarrow.parquet as pq
from datetime import datetime, timedelta
import uuid

# Demo events
events = [
    # Gym created
    {
        '_event_id': str(uuid.uuid4()),
        '_created_at': datetime.now() - timedelta(days=30),
        'event_type': 'gym_created',
        'payload': json.dumps({'gym_id': 'gym1', 'name': 'Home Gym', 'location': None})
    },
    # Exercises created
    {
        '_event_id': str(uuid.uuid4()),
        '_created_at': datetime.now() - timedelta(days=30),
        'event_type': 'exercise_created',
        'payload': json.dumps({'exercise_id': 'ex1', 'name': 'Bench Press', 'muscle_group': 'Chest', 'is_global': True})
    },
    # ... more exercises, templates, workout sessions
]

table = pa.Table.from_pylist(events)
pq.write_table(table, 'public/demo/events.parquet')
```

**Load demo data in app:**

```typescript
// src/db/demo-data.ts
import { getDuckDB } from './duckdb-init';

export async function loadDemoData(): Promise<void> {
  const db = getDuckDB();
  if (!db) return;

  const conn = await db.connect();

  // Check if events table is empty
  const countResult = await conn.query('SELECT COUNT(*) as count FROM events');
  const count = countResult.toArray()[0].count;

  if (count > 0) {
    console.log('Database already has data, skipping demo load');
    await conn.close();
    return;
  }

  console.log('Loading demo data...');

  // Copy from bundled Parquet file
  await conn.query(`
    COPY events FROM '/demo/events.parquet' (FORMAT PARQUET)
  `);

  console.log('Demo data loaded');
  await conn.close();
}
```

**Call in App.tsx:**

```typescript
// In useDuckDB hook or App initialization
useEffect(() => {
  if (status.isConnected) {
    loadDemoData();
  }
}, [status.isConnected]);
```

**Alternative: HTTP-fetched Parquet (if public/ bundling doesn't work)**

```typescript
// Fetch from CDN or GitHub raw URL
await conn.query(`
  INSTALL httpfs;
  LOAD httpfs;
  COPY events FROM 'https://raw.githubusercontent.com/user/repo/main/demo-events.parquet' (FORMAT PARQUET)
`);
```

**Source:** [DuckDB WASM with Static Parquet Files](https://medium.com/@hadiyolworld007/duckdb-wasm-in-the-browser-sql-on-parquet-no-backend-ba20967ace1f)

### Build Order (Demo Data)

1. Create Python script to generate demo events Parquet
2. Add `public/demo/events.parquet` to repo
3. Create `loadDemoData()` function
4. Integrate into App initialization
5. Test with empty database

---

## Feature 7: Error Boundaries

### Current State

**No error boundaries.** React crashes bubble up to blank screen.

### Proposed Architecture

**Pattern:** Granular error boundaries at feature level

```typescript
// src/components/ErrorBoundary.tsx
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-6 bg-red-900/30 border border-red-700/50 rounded-lg">
          <h2 className="text-red-400 font-semibold mb-2">Something went wrong</h2>
          <p className="text-sm text-zinc-400 mb-4">{this.state.error?.message}</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Placement strategy:**

```typescript
// App.tsx - Root-level boundary
function App() {
  return (
    <ErrorBoundary fallback={<RootErrorFallback />}>
      <AppContent />
    </ErrorBoundary>
  );
}

// AppContent - Feature-level boundaries
function AppContent() {
  return (
    <div>
      <main>
        <ErrorBoundary>
          {activeTab === 'workouts' && <StartWorkout />}
        </ErrorBoundary>

        <ErrorBoundary>
          {activeTab === 'analytics' && <AnalyticsPage />}
        </ErrorBoundary>

        <ErrorBoundary>
          {activeTab === 'templates' && <TemplateList />}
        </ErrorBoundary>
      </main>
    </div>
  );
}
```

**Where NOT to place:**
- Individual input components (too granular)
- List items (crashes in one item shouldn't isolate it)

**Source:** [React Error Boundary Best Practices](https://refine.dev/blog/react-error-boundaries/)

### Build Order (Error Boundaries)

1. Create `ErrorBoundary` component
2. Add root-level boundary in App.tsx
3. Add feature-level boundaries for each tab
4. Test error handling (throw in component to verify fallback)

---

## Feature 8: Observability (Performance & Storage Metrics)

### Current State

**No observability.** No visibility into query performance or storage usage.

### Proposed Architecture

#### DuckDB Query Performance Tracking

```typescript
// src/db/performance.ts
interface QueryMetric {
  query: string;
  duration_ms: number;
  timestamp: string;
  result_rows?: number;
}

class PerformanceTracker {
  private metrics: QueryMetric[] = [];

  async trackQuery<T>(
    queryName: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    const start = performance.now();
    try {
      const result = await queryFn();
      const duration = performance.now() - start;

      this.metrics.push({
        query: queryName,
        duration_ms: duration,
        timestamp: new Date().toISOString(),
      });

      // Log slow queries
      if (duration > 500) {
        console.warn(`Slow query: ${queryName} took ${duration.toFixed(2)}ms`);
      }

      return result;
    } catch (error) {
      const duration = performance.now() - start;
      console.error(`Query failed: ${queryName} after ${duration.toFixed(2)}ms`, error);
      throw error;
    }
  }

  getMetrics() {
    return this.metrics;
  }

  getAverageDuration(queryName: string) {
    const relevant = this.metrics.filter(m => m.query === queryName);
    if (relevant.length === 0) return 0;
    return relevant.reduce((sum, m) => sum + m.duration_ms, 0) / relevant.length;
  }
}

export const perfTracker = new PerformanceTracker();
```

**Integrate into hooks:**

```typescript
// src/hooks/useHistory.ts
import { perfTracker } from '../db/performance';

export function useHistory({ exerciseId, currentGymId }: UseHistoryOptions) {
  const fetchHistory = useCallback(async () => {
    // ... existing setup

    const result = await perfTracker.trackQuery('EXERCISE_HISTORY_SQL', async () => {
      const conn = await db.connect();
      const sql = EXERCISE_HISTORY_SQL.replace('$1', `'${currentGymId}'`).replace('$2', `'${exerciseId}'`);
      const result = await conn.query(sql);
      await conn.close();
      return result;
    });

    const rows = result.toArray().map(convertRow);
    setHistory(rows);
  }, [exerciseId, currentGymId]);

  // ... rest
}
```

#### OPFS Storage Usage Tracking

```typescript
// src/db/storage-metrics.ts
export async function getStorageMetrics(): Promise<{
  opfs_used_bytes: number;
  opfs_quota_bytes: number;
  opfs_percentage: number;
  events_count: number;
}> {
  // Check OPFS storage quota
  const estimate = await navigator.storage.estimate();
  const used = estimate.usage || 0;
  const quota = estimate.quota || 0;

  // Count events in DuckDB
  const db = getDuckDB();
  if (!db) {
    return { opfs_used_bytes: 0, opfs_quota_bytes: 0, opfs_percentage: 0, events_count: 0 };
  }

  const conn = await db.connect();
  const result = await conn.query('SELECT COUNT(*) as count FROM events');
  const eventsCount = result.toArray()[0].count;
  await conn.close();

  return {
    opfs_used_bytes: used,
    opfs_quota_bytes: quota,
    opfs_percentage: quota > 0 ? (used / quota) * 100 : 0,
    events_count: eventsCount,
  };
}
```

**Display in Settings tab:**

```typescript
// src/components/backup/BackupSettings.tsx
import { getStorageMetrics } from '../../db/storage-metrics';
import { perfTracker } from '../../db/performance';

export function BackupSettings() {
  const [metrics, setMetrics] = useState<StorageMetrics | null>(null);

  useEffect(() => {
    getStorageMetrics().then(setMetrics);
  }, []);

  const queryMetrics = perfTracker.getMetrics();
  const avgHistoryQueryTime = perfTracker.getAverageDuration('EXERCISE_HISTORY_SQL');

  return (
    <div className="space-y-6">
      {/* Existing backup settings */}

      {/* Performance metrics */}
      <div className="card">
        <h3 className="font-semibold mb-3">Performance Metrics</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-400">Avg history query</span>
            <span className="font-mono">{avgHistoryQueryTime.toFixed(0)}ms</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Total queries</span>
            <span className="font-mono">{queryMetrics.length}</span>
          </div>
        </div>
      </div>

      {/* Storage metrics */}
      {metrics && (
        <div className="card">
          <h3 className="font-semibold mb-3">Storage Usage</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-400">OPFS storage</span>
              <span className="font-mono">{(metrics.opfs_used_bytes / 1024 / 1024).toFixed(2)} MB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Quota</span>
              <span className="font-mono">{(metrics.opfs_quota_bytes / 1024 / 1024).toFixed(0)} MB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Events stored</span>
              <span className="font-mono">{metrics.events_count}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

**Source:** [Browser Performance Measurement for DuckDB](https://www.timlrx.com/blog/the-best-in-browser-data-processing-framework-is-sql)

### Build Order (Observability)

1. Create `performance.ts` with PerformanceTracker
2. Create `storage-metrics.ts` with OPFS quota checking
3. Integrate `trackQuery` into high-traffic hooks (useHistory, useExercises)
4. Add performance/storage panels to Settings tab
5. Test slow query detection

---

## Summary: Integration Points & Build Order

### What Changes vs What Stays

**New files:**
- `src/components/workout/BatchSetLogger.tsx`
- `src/components/workout/CurrentSetGrid.tsx`
- `src/stores/useRotationStore.ts`
- `src/components/templates/RotationBuilder.tsx`
- `src/styles/design-tokens.css`
- `src/components/ui/Button.tsx`, `Input.tsx`
- `vitest.config.ts`, `src/tests/setup.ts`
- `.github/workflows/deploy.yml`
- `public/demo/events.parquet`
- `src/db/demo-data.ts`
- `src/components/ErrorBoundary.tsx`
- `src/db/performance.ts`, `storage-metrics.ts`

**Modified files:**
- `src/components/workout/ExerciseView.tsx` (batch mode toggle)
- `src/components/workout/StartWorkout.tsx` (rotation integration)
- `src/components/templates/TemplateList.tsx` (rotation view toggle)
- `src/db/compiled-queries.ts` (add LAST_SESSION_SETS_SQL)
- `src/index.css` (import design tokens)
- `src/App.tsx` (error boundaries, demo data load)
- `package.json` (test scripts, new dependencies)
- `vite.config.ts` (base path for GitHub Pages)

**What stays the same:**
- Event sourcing foundation
- Hook-based data access pattern
- Zustand for client state (extended, not replaced)
- dbt compilation workflow
- DuckDB-WASM initialization
- Existing component hierarchy

### Recommended Build Order (Dependency-Aware)

**Phase 1: Foundation (No UI changes)**
1. Setup testing infrastructure (Vitest + RTL)
2. Create performance tracker + storage metrics
3. Add error boundaries to App.tsx

**Phase 2: Data Layer (New queries)**
1. Create `vw_last_session_sets.sql` dbt model
2. Compile and add to `compiled-queries.ts`
3. Create `useLastSessionSets` hook
4. Write tests for hook

**Phase 3: Visual System (Reusable primitives)**
1. Create `design-tokens.css`
2. Extract Button, Input, Card components
3. Migrate high-traffic components to use primitives

**Phase 4: Batch Logging (User-facing feature)**
1. Create `CurrentSetGrid` with React Hook Form
2. Create `GhostSetGrid` presentational component
3. Create `BatchSetLogger` smart component
4. Add mode toggle to ExerciseView
5. Write tests for batch logging flow

**Phase 5: Workout Rotation (User-facing feature)**
1. Create `useRotationStore` with localStorage
2. Create `RotationBuilder` component
3. Integrate rotation into `StartWorkout`
4. Add rotation view toggle to TemplateList
5. Write tests for rotation advancement

**Phase 6: Infrastructure (CI/CD + Demo)**
1. Create GitHub Actions workflow
2. Configure GitHub Pages settings
3. Generate demo Parquet file
4. Integrate demo data loading
5. Test deployment pipeline

**Phase 7: Observability (Settings UI)**
1. Integrate `trackQuery` into hooks
2. Add performance/storage panels to Settings tab
3. Test slow query warnings

---

## Architectural Risks & Mitigations

### Risk 1: Batch Logging Complexity

**Risk:** Grid input with validation harder to implement than single-set stepper

**Mitigation:**
- Use React Hook Form (proven library for complex forms)
- Start with simple grid (weight + reps only), add RIR later
- Keep single-set mode as fallback

**Acceptance criteria:** Batch logging UX tested with real users, no worse than single-set

### Risk 2: Rotation State Conflicts

**Risk:** useRotationStore localStorage conflicts with useWorkoutStore sessionStorage

**Mitigation:**
- Different storage keys (`gymlog-rotations` vs `gymlog-workout`)
- Different lifetimes (localStorage survives tab close, sessionStorage doesn't)
- Clear separation of concerns (rotation = preferences, workout = transient session)

**Acceptance criteria:** Rotation state persists across sessions, workout state clears on tab close

### Risk 3: Test Infrastructure Overhead

**Risk:** Vitest setup slows down dev workflow

**Mitigation:**
- Mock DuckDB-WASM (too slow for CI)
- Use Vitest watch mode for fast feedback
- Start with high-value tests (components with complex logic)

**Acceptance criteria:** Tests run <10s in CI, <2s in watch mode

### Risk 4: Demo Data Staleness

**Risk:** Demo Parquet file becomes outdated as schema evolves

**Mitigation:**
- Generate demo data programmatically (Python script)
- Version demo data file (include schema version in filename)
- Document regeneration process in README

**Acceptance criteria:** Demo data loads successfully, covers all features

### Risk 5: Performance Tracking Overhead

**Risk:** performance.now() calls slow down queries

**Mitigation:**
- Only track in development mode: `if (import.meta.env.DEV) perfTracker.track(...)`
- Sample queries (track 1 in 10 in production)
- Measure overhead (should be <1ms)

**Acceptance criteria:** Performance tracking adds <5% overhead

---

## Confidence Assessment

| Feature | Architecture Confidence | Integration Complexity | Risk Level |
|---------|------------------------|------------------------|------------|
| Batch Set Logging | HIGH | Medium (new grid pattern) | Medium |
| Workout Rotation | HIGH | Low (new Zustand store) | Low |
| Visual Overhaul | HIGH | Low (incremental migration) | Low |
| Testing Infrastructure | MEDIUM | High (mock setup) | Medium |
| CI/CD Pipeline | HIGH | Low (standard workflow) | Low |
| Demo Data | MEDIUM | Medium (Parquet bundling) | Medium |
| Error Boundaries | HIGH | Low (React built-in) | Low |
| Observability | HIGH | Low (metrics display) | Low |

**Overall confidence:** HIGH. Most features extend existing patterns rather than replace them. Integration points are well-defined. Build order minimizes dependency conflicts.

---

## Sources

### Batch Grid Input Forms
- [Best Practices for Complex Forms with React Hook Form](https://orizens.com/blog/best_practices_for_developing_complex_form-based_apps_with_react_hook_form_and_typescript_support/)
- [TypeScript Fundamentals in 2026](https://www.nucamp.co/blog/typescript-fundamentals-in-2026-why-every-full-stack-developer-needs-type-safety)

### React Testing with DuckDB WASM
- [duckdb-wasm-kit: React Hooks and Utilities](https://github.com/holdenmatt/duckdb-wasm-kit)
- [React + DuckDB-WASM at 60 FPS](https://medium.com/@hadiyolworld007/react-duckdb-wasm-at-60-fps-a00cafad3271)

### GitHub Actions Deployment
- [Deploying Vite to GitHub Pages with GitHub Actions](https://savaslabs.com/blog/deploying-vite-github-pages-single-github-action)
- [Vite Static Deploy Guide](https://vite.dev/guide/static-deploy)

### Tailwind Design Systems
- [Don't use Tailwind for your Design System](https://sancho.dev/blog/tailwind-and-design-systems)
- [How to Build A React TS Tailwind Design System](https://dev.to/hamatoyogi/how-to-build-a-react-ts-tailwind-design-system-1ppi)

### Error Boundaries
- [React Error Boundaries Guide](https://refine.dev/blog/react-error-boundaries/)
- [Mastering Error Boundaries in React](https://medium.com/@vnkelkar11/using-error-boundary-in-react-a29ded725eee)

### Browser Performance & Storage
- [LocalStorage vs IndexedDB vs OPFS vs WASM-SQLite](https://rxdb.info/articles/localstorage-indexeddb-cookies-opfs-sqlite-wasm.html)
- [The Best In-Browser Data Processing Framework is SQL](https://www.timlrx.com/blog/the-best-in-browser-data-processing-framework-is-sql)

### DuckDB WASM + Parquet
- [DuckDB WASM in the Browser: SQL on Parquet](https://medium.com/@hadiyolworld007/duckdb-wasm-in-the-browser-sql-on-parquet-no-backend-ba20967ace1f)
- [OPFS Caching with DuckDB-WASM](https://medium.com/@hadiyolworld007/opfs-caching-ftw-react-duckdb-wasm-blazing-parquet-0442ff695db5)

### State Management & Testing
- [State Management in 2026: Redux, Context API, and Modern Patterns](https://www.nucamp.co/blog/state-management-in-2026-redux-context-api-and-modern-patterns)
- [Testing Zustand with Vitest](https://zustand.docs.pmnd.rs/guides/testing)
- [Unit Test React Components with Vitest](https://oneuptime.com/blog/post/2026-01-15-unit-test-react-vitest-testing-library/view)

---

**Next steps:** This architecture document informs v1.2 roadmap phase structure. Recommended phases: Foundation → Data Layer → Visual System → User Features → Infrastructure → Observability.
