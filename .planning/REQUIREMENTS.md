# Requirements: GymLog v1.1 Analytics

**Defined:** 2026-01-28
**Core Value:** Track workout performance with proper data engineering — both usable as a personal training tool and impressive as a senior Data Engineer portfolio piece.

## v1.1 Requirements

Requirements for Analytics milestone. Each maps to roadmap phases.

### Progress Charts

- [x] **CHART-01**: User can view exercise progress chart showing weight over last 4 weeks
- [x] **CHART-02**: User can view estimated 1RM trend on exercise progress chart
- [x] **CHART-03**: User can view volume (sets x reps x weight) per exercise over time
- [x] **CHART-04**: User can compare this week's performance to last week for each exercise

### Volume Analytics

- [x] **VOL-01**: User can view sets per week by muscle group as bar chart
- [x] **VOL-02**: User sees color-coded volume zones (under 10 sets, 10-20 optimal, 20+ high)
- [x] **VOL-03**: User can view muscle group heat map showing training frequency

### PR & History

- [x] **PR-01**: User can view PR list showing all-time bests per exercise

### Progression Intelligence

- [x] **PROG-01**: User sees plateau alert when no PR achieved in 4+ weeks with flat trend
- [x] **PROG-02**: User sees regression alert when weight drops 10%+ or volume drops 20%+
- [x] **PROG-03**: User can view progression dashboard showing status (progressing/plateau/regressing) per exercise

### Infrastructure

- [x] **INFRA-01**: Analytics tab added to main navigation
- [x] **INFRA-02**: Recharts library integrated with Tailwind CSS theming
- [x] **INFRA-03**: Analytics dbt models created (vw_exercise_progress, vw_volume_by_muscle_group, vw_progression_status)

## v1.2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Extended Analytics

- **EXT-01**: User can select custom time range (3 months, 6 months, 1 year, all time)
- **EXT-02**: User sees volume recommendations comparing to research-backed targets
- **EXT-03**: User can export chart as image

### Advanced Features

- **ADV-01**: User can compare multiple exercises on one chart
- **ADV-02**: User can set personal volume targets per muscle group
- **ADV-03**: User receives periodic progress summary notifications

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| AI workout recommendations | Complexity not justified; user makes their own programming decisions |
| Social/leaderboard comparison | Anti-feature per research; introduces confounding variables |
| Calorie/nutrition tracking | Different domain; keep focus on performance metrics |
| Guilt-based alerts | Anti-feature per research; causes app abandonment |
| Smartwatch integration | Defer to v2+; solve mobile first |
| Complex derived metrics | "Training load" etc. confusing without explanation |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | Phase 5 | Complete |
| INFRA-02 | Phase 5 | Complete |
| INFRA-03 | Phase 5 | Complete |
| CHART-01 | Phase 5 | Complete |
| CHART-02 | Phase 5 | Complete |
| CHART-03 | Phase 5 | Complete |
| CHART-04 | Phase 5 | Complete |
| PR-01 | Phase 5 | Complete |
| VOL-01 | Phase 6 | Complete |
| VOL-02 | Phase 6 | Complete |
| VOL-03 | Phase 6 | Complete |
| PROG-01 | Phase 7 | Complete |
| PROG-02 | Phase 7 | Complete |
| PROG-03 | Phase 7 | Complete |

**Coverage:**
- v1.1 requirements: 14 total
- Mapped to phases: 14
- Unmapped: 0

---
*Requirements defined: 2026-01-28*
*Last updated: 2026-01-30 — Phase 7 requirements complete*
