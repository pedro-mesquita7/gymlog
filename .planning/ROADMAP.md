# Roadmap: GymLog

## Milestones

- v1.0 MVP - Phases 1-4 (shipped 2026-01-28)
- v1.1 Analytics - Phases 5-7 (shipped 2026-01-30)
- v1.2 UX & Portfolio Polish - Phases 8-11 (shipped 2026-01-31)
- v1.3 Production Polish & Deploy Readiness - Phases 12-17 (in progress)

## Phases

<details>
<summary>v1.0 MVP (Phases 1-4) - SHIPPED 2026-01-28</summary>

### Phase 1: Foundation & Data Layer
**Goal**: Establish DuckDB-WASM + event sourcing foundation
**Plans**: 6 plans (complete)

### Phase 2: Templates & Logging
**Goal**: Workout templates and active workout logging
**Plans**: 9 plans (complete)

### Phase 3: History & Analytics
**Goal**: Exercise history with gym-context filtering and PR detection
**Plans**: 6 plans (complete)

### Phase 4: Polish & Data Durability
**Goal**: Data export/import and PWA offline support
**Plans**: 6 plans (complete)

</details>

<details>
<summary>v1.1 Analytics (Phases 5-7) - SHIPPED 2026-01-30</summary>

### Phase 5: Analytics Foundation & Progress Charts
**Goal**: Establish analytics data layer, integrate Recharts, and deliver exercise progress visualization
**Plans**: 7 plans (complete)

### Phase 6: Volume Analytics
**Goal**: Deliver muscle group volume tracking with visual indicators for training balance
**Plans**: 5 plans (complete)

### Phase 7: Progression Intelligence
**Goal**: Deliver progression detection with dashboard overview and workout alerts
**Plans**: 3 plans (complete)

</details>

<details>
<summary>v1.2 UX & Portfolio Polish (Phases 8-11) - SHIPPED 2026-01-31</summary>

### Phase 8: Testing & Design Foundation
**Goal**: Production-grade testing, error recovery, and consistent visual primitives
**Plans**: 7 plans (complete)

### Phase 9: Batch Logging & Visual Polish
**Goal**: Efficient batch workout logging with pre-filled grids and consistent visual design
**Plans**: 5 plans (complete)

### Phase 10: Workout Features & Demo Data
**Goal**: Workout rotations, post-workout summaries, and one-click demo data
**Plans**: 4 plans (complete)

### Phase 11: CI/CD & Portfolio
**Goal**: Automated CI/CD, portfolio README, observability, and data quality monitoring
**Plans**: 7 plans (complete)

</details>

### v1.3 Production Polish & Deploy Readiness (In Progress)

**Milestone Goal:** Harden GymLog for real-world use and deploy readiness -- fix data bugs, lock down security, add regression tests, redesign analytics, add TOON export, and polish every surface for production confidence.

#### Phase 12: Bug Fix & Security Hardening
**Goal**: Users trust the app with their data -- exercise history survives plan changes, errors are caught gracefully, and no security holes exist
**Depends on**: Phase 11
**Requirements**: BUG-01, BUG-02, SEC-01, SEC-02, SEC-03, SEC-04, SEC-05
**Success Criteria** (what must be TRUE):
  1. User deletes a gym plan and all exercise history for non-gym-specific exercises remains intact and visible
  2. User encounters a database or network error and sees a descriptive error card with recovery action instead of a broken screen
  3. No secrets, API keys, or PII exist in git history, .env files, localStorage, or demo data fixtures
  4. `npm audit` reports zero high/critical vulnerabilities
  5. App loads and functions correctly with CSP headers enabled (DuckDB-WASM worker-src and wasm-unsafe-eval accommodated)
**Plans**: 4 plans (complete)
Plans:
- [x] 12-01-PLAN.md -- Fix exercise history query (DIM_EXERCISE_ALL_SQL for deleted exercises)
- [x] 12-02-PLAN.md -- Add sub-component error boundaries (analytics, history, workout)
- [x] 12-03-PLAN.md -- Security audit, .gitignore update, SECURITY-AUDIT.md report
- [x] 12-04-PLAN.md -- npm audit fix and CSP meta tag for DuckDB-WASM

#### Phase 13: E2E Test Suite
**Goal**: Developers have a regression safety net that catches breakage before it ships -- covering the critical user workflows end-to-end
**Depends on**: Phase 12 (bug fix ensures tests validate correct behavior)
**Requirements**: TEST-01, TEST-02, TEST-03, TEST-04, TEST-05
**Success Criteria** (what must be TRUE):
  1. E2E test creates a plan, logs workouts, deletes the plan, and verifies exercise history persists
  2. E2E test opens batch logging, handles empty sets and max values, and verifies ghost text appears from previous session
  3. E2E test starts a workout via Quick Start, completes it, and verifies rotation advances to next template
  4. E2E test imports demo data and verifies charts populate, then clears data and verifies empty state
  5. E2E test exports data as Parquet, re-imports from that file, and verifies data matches
**Plans**: 7 plans
Plans:
- [ ] 13-01-PLAN.md -- Test infrastructure: data-testid attributes, fixtures, helpers, config
- [ ] 13-02-PLAN.md -- TEST-01: Plan CRUD with exercise history preservation
- [ ] 13-03-PLAN.md -- TEST-02: Batch logging edge cases (empty sets, max values, ghost text)
- [ ] 13-04-PLAN.md -- TEST-03: Quick Start and workout rotation advancement
- [ ] 13-05-PLAN.md -- TEST-04: Demo data import and clear
- [ ] 13-06-PLAN.md -- TEST-05: Parquet export/import round-trip
- [ ] 13-07-PLAN.md -- CI integration and full suite verification

#### Phase 14: Workouts UX & Color Scheme
**Goal**: Users experience a visually cohesive app where starting a workout takes one tap and every screen feels intentionally designed
**Depends on**: Phase 13 (tests protect against visual regression)
**Requirements**: UX-01, UX-02, CLR-01, CLR-02, CLR-03
**Success Criteria** (what must be TRUE):
  1. User opens Workouts tab and sees Quick Start as the primary call-to-action, with manual template selection collapsed or secondary
  2. Workouts tab uses compact layout with less vertical space per element, showing more content above the fold
  3. All OKLCH color tokens are cohesive across every tab and state (active, hover, disabled, error)
  4. All text passes WCAG AA contrast ratio (4.5:1 for normal text, 3:1 for large text and UI components) while retaining orange as primary brand accent
**Plans**: TBD

#### Phase 15: Analytics Redesign
**Goal**: Users see a single, scrollable analytics dashboard with time-range filtering and research-backed volume recommendations that tell them if their training is on track
**Depends on**: Phase 14 (color tokens applied before analytics chart styling)
**Requirements**: ANLT-01, ANLT-02, ANLT-03, ANLT-04
**Success Criteria** (what must be TRUE):
  1. User sees analytics as one scrollable page: summary stats at top, volume overview in middle, exercise detail at bottom -- no drill-down navigation required
  2. User taps a time range pill (1M/3M/6M/1Y/All) and all charts and stats update to reflect that window
  3. Volume per muscle group chart shows color-coded zones (under MEV, MEV-MAV, MAV, near MRV, over MRV) based on Schoenfeld/RP research ranges
  4. User sees a volume zone legend explaining MEV/MAV/MRV terms with source citation
**Plans**: TBD

#### Phase 16: Demo Data UX & TOON Export
**Goal**: Portfolio reviewers can safely explore and reset demo data, and users can export workout data in LLM-optimized TOON format for sharing or analysis
**Depends on**: Phase 15 (analytics must work before demo data showcases them)
**Requirements**: DEMO-01, DEMO-02, DEMO-03, TOON-01, TOON-02, TOON-03, TOON-04, TOON-05
**Success Criteria** (what must be TRUE):
  1. Import demo data button has distinct gradient/warning styling that signals a destructive one-time action
  2. User clicks "Clear Historical Data" and workout/set logs are wiped while exercises, gyms, and plans remain intact
  3. Both import and clear actions require explicit confirmation dialog before executing
  4. User can copy last workout as TOON text to clipboard or download as .toon file
  5. User can export current rotation cycle or a configurable time range as TOON with context headers (exercise definitions, date range, muscle groups)
**Plans**: TBD

#### Phase 17: PWA, Performance, README & Final Polish
**Goal**: App is deploy-ready with verified offline support, documented performance budgets, a portfolio-grade README, and no rough edges remaining
**Depends on**: Phase 16 (all features complete before final polish)
**Requirements**: PWA-01, PWA-02, PWA-03, PWA-04, README-01, README-02, README-03, POLISH-01, POLISH-02
**Success Criteria** (what must be TRUE):
  1. App works fully offline after first load -- service worker caches all assets and DuckDB-WASM initializes from cache
  2. PWA manifest produces installable prompt on mobile with correct icons, theme color, and app name
  3. Lighthouse performance score is documented with targets, and bundle size budget is checked in CI
  4. README shows live demo link prominently, includes screenshots/GIF of key features, and provides working "run locally" instructions from clean clone
  5. No UX inconsistencies remain across tabs (empty states, loading states, error states all handled consistently)

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation | v1.0 | 6/6 | Complete | 2026-01-28 |
| 2. Templates | v1.0 | 9/9 | Complete | 2026-01-28 |
| 3. History | v1.0 | 6/6 | Complete | 2026-01-28 |
| 4. Polish | v1.0 | 6/6 | Complete | 2026-01-28 |
| 5. Analytics Foundation | v1.1 | 7/7 | Complete | 2026-01-30 |
| 6. Volume Analytics | v1.1 | 5/5 | Complete | 2026-01-30 |
| 7. Progression Intelligence | v1.1 | 3/3 | Complete | 2026-01-30 |
| 8. Testing & Design Foundation | v1.2 | 7/7 | Complete | 2026-01-31 |
| 9. Batch Logging & Visual Polish | v1.2 | 5/5 | Complete | 2026-01-31 |
| 10. Workout Features & Demo Data | v1.2 | 4/4 | Complete | 2026-01-31 |
| 11. CI/CD & Portfolio | v1.2 | 7/7 | Complete | 2026-01-31 |
| 12. Bug Fix & Security Hardening | v1.3 | 4/4 | Complete | 2026-01-31 |
| 13. E2E Test Suite | v1.3 | 0/7 | Not started | - |
| 14. Workouts UX & Color Scheme | v1.3 | 0/TBD | Not started | - |
| 15. Analytics Redesign | v1.3 | 0/TBD | Not started | - |
| 16. Demo Data UX & TOON Export | v1.3 | 0/TBD | Not started | - |
| 17. PWA, Performance, README & Final Polish | v1.3 | 0/TBD | Not started | - |

---
*Roadmap created: 2026-01-28*
*Last updated: 2026-01-31 -- Phase 13 planned (7 plans in 3 waves)*
