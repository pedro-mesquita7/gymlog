# Phase 15: Analytics Redesign - Research

**Researched:** 2026-02-01
**Domain:** React dashboard layout, DuckDB-WASM SQL parameterization, volume zone system, OKLCH chart colors
**Confidence:** HIGH

## Summary

This phase transforms the existing 7-section collapsible analytics page into a single scrollable dashboard with global time-range filtering and a 5-zone volume system based on research-backed thresholds. The codebase is well-structured for this refactor: 6 SQL queries with hardcoded intervals in `compiled-queries.ts`, 4 hooks that consume them, and 11 analytics components that render data.

The primary challenge is threading a `timeRange` parameter through the SQL -> hook -> component chain without breaking existing functionality. The SQL queries use DuckDB-WASM template literal interpolation (not prepared statements), so parameterization means converting constant strings to functions that accept a `days` parameter. The volume threshold system needs expansion from a 2-boundary model (`{low, optimal}`) to a 4-boundary model (`{mev, mavLow, mavHigh, mrv}`) with per-muscle-group data.

All required libraries (Recharts, date-fns, Tailwind v4) are already in the project. No new dependencies are needed. The OKLCH color token system from Phase 14 is in `src/index.css` and needs new tokens for the 5 volume zones and chart tooltip styling.

**Primary recommendation:** Convert all 6 SQL query constants to functions accepting `days: number | null`, add `timeRange` state to AnalyticsPage with localStorage persistence, and propagate through hooks. Replace `VolumeThresholds` type with a new `VolumeZoneThresholds` type containing 4 boundaries per muscle group.

## Standard Stack

### Core (already installed)
| Library | Purpose | Why Standard |
|---------|---------|--------------|
| Recharts | Bar charts, line charts, reference areas | Already used for all analytics charts |
| date-fns | Date formatting, parsing | Already used in chart components |
| DuckDB-WASM | SQL queries against event store | Core data layer |
| Tailwind CSS v4 | Styling with OKLCH tokens | Project-wide styling system |
| react-muscle-highlighter | Body diagram heat map | Already used in MuscleHeatMap |

### No New Dependencies Needed

All required UI patterns (pill selectors, stat cards, legends, bar charts with reference areas) can be built with existing Tailwind + Recharts. No additional charting or UI libraries are needed.

## Architecture Patterns

### Current File Structure (analytics)
```
src/
  components/analytics/
    AnalyticsPage.tsx          # Main container (REWRITE)
    ChartContainer.tsx         # ResponsiveContainer wrapper (MODIFY - min-height)
    CollapsibleSection.tsx     # details/summary wrapper (REMOVE usage, keep file)
    ExerciseProgressChart.tsx  # LineChart (MODIFY - color tokens)
    VolumeBarChart.tsx         # BarChart with ReferenceArea (REWRITE - 5 zones)
    VolumeZoneIndicator.tsx    # 3-zone legend (REWRITE - 5-zone VolumeLegend)
    MuscleHeatMap.tsx          # Body diagram (MODIFY - 5-zone colors)
    WeekComparisonCard.tsx     # Week comparison (KEEP)
    PRListCard.tsx             # PR list wrapper (KEEP)
    ProgressionDashboard.tsx   # Progression status (MODIFY - timeRange)
    ProgressionStatusCard.tsx  # Individual status card (KEEP)
  hooks/
    useAnalytics.ts            # useExerciseProgress, useWeeklyComparison (MODIFY)
    useVolumeAnalytics.ts      # volumeData, heatMapData (MODIFY)
    useVolumeThresholds.ts     # 2-threshold system (REWRITE - 5-zone)
    useProgressionStatus.ts    # progression SQL (MODIFY)
  db/
    compiled-queries.ts        # 6 SQL queries (MODIFY - parameterize)
  types/
    analytics.ts               # All analytics types (MODIFY)
```

### New Components Needed
```
src/components/analytics/
    TimeRangePicker.tsx        # NEW: pill selector for 1M/3M/6M/1Y/All
    SummaryStatsCards.tsx       # NEW: 2x2 grid of stat cards
    VolumeLegend.tsx           # NEW: 5-zone MEV/MAV/MRV legend with citation
    SectionHeading.tsx         # NEW: simple h2 + divider (replaces CollapsibleSection)
```

### New Hook Needed
```
src/hooks/
    useSummaryStats.ts         # NEW: total workouts, volume, PRs, streak
```

### Pattern 1: SQL Query Parameterization

**What:** Convert constant SQL strings to factory functions that accept `days: number | null`.

**Current pattern (hardcoded):**
```typescript
// compiled-queries.ts - CURRENT
export const EXERCISE_PROGRESS_SQL = `
  ...
  WHERE CAST(logged_at AS TIMESTAMPTZ) >= CURRENT_DATE - INTERVAL '28 days'
  ...
`;
```

**Target pattern (parameterized):**
```typescript
// compiled-queries.ts - TARGET
export function exerciseProgressSQL(days: number | null): string {
  const timeFilter = days !== null
    ? `WHERE CAST(logged_at AS TIMESTAMPTZ) >= CURRENT_DATE - INTERVAL '${days} days'`
    : `WHERE 1=1`; // ALL - no time filter
  return `
    WITH daily_aggregates AS (
      SELECT ... FROM (${FACT_SETS_SQL}) fact_sets
      ${timeFilter}
      GROUP BY ...
    )
    ...
  `;
}
```

**Why this approach:**
- DuckDB-WASM uses `conn.query(sql)` with string interpolation for parameters (the `$1` replacement pattern visible in hooks)
- Template literal functions are the existing pattern (`EXERCISE_HISTORY_SQL` already uses `${DIM_EXERCISE_ALL_SQL}` interpolation)
- No prepared statement API needed; the `days` value is a controlled integer, not user input

**All 6 queries and their time filters:**

| Query | Current Filter | Line | Parameter Strategy |
|-------|---------------|------|-------------------|
| `EXERCISE_PROGRESS_SQL` | `INTERVAL '28 days'` | L317 | `days` param in WHERE |
| `WEEKLY_COMPARISON_SQL` | `INTERVAL '14 days'` | L351 | Always 14 days (compares last 2 weeks regardless) |
| `VOLUME_BY_MUSCLE_GROUP_SQL` | `INTERVAL '28 days'` | L415 | `days` param in WHERE |
| `MUSCLE_HEAT_MAP_SQL` | `INTERVAL '28 days'` | L446 | `days` param in WHERE |
| `PROGRESSION_STATUS_SQL` | `INTERVAL '9 weeks'` / `'4 weeks'` | L477, L487, L512 | `max(days, 63)` — needs minimum 9 weeks of data |
| `EXERCISE_HISTORY_SQL` | `INTERVAL '14 days'` | L254 | `days` param in WHERE |

**Special cases:**
- `WEEKLY_COMPARISON_SQL`: Per CONTEXT.md decision, always compares most recent 2 weeks regardless of time range. Keep hardcoded at 14 days.
- `PROGRESSION_STATUS_SQL`: Uses 9-week and 4-week windows for baseline/regression detection. Use `max(timeRange, 63 days)` with a note when range is short.

### Pattern 2: TimeRange State Threading

**What:** Single `timeRange` state in AnalyticsPage, passed to all hooks.

```typescript
// AnalyticsPage.tsx
type TimeRange = '1M' | '3M' | '6M' | '1Y' | 'ALL';

const TIME_RANGE_DAYS: Record<TimeRange, number | null> = {
  '1M': 30, '3M': 90, '6M': 180, '1Y': 365, 'ALL': null,
};

function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>(() => {
    return (localStorage.getItem('gymlog-analytics-timerange') as TimeRange) || '3M';
  });

  useEffect(() => {
    localStorage.setItem('gymlog-analytics-timerange', timeRange);
  }, [timeRange]);

  const days = TIME_RANGE_DAYS[timeRange];

  // Pass days to all hooks
  const { data: progressData } = useExerciseProgress({ exerciseId, days });
  const { volumeData, heatMapData } = useVolumeAnalytics(days);
  const { data: summaryStats } = useSummaryStats(days);
  // etc.
}
```

**Hook modification pattern:**
```typescript
// Each hook adds `days` parameter and regenerates SQL
export function useExerciseProgress({ exerciseId, days }: { exerciseId: string; days: number | null }) {
  const fetchData = useCallback(async () => {
    const sql = exerciseProgressSQL(days).replace('$1', `'${exerciseId}'`);
    // ... same DuckDB query pattern
  }, [exerciseId, days]); // days in dependency array triggers refetch
}
```

### Pattern 3: 5-Zone Volume Threshold System

**What:** Replace 2-boundary `{low, optimal}` with 4-boundary `{mev, mavLow, mavHigh, mrv}`.

**Current type:**
```typescript
export interface VolumeThresholds {
  low: number;       // Below = under-training (10)
  optimal: number;   // Above = over-training (20)
}
```

**New type:**
```typescript
export interface VolumeZoneThresholds {
  mev: number;       // Minimum Effective Volume
  mavLow: number;    // MAV range start
  mavHigh: number;   // MAV range end
  mrv: number;       // Maximum Recoverable Volume
}

// Per muscle group, from CONTEXT.md research data
export const VOLUME_ZONE_DEFAULTS: Record<string, VolumeZoneThresholds> = {
  Chest:     { mev: 10, mavLow: 12, mavHigh: 20, mrv: 22 },
  Back:      { mev: 10, mavLow: 14, mavHigh: 22, mrv: 25 },
  Shoulders: { mev: 8,  mavLow: 16, mavHigh: 22, mrv: 26 },
  Legs:      { mev: 8,  mavLow: 12, mavHigh: 18, mrv: 20 },
  Arms:      { mev: 6,  mavLow: 10, mavHigh: 16, mrv: 20 },
  Core:      { mev: 0,  mavLow: 16, mavHigh: 20, mrv: 25 },
};
```

**5 zones mapped to colors:**

| Zone | Condition | Color Token | Meaning |
|------|-----------|-------------|---------|
| Under MEV | `sets < mev` | `chart-zone-under` | Not enough to grow |
| MEV to MAV | `mev <= sets < mavLow` | `chart-zone-minimum` | Minimum effective |
| MAV range | `mavLow <= sets <= mavHigh` | `chart-zone-optimal` | Optimal growth |
| MAV to MRV | `mavHigh < sets <= mrv` | `chart-zone-high` | Approaching limit |
| Over MRV | `sets > mrv` | `chart-zone-over` | Exceeding recovery |

### Pattern 4: Volume Bar Chart with Per-Group Zone Colors

**What:** Instead of global ReferenceArea backgrounds, each bar is individually colored based on its muscle group's zone.

**Current approach:** Global `<ReferenceArea>` bands across entire chart (same thresholds for all muscles).

**New approach:** Each bar's `fill` is computed from its muscle group's specific thresholds. The bar chart becomes a simple BarChart with a single bar per muscle group showing the weekly average set count within the time range, with bar color indicating zone.

```typescript
// Compute bar color per muscle group
function getZoneColor(sets: number, thresholds: VolumeZoneThresholds): string {
  if (sets < thresholds.mev) return 'var(--color-chart-zone-under)';
  if (sets < thresholds.mavLow) return 'var(--color-chart-zone-minimum)';
  if (sets <= thresholds.mavHigh) return 'var(--color-chart-zone-optimal)';
  if (sets <= thresholds.mrv) return 'var(--color-chart-zone-high)';
  return 'var(--color-chart-zone-over)';
}

// Recharts: use Cell for per-bar coloring
<BarChart data={chartData}>
  <Bar dataKey="avgWeeklySets">
    {chartData.map((entry, index) => (
      <Cell key={index} fill={getZoneColor(entry.avgWeeklySets, getThresholds(entry.muscleGroup))} />
    ))}
  </Bar>
</BarChart>
```

**Note:** Recharts `<Cell>` component allows per-bar fill colors within a single `<Bar>`. This is the standard Recharts pattern for conditional bar coloring.

### Pattern 5: Summary Stats SQL

**What:** New SQL query for summary dashboard cards.

```sql
-- Summary stats for time range
WITH fact_sets AS ( ... ),
workout_events AS (
  SELECT DISTINCT
    payload->>'workout_id' AS workout_id,
    COALESCE(payload->>'logged_at', CAST(_created_at AS VARCHAR)) AS logged_at
  FROM events
  WHERE event_type = 'workout_started'
    AND CAST(COALESCE(payload->>'logged_at', CAST(_created_at AS VARCHAR)) AS TIMESTAMPTZ)
        >= CURRENT_DATE - INTERVAL '{days} days'  -- parameterized
)
SELECT
  (SELECT COUNT(DISTINCT workout_id) FROM workout_events) AS total_workouts,
  (SELECT COALESCE(SUM(weight_kg * reps), 0) FROM fact_sets
   WHERE CAST(logged_at AS TIMESTAMPTZ) >= CURRENT_DATE - INTERVAL '{days} days') AS total_volume_kg,
  (SELECT COUNT(*) FROM fact_sets
   WHERE is_pr = true
   AND CAST(logged_at AS TIMESTAMPTZ) >= CURRENT_DATE - INTERVAL '{days} days') AS total_prs
```

**Streak calculation:** Compute in JavaScript after fetching distinct workout dates, counting consecutive weeks with at least 1 workout from most recent week backwards. This avoids complex recursive SQL in DuckDB-WASM.

### Anti-Patterns to Avoid

- **Multiple re-queries on mount:** When `timeRange` changes, all hooks refetch. Use `useCallback` with `[days]` dependency to batch. Avoid adding `timeRange` string to dependencies when `days` number suffices.
- **Rebuilding FACT_SETS_SQL per query:** The CTE is already embedded via template literals. Do not try to cache it separately; DuckDB-WASM handles CTE optimization.
- **Sticky time range picker with z-index battles:** Per CONTEXT.md, the time range pills should be at top of the scrollable area. Use `sticky top-0 z-10 bg-bg-primary` but test that it does not overlap the mobile nav. If it causes issues, make it non-sticky.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Responsive chart containers | Custom resize observers | Recharts `ResponsiveContainer` via `ChartContainer` | Already working, handles edge cases |
| Per-bar conditional coloring | Custom SVG manipulation | Recharts `<Cell>` component | Standard Recharts pattern for per-data-point styling |
| Date formatting | Manual string manipulation | `date-fns` `format()` | Already used throughout, handles locale |
| Body diagram | Custom SVG muscle map | `react-muscle-highlighter` | Already installed and integrated |
| Color zone computation | Inline ternary chains | Extracted `getVolumeZone()` utility | Reused in bar chart, heat map, and legend |

## Common Pitfalls

### Pitfall 1: DuckDB-WASM Connection Leaks on Rapid TimeRange Switching
**What goes wrong:** User rapidly clicks time range pills, each triggering a new `conn = await db.connect()` and query. If previous query is still running, connection is not closed.
**Why it happens:** Each hook calls `fetchData` independently; `useEffect` cleanup does not abort in-flight DuckDB queries.
**How to avoid:** Add an `abortedRef` pattern: set `abortedRef.current = true` in cleanup, check before `setData`. Also ensure `conn.close()` is called in `finally` block (already done in existing hooks).
**Warning signs:** Console warnings about too many connections, stale data flashing.

### Pitfall 2: Volume Data Needs Weekly Average, Not Raw Weekly Counts
**What goes wrong:** The volume bar chart currently shows sets per week per muscle group. With time ranges > 4 weeks, showing raw weekly data creates too many bars.
**Why it happens:** CONTEXT.md specifies "single bar per muscle group showing weekly average within time range."
**How to avoid:** Compute average in SQL: `AVG(set_count)` grouped by `muscle_group` across weeks. Or compute in the hook after fetching weekly data. The SQL approach is cleaner.
**Warning signs:** Chart has dozens of bars per muscle group with 1Y range.

### Pitfall 3: HSL Legacy Colors Still in Charts
**What goes wrong:** Charts use `hsl(var(--chart-muted))` and `hsl(var(--accent))` (HSL-based CSS variables) while the new system uses OKLCH tokens.
**Why it happens:** Phase 14 added OKLCH tokens but kept legacy HSL for backward compatibility. Charts still reference legacy vars.
**How to avoid:** Migrate chart colors to OKLCH tokens during this phase. Replace `hsl(var(--chart-muted) / 0.3)` with `oklch(...)` token references. Add new tokens in `@theme` block of `index.css`.
**Warning signs:** Inconsistent color rendering between chart elements and the rest of the UI.

### Pitfall 4: Progression Status Needs Minimum Data Window
**What goes wrong:** Setting time range to 1M (30 days) breaks progression detection which needs 9 weeks of history.
**Why it happens:** The algorithm compares current week against 8-week baseline.
**How to avoid:** Per CONTEXT.md decision: use `max(timeRange, 63 days)` for progression query. Show a note like "Progression analysis uses 9+ weeks of data" when range is shorter.
**Warning signs:** Progression dashboard shows "unknown" for all exercises on short time ranges.

### Pitfall 5: ChartContainer Fixed Height
**What goes wrong:** All charts render at exactly 300px, wasting space for simple charts and cramping complex ones.
**Why it happens:** `ChartContainer` defaults to `height = 300`.
**How to avoid:** Per CONTEXT.md: remove fixed 300px, use `minHeight` prop. Pass appropriate heights: volume bar chart ~350px, progress line chart ~250px, etc. `ResponsiveContainer` requires a pixel-based height parent, so cannot use `auto` -- must still set explicit heights, but allow variation.

## Code Examples

### TimeRangePicker Component
```typescript
// Source: project patterns + Tailwind v4 OKLCH tokens
type TimeRange = '1M' | '3M' | '6M' | '1Y' | 'ALL';

interface TimeRangePickerProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}

const OPTIONS: TimeRange[] = ['1M', '3M', '6M', '1Y', 'ALL'];

export function TimeRangePicker({ value, onChange }: TimeRangePickerProps) {
  return (
    <div className="flex gap-2">
      {OPTIONS.map((option) => (
        <button
          key={option}
          onClick={() => onChange(option)}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            value === option
              ? 'bg-accent text-white'
              : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
```

### SummaryStatsCards Component
```typescript
// Source: project patterns
interface SummaryStats {
  totalWorkouts: number;
  totalVolumeKg: number;
  totalPrs: number;
  streakWeeks: number;
}

export function SummaryStatsCards({ stats }: { stats: SummaryStats }) {
  const cards = [
    { label: 'Workouts', value: stats.totalWorkouts, icon: 'dumbbell' },
    { label: 'Volume', value: `${(stats.totalVolumeKg / 1000).toFixed(1)}t`, icon: 'chart' },
    { label: 'PRs Hit', value: stats.totalPrs, icon: 'trophy' },
    { label: 'Streak', value: `${stats.streakWeeks}wk`, icon: 'fire' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map((card) => (
        <div key={card.label} className="bg-bg-secondary border border-border-primary rounded-lg p-4">
          <div className="text-2xl font-bold text-text-primary">{card.value}</div>
          <div className="text-sm text-text-secondary mt-1">{card.label}</div>
        </div>
      ))}
    </div>
  );
}
```

### VolumeLegend Component (ANLT-04)
```typescript
export function VolumeLegend() {
  const zones = [
    { color: 'var(--color-chart-zone-under)', label: 'Under MEV', desc: 'Not enough stimulus for growth' },
    { color: 'var(--color-chart-zone-minimum)', label: 'MEV-MAV', desc: 'Minimum effective volume' },
    { color: 'var(--color-chart-zone-optimal)', label: 'MAV Range', desc: 'Optimal growth zone' },
    { color: 'var(--color-chart-zone-high)', label: 'MAV-MRV', desc: 'High volume, approaching limit' },
    { color: 'var(--color-chart-zone-over)', label: 'Over MRV', desc: 'Exceeding recovery capacity' },
  ];

  return (
    <div className="bg-bg-secondary rounded-lg p-4 space-y-3">
      <h4 className="text-sm font-medium text-text-primary">Volume Zones</h4>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {zones.map((zone) => (
          <div key={zone.label} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: zone.color }} />
            <span className="text-xs text-text-secondary">
              <span className="font-medium">{zone.label}</span> — {zone.desc}
            </span>
          </div>
        ))}
      </div>
      <p className="text-xs text-text-muted pt-2 border-t border-border-primary">
        MEV = Minimum Effective Volume, MAV = Maximum Adaptive Volume, MRV = Maximum Recoverable Volume.
        Based on Schoenfeld et al. (2017) and Renaissance Periodization guidelines.
      </p>
    </div>
  );
}
```

### OKLCH Chart Zone Tokens
```css
/* Add to src/index.css @theme block */

/* Volume zone colors - 5-zone system */
--color-chart-zone-under: oklch(63% 0.22 25);     /* red - matches --color-error */
--color-chart-zone-minimum: oklch(75% 0.15 85);    /* yellow - matches --color-warning */
--color-chart-zone-optimal: oklch(65% 0.17 145);   /* green - matches --color-success */
--color-chart-zone-high: oklch(70% 0.15 65);       /* orange - between warning and error */
--color-chart-zone-over: oklch(63% 0.22 25);       /* red - same as under, bookend danger */

/* Chart tooltip (replacing hardcoded HSL) */
--color-chart-tooltip-bg: oklch(15% 0.01 270);
--color-chart-tooltip-border: oklch(22% 0.01 270);
```

### Parameterized Volume Query
```typescript
export function volumeByMuscleGroupSQL(days: number | null): string {
  const timeFilter = days !== null
    ? `WHERE CAST(fs.logged_at AS TIMESTAMPTZ) >= CURRENT_DATE - INTERVAL '${days} days'`
    : `WHERE 1=1`;

  return `
    WITH fact_sets AS (${FACT_SETS_SQL}),
    exercise_dim_all AS (${DIM_EXERCISE_ALL_SQL}),
    weekly_volume AS (
      SELECT
        DATE_TRUNC('week', CAST(fs.logged_at AS TIMESTAMPTZ))::DATE AS week_start,
        e.muscle_group,
        COUNT(*) AS set_count
      FROM fact_sets fs
      INNER JOIN exercise_dim_all e ON fs.original_exercise_id = e.exercise_id
      ${timeFilter}
      GROUP BY DATE_TRUNC('week', CAST(fs.logged_at AS TIMESTAMPTZ))::DATE, e.muscle_group
    ),
    avg_volume AS (
      SELECT
        muscle_group,
        ROUND(AVG(set_count), 1) AS avg_weekly_sets
      FROM weekly_volume
      GROUP BY muscle_group
    )
    SELECT muscle_group, avg_weekly_sets FROM avg_volume ORDER BY muscle_group
  `;
}
```

## State of the Art

| Old Approach (Current) | New Approach (Phase 15) | Impact |
|------------------------|------------------------|--------|
| 2-threshold volume zones (`low`/`optimal`) | 4-boundary zones (MEV/MAV-low/MAV-high/MRV) | Research-backed, per-muscle-group accuracy |
| Hardcoded 28-day SQL intervals | Parameterized functions with `days` arg | Time range flexibility |
| CollapsibleSection wrappers | Flat scrollable sections with dividers | Cleaner dashboard UX |
| Global exercise selector at top | Exercise selector scoped to detail section | Logical grouping |
| HSL chart colors (`hsl(var(--chart-*))`) | OKLCH tokens (`var(--color-chart-*)`) | Perceptually uniform, consistent |
| Fixed 300px chart height | Per-chart min-height | Better space utilization |
| No summary stats | 4-card summary (workouts, volume, PRs, streak) | At-a-glance dashboard |

**Deprecated/outdated after this phase:**
- `CollapsibleSection` usage in AnalyticsPage (component kept for potential use elsewhere)
- `VolumeZoneIndicator` component (replaced by `VolumeLegend`)
- `VolumeThresholds` type with `{low, optimal}` (replaced by `VolumeZoneThresholds`)
- Legacy HSL chart variables in charts (fully migrated to OKLCH)

## Open Questions

1. **Streak calculation edge cases**
   - What we know: Count consecutive weeks with >= 1 workout, backwards from current week
   - What's unclear: Should partial current week count? What about weeks where only non-tracked activities happened?
   - Recommendation: Count current week if it has any workout. Simple JS loop over sorted dates.

2. **Volume bar chart data granularity for "ALL" time range**
   - What we know: AVG weekly sets across all time is the plan
   - What's unclear: With years of data, the average might not be meaningful (early training vs current)
   - Recommendation: Use simple average for now. Could add "rolling 4-week average" as future enhancement.

3. **Sticky time range behavior on mobile**
   - What we know: CONTEXT.md suggests sticky/top for pills
   - What's unclear: Mobile viewport may have nav bar conflicts
   - Recommendation: Start with `sticky top-0 z-10 bg-bg-primary py-3`. Test on mobile viewport. Fall back to non-sticky if issues arise.

## Sources

### Primary (HIGH confidence)
- **Codebase analysis** - Direct reading of all 11 analytics components, 4 hooks, 6 SQL queries, types file, and CSS tokens
- **CONTEXT.md** - User decisions on layout, time range threading, volume zone data, chart styling

### Secondary (MEDIUM confidence)
- **Recharts `<Cell>` pattern** - Standard Recharts documentation pattern for per-bar coloring (verified from training data, consistent with existing Recharts usage in codebase)
- **OKLCH color space** - Already implemented in Phase 14 `index.css`, patterns verified from existing tokens

### Tertiary (LOW confidence)
- **Volume zone threshold values** - From CONTEXT.md citing RP Strength and Schoenfeld (2017). Values are research-based but represent intermediate lifter approximations, not universal constants.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already in project, no new dependencies
- Architecture: HIGH - clear existing patterns to follow, well-defined CONTEXT.md decisions
- SQL parameterization: HIGH - direct codebase analysis of all 6 queries
- Volume zones: HIGH for implementation approach, MEDIUM for threshold values (research approximations)
- Pitfalls: HIGH - identified from direct code analysis

**Research date:** 2026-02-01
**Valid until:** 2026-03-01 (stable codebase, no fast-moving dependencies)
