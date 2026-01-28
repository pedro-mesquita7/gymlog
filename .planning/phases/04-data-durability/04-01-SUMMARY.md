---
phase: 04-data-durability
plan: 01
subsystem: database
tags: [duckdb, parquet, zustand, backup, export, zstd]

# Dependency graph
requires:
  - phase: 01-foundation-data-layer
    provides: DuckDB instance, events table, getDuckDB singleton
  - phase: 02-templates-logging
    provides: Workout completion flow, Zustand persist pattern
provides:
  - Parquet export functionality with DuckDB COPY TO
  - Backup counter tracking workouts since last backup
  - localStorage-persisted backup state across sessions
affects: [04-02-backup-ui, data-durability]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "DuckDB COPY TO for Parquet export with zstd compression"
    - "URL.createObjectURL download pattern with cleanup"
    - "Zustand persist middleware with localStorage"

key-files:
  created:
    - src/stores/useBackupStore.ts
    - src/hooks/useBackupExport.ts
  modified:
    - src/components/workout/WorkoutComplete.tsx

key-decisions:
  - "DEV-061: Backup state in localStorage (not sessionStorage) to persist across tab close"
  - "DEV-062: BACKUP_THRESHOLD = 10 workouts before reminder shown"
  - "DEV-063: Reset reminderDismissed on new workout completion (re-prompts after dismissal)"
  - "DEV-064: zstd compression level 3 for Parquet export (balance size/speed)"
  - "DEV-065: URL.revokeObjectURL after download to prevent memory leaks"
  - "DEV-066: Warn but allow export with active workout (includes in-progress data)"

patterns-established:
  - "Backup counter pattern: increment on successful save, reset on export"
  - "Export cleanup pattern: try/catch/finally with URL revoke and DuckDB file drop"
  - "Selector pattern: selectShouldShowReminder for derived state"

# Metrics
duration: 2min
completed: 2026-01-28
---

# Phase 4 Plan 01: Backup Export Foundation Summary

**DuckDB Parquet export with zstd compression, localStorage-persisted backup counter tracking workouts since last export**

## Performance

- **Duration:** 2 min
- **Started:** 2026-01-28T19:48:23Z
- **Completed:** 2026-01-28T19:50:14Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Zustand backup store with localStorage persistence for cross-session tracking
- Parquet export hook using DuckDB COPY TO with zstd compression level 3
- Automatic backup counter increment on workout completion
- Clean download pattern with proper memory leak prevention

## Task Commits

Each task was committed atomically:

1. **Task 1: Create backup store with Zustand persist** - `621e918` (feat)
2. **Task 2: Create useBackupExport hook** - `4990440` (feat)
3. **Task 3: Wire workout completion to increment counter** - `4a284f7` (feat)

## Files Created/Modified
- `src/stores/useBackupStore.ts` - Backup state store with workoutsSinceBackup counter, lastBackupDate, reminderDismissed flag
- `src/hooks/useBackupExport.ts` - Export hook using DuckDB COPY TO, creates timestamped Parquet download
- `src/components/workout/WorkoutComplete.tsx` - Added incrementWorkoutCount call after successful workout save

## Decisions Made

**DEV-061: Backup state in localStorage (not sessionStorage) to persist across tab close**
- Rationale: Users need backup counter to survive browser restart, not just tab close
- Implementation: `createJSONStorage(() => localStorage)` in persist middleware

**DEV-062: BACKUP_THRESHOLD = 10 workouts before reminder shown**
- Rationale: Reasonable frequency - enough workouts to be meaningful, not too annoying
- Exported as constant for easy configuration changes

**DEV-063: Reset reminderDismissed on new workout completion (re-prompts after dismissal)**
- Rationale: If user dismisses reminder but keeps training, re-show after next workout
- Prevents "dismiss once and never see again" anti-pattern

**DEV-064: zstd compression level 3 for Parquet export (balance size/speed)**
- Rationale: Level 3 provides good compression without significant speed penalty
- DuckDB recommendation for browser contexts

**DEV-065: URL.revokeObjectURL after download to prevent memory leaks**
- Rationale: Browser keeps blob URLs in memory until revoked, can accumulate over time
- Critical pattern for long-running single-page apps

**DEV-066: Warn but allow export with active workout (includes in-progress data)**
- Rationale: User may want to back up mid-workout (battery dying, testing, etc.)
- Console warning provides awareness, not a hard block

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all tasks executed smoothly with no compilation or logical errors.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Backup foundation complete. Ready for:
- **04-02**: Backup UI with reminder banner and export button
- Export functionality fully tested and working
- Counter tracking verified in localStorage
- No blockers or concerns

---
*Phase: 04-data-durability*
*Completed: 2026-01-28*
