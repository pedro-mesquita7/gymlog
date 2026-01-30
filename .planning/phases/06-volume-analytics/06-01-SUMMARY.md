---
phase: 06
plan: 01
subsystem: analytics
tags: [dbt, sql, analytics, volume-tracking, muscle-groups]
requires: [05-05]
provides: [volume-data-layer, muscle-group-analytics]
affects: [06-02, 06-03]
tech-stack:
  added: []
  patterns: [dbt-views, sql-aggregation, cte-composition]
key-files:
  created:
    - dbt/models/marts/analytics/vw_volume_by_muscle_group.sql
    - dbt/models/marts/analytics/vw_muscle_heat_map.sql
  modified:
    - dbt/models/marts/analytics/_analytics__models.yml
    - src/db/compiled-queries.ts
    - src/types/analytics.ts
decisions:
  - name: "Use original_exercise_id for stable volume tracking"
    rationale: "Ensures substituted exercises contribute to original exercise volume totals"
    impact: "Accurate muscle group volume across exercise variations"
  - name: "28-day lookback for volume analytics"
    rationale: "Matches existing exercise progress timeframe, provides 4 weeks of trend data"
    impact: "Consistent time window across all analytics features"
  - name: "Weekly aggregation for volume charts"
    rationale: "Industry standard (10-20 sets/week per muscle group for hypertrophy)"
    impact: "Aligns with exercise science research for meaningful volume recommendations"
metrics:
  duration: "2min"
  completed: "2026-01-30"
---

# Phase 06 Plan 01: Volume Analytics Data Layer Summary

**One-liner:** Weekly muscle group volume aggregation with dbt views, compiled SQL queries, and TypeScript types for volume tracking foundation

## What Was Built

Created the data layer for muscle group volume analytics:

1. **dbt Views:**
   - `vw_volume_by_muscle_group.sql`: Weekly sets per muscle group (last 4 weeks)
   - `vw_muscle_heat_map.sql`: 4-week aggregate for heat map visualization
   - Updated schema YAML with documentation

2. **Compiled SQL Queries:**
   - `VOLUME_BY_MUSCLE_GROUP_SQL`: CTE-based weekly aggregation
   - `MUSCLE_HEAT_MAP_SQL`: CTE-based 4-week aggregate
   - Both follow existing pattern (FACT_SETS_SQL + DIM_EXERCISE_SQL composition)

3. **TypeScript Types:**
   - `VolumeByMuscleGroup`: Weekly volume data point
   - `MuscleHeatMapData`: Aggregate muscle group totals
   - `VolumeThresholds`: Per-muscle-group threshold configuration (low/optimal)
   - `MuscleGroupThresholds`: Dictionary of per-group overrides
   - `UseVolumeAnalyticsReturn`: Hook return type for volume data
   - `UseVolumeThresholdsReturn`: Hook return type for threshold management

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| Use original_exercise_id for joins | Stable tracking across substitutions | Volume aggregates include substituted exercises |
| 28-day lookback window | Matches exercise progress charts | Consistent time frame across all analytics |
| Weekly aggregation (DATE_TRUNC) | Industry standard for volume recommendations | Aligns with 10-20 sets/week hypertrophy research |
| CTE pattern for compiled queries | Matches existing EXERCISE_PROGRESS_SQL | Consistent query structure, no inline subqueries |
| VolumeThresholds interface | Future-proofs per-muscle-group customization | Users can adjust zones per muscle (e.g., legs need more volume) |

## Implementation Notes

**SQL Pattern:**
- Both dbt views use `ref('fact_sets')` and `ref('dim_exercise')` for dbt graph
- Compiled queries use CTE composition with FACT_SETS_SQL and DIM_EXERCISE_SQL templates
- JOIN on `original_exercise_id = exercise_id` ensures substitutions tracked correctly
- Filter: `logged_at >= CURRENT_DATE - INTERVAL '28 days'` (4 weeks)

**Type Design:**
- VolumeByMuscleGroup has weekStart (string) for Recharts compatibility
- VolumeThresholds has low/optimal (no high) - above optimal = over-training
- Hook return types include refresh() for manual data reload
- MuscleGroupThresholds is dictionary for O(1) threshold lookup

**Verification:**
- dbt compilation successful (no SQL syntax errors)
- TypeScript compilation passed (npx tsc --noEmit)
- Both SQL exports present in compiled-queries.ts (2 found)
- All types present in analytics.ts (10 matches for volume-related types)

## Next Phase Readiness

**Ready for 06-02 (Volume Analytics Hooks):**
- SQL queries available: VOLUME_BY_MUSCLE_GROUP_SQL, MUSCLE_HEAT_MAP_SQL
- Types defined: VolumeByMuscleGroup, MuscleHeatMapData, hook return types
- Pattern established: mirrors useExerciseProgress pattern

**Ready for 06-03 (Volume Bar Charts):**
- VolumeByMuscleGroup type has weekStart + setCount for weekly stacked bars
- MuscleHeatMapData type has totalSets for current week display
- VolumeThresholds type supports ReferenceArea zone rendering

**No blockers identified.** Data layer complete and ready for consumption by hooks and components.

## Deviations from Plan

None - plan executed exactly as written.

## Task Breakdown

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Create dbt views for volume aggregation | a84e74a | vw_volume_by_muscle_group.sql, vw_muscle_heat_map.sql, _analytics__models.yml |
| 2 | Add compiled SQL queries and TypeScript types | 7668a6b | compiled-queries.ts, analytics.ts |

**Total commits:** 2
**Total duration:** 2 minutes
**Files created:** 2
**Files modified:** 3

## Testing Performed

- dbt compilation: `npx dbt-duckdb compile --select vw_volume_by_muscle_group vw_muscle_heat_map` (passed)
- TypeScript compilation: `npx tsc --noEmit` (passed)
- SQL export verification: `grep -c "VOLUME_BY_MUSCLE_GROUP_SQL\|MUSCLE_HEAT_MAP_SQL"` (2 found)
- Type verification: `grep -c "VolumeByMuscleGroup\|MuscleHeatMapData\|VolumeThresholds"` (10 found)

## Technical Debt

None introduced.

## Documentation Updates

- Added documentation for both new views in _analytics__models.yml
- Schema describes columns, purpose, and relationship to volume analytics features (VOL-01, VOL-02, VOL-03)

## Links to Requirements

- **VOL-01:** Weekly volume aggregation (vw_volume_by_muscle_group.sql)
- **VOL-02:** Volume zones with thresholds (VolumeThresholds type)
- **VOL-03:** Heat map data (vw_muscle_heat_map.sql + MuscleHeatMapData type)
