# Requirements: GymLog v1.2 UX & Portfolio Polish

**Defined:** 2026-01-30
**Core Value:** Track workout performance with proper data engineering — both usable as a personal training tool and impressive as a senior Data Engineer portfolio piece.

## v1.2 Requirements

Requirements for UX & Portfolio Polish milestone. Each maps to roadmap phases.

### Batch Logging

- [ ] **BLOG-01**: User can view all sets for an exercise in a pre-filled grid (rows = template set count)
- [ ] **BLOG-02**: User sees last session's weight/reps as ghost text in each grid cell
- [ ] **BLOG-03**: User can edit weight/reps/RIR inline in grid cells
- [ ] **BLOG-04**: User can add or remove set rows from the grid
- [ ] **BLOG-05**: User can save all sets at once on workout completion

### Workout Rotation

- [ ] **ROTN-01**: User can define a template sequence per gym in settings (e.g., Upper A → Lower A → Upper B → Lower B)
- [ ] **ROTN-02**: Start Workout pre-fills gym and next template from rotation (editable before confirming)
- [ ] **ROTN-03**: Rotation auto-advances to next template after completing a workout
- [ ] **ROTN-04**: User can manually reset rotation position

### Workout Summary

- [ ] **SUMM-01**: User sees workout summary after completion (total volume, duration, sets, exercises)
- [ ] **SUMM-02**: User sees list of PRs achieved during the workout
- [ ] **SUMM-03**: User sees comparison to last session with same template (volume delta)

### Visual Polish

- [ ] **UI-01**: Design token system established (consistent colors, spacing, typography via Tailwind)
- [ ] **UI-02**: Reusable primitive components extracted (Button, Input, Card)
- [ ] **UI-03**: All screens migrated to consistent design system
- [ ] **UI-04**: Transitions and visual refinements applied across app

### Testing & Quality

- [ ] **TEST-01**: Testing infrastructure set up (Vitest + React Testing Library)
- [ ] **TEST-02**: Unit tests for critical hooks (useHistory, useExerciseProgress, useWorkoutStore)
- [ ] **TEST-03**: Integration tests for workout logging flow
- [ ] **TEST-04**: Error boundaries with graceful fallback UI at feature level

### CI/CD & Infrastructure

- [ ] **CICD-01**: GitHub Actions pipeline runs tests on push
- [ ] **CICD-02**: GitHub Actions deploys to GitHub Pages on merge to main
- [ ] **CICD-03**: dbt compile step in CI pipeline

### Portfolio & Demo

- [ ] **PORT-01**: One-click demo data load (6 weeks of realistic workouts with progressive overload + plateaus)
- [ ] **PORT-02**: Portfolio-ready README with architecture diagram, tech stack, live demo link, performance metrics
- [ ] **PORT-03**: dbt lineage/data model visible (in README or hosted docs)
- [ ] **PORT-04**: Observability dashboard in Settings (storage usage, query performance, event count)
- [ ] **PORT-05**: Data quality summary visible in app (dbt test results, anomaly count)

## v1.3 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Extended Analytics

- **EXT-01**: User can select custom time range (3 months, 6 months, 1 year, all time)
- **EXT-02**: User sees volume recommendations comparing to research-backed targets
- **EXT-03**: User can export chart as image

### Advanced Features

- **ADV-01**: User can compare multiple exercises on one chart
- **ADV-02**: User can set personal volume targets per muscle group
- **ADV-03**: User receives periodic progress summary notifications

### Advanced Logging

- **ALOG-01**: User can mark sets as warmup, working, drop, or failure
- **ALOG-02**: User can rate session RPE (1-10) after completing workout
- **ALOG-03**: User can use supersets (paired exercises)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Complex periodization (linear/undulating/block) | Overkill for rotation feature; simple sequence is sufficient |
| AI workout generation | Adds complexity without clear value; user defines own programs |
| Calendar sync (Google/Apple) | API complexity; in-app rotation sufficient |
| External telemetry (Datadog, etc.) | Violates local-first privacy model |
| Social sharing of workouts | Low priority; not core to personal tool or DE showcase |
| Smartwatch integration | Defer to v2+; solve mobile UX first |
| Full component library migration (shadcn/ui) | Overkill; extract primitives from existing Tailwind patterns |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| BLOG-01 | Phase 9 | Pending |
| BLOG-02 | Phase 9 | Pending |
| BLOG-03 | Phase 9 | Pending |
| BLOG-04 | Phase 9 | Pending |
| BLOG-05 | Phase 9 | Pending |
| ROTN-01 | Phase 10 | Pending |
| ROTN-02 | Phase 10 | Pending |
| ROTN-03 | Phase 10 | Pending |
| ROTN-04 | Phase 10 | Pending |
| SUMM-01 | Phase 10 | Pending |
| SUMM-02 | Phase 10 | Pending |
| SUMM-03 | Phase 10 | Pending |
| UI-01 | Phase 8 | Complete |
| UI-02 | Phase 8 | Complete |
| UI-03 | Phase 9 | Pending |
| UI-04 | Phase 9 | Pending |
| TEST-01 | Phase 8 | Complete |
| TEST-02 | Phase 8 | Complete |
| TEST-03 | Phase 8 | Complete |
| TEST-04 | Phase 8 | Complete |
| CICD-01 | Phase 11 | Pending |
| CICD-02 | Phase 11 | Pending |
| CICD-03 | Phase 11 | Pending |
| PORT-01 | Phase 10 | Pending |
| PORT-02 | Phase 11 | Pending |
| PORT-03 | Phase 11 | Pending |
| PORT-04 | Phase 11 | Pending |
| PORT-05 | Phase 11 | Pending |

**Coverage:**
- v1.2 requirements: 28 total
- Mapped to phases: 28
- Unmapped: 0

---
*Requirements defined: 2026-01-30*
*Last updated: 2026-01-30 — traceability updated with phase mappings*
