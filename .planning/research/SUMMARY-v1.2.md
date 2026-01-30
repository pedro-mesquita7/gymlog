# Project Research Summary: v1.2 UX & Portfolio Polish

**Project:** GymLog v1.2 Milestone
**Domain:** Local-first fitness/workout tracking PWA enhancements
**Researched:** 2026-01-30
**Confidence:** HIGH

## Executive Summary

The v1.2 milestone focuses on adding professional-grade testing, CI/CD, design consistency, error handling, observability, and demo data to an existing React + DuckDB-WASM workout tracking PWA. Research shows this is a polish and infrastructure milestone where **incremental enhancement is far safer than refactoring existing patterns**.

**Recommended approach:** Extend the existing hook-based data access, Zustand state management, and event sourcing foundation rather than replacing them. The current architecture is well-suited for these additions. Focus on additive patterns: new testing infrastructure around existing components, design tokens layered over existing Tailwind, error boundaries wrapping existing routes, and observability tracking existing query patterns.

**Key risks identified:** State management refactoring for batch logging could cause render performance issues. Design system migration could create two styling systems if not cleaned up incrementally. Testing infrastructure could focus on implementation details rather than user behavior. CI/CD could pass with mocked database but fail in production with actual DuckDB-WASM. Demo data could mix with real user data without clear isolation. All these risks are preventable with clear architectural decisions made upfront.

## Key Findings

### Recommended Stack

The v1.2 stack additions are focused on testing, CI/CD, and observability for an existing React 19 + DuckDB-WASM stack. No major architectural changes are needed - this is infrastructure enhancement.

**Core technologies:**
- **Vitest 4.0.17 + React Testing Library 16.3.1**: Unit and integration testing with React 19 compatibility. Vitest native to Vite, 5-10x faster than Jest. Happy-dom for unit tests, Playwright for DuckDB-WASM OPFS integration tests in real browser.
- **GitHub Actions + SQLFluff 4.0.0**: CI/CD orchestration native to GitHub Pages. SQLFluff validates dbt SQL before deployment.
- **Tailwind CSS 4 @theme directive**: Design system via native CSS-first configuration (no additional tooling needed). Replaces scattered Tailwind classes with semantic tokens.
- **react-error-boundary 6.1.0**: React 19 compatible error boundary library with hook support for event handler errors.
- **web-vitals 5.1.0**: Official Google library for Core Web Vitals (LCP, INP, CLS). Lightweight (2KB), no backend required.
- **parquet-wasm 0.7.1**: Generate demo Parquet seed files in TypeScript/Node for DuckDB-WASM consumption.

**Critical version requirements:**
- Vitest 4.0+ (stable Browser Mode for WASM testing)
- React Testing Library 16.3+ (React 19 compatibility)
- react-error-boundary 6.1.0+ (React 19 support, published 2026-01-27)
- SQLFluff 4.0.0+ (dbt 1.10 support)

**What NOT to add:** Shadcn/ui or component libraries (would require rewriting existing components), Sentry/Datadog (requires backend), Style Dictionary (Tailwind 4 @theme is sufficient), Storybook (defer to v1.3).

### Expected Features

This milestone adds six feature categories, with batch logging and demo data as highest priority for UX and portfolio showcase.

**Must have (table stakes):**
- **Batch set logging grid** - Standard UX in Hevy/Strong/StrengthLog (2026). Users expect spreadsheet-like grid with ghost data from last session, not one-at-a-time forms. Pre-fill from templates, keyboard navigation, save all sets at once.
- **Workout completion summaries** - Post-workout metrics (volume, duration, PRs, comparison to last session). Celebratory moment, immediate feedback.
- **Demo data with one-click load** - 6 weeks of realistic workout history for portfolio showcase. Reviewers won't manually log 50 workouts. Progressive overload pattern, realistic compound lifts.
- **Portfolio README** - Architecture diagram, tech stack with icons, live demo link, performance metrics. First impression for recruiters, showcases data engineering skills.
- **Testing framework setup** - Vitest config, test scripts, CI integration. Retroactive testing requires careful strategy to avoid testing implementation details.
- **CI/CD pipeline** - GitHub Actions deploy to Pages. Must test DuckDB-WASM initialization in browser, not just unit tests.
- **Error boundaries** - Strategic placement at route level (not every component). Handle DuckDB query errors, show user-friendly fallbacks.
- **Performance monitoring** - Core Web Vitals tracking, storage usage metrics, query performance. Local-only (no external telemetry), display in settings tab.

**Should have (differentiators):**
- **Workout rotation/program scheduling** - Auto-advancing template sequences (Upper/Lower splits, PPL). Tied to specific gym, manual override available.
- **Visual diff indicators in batch logging** - Show which sets improved vs last session (green/red highlights). Extend existing PR detection.
- **Session RPE prompt** - Post-workout subjective difficulty rating (1-10). Optional, non-blocking.
- **DuckDB query profiling** - EXPLAIN ANALYZE for analytics queries, show bottlenecks in dev tools.

**Defer (v1.3+):**
- Micro-animations on state transitions (polish without ROI)
- Perfect 100% design consistency (80% coverage acceptable for v1.2)
- Advanced rotation logic (deload weeks, auto-regulation based on plateau detection)
- Share workout summary to social media (nice portfolio feature, low priority vs core UX)
- Storybook for design system documentation (can document in README for now)

### Architecture Approach

The existing GymLog architecture (React 19, DuckDB-WASM, event sourcing, Zustand, hook-based data access) provides clear integration points for v1.2 features. Most features are additive patterns that extend rather than replace existing components.

**Major architectural decisions:**

1. **Batch Logging State Isolation**: Replace sequential SetLogger with grid that shows current + last session. Use React Hook Form with useFieldArray for per-row state isolation (critical to avoid re-render hell). Create new `useLastSessionSets(exerciseId)` hook and `vw_last_session_sets.sql` dbt model. Add mode toggle to ExerciseView (preserve single-set mode as fallback).

2. **Rotation State Management**: New Zustand store (`useRotationStore`) with localStorage persistence, separate from sessionStorage workout store. Store template sequences per gym, current position in rotation. Integrate into StartWorkout component to auto-suggest next template. Add RotationBuilder UI as new view in TemplateList.

3. **Design Token Layer**: Create `design-tokens.css` with semantic Tailwind tokens (@theme directive). Extract Button, Input, Card primitives to `src/components/ui/`. Migrate incrementally (one feature area at a time), delete old code when migrated. Use ESLint rules to block raw Tailwind in new code.

4. **Testing Strategy**: Mock DuckDB-WASM for unit tests (too slow for CI), test hook return values not internals. Use Vitest + happy-dom for component tests, Playwright for OPFS integration tests. Focus on user behavior testing (React Testing Library philosophy), not implementation details. Target 60-70% coverage on critical paths, not 100%.

5. **CI/CD with WASM Validation**: GitHub Actions workflow must test production build preview with Playwright to verify DuckDB-WASM initialization (mocked unit tests won't catch WASM deployment issues). Include WASM files in bundle size checks. Test COOP/COEP headers, MIME types.

6. **Demo Data Isolation**: Separate demo database (`:memory:`) OR explicit `is_demo` flag on all demo records. Never mix with real user data. Visual indicator when in demo mode (banner). Regenerate demo data with relative dates on each demo entry (avoid staleness).

7. **Granular Error Boundaries**: Feature-level boundaries (one per route), not app-level. Analytics error shouldn't crash workout logging. Use react-error-boundary's `useErrorHandler` for event handlers and async errors (boundaries only catch render errors).

8. **Local-First Observability**: Track Core Web Vitals (web-vitals library), DuckDB query performance (custom PerformanceTracker), OPFS storage usage (navigator.storage.estimate). Display in Settings tab, log to console. NO external telemetry (privacy-first, no PII sent).

**Integration with existing patterns:**
- Batch logging reuses existing SetLogger validation, PR detection
- Design tokens align with existing accent/background colors
- Demo mode uses existing dbt views (fact_sets, vw_exercise_history)
- Error boundaries wrap existing route components without refactor
- Observability tracks existing DuckDB query patterns

### Critical Pitfalls

**Top pitfalls to watch (from PITFALLS-v1.2.md):**

1. **Refactoring to Batch Input Without State Isolation**: Converting SetLogger to batch grid by adding array state at parent level causes every cell edit to re-render entire grid (15+ inputs = 15x renders). Mobile keyboard lag, battery drain. **Prevention:** Isolate each row's state with React Hook Form useFieldArray, use React.memo on GridRow, profile with DevTools before/after.

2. **Adding Design System Classes Without Removing Existing Tailwind**: New design-system-compliant components added but existing code uses raw Tailwind. Two styling systems, visual inconsistency, bloated CSS, regression risk. **Prevention:** Phased migration with cleanup (delete old code when migrated), ESLint rules to block raw colors, visual regression tests (Percy/Chromatic), before/after screenshots.

3. **Testing Implementation Details Instead of User Behavior**: Retroactive tests focus on internal state (useState updates) rather than observable behavior (user sees correct value). High coverage but doesn't catch bugs, tests break on refactoring. **Prevention:** Follow React Testing Library philosophy (test like user), use getByRole not getByTestId, focus on integration tests, if refactor doesn't change UI tests should still pass.

4. **CI/CD Pipeline Doesn't Test DuckDB-WASM Initialization**: Unit tests with mocked DB pass, deploy succeeds, production fails because WASM files not served correctly or missing COOP/COEP headers. Blank screen on first visit. **Prevention:** Add Playwright E2E tests to CI that verify DuckDB initializes in real browser, test production build with `vite preview`, document deployment requirements, monitor production errors.

5. **Demo Data Mixed with Real User Data in Same Database**: Demo mode inserts sample workouts without isolation. User logs real workout, now has mix. "Clear demo data" deletes real data. Data loss, user trust destroyed. **Prevention:** Separate demo database (`:memory:`) OR explicit `is_demo` flag, visual banner in demo mode, never auto-populate demo on first use, require explicit "Try Demo" action.

6. **Error Boundary Catches Event Handler Errors**: Error boundary added to catch render errors, but developers assume it catches all errors. onClick/onChange errors fail silently (not caught by boundaries). **Prevention:** Use react-error-boundary's `useErrorHandler` hook for event handlers, wrap async operations with try/catch, show user-facing error messages via toast/alert not just boundary.

7. **Client-Side Observability Sends PII to Third-Party Service**: Default observability SDK captures "all user interactions" which sends workout data (weights, reps) to Sentry/LogRocket. Privacy violations, GDPR issues. **Prevention:** Privacy-first config (sendDefaultPii: false, mask text/media in replays), beforeSend filters to strip PII, only send error messages/stack traces not user data, consider self-hosted observability.

8. **Polish Milestone Scope Creeps Into Never-Shipping Refinement Loop**: "Polish" starts with defined features, team finds "just one more thing" to improve. Animations, transitions, micro-interactions. Milestone never completes. **Prevention:** Define "done" criteria with measurable thresholds (80% component coverage, not 100%), timebox to 2 weeks, create v1.3 backlog for nice-to-haves, shipping is forcing function.

## Implications for Roadmap

Based on research, suggested phase structure prioritizes user-facing features (batch logging, demo) early while building infrastructure in parallel. Architecture research shows most changes are additive, suggesting quick wins are achievable.

### Phase 1: Foundation - Testing & CI/CD Infrastructure
**Rationale:** No UI changes, can run in parallel with feature development. Establishes quality gates before adding complexity.
**Delivers:** Vitest config, test setup files, GitHub Actions workflow deploying to Pages, error boundaries at route level.
**Addresses:** Testing framework setup, CI/CD pipeline (must-haves from FEATURES.md).
**Avoids:** "Testing implementation details" pitfall - establish test strategy upfront. "CI/CD doesn't test DuckDB" - add Playwright E2E from start.
**Duration:** 1 week
**Research needed:** LOW (well-documented patterns)

### Phase 2: Design System Tokens & Primitives
**Rationale:** Provides reusable components for all subsequent UI work. Must happen before batch logging to avoid mixing styling systems.
**Delivers:** `design-tokens.css` with @theme, Button/Input/Card primitives extracted, 20% of existing components migrated (StartWorkout, SetLogger, TemplateCard).
**Addresses:** Visual consistency improvements (from FEATURES.md differentiators).
**Avoids:** "Two styling systems" pitfall - migrate incrementally with cleanup, ESLint rules to block raw colors.
**Dependencies:** Phase 1 (need visual regression tests in CI).
**Duration:** 1 week
**Research needed:** LOW (Tailwind 4 @theme well-documented)

### Phase 3: Batch Set Logging
**Rationale:** Highest UX impact feature. Depends on design primitives for consistent grid styling.
**Delivers:** Grid view with last session ghost data, keyboard navigation, batch save, PR detection across batch.
**Addresses:** Batch logging (must-have from FEATURES.md), visual diff indicators (differentiator).
**Avoids:** "State isolation" pitfall - use React Hook Form useFieldArray from start, profile render performance.
**Uses:** Button/Input primitives (from Phase 2), existing PR detection logic, new `useLastSessionSets` hook.
**Implements:** New dbt model `vw_last_session_sets.sql`, CurrentSetGrid component with React Hook Form, mode toggle in ExerciseView.
**Dependencies:** Phase 2 (design primitives).
**Duration:** 1 week
**Research needed:** MEDIUM (grid state management patterns, need to profile performance)

### Phase 4: Demo Data & Workout Rotation
**Rationale:** Can implement in parallel (separate concerns). Both are portfolio differentiators.
**Delivers:** One-click demo data load with 6 weeks realistic history, workout rotation builder with auto-advance.
**Addresses:** Demo data, workout rotation (must-haves from FEATURES.md).
**Avoids:** "Demo data mixed with real data" pitfall - use separate `:memory:` DB or explicit flags from start.
**Uses:** parquet-wasm for demo seed generation, new useRotationStore (localStorage).
**Implements:** `generateDemoData()` script with relative dates, demo mode toggle in settings, RotationBuilder component, StartWorkout integration.
**Dependencies:** None (can run in parallel with Phase 3).
**Duration:** 1 week
**Research needed:** LOW (seed data patterns straightforward)

### Phase 5: Workout Summaries & Observability
**Rationale:** Final polish features. Observability uses metrics from batch logging and demo usage.
**Delivers:** Post-workout summary screen with volume/duration/PRs/comparison, performance metrics dashboard in settings tab.
**Addresses:** Completion summaries (must-have), observability (must-have from FEATURES.md).
**Avoids:** "Observability sends PII" pitfall - local-only metrics, no external telemetry. "Performance overhead" - measure with profiling.
**Uses:** web-vitals for Core Web Vitals, custom PerformanceTracker for queries, navigator.storage.estimate for OPFS usage.
**Implements:** WorkoutSummary component, performance/storage panels in BackupSettings, query timing in hooks.
**Dependencies:** Phase 3 (summary uses batch logging flow).
**Duration:** 1 week
**Research needed:** LOW (web-vitals well-documented)

### Phase 6: Portfolio README & Final Polish
**Rationale:** Documentation and cleanup. Can't write README until features are complete.
**Delivers:** Architecture diagram (Mermaid.js), tech stack badges, live demo link with GIF, performance metrics, trade-offs documentation.
**Addresses:** Portfolio README (must-have from FEATURES.md).
**Avoids:** "Polish scope creep" pitfall - timebox to defined deliverables, create v1.3 backlog for extras discovered.
**Dependencies:** All previous phases (documents completed work).
**Duration:** 2-3 days
**Research needed:** NONE (documentation only)

### Phase Ordering Rationale

**Why this order:**
1. Infrastructure first (testing, CI/CD) establishes quality gates before adding features
2. Design system before feature work prevents "two styling systems" pitfall
3. Batch logging highest UX impact, depends on design primitives
4. Demo and rotation can parallelize (separate concerns)
5. Observability and summaries leverage data from batch logging
6. README last (documents completed work)

**Dependency flow:**
```
Phase 1 (Testing/CI) ────┐
                         ├─> Phase 2 (Design System) ─> Phase 3 (Batch Logging) ─┐
                         └─> Phase 4 (Demo & Rotation) ────────────────────────────┤
                                                                                   ├─> Phase 5 (Summaries & Observability) ─> Phase 6 (README)
```

**Critical path:** Phase 1 → Phase 2 → Phase 3 → Phase 5 → Phase 6 (5 weeks)
**Parallel work:** Phase 4 can happen alongside Phase 3 (saves 1 week, total 5 weeks not 6)

**How this avoids pitfalls:**
- Design system before features prevents mixed styling
- Testing strategy defined before writing tests prevents implementation-detail testing
- CI with WASM tests prevents production deployment failures
- Demo isolation architecture decided before implementation prevents data mixing
- Granular error boundaries from Phase 1 prevent app-wide crashes
- Observability privacy config upfront prevents PII leaks
- Timeboxed phases with clear "done" prevent scope creep

### Research Flags

**Phases needing deeper research during planning:**
- **Phase 3 (Batch Logging):** Grid state management performance testing required. Should profile existing SetLogger render time and establish performance budget (<50ms per keystroke) before implementation. May need to research specific React grid libraries if React Hook Form alone insufficient.
- **Phase 5 (Observability):** Need to determine optimal sample rates for query performance tracking that balance data quality with overhead. Should measure baseline overhead of performance.now() calls on real mobile devices.

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (Testing/CI):** Vitest + React Testing Library patterns well-documented, GitHub Actions for Pages deployment has official Vite guide.
- **Phase 2 (Design System):** Tailwind 4 @theme directive recently released but well-documented, design token patterns established.
- **Phase 4 (Demo & Rotation):** Seed data generation and localStorage state management are proven patterns.
- **Phase 6 (README):** Documentation only, no technical research needed.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Vitest 4.0 stable, React Testing Library 16.3.1 React 19 compatible, GitHub Actions well-documented for Vite deployments, Tailwind 4 @theme released late 2025 with good docs, react-error-boundary 6.1.0 verified React 19 support |
| Features | HIGH | Batch logging patterns validated from Hevy/Strong/StrengthLog (2026 industry standards), demo data patterns proven from multiple seed data sources, observability for PWAs covered by privacy-first trends |
| Architecture | HIGH | Integration points clearly defined, most changes additive not replacements, existing hook-based data access and Zustand stores provide clean extension points, no major refactoring required |
| Pitfalls | HIGH | State management re-render issues documented with React Hook Form solutions, design system migration pitfalls validated from Tailwind v3→v4 migration guides, testing anti-patterns from Kent C. Dodds + React Testing Library docs, CI/CD WASM deployment validated from DuckDB official docs |

**Overall confidence:** HIGH

**Primary research quality:**
- Vitest vs Jest 2026 comparisons, React Hook Form with Zod guides, Tailwind CSS 4 migration guides all from 2025-2026
- DuckDB-WASM deployment docs official source
- React Testing Library philosophy from Kent C. Dodds (authoritative)
- Error boundary patterns from React official docs + react-error-boundary library
- Observability privacy-first patterns from 2026 trend articles

**Research completeness:**
- All four research files cover different aspects (STACK for tools, FEATURES for UX expectations, ARCHITECTURE for integration, PITFALLS for risks)
- Multiple sources per finding (triangulated)
- 2026-current best practices validated

### Gaps to Address

**Gaps requiring validation during implementation:**

1. **Batch logging performance baseline**: Should establish actual render time target based on profiling existing SetLogger component in production. Research suggests <50ms per keystroke but need real measurements from GymLog's specific component structure and DuckDB query patterns.

2. **Design token inventory**: Need to audit existing codebase to inventory all Tailwind classes in use before defining tokens. Research provides pattern but not GymLog-specific color/spacing values.

3. **Test coverage targets**: 60-70% coverage suggested but should identify critical paths empirically from user analytics or bug history rather than arbitrary percentage.

4. **DuckDB-WASM CI/CD specifics**: Research covers general WASM deployment (COOP/COEP headers, MIME types) but may need platform-specific config for GitHub Pages (vs Vercel/Netlify). Should test deployment preview before production.

5. **Demo data volume**: Research suggests 6 weeks but should user-test "how much demo data is helpful?" to avoid overwhelming new users while showcasing features effectively.

6. **Observability sampling rates**: web-vitals library doesn't require sampling but custom query performance tracking does. Need to determine optimal sample rate (10%? 100%?) based on overhead measurements.

7. **Phase timeboxing**: 2-week milestone timebox assumed but should validate based on team velocity and parallel work capacity. May need to adjust to 1 week or 3 weeks based on actual implementation speed.

**How to address during planning:**
- Phase 1: Profile baseline performance, audit existing Tailwind usage, configure GitHub Pages deployment preview
- Phase 3: Measure batch logging performance before/after, adjust approach if targets not met
- Phase 4: User-test demo data volume with 2-3 external reviewers
- Phase 5: Measure observability overhead on low-end mobile device, adjust sampling if needed
- Throughout: Track actual time per phase, adjust timeboxing for v1.3 based on v1.2 velocity

## Sources

### Primary (HIGH confidence)

**Stack & Tools:**
- [Vitest 4.0 Release](https://vitest.dev/blog/vitest-4) - Testing framework
- [Deploying DuckDB-WASM - Official Docs](https://duckdb.org/docs/stable/clients/wasm/deploying_duckdb_wasm) - WASM deployment
- [Tailwind CSS v4.0](https://tailwindcss.com/blog/tailwindcss-v4) - Design system @theme
- [react-error-boundary npm](https://www.npmjs.com/package/react-error-boundary) - Error handling
- [web-vitals npm](https://www.npmjs.com/package/web-vitals) - Performance monitoring
- [parquet-wasm docs](https://kylebarron.dev/parquet-wasm/) - Demo data generation

**Testing & Best Practices:**
- [Common mistakes with React Testing Library - Kent C. Dodds](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library) - Testing strategy
- [React v19](https://react.dev/blog/2024/12/05/react-19) - Error boundary improvements
- [React Testing Library official docs](https://testing-library.com/docs/react-testing-library/intro/) - User behavior testing

**UX Research:**
- [Hevy App Review 2026](https://www.prpath.app/blog/hevy-app-review-2026.html) - Batch logging patterns
- [Best Workout Tracker Apps 2026](https://www.hevyapp.com/best-workout-tracker-app/) - Feature expectations

### Secondary (MEDIUM confidence)

**Architecture & Integration:**
- [State Management in 2026 - Nucamp](https://www.nucamp.co/blog/state-management-in-2026-redux-context-api-and-modern-patterns) - Zustand patterns
- [React Hook Form with Zod Complete Guide 2026](https://dev.to/marufrahmanlive/react-hook-form-with-zod-complete-guide-for-2026-1em1) - Grid validation
- [Deploying Vite to GitHub Pages with GitHub Actions](https://savaslabs.com/blog/deploying-vite-github-pages-single-github-action) - CI/CD

**Pitfalls & Warnings:**
- [Design Systems with Tailwind CSS - Makers' Den](https://makersden.io/blog/design-systems-with-tailwind-css) - Migration patterns
- [Use react-error-boundary to handle errors - Kent C. Dodds](https://kentcdodds.com/blog/use-react-error-boundary-to-handle-errors-in-react) - Error handling
- [Data Privacy in Frontend Observability - Grafana](https://grafana.com/docs/grafana-cloud/monitor-applications/frontend-observability/data-privacy/) - Privacy config

### Tertiary (LOW confidence - general guidance)

- [Best Practices for React UI Testing 2026 - Trio](https://trio.dev/best-practices-for-react-ui-testing/)
- [11 Key Observability Best Practices 2026 - Spacelift](https://spacelift.io/blog/observability-best-practices)
- [How to Prevent Scope Creep - Creative Agency Book](https://www.creativeagencybook.com/blog/scope-creep-how-to-prevent-it)

---
*Research completed: 2026-01-30*
*Ready for roadmap: yes*
*Orchestrator: DO NOT COMMIT - waiting for orchestrator*
