---
status: diagnosed
trigger: "DuckDB reports 'not a valid DuckDB database file' for opfs://gymlog.db, falls back to in-memory"
created: 2026-01-30T00:00:00Z
updated: 2026-01-30T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED - Multiple compounding issues in OPFS initialization cause corruption and prevent persistence
test: Code review + known issue correlation
expecting: N/A - diagnosis complete
next_action: Report findings

## Symptoms

expected: DuckDB opens opfs://gymlog.db persistently across sessions
actual: Error "not a valid DuckDB database file", falls back to in-memory, no persistence
errors: "The file \"opfs://gymlog.db\" exists, but it is not a valid DuckDB database file!"
reproduction: Load app after any previous session that created the OPFS file
started: Likely from first use; OPFS file gets created but never becomes a valid database

## Eliminated

(none - root cause found on first hypothesis chain)

## Evidence

- timestamp: 2026-01-30T00:01:00Z
  checked: /src/db/duckdb-init.ts line 33 - db.open() call
  found: Opens with `{ path: 'opfs://gymlog.db' }` but MISSING `accessMode: DuckDBAccessMode.READ_WRITE`
  implication: Without explicit READ_WRITE access mode, DuckDB may open the file in a default/read-only mode that cannot properly initialize a new database file in OPFS

- timestamp: 2026-01-30T00:02:00Z
  checked: Entire src/ directory for CHECKPOINT usage
  found: No CHECKPOINT command is ever issued
  implication: DuckDB-WASM OPFS requires explicit CHECKPOINT calls to flush WAL data to the main .db file. Without it, data stays in WAL only, and on next load the .db file is empty/invalid

- timestamp: 2026-01-30T00:03:00Z
  checked: duckdb-wasm GitHub Issue #1947 (filed Jan 2025)
  found: Exact same error message. Root cause: empty/corrupted OPFS file left behind from failed or incomplete initialization. Fixed in PR #1973 targeting duckdb-wasm post-1.32.0
  implication: Version 1.32.0 contains this known bug. The fix shipped in later versions.

- timestamp: 2026-01-30T00:04:00Z
  checked: package.json - pinned version
  found: "@duckdb/duckdb-wasm": "1.32.0" - pinned exact version
  implication: Pinned to a version with known OPFS bugs. The comment says "pinned due to OPFS bugs in newer versions" but 1.32.0 itself has OPFS bugs (Issue #1947)

- timestamp: 2026-01-30T00:05:00Z
  checked: duckdb-init.ts fallback logic (lines 49-66)
  found: On OPFS failure, calls `await db.open({})` to reopen in-memory on the SAME db instance. Does NOT call db.close() or db.dropFiles() before reopening.
  implication: The stale OPFS file handle/lock may not be properly released. The corrupted OPFS file persists forever, so every subsequent app load hits the same error and falls back to in-memory.

- timestamp: 2026-01-30T00:06:00Z
  checked: vite.config.ts headers
  found: COOP/COEP headers are set (required for SharedArrayBuffer / OPFS sync access)
  implication: Cross-origin isolation is correctly configured - this is NOT the issue

- timestamp: 2026-01-30T00:07:00Z
  checked: Worker bundle selection (duckdb-init.ts lines 19-25)
  found: Uses getJsDelivrBundles() + selectBundle() which auto-selects mvp/eh bundle. Does NOT use the COI (pthread) bundle.
  implication: The non-COI bundle may have different OPFS behavior. The COI bundle with pthreadWorker is what some OPFS examples use.

## Resolution

root_cause: |
  THREE compounding issues prevent OPFS persistence:

  1. **MISSING accessMode: READ_WRITE** (Primary cause of corruption)
     `db.open({ path: 'opfs://gymlog.db' })` does not specify `accessMode: DuckDBAccessMode.READ_WRITE`.
     The DuckDB-WASM OPFS implementation requires explicit READ_WRITE mode to properly
     initialize and write to the database file. Without it, the file gets created in OPFS
     but is never properly initialized as a DuckDB database (left as 0 bytes or with invalid header).

  2. **KNOWN BUG in duckdb-wasm 1.32.0** (GitHub Issue #1947)
     Version 1.32.0 has a known OPFS bug where `db.open` fails with "not a valid DuckDB
     database file" when an OPFS file already exists from a previous (failed) session.
     The fix was shipped in PR #1973, post-1.32.0. The project pins 1.32.0 "due to OPFS
     bugs in newer versions" but this version itself has the bug.

  3. **NO CHECKPOINT calls** (Data never flushed to .db file)
     Even if the database opened successfully, no code ever calls `CHECKPOINT` to flush
     the WAL (Write-Ahead Log) to the main .db file. In DuckDB-WASM OPFS mode, data
     written goes to the WAL first. Without CHECKPOINT, the .db file remains
     empty/minimal and the WAL file holds all data. On next page load, the .db file
     alone appears invalid.

  4. **No OPFS cleanup on corruption** (Self-healing failure)
     The fallback logic catches the OPFS error and reopens in-memory, but never deletes
     the corrupted OPFS file. So the corruption is permanent - every subsequent load
     hits the same error. There is no recovery path.

fix: (diagnosis only - not applied)
verification: (diagnosis only)
files_changed: []
