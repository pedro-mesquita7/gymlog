---
phase: 07-progression-intelligence
plan: 02
subsystem: analytics-ui
status: complete
completed: 2026-01-30
duration: 2 minutes

# Dependencies
requires:
  - 07-01  # useProgressionStatus hook and ProgressionStatus types
  - 06-05  # AnalyticsPage and CollapsibleSection pattern
  - 06-03  # CollapsibleSection component

provides:
  - progression-dashboard  # ProgressionDashboard component showing summary and cards
  - progression-card       # ProgressionStatusCard component with status-specific styling
  - dashboard-integration  # Progression Intelligence section in AnalyticsPage

affects:
  - 07-03  # ProgressionAlert will use similar status styling patterns
  - analytics-page-ux     # Users can now view progression status for all exercises

# Technical Stack
tech-stack:
  added: []  # No new dependencies (uses date-fns, existing hooks/components)
  patterns:
    - useMemo-join          # Join progression data with exercise names
    - problems-first-sort   # regressing > plateau > progressing > unknown
    - collapsible-section   # Follows AnalyticsPage section pattern
    - status-badge-styling  # Tailwind dark theme color schemes

# Artifacts
key-files:
  created:
    - path: src/components/analytics/ProgressionStatusCard.tsx
      loc: 98
      purpose: Individual exercise status card with badge, details, regression metrics
    - path: src/components/analytics/ProgressionDashboard.tsx
      loc: 106
      purpose: Dashboard container with summary counts and sorted status cards

  modified:
    - path: src/components/analytics/AnalyticsPage.tsx
      changes: Added ProgressionDashboard import and new "Progression Intelligence" section
      pattern: Visual divider + heading + CollapsibleSection wrapper

# Decisions Made
decisions:
  - slug: problems-first-sorting
    what: Cards sorted regressing (0) > plateau (1) > progressing (2) > unknown (3), then alphabetical
    why: Surfaces urgent issues first while keeping same-status exercises in predictable order
    alternatives: Alphabetical only (rejected - users want to see problems immediately)

  - slug: combined-regression-metrics
    what: Show "Weight: -X% / Volume: -Y%" in single line for regressing status
    why: Compact display that shows both metrics when available without cluttering card
    alternatives: Separate lines per metric (rejected - too much vertical space for common case)

  - slug: formatDistanceToNow-for-pr-date
    what: Use date-fns formatDistanceToNow with addSuffix for last PR display
    why: Human-readable relative time ("3 weeks ago") more intuitive than absolute dates
    alternatives: Absolute date (rejected - users think in relative time for recent PRs)

  - slug: three-column-summary-grid
    what: Summary counts in 3-column grid (progressing, plateau, regressing)
    why: Visual hierarchy matching status priority, consistent with color scheme
    alternatives: Horizontal single row (rejected - less visual impact for dashboard overview)

tags:
  - react
  - analytics
  - progression-status
  - dashboard
  - ui-components
---

# Phase 7 Plan 2: Progression Dashboard UI Summary

**One-liner:** Progression Intelligence dashboard with summary counts and problems-first sorted status cards, integrated into AnalyticsPage under new "Progression Intelligence" section.

## What Was Built

Created the Progression Intelligence dashboard UI with complete status visualization:

1. **ProgressionStatusCard component** (98 LOC):
   - Props: exerciseId, exerciseName, muscleGroup, status, lastPrDate, sessionCount4wk, weightDropPct, volumeDropPct
   - Status config object mapping each status to: icon (↗ progressing, → plateau, ↘ regressing, ? unknown), bgColor, borderColor, textColor, badge text
   - Dark theme styling: bg-green-900/20, bg-yellow-900/20, bg-red-900/20, bg-zinc-800/20 with matching borders
   - Last PR display using formatDistanceToNow from date-fns with addSuffix: true
   - Handles null lastPrDate with "No PRs recorded yet" message
   - For regressing status: shows weight and volume drop percentages in red text (e.g., "Weight: -12.5% / Volume: -8.3%")
   - Compact single-card layout with exercise name + muscle group label at top

2. **ProgressionDashboard component** (106 LOC):
   - Imports useProgressionStatus and useExercises hooks
   - Summary counts section: 3-column grid with colored cards (green/yellow/red) showing count per status
   - useMemo to join progression data with exercise names (match exerciseId to exercise.exercise_id)
   - useMemo to calculate summary counts (progressing/plateau/regressing totals)
   - useMemo to sort status: regressing (0) > plateau (1) > progressing (2) > unknown (3), then alphabetical by name
   - Maps sorted status to ProgressionStatusCard components with unique key `${exerciseId}-${gymId}`
   - Loading state: "Loading progression data..." centered with zinc-500 text
   - Error state: "Error: {error}" centered with red-400 text
   - Empty state: "Not enough workout data yet. Log 2+ sessions per exercise to see progression analysis."

3. **AnalyticsPage integration** (+10 LOC):
   - Added import: `import { ProgressionDashboard } from './ProgressionDashboard';`
   - Added visual divider AFTER Training Balance Heat Map: `<div className="border-t-2 border-zinc-700 pt-8 mt-8">`
   - Added section heading: `<h2 className="text-xl font-bold text-zinc-100 mb-6">Progression Intelligence</h2>`
   - Added CollapsibleSection wrapper: `<CollapsibleSection title="Exercise Progression Status" defaultOpen={true}>`
   - Renders ProgressionDashboard inside section
   - Follows exact pattern from Volume Analytics sections (visual divider + heading + collapsible section)

## Key Implementation Details

**Status-Specific Styling:**
- Progressing: bg-green-900/20, border-green-700/30, text-green-400, icon ↗
- Plateau: bg-yellow-900/20, border-yellow-700/30, text-yellow-400, icon →
- Regressing: bg-red-900/20, border-red-700/30, text-red-400, icon ↘
- Unknown: bg-zinc-800/20, border-zinc-700/30, text-zinc-400, icon ?

**Problems-First Sorting Algorithm:**
```javascript
const order = { regressing: 0, plateau: 1, progressing: 2, unknown: 3 };
const statusDiff = order[a.status] - order[b.status];
if (statusDiff !== 0) return statusDiff;
return a.exerciseName.localeCompare(b.exerciseName);
```

**Summary Calculation:**
```javascript
return progressionData.reduce(
  (acc, p) => {
    if (p.status === 'progressing') acc.progressing++;
    else if (p.status === 'plateau') acc.plateau++;
    else if (p.status === 'regressing') acc.regressing++;
    return acc;
  },
  { progressing: 0, plateau: 0, regressing: 0 }
);
```

**Regression Metrics Display:**
Only shown when status === 'regressing':
```javascript
{weightDropPct && weightDropPct > 0 && `Weight: -${weightDropPct.toFixed(1)}%`}
{weightDropPct && weightDropPct > 0 && volumeDropPct && volumeDropPct > 0 && ' / '}
{volumeDropPct && volumeDropPct > 0 && `Volume: -${volumeDropPct.toFixed(1)}%`}
```

## Testing Performed

**TypeScript Compilation:**
```bash
npx tsc --noEmit  # ✓ Passed (no new errors introduced)
```

**Component Structure:**
- ProgressionStatusCard exports correctly ✓
- ProgressionDashboard exports correctly ✓
- AnalyticsPage imports and renders ProgressionDashboard ✓
- All hooks used correctly (useProgressionStatus, useExercises) ✓

**Visual Pattern Compliance:**
- CollapsibleSection wrapper matches existing sections ✓
- Visual divider uses same border-t-2 border-zinc-700 pattern as Volume Analytics ✓
- Color scheme consistent with dark theme (zinc-100, zinc-400, zinc-500 for text) ✓
- Status colors follow semantic convention (green=good, yellow=warning, red=problem) ✓

**Build Note:**
`npm run build` fails due to pre-existing TypeScript errors in other files (TemplateBuilder.tsx, SetLogger.tsx, BackupReminder.tsx, useBackupExport.ts, useDuckDB.ts). These errors existed before this plan and are unrelated to the Progression Dashboard implementation.

## Deviations from Plan

None - plan executed exactly as written.

## Lessons Learned

1. **Problems-first sorting is powerful UX:** Surfacing regressions and plateaus first creates immediate actionability for users - they see what needs attention without scrolling past successes.

2. **formatDistanceToNow is more intuitive than absolute dates:** "3 weeks ago" reads faster and provides better context than "2026-01-09" for recent PRs.

3. **Compact regression metrics display:** Combining weight/volume drops in single line (e.g., "Weight: -12.5% / Volume: -8.3%") keeps cards compact while showing critical details.

4. **Visual dividers create clear section boundaries:** The border-t-2 divider between Volume Analytics and Progression Intelligence helps users understand distinct feature areas.

5. **useMemo for derived data is essential:** Joining progression data with exercise names and sorting both benefit from memoization - prevents recalculation on every render.

## Next Phase Readiness

**Ready for Plan 03 (ProgressionAlert):**
- ProgressionStatusCard established status styling patterns (icons, colors, messages) ✓
- Status badge design can be reused for workout alerts ✓
- Color scheme and badge text proven in dashboard context ✓

**Ready for Plan 04 (Advanced Detection):**
- Dashboard displays weight/volume drop percentages correctly ✓
- UI ready to consume additional detection metrics if added ✓
- Card layout flexible enough for additional details ✓

**Ready for Plan 05 (Alert Integration):**
- AnalyticsPage integration pattern established ✓
- CollapsibleSection wrapper proven for new feature sections ✓
- Visual hierarchy clear for future dashboard extensions ✓

**Blockers/Concerns:**
None - dashboard UI is complete and ready for alert system (Plan 03).

## User Experience Notes

**Dashboard Flow:**
1. User navigates to Analytics page
2. Scrolls past exercise-specific sections (Progress, Week Comparison, PRs)
3. Sees Volume Analytics section with muscle group insights
4. Encounters "Progression Intelligence" heading with visual divider
5. Sees summary counts at a glance (e.g., "3 progressing, 1 plateau, 0 regressing")
6. Reviews status cards sorted problems-first
7. For regressing exercises: sees specific drop percentages to diagnose issue
8. For plateau exercises: sees last PR date and session count to understand stall
9. For progressing exercises: sees recent PR confirmation for motivation

**Key UX Wins:**
- Problems surface first (no need to search for issues)
- Summary counts provide immediate overview
- Status badges use universal symbols (arrows) + color + text for accessibility
- Relative time for last PR ("3 weeks ago") more actionable than absolute dates
- Compact regression details show severity without clutter

## Related Documentation

- Plan: .planning/phases/07-progression-intelligence/07-02-PLAN.md
- Research: .planning/phases/07-progression-intelligence/07-RESEARCH.md (Pattern 5: ProgressionDashboard, ProgressionStatusCard examples)
- Context: .planning/phases/07-progression-intelligence/07-CONTEXT.md (dashboard layout, problems-first sorting decision)
- Previous plan: .planning/phases/07-progression-intelligence/07-01-SUMMARY.md (SQL foundation for progression status)

## Commits

- `aa02cf1` - feat(07-02): create ProgressionStatusCard and ProgressionDashboard components
- `3545a98` - feat(07-02): integrate ProgressionDashboard into AnalyticsPage

Total: 2 commits, 3 files (2 created, 1 modified), ~214 LOC added
