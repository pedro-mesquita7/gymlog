# Phase 21: Comparison Analytics - Research

**Researched:** 2026-02-01
**Domain:** React UI composition, DuckDB-WASM analytics queries, multi-exercise data aggregation
**Confidence:** HIGH

## Summary

Phase 21 adds a "Comparison" section to the existing Analytics page where users can select 2-4 exercises and view side-by-side stat cards showing PRs, volume, frequency, and progression status. This phase builds entirely on the existing stack (React, DuckDB-WASM, Tailwind CSS v4, Recharts) with zero new dependencies, per the v1.4 constraint.

The codebase already has all the data primitives needed: `FACT_SETS_SQL` computes PRs/1RM/volume per set, `progressionStatusSQL` classifies exercises as progressing/plateau/regressing, and `useExercises` provides the exercise list. The work is primarily: (1) a multi-select exercise picker component, (2) a new `useComparisonStats` hook that queries DuckDB for aggregated per-exercise stats, and (3) stat card UI components rendering the comparison grid.

The existing AnalyticsPage follows a clear pattern: time range picker at top, section headings, data hooks driving card/chart components, all wrapped in `FeatureErrorBoundary`. The comparison section should follow this identical pattern and integrate as a new collapsible section on the Analytics page.

**Primary recommendation:** Build a single `useComparisonStats` hook that accepts an array of exercise IDs and the current time range, runs one DuckDB query returning per-exercise PR, volume, frequency, and progression data, then render results in a responsive grid of stat cards.

## Standard Stack

No new libraries. The existing stack covers all requirements.

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | ^19.2.0 | UI framework | Already in use |
| @duckdb/duckdb-wasm | 1.32.0 | In-browser SQL analytics | All analytics queries use this |
| Tailwind CSS | ^4.1.18 | Styling (OKLCH theme) | All components use this |
| date-fns | ^4.1.0 | Date formatting | Used in ProgressionStatusCard |
| framer-motion | ^12.29.2 | Animations (CollapsibleSection) | Used by ui/CollapsibleSection |

### Supporting (Already Installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| recharts | ^3.7.0 | Charts | Only if comparison charts added (not in v1 requirements) |
| react-error-boundary | ^6.1.0 | Error boundaries | FeatureErrorBoundary wraps each section |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom multi-select | react-select / headless UI | Violates zero-dependency constraint; native checkboxes + custom styling is sufficient |
| Multiple individual queries | Single combined SQL query | Single query is more efficient for DuckDB-WASM |

**Installation:** None required.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/analytics/
│   ├── AnalyticsPage.tsx           # Add comparison section here
│   ├── ComparisonSection.tsx       # NEW: orchestrates comparison feature
│   ├── ExerciseMultiSelect.tsx     # NEW: multi-select picker (2-4 exercises)
│   └── ComparisonStatCard.tsx      # NEW: per-exercise stat card
├── hooks/
│   └── useComparisonStats.ts       # NEW: DuckDB query for comparison data
├── types/
│   └── analytics.ts                # Add ComparisonStats interface
└── db/
    └── compiled-queries.ts         # Add comparisonStatsSQL function
```

### Pattern 1: Hook-per-Section (Established Pattern)
**What:** Each Analytics section has its own data hook that takes `days` (time range) and returns `{ data, isLoading, error }`.
**When to use:** Always -- every analytics section in this codebase follows this pattern.
**Example:**
```typescript
// Source: existing useProgressionStatus.ts pattern
export function useComparisonStats(
  exerciseIds: string[],
  days: number | null
): UseComparisonStatsReturn {
  const [data, setData] = useState<ComparisonStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef(false);

  const fetchData = useCallback(async () => {
    if (exerciseIds.length === 0) {
      setData([]);
      setIsLoading(false);
      return;
    }
    const db = getDuckDB();
    if (!db) { setError('Database not initialized'); setIsLoading(false); return; }
    setIsLoading(true);
    setError(null);
    try {
      const conn = await db.connect();
      const sql = comparisonStatsSQL(exerciseIds, days);
      const result = await conn.query(sql);
      // ... map rows to ComparisonStats[]
      await conn.close();
    } catch (err) { /* ... */ }
    finally { if (!abortRef.current) setIsLoading(false); }
  }, [exerciseIds.join(','), days]); // join IDs for stable dependency

  useEffect(() => {
    abortRef.current = false;
    fetchData();
    return () => { abortRef.current = true; };
  }, [fetchData]);

  return { data, isLoading, error, refresh: fetchData };
}
```

### Pattern 2: Single Combined SQL Query
**What:** One SQL query returns all comparison metrics (PR, volume, frequency, progression) per exercise, avoiding multiple round-trips to DuckDB.
**When to use:** When comparing N exercises -- one query is far more efficient than N separate queries.
**Example:**
```typescript
// Source: pattern derived from existing compiled-queries.ts
export function comparisonStatsSQL(exerciseIds: string[], days: number | null): string {
  const idList = exerciseIds.map(id => `'${id}'`).join(', ');
  const timeFilter = days !== null
    ? `CAST(fs.logged_at AS TIMESTAMPTZ) >= CURRENT_DATE - INTERVAL '${days} days'`
    : `1=1`;

  return `
    WITH fact_sets AS (${FACT_SETS_SQL}),
    exercise_dim AS (${DIM_EXERCISE_ALL_SQL}),
    workout_events AS (
      SELECT payload->>'workout_id' AS workout_id,
             COALESCE(payload->>'logged_at', CAST(_created_at AS VARCHAR)) AS logged_at
      FROM events WHERE event_type = 'workout_started'
    ),
    -- PRs: max weight and max estimated 1RM per exercise
    pr_stats AS (
      SELECT original_exercise_id,
             MAX(weight_kg) AS max_weight,
             MAX(estimated_1rm) AS max_estimated_1rm
      FROM fact_sets
      WHERE original_exercise_id IN (${idList}) AND ${timeFilter}
      GROUP BY original_exercise_id
    ),
    -- Volume: total sets x reps x weight per exercise
    volume_stats AS (
      SELECT original_exercise_id,
             SUM(weight_kg * reps) AS total_volume,
             COUNT(*) AS total_sets
      FROM fact_sets
      WHERE original_exercise_id IN (${idList}) AND ${timeFilter}
      GROUP BY original_exercise_id
    ),
    -- Frequency: distinct workout sessions per exercise
    frequency_stats AS (
      SELECT fs.original_exercise_id,
             COUNT(DISTINCT fs.workout_id) AS session_count,
             -- Calculate weeks in range for per-week average
             GREATEST(1, EXTRACT(EPOCH FROM (MAX(CAST(w.logged_at AS TIMESTAMPTZ)) - MIN(CAST(w.logged_at AS TIMESTAMPTZ)))) / 604800) AS weeks_span
      FROM fact_sets fs
      JOIN workout_events w ON fs.workout_id = w.workout_id
      WHERE fs.original_exercise_id IN (${idList}) AND ${timeFilter}
      GROUP BY fs.original_exercise_id
    )
    SELECT
      e.exercise_id,
      e.name AS exercise_name,
      e.muscle_group,
      COALESCE(p.max_weight, 0) AS max_weight,
      COALESCE(p.max_estimated_1rm, 0) AS max_estimated_1rm,
      COALESCE(v.total_volume, 0) AS total_volume,
      COALESCE(v.total_sets, 0) AS total_sets,
      COALESCE(f.session_count, 0) AS session_count,
      COALESCE(ROUND(f.session_count / f.weeks_span, 1), 0) AS sessions_per_week
    FROM exercise_dim e
    LEFT JOIN pr_stats p ON e.exercise_id = p.original_exercise_id
    LEFT JOIN volume_stats v ON e.exercise_id = v.original_exercise_id
    LEFT JOIN frequency_stats f ON e.exercise_id = f.original_exercise_id
    WHERE e.exercise_id IN (${idList})
    ORDER BY e.name
  `;
}
```

### Pattern 3: AnalyticsPage Section Integration
**What:** New sections added to AnalyticsPage follow the established layout: SectionHeading -> conditional loading/error -> FeatureErrorBoundary -> component.
**When to use:** Always for new analytics sections.
**Example:**
```tsx
// Source: existing AnalyticsPage.tsx pattern
{/* SECTION 6: Exercise Comparison */}
<SectionHeading title="Exercise Comparison" subtitle="Compare 2-4 exercises side-by-side" />

<FeatureErrorBoundary feature="Exercise Comparison">
  <ComparisonSection days={days} exercises={exercises} />
</FeatureErrorBoundary>
```

### Pattern 4: Multi-Select with Chip/Tag UI
**What:** Custom multi-select using checkboxes or a dropdown with exercise chips showing selected state. Limit 2-4 selections.
**When to use:** For the exercise picker (COMP-01).
**Example:**
```tsx
// Dropdown trigger showing selected exercise chips
<div className="flex flex-wrap gap-2">
  {selectedExercises.map(ex => (
    <span key={ex.exercise_id}
      className="inline-flex items-center gap-1 px-3 py-1 bg-accent/20 text-accent rounded-full text-sm">
      {ex.name}
      <button onClick={() => removeExercise(ex.exercise_id)}
        className="text-accent/60 hover:text-accent">&times;</button>
    </span>
  ))}
</div>
// Dropdown list with checkboxes
<div className="bg-bg-tertiary border border-border-primary rounded-xl max-h-60 overflow-y-auto">
  {exercises.map(ex => (
    <label key={ex.exercise_id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-bg-elevated cursor-pointer">
      <input type="checkbox" checked={isSelected(ex.exercise_id)}
        onChange={() => toggleExercise(ex.exercise_id)}
        disabled={!isSelected(ex.exercise_id) && selectedIds.length >= 4} />
      <span>{ex.name}</span>
      <span className="text-xs text-text-muted">({ex.muscle_group})</span>
    </label>
  ))}
</div>
```

### Pattern 5: Stat Card Grid Layout
**What:** Responsive grid of stat cards, one per exercise, showing all metrics vertically.
**When to use:** For the comparison display (COMP-02 through COMP-05).
**Example:**
```tsx
// 2 exercises = 2 columns, 3-4 = scroll horizontally or 2x2 grid
<div className={`grid gap-3 ${
  stats.length <= 2 ? 'grid-cols-2' : 'grid-cols-2'
}`}>
  {stats.map(stat => (
    <ComparisonStatCard key={stat.exerciseId} stat={stat} />
  ))}
</div>
```

### Anti-Patterns to Avoid
- **N separate queries for N exercises:** Use a single SQL query with `IN (...)` clause. DuckDB-WASM connection overhead makes multiple queries slow.
- **Storing selected exercises in URL params:** This is a single-page app with tab navigation. Use component state with optional localStorage persistence like the time range picker.
- **Re-fetching progression status separately:** The progression data is already available from `useProgressionStatus`. Join or reuse that data instead of duplicating the complex progression SQL.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Multi-select dropdown | Custom from scratch | Native checkboxes + custom styled dropdown div | HTML checkboxes are accessible by default; just style the container |
| Date formatting | Manual date string manipulation | `date-fns` (already installed) | Edge cases with timezones, locales |
| Progression detection logic | Custom algorithm in JS | Reuse `useProgressionStatus` hook data | Complex 9-week baseline algorithm already implemented in SQL |
| Error boundaries | try/catch in render | `FeatureErrorBoundary` (existing component) | Graceful degradation pattern established app-wide |
| Animation for dropdown open/close | CSS transitions from scratch | `framer-motion` AnimatePresence (already installed) | Consistent with ui/CollapsibleSection pattern |

**Key insight:** Nearly all the data computation already exists in the SQL layer. The comparison feature is primarily a UI composition task that queries existing data in a new way and presents it in a new layout.

## Common Pitfalls

### Pitfall 1: Unstable useCallback Dependencies with Array of IDs
**What goes wrong:** Passing `exerciseIds` array directly as a useCallback dependency causes infinite re-renders because array reference changes every render.
**Why it happens:** React compares dependencies by reference, not value.
**How to avoid:** Join IDs into a string for the dependency: `exerciseIds.join(',')` or use `useMemo` to stabilize the array.
**Warning signs:** Infinite loading spinner, DuckDB query spam in console.

### Pitfall 2: SQL Injection via Exercise IDs
**What goes wrong:** Exercise IDs are UUIDs from uuidv7, but constructing SQL with string interpolation is risky.
**Why it happens:** The existing codebase uses string interpolation for SQL (not parameterized queries) because DuckDB-WASM's parameterized query support is limited.
**How to avoid:** Validate that each ID matches UUID format before interpolation: `/^[0-9a-f-]+$/i.test(id)`. The existing codebase follows this same interpolation pattern (see `exerciseProgressSQL`).
**Warning signs:** SQL errors with unexpected characters in exercise IDs.

### Pitfall 3: Empty Selection State
**What goes wrong:** User has no exercises selected, or all selected exercises have no data.
**Why it happens:** Initial state before selection, or new user with sparse data.
**How to avoid:** Show clear empty state messaging. Disable the "compare" display until at least 2 exercises are selected. Show "No data in selected time range" per card when an exercise has no sets.
**Warning signs:** Blank cards, NaN values, 0/0 divisions.

### Pitfall 4: Mobile Layout Overflow with 4 Stat Cards
**What goes wrong:** 4 stat cards in a grid overflow on small screens (320px wide).
**Why it happens:** Each card needs minimum ~150px width to be readable.
**How to avoid:** Use `grid-cols-2` and let cards stack in a 2x2 grid. For 3 exercises, use 2-col grid with last card spanning or left-aligned. Do NOT use horizontal scroll -- it's inconsistent with the rest of the app.
**Warning signs:** Cards squished to unreadable widths, text overflow.

### Pitfall 5: Stale Progression Data Mismatch
**What goes wrong:** Progression status shown in comparison cards doesn't match what's shown in the Progression Intelligence section below.
**Why it happens:** Using a different query or different time window for progression status.
**How to avoid:** Reuse the `useProgressionStatus` hook data directly. Filter it by the selected exercise IDs rather than re-querying. The progression algorithm uses a 9-week minimum window regardless of time range.
**Warning signs:** Exercise shows "progressing" in comparison but "plateau" in the dashboard below.

### Pitfall 6: DuckDB Connection Not Closed
**What goes wrong:** Too many open connections cause DuckDB-WASM to fail.
**Why it happens:** Missing `await conn.close()` in error paths.
**How to avoid:** Always close connection in a finally block. Follow the exact pattern from existing hooks.
**Warning signs:** "Too many open connections" error after navigating back and forth.

## Code Examples

### ComparisonStats Type Definition
```typescript
// Add to src/types/analytics.ts
export interface ComparisonStats {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  maxWeight: number;           // COMP-02: PR weight
  maxEstimated1rm: number;     // COMP-02: PR estimated 1RM
  totalVolume: number;         // COMP-03: total volume (sets x reps x weight)
  totalSets: number;           // COMP-03: supporting metric
  sessionCount: number;        // COMP-04: total sessions
  sessionsPerWeek: number;     // COMP-04: frequency
  progressionStatus: 'progressing' | 'plateau' | 'regressing' | 'unknown';  // COMP-05
}

export interface UseComparisonStatsReturn {
  data: ComparisonStats[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}
```

### Multi-Select State Management
```typescript
// In ComparisonSection.tsx
const [selectedIds, setSelectedIds] = useState<string[]>([]);

const toggleExercise = (id: string) => {
  setSelectedIds(prev => {
    if (prev.includes(id)) return prev.filter(x => x !== id);
    if (prev.length >= 4) return prev; // enforce max 4
    return [...prev, id];
  });
};

// Only fetch when 2+ selected
const { data: comparisonData, isLoading, error } = useComparisonStats(
  selectedIds.length >= 2 ? selectedIds : [],
  days
);
```

### Stat Card Component Pattern
```typescript
// ComparisonStatCard.tsx - follows ProgressionStatusCard design language
interface ComparisonStatCardProps {
  stat: ComparisonStats;
}

export function ComparisonStatCard({ stat }: ComparisonStatCardProps) {
  const statusConfig = {
    progressing: { color: 'text-success', bg: 'bg-success/10', label: 'Progressing' },
    plateau: { color: 'text-warning', bg: 'bg-warning/10', label: 'Plateau' },
    regressing: { color: 'text-error', bg: 'bg-error/10', label: 'Regressing' },
    unknown: { color: 'text-text-muted', bg: 'bg-bg-tertiary/20', label: 'Unknown' },
  };
  const config = statusConfig[stat.progressionStatus];

  return (
    <div className="bg-bg-secondary border border-border-primary rounded-2xl p-4 space-y-3">
      {/* Header: name + muscle group */}
      <div>
        <h4 className="font-semibold text-text-primary text-sm truncate">{stat.exerciseName}</h4>
        <span className="text-xs text-text-muted">{stat.muscleGroup}</span>
      </div>
      {/* PR */}
      <div>
        <div className="text-xs text-text-muted">PR</div>
        <div className="text-lg font-bold text-text-primary">{stat.maxWeight}kg</div>
        <div className="text-xs text-text-secondary">Est 1RM: {stat.maxEstimated1rm.toFixed(1)}kg</div>
      </div>
      {/* Volume */}
      <div>
        <div className="text-xs text-text-muted">Volume</div>
        <div className="text-lg font-bold text-text-primary">
          {stat.totalVolume >= 1000 ? `${(stat.totalVolume / 1000).toFixed(1)}t` : `${Math.round(stat.totalVolume)}kg`}
        </div>
        <div className="text-xs text-text-secondary">{stat.totalSets} sets</div>
      </div>
      {/* Frequency */}
      <div>
        <div className="text-xs text-text-muted">Frequency</div>
        <div className="text-lg font-bold text-text-primary">{stat.sessionsPerWeek}/wk</div>
        <div className="text-xs text-text-secondary">{stat.sessionCount} sessions</div>
      </div>
      {/* Progression Status */}
      <div className={`${config.bg} rounded-xl px-3 py-2 text-center`}>
        <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
      </div>
    </div>
  );
}
```

### Integration into AnalyticsPage
```tsx
// At the end of AnalyticsPage.tsx, before the closing </div>
// Add between Summary Stats and Volume Overview, or as a new section at bottom

{/* SECTION: Exercise Comparison */}
<SectionHeading title="Exercise Comparison" subtitle="Select 2-4 exercises to compare" />

<FeatureErrorBoundary feature="Exercise Comparison">
  <ComparisonSection days={days} exercises={exercises} />
</FeatureErrorBoundary>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Individual queries per exercise | Single combined SQL with IN clause | Standard for DuckDB-WASM | Fewer connections, faster results |
| CSS Grid with fixed columns | Responsive grid-cols-2 | Tailwind v4 | Works on mobile |
| Inline select element | Custom multi-select with chips | UX pattern | Better multi-selection affordance |

**Deprecated/outdated:**
- Nothing deprecated. The existing patterns are stable and current.

## Open Questions

1. **Comparison section placement on AnalyticsPage**
   - What we know: The page currently has: Summary Stats -> Volume Overview -> Training Balance -> Exercise Detail -> Progression Intelligence
   - What's unclear: Should comparison go before or after Exercise Detail? Placing it after Progression Intelligence (at the bottom) keeps the existing flow but may feel buried.
   - Recommendation: Place it as a new section between "Summary Stats" and "Volume Overview" since it's a high-level view, or add it right before "Progression Intelligence" since it relates to exercise-level analysis. Planner should decide based on user flow.

2. **Should progression status be queried separately or reused from ProgressionDashboard?**
   - What we know: `useProgressionStatus` returns status for ALL exercises. ComparisonSection could filter this data instead of re-querying.
   - What's unclear: Whether the ProgressionDashboard and ComparisonSection will always be rendered simultaneously (both on AnalyticsPage), making the data available via shared state.
   - Recommendation: Have ComparisonSection accept `progressionData` as a prop passed down from AnalyticsPage, or call `useProgressionStatus` independently (it's cached per `days` value). Prefer the prop approach to avoid duplicate queries.

3. **localStorage persistence for selected exercises**
   - What we know: Time range is persisted to localStorage. Exercise selection is more volatile (exercises may be deleted).
   - What's unclear: Whether persisting the selection provides value or creates stale-state bugs.
   - Recommendation: Do NOT persist selected exercises. Start with empty selection each time the user visits Analytics. The time range is different -- it's a global preference. Exercise comparison is a transient exploration action.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `src/components/analytics/AnalyticsPage.tsx` - existing section pattern
- Codebase analysis: `src/hooks/useAnalytics.ts`, `useProgressionStatus.ts`, `useVolumeAnalytics.ts` - hook patterns
- Codebase analysis: `src/db/compiled-queries.ts` - SQL query composition with FACT_SETS_SQL
- Codebase analysis: `src/types/analytics.ts` - existing type definitions
- Codebase analysis: `src/components/analytics/ProgressionStatusCard.tsx` - card design pattern
- Codebase analysis: `src/components/analytics/SummaryStatsCards.tsx` - grid card layout pattern
- Codebase analysis: `src/components/ui/CollapsibleSection.tsx` - framer-motion collapsible pattern
- Codebase analysis: `src/index.css` - OKLCH theme tokens, design system
- Codebase analysis: `package.json` - current dependency versions

### Secondary (MEDIUM confidence)
- None needed. This is a pure composition task with no external research required.

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - zero new dependencies, all existing tools verified in codebase
- Architecture: HIGH - patterns directly observed in 6+ existing analytics components
- Pitfalls: HIGH - pitfalls derived from actual patterns observed in existing hooks (unstable deps, connection management, SQL interpolation)

**Research date:** 2026-02-01
**Valid until:** 2026-03-03 (stable -- no external dependencies to drift)
