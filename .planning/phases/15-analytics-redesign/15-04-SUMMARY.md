---
phase: 15-analytics-redesign
plan: 04
subsystem: ui
tags: [recharts, oklch, volume-zones, bar-chart, heat-map, css-tokens]

# Dependency graph
requires:
  - phase: 15-01
    provides: SQL factory functions with days param
  - phase: 15-02
    provides: useVolumeAnalytics with volumeAvgData, useVolumeZoneThresholds hook
  - phase: 15-03
    provides: TimeRangePicker, SummaryStatsCards, VolumeLegend, SectionHeading UI components
provides:
  - VolumeBarChart with per-bar 5-zone coloring via Recharts Cell
  - MuscleHeatMap with 5-zone OKLCH colors and per-muscle-group thresholds
  - ChartContainer with minHeight prop support
  - ExerciseProgressChart with OKLCH tooltip and axis tokens
affects: [15-05-integration-testing, future analytics page assembly]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Per-bar coloring via Recharts Cell component with zone-based color mapping"
    - "OKLCH color values directly in SVG (CSS variables don't work in SVG fill)"
    - "5-zone volume classification: under/minimum/optimal/high/over"

key-files:
  created: []
  modified:
    - src/components/analytics/VolumeBarChart.tsx
    - src/components/analytics/MuscleHeatMap.tsx
    - src/components/analytics/ChartContainer.tsx
    - src/components/analytics/ExerciseProgressChart.tsx
    - src/components/analytics/AnalyticsPage.tsx

key-decisions:
  - "VolumeBarChart uses Cell component for per-bar coloring instead of ReferenceArea global zones"
  - "MuscleHeatMap uses direct OKLCH values for SVG fill (CSS variables unreliable in SVG)"
  - "MuscleHeatMap accepts getThresholds function prop instead of full UseVolumeThresholdsReturn"

patterns-established:
  - "Zone color mapping: ZONE_COLORS Record<VolumeZone, string> with CSS variable references"
  - "SVG OKLCH fallback: use oklch() directly for SVG fill, CSS variables for HTML elements"

# Metrics
duration: 8min
completed: 2026-02-01
---

# Phase 15 Plan 04: Chart Components Summary

**VolumeBarChart rewritten with per-bar 5-zone Cell coloring, MuscleHeatMap migrated to 5-zone OKLCH, all chart components using OKLCH tokens**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-01T10:12:54Z
- **Completed:** 2026-02-01T10:20:44Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- VolumeBarChart completely rewritten: single bar per muscle group with per-bar zone colors via Recharts Cell, replacing grouped weekly bars with global ReferenceArea zones
- MuscleHeatMap upgraded from 3-zone HSL to 5-zone OKLCH color system with per-muscle-group thresholds
- All hardcoded HSL colors eliminated from VolumeBarChart, MuscleHeatMap, and ExerciseProgressChart
- ChartContainer now supports minHeight prop for flexible chart section heights

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite VolumeBarChart with per-bar 5-zone coloring** - `456f14c` (feat)
2. **Task 2: Update MuscleHeatMap, ChartContainer, and ExerciseProgressChart colors** - `95a031e` (feat)

## Files Created/Modified
- `src/components/analytics/VolumeBarChart.tsx` - Rewritten: single bar per muscle group with Cell-based 5-zone coloring
- `src/components/analytics/MuscleHeatMap.tsx` - 5-zone OKLCH colors, getThresholds prop, updated zone legend
- `src/components/analytics/ChartContainer.tsx` - Added minHeight prop support
- `src/components/analytics/ExerciseProgressChart.tsx` - Tooltip and axis colors migrated to OKLCH tokens
- `src/components/analytics/AnalyticsPage.tsx` - Updated to pass volumeAvgData and getThresholds to chart components

## Decisions Made
- Used Cell component for per-bar coloring (Recharts pattern for individual bar colors)
- Used direct OKLCH values in SVG fill for MuscleHeatMap body diagram (CSS custom properties are unreliable in SVG context)
- Changed MuscleHeatMap prop from `thresholds: UseVolumeThresholdsReturn` to `getThresholds: (muscleGroup: string) => VolumeZoneThresholds` for cleaner API alignment with the new 5-zone system

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Updated AnalyticsPage caller props for VolumeBarChart**
- **Found during:** Task 1 (VolumeBarChart rewrite)
- **Issue:** AnalyticsPage passed old `volumeData` and `thresholds` props; VolumeBarChart now takes `VolumeByMuscleGroupAvg[]`
- **Fix:** Destructured `volumeAvgData` from useVolumeAnalytics, removed unused `volumeData`
- **Files modified:** src/components/analytics/AnalyticsPage.tsx
- **Verification:** `npx tsc --noEmit` passes, `npm run build` succeeds
- **Committed in:** 456f14c (Task 1 commit)

**2. [Rule 3 - Blocking] Updated AnalyticsPage caller props for MuscleHeatMap**
- **Found during:** Task 2 (MuscleHeatMap update)
- **Issue:** AnalyticsPage passed `thresholds={volumeThresholds}` but MuscleHeatMap now expects `getThresholds` function
- **Fix:** Added `useVolumeZoneThresholds` import and wired `getThresholds` to MuscleHeatMap
- **Files modified:** src/components/analytics/AnalyticsPage.tsx
- **Verification:** `npx tsc --noEmit` passes, `npm run build` succeeds
- **Committed in:** 95a031e (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes necessary to maintain compilation after prop interface changes. No scope creep.

## Issues Encountered
- TypeScript strictness caught `value: number` in Tooltip formatter (Recharts passes `number | undefined`); fixed to `number | undefined` with nullish coalesce

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All chart components now use OKLCH tokens and 5-zone volume system
- Ready for 15-05 (integration testing) to verify end-to-end analytics page assembly
- VolumeZoneIndicator component still uses old 2-zone thresholds (may need update in 15-05)

---
*Phase: 15-analytics-redesign*
*Completed: 2026-02-01*
