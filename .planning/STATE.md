# Project State: GymLog

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-27)

**Core value:** Track workout performance with proper data engineering — both usable as a personal training tool and impressive as a senior Data Engineer portfolio piece.

**Current focus:** Phase 2 - Templates & Logging

## Current Position

Phase: 2 of 4 (Templates & Logging)
Plan: 6 of 9 in current phase
Status: In progress
Last activity: 2026-01-28 — Completed 02-06-PLAN.md (Active Workout Logging)

Progress: [███████░░░] 78%

## Performance Metrics

**Velocity:**
- Total plans completed: 14
- Average duration: 3 min
- Total execution time: 0.7 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation-data-layer | 8 | 22 min | 3 min |
| 02-templates-logging | 6 | 21 min | 4 min |

**Recent Trend:**
- Last 5 plans: 4 min, 3 min, 4 min, 4 min, 3 min
- Trend: Stable (consistent 3-4 min execution)

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- DuckDB-WASM + Parquet: Showcase modern DE stack, analytical queries in browser
- dbt-duckdb at build time: Get dbt docs/tests/lineage without runtime complexity
- Event sourcing: Immutable events enable replay, audit trail, flexible derived views

**From 01-01:**
- DEV-001: Vite excludes @duckdb/duckdb-wasm from optimizeDeps (required for WASM loading)
- DEV-002: Build target set to esnext (modern JS features, requires Chrome 89+/Firefox 89+/Safari 15+)
- DEV-003: dbt profile uses in-memory DuckDB for build-time compilation

**From 01-02:**
- DEV-004: Events stored as JSON payload with virtual partitioning columns (schema flexibility + Parquet compatibility)
- DEV-005: Singleton pattern for DuckDB instance (single OPFS handle, avoids connection overhead)

**From 01-03:**
- DEV-006: Compiled SQL in TypeScript instead of requiring dbt runtime (dbt models as documentation, compiled-queries.ts for execution)
- DEV-007: JSON_EXTRACT_STRING for payload parsing in staging models (DuckDB JSON extraction functions)
- DEV-008: ROW_NUMBER deduplication pattern for event replay (idempotent processing)

**From 01-04:**
- DEV-009: Refresh event count after each operation (immediate visual feedback that operations persisted)

**From 01-05:**
- DEV-010: Display exercise count in gym list to show impact before deletion (users see which gyms have associated exercises)

**From 01-07:**
- DEV-011: Pin DuckDB-WASM to 1.32.0 (dev versions have OPFS file locking bugs)
- DEV-012: Use opfs://gymlog.db path for OPFS persistence

**From 01-08:**
- DEV-013: Calculate exercise count via LEFT JOIN in query rather than separate fetch (single round trip)

**From 02-02:**
- DEV-014: Template types created inline to unblock execution (plan 02-01 not yet executed)
- DEV-015: activeTemplates as computed property filtering archived templates (avoids repeated filtering in components)
- DEV-016: ID-returning operations for createTemplate and duplicateTemplate (enables immediate navigation)

**From 02-03:**
- DEV-017: Use field.id as key for useFieldArray items, not array index (prevents React key errors during reordering)
- DEV-018: PointerSensor with distance: 8 constraint prevents accidental drags
- DEV-019: Zod superRefine for cross-field validation (duplicate exercises, min <= max reps)

**From 02-04:**
- DEV-020: Action menu with backdrop pattern for dropdowns (click-outside closes menu, avoids z-index battles)
- DEV-021: Show archived toggle instead of separate page (simpler UX, all templates in one view)
- DEV-022: Bottom navigation with pb-20 padding (prevents content overlap with fixed nav)

**From 02-05:**
- DEV-023: sessionStorage for workout session persistence (clears on tab close, not browser close)
- DEV-024: Zustand partialize to persist only session and config, not actions (reduces storage size)
- DEV-025: completeWorkout returns session for event writing (enables workout completion flow)

**From 02-06:**
- DEV-026: NumberStepper uses inputMode="decimal" for mobile number keyboard (better UX on touch devices)
- DEV-027: Weight increments by 2.5kg (standard plate increment for gym equipment)
- DEV-028: Auto-advance pattern: keep weight, reset reps after logging set (convenience for multiple sets)
- DEV-029: Swipe navigation for exercises with trackMouse: false (touch-only during workout)
- DEV-030: WorkoutTimer updates via useEffect interval every second (live elapsed time display)

### Pending Todos

None yet.

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-01-28 13:02:37 UTC
Stopped at: Completed 02-06-PLAN.md (Active Workout Logging)
Resume file: None

**Next action:** Continue Phase 2 execution - execute 02-07 (Rest Timer)
