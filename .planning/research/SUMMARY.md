# v1.4 Research Summary: Comparison, UX & Theme

**Project:** GymLog PWA
**Domain:** Workout Tracking PWA (subsequent milestone)
**Researched:** 2026-02-01
**Confidence:** HIGH

## Executive Summary

v1.4 is a refinement milestone targeting three coordinated improvements to an existing workout tracking PWA: multi-exercise comparison analytics, UX tightening (collapsible sections, settings reorganization, terminology consistency), and a soft/modern dark theme evolution. The research reveals that all v1.4 features can be implemented with **zero new dependencies** — the existing stack (React 18, TypeScript, Vite, DuckDB-WASM, Zustand, Tailwind CSS 4, Recharts, framer-motion) already provides everything needed.

The comparison feature is the most substantial addition, requiring a new SQL query pattern and React hook, but follows proven patterns already established in the codebase. The theme redesign involves evolving the existing 18-token OKLCH system rather than introducing a CSS library, making it a low-risk, high-impact change. UX improvements are primarily structural (JSX reordering, component reuse) with minimal new logic.

**Key risk:** The "Templates to Plans" rename touches 40 files across 7 layers, including stored event types in the database. The critical mitigation is to rename only UI-facing text and TypeScript identifiers while keeping event_type strings and payload keys unchanged to maintain backward compatibility with existing user data. Theme changes must preserve WCAG AA contrast ratios, requiring contrast verification for all token value adjustments.

## Key Findings

### Recommended Stack (v1.4 Additions)

**No new dependencies required.** Every capability needed for v1.4 is covered by the existing stack or native CSS/Tailwind 4 features. This is the correct outcome for a UX/theme refinement milestone.

**Core technologies (existing, reused):**
- **Tailwind CSS 4 @theme directive**: Supports --shadow-*, --animate-*, --radius-*, --ease-* namespaces natively. Theme redesign uses these to add soft shadows, smooth animations, and increased border radius without CSS libraries.
- **OKLCH color system**: Already in use for 18 tokens. Soft/modern theme achieved by adjusting L (lightness), C (chroma), and H (hue) values. No migration to new color system needed.
- **Recharts**: Existing chart library handles comparison sparklines via fixed-size LineChart pattern (no ResponsiveContainer needed for small inline charts).
- **CollapsibleSection component**: Already exists using native HTML <details>/<summary>. Reuse for analytics sections and settings groups.
- **DuckDB-WASM**: Comparison queries extend existing exerciseProgressSQL pattern with WHERE exercise_id IN (...) clause. Single query replaces N queries.

**What NOT to add:**
- Chart libraries (Nivo, Victory, Chart.js): Recharts already handles all chart types needed
- Component libraries (Radix UI, shadcn, Headless UI): App has Card, Button, Input, Dialog primitives
- Animation libraries (tailwind-animate): Tailwind CSS 4 --animate-* namespace provides same capability natively
- Font changes (Geist Sans already modern, Apple-adjacent): High churn, low value

### Expected Features (v1.4 Scope)

**Must have (table stakes):**
- Side-by-side stat cards for 2+ exercises (PR comparison, volume comparison, frequency, progression status)
- Collapsible Exercises/Gyms sections on Workouts tab (default collapsed to prioritize "Start Workout" action)
- "Templates" renamed to "Plans" throughout UI (consistent terminology)
- Settings reorder: Default Gym promoted to top, debug sections collapsed by default
- Soft/modern dark theme: increased border-radius (12-16px cards), subtle shadows, warmer background hue, softer accent colors

**Should have (competitive):**
- Muscle group auto-suggest for comparison (reduces selection friction)
- Sparkline mini-charts on comparison cards (visual trend at a glance)
- Persistent collapsed state across tab changes (localStorage)
- Time range consistency with analytics page (reuse TimeRangePicker)

**Defer (v2+):**
- Comparison sparklines (adds complexity, modest value for v1.4)
- Social/user-to-user comparison (requires accounts, server infra, out of scope for local-first PWA)
- Full chart overlay (confusing when scales differ, e.g., 100kg bench vs 60kg OHP)
- Light mode toggle (massive scope, every component needs dual theme)
- Comparison sharing as image (HTML-to-canvas adds significant complexity)

### Architecture Approach

The v1.4 architecture is additive, not breaking. All features integrate cleanly with existing patterns:

**Major components:**
1. **Exercise Comparison** — New SQL query (exerciseComparisonSQL), new hook (useExerciseComparison), new components (ExerciseMultiSelect, ExerciseComparisonChart, ComparisonSection). Inserts into AnalyticsPage between Exercise Detail and Progression Intelligence. Data flow: ComparisonSection → useExerciseComparison → DuckDB exerciseComparisonSQL(days, exerciseIds[]).

2. **Theme Evolution** — Token value changes in src/index.css @theme block propagate automatically via Tailwind's bg-bg-primary, text-text-primary utilities. Three-phase migration: (1) Adjust OKLCH L/C/H values + increase radius, (2) Migrate legacy HSL references to OKLCH, (3) Component-level styling updates (borders, shadows, gradients).

3. **UX Tightening** — Reuse existing CollapsibleSection for analytics sections. JSX reordering in BackupSettings.tsx for settings. Text-only changes for rename (40 files, but only UI strings change — event types and payload keys stay unchanged for backward compatibility).

**Build order (dependencies considered):**
1. Theme token values (foundation — all later work inherits new aesthetic)
2. Templates → Plans rename (simple, high visibility, low risk)
3. Settings reorder + collapsible analytics sections (pure JSX restructure)
4. Exercise comparison feature (most complex, benefits from theme already in place)
5. Theme component refinements (fine-tuning after tokens settled)

### Critical Pitfalls

1. **Renaming event_type strings breaks existing data** — The word "template" appears in 40 source files including stored event types ('template_created', 'template_updated', etc.) and payload keys (template_id). Changing these breaks all existing user data. **CRITICAL: Keep event_type strings and payload JSON keys unchanged. Only rename UI text and TypeScript identifiers.**

2. **Theme token changes break WCAG contrast ratios** — Current text-muted was already bumped from 55% to 59% lightness for WCAG AA 4.5:1. Adjusting background lightness without recalculating contrast math causes text to become illegible. **Prevention: Before changing ANY background token, recalculate contrast ratios for all text tokens against it using OKLCH contrast checker.**

3. **Legacy HSL tokens drift from new OKLCH values** — Lines 51-56 of index.css contain --chart-primary, --chart-success, --chart-muted, --accent in HSL format marked "backward compat." ExerciseProgressChart.tsx still references hsl(var(--accent)). Updating OKLCH without updating these creates visual inconsistency. **Prevention: Migrate remaining HSL consumers to OKLCH or update HSL values to match before theme redesign.**

4. **N+1 query problem with multiple exercises** — Current useExerciseProgress runs one DuckDB query per exercise. Selecting 5 exercises = 5 sequential queries blocking UI on single thread. **Prevention: Rewrite as single query with WHERE exercise_id IN (...) returning all data grouped by exercise_id.**

5. **E2E tests break when sections start collapsed** — If section defaults to collapsed (defaultOpen={false}), E2E tests clicking elements inside fail with "element not visible." 48 existing selectors assume all content visible. **Prevention: Update E2E tests to open sections before interacting. Add helper: openSection(page, 'Section Name').**

## Implications for Roadmap

v1.4 is a refinement milestone with 4 coordinated work streams that can be executed in sequence to minimize integration risk.

### Phase 1: Theme Foundation
**Rationale:** Token value changes in index.css instantly transform the entire app aesthetic with zero component changes. Everything built after this inherits the new look. Lowest-risk, highest-impact change.

**Delivers:** Soft/modern dark theme with warmer backgrounds, increased border-radius (8px → 12px → 16px), subtle shadows, softer accent colors, smooth animation tokens.

**Addresses:** Theme token updates (STACK.md), soft/modern aesthetic requirements (FEATURES.md)

**Avoids:** WCAG contrast pitfall (verify all ratios), legacy HSL drift (migrate or update), hardcoded color bypasses (extract to tokens first)

**Research needs:** MEDIUM — Standard pattern, but requires OKLCH contrast calculator verification and visual QA pass for all card components.

### Phase 2: Terminology Consistency
**Rationale:** Simple text changes across 40 files, low risk, high user-facing impact. Quick win that improves clarity before adding new features.

**Delivers:** "Templates" renamed to "Plans" in all UI text, navigation labels, component headings, E2E test assertions. Event types and payload keys unchanged for backward compatibility.

**Addresses:** Terminology consistency (FEATURES.md UX tightening)

**Avoids:** Breaking existing data (keep event_type strings), localStorage migration errors (add backward compat mapping), E2E test failures (update selectors atomically)

**Research needs:** LOW — Mechanical change with clear scope, full file inventory completed.

### Phase 3: UX Restructure
**Rationale:** Both collapsible sections and settings reorder are pure JSX restructuring with no new logic. Can be done in a single phase. Improves usability of most-used screens.

**Delivers:** Collapsible Exercises/Gyms sections on Workouts tab (default collapsed), analytics sections collapsible, settings reordered (Default Gym to top, debug sections collapsed), persistent collapsed state in localStorage.

**Addresses:** Collapsible sections (FEATURES.md), settings reorganization (FEATURES.md), progressive disclosure pattern (ARCHITECTURE.md)

**Avoids:** Native <details> React control pitfall (use refs for programmatic control), E2E visibility failures (update tests to open sections first), destroying mental model (keep paired features together)

**Research needs:** LOW — CollapsibleSection component already exists and proven, JSX reordering is trivial.

### Phase 4: Comparison Analytics
**Rationale:** Most complex change (new SQL, new hook, new components) but follows established patterns. Benefits from theme already in place (charts inherit new tokens). Headline feature of v1.4.

**Delivers:** Side-by-side exercise comparison cards showing PR, volume, frequency, progression status. Multi-select UI (2-4 exercises), time range filtering, comparison data persisted in localStorage.

**Addresses:** Exercise comparison stat cards (FEATURES.md), single multi-exercise SQL query (ARCHITECTURE.md)

**Avoids:** N+1 query problem (single query with IN clause), color assignment instability (deterministic color by exercise_id hash), Recharts re-render jank (memoize with useMemo), bundle size bloat (monitor, cap at 600KB for analytics chunk)

**Research needs:** MEDIUM — SQL pattern is straightforward extension of existing exerciseProgressSQL, but multi-select UX needs mobile testing (44x44px touch targets).

### Phase 5: Theme Polish
**Rationale:** Fine-tuning card borders, shadows, button styles. Depends on Phase 1 tokens being settled. This is polish after functional changes land.

**Delivers:** Card components with shadow-soft/shadow-card utilities, semi-transparent borders, gradient overlays on hero cards, refined button/input focus states.

**Addresses:** Component styling updates (STACK.md token migration plan), card visual treatment (FEATURES.md soft theme)

**Avoids:** Overusing backdrop-filter (limit to 2-3 elements, performance cost), neumorphism trap (accessibility nightmare), breaking existing layouts

**Research needs:** LOW — CSS utility application, visual refinement only.

### Phase Ordering Rationale

- **Theme first:** Token changes propagate globally. Later phases inherit new aesthetic, avoiding rework.
- **Rename second:** Text changes touch many files but have no logic changes. Isolated, easy to verify, unblocks later work.
- **UX restructure before comparison:** Collapsible sections pattern is reused by comparison feature. Must exist first.
- **Comparison late:** Most complex. Building on stable theme and proven collapsible pattern reduces integration risk.
- **Polish last:** Fine-tuning after functional changes land ensures effort isn't wasted if earlier phases require visual adjustments.

### Research Flags

**Phases needing research-phase:**
- **Phase 1 (Theme):** WCAG contrast verification, visual regression testing needed. Not complex but requires tooling.
- **Phase 4 (Comparison):** Multi-select mobile UX, touch target sizing, comparison query performance testing with large datasets.

**Phases with standard patterns (skip research-phase):**
- **Phase 2 (Rename):** Mechanical text replacement, full file inventory completed.
- **Phase 3 (UX Restructure):** CollapsibleSection already exists, JSX reordering is trivial.
- **Phase 5 (Polish):** CSS utility application, no new patterns.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Zero new dependencies needed verified against existing package.json. All capabilities covered by Tailwind CSS 4, OKLCH, Recharts, native HTML. |
| Features | MEDIUM-HIGH | Competitive analysis verified comparison patterns (Hevy, Strong, JEFIT). UX research from NN/g, Apple HIG, Android guidelines. Design patterns well-documented but visual testing required. |
| Architecture | HIGH | Direct source code analysis completed. All integration points verified (exerciseProgressSQL pattern, CollapsibleSection component, useExerciseProgress hook pattern). File impact mapped: ~25 files modified, 4 created. |
| Pitfalls | HIGH | Critical pitfalls identified via codebase grep (40 files with "template" references, 18 with data-testid, event_type strings in database). WCAG contrast requirements, localStorage migration needs, E2E test impacts all cataloged. |

**Overall confidence:** HIGH

### Gaps to Address

**Theme contrast verification:** OKLCH contrast calculators exist but must be applied manually to all 18 token pairs. Not a research gap, but a verification task during Phase 1 implementation.

**Mobile multi-select UX:** Pill-based selection is a standard pattern but needs testing on 375px viewport to verify touch targets meet 44x44px minimum. Defer to Phase 4 implementation.

**Bundle size impact:** Current analytics chunk is 600KB budget. Comparison feature adds components + query logic. Track size after each addition. If approaching 580KB, optimize before adding more. Monitor during Phase 4.

**localStorage migration strategy:** Rename changes localStorage keys (gymlog-rotations internal structure), comparison adds selection persistence. Multiple localStorage changes need versioned migration. Design migration approach in Phase 2.

## Sources

### Primary (HIGH confidence)
- **Direct codebase analysis** — Complete inventory of all affected files, token system, component patterns, SQL queries
- **Tailwind CSS 4 docs** — Official documentation confirming --shadow-*, --animate-*, --radius-* namespaces
- **OKLCH color space spec** — Evil Martians guide, WCAG contrast calculations
- **Recharts official docs** — Composable chart components, sparkline patterns verified

### Secondary (MEDIUM confidence)
- **Competitive analysis** — Hevy comparison feature patterns, Strong progression tracking, JEFIT leaderboards
- **Design systems** — Apple HIG Dark Mode, Android Settings patterns, NN/g accordion research
- **UX research** — Toptal settings organization principles, Mobbin accordion variants, Cieden best practices
- **Dark mode design** — Smashing Magazine inclusive dark themes, ui-deploy.com patterns, Josh Comeau shadow techniques

### Tertiary (visual testing required)
- **OKLCH soft theme approach** — Medium article guidance on chroma/lightness adjustments needs visual verification
- **Backdrop-filter performance** — Josh Comeau performance considerations anecdotal, need device testing

---

*Research completed: 2026-02-01*

*Ready for roadmap: Yes*

*Recommended milestone structure: 5 phases (Theme → Rename → UX → Comparison → Polish)*
