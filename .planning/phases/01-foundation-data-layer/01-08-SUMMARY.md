---
phase: 01-foundation-data-layer
plan: 08
subsystem: ui
tags: [react, duckdb, event-sourcing, gym-exercises]

# Dependency graph
requires:
  - phase: 01-foundation-data-layer/01-05
    provides: Gym management UI and data layer
  - phase: 01-foundation-data-layer/01-04
    provides: Exercise management with is_global flag
provides:
  - Exercise count per gym in gym list
  - Event count display in header
  - Enhanced delete confirmation with impact warning
affects: [02-tracking-analytics]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - SQL JOIN for aggregating exercise counts per gym
    - Event count as user feedback for event sourcing

key-files:
  created: []
  modified:
    - src/types/database.ts
    - src/db/queries.ts
    - src/components/GymList.tsx
    - src/App.tsx

key-decisions:
  - "DEV-011: Calculate exercise count via LEFT JOIN in query rather than separate fetch (single round trip)"

patterns-established:
  - "Exercise count aggregation: JOIN gym-specific exercises (is_global=false) to gym list"
  - "Event count display: Show event sourcing activity in header for user feedback"

# Metrics
duration: 2min
completed: 2026-01-28
---

# Phase 1 Plan 8: UX Gap Closure Summary

**Exercise count per gym and event count in header for user feedback on event sourcing activity**

## Performance

- **Duration:** 2 min
- **Started:** 2026-01-28T11:05:39Z
- **Completed:** 2026-01-28T11:07:42Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- Gym interface includes exercise_count field with proper typing
- getGyms() query calculates exercise count via SQL JOIN (gym-specific exercises only)
- GymList displays "N exercises" below each gym with proper singular/plural
- Delete confirmation shows affected exercise count as warning
- Header displays total event count next to demo mode badge

## Task Commits

Each task was committed atomically:

1. **Task 1: Add exercise count to Gym type and query** - `f206c0b` (feat)
2. **Task 2: Display exercise count in GymList component** - `45b0d13` (feat)
3. **Task 3: Display event count in App header** - `009a7ce` (feat)

## Files Created/Modified
- `src/types/database.ts` - Added exercise_count field to Gym interface
- `src/db/queries.ts` - New GYMS_WITH_EXERCISE_COUNT_SQL query with JOIN
- `src/components/GymList.tsx` - Display exercise count and enhanced delete message
- `src/App.tsx` - Display event count in header

## Decisions Made
- DEV-011: Calculate exercise count via SQL JOIN rather than separate fetch for efficiency

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 1 foundation complete
- All UX gaps identified in 01-VERIFICATION.md now closed
- Ready for Phase 2 tracking and analytics features

---
*Phase: 01-foundation-data-layer*
*Completed: 2026-01-28*
