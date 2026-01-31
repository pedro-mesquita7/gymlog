# Roadmap: GymLog

## Milestones

- **v1.0 MVP** - Phases 1-4 (shipped 2026-01-28)
- **v1.1 Analytics** - Phases 5-7 (shipped 2026-01-30)
- **v1.2 UX & Portfolio Polish** - Phases 8-11 (shipped 2026-01-31)

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

### Phase 8: Testing & Design Foundation
**Goal**: Users have confidence in app reliability with production-grade testing, error recovery, and consistent visual primitives for upcoming features

**Dependencies**: None (foundation phase)

**Requirements**: TEST-01, TEST-02, TEST-03, TEST-04, UI-01, UI-02

**Plans**: 7 plans

Plans:
- [ ] 08-01-PLAN.md — Testing infrastructure (Vitest, RTL, Playwright, DuckDB mock)
- [ ] 08-02-PLAN.md — Design token system & Geist fonts
- [ ] 08-03-PLAN.md — Error boundary system with inline error cards
- [ ] 08-04-PLAN.md — UI primitive components (Button, Input, Card) + migration
- [ ] 08-05-PLAN.md — Unit tests for critical hooks (useHistory, useWorkoutStore, useExerciseProgress)
- [ ] 08-06-PLAN.md — Integration tests & E2E workout flow (Playwright)
- [ ] 08-07-PLAN.md — Visual verification & cleanup

**Success Criteria**:
1. User sees graceful error UI with recovery options when database queries fail, instead of blank screen
2. User sees consistent button and input styling in migrated components (StartWorkout, SetLogger, TemplateCard)
3. Developer can run unit tests locally and in CI with clear pass/fail output
4. Developer can run integration tests that verify DuckDB-WASM initialization in real browser

### Phase 9: Batch Logging & Visual Polish
**Goal**: Users can log entire workout sessions efficiently with pre-filled grids showing last session data, and all screens follow consistent visual design

**Dependencies**: Phase 8 (design primitives)

**Requirements**: BLOG-01, BLOG-02, BLOG-03, BLOG-04, BLOG-05, UI-03, UI-04

**Plans**: 4 plans

Plans:
- [ ] 09-01-PLAN.md — Ghost data hook, SetGrid/SetRow components, Dialog primitive
- [ ] 09-02-PLAN.md — Wire batch logging into workout flow, rest timer banner, completion dialogs
- [ ] 09-03-PLAN.md — Install framer-motion, page transitions, design token migration across all screens
- [ ] 09-04-PLAN.md — Build verification and human visual/interaction testing

**Success Criteria**:
1. User sees all sets for current exercise in spreadsheet-like grid with weight/reps columns
2. User sees ghost text from last session's performance in each grid cell as reference
3. User can edit any cell, add/remove set rows, and save all sets at once on workout completion
4. User experiences consistent visual design (colors, spacing, typography) across all app screens
5. User sees smooth transitions when navigating between screens and updating data

### Phase 10: Workout Features & Demo Data
**Goal**: Users can configure workout rotations that auto-advance between sessions, see post-workout summaries with PRs and volume comparison, and portfolio reviewers can load realistic demo data with one click

**Dependencies**: Phase 9 (batch logging for summary data)

**Requirements**: ROTN-01, ROTN-02, ROTN-03, ROTN-04, SUMM-01, SUMM-02, SUMM-03, PORT-01

**Plans**: 4 plans

Plans:
- [x] 10-01-PLAN.md — Rotation store + Settings UI with drag-and-drop editor
- [x] 10-02-PLAN.md — Quick-start card + StartWorkout rotation pre-fill
- [x] 10-03-PLAN.md — Enhanced WorkoutComplete with PRs, comparison, rotation advance
- [x] 10-04-PLAN.md — Demo data generation + clear all data

**Success Criteria**:
1. User can define template sequence per gym (e.g., Upper A -> Lower A -> Upper B -> Lower B) in settings
2. User sees pre-filled gym and next template from rotation when starting workout (editable before confirming)
3. User rotation auto-advances to next template after completing each workout
4. User sees summary screen after workout completion showing total volume, duration, sets, exercises, PRs, and comparison to last session
5. Portfolio reviewer can click "Load Demo Data" button and immediately see 6 weeks of realistic workout history with progressive overload patterns

### Phase 11: CI/CD & Portfolio
**Goal**: Portfolio reviewers see production-grade engineering practices (automated testing/deployment, comprehensive README, data quality monitoring, system observability) that demonstrate senior Data Engineer capabilities

**Dependencies**: Phase 10 (documents completed features)

**Requirements**: CICD-01, CICD-02, CICD-03, PORT-02, PORT-03, PORT-04, PORT-05

**Plans**: 7 plans

Plans:
- [x] 11-01-PLAN.md — GitHub Actions CI pipeline (lint, unit test, E2E test, dbt check, gated deploy)
- [x] 11-02-PLAN.md — GitHub Pages deployment config (Vite base path, coi-serviceworker)
- [x] 11-03-PLAN.md — Portfolio README (architecture diagram, tech stack, data engineering decisions, dbt lineage)
- [x] 11-04-PLAN.md — In-app observability dashboard (storage usage, query metrics, event counts)
- [x] 11-05-PLAN.md — Data quality display (run compiled dbt test SQL client-side, anomaly counts)
- [ ] 11-06-PLAN.md — Fix production fonts and chunk splitting (gap closure)
- [ ] 11-07-PLAN.md — Fix data quality test SQL to use CTEs (gap closure)

**Success Criteria**:
1. GitHub Actions pipeline runs tests and deploys to GitHub Pages automatically on every merge to main
2. Developer sees clear CI failure if tests fail or dbt compilation fails, preventing broken deploys
3. Portfolio reviewer sees README with architecture diagram, live demo link, tech stack overview, and key data engineering decisions explained
4. Portfolio reviewer can view dbt lineage diagram and understand data transformation flow (in README or hosted docs)
5. User sees observability dashboard in Settings showing storage usage, query performance metrics, and event count over time
6. User sees data quality summary in app displaying dbt test results and anomaly counts

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
| 11. CI/CD & Portfolio | v1.2 | 5/7 | Gap closure | 2026-01-31 |

---
*Roadmap created: 2026-01-28*
*Last updated: 2026-01-31 — Phase 11 gap closure (2 fix plans added for UAT issues)*
