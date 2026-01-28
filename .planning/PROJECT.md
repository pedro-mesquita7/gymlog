# GymLog

## What This Is

A local-first PWA for tracking strength training performance across multiple gyms, built to showcase modern data engineering practices. Exercises are categorized as globally comparable (e.g., weighted pullups, barbell squats) or gym/equipment-specific (e.g., lat pulldown, chest press machine), enabling context-aware historical analysis. All data is stored and processed locally using DuckDB-WASM and Parquet, with dbt-duckdb powering the transformation layer.

## Core Value

Track workout performance with proper data engineering — both usable as a personal training tool and impressive as a senior Data Engineer portfolio piece.

## Current State

**Version:** v1.0 MVP (shipped 2026-01-28)

**Tech Stack:**
- React 18 + TypeScript + Vite
- DuckDB-WASM 1.32.0 with OPFS persistence
- dbt-duckdb for transformation layer
- Zustand for client-side state
- Tailwind CSS + react-hook-form + dnd-kit

**Codebase:**
- 5,325 lines of TypeScript
- 160 files
- 4 phases, 27 plans executed

**What's Working:**
- Exercise and gym management with full CRUD
- Workout templates with drag-drop reordering
- Active workout logging with rest timer
- Exercise history with gym-context filtering
- PR detection during logging
- 1RM calculations (Epley formula)
- Parquet export/import for backup
- Event sourcing with immutable audit trail

## Requirements

### Validated

- Exercise management (EXER-01 to EXER-04) — v1.0
- Gym management (GYM-01 to GYM-04) — v1.0
- Workout templates (TMPL-01 to TMPL-07) — v1.0
- Workout logging (LOG-01 to LOG-09) — v1.0
- History & analytics (HIST-01 to HIST-05) — v1.0
- Data engineering showcase (DATA-01 to DATA-11) — v1.0
- Data durability (DURA-01 to DURA-03) — v1.0

### Active

(None — define in next milestone)

### Out of Scope

- SCD Type 2 for exercise changes — complexity not justified until definitions actually change frequently
- Cloud sync/backup (S3, etc.) — keeping it local-first
- Multi-user support — personal use only
- Mobile native app — PWA covers mobile use case

## Context

**User profile:** Data Engineer building this for personal use and GitHub portfolio. Goes to multiple gyms and wants history to be context-aware (gym-specific equipment shouldn't show cross-gym data).

**Known Issues:**
- PRList component built but not surfaced in UI (minor)
- Backup reminders only work in persistent mode (by design)

**Potential v2 Features:**
- Progress charts over time per exercise
- Volume trends by muscle group
- Progression detection (plateau/regression analysis)
- Supersets (paired exercises)
- Plate calculator for barbell loading

## Constraints

- **Tech Stack**: React + TypeScript + Vite, DuckDB-WASM, Parquet, dbt-duckdb, Tailwind CSS
- **Hosting**: GitHub Pages (static only, no backend)
- **Storage**: Browser local storage only (OPFS + Parquet files)
- **Units**: kg only (no unit conversion)
- **Offline**: Must work fully offline after initial load (PWA)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| DuckDB-WASM + Parquet | Showcase modern DE stack, analytical queries in browser | Good |
| dbt-duckdb at build time | Get dbt docs/tests/lineage without runtime complexity | Good |
| Event sourcing | Immutable events enable replay, audit trail, flexible derived views | Good |
| Single primary muscle group per exercise | Simplifies analytics while covering 90% of use cases | Good |
| Manual export for backup | Avoids cloud complexity while ensuring data durability | Good |
| kg only | Personal preference, avoids unit conversion complexity | Good |
| String interpolation for SQL | DuckDB-WASM doesn't support parameterized queries | Good (workaround) |
| Pin DuckDB-WASM to 1.32.0 | Dev versions have OPFS file locking bugs | Good |

---
*Last updated: 2026-01-28 after v1.0 milestone*
