# Research Summary: Local-First Strength Training PWA

**Project Date:** 2026-01-27
**Status:** Research Complete
**Confidence:** MEDIUM-HIGH

---

## Executive Summary

This is a **local-first PWA for strength training tracking** using DuckDB-WASM + Parquet + dbt. The architecture avoids cloud backend entirely: all data stored locally in browser (OPFS), all analytics computed in-browser, all state derived from append-only event logs. The app works offline, syncs when connection returns, and handles 5K-50K workout records in <1MB RAM. Build-time dbt compilation handles domain logic (fact tables, rollups), reducing runtime computation and enabling offline-first design.

**Key decision:** Event sourcing + star schema (fact_workouts + dimensions) materialized by dbt at build time, not runtime. DuckDB-WASM is read-only query engine in browser, not a data store.

---

## Key Stack Decisions (Confirmed)

| Library | Version | Why |
|---------|---------|-----|
| **DuckDB-WASM** | 1.4.4+ | Native Parquet parsing, SQL analytics, multi-worker threaded queries |
| **@duckdb/react-duckdb** | 1.33.1+ | Official React integration; `useDuckDb` + `useDuckDbQuery` hooks |
| **vite-plugin-pwa** | 0.17.4+ | Auto-generates service worker + manifest; `registerType: 'autoUpdate'` for SW lifecycle |
| **OPFS (Origin Private File System)** | native | Persistent browser storage for cached Parquet; near-native query speed |
| **dbt-duckdb** | latest | Build-time compilation; outputs Parquet files bundled in app |

**Critical gotchas:** DuckDB-WASM is single-threaded by default (use Web Workers). OPFS max 4GB/tab. Parquet append-only is anti-pattern; use separate files per session.

---

## Table Stakes Features (Must Have)

1. **Set/Rep/Weight Logging** — Core domain; users expect RPE/RIR effort tracking
2. **Exercise Library** — Pre-built catalog (~100-200 exercises); custom override allowed
3. **Workout Templates** — Save and reuse sessions; friction-critical
4. **Progress Tracking** — Compare lifts across sessions; enables progressive overload
5. **Rest Timer** — Between-set timer; visible during workouts
6. **Performance Charts** — Volume, 1RM estimates, strength curves over time
7. **Offline Functionality** — Log workouts without internet; sync on reconnect
8. **Workout History** — Browse past sessions with searchable records

**Differentiators:** Multi-gym support with exercise substitutions, RPE/RIR analytics, no mandatory calorie tracking.

**Defer to v2+:** AI programming, coach integration, community features, smartwatch apps.

---

## Architecture: Event Sourcing + Star Schema + dbt Compilation

**Data Flow:**
```
User Action → Event (append to Parquet log)
  → Projection rebuild (dbt models in DuckDB)
  → Star schema materialized (fact_workouts + dim_* tables)
  → React queries in-memory DuckDB
  → UI renders from cached projections
```

**Star Schema Design:**
- `fact_workouts`: One row per exercise per workout (workout_id, user_id, exercise_id, reps, sets, intensity)
- `dim_date`: Pre-computed calendar (year, month, day_of_week, is_weekend)
- `dim_exercise`: Exercise catalog (exercise_id, name, muscle_group_id)
- `dim_user`: User metadata (user_id, name, created_at)

**Build-time dbt compilation** (not runtime):
- dbt models compile to Parquet files (fact_workouts.parquet, dim_*.parquet)
- Bundled in app as static assets
- Browser loads Parquet → DuckDB-WASM memory → instant queries
- **No dbt execution at runtime.** Changes to domain logic require app rebuild.

---

## Top 5 Pitfalls to Watch

| Pitfall | Impact | Prevention |
|---------|--------|-----------|
| **Storage quota exceeded silently** | CRITICAL | Call `navigator.storage.estimate()` before writes; catch `QuotaExceededError` in IndexedDB |
| **DuckDB OOM on large joins** | CRITICAL | Cap dataset <1-2GB; avoid multi-table joins on full data; profile queries before shipping |
| **Memory leaks after queries** | CRITICAL | Call `db.close()` after each query; monitor DevTools Task Manager for memory release |
| **Service worker cache staleness** | MODERATE | Implement cache versioning (cache-v1, v2, etc.); show "last synced" timestamp to user |
| **Parquet file corruption on partial download** | MODERATE | Validate file hash after download (SHA256 in metadata); re-download on validation failure |

**Pre-launch checklist:** Storage quota estimation, IndexedDB error handling, DuckDB memory cleanup verified, Parquet integrity validation, offline mode tested, data export/import provided.

---

## Roadmap Implications

**Suggested Phase 1:** Core logging + templates + offline
- Set/Rep/Weight logging, exercise library, workout templates, rest timer
- OPFS persistence, service worker offline cache, basic sync

**Suggested Phase 2:** Analytics + multi-device
- Progress charts, performance analytics, multi-device data sync, conflict resolution

**Suggested Phase 3:** Differentiators
- Multi-gym exercise profiles, RPE/RIR analytics, substitutions

**Research flags:** None—all domains well-documented. dbt-duckdb is proven; OPFS patterns confirmed.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| **Stack** | HIGH | Official DuckDB-WASM docs + dbt-duckdb adapter; versions pinned |
| **Features** | MEDIUM-HIGH | Derived from multiple fitness app reviews; MVP clear |
| **Architecture** | MEDIUM | Event sourcing proven; star schema reasonable for fitness domain; Parquet append-only pattern needs test |
| **Pitfalls** | HIGH | DuckDB docs + MDN storage limits well-documented; pre-launch checklist comprehensive |

**Remaining gaps:** Actual performance testing with real datasets (5K-50K workouts); dbt model examples need refinement for this domain.

---

## Sources

- DuckDB-WASM GitHub, official docs, React hooks
- vite-plugin-pwa guide
- dbt-duckdb GitHub + integration patterns
- MDN Storage API quotas and eviction
- Fitness app research (Hevy, JEFIT, BarBend reviews)
- Event sourcing patterns (Microservices.io)
