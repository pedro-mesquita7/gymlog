# Roadmap: GymLog

## Milestones

- ✅ **v1.0 MVP** - Phases 1-4 (shipped 2026-01-28)
- 🚧 **v1.1 Analytics** - Phases 5-7 (in progress)

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

### v1.1 Analytics (In Progress)

**Milestone Goal:** Add visual analytics and progression tracking to help users understand their training trends and identify plateaus.

#### Phase 5: Analytics Foundation & Progress Charts
**Goal**: Establish analytics data layer, integrate Recharts, and deliver exercise progress visualization
**Depends on**: Phase 4
**Requirements**: INFRA-01, INFRA-02, INFRA-03, CHART-01, CHART-02, CHART-03, CHART-04, PR-01
**Success Criteria** (what must be TRUE):
  1. User can navigate to Analytics tab from main navigation
  2. User can view line chart showing weight progression over last 4 weeks for any exercise
  3. User can view estimated 1RM trend line overlaid on exercise progress chart
  4. User can view total volume (sets x reps x weight) over time for each exercise
  5. User can view this week vs last week performance comparison per exercise
  6. User can view all-time PR list showing best lifts per exercise
**Plans**: 7 plans in 3 waves + 1 gap closure wave

Plans:
- [x] 05-01-PLAN.md — dbt analytics views (vw_exercise_progress, vw_weekly_comparison) [Wave 1]
- [x] 05-02-PLAN.md — Install Recharts/date-fns, extend types, add SQL queries [Wave 1]
- [x] 05-03-PLAN.md — Analytics hooks (useExerciseProgress, useWeeklyComparison) [Wave 2]
- [x] 05-04-PLAN.md — Chart components (ExerciseProgressChart, WeekComparisonCard, PRListCard) [Wave 2]
- [x] 05-05-PLAN.md — AnalyticsPage container and Navigation integration with lazy loading [Wave 3]
- [ ] 05-06-PLAN.md — Fix date parsing bug (remove epoch-day multiplication) [Gap Closure]
- [ ] 05-07-PLAN.md — Fix OPFS database corruption (accessMode, CHECKPOINT, cleanup) [Gap Closure]

#### Phase 6: Volume Analytics
**Goal**: Deliver muscle group volume tracking with visual indicators for training balance
**Depends on**: Phase 5
**Requirements**: VOL-01, VOL-02, VOL-03
**Success Criteria** (what must be TRUE):
  1. User can view bar chart showing sets per week grouped by muscle group
  2. User sees color-coded volume zones (red <10 sets, green 10-20 optimal, yellow 20+ high)
  3. User can view muscle group heat map showing training frequency distribution
**Plans**: TBD

Plans:
- [ ] 06-01: MuscleGroupVolumeChart with stacked bars
- [ ] 06-02: Volume zone color coding and frequency heat map

#### Phase 7: Progression Intelligence
**Goal**: Deliver progression detection with dashboard overview and workout alerts
**Depends on**: Phase 6
**Requirements**: PROG-01, PROG-02, PROG-03
**Success Criteria** (what must be TRUE):
  1. User sees plateau alert badge when no PR achieved in 4+ weeks with flat weight trend
  2. User sees regression alert when weight drops 10%+ or volume drops 20%+ from recent average
  3. User can view progression dashboard showing status (progressing/plateau/regressing) for each exercise
  4. User sees contextual alert during workout logging when current exercise is in plateau/regression
**Plans**: TBD

Plans:
- [ ] 07-01: ProgressionDashboard and status cards
- [ ] 07-02: Workout alerts injection into SetLogger

## Progress

**Execution Order:**
Phases execute in numeric order: 5 -> 6 -> 7

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation | v1.0 | 6/6 | Complete | 2026-01-28 |
| 2. Templates | v1.0 | 9/9 | Complete | 2026-01-28 |
| 3. History | v1.0 | 6/6 | Complete | 2026-01-28 |
| 4. Polish | v1.0 | 6/6 | Complete | 2026-01-28 |
| 5. Analytics Foundation | v1.1 | 5/7 | Gap Closure | - |
| 6. Volume Analytics | v1.1 | 0/2 | Not started | - |
| 7. Progression Intelligence | v1.1 | 0/2 | Not started | - |

---
*Roadmap created: 2026-01-28*
*Last updated: 2026-01-30*
