---
phase: 02-templates-logging
plan: 03
subsystem: ui
tags: [react-hook-form, zod, dnd-kit, drag-drop, forms, validation]

# Dependency graph
requires:
  - phase: 02-02
    provides: useTemplates hook with CRUD operations
  - phase: 02-01
    provides: Template and TemplateExercise types
provides:
  - TemplateBuilder form component with React Hook Form + Zod validation
  - ExerciseList component with drag-and-drop reordering via dnd-kit
  - ExerciseRow sortable component with rep range and set configuration
  - Template form with exercise selection, ordering, and per-exercise configuration
affects: [02-04-template-list-ui, 02-05-workout-logging-ui]

# Tech tracking
tech-stack:
  added: [@hookform/resolvers/zod]
  patterns: [React Hook Form with useFieldArray, Zod superRefine for cross-field validation, dnd-kit sortable pattern]

key-files:
  created:
    - src/components/templates/TemplateBuilder.tsx
    - src/components/templates/ExerciseList.tsx
    - src/components/templates/ExerciseRow.tsx
  modified: []

key-decisions:
  - "Use field.id as key (NOT array index) for useFieldArray to prevent React key errors during reordering"
  - "PointerSensor with distance: 8 constraint prevents accidental drags"
  - "Flat checkbox list for exercise selection (per CONTEXT.md decision)"
  - "Zod superRefine validates duplicate exercises and min <= max reps constraint"

patterns-established:
  - "useFieldArray pattern: Complete defaultValues for append() prevents controlled/uncontrolled warnings"
  - "Drag-and-drop pattern: useSortable in child component, DndContext + SortableContext in parent"
  - "Form composition: Split into ExerciseRow (single item), ExerciseList (sortable container), TemplateBuilder (main form)"

# Metrics
duration: 4min
completed: 2026-01-28
---

# Phase 2 Plan 3: Template Builder Components Summary

**React Hook Form-based template builder with drag-and-drop exercise ordering using dnd-kit, Zod validation for rep ranges and exercise uniqueness**

## Performance

- **Duration:** 4 min
- **Started:** 2026-01-28T12:48:00Z
- **Completed:** 2026-01-28T12:52:17Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Built TemplateBuilder form component integrating React Hook Form, Zod validation, and useFieldArray
- Created ExerciseList wrapper with DndContext for drag-and-drop reordering
- Implemented ExerciseRow sortable component with useSortable hook
- Implemented complete form validation: name required, min 1 exercise, duplicate detection, min <= max reps
- Established drag-and-drop pattern with distance constraint to prevent accidental drags

## Task Commits

Each task was committed atomically:

1. **Task 1: Create ExerciseRow sortable component** - `99f89d0` (feat)
2. **Task 2: Create ExerciseList with dnd-kit** - `8b4ca27` (feat)
3. **Task 3: Create TemplateBuilder form component** - `21ef54a` (feat)

## Files Created/Modified
- `src/components/templates/ExerciseRow.tsx` - Sortable exercise row with drag handle, rep range inputs, sets input, expandable options for rest time and replacement exercise
- `src/components/templates/ExerciseList.tsx` - Wraps ExerciseRow components in DndContext + SortableContext for vertical drag-and-drop reordering
- `src/components/templates/TemplateBuilder.tsx` - Main form component with React Hook Form, Zod validation, checkbox exercise picker, integrates ExerciseList for drag-drop

## Decisions Made

**DEV-017:** Use field.id as key for useFieldArray items (NOT array index)
- Prevents React key errors during drag-and-drop reordering
- Per react-hook-form and dnd-kit best practices documented in RESEARCH.md

**DEV-018:** PointerSensor with distance constraint prevents accidental drags
- activationConstraint: { distance: 8 } requires 8px movement before drag starts
- Prevents drag activation on click or scroll

**DEV-019:** Zod superRefine for cross-field validation
- Validates each exercise appears only once in template
- Validates min_reps <= max_reps for each exercise
- Custom error messages with proper path targeting for field-level errors

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Template builder components are complete and ready for integration into template management UI. Next plan (02-04) will create the template list view that uses these components for create/edit operations.

Key integration points:
- TemplateBuilder expects exercises array (from useExercises hook)
- TemplateBuilder onSubmit receives TemplateFormData matching Template shape
- TemplateBuilder supports both create (no template prop) and edit (with template prop) modes

---
*Phase: 02-templates-logging*
*Completed: 2026-01-28*
