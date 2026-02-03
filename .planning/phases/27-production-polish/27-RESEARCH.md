# Phase 27: Production Polish - Research

**Researched:** 2026-02-03
**Domain:** Codebase cleanup, README rewrite, E2E testing, release verification
**Confidence:** HIGH

## Summary

This phase covers four distinct workstreams for the v1.5 release: (1) README rewrite targeting portfolio reviewers, (2) dead code removal across the codebase, (3) E2E test fixes and new coverage, and (4) version bump with build verification. The codebase uses a well-established stack (React 19, TypeScript 5.9, Vite 5, Playwright 1.58, Vitest 4) that is already fully configured -- this phase involves no new library additions, only cleanup and documentation.

Research focused on: the existing E2E test infrastructure and patterns (Playwright with custom fixtures), dead code detection methodology, README best practices for portfolio projects, and the current codebase structure to identify cleanup targets. The existing test framework is Playwright with tests in `src/e2e/`, using a custom fixture (`appPage`) that navigates and waits for DuckDB initialization, plus seed helpers for creating test data.

**Primary recommendation:** Use `npx knip` for automated dead code detection to complement manual analysis, follow the existing Playwright fixture/selector/seed patterns for new E2E tests, and use Mermaid (already in the README) for architecture diagrams since GitHub renders them natively.

## Standard Stack

This phase uses the existing project stack -- no new libraries needed.

### Core (Already Installed)
| Library | Version | Purpose | Role in This Phase |
|---------|---------|---------|-------------------|
| @playwright/test | ^1.58.1 | E2E browser testing | Fix broken tests, add new coverage |
| typescript | ~5.9.3 | Type checking | Strict build verification |
| vite | ^5.4.10 | Build tool | Production build check |

### Supporting (Already Installed)
| Library | Version | Purpose | Role in This Phase |
|---------|---------|---------|-------------------|
| vitest | ^4.0.18 | Unit testing | Verify no regressions after dead code removal |
| eslint | ^9.39.1 | Linting | Verify clean lint after cleanup |

### Recommended Addition (Dev Only)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| knip | latest | Dead code detection | One-time `npx knip` run to find unused exports, files, dependencies |

Knip does NOT need to be installed as a dependency. Run it as `npx knip` for a one-time scan. It has built-in plugins for Vite, Vitest, Playwright, React, and TypeScript -- all of which this project uses.

**No installation needed** -- all tools are already in the project or available via npx.

## Architecture Patterns

### Existing E2E Test Structure
```
src/e2e/
  fixtures/
    app.fixture.ts      # Custom Playwright fixture with appPage, waitForApp, clearAllData, loadDemoData
  helpers/
    selectors.ts        # SEL constant with data-testid selectors, setRow() dynamic helper
    seed.ts             # createGym(), createExercise(), logSet() helpers
  batch-logging.spec.ts  # Batch logging edge cases
  demo-data.spec.ts      # Demo data import/clear
  parquet-roundtrip.spec.ts # Parquet export/import
  plan-crud.spec.ts      # Plan CRUD + exercise history preservation
  workout-rotation.spec.ts # Quick Start + rotation advancement
```

### Pattern 1: E2E Test File Convention
**What:** Each spec file imports from the custom fixture, uses SEL selectors, and follows a describe/test structure.
**When to use:** All new E2E test files.
**Example:**
```typescript
// Source: Existing codebase pattern from src/e2e/batch-logging.spec.ts
import { test, expect, loadDemoData, clearAllData } from './fixtures/app.fixture';
import { SEL } from './helpers/selectors';
import { logSet } from './helpers/seed';

test.describe('Feature Name', () => {
  test('specific behavior', async ({ appPage: page }) => {
    await loadDemoData(page);
    // Test against demo data
    await page.click(SEL.navWorkouts);
    // assertions...
  });
});
```

### Pattern 2: Selector-Driven Test Design
**What:** All element targeting uses `data-testid` attributes via the `SEL` constant. Dynamic selectors use helper functions.
**When to use:** Any new UI interaction in tests.
**Key rule:** If a new component needs E2E testing, add its `data-testid` to the component first, then add the selector to `SEL` in `helpers/selectors.ts`.

### Pattern 3: Demo Data for Test Isolation
**What:** Tests that need data use `loadDemoData(page)` which seeds 3 months of realistic workout history. Tests needing clean state use `clearAllData(page)`.
**When to use:** Notes and warmup E2E tests should use demo data (per user decision: "Tests run against demo/seed data, not own fixtures").

### Pattern 4: Serial vs Parallel Tests
**What:** Most tests use isolated `appPage` fixture. Tests that need state across steps use `test.describe.serial()` with a shared context (see `workout-rotation.spec.ts`).
**When to use:** Notes test may need serial if testing note persistence across sessions. Warmup can be parallel since it reads from existing data.

### Anti-Patterns to Avoid
- **Hardcoded selectors:** Never use CSS classes or element text for targeting. Always use `data-testid`.
- **Creating own fixtures in spec files:** Reuse the `app.fixture.ts` pattern. Only the rotation test uses a custom setup, and it has specific reasons (shared browser context).
- **Waiting with `page.waitForTimeout()`:** Use proper selectors/conditions. The few existing uses are acceptable for animation delays.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Dead code detection | Manual grep for unused exports | `npx knip` | Knip understands module graphs, TypeScript, and has plugins for Vite/Vitest/Playwright. Manual search will miss deeply referenced but unused code. |
| Architecture diagrams | SVG/PNG images | Mermaid in Markdown | GitHub renders Mermaid natively. Already used in current README. Easy to update with code changes. |
| GIF recording | Manual screen recording | Dedicated tool (see discretion section) | Consistent sizing and compression matter for README load time |
| Unused dependency detection | Manual `package.json` audit | `npx knip` (covers deps too) | Knip checks both unused exports AND unused npm dependencies |

**Key insight:** The dead code task seems simple ("just find and delete unused code") but the codebase has multiple module systems (components, hooks, utils, types, stores, services, dbt models) with cross-references. Automated tooling catches what manual review misses.

## Common Pitfalls

### Pitfall 1: Removing Code That Is Dynamically Imported
**What goes wrong:** Deleting files that appear unused but are loaded via `React.lazy()` or dynamic `import()`.
**Why it happens:** Static analysis tools sometimes miss dynamic imports. The project uses `React.lazy()` for `AnalyticsPage`.
**How to avoid:** Run `npx knip` first (it understands React.lazy). Then run full build (`npm run build`) and E2E tests after any deletion.
**Warning signs:** Build errors or runtime white screens after cleanup.

### Pitfall 2: E2E Tests Failing Due to DuckDB Initialization Timing
**What goes wrong:** Tests fail with timeouts because DuckDB-WASM takes several seconds to initialize on first load.
**Why it happens:** The WASM binary is ~9MB and OPFS initialization is async. SharedArrayBuffer requires specific browser flags.
**How to avoid:** Always use `waitForApp(page)` (waits for nav to render, indicating DuckDB is ready). The Playwright config already sets `timeout: 60_000` and enables SharedArrayBuffer via launch args.
**Warning signs:** Flaky timeouts on first test in a suite.

### Pitfall 3: Stale Selectors After UI Changes
**What goes wrong:** Existing E2E tests break because the UI changed in phases 22-26 but test selectors were not updated.
**Why it happens:** Phases 22-26 restructured settings, analytics, and workout logging. Test selectors may reference old UI structures.
**How to avoid:** Audit every `SEL` entry against the current rendered UI before writing new tests. Fix broken tests before adding new ones.
**Warning signs:** `TimeoutError: waiting for selector` in test output.

### Pitfall 4: README Stale References to Removed Features
**What goes wrong:** README mentions comparison, progression dashboard, plateau detection (removed in phases 22-23).
**Why it happens:** The current README was written for v1.4 and still references these features.
**How to avoid:** Search README for every mention of: "comparison", "progression", "plateau", "regression detection". Remove or replace all.
**Warning signs:** Current README line 48: "SQL-based plateau and regression detection with progression dashboard" -- this must go.

### Pitfall 5: Version Bump Breaks Nothing, But Misses package-lock.json
**What goes wrong:** Version bumped in package.json but package-lock.json still shows old version.
**How to avoid:** After changing version in `package.json`, run `npm install` to update `package-lock.json`.
**Warning signs:** `npm ci` in CI fails or `package-lock.json` shows different version.

### Pitfall 6: Removing ToonExportSection Breaks Settings Page
**What goes wrong:** ToonExportSection is imported in the settings page and removing the file causes a build error.
**Why it happens:** Decision d24-02-02 kept ToonExportSection, but Phase 27 decision explicitly overrides this: "Remove ToonExportSection."
**How to avoid:** Remove both the file AND its import in the parent component. Check the settings page component for the import.
**Warning signs:** Build error after deletion.

## Code Examples

### New E2E Test: Notes Feature
```typescript
// Pattern for testing notes during workout
import { test, expect, loadDemoData } from './fixtures/app.fixture';
import { SEL } from './helpers/selectors';

test.describe('Exercise Notes', () => {
  test('can add a note during workout', async ({ appPage: page }) => {
    await loadDemoData(page);
    // Start workout via Quick Start (demo data has rotation set up)
    await page.click(SEL.navWorkouts);
    await page.click(SEL.btnQuickStart);
    await page.waitForSelector(SEL.btnFinishWorkout, { timeout: 10_000 });

    // Notes component should be present -- needs data-testid added
    // Look for "Add note" button/link
    // Expand, type note, verify it persists
  });
});
```

### New E2E Test: Warmup Feature
```typescript
// Pattern for testing warmup display
import { test, expect, loadDemoData } from './fixtures/app.fixture';
import { SEL } from './helpers/selectors';

test.describe('Warmup Hints', () => {
  test('shows warmup suggestions during workout', async ({ appPage: page }) => {
    await loadDemoData(page);
    await page.click(SEL.navWorkouts);
    await page.click(SEL.btnQuickStart);
    await page.waitForSelector(SEL.btnFinishWorkout, { timeout: 10_000 });

    // Warmup button should be visible for weighted exercises
    // Click to expand, verify warmup set calculations appear
  });
});
```

### Dead Code Detection with Knip
```bash
# Run from project root -- no installation needed
npx knip

# For more verbose output showing file-level detail:
npx knip --reporter compact

# To check only unused dependencies:
npx knip --include dependencies
```

### Build Verification Script
```bash
# Full build check sequence
npm run build 2>&1 | tee build-output.txt
# Check for TypeScript errors
tsc -b --noEmit 2>&1
# Check for ESLint issues
npm run lint
# Check bundle size (Vite outputs sizes after build)
```

### Version Bump
```bash
# In package.json, change: "version": "0.0.0" -> "version": "1.5.0"
# Then sync lock file:
npm install
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| ts-prune for dead code | Knip (ts-prune is in maintenance mode) | 2023+ | Knip detects files, exports, AND dependencies |
| PNG/SVG architecture diagrams | Mermaid in Markdown (GitHub native) | 2022+ | No image files to maintain, version-controlled as text |
| Manual README GIF creation | Automated screen recording tools | Ongoing | Consistent quality and sizing |

**Current project version:** `0.0.0` (needs bump to `1.5.0`)

**Deprecated/outdated in current README:**
- References to "SQL-based plateau and regression detection with progression dashboard" (removed in v1.5)
- References to "comparison" features (removed in v1.5)
- Missing mentions of: Exercise Notes, Warmup System, Week-over-week comparison subtitles
- "vw_progression_status" and "vw_weekly_comparison" in data lineage diagram may need verification

## Discretion Recommendations

### Architecture Diagram Format
**Recommendation:** Keep Mermaid (already in README, GitHub renders natively). Update the existing flowchart to reflect v1.5 data flow including notes and warmup. The current diagram is good but references removed analytics views.

### GIF Capture Approach
**Recommendation:** Use a browser-based approach since the app runs locally:
1. Use Chrome DevTools device toolbar for consistent viewport (375x667 iPhone SE)
2. Record with any screen recorder at the consistent viewport
3. Convert to GIF with optimization (aim for <2MB per GIF)
4. **Which screens to demo:** (a) Starting a workout via Quick Start, (b) Logging sets with ghost data + adding a note, (c) Analytics dashboard with charts, (d) Settings page showing warmup config

Note: GIF creation requires manual interaction and cannot be automated in a plan task. The plan should include placeholder image references that can be filled in manually.

### Dead Code Detection Methodology
**Recommendation:** Two-pass approach:
1. **Automated pass:** Run `npx knip` to get a comprehensive list of unused files, exports, and dependencies
2. **Manual verification:** Review knip output against the known removal targets (comparison/progression/plateau code, ToonExportSection, any orphans)
3. **Build verification:** `npm run build` + `tsc -b` after each batch of removals

### E2E Test Organization
**Recommendation:** Two new spec files following existing naming convention:
- `src/e2e/notes.spec.ts` -- Exercise notes CRUD during workout
- `src/e2e/warmup.spec.ts` -- Warmup hint display and settings

Keep the pattern of one feature per spec file. Add necessary `data-testid` attributes to components that lack them (ExerciseNote, WarmupHint, WarmupTierEditor).

New selectors needed in `helpers/selectors.ts`:
- `noteToggle`, `noteInput`, `noteHistory` -- for ExerciseNote component
- `warmupToggle`, `warmupContent` -- for WarmupHint component
- `warmupTierEditor` -- for settings warmup configuration

### Bundle Size Thresholds
**Recommendation:** No hard threshold, but document the current bundle size before and after dead code removal. The existing Vite config has `chunkSizeWarningLimit: 1000` (1MB). Build output will show chunk sizes. Document total gzip size in build verification.

## Open Questions

1. **Which specific files will knip flag as dead code?**
   - What we know: ToonExportSection is confirmed dead. Comparison/progression/plateau code was removed in phases 22-23 but remnants may exist in types or hooks.
   - What's unclear: Exact list of orphan files -- knip must be run to discover.
   - Recommendation: Run knip as first task, then plan removals based on output.

2. **Are existing E2E tests currently passing?**
   - What we know: UI changed significantly in phases 22-26 (settings restructured, analytics simplified, new features added). Selector patterns may be stale.
   - What's unclear: Which specific tests are broken.
   - Recommendation: Run `npm run test:e2e` as first E2E task to identify failures before writing new tests.

3. **GIF creation tooling**
   - What we know: GIFs need to be <2MB, show workflow demos, and be placed in a docs/ directory.
   - What's unclear: Whether an automated approach is feasible or if manual recording is required.
   - Recommendation: Plan should include creating placeholder references in README. Actual GIF capture may need to happen manually outside the plan.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `src/e2e/` directory -- all 5 existing spec files, fixtures, helpers
- Codebase analysis: `package.json` -- current versions of all dependencies
- Codebase analysis: `playwright.config.ts` -- test configuration (testDir, timeouts, webServer)
- Codebase analysis: `tsconfig.app.json` -- strict mode enabled, noUnusedLocals, noUnusedParameters
- Codebase analysis: `README.md` -- current state with stale v1.4 references
- Codebase analysis: `vite.config.ts` -- build configuration and chunk splitting

### Secondary (MEDIUM confidence)
- [GitHub Docs: Creating diagrams](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/creating-diagrams) -- Mermaid native rendering
- [Knip official site](https://knip.dev) -- Dead code detection tool
- [Effective TypeScript: Use knip](https://effectivetypescript.com/2023/07/29/knip/) -- Knip recommendation over ts-prune

### Tertiary (LOW confidence)
- GIF optimization tooling recommendations (based on general knowledge, not verified against specific tools)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- All tools are already in the project, versions verified from package.json
- Architecture (E2E patterns): HIGH -- Directly read and analyzed all 5 existing spec files plus fixtures/helpers
- Dead code detection: HIGH -- Knip is well-documented, industry standard, verified via multiple sources
- README content: HIGH -- Read current README, identified exact lines that need updating
- GIF creation: LOW -- No specific tool verified, general recommendations only
- Pitfalls: HIGH -- Derived from direct codebase analysis and known phase history

**Research date:** 2026-02-03
**Valid until:** 2026-03-03 (stable -- no fast-moving dependencies in this phase)
