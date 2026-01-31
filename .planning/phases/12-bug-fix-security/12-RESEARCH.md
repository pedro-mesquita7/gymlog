# Phase 12: Bug Fix & Security Hardening - Research

**Researched:** 2026-01-31
**Domain:** Data integrity bugs, React error boundaries, web security (CSP, secrets scanning, npm audit)
**Confidence:** HIGH

## Summary

This phase addresses two bugs and five security requirements across an existing React + DuckDB-WASM fitness tracking app. The research focused on four areas: (1) tracing the exercise history bug to its root cause in SQL queries, (2) auditing error boundary coverage, (3) security posture assessment, and (4) CSP configuration compatible with DuckDB-WASM.

The exercise history bug (BUG-01) has been traced to a specific pattern: all analytics queries use `INNER JOIN exercise_dim` where `exercise_dim` filters out deleted exercises (`event_type != 'exercise_deleted'`). This means if an exercise is deleted and recreated, any historical sets logged against the old exercise_id become invisible. The fix is at the query layer -- change JOINs to use a broader exercise lookup that includes deleted exercises for historical context. The event-sourced architecture preserves all raw events, so no data migration is needed.

Error boundaries (BUG-02) exist at the top level (4 tab-level boundaries in App.tsx) but no sub-component boundaries exist within analytics charts, history views, or workout logging. Security posture is generally clean: no secrets found in source, no .env files, demo data has no PII. The main findings are: npm audit has 2 moderate vulnerabilities (vite/esbuild dev-only), .gitignore is missing `coverage/`, `playwright-report/`, `test-results/`, and `claude/` directories, and no CSP headers exist yet.

**Primary recommendation:** Fix BUG-01 by creating a `dim_exercise_all` (including deleted) for history JOINs, add sub-component error boundaries inside analytics, implement CSP via meta tag with DuckDB-WASM accommodations, and run gitleaks for git history scan.

## Standard Stack

### Core (Already in use)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-error-boundary | ^6.1.0 | Error boundary components | Already used, provides `ErrorBoundary` with `fallbackRender` and `resetErrorBoundary` |
| @duckdb/duckdb-wasm | 1.32.0 | Client-side SQL database | Core data layer, requires specific CSP accommodations |
| vite | ^5.4.10 | Build tool / dev server | Already configured with COOP/COEP headers for SharedArrayBuffer |

### Supporting (New for this phase)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| gitleaks | latest | Git history secret scanning | SEC-01: scan entire git history for exposed secrets |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| gitleaks | truffleHog | Both work; gitleaks is simpler to install via npx/binary, truffleHog needs Python |
| CSP meta tag | HTTP headers (nginx/Caddy) | Meta tag works for GitHub Pages now; HTTP headers needed for VPS later. Use meta tag now, document HTTP header equivalent for VPS migration |

**Installation:**
```bash
# gitleaks: download binary or use Docker
# No npm install needed -- this phase uses existing dependencies
# npm audit fix will update vite to fix moderate vulnerabilities
npm audit fix
```

## Architecture Patterns

### BUG-01: Exercise History Fix Pattern

The bug is in `compiled-queries.ts`. Five queries use `INNER JOIN exercise_dim` which excludes deleted exercises. The fix pattern:

**Current (broken):**
```
exercise_dim -> filters WHERE event_type != 'exercise_deleted'
   |
   INNER JOIN on exercise_id
   |
   Result: deleted exercises' history disappears
```

**Fixed:**
```
exercise_dim_all -> includes ALL exercises (including deleted, for historical lookups)
   |
   LEFT JOIN or INNER JOIN on exercise_id
   |
   Result: history persists regardless of exercise lifecycle
```

**Affected queries in `compiled-queries.ts`:**
1. `EXERCISE_HISTORY_SQL` (line 230) -- `JOIN exercise_dim e ON r.exercise_id = e.exercise_id`
2. `EXERCISE_PROGRESS_SQL` (line 299) -- `INNER JOIN exercise_dim e ON d.exercise_id = e.exercise_id`
3. `WEEKLY_COMPARISON_SQL` (line 358) -- `INNER JOIN exercise_dim e ON w.exercise_id = e.exercise_id`
4. `VOLUME_BY_MUSCLE_GROUP_SQL` (line 378) -- `INNER JOIN exercise_dim e ON fs.original_exercise_id = e.exercise_id`
5. `MUSCLE_HEAT_MAP_SQL` (line 409) -- `INNER JOIN exercise_dim e ON fs.original_exercise_id = e.exercise_id`

**Pattern:** Create `DIM_EXERCISE_ALL_SQL` that removes the `event_type != 'exercise_deleted'` filter. Use this for all history/analytics JOINs. Keep the original `DIM_EXERCISE_SQL` for the exercise list UI (which should only show active exercises).

Additionally, the `useHistory.ts` hook has gym-context filtering (line 63: `rows.filter(row => row.matches_gym_context)`). This is correct behavior for gym-scoped exercises but verify it does not inadvertently hide global exercise history.

### BUG-02: Error Boundary Audit Pattern

**Current coverage (App.tsx lines 224-241):**
- Settings tab -- has `FeatureErrorBoundary`
- Analytics tab -- has `FeatureErrorBoundary`
- Workouts tab -- has `FeatureErrorBoundary`
- Templates tab -- has `FeatureErrorBoundary`

**Missing sub-component boundaries (analytics has ~7 independent chart/card components):**
- `ExerciseProgressChart` -- no boundary (chart crash takes down entire Analytics tab)
- `WeekComparisonCard` -- no boundary
- `PRListCard` -- no boundary
- `VolumeBarChart` -- no boundary
- `VolumeZoneIndicator` -- no boundary
- `MuscleHeatMap` -- no boundary
- `ProgressionDashboard` -- no boundary
- `ExerciseHistory` (history tab) -- no boundary
- `PRList` (history) -- no boundary
- `ActiveWorkout` / `SetLogger` -- no boundary

**Pattern:** Wrap each independent feature section in `FeatureErrorBoundary` so one chart failing does not collapse the entire page. The existing `FeatureErrorBoundary` and `ErrorCard` components are already well-built with retry and expandable details.

### CSP Implementation Pattern

**Recommended: HTML meta tag approach (works for GitHub Pages + future VPS)**

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'wasm-unsafe-eval';
  worker-src 'self' blob:;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob:;
  connect-src 'self';
  font-src 'self';
">
```

Key directives for DuckDB-WASM:
- `script-src 'wasm-unsafe-eval'` -- allows WASM compilation without enabling JS eval
- `worker-src blob:` -- DuckDB-WASM creates Web Workers from blob URLs
- `style-src 'unsafe-inline'` -- Tailwind CSS injects inline styles

**For future VPS (nginx), equivalent:**
```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; font-src 'self';";
```

**Note:** The app already uses `coi-serviceworker` (referenced in `index.html`) for COOP/COEP headers on GitHub Pages. CSP is additive to this.

### Anti-Patterns to Avoid
- **Using `unsafe-eval` instead of `wasm-unsafe-eval`:** `unsafe-eval` allows JS eval which is a real security risk. `wasm-unsafe-eval` only allows WASM compilation.
- **Removing the exercise_deleted filter globally:** The active exercise list (`DIM_EXERCISE_SQL`) should still filter out deleted exercises. Only history/analytics queries need the "all exercises" dimension.
- **Adding error boundaries too deep:** Don't wrap every tiny component. Wrap at the feature-section level (each chart, each card) not at every div.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Secret scanning | Custom regex scanner | gitleaks (binary) | Handles 700+ patterns, entropy scanning, git history traversal |
| Error boundaries | Custom class component | react-error-boundary | Already in use, handles reset, logging, fallback rendering |
| npm vulnerability scanning | Manual review | `npm audit` | Built-in, authoritative, knows dependency tree |
| CSP header generation | String concatenation | Static meta tag | CSP is a well-defined spec, just write it once correctly |

**Key insight:** This phase is about auditing and fixing, not building new infrastructure. The tools and patterns already exist in the codebase or as standard CLI tools.

## Common Pitfalls

### Pitfall 1: Breaking Active Exercise List While Fixing History
**What goes wrong:** Removing the `event_type != 'exercise_deleted'` filter from `DIM_EXERCISE_SQL` causes deleted exercises to appear in the exercise management UI.
**Why it happens:** The same dimension is used for both "show active exercises" and "join history to exercise metadata."
**How to avoid:** Create a separate `DIM_EXERCISE_ALL_SQL` for history JOINs. Keep `DIM_EXERCISE_SQL` unchanged for the exercise list.
**Warning signs:** Deleted exercises reappearing in dropdown selectors or exercise list after the fix.

### Pitfall 2: CSP Breaking DuckDB-WASM Workers
**What goes wrong:** Setting CSP too restrictively blocks the blob: worker creation that DuckDB-WASM relies on.
**Why it happens:** Forgetting `worker-src blob:` or `script-src 'wasm-unsafe-eval'`.
**How to avoid:** Test CSP in dev before deploying. Add CSP to index.html and verify DuckDB still initializes.
**Warning signs:** Console errors about blocked worker creation or WASM compilation failures.

### Pitfall 3: npm audit fix Breaking Dependencies
**What goes wrong:** Running `npm audit fix` upgrades vite to a version with breaking changes.
**Why it happens:** The current vulnerabilities are in vite 5.4.10; fix may jump to 5.4.18+ or even 6.x.
**How to avoid:** Run `npm audit fix` (not `--force`). Review what it changes. Test the build after.
**Warning signs:** Build failures, dev server not starting, or HMR breaking after audit fix.

### Pitfall 4: Missing .gitignore Entries After Adding Them
**What goes wrong:** Adding entries to .gitignore but not removing already-tracked files from git.
**Why it happens:** .gitignore only affects untracked files. If coverage/ was already committed, adding it to .gitignore won't remove it.
**How to avoid:** After updating .gitignore, run `git rm -r --cached <path>` for any previously tracked files.
**Warning signs:** `git status` still showing tracked files in directories that should be ignored.

### Pitfall 5: CSP Meta Tag Limitations
**What goes wrong:** Some CSP directives don't work in meta tags (e.g., `frame-ancestors`, `report-uri`).
**Why it happens:** The HTML spec limits which CSP directives can appear in meta tags.
**How to avoid:** For this app, the needed directives (`script-src`, `worker-src`, `style-src`, `default-src`, etc.) all work fine in meta tags. Document the HTTP header equivalent for future VPS migration.
**Warning signs:** Browser ignoring certain directives silently.

## Code Examples

### BUG-01 Fix: DIM_EXERCISE_ALL_SQL
```typescript
// Source: Derived from existing DIM_EXERCISE_SQL in compiled-queries.ts

// New: includes deleted exercises for historical lookups
export const DIM_EXERCISE_ALL_SQL = `
WITH all_exercise_events AS (
    SELECT
        _event_id,
        _created_at,
        event_type,
        payload->>'exercise_id' AS exercise_id,
        payload->>'name' AS name,
        payload->>'muscle_group' AS muscle_group,
        CAST(payload->>'is_global' AS BOOLEAN) AS is_global
    FROM events
    WHERE event_type IN ('exercise_created', 'exercise_updated', 'exercise_deleted')
),

deduplicated AS (
    SELECT
        *,
        ROW_NUMBER() OVER (
            PARTITION BY exercise_id
            ORDER BY _created_at DESC
        ) AS _rn
    FROM all_exercise_events
)

SELECT
    exercise_id,
    name,
    muscle_group,
    is_global,
    event_type,  -- Expose so consumers know if exercise is deleted
    _created_at AS last_updated_at
FROM deduplicated
WHERE _rn = 1
  -- Include ALL exercises (active + deleted) for historical JOINs
  -- Deleted exercises still have name/muscle_group from their last update
ORDER BY name
`;
```

### BUG-01 Fix: Updated EXERCISE_HISTORY_SQL Pattern
```typescript
// Replace exercise_dim with exercise_dim_all in history queries
// Before:
// JOIN exercise_dim e ON r.exercise_id = e.exercise_id
// After:
// JOIN exercise_dim_all e ON r.exercise_id = e.exercise_id

// For history queries, deleted exercises should still show their name/metadata
// from their last state before deletion
```

### BUG-02: Sub-component Error Boundary Usage
```typescript
// Source: Existing pattern in FeatureErrorBoundary.tsx
// Wrap each analytics section independently:

<CollapsibleSection title="Progress (Last 4 Weeks)" defaultOpen={true}>
  <FeatureErrorBoundary feature="Progress Chart">
    {/* chart content */}
  </FeatureErrorBoundary>
</CollapsibleSection>

<CollapsibleSection title="Training Balance Heat Map" defaultOpen={true}>
  <FeatureErrorBoundary feature="Muscle Heat Map">
    {/* heat map content */}
  </FeatureErrorBoundary>
</CollapsibleSection>
```

### SEC-03: CSP Meta Tag
```html
<!-- Add to index.html <head> before other scripts -->
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; font-src 'self';">
```

### SEC-01: gitleaks Scan
```bash
# Install and run gitleaks
# Option A: npx (if available)
npx gitleaks detect --source . --verbose

# Option B: Docker
docker run -v $(pwd):/path ghcr.io/gitleaks/gitleaks:latest detect --source /path --verbose

# Option C: Direct binary
curl -sSfL https://github.com/gitleaks/gitleaks/releases/latest/download/gitleaks_8.x.x_linux_x64.tar.gz | tar xz
./gitleaks detect --source . --verbose
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `unsafe-eval` for WASM | `wasm-unsafe-eval` | 2023, widespread browser support | Safer CSP that only allows WASM, not JS eval |
| Single app-level ErrorBoundary | Per-feature granular boundaries | react-error-boundary v4+ | One component failing doesn't crash the entire app |
| Manual secret scanning | gitleaks / truffleHog automated scanning | 2022+ | Catches patterns humans miss, scans full git history |

## Codebase Investigation Findings

### BUG-01: Root Cause Trace (HIGH confidence)

**Full data path:**
1. User logs sets -> `set_logged` events stored in `events` table
2. `FACT_SETS_SQL` reads from `events` table directly (no exercise JOIN) -- sets data is safe
3. `EXERCISE_HISTORY_SQL` JOINs `FACT_SETS_SQL` with `exercise_dim` using `INNER JOIN`
4. `exercise_dim` = `DIM_EXERCISE_SQL` which has `WHERE event_type != 'exercise_deleted'`
5. If exercise is deleted, the JOIN fails -> history rows disappear

**Additional affected queries:** `EXERCISE_PROGRESS_SQL`, `WEEKLY_COMPARISON_SQL`, `VOLUME_BY_MUSCLE_GROUP_SQL`, `MUSCLE_HEAT_MAP_SQL` -- all use the same `exercise_dim` with INNER JOIN.

**The context says "plan deletion" hides history, but there is no `plan_id` anywhere in the codebase.** The actual bug mechanism is exercise deletion (not plan deletion). If a user deletes a template/plan, exercises themselves are not deleted -- they persist independently. So the bug may specifically occur when a user deletes and recreates exercises (not plans). The planner should verify this interpretation with the user if unclear.

**Alternative hypothesis:** The "plan" the user refers to might be a workout template. If a template is deleted and recreated with new exercise IDs, the `original_exercise_id` field in `set_logged` events would point to old exercise IDs that now don't exist in `dim_exercise`. This is the same INNER JOIN filtering issue but triggered by template recreation rather than exercise deletion.

### BUG-02: Error Boundary Coverage (HIGH confidence)

**Current state:**
- 4 top-level boundaries in App.tsx (Settings, Analytics, Workouts, Templates)
- `FeatureErrorBoundary` component is well-implemented with logging to localStorage
- `ErrorCard` component has expandable details and retry button (matches CONTEXT.md requirements)
- No sub-component boundaries inside Analytics (7+ independent chart components)
- No boundaries in workout logging flow (ActiveWorkout, SetLogger, SetGrid)
- No boundaries in history views (ExerciseHistory, PRList)

### SEC-01: Secrets Assessment (HIGH confidence)

- No `.env` files exist in the repo
- `.gitignore` covers `.env` (line 14)
- No API keys, secrets, tokens, or passwords found in source code (grep confirmed)
- localStorage stores only workout data, error logs, and UI state (rotation, backup, volume thresholds, progression alerts) -- no secrets
- `coi-serviceworker.js` in `public/` is a standard open-source library
- Full git history scan still recommended (gitleaks) for completeness

### SEC-02: npm Audit (HIGH confidence)

- 2 moderate vulnerabilities: esbuild <= 0.24.2 and vite <= 6.1.6
- Both are dev-only dependencies (not in production bundle)
- Fix available via `npm audit fix`
- No high or critical vulnerabilities
- Per CONTEXT.md threshold (high + critical only), these moderate issues can be documented as accepted risk, OR fixed opportunistically since `npm audit fix` is available

### SEC-04: Demo Data PII Assessment (HIGH confidence)

- Demo data in `src/db/demo-data.ts` uses only:
  - Generic gym name: "Iron Works Gym" with location "Downtown"
  - Standard exercise names: "Bench Press", "Squat", etc.
  - Generated UUIDs for all IDs
  - Synthetic weight/rep data
- No personal names, emails, phone numbers, addresses, or other PII
- No test fixtures with real user data found

### SEC-05: .gitignore Coverage (HIGH confidence)

**Currently covered:** `node_modules`, `dist`, `.env`, `dbt/target/`, `dbt/logs/`, `dbt/dbt_packages/`, editor files

**Missing (should be added):**
- `coverage/` -- test coverage reports (currently untracked, 15+ files visible)
- `playwright-report/` -- E2E test reports (currently untracked)
- `test-results/` -- test output (currently untracked)
- `claude/` -- Claude Code agent cache (currently untracked)
- `dbt/.user.yml` -- dbt user-specific config (currently untracked)
- `.env.*` -- variant env files (`.env.local`, `.env.production`, etc.)
- `*.tgz` -- npm pack output

## Open Questions

1. **What exactly triggers BUG-01 in user workflow?**
   - What we know: The INNER JOIN with exercise_dim definitely hides deleted exercise history
   - What's unclear: The CONTEXT.md says "plan deletion" but there is no plan_id concept. Does the user mean template deletion? Or exercise deletion triggered by some UI flow?
   - Recommendation: Fix the JOIN issue regardless (it's clearly wrong for history queries). Also verify that template deletion does NOT cascade to exercise deletion. The current code shows `exercise_deleted` events are separate from `template_deleted` events.

2. **CSP and coi-serviceworker compatibility**
   - What we know: The app uses `coi-serviceworker.js` for COOP/COEP on GitHub Pages
   - What's unclear: Whether CSP meta tag interacts with the service worker's header injection
   - Recommendation: Test CSP meta tag with coi-serviceworker in dev. The service worker adds COOP/COEP headers; CSP is orthogonal and should not conflict.

## Sources

### Primary (HIGH confidence)
- Codebase investigation: `src/db/compiled-queries.ts` -- all 5 affected queries identified
- Codebase investigation: `src/App.tsx` -- 4 tab-level error boundaries confirmed
- Codebase investigation: `src/components/ui/FeatureErrorBoundary.tsx` -- implementation verified
- Codebase investigation: `.gitignore` -- current coverage assessed
- Codebase investigation: `src/db/demo-data.ts` -- no PII confirmed
- `npm audit` output -- 2 moderate, 0 high/critical

### Secondary (MEDIUM confidence)
- [MDN: Content-Security-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy) -- CSP directive reference
- [MDN: script-src wasm-unsafe-eval](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/script-src) -- WASM CSP documentation
- [WebAssembly CSP Proposal](https://github.com/WebAssembly/content-security-policy/blob/main/proposals/CSP.md) -- wasm-unsafe-eval standardization

### Tertiary (LOW confidence)
- [DuckDB-WASM CORS Discussion #419](https://github.com/duckdb/duckdb-wasm/discussions/419) -- worker blob: URL pattern

## Metadata

**Confidence breakdown:**
- BUG-01 root cause: HIGH -- traced through actual source code, all 5 affected queries identified
- BUG-02 audit: HIGH -- grep confirmed all current usages, missing boundaries identified
- Security posture: HIGH -- direct codebase investigation, npm audit output
- CSP configuration: MEDIUM -- standard CSP directives verified via MDN, but DuckDB-WASM specific combo not tested
- .gitignore gaps: HIGH -- compared against actual untracked files

**Research date:** 2026-01-31
**Valid until:** 2026-03-01 (stable domain, no fast-moving dependencies)
