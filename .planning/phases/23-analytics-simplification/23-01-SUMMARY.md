---
phase: 23-analytics-simplification
plan: 01
subsystem: ui
tags: [react, analytics, collapsible-sections, dead-code-removal]

# Dependency graph
requires:
  - phase: 15-analytics-redesign
    provides: Analytics page with CollapsibleSection, volume charts, heat map, exercise progress
  - phase: 21
    provides: Comparison section and progression dashboard (now removed)
provides:
  - Simplified analytics page with 5 sections (Summary Stats, Exercise Progress, PRs, Volume, Heat Map)
  - Dead code removal of comparison/progression features
  - 3-card summary stats (no streak)
affects: [23-02 week-comparison-subtitle]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - CollapsibleSection wrapping all analytics sections except Summary Stats

key-files:
  created: []
  modified:
    - src/components/analytics/AnalyticsPage.tsx
    - src/components/analytics/SummaryStatsCards.tsx
    - src/hooks/useSummaryStats.ts
    - src/hooks/useAnalytics.ts
    - src/types/analytics.ts
    - src/db/compiled-queries.ts

key-decisions:
  - "Summary Stats always visible (not collapsible), all other sections use CollapsibleSection"
  - "Section order: Summary Stats, Exercise Progress, PRs, Volume Overview, Training Balance"
  - "3-column grid for summary stat cards (Workouts, Volume, PRs)"

patterns-established:
  - "CollapsibleSection for all analytics subsections: consistent accordion pattern"

# Metrics
duration: 12min
completed: 2026-02-02
---

# Phase 23 Plan 01: Analytics Dead Code Removal + Layout Restructure Summary

**Removed comparison section, progression dashboard, and streak card; restructured analytics to 5 collapsible sections with 3-card summary stats**

## Performance

- **Duration:** 12 min
- **Started:** 2026-02-02T17:12:58Z
- **Completed:** 2026-02-02T17:24:51Z
- **Tasks:** 2
- **Files modified:** 6 (+ 9 deleted)

## Accomplishments
- Deleted 9 dead code files (7 components, 2 hooks) removing 1031 lines
- Removed WEEKLY_COMPARISON_SQL, comparisonStatsSQL, and 5 dead type interfaces
- Restructured AnalyticsPage with CollapsibleSection wrappers in new section order
- Simplified SummaryStatsCards from 4 cards (2-col) to 3 cards (3-col), dropping streak
- Removed streak calculation logic from useSummaryStats hook

## Task Commits

Each task was committed atomically:

1. **Task 1: Delete dead code files and clean up references** - `d39e708` (feat)
2. **Task 2: Restructure AnalyticsPage layout with collapsible sections** - `e2f09a4` (feat)

## Files Created/Modified
- `src/components/analytics/AnalyticsPage.tsx` - Simplified layout with CollapsibleSection, new section order
- `src/components/analytics/SummaryStatsCards.tsx` - 3-card grid (Workouts, Volume, PRs)
- `src/hooks/useSummaryStats.ts` - Removed streak calculation
- `src/hooks/useAnalytics.ts` - Removed useWeeklyComparison export
- `src/types/analytics.ts` - Removed WeeklyComparison, ComparisonStats, streak types
- `src/db/compiled-queries.ts` - Removed WEEKLY_COMPARISON_SQL and comparisonStatsSQL

### Deleted Files
- `src/components/analytics/ComparisonSection.tsx`
- `src/components/analytics/ComparisonStatCard.tsx`
- `src/components/analytics/ExerciseMultiSelect.tsx`
- `src/components/analytics/ProgressionDashboard.tsx`
- `src/components/analytics/ProgressionStatusCard.tsx`
- `src/components/analytics/WeekComparisonCard.tsx`
- `src/components/analytics/SectionHeading.tsx`
- `src/hooks/useProgressionStatus.ts`
- `src/hooks/useComparisonStats.ts`

## Decisions Made
- Summary Stats section is always visible (not wrapped in CollapsibleSection) per CONTEXT.md guidance
- Section order follows CONTEXT.md: Summary Stats -> Exercise Progress -> PRs -> Volume Overview -> Training Balance
- Kept progressionStatusSQL and ProgressionStatus types (used by ProgressionAlert in workout SetLogger, not analytics)
- Time range picker remains sticky at top

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Analytics page simplified and ready for Plan 02 (week comparison subtitle on exercise progress chart)
- Exercise progress chart, volume bar chart, heat map all rendering correctly
- CollapsibleSection pattern established for consistent section management

---
*Phase: 23-analytics-simplification*
*Completed: 2026-02-02*
