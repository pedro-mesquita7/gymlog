---
phase: 13-e2e-tests
plan: 04
subsystem: testing
tags: [playwright, e2e, rotation, quick-start, workout]
depends_on: [13-01]
provides: ["TEST-03: Quick Start and workout rotation advancement E2E test"]
affects: []
tech-stack:
  added: []
  patterns: ["shared browser context for serial state persistence", "bypassCSP for Vite dev mode"]
key-files:
  created:
    - src/e2e/workout-rotation.spec.ts
  modified:
    - playwright.config.ts
decisions:
  - id: d-13-04-01
    title: "Shared browser context instead of appPage fixture"
    choice: "Manual browser.newContext({ bypassCSP: true }) with shared page"
    reason: "Serial tests need state persistence (localStorage + OPFS) across tests; default Playwright fixtures create isolated contexts per test"
  - id: d-13-04-02
    title: "Inline data seeding instead of seed helpers"
    choice: "Inline gym/exercise creation directly in test"
    reason: "Seed helpers (createGym, createExercise) had incorrect navigation targets due to parallel agent modifications; inlining avoids coupling to unstable shared helpers"
  - id: d-13-04-03
    title: "bypassCSP added to playwright config"
    choice: "Add bypassCSP: true to global use config"
    reason: "CSP meta tag in index.html blocks Vite dev server inline scripts, preventing React from mounting in headless browser"
metrics:
  duration: "~20 min"
  completed: 2026-01-31
---

# Phase 13 Plan 04: Quick Start + Rotation Advancement E2E Test Summary

**One-liner:** 3 serial Playwright tests validating workout rotation setup, Quick Start launch, rotation advancement, and wrap-around using shared browser context with CSP bypass.

## What Was Built

Created `src/e2e/workout-rotation.spec.ts` with 3 serial tests covering the full workout rotation lifecycle:

1. **Setup test**: Creates gym, exercises, templates, rotation; sets rotation active with default gym; verifies QuickStartCard shows correct rotation info ("Workout 1 of 2", "Rotation Upper")
2. **Advancement test**: Clicks Quick Start, logs a set, finishes workout, saves; verifies rotation advances to "Workout 2 of 2" / "Rotation Lower"
3. **Wrap-around test**: Completes second workout; verifies rotation wraps back to "Workout 1 of 2" / "Rotation Upper"

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] CSP meta tag blocks Vite dev scripts in headless Chromium**
- **Found during:** Task 1 (initial test run)
- **Issue:** The `<meta http-equiv="Content-Security-Policy">` in `index.html` has `script-src 'self' 'wasm-unsafe-eval'` which blocks Vite's injected inline `@react-refresh` script, preventing React from mounting at all
- **Fix:** Added `bypassCSP: true` to `playwright.config.ts` global `use` section
- **Files modified:** `playwright.config.ts`
- **Commit:** 184b075

**2. [Rule 3 - Blocking] Serial tests need shared browser context for state persistence**
- **Found during:** Task 1 (test architecture design)
- **Issue:** Playwright creates isolated browser contexts per test by default. The `appPage` fixture (from 13-01) uses the `page` fixture which gets a fresh context. Serial rotation tests require localStorage and OPFS data to persist between tests.
- **Fix:** Used `browser.newContext({ bypassCSP: true })` in `beforeAll` to create a shared context, with manual page management across all 3 tests
- **Files modified:** `src/e2e/workout-rotation.spec.ts`
- **Commit:** 184b075

**3. [Rule 3 - Blocking] Incorrect muscle group values in seed helpers**
- **Found during:** Task 1 (test execution)
- **Issue:** Plan specified "Shoulders" and "Back" as muscle groups, but the app uses specific values from MUSCLE_GROUPS constant: 'Front Delts', 'Side Delts', 'Rear Delts', 'Upper Back', 'Lats'
- **Fix:** Used correct muscle group values ('Front Delts' for OHP, 'Upper Back' for Row)
- **Files modified:** `src/e2e/workout-rotation.spec.ts`
- **Commit:** 184b075

**4. [Rule 3 - Blocking] Seed helper navigation targets incorrect**
- **Found during:** Task 1 (test execution)
- **Issue:** `createExercise` in seed.ts navigates to Settings tab, but ExerciseList is actually on Workouts tab. `createGym` also had issues with the "+ Add" button selector. Parallel agents modified seed.ts.
- **Fix:** Inlined all data seeding directly in the test using section-specific locators
- **Files modified:** `src/e2e/workout-rotation.spec.ts`
- **Commit:** 184b075

## Commits

| Hash | Type | Description |
|------|------|-------------|
| 184b075 | test | Quick Start + rotation advancement E2E tests (3 serial tests) |

## Verification

All 3 tests pass:
```
Running 3 tests using 1 worker
  3 passed (27.1s)
```

## Next Phase Readiness

No blockers. The `bypassCSP: true` config change benefits all other E2E test specs in this phase.
