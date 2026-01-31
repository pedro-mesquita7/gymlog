# Phase 12: Bug Fix & Security Hardening - Context

**Gathered:** 2026-01-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix exercise history data integrity bug (BUG-01), audit error boundary coverage (BUG-02), and complete security hardening (SEC-01 through SEC-05). No new features — this phase makes existing functionality trustworthy and secure.

</domain>

<decisions>
## Implementation Decisions

### History bug behavior
- All exercise history stays with the exercise, not the plan — plan deletion never hides workout data
- Gym-specific exercises: if the gym is deleted, history for that gym is deleted. But if the same exercise has data at a different gym, that history remains
- Global (non-gym-specific) exercises: history always persists regardless of plan lifecycle
- When a plan is recreated with the same exercises, all historical data from previous plans appears seamlessly — full continuity
- Fix retroactively — since event sourcing preserves raw events, fixing the query layer should automatically resurface any previously hidden history. No migration needed.

### Error boundary coverage
- Per-feature error boundaries (granular) — one chart failing doesn't take down the whole page
- Inline error card replaces the broken component (not toast, not page-level)
- Error card shows user-friendly message with expandable "Show details" section (error message, stack trace) — good for portfolio audience (shows engineering quality)
- Recovery action: "Try Again" retry button that re-renders the failed component

### CSP and DuckDB-WASM compatibility
- Claude's Discretion on implementation approach (meta tag vs HTTP headers vs document-only)
- VPS hosting might happen in v1.3 — prepare CSP as HTTP headers (nginx/Caddy config) rather than just meta tags
- If CSP breaks DuckDB-WASM: Claude decides the pragmatic fallback (partial CSP, document-only, etc.)
- DuckDB-WASM requirements to accommodate: worker-src blob:, wasm-unsafe-eval

### Security audit scope
- Workout data stored locally is fine — no PII concern for local-only data
- Focus on: secrets/keys in code, .env handling, demo data content
- Full git history scan for exposed secrets (use gitleaks or truffleHog)
- npm audit threshold: fix high + critical only, document moderate/low as accepted risk
- Written security audit report: SECURITY-AUDIT.md documenting what was checked, findings, and remediation — portfolio-worthy artifact
- .gitignore coverage: verify all sensitive and generated files are covered

</decisions>

<specifics>
## Specific Ideas

- User might deploy to VPS (not just GitHub Pages) — CSP solution should work for both targets
- Security report should be a portfolio artifact demonstrating security awareness
- History bug is likely a plan_id filter in SQL queries — fix at query layer, not event layer

</specifics>

<deferred>
## Deferred Ideas

- VPS hosting migration — might happen in Phase 17 (deploy readiness) or post-v1.3

</deferred>

---

*Phase: 12-bug-fix-security*
*Context gathered: 2026-01-31*
