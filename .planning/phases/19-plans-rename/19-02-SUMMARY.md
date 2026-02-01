---
phase: 19
plan: 02
subsystem: components-ui
tags: [rename, components, ui-text, imports, data-testid]
requires: [19-01]
provides: [plan-components, plan-navigation, plan-ui-text]
affects: [19-03]
tech-stack:
  added: []
  patterns: [git-mv-rename, protected-string-preservation]
key-files:
  created:
    - src/components/plans/PlanList.tsx
    - src/components/plans/PlanCard.tsx
    - src/components/plans/PlanBuilder.tsx
  modified:
    - src/components/plans/ExerciseList.tsx
    - src/components/plans/ExerciseRow.tsx
    - src/App.tsx
    - src/components/Navigation.tsx
    - src/components/workout/StartWorkout.tsx
    - src/components/workout/ActiveWorkout.tsx
    - src/components/workout/WorkoutComplete.tsx
    - src/components/workout/ExerciseView.tsx
    - src/components/workout/SetGrid.tsx
    - src/components/workout/RestTimer.tsx
    - src/components/workout/ExerciseSubstitution.tsx
    - src/components/workout/ProgressionAlert.tsx
    - src/components/workout/RecentWorkoutCard.tsx
    - src/components/rotation/RotationEditor.tsx
    - src/components/rotation/QuickStartCard.tsx
    - src/components/settings/RotationSection.tsx
    - src/components/settings/ToonExportSection.tsx
    - src/components/settings/DemoDataSection.tsx
key-decisions:
  - template_id property names preserved across all component props and lookups
  - templateIds prop on RotationEditor preserved (maps to template_ids stored property)
  - selectNextPlan.templateId field preserved (backward compat with rotation store)
duration: 11min
completed: 2026-02-01
---

# Phase 19 Plan 02: Component Directory Rename and Consumer Updates Summary

**Renamed all component files from Template* to Plan* and updated every consumer component so all UI text shows "Plans" instead of "Templates", with zero TypeScript errors.**

## Performance

- Duration: ~11 minutes
- TypeScript: 0 errors after all changes
- Files modified: 21 total (5 renamed + 16 updated)

## Accomplishments

1. Renamed src/components/templates/ directory to src/components/plans/ using git mv
2. Renamed TemplateList.tsx to PlanList.tsx, TemplateCard.tsx to PlanCard.tsx, TemplateBuilder.tsx to PlanBuilder.tsx
3. Updated all internal component references (imports, types, props, variables, UI text)
4. Updated Navigation tab: 'plans' type, nav-plans data-testid, "Plans" label
5. Updated App.tsx: usePlans hook, PlanList import, plans tab rendering
6. Updated all workout components (StartWorkout, ActiveWorkout, WorkoutComplete, ExerciseView, SetGrid)
7. Updated rotation components (RotationEditor, QuickStartCard)
8. Updated settings components (RotationSection, DemoDataSection, ToonExportSection)
9. Updated all data-testid values (btn-plan-menu, btn-plan-delete, plan-name-input, btn-create-plan, plan-select, nav-plans)

## Task Commits

| Task | Name | Commit | Key Changes |
|------|------|--------|-------------|
| 1 | Rename component directory and files | 11ea35b | git mv templates/ to plans/, renamed 3 component files, updated internal references |
| 2 | Update App, Navigation, and all consumer components | c891ad3 | Updated 16 consumer files with Plan terminology |

## Files Created/Modified

**Renamed (git mv):**
- src/components/templates/TemplateList.tsx -> src/components/plans/PlanList.tsx
- src/components/templates/TemplateCard.tsx -> src/components/plans/PlanCard.tsx
- src/components/templates/TemplateBuilder.tsx -> src/components/plans/PlanBuilder.tsx
- src/components/templates/ExerciseList.tsx -> src/components/plans/ExerciseList.tsx
- src/components/templates/ExerciseRow.tsx -> src/components/plans/ExerciseRow.tsx

**Modified:**
- src/App.tsx - usePlans, PlanList, plans tab
- src/components/Navigation.tsx - 'plans' tab, nav-plans
- src/components/workout/StartWorkout.tsx - plans prop, selectNextPlan
- src/components/workout/ActiveWorkout.tsx - plan prop, planExercises
- src/components/workout/WorkoutComplete.tsx - plan prop
- src/components/workout/ExerciseView.tsx - PlanExercise type, planExercise prop
- src/components/workout/SetGrid.tsx - planSetCount prop
- src/components/workout/RestTimer.tsx - comment update
- src/components/workout/ExerciseSubstitution.tsx - comment update
- src/components/workout/ProgressionAlert.tsx - comment update
- src/components/workout/RecentWorkoutCard.tsx - planName field
- src/components/rotation/RotationEditor.tsx - plans prop, planName
- src/components/rotation/QuickStartCard.tsx - plans prop, selectNextPlan
- src/components/settings/RotationSection.tsx - usePlans, activePlans
- src/components/settings/ToonExportSection.tsx - rotationPlanIds variable
- src/components/settings/DemoDataSection.tsx - updated text

## Decisions Made

1. **template_id property preserved everywhere** - Component props still use `template_id` for lookups since the stored data uses this key
2. **templateIds prop on RotationEditor kept** - Maps directly to `template_ids` stored property on Rotation objects
3. **selectNextPlan.templateId preserved** - The return field from the rotation store selector keeps this name for backward compatibility
4. **PlanFormData renamed from TemplateFormData** - Zod schema and form type updated consistently

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Next Phase Readiness

Plan 19-03 (test file updates) can proceed. All component renames complete with zero TypeScript errors in source files. Test files may still reference old names (TemplateList, useTemplates, etc.) and need updating.
