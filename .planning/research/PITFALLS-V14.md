# Pitfalls Research: v1.4 — Theme Redesign, Rename, Comparison, UX Changes

**Domain:** Adding features and refactoring an existing 14,826-line TypeScript PWA
**Researched:** 2026-02-01
**Confidence:** HIGH (based on direct codebase analysis of all affected files)

---

## 1. Theme Redesign Pitfalls (OKLCH Token Changes)

The app has 18+ OKLCH tokens in `src/index.css` used across 37+ files, plus 4 legacy HSL tokens and hardcoded color values in chart components.

| Pitfall | Impact | Prevention |
|---------|--------|------------|
| **Changing token values breaks WCAG contrast ratios** | Text becomes illegible. The current `text-muted` was already bumped from 55% to 59% lightness for WCAG AA 4.5:1. Adjusting background lightness without rechecking contrast math breaks accessibility. | Before changing ANY background token, recalculate contrast ratios for all text tokens against it. Use an OKLCH contrast checker (not hex-based). Document the contrast ratio for each bg/text pair. |
| **Legacy HSL tokens drift from new OKLCH values** | Lines 51-56 of `index.css` contain `--chart-primary`, `--chart-success`, `--chart-muted`, and `--accent` in HSL format marked "backward compat." Updating OKLCH tokens without updating these creates visual inconsistency in any chart component still referencing them. | Search for all HSL variable references (`var(--chart-`, `var(--accent)`) before the theme change. Either migrate remaining consumers to OKLCH or update HSL values to match. |
| **Hardcoded colors in Recharts components** | Chart tooltip backgrounds, grid lines, and axis labels often have inline `fill`, `stroke`, or `style` props with hardcoded colors that bypass the token system. The `--color-chart-tooltip-bg` and `--color-chart-tooltip-border` tokens exist but may not be used everywhere. | Grep for `oklch(`, `hsl(`, `rgb(`, `#[0-9a-fA-F]` in all `.tsx` files. Each match is a potential bypass of the token system. Convert to `var(--color-*)` references before changing tokens. |
| **Tailwind `bg-bg-tertiary/30` opacity modifiers become wrong** | `AnalyticsPage.tsx` uses `bg-bg-tertiary/30` (line 113, 133, 166). If bg-tertiary lightness changes, the 30% opacity may produce a different visual result than intended. Opacity-modified colors are not linear in OKLCH. | Catalog all `/[0-9]+` opacity modifiers on color classes. After token changes, visually verify each one. Consider replacing opacity modifiers with dedicated tokens for semi-transparent surfaces. |
| **`text-black` on accent buttons breaks on lighter accent** | `BackupSettings.tsx` line 70 uses `text-black` directly on accent-colored buttons. If the accent color changes to something lighter, black text may not have enough contrast — or if accent goes darker, it needs white text. | Search for all `text-black` and `text-white` classes. These are hardcoded assumptions about what they sit on. Replace with a semantic `--color-accent-text` token. |
| **MuscleHeatMap has inline OKLCH** | `src/components/analytics/MuscleHeatMap.tsx` was flagged in the oklch grep results, meaning it contains direct OKLCH values rather than token references. Theme changes won't propagate. | Read `MuscleHeatMap.tsx`, extract all inline OKLCH to tokens before changing the theme. |
| **DemoDataSection has inline OKLCH** | Same issue — `DemoDataSection.tsx` appeared in the oklch grep. | Same fix: extract to tokens first. |

### Theme Redesign Sequence (Recommended)

1. Audit: grep all hardcoded colors and legacy HSL references
2. Extract: move all hardcoded colors to tokens
3. Migrate: convert remaining HSL consumers to OKLCH tokens
4. Change: update token values in one place (`index.css`)
5. Verify: check all contrast ratios, opacity modifiers, and chart visuals

---

## 2. Rename Pitfalls ("Templates" to "Plans")

The word "template" appears in **40 source files** across 7 layers. This is the full inventory of what must change:

| Layer | Files | Specific References | Risk if Missed |
|-------|-------|---------------------|----------------|
| **TypeScript types** | `types/template.ts`, `types/events.ts`, `types/workout-session.ts` | `Template`, `TemplateExercise`, `TemplateCreatedEvent`, `TemplateUpdatedEvent`, `TemplateDeletedEvent`, `TemplateArchivedEvent`, `template_id` field | Type errors catch these at compile time. LOW risk. |
| **Event type string literals** | `types/events.ts` | `'template_created'`, `'template_updated'`, `'template_deleted'`, `'template_archived'` | **CRITICAL: These are stored in the database.** Changing the event_type string means old events won't match new queries. Existing user data breaks silently. |
| **SQL queries** | `db/queries.ts` lines 93-113, `hooks/useWorkoutSummary.ts` line 163, `services/toon-export.ts` lines 116-126 | `event_type IN ('template_created', ...)`, `payload->>'template_id'` | **CRITICAL: Same issue — SQL queries filter on stored event_type strings.** |
| **dbt models** | `dbt/models/marts/core/fact_workouts.sql`, `dbt/models/staging/events/stg_events__workout_started.sql`, `dbt/models/marts/analytics/` | `template_id` column references | dbt models reference stored event payload keys. Renaming breaks analytics queries. |
| **Zustand stores** | `stores/useWorkoutStore.ts`, `stores/useRotationStore.ts` | `template_id`, `template_ids`, `selectNextTemplate` | `useRotationStore` persists to localStorage as `gymlog-rotations` with `template_ids` keys. Renaming the field name in code without migrating localStorage breaks existing rotations. |
| **React components** | `components/templates/*.tsx`, `Navigation.tsx` | File names, component names, `Tab` type union `'templates'` | The `Tab` type on line 1 of `Navigation.tsx` uses `'templates'` as a literal. This flows through `App.tsx` conditional rendering. |
| **E2E selectors** | `e2e/helpers/selectors.ts` | `navTemplates`, `templateSelect`, `templateNameInput`, `btnCreateTemplate`, `btnTemplateMenu`, `btnTemplateDelete` | E2E tests break but this is caught in CI. MEDIUM risk. |
| **E2E test content** | `e2e/plan-crud.spec.ts`, `e2e/batch-logging.spec.ts`, `e2e/workout-rotation.spec.ts` | `"+ New Template"`, `"Batch Template"`, button text matchers | Text-based selectors like `button:has-text("+ New Template")` break if UI text changes to "Plans." |
| **data-testid values** | 18 component files | `data-testid="nav-templates"`, `data-testid="template-select"`, etc. | If testids change, all E2E selectors must update simultaneously. |
| **Demo data** | `db/demo-data.ts` | `template_id`, template event generation | Demo data generation creates events with `template_created` type. |
| **UI strings** | `Navigation.tsx` line 33, various component headers | "Templates" tab label | Users see "Templates" in the nav bar. |

### The Critical Rename Rule

**DO NOT rename event_type strings or payload field names.** These are stored data, not code identifiers. The correct approach:

| What to Rename | What to Keep |
|----------------|--------------|
| File names (`templates/` -> `plans/`) | `event_type: 'template_created'` (stored data) |
| Component names (`TemplateList` -> `PlanList`) | `payload->>'template_id'` (SQL against stored JSON) |
| Hook names (`useTemplates` -> `usePlans`) | `template_id` field in event payloads |
| UI-visible text ("Templates" -> "Plans") | localStorage key `gymlog-rotations` structure |
| Type names (`Template` -> `Plan`) | dbt column names that reference stored event keys |
| data-testid values (optional, risky) | |

### Rename Pitfalls Table

| Pitfall | Impact | Prevention |
|---------|--------|------------|
| **Renaming event_type strings breaks existing data** | All existing events with `template_created` etc. become invisible to queries. Users lose all their plans/templates. Data appears deleted. | NEVER rename event_type string literals. Keep `'template_created'` in SQL WHERE clauses forever. Only rename the TypeScript interface names and UI labels. |
| **Renaming payload JSON keys breaks event replay** | `payload->>'template_id'` extracts from stored JSON. If new events use `plan_id`, old events still have `template_id`. Query must handle both or data is lost. | Keep `template_id` as the canonical payload key. If you MUST change it, write a SQL COALESCE: `COALESCE(payload->>'plan_id', payload->>'template_id')`. |
| **localStorage `gymlog-rotations` has `template_ids` field** | `useRotationStore` persists rotation objects with `template_ids` array. Renaming the TypeScript field without migrating stored data breaks existing rotations silently (they deserialize as `undefined`). | Add a migration in the store's `merge` function that maps `template_ids` to the new field name, keeping backward compatibility. |
| **Renaming data-testid values breaks E2E in CI** | All 6 template-related test IDs change. If component rename lands before selector update, CI is red. | Rename selectors.ts and component data-testid values in a single atomic commit. Run E2E locally first. |
| **`button:has-text("+ New Template")` in E2E specs** | Three E2E spec files use text-based selectors matching "Template." Changing the button text to "Plan" without updating specs causes test failures. | Search all `.spec.ts` files for the string "template" (case-insensitive) and update text matchers. |
| **File rename breaks git history** | Renaming `src/components/templates/` to `src/components/plans/` loses git blame history unless done with `git mv`. | Use `git mv` for directory/file renames. Do renames in a dedicated commit before code changes. |
| **Partial rename leaves mixed terminology** | Some files say "template," others say "plan." Confusing for future developers. | Use a checklist. After rename, grep for `/[Tt]emplate/` across the entire `src/` directory. Every remaining match should be in SQL queries or event types (intentionally kept). |

---

## 3. Comparison Feature Pitfalls (Multi-Exercise Analytics)

Current analytics (`AnalyticsPage.tsx`) uses a single `selectedExerciseId` state. Adding multi-exercise comparison introduces new state management and query complexity.

| Pitfall | Impact | Prevention |
|---------|--------|------------|
| **N+1 query problem with multiple exercises** | Current `useExerciseProgress` hook runs one DuckDB query per exercise. Selecting 5 exercises = 5 sequential queries. On DuckDB-WASM's single thread, this blocks the UI for seconds. | Rewrite the query to accept an array of exercise IDs and return all data in one query with `WHERE exercise_id IN (...)`. Return data grouped by exercise_id. |
| **Recharts re-renders entire chart on selection change** | Adding/removing an exercise from comparison triggers full chart re-render. With 5 exercises and 365 days of data, this causes visible jank. | Memoize chart data with `useMemo` keyed on the sorted exercise ID array. Use `React.memo` on chart components. Consider debouncing selection changes by 200ms. |
| **Color assignment instability** | If exercises are assigned colors by array index, adding/removing an exercise shifts all colors. "Bench Press was blue, now it's green." Users lose visual tracking. | Assign colors deterministically by exercise_id hash or maintain a stable color map: `Map<exerciseId, color>`. Once assigned, a color sticks even if other exercises are added/removed. |
| **Selection state not persisted** | User selects 3 exercises for comparison, switches to Workouts tab, comes back — selection is lost. Current `selectedExerciseId` is local React state. | Persist comparison selection to localStorage (similar to `STORAGE_KEY` pattern already used for `timeRange` on line 21 of AnalyticsPage.tsx). |
| **Bundle size increase from comparison UI** | Adding a multi-select dropdown, comparison charts, and overlay logic. Analytics chunk currently budgeted at 600KB. Recharts is already the largest dependency. | Monitor bundle size after adding comparison. If over budget, consider replacing the comparison chart with a lightweight custom SVG overlay rather than a second Recharts instance. |
| **Time range mismatch between compared exercises** | Exercise A has data from January, Exercise B only from March. Chart X-axis shows January-June but Exercise B has gaps. Gaps render as zero or missing, which looks like "no training." | Explicitly render gaps as absent (no data point) rather than zero. Use `connectNulls={false}` in Recharts Line component. Show a "data available from" indicator per exercise. |
| **Mobile touch target too small for multi-select** | Checkbox-based multi-select with exercise names on a 375px screen. Long exercise names overflow. Touch targets smaller than 44x44px. | Use a chip/tag-based selection UI rather than checkboxes in a dropdown. Allow deselection by tapping chips. Test on 375px viewport width. |
| **Comparison of exercises with different units** | If the app later supports bodyweight exercises (reps only, no weight), comparing weight-based and bodyweight exercises on the same Y-axis is meaningless. | Validate that selected exercises share the same metric (weight-based). Show a warning if comparing incompatible exercise types. Or use dual Y-axes. |

---

## 4. UX Change Pitfalls (Collapsible Sections, Reordering)

### Collapsible Sections

The app already has `CollapsibleSection` component (`src/components/analytics/CollapsibleSection.tsx`) using native `<details>/<summary>`. Adding more collapsible sections carries these risks:

| Pitfall | Impact | Prevention |
|---------|--------|------------|
| **Native `<details open>` attribute not controlled by React** | React sets `open={defaultOpen}` on initial render, but the browser manages open/close state natively. React re-renders do NOT reset the open state. This is correct behavior but surprising — `defaultOpen` is not a controlled prop. | Do not try to programmatically control open/close via React state on the `open` attribute (it creates a fight between React and the browser). If you need programmatic control, use a ref: `detailsRef.current.open = false`. |
| **E2E tests break when sections start collapsed** | If a section defaults to collapsed (`defaultOpen={false}`), E2E tests that click elements inside it will fail with "element not visible." The 48 existing selectors assume all content is visible. | For any section that becomes collapsible: update E2E tests to first open the section (click the summary) before interacting with contents. Add a helper: `openSection(page, 'Section Name')`. |
| **`<details>` toggle event not bubbling correctly** | The `toggle` event on `<details>` does not bubble in all browsers. If you add analytics tracking for section open/close, delegated event listeners on parent elements won't catch it. | Attach `toggle` event listener directly to the `<details>` element, not via delegation. |
| **Keyboard accessibility: Enter and Space** | Native `<summary>` responds to Enter and Space. But if you add custom click handlers or wrap content in buttons inside summary, you can break the default keyboard behavior or create double-activation. | Do not put `<button>` elements inside `<summary>`. The summary itself is the interactive element. Use `<span>` for styled children. Test with keyboard-only navigation. |
| **Screen reader announces "disclosure triangle"** | `<details>/<summary>` is announced as a disclosure widget. If you add `role="button"` or other ARIA roles to summary, screen readers get confused by conflicting semantics. | Do not add ARIA roles to `<summary>`. The existing implementation correctly uses `list-none` to hide the default marker and adds a custom `>` indicator — this is fine. |
| **Collapsing hides content from Cmd+F** | Browser find (Cmd+F / Ctrl+F) does not search inside collapsed `<details>` elements in most browsers. Users searching for content won't find it if the section is collapsed. | Keep sections open by default (`defaultOpen={true}`) for content-heavy sections. Only collapse truly optional/secondary sections. |
| **Saved open/close state across sessions** | Users collapse a section, navigate away, come back — section is open again (because `defaultOpen` is hardcoded). This is annoying for sections users consistently collapse. | Persist open/close state in localStorage keyed by section ID. Read on mount, update on toggle. But only do this if sections default to closed — if they default to open, persisting "closed" state is a nice-to-have, not critical. |

### Settings Reordering

Current Settings layout (from `BackupSettings.tsx`):
1. Workout Rotations
2. Workout Preferences (Weight Unit, Rest Timer, Sound)
3. Data Backup (Export)
4. Restore from Backup (Import)
5. TOON Export
6. Demo Data & Clear All
7. System Observability
8. Data Quality

| Pitfall | Impact | Prevention |
|---------|--------|------------|
| **Moving "Clear All Data" higher increases accidental deletion risk** | If "Demo Data & Clear All" moves above the fold or near commonly-used features, users hit it by accident. Currently it's safely buried at position 6 of 8. | Keep destructive actions at the bottom. If reorganizing into collapsible groups, put "Danger Zone" in its own collapsed section at the end. |
| **E2E tests assume scroll position or element order** | Tests that click `btn-load-demo` or `btn-clear-data` may rely on the page being scrolled to a certain position or elements being in a certain DOM order. Reordering could change which elements are in viewport. | E2E selectors use `data-testid` which is order-independent. Verify no tests use `nth-child` or positional selectors for settings elements. Current tests look safe (they use named testids). |
| **Breaking grouped mental model** | Users have learned: "Export and Import are together." If you split them into different sections/groups, users can't find Import anymore. | Keep logically paired features together: Export + Import in same section, Rotations + Default Gym together. Only change the order of sections, not the grouping within sections. |
| **Missing deep links or scroll anchors** | If documentation or help text says "go to Settings > Data Backup" and the section is renamed or reorganized, external references break. | Check if any in-app text, error messages, or README references specific settings section names. Update all references. |

---

## 5. Integration Pitfalls (Cross-Cutting Concerns)

These pitfalls span multiple v1.4 features and affect the system as a whole.

| Pitfall | Impact | Prevention |
|---------|--------|------------|
| **Bundle size budget exceeded by combined changes** | Theme tokens are cheap (CSS), but comparison features add components + query logic. Current budgets: main 660KB, analytics 600KB, total 1480KB. Multi-exercise comparison UI + queries could push analytics over 600KB. | Track bundle size after each feature, not just at the end. Add bundle size check to each PR. If analytics hits 580KB after comparison, stop and optimize before adding more. |
| **Rename + theme change in same PR = impossible review** | A rename touching 40 files + a theme change touching 37 files = 77-file PR. Reviewers can't distinguish rename noise from theme logic changes. | Do rename in its own PR first (mechanical, easy to verify). Then theme change in a separate PR. Never combine refactors with feature changes. |
| **Stale localStorage after combined changes** | Rename changes localStorage keys (`gymlog-rotations` internal structure), theme might add new persistence keys, comparison adds selection persistence. Multiple localStorage migrations in one release can conflict. | Give each localStorage migration a version number. Process migrations in order. Test: what happens if a user has v1.3 localStorage and loads v1.4 code? |
| **E2E tests become the bottleneck** | Every change (rename testids, collapsible sections hiding elements, new comparison selectors, reordered settings) modifies E2E tests. If tests are updated incrementally, intermediate commits have failing CI. | Batch all E2E selector changes into a single coordinated update. Consider a test freeze: implement features first with temporarily skipped tests, then fix all tests in one pass. |
| **`git mv` directory rename conflicts with other PRs** | If one PR renames `components/templates/` to `components/plans/` while another PR modifies files in `components/templates/`, git cannot auto-merge. | Land the rename PR first. Communicate the rename to all active branches. Rebase other PRs after rename lands. |

---

## Pre-Launch Checklist

### Theme Redesign
- [ ] All hardcoded colors extracted to tokens (grep for `oklch(`, `hsl(`, `rgb(`, `#[0-9a-f]` in `.tsx` files)
- [ ] Legacy HSL tokens (`--chart-primary`, `--chart-success`, `--chart-muted`, `--accent`) updated or consumers migrated
- [ ] WCAG AA 4.5:1 contrast verified for all text/background token pairs
- [ ] All Tailwind opacity modifiers (`/30`, `/20`, etc.) visually verified after token changes
- [ ] `text-black` and `text-white` usages verified against new accent/background colors
- [ ] MuscleHeatMap and DemoDataSection inline OKLCH values migrated to tokens

### Rename ("Templates" to "Plans")
- [ ] Event type strings (`'template_created'`, etc.) are NOT renamed — kept for backward compatibility
- [ ] Payload keys (`template_id`) are NOT renamed in stored events
- [ ] SQL queries updated to handle both old event types (they shouldn't need changes if event types are kept)
- [ ] localStorage `gymlog-rotations` migration added for any renamed fields
- [ ] All 40 source files grepped and updated for UI-layer rename
- [ ] E2E selectors updated atomically with component changes
- [ ] E2E text matchers (`"+ New Template"`) updated to new text
- [ ] Post-rename grep for `/[Tt]emplate/` shows only intentional remnants (SQL, event types)
- [ ] `git mv` used for file/directory renames to preserve history

### Comparison Features
- [ ] Single query for multiple exercises (no N+1)
- [ ] Color assignment is stable (exercise A keeps its color when exercise B is added)
- [ ] Chart data memoized (`useMemo` with exercise ID array dependency)
- [ ] Selection persisted in localStorage
- [ ] Gaps rendered as absent data, not zeros
- [ ] Analytics bundle size still under 600KB budget
- [ ] Mobile touch targets >= 44x44px for selection UI

### Collapsible Sections
- [ ] No programmatic control via React `open` prop (use refs if needed)
- [ ] E2E tests open sections before interacting with child elements
- [ ] No `<button>` elements inside `<summary>`
- [ ] Keyboard navigation tested (Enter/Space on summary)
- [ ] Content-heavy sections default to open

### Settings Reordering
- [ ] Destructive actions remain at bottom of page
- [ ] Logically paired features stay grouped (Export + Import, etc.)
- [ ] No E2E tests rely on positional selectors for settings
- [ ] In-app references to settings section names updated

### Integration
- [ ] Bundle size tracked per-feature, not just at release
- [ ] Rename PR lands before theme/feature PRs
- [ ] localStorage migrations versioned and ordered
- [ ] E2E test updates coordinated (not incremental across broken CI states)
- [ ] Full E2E suite passes on final integration

---

## Sources

- Direct codebase analysis of `/home/dev/workspace/src/` (40 files with "template" references, 18 files with data-testid, 3 files with inline OKLCH)
- `src/index.css` lines 1-72: complete OKLCH token system with legacy HSL
- `src/e2e/helpers/selectors.ts`: all 48+ E2E selectors
- `src/types/events.ts`: event type string literals stored in database
- `src/stores/useRotationStore.ts`: localStorage persistence with `template_ids`
- `src/components/analytics/CollapsibleSection.tsx`: existing details/summary implementation
- `src/components/backup/BackupSettings.tsx`: current settings layout and order
- `src/components/analytics/AnalyticsPage.tsx`: current single-exercise selection pattern
- WCAG 2.1 AA contrast requirements (4.5:1 for normal text, 3:1 for large text)
