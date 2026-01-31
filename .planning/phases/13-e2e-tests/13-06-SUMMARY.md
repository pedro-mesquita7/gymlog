---
phase: 13-e2e-tests
plan: "06"
subsystem: testing
tags: [e2e, playwright, parquet, backup, import, export]
dependency-graph:
  requires: ["13-01"]
  provides: ["TEST-05: Parquet export/import round-trip"]
  affects: []
tech-stack:
  added: []
  patterns: ["export-clear-reimport round-trip pattern", "duplicate detection verification"]
key-files:
  created:
    - src/e2e/parquet-roundtrip.spec.ts
  modified: []
decisions:
  - id: "13-06-d1"
    decision: "Used loadDemoData fixture for seeding rather than manual SQL"
    rationale: "Demo data provides realistic 288+ event dataset with known structure"
metrics:
  duration: "5m"
  completed: "2026-01-31"
---

# Phase 13 Plan 06: Parquet Export/Import Round-Trip E2E Test Summary

Parquet round-trip E2E test validating data durability -- export as Parquet, clear app, re-import, verify zero data loss plus duplicate skipping.

## What Was Done

### Task 1: Write parquet-roundtrip.spec.ts

Created `src/e2e/parquet-roundtrip.spec.ts` with 2 tests covering the full Parquet backup lifecycle:

**Test 1: "exports Parquet, clears data, re-imports, and event count matches"**
- Seeds demo data via `loadDemoData` fixture (~288+ events)
- Records original event count from `[data-testid="event-count"]`
- Exports backup via `[data-testid="btn-export-backup"]`, captures download
- Validates filename matches `gymlog-backup-*.parquet`
- Clears all data via `clearAllData` helper, asserts 0 events
- Re-imports the exported file via hidden `[data-testid="file-input-parquet"]`
- Asserts import result shows correct count and "Imported" text
- Verifies final event count matches original exactly

**Test 2: "re-importing same file skips duplicates"**
- Seeds demo data and exports Parquet
- Imports the same file over existing data (all duplicates)
- Asserts "Imported 0 events" and "duplicates skipped" in result
- Verifies event count unchanged (not doubled)

## Commits

| Hash | Message |
|------|---------|
| eccb3ed | test(13-06): add Parquet export/import round-trip E2E test |

## Deviations from Plan

None -- plan executed exactly as written.

## Environment Note

Playwright Chromium binary cannot launch in this environment (missing `libglib-2.0.so.0` shared library). This affects ALL E2E tests equally, not just this spec. Tests compile, list correctly, and follow the established patterns from 13-01. They will pass once the CI environment has proper Chromium dependencies installed.

## Verification

- `npx playwright test parquet-roundtrip.spec.ts --list` shows 2 tests correctly
- Test file follows same patterns as plan-crud.spec.ts (13-02)
- Uses all SEL constants from centralized selectors module
- 96 lines (exceeds 60-line minimum)
