---
phase: 20-ux-restructure
plan: 03
subsystem: testing
tags: [playwright, e2e, collapsible-sections, aria-expanded]

# Dependency graph
requires:
  - phase: 20-01
    provides: CollapsibleSection component with aria-expanded on Workouts tab
provides:
  - Updated E2E seed helpers that expand collapsed sections before interaction
  - Updated workout-rotation spec with section expansion steps
affects: [future E2E specs that interact with Workouts tab sections]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Defensive section expansion: check aria-expanded=false before clicking"
    - "Section-specific locators instead of brittle nth() selectors"

key-files:
  created: []
  modified:
    - src/e2e/helpers/seed.ts
    - src/e2e/workout-rotation.spec.ts

key-decisions:
  - "Defensive expansion pattern: check count() > 0 on aria-expanded=false before clicking to avoid toggling already-open sections"
  - "Section-specific locators (filter by hasText) replace nth() selectors for robustness"

patterns-established:
  - "Collapsible section expansion: use page.locator('button[aria-expanded=\"false\"]', { hasText: 'SectionName' }) pattern"
  - "Content targeting: use section.filter({ hasText }) to scope + Add buttons to correct section"

# Metrics
duration: 2min
completed: 2026-02-01
---

# Phase 20 Plan 03: E2E Test Fixes for Collapsed Sections Summary

**E2E seed helpers and workout-rotation spec updated to expand collapsed Gyms/Exercises sections via aria-expanded button clicks before interacting with content**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-01T22:47:42Z
- **Completed:** 2026-02-01T22:49:42Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Seed helpers (createGym, createExercise) now expand CollapsibleSections before clicking "+ Add"
- Removed brittle nth() selectors in favor of section-filtered locators
- workout-rotation.spec.ts updated with defensive expansion for direct gym/exercise creation
- plan-crud.spec.ts and batch-logging.spec.ts verified -- they use seed helpers, no direct changes needed

## Task Commits

Each task was committed atomically:

1. **Task 1: Update E2E seed helpers to expand collapsible sections** - `3774edc` (feat)
2. **Task 2: Update E2E spec files that directly interact with collapsed sections** - `881111f` (feat)

## Files Created/Modified
- `src/e2e/helpers/seed.ts` - createGym/createExercise expand sections before form interaction
- `src/e2e/workout-rotation.spec.ts` - Direct gym/exercise creation expands sections first

## Decisions Made
- Used defensive `aria-expanded="false"` check with count() > 0 to avoid toggling already-open sections
- Used section-specific locators (filter by "Your Gyms" / "Library" text) instead of nth() for robustness
- plan-crud.spec.ts and batch-logging.spec.ts need no changes -- they rely entirely on seed helpers

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All E2E tests aligned with collapsed-by-default Workouts tab sections
- Future specs should follow the established expansion pattern

---
*Phase: 20-ux-restructure*
*Completed: 2026-02-01*
