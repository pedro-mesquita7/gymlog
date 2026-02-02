---
phase: 22-bug-fixes-theme
plan: 04
subsystem: theme-border-radius
tags: [tailwind, border-radius, rounded-xl, apple-subtle]
depends_on: ["22-01"]
provides:
  - Consistent 12px border radius across all surfaces
affects:
  - Any future components should use rounded-xl (not rounded-2xl)
tech_stack:
  added: []
  patterns:
    - "rounded-xl (12px) as standard surface radius"
key_files:
  created: []
  modified:
    - src/App.tsx
    - src/components/DeleteConfirmation.tsx
    - src/components/ExerciseForm.tsx
    - src/components/GymForm.tsx
    - src/components/analytics/AnalyticsPage.tsx
    - src/components/analytics/ComparisonStatCard.tsx
    - src/components/analytics/ExerciseProgressChart.tsx
    - src/components/analytics/MuscleHeatMap.tsx
    - src/components/analytics/PRListCard.tsx
    - src/components/analytics/ProgressionDashboard.tsx
    - src/components/analytics/ProgressionStatusCard.tsx
    - src/components/analytics/SummaryStatsCards.tsx
    - src/components/analytics/VolumeLegend.tsx
    - src/components/analytics/VolumeZoneIndicator.tsx
    - src/components/analytics/WeekComparisonCard.tsx
    - src/components/backup/BackupSettings.tsx
    - src/components/history/ExerciseHistory.tsx
    - src/components/plans/PlanBuilder.tsx
    - src/components/plans/PlanList.tsx
    - src/components/rotation/QuickStartCard.tsx
    - src/components/rotation/RotationEditor.tsx
    - src/components/settings/DataQualitySection.tsx
    - src/components/settings/DemoDataSection.tsx
    - src/components/settings/ObservabilitySection.tsx
    - src/components/settings/RotationSection.tsx
    - src/components/settings/ToonExportSection.tsx
    - src/components/ui/Button.tsx
    - src/components/ui/Card.tsx
    - src/components/ui/CollapsibleSection.tsx
    - src/components/ui/Dialog.tsx
    - src/components/ui/ErrorCard.tsx
    - src/components/workout/ExerciseSubstitution.tsx
    - src/components/workout/ProgressionAlert.tsx
    - src/components/workout/RecentWorkoutCard.tsx
    - src/components/workout/RestTimer.tsx
    - src/components/workout/SetRow.tsx
    - src/components/workout/WorkoutComplete.tsx
decisions: []
metrics:
  duration: "~2 min"
  completed: 2026-02-02
---

# Phase 22 Plan 04: Replace rounded-2xl with rounded-xl Summary

**One-liner:** Bulk-replaced all 57 rounded-2xl (16px) occurrences with rounded-xl (12px) across 36 files for Apple-subtle border radius consistency.

## Tasks Completed

| # | Task | Commit | Key Changes |
|---|------|--------|-------------|
| 1 | Replace all rounded-2xl with rounded-xl | `9273158` | 57 replacements across 36 files, zero rounded-2xl remaining |

## What Changed

### Task 1: Bulk Border Radius Replacement

Mechanical find-and-replace of Tailwind's `rounded-2xl` class (16px) with `rounded-xl` (12px) across the entire `src/` directory. This ensures all cards, dialogs, buttons, alerts, and surfaces use the Apple-subtle 12px radius established by the `--radius-lg` token in Plan 01.

**Scope:** 57 occurrences across 36 files (plan estimated ~108 occurrences across ~44 files; the higher estimate likely included files outside `src/` or double-counted). The resulting codebase has exactly 108 `rounded-xl` instances total (including pre-existing ones plus the 57 new replacements).

**Also checked:** Zero `rounded-3xl` instances existed, so no downshift needed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Additional files not listed in plan**
- **Found during:** Task 1
- **Issue:** 6 additional files contained `rounded-2xl` beyond the plan's file list: `ExerciseProgressChart.tsx`, `VolumeZoneIndicator.tsx`, `PlanBuilder.tsx`, `PlanList.tsx`, `ExerciseSubstitution.tsx`, `RestTimer.tsx`
- **Fix:** Included them in the bulk replacement (they need the same treatment)
- **Impact:** None -- consistent radius everywhere

## Verification Results

- `grep -rn "rounded-2xl" src/` returns zero results
- `grep -rn "rounded-xl" src/ | wc -l` returns 108
- `npx vite build` succeeds (38 precache entries)

## Next Phase Readiness

No blockers. All surfaces now use consistent 12px border radius.
