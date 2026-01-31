---
phase: 10-workout-features-demo-data
plan: 02
subsystem: ui
tags: [react, zustand, rotation, workout-flow]

# Dependency graph
requires:
  - phase: 10-01
    provides: useRotationStore with selectNextTemplate selector and defaultGymId state
provides:
  - QuickStartCard component with rotation-aware one-tap workout start
  - StartWorkout pre-fills gym and template from active rotation
  - Helpful hints when rotation or default gym not configured
affects: [10-03-demo-data, 10-04-rotation-advance, workout-flow]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Rotation-aware UI components using selectNextTemplate selector
    - Pre-fill pattern with useState function initializers
    - Hint card pattern for missing configuration

key-files:
  created:
    - src/components/rotation/QuickStartCard.tsx
  modified:
    - src/components/workout/StartWorkout.tsx

key-decisions:
  - "QuickStartCard uses border-2 border-accent bg-accent/5 for visual prominence"
  - "Three states: full quick-start, no rotation hint, no default gym hint"
  - "Manual selection remains below with rotation pre-fill (editable suggestion)"
  - "Position indicator shows 'Workout N of M in Rotation Name'"

patterns-established:
  - "Rotation selectors pattern: useRotationStore(selectNextTemplate) for derived data"
  - "Pre-fill with useState(() => rotationValue || '') allows user override"
  - "Hint cards use bg-bg-secondary border border-border-primary for subtle guidance"

# Metrics
duration: 3min
completed: 2026-01-31
---

# Phase 10 Plan 02: Quick-Start Card + StartWorkout Rotation Pre-Fill Summary

**Rotation-aware quick-start card with one-tap workout start and pre-filled manual selection from active rotation**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-31T12:10:01Z
- **Completed:** 2026-01-31T12:13:17Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- QuickStartCard shows next template and gym from active rotation with position indicator
- One-tap "Start Workout" button when rotation and default gym configured
- Manual gym/template selection pre-filled from rotation defaults
- Helpful hints when rotation or default gym not configured

## Task Commits

Each task was committed atomically:

1. **Task 1: Create QuickStartCard component** - `4bd2ee0` (feat)
2. **Task 2: Integrate QuickStartCard into StartWorkout** - `38ed3d2` (feat)

## Files Created/Modified
- `src/components/rotation/QuickStartCard.tsx` - Shows next rotation workout with one-tap start or configuration hints
- `src/components/workout/StartWorkout.tsx` - Added QuickStartCard above manual selection, pre-fills from rotation

## Decisions Made

**QuickStartCard visual hierarchy:**
- Accent-bordered card (border-2 border-accent, bg-accent/5) for prominence
- Position indicator in text-sm text-text-secondary
- Template name in text-xl font-bold
- Gym name in text-text-secondary
- Full-width primary button for one-tap start

**Three-state handling:**
1. Active rotation + default gym: Show quick-start card with button
2. Active rotation but no default gym: Show hint to set default gym
3. No active rotation: Show hint to create rotation in Settings

**Pre-fill strategy:**
- Use useState function initializers to read rotation state on mount
- Values remain editable (user can override via dropdowns)
- Editable suggestion pattern per 10-CONTEXT.md guidance

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Next Phase Readiness

- Quick-start card ready for manual testing with rotation configuration
- Pre-fill working, ready for Plan 10-03 (demo data to verify full flow)
- Rotation advance (Plan 10-04) will complete the rotation lifecycle

---
*Phase: 10-workout-features-demo-data*
*Completed: 2026-01-31*
