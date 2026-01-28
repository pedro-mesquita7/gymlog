# Phase 5: Analytics Foundation & Progress Charts - Research

**Researched:** 2026-01-28
**Domain:** React charting with Recharts, analytics data layer, dbt models
**Confidence:** HIGH

## Summary

This phase establishes the analytics foundation for GymLog by integrating Recharts 3.7.0 for visualization, adding date-fns 4.1.0 for date formatting, and creating dbt analytical views. The prior research (STACK-ANALYTICS.md, FEATURES-ANALYTICS.md, PITFALLS-ANALYTICS.md) provides comprehensive guidance that has been verified and consolidated here.

The codebase already has:
- Solid dbt model foundation (`fact_sets`, `fact_prs`, `dim_exercise`, `vw_exercise_history`)
- Established hook patterns (`useHistory`, `useExercises`, `usePRList`)
- Working navigation component with 3 tabs (Workouts, Templates, Settings)
- CSS variable theming via `--accent` in `index.css`

The primary work involves: (1) adding Analytics tab to navigation, (2) installing and integrating Recharts with lazy loading, (3) creating analytical dbt views for progress/volume data, (4) building chart components for exercise progress, 1RM trends, and volume tracking.

**Primary recommendation:** Use route-based code splitting to lazy-load the Analytics page, preventing Recharts (~96KB gzipped) from bloating the main bundle. Leverage existing dbt models and SQL aggregation rather than JavaScript transformations.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| recharts | 3.7.0 | Line/bar charts for progress visualization | React-native architecture, composable API, TypeScript support, responsive out-of-box, 24.8K GitHub stars |
| date-fns | 4.1.0 | Date formatting for chart axes | Tree-shakeable (~2KB), functional API, excellent TypeScript support, no timezone bloat |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| regression | 2.x | Linear trend detection (optional) | Only if plateau detection is implemented (MEDIUM priority, may defer) |

### Already Installed (leverage these)
| Library | Version | Purpose |
|---------|---------|---------|
| @duckdb/duckdb-wasm | 1.32.0 | SQL analytics engine for aggregation |
| zustand | 5.0.10 | State management (if needed for analytics state) |
| react-hook-form | 7.71.1 | Date range selector forms |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Recharts | Chart.js | Canvas-based (better for 1000+ points), but imperative API fights React patterns |
| Recharts | Victory | Steeper learning curve, larger bundle (110KB+) |
| Recharts | Visx | Too low-level, requires manual axis/tooltip/layout work |
| date-fns | dayjs | Worse tree-shaking in practice (~6KB vs ~2KB for this use case) |

**Installation:**
```bash
npm install recharts date-fns
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   └── analytics/           # Analytics feature components
│       ├── AnalyticsPage.tsx     # Main analytics container (lazy loaded)
│       ├── ExerciseProgressChart.tsx
│       ├── VolumeChart.tsx
│       ├── WeekComparisonCard.tsx
│       ├── PRListCard.tsx
│       └── ChartContainer.tsx    # Shared ResponsiveContainer wrapper
├── hooks/
│   └── useAnalytics.ts      # Analytics-specific data hooks
├── types/
│   └── analytics.ts         # Already exists, extend as needed
└── db/
    └── compiled-queries.ts  # Add analytics queries here

dbt/models/marts/analytics/
├── vw_exercise_progress.sql      # NEW: Progress data for charts
├── vw_volume_by_muscle_group.sql # NEW: Volume aggregation
├── vw_weekly_comparison.sql      # NEW: Week-over-week metrics
└── vw_exercise_history.sql       # EXISTS: Recent sets history
```

### Pattern 1: Lazy Loading Analytics Route
**What:** Code-split the Analytics page to keep Recharts out of main bundle
**When to use:** Always for chart-heavy pages
**Example:**
```typescript
// Source: React lazy/Suspense pattern + Recharts bundle optimization
// In App.tsx or router setup
import { lazy, Suspense } from 'react';

const AnalyticsPage = lazy(() => import('./components/analytics/AnalyticsPage'));

// In render
{activeTab === 'analytics' && (
  <Suspense fallback={<div className="text-zinc-500 text-center py-12">Loading analytics...</div>}>
    <AnalyticsPage />
  </Suspense>
)}
```

### Pattern 2: SQL Aggregation for Chart Data
**What:** Aggregate data in DuckDB SQL, not JavaScript
**When to use:** Always for chart data preparation
**Example:**
```sql
-- Source: DuckDB-WASM best practices, PITFALLS-ANALYTICS.md Pitfall 3
-- vw_exercise_progress.sql
SELECT
    exercise_id,
    DATE_TRUNC('day', logged_at) AS date,
    MAX(weight_kg) AS max_weight,
    MAX(estimated_1rm) AS max_1rm,
    SUM(weight_kg * reps) AS total_volume,
    COUNT(*) AS set_count
FROM {{ ref('fact_sets') }}
WHERE logged_at >= CURRENT_DATE - INTERVAL '28 days'
GROUP BY exercise_id, DATE_TRUNC('day', logged_at)
ORDER BY exercise_id, date
```

### Pattern 3: Memoized Chart Data with Stable References
**What:** Use useMemo for chart data to prevent unnecessary re-renders
**When to use:** When transforming query results for charts
**Example:**
```typescript
// Source: Recharts performance guide + React best practices
const chartData = useMemo(() =>
  queryResults.map(row => ({
    date: row.date,
    weight: Number(row.max_weight),
    estimated1rm: Number(row.max_1rm),
  })),
  [queryResults] // Only recompute when query results change
);
```

### Pattern 4: ResponsiveContainer with Fixed Height
**What:** Wrap charts in ResponsiveContainer with pixel-based height container
**When to use:** All chart components
**Example:**
```typescript
// Source: Recharts ResponsiveContainer docs + PITFALLS-ANALYTICS.md Pitfall 5
// ChartContainer.tsx
interface ChartContainerProps {
  children: React.ReactNode;
  height?: number;
}

export function ChartContainer({ children, height = 300 }: ChartContainerProps) {
  return (
    <div style={{ width: '100%', height }} className="relative">
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}
```

### Pattern 5: CSS Variables for Chart Theming
**What:** Use HSL CSS variables for chart colors to support dark mode
**When to use:** All chart color props
**Example:**
```css
/* index.css - extend existing variables */
:root {
  --accent: 16 100% 50%;
  --chart-primary: 220 70% 50%;
  --chart-success: 142 76% 36%;
  --chart-muted: 240 5% 65%;
}
```
```typescript
// In chart components
<Line
  stroke="hsl(var(--chart-primary))"
  strokeWidth={2}
/>
<Line
  stroke="hsl(var(--chart-success))"
  strokeDasharray="5 5"  // For trend line
/>
```

### Pattern 6: Hook Pattern Matching Existing Codebase
**What:** Follow useHistory.ts pattern for analytics hooks
**When to use:** All analytics data fetching
**Example:**
```typescript
// Source: Existing codebase pattern from useHistory.ts
export function useExerciseProgress({ exerciseId, dateRange }: Options): UseExerciseProgressReturn {
  const [data, setData] = useState<ProgressPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const db = getDuckDB();
    if (!db || !exerciseId) return;

    setIsLoading(true);
    try {
      const conn = await db.connect();
      const sql = EXERCISE_PROGRESS_SQL.replace('$1', `'${exerciseId}'`);
      const result = await conn.query(sql);
      // Transform and set data...
      await conn.close();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  }, [exerciseId, dateRange]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, isLoading, error, refresh: fetchData };
}
```

### Anti-Patterns to Avoid
- **Importing entire Recharts at app root:** Bloats main bundle by ~96KB
- **JavaScript aggregation of raw sets:** 10-100x slower than SQL aggregation
- **Inline data objects in chart props:** Causes re-renders on every parent update
- **Percentage-height containers without fixed parent:** Charts won't render correctly
- **Hardcoded colors instead of CSS variables:** Breaks future dark mode support

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Date formatting for axes | Custom date parser | `date-fns format()` | Handles locales, edge cases, tree-shakeable |
| Responsive chart sizing | Manual ResizeObserver | Recharts `ResponsiveContainer` | Handles edge cases, tested across browsers |
| Chart tooltips | Custom hover logic | Recharts `<Tooltip>` | Positioning, portal support, accessibility |
| Data aggregation | JavaScript reduce/map | DuckDB SQL GROUP BY | 10-100x faster, handles large datasets |
| 1RM calculation | JavaScript formula | Existing `int_sets__with_1rm` dbt model | Already computed in data layer |
| PR detection | JavaScript comparison | Existing `fact_prs` dbt model | Already implemented with window functions |

**Key insight:** The dbt layer already computes 1RM and PRs. Charts should query pre-aggregated views, not raw events.

## Common Pitfalls

### Pitfall 1: Importing Recharts in Main Bundle
**What goes wrong:** All users download chart code even when not viewing analytics
**Why it happens:** Importing at App.tsx level instead of lazy loading
**How to avoid:** Use `React.lazy()` for AnalyticsPage component
**Warning signs:** Main bundle exceeds 300KB, Lighthouse performance drops
**Verification:** Run `npm run build` and check chunk sizes

### Pitfall 2: Unstable Chart Data References
**What goes wrong:** Charts re-render and re-animate on every parent state change
**Why it happens:** Creating new data arrays inline without memoization
**How to avoid:** Wrap data transformation in `useMemo` with stable dependencies
**Warning signs:** Charts flicker during unrelated state updates, high CPU usage
**Verification:** Use React DevTools Profiler to check render frequency

### Pitfall 3: Aggregating in JavaScript Instead of SQL
**What goes wrong:** UI freezes while processing thousands of set records
**Why it happens:** Fetching raw data and using Array.reduce() for grouping
**How to avoid:** Write aggregation queries in SQL, fetch only chart-ready data
**Warning signs:** Analytics page takes >500ms to load, browser DevTools shows long tasks
**Verification:** Profile query time in console, should be <50ms for 4 weeks of data

### Pitfall 4: Gym Filtering Inconsistency
**What goes wrong:** Charts show different data than history list for same exercise
**Why it happens:** Chart queries written separately without reusing gym filtering logic
**How to avoid:** Use same dbt views (with gym context) for both charts and lists
**Warning signs:** Max weight in chart differs from history list
**Verification:** Test with global and gym-specific exercises at different gyms

### Pitfall 5: Missing Empty/Loading States
**What goes wrong:** Errors or blank screens for new users with no workout data
**Why it happens:** Only testing with existing data, not edge cases
**How to avoid:** Design empty states first: "Log workouts to see progress trends"
**Warning signs:** Console errors on first app use, confused user feedback
**Verification:** Test analytics page with empty database

### Pitfall 6: Hardcoding 4-Week Date Range
**What goes wrong:** Cannot change time range later without refactoring
**Why it happens:** Implementing simplest version without parameters
**How to avoid:** Add date range parameter to queries and hooks from the start
**Warning signs:** "Show longer trends" feature request requires major refactor
**Verification:** Ensure dateRange is a parameter, not hardcoded

## Code Examples

Verified patterns from official sources and codebase analysis:

### Basic LineChart for Exercise Progress
```typescript
// Source: Recharts docs + codebase patterns
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

interface ProgressPoint {
  date: string;
  maxWeight: number;
  estimated1rm: number;
}

interface ExerciseProgressChartProps {
  data: ProgressPoint[];
  exerciseName: string;
}

export function ExerciseProgressChart({ data, exerciseName }: ExerciseProgressChartProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-500">
        No data yet. Log workouts to see your {exerciseName} progress.
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-muted) / 0.3)" />
          <XAxis
            dataKey="date"
            tickFormatter={(date) => format(new Date(date), 'MMM d')}
            stroke="hsl(var(--chart-muted))"
            fontSize={12}
          />
          <YAxis
            stroke="hsl(var(--chart-muted))"
            fontSize={12}
            width={40}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(240 6% 10%)',
              border: '1px solid hsl(240 4% 16%)',
              borderRadius: '8px',
            }}
            labelFormatter={(date) => format(new Date(date), 'PPP')}
          />
          <Line
            type="monotone"
            dataKey="maxWeight"
            name="Max Weight (kg)"
            stroke="hsl(var(--accent))"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="estimated1rm"
            name="Est. 1RM (kg)"
            stroke="hsl(var(--chart-success))"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

### Volume Bar Chart
```typescript
// Source: Recharts BarChart docs + FEATURES-ANALYTICS.md
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

interface VolumePoint {
  date: string;
  volume: number;  // sets x reps x weight
}

export function VolumeChart({ data }: { data: VolumePoint[] }) {
  return (
    <div style={{ width: '100%', height: 200 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-muted) / 0.3)" />
          <XAxis
            dataKey="date"
            tickFormatter={(date) => format(new Date(date), 'MMM d')}
            stroke="hsl(var(--chart-muted))"
            fontSize={12}
          />
          <YAxis stroke="hsl(var(--chart-muted))" fontSize={12} width={50} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(240 6% 10%)',
              border: '1px solid hsl(240 4% 16%)',
              borderRadius: '8px',
            }}
            formatter={(value: number) => [`${value.toLocaleString()} kg`, 'Volume']}
          />
          <Bar
            dataKey="volume"
            fill="hsl(var(--chart-primary))"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

### Navigation Tab Extension
```typescript
// Source: Existing Navigation.tsx pattern
type Tab = 'workouts' | 'templates' | 'analytics' | 'settings';

// Add analytics button between templates and settings
<button
  onClick={() => onTabChange('analytics')}
  className={`flex-1 py-4 text-center text-sm font-medium transition-colors ${
    activeTab === 'analytics'
      ? 'text-accent border-t-2 border-accent -mt-px'
      : 'text-zinc-500 hover:text-zinc-300'
  }`}
>
  Analytics
</button>
```

### dbt Model: vw_exercise_progress
```sql
-- dbt/models/marts/analytics/vw_exercise_progress.sql
-- Progress data for exercise charts (CHART-01, CHART-02, CHART-03)
{{
    config(
        materialized='view'
    )
}}

WITH daily_aggregates AS (
    SELECT
        original_exercise_id AS exercise_id,
        DATE_TRUNC('day', CAST(logged_at AS TIMESTAMP))::DATE AS date,
        MAX(weight_kg) AS max_weight,
        MAX(estimated_1rm) AS max_1rm,
        SUM(weight_kg * reps) AS total_volume,
        COUNT(*) AS set_count
    FROM {{ ref('fact_sets') }}
    WHERE logged_at >= CURRENT_DATE - INTERVAL '28 days'
    GROUP BY original_exercise_id, DATE_TRUNC('day', CAST(logged_at AS TIMESTAMP))::DATE
)

SELECT
    d.*,
    e.name AS exercise_name,
    e.muscle_group
FROM daily_aggregates d
INNER JOIN {{ ref('dim_exercise') }} e ON d.exercise_id = e.exercise_id
ORDER BY exercise_id, date
```

### dbt Model: vw_weekly_comparison
```sql
-- dbt/models/marts/analytics/vw_weekly_comparison.sql
-- Week-over-week comparison (CHART-04)
{{
    config(
        materialized='view'
    )
}}

WITH weekly_metrics AS (
    SELECT
        original_exercise_id AS exercise_id,
        DATE_TRUNC('week', CAST(logged_at AS TIMESTAMP))::DATE AS week_start,
        MAX(weight_kg) AS max_weight,
        MAX(estimated_1rm) AS max_1rm,
        SUM(weight_kg * reps) AS total_volume,
        COUNT(*) AS set_count
    FROM {{ ref('fact_sets') }}
    WHERE logged_at >= CURRENT_DATE - INTERVAL '14 days'
    GROUP BY original_exercise_id, DATE_TRUNC('week', CAST(logged_at AS TIMESTAMP))::DATE
),

with_comparison AS (
    SELECT
        exercise_id,
        week_start,
        max_weight,
        max_1rm,
        total_volume,
        set_count,
        LAG(max_weight) OVER (PARTITION BY exercise_id ORDER BY week_start) AS prev_max_weight,
        LAG(total_volume) OVER (PARTITION BY exercise_id ORDER BY week_start) AS prev_volume
    FROM weekly_metrics
)

SELECT
    w.*,
    e.name AS exercise_name,
    CASE
        WHEN w.prev_max_weight IS NOT NULL THEN
            ROUND(((w.max_weight - w.prev_max_weight) / w.prev_max_weight) * 100, 1)
        ELSE NULL
    END AS weight_change_pct,
    CASE
        WHEN w.prev_volume IS NOT NULL THEN
            ROUND(((w.total_volume - w.prev_volume) / w.prev_volume) * 100, 1)
        ELSE NULL
    END AS volume_change_pct
FROM with_comparison w
INNER JOIN {{ ref('dim_exercise') }} e ON w.exercise_id = e.exercise_id
ORDER BY week_start DESC, exercise_name
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Recharts 2.x internal state | Recharts 3.x hook-based state | 2024 | Use `useActiveTooltipLabel` instead of internal props |
| `<Customized>` wrapper | Direct custom components | Recharts 3.0 | Can wrap chart elements directly without wrapper |
| `accessibilityLayer={false}` | `accessibilityLayer={true}` default | Recharts 3.0 | Keyboard nav and ARIA attributes enabled by default |
| Moment.js for dates | date-fns 4.x | 2024 | Much smaller bundle, better tree-shaking |
| Client-side aggregation | SQL aggregation in DuckDB | Current best practice | 10-100x faster for analytics queries |

**Deprecated/outdated:**
- Recharts `activeIndex` prop: Removed in 3.0, use Tooltip hooks instead
- Recharts `points` prop on Scatter/Area: Internal only, was never intended for external use
- date-fns v2/v3 patterns: v4.0 has first-class timezone support via `@date-fns/tz`

## Open Questions

Things that couldn't be fully resolved:

1. **Exact bundle size verification**
   - What we know: Recharts ~96KB gzipped (from community sources)
   - What's unclear: Exact size with tree-shaking for LineChart + BarChart only
   - Recommendation: Verify with `npm run build` after installation, check chunk sizes

2. **Mobile chart touch targets**
   - What we know: Recharts tooltips work on touch, may need 44x44px minimum
   - What's unclear: Actual touch experience on small mobile screens
   - Recommendation: Test on real devices during development, may need to increase dot radius

3. **Regression library necessity**
   - What we know: Useful for plateau detection (slope near 0)
   - What's unclear: Whether plateau detection is needed in this phase
   - Recommendation: Defer regression library until plateau detection is explicitly required

## Sources

### Primary (HIGH confidence)
- [Recharts GitHub - v3.7.0 verified](https://github.com/recharts/recharts)
- [Recharts 3.0 Migration Guide](https://github.com/recharts/recharts/wiki/3.0-migration-guide)
- [Recharts Performance Guide](https://recharts.github.io/en-US/guide/performance/)
- [date-fns Official Documentation](https://date-fns.org/docs/Getting-Started)
- [date-fns v4.0 Changelog](https://github.com/date-fns/date-fns/releases)
- Existing codebase: `src/hooks/useHistory.ts`, `src/components/Navigation.tsx`
- Prior research: `.planning/research/STACK-ANALYTICS.md`

### Secondary (MEDIUM confidence)
- [Recharts ResponsiveContainer Guide](https://www.dhiwise.com/post/simplify-data-visualization-with-recharts-responsivecontainer)
- [React Lazy Loading Best Practices](https://dev.to/shyam0118/react-lazy-loading-boosting-performance-with-code-splitting-45lg)
- [Recharts Tailwind Integration](https://www.reshaped.so/docs/getting-started/guidelines/recharts)
- Prior research: `.planning/research/PITFALLS-ANALYTICS.md`

### Tertiary (LOW confidence)
- [Top React Chart Libraries 2026](https://dev.to/basecampxd/top-7-react-chart-libraries-for-2026-features-use-cases-and-benchmarks-412c)
- Bundle size estimates from community sources (verify with actual build)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Recharts 3.7.0 and date-fns 4.1.0 verified via official sources
- Architecture: HIGH - Patterns match existing codebase, verified with Recharts docs
- Pitfalls: HIGH - Documented in prior research, cross-referenced with official performance guide
- dbt models: HIGH - Pattern matches existing models in codebase

**Research date:** 2026-01-28
**Valid until:** 30 days (Recharts stable, date-fns stable)
