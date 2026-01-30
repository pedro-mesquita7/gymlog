---
phase: 05-analytics-foundation
plan: 07
subsystem: database
tags: [bugfix, opfs, duckdb-wasm, persistence, checkpoint]

# Dependency graph
requires:
  - phase: 01-foundation-data-layer
    plan: 01
    provides: DuckDB-WASM initialization
provides:
  - OPFS database with READ_WRITE accessMode
  - Automatic corruption detection and cleanup
  - CHECKPOINT after schema creation and writes
  - Exported checkpoint() utility function
affects: [data-persistence, all-write-operations]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "DuckDB-WASM OPFS requires explicit READ_WRITE accessMode"
    - "CHECKPOINT flushes WAL to .db file for persistence"
    - "OPFS cleanup via navigator.storage.getDirectory().removeEntry()"
    - "Non-blocking fire-and-forget checkpoint after writes"

key-files:
  modified:
    - src/db/duckdb-init.ts
    - src/db/events.ts
---

## Accomplishments

- Added `accessMode: DuckDBAccessMode.READ_WRITE` to `db.open()` for proper OPFS write access
- Added `CHECKPOINT` after schema creation to flush WAL to .db file
- Added OPFS corruption detection (checks for "not a valid", "corrupt", "Could not" in error messages)
- Added automatic OPFS cleanup: deletes corrupted `gymlog.db` and `gymlog.db.wal` via OPFS API, then retries
- Added exported `checkpoint()` utility function for use by other modules
- Added non-blocking `checkpoint()` call after `writeEvent` in events.ts to flush writes to OPFS
- Extracted schema SQL to constant to avoid duplication across code paths

## Root Cause

Three compounding issues:
1. Missing `accessMode: READ_WRITE` — OPFS file created but never properly initialized as valid DuckDB database
2. No `CHECKPOINT` calls — writes stayed in WAL, never flushed to .db file
3. No OPFS cleanup on corruption — corrupted file persisted forever, blocking all future OPFS attempts

## UAT Gaps Closed

- OPFS database persistence (data survives page reload)
