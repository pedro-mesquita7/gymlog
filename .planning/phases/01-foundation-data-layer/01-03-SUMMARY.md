---
phase: 01-foundation-data-layer
plan: 03
subsystem: database
tags: [dbt, duckdb, sql, data-modeling, event-sourcing, transformation]

# Dependency graph
requires:
  - phase: 01-02
    provides: Event sourcing system with writeEvent/readEvents functions
provides:
  - Three-layer dbt transformation pipeline (staging, intermediate, marts)
  - Staging models that parse JSON event payloads
  - Intermediate models that deduplicate events to current state
  - Mart dimension tables (dim_exercise, dim_gym)
  - Compiled SQL queries for browser execution
affects: [01-04-workout-tracking, 01-05-analytics, ui-components]

# Tech tracking
tech-stack:
  added: []
  patterns: [three-layer-dbt-architecture, event-replay-deduplication, json-extraction-duckdb]

key-files:
  created:
    - dbt/models/staging/events/_events__sources.yml
    - dbt/models/staging/events/base/base_events__all.sql
    - dbt/models/staging/events/stg_events__exercise_created.sql
    - dbt/models/staging/events/stg_events__exercise_updated.sql
    - dbt/models/staging/events/stg_events__exercise_deleted.sql
    - dbt/models/staging/events/stg_events__gym_created.sql
    - dbt/models/staging/events/stg_events__gym_updated.sql
    - dbt/models/staging/events/stg_events__gym_deleted.sql
    - dbt/models/intermediate/workouts/int_exercises__deduplicated.sql
    - dbt/models/intermediate/workouts/int_gyms__current_state.sql
    - dbt/models/marts/core/dim_exercise.sql
    - dbt/models/marts/core/dim_gym.sql
    - dbt/models/marts/core/_core__models.yml
    - src/db/compiled-queries.ts
  modified:
    - src/db/queries.ts

key-decisions:
  - "Compiled SQL in TypeScript instead of requiring dbt runtime"
  - "Three-layer architecture: staging (extract), intermediate (transform), marts (final)"
  - "ROW_NUMBER deduplication pattern for event replay"

patterns-established:
  - "Staging models only extract/cast from JSON - no joins or aggregations"
  - "Intermediate models deduplicate using ROW_NUMBER OVER (PARTITION BY id ORDER BY timestamp DESC)"
  - "Mart models filter out deleted entities (event_type != 'deleted')"
  - "dbt models serve as documentation; compiled SQL in compiled-queries.ts for execution"

# Metrics
duration: 3min
completed: 2026-01-27
---

# Phase 1 Plan 3: dbt Transformation Pipeline Summary

**Three-layer dbt architecture with staging models extracting JSON events, intermediate models deduplicating to current state, and mart dimension tables ready for UI consumption**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-27T22:31:24Z
- **Completed:** 2026-01-27T22:34:10Z
- **Tasks:** 3
- **Files modified:** 15

## Accomplishments

- Staging layer extracts all exercise and gym event fields from JSON payloads
- Intermediate layer deduplicates events using ROW_NUMBER to get current state
- Mart layer filters out deleted entities and provides dim_exercise and dim_gym tables
- Compiled SQL queries enable browser execution without dbt runtime
- Complete three-layer dbt architecture following best practices

## Task Commits

Each task was committed atomically:

1. **Task 1: Create staging layer models for events** - `661f2be` (feat)
2. **Task 2: Create intermediate and marts layer models** - `f2ff042` (feat)
3. **Task 3: Verify dbt compilation and create compiled SQL loader** - `5e6405d` (feat)

## Files Created/Modified

**Staging Layer:**
- `dbt/models/staging/events/_events__sources.yml` - Source definition for raw events table
- `dbt/models/staging/events/base/base_events__all.sql` - Base model reading from source
- `dbt/models/staging/events/stg_events__exercise_created.sql` - Exercise created events with JSON extraction
- `dbt/models/staging/events/stg_events__exercise_updated.sql` - Exercise updated events
- `dbt/models/staging/events/stg_events__exercise_deleted.sql` - Exercise deleted events
- `dbt/models/staging/events/stg_events__gym_created.sql` - Gym created events
- `dbt/models/staging/events/stg_events__gym_updated.sql` - Gym updated events
- `dbt/models/staging/events/stg_events__gym_deleted.sql` - Gym deleted events

**Intermediate Layer:**
- `dbt/models/intermediate/workouts/int_exercises__deduplicated.sql` - Deduplicated exercise events
- `dbt/models/intermediate/workouts/int_gyms__current_state.sql` - Deduplicated gym events

**Marts Layer:**
- `dbt/models/marts/core/dim_exercise.sql` - Exercise dimension table
- `dbt/models/marts/core/dim_gym.sql` - Gym dimension table
- `dbt/models/marts/core/_core__models.yml` - Schema documentation with tests

**Application Integration:**
- `src/db/compiled-queries.ts` - DIM_EXERCISE_SQL and DIM_GYM_SQL for browser execution
- `src/db/queries.ts` - Updated to use compiled queries

## Decisions Made

**DEV-006: Compiled SQL in TypeScript instead of requiring dbt runtime**
- Rationale: Browser environment can't run dbt compile. dbt models serve as documentation and source of truth, but compiled SQL in TypeScript enables direct DuckDB execution
- Impact: dbt models are documentation layer; compiled-queries.ts is execution layer

**DEV-007: JSON_EXTRACT_STRING for payload parsing in staging models**
- Rationale: DuckDB's JSON extraction functions handle the schemaless event payload
- Pattern: Use `payload->>'field'` for string access, `CAST(payload->>'field' AS BOOLEAN)` for type conversion

**DEV-008: ROW_NUMBER deduplication pattern for event replay**
- Rationale: PARTITION BY entity_id ORDER BY timestamp DESC with ROW_NUMBER gives most recent state
- Implements: Idempotent processing (DATA-08) - running multiple times yields same result

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all tasks completed without issues. TypeScript compilation succeeded on first attempt.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for:**
- Workout tracking events (01-04): dim_exercise table available for exercise selection
- Analytics models (01-05): Pattern established for creating additional mart models
- UI components: getExercises() and getGyms() queries ready for consumption

**Delivered:**
- Complete data transformation pipeline from raw events to clean dimension tables
- Documentation via dbt models with schema tests
- Browser-executable SQL matching dbt logic

**Pattern for future models:**
1. Create staging model to extract fields from JSON
2. Create intermediate model to deduplicate/transform
3. Create mart model for final consumption
4. Add compiled SQL to compiled-queries.ts
5. Add query function to queries.ts

---
*Phase: 01-foundation-data-layer*
*Completed: 2026-01-27*
