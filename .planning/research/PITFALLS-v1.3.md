# Pitfalls Research: v1.3 Production Polish & Deploy Readiness

**Date:** 2026-01-31
**Focus:** Common mistakes when adding production polish to an existing working app

## 1. Analytics Redesign — Breaking What Works

**Pitfall:** Restructuring analytics page breaks existing chart rendering or loses lazy loading benefits.
**Warning signs:** Charts rendering blank, increased initial bundle size, slower page load.
**Prevention:**
- Keep React.lazy boundary — just reorganize what's inside
- Test each chart independently before combining into dashboard
- Measure bundle size before/after
**Phase:** Analytics redesign phase

## 2. Time Range Threading — Inconsistent Queries

**Pitfall:** Adding configurable time ranges but some queries still use hardcoded 4-week window.
**Warning signs:** Charts showing different date ranges, confusing data when switching ranges.
**Prevention:**
- Audit ALL analytics SQL queries for hardcoded date ranges
- Single source of truth for selected range (Zustand store)
- Thread range parameter through every hook
- Test with "All Time" range (exercises edge case for empty data)
**Phase:** Analytics / time range phase

## 3. Exercise History Bug — Fixing Symptom Not Cause

**Pitfall:** Patching the query without understanding the root FK relationship. History disappears again in a different scenario.
**Warning signs:** Fix works for described repro but fails for variations.
**Prevention:**
- Trace the full data flow: event log → derived views → history query
- Understand exactly where plan_id filters history
- Write regression test before fixing
- Test with: create plan → log → delete plan → query history
**Phase:** Bug fix phase (first priority)

## 4. E2E Tests — Flaky DuckDB Initialization

**Pitfall:** Playwright tests fail intermittently because DuckDB-WASM initialization races with test assertions.
**Warning signs:** Tests pass locally, fail in CI. Timeouts on first test.
**Prevention:**
- Wait for DuckDB ready signal before test assertions
- Use Playwright's `waitForSelector` or custom ready indicator
- Increase timeout for initial page load in CI
- Run tests serially if parallel causes OPFS conflicts
**Phase:** E2E testing phase

## 5. Color Scheme Audit — Breaking Existing Contrast

**Pitfall:** Fixing contrast for one state (e.g., hover) breaks another (e.g., disabled). Or changing OKLCH tokens ripples unpredictably through components.
**Warning signs:** Visual regression in components you didn't touch.
**Prevention:**
- Audit ALL token usages before changing values
- Test every state: default, hover, focus, active, disabled
- Use automated contrast checking (axe-core)
- Screenshot comparison before/after
**Phase:** Color scheme phase

## 6. PWA Caching — Stale Assets After Deploy

**Pitfall:** Service worker caches old bundle, users don't see updates.
**Warning signs:** Users report old version after deploy, "works on my machine" syndrome.
**Prevention:**
- Verify vite-plugin-pwa registerType: 'autoUpdate' is working
- Test update flow: deploy new version → verify SW detects update → verify reload shows new version
- Add version indicator in app for debugging
**Phase:** PWA audit phase

## 7. Security Audit — CSP Too Strict

**Pitfall:** Adding Content-Security-Policy headers breaks DuckDB-WASM (uses Web Workers, eval, blob URLs).
**Warning signs:** App crashes with CSP violation errors after adding headers.
**Prevention:**
- Test CSP headers in development FIRST
- DuckDB-WASM requires: worker-src blob:, script-src 'wasm-unsafe-eval'
- Document required CSP exceptions with rationale
**Phase:** Security audit phase

## 8. TOON Export — Large Data Blocks UI

**Pitfall:** Encoding months of workout data synchronously blocks the main thread.
**Warning signs:** UI freezes during export, especially on "All Data" scope.
**Prevention:**
- Test with realistic data volume (6+ months of 4x/week workouts)
- Consider Web Worker for encoding if data is large
- Show progress indicator during export
- Limit "all data" to reasonable bounds
**Phase:** TOON export phase

## 9. Demo Data — Clearing Too Much or Too Little

**Pitfall:** "Clear Historical Data" accidentally clears exercises/gyms/plans, or leaves orphaned references.
**Warning signs:** App broken after clear, missing exercises in templates.
**Prevention:**
- Define exactly which event types get cleared (workout_logged, set_logged) vs preserved (exercise_created, gym_created, plan_created)
- Test: clear data → verify plans still reference valid exercises
- Test: clear data → log new workout → verify it works
**Phase:** Demo data phase

## 10. Performance Budget — Optimizing Wrong Things

**Pitfall:** Spending effort on bundle optimization that doesn't meaningfully improve user experience.
**Warning signs:** Hours spent saving 2KB while DuckDB-WASM is 4MB.
**Prevention:**
- Focus on perceived performance (FCP, LCP) not total bundle size
- DuckDB-WASM is loaded async — it doesn't block initial render
- Biggest wins: lazy loading, code splitting (already done)
- Set realistic targets given DuckDB-WASM constraint
**Phase:** Performance budget phase
