---
phase: 03-history-analytics
plan: 01
subsystem: data-transformation
tags: [dbt, sql, analytics, macros, staging-models, duckdb]

# Dependency graph
requires:
  - phase: 01-foundation-data-layer
    provides: Event sourcing infrastructure and base_events__all model
provides:
  - Staging models for workout events (set_logged, workout_started, workout_completed)
  - Analytics macros (1RM calculation, anomaly detection, exercise filtering)
affects: [03-02-mart-models, 03-03-history-view]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "dbt macros for reusable analytics calculations"
    - "Staging models extract and cast JSON payload fields"
    - "Epley formula for 1RM estimation"

key-files:
  created:
    - dbt/models/staging/events/stg_events__set_logged.sql
    - dbt/models/staging/events/stg_events__workout_started.sql
    - dbt/models/staging/events/stg_events__workout_completed.sql
    - dbt/macros/calculate_1rm.sql
    - dbt/macros/detect_anomaly.sql
    - dbt/macros/filter_exercise_by_gym.sql
  modified: []

key-decisions:
  - "DEV-043: Staging models follow JSON_EXTRACT_STRING pattern from existing models"
  - "DEV-044: Epley formula (weight × (1 + reps/30)) for 1RM calculation"
  - "DEV-045: Anomaly detection with 50% default threshold for percent change"
  - "DEV-046: filter_exercise_by_gym macro centralizes global vs gym-specific logic"

patterns-established:
  - "Analytics macros: Jinja templates returning SQL expressions for reuse across mart models"
  - "1RM calculation: Epley formula most accurate for 1-10 rep range"
  - "Anomaly detection: Percent change with configurable threshold, handles null/zero baseline"

# Metrics
duration: 3min
completed: 2026-01-28
---

# Phase 03 Plan 01: Staging Models & Analytics Macros Summary

**dbt staging models for workout events and reusable macros for 1RM calculation, anomaly detection, and gym-specific exercise filtering**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-28T15:44:28Z
- **Completed:** 2026-01-28T15:47:27Z
- **Tasks:** 2
- **Files created:** 6

## Accomplishments
- Staging models parse workout events (set_logged, workout_started, workout_completed) from JSON payload
- Reusable macros for analytics: calculate_1rm (Epley formula), detect_anomaly (percent change), filter_exercise_by_gym
- Foundation ready for mart model development in next plan

## Task Commits

Each task was committed atomically:

1. **Task 1: Create staging models for workout events** - `292aa33` (feat) [completed before this execution]
2. **Task 2: Create dbt macros for analytics calculations** - `2f7e332` (feat)

## Files Created/Modified

**Created:**
- `dbt/models/staging/events/stg_events__set_logged.sql` - Extracts set performance data (workout_id, exercise_id, weight_kg, reps, rir)
- `dbt/models/staging/events/stg_events__workout_started.sql` - Extracts workout session start info (template_id, gym_id, started_at)
- `dbt/models/staging/events/stg_events__workout_completed.sql` - Extracts workout completion timestamps
- `dbt/macros/calculate_1rm.sql` - Epley formula: weight × (1 + reps/30.0)
- `dbt/macros/detect_anomaly.sql` - Percent change detection with 50% default threshold
- `dbt/macros/filter_exercise_by_gym.sql` - Returns WHERE clause for global or gym-specific exercises

## Decisions Made

**DEV-043: Staging models follow JSON_EXTRACT_STRING pattern**
- Consistent with existing staging models (stg_events__exercise_created, etc.)
- Uses CAST for numeric types, NULLIF for nullable fields
- COALESCE for timestamp defaults to _created_at

**DEV-044: Epley formula for 1RM calculation**
- Formula: weight × (1 + reps/30)
- Most accurate for 1-10 rep range
- Standard in powerlifting and strength training

**DEV-045: Anomaly detection with 50% threshold**
- Flags when absolute percent change exceeds threshold
- Handles null/zero baseline (returns false)
- Configurable threshold via macro parameter

**DEV-046: filter_exercise_by_gym macro centralizes filtering logic**
- Reusable pattern: (is_global = true OR gym_id = {context_gym})
- Ensures correct exercise visibility across global vs gym-specific exercises
- Prevents code duplication in mart models

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - dbt compilation not required (SQL used directly in compiled-queries.ts as per DEV-006).

## Next Phase Readiness

**Ready:**
- Staging models extract all workout event fields
- Analytics macros available for mart model development
- Foundation complete for plan 03-02 (mart models)

**No blockers:**
- All planned staging models created
- All planned macros implemented
- Pattern established for future analytics macros

---
*Phase: 03-history-analytics*
*Completed: 2026-01-28*
