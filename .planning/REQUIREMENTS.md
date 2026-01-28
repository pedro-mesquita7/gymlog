# Requirements: GymLog

**Defined:** 2026-01-27
**Core Value:** Track workout performance with proper data engineering — both usable as a personal training tool and impressive as a senior Data Engineer portfolio piece.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Exercise Management

- [ ] **EXER-01**: User can create exercise with name, primary muscle group, and global/gym-specific flag
- [ ] **EXER-02**: User can edit existing exercise details
- [ ] **EXER-03**: User can delete exercise (with confirmation if used in templates)
- [ ] **EXER-04**: User can view list of all exercises filtered by muscle group

### Gym Management

- [ ] **GYM-01**: User can create gym with name and optional location
- [ ] **GYM-02**: User can edit gym details
- [ ] **GYM-03**: User can delete gym (with confirmation if has workout history)
- [ ] **GYM-04**: User can view list of all gyms

### Workout Templates

- [ ] **TMPL-01**: User can create workout template with name (e.g., "Upper A")
- [ ] **TMPL-02**: User can add exercises to template in specific order
- [ ] **TMPL-03**: User can set target rep range per exercise in template (e.g., 8-12)
- [ ] **TMPL-04**: User can set optional replacement exercise per exercise in template
- [ ] **TMPL-05**: User can reorder exercises within template
- [ ] **TMPL-06**: User can edit template (add/remove/reorder exercises)
- [ ] **TMPL-07**: User can delete template

### Workout Logging

- [ ] **LOG-01**: User can start workout by selecting gym and template
- [ ] **LOG-02**: User sees exercises in template order with target rep range and last session history
- [ ] **LOG-03**: User can log each set with weight (kg) and reps
- [ ] **LOG-04**: User can optionally add RIR to each set
- [ ] **LOG-05**: User can switch from default exercise to predefined replacement
- [ ] **LOG-06**: User can add custom one-off exercise (not saved to template)
- [ ] **LOG-07**: User can start/stop rest timer between sets (configurable duration)
- [ ] **LOG-08**: User can complete workout and save all logged data
- [ ] **LOG-09**: User can cancel workout in progress (with confirmation)

### History & Analytics

- [ ] **HIST-01**: User can view exercise history showing last 2 weeks of sets
- [ ] **HIST-02**: History respects global vs gym-specific rule (gym-specific shows only current gym data)
- [ ] **HIST-03**: User sees automatic PR detection when new PR is set
- [ ] **HIST-04**: User can view estimated 1RM for exercises (Epley formula)
- [ ] **HIST-05**: User can view list of all PRs per exercise

### Data Engineering

- [ ] **DATA-01**: Data stored in star schema (fact_sets, dim_exercise, dim_gym, dim_workout_template)
- [ ] **DATA-02**: Storage uses DuckDB-WASM with Parquet files in OPFS
- [ ] **DATA-03**: dbt models transform raw events to staging to marts (compiled at build time)
- [ ] **DATA-04**: Event sourcing: all changes stored as immutable events, views derived from events
- [ ] **DATA-05**: dbt tests validate data quality (unique, not_null, relationships, custom rules)
- [ ] **DATA-06**: dbt documentation generates data dictionary and lineage graphs
- [ ] **DATA-07**: All raw events have audit columns (_created_at, _event_id)
- [ ] **DATA-08**: Event processing is idempotent (replay-safe with natural keys)
- [ ] **DATA-09**: Parquet files partitioned by month
- [ ] **DATA-10**: Metrics layer defines 1RM, volume, PR calculations as single source of truth
- [ ] **DATA-11**: Anomaly detection flags unusual values (e.g., weight jumped 50%+)

### Data Durability

- [ ] **DURA-01**: User can export all data as Parquet file download
- [ ] **DURA-02**: User can import data from Parquet backup file
- [ ] **DURA-03**: App shows backup reminder after N workouts since last export

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Analytics

- **ANAL-01**: User can view progress charts over time per exercise
- **ANAL-02**: User can view volume trends by muscle group
- **ANAL-03**: User can see progression detection (plateau/regression analysis)

### Workout Features

- **WORK-01**: User can create supersets (paired exercises)
- **WORK-02**: User sees plate calculator for loading barbell
- **WORK-03**: User can duplicate existing template

### Data

- **DATA-12**: SCD Type 2 for exercise definition changes
- **DATA-13**: Incremental aggregations for performance optimization

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Cloud sync/backup | Keeping local-first for v1, avoids infrastructure complexity |
| Multi-user support | Personal use only |
| Mobile native app | PWA covers mobile use case adequately |
| Social features | Not relevant for personal tracker |
| Calorie/nutrition tracking | Different domain, anti-feature per research |
| Gamification (streaks, badges) | Anti-feature per research, causes guilt |
| Unit conversion (lbs) | kg only for simplicity |
| OAuth/accounts | No backend, local data only |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| EXER-01 | Phase 1 | Complete |
| EXER-02 | Phase 1 | Complete |
| EXER-03 | Phase 1 | Complete |
| EXER-04 | Phase 1 | Complete |
| GYM-01 | Phase 1 | Complete |
| GYM-02 | Phase 1 | Complete |
| GYM-03 | Phase 1 | Complete |
| GYM-04 | Phase 1 | Complete |
| DATA-01 | Phase 1 | Complete |
| DATA-02 | Phase 1 | Complete |
| DATA-03 | Phase 1 | Complete |
| DATA-04 | Phase 1 | Complete |
| DATA-07 | Phase 1 | Complete |
| DATA-08 | Phase 1 | Complete |
| DATA-09 | Phase 1 | Complete |
| TMPL-01 | Phase 2 | Pending |
| TMPL-02 | Phase 2 | Pending |
| TMPL-03 | Phase 2 | Pending |
| TMPL-04 | Phase 2 | Pending |
| TMPL-05 | Phase 2 | Pending |
| TMPL-06 | Phase 2 | Pending |
| TMPL-07 | Phase 2 | Pending |
| LOG-01 | Phase 2 | Pending |
| LOG-02 | Phase 2 | Pending |
| LOG-03 | Phase 2 | Pending |
| LOG-04 | Phase 2 | Pending |
| LOG-05 | Phase 2 | Pending |
| LOG-06 | Phase 2 | Pending |
| LOG-07 | Phase 2 | Pending |
| LOG-08 | Phase 2 | Pending |
| LOG-09 | Phase 2 | Pending |
| HIST-01 | Phase 3 | Pending |
| HIST-02 | Phase 3 | Pending |
| HIST-03 | Phase 3 | Pending |
| HIST-04 | Phase 3 | Pending |
| HIST-05 | Phase 3 | Pending |
| DATA-05 | Phase 3 | Pending |
| DATA-06 | Phase 3 | Pending |
| DATA-10 | Phase 3 | Pending |
| DATA-11 | Phase 3 | Pending |
| DURA-01 | Phase 4 | Complete |
| DURA-02 | Phase 4 | Complete |
| DURA-03 | Phase 4 | Complete |

**Coverage:**
- v1 requirements: 38 total
- Mapped to phases: 38
- Unmapped: 0

---
*Requirements defined: 2026-01-27*
*Last updated: 2026-01-28 - MILESTONE COMPLETE (all requirements satisfied)*
