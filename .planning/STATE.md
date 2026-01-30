# Project State: GymLog

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-28)

**Core value:** Track workout performance with proper data engineering — both usable as a personal training tool and impressive as a senior Data Engineer portfolio piece.

**Current focus:** v1.1 Analytics milestone - Phase 7 (Progression Intelligence)

## Current Position

Phase: 7 of 7 (Progression Intelligence)
Plan: 3 of 5 complete
Status: In progress
Last activity: 2026-01-30 — Completed 07-03-PLAN.md (Session-Dismissible Progression Alerts)

Progress: [███████████████████████░] 40/40 plans (100% - v1.0 complete + 13/13 v1.1)

## Milestones

| Version | Status | Shipped |
|---------|--------|---------|
| v1.0 MVP | Complete | 2026-01-28 |
| v1.1 Analytics | In Progress | — |

## Performance Metrics

**Velocity:**
- Total plans completed: 40 (27 v1.0 + 13 v1.1)
- Average duration (v1.1): 2min 42s
- Total execution time (v1.1): 35min 32s

**By Phase (v1.0):**

| Phase | Plans | Status |
|-------|-------|--------|
| 1. Foundation | 6 | Complete |
| 2. Templates | 9 | Complete |
| 3. History | 6 | Complete |
| 4. Polish | 6 | Complete |

**By Phase (v1.1):**

| Phase | Plans | Status |
|-------|-------|--------|
| 5. Analytics Foundation | 5/5 | Complete |
| 6. Volume Analytics | 5/5 | Complete |
| 7. Progression Intelligence | 3/5 | In Progress |

## Accumulated Context

### Decisions

Key decisions from v1.0 (still apply):

- DuckDB-WASM + Parquet for modern DE showcase
- Event sourcing for immutable audit trail
- dbt-duckdb at build time for docs/tests
- Zustand with persist for client state
- String interpolation for SQL (DuckDB-WASM limitation)
- Pin DuckDB-WASM to 1.32.0 (OPFS bug workaround)

v1.1 decisions:
- Recharts 3.7.0 for charting (~96KB gzipped, most popular React library)
- Hook-based analytics data access (matches existing useHistory pattern)
- No Zustand store for analytics (read-only, hooks manage state)
- date-fns 4.1.0 for date utilities (modern, tree-shakeable)
- 28-day lookback for exercise progress charts (sufficient trend data)
- 14-day lookback for weekly comparison (current + previous week)
- original_exercise_id for stable progress tracking across substitutions
- SQL volume calculation (weight_kg * reps) for 10-100x performance vs JavaScript
- CSS variables for chart colors support future theming
- ChartContainer wrapper provides required fixed-height for ResponsiveContainer
- Memoize chart data to prevent unnecessary re-renders
- Lazy load Analytics page to keep Recharts out of main bundle (110KB savings)
- Auto-select first exercise on Analytics page load for better UX
- 28-day lookback for volume analytics (4 weeks of muscle group trend data)
- Weekly aggregation for volume (industry standard: 10-20 sets/week per muscle)
- CTE pattern for volume SQL queries (matches existing EXERCISE_PROGRESS_SQL)
- Default volume thresholds: low=10, optimal=20 sets/week
- Standard muscle groups always appear in volume data (zero-filled if missing)
- localStorage for volume threshold persistence (no Zustand for analytics)
- Native HTML details/summary for CollapsibleSection (zero JavaScript, full accessibility)
- Grouped bars (not stacked) for multi-week volume comparison
- ReferenceArea zones use default thresholds for chart-wide background
- minPointSize={3} ensures zero-value bars remain visible
- react-muscle-highlighter for anatomical body diagrams (lightweight, zero deps except React)
- Muscle group mappings: Chest→chest, Back→upper-back/lower-back/trapezius, Shoulders→deltoids, Legs→quadriceps/hamstring/gluteal/calves, Arms→biceps/triceps/forearm, Core→abs/obliques
- HSL color scheme for volume zones: red (0°) under-training, green (142°) optimal, yellow (45°) high volume

Phase 7 (Progression Intelligence) decisions:
- Dual-criteria plateau: no PR in 4+ weeks AND weight change < 5% (prevents false positives during deload)
- 8-week baseline for regression (excludes current week via ROWS BETWEEN 8 PRECEDING AND 1 PRECEDING)
- Regression thresholds: 10%+ weight drop OR 20%+ volume drop
- Minimum 2 sessions before showing status (avoids noise for new exercises)
- Gym-aware partitioning in window functions (PARTITION BY exercise_id, gym_id)
- JavaScript filtering for single-exercise lookup (simpler than SQL parameterization with DuckDB-WASM)
- Problems-first sorting: regressing > plateau > progressing > unknown, then alphabetical
- formatDistanceToNow for last PR display (relative time more intuitive than absolute dates)
- Combined regression metrics in single line (Weight: -X% / Volume: -Y%) for compact display
- 2-hour session boundary for dismissible alerts (typical workout 60-90min, 2hr provides buffer)
- Session-dismissible alerts: cleared when 2+ hours pass, return if condition persists
- Progressing alerts not dismissible (positive reinforcement should persist)
- Dynamic regression messages include drop percentages (actionable: "down 15%" vs "down significantly")

### Pending Todos

None.

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-01-30T06:23:48Z
Stopped at: Completed 07-03-PLAN.md (Session-Dismissible Progression Alerts)
Resume file: None

**Next action:** Continue Phase 7 with Plan 04 (Progression Suggestions) or Plan 05 (Testing & Documentation).
