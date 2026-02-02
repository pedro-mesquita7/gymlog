# Phase 23: Analytics Simplification - Context

**Gathered:** 2026-02-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Remove comparison section, progression dashboard, and plateau detection from the analytics page. Keep exercise progress charts and volume analytics. Merge week-over-week comparison data into the exercise progress chart as a subtitle. Result is a focused analytics page showing exercise progress and volume only.

</domain>

<decisions>
## Implementation Decisions

### Surviving page layout
- Section order (top to bottom): Summary Stats → Exercise Progress (with week comparison subtitle) → PRs → Volume Bar Chart → Muscle Heat Map
- All sections are collapsible (using existing CollapsibleSection component)
- Volume bar chart and muscle heat map remain separate sections (not combined)
- Time range picker behavior: Claude's discretion (sticky vs inline)

### Week comparison merge
- WeekComparisonCard component is removed as a standalone section
- Week-over-week data is shown as subtitle text below the exercise progress chart title
- Format: both weight and volume changes (e.g., "+5% weight, +12% volume vs last week")
- When no previous week data exists, show "First session" label instead of hiding
- The existing `useWeeklyComparison` hook is deleted; rebuild a simpler hook tailored to the subtitle use case

### Dead code cleanup
- Full removal: delete components, hooks, types, and dbt/SQL models that exclusively serve removed features
- Check `ExerciseMultiSelect` for shared usage before deleting — only delete if exclusively used by comparison
- UI removal and dead code cleanup happen in the same plan (one atomic change)
- Components to remove: ComparisonSection, ComparisonStatCard, ExerciseMultiSelect (if not shared), ProgressionDashboard, ProgressionStatusCard, WeekComparisonCard
- Hooks to remove: useProgressionStatus, useComparisonStats, useWeeklyComparison (rebuild fresh for subtitle)
- Types to audit: ProgressionStatus, ComparisonStats in analytics.ts — remove if no longer referenced

### Summary stats
- Drop streak card — keep only Workouts, Volume, PRs (3 cards)
- Layout changes from 4-column to 3-column grid
- Stats respond to the time range picker (contextual, not all-time)
- PR count shows PRs set within the selected time range (e.g., "5 PRs this month")

### Claude's Discretion
- Time range picker: sticky header vs inline (pick based on simplified page feel)
- Loading skeleton design for collapsible sections
- Exact subtitle formatting for week comparison text
- How to handle edge cases in week comparison (e.g., exercise done once in range)
- dbt model cleanup — determine which models are exclusively used by removed features

</decisions>

<specifics>
## Specific Ideas

- Exercise-first layout: the user checks exercise progress most often, so it comes right after summary stats
- Week comparison as subtitle keeps the useful data without a separate card taking up space
- 3-column stat grid should feel balanced on mobile

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 23-analytics-simplification*
*Context gathered: 2026-02-02*
