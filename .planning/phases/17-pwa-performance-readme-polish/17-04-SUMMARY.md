---
phase: 17-pwa-performance-readme-polish
plan: 04
subsystem: ui
tags: [react, ux, loading-states, empty-states, error-boundaries, polish]

# Dependency graph
requires:
  - phase: 14-workouts-ux-color-scheme
    provides: Design token system (text-text-muted, bg-bg-secondary, etc.)
  - phase: 12-security-bug-fixes
    provides: FeatureErrorBoundary component
provides:
  - Consistent loading/empty/error states across all four tabs
  - Tab-by-tab UX audit documentation
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Loading text pattern: 'Loading [thing]...' with text-text-muted class"
    - "Empty state pattern: centered text with guidance, optional action button"
    - "Error boundary pattern: FeatureErrorBoundary wrapping each tab and analytics sub-sections"

key-files:
  created: []
  modified:
    - src/components/GymList.tsx
    - src/components/ExerciseList.tsx

key-decisions:
  - "Hover-only edit/delete buttons in GymList/ExerciseList noted as known mobile limitation but not changed (beyond polish scope)"
  - "console.log/warn statements in db init, error handlers, and data loading are legitimate and not removed"

patterns-established:
  - "Loading state: text-text-muted with 'Loading [noun]...' phrasing"
  - "Empty state: centered content with actionable guidance"
  - "Error state: FeatureErrorBoundary at tab level + sub-section level in Analytics"

# Metrics
duration: 5min
completed: 2026-02-01
---

# Phase 17 Plan 04: Tab-by-Tab UX Consistency Audit Summary

**Normalized loading text across GymList and ExerciseList; full audit confirmed all 4 tabs have consistent loading/empty/error states with FeatureErrorBoundary coverage**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-01T13:48:21Z
- **Completed:** 2026-02-01T13:53:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Completed systematic tab-by-tab audit of all loading, empty, and error states across Workouts, Templates, Analytics, and Settings
- Fixed inconsistent loading text in GymList ("Loading..." -> "Loading gyms...") and ExerciseList ("Loading..." -> "Loading exercises...")
- Confirmed FeatureErrorBoundary wraps all 4 tabs in App.tsx and additionally wraps 8 sub-sections within Analytics
- Verified no blank screens possible in any state combination (loading, empty, error, data present)
- Confirmed no orphaned console.log/warn, no TODO comments, all tests passing

## Audit Results

### Workouts Tab
| Component | Loading | Empty | Error |
|-----------|---------|-------|-------|
| App (DB init) | "Loading..." centered | N/A | Retry button |
| renderWorkoutsContent | "Loading workout..." | Template not found with Dismiss | FeatureErrorBoundary |
| QuickStartCard | N/A (sync) | 3 states: no rotation, no gym, template missing | FeatureErrorBoundary (parent) |
| RecentWorkoutCard | Returns null | Returns null | FeatureErrorBoundary (parent) |
| StartWorkout manual select | N/A (props) | "No gyms yet" / "No templates yet" guidance | FeatureErrorBoundary (parent) |
| GymList | "Loading gyms..." (FIXED) | "No gyms added yet" dashed border | FeatureErrorBoundary (parent) |
| ExerciseList | "Loading exercises..." (FIXED) | "No exercises added yet" / filter message | FeatureErrorBoundary (parent) |

### Templates Tab
| Component | Loading | Empty | Error |
|-----------|---------|-------|-------|
| TemplateList | "Loading templates..." | "No active/templates yet" + create link | FeatureErrorBoundary |

### Analytics Tab
| Component | Loading | Empty | Error |
|-----------|---------|-------|-------|
| Suspense fallback | "Loading analytics..." | N/A | FeatureErrorBoundary |
| AnalyticsPage | "Loading exercises..." | "No exercises yet" guidance | FeatureErrorBoundary |
| SummaryStatsCards | Skeleton shimmer (animate-pulse) | Shows zero values | FeatureErrorBoundary |
| Volume sections | "Loading volume/heat map data..." | Chart handles empty | FeatureErrorBoundary per-section |
| Exercise Progress | "Loading chart..." | Chart handles empty | FeatureErrorBoundary |
| Week Comparison | "Loading comparison..." | "No data yet" guidance | FeatureErrorBoundary |
| PRList | "Loading PR history..." | "No PRs yet" | FeatureErrorBoundary |
| ProgressionDashboard | "Loading progression data..." | "Not enough data" guidance | FeatureErrorBoundary |

### Settings Tab
| Component | Loading | Empty | Error |
|-----------|---------|-------|-------|
| RotationSection | N/A (localStorage sync) | "No rotations yet. Create one above" | FeatureErrorBoundary (parent) |
| Workout Preferences | N/A (store sync) | N/A (always shows controls) | FeatureErrorBoundary (parent) |
| Backup Export/Import | Disabled + "Exporting/Importing..." | Last backup info | Error text display |
| ToonExportSection | Disabled + "Exporting..." | Error for no data | Error text display |
| DemoDataSection | Disabled + "Loading demo data..." | N/A (always shows button) | Alert on failure |
| ObservabilitySection | "Loading metrics..." card | Shows zero values | Error text in card |
| DataQualitySection | "Running Checks..." disabled | "Load some workout data first" | Per-test status icons |

## Task Commits

Each task was committed atomically:

1. **Task 1: Audit and fix loading/empty/error states** - `8bbe2c4` (fix)
2. **Task 2: Fix visual/interaction rough edges** - Clean audit, no changes needed

## Files Created/Modified
- `src/components/GymList.tsx` - Normalized loading text to "Loading gyms..."
- `src/components/ExerciseList.tsx` - Normalized loading text to "Loading exercises..."

## Decisions Made
- Hover-only edit/delete buttons in GymList/ExerciseList are a known mobile limitation but not changed -- fixing properly would require swipe actions or always-visible buttons, which is beyond a polish pass
- All console.log/warn in src/ are legitimate (DB init, error handlers, data loading) and not removed
- SummaryStatsCards uses skeleton shimmer while other sections use text loading -- this is intentional since cards benefit from layout stability

## Deviations from Plan

None - plan executed exactly as written. Only 2 minor loading text inconsistencies found and fixed.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All four tabs have consistent UX patterns
- Ready for 17-05 (final plan in phase)

---
*Phase: 17-pwa-performance-readme-polish*
*Completed: 2026-02-01*
