---
phase: 13-e2e-tests
plan: 03
subsystem: testing
tags: [playwright, e2e, batch-logging, ghost-text]
depends_on: ["13-01"]
provides: ["TEST-02: batch logging edge cases"]
affects: []
tech-stack:
  added: []
  patterns: ["CTE-based ghost data query", "page reload for OPFS persistence in E2E"]
key-files:
  created:
    - src/e2e/batch-logging.spec.ts
  modified:
    - src/hooks/useLastSessionData.ts
    - src/e2e/helpers/seed.ts
    - vite.config.ts
decisions:
  - id: "13-03-D1"
    decision: "Merged max-values and ghost-text into single test"
    rationale: "Ghost text depends on saved workout data; separate tests with Playwright's per-test page isolation would require complex state management"
  - id: "13-03-D2"
    decision: "Fixed ghost data SQL instead of mocking"
    rationale: "useLastSessionData referenced non-existent fact_sets/dim_workouts tables; fixing the SQL was necessary for the feature to work at all"
metrics:
  duration: "~36 min"
  completed: "2026-01-31"
---

# Phase 13 Plan 03: Batch Logging Edge Cases E2E Test Summary

Batch logging E2E test covering empty set validation, large value acceptance, ghost text from previous sessions, and dynamic set row addition.

## What Was Done

### Task 1: Write batch-logging.spec.ts

Created `src/e2e/batch-logging.spec.ts` with 3 test cases covering 4 behaviors:

1. **Empty sets disable Save Workout button** -- starts a workout without filling any set data, clicks Finish, verifies Save is disabled and the no-sets warning appears.

2. **Max values accepted and ghost text appears from previous session** -- logs a set with weight=500 reps=100, saves the workout, forces a DuckDB checkpoint, reloads the page, starts a new workout, and verifies the ghost text placeholders show "500.0" and "100".

3. **Add Set button adds rows beyond template sets** -- starts a workout, counts initial set rows (3 from template defaults), clicks Add Set, verifies row count increased by 1.

Each test creates its own isolated data (gym, exercise, template) via the `setupTestData` helper that calls `clearAllData` first.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed ghost data SQL in useLastSessionData**

- **Found during:** Task 1 (ghost text test)
- **Issue:** `useLastSessionData` hook referenced `fact_sets` and `dim_workouts` as bare table names, but these tables/views do not exist in the DuckDB schema. The query silently failed, returning null ghost data for all exercises.
- **Fix:** Rewrote the SQL to use CTEs that extract set and workout data directly from the events table (same pattern used by all other compiled queries in the codebase).
- **Files modified:** `src/hooks/useLastSessionData.ts`
- **Commit:** 9378720

**2. [Rule 3 - Blocking] Fixed CSP meta tag blocking Vite dev server**

- **Found during:** Task 1 (app would not load in Playwright)
- **Issue:** The `<meta http-equiv="Content-Security-Policy">` tag in `index.html` had `script-src 'self' 'wasm-unsafe-eval'` which blocked Vite's injected inline scripts for React Refresh/HMR. The app rendered as a blank white page in all E2E tests.
- **Fix:** Added a Vite plugin (`strip-csp-dev`) that removes the CSP meta tag during `serve` mode. Production builds retain the CSP tag.
- **Files modified:** `vite.config.ts`
- **Commit:** 9378720

**3. [Rule 3 - Blocking] Fixed E2E seed helpers navigating to wrong tab**

- **Found during:** Task 1 (createGym/createExercise failed)
- **Issue:** `createGym` and `createExercise` in `seed.ts` navigated to the Settings tab, but the gym/exercise forms are on the Workouts tab.
- **Fix:** Updated both helpers to navigate to Workouts tab and click the correct "+ Add" button.
- **Files modified:** `src/e2e/helpers/seed.ts`
- **Commit:** 9378720

**4. [Rule 1 - Bug] Fixed exercise_id vs original_exercise_id in ghost query**

- **Found during:** Task 1 (ghost text still empty after CTE fix)
- **Issue:** The ghost data query filtered on `s.exercise_id` but `SetGrid` passes `originalExerciseId` to the hook. For exercises without substitution, these are the same, but the query should use `original_exercise_id` for correctness.
- **Fix:** Changed WHERE clauses to use `s.original_exercise_id`.
- **Files modified:** `src/hooks/useLastSessionData.ts`
- **Commit:** 9378720

## Decisions Made

| ID | Decision | Rationale |
|----|----------|-----------|
| 13-03-D1 | Merged max-values and ghost-text into single test | Ghost text depends on saved workout data from the same test; Playwright's per-test page isolation makes cross-test state sharing unreliable |
| 13-03-D2 | Fixed ghost data SQL instead of mocking | The hook's SQL referenced non-existent tables; the feature was completely broken without the fix |

## Commits

| Hash | Message |
|------|---------|
| 9378720 | feat(13-03): batch logging edge cases E2E test |

## Verification

All 3 tests pass via `npx playwright test batch-logging.spec.ts`:
- Empty sets disable Save Workout button
- Max values accepted and ghost text appears from previous session
- Add Set button adds rows beyond template sets
