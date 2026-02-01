---
phase: 19
plan: 01
subsystem: types-data-layer
tags: [rename, types, hooks, stores, backward-compat]
requires: [phase-18]
provides: [plan-types, plan-hooks, plan-stores]
affects: [19-02, 19-03]
tech-stack:
  added: []
  patterns: [protected-string-preservation, git-mv-rename]
key-files:
  created:
    - src/types/plan.ts
    - src/hooks/usePlans.ts
  modified:
    - src/types/events.ts
    - src/types/workout-session.ts
    - src/db/queries.ts
    - src/db/demo-data.ts
    - src/services/toon-export.ts
    - src/hooks/useWorkoutSummary.ts
    - src/hooks/useRecentWorkout.ts
    - src/stores/useWorkoutStore.ts
    - src/stores/useRotationStore.ts
key-decisions:
  - template_id property names preserved across all interfaces and stores
  - event_type string literals preserved (template_created, template_updated, etc.)
  - SQL strings completely untouched
  - localStorage keys unchanged (gymlog-workout, gymlog-rotations)
duration: 5min
completed: 2026-02-01
---

# Phase 19 Plan 01: Foundation Rename (Types, Data Layer, Hooks, Stores) Summary

**Renamed all Template symbols to Plan across types, events, data layer, hooks, and stores while preserving all protected strings for backward compatibility.**

## Performance

- Duration: ~5 minutes
- Complexity: Medium (wide-reaching rename with strict preservation rules)
- TypeScript: Zero compile errors after rename (all downstream component refs are in Plan 02 scope)

## Accomplishments

1. **Type file renamed**: `src/types/template.ts` -> `src/types/plan.ts` with `Plan` and `PlanExercise` exports
2. **Event interfaces renamed**: `TemplateCreatedEvent` -> `PlanCreatedEvent` (and Updated, Deleted, Archived)
3. **Data layer updated**: `getTemplates()` -> `getPlans()` in queries.ts; local vars renamed in demo-data.ts and toon-export.ts
4. **Hook renamed**: `useTemplates.ts` -> `usePlans.ts` with full API: `createPlan`, `updatePlan`, `deletePlan`, `archivePlan`, `duplicatePlan`
5. **Stores updated**: `startWorkout(planId)` in workout store; `selectNextPlan` in rotation store
6. **All protected strings verified preserved**: event_type literals, template_id/template_ids properties, SQL strings, localStorage keys

## Task Commits

| Task | Name | Commit | Key Change |
|------|------|--------|------------|
| 1 | Rename types and event interfaces | f262afa | plan.ts, events.ts, workout-session.ts |
| 2 | Rename data layer, hooks, and stores | cb212d4 | queries, hooks, stores - 10 files |

## Decisions Made

1. **template_id property preserved everywhere**: The Plan interface still has `template_id` (not `plan_id`) because this is the stored key in events and localStorage
2. **Event union type updated**: GymLogEvent now references PlanCreatedEvent etc. instead of TemplateCreatedEvent
3. **RecentWorkout field renamed**: `templateName` -> `planName` with SQL alias `plan_name` (source column `t.name` unchanged)
4. **selectNextPlan return field**: Changed `templateId` -> `planId` in the selector return object

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. TypeScript compiled cleanly with zero errors after the rename, indicating all non-component imports were correctly updated.

## Next Phase Readiness

**Plan 19-02** can proceed immediately:
- All type exports are ready at `src/types/plan.ts`
- All hooks are ready at `src/hooks/usePlans.ts`
- Component files still reference old names (useTemplates, getTemplates, selectNextTemplate) - these are the scope of Plan 02
- Component directory `src/components/templates/` needs renaming to `src/components/plans/`
