# Architecture Research: v1.4

**Domain:** React + DuckDB-WASM PWA - Exercise Comparison, UX Tightening, Theme Redesign
**Researched:** 2026-02-01
**Confidence:** HIGH (based on direct source code analysis)

## Executive Summary

v1.4 adds multi-exercise comparison to analytics, renames "Templates" to "Plans" in the UI, introduces collapsible sections to the analytics page, reorders settings sections, and evolves the dark theme toward a softer/modern aesthetic. All features integrate cleanly with the existing architecture. The exercise comparison feature is the most substantial change (new SQL, new hook, new component), while the remaining items are primarily UI-layer modifications with no data model changes.

**Key finding:** The existing `exerciseProgressSQL(days)` factory function already returns per-exercise daily aggregates. The comparison feature can reuse this query pattern by executing it for multiple exercise IDs, or create a single new SQL query that accepts multiple IDs. No event schema changes are needed for any v1.4 feature.

---

## Exercise Comparison

### Architecture Decision: Single Query vs Multiple Queries

**Option A: Multiple parallel queries** -- Call existing `exerciseProgressSQL(days)` once per selected exercise, merge results client-side.
- Pro: Zero SQL changes, reuses proven query
- Con: N database connections for N exercises, wasteful CTE re-execution

**Option B: New multi-exercise SQL query** -- Single query accepting an array/list of exercise IDs, returning all series in one result set.
- Pro: Single DB connection, single CTE evaluation, cleaner data flow
- Con: New SQL function to maintain

**Recommendation: Option B.** A single query is more efficient and follows the existing pattern of purpose-built SQL functions in `compiled-queries.ts`. The existing `exerciseProgressSQL` already contains the full CTE chain; the new query just removes the `WHERE d.exercise_id = $1` single-exercise filter and uses `WHERE d.exercise_id IN (...)`.

### New SQL Query

Add to `src/db/compiled-queries.ts`:

```typescript
export function exerciseComparisonSQL(days: number | null, exerciseIds: string[]): string {
  const timeFilter = days !== null
    ? `CAST(logged_at AS TIMESTAMPTZ) >= CURRENT_DATE - INTERVAL '${days} days'`
    : `1=1`;

  const idList = exerciseIds.map(id => `'${id}'`).join(', ');

  return `
WITH daily_aggregates AS (
    SELECT
        original_exercise_id AS exercise_id,
        DATE_TRUNC('day', CAST(logged_at AS TIMESTAMPTZ))::DATE AS date,
        MAX(weight_kg) AS max_weight,
        MAX(estimated_1rm) AS max_1rm,
        SUM(weight_kg * reps) AS total_volume,
        COUNT(*) AS set_count
    FROM (${FACT_SETS_SQL}) fact_sets
    WHERE ${timeFilter}
    GROUP BY original_exercise_id, DATE_TRUNC('day', CAST(logged_at AS TIMESTAMPTZ))::DATE
),

exercise_dim_all AS (
    ${DIM_EXERCISE_ALL_SQL}
)

SELECT
    d.exercise_id,
    d.date,
    d.max_weight,
    d.max_1rm,
    d.total_volume,
    d.set_count,
    e.name AS exercise_name,
    e.muscle_group
FROM daily_aggregates d
INNER JOIN exercise_dim_all e ON d.exercise_id = e.exercise_id
WHERE d.exercise_id IN (${idList})
ORDER BY d.exercise_id, d.date
`;
}
```

This is essentially `exerciseProgressSQL` with the single `$1` param replaced by an `IN (...)` clause. The CTE structure is identical, ensuring consistent data semantics.

### New Hook: `useExerciseComparison`

Create `src/hooks/useExerciseComparison.ts`:

```typescript
interface UseExerciseComparisonOptions {
  exerciseIds: string[];  // 2-4 exercise IDs
  days: number | null;
}

interface ComparisonSeries {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  data: ProgressPoint[];  // Reuse existing ProgressPoint type
}

interface UseExerciseComparisonReturn {
  series: ComparisonSeries[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}
```

**Pattern:** Follows existing `useExerciseProgress` exactly -- `getDuckDB()`, connect, query, map rows, close connection. Groups results by `exercise_id` before returning.

**Key detail:** The hook should skip fetching when `exerciseIds.length < 2` (comparison needs at least 2 exercises). Return empty series in that case.

### New Components

**1. `src/components/analytics/ExerciseComparisonChart.tsx`**

Multi-line chart overlaying selected exercises. Each exercise gets a distinct color from a predefined palette. Reuses `ChartContainer` wrapper and Recharts `LineChart`.

```
ExerciseComparisonChart
  Props: { series: ComparisonSeries[], metric: 'maxWeight' | 'max1rm' | 'totalVolume' }
  Uses: Recharts LineChart with one <Line> per series
  Colors: Assign from palette array by index (e.g., accent, chart-primary, chart-success, warning)
```

**2. `src/components/analytics/ExerciseMultiSelect.tsx`**

Multi-select UI for choosing 2-4 exercises to compare. Two approaches:

- **Option A: Pill-based multi-select.** Tap exercise name to toggle selection, selected exercises show as pills above the list. Cap at 4 selections.
- **Option B: Checkbox list within a collapsible.** Each exercise row has a checkbox. Simple but takes more vertical space.

**Recommendation: Option A (pill-based).** It is more compact on mobile and provides clear visual feedback. Implementation:
- Render exercise list (reuse `useExercises()` hook)
- State: `selectedIds: string[]` (max 4)
- Toggle logic: add/remove from array, enforce max
- Display selected as removable pills above the selector

**3. `src/components/analytics/ComparisonSection.tsx`**

Container component that composes `ExerciseMultiSelect` + `ExerciseComparisonChart`. Wraps in `FeatureErrorBoundary`. Uses `CollapsibleSection` (already exists).

### Integration into AnalyticsPage

Insert new section between "Exercise Detail" (Section 4) and "Progression Intelligence" (Section 5) in `AnalyticsPage.tsx`:

```tsx
{/* SECTION 4.5: Exercise Comparison */}
<CollapsibleSection title="Exercise Comparison" defaultOpen={false}>
  <FeatureErrorBoundary feature="Exercise Comparison">
    <ComparisonSection days={days} />
  </FeatureErrorBoundary>
</CollapsibleSection>
```

**`defaultOpen={false}`** because this is an optional deep-dive feature. Users who want it will expand it; it does not add to default page weight.

### Data Flow

```
AnalyticsPage (timeRange state -> days)
  └── ComparisonSection (days prop)
        ├── ExerciseMultiSelect (selectedIds state)
        │     └── useExercises() (already loaded in AnalyticsPage, can lift)
        └── ExerciseComparisonChart
              └── useExerciseComparison({ exerciseIds, days })
                    └── exerciseComparisonSQL(days, exerciseIds) -> DuckDB
```

---

## Theme Redesign: Soft/Modern Dark

### Current Token Inventory (18 OKLCH tokens + 7 legacy)

The theme lives entirely in `src/index.css` `@theme` block. Current tokens:

| Category | Tokens | Count |
|----------|--------|-------|
| Backgrounds | bg-primary, bg-secondary, bg-tertiary, bg-elevated | 4 |
| Text | text-primary, text-secondary, text-muted | 3 |
| Borders | border-primary, border-secondary | 2 |
| Accent | accent, accent-hover, accent-muted | 3 |
| Semantic | success, error, warning | 3 |
| Chart | chart-primary, chart-success, chart-muted | 3 |
| Chart zones | 5 zone colors | 5 |
| Chart tooltip | tooltip-bg, tooltip-border | 2 |
| Legacy HSL | accent, chart-primary, chart-success, chart-muted | 4 |
| Radius | radius-sm, radius-md, radius-lg | 3 |

### Token Changes for "Soft/Modern" Aesthetic

The current theme already uses OKLCH with low chroma (0.01) for neutrals, which is good. The "soft/modern" evolution involves:

**1. Background warmth shift** -- Move hue from 270 (blue-violet) to ~260-265 (bluer) or ~280 (warmer violet), and slightly increase chroma for warmer feel:

```css
/* Current: cool blue-gray */
--color-bg-primary: oklch(18% 0.01 270);
--color-bg-secondary: oklch(22% 0.01 270);

/* Soft/modern: slightly warmer, hint of warmth */
--color-bg-primary: oklch(16% 0.008 280);      /* deeper, warmer */
--color-bg-secondary: oklch(21% 0.008 280);
--color-bg-tertiary: oklch(26% 0.008 280);
--color-bg-elevated: oklch(30% 0.01 280);
```

**2. Border softening** -- Reduce contrast of borders, add slight transparency feel:

```css
--color-border-primary: oklch(25% 0.008 280);   /* softer separation */
--color-border-secondary: oklch(35% 0.01 280);
```

**3. Text warmth** -- Shift text from pure blue-gray toward neutral-warm:

```css
--color-text-primary: oklch(92% 0.005 280);    /* slightly warmer white */
--color-text-secondary: oklch(70% 0.008 280);
--color-text-muted: oklch(58% 0.008 280);
```

### New CSS Properties (Beyond Tokens)

**1. Border radius increase** -- Current system uses 6/8/12px. Modern UIs trend toward 12/16/20px:

```css
--radius-sm: 0.5rem;    /* 8px (was 6px) */
--radius-md: 0.75rem;   /* 12px (was 8px) */
--radius-lg: 1rem;      /* 16px (was 12px) */
--radius-xl: 1.25rem;   /* 20px (new - for large cards, modals) */
```

**2. New tokens needed:**

```css
/* Subtle shadow for depth (currently not used) */
--shadow-card: 0 1px 3px oklch(0% 0 0 / 0.2), 0 1px 2px oklch(0% 0 0 / 0.1);
--shadow-elevated: 0 4px 12px oklch(0% 0 0 / 0.3);

/* Gradient overlay for hero cards */
--gradient-card: linear-gradient(135deg, oklch(22% 0.015 280), oklch(25% 0.01 260));
```

**3. Component-level CSS changes** -- These do NOT require new tokens, just updated Tailwind classes in components:

| Property | Current Pattern | Modern Pattern | Impact |
|----------|----------------|----------------|--------|
| Card borders | `border border-border-primary` | `border border-border-primary/50` (semi-transparent) | Many components |
| Card backgrounds | `bg-bg-secondary` | `bg-bg-secondary` + subtle shadow | Card components |
| Buttons | `rounded-lg` (8px) | `rounded-xl` (larger) | Button component |
| Inputs | Sharp focus ring | Softer focus with glow | Input component |
| Section dividers | `<hr>` with border | Spacing-only or gradient line | Settings, Analytics |

### Component Impact Assessment

**High impact (visual changes throughout):**
- `src/index.css` -- Token value changes (single file, affects everything)
- `src/components/ui/Button.tsx` -- Radius, possibly shadow
- `src/components/ui/Input.tsx` -- Radius, focus styles

**Medium impact (card-like components):**
- `src/components/analytics/SummaryStatsCards.tsx`
- `src/components/analytics/WeekComparisonCard.tsx`
- `src/components/analytics/PRListCard.tsx`
- `src/components/analytics/ProgressionStatusCard.tsx`
- `src/components/templates/TemplateCard.tsx`
- `src/components/rotation/QuickStartCard.tsx`
- `src/components/workout/RecentWorkoutCard.tsx`

**Low impact (structural components, only radius changes):**
- `src/components/backup/BackupSettings.tsx` -- Section styling
- `src/components/analytics/AnalyticsPage.tsx` -- Container padding

### Migration Strategy

Token values in `@theme` are consumed globally via Tailwind's `bg-bg-primary`, `text-text-primary`, etc. Changing token VALUES in `index.css` instantly propagates everywhere. This means:

1. **Phase 1: Token values only.** Change OKLCH values in `index.css`. Zero component changes needed. Instantly updates entire app. This is the lowest-risk, highest-impact change.
2. **Phase 2: Radius and new tokens.** Update radius values, add shadow/gradient tokens. Update a few component classes.
3. **Phase 3: Component refinements.** Per-component Tailwind class updates for borders, shadows, gradients.

---

## UX Tightening

### Templates -> Plans Rename

**Scope assessment:** This is a UI text rename only. The internal code identifiers (`template_id`, `template_created`, `useTemplates`, `TemplateList`, etc.) stay as-is. Renaming code identifiers would be a large, risky refactor with zero user-facing benefit. The event types in the database (`template_created`, `template_updated`, etc.) absolutely must NOT change because existing user data contains these event types.

**Decision: UI text only. No code identifier changes.**

**Files requiring text changes:**

| File | What Changes |
|------|-------------|
| `src/components/Navigation.tsx` | Tab label: "Templates" -> "Plans" |
| `src/components/templates/TemplateList.tsx` | Heading "Templates" -> "Plans", button text "New Template" -> "New Plan", empty states |
| `src/components/templates/TemplateBuilder.tsx` | Form heading "Create/Edit Template" -> "Create/Edit Plan" |
| `src/components/templates/TemplateCard.tsx` | Any "template" text in card UI |
| `src/components/workout/StartWorkout.tsx` | Label "What workout?" references, "Select template..." placeholder, "No templates yet" message, "Templates tab" reference |
| `src/components/rotation/QuickStartCard.tsx` | Any template references in UI text |
| `src/components/settings/RotationSection.tsx` | Template references in rotation UI |
| `src/App.tsx` | FeatureErrorBoundary label: `feature="Templates"` -> `feature="Plans"` |
| `src/e2e/helpers/selectors.ts` | `navTemplates` data-testid value (consider keeping testid stable, only change visible text) |
| `src/e2e/plan-crud.spec.ts` | Already named "plan-crud" -- may already use "Plan" terminology |
| `src/e2e/workout-rotation.spec.ts` | Template text references in assertions |
| `src/e2e/batch-logging.spec.ts` | Template text references in assertions |

**Files that do NOT change (code identifiers stay):**
- `src/hooks/useTemplates.ts` -- hook name stays `useTemplates`
- `src/types/template.ts` -- `Template`, `TemplateExercise` interfaces stay
- `src/types/events.ts` -- `TemplateCreatedEvent` etc. stay
- `src/db/queries.ts` -- `getTemplates()` stays
- `src/stores/useWorkoutStore.ts` -- `template_id` field stays
- `src/stores/useRotationStore.ts` -- `template_ids` stays
- `src/components/templates/` -- Directory name stays (could rename later but unnecessary)

**Total: ~10 files with text changes, 0 files with code changes.**

### Collapsible Sections in Analytics

**Existing infrastructure:** `src/components/analytics/CollapsibleSection.tsx` already exists and uses native HTML `<details>/<summary>`. It is a clean, accessible, zero-JS component. `StartWorkout.tsx` also uses native `<details>` directly.

**Decision: Use the existing `CollapsibleSection` component.** No new component needed.

**Integration into AnalyticsPage:** Currently, `AnalyticsPage.tsx` uses `SectionHeading` for section titles. The change is straightforward:

```tsx
// Before:
<SectionHeading title="Volume Overview" subtitle="..." />
{/* section content */}

// After:
<CollapsibleSection title="Volume Overview" defaultOpen={true}>
  {/* section content */}
</CollapsibleSection>
```

**Which sections get collapsible behavior:**

| Section | Default State | Rationale |
|---------|--------------|-----------|
| Summary Stats | Always open (no collapse) | Hero metrics, always visible |
| Volume Overview | Open | Primary analytics view |
| Training Balance | Open | Key training metric |
| Exercise Detail | Open | Most-used section |
| Exercise Comparison (new) | Closed | Optional deep-dive |
| Progression Intelligence | Open | Important status info |

**Impact:** Only `AnalyticsPage.tsx` changes. Replace `SectionHeading` imports with `CollapsibleSection` where appropriate. `SectionHeading` component can remain for sections that should not collapse (Summary Stats).

### Settings Reorder

**Current settings page layout** (`BackupSettings.tsx`):

1. Workout Rotations (`RotationSection`)
2. Workout Preferences (weight unit, rest timer, sound)
3. Data Backup (export/import)
4. Restore from Backup
5. TOON Export (`ToonExportSection`)
6. Demo Data & Clear All (`DemoDataSection`)
7. System Observability (`ObservabilitySection`)
8. Data Quality (`DataQualitySection`)

**Recommended reorder** (user-facing features first, developer/admin features last):

1. Workout Preferences (most commonly accessed)
2. Workout Rotations
3. Data Backup + Restore (combined)
4. TOON Export
5. Demo Data & Clear All
6. System Observability (developer feature)
7. Data Quality (developer feature)

**Implementation:** This is purely JSX reordering within `BackupSettings.tsx`. No props changes, no new components, no state changes. The sections are already self-contained components or inline JSX blocks.

**Complexity: Trivial.** Move JSX blocks within the `<div className="space-y-8">` container. Estimated: 15 minutes of work.

---

## Suggested Build Order

Build order considers dependencies, risk, and visual impact:

### Phase 1: Theme Token Values (Foundation)

**Why first:** Changing token values in `index.css` is the lowest-risk change and instantly transforms the entire app aesthetic. Everything built after this inherits the new look.

**Scope:**
- Update OKLCH values in `src/index.css` `@theme` block
- Update radius values
- Add new tokens (shadow, gradient) if needed
- Visual QA pass

**Files:** `src/index.css` only (for token values)

**Dependencies:** None

### Phase 2: Templates -> Plans Rename

**Why second:** Simple text changes across ~10 files, low risk, high user-facing impact. Quick win.

**Scope:**
- UI text changes in all component files
- Update e2e test assertions
- Navigation label change

**Files:** ~10 files (see list above)

**Dependencies:** None

### Phase 3: Settings Reorder + Collapsible Analytics Sections

**Why together:** Both are pure JSX restructuring with no new logic. Can be done in a single plan.

**Scope:**
- Reorder sections in `BackupSettings.tsx`
- Wrap analytics sections in `CollapsibleSection` in `AnalyticsPage.tsx`

**Files:** 2 files (`BackupSettings.tsx`, `AnalyticsPage.tsx`)

**Dependencies:** None

### Phase 4: Exercise Comparison Feature

**Why last:** Most complex change -- new SQL, new hook, new components. Benefits from theme already being in place (charts inherit new tokens).

**Scope:**
1. Add `exerciseComparisonSQL()` to `compiled-queries.ts`
2. Create `useExerciseComparison` hook
3. Create `ExerciseMultiSelect` component
4. Create `ExerciseComparisonChart` component
5. Create `ComparisonSection` container
6. Integrate into `AnalyticsPage.tsx`

**Files:** 1 modified (`compiled-queries.ts`, `AnalyticsPage.tsx`), 4 created

**Dependencies:** Collapsible sections (Phase 3) should be done first so comparison section can use `CollapsibleSection`

### Phase 5: Theme Component Refinements

**Why last:** Fine-tuning card borders, shadows, button styles. Depends on Phase 1 tokens being settled. This is polish.

**Scope:**
- Update card components with shadow/gradient classes
- Refine border opacity
- Button and input style updates

**Files:** ~10 card/UI component files

**Dependencies:** Phase 1 (token values established)

---

## File Impact Summary

| Area | Files Modified | Files Created |
|------|---------------|---------------|
| **Theme tokens** | `src/index.css` | None |
| **Theme component refinements** | ~10 card/UI components | None |
| **Templates -> Plans rename** | ~10 files (text only) | None |
| **Settings reorder** | `src/components/backup/BackupSettings.tsx` | None |
| **Collapsible analytics** | `src/components/analytics/AnalyticsPage.tsx` | None |
| **Exercise comparison** | `src/db/compiled-queries.ts`, `src/components/analytics/AnalyticsPage.tsx` | `src/hooks/useExerciseComparison.ts`, `src/components/analytics/ExerciseMultiSelect.tsx`, `src/components/analytics/ExerciseComparisonChart.tsx`, `src/components/analytics/ComparisonSection.tsx` |

**Total: ~25 files modified, 4 files created**

---

## Architectural Risks

### Risk 1: Exercise Comparison Query Performance

**Risk:** Querying for 4 exercises across "ALL" time range could be slow with large datasets.

**Mitigation:** The `exerciseComparisonSQL` already benefits from the same CTE chain as `exerciseProgressSQL`. Time filtering via `days` parameter limits data volume. Cap at 4 exercises maximum.

**Severity:** Low. DuckDB aggregations are fast; existing single-exercise queries run in <100ms.

### Risk 2: Theme Changes Breaking Chart Colors

**Risk:** Charts use both OKLCH tokens and legacy HSL values (see `ExerciseProgressChart.tsx` using `hsl(var(--accent))` and `hsl(var(--chart-success))`). Changing only OKLCH tokens leaves legacy HSL references inconsistent.

**Mitigation:** The theme phase should also update the legacy HSL values in `index.css` to match the new aesthetic, OR migrate remaining chart components from HSL to OKLCH. The `ExerciseProgressChart.tsx` still uses `hsl(var(--accent))` and `hsl(var(--chart-success))` which are legacy.

**Severity:** Medium. Must be addressed in theme phase.

### Risk 3: Rename Breaking E2E Tests

**Risk:** Changing "Templates" to "Plans" in UI text could break e2e test assertions that match on visible text.

**Mitigation:** Keep `data-testid` attributes stable (e.g., `nav-templates` stays). Only change visible text content. Review all e2e files for text assertions. Note: `plan-crud.spec.ts` already exists suggesting some rename work may have been anticipated.

**Severity:** Low. Systematic text search covers this.

---

## Confidence Assessment

| Area | Level | Rationale |
|------|-------|-----------|
| Exercise comparison SQL | HIGH | Direct extension of existing `exerciseProgressSQL` pattern, verified in source |
| Exercise comparison hook | HIGH | Identical pattern to `useExerciseProgress`, verified in source |
| Theme token changes | HIGH | `@theme` block is self-contained, changes propagate automatically via Tailwind |
| Templates -> Plans scope | HIGH | Full grep of codebase completed, all references cataloged |
| Collapsible sections | HIGH | `CollapsibleSection` component already exists and is proven |
| Settings reorder | HIGH | Pure JSX reordering, self-contained sections |
| Chart color migration | MEDIUM | Legacy HSL values need attention, exact migration path needs testing |
| Multi-select UX | MEDIUM | Pill-based selection is standard pattern but needs mobile testing |

---

## Sources

All findings based on direct source code analysis of the following files:
- `src/db/compiled-queries.ts` (SQL query patterns)
- `src/hooks/useAnalytics.ts` (hook patterns)
- `src/hooks/useExercises.ts` (hook patterns)
- `src/components/analytics/AnalyticsPage.tsx` (page structure)
- `src/components/analytics/ExerciseProgressChart.tsx` (chart implementation)
- `src/components/analytics/CollapsibleSection.tsx` (collapsible pattern)
- `src/components/templates/TemplateList.tsx` (template UI text)
- `src/components/Navigation.tsx` (tab structure)
- `src/components/backup/BackupSettings.tsx` (settings layout)
- `src/components/workout/StartWorkout.tsx` (template references)
- `src/index.css` (theme tokens)
- `src/types/events.ts` (event schema)
- `src/types/template.ts` (template types)
- `src/e2e/helpers/selectors.ts` (test selectors)
