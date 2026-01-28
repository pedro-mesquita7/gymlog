---
phase: 03-history-analytics
plan: 04
subsystem: database
tags: [duckdb, sql, analytics, window-functions, compiled-queries]

# Dependency graph
requires:
  - phase: 03-01
    provides: dbt intermediate models with 1RM, PR, and anomaly detection
  - phase: 03-02
    provides: Layered int_sets models (with_1rm, with_prs, with_anomalies)
  - phase: 03-03
    provides: fact_sets mart with all analytics columns
provides:
  - Runtime SQL queries for React hooks (FACT_SETS_SQL, EXERCISE_HISTORY_SQL, PR_LIST_SQL, CURRENT_MAX_SQL)
  - Compiled queries matching dbt model logic for browser execution
affects: [04-frontend-integration, history-hooks, pr-detection-ui]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Compiled SQL queries in TypeScript (DEV-006 pattern)"
    - "Template string interpolation for nested CTEs"
    - "Positional parameters ($1, $2) for DuckDB prepared statements"

key-files:
  created: []
  modified:
    - src/db/compiled-queries.ts

key-decisions:
  - "DEV-051: FACT_SETS_SQL replicates full dbt intermediate model chain in single query (avoids materialized views)"
  - "DEV-052: EXERCISE_HISTORY_SQL uses nested FACT_SETS_SQL CTE for consistency (single source of truth)"
  - "DEV-053: Gym filtering uses $1 parameter matching current gym context pattern"

patterns-established:
  - "CTE composition: Complex queries built from simpler CTEs with clear step names"
  - "Window function PR detection: ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING for max tracking"
  - "Anomaly detection: 50% threshold with LAG() for session-to-session comparison"

# Metrics
duration: 2min
completed: 2026-01-28
---

# Phase 03 Plan 04: Compiled Queries Summary

**Runtime SQL queries for fact_sets with full analytics (1RM, PR, anomaly detection) using DuckDB window functions and positional parameters**

## Performance

- **Duration:** 2 min
- **Started:** 2026-01-28T16:02:59Z
- **Completed:** 2026-01-28T16:04:56Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Created FACT_SETS_SQL replicating all dbt intermediate logic (with_1rm → with_prs → with_anomalies)
- Created EXERCISE_HISTORY_SQL with 14-day filter and gym context matching
- Created PR_LIST_SQL for exercise-specific PR history with typed PR categories
- Created CURRENT_MAX_SQL for real-time PR detection during workout logging

## Task Commits

Each task was committed atomically:

1. **Task 1: Add workout and analytics queries to compiled-queries.ts** - `07b740a` (feat)

## Files Created/Modified
- `src/db/compiled-queries.ts` - Added 4 runtime SQL queries (FACT_SETS_SQL, EXERCISE_HISTORY_SQL, PR_LIST_SQL, CURRENT_MAX_SQL)

## Decisions Made

**DEV-051: FACT_SETS_SQL replicates full dbt intermediate model chain in single query**
- Rationale: Browser environment doesn't support materialized views. Single query with CTEs matches dbt logic while working in DuckDB-WASM
- Trade-off: Query is longer but maintains single source of truth from dbt models

**DEV-052: EXERCISE_HISTORY_SQL uses nested FACT_SETS_SQL CTE for consistency**
- Rationale: Template string interpolation allows reusing FACT_SETS_SQL logic, ensuring exercise history analytics match fact table
- Pattern: `FROM (${FACT_SETS_SQL}) f` creates inline view

**DEV-053: Gym filtering uses $1 parameter matching current gym context pattern**
- Rationale: Prepared statements prevent SQL injection and match DuckDB-WASM binding syntax
- Pattern: `$1` for gym_id, `$2` for exercise_id enables efficient query reuse

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - queries replicated dbt logic directly with no obstacles.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for Phase 4 frontend integration:**
- All analytics queries available as TypeScript exports
- Queries match dbt model semantics (Epley formula, PR detection, anomaly thresholds)
- Parameterized queries ready for React hooks with gym/exercise filtering
- Window function logic tested via dbt models in previous plans

**No blockers:**
- TypeScript compilation successful
- All queries use valid DuckDB syntax (payload->>'field', ROWS BETWEEN, INTERVAL)
- Prepared statement parameters follow DuckDB-WASM convention

---
*Phase: 03-history-analytics*
*Completed: 2026-01-28*
