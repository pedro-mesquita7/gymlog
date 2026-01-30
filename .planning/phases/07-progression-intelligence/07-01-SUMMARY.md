---
phase: 07-progression-intelligence
plan: 01
subsystem: analytics-data-layer
status: complete
completed: 2026-01-30
duration: 6 minutes

# Dependencies
requires:
  - 06-05  # Volume analytics infrastructure (hook patterns, AnalyticsPage)
  - 03-07  # PR detection foundation (fact_prs table)
  - 01-06  # DuckDB window functions (fact_sets CTE pattern)

provides:
  - progression-status-sql  # PROGRESSION_STATUS_SQL query for all exercises
  - progression-hooks       # useProgressionStatus, useExerciseProgression
  - progression-types       # ProgressionStatus type definition

affects:
  - 07-02  # ProgressionDashboard will consume useProgressionStatus hook
  - 07-03  # ProgressionAlert will consume useExerciseProgression hook

# Technical Stack
tech-stack:
  added: []  # No new dependencies
  patterns:
    - duckdb-window-functions  # LAG, AVG, RANK for trend detection
    - cte-composition          # Inline FACT_SETS_SQL in PROGRESSION_STATUS_SQL
    - hook-based-data-access   # Follows useVolumeAnalytics pattern

# Artifacts
key-files:
  created:
    - path: dbt/models/marts/analytics/vw_progression_status.sql
      loc: 175
      purpose: dbt view for progression status detection with full CTE chain
    - path: src/hooks/useProgressionStatus.ts
      loc: 56
      purpose: Hook for all exercises progression data
    - path: src/hooks/useExerciseProgression.ts
      loc: 80
      purpose: Hook for single exercise progression (workout alerts)

  modified:
    - path: src/db/compiled-queries.ts
      changes: Added PROGRESSION_STATUS_SQL (190 LOC)
      pattern: CTE composition inlining FACT_SETS_SQL
    - path: src/types/analytics.ts
      changes: Added ProgressionStatus interface and hook return types

# Decisions Made
decisions:
  - slug: dual-criteria-plateau
    what: Plateau requires BOTH no PR in 4+ weeks AND weight change < 5%
    why: Single-criteria generates false positives during deload/maintenance phases
    alternatives: PR-only detection (rejected - too noisy)

  - slug: 8-week-baseline-regression
    what: Regression baseline uses 8-week average excluding current week (ROWS BETWEEN 8 PRECEDING AND 1 PRECEDING)
    why: Longer baseline smooths out vacation/sick weeks, excluding current prevents smoothing out the drop
    alternatives: 4-week baseline (rejected - too volatile)

  - slug: javascript-filtering-single-exercise
    what: useExerciseProgression filters all results in JavaScript rather than SQL parameterization
    why: DuckDB-WASM uses string interpolation, filtering post-query is simpler and matches existing patterns
    alternatives: SQL WHERE with string interpolation (rejected - more complex, no performance benefit for single-exercise lookup)

  - slug: gym-aware-partitioning
    what: All window functions partition by (original_exercise_id, gym_id)
    why: User works out at multiple gyms with different equipment - cross-gym comparison causes false alerts
    alternatives: Exercise-only partitioning (rejected - violates gym-specific exercise semantics)

  - slug: minimum-2-sessions
    what: Require session_count_4wk >= 2 before showing status
    why: Insufficient data causes noise (single workout flagged as "regressing")
    alternatives: Show status immediately (rejected - too noisy for new exercises)

tags:
  - duckdb
  - window-functions
  - progression-detection
  - analytics
  - sql
  - react-hooks
---

# Phase 7 Plan 1: Progression Status SQL Foundation Summary

**One-liner:** SQL-based progression detection using DuckDB window functions for plateau/regression/progressing status, powering both dashboard and workout alerts.

## What Was Built

Created the SQL-based progression detection foundation with comprehensive CTE chain for trend analysis:

1. **dbt view vw_progression_status.sql** - 175 LOC with full detection logic:
   - `exercise_sessions` CTE: aggregate per (exercise, gym, workout) for 9-week lookback
   - `session_counts` CTE: enforce minimum 2 sessions in 4 weeks
   - `last_pr_per_exercise` CTE: detect last PR date from fact_prs
   - `recent_weight_stats` CTE: 4-week avg/min/max weight for plateau detection
   - `weekly_aggregates` CTE: weekly avg weight and total volume
   - `baseline_metrics` CTE: 8-week rolling baseline using window functions
   - `current_week_metrics` CTE: calculate weight_drop_pct and volume_drop_pct
   - `plateau_detection` CTE: dual-criteria check (no PR + flat weight)
   - `regression_detection` CTE: 10% weight drop OR 20% volume drop
   - `combined_status` CTE: priority order (regression > plateau > progressing > unknown)

2. **PROGRESSION_STATUS_SQL** in compiled-queries.ts - 190 LOC:
   - Inlines FACT_SETS_SQL using established CTE composition pattern
   - Gets gym_id from workout_events subquery (matches EXERCISE_HISTORY_SQL)
   - Uses is_pr flag from fact_sets for PR detection (no separate fact_prs query needed)
   - Returns all columns for ProgressionStatus type

3. **ProgressionStatus types** in analytics.ts:
   - Core interface: exerciseId, gymId, status, lastPrDate, sessionCount4wk, weightDropPct, volumeDropPct
   - Hook return types: UseProgressionStatusReturn, UseExerciseProgressionReturn

4. **useProgressionStatus hook** - 56 LOC:
   - Fetches all exercises' progression status
   - Follows useVolumeAnalytics pattern exactly (getDuckDB, connect, query, close)
   - Returns { data, isLoading, error, refresh }

5. **useExerciseProgression hook** - 80 LOC:
   - Fetches single exercise status for workout alerts
   - Filters results in JavaScript (exerciseId + gymId match)
   - Handles global exercises (gymId may be empty)
   - Returns { data, isLoading, error }

## Key Implementation Details

**Detection Logic:**
- **Plateau:** no_pr_4wk = true AND weight_flat (< 5% range) = true
- **Regression:** weight_drop_pct >= 10 OR volume_drop_pct >= 20
- **Progressing:** no_pr_4wk = false (had PR in last 4 weeks)
- **Unknown:** insufficient data or ambiguous

**Gym-Aware Partitioning:**
All window functions use `PARTITION BY original_exercise_id, gym_id` to prevent cross-gym false alerts.

**8-Week Baseline (excludes current week):**
```sql
AVG(avg_weight_week) OVER (
    PARTITION BY original_exercise_id, gym_id
    ORDER BY week_start
    ROWS BETWEEN 8 PRECEDING AND 1 PRECEDING
)
```

**Minimum Data Requirement:**
```sql
HAVING COUNT(DISTINCT workout_id) >= 2  -- session_counts CTE
```

## Testing Performed

**TypeScript Compilation:**
```bash
npx tsc --noEmit  # ✓ Passed
```

**Exports Verified:**
- PROGRESSION_STATUS_SQL exported from compiled-queries.ts ✓
- ProgressionStatus type exported from analytics.ts ✓
- useProgressionStatus exported from hooks ✓
- useExerciseProgression exported from hooks ✓

**Pattern Compliance:**
- Hooks follow useVolumeAnalytics pattern (getDuckDB, connect/query/close, String()/Number() coercion) ✓
- SQL follows VOLUME_BY_MUSCLE_GROUP_SQL CTE composition pattern ✓
- Types follow existing UseVolumeAnalyticsReturn pattern ✓

## Deviations from Plan

None - plan executed exactly as written.

## Lessons Learned

1. **Window function ROWS BETWEEN clarity:** Excluding current week from baseline requires `1 PRECEDING` not `CURRENT ROW` - subtle but critical for regression detection accuracy.

2. **CTE composition is powerful:** Inlining FACT_SETS_SQL into PROGRESSION_STATUS_SQL keeps all detection logic in one place while reusing existing logic.

3. **JavaScript filtering is simpler for single-record lookups:** DuckDB-WASM string interpolation makes SQL parameterization complex - filtering post-query is cleaner for useExerciseProgression.

4. **Dual-criteria plateau prevents false positives:** Checking BOTH no PR AND flat weight is essential - single criteria would flag intentional deload weeks as "plateau."

## Next Phase Readiness

**Ready for Plan 02 (ProgressionDashboard):**
- useProgressionStatus hook provides all data needed for dashboard ✓
- ProgressionStatus type includes all display fields (status, lastPrDate, sessionCount4wk) ✓
- Data includes weight/volume drop percentages for regression details ✓

**Ready for Plan 03 (ProgressionAlert):**
- useExerciseProgression hook provides single-exercise lookup ✓
- Filters by exerciseId + gymId (gym-aware for workout context) ✓
- Returns null if exerciseId empty (skip rendering logic) ✓

**Blockers/Concerns:**
None - foundation is complete and ready for UI consumption.

## Performance Notes

**SQL Performance:**
- Window functions execute in DuckDB (10-100x faster than JavaScript)
- 9-week lookback limits data volume (scales with user activity, not total history)
- CTE chain optimized by DuckDB query planner

**Hook Performance:**
- useProgressionStatus fetches all exercises (dashboard use case - infrequent refresh)
- useExerciseProgression fetches all then filters (acceptable for <100 exercises typical)
- Future optimization: SQL WHERE clause if exercise count scales beyond 500+

## Related Documentation

- Plan: .planning/phases/07-progression-intelligence/07-01-PLAN.md
- Research: .planning/phases/07-progression-intelligence/07-RESEARCH.md (Pattern 1, 2, 6)
- Context: .planning/phases/07-progression-intelligence/07-CONTEXT.md (dual-criteria plateau, 8-week baseline decisions)

## Commits

- `52cae13` - feat(07-01): create progression status SQL query and types
- `3229309` - feat(07-01): create progression status hooks

Total: 2 commits, 5 files (3 created, 2 modified), ~450 LOC added
