---
phase: 02-templates-logging
plan: 02
subsystem: templates
completed: 2026-01-28
duration: 3min
tags: [hooks, queries, event-sourcing, template-management]

requires:
  - 01-02 (event sourcing infrastructure)
  - 01-03 (DuckDB query patterns)

provides:
  - useTemplates hook with full CRUD operations
  - getTemplates query function
  - Template and TemplateExercise type definitions
  - Template event types

affects:
  - 02-03 (Template List UI - will consume useTemplates)
  - 02-04 (Template Builder - will use createTemplate/updateTemplate)
  - 02-06 (Workout Session - templates as workout source)

tech-stack:
  added:
    - Template types infrastructure
  patterns:
    - Event replay pattern for template state
    - Hook-based CRUD operations
    - Archive/restore pattern for soft delete

key-files:
  created:
    - src/hooks/useTemplates.ts
    - src/types/template.ts
  modified:
    - src/db/queries.ts
    - src/types/events.ts

decisions:
  - decision: Created template types inline to unblock plan
    rationale: Plan 02-01 not executed yet but types were required
    scope: types
    impact: low
    alternatives: ["Wait for 02-01 execution"]
    date: 2026-01-28

  - decision: activeTemplates computed property filters archived
    rationale: Most UI needs non-archived templates, avoids repeated filtering
    scope: api
    impact: low
    alternatives: ["Filter in components", "Separate query"]
    date: 2026-01-28

  - decision: duplicateTemplate returns new template_id
    rationale: Enables immediate navigation to duplicated template
    scope: api
    impact: low
    alternatives: ["Return void and rely on refresh"]
    date: 2026-01-28
---

# Phase 2 Plan 2: Template CRUD Operations Summary

**One-liner:** Template hook with create/update/delete/archive/duplicate operations using event sourcing pattern

## What Was Built

Created the core template management layer with a React hook and DuckDB query function following the event sourcing pattern established in Phase 1.

**useTemplates hook provides:**
- `createTemplate()` - Creates template and returns ID
- `updateTemplate()` - Updates template name and exercise list
- `deleteTemplate()` - Hard delete via template_deleted event
- `archiveTemplate()` - Soft archive/restore via template_archived event
- `duplicateTemplate()` - Copies exercises to new template with new name
- `templates` - All templates including archived
- `activeTemplates` - Non-archived templates only

**getTemplates query:**
- Event replay pattern using ROW_NUMBER() deduplication
- Joins template_created/updated/deleted events
- Left joins archive status from template_archived events
- Parses exercises JSON array from payload
- Filters out deleted templates

**Type infrastructure:**
- Template and TemplateExercise interfaces
- Four template event types (created, updated, deleted, archived)
- Added to GymLogEvent union type

## Tasks Completed

| Task | Description | Commit | Status |
|------|-------------|--------|--------|
| Task 1 | Add getTemplates query to queries.ts | f4d21c2 | Complete |
| Task 2 | Create useTemplates hook | ecc937b | Complete |

## Decisions Made

**DEV-013: Template types created inline to unblock execution**
- Plan 02-01 (dependency installation + types) not yet executed
- Created template types and events inline to proceed with current plan
- Follows exact specifications from 02-01-PLAN.md
- Impact: Low - types match planned definitions exactly
- Rationale: Unblock current work while maintaining type safety

**DEV-014: activeTemplates as computed property**
- Hook returns both `templates` and `activeTemplates`
- activeTemplates filters out `is_archived: true` templates
- Rationale: Most UI components need non-archived list, avoids repeated filtering
- Alternative: Let components filter - rejected due to repeated logic

**DEV-015: ID-returning operations**
- `createTemplate()` returns template_id
- `duplicateTemplate()` returns new template_id
- Rationale: Enables immediate navigation after creation
- Consistent with common hook patterns

## Technical Implementation

**Event Replay Pattern:**
```sql
WITH template_events AS (
  SELECT
    payload->>'template_id' as template_id,
    payload->>'name' as name,
    payload->'exercises' as exercises,
    event_type,
    ROW_NUMBER() OVER (
      PARTITION BY payload->>'template_id'
      ORDER BY _created_at DESC
    ) as rn
  FROM events
  WHERE event_type IN ('template_created', 'template_updated', 'template_deleted')
)
```

**Archive Pattern:**
- Separate archive_status CTE with own ROW_NUMBER window
- Left join to get latest archive state per template
- COALESCE to default is_archived to false if never archived

**Hook Pattern:**
- State management: templates array, isLoading, error
- Auto-refresh on mount via useEffect
- All mutations call writeEvent then refresh
- useCallback memoization for stable references

## Verification Results

- TypeScript compiles without errors
- useTemplates hook matches expected interface
- getTemplates query follows established patterns
- All operations use event sourcing via writeEvent

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created template types to unblock plan**
- **Found during:** Task 1 initialization
- **Issue:** Plan requires Template and TemplateExercise types, but plan 02-01 (which creates them) hasn't been executed yet
- **Fix:** Created src/types/template.ts with Template and TemplateExercise interfaces, added template event types to events.ts
- **Files modified:** src/types/template.ts (created), src/types/events.ts
- **Commit:** f4d21c2 (combined with Task 1)
- **Rationale:** Types are required to proceed with current plan. Created exactly as specified in 02-01-PLAN.md to ensure consistency.

## Next Phase Readiness

**Blockers:** None

**Recommendations for next plans:**
1. Template List UI (02-03) can consume useTemplates immediately
2. Template Builder (02-04) has all CRUD operations available
3. Consider adding template validation (empty exercise list, duplicate names)
4. May want workout count per template in future (like exercise_count for gyms)

**Outstanding concerns:**
- Plan 02-01 should still be executed to install remaining dependencies (react-hook-form, zod, @dnd-kit/*, zustand)
- Template types are now present but workflow-related types (WorkoutSession) still missing

## Integration Points

**Consumes:**
- `writeEvent()` from src/db/events.ts
- `getDuckDB()` from src/db/duckdb-init.ts
- Template event types from src/types/events.ts

**Provides:**
- `useTemplates()` hook for UI components
- `getTemplates()` query for direct database access
- Template domain types for type safety

**Data Flow:**
1. UI calls useTemplates hook mutation (create/update/delete/archive)
2. Hook writes event via writeEvent()
3. Hook calls refresh() to re-query state
4. refresh() calls getTemplates() query
5. Query replays events to compute current state
6. Hook updates React state, triggering re-render

## Performance Characteristics

- Query performance: O(n) events where n = template events count
- ROW_NUMBER() window: Efficient with partition on template_id
- JSON parsing: Per-template overhead for exercises array
- Hook refresh: Fetches all templates on every mutation (acceptable for small datasets)

**Future optimizations:**
- Consider optimistic updates for immediate UI feedback
- Add query result caching if template count grows large
- Implement incremental refresh (only changed templates)

## Files Changed

**Created:**
- src/hooks/useTemplates.ts (126 lines)
- src/types/template.ts (16 lines)

**Modified:**
- src/db/queries.ts (+69 lines)
- src/types/events.ts (+25 lines)

**Total:** 236 lines added, 2 files created, 2 files modified

## Commit History

```
ecc937b feat(02-02): create useTemplates hook
f4d21c2 feat(02-02): add template types and getTemplates query
```

## Success Criteria Met

- [x] getTemplates query fetches templates with event replay pattern
- [x] useTemplates hook provides create, update, delete, archive, duplicate operations
- [x] activeTemplates filters out archived templates
- [x] All operations use event sourcing via writeEvent
- [x] TypeScript compiles without errors
- [x] Query uses ROW_NUMBER deduplication consistent with other queries
- [x] Hook follows useExercises pattern
