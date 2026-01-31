# Project State: GymLog

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-30)

**Core value:** Track workout performance with proper data engineering — both usable as a personal training tool and impressive as a senior Data Engineer portfolio piece.

**Current focus:** v1.2 UX & Portfolio Polish — Phase 10 complete, ready for Phase 11

## Current Position

Phase: 11 - CI/CD & Portfolio
Plan: 1 of ? complete (11-01)
Status: In progress
Last activity: 2026-01-31 — Completed 11-01-PLAN.md (CI pipeline)

Progress: [█] 1/? plans (Phase 11)

## Milestones

| Version | Status | Shipped |
|---------|--------|---------|
| v1.0 MVP | Complete | 2026-01-28 |
| v1.1 Analytics | Complete | 2026-01-30 |
| v1.2 UX & Portfolio Polish | Phase 8 | — |

## Performance Metrics

**Velocity:**
- Total plans completed: 59 (27 v1.0 + 15 v1.1 + 17 v1.2)
- Average duration (v1.2 Phase 8): 6min 30s
- Total execution time (v1.2 Phase 8): 45min 30s
- Average duration (v1.2 Phase 9): 7min 25s
- Total execution time (v1.2 Phase 9): 37min 6s
- Average duration (v1.2 Phase 10): 4min 1s
- Total execution time (v1.2 Phase 10): 16min 7s
- Average duration (v1.2 Phase 11): 1min 29s
- Total execution time (v1.2 Phase 11): 1min 29s (1/? plans)

**By Phase (v1.0):**

| Phase | Plans | Status |
|-------|-------|--------|
| 1. Foundation | 6 | Complete |
| 2. Templates | 9 | Complete |
| 3. History | 6 | Complete |
| 4. Polish | 6 | Complete |

**By Phase (v1.1):**

| Phase | Plans | Status |
|-------|-------|--------|
| 5. Analytics Foundation | 7/7 | Complete |
| 6. Volume Analytics | 5/5 | Complete |
| 7. Progression Intelligence | 3/3 | Complete |

**By Phase (v1.2):**

| Phase | Plans | Status |
|-------|-------|--------|
| 8. Testing & Design Foundation | 7/7 | Complete |
| 9. Batch Logging & Visual Polish | 5/5 | Complete |
| 10. Workout Features & Demo Data | 4/4 | Complete |
| 11. CI/CD & Portfolio | 1/? | In Progress |

## Accumulated Context

### Decisions

Key decisions from v1.0 (still apply):

- DuckDB-WASM + Parquet for modern DE showcase
- Event sourcing for immutable audit trail
- dbt-duckdb at build time for docs/tests
- Zustand with persist for client state
- String interpolation for SQL (DuckDB-WASM limitation)
- Pin DuckDB-WASM to 1.32.0 (OPFS bug workaround)

v1.1 decisions (still apply):
- Recharts 3.7.0 for charting (~96KB gzipped, most popular React library)
- Hook-based analytics data access (matches existing useHistory pattern)
- No Zustand store for analytics (read-only, hooks manage state)
- date-fns 4.1.0 for date utilities (modern, tree-shakeable)
- SQL volume calculation (weight_kg * reps) for 10-100x performance vs JavaScript
- Lazy load Analytics page to keep Recharts out of main bundle (110KB savings)
- CTE composition pattern for SQL queries (inline FACT_SETS_SQL as reusable base)
- react-muscle-highlighter for anatomical body diagrams
- Dual-criteria plateau: no PR in 4+ weeks AND weight change < 5%
- 8-week baseline for regression (excludes current week)
- Session-dismissible alerts with 2-hour session boundary via Zustand persist
- All detection logic in SQL for 10-100x performance over JavaScript

v1.2 roadmap decisions:
- 4 phases, compressed from research's 6-phase suggestion (quick depth mode)
- Testing + Design foundation before features (prevent two-system pitfall)
- Batch logging highest UX impact, depends on design primitives
- CI/CD and portfolio documentation last (documents completed work)

v1.2 Phase 8 (Testing & Design) decisions:
- Vitest + happy-dom for unit tests (5-10x faster than jsdom, sufficient DOM APIs)
- Playwright for e2e tests (Chromium-only for SharedArrayBuffer support)
- DuckDB mock factory pattern for isolating database in unit tests
- Separate vitest.config.ts from vite.config.ts for clarity
- Test globals enabled (describe, test, expect) for cleaner syntax
- Geist Sans + Geist Mono fonts (Vercel aesthetic, self-hosted)
- OKLCH color space for accent/semantic colors (better vibrancy, perceptual uniformity)
- Tailwind CSS 4 @theme directive for design tokens (systematic, maintainable)
- Semantic color tokens (bg-primary/secondary, text-primary/secondary/muted)
- Preserve legacy HSL variables for backward compatibility
- react-error-boundary for granular error handling (inline error cards per feature)
- localStorage error logging (last 20 errors) for future Phase 11 observability
- Feature-level error boundaries (Workouts, Templates, Analytics, Settings)
- Type-only imports required for TypeScript verbatimModuleSyntax
- Button primitive with 4 variants (primary/secondary/ghost/danger) and 3 sizes (sm/md/lg)
- Input/Select primitives using design tokens for consistent form styling
- Card primitive with default and interactive variants
- UI primitives in src/components/ui/ with variant-driven APIs
- ComponentPropsWithoutRef for native prop forwarding in primitives
- Test user-observable behavior, not implementation details (resilient to refactoring)
- Mock Date and uuidv7 for deterministic timestamps and IDs in tests
- Test Zustand stores directly without renderHook (faster, simpler)
- Test data factory pattern (makeSetHistory, makePRRecord, etc.) for reusable fixtures
- Remove debug console.log statements from production hooks
- Add accessibility labels to form controls for screen reader support
- Form labels must use htmlFor attribute to associate with input IDs
- Integration tests with @testing-library/react and user-event for component testing
- Use getByRole queries for better accessibility and test resilience
- Mock Zustand stores via vi.mock with selector pattern for component isolation
- E2E tests with Playwright (aspirational in WSL, will run in CI/CD)
- 71 tests passing across unit, integration, and E2E tests

v1.2 Phase 9 (Batch Logging & Visual Polish) decisions:
- Card-based mobile-first layout for SetRow (cleaner than table rows on small screens)
- Ghost text via HTML placeholder attribute (native, accessible, no custom rendering)
- Delta arrows compare session N vs N-1 for trend context (not same-session set-over-set)
- Native HTML dialog element for modals (modern browsers support showModal())
- Auto-save on blur instead of explicit save button (friction-free, matches Strong Workout UX)
- Rest timer auto-starts via trigger prop (counter increment pattern, no refs needed)
- Dialog-based modals vs view state machine (preserves context, uses native features)
- updateSet upserts by index (creates sets on-demand for batch logging)
- LazyMotion with domAnimation for 5kb bundle instead of full framer-motion (25kb)
- 150ms fade+shift page transitions with prefers-reduced-motion support
- Design token migration: zinc-500→text-muted, zinc-800→bg-tertiary, semantic tokens for warning/success/error
- Human verification (09-04) identified 2 gaps: ghost text placeholders not displaying, Settings missing unit/timer/sound toggles
- localStorage instead of sessionStorage for workout persistence (prevents data loss on tab close)
- Weight stored internally as kg; lbs is display-only conversion
- Single ranked CTE SQL query fetches last two sessions for delta comparison
- Segmented button pattern for Settings toggles (bg-accent text-black active state)

v1.2 Phase 10 (Workout Features & Demo Data) decisions:
- LocalStorage key 'gymlog-rotations' separate from workout state to avoid collision
- Position management with modulo wrap-around for infinite rotation cycling
- Delete rotation clears activeRotationId if deleting active rotation
- Inline drag-and-drop editor expands/collapses per rotation (not separate page)
- Checkbox-based template selection in rotation creation form
- Drag handle icon (⠿) for visual affordance in sortable lists
- QuickStartCard uses border-2 border-accent bg-accent/5 for visual prominence
- Three states: full quick-start, no rotation hint, no default gym hint
- Manual selection remains below with rotation pre-fill (editable suggestion)
- Position indicator shows 'Workout N of M in Rotation Name'
- PR detection uses window functions over entire event history (not just recent sessions)
- useWorkoutSummary hook only runs in 'saved' phase after events written (avoids race conditions)
- Rotation advances on save, not cancel (critical UX requirement)
- Display both weight PRs and estimated 1RM PRs with separate gold badges
- Direct SQL inserts for demo data (bypassing writeEvent) to set custom historical timestamps
- Three-layer data clearing: DuckDB table drop, OPFS file removal, localStorage key removal
- Demo rotation setup via direct localStorage write (position 2 for variety)

v1.2 Phase 11 (CI/CD & Portfolio) decisions:
- 4 parallel check jobs (lint, test-unit, test-e2e, dbt-check) gate deployment for fast failure attribution
- PRs trigger checks only; push to main triggers checks + GitHub Pages deployment
- dbt compile validates SQL syntax and DAG integrity in CI (no data needed)
- Python 3.11 pinned for dbt-duckdb CI stability
- Playwright report uploaded as artifact with 7-day retention
- Build-deploy job uses VITE_BASE env var for subpath deployment (to be configured in 11-02)
- COI serviceworker copy included in workflow (file will be added in 11-02)

### Pending Todos

None.

### Blockers/Concerns

None. Phase 11 Plan 01 complete. CI pipeline ready for next plan's deployment configuration.

## Session Continuity

Last session: 2026-01-31
Stopped at: Completed 11-01-PLAN.md (CI pipeline)
Resume file: None

**Next action:** Proceed to 11-02 (deployment configuration and serviceworker).
