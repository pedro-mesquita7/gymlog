---
phase: 22-bug-fixes-theme
plan: 02
subsystem: theme-colors
tags: [oklch, teal, charts, color-tokens, recharts, svg]
dependency-graph:
  requires: ["22-01"]
  provides: ["chart-color-migration", "teal-gradient-heatmap", "zone-indicator-tokens"]
  affects: ["22-05"]
tech-stack:
  patterns: ["oklch-color-system", "css-custom-properties-in-recharts", "tailwind-v4-theme-tokens"]
key-files:
  modified:
    - src/components/analytics/ExerciseProgressChart.tsx
    - src/components/analytics/MuscleHeatMap.tsx
    - src/components/analytics/VolumeZoneIndicator.tsx
    - src/components/ExerciseForm.tsx
decisions:
  - id: d22-02-01
    decision: "MuscleHeatMap keeps hardcoded OKLCH strings (not CSS vars) for SVG fill compatibility"
  - id: d22-02-02
    decision: "VolumeZoneIndicator maps 3-zone model to bg-chart-zone-under/optimal/high classes"
metrics:
  duration: ~3min
  completed: 2026-02-02
---

# Phase 22 Plan 02: Chart & Form Color Migration Summary

Migrated all hardcoded legacy HSL and rainbow colors in chart components and ExerciseForm to the teal OKLCH token system established in Plan 01.

## What Was Done

### Task 1: ExerciseProgressChart HSL to OKLCH tokens
- Replaced all `hsl(var(--accent))` references with `var(--color-accent)`
- Replaced `hsl(var(--chart-success))` with `var(--color-chart-success)`
- Replaced `hsl(var(--chart-primary))` with `var(--color-chart-primary)`
- Zero `hsl(var(` patterns remain in the file
- **Commit:** `e87b577`

### Task 2: MuscleHeatMap, VolumeZoneIndicator, ExerciseForm
- **MuscleHeatMap:** Replaced red/yellow/green/orange OKLCH zone colors with teal gradient (hue 185), lightness range 80%-38%. Updated default SVG fill from warm gray (hue 60) to cool neutral (hue 220).
- **VolumeZoneIndicator:** Replaced semantic `bg-error`/`bg-success`/`bg-warning` classes with `bg-chart-zone-under`/`bg-chart-zone-optimal`/`bg-chart-zone-high` classes that map to the OKLCH zone tokens.
- **ExerciseForm:** Replaced `bg-orange-950/30` with `bg-teal-950/30`.
- **Commit:** Changes absorbed into `9273158` (22-04 style commit ran concurrently)

## Decisions Made

| ID | Decision | Rationale |
|----|----------|-----------|
| d22-02-01 | MuscleHeatMap uses hardcoded OKLCH strings, not CSS vars | SVG fill attributes may not resolve CSS custom properties in all browsers |
| d22-02-02 | VolumeZoneIndicator 3-zone model maps to under/optimal/high | Component only has 3 zones; maps naturally to the 5-zone token subset |

## Deviations from Plan

None -- plan executed exactly as written.

## Verification Results

1. `grep "hsl(var" ExerciseProgressChart.tsx` -- zero results
2. `grep "185" MuscleHeatMap.tsx` -- returns teal OKLCH values (10 matches)
3. `grep "var(--color-" ExerciseProgressChart.tsx` -- returns accent, chart-primary, chart-success references
4. No orange, no legacy HSL in any modified file
5. `npx tsc --noEmit` -- passes
6. `npx vite build` -- passes

## Next Phase Readiness

Plan 02 complete. All chart components and forms now use the teal palette. No blockers for remaining plans.
