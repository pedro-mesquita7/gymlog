# Phase 27 Plan 03: E2E Test Fixes + Notes/Warmup Coverage Summary

## One-liner
Fixed all broken E2E tests for restructured settings UI, fixed infinite render loop bug, added notes and warmup test coverage (17/17 passing)

## What Was Done

### Task 1: Fix existing E2E tests and update selectors
- Updated `app.fixture.ts` helpers (`clearAllData`, `loadDemoData`) for the phase-24 settings restructure:
  - Developer Mode toggle required before accessing Demo Data & Reset section
  - CollapsibleSection navigation for Data Backup, Restore from Backup, Manage Rotations
  - Dialog-based confirmations replacing `window.confirm()` pattern
- Updated `selectors.ts` with new selector constants for developer mode toggle, notes, warmup
- Fixed all 5 existing spec files:
  - `demo-data.spec.ts`: Updated for collapsible sections, Dialog confirmations, adjusted assertions for clearHistoricalData behavior (preserves exercise/gym events)
  - `parquet-roundtrip.spec.ts`: Fixed file extension validation (save with .parquet), updated event count assertions
  - `workout-rotation.spec.ts`: Updated for collapsible Gyms/Exercises/Rotations sections, developer mode toggle
  - `batch-logging.spec.ts`: Added "Manual select workout" details element opening
  - `plan-crud.spec.ts`: Added "Manual select workout" details element opening
- Updated `seed.ts` helpers for collapsible section navigation

### Task 2: Add notes and warmup E2E tests
- Added `data-testid` attributes to ExerciseNote component (toggle, input, history, entry)
- Added `data-testid` attributes to WarmupHint component (toggle, content)
- **Fixed critical infinite render loop bug in SetRow/SetGrid** (Rule 1 - Bug):
  - Root cause: `onChange` callback in SetGrid created new arrow function on every render, included in SetRow's useEffect deps, causing infinite setState->render->useEffect cycle
  - Fix: Made handleRowChange a useCallback, passed rowIndex as prop, removed onChange from useEffect deps
- **Fixed useRecentWorkout hook** (Rule 1 - Bug):
  - Was querying non-existent `fact_workouts` dbt model tables
  - Rewrote to query events table directly (event-sourced pattern)
- Created `notes.spec.ts` (2 tests):
  - Add note during workout, save, start new workout, verify note visible in history
  - Demo data note toggle interaction
- Created `warmup.spec.ts` (2 tests):
  - Warmup hints with calculated weights from demo data history
  - "Log your first session" message for exercises with no history

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed infinite render loop in SetRow/SetGrid**
- **Found during:** Task 2 (investigating why ExerciseNote/WarmupHint didn't render)
- **Issue:** `onChange` prop to SetRow was an inline arrow function creating new reference every render, causing infinite setState->render->useEffect cycle via the `onChange` dependency in SetRow's useEffect
- **Fix:** Used useCallback for handleRowChange, passed rowIndex as explicit prop, removed onChange from useEffect deps
- **Files modified:** `src/components/workout/SetGrid.tsx`, `src/components/workout/SetRow.tsx`
- **Commit:** f4d9c03

**2. [Rule 1 - Bug] Fixed useRecentWorkout querying non-existent tables**
- **Found during:** Task 2 (debugging console errors during workout)
- **Issue:** Hook queried `fact_workouts`, `dim_templates`, `fact_sets` tables that are dbt models not materialized in browser DuckDB
- **Fix:** Rewrote SQL to query events table directly using event-sourced pattern
- **Files modified:** `src/hooks/useRecentWorkout.ts`
- **Commit:** f4d9c03

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Use `page.locator('button[aria-expanded]:has-text(...)').waitFor()` for CollapsibleSection | Reliable across tab transition animations where elements may not be immediately in DOM |
| Use `page.waitForSelector(detached)` for reload detection | More reliable than `waitForURL` since reload URL matches current URL |
| Remove onChange from SetRow useEffect deps | Prevents infinite loop; onChange is stable via useCallback, only data changes should trigger parent updates |
| Rewrite useRecentWorkout SQL to event-sourced | Browser DuckDB only has events table, not dbt-materialized fact/dim tables |

## Metrics

- **Duration:** ~45 minutes
- **Completed:** 2026-02-04
- **Tests:** 17 total (13 existing fixed + 2 notes + 2 warmup)
- **Bugs fixed:** 2 (infinite render loop, missing table query)
- **Files created:** 2 (notes.spec.ts, warmup.spec.ts)
- **Files modified:** 10 (8 E2E files, 2 component files, 1 hook)
