---
phase: 10-workout-features-demo-data
plan: 04
subsystem: demo-data
tags: [duckdb, demo-generation, data-reset, localStorage]

# Dependency graph
requires:
  - phase: 10-01
    provides: Rotation system for organizing demo workout sequences
provides:
  - Demo data generator with 6 weeks of progressive overload workouts
  - Complete data reset utility (DuckDB + OPFS + localStorage)
  - Portfolio-ready demo experience in Settings page
affects: [portfolio-presentation, ci-cd]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Direct DuckDB SQL inserts with custom timestamps for historical data
    - Multi-layer persistence clearing (DuckDB + OPFS + localStorage)

key-files:
  created:
    - src/db/demo-data.ts
    - src/utils/clearAllData.ts
    - src/components/settings/DemoDataSection.tsx
  modified:
    - src/components/backup/BackupSettings.tsx

key-decisions:
  - "Direct SQL inserts for demo data (bypassing writeEvent) to set custom historical timestamps"
  - "Three-layer data clearing: DuckDB table drop, OPFS file removal, localStorage key removal"
  - "Demo rotation setup via direct localStorage write (position 2 for variety)"

patterns-established:
  - "Demo data generation: 6 weeks, 4x/week, Mon/Wed/Fri/Sun schedule"
  - "Progressive overload pattern: baseline → progression → plateau → deload → resume"
  - "Upper/Lower split with 10 exercises, 4 templates, realistic weight/rep variation"

# Metrics
duration: 7min
completed: 2026-01-31
---

# Phase 10 Plan 04: Demo Data Generation + Clear All Data Summary

**6-week progressive overload demo with Upper/Lower rotation, complete data reset utility, and Settings UI for portfolio reviewers**

## Performance

- **Duration:** 7 min
- **Started:** 2026-01-31T12:17:21Z
- **Completed:** 2026-01-31T12:24:07Z
- **Tasks:** 1 (single comprehensive implementation)
- **Files modified:** 4

## Accomplishments
- Demo data generator creates 6 weeks (~24 workouts) of realistic progressive overload data
- Complete data clearing utility removes all persistence (DuckDB, OPFS, localStorage)
- Settings page now has "Demo & Data Management" section with Load Demo Data and Clear All Data buttons
- Demo includes: 1 gym (Iron Works Gym), 10 exercises (Upper/Lower split), 4 templates, Upper/Lower 4x rotation

## Task Commits

Each task was committed atomically:

1. **Task 1: Create demo data generator and clearAllData utility** - `cbefa7a` (feat)

## Files Created/Modified
- `src/db/demo-data.ts` - Generates 6 weeks of progressive overload workouts with historical timestamps
- `src/utils/clearAllData.ts` - Complete application reset (DuckDB + OPFS + localStorage + reload)
- `src/components/settings/DemoDataSection.tsx` - UI component with Load Demo Data and Clear All Data buttons
- `src/components/backup/BackupSettings.tsx` - Added DemoDataSection at bottom of Settings page

## Decisions Made

**Direct SQL inserts for historical timestamps:**
- Plan specified using writeEvent() but noted it auto-generates current timestamps
- Switched to direct DuckDB SQL inserts via `conn.query()` to set custom historical dates
- Keeps one connection open for all inserts, calls checkpoint() once at end for performance

**Demo data schedule:**
- 6 weeks starting 43 days ago
- 4 workouts/week: Mon/Wed/Fri/Sun pattern (days 0, 2, 4, 6 of each week)
- Progressive overload multipliers: 1.0 → 1.05 → 1.10 → 1.10 (plateau) → 0.90 (deload) → 1.15 (resume)
- Template rotation: Upper A → Lower A → Upper B → Lower B (repeating)

**Rotation setup:**
- Demo creates rotation via direct localStorage write (bypassing Zustand store during generation)
- Sets current_position to 2 (Upper B) for variety when user first starts workout
- activeRotationId and defaultGymId pre-configured for instant Quick Start experience

**Three-layer data clearing:**
- Layer 1: DROP TABLE IF EXISTS events (DuckDB)
- Layer 2: Remove gymlog.db and gymlog.db.wal from OPFS
- Layer 3: Remove all gymlog-* localStorage keys (workout, rotations, backup, alerts, thresholds)
- Each layer wrapped in try/catch so partial failures don't block cleanup
- Final step: window.location.reload() to reinitialize everything

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Portfolio presentation ready:
- Demo data loads in ~3s, immediately populates all views (Workouts, History, Analytics)
- Clear All Data returns to clean slate for testing/demo reset
- 6 weeks of data showcases progressive overload, PR tracking, volume analytics, plateau detection

Demo data highlights:
- **Workouts tab:** Recent sessions with proper exercise order, realistic weights/reps
- **History tab:** 24 completed workouts spanning 6 weeks with delta comparisons
- **Analytics tab:** Exercise progress charts showing 15% weight increase over 6 weeks
- **Quick Start:** Pre-configured rotation suggests next workout (Upper B at position 3/4)

Ready for CI/CD and portfolio documentation (Phase 11).

---
*Phase: 10-workout-features-demo-data*
*Completed: 2026-01-31*
