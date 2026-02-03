---
phase: 27-production-polish
plan: 01
subsystem: codebase
tags: [dead-code, knip, version-bump, cleanup, dependencies]

# Dependency graph
requires:
  - phase: 26-warmup-system
    provides: Final feature code before cleanup
provides:
  - Clean codebase with zero dead code from removed features
  - Version 1.5.0 in package.json
  - Removed autoprefixer devDependency
affects: [27-02 README, 27-03 E2E tests]

# Tech tracking
tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified:
    - package.json
    - package-lock.json
    - src/db/compiled-queries.ts
    - src/db/duckdb-init.ts
    - src/db/events.ts
    - src/hooks/useVolumeThresholds.ts
    - src/services/toon-export.ts
    - src/stores/useBackupStore.ts
    - src/stores/useRotationStore.ts
    - src/types/analytics.ts
    - src/types/database.ts
    - src/types/events.ts
    - src/utils/clearAllData.ts
    - src/utils/warmup.ts
    - src/tests/__fixtures__/test-data.ts

key-decisions:
  - "d27-01-01: Kept ProgressionAlert and useExerciseProgression (active workout feature, not dead code from removed progression dashboard)"
  - "d27-01-02: Kept sw.ts (false positive -- referenced by vite-plugin-pwa in vite.config.ts)"
  - "d27-01-03: Removed clearAllData function entirely (E2E tests define their own version in fixtures)"

patterns-established:
  - "Internal-only symbols use module-scoped (non-exported) declarations"

# Metrics
duration: 16min
completed: 2026-02-03
---

# Phase 27 Plan 01: Dead Code Removal & Version Bump Summary

**Removed 725 lines of dead code (3 files deleted, 15 files cleaned), dropped autoprefixer, bumped to v1.5.0 with all checks passing**

## Performance

- **Duration:** 16 min
- **Started:** 2026-02-03T23:41:27Z
- **Completed:** 2026-02-03T23:57:33Z
- **Tasks:** 2/2
- **Files modified:** 18

## Accomplishments
- Deleted 3 unused files: ToonExportSection.tsx, VolumeZoneIndicator.tsx, fonts.css
- Removed 2 dead toon-export functions, deprecated useVolumeThresholds hook, readEvents/readAllEvents, clearAllData, getIsPersistent
- De-exported 10+ internal-only symbols across 8 files
- Removed 3 unused SQL constant exports and 4 unused type definitions
- Dropped autoprefixer devDependency (unused with Tailwind v4)
- Bumped version to 1.5.0
- All checks pass: tsc (0 errors), build (0 warnings), tests (71/71)

## Task Commits

Each task was committed atomically:

1. **Task 1: Dead code removal via knip + manual sweep** - `546ecc4` (feat)
2. **Task 2: Version bump to 1.5.0 + build verification** - `926d497` (chore)

## Files Created/Modified
- `package.json` - Removed autoprefixer, bumped version to 1.5.0
- `package-lock.json` - Synced after dependency and version changes
- `src/components/settings/ToonExportSection.tsx` - DELETED (orphan per d24-02-02 override)
- `src/components/analytics/VolumeZoneIndicator.tsx` - DELETED (unused component)
- `src/styles/fonts.css` - DELETED (not imported anywhere)
- `src/db/compiled-queries.ts` - De-exported 3 functions, removed 3 unused SQL constants
- `src/db/duckdb-init.ts` - Removed dead getIsPersistent function
- `src/db/events.ts` - De-exported helpers, removed dead readEvents/readAllEvents
- `src/hooks/useVolumeThresholds.ts` - Removed deprecated useVolumeThresholds, kept useVolumeZoneThresholds
- `src/services/toon-export.ts` - Removed exportRotationCycleToon, exportTimeRangeToon
- `src/stores/useBackupStore.ts` - De-exported BACKUP_THRESHOLD
- `src/stores/useRotationStore.ts` - De-exported Rotation interface
- `src/types/analytics.ts` - Removed VolumeThresholds, MuscleGroupThresholds, UseVolumeThresholdsReturn
- `src/types/database.ts` - Removed DatabaseConnection interface and unused duckdb import
- `src/types/events.ts` - De-exported BaseEvent interface
- `src/utils/clearAllData.ts` - Removed dead clearAllData, kept clearHistoricalData
- `src/utils/warmup.ts` - De-exported roundToNearest
- `src/tests/__fixtures__/test-data.ts` - Fixed missing required notes field

## Decisions Made
- d27-01-01: Kept ProgressionAlert and useExerciseProgression -- these are active workout features (rendered in SetLogger), not remnants of the removed progression dashboard
- d27-01-02: Kept sw.ts despite knip flagging it -- it is referenced by vite-plugin-pwa in vite.config.ts (false positive)
- d27-01-03: Removed clearAllData function entirely from clearAllData.ts -- E2E tests define their own clearAllData in fixtures, the app code only uses clearHistoricalData

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed test fixture missing required notes field**
- **Found during:** Task 1 (build verification)
- **Issue:** makeWorkoutSession factory in test-data.ts was missing the required `notes` field added in Phase 25
- **Fix:** Added `notes: {}` to factory defaults
- **Files modified:** src/tests/__fixtures__/test-data.ts
- **Verification:** `tsc -b && vite build` passes
- **Committed in:** 546ecc4 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Fix was necessary for build to pass. No scope creep.

## Issues Encountered
- ESLint reports 55 pre-existing errors (mostly `@typescript-eslint/no-explicit-any` and React hooks rules). None are in files modified by this plan. These are out of scope for dead code removal.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Codebase is clean for README documentation (Plan 02)
- E2E tests can run against clean codebase (Plan 03)
- Version 1.5.0 ready for release tagging

---
*Phase: 27-production-polish*
*Completed: 2026-02-03*
