# Phase 19: Plans Rename - Context

**Gathered:** 2026-02-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Rename all user-facing "Template(s)" terminology to "Plan(s)" across the entire app. Includes UI text, component files, internal code symbols, and route paths. Event type strings and payload keys in stored data must NOT change (backward compatibility).

</domain>

<decisions>
## Implementation Decisions

### Terminology mapping
- Tab label: "Plans" (not "Workout Plans")
- Always use short form "Plan(s)" everywhere — no "Workout Plan(s)" variant
- Rotations reference "plans" too — full consistency ("Rotation cycles through plans A, B, C")
- Just swap the word in existing copy — no rewording or tone changes

### Edge case wording
- "Create Template" → "Create Plan"
- "Use Template" → "Use Plan"
- "Edit Template" → "Edit Plan"
- "Delete Template" → "Delete Plan"
- All CRUD actions: straight swap, no verb changes
- Toast messages: straight swap ("Plan created", "Plan deleted", etc.)

### File and code naming
- Component files rename (e.g., `TemplateCard.tsx` → `PlanCard.tsx`)
- Internal variables, hooks, functions, types all rename (e.g., `useTemplates` → `usePlans`, `templateId` → `planId`)
- Route paths rename if they exist (e.g., `/templates` → `/plans`)
- Full rename across the entire codebase for consistency

### Protected strings (DO NOT CHANGE)
These event_type strings and payload keys are stored in user data and must remain unchanged:

**Event types (in DuckDB events table):**
- `'template_created'`
- `'template_updated'`
- `'template_deleted'`
- `'template_archived'`

**Payload keys in event JSON:**
- `template_id` — used in template events AND `workout_started` events
- `exercises[].exercise_id`, `exercises[].order_index`, etc. (no template reference, safe)
- `is_archived` (no template reference, safe)

**DuckDB query operators (must match stored data):**
- `payload->>'template_id'` — extracted in queries.ts, toon-export.ts, useWorkoutSummary.ts

**localStorage keys (do NOT rename):**
- `'gymlog-workout'` — contains `template_id` in session state
- `'gymlog-rotations'` — contains `template_ids` array in rotation objects

**localStorage object shapes (property names in stored JSON must stay):**
- `session.template_id` in gymlog-workout
- `rotation.template_ids` in gymlog-rotations

### Claude's Discretion
- Order of file renames (dependency-safe ordering)
- Whether to use git mv or manual rename
- How to handle import path updates across files

</decisions>

<specifics>
## Specific Ideas

No specific requirements — straight mechanical rename with protected backward-compatible strings.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 19-plans-rename*
*Context gathered: 2026-02-01*
