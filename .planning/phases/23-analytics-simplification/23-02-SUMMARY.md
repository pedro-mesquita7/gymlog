---
phase: 23-analytics-simplification
plan: 02
subsystem: ui
tags: [react, analytics, hooks, duckdb, week-comparison]

# Dependency graph
requires:
  - phase: 23-analytics-simplification/01
    provides: Simplified analytics page with collapsible sections and exercise progress chart
  - phase: 15-analytics-redesign
    provides: ExerciseProgressChart component and compiled-queries pattern
provides:
  - useWeekComparisonSubtitle hook for week-over-week exercise comparison
  - Color-coded percentage subtitle in exercise progress section
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Lightweight comparison hook pattern (SQL query + formatted string + raw data for styling)

key-files:
  created:
    - src/hooks/useWeekComparisonSubtitle.ts
  modified:
    - src/components/analytics/AnalyticsPage.tsx
    - src/db/compiled-queries.ts

key-decisions:
  - "Hook always compares last 7 days vs 8-14 days ago, independent of time range picker"
  - "Returns both formatted subtitle string and raw data for component-level color styling"
  - "Shows 'First week' when only current week has data, empty string when no current data"

patterns-established:
  - "Week comparison hook pattern: SQL aggregation + formatted string + raw data for conditional styling"

# Metrics
duration: 8min
completed: 2026-02-02
---

# Phase 23 Plan 02: Week Comparison Subtitle Summary

**Week-over-week comparison subtitle on exercise progress showing color-coded weight/volume percentage changes via DuckDB query hook**

## Performance

- **Duration:** ~8 min (including checkpoint pause for human verification)
- **Started:** 2026-02-02T17:25:00Z
- **Completed:** 2026-02-02T17:33:00Z
- **Tasks:** 2 (1 auto + 1 checkpoint)
- **Files modified:** 3 (1 created, 2 modified)

## Accomplishments
- Created useWeekComparisonSubtitle hook comparing last 7 days vs 8-14 days ago per exercise
- Added weekComparisonSubtitleSQL function to compiled-queries.ts with DuckDB aggregation
- Wired subtitle into AnalyticsPage exercise progress section with color-coded percentages (green for positive, red for negative)
- Handles edge cases: "First week" for single-week data, empty string for no current data
- Human verification approved full analytics page layout

## Task Commits

Each task was committed atomically:

1. **Task 1: Create useWeekComparisonSubtitle hook and wire into AnalyticsPage** - `a78e46d` (feat)
2. **Task 2: Checkpoint -- human-verify full analytics page** - approved (no commit)

## Files Created/Modified
- `src/hooks/useWeekComparisonSubtitle.ts` - New hook returning formatted week-over-week comparison subtitle with raw data
- `src/db/compiled-queries.ts` - Added weekComparisonSubtitleSQL function for DuckDB aggregation query
- `src/components/analytics/AnalyticsPage.tsx` - Wired subtitle display below exercise selector with color-coded styling

## Decisions Made
- Hook compares rolling 7-day windows (not calendar weeks) independent of time range picker -- this is about recent momentum
- Returns raw data alongside formatted string so component can apply green/red color coding
- "First week" label chosen over "First session" since comparison is week-granularity

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 23 (Analytics Simplification) is complete
- Analytics page fully restructured: dead code removed, layout simplified, week comparison subtitle added
- Ready for next phase in roadmap

---
*Phase: 23-analytics-simplification*
*Completed: 2026-02-02*
