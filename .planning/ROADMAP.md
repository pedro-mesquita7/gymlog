# Roadmap: GymLog

## Overview

Build a local-first PWA for strength training tracking with proper data engineering. Start by establishing the foundation (data layer, core entities), enable workout creation and logging, add analytics and history tracking, then ensure data durability with export/backup capabilities. Every phase delivers verifiable user value while showcasing modern data engineering practices.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation & Data Layer** - Core entities and data engineering infrastructure
- [x] **Phase 2: Templates & Logging** - Workout templates and active logging workflow
- [x] **Phase 3: History & Analytics** - Exercise history, PRs, 1RM calculations, and analytics
- [x] **Phase 4: Data Durability** - Export/import and backup reminders

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
  5. dbt models transform raw events to staging to marts (star schema: dim_exercise, dim_gym; fact_sets and dim_workout_template deferred to Phase 2 when workout logging is built)

**Plans**: 8 plans in 6 waves

Plans:
- [x] 01-01-PLAN.md — Project setup with Vite, React, TypeScript, dependencies
- [x] 01-02-PLAN.md — DuckDB initialization and event sourcing infrastructure
- [x] 01-03-PLAN.md — dbt models (staging, intermediate, marts)
- [x] 01-04-PLAN.md — Exercise management (CRUD + filtering)
- [x] 01-05-PLAN.md — Gym management (CRUD + exercise association)
- [x] 01-06-PLAN.md — Human verification of Phase 1
- [x] 01-07-PLAN.md — Gap closure: Enable OPFS persistence (upgrade DuckDB-WASM to stable)
- [x] 01-08-PLAN.md — Gap closure: UI polish (exercise count on gyms, event count in header)

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

**Plans**: 9 plans in 7 waves

Plans:
- [x] 02-01-PLAN.md — Install dependencies and create types/events for templates and workouts
- [x] 02-02-PLAN.md — useTemplates hook with CRUD operations and getTemplates query
- [x] 02-03-PLAN.md — TemplateBuilder form with drag-drop exercise reordering
- [x] 02-04-PLAN.md — Template List UI with navigation tabs
- [x] 02-05-PLAN.md — Zustand workout store with persist and StartWorkout component
- [x] 02-06-PLAN.md — Active workout UI (ExerciseView, SetLogger, NumberStepper)
- [x] 02-07-PLAN.md — Rest timer and exercise substitution
- [x] 02-08-PLAN.md — Workout completion and cancellation with event persistence
- [x] 02-09-PLAN.md — Human verification of Phase 2

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

**Plans**: 7 plans in 6 waves

Plans:
- [x] 03-01-PLAN.md — dbt staging models and analytics macros
- [x] 03-02-PLAN.md — dbt intermediate models (1RM, PR detection, anomaly flags)
- [x] 03-03-PLAN.md — dbt mart models, tests, and documentation
- [x] 03-04-PLAN.md — Compiled SQL queries for runtime execution
- [x] 03-05-PLAN.md — useHistory hook and ExerciseHistory component
- [x] 03-06-PLAN.md — PR detection, PR list, and 1RM display components
- [x] 03-07-PLAN.md — Human verification of Phase 3

---

### Phase 4: Data Durability
**Goal**: Users can export/import their workout data and receive backup reminders

**Depends on**: Phase 3

**Requirements**: DURA-01, DURA-02, DURA-03

**Success Criteria** (what must be TRUE):
  1. User can export all data as Parquet file download
  2. User can import data from Parquet backup file
  3. App shows backup reminder after N workouts since last export

**Plans**: 3 plans in 2 waves

Plans:
- [x] 04-01-PLAN.md — Backup store and export hook with workout counter
- [x] 04-02-PLAN.md — Import hook with schema validation
- [x] 04-03-PLAN.md — Backup UI (reminder banner, settings tab, App integration)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Data Layer | 8/8 | Complete | 2026-01-28 |
| 2. Templates & Logging | 9/9 | Complete | 2026-01-28 |
| 3. History & Analytics | 7/7 | Complete | 2026-01-28 |
| 4. Data Durability | 3/3 | Complete | 2026-01-28 |

---
*Created: 2026-01-27*
*Last updated: 2026-01-28 (Phase 4 complete - MILESTONE COMPLETE)*
