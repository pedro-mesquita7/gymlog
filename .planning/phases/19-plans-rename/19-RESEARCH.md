# Phase 19: Plans Rename - Research

**Researched:** 2026-02-01
**Domain:** Codebase-wide terminology rename (Template -> Plan) with backward-compatible protected strings
**Confidence:** HIGH

## Summary

This phase is a mechanical codebase-wide rename of "Template(s)" to "Plan(s)" across all user-facing text, component files, internal code symbols, route paths, and test assertions. The critical constraint is backward compatibility: event_type strings stored in DuckDB (`template_created`, `template_updated`, `template_deleted`, `template_archived`), payload keys (`template_id`, `template_ids`), localStorage keys, and stored object shapes must NOT change.

The codebase investigation found 40 files containing "template" or "Template" references across the `src/` directory. These break down into: 5 files to rename (component/hook/type files), ~35 files with internal references to update, and several SQL queries in both TypeScript and dbt models that contain protected strings. The rename is straightforward but wide-reaching, requiring careful attention to which strings are user-facing (rename) vs. data-layer (preserve).

**Primary recommendation:** Execute the rename in dependency-safe order starting with types, then hooks, then components, then consumers. Use `git mv` for file renames to preserve history. Protect all event_type strings, payload keys, localStorage keys, and SQL query strings referencing stored data.

## Standard Stack

No new libraries are needed. This is a pure refactoring phase using existing tools.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | existing | Type-safe rename with compiler-checked references | TSC will catch broken imports |
| Vitest | existing | Verify unit tests pass after rename | Already configured |
| Playwright | existing | E2E test assertions need updating | Already configured |

### Supporting
No additional libraries needed.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual rename | sed/find-replace scripts | Script is faster but misses context-sensitive cases (protected strings) |
| git mv | Manual file rename + git add | git mv preserves file history cleanly |

## Architecture Patterns

### File Rename Map (5 files)

```
src/types/template.ts          -> src/types/plan.ts
src/hooks/useTemplates.ts       -> src/hooks/usePlans.ts
src/components/templates/       -> src/components/plans/
  TemplateList.tsx              -> PlanList.tsx
  TemplateCard.tsx              -> PlanCard.tsx
  TemplateBuilder.tsx           -> PlanBuilder.tsx
  ExerciseList.tsx              -> ExerciseList.tsx (stays, internal to plans/)
  ExerciseRow.tsx               -> ExerciseRow.tsx (stays, internal to plans/)
```

### Dependency-Safe Rename Order

The rename must follow import dependency order to avoid broken intermediate states:

**Layer 1 - Types (leaf nodes, no internal imports):**
1. `src/types/template.ts` -> `src/types/plan.ts`
   - Rename file, rename exports: `TemplateExercise` -> `PlanExercise`, `Template` -> `Plan`
   - Update all 15+ files that import from this module

**Layer 2 - Events types (references types):**
2. `src/types/events.ts`
   - Rename interface names: `TemplateCreatedEvent` -> `PlanCreatedEvent`, etc.
   - DO NOT change `event_type` string literals (`'template_created'`, etc.)
   - DO NOT change `template_id` property names (stored in events)
   - Update all files importing these event types

**Layer 3 - Data layer (references types, events):**
3. `src/db/queries.ts` - Rename function `getTemplates` -> `getPlans`, rename return type refs
   - DO NOT change SQL strings (they reference stored event_type and payload keys)
4. `src/db/demo-data.ts` - Rename variable names (templateIds, templates array)
   - DO NOT change event_type strings passed to insertEvent
   - DO NOT change `template_id` in payload objects
5. `src/services/toon-export.ts` - Rename interfaces (TemplateRow -> PlanRow), variable names
   - DO NOT change SQL strings or `payload->>'template_id'`

**Layer 4 - Hooks (references data layer, types):**
6. `src/hooks/useTemplates.ts` -> `src/hooks/usePlans.ts`
   - Rename file, rename function `useTemplates` -> `usePlans`
   - Rename interfaces: `CreateTemplateData` -> `CreatePlanData`, etc.
   - Rename return fields: `createTemplate` -> `createPlan`, etc.
   - DO NOT change event_type strings in event objects
7. `src/hooks/useWorkoutSummary.ts` - Rename parameter name in function signature
8. `src/hooks/useRecentWorkout.ts` - Rename `templateName` field and SQL alias

**Layer 5 - Stores (references types):**
9. `src/stores/useWorkoutStore.ts` - Rename parameter names in startWorkout
   - DO NOT change localStorage key `'gymlog-workout'`
   - DO NOT change `template_id` property in session object (stored in localStorage)
10. `src/stores/useRotationStore.ts` - Rename selector `selectNextTemplate` -> `selectNextPlan`
    - DO NOT change localStorage key `'gymlog-rotations'`
    - DO NOT change `template_ids` property in rotation objects (stored in localStorage)

**Layer 6 - Components (references everything above):**
11. `src/components/templates/` -> `src/components/plans/` (directory rename)
12. All component files inside: rename component names, props, imports
13. Consumer components:
    - `src/App.tsx` - imports, variable names, JSX references
    - `src/components/Navigation.tsx` - Tab type, label text "Templates" -> "Plans", data-testid
    - `src/components/workout/StartWorkout.tsx` - props, variable names, UI text
    - `src/components/workout/ActiveWorkout.tsx` - props, variable names
    - `src/components/workout/WorkoutComplete.tsx` - props
    - `src/components/workout/ExerciseView.tsx` - type imports
    - `src/components/workout/SetGrid.tsx` - prop name
    - `src/components/workout/RestTimer.tsx` - comment
    - `src/components/workout/ExerciseSubstitution.tsx` - comment
    - `src/components/workout/ProgressionAlert.tsx` - comment
    - `src/components/rotation/RotationEditor.tsx` - props, variable names
    - `src/components/rotation/QuickStartCard.tsx` - props, variable names
    - `src/components/settings/RotationSection.tsx` - variable names, UI text
    - `src/components/settings/ToonExportSection.tsx` - variable names
    - `src/components/settings/DemoDataSection.tsx` - UI text reference

**Layer 7 - Tests (references components, types):**
14. `src/components/workout/StartWorkout.test.tsx` - variable names, assertions, UI text
15. `src/stores/useWorkoutStore.test.ts` - parameter values in test calls
16. `src/components/ui/ErrorCard.test.tsx` - "Templates" string in test
17. `src/tests/__fixtures__/test-data.ts` - property names in factory functions
18. `src/e2e/helpers/selectors.ts` - selector names and data-testid values
19. `src/e2e/plan-crud.spec.ts` - variable names, comments, UI text assertions
20. `src/e2e/batch-logging.spec.ts` - variable names, comments, UI text assertions
21. `src/e2e/workout-rotation.spec.ts` - variable names, comments, UI text assertions

**Layer 8 - dbt models (SQL only, references stored data):**
22. `dbt/models/marts/core/fact_workouts.sql` - has `template_id` column (matches stored payload key) - DO NOT RENAME
23. `dbt/models/marts/core/_core__models.yml` - `template_id` description - DO NOT RENAME
24. `dbt/models/staging/events/stg_events__workout_started.sql` - extracts `template_id` from payload - DO NOT RENAME
25. `dbt/models/marts/analytics/vw_exercise_history.sql` - references template_id - DO NOT RENAME

### Protected Strings Inventory (DO NOT CHANGE)

**Event type literals in TypeScript:**
```typescript
// In src/types/events.ts - event_type discriminators
'template_created'
'template_updated'
'template_deleted'
'template_archived'

// In src/hooks/useTemplates.ts (-> usePlans.ts) - event objects
event_type: 'template_created'
event_type: 'template_updated'
event_type: 'template_deleted'
event_type: 'template_archived'

// In src/db/demo-data.ts - insertEvent calls
'template_created'
```

**Payload property names (stored in DuckDB JSON and localStorage):**
```typescript
// In src/types/events.ts - interface properties
template_id: string;  // on TemplateCreatedEvent, TemplateUpdatedEvent, etc.

// In src/types/workout-session.ts
template_id: string;  // on WorkoutSession (stored in localStorage)

// In src/stores/useRotationStore.ts
template_ids: string[];  // on Rotation interface (stored in localStorage)

// In src/stores/useWorkoutStore.ts
template_id: templateId  // assignment in startWorkout
```

**SQL query strings (reference stored payload keys):**
```sql
-- In src/db/queries.ts
payload->>'template_id'

-- In src/services/toon-export.ts
payload->>'template_id'

-- In src/hooks/useWorkoutSummary.ts
s.template_id = '${templateId}'  -- references fact_workouts column

-- In src/hooks/useRecentWorkout.ts
fw.template_id  -- references fact_workouts column

-- In dbt models
JSON_EXTRACT_STRING(payload, '$.template_id')
template_id column in fact_workouts
```

**localStorage keys:**
```typescript
'gymlog-workout'     // contains template_id in session state
'gymlog-rotations'   // contains template_ids in rotation objects
```

### Anti-Patterns to Avoid
- **Global find-replace without context:** A naive `s/template/plan/g` will break event_type strings, payload keys, SQL queries, and localStorage. Every replacement must be context-aware.
- **Renaming properties on stored objects:** `session.template_id` and `rotation.template_ids` are persisted in localStorage. Renaming them breaks existing user sessions.
- **Changing SQL query strings:** SQL references `payload->>'template_id'` which must match stored DuckDB data. Even if column aliases change, the payload extraction must stay.
- **Forgetting data-testid updates:** Test selectors reference `nav-templates`, `template-name-input`, `btn-create-template`, `btn-template-menu`, `btn-template-delete`. These must be updated consistently across both components and test selectors.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| File renames | Manual file create/delete | `git mv` | Preserves git history |
| Import path updates | Manual search | TypeScript compiler errors | TSC will flag every broken import after file renames |
| Verification | Manual file reading | `grep -r "Template" src/` after rename | Catches any missed occurrences |

**Key insight:** TypeScript's compiler is the best verification tool here. After renaming types and files, `tsc --noEmit` will flag every broken import and type reference. Run it after each layer of renames.

## Common Pitfalls

### Pitfall 1: Breaking Stored Event Types
**What goes wrong:** Changing `event_type: 'template_created'` to `event_type: 'plan_created'` means new events can't be found by old queries, and old events don't match new code.
**Why it happens:** Natural instinct to rename everything consistently.
**How to avoid:** Mark protected strings with explicit comments. The event_type interface properties in events.ts KEEP their literal `'template_*'` values even though the interface names change to `Plan*Event`.
**Warning signs:** Any change to a string literal in quotes that matches the protected list.

### Pitfall 2: Breaking localStorage Session Recovery
**What goes wrong:** Renaming `session.template_id` to `session.planId` in the WorkoutSession type means existing localStorage data with `template_id` property can't be deserialized.
**Why it happens:** WorkoutSession interface used in zustand persist store - property names become localStorage JSON keys.
**How to avoid:** The `WorkoutSession.template_id` property name MUST stay as `template_id`. The TypeScript interface can add a comment like `// Stored as template_id in localStorage for backward compat` but the property name cannot change.
**Warning signs:** Any rename of a property on `WorkoutSession` or `Rotation` interfaces.

### Pitfall 3: Breaking SQL Queries
**What goes wrong:** Renaming `payload->>'template_id'` in SQL breaks queries against existing DuckDB data where the payload JSON key is literally `template_id`.
**Why it happens:** SQL strings embedded in TypeScript look like regular code but reference external data.
**How to avoid:** Never modify SQL string contents that reference payload keys or event_type values.
**Warning signs:** Any change inside backtick-delimited SQL template literals in queries.ts, toon-export.ts, useWorkoutSummary.ts, useRecentWorkout.ts.

### Pitfall 4: Partial data-testid Updates
**What goes wrong:** Updating `data-testid="nav-templates"` in Navigation.tsx but forgetting to update `SEL.navTemplates` selector value in selectors.ts (or vice versa), causing E2E tests to fail.
**Why it happens:** data-testid values are duplicated between components and test selectors.
**How to avoid:** Update component data-testid attributes AND selector constants in the same task. Run E2E tests after.
**Warning signs:** E2E tests can't find elements after rename.

### Pitfall 5: Navigation Tab Type Breaking
**What goes wrong:** The `Tab` type union includes `'templates'` literal. Changing it to `'plans'` requires updating every usage of the string literal across App.tsx and Navigation.tsx.
**Why it happens:** TypeScript literal unions propagate through the codebase.
**How to avoid:** Update the Tab type definition and let TSC flag all uses. But note: this is a code-internal string (not stored), so it CAN and SHOULD be renamed.
**Warning signs:** TSC errors after changing Tab type.

### Pitfall 6: Missing UI Text in Obscure Locations
**What goes wrong:** Missing a "Template" text string in a conditional branch, error message, or placeholder that only shows in edge cases.
**Why it happens:** Some UI text is in fallback strings, error states, or conditional branches that are easy to miss.
**How to avoid:** After all renames, run `grep -ri "template" src/ --include="*.tsx" --include="*.ts"` and manually verify each remaining occurrence is a protected string.
**Warning signs:** User sees "Template" text anywhere in the UI after deploy.

## Code Examples

### Pattern 1: Renaming Interface While Preserving Event Types
```typescript
// BEFORE (src/types/events.ts)
export interface TemplateCreatedEvent extends BaseEvent {
  event_type: 'template_created';  // DO NOT CHANGE - stored in DB
  template_id: string;             // DO NOT CHANGE - stored in payload
  name: string;
  exercises: TemplateExercise[];
}

// AFTER (src/types/events.ts)
export interface PlanCreatedEvent extends BaseEvent {
  event_type: 'template_created';  // Preserved: stored event type
  template_id: string;             // Preserved: stored payload key
  name: string;
  exercises: PlanExercise[];
}
```

### Pattern 2: Renaming Hook While Preserving Event Writes
```typescript
// BEFORE (src/hooks/useTemplates.ts)
export function useTemplates(): UseTemplatesReturn {
  const createTemplate = useCallback(async (data: CreateTemplateData) => {
    const event = {
      event_type: 'template_created',  // DO NOT CHANGE
      template_id: templateId,          // DO NOT CHANGE
      ...
    };
  });
}

// AFTER (src/hooks/usePlans.ts)
export function usePlans(): UsePlansReturn {
  const createPlan = useCallback(async (data: CreatePlanData) => {
    const event = {
      event_type: 'template_created',  // Preserved: stored event type
      template_id: planId,              // Preserved: stored payload key
      ...
    };
  });
}
```

### Pattern 3: Navigation Tab Rename
```typescript
// BEFORE
type Tab = 'workouts' | 'templates' | 'analytics' | 'settings';
// Tab label in JSX: "Templates"
// data-testid: "nav-templates"

// AFTER
type Tab = 'workouts' | 'plans' | 'analytics' | 'settings';
// Tab label in JSX: "Plans"
// data-testid: "nav-plans"
```

### Pattern 4: UI Text Rename in Components
```typescript
// BEFORE
<h2>Templates</h2>
<button>+ New Template</button>
'No templates yet'
'Loading templates...'
'Template Name'
'Create Template'
'Update Template'
'Delete Template'
'Template not found'

// AFTER
<h2>Plans</h2>
<button>+ New Plan</button>
'No plans yet'
'Loading plans...'
'Plan Name'
'Create Plan'
'Update Plan'
'Delete Plan'
'Plan not found'
```

### Pattern 5: WorkoutSession Type (Protected Properties)
```typescript
// BEFORE AND AFTER - WorkoutSession.template_id stays the same
export interface WorkoutSession {
  workout_id: string;
  template_id: string;  // KEEP: stored in localStorage as-is
  gym_id: string;
  ...
}

// The startWorkout function parameter CAN rename:
// BEFORE: startWorkout(templateId, gymId)
// AFTER: startWorkout(planId, gymId)
// But the assignment MUST use template_id:
//   template_id: planId  // parameter renamed, property preserved
```

### Pattern 6: Rotation Store (Protected Properties)
```typescript
// BEFORE AND AFTER - Rotation.template_ids stays the same
export interface Rotation {
  rotation_id: string;
  name: string;
  template_ids: string[];    // KEEP: stored in localStorage as-is
  current_position: number;
}

// Selector CAN rename:
// BEFORE: selectNextTemplate
// AFTER: selectNextPlan
// But return value references template_ids internally
```

## Complete File Inventory

### Files to RENAME (5 files + 1 directory)
| Current Path | New Path |
|-------------|----------|
| `src/types/template.ts` | `src/types/plan.ts` |
| `src/hooks/useTemplates.ts` | `src/hooks/usePlans.ts` |
| `src/components/templates/` | `src/components/plans/` |
| `src/components/templates/TemplateList.tsx` | `src/components/plans/PlanList.tsx` |
| `src/components/templates/TemplateCard.tsx` | `src/components/plans/PlanCard.tsx` |
| `src/components/templates/TemplateBuilder.tsx` | `src/components/plans/PlanBuilder.tsx` |

### Files to EDIT (internal references, UI text, imports) - 35 files
| File | Changes Needed |
|------|---------------|
| `src/types/events.ts` | Rename interface names (NOT event_type strings, NOT template_id properties) |
| `src/types/workout-session.ts` | Comment-only (template_id property STAYS) |
| `src/db/queries.ts` | Rename function name, type refs (NOT SQL strings) |
| `src/db/demo-data.ts` | Rename variables (NOT event_type strings, NOT payload keys) |
| `src/services/toon-export.ts` | Rename interfaces, variables (NOT SQL strings) |
| `src/hooks/useWorkoutSummary.ts` | Rename param name (NOT SQL strings) |
| `src/hooks/useRecentWorkout.ts` | Rename field name in returned object |
| `src/stores/useWorkoutStore.ts` | Rename param names (NOT template_id property assignment, NOT localStorage key) |
| `src/stores/useRotationStore.ts` | Rename selector name (NOT template_ids property, NOT localStorage key) |
| `src/App.tsx` | Update imports, variable names, Tab value, JSX |
| `src/components/Navigation.tsx` | Tab type, label text, data-testid |
| `src/components/workout/StartWorkout.tsx` | Imports, props, variables, UI text |
| `src/components/workout/ActiveWorkout.tsx` | Imports, props, variables |
| `src/components/workout/WorkoutComplete.tsx` | Imports, props |
| `src/components/workout/ExerciseView.tsx` | Type imports |
| `src/components/workout/SetGrid.tsx` | Prop name |
| `src/components/workout/RestTimer.tsx` | Comment text |
| `src/components/workout/ExerciseSubstitution.tsx` | Comment text |
| `src/components/workout/ProgressionAlert.tsx` | Comment text |
| `src/components/workout/RecentWorkoutCard.tsx` | Field name reference |
| `src/components/rotation/RotationEditor.tsx` | Imports, props, variables, aria-labels |
| `src/components/rotation/QuickStartCard.tsx` | Imports, props, variables |
| `src/components/settings/RotationSection.tsx` | Imports, variables, UI text |
| `src/components/settings/ToonExportSection.tsx` | Variable names |
| `src/components/settings/DemoDataSection.tsx` | UI text (already partially says "plans") |
| `src/components/plans/ExerciseList.tsx` | Type import path |
| `src/components/plans/ExerciseRow.tsx` | Type import path |
| `src/components/workout/StartWorkout.test.tsx` | Variables, assertions, UI text |
| `src/stores/useWorkoutStore.test.ts` | Parameter values in test calls |
| `src/components/ui/ErrorCard.test.tsx` | Feature name string |
| `src/tests/__fixtures__/test-data.ts` | Comment text |
| `src/e2e/helpers/selectors.ts` | Selector names, data-testid values |
| `src/e2e/plan-crud.spec.ts` | Variables, comments, UI text assertions |
| `src/e2e/batch-logging.spec.ts` | Variables, comments, UI text assertions |
| `src/e2e/workout-rotation.spec.ts` | Variables, comments, UI text assertions |

### Files to NOT TOUCH (dbt models reference stored data)
| File | Why Protected |
|------|--------------|
| `dbt/models/marts/core/fact_workouts.sql` | `template_id` column matches stored payload |
| `dbt/models/marts/core/_core__models.yml` | Documents `template_id` column |
| `dbt/models/staging/events/stg_events__workout_started.sql` | Extracts `$.template_id` from payload |
| `dbt/models/marts/analytics/vw_exercise_history.sql` | References template_id |
| `dbt/models/marts/analytics/_analytics__models.yml` | Documents template_id |

## data-testid Rename Map

| Current | New |
|---------|-----|
| `nav-templates` | `nav-plans` |
| `template-name-input` | `plan-name-input` |
| `btn-create-template` | `btn-create-plan` |
| `btn-template-menu` | `btn-plan-menu` |
| `btn-template-delete` | `btn-plan-delete` |
| `template-select` | `plan-select` |

## Verification Strategy

1. **TypeScript compiler:** `npx tsc --noEmit` after each layer - catches broken imports/types
2. **Grep audit:** `grep -ri "template" src/ --include="*.ts" --include="*.tsx"` - every remaining hit must be a protected string
3. **Unit tests:** `npx vitest run` - catches logic regressions
4. **E2E tests:** `npx playwright test` - catches UI text and selector mismatches
5. **Manual localStorage check:** Load app, verify existing data still loads (template_id/template_ids in stored JSON)

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual find-replace | TSC-guided rename with protected string inventory | Always best practice | Prevents data corruption |

## Open Questions

1. **DemoDataSection.tsx already says "plans, and templates"**
   - What we know: Line 99 says `"Remove all workout logs, plans, and templates."`
   - What's unclear: Should this just say "plans" after rename? (The word "templates" appears alongside "plans")
   - Recommendation: Change to "Remove all workout logs and plans." since templates ARE plans post-rename

2. **useRecentWorkout.ts references `dim_templates` view**
   - What we know: SQL query joins `dim_templates t ON fw.template_id = t.template_id` - this view name may or may not exist as a dbt model
   - What's unclear: Is `dim_templates` a compiled dbt view that gets created at runtime? If so, the SQL string must match the view name.
   - Recommendation: Check if `dim_templates` is created by a dbt model. If yes, it cannot be renamed (breaks the SQL). If it's created dynamically, same constraint applies.

## Sources

### Primary (HIGH confidence)
- Direct codebase investigation of all 40 files containing "template"/"Template"
- TypeScript source analysis of types, interfaces, and string literals
- SQL query string analysis in queries.ts, toon-export.ts, useWorkoutSummary.ts, useRecentWorkout.ts
- localStorage key analysis in useWorkoutStore.ts, useRotationStore.ts
- dbt model analysis in dbt/models/

### Secondary (MEDIUM confidence)
- Git history analysis for file rename best practices (git mv preserves history)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new libraries, pure refactoring
- Architecture: HIGH - Complete file inventory with dependency ordering verified against source
- Pitfalls: HIGH - All protected strings identified from direct source code analysis

**Research date:** 2026-02-01
**Valid until:** 2026-03-01 (stable - no external dependencies to change)
