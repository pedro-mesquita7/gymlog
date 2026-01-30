# Phase 6: Volume Analytics - Research

**Researched:** 2026-01-30
**Domain:** Recharts bar charts, volume zone visualization, anatomical heat maps, collapsible sections
**Confidence:** HIGH

## Summary

This phase extends the Analytics page with muscle group volume tracking features: bar charts showing sets per week by muscle group, color-coded volume zones for optimal training ranges, and an anatomical body diagram heat map. The implementation builds on the existing Phase 5 analytics foundation (Recharts 3.7.0, date-fns 4.1.0, dbt analytical views, hook-based data access).

The codebase already has the analytics infrastructure in place (AnalyticsPage.tsx with sections, ChartContainer wrapper, useAnalytics hook pattern, CSS variable theming). The primary work involves: (1) creating dbt views for muscle group volume aggregation, (2) building bar chart components with ReferenceArea for zone visualization, (3) implementing anatomical body diagram with SVG highlighting, (4) adding collapsible sections using native HTML details/summary elements, and (5) implementing configurable volume thresholds with localStorage persistence.

Key technical decisions from context: volume metric is sets per week (not total load), always show standard muscle groups (chest/back/shoulders/legs/arms/core) even with zero data, zones are per-muscle-group configurable (red <10, green 10-20, yellow 20+), heat map shows front/back anatomical views with 4-week aggregate, and all sections live on the same scrollable Analytics page with collapsible headers.

**Primary recommendation:** Use Recharts BarChart with stacked bars for multi-week display, ReferenceArea for color-coded background zones, native HTML details/summary for accessible collapsible sections, and either react-muscle-highlighter npm package or custom SVG for anatomical diagram with intensity-based coloring.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| recharts | 3.7.0 | Bar charts and ReferenceArea for zones | Already installed, React-native API, composable, supports multiple Bar components with stackId |
| date-fns | 4.1.0 | Date formatting for week labels | Already installed, tree-shakeable, functional API |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-muscle-highlighter | latest | Anatomical body diagram with muscle highlighting | If using npm package approach - provides front/back views, intensity-based colors, side-specific highlighting |

### Already Installed (leverage these)
| Library | Version | Purpose |
|---------|---------|---------|
| @duckdb/duckdb-wasm | 1.32.0 | SQL aggregation for volume by muscle group |
| zustand | 5.0.10 | Optional state for threshold configuration (not required, localStorage sufficient) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-muscle-highlighter | Custom SVG with manual paths | More control but requires creating/maintaining anatomical SVG paths |
| react-muscle-highlighter | react-body-highlighter | Similar but less maintained (last update older) |
| details/summary | React accordion library | More styling control but requires dependency, loses native accessibility |
| localStorage | Zustand persist | More complex for simple key-value preferences |

**Installation:**
```bash
# Only if using npm package for body diagram
npm install react-muscle-highlighter
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   └── analytics/
│       ├── AnalyticsPage.tsx           # EXISTS: extend with volume sections
│       ├── VolumeBarChart.tsx          # NEW: sets per week by muscle group
│       ├── VolumeZoneIndicator.tsx     # NEW: zone legend and threshold settings
│       ├── MuscleHeatMap.tsx           # NEW: anatomical body diagram
│       ├── CollapsibleSection.tsx      # NEW: wrapper for details/summary
│       ├── ExerciseProgressChart.tsx   # EXISTS: exercise-level charts
│       ├── ChartContainer.tsx          # EXISTS: ResponsiveContainer wrapper
│       └── ...
├── hooks/
│   ├── useAnalytics.ts                 # EXISTS: extend with volume hooks
│   └── useVolumeThresholds.ts          # NEW: localStorage-backed threshold config
├── types/
│   └── analytics.ts                    # EXISTS: extend with volume types
└── db/
    └── compiled-queries.ts             # Add volume queries

dbt/models/marts/analytics/
├── vw_volume_by_muscle_group.sql       # NEW: Weekly sets grouped by muscle group
├── vw_muscle_heat_map.sql              # NEW: 4-week aggregate for heat map
├── vw_exercise_progress.sql            # EXISTS: Exercise progress data
└── vw_weekly_comparison.sql            # EXISTS: Week-over-week metrics
```

### Pattern 1: Stacked Bar Chart for Multi-Week Volume
**What:** Use Recharts BarChart with multiple Bar components sharing same stackId to stack weeks
**When to use:** When displaying multiple weeks of volume data per muscle group
**Example:**
```typescript
// Source: Recharts BarChart docs + stackId pattern
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface VolumeData {
  muscleGroup: string;
  week1Sets: number;
  week2Sets: number;
  week3Sets: number;
  week4Sets: number;
}

export function VolumeBarChart({ data }: { data: VolumeData[] }) {
  return (
    <ChartContainer height={300}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 100, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-muted) / 0.3)" />
        <XAxis
          dataKey="muscleGroup"
          stroke="hsl(var(--chart-muted))"
          fontSize={12}
        />
        <YAxis
          label={{ value: 'Sets', angle: -90, position: 'insideLeft' }}
          stroke="hsl(var(--chart-muted))"
          fontSize={12}
        />
        <Tooltip />
        <Legend />
        <Bar dataKey="week1Sets" stackId="a" fill="hsl(var(--chart-primary))" name="Week 1" />
        <Bar dataKey="week2Sets" stackId="a" fill="hsl(220 60% 60%)" name="Week 2" />
        <Bar dataKey="week3Sets" stackId="a" fill="hsl(220 50% 70%)" name="Week 3" />
        <Bar dataKey="week4Sets" stackId="a" fill="hsl(220 40% 80%)" name="Week 4" />
      </BarChart>
    </ChartContainer>
  );
}
```

### Pattern 2: ReferenceArea for Color-Coded Volume Zones
**What:** Use ReferenceArea components to create horizontal background bands for volume zones
**When to use:** Always for volume bar charts to show optimal/under/over training ranges
**Example:**
```typescript
// Source: Recharts ReferenceArea API + Medium tutorial
import { BarChart, Bar, ReferenceArea, XAxis, YAxis } from 'recharts';

interface VolumeBarChartWithZonesProps {
  data: VolumeData[];
  thresholds: { low: number; high: number }; // e.g., { low: 10, high: 20 }
}

export function VolumeBarChartWithZones({ data, thresholds }: VolumeBarChartWithZonesProps) {
  return (
    <ChartContainer height={300}>
      <BarChart data={data}>
        {/* Under-training zone (red) */}
        <ReferenceArea
          y1={0}
          y2={thresholds.low}
          fill="hsl(0 70% 50%)"
          fillOpacity={0.1}
          label={{ value: 'Under', position: 'insideTopRight', fill: 'hsl(0 70% 50%)' }}
        />
        {/* Optimal zone (green) */}
        <ReferenceArea
          y1={thresholds.low}
          y2={thresholds.high}
          fill="hsl(142 76% 36%)"
          fillOpacity={0.1}
          label={{ value: 'Optimal', position: 'insideTopRight', fill: 'hsl(142 76% 36%)' }}
        />
        {/* Over-training zone (yellow/orange) */}
        <ReferenceArea
          y1={thresholds.high}
          y2={50} // reasonable upper bound
          fill="hsl(45 100% 50%)"
          fillOpacity={0.1}
          label={{ value: 'High', position: 'insideTopRight', fill: 'hsl(45 100% 50%)' }}
        />
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-muted) / 0.3)" />
        <XAxis dataKey="muscleGroup" stroke="hsl(var(--chart-muted))" fontSize={12} />
        <YAxis stroke="hsl(var(--chart-muted))" fontSize={12} />
        <Tooltip />
        <Bar dataKey="totalSets" fill="hsl(var(--chart-primary))" />
      </BarChart>
    </ChartContainer>
  );
}
```

### Pattern 3: Always Show Standard Muscle Groups (Zero Values)
**What:** Pre-populate data array with all standard muscle groups, even if no sets logged
**When to use:** Always for volume charts to show comprehensive training balance
**Example:**
```typescript
// Source: Design requirement + Recharts minPointSize pattern
const STANDARD_MUSCLE_GROUPS = ['chest', 'back', 'shoulders', 'legs', 'arms', 'core'];

function prepareVolumeData(rawData: RawVolumeData[]): VolumeData[] {
  // Create map of existing data
  const dataMap = new Map(rawData.map(d => [d.muscleGroup, d.totalSets]));

  // Ensure all standard groups present
  return STANDARD_MUSCLE_GROUPS.map(group => ({
    muscleGroup: group,
    totalSets: dataMap.get(group) || 0,
    // Optional: use minPointSize on Bar to show small indicator for zero
  }));
}

// In Bar component, use minPointSize to show zero values
<Bar
  dataKey="totalSets"
  fill="hsl(var(--chart-primary))"
  minPointSize={3} // Shows small bar even for 0 values
/>
```

### Pattern 4: Native Collapsible Sections with details/summary
**What:** Use HTML details and summary elements for accessible collapsible sections
**When to use:** Always for section headers on Analytics page (no external dependency needed)
**Example:**
```typescript
// Source: MDN details/summary + accessibility best practices
interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function CollapsibleSection({
  title,
  defaultOpen = true,
  children
}: CollapsibleSectionProps) {
  return (
    <details open={defaultOpen} className="space-y-4">
      <summary className="cursor-pointer text-lg font-semibold text-zinc-200 hover:text-accent transition-colors select-none list-none flex items-center gap-2">
        <svg
          className="w-5 h-5 transition-transform [details[open]_&]:rotate-90"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        {title}
      </summary>
      <div className="pl-7">
        {children}
      </div>
    </details>
  );
}

// Usage in AnalyticsPage
<CollapsibleSection title="Exercise Progress" defaultOpen={true}>
  <ExerciseProgressChart data={progressData} exerciseName={exerciseName} />
</CollapsibleSection>

<CollapsibleSection title="Volume Analytics" defaultOpen={true}>
  <VolumeBarChart data={volumeData} />
  <MuscleHeatMap data={heatMapData} />
</CollapsibleSection>
```

### Pattern 5: localStorage-Backed Volume Thresholds
**What:** Custom hook for managing per-muscle-group volume thresholds with localStorage persistence
**When to use:** For user-configurable settings that should persist across sessions
**Example:**
```typescript
// Source: React localStorage patterns + custom hook best practices
import { useState, useEffect } from 'react';

interface VolumeThresholds {
  [muscleGroup: string]: { low: number; high: number };
}

const DEFAULT_THRESHOLDS: VolumeThresholds = {
  chest: { low: 10, high: 20 },
  back: { low: 10, high: 20 },
  shoulders: { low: 10, high: 20 },
  legs: { low: 10, high: 20 },
  arms: { low: 10, high: 20 },
  core: { low: 10, high: 20 },
};

export function useVolumeThresholds() {
  const [thresholds, setThresholds] = useState<VolumeThresholds>(() => {
    try {
      const stored = localStorage.getItem('volumeThresholds');
      return stored ? JSON.parse(stored) : DEFAULT_THRESHOLDS;
    } catch {
      return DEFAULT_THRESHOLDS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('volumeThresholds', JSON.stringify(thresholds));
    } catch (err) {
      console.error('Failed to save volume thresholds:', err);
    }
  }, [thresholds]);

  const updateThreshold = (muscleGroup: string, low: number, high: number) => {
    setThresholds(prev => ({
      ...prev,
      [muscleGroup]: { low, high }
    }));
  };

  const resetToDefaults = () => {
    setThresholds(DEFAULT_THRESHOLDS);
  };

  return { thresholds, updateThreshold, resetToDefaults };
}
```

### Pattern 6: Anatomical Heat Map with Intensity-Based Colors
**What:** Use react-muscle-highlighter or custom SVG with intensity mapping from volume data
**When to use:** For 4-week aggregate muscle group visualization
**Example (using react-muscle-highlighter):**
```typescript
// Source: react-muscle-highlighter npm documentation
import Body, { type ExtendedBodyPart } from "react-muscle-highlighter";

interface HeatMapData {
  muscleGroup: string;
  totalSets: number;
}

function mapMuscleGroupToSlug(group: string): string {
  // Map standard groups to library slugs
  const mapping: Record<string, string> = {
    chest: 'chest',
    back: 'back',
    shoulders: 'deltoids',
    legs: 'quadriceps', // or hamstrings/calves
    arms: 'biceps', // or triceps
    core: 'abs',
  };
  return mapping[group] || group;
}

export function MuscleHeatMap({ data }: { data: HeatMapData[] }) {
  // Calculate intensity levels (1-5) based on volume thresholds
  const { thresholds } = useVolumeThresholds();

  const bodyData: ExtendedBodyPart[] = data.map(({ muscleGroup, totalSets }) => {
    const threshold = thresholds[muscleGroup] || { low: 10, high: 20 };

    // Map sets to intensity: 1 (low/red), 2-3 (optimal/green), 4-5 (high/yellow)
    let intensity = 1;
    if (totalSets >= threshold.high) intensity = 5;
    else if (totalSets >= threshold.low) intensity = 3;
    else intensity = 1;

    return {
      slug: mapMuscleGroupToSlug(muscleGroup),
      intensity,
    };
  });

  const colors = [
    'hsl(0 70% 50%)',      // 1: red (under)
    'hsl(30 80% 50%)',     // 2: orange
    'hsl(142 76% 36%)',    // 3: green (optimal)
    'hsl(142 60% 50%)',    // 4: light green
    'hsl(45 100% 50%)',    // 5: yellow (high)
  ];

  return (
    <div className="flex flex-col md:flex-row gap-8 justify-center items-center">
      {/* Front view */}
      <div className="flex flex-col items-center gap-2">
        <Body
          data={bodyData}
          colors={colors}
          side="front"
          scale={1.5}
        />
        <span className="text-sm text-zinc-500">Front</span>
      </div>

      {/* Back view */}
      <div className="flex flex-col items-center gap-2">
        <Body
          data={bodyData}
          colors={colors}
          side="back"
          scale={1.5}
        />
        <span className="text-sm text-zinc-500">Back</span>
      </div>
    </div>
  );
}
```

### Pattern 7: SQL Volume Aggregation by Muscle Group
**What:** dbt view aggregating sets per week grouped by muscle group from dim_exercise JOIN
**When to use:** Always for volume charts (SQL aggregation 10-100x faster than JavaScript)
**Example:**
```sql
-- dbt/models/marts/analytics/vw_volume_by_muscle_group.sql
{{
    config(
        materialized='view'
    )
}}

WITH weekly_sets AS (
    SELECT
        DATE_TRUNC('week', CAST(fs.logged_at AS TIMESTAMP))::DATE AS week_start,
        e.muscle_group,
        COUNT(*) AS set_count
    FROM {{ ref('fact_sets') }} fs
    INNER JOIN {{ ref('dim_exercise') }} e ON fs.original_exercise_id = e.exercise_id
    WHERE fs.logged_at >= CURRENT_DATE - INTERVAL '28 days'
    GROUP BY
        DATE_TRUNC('week', CAST(fs.logged_at AS TIMESTAMP))::DATE,
        e.muscle_group
)

SELECT
    week_start,
    muscle_group,
    set_count
FROM weekly_sets
ORDER BY week_start DESC, muscle_group
```

### Anti-Patterns to Avoid
- **Hardcoding muscle group list in multiple places:** Define STANDARD_MUSCLE_GROUPS constant, import everywhere
- **JavaScript volume aggregation:** Always aggregate in SQL, not with Array.reduce()
- **Forgetting minPointSize for zero values:** Zero-value bars won't show without minPointSize prop
- **Creating custom accordion from scratch:** Use native details/summary for free accessibility
- **Using Zustand for simple thresholds:** localStorage with custom hook is simpler for key-value settings
- **Inline data transformation in render:** Always memoize data preparation for charts
- **Single anatomical view:** Must show front AND back for complete muscle coverage

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Anatomical body SVG | Custom SVG paths for 20+ muscles | react-muscle-highlighter npm package | Pre-built front/back views, intensity mapping, maintained library |
| Collapsible sections | Custom accordion with state/animation | Native HTML details/summary | Built-in accessibility, keyboard nav, no JavaScript required |
| Volume threshold storage | Custom localStorage abstraction | Simple useState + useEffect pattern | Standard React pattern, no dependency needed |
| Color-coded zones | Custom SVG rectangles positioned manually | Recharts ReferenceArea | Automatically positioned using domain values, supports labels |
| Week label formatting | Manual date math | date-fns format() with 'MMM d' | Already installed, handles edge cases |
| Zero-value indicators | Custom empty state logic | Recharts Bar minPointSize prop | Built-in feature for showing small bars at zero |

**Key insight:** Volume zone visualization looks custom but Recharts ReferenceArea handles the hard parts (positioning, sizing, labels). Body diagram looks complex but react-muscle-highlighter provides production-ready anatomical SVGs with intensity mapping.

## Common Pitfalls

### Pitfall 1: Missing Muscle Groups with Zero Volume
**What goes wrong:** Bar chart only shows muscle groups with logged sets, hiding training imbalances
**Why it happens:** Directly mapping SQL results to chart without filling gaps
**How to avoid:** Pre-populate data with all standard muscle groups, set missing to 0
**Warning signs:** Chart shows 2-3 bars instead of 6, changes as user logs different exercises
**Verification:** Check chart with fresh database, should show all 6 groups with zeros

### Pitfall 2: ReferenceArea y2 Exceeds Actual Data Range
**What goes wrong:** Zone bands extend far above actual bars, wasting vertical space
**Why it happens:** Hardcoding y2 to large value (e.g., 100) when data range is 0-30
**How to avoid:** Calculate max data value, set y2 of highest zone to max + 10%
**Warning signs:** Large white space above bars, compressed data visualization
**Verification:** Test with low-volume user (5-15 sets/week), zones should fit snugly

### Pitfall 3: Forgetting to Map Muscle Group Names to Body Diagram Slugs
**What goes wrong:** Heat map shows no colors because "chest" doesn't match library's "pectorals"
**Why it happens:** Assuming user's muscle group names match library's anatomical slugs
**How to avoid:** Create explicit mapping function from app's groups to library's slugs
**Warning signs:** Body diagram renders but no muscles highlighted
**Verification:** Console log mapping, check library docs for correct slug names

### Pitfall 4: Volume Thresholds Not Persisting Across Sessions
**What goes wrong:** User adjusts thresholds, refreshes page, settings lost
**Why it happens:** Forgetting useEffect to sync state to localStorage on changes
**How to avoid:** Use useEffect with thresholds as dependency to save on every change
**Warning signs:** Settings work during session but reset after page reload
**Verification:** Adjust threshold, refresh page, verify value persists

### Pitfall 5: Collapsible Sections Losing State on Re-render
**What goes wrong:** Parent re-renders, all collapsed sections reset to open/closed
**Why it happens:** Not controlling open state or defaultOpen changing on re-render
**How to avoid:** Use defaultOpen for initial state, let browser manage, or add key
**Warning signs:** Sections snap open/closed when unrelated data updates
**Verification:** Collapse section, trigger parent state change, verify section stays collapsed

### Pitfall 6: Stacked Bars with Different stackId Values
**What goes wrong:** Weeks show as side-by-side bars instead of stacked
**Why it happens:** Each Bar component has unique stackId (should all be same)
**How to avoid:** Use same stackId string (e.g., "weeks") for all Bar components to stack
**Warning signs:** 4 separate bar groups per muscle instead of 1 stacked bar
**Verification:** Inspect rendered chart, bars should stack vertically not horizontally

### Pitfall 7: Front-Only Body Diagram Missing Back Muscles
**What goes wrong:** Back exercises (rows, deadlifts) don't show on heat map
**Why it happens:** Only rendering front view, ignoring back view requirement
**How to avoid:** Render two Body components side-by-side with side="front" and side="back"
**Warning signs:** User confusion "why isn't my back volume showing?"
**Verification:** Log back exercises, check both views render with appropriate highlighting

## Code Examples

Verified patterns from official sources and codebase analysis:

### Complete Volume Bar Chart with Zones
```typescript
// Source: Recharts BarChart + ReferenceArea API + Phase 5 patterns
import { useMemo } from 'react';
import { BarChart, Bar, ReferenceArea, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { ChartContainer } from './ChartContainer';

interface VolumeData {
  muscleGroup: string;
  totalSets: number;
}

interface VolumeBarChartProps {
  data: VolumeData[];
  thresholds: { low: number; high: number };
}

const STANDARD_MUSCLE_GROUPS = ['chest', 'back', 'shoulders', 'legs', 'arms', 'core'];

export function VolumeBarChart({ data, thresholds }: VolumeBarChartProps) {
  // Always show standard groups (Pitfall 1)
  const chartData = useMemo(() => {
    const dataMap = new Map(data.map(d => [d.muscleGroup.toLowerCase(), d.totalSets]));
    return STANDARD_MUSCLE_GROUPS.map(group => ({
      muscleGroup: group.charAt(0).toUpperCase() + group.slice(1),
      totalSets: dataMap.get(group) || 0,
    }));
  }, [data]);

  // Calculate reasonable y-axis max (Pitfall 2)
  const maxSets = useMemo(() => {
    const max = Math.max(...chartData.map(d => d.totalSets), thresholds.high);
    return Math.ceil(max * 1.2); // 20% padding
  }, [chartData, thresholds]);

  if (chartData.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-500">
        No volume data yet. Log workouts to see muscle group breakdown.
      </div>
    );
  }

  return (
    <ChartContainer height={300}>
      <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        {/* Volume zones - order matters! Draw back to front */}
        <ReferenceArea
          y1={0}
          y2={thresholds.low}
          fill="hsl(0 70% 50%)"
          fillOpacity={0.08}
          stroke="none"
        />
        <ReferenceArea
          y1={thresholds.low}
          y2={thresholds.high}
          fill="hsl(142 76% 36%)"
          fillOpacity={0.08}
          stroke="none"
        />
        <ReferenceArea
          y1={thresholds.high}
          y2={maxSets}
          fill="hsl(45 100% 50%)"
          fillOpacity={0.08}
          stroke="none"
        />

        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-muted) / 0.3)" />
        <XAxis
          dataKey="muscleGroup"
          stroke="hsl(var(--chart-muted))"
          fontSize={12}
          tickLine={false}
        />
        <YAxis
          stroke="hsl(var(--chart-muted))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          domain={[0, maxSets]}
          label={{ value: 'Sets/Week', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(240 6% 10%)',
            border: '1px solid hsl(240 4% 16%)',
            borderRadius: '8px',
          }}
          formatter={(value: number) => [`${value} sets`, 'Volume']}
        />
        <Bar
          dataKey="totalSets"
          fill="hsl(var(--chart-primary))"
          radius={[4, 4, 0, 0]}
          minPointSize={3} // Show small bar even for 0 (Pitfall 1)
        />
      </BarChart>
    </ChartContainer>
  );
}
```

### Volume Zone Legend with Threshold Controls
```typescript
// Source: Design requirements + localStorage pattern
import { useVolumeThresholds } from '../../hooks/useVolumeThresholds';

export function VolumeZoneIndicator() {
  const { thresholds, updateThreshold } = useVolumeThresholds();
  const globalThreshold = thresholds.chest; // Use chest as representative global

  return (
    <div className="space-y-4">
      {/* Zone legend */}
      <div className="flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(0 70% 50% / 0.3)' }} />
          <span className="text-zinc-400">Under (&lt;{globalThreshold.low} sets)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(142 76% 36% / 0.3)' }} />
          <span className="text-zinc-400">Optimal ({globalThreshold.low}-{globalThreshold.high} sets)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(45 100% 50% / 0.3)' }} />
          <span className="text-zinc-400">High (&gt;{globalThreshold.high} sets)</span>
        </div>
      </div>

      {/* Optional: Inline threshold adjustment */}
      <details className="text-sm">
        <summary className="cursor-pointer text-zinc-500 hover:text-zinc-400 transition-colors">
          Adjust volume thresholds
        </summary>
        <div className="mt-3 space-y-2 pl-4">
          <div className="flex items-center gap-4">
            <label className="text-zinc-400 w-24">Low threshold:</label>
            <input
              type="number"
              min="1"
              max="20"
              value={globalThreshold.low}
              onChange={(e) => {
                const low = parseInt(e.target.value, 10);
                // Update all muscle groups (simplified - could be per-group)
                Object.keys(thresholds).forEach(group => {
                  updateThreshold(group, low, thresholds[group].high);
                });
              }}
              className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 w-16 text-zinc-100"
            />
            <span className="text-zinc-500 text-xs">sets/week</span>
          </div>
          <div className="flex items-center gap-4">
            <label className="text-zinc-400 w-24">High threshold:</label>
            <input
              type="number"
              min="10"
              max="40"
              value={globalThreshold.high}
              onChange={(e) => {
                const high = parseInt(e.target.value, 10);
                Object.keys(thresholds).forEach(group => {
                  updateThreshold(group, thresholds[group].low, high);
                });
              }}
              className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 w-16 text-zinc-100"
            />
            <span className="text-zinc-500 text-xs">sets/week</span>
          </div>
          <p className="text-xs text-zinc-600 mt-2">
            Based on hypertrophy research: 10-20 sets per muscle group per week is optimal for growth.
          </p>
        </div>
      </details>
    </div>
  );
}
```

### dbt Model: vw_volume_by_muscle_group
```sql
-- dbt/models/marts/analytics/vw_volume_by_muscle_group.sql
-- Weekly volume aggregation by muscle group (VOL-01, VOL-02)
{{
    config(
        materialized='view'
    )
}}

WITH weekly_sets AS (
    SELECT
        DATE_TRUNC('week', CAST(fs.logged_at AS TIMESTAMP))::DATE AS week_start,
        e.muscle_group,
        COUNT(*) AS set_count
    FROM {{ ref('fact_sets') }} fs
    INNER JOIN {{ ref('dim_exercise') }} e
        ON fs.original_exercise_id = e.exercise_id
    WHERE fs.logged_at >= CURRENT_DATE - INTERVAL '28 days'
    GROUP BY
        DATE_TRUNC('week', CAST(fs.logged_at AS TIMESTAMP))::DATE,
        e.muscle_group
)

SELECT
    week_start,
    muscle_group,
    set_count
FROM weekly_sets
ORDER BY week_start DESC, muscle_group
```

### dbt Model: vw_muscle_heat_map
```sql
-- dbt/models/marts/analytics/vw_muscle_heat_map.sql
-- 4-week aggregate volume for heat map visualization (VOL-03)
{{
    config(
        materialized='view'
    )
}}

SELECT
    e.muscle_group,
    COUNT(*) AS total_sets,
    MIN(fs.logged_at) AS first_logged_at,
    MAX(fs.logged_at) AS last_logged_at
FROM {{ ref('fact_sets') }} fs
INNER JOIN {{ ref('dim_exercise') }} e
    ON fs.original_exercise_id = e.exercise_id
WHERE fs.logged_at >= CURRENT_DATE - INTERVAL '28 days'
GROUP BY e.muscle_group
ORDER BY total_sets DESC
```

### useVolumeAnalytics Hook
```typescript
// Source: Existing useAnalytics.ts pattern
import { useState, useEffect, useCallback } from 'react';
import { getDuckDB } from '../db/duckdb-init';
import { VOLUME_BY_MUSCLE_GROUP_SQL, MUSCLE_HEAT_MAP_SQL } from '../db/compiled-queries';

interface VolumeData {
  muscleGroup: string;
  totalSets: number;
}

export function useVolumeByMuscleGroup() {
  const [data, setData] = useState<VolumeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
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
      const result = await conn.query(VOLUME_BY_MUSCLE_GROUP_SQL);

      const rows = result.toArray().map((row: any) => ({
        muscleGroup: String(row.muscle_group),
        totalSets: Number(row.set_count),
      }));

      setData(rows);
      await conn.close();
    } catch (err) {
      console.error('Error fetching volume by muscle group:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch volume data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refresh: fetchData };
}

export function useMuscleHeatMap() {
  const [data, setData] = useState<VolumeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
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
      const result = await conn.query(MUSCLE_HEAT_MAP_SQL);

      const rows = result.toArray().map((row: any) => ({
        muscleGroup: String(row.muscle_group),
        totalSets: Number(row.total_sets),
      }));

      setData(rows);
      await conn.close();
    } catch (err) {
      console.error('Error fetching muscle heat map:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch heat map data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refresh: fetchData };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom accordion components | Native HTML details/summary | 2024+ | No JavaScript needed, built-in accessibility, keyboard nav |
| Manual volume zone rendering | Recharts ReferenceArea | Recharts 2.0+ | Automatic positioning, cleaner code, better maintenance |
| Custom body diagram SVGs | react-muscle-highlighter package | 2025+ | Pre-built anatomical views, intensity mapping, saves weeks of work |
| Imperative localStorage | React hooks with useEffect | Modern React | Declarative, automatic sync, cleaner code |
| Bar minHeight (CSS) | Bar minPointSize (prop) | Recharts 3.0 | Consistent cross-browser, works with responsive sizing |

**Deprecated/outdated:**
- Custom accordion libraries (react-collapse, react-accessible-accordion): Native details/summary is sufficient
- Manual SVG path drawing for body parts: npm packages provide production-ready solutions
- Recharts v2 syntax: v3 has breaking changes (migration guide available)

## Open Questions

Things that couldn't be fully resolved:

1. **Exact muscle group slug mapping for react-muscle-highlighter**
   - What we know: Library supports common groups (chest, back, biceps, triceps, deltoids, abs, quadriceps, hamstrings)
   - What's unclear: Whether all 6 standard groups map cleanly or need fallbacks
   - Recommendation: Test mapping during implementation, may need to split "legs" into quads/hamstrings/calves

2. **Volume threshold granularity**
   - What we know: User wants configurable thresholds, context says "per muscle group"
   - What's unclear: Whether to implement per-group UI or global with per-group storage
   - Recommendation: Start with global threshold applied to all groups, add per-group UI if requested

3. **Multi-week stacked bar clarity**
   - What we know: Stacked bars can show 4-8 weeks of data
   - What's unclear: Whether users will understand stacked representation vs side-by-side grouped
   - Recommendation: Use stacked with clear legend, consider "total" vs "per-week" toggle if confusion arises

4. **Heat map muscle granularity**
   - What we know: Standard 6 groups (chest/back/shoulders/legs/arms/core)
   - What's unclear: Whether to split legs into quads/hamstrings/glutes for anatomical accuracy
   - Recommendation: Start with 6 groups, consider splitting if user exercises are more granular

## Sources

### Primary (HIGH confidence)
- [Recharts Official BarChart Examples](https://recharts.github.io/en-US/examples/StackedBarChart/)
- [Recharts ReferenceArea API](https://recharts.github.io/en-US/api/ReferenceArea/)
- [Recharts Performance Guide](https://recharts.github.io/en-US/guide/performance/)
- [MDN: details element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/details)
- [react-muscle-highlighter GitHub](https://github.com/soroojshehryar/react-muscle-highlighter)
- [react-muscle-highlighter npm](https://www.npmjs.com/package/react-muscle-highlighter)
- Existing codebase: src/components/analytics/AnalyticsPage.tsx, src/hooks/useAnalytics.ts, src/index.css

### Secondary (MEDIUM confidence)
- [Use Grouped Stacked Bar Charts with Recharts](https://spin.atomicobject.com/stacked-bar-charts-recharts/)
- [Exploring Recharts: Reference Area](https://gaurav5430.medium.com/exploring-recharts-reference-area-2fd68bb33ca5)
- [Accessible accordions using details/summary](https://www.hassellinclusion.com/blog/accessible-accordions-part-2-using-details-summary/)
- [React localStorage patterns](https://www.robinwieruch.de/local-storage-react/)
- [Standard muscle groups guide](https://www.bodyspec.com/blog/post/all_major_muscle_groups_anatomy_and_training_guide)
- Phase 5 Research: .planning/phases/05-analytics-foundation/05-RESEARCH.md

### Tertiary (LOW confidence)
- [Recharts Bar minPointSize discussion](https://snyk.io/advisor/npm-package/recharts/example) - community examples
- WebSearch results on muscle group categories (verify against exercise data in app)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Recharts and date-fns already installed and verified in Phase 5
- Architecture: HIGH - Patterns match existing analytics components, verified with official Recharts docs
- Pitfalls: HIGH - Cross-referenced with Recharts GitHub issues and official performance guide
- Body diagram: MEDIUM - react-muscle-highlighter exists and documented, but not yet tested in this codebase

**Research date:** 2026-01-30
**Valid until:** 30 days (Recharts stable, react-muscle-highlighter may need version check)
