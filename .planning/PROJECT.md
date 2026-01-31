# GymLog

## What This Is

A local-first PWA for tracking strength training performance across multiple gyms, built to showcase modern data engineering practices. Exercises are categorized as globally comparable (e.g., weighted pullups, barbell squats) or gym/equipment-specific (e.g., lat pulldown, chest press machine), enabling context-aware historical analysis. All data is stored and processed locally using DuckDB-WASM and Parquet, with dbt-duckdb powering the transformation layer.

## Core Value

Track workout performance with proper data engineering — both usable as a personal training tool and impressive as a senior Data Engineer portfolio piece.

## Current State

**Version:** v1.2 UX & Portfolio Polish (shipped 2026-01-31)

**Tech Stack:**
- React 18 + TypeScript + Vite
- DuckDB-WASM 1.32.0 with OPFS persistence
- dbt-duckdb for transformation layer
- Zustand for client-side state
- Tailwind CSS 4 + react-hook-form + dnd-kit
- Recharts 3.7.0 + date-fns 4.1.0 + framer-motion (LazyMotion)
- react-muscle-highlighter for anatomical diagrams
- Vitest + React Testing Library + Playwright
- Geist Sans + Geist Mono fonts
- GitHub Actions CI/CD

**Codebase:**
- ~12,537 lines of TypeScript
- ~3,255 lines of SQL/YAML (dbt)
- 287 commits, 11 phases, 68 plans across 3 milestones

**What's Working:**
- Exercise and gym management with full CRUD
- Workout templates with drag-drop reordering
- Batch set logging with grid UI and ghost text from last session
- Workout rotation with auto-advance and Quick Start
- Post-workout summary with PRs and volume comparison
- Exercise history with gym-context filtering
- PR detection during logging (weight + estimated 1RM)
- Parquet export/import for backup
- Event sourcing with immutable audit trail
- Exercise progress charts (weight, 1RM, volume over 4 weeks)
- Volume analytics per muscle group with color-coded zones
- Anatomical muscle heat map
- SQL-based plateau and regression detection
- Progression dashboard with problems-first sorting
- Session-dismissible contextual alerts during workouts
- Lazy-loaded Analytics page (Recharts out of main bundle)
- Design system with OKLCH tokens and UI primitives
- Error boundaries with graceful fallback UI
- 71+ tests (unit, integration, E2E)
- One-click demo data for portfolio reviewers
- In-app observability and data quality monitoring
- CI/CD pipeline with GitHub Pages deployment
- Portfolio README with architecture diagram and dbt lineage

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
- Batch logging (BLOG-01 to BLOG-05) — v1.2
- Workout rotation (ROTN-01 to ROTN-04) — v1.2
- Workout summary (SUMM-01 to SUMM-03) — v1.2
- Visual polish (UI-01 to UI-04) — v1.2
- Testing & quality (TEST-01 to TEST-04) — v1.2
- CI/CD (CICD-01 to CICD-03) — v1.2
- Portfolio & demo (PORT-01 to PORT-05) — v1.2

### Active

None — no active milestone. Use `/gsd:new-milestone` to start v1.3.

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

**Potential v2+ Features:**
- Custom time range selection (3 months, 6 months, 1 year, all time)
- Volume recommendations vs research-backed targets
- Chart export as image
- Multi-exercise comparison on one chart
- Personal volume targets per muscle group
- Supersets (paired exercises)
- Plate calculator for barbell loading
- Progress summary notifications

## Current Milestone

None — v1.2 shipped. Use `/gsd:new-milestone` to start v1.3.

## Constraints

- **Tech Stack**: React + TypeScript + Vite, DuckDB-WASM, Parquet, dbt-duckdb, Tailwind CSS
- **Hosting**: GitHub Pages (static only, no backend)
- **Storage**: Browser local storage only (OPFS + Parquet files)
- **Units**: kg internally (lbs display conversion available)
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
*Last updated: 2026-01-31 after v1.2 milestone complete*
