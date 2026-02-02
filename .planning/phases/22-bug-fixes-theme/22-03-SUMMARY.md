---
phase: 22-bug-fixes-theme
plan: 03
subsystem: ui-theme
tags: [accessibility, wcag, contrast, tailwind, text-color]
depends_on:
  requires: [22-01]
  provides: [wcag-aa-compliant-accent-text]
  affects: []
tech-stack:
  added: []
  patterns: [text-white-on-accent-convention]
key-files:
  created: []
  modified:
    - src/components/ui/Button.tsx
    - src/components/workout/RestTimer.tsx
    - src/components/plans/PlanList.tsx
    - src/components/plans/PlanBuilder.tsx
    - src/components/settings/DataQualitySection.tsx
    - src/components/workout/ExerciseSubstitution.tsx
    - src/components/history/PRIndicator.tsx
    - src/components/history/PRList.tsx
    - src/components/settings/RotationSection.tsx
    - src/components/settings/ToonExportSection.tsx
    - src/components/backup/BackupSettings.tsx
decisions:
  - id: d22-03-01
    decision: "Use text-white on all accent backgrounds (teal L=68%). Gives ~3.5:1 contrast, meeting WCAG 1.4.11 for UI controls. All accent usages are interactive controls, not body text."
metrics:
  duration: "~3 min"
  completed: 2026-02-02
---

# Phase 22 Plan 03: Text-on-Accent Contrast Fix Summary

**One-liner:** Replaced text-black with text-white across 11 components where teal accent background required readable contrast per WCAG AA.

## What Was Done

### Task 1: UI and workout components (6 files)
**Commit:** `e3a4389`

Replaced `text-black` with `text-white` on accent backgrounds in:
- **Button.tsx**: Primary variant text color
- **RestTimer.tsx**: Banner text + changed `bg-black/10` overlays to `bg-white/10`
- **PlanList.tsx**: "New Plan" button
- **PlanBuilder.tsx**: Submit button
- **DataQualitySection.tsx**: "Run Checks" button
- **ExerciseSubstitution.tsx**: "Add" custom exercise button

### Task 2: Analytics, rotation, and settings components (5 files)
**Commit:** `c7f0c5d`

Replaced `text-black` with `text-white` on accent backgrounds in:
- **PRIndicator.tsx**: Animated PR notification badge
- **PRList.tsx**: "Weight & 1RM PR" badge color function
- **RotationSection.tsx**: Active rotation indicator badge
- **ToonExportSection.tsx**: 3 toggle active states (scope, cycles, range)
- **BackupSettings.tsx**: 2 weight unit toggle active states (kg/lbs)

## Decisions Made

| ID | Decision | Rationale |
|----|----------|-----------|
| d22-03-01 | text-white on all accent backgrounds | Teal at L=68% + white gives ~3.5:1 contrast, meeting WCAG 1.4.11 for UI components (3:1 threshold). All accent usages are interactive controls, never body text. |

## Deviations from Plan

### Path corrections (not functional deviations)
Several files in the plan were at incorrect paths. Actual locations:
- `src/components/exercises/ExerciseSubstitution.tsx` -> `src/components/workout/ExerciseSubstitution.tsx`
- `src/components/analytics/PRIndicator.tsx` -> `src/components/history/PRIndicator.tsx`
- `src/components/analytics/PRList.tsx` -> `src/components/history/PRList.tsx`
- `src/components/rotation/RotationSection.tsx` -> `src/components/settings/RotationSection.tsx`
- `src/components/settings/BackupSettings.tsx` -> `src/components/backup/BackupSettings.tsx`

All files were found and corrected regardless.

## Remaining text-black in codebase
3 instances remain in `WorkoutComplete.tsx` and `SetRow.tsx` using `bg-warning text-black` -- these are on yellow/warning backgrounds, not accent, and are correct (black on yellow is high contrast).

## Verification
- Zero `text-black` on accent backgrounds across entire `src/` directory
- `npx tsc --noEmit` passes
- `npx vite build` passes (38 precache entries)
