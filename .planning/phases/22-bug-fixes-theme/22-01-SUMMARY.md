---
phase: 22-bug-fixes-theme
plan: 01
subsystem: theme-and-rotation
tags: [oklch, color-tokens, teal, rotation-bug, quick-start]
depends_on: []
provides:
  - Complete teal OKLCH color system in index.css
  - Fixed planId property access in QuickStartCard and StartWorkout
affects:
  - 22-02 (HSL consumer migration in ExerciseProgressChart)
  - 22-03 (theme propagation to component files)
  - All components using Tailwind accent/bg/text/border utility classes
tech_stack:
  added: []
  patterns:
    - "OKLCH hue 185 teal accent palette"
    - "OKLCH hue 220 cool neutral backgrounds"
    - "Zero-chroma neutral text hierarchy"
key_files:
  created: []
  modified:
    - src/index.css
    - src/components/rotation/QuickStartCard.tsx
    - src/components/workout/StartWorkout.tsx
decisions:
  - id: d22-01-01
    decision: "Teal accent at oklch(68% 0.10 185) -- L=68% keeps text-black readable (~5:1 contrast)"
  - id: d22-01-02
    decision: "Volume zones use teal gradient (light-to-dark) instead of rainbow (red/yellow/green/orange/red)"
  - id: d22-01-03
    decision: "Legacy HSL tokens removed now; ExerciseProgressChart consumers migrated in Plan 02"
metrics:
  duration: "~5 min"
  completed: 2026-02-02
---

# Phase 22 Plan 01: Fix Rotation Bug + Teal Color Token Overhaul Summary

**One-liner:** Fixed Quick Start planId bug and replaced entire warm orange OKLCH palette with cool blue/teal tokens (hue 185 accent, hue 220 backgrounds, zero-chroma text).

## Tasks Completed

| # | Task | Commit | Key Changes |
|---|------|--------|-------------|
| 1 | Fix rotation templateId->planId bug | `0fa4e03` | 3 replacements in QuickStartCard, 1 in StartWorkout |
| 2 | Overhaul index.css to blue/teal palette | `6153f71` | All color tokens, border radius, shadows, gradients |

## What Changed

### Task 1: Rotation Bug Fix
The `selectNextPlan` selector in the rotation store already returned `{ planId }`, but two consumer components were still accessing the old `templateId` property. This caused the Quick Start card to always show "plan or gym not found" even when both were configured.

**Root cause:** Property rename in store not propagated to consumers.

### Task 2: Color Token Overhaul
Complete replacement of the warm orange theme with a cool teal palette:

| Token Group | Before | After |
|-------------|--------|-------|
| Backgrounds | hue 60, chroma 0.01-0.012 | hue 220, chroma 0.005 |
| Text | warm tint (hue 60) | pure neutral (chroma 0) |
| Borders | hue 60, chroma 0.01 | hue 220, chroma 0.005 |
| Accent | orange hue 45, chroma 0.19 | teal hue 185, chroma 0.10 |
| Chart primary | blue hue 250 | teal hue 185 |
| Volume zones | rainbow (red/yellow/green/orange/red) | teal gradient (light-to-dark) |
| Border radius | 8/12/16px | 6/10/12px |
| Shadows | heavy (0.25-0.4 opacity) | minimal (0.1-0.3 opacity) |

**Removed:** 4 legacy HSL tokens (`--chart-primary`, `--chart-success`, `--chart-muted`, `--accent`). These are still referenced by `ExerciseProgressChart.tsx` -- Plan 02 migrates those consumers.

## Deviations from Plan

None -- plan executed exactly as written.

## Verification Results

- TypeScript: `npx tsc --noEmit` passes with zero errors
- Build: `npx vite build` succeeds (38 precache entries)
- No orange hue 45 remnants in index.css
- No legacy HSL tokens in index.css
- 10 teal (hue 185) token references confirmed

## Next Phase Readiness

Plan 02 must migrate `ExerciseProgressChart.tsx` from `hsl(var(--chart-*))` and `hsl(var(--accent))` to OKLCH token references, or the chart will have broken colors.
