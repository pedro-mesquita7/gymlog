# GymLog Security Audit Report

**Date:** 2026-01-31
**Scope:** Full application security review (SEC-01, SEC-04, SEC-05)
**Auditor:** Automated scan + manual review
**Application:** GymLog -- client-side workout tracker (DuckDB-WASM + React)

---

## Executive Summary

GymLog is a client-side single-page application with no backend server, no authentication system, and no network API calls. All data is stored locally in the browser via DuckDB-WASM (IndexedDB) and localStorage. This architecture inherently eliminates many common web security attack vectors (SQL injection against remote DB, session hijacking, server-side request forgery, etc.).

**Overall finding: PASS** -- No secrets, API keys, PII, or sensitive data found in the codebase, git history, or client-side storage.

---

## Findings

### SEC-01: Secrets in Code & Git History

| Item | Status | Method | Result |
|------|--------|--------|--------|
| Git history scan | PASS | `git log -p --all` with regex for api_key, secret, password, token, private_key, auth patterns | No secrets found. Matches were limited to plan documents discussing security scanning methodology. |
| API key patterns | PASS | Regex scan for sk-, AIza, ghp_, AKIA prefixes across full source tree | No matches |
| Committed .env files | PASS | `git ls-files --cached \| grep .env` | No .env files in git history |
| Hardcoded credentials | PASS | Manual review of all source files | No hardcoded credentials exist. Application has no authentication system and makes no authenticated API calls. |

**Assessment:** The codebase contains zero secrets. The application architecture (fully client-side, no backend) means there are no API keys, database connection strings, or authentication tokens to leak.

### SEC-04: PII in Demo Data & Fixtures

| Item | Status | Method | Result |
|------|--------|--------|--------|
| Demo data content | PASS | Manual review of `src/db/demo-data.ts` | Contains only exercise names (Bench Press, Squat, etc.), numeric weights, reps, RIR values, and programmatically generated dates. No personal names, emails, phone numbers, or addresses. |
| Test fixtures | PASS | Grep for email, phone, address, @.com patterns | No matches in any source file |
| Real user data | N/A | Architecture review | App stores data only in browser. No server-side data collection exists. |

**Assessment:** Demo data is entirely synthetic workout data with no PII. The application collects no personally identifiable information by design.

### SEC-05: .gitignore Coverage

| Entry | Status | Previously Tracked |
|-------|--------|--------------------|
| `coverage/` | ADDED | No (already untracked) |
| `playwright-report/` | ADDED | No (already untracked) |
| `test-results/` | ADDED | No (already untracked) |
| `claude/` | ADDED | No (already untracked) |
| `dbt/.user.yml` | ADDED | No (already untracked) |
| `.env.*` | ADDED | No (already untracked) |
| `*.tgz` | ADDED | No (already untracked) |
| `.env` | OK | Already in .gitignore |
| `node_modules` | OK | Already in .gitignore |
| `dist/` | OK | Already in .gitignore |
| `dbt/target/` | OK | Already in .gitignore |
| `dbt/logs/` | OK | Already in .gitignore |

**Assessment:** All sensitive and generated file patterns are now covered. No previously tracked files required cache removal.

---

## localStorage Audit

All localStorage usage was reviewed. The application stores the following keys:

| Key | Store | Contents | Sensitive? |
|-----|-------|----------|------------|
| `gymlog-workout` | useWorkoutStore | Active workout session state (exercise IDs, sets, reps, weights) | No |
| `gymlog-rotations` | useRotationStore | Workout rotation/split configuration | No |
| `gymlog-progression-alerts` | useProgressionAlertStore | Dismissed progression alert IDs | No |
| `gymlog-backup` | useBackupStore | Backup metadata (timestamps, not actual data) | No |
| `gymlog-error-log` | FeatureErrorBoundary | Error boundary logs (component name, error message, timestamp) | No |
| `gymlog-volume-thresholds` | useVolumeThresholds | Per-muscle-group volume threshold settings | No |

**Assessment:** No secrets, tokens, or PII stored in localStorage. All keys contain workout-related application state only.

---

## Accepted Risks

| Risk | Severity | Justification |
|------|----------|---------------|
| npm audit: 2 moderate vulnerabilities (vite/esbuild) | Low | Dev-only dependencies. Not present in production bundle. Upstream fix pending. |
| No CSP headers | Moderate | Addressed separately in SEC-03 (Phase 12, Plan 04). Required for DuckDB-WASM worker-src and wasm-unsafe-eval. |
| Client-side data not encrypted at rest | Low | Browser-standard behavior. IndexedDB and localStorage are sandboxed per origin. No sensitive data stored. |

---

## Recommendations

1. **CSP Headers** (planned -- SEC-03): Add Content-Security-Policy meta tag with appropriate directives for DuckDB-WASM compatibility.
2. **npm audit monitoring**: Periodically review `npm audit` output for new vulnerabilities, especially when updating vite.
3. **Subresource Integrity**: If CDN-hosted assets are added in future, use SRI hashes.
4. **HTTPS enforcement**: Ensure deployment platform (GitHub Pages) serves over HTTPS only (currently the case).

---

## Methodology

- **Secret scanning:** Regex-based scan of full git history (`git log -p --all`) for common secret patterns (api_key, secret, password, token, private_key). Pattern-based scan for known API key formats (OpenAI sk-, Google AIza, GitHub ghp_, AWS AKIA).
- **PII review:** Manual inspection of demo data generator and grep for personal data patterns (email, phone, address).
- **localStorage audit:** Full grep of `src/` for all localStorage access patterns, mapping each to its store and documenting stored content.
- **.gitignore review:** Cross-reference `git status` untracked files against .gitignore entries, adding missing patterns.
