---
phase: 16-demo-data-toon-export
plan: 02
subsystem: api
tags: [toon, duckdb, export, llm, data-format]

requires:
  - phase: 01-foundation-data-layer
    provides: DuckDB event store with exercise/gym/template/workout/set events
provides:
  - TOON export service with three scope functions (last workout, rotation cycle, time range)
  - LLM-optimized workout data encoding
affects: [16-03 (UI integration), 16-04 (demo data + export UX)]

tech-stack:
  added: ["@toon-format/toon@2.1.0"]
  patterns: ["Pure async service module (no React)", "TOON encoding with keyFolding for token efficiency"]

key-files:
  created: ["src/services/toon-export.ts"]
  modified: ["package.json"]

key-decisions:
  - "Used keyFolding: 'safe' option for more token-efficient TOON output"
  - "Equipment field set to placeholder since not tracked in event schema"
  - "PR detection calculated via window functions matching compiled-queries.ts pattern"

patterns-established:
  - "Service module pattern: pure async functions querying DuckDB, no React dependencies"
  - "TOON export data shape: metadata + exercises + workouts with nested sets"

duration: 5min
completed: 2026-02-01
---

# Phase 16 Plan 02: TOON Export Service Summary

**TOON export service with three scope functions (last workout, rotation cycle, time range) using @toon-format/toon for LLM-optimized workout data encoding**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-01T12:44:06Z
- **Completed:** 2026-02-01T12:49:22Z
- **Tasks:** 1
- **Files modified:** 3 (src/services/toon-export.ts, package.json, package-lock.json)

## Accomplishments
- Installed @toon-format/toon SDK for LLM-optimized data encoding
- Created pure async service module with three export scope functions
- PR detection uses window functions (MAX() OVER with ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING)
- Context headers include exercise definitions, gym names, template names, and date ranges

## Task Commits

Each task was committed atomically:

1. **Task 1: Install @toon-format/toon and create TOON export service** - `62730fb` (feat)

## Files Created/Modified
- `src/services/toon-export.ts` - TOON export service with exportLastWorkoutToon, exportRotationCycleToon, exportTimeRangeToon
- `package.json` - Added @toon-format/toon dependency

## Decisions Made
- Used `keyFolding: 'safe'` option in encode() for more token-efficient TOON output (collapses single-key wrapper chains into dotted paths)
- Equipment field uses placeholder value since equipment is not tracked in the event schema
- PR type derivation uses `weight_and_1rm`, `weight`, `1rm`, or null (matching PR_LIST_SQL pattern from compiled-queries.ts)
- Set numbers are calculated per-workout (sequential counter) rather than read from payload

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- TOON export service ready for UI integration in plan 16-03
- All three export functions return TOON-encoded strings or empty string on no data
- Service is pure async (no React) -- can be called from any component or hook

---
*Phase: 16-demo-data-toon-export*
*Completed: 2026-02-01*
