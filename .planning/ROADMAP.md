# Roadmap: GymLog

## Overview

Build a local-first PWA for strength training tracking with proper data engineering. Start by establishing the foundation (data layer, core entities), enable workout creation and logging, add analytics and history tracking, then ensure data durability with export/backup capabilities. Every phase delivers verifiable user value while showcasing modern data engineering practices.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation & Data Layer** - Core entities and data engineering infrastructure
- [ ] **Phase 2: Templates & Logging** - Workout templates and active logging workflow
- [ ] **Phase 3: History & Analytics** - Exercise history, PRs, 1RM calculations, and analytics
- [ ] **Phase 4: Data Durability** - Export/import and backup reminders

## Phase Details

### Phase 1: Foundation & Data Layer
**Goal**: Users can manage exercises and gyms with all data properly stored in event-sourced Parquet files

**Depends on**: Nothing (first phase)

**Requirements**: EXER-01, EXER-02, EXER-03, EXER-04, GYM-01, GYM-02, GYM-03, GYM-04, DATA-01, DATA-02, DATA-03, DATA-04, DATA-07, DATA-08, DATA-09

**Success Criteria** (what must be TRUE):
  1. User can create, edit, delete, and view exercises with name, muscle group, and global/gym-specific flag
  2. User can create, edit, delete, and view gyms with name and optional location
  3. All data is stored in DuckDB-WASM using Parquet files in OPFS
  4. All changes are captured as immutable events with audit columns (_created_at, _event_id)
  5. dbt models transform raw events to staging to marts (star schema: fact_sets, dim_exercise, dim_gym, dim_workout_template)

**Plans**: TBD

Plans:
- [ ] TBD during /gsd:plan-phase 1

---

### Phase 2: Templates & Logging
**Goal**: Users can create workout templates and log workouts with full exercise substitution support

**Depends on**: Phase 1

**Requirements**: TMPL-01, TMPL-02, TMPL-03, TMPL-04, TMPL-05, TMPL-06, TMPL-07, LOG-01, LOG-02, LOG-03, LOG-04, LOG-05, LOG-06, LOG-07, LOG-08, LOG-09

**Success Criteria** (what must be TRUE):
  1. User can create workout templates with ordered exercises, target rep ranges, and optional replacements
  2. User can edit templates (add/remove/reorder exercises) and delete templates
  3. User can start workout by selecting gym and template, seeing exercises in order with target rep ranges
  4. User can log each set with weight (kg) and reps, optionally adding RIR
  5. User can switch from default exercise to predefined replacement or add custom one-off exercise
  6. User can use rest timer between sets with configurable duration
  7. User can complete workout (saving all data) or cancel workout in progress with confirmation

**Plans**: TBD

Plans:
- [ ] TBD during /gsd:plan-phase 2

---

### Phase 3: History & Analytics
**Goal**: Users can view exercise history, track PRs, see estimated 1RM, and benefit from data quality validation

**Depends on**: Phase 2

**Requirements**: HIST-01, HIST-02, HIST-03, HIST-04, HIST-05, DATA-05, DATA-06, DATA-10, DATA-11

**Success Criteria** (what must be TRUE):
  1. User can view exercise history showing last 2 weeks of sets, respecting global vs gym-specific rule
  2. User sees automatic PR detection when new PR is set during logging
  3. User can view estimated 1RM for exercises (Epley formula) and list of all PRs per exercise
  4. dbt tests validate data quality (unique, not_null, relationships, no negative weights, reasonable rep ranges)
  5. dbt documentation generates data dictionary and lineage graphs
  6. Metrics layer defines 1RM, volume, and PR calculations as single source of truth
  7. Anomaly detection flags unusual values (e.g., weight jumped 50%+ from last session)

**Plans**: TBD

Plans:
- [ ] TBD during /gsd:plan-phase 3

---

### Phase 4: Data Durability
**Goal**: Users can export/import their workout data and receive backup reminders

**Depends on**: Phase 3

**Requirements**: DURA-01, DURA-02, DURA-03

**Success Criteria** (what must be TRUE):
  1. User can export all data as Parquet file download
  2. User can import data from Parquet backup file
  3. App shows backup reminder after N workouts since last export

**Plans**: TBD

Plans:
- [ ] TBD during /gsd:plan-phase 4

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Data Layer | 0/TBD | Not started | - |
| 2. Templates & Logging | 0/TBD | Not started | - |
| 3. History & Analytics | 0/TBD | Not started | - |
| 4. Data Durability | 0/TBD | Not started | - |

---
*Created: 2026-01-27*
*Last updated: 2026-01-27*
