# GymLog

## What This Is

A local-first PWA for tracking strength training performance across multiple gyms, built to showcase modern data engineering practices. Exercises are categorized as globally comparable (e.g., weighted pullups, barbell squats) or gym/equipment-specific (e.g., lat pulldown, chest press machine), enabling context-aware historical analysis. All data is stored and processed locally using DuckDB-WASM and Parquet, with dbt-duckdb powering the transformation layer.

## Core Value

Track workout performance with proper data engineering — both usable as a personal training tool and impressive as a senior Data Engineer portfolio piece.

## Current State

**Version:** v1.1 Analytics (shipped 2026-01-30)

**Tech Stack:**
- React 18 + TypeScript + Vite
- DuckDB-WASM 1.32.0 with OPFS persistence
- dbt-duckdb for transformation layer
- Zustand for client-side state
- Tailwind CSS + react-hook-form + dnd-kit
- Recharts 3.7.0 + date-fns 4.1.0
- react-muscle-highlighter for anatomical diagrams

**Codebase:**
- ~12,865 lines of TypeScript
- ~227 files
- 7 phases, 42 plans executed across 2 milestones

**What's Working:**
- Exercise and gym management with full CRUD
- Workout templates with drag-drop reordering
- Active workout logging with rest timer
- Exercise history with gym-context filtering
- PR detection during logging
- 1RM calculations (Epley formula)
- Parquet export/import for backup
- Event sourcing with immutable audit trail
- Exercise progress charts (weight, 1RM, volume over 4 weeks)
- Week-over-week performance comparison
- Volume analytics per muscle group with color-coded zones
- Anatomical muscle heat map
- SQL-based plateau and regression detection
- Progression dashboard with problems-first sorting
- Session-dismissible contextual alerts during workouts
- Lazy-loaded Analytics page (Recharts out of main bundle)

## Requirements

### Validated

- Exercise management (EXER-01 to EXER-04) — v1.0
- Gym management (GYM-01 to GYM-04) — v1.0
- Workout templates (TMPL-01 to TMPL-07) — v1.0
- Workout logging (LOG-01 to LOG-09) — v1.0
- History & analytics (HIST-01 to HIST-05) — v1.0
- Data engineering showcase (DATA-01 to DATA-11) — v1.0
- Data durability (DURA-01 to DURA-03) — v1.0
- Progress charts (CHART-01 to CHART-04) — v1.1
- Volume analytics (VOL-01 to VOL-03) — v1.1
- PR list (PR-01) — v1.1
- Progression intelligence (PROG-01 to PROG-03) — v1.1
- Analytics infrastructure (INFRA-01 to INFRA-03) — v1.1

### Out of Scope

- SCD Type 2 for exercise changes — complexity not justified until definitions actually change frequently
- Cloud sync/backup (S3, etc.) — keeping it local-first
- Multi-user support — personal use only
- Mobile native app — PWA covers mobile use case

## Context

**User profile:** Data Engineer building this for personal use and GitHub portfolio. Goes to multiple gyms and wants history to be context-aware (gym-specific equipment shouldn't show cross-gym data).

**Known Issues:**
- Backup reminders only work in persistent mode (by design)
- dbt vw_progression_status.sql references fw.logged_at but fact_workouts uses started_at (non-blocking — compiled queries bypass dbt at runtime)

**Potential v1.2 Features:**
- Custom time range selection (3 months, 6 months, 1 year, all time)
- Volume recommendations vs research-backed targets
- Chart export as image
- Multi-exercise comparison on one chart
- Personal volume targets per muscle group

**Potential v2+ Features:**
- Supersets (paired exercises)
- Plate calculator for barbell loading
- Progress summary notifications

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
| Recharts for charting | Most popular React charting lib, ~96KB gzipped | Good |
| Hook-based analytics | Matches existing useHistory pattern, no Zustand for read-only data | Good |
| SQL-based analytics | 10-100x performance over JavaScript, CTE composition pattern | Good |
| Lazy-loaded Analytics page | Keeps Recharts (~110KB) out of main bundle | Good |
| Session-dismissible alerts | 2-hour boundary via Zustand persist, returns if condition persists | Good |
| Dual-criteria plateau detection | No PR 4+ weeks AND flat weight < 5%, prevents false positives during deload | Good |

---
*Last updated: 2026-01-30 after v1.1 milestone completion*
