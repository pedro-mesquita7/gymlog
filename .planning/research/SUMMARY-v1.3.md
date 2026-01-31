# Research Summary: v1.3 Production Polish & Deploy Readiness

**Date:** 2026-01-31
**Status:** Research Complete
**Confidence:** HIGH

---

## Executive Summary

v1.3 is a **hardening milestone** — no new architectural patterns, one new dependency (@toon-format/toon), and mostly improvements to existing features. The biggest technical work is the analytics dashboard redesign (restructuring components + threading time ranges through SQL queries) and the TOON export (new isolated module). Everything else is configuration, testing, and polish.

---

## Key Stack Additions

| Library | Version | Purpose |
|---------|---------|---------|
| @toon-format/toon | 2.1.0 | TOON export for LLM-optimized workout data |

No other runtime dependencies needed. Optional dev deps: lighthouse-ci for CI perf budgets, @axe-core/playwright for automated accessibility.

---

## Feature Table Stakes

**Analytics Dashboard:** Summary stats at top → muscle group volume overview → exercise detail below. Single scrollable page, no drill-down navigation. Time range selector (pill buttons) affecting all charts globally.

**Volume Recommendations:** Schoenfeld et al. + Renaissance Periodization research-backed ranges per muscle group. Color-coded zones: under MEV (red) → MEV-MAV (yellow) → MAV (green) → near MRV (orange) → over MRV (red).

**TOON Export:** encode() only, three scopes (last workout, current rotation, time range), clipboard + file download. ~30-60% fewer tokens than JSON.

**Exercise History Bug:** Plan deletion orphans history — need to trace plan_id filtering in SQL queries and ensure non-gym-specific exercises retain history regardless of plan lifecycle.

---

## Top Pitfalls to Watch

1. **Time range threading** — Must audit ALL analytics SQL for hardcoded 4-week windows. One missed query = confusing inconsistency.
2. **DuckDB + CSP** — Security audit must not break DuckDB-WASM (needs worker-src blob:, wasm-unsafe-eval).
3. **E2E flakiness** — DuckDB-WASM initialization races with Playwright assertions. Need ready-signal waits.
4. **Color cascade** — Changing OKLCH tokens can ripple unpredictably. Audit all usages before modifying.
5. **Demo data clearing** — Must preserve exercise/gym/plan events while clearing workout/set events only.

---

## Build Order Recommendation

1. Bug fix (exercise history) — data integrity first
2. Security audit — identify issues early
3. E2E tests — regression safety net before refactoring
4. Workouts UX + Color scheme — visual improvements
5. Analytics redesign + Time ranges + Volume recs — major feature cluster
6. Demo data UX + TOON export — feature extensions
7. PWA + Performance + README — deploy readiness
8. General polish — final sweep

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | One new dep, well-documented SDK |
| Features | HIGH | Clear requirements from user, standard patterns |
| Architecture | HIGH | Extends existing patterns, no new paradigms |
| Pitfalls | HIGH | Specific to this codebase and feature set |

**Remaining gaps:** None significant. Exercise history bug needs codebase investigation during planning.
