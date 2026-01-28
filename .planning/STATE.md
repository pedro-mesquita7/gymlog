# Project State: GymLog

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-27)

**Core value:** Track workout performance with proper data engineering — both usable as a personal training tool and impressive as a senior Data Engineer portfolio piece.

**Current focus:** Phase 3 - History & Analytics

## Current Position

Phase: 3 of 4 (History & Analytics)
Plan: 6 of 6 in current phase
Status: Phase complete
Last activity: 2026-01-28 — Completed 03-06-PLAN.md

Progress: [████████████] 100%

## Performance Metrics

**Velocity:**
- Total plans completed: 22
- Average duration: 3 min
- Total execution time: ~1 hour 6 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation-data-layer | 8 | 22 min | 3 min |
| 02-templates-logging | 9 | 30 min | 3 min |
| 03-history-analytics | 5 | 13 min | 2.6 min |

**Recent Trend:**
- Last 5 plans: 3 min, 2 min, 2 min, 3 min, 3 min
- Trend: Stable (consistent 2-3 min execution)

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

**From 02-07:**
- DEV-031: Manual rest timer start instead of auto-start (gives user control over when to begin rest)
- DEV-032: Base64-encoded beep audio in useAudioNotification (no external audio file needed)
- DEV-033: Vibration API with feature detection (works on Android, gracefully fails on iOS)
- DEV-034: Exercise name clickable for substitution (intuitive tap target, clear (sub) indicator)
- DEV-035: Custom one-off exercises for substitution (allows ad-hoc replacements without polluting library)

**From 02-08:**
- DEV-036: Complete view as state toggle in ActiveWorkout (simpler UX, maintains workout context, no routing complexity)
- DEV-037: Save disabled with zero sets (prevent accidental empty workout saves)
- DEV-038: Warning for incomplete exercises (warn but allow saving when exercises have no sets)

**From 02-09 (Verification):**
- DEV-039: Demo mode warning banner when OPFS unavailable (clear user expectation about data loss)
- DEV-040: RIR input supports null (empty/not filled) distinct from 0 (failure)
- DEV-041: Explicit "Swap Exercise" button instead of hidden tap-on-name (better discoverability)
- DEV-042: useMemo for filtered store selectors to avoid infinite render loops

**From 03-01:**
- DEV-043: Staging models follow JSON_EXTRACT_STRING pattern from existing models (consistent extraction logic)
- DEV-044: Epley formula (weight × (1 + reps/30)) for 1RM calculation (most accurate for 1-10 rep range)
- DEV-045: Anomaly detection with 50% default threshold for percent change (flags unusual performance jumps)
- DEV-046: filter_exercise_by_gym macro centralizes global vs gym-specific logic (reusable WHERE clause pattern)

**From 03-02:**
- DEV-047: Layered intermediate model approach (int_sets__with_1rm → int_sets__with_prs → int_sets__with_anomalies)
- DEV-048: PR detection uses original_exercise_id to track PRs across substitutions
- DEV-049: First-time exercises flagged as PRs (previous_max_weight_kg IS NULL)
- DEV-050: Anomaly detection uses LAG(weight_kg) for session-to-session comparison

**From 03-04:**
- DEV-051: FACT_SETS_SQL replicates full dbt intermediate model chain in single query (avoids materialized views)
- DEV-052: EXERCISE_HISTORY_SQL uses nested FACT_SETS_SQL CTE for consistency (single source of truth)
- DEV-053: Gym filtering uses $1 parameter matching current gym context pattern

**From 03-05:**
- DEV-054: getDuckDB() pattern for hooks instead of useDuckDB() returning conn (matches useExercises/useGyms pattern)
- DEV-055: Filter matches_gym_context in hook after SQL query (SQL provides flag, hook filters to matching sets)
- DEV-056: Date grouping via reduce in hook computed property (extracts YYYY-MM-DD from ISO timestamp)

**From 03-06:**
- DEV-057: PRIndicator uses 3-second auto-dismiss with bounce animation (clear visual feedback without blocking)
- DEV-058: PR type badges color-coded: accent for both PRs, blue for weight-only, purple for 1RM-only (visual distinction)
- DEV-059: Real-time PR detection using useMemo to compare current inputs against maxData (immediate feedback during logging)
- DEV-060: EstimatedMaxDisplay conditionally renders only when maxData exists (avoids empty state flicker)

### Pending Todos

None yet.

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-01-28
Stopped at: Completed 03-06-PLAN.md
Resume file: None

**Next action:** Phase 3 complete. Ready for Phase 4 frontend integration
