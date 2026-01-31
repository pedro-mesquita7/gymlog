---
phase: 08-testing-design-foundation
plan: 04
subsystem: ui
tags: [react, tailwind, design-system, components, primitives]

# Dependency graph
requires:
  - phase: 08-02
    provides: Tailwind CSS 4 @theme design tokens (--color-accent, --color-bg-*, --color-border-*)
provides:
  - Button primitive component with variant (primary/secondary/ghost/danger) and size (sm/md/lg) props
  - Input/Select primitive components with consistent styling from design tokens
  - Card primitive component with default and interactive variants
  - Three migrated components using new primitives (StartWorkout, SetLogger, TemplateCard)
affects: [08-05, 08-06, 09, batch-logging, visual-polish]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Variant-driven primitive components (Button, Card)
    - ComponentPropsWithoutRef for native prop forwarding
    - Tailwind class merging for composable styling
    - Design token usage (bg-zinc-800, border-zinc-700, focus:border-accent)

key-files:
  created:
    - src/components/ui/Button.tsx
    - src/components/ui/Input.tsx
    - src/components/ui/Card.tsx
  modified:
    - src/components/workout/StartWorkout.tsx
    - src/components/workout/SetLogger.tsx
    - src/components/templates/TemplateCard.tsx

key-decisions:
  - "Button variants cover all common use cases (primary accent, secondary zinc, ghost transparent, danger red)"
  - "Size lg maps to full-width py-4 for primary CTAs (Start Workout, Log Set)"
  - "Input/Select share same base styling for consistency across form elements"
  - "Card uses bg-zinc-800/50 matching existing pattern, not bg-secondary token (visual regression prevention)"
  - "Simple string concatenation for className merging (no clsx dependency needed)"
  - "NumberStepper buttons NOT migrated (custom sizing logic, would require props that break abstraction)"

patterns-established:
  - "UI primitives in src/components/ui/ export single component per file"
  - "Variant props use TypeScript union types for type safety"
  - "Base styles + variant styles + size styles + disabled styles pattern"
  - "Forward all native HTML props via ComponentPropsWithoutRef<'element'>"
  - "className prop for extending/overriding styles"
  - "Migration preserves visual appearance (no design changes during extraction)"

# Metrics
duration: 6m 36s
completed: 2026-01-31
---

# Phase 08 Plan 04: UI Primitive Components Summary

**Button, Input, Select, and Card primitives extracted with variant-driven APIs, migrated three components (StartWorkout, SetLogger, TemplateCard) to use new primitives**

## Performance

- **Duration:** 6m 36s
- **Started:** 2026-01-31T00:48:12Z
- **Completed:** 2026-01-31T00:54:48Z
- **Tasks:** 6 (3 already complete from 08-03, 3 migration tasks)
- **Files modified:** 6 (3 created, 3 migrated)

## Accomplishments
- Created Button primitive with 4 variants (primary/secondary/ghost/danger) and 3 sizes (sm/md/lg)
- Created Input/Select primitives using design tokens for consistent form styling
- Created Card primitive with default and interactive variants
- Migrated StartWorkout.tsx to use Button and Select primitives
- Migrated SetLogger.tsx to use Button primitive (Log Set button)
- Migrated TemplateCard.tsx to use Card and Button primitives (menu items, delete button)

## Task Commits

Each task was committed atomically:

1. **Tasks 1-3: Create Button, Input, Card primitives** - `80340e8` (feat) - Already completed in 08-03
2. **Task 4: Migrate StartWorkout.tsx** - `077299e` (feat)
3. **Task 5: Migrate SetLogger.tsx** - `d7f2577` (feat)
4. **Task 6: Migrate TemplateCard.tsx** - `b11ffcd` (feat)

## Files Created/Modified

**Created:**
- `src/components/ui/Button.tsx` - Variant-driven button component (primary/secondary/ghost/danger, sm/md/lg sizes)
- `src/components/ui/Input.tsx` - Input and Select components with design token styling
- `src/components/ui/Card.tsx` - Container component with default and interactive variants

**Modified:**
- `src/components/workout/StartWorkout.tsx` - Migrated to use Select and Button primitives
- `src/components/workout/SetLogger.tsx` - Migrated Log Set button to Button primitive
- `src/components/templates/TemplateCard.tsx` - Migrated to use Card wrapper and Button primitives for menu

## Decisions Made

**1. Button variant design matches existing visual patterns**
- `primary`: bg-accent (orange) with black text - used for main CTAs (Start Workout, Log Set)
- `secondary`: bg-zinc-800 with zinc-100 text - used for secondary actions
- `ghost`: transparent bg with hover state - used for menu items
- `danger`: red text variant - used for delete actions

**2. Size lg maps to full-width pattern**
- `size="lg"` adds `w-full py-4 text-lg font-bold` to match existing primary CTA buttons
- Prevents need to pass className="w-full" on every primary button

**3. Card background uses existing pattern, not design token**
- Used `bg-zinc-800/50` instead of `bg-secondary` to preserve exact visual appearance
- Prevents regression during primitive extraction (goal is consistency, not visual changes)

**4. NumberStepper buttons not migrated**
- NumberStepper has custom sizing logic (w-12 h-12) that doesn't fit Button size variants
- Migrating would require adding size="custom" or similar, breaking abstraction
- Left as-is per plan guidance ("Do NOT migrate NumberStepper's internal buttons")

**5. Simple className concatenation, no clsx dependency**
- Used array `.filter(Boolean).join(' ')` pattern for class merging
- Sufficient for current needs, avoids adding dependency
- Can upgrade to clsx/cn later if conditional logic becomes complex

## Deviations from Plan

**1. [Rule 0 - Already Complete] Primitives already created in 08-03**
- **Found during:** Task 1 (Create Button.tsx)
- **Issue:** Button.tsx, Input.tsx, Card.tsx already existed from commit 80340e8 (08-03 plan)
- **Fix:** Verified existing implementations match plan requirements exactly, skipped re-creation
- **Files affected:** src/components/ui/Button.tsx, Input.tsx, Card.tsx
- **Verification:** Read committed files, confirmed variant props, size props, and design token usage match plan spec
- **Impact:** No re-commit needed, proceeded directly to migration tasks

---

**Total deviations:** 1 (primitives already complete from previous plan)
**Impact on plan:** Zero impact. Primitives match spec exactly, migration tasks completed successfully.

## Issues Encountered

None - primitives already existed with correct implementation, migrations completed without issues.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for:**
- 08-05: Component unit tests (can test Button, Input, Card primitives)
- 08-06: Visual regression testing (can capture primitive variants)
- 09: Batch logging UI (can use Button and Card primitives)
- Visual polish (consistent primitive usage across app)

**Established patterns:**
- UI primitives in `src/components/ui/` directory
- Variant-driven component APIs
- Design token usage for consistent theming
- ComponentPropsWithoutRef for native prop forwarding

**Migration strategy proven:**
- Visual consistency maintained (no regressions)
- TypeScript compilation successful
- Build succeeds with no errors
- Pattern can extend to remaining components (GymForm, ExerciseForm, etc.)

**Next components to migrate (future plans):**
- GymForm, ExerciseForm, ExerciseList (various button patterns)
- DeleteConfirmation (can use Button primitives for confirm/cancel)
- ProgressionAlert (can use Card primitive for alert container)

---
*Phase: 08-testing-design-foundation*
*Completed: 2026-01-31*
