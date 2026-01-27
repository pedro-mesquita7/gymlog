# GymLog

## What This Is

A local-first PWA for tracking strength training performance across multiple gyms, built to showcase modern data engineering practices. Exercises are categorized as globally comparable (e.g., weighted pullups, barbell squats) or gym/equipment-specific (e.g., lat pulldown, chest press machine), enabling context-aware historical analysis. All data is stored and processed locally using DuckDB-WASM and Parquet, with dbt-duckdb powering the transformation layer.

## Core Value

Track workout performance with proper data engineering — both usable as a personal training tool and impressive as a senior Data Engineer portfolio piece.

## Requirements

### Validated

(None yet — ship to validate)

### Active

**Core App**
- [ ] Manage exercises (name, primary muscle group, global vs gym-specific flag)
- [ ] Manage gyms (name, optional location)
- [ ] Create workout templates with ordered exercises, target rep ranges, and optional replacements
- [ ] Log workouts: select gym → go through exercises → log each set (weight kg × reps), optional RIR
- [ ] Fallback chain during logging: default exercise → predefined replacement → custom one-off
- [ ] View exercise history (last 2 weeks, respects global vs gym-specific rule)
- [ ] Manual Parquet export/import for backup
- [ ] Backup reminder after N workouts

**Data Engineering Showcase**
- [ ] Star schema: fact_sets, dim_exercise, dim_gym, dim_workout_template
- [ ] DuckDB-WASM + Parquet as storage engine
- [ ] dbt-duckdb transformation layer (raw → staging → marts)
- [ ] Event sourcing: immutable raw events → derived analytics views
- [ ] PR tracking with automatic detection
- [ ] Estimated 1RM calculations (Epley formula)
- [ ] Data quality validation (no negative weights, reasonable rep ranges)
- [ ] dbt tests: unique, not_null, relationships, custom business rules
- [ ] dbt documentation: data dictionary with descriptions, lineage graphs
- [ ] Audit columns: _created_at, _event_id on raw events
- [ ] Idempotent event processing (natural keys, upsert logic)
- [ ] Parquet partitioning by month
- [ ] Metrics layer: single source of truth for 1RM, volume, PR calculations
- [ ] Data observability: flag anomalies (e.g., weight jumped 50% from last session)

### Out of Scope

- SCD Type 2 for exercise changes — complexity not justified until definitions actually change frequently
- Rolling volume trends / muscle group distribution analytics — defer to v2
- Progression detection algorithms (plateau/regression analysis) — defer to v2
- Incremental aggregations — premature optimization for personal data volume
- Cloud sync/backup (S3, etc.) — keeping it local-first for v1
- Multi-user support — personal use only
- Mobile native app — PWA covers mobile use case

## Context

**User profile:** Data Engineer building this for personal use and GitHub portfolio. Goes to multiple gyms and wants history to be context-aware (gym-specific equipment shouldn't show cross-gym data).

**Muscle groups (detailed):** Chest, Upper Back, Lats, Front Delts, Side Delts, Rear Delts, Biceps, Triceps, Forearms, Quads, Hamstrings, Glutes, Calves, Core

**Workout structure:**
- Templates like "Upper A", "Lower A", "Upper B", "Lower B"
- Each template has ordered exercises with target rep ranges
- Each exercise can have one predefined replacement
- During logging: if neither default nor replacement works, add custom one-off
- Sets logged independently (each set can have different weight × reps)

**History rules:**
- Globally comparable exercises: show history from all gyms
- Gym-specific exercises: show history only from current gym
- Display: last 2 weeks of data

## Constraints

- **Tech Stack**: React + TypeScript + Vite, DuckDB-WASM, Parquet, dbt-duckdb, Tailwind CSS
- **Hosting**: GitHub Pages (static only, no backend)
- **Storage**: Browser local storage only (IndexedDB + Parquet files)
- **Units**: kg only (no unit conversion)
- **Offline**: Must work fully offline after initial load (PWA)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| DuckDB-WASM + Parquet | Showcase modern DE stack, analytical queries in browser | — Pending |
| dbt-duckdb at build time | Get dbt docs/tests/lineage without runtime complexity | — Pending |
| Event sourcing | Immutable events enable replay, audit trail, flexible derived views | — Pending |
| Single primary muscle group per exercise | Simplifies analytics while covering 90% of use cases | — Pending |
| Manual export for backup | Avoids cloud complexity while ensuring data durability | — Pending |
| kg only | Personal preference, avoids unit conversion complexity | — Pending |

---
*Last updated: 2026-01-27 after initialization*
