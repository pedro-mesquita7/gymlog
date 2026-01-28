---
phase: 03-history-analytics
plan: 02
subsystem: data-transformation
tags: [dbt, sql, analytics, intermediate-models, window-functions, duckdb]

# Dependency graph
requires:
  - phase: 03-01
    provides: Staging models for workout events and analytics macros (1RM, anomaly detection)
provides:
  - Intermediate models with calculated fields (estimated 1RM, PR flags, anomaly flags)
  - PR detection using window functions with historical max comparison
  - Anomaly detection flagging 50%+ weight changes between sessions
affects: [03-03-mart-models, 04-future-analytics-features]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Window functions with ROWS BETWEEN for historical comparisons"
    - "LAG/MAX OVER for sequential data analysis"
    - "Layered intermediate models (1RM → PRs → anomalies)"

key-files:
  created:
    - dbt/models/intermediate/workouts/int_sets__with_1rm.sql
    - dbt/models/intermediate/workouts/int_sets__with_prs.sql
    - dbt/models/intermediate/workouts/int_sets__with_anomalies.sql
  modified: []

key-decisions:
  - "DEV-047: Layered approach with int_sets__with_1rm → int_sets__with_prs → int_sets__with_anomalies"
  - "DEV-048: PR detection uses original_exercise_id to track PRs across substitutions"
  - "DEV-049: First-time exercises flagged as PRs (previous_max_weight_kg IS NULL)"
  - "DEV-050: Anomaly detection uses LAG(weight_kg) for session-to-session comparison"

patterns-established:
  - "Intermediate model chaining: Each layer adds calculated fields, building on previous layer"
  - "Window functions for analytics: MAX OVER for historical max, LAG for previous value"
  - "PR detection: Compare current weight to historical max using ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING"
  - "Anomaly detection: 50% threshold detects unusual weight jumps, handles null baseline gracefully"

# Metrics
duration: 2min
completed: 2026-01-28
---

# Phase 03 Plan 02: Intermediate Analytics Models Summary

**Three intermediate dbt models add 1RM calculation, PR detection via window functions, and anomaly flagging to logged sets**

## Performance

- **Duration:** 2 min
- **Started:** 2026-01-28T15:49:28Z
- **Completed:** 2026-01-28T15:51:37Z
- **Tasks:** 3
- **Files created:** 3

## Accomplishments
- int_sets__with_1rm calculates estimated 1RM using Epley formula macro
- int_sets__with_prs detects personal records using MAX OVER with ROWS BETWEEN frame
- int_sets__with_anomalies flags sets with 50%+ weight changes using detect_anomaly macro
- Layered approach enables progressive enrichment (1RM → PRs → anomalies)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create int_sets__with_1rm model** - `e091127` (feat)
2. **Task 2: Create int_sets__with_prs model** - `fab1956` (feat)
3. **Task 3: Create int_sets__with_anomalies model** - `b3d8391` (feat)

## Files Created/Modified

**Created:**
- `dbt/models/intermediate/workouts/int_sets__with_1rm.sql` - Adds estimated_1rm_kg column using calculate_1rm macro
- `dbt/models/intermediate/workouts/int_sets__with_prs.sql` - Adds is_pr flag comparing weight to historical max per exercise
- `dbt/models/intermediate/workouts/int_sets__with_anomalies.sql` - Adds is_anomaly flag for 50%+ weight changes from previous session

## Decisions Made

**DEV-047: Layered intermediate model approach**
- int_sets__with_1rm provides base 1RM calculation
- int_sets__with_prs builds on 1RM layer, adds PR detection
- int_sets__with_anomalies builds on PR layer, adds anomaly detection
- Each layer adds calculated fields without duplicating upstream logic
- Enables selective querying based on needed fields

**DEV-048: PR detection uses original_exercise_id**
- Tracks PRs across exercise substitutions
- User substitutes Bench Press → Dumbbell Bench Press, PR tracking continues
- original_exercise_id preserves intent, exercise_id tracks actual performance

**DEV-049: First-time exercises flagged as PRs**
- When previous_max_weight_kg IS NULL, is_pr = true
- Reflects reality: first time logging any weight is a personal record
- Provides positive reinforcement for trying new exercises

**DEV-050: Anomaly detection uses LAG(weight_kg)**
- LAG gets weight from immediately previous session for same exercise
- Detects session-to-session jumps (not just historical max)
- 50% threshold: 100kg → 150kg flagged, gradual increases not flagged

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - dbt models created with correct SQL syntax. Compilation not required during development (SQL used directly in compiled-queries.ts as per DEV-006).

## Next Phase Readiness

**Ready:**
- Three intermediate models provide calculated fields for mart layer
- PR detection and anomaly flags ready for history view
- Foundation complete for plan 03-03 (mart models)

**No blockers:**
- All planned intermediate models created
- Window functions use correct ROWS BETWEEN frame
- Macros properly invoked in model SQL

---
*Phase: 03-history-analytics*
*Completed: 2026-01-28*
