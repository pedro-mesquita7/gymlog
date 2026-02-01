---
phase: 20-ux-restructure
plan: 02
subsystem: ui
tags: [react, collapsible, settings, framer-motion, ux]

# Dependency graph
requires:
  - phase: 20-01
    provides: CollapsibleSection component with framer-motion animation
provides:
  - Reordered Settings tab with top 3 always-visible sections
  - Default Gym as standalone section (extracted from RotationSection)
  - 6 lower settings sections wrapped in CollapsibleSection (collapsed by default)
affects: [20-03, 20-04, 20-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - CollapsibleSection wrapping for rarely-used settings

key-files:
  created: []
  modified:
    - src/components/backup/BackupSettings.tsx
    - src/components/settings/RotationSection.tsx

key-decisions:
  - "Default Gym extracted as standalone section between Rotations and TOON Export"
  - "Single hr divider separates always-visible top group from collapsible group"
  - "Preserved original Default Gym styling (border, focus ring) for consistency"

patterns-established:
  - "Settings priority ordering: frequently-used visible, rarely-used collapsed"

# Metrics
duration: 10min
completed: 2026-02-01
---

# Phase 20 Plan 02: Settings Tab Reorder Summary

**Settings tab reordered with Rotations/Default Gym/TOON Export always visible at top, 6 lower sections collapsed by default using CollapsibleSection wrappers**

## Performance

- **Duration:** 10 min
- **Started:** 2026-02-01T22:46:33Z
- **Completed:** 2026-02-01T22:56:35Z
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments
- Settings tab reordered: Rotations > Default Gym > TOON Export always visible at top
- Default Gym selector extracted from RotationSection into standalone BackupSettings section
- 6 lower settings sections (Preferences, Backup, Restore, Demo Data, Observability, Data Quality) wrapped in CollapsibleSection, collapsed by default
- All data-testid attributes preserved for test compatibility
- 71 unit tests pass, Vite build succeeds

## Task Commits

Each task was committed atomically:

1. **Task 1: Extract Default Gym from RotationSection and reorder Settings tab** - `03930c5` (feat)

## Files Created/Modified
- `src/components/backup/BackupSettings.tsx` - Reordered sections, added Default Gym, wrapped lower sections in CollapsibleSection
- `src/components/settings/RotationSection.tsx` - Removed Default Gym block, cleaned up unused imports (useGyms, defaultGymId, setDefaultGym)

## Decisions Made
- Default Gym extracted with original styling preserved (border, focus ring, rounded-xl select)
- Option text changed from "None" to "No default gym" for clarity in standalone context
- Single hr divider between always-visible top group and collapsible group (CollapsibleSection cards provide visual separation below)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing TS errors in QuickStartCard.tsx and StartWorkout.tsx (templateId vs planId from Phase 19) cause `tsc -b` to fail, but Vite build succeeds since it uses esbuild for transpilation. These errors are documented in STATE.md as known blockers.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Settings tab restructured, ready for Plan 20-03 (Analytics tab restructure)
- CollapsibleSection pattern proven on both Workouts and Settings tabs

---
*Phase: 20-ux-restructure*
*Completed: 2026-02-01*
