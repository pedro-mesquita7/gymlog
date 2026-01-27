---
phase: 01-foundation-data-layer
plan: 02
subsystem: database
tags: [duckdb-wasm, event-sourcing, opfs, uuidv7, react-hooks]

# Dependency graph
requires:
  - 01-01
provides:
  - DuckDB-WASM initialization with OPFS persistence
  - Event sourcing infrastructure with UUID v7 event IDs
  - Event write/read operations with audit columns
  - React hook for database connection management
  - Database status UI with persistence indicator
affects:
  - 01-03 (Exercise management will use writeEvent/readEvents)
  - 01-04 (Gym management will use writeEvent/readEvents)
  - 01-05+ (All features will use event sourcing pattern)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Event sourcing with immutable events table"
    - "OPFS persistence with memory fallback"
    - "JSON payload storage with virtual partitioning columns"
    - "Event replay queries using window functions"
    - "React hooks for async database initialization"

key-files:
  created:
    - src/types/events.ts
    - src/types/database.ts
    - src/db/duckdb-init.ts
    - src/db/events.ts
    - src/db/queries.ts
    - src/hooks/useDuckDB.ts
  modified:
    - src/App.tsx

decisions:
  - id: DEV-004
    what: Store events as JSON payload with virtual partitioning columns
    why: Enables flexible schema evolution while maintaining Hive partitioning compatibility for future Parquet export
    impact: Events can be queried with JSON operators, partitioned by year/month without duplicating data
    alternatives: Could use separate columns per event field, but loses schema flexibility
  - id: DEV-005
    what: Singleton pattern for DuckDB instance with module-level state
    why: Avoids multiple database connections and ensures single OPFS handle
    impact: Single initialization per app lifecycle, connection reused across components
    alternatives: Could use React Context, but adds unnecessary complexity for singleton resource

patterns-established:
  - "Event IDs using UUID v7 for timestamp-sortable ordering"
  - "Event replay with ROW_NUMBER() OVER PARTITION BY for latest state"
  - "React hook pattern for async database initialization with loading state"

# Metrics
duration: 2 minutes
completed: 2026-01-27
---

# Phase 01 Plan 02: DuckDB Infrastructure Summary

**DuckDB-WASM with OPFS persistence, event sourcing foundation using UUID v7 IDs and JSON payload storage, React hook for database initialization and status display**

## Performance

- **Duration:** 2 minutes
- **Started:** 2026-01-27T22:26:09Z
- **Completed:** 2026-01-27T22:28:56Z
- **Tasks:** 3
- **Files created:** 6
- **Files modified:** 1

## Accomplishments

- DuckDB-WASM initialized with OPFS persistence and automatic memory fallback
- Event sourcing infrastructure with UUID v7 event IDs and ISO 8601 timestamps
- Event write/read operations with type safety and JSON payload storage
- Database status UI showing connection state, persistence mode, and event count
- Type definitions for all Phase 1 events (Exercise, Gym) with audit columns

## Task Commits

Each task was committed atomically:

1. **Task 1: Create type definitions for events and database** - `b401911` (feat)
2. **Task 2: Implement DuckDB initialization and event system** - `f36aa05` (feat)
3. **Task 3: Create React hook and update App with connection status** - `e082550` (feat)

## Files Created/Modified

**Created:**
- `src/types/events.ts` - Event type definitions with BaseEvent, Exercise events, Gym events, and MUSCLE_GROUPS constant
- `src/types/database.ts` - DatabaseStatus, DatabaseConnection, and entity types (Exercise, Gym)
- `src/db/duckdb-init.ts` - DuckDB-WASM initialization with OPFS persistence fallback
- `src/db/events.ts` - Event write/read operations with UUID v7 generation and JSON payload handling
- `src/db/queries.ts` - Query utilities for exercises, gyms, and event count
- `src/hooks/useDuckDB.ts` - React hook for database initialization and status tracking

**Modified:**
- `src/App.tsx` - Added database status card with connection indicators and event count display

## How It Works

**DuckDB Initialization:**
1. On first call to `initDuckDB()`, load DuckDB-WASM from jsDelivr CDN
2. Attempt OPFS connection (`opfs://gymlog.db`) for persistence
3. Fall back to in-memory (`:memory:`) if OPFS not supported
4. Create `events` table with virtual year/month partitioning columns
5. Return singleton database instance

**Event Sourcing Pattern:**
1. Events written to `events` table with `_event_id` (UUID v7), `_created_at` (ISO timestamp), `event_type`, and JSON `payload`
2. Virtual columns `year` and `month` enable future Parquet partitioning
3. State derived by querying events with `ROW_NUMBER() OVER (PARTITION BY entity_id ORDER BY _created_at DESC)` to get latest
4. Delete events handled by filtering `event_type != 'entity_deleted'`

**React Integration:**
1. `useDuckDB` hook initializes database on component mount
2. Status tracked: isInitialized, isConnected, isPersistent, error
3. Event count fetched and displayed in UI
4. Green indicators for connected/OPFS, yellow for memory-only, red for errors

## Technical Decisions Made

**JSON Payload Storage:**
Storing events as JSON payloads instead of individual columns enables schema evolution without database migrations. Virtual partitioning columns (`year`, `month`) provide performance benefits for future Parquet export while keeping event payload flexible.

**Singleton DuckDB Instance:**
Using module-level state for the database instance ensures single initialization and avoids multiple OPFS handles. React Context would add unnecessary complexity for a singleton resource that needs to be available outside React component tree.

**UUID v7 for Event IDs:**
UUID v7 provides timestamp-sortable ordering (events naturally ordered by creation time in database) while maintaining uniqueness. Enables efficient queries without additional timestamp indexes.

**OPFS with Memory Fallback:**
Chrome/Edge support OPFS for persistent storage, Firefox/Safari fall back to memory-only mode. User is warned via UI when running in memory-only mode. This approach maximizes persistence while maintaining cross-browser compatibility.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - DuckDB-WASM initialized successfully, types compile without errors, dev server started on port 5175.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for next phase:**
- Event sourcing infrastructure complete
- Type definitions for Exercise and Gym events defined
- Write/read operations tested and working
- Database status displayed in UI

**Blockers:** None

**Concerns:** None

**Handoff Notes:**
- Plan 01-03 can now implement Exercise management using `writeEvent<ExerciseCreatedEvent>()`, `writeEvent<ExerciseUpdatedEvent>()`, and `writeEvent<ExerciseDeletedEvent>()`
- Plan 01-04 can implement Gym management using corresponding Gym event types
- All future features should use event sourcing pattern: write events, derive state via queries
- Database automatically falls back to memory-only mode in browsers without OPFS support

---
*Phase: 01-foundation-data-layer*
*Completed: 2026-01-27*
