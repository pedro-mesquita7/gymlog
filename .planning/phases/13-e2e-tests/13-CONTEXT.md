# Phase 13: E2E Test Suite - Context

**Gathered:** 2026-01-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Playwright E2E tests covering 5 critical user workflows as regression safety net. Tests validate the exercise history bug fix (Phase 12), batch logging, workout rotation, demo data import/export, and Parquet round-trip. No new features -- pure test coverage.

</domain>

<decisions>
## Implementation Decisions

### Test data strategy
- Seed data via `page.evaluate()` injecting events directly into DuckDB -- faster than UI-based seeding
- Reuse browser context between tests, clear OPFS/localStorage between tests for speed
- Use the existing Import Demo Data button as a seeding shortcut for tests that need populated analytics/charts data
- For workflow-specific tests (plan CRUD, rotation), seed only the specific data needed via JS injection

### Test scope & coverage
- Cover all 5 success criteria as primary test cases
- Include key edge cases beyond the 5 criteria (empty states, max values, error recovery paths)
- Assertion depth: smoke-level for happy paths, detailed assertions for data integrity tests (export/import round-trip, history persistence after deletion)
- Chromium only -- DuckDB-WASM + OPFS has best support there
- Desktop viewport only -- mobile viewport testing deferred to Phase 17 (PWA)

### Failure handling & flakiness
- Screenshots captured on test failure, stored in test-results/

### Claude's Discretion
- DuckDB-WASM initialization wait strategy (app-ready signal vs timeout)
- Flaky test retry policy (retries vs strict mode)
- Timeout thresholds for WASM operations
- Parquet file round-trip approach (download path vs in-memory blob interception)
- CI pipeline structure (same workflow vs separate, triggers, parallelism, reporting)

</decisions>

<specifics>
## Specific Ideas

No specific requirements -- open to standard Playwright patterns and best practices for WASM-based apps.

</specifics>

<deferred>
## Deferred Ideas

- Mobile viewport E2E tests -- Phase 17 (PWA)
- Cross-browser testing (Firefox, WebKit) -- revisit when DuckDB-WASM OPFS support broadens

</deferred>

---

*Phase: 13-e2e-tests*
*Context gathered: 2026-01-31*
