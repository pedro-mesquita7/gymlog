---
phase: 12-bug-fix-security
plan: 01
subsystem: data-layer
tags: [sql, duckdb, exercise-history, bug-fix]
dependency-graph:
  requires: []
  provides: [DIM_EXERCISE_ALL_SQL, exercise-history-survives-deletion]
  affects: [all-analytics-queries, exercise-history-ui]
tech-stack:
  added: []
  patterns: [separate-active-vs-all-dimensions]
key-files:
  created: []
  modified:
    - src/db/compiled-queries.ts
decisions:
  - id: dim-exercise-all-pattern
    choice: "Separate DIM_EXERCISE_ALL_SQL dimension rather than modifying DIM_EXERCISE_SQL"
    reason: "Active exercise list must still filter deleted exercises; history/analytics need all exercises"
metrics:
  duration: ~5 minutes
  completed: 2026-01-31
---

# Phase 12 Plan 01: Fix Exercise History Disappearing on Delete/Recreate

**One-liner:** Added DIM_EXERCISE_ALL_SQL dimension including deleted exercises, updated 5 analytics queries to preserve history after exercise lifecycle changes.

## What Was Done

### Task 1: Create DIM_EXERCISE_ALL_SQL and update history/analytics queries

Added a new `DIM_EXERCISE_ALL_SQL` constant immediately after `DIM_EXERCISE_SQL`. The new dimension uses the same CTE structure but removes the `event_type != 'exercise_deleted'` filter, so exercises that were deleted still appear in history and analytics JOINs. The `event_type` column is included in the output so consumers can identify deleted exercises if needed.

Updated all 5 affected queries to use `exercise_dim_all` (from `DIM_EXERCISE_ALL_SQL`):
- `EXERCISE_HISTORY_SQL` -- exercise history panel
- `EXERCISE_PROGRESS_SQL` -- progress charts
- `WEEKLY_COMPARISON_SQL` -- week-over-week comparison
- `VOLUME_BY_MUSCLE_GROUP_SQL` -- muscle group volume tracking
- `MUSCLE_HEAT_MAP_SQL` -- muscle heat map visualization

`DIM_EXERCISE_SQL` is unchanged and continues to filter deleted exercises for the active exercise list UI.

**Commit:** 9e81191

## Deviations from Plan

None -- plan executed exactly as written.

## Verification Results

- `npx tsc --noEmit` passes (no TypeScript errors)
- All 71 tests pass across 7 test files
- `DIM_EXERCISE_SQL` still contains `event_type != 'exercise_deleted'` filter (line 38)
- `DIM_EXERCISE_ALL_SQL` does NOT contain that filter
- All 5 analytics queries reference `exercise_dim_all` and `DIM_EXERCISE_ALL_SQL`
- Pre-existing build errors in other files are unrelated to this change

## Key Design Decision

The pattern of having two dimensions (active-only vs all-inclusive) is intentional:
- **DIM_EXERCISE_SQL** -- used by the exercise list UI to show only active exercises
- **DIM_EXERCISE_ALL_SQL** -- used by history/analytics queries to preserve data for deleted exercises

This ensures users see their full training history even after exercise lifecycle changes (delete, recreate, rename), while the active exercise picker remains clean.
