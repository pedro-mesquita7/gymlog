# Project Milestones: GymLog

## v1.1 Analytics (Shipped: 2026-01-30)

**Delivered:** Visual analytics and progression tracking — exercise progress charts, volume analytics with muscle heat map, and SQL-based plateau/regression detection with contextual workout alerts

**Phases completed:** 5-7 (15 plans total)

**Key accomplishments:**
- Exercise progress charts with weight, 1RM, volume trends over 4 weeks
- Week-over-week performance comparison per exercise
- Volume analytics with sets/week per muscle group as bar charts
- Color-coded volume zones (under-training, optimal, high volume)
- Anatomical muscle heat map showing training frequency
- SQL-based progression detection (plateau + regression) with dual-criteria logic
- Progression dashboard with problems-first sorting and summary counts
- Session-dismissible contextual alerts during workout logging
- All analytics logic in SQL for 10-100x performance over JavaScript
- Lazy-loaded Analytics page keeps Recharts out of main bundle

**Stats:**
- 67 files created/modified
- 7,540 lines of TypeScript
- 3 phases, 15 plans
- 2 days from start to ship

**Git range:** `feat(05-01)` → `903f480` (phase 7 context)

**What's next:** v1.2 with extended analytics (custom time ranges, export charts, multi-exercise comparison)

---

## v1.0 MVP (Shipped: 2026-01-28)

**Delivered:** Local-first PWA for workout tracking with full data engineering showcase — DuckDB-WASM, event sourcing, dbt models, and Parquet storage

**Phases completed:** 1-4 (27 plans total)

**Key accomplishments:**
- Exercise and gym management with CRUD operations and event sourcing
- Workout templates with drag-drop reordering, rep ranges, and exercise replacements
- Active workout logging with set tracking, rest timer, and exercise substitution
- Exercise history with gym-context filtering (global vs gym-specific)
- Automatic PR detection during logging with 1RM calculations (Epley formula)
- Data durability via Parquet export/import with backup reminders

**Stats:**
- 160 files created/modified
- 5,325 lines of TypeScript
- 4 phases, 27 plans
- 2 days from start to ship

**Git range:** `99ad021` (init) → `ceb27d8` (audit)

**What's next:** v1.1 with progress charts, volume trends, and progression detection

---
