---
phase: 04-data-durability
plan: 02
subsystem: data-import
tags: [duckdb, parquet, backup, data-durability, validation]

# Dependency graph
requires:
  - phase: 01-foundation-data-layer
    provides: DuckDB instance with events table, getDuckDB singleton pattern
provides:
  - useBackupImport hook for restoring data from Parquet files
  - Schema validation and duplicate detection for safe imports
  - File registration pattern using DuckDB BROWSER_FILEREADER protocol
affects: [04-03-frontend-integration, data-durability]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - DuckDB registerFileHandle with BROWSER_FILEREADER for File API access
    - Pre-validation before DuckDB operations (file extension check)
    - Schema validation via DESCRIBE query
    - Duplicate skip via NOT IN subquery on _event_id

key-files:
  created:
    - src/hooks/useBackupImport.ts
  modified: []

key-decisions:
  - "DEV-061: Pre-validate file extension before DuckDB operations (fail fast on user error)"
  - "DEV-062: Schema validation checks only required columns, not virtual columns (year/month are generated)"
  - "DEV-063: Duplicate detection via WHERE _event_id NOT IN subquery (idempotent imports)"
  - "DEV-064: Track both imported and skipped counts for user feedback"

patterns-established:
  - "Import validation pattern: extension check → schema check → duplicate check → import"
  - "DuckDB file lifecycle: register → query → cleanup (dropFile in finally)"
  - "Error handling: distinguish between user error (bad file) vs system error"

# Metrics
duration: 2min
completed: 2026-01-28
---

# Phase 4 Plan 2: Import from Backup Summary

**Import hook with file validation, schema validation, and duplicate event detection via _event_id**

## Performance

- **Duration:** 2 min
- **Started:** 2026-01-28T19:48:24Z
- **Completed:** 2026-01-28T19:50:04Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Import hook that validates Parquet files before processing
- Schema validation ensures backup files have required columns
- Duplicate event skip prevents data corruption on re-import
- Proper file cleanup with DuckDB dropFile
- Import result tracking (imported count, skipped count)

## Task Commits

Each task was committed atomically:

1. **Task 1 & 2: Create useBackupImport hook with validation** - `60170a2` (feat)

**Plan metadata:** (pending final commit)

## Files Created/Modified
- `src/hooks/useBackupImport.ts` - Import hook with validation, schema check, duplicate detection, and file cleanup

## Decisions Made

**DEV-061: Pre-validate file extension before DuckDB operations**
- Rationale: Fail fast on user error (selecting wrong file type), clearer error message
- Implementation: Check `.parquet` extension (case-insensitive) before registerFileHandle

**DEV-062: Schema validation checks only required columns, not virtual columns**
- Rationale: year/month are GENERATED ALWAYS AS virtual columns, not present in Parquet exports
- Implementation: Validate only _event_id, _created_at, event_type, payload

**DEV-063: Duplicate detection via WHERE _event_id NOT IN subquery**
- Rationale: Idempotent imports - users can safely re-import same backup file
- Implementation: INSERT SELECT with WHERE clause filtering existing event IDs

**DEV-064: Track both imported and skipped counts for user feedback**
- Rationale: Users need to see what happened (new events vs duplicates)
- Implementation: Compare before/after counts, calculate skipped from total

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - DuckDBDataProtocol import worked as expected from duckdb-wasm package.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Import functionality complete, ready for UI integration (04-03)
- Validates file format and schema before importing
- Handles duplicates gracefully without errors
- Export functionality (04-01) needed for end-to-end backup/restore flow

---
*Phase: 04-data-durability*
*Completed: 2026-01-28*
