---
phase: 13-e2e-tests
plan: 01
subsystem: testing
tags: [playwright, e2e, data-testid, test-infrastructure]
depends_on: []
provides:
  - data-testid attributes on 16 production components (48 total selectors)
  - shared E2E fixture with app readiness wait and cleanup
  - centralized selector constants module
  - UI-driven seed helpers for gyms, exercises, and sets
  - updated Playwright config with failure diagnostics
affects:
  - 13-02 through 13-07 (all E2E spec plans import fixtures/selectors)
tech_stack:
  added: []
  patterns: [data-testid-based selectors, custom Playwright fixtures, UI-driven seeding]
key_files:
  created:
    - src/e2e/fixtures/app.fixture.ts
    - src/e2e/helpers/selectors.ts
    - src/e2e/helpers/seed.ts
  modified:
    - src/components/Navigation.tsx
    - src/components/workout/StartWorkout.tsx
    - src/components/workout/SetRow.tsx
    - src/components/workout/SetGrid.tsx
    - src/components/workout/WorkoutComplete.tsx
    - src/components/workout/ActiveWorkout.tsx
    - src/components/workout/ExerciseView.tsx
    - src/components/settings/DemoDataSection.tsx
    - src/components/backup/BackupSettings.tsx
    - src/components/rotation/QuickStartCard.tsx
    - src/components/templates/TemplateBuilder.tsx
    - src/components/templates/TemplateCard.tsx
    - src/components/ExerciseForm.tsx
    - src/components/GymForm.tsx
    - src/components/analytics/AnalyticsPage.tsx
    - src/components/DeleteConfirmation.tsx
    - playwright.config.ts
  deleted:
    - src/e2e/workout-flow.spec.ts
decisions:
  - "data-testid attributes added to DOM elements directly; UI components (Button, Input, Select) already spread ...rest props"
  - "ExerciseView.tsx also received active-exercise-name testid (16 components total, not 15)"
  - "Old workout-flow.spec.ts deleted -- used fragile text/CSS selectors incompatible with new infrastructure"
metrics:
  duration: "~8 minutes"
  completed: "2026-01-31"
---

# Phase 13 Plan 01: Test Infrastructure & Selectors Summary

**One-liner:** 48 data-testid attributes across 16 components plus shared Playwright fixtures, selector constants, and seed helpers for all E2E specs.

## What Was Done

### Task 1: Add data-testid attributes to production components (16 files)

Added `data-testid` attributes to all key interactive elements without changing any logic, styling, or structure. The `Button`, `Input`, and `Select` UI components already spread `...rest` props, so `data-testid` passes through cleanly to DOM elements.

**Attribute counts by component:**
- Navigation.tsx: 4 (nav tabs)
- StartWorkout.tsx: 3 (gym select, template select, start button)
- SetRow.tsx: 5 (weight, reps, rir inputs + remove button + PR badge)
- SetGrid.tsx: 3 (add set, first-time hint, loading ghost)
- WorkoutComplete.tsx: 6 (save, done, go-back, two headings, no-sets warning)
- ActiveWorkout.tsx: 1 (finish workout)
- ExerciseView.tsx: 1 (active exercise name)
- DemoDataSection.tsx: 2 (load demo, clear data)
- BackupSettings.tsx: 5 (export, import, file input, event count, import result)
- QuickStartCard.tsx: 3 (card container, quick start button, rotation info)
- TemplateBuilder.tsx: 2 (name input, create button)
- TemplateCard.tsx: 2 (menu button, delete option)
- ExerciseForm.tsx: 3 (name input, muscle select, add button)
- GymForm.tsx: 3 (name input, location input, add button)
- AnalyticsPage.tsx: 3 (exercise select, charts container, empty state)
- DeleteConfirmation.tsx: 2 (confirm, cancel)

**Total: 48 data-testid attributes**

### Task 2: Create E2E fixtures, helpers, and update Playwright config

**src/e2e/helpers/selectors.ts** (61 lines)
- `SEL` constant object with all 48 data-testid selectors
- `setRow(n)` dynamic selector factory for set-specific inputs

**src/e2e/fixtures/app.fixture.ts** (62 lines)
- `waitForApp()` -- waits for nav-workouts selector (30s timeout)
- `clearAllData()` -- navigates to Settings, clicks Clear, handles dialog, waits for reload
- `loadDemoData()` -- navigates to Settings, clicks Load Demo, handles dialog, waits for reload
- `test` fixture -- extends base test with `appPage` that auto-navigates and waits

**src/e2e/helpers/seed.ts** (50 lines)
- `createGym()` -- navigates to Settings, fills gym form, submits, waits for name
- `createExercise()` -- navigates to Settings, fills exercise form, submits, waits for name
- `logSet()` -- fills weight/reps/rir inputs for a given set number, triggers blur

**playwright.config.ts updates:**
- `timeout: 60_000` (60s per test for DuckDB-WASM operations)
- `expect: { timeout: 10_000 }` (10s for assertions)
- `screenshot: 'only-on-failure'`
- `video: 'retain-on-failure'`

**Deleted:** `src/e2e/workout-flow.spec.ts` -- outdated placeholder using fragile text/CSS selectors.

## Deviations from Plan

### Auto-added

**1. [Rule 2 - Missing Critical] Added data-testid to ExerciseView.tsx**
- Plan listed 15 components but `active-exercise-name` was specified for ActiveWorkout
- The exercise name heading is actually rendered in ExerciseView.tsx (child component)
- Added the testid to ExerciseView.tsx where the heading lives (16 components total)

## Verification Results

- `grep -r 'data-testid' src/components/ | wc -l` = 48 (requirement: 30+)
- `npm run build` passes cleanly
- `npm run test` passes (71/71 unit tests)
- `npx tsc --noEmit` passes with zero errors
- All 3 E2E helper files exist and are importable

## Commits

| # | Hash | Message |
|---|------|---------|
| 1 | 405f0fc | feat(13-01): add data-testid attributes to 16 production components |
| 2 | 38da9ab | feat(13-01): create E2E test infrastructure (fixtures, selectors, seed helpers) |
