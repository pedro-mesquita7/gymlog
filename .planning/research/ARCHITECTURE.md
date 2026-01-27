# Architecture Research: Local-First PWA with Data Engineering Focus

**Project:** Local-first PWA with workout tracking (DuckDB-WASM + Parquet + dbt)
**Researched:** 2026-01-27
**Confidence:** MEDIUM

## Executive Summary

This architecture combines three layers: (1) **event capture** in browser via append-only Parquet files, (2) **real-time materialization** using DuckDB-WASM projections for star schema views, and (3) **build-time transformations** via dbt-duckdb that compile domain logic into efficient query patterns. The design avoids server roundtrips by keeping all data and computation local, with dbt serving as build-time transformation compiler rather than runtime executor.

---

## Event Flow: Raw Events → Derived Views

### Pattern: Append-Only Events with In-Memory Projections

```
┌─────────────────────────────────────────────────────────────┐
│  Browser (Service Worker + IndexedDB/OPFS)                  │
│                                                              │
│  [User Action] → [Event Created]                            │
│                      ↓                                       │
│              [Append to event log]                           │
│              (Parquet files in OPFS)                         │
│                      ↓                                       │
│           [Trigger projection rebuild]                       │
│                      ↓                                       │
│        [DuckDB-WASM materializes views]                      │
│        (Star schema fact_sets + dimensions)                  │
│                      ↓                                       │
│  [App queries materialized views in memory]                  │
│  [UI renders from cached projections]                        │
└─────────────────────────────────────────────────────────────┘
```

### Implementation Details

**Raw Event Storage:**
- Events stored as append-only Parquet files in browser's Origin Private File System (OPFS) or IndexedDB
- Each event is immutable with timestamp, type, and payload
- Example: `{ event_id, timestamp, type: 'workout_completed', user_id, duration, muscle_groups }`

**Projection Architecture:**
- DuckDB-WASM loads all events from Parquet on app start (in-memory)
- Projections materialize fact tables and dimensions from raw events
- Example projection query:
  ```sql
  CREATE TABLE fact_workouts AS
  SELECT
    event_id,
    timestamp,
    user_id,
    duration,
    CURRENT_DATE as workout_date,
    COUNT(*) OVER (PARTITION BY user_id, CURRENT_DATE) as workouts_today
  FROM events
  WHERE type = 'workout_completed'
  ```

**Event Sourcing Semantics:**
- All state is derived from events (no direct state mutations)
- On user action → append event → rebuild affected projections
- Projections live in DuckDB memory (not persisted to storage)
- Offline: events accumulate in local Parquet; on reconnect, sync upstream then rebuild

### Key Constraint

Parquet is not suitable for true appends (metadata is at EOF). Instead, use pattern of **separate Parquet files per session/batch** that DuckDB treats as one logical append-only log on read:
```sql
SELECT * FROM read_parquet('events/*.parquet') WHERE timestamp >= @since
```

---

## Star Schema: Fact Sets & Dimensions

### Recommended for Workout Tracking

```
                    [dim_user]
                   (user_id PK)
                   - name
                   - created_at
                        ↓
    [dim_muscle_group]
    (muscle_id PK)
    - group_name
         ↓
[fact_workouts] ← [dim_exercise]
(workout_id PK)    (exercise_id PK)
- user_id FK       - exercise_name
- workout_date FK  - muscle_id FK
- duration
- intensity
- reps
- sets
         ↓
    [dim_date]
    (date PK)
    - year, month, week, day_of_week
    - is_holiday, is_weekday
```

### Table Definitions

**Fact Table: `fact_workouts`**
- Primary grain: one row per exercise performed in a workout
- Immutable (created once from event, never updated)
- Columns:
  - `workout_id` (PK, derived from event_id)
  - `user_id` (FK to dim_user)
  - `workout_date` (FK to dim_date)
  - `exercise_id` (FK to dim_exercise)
  - `duration_minutes` (numeric measure)
  - `reps` (numeric measure)
  - `sets` (numeric measure)
  - `intensity_level` (1-10, numeric measure)
  - `created_timestamp` (when event was captured)

**Dimension: `dim_user`**
- Slowly Changing Dimension Type 1 (overwrites)
- One row per unique user
- Columns: `user_id`, `name`, `created_at`, `updated_at`

**Dimension: `dim_date`**
- Pre-computed date dimension (standard practice)
- One row per day (could extend 50 years = ~18K rows)
- Columns: `date`, `year`, `month`, `day`, `day_of_week`, `is_weekend`, `quarter`

**Dimension: `dim_exercise`**
- Type 1 (static reference data)
- Columns: `exercise_id`, `exercise_name`, `muscle_group_id`, `intensity_class`

### Materialized Views (from dbt)

```sql
-- Materialized in dbt at build time, stored as Parquet
CREATE VIEW workouts_by_muscle_group AS
SELECT
  f.workout_date,
  e.muscle_group,
  COUNT(*) as workout_count,
  SUM(f.duration_minutes) as total_duration,
  AVG(f.intensity_level) as avg_intensity
FROM fact_workouts f
JOIN dim_exercise e ON f.exercise_id = e.exercise_id
GROUP BY f.workout_date, e.muscle_group;

-- At runtime in browser, DuckDB materializes this as a table
-- for instant UI queries
```

### Why Star Schema Here

- **Simple JOINs:** UI queries are straightforward (1-2 table joins)
- **Fast aggregations:** Pre-aggregated dimensions enable quick rollups
- **Offline friendly:** No complex normalization required for browser queries
- **dbt-native:** dbt models naturally express fact/dim separation

---

## dbt Integration: Build-Time Compilation

### Architecture: Compile, Don't Execute at Runtime

```
┌──────────────────────────────────────────────────────┐
│  dbt-duckdb (Development/Build Time)                │
│                                                      │
│  [dbt models/SQL] → [DuckDB processes]              │
│                          ↓                           │
│               [Compiled Parquet files]               │
│               - fact_workouts.parquet                │
│               - dim_user.parquet                     │
│               - dim_date.parquet                     │
│               - rollup_by_muscle.parquet             │
│                          ↓                           │
│          [Bundle into app build output]              │
│          (static asset, versioned)                   │
└──────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────┐
│  Browser (Runtime)                                   │
│                                                      │
│  [Load Parquet files from bundle]                    │
│      → [Import into DuckDB-WASM memory]              │
│      → [App queries run against in-memory tables]    │
│      → [No re-computation needed]                    │
└──────────────────────────────────────────────────────┘
```

### dbt Project Structure

**`dbt_project.yml`**
```yaml
name: 'workout_analytics'
version: '1.0.0'
config-version: 2

profile: 'duckdb_local'
model-paths: ['models']
macro-paths: ['macros']
target-path: 'target'
clean-targets:
  - 'target'
  - 'dbt_packages'

models:
  workout_analytics:
    dimensions:
      materialized: table
      external:
        location: 'build/data/dimensions'
    facts:
      materialized: table
      external:
        location: 'build/data/facts'
    rollups:
      materialized: table
      external:
        location: 'build/data/rollups'
```

**`profiles.yml` (local development)**
```yaml
workout_analytics:
  outputs:
    dev:
      type: duckdb
      database: ':memory:'
      extensions:
        - json
        - httpfs
    prod_build:
      type: duckdb
      database: 'workout.db'
      external_root: 'build/data'
  target: dev
```

### Model Examples

**`models/dimensions/dim_date.sql`**
```sql
-- Dimension: All dates in workout history
WITH date_spine AS (
  SELECT
    CAST(d AS DATE) as date_day,
    EXTRACT(YEAR FROM d) as year,
    EXTRACT(MONTH FROM d) as month,
    EXTRACT(DAY FROM d) as day,
    EXTRACT(DAYOFWEEK FROM d) as day_of_week,
    EXTRACT(QUARTER FROM d) as quarter,
    (EXTRACT(DAYOFWEEK FROM d) IN (0, 6)) as is_weekend
  FROM (SELECT GENERATE_SUBSCRIPTS(RANGE(CURRENT_DATE - 10000, CURRENT_DATE), 1) FROM range(1)) AS t(d)
)
SELECT * FROM date_spine
```

**`models/facts/fact_workouts.sql`**
```sql
-- Fact: Workouts from event stream
WITH raw_events AS (
  SELECT
    event_id,
    event_timestamp,
    user_id,
    event_payload
  FROM {{ source('raw', 'workout_events') }}
  WHERE event_type = 'workout_completed'
),
parsed_events AS (
  SELECT
    event_id as workout_id,
    user_id,
    CAST(event_payload->>'timestamp' AS TIMESTAMP) as workout_timestamp,
    CAST(event_payload->>'duration_minutes' AS INTEGER) as duration_minutes,
    CAST(event_payload->>'exercise_id' AS INTEGER) as exercise_id,
    CAST(event_payload->>'reps' AS INTEGER) as reps,
    CAST(event_payload->>'intensity' AS INTEGER) as intensity_level,
    CAST(event_timestamp::DATE AS DATE) as workout_date
  FROM raw_events
)
SELECT * FROM parsed_events
```

**`models/rollups/workouts_by_muscle_group.sql`**
```sql
-- Aggregated metric: Daily workouts per muscle group
SELECT
  f.workout_date,
  e.muscle_group,
  COUNT(DISTINCT f.workout_id) as workout_count,
  SUM(f.duration_minutes) as total_duration_minutes,
  AVG(f.intensity_level) as avg_intensity,
  COUNT(*) as exercise_count
FROM {{ ref('fact_workouts') }} f
JOIN {{ ref('dim_exercise') }} e ON f.exercise_id = e.exercise_id
GROUP BY f.workout_date, e.muscle_group
```

### Build Process (CI/CD)

```bash
# 1. Compile dbt models (generates fact/dim tables)
dbt run --project-dir . --profiles-dir . --target prod_build

# 2. Export materialized views to Parquet
# (dbt-duckdb external materialization)
dbt run --vars 'export_format: parquet'

# 3. Output files appear in build/data/
#    - facts/fact_workouts.parquet
#    - dimensions/dim_user.parquet
#    - rollups/workouts_by_muscle_group.parquet

# 4. Bundle into web app static assets
npm run build  # copies build/data to dist/data/
```

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Build-time only** | Parquet files compiled once; no runtime dbt execution in browser |
| **Parquet export** | dbt-duckdb `external` materialization writes to Parquet for efficient storage in app bundle |
| **External dimensions** | `dim_date`, `dim_user` pre-computed and cached; no dynamic generation |
| **Incremental patterns NOT used** | Browser restart reloads all data from Parquet; no need for `dbt run --state` |
| **SQL transformations** | dbt handles ETL logic; browser DuckDB is read-only query engine |

---

## Data Flow: Event to Query

### Example: "Show me workouts by muscle group this week"

```
1. User opens app
   └─→ Service Worker loads app bundle
       └─→ Script imports Parquet files from dist/data/
           └─→ DuckDB-WASM reads fact_workouts.parquet into memory
               └─→ Also loads dim_exercise.parquet, dim_date.parquet

2. User clicks "This Week" filter
   └─→ JavaScript queries in-memory DuckDB:
       SELECT
         e.muscle_group,
         COUNT(*) as count,
         SUM(f.duration_minutes) as total_duration
       FROM fact_workouts f
       JOIN dim_exercise e ON f.exercise_id = e.exercise_id
       WHERE f.workout_date >= CURRENT_DATE - INTERVAL 7 DAY
       GROUP BY e.muscle_group

3. Results returned in milliseconds (no network)
   └─→ React state updates
       └─→ UI renders chart

4. User adds new workout (offline)
   └─→ Event appended to local Parquet in OPFS
       └─→ Projection rebuilds (re-runs dbt model logic in DuckDB)
           └─→ UI updates reflect new data
               └─→ On reconnect, new event syncs upstream
```

### Memory Footprint Estimation

For typical user:
- 500 workouts/year = 5K rows in fact_workouts
- 100 unique exercises = 100 rows in dim_exercise
- 10K+ dates in dim_date = ~200KB Parquet compressed
- **Total: ~500KB - 1MB** in-memory (well under browser limits)

---

## Integration with Project Structure

**How dbt models relate to event sourcing:**

- **Raw events** = source data in `sources.yml` (points to Parquet event log)
- **dbt models** = projections that compile event-to-fact mapping
- **External materializations** = Parquet files bundled in app
- **Runtime queries** = DuckDB-WASM reads compiled Parquet files
- **Offline events** = append to local Parquet; sync when online

**Why this avoids double-encoding:**
- dbt defines domain logic once (SQL models)
- Browser doesn't re-implement; just loads compiled output
- Changes to domain logic → recompile dbt → new app bundle
- No logic drift between backend and frontend

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Event flow pattern | MEDIUM | Event sourcing + projections are standard; browser-specific implementation details vary |
| Star schema design | MEDIUM | Workout tracking star schema is reasonable; may need refinement based on actual query patterns |
| dbt-duckdb integration | HIGH | Official dbt-duckdb adapter exists, supports external materialization to Parquet |
| Parquet limitations | MEDIUM | Sources confirm append-only is anti-pattern; separate files pattern is recommended but needs testing |
| Browser memory constraints | MEDIUM | DuckDB-WASM documented as supporting 4GB+ virtual memory; real-world performance untested at scale |

---

## Sources

- [DuckDB WASM Overview](https://duckdb.org/docs/stable/clients/wasm/overview) - Official documentation on browser constraints
- [dbt-duckdb GitHub](https://github.com/duckdb/dbt-duckdb) - Integration between dbt and DuckDB
- [Fully Local Data Transformation with dbt and DuckDB](https://duckdb.org/2025/04/04/dbt-duckdb) - Build-time transformation patterns
- [Event Sourcing Pattern - Microservices.io](https://microservices.io/patterns/data/event-sourcing.html) - Event sourcing fundamentals
- [DuckDB + Parquet: The Perfect Match for Modern Data Workflows](https://medium.com/@kaushalsinh73/duckdb-parquet-the-perfect-match-for-modern-data-workflows-094158b973db) - Integration patterns (Medium, Jan 2026)
- [DuckDB Local Caches on Parquet Footers](https://medium.com/@hjparmar1944/duckdb-local-caches-on-parquet-footers-millisecond-warm-starts-for-bi-f62a302554e4) - Parquet optimization strategies (Medium, Jan 2026)
- [Event Sourcing Looked Perfect in the Book. Production Was a Nightmare.](https://medium.com/lets-code-future/event-sourcing-looked-perfect-in-the-book-production-was-a-nightmare-04c15eb5cea8) - Practical pitfalls (Medium, Jan 2026)
- [Offline-first without a backend: a local-first PWA architecture](https://dev.to/crisiscoresystems/offline-first-without-a-backend-a-local-first-pwa-architecture-you-can-trust-3j15) - PWA offline patterns
