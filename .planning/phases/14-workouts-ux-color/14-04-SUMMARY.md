---
phase: 14-workouts-ux-color
plan: 04
subsystem: ui
tags: [react, duckdb, ux, accordion, quick-start, layout]

requires:
  - phase: 14-02
    provides: Semantic color token migration for workout components
provides:
  - Hero QuickStartCard with edit mode for one-tap workout start
  - RecentWorkoutCard compact summary of last completed workout
  - useRecentWorkout hook querying DuckDB fact_workouts
  - Collapsed "Browse all templates" accordion for manual selection
  - Compact Workouts tab layout with more above-the-fold content
affects: [14-05, e2e-tests]

tech-stack:
  added: []
  patterns: [details/summary accordion for secondary UI, edit-mode toggle pattern]

key-files:
  created:
    - src/hooks/useRecentWorkout.ts
    - src/components/workout/RecentWorkoutCard.tsx
  modified:
    - src/components/rotation/QuickStartCard.tsx
    - src/components/workout/StartWorkout.tsx
    - src/App.tsx

key-decisions:
  - "QuickStartCard edit mode uses local state, does not modify rotation"
  - "Browse all templates uses native <details>/<summary> for zero-JS accordion"
  - "RecentWorkoutCard returns null when no data, not a loading skeleton"

patterns-established:
  - "Edit toggle pattern: pencil icon reveals inline selectors without navigation"
  - "Native details/summary accordion for collapsible secondary content"

duration: 8min
completed: 2026-02-01
---

# Phase 14 Plan 04: Workouts Tab UX Redesign Summary

**Hero QuickStartCard with edit mode, recent workout summary card, and collapsed Browse Templates accordion for compact one-tap Workouts tab**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-01T00:38:40Z
- **Completed:** 2026-02-01T00:47:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- QuickStartCard redesigned as hero element with p-6 padding, text-2xl bold, and pencil edit toggle
- Edit mode reveals gym/template dropdowns without changing rotation state
- RecentWorkoutCard shows last workout template name, relative date, exercises, sets, volume, duration
- Manual template selection collapsed behind native details/summary accordion
- Workouts tab spacing compacted from space-y-12 to space-y-8
- All 7 data-testid E2E selectors preserved plus new btn-edit-quick-start

## Task Commits

Each task was committed atomically:

1. **Task 1: Create useRecentWorkout hook and RecentWorkoutCard** - `e0ba74d` (feat)
2. **Task 2: Redesign QuickStartCard as hero + restructure StartWorkout layout** - `7380e72` (feat)

## Files Created/Modified
- `src/hooks/useRecentWorkout.ts` - Hook querying most recent completed workout from DuckDB
- `src/components/workout/RecentWorkoutCard.tsx` - Compact recent workout summary card
- `src/components/rotation/QuickStartCard.tsx` - Hero card with edit mode toggle
- `src/components/workout/StartWorkout.tsx` - Restructured layout with accordion
- `src/App.tsx` - Reduced outer spacing for compact layout

## Decisions Made
- QuickStartCard edit mode uses local state only -- does not modify the rotation itself, just overrides template/gym for this session start
- Used native HTML `<details>/<summary>` for accordion instead of a JS component, keeping bundle size zero-impact
- RecentWorkoutCard returns null (renders nothing) when no completed workouts exist rather than showing a skeleton

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Workouts tab UX redesign complete, ready for visual verification
- All E2E test selectors preserved (gym-select, template-select, btn-start-workout now inside accordion)
- E2E tests that interact with manual selectors may need to open the accordion first

---
*Phase: 14-workouts-ux-color*
*Completed: 2026-02-01*
