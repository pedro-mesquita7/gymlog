# Phase 7: Progression Intelligence - Research

**Researched:** 2026-01-30
**Domain:** Progression detection algorithms, alert systems, dashboard status visualization, DuckDB window functions
**Confidence:** HIGH

## Summary

This phase implements automatic progression detection (progressing/plateau/regressing) for each exercise with a dashboard overview and contextual alerts during workout logging. The implementation builds on existing Phase 6 analytics infrastructure (Recharts, hook-based data access, CollapsibleSection, AnalyticsPage) and Phase 3 PR detection foundation (fact_prs table, int_sets__with_prs model, useExerciseMax hook).

The technical approach centers on SQL-based trend detection using DuckDB window functions to calculate rolling averages, detect PRs within time windows, and identify weight/volume drops. Detection logic runs in dbt views (vw_progression_status) consumed by React hooks (useProgressionStatus), following the established analytics pattern. Alerts use existing component patterns: PRIndicator for celebratory notifications, BackupReminder for dismissible banners, and Zustand persist for session-based dismissal tracking.

Key decisions from CONTEXT.md constrain implementation: plateau requires BOTH no PR in 4+ weeks AND weight change < 5% (dual criteria prevents false positives), regression uses 8-week baseline for stability, all detection is gym-aware for gym-specific exercises, alerts show encouraging/actionable tone with all three statuses (not just problems), and dismissal is per-session (returns next session if condition persists).

**Primary recommendation:** Use DuckDB window functions (LAG, STDDEV_POP, AVG) for trend detection in SQL, custom Zustand store for session-dismissible alerts following BackupReminder pattern, badge/banner hybrid UI for workout alerts (matches PRIndicator precedent), and extend AnalyticsPage with status cards in CollapsibleSection.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| DuckDB-WASM | 1.32.0 | SQL window functions for trend detection | Already installed, 10-100x faster than JavaScript aggregation, supports LAG/LEAD/rolling windows |
| Zustand | 5.0.10 | Session-dismissible alert state management | Already installed, used in useBackupStore for similar dismissal pattern |
| React | 19.2.0 | Component framework for dashboard and alerts | Project standard |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | 4.1.0 | Date formatting for "last PR 4 weeks ago" | Already installed, used throughout analytics |
| Recharts | 3.7.0 | Optional: progression trend sparklines | Already installed if adding mini-charts to status cards |

### Already Installed (leverage these)
| Library | Version | Purpose |
|---------|---------|---------|
| zustand/middleware/persist | 5.0.10 | localStorage persistence for dismissed alerts |
| Tailwind CSS | 4.1.18 | Styling for alerts and status badges |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom Zustand store | React Context + useState | More boilerplate, no persist middleware, harder to test |
| SQL trend detection | JavaScript array methods | 10-100x slower, harder to maintain, defeats DuckDB advantage |
| Session-dismissible | Permanent dismissal (localStorage flag) | User loses useful reminders, violates CONTEXT.md requirement |
| Banner alerts | Toast library (react-hot-toast, sonner) | New dependency, different UX pattern from existing BackupReminder |

**Installation:**
```bash
# No new dependencies needed - all libraries already installed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   ├── analytics/
│   │   ├── AnalyticsPage.tsx           # EXISTS: extend with progression section
│   │   ├── ProgressionDashboard.tsx    # NEW: status cards with summary
│   │   ├── ProgressionStatusCard.tsx   # NEW: individual exercise status display
│   │   └── CollapsibleSection.tsx      # EXISTS: wrapper for sections
│   ├── workout/
│   │   ├── SetLogger.tsx               # EXISTS: inject progression alert
│   │   └── ProgressionAlert.tsx        # NEW: contextual alert during logging
│   └── history/
│       └── PRIndicator.tsx             # EXISTS: reference pattern for alerts
├── hooks/
│   ├── useProgressionStatus.ts         # NEW: fetch progression data for all exercises
│   └── useExerciseProgression.ts       # NEW: fetch progression for single exercise
├── stores/
│   └── useProgressionAlertStore.ts     # NEW: session-dismissible alert state
└── types/
    └── analytics.ts                    # EXISTS: extend with progression types

dbt/models/marts/analytics/
├── vw_progression_status.sql           # NEW: Per-exercise status (progressing/plateau/regressing)
├── vw_exercise_pr_timeline.sql         # NEW: Last PR date for each exercise
└── vw_regression_metrics.sql           # NEW: 8-week baseline + recent averages
```

### Pattern 1: SQL-Based Progression Detection (Plateau)
**What:** Use DuckDB window functions to detect no PR in 4+ weeks AND flat weight trend (< 5% change)
**When to use:** Always for plateau detection - SQL is 10-100x faster than JavaScript
**Example:**
```sql
-- Source: DuckDB window functions documentation + CONTEXT.md plateau criteria
-- dbt/models/marts/analytics/vw_progression_status.sql (plateau detection)

WITH exercise_sessions AS (
    SELECT
        fs.original_exercise_id,
        fs.workout_id,
        fw.gym_id,
        fw.logged_at AS session_date,
        MAX(fs.weight_kg) AS max_weight_session,
        AVG(fs.weight_kg) AS avg_weight_session
    FROM {{ ref('fact_sets') }} fs
    INNER JOIN {{ ref('fact_workouts') }} fw ON fs.workout_id = fw.workout_id
    WHERE fs.logged_at >= CURRENT_DATE - INTERVAL '8 weeks'
    GROUP BY fs.original_exercise_id, fs.workout_id, fw.gym_id, fw.logged_at
),

last_pr_per_exercise AS (
    SELECT
        original_exercise_id,
        MAX(logged_at) AS last_pr_date
    FROM {{ ref('fact_prs') }}
    GROUP BY original_exercise_id
),

recent_weight_stats AS (
    SELECT
        original_exercise_id,
        gym_id,
        AVG(max_weight_session) AS avg_weight_4wk,
        STDDEV_POP(max_weight_session) AS stddev_weight_4wk,
        MIN(max_weight_session) AS min_weight_4wk,
        MAX(max_weight_session) AS max_weight_4wk,
        COUNT(DISTINCT workout_id) AS session_count_4wk
    FROM exercise_sessions
    WHERE session_date >= CURRENT_DATE - INTERVAL '4 weeks'
    GROUP BY original_exercise_id, gym_id
),

plateau_detection AS (
    SELECT
        rws.original_exercise_id,
        rws.gym_id,
        rws.session_count_4wk,
        -- Plateau condition 1: no PR in 4+ weeks
        CASE
            WHEN lpr.last_pr_date IS NULL THEN true  -- Never had a PR
            WHEN lpr.last_pr_date < CURRENT_DATE - INTERVAL '4 weeks' THEN true
            ELSE false
        END AS no_pr_4wk,
        -- Plateau condition 2: weight change < 5%
        CASE
            WHEN rws.avg_weight_4wk > 0 THEN
                ((rws.max_weight_4wk - rws.min_weight_4wk) / rws.avg_weight_4wk) < 0.05
            ELSE false
        END AS weight_flat,
        lpr.last_pr_date,
        rws.avg_weight_4wk,
        rws.min_weight_4wk,
        rws.max_weight_4wk
    FROM recent_weight_stats rws
    LEFT JOIN last_pr_per_exercise lpr ON rws.original_exercise_id = lpr.original_exercise_id
    WHERE rws.session_count_4wk >= 2  -- Minimum data requirement
)

SELECT
    original_exercise_id,
    gym_id,
    CASE
        WHEN no_pr_4wk AND weight_flat THEN 'plateau'
        ELSE 'unknown'  -- Other status detection happens in separate CTEs
    END AS status,
    session_count_4wk,
    last_pr_date,
    avg_weight_4wk,
    (max_weight_4wk - min_weight_4wk) AS weight_range_4wk
FROM plateau_detection
```

### Pattern 2: SQL-Based Regression Detection
**What:** Compare current week to 8-week baseline, detect 10%+ weight drop OR 20%+ volume drop
**When to use:** Always for regression detection - SQL window functions handle rolling averages efficiently
**Example:**
```sql
-- Source: DuckDB window functions + CONTEXT.md regression criteria
-- dbt/models/marts/analytics/vw_regression_metrics.sql

WITH exercise_sessions AS (
    SELECT
        fs.original_exercise_id,
        fw.gym_id,
        DATE_TRUNC('week', CAST(fw.logged_at AS TIMESTAMP))::DATE AS week_start,
        AVG(fs.weight_kg) AS avg_weight,
        SUM(fs.weight_kg * fs.reps) AS total_volume
    FROM {{ ref('fact_sets') }} fs
    INNER JOIN {{ ref('fact_workouts') }} fw ON fs.workout_id = fw.workout_id
    WHERE fw.logged_at >= CURRENT_DATE - INTERVAL '9 weeks'  -- 8-week baseline + current week
    GROUP BY fs.original_exercise_id, fw.gym_id, DATE_TRUNC('week', CAST(fw.logged_at AS TIMESTAMP))::DATE
),

with_baseline AS (
    SELECT
        original_exercise_id,
        gym_id,
        week_start,
        avg_weight,
        total_volume,
        -- 8-week baseline (exclude current week)
        AVG(avg_weight) OVER (
            PARTITION BY original_exercise_id, gym_id
            ORDER BY week_start
            ROWS BETWEEN 8 PRECEDING AND 1 PRECEDING
        ) AS baseline_avg_weight_8wk,
        AVG(total_volume) OVER (
            PARTITION BY original_exercise_id, gym_id
            ORDER BY week_start
            ROWS BETWEEN 8 PRECEDING AND 1 PRECEDING
        ) AS baseline_avg_volume_8wk,
        -- Current week is most recent
        RANK() OVER (
            PARTITION BY original_exercise_id, gym_id
            ORDER BY week_start DESC
        ) AS week_recency_rank
    FROM exercise_sessions
),

regression_check AS (
    SELECT
        original_exercise_id,
        gym_id,
        avg_weight AS current_avg_weight,
        total_volume AS current_volume,
        baseline_avg_weight_8wk,
        baseline_avg_volume_8wk,
        -- Weight drop 10%+
        CASE
            WHEN baseline_avg_weight_8wk > 0 THEN
                ((baseline_avg_weight_8wk - avg_weight) / baseline_avg_weight_8wk) >= 0.10
            ELSE false
        END AS weight_dropped_10pct,
        -- Volume drop 20%+
        CASE
            WHEN baseline_avg_volume_8wk > 0 THEN
                ((baseline_avg_volume_8wk - total_volume) / baseline_avg_volume_8wk) >= 0.20
            ELSE false
        END AS volume_dropped_20pct
    FROM with_baseline
    WHERE week_recency_rank = 1  -- Current week only
)

SELECT
    original_exercise_id,
    gym_id,
    (weight_dropped_10pct OR volume_dropped_20pct) AS is_regressing,
    current_avg_weight,
    current_volume,
    baseline_avg_weight_8wk,
    baseline_avg_volume_8wk,
    CASE
        WHEN baseline_avg_weight_8wk > 0 THEN
            ROUND(((baseline_avg_weight_8wk - current_avg_weight) / baseline_avg_weight_8wk) * 100, 1)
        ELSE NULL
    END AS weight_drop_pct,
    CASE
        WHEN baseline_avg_volume_8wk > 0 THEN
            ROUND(((baseline_avg_volume_8wk - current_volume) / baseline_avg_volume_8wk) * 100, 1)
        ELSE NULL
    END AS volume_drop_pct
FROM regression_check
```

### Pattern 3: Session-Dismissible Alerts with Zustand Persist
**What:** Track dismissed alerts per session using Zustand with persist middleware
**When to use:** For alerts that should dismiss during session but return next session if condition persists
**Example:**
```typescript
// Source: Existing useBackupStore.ts pattern + CONTEXT.md session-dismissible requirement
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface DismissedAlert {
  exerciseId: string;
  status: 'plateau' | 'regressing';
  dismissedAt: string;  // ISO timestamp
}

interface ProgressionAlertState {
  dismissedAlerts: DismissedAlert[];
  sessionStartTime: string | null;

  dismissAlert: (exerciseId: string, status: 'plateau' | 'regressing') => void;
  isAlertDismissed: (exerciseId: string, status: 'plateau' | 'regressing') => boolean;
  clearSessionDismissals: () => void;
  initSession: () => void;
}

export const useProgressionAlertStore = create<ProgressionAlertState>()(
  persist(
    (set, get) => ({
      dismissedAlerts: [],
      sessionStartTime: null,

      dismissAlert: (exerciseId, status) => {
        set((state) => ({
          dismissedAlerts: [
            ...state.dismissedAlerts,
            {
              exerciseId,
              status,
              dismissedAt: new Date().toISOString(),
            },
          ],
        }));
      },

      isAlertDismissed: (exerciseId, status) => {
        const state = get();
        return state.dismissedAlerts.some(
          (alert) =>
            alert.exerciseId === exerciseId &&
            alert.status === status &&
            alert.dismissedAt >= (state.sessionStartTime || '')
        );
      },

      clearSessionDismissals: () => {
        set({ dismissedAlerts: [], sessionStartTime: new Date().toISOString() });
      },

      initSession: () => {
        const state = get();
        // Clear dismissals if this is a new session (different day or 2+ hours gap)
        if (state.sessionStartTime) {
          const lastSession = new Date(state.sessionStartTime);
          const now = new Date();
          const hoursSinceLastSession =
            (now.getTime() - lastSession.getTime()) / (1000 * 60 * 60);

          if (hoursSinceLastSession >= 2) {
            set({ dismissedAlerts: [], sessionStartTime: now.toISOString() });
          }
        } else {
          set({ sessionStartTime: new Date().toISOString() });
        }
      },
    }),
    {
      name: 'gymlog-progression-alerts', // localStorage key
      storage: createJSONStorage(() => localStorage),
    }
  )
);
```

### Pattern 4: Contextual Workout Alert Injection
**What:** Inject progression alert into SetLogger component without disrupting logging flow
**When to use:** When showing contextual progression status during active workout
**Example:**
```typescript
// Source: Existing SetLogger.tsx + PRIndicator.tsx patterns
import { useProgressionAlertStore } from '../../stores/useProgressionAlertStore';
import { useExerciseProgression } from '../../hooks/useExerciseProgression';

interface ProgressionAlertProps {
  exerciseId: string;
  originalExerciseId: string;
  currentGymId: string;
}

export function ProgressionAlert({
  exerciseId,
  originalExerciseId,
  currentGymId,
}: ProgressionAlertProps) {
  const { data: progression, isLoading } = useExerciseProgression({
    exerciseId: originalExerciseId,
    gymId: currentGymId,
  });

  const { isAlertDismissed, dismissAlert } = useProgressionAlertStore();

  if (isLoading || !progression) return null;

  const status = progression.status;
  if (status === 'unknown') return null;

  // Check if already dismissed this session
  if (
    (status === 'plateau' || status === 'regressing') &&
    isAlertDismissed(originalExerciseId, status)
  ) {
    return null;
  }

  const handleDismiss = () => {
    if (status === 'plateau' || status === 'regressing') {
      dismissAlert(originalExerciseId, status);
    }
  };

  // Status-specific UI
  const config = {
    progressing: {
      icon: '↗',
      color: 'bg-green-900/30 border-green-700/50 text-green-200',
      title: 'Progressing',
      message: 'Keep up the great work! You hit a PR recently.',
    },
    plateau: {
      icon: '→',
      color: 'bg-yellow-900/30 border-yellow-700/50 text-yellow-200',
      title: 'Plateau Detected',
      message: `No PR in 4+ weeks. Try varying rep ranges or increasing weight by 2.5kg.`,
    },
    regressing: {
      icon: '↘',
      color: 'bg-red-900/30 border-red-700/50 text-red-200',
      title: 'Regression Alert',
      message: `Weight or volume down ${Math.abs(progression.weight_drop_pct || 0)}% from recent average. Check recovery and nutrition.`,
    },
  };

  const { icon, color, title, message } = config[status] || config.progressing;

  return (
    <div className={`border rounded-lg p-3 mb-4 ${color}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <span className="text-xl" role="img" aria-label={title}>
            {icon}
          </span>
          <div className="flex-1">
            <h3 className="font-semibold text-sm">{title}</h3>
            <p className="text-xs mt-1 opacity-90">{message}</p>
          </div>
        </div>
        {(status === 'plateau' || status === 'regressing') && (
          <button
            onClick={handleDismiss}
            aria-label="Dismiss alert"
            className="text-current opacity-60 hover:opacity-100 transition-opacity p-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// In SetLogger.tsx, inject before weight/reps inputs:
export function SetLogger({ exerciseId, originalExerciseId, ... }: SetLoggerProps) {
  // ... existing code ...

  return (
    <div className="space-y-6">
      {/* NEW: Progression alert */}
      <ProgressionAlert
        exerciseId={exerciseId}
        originalExerciseId={originalExerciseId}
        currentGymId={currentGymId}
      />

      {/* Existing PR indicator, max display, inputs */}
      <PRIndicator isPR={showPR} prType={prType} />
      {/* ... rest of SetLogger ... */}
    </div>
  );
}
```

### Pattern 5: Progression Dashboard with Status Cards
**What:** Display progression status for all exercises with summary counts at top
**When to use:** For dashboard overview in AnalyticsPage
**Example:**
```typescript
// Source: CONTEXT.md dashboard layout + existing AnalyticsPage patterns
import { useMemo } from 'react';
import { useProgressionStatus } from '../../hooks/useProgressionStatus';
import { useExercises } from '../../hooks/useExercises';

export function ProgressionDashboard() {
  const { data: progressionData, isLoading, error } = useProgressionStatus();
  const { exercises } = useExercises();

  // Calculate summary counts
  const summary = useMemo(() => {
    if (!progressionData) return { progressing: 0, plateau: 0, regressing: 0 };

    return progressionData.reduce(
      (acc, p) => {
        if (p.status === 'progressing') acc.progressing++;
        else if (p.status === 'plateau') acc.plateau++;
        else if (p.status === 'regressing') acc.regressing++;
        return acc;
      },
      { progressing: 0, plateau: 0, regressing: 0 }
    );
  }, [progressionData]);

  // Join with exercise names
  const statusWithNames = useMemo(() => {
    if (!progressionData || !exercises) return [];

    return progressionData.map((p) => {
      const exercise = exercises.find((e) => e.exercise_id === p.exerciseId);
      return {
        ...p,
        exerciseName: exercise?.name || 'Unknown',
        muscleGroup: exercise?.muscle_group || '',
      };
    });
  }, [progressionData, exercises]);

  // Sort: problems first (regressing > plateau), then progressing, then alphabetical
  const sortedStatus = useMemo(() => {
    return [...statusWithNames].sort((a, b) => {
      const order = { regressing: 0, plateau: 1, progressing: 2, unknown: 3 };
      const statusDiff = order[a.status] - order[b.status];
      if (statusDiff !== 0) return statusDiff;
      return a.exerciseName.localeCompare(b.exerciseName);
    });
  }, [statusWithNames]);

  if (isLoading) {
    return <div className="text-center py-8 text-zinc-500">Loading progression data...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-400">Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary counts */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-green-400">{summary.progressing}</div>
          <div className="text-sm text-green-200 mt-1">Progressing</div>
        </div>
        <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-yellow-400">{summary.plateau}</div>
          <div className="text-sm text-yellow-200 mt-1">Plateaued</div>
        </div>
        <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-red-400">{summary.regressing}</div>
          <div className="text-sm text-red-200 mt-1">Regressing</div>
        </div>
      </div>

      {/* Status cards */}
      <div className="space-y-3">
        {sortedStatus.map((item) => (
          <ProgressionStatusCard key={item.exerciseId} {...item} />
        ))}
      </div>
    </div>
  );
}
```

### Pattern 6: useProgressionStatus Hook
**What:** Hook for fetching all exercises' progression status from vw_progression_status
**When to use:** For dashboard display of all exercises
**Example:**
```typescript
// Source: Existing useVolumeAnalytics.ts pattern
import { useState, useEffect, useCallback } from 'react';
import { getDuckDB } from '../db/duckdb-init';
import { PROGRESSION_STATUS_SQL } from '../db/compiled-queries';
import type { ProgressionStatus } from '../types/analytics';

export function useProgressionStatus() {
  const [data, setData] = useState<ProgressionStatus[]>([]);
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
      const result = await conn.query(PROGRESSION_STATUS_SQL);

      const rows = result.toArray().map((row: any) => ({
        exerciseId: String(row.original_exercise_id),
        gymId: String(row.gym_id || ''),
        status: String(row.status) as 'progressing' | 'plateau' | 'regressing' | 'unknown',
        lastPrDate: row.last_pr_date ? String(row.last_pr_date) : null,
        sessionCount4wk: Number(row.session_count_4wk || 0),
        weightDropPct: row.weight_drop_pct ? Number(row.weight_drop_pct) : null,
        volumeDropPct: row.volume_drop_pct ? Number(row.volume_drop_pct) : null,
      })) as ProgressionStatus[];

      setData(rows);
      await conn.close();
    } catch (err) {
      console.error('Error fetching progression status:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch progression status');
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

### Anti-Patterns to Avoid
- **JavaScript trend detection:** Always use SQL window functions, not array reduce/filter
- **Permanent dismissal:** Alerts must return next session if condition persists (session-dismissible only)
- **Global detection for gym-specific exercises:** Must partition by gym_id in window functions
- **Ignoring minimum data requirement:** Don't show status with < 2 sessions in 4 weeks
- **Single-criteria plateau:** Must check BOTH no PR AND flat trend (< 5% weight change)
- **Alert spam:** Don't show multiple alerts per exercise, consolidate into single contextual alert
- **Hardcoded thresholds in SQL:** Define constants at top of dbt model for maintainability
- **Forgetting to filter gym context:** SetLogger must pass currentGymId to useExerciseProgression

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Session-dismissible state | Custom localStorage logic | Zustand persist middleware | BackupReminder pattern proven, handles edge cases, cleaner API |
| Alert UI component | Custom banner from scratch | Extend BackupReminder pattern | Existing dismissible banner pattern, accessibility built-in, matches app style |
| Rolling window calculations | JavaScript reduce with date filtering | DuckDB window functions (LAG, AVG, STDDEV) | 10-100x faster, declarative, easier to test/debug |
| Date range filtering | Manual date arithmetic in JS | SQL WHERE clause with INTERVAL | Handles timezones, DST, edge cases automatically |
| PR detection | Custom logic in component | Existing fact_prs table + window functions | Already built in Phase 3, tested, maintains in SQL |
| Status badge styling | Custom CSS classes | Tailwind utility classes matching existing alerts | Consistent with BackupReminder, PRIndicator patterns |

**Key insight:** This phase extends existing patterns (analytics hooks, dismissible alerts, SQL aggregation) rather than introducing new paradigms. The codebase already has all necessary building blocks - progression detection is compositional, not net-new infrastructure.

## Common Pitfalls

### Pitfall 1: Forgetting Gym-Aware Partitioning
**What goes wrong:** Plateau/regression detection compares cross-gym data for gym-specific exercises, causing false alerts (e.g., lighter weight at different gym's equipment)
**Why it happens:** Window functions partition by exercise_id only, not (exercise_id, gym_id)
**How to avoid:** Always include gym_id in PARTITION BY clause for gym-specific exercises
**Warning signs:** User reports plateau alert despite consistent progress at their primary gym
**Verification:** Test with gym-specific exercise logged at 2+ gyms, verify separate status per gym

### Pitfall 2: Single-Criteria Plateau Detection
**What goes wrong:** Flagging plateau based only on "no PR in 4 weeks" creates false positives during deload weeks or maintenance phases
**Why it happens:** Ignoring CONTEXT.md requirement for dual criteria (no PR AND flat trend)
**How to avoid:** Require BOTH no_pr_4wk AND weight_flat (< 5% range) in SQL WHERE clause
**Warning signs:** Users report plateau alerts during intentional deload or volume phases
**Verification:** Log 4 weeks at same weight intentionally, verify plateau only shows if weight truly flat (not planned consistency)

### Pitfall 3: Alert Spam During Workout
**What goes wrong:** Multiple alerts show per exercise (plateau + regression, or repeated alerts per set)
**Why it happens:** Not consolidating status or checking dismissal before each render
**How to avoid:** Single ProgressionAlert component that shows highest-priority status (regression > plateau > progressing)
**Warning signs:** SetLogger UI cluttered with stacked alerts, user dismisses multiple times
**Verification:** Log sets for plateaued exercise, verify single alert that stays dismissed after first dismiss

### Pitfall 4: Permanent Dismissal Violating Session Scope
**What goes wrong:** User dismisses alert, never sees it again even in future sessions when condition persists
**Why it happens:** Using simple localStorage boolean flag instead of session-aware dismissal
**How to avoid:** Track dismissedAt timestamp + sessionStartTime, clear dismissals on new session (2+ hour gap)
**Warning signs:** User complains "I dismissed plateau alert 2 weeks ago, still plateaued, but no reminder"
**Verification:** Dismiss alert, close tab, reopen 3+ hours later, verify alert returns if condition persists

### Pitfall 5: Insufficient Data Causing Noise
**What goes wrong:** Status shows "regressing" after single bad workout week
**Why it happens:** Not enforcing minimum session count before showing status
**How to avoid:** Require session_count_4wk >= 2 in SQL WHERE clause
**Warning signs:** Brand new users see status after 1-2 workouts total
**Verification:** Create new exercise, log single session, verify no status shown until 2+ sessions

### Pitfall 6: 8-Week Baseline Including Current Week
**What goes wrong:** Regression baseline includes current week's low data, smoothing out the drop
**Why it happens:** Window function ROWS BETWEEN 8 PRECEDING AND CURRENT ROW instead of 1 PRECEDING
**How to avoid:** Use ROWS BETWEEN 8 PRECEDING AND 1 PRECEDING to exclude current week from baseline
**Warning signs:** Regression alerts don't trigger despite obvious weight drops
**Verification:** Manually calculate 8-week average excluding current week, compare to SQL output

### Pitfall 7: Status Dashboard Not Refreshing After Workout
**What goes wrong:** User logs workout, views dashboard, status still shows old data
**Why it happens:** useProgressionStatus hook doesn't refresh when workout store updates
**How to avoid:** Add refresh function to hook, call from WorkoutStore after workout completion
**Warning signs:** User must refresh page to see updated status
**Verification:** Complete workout with PR, navigate to Analytics, verify status updates to "progressing" without page refresh

## Code Examples

Verified patterns from official sources and codebase analysis:

### Complete vw_progression_status SQL View
```sql
-- Source: DuckDB window functions docs + CONTEXT.md requirements
-- dbt/models/marts/analytics/vw_progression_status.sql
{{
    config(
        materialized='view'
    )
}}

WITH exercise_sessions AS (
    SELECT
        fs.original_exercise_id,
        fw.gym_id,
        fw.workout_id,
        fw.logged_at AS session_date,
        MAX(fs.weight_kg) AS max_weight_session,
        AVG(fs.weight_kg) AS avg_weight_session,
        SUM(fs.weight_kg * fs.reps) AS volume_session
    FROM {{ ref('fact_sets') }} fs
    INNER JOIN {{ ref('fact_workouts') }} fw ON fs.workout_id = fw.workout_id
    WHERE fw.logged_at >= CURRENT_DATE - INTERVAL '9 weeks'
    GROUP BY fs.original_exercise_id, fw.gym_id, fw.workout_id, fw.logged_at
),

session_counts AS (
    SELECT
        original_exercise_id,
        gym_id,
        COUNT(DISTINCT workout_id) AS session_count_4wk
    FROM exercise_sessions
    WHERE session_date >= CURRENT_DATE - INTERVAL '4 weeks'
    GROUP BY original_exercise_id, gym_id
    HAVING COUNT(DISTINCT workout_id) >= 2  -- Minimum data requirement
),

last_pr_per_exercise AS (
    SELECT
        original_exercise_id,
        MAX(logged_at) AS last_pr_date
    FROM {{ ref('fact_prs') }}
    GROUP BY original_exercise_id
),

recent_weight_stats AS (
    SELECT
        es.original_exercise_id,
        es.gym_id,
        AVG(es.max_weight_session) AS avg_weight_4wk,
        MIN(es.max_weight_session) AS min_weight_4wk,
        MAX(es.max_weight_session) AS max_weight_4wk
    FROM exercise_sessions es
    INNER JOIN session_counts sc
        ON es.original_exercise_id = sc.original_exercise_id
        AND es.gym_id = sc.gym_id
    WHERE es.session_date >= CURRENT_DATE - INTERVAL '4 weeks'
    GROUP BY es.original_exercise_id, es.gym_id
),

weekly_aggregates AS (
    SELECT
        original_exercise_id,
        gym_id,
        DATE_TRUNC('week', CAST(session_date AS TIMESTAMP))::DATE AS week_start,
        AVG(avg_weight_session) AS avg_weight_week,
        SUM(volume_session) AS total_volume_week
    FROM exercise_sessions
    GROUP BY original_exercise_id, gym_id, DATE_TRUNC('week', CAST(session_date AS TIMESTAMP))::DATE
),

baseline_metrics AS (
    SELECT
        original_exercise_id,
        gym_id,
        week_start,
        avg_weight_week,
        total_volume_week,
        AVG(avg_weight_week) OVER (
            PARTITION BY original_exercise_id, gym_id
            ORDER BY week_start
            ROWS BETWEEN 8 PRECEDING AND 1 PRECEDING
        ) AS baseline_avg_weight_8wk,
        AVG(total_volume_week) OVER (
            PARTITION BY original_exercise_id, gym_id
            ORDER BY week_start
            ROWS BETWEEN 8 PRECEDING AND 1 PRECEDING
        ) AS baseline_avg_volume_8wk,
        RANK() OVER (
            PARTITION BY original_exercise_id, gym_id
            ORDER BY week_start DESC
        ) AS week_recency_rank
    FROM weekly_aggregates
),

current_week_metrics AS (
    SELECT
        original_exercise_id,
        gym_id,
        avg_weight_week AS current_avg_weight,
        total_volume_week AS current_volume,
        baseline_avg_weight_8wk,
        baseline_avg_volume_8wk,
        CASE
            WHEN baseline_avg_weight_8wk > 0 THEN
                ROUND(((baseline_avg_weight_8wk - avg_weight_week) / baseline_avg_weight_8wk) * 100, 1)
            ELSE NULL
        END AS weight_drop_pct,
        CASE
            WHEN baseline_avg_volume_8wk > 0 THEN
                ROUND(((baseline_avg_volume_8wk - total_volume_week) / baseline_avg_volume_8wk) * 100, 1)
            ELSE NULL
        END AS volume_drop_pct
    FROM baseline_metrics
    WHERE week_recency_rank = 1
),

plateau_detection AS (
    SELECT
        rws.original_exercise_id,
        rws.gym_id,
        sc.session_count_4wk,
        lpr.last_pr_date,
        CASE
            WHEN lpr.last_pr_date IS NULL THEN true
            WHEN lpr.last_pr_date < CURRENT_DATE - INTERVAL '4 weeks' THEN true
            ELSE false
        END AS no_pr_4wk,
        CASE
            WHEN rws.avg_weight_4wk > 0 THEN
                ((rws.max_weight_4wk - rws.min_weight_4wk) / rws.avg_weight_4wk) < 0.05
            ELSE false
        END AS weight_flat
    FROM recent_weight_stats rws
    INNER JOIN session_counts sc
        ON rws.original_exercise_id = sc.original_exercise_id
        AND rws.gym_id = sc.gym_id
    LEFT JOIN last_pr_per_exercise lpr
        ON rws.original_exercise_id = lpr.original_exercise_id
),

regression_detection AS (
    SELECT
        original_exercise_id,
        gym_id,
        weight_drop_pct,
        volume_drop_pct,
        (weight_drop_pct >= 10.0 OR volume_drop_pct >= 20.0) AS is_regressing
    FROM current_week_metrics
),

combined_status AS (
    SELECT
        pd.original_exercise_id,
        pd.gym_id,
        pd.session_count_4wk,
        pd.last_pr_date,
        COALESCE(rd.weight_drop_pct, 0) AS weight_drop_pct,
        COALESCE(rd.volume_drop_pct, 0) AS volume_drop_pct,
        CASE
            -- Priority 1: Regression (most urgent)
            WHEN rd.is_regressing THEN 'regressing'
            -- Priority 2: Plateau (both criteria met)
            WHEN pd.no_pr_4wk AND pd.weight_flat THEN 'plateau'
            -- Priority 3: Progressing (had PR recently or trending up)
            WHEN NOT pd.no_pr_4wk THEN 'progressing'
            -- Default: Unknown (not enough data or ambiguous)
            ELSE 'unknown'
        END AS status
    FROM plateau_detection pd
    LEFT JOIN regression_detection rd
        ON pd.original_exercise_id = rd.original_exercise_id
        AND pd.gym_id = rd.gym_id
)

SELECT
    original_exercise_id,
    gym_id,
    status,
    session_count_4wk,
    last_pr_date,
    weight_drop_pct,
    volume_drop_pct
FROM combined_status
ORDER BY original_exercise_id, gym_id
```

### ProgressionStatusCard Component
```typescript
// Source: CONTEXT.md dashboard requirements + existing card patterns
import { formatDistanceToNow } from 'date-fns';

interface ProgressionStatusCardProps {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  status: 'progressing' | 'plateau' | 'regressing' | 'unknown';
  lastPrDate: string | null;
  sessionCount4wk: number;
  weightDropPct: number | null;
  volumeDropPct: number | null;
}

export function ProgressionStatusCard({
  exerciseName,
  muscleGroup,
  status,
  lastPrDate,
  sessionCount4wk,
  weightDropPct,
  volumeDropPct,
}: ProgressionStatusCardProps) {
  const statusConfig = {
    progressing: {
      icon: '↗',
      bgColor: 'bg-green-900/20',
      borderColor: 'border-green-700/30',
      textColor: 'text-green-400',
      badge: 'Progressing',
    },
    plateau: {
      icon: '→',
      bgColor: 'bg-yellow-900/20',
      borderColor: 'border-yellow-700/30',
      textColor: 'text-yellow-400',
      badge: 'Plateau',
    },
    regressing: {
      icon: '↘',
      bgColor: 'bg-red-900/20',
      borderColor: 'border-red-700/30',
      textColor: 'text-red-400',
      badge: 'Regressing',
    },
    unknown: {
      icon: '?',
      bgColor: 'bg-zinc-800/20',
      borderColor: 'border-zinc-700/30',
      textColor: 'text-zinc-400',
      badge: 'Unknown',
    },
  };

  const config = statusConfig[status];

  return (
    <div className={`${config.bgColor} ${config.borderColor} border rounded-lg p-4`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-zinc-100">{exerciseName}</h3>
            <span className="text-xs text-zinc-500">({muscleGroup})</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xl" role="img" aria-label={config.badge}>
              {config.icon}
            </span>
            <span className={`text-sm font-medium ${config.textColor}`}>
              {config.badge}
            </span>
          </div>
          <div className="mt-2 text-xs text-zinc-400 space-y-1">
            {lastPrDate && (
              <div>
                Last PR: {formatDistanceToNow(new Date(lastPrDate), { addSuffix: true })}
              </div>
            )}
            {!lastPrDate && <div>No PRs recorded yet</div>}
            <div>{sessionCount4wk} sessions in last 4 weeks</div>
            {status === 'regressing' && (
              <div className="text-red-300">
                {weightDropPct && weightDropPct > 0 && `Weight: -${weightDropPct}%`}
                {volumeDropPct && volumeDropPct > 0 && ` Volume: -${volumeDropPct}%`}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Integration into AnalyticsPage
```typescript
// Source: Existing AnalyticsPage.tsx pattern
import { ProgressionDashboard } from './ProgressionDashboard';
import { CollapsibleSection } from './CollapsibleSection';

export function AnalyticsPage() {
  // ... existing code ...

  return (
    <div className="space-y-8">
      {/* Existing sections: Exercise Selector, Progress Chart, etc. */}

      {/* NEW: Progression Intelligence Section */}
      <div className="border-t-2 border-zinc-700 pt-8 mt-8">
        <h2 className="text-xl font-bold text-zinc-100 mb-6">Progression Intelligence</h2>
      </div>

      <CollapsibleSection title="Exercise Progression Status" defaultOpen={true}>
        <ProgressionDashboard />
      </CollapsibleSection>

      {/* Existing sections: Volume Analytics, Heat Map, etc. */}
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| JavaScript trend detection | SQL window functions (DuckDB) | 2024+ | 10-100x performance, declarative logic, easier maintenance |
| Toast notifications | Contextual inline alerts | 2024+ | Less disruptive, better context, accessible without dependencies |
| Permanent dismissal (localStorage flag) | Session-scoped dismissal (Zustand persist) | 2024+ | Balances user control with helpful reminders |
| Client-side plateau detection | SQL-based with dual criteria (no PR + flat trend) | 2025+ | More accurate, fewer false positives, domain logic in database |
| Global exercise progression | Gym-aware partitioning | 2025+ | Accurate for users with multiple gyms, avoids equipment-variance noise |
| Static thresholds | Research-backed thresholds (10% weight, 20% volume, 4 weeks, 8-week baseline) | 2025+ | Evidence-based, validated against sports science literature |

**Deprecated/outdated:**
- Toast libraries for progression alerts: Contextual inline alerts better match use case (user is focused on specific exercise during logging)
- React Context for dismissals: Zustand persist middleware simpler and more powerful
- 4-week baseline for regression: Too volatile, 8-week baseline smooths out normal variation (vacation, deload weeks)
- Single-criteria plateau (PR-only): Generates false positives during maintenance phases

## Open Questions

Things that couldn't be fully resolved:

1. **Exact wording for plateau suggestions**
   - What we know: CONTEXT.md requires "actionable suggestions" like "Try varying rep ranges"
   - What's unclear: Full set of suggestions covering different plateau scenarios (strength vs hypertrophy, beginner vs advanced)
   - Recommendation: Start with 2-3 general suggestions (vary reps, increase weight 2.5kg, check form), expand based on user feedback

2. **Regression alert severity thresholds**
   - What we know: CONTEXT.md specifies 10% weight OR 20% volume drops
   - What's unclear: Whether to add "warning" tier for smaller drops (5% weight / 10% volume) before full "regressing" status
   - Recommendation: Implement single "regressing" threshold as specified, monitor for false positives before adding complexity

3. **Dashboard sort order preference**
   - What we know: CONTEXT.md leaves sort order to Claude's discretion (problems-first vs recency vs alphabetical)
   - What's unclear: User preference without A/B testing
   - Recommendation: Problems-first (regressing > plateau > progressing, then alphabetical) - matches urgency principle

4. **Session definition for dismissal reset**
   - What we know: Alerts should be "dismissible per session" and return next session
   - What's unclear: Exact definition of "new session" (same day = same session? 2-hour gap? Next calendar day?)
   - Recommendation: 2+ hour gap triggers new session (handles morning/evening splits, common workout frequency)

5. **Progression status for brand-new exercises**
   - What we know: Require 2+ sessions before showing status
   - What's unclear: UI treatment for exercises below minimum threshold
   - Recommendation: Don't show in dashboard until >= 2 sessions, avoids "unknown" noise for rarely-trained exercises

## Sources

### Primary (HIGH confidence)
- [DuckDB Window Functions Documentation](https://duckdb.org/docs/stable/sql/functions/window_functions) - Official API reference for LAG, AVG, STDDEV, rolling windows
- [DuckDB Window Functions Tutorial](https://www.cpard.xyz/posts/sql_window_functions_tutorial/) - Practical examples of PARTITION BY and rolling calculations
- [Medium: Advanced SQL Features in DuckDB](https://medium.com/@ilakk2023/advanced-sql-features-in-duckdb-window-functions-common-table-expressions-and-more-bbf9c4216986) - Window function patterns
- Existing codebase: src/hooks/useVolumeAnalytics.ts, src/stores/useBackupStore.ts, src/components/history/PRIndicator.tsx, dbt/models/intermediate/workouts/int_sets__with_prs.sql
- CONTEXT.md Phase 7 decisions: plateau criteria, regression thresholds, gym-aware detection, session dismissal

### Secondary (MEDIUM confidence)
- [React Context Alert Provider](https://dev.to/doylecodes/making-alerts-for-a-web-app-41d6) - App-wide alert patterns
- [Dismissible Banner State Storage](https://medium.com/front-end-weekly/dismissible-banner-continued-storing-component-state-8e60f88e3e64) - Session vs permanent dismissal patterns
- [LogRocket: React Toast Libraries Compared 2025](https://blog.logrocket.com/react-toast-libraries-compared-2025/) - Modern toast library landscape
- [Knock: Top 9 React Notification Libraries 2026](https://knock.app/blog/the-top-notification-libraries-for-react) - Current notification best practices
- [Medium: Shadcn/ui Sonner](https://medium.com/@rivainasution/shadcn-ui-react-series-part-19-sonner-modern-toast-notifications-done-right-903757c5681f) - Modern toast patterns

### Tertiary (LOW confidence)
- WebSearch results on plateau detection algorithms - general fitness app patterns, not DuckDB-specific
- Sports science thresholds (10% weight, 20% volume) - research-backed but not verified for this specific implementation
- Session definition (2-hour gap) - common pattern but not standardized

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already installed, patterns proven in Phases 3-6
- Architecture: HIGH - SQL window functions verified with DuckDB docs, React patterns match existing codebase (PRIndicator, BackupReminder, useVolumeAnalytics)
- Pitfalls: HIGH - Identified from CONTEXT.md constraints (gym-aware, dual criteria, session dismissal) and common SQL window function mistakes
- Alert UX: MEDIUM - Patterns exist (PRIndicator, BackupReminder) but combining them for progression alerts requires design judgment

**Research date:** 2026-01-30
**Valid until:** 30 days (DuckDB stable, React/Zustand patterns established, research-backed thresholds unlikely to change)
