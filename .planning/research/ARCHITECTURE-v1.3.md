# Architecture Research: v1.3 Production Polish & Deploy Readiness

**Date:** 2026-01-31
**Focus:** How v1.3 features integrate with existing GymLog architecture

## Existing Architecture Summary

- React 18 SPA with Vite, TypeScript, Tailwind CSS 4
- DuckDB-WASM 1.32.0 with OPFS persistence
- Event sourcing: append-only events → derived SQL views
- dbt-duckdb at build time → CTE wrapper at runtime
- Hook-based data access (useExercises, useHistory, useAnalytics)
- Zustand stores for client state
- Lazy-loaded Analytics page (React.lazy + Suspense)
- GitHub Actions → GitHub Pages

## Integration Analysis

### 1. Exercise History Bug Fix

**Root cause investigation needed:**
- Event sourcing means history comes from events, not plan FK
- Likely issue: history query joins on plan_id or filters by active plan
- Non-gym-specific exercises should query by exercise_id regardless of plan

**Integration points:**
- `src/hooks/useHistory.ts` or equivalent — SQL query filtering
- dbt intermediate models (int_sets__with_prs.sql) — may have plan_id join
- Event replay logic — does deleting a plan emit events that affect history?

**Changes:** SQL query fix (remove plan_id filter for non-gym-specific exercises), regression test.

### 2. Analytics Dashboard Redesign

**Current structure:**
- Lazy-loaded AnalyticsPage component
- Separate exercise progress + volume analytics sections
- Individual hooks per analytics type

**New structure:**
- Keep lazy loading boundary at page level
- New component hierarchy inside:
  - AnalyticsDashboard (container)
    - SummaryStats (top: total workouts, PRs, streak)
    - TimeRangeSelector (pill buttons, Zustand state)
    - VolumeOverview (muscle group bars with zone colors)
    - MuscleHeatMap (existing, repositioned)
    - ExerciseDetailSections (per-exercise charts)

**Integration points:**
- All existing analytics hooks need time range parameter
- New Zustand slice or atom for selected time range
- Recharts components stay, layout changes

### 3. Custom Time Ranges

**Current:** Hardcoded 4-week window in SQL queries.

**New architecture:**
- Zustand store: `useAnalyticsStore` with `timeRange` state
- Time range options: '1M' | '3M' | '6M' | '1Y' | 'ALL'
- Convert to date boundaries in SQL helper
- Thread through all hooks: useExerciseProgress, useVolumeAnalytics, useProgressionStatus

**Data flow:**
```
TimeRangeSelector → Zustand → hooks re-query → SQL with date filter → charts update
```

### 4. Volume Recommendations

**Integration with existing volume analytics:**
- Current: volume per muscle group as bar chart with color zones
- Add: research-backed target ranges as reference lines/zones on same chart
- Hardcoded data: MEV/MAV/MRV per muscle group (from Schoenfeld/RP)

**New components:**
- Volume target config (hardcoded JSON constant)
- Reference zone overlay on existing Recharts bar chart
- Legend update to show zone meanings

**No new hooks needed** — extends existing useVolumeAnalytics data with static reference.

### 5. TOON Export

**New feature, isolated module:**

**Components:**
- `src/lib/toon-export.ts` — export service
  - Queries DuckDB for workout data (reuses existing query patterns)
  - Formats via `encode()` from @toon-format/toon
  - Three scope functions: lastWorkout(), currentRotation(), timeRange(months)
- `src/components/templates/ExportPanel.tsx` — UI
  - Scope selector (last workout / rotation / time range)
  - Copy to clipboard button (Clipboard API)
  - Download .toon file button

**Integration points:**
- Uses existing DuckDB query infrastructure
- Settings/export page or modal from existing data page
- Clipboard API: `navigator.clipboard.writeText()`

### 6. Workouts Tab Restructure

**Current:** Quick Start and manual template selection as separate sections.

**New layout:**
- Hero Quick Start CTA (primary, large)
- Collapsed "Choose template" section (expandable)
- Reduces vertical space

**Integration:** Component restructure within existing WorkoutsPage. No hook/data changes.

### 7. Demo Data UX

**Current:** One-click demo data import.

**Changes:**
- Gradient/warning styling on import button (CSS only)
- New "Clear Historical Data" button
  - Clears workout_logged, set_logged events
  - Preserves exercise_created, gym_created, plan_created events
  - Triggers view rebuild

**Integration points:**
- Event store: selective event deletion by type
- DuckDB view rebuild after clearing

### 8. Color Scheme / OKLCH Audit

**Current:** OKLCH design tokens in Tailwind config.

**Changes:**
- Audit all token values for WCAG AA contrast (4.5:1 text, 3:1 UI)
- Keep orange accent
- Adjust tokens as needed

**Integration:** CSS/Tailwind only. No component logic changes.

### 9. Security Audit

**Cross-cutting:**
- Check for exposed secrets in git history
- Verify .env handling (.gitignore)
- Check localStorage for sensitive data
- CSP headers (careful with DuckDB-WASM requirements)
- npm audit for vulnerabilities
- Verify no PII in demo data

### 10. PWA Audit

**Current:** vite-plugin-pwa configured.

**Audit areas:**
- Service worker caching strategy verification
- Offline behavior testing
- Manifest icons and metadata
- Installability (add to home screen)

### 11. Performance Budget

**Current:** Lazy-loaded analytics, code splitting.

**Audit areas:**
- Bundle size analysis (main chunk, lazy chunks)
- Lighthouse scores (FCP, LCP, TBT, CLS)
- Realistic targets given DuckDB-WASM (~4MB async load)

## Suggested Build Order

1. **Bug fix first** (exercise history) — critical data integrity
2. **Security audit** — identify issues early, fix as you go
3. **E2E tests** — establish regression safety net
4. **Workouts UX + Color scheme** — visual/UX improvements
5. **Analytics redesign + Time ranges + Volume recs** — major feature cluster
6. **Demo data UX** — extends existing feature
7. **TOON export** — new isolated feature
8. **PWA + Performance + README** — deploy readiness
9. **General polish** — final sweep

This order matches user's priority and minimizes rework (tests before refactoring, bug fix before feature work).
