---
phase: 19
plan: 03
subsystem: tests-verification
tags: [rename, tests, e2e, grep-audit, data-testid]
requires: [19-01, 19-02]
provides: [verified-rename, clean-grep-audit, updated-e2e-selectors]
affects: []
tech-stack:
  added: []
  patterns: [protected-string-audit, data-testid-synchronization]
key-files:
  created: []
  modified:
    - src/components/workout/StartWorkout.test.tsx
    - src/components/ui/ErrorCard.test.tsx
    - src/e2e/helpers/selectors.ts
    - src/e2e/plan-crud.spec.ts
    - src/e2e/batch-logging.spec.ts
    - src/e2e/workout-rotation.spec.ts
    - src/types/events.ts
    - src/types/workout-session.ts
    - src/services/toon-export.ts
    - src/hooks/useWorkoutSummary.ts
    - src/db/demo-data.ts
key-decisions:
  - templateId/templateIds prop names preserved (backward compat with stored template_ids)
  - Test fixture ID strings like 'template-1' preserved (arbitrary test values matching protected template_id property)
  - SQL CTE names (template_events) preserved (reference protected event_type literals)
  - toon-export interface property renamed template->plan (export format, not stored data)
  - TEMPLATES_SQL variable renamed to PLANS_SQL
duration: ~8 min
completed: 2026-02-01
---

# Phase 19 Plan 03: Test Updates and Grep Audit Summary

**One-liner:** Updated all test files with Plan terminology, verified 71 unit tests pass, all E2E selectors synchronized, and grep audit confirms zero unprotected Template references remain.

## Performance

- Start: 2026-02-01T21:53:11Z
- End: 2026-02-01T22:01:34Z
- Duration: ~8 min
- Tasks: 2/2 completed

## Accomplishments

1. Updated StartWorkout.test.tsx: imported Plan type, renamed mockTemplates->mockPlans, updated all props from templates->plans, updated UI text assertions to match new "No plans yet" / "Create one in the Plans tab" text
2. Updated ErrorCard.test.tsx: changed FeatureErrorBoundary feature="Templates" to feature="Plans" in recovery test
3. Updated E2E selectors.ts: renamed 6 selector constants and their data-testid values (navTemplates->navPlans, templateSelect->planSelect, templateNameInput->planNameInput, btnCreateTemplate->btnCreatePlan, btnTemplateMenu->btnPlanMenu, btnTemplateDelete->btnPlanDelete)
4. Updated 3 E2E spec files: plan-crud, batch-logging, workout-rotation - all selectors, UI button text, comments, and variable names updated
5. Verified all 6 data-testid pairs synchronized between components and selectors
6. Cleaned up additional unprotected references: toon-export.ts interface property, comments in events.ts, workout-session.ts, useWorkoutSummary.ts, demo-data.ts
7. TypeScript compiles with zero errors
8. All 71 unit tests pass across 7 test files

## Task Commits

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Update unit tests and test fixtures | 8668432 | StartWorkout.test.tsx, ErrorCard.test.tsx |
| 2 | Update E2E tests and run full verification | 31b4dd2 | selectors.ts, plan-crud.spec.ts, batch-logging.spec.ts, workout-rotation.spec.ts, toon-export.ts, events.ts, workout-session.ts |

## Files Modified

- `src/components/workout/StartWorkout.test.tsx` -- Plan type import, mockPlans, updated props/assertions
- `src/components/ui/ErrorCard.test.tsx` -- FeatureErrorBoundary feature="Plans"
- `src/e2e/helpers/selectors.ts` -- 6 selector renames with plan- prefix data-testids
- `src/e2e/plan-crud.spec.ts` -- Plan CRUD test with new selectors and UI text
- `src/e2e/batch-logging.spec.ts` -- Batch logging test with plan terminology
- `src/e2e/workout-rotation.spec.ts` -- Rotation test with plan terminology
- `src/types/events.ts` -- Comment: Template's exercise -> Plan's exercise
- `src/types/workout-session.ts` -- Comment: Template's exercise -> Plan's exercise
- `src/services/toon-export.ts` -- Interface property template->plan, TEMPLATES_SQL->PLANS_SQL, comment updates
- `src/hooks/useWorkoutSummary.ts` -- Comment: same template -> same plan
- `src/db/demo-data.ts` -- Comment: Templates -> Plans

## Decisions Made

1. **templateId/templateIds props preserved**: These map to stored `template_ids` in localStorage rotation data. Renaming would break existing user data.
2. **Test fixture ID strings preserved**: Values like `'template-1'` are arbitrary test IDs that match the `template_id` property on Plan objects -- the property name is protected.
3. **SQL CTE names preserved**: `template_events` in SQL queries references `template_created`/`template_deleted` event type literals which are protected.
4. **toon-export interface property renamed**: `template: string` -> `plan: string` in the AI export format since this is a generated output format, not stored data.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Additional unprotected references in non-test files**
- **Found during:** Task 2 grep audit
- **Issue:** Comments in events.ts, workout-session.ts, useWorkoutSummary.ts, demo-data.ts still referenced "Template"; toon-export.ts had `template` interface property and `TEMPLATES_SQL` variable name
- **Fix:** Updated all comments and renamed toon-export interface property and SQL variable
- **Files modified:** events.ts, workout-session.ts, toon-export.ts, useWorkoutSummary.ts, demo-data.ts
- **Commit:** 31b4dd2

## Issues Encountered

- E2E tests (Playwright) were not executed as they require a running dev server and browser environment. Tests were listed successfully and selectors verified synchronized. E2E execution should be done manually or in CI.

## Grep Audit Results

All remaining "template" references in `src/` are confirmed protected:
- `template_id` property names (Plan interface, WorkoutSession, event payloads)
- `template_ids` property names (Rotation stored data)
- `templateId`/`templateIds` variable/prop names (backward compat with stored data)
- `template_created`/`template_updated`/`template_deleted`/`template_archived` event type literals
- `template_events` SQL CTE names (reference protected event types)
- `payload->>'template_id'` SQL strings
- `rotationTemplateIds` parameter names (match stored `template_ids`)
- Test fixture ID strings (`'template-1'`, `'template-2'`) matching protected `template_id` property values

## Next Phase Readiness

Phase 19 (Plans Rename) is now complete:
- 19-01: Types, events, data layer, hooks, stores renamed
- 19-02: Components renamed, all UI text updated, all data-testids updated
- 19-03: Tests updated, compiler clean, grep audit verified

Ready to proceed to Phase 20 (UX Restructure) or Phase 21 (Comparison Analytics).
