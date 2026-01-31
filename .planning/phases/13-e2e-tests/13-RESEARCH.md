# Phase 13: E2E Test Suite - Research

**Researched:** 2026-01-31
**Domain:** Playwright E2E testing for DuckDB-WASM + React SPA
**Confidence:** HIGH (all findings from direct codebase analysis)

## Summary

This research analyzes the GymLog codebase to document the exact UI flows, selectors, state management, and data patterns needed to write Playwright E2E tests for 5 critical user workflows. The app is a single-page React app with 4 bottom-nav tabs (Workouts, Templates, Analytics, Settings), persisting data in DuckDB-WASM via OPFS and Zustand stores via localStorage.

Key findings: (1) No `data-testid` attributes exist anywhere in the codebase -- tests must use text selectors, aria labels, and structural selectors. (2) Playwright is already configured with Chromium-only, SharedArrayBuffer enabled, and webServer pointing to Vite dev server. (3) DuckDB readiness can be detected by waiting for the "Loading..." text to disappear from the app shell. (4) Both `clearAllData()` and `loadDemoData()` call `window.location.reload()`, which means tests must handle page navigation after these operations. (5) Data seeding via `page.evaluate()` can access DuckDB through the module system but requires the DB to be initialized first.

**Primary recommendation:** Add strategic `data-testid` attributes to key interactive elements as part of this phase (not a separate phase), then write tests using those stable selectors. Use `page.waitForSelector` to detect DuckDB readiness before interacting.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @playwright/test | ^1.58.1 | E2E test framework | Already installed, configured |
| playwright | ^1.58.1 | Browser automation engine | Already installed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none needed) | - | - | Playwright includes assertions, fixtures, everything needed |

**Installation:** Nothing new needed. All dependencies already in `devDependencies`.

## Architecture Patterns

### Existing Playwright Configuration
The project already has a complete `playwright.config.ts`:
```typescript
// Location: /playwright.config.ts
export default defineConfig({
  testDir: './src/e2e',           // Tests go in src/e2e/
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [{
    name: 'chromium',
    use: {
      ...devices['Desktop Chrome'],
      launchOptions: {
        args: ['--enable-features=SharedArrayBuffer'],
      },
    },
  }],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

Key points:
- Test directory is `src/e2e/` (already configured)
- SharedArrayBuffer flag already enabled (required for DuckDB-WASM)
- Vite dev server auto-starts with COOP/COEP headers (configured in `vite.config.ts`)
- CI gets 2 retries, local gets 0
- npm script exists: `"test:e2e": "playwright test"`

### Recommended Test File Structure
```
src/e2e/
  fixtures/
    app.fixture.ts       # Custom fixture: wait for DB, helper methods
  helpers/
    seed.ts              # Data seeding helpers via page.evaluate()
    selectors.ts         # Centralized selector constants
  plan-crud.spec.ts      # TEST-01: Plan CRUD + history preservation
  batch-logging.spec.ts  # TEST-02: Batch logging edge cases
  workout-rotation.spec.ts # TEST-03: Quick Start + rotation
  demo-data.spec.ts      # TEST-04: Demo data import/clear
  parquet-roundtrip.spec.ts # TEST-05: Export/import round-trip
```

### Pattern 1: App Readiness Detection
**What:** DuckDB-WASM takes time to initialize. The app shows "Loading..." until DB is connected.
**When to use:** Every test, before any interaction.
**How it works in the app:**
```typescript
// In App.tsx, line 257-263:
if (!status.isConnected && !status.error) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary">
      <div className="text-text-muted">Loading...</div>
    </div>
  );
}
// Once connected, renders AppContent with Navigation tabs
```
**Detection strategy:**
```typescript
// Wait for the bottom navigation to appear (proves DB is connected + app rendered)
await page.waitForSelector('nav button:has-text("Workouts")', { timeout: 30000 });
```

### Pattern 2: Tab Navigation
**What:** Bottom nav bar with 4 tabs: Workouts, Templates, Analytics, Settings.
**Selectors:**
```typescript
// Navigation.tsx renders 4 buttons in a fixed bottom nav
page.locator('nav button:has-text("Workouts")')
page.locator('nav button:has-text("Templates")')
page.locator('nav button:has-text("Analytics")')
page.locator('nav button:has-text("Settings")')
```

### Pattern 3: Data Seeding via page.evaluate()
**What:** Inject events directly into DuckDB without going through the UI.
**Constraint:** The DB singleton is in a module (`src/db/duckdb-init.ts`) and NOT exposed on `window`. We cannot call `getDuckDB()` from page.evaluate directly.
**Approach options:**
1. **Expose DB on window** (recommended): Add a small dev-only helper that attaches the DB instance to `window.__testDB` in development mode.
2. **Use the Import Demo Data button** for full dataset seeding (works as-is).
3. **Use the existing `loadDemoData()` function** via a window-exposed helper.

**The loadDemoData function** (in `src/db/demo-data.ts`):
- Creates: 1 gym ("Iron Works Gym"), 10 exercises, 4 templates (Upper A, Lower A, Upper B, Lower B)
- Generates: 6 weeks of workouts (24 total), 3-4 sets per exercise
- Sets up localStorage rotation state with all 4 templates, position 2, default gym set
- Calls `checkpoint()` to flush OPFS
- Does NOT call `window.location.reload()` -- that happens in the DemoDataSection component

### Pattern 4: Handling window.confirm() Dialogs
**What:** Several operations use `window.confirm()` (not React modals).
**Where used:**
- DemoDataSection: "This will replace all existing data. Continue?" (when eventCount > 0)
- DemoDataSection: "Are you sure? This cannot be undone." (clear all data)
**Playwright handling:**
```typescript
page.on('dialog', dialog => dialog.accept());
// OR for specific handling:
page.once('dialog', async dialog => {
  expect(dialog.message()).toContain('replace all existing data');
  await dialog.accept();
});
```

### Pattern 5: Handling page.reload() Side Effects
**What:** Both `loadDemoData` (via DemoDataSection) and `clearAllData()` call `window.location.reload()`.
**Impact:** After clicking "Load Demo Data" or "Clear All Data", the page reloads. Tests must:
```typescript
await Promise.all([
  page.waitForNavigation(),
  page.click('button:has-text("Load Demo Data")')
]);
// Then wait for app readiness again
await page.waitForSelector('nav button:has-text("Workouts")', { timeout: 30000 });
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Test data seeding | Manual SQL strings in every test | Shared seed helper module | Avoid duplicating event structure; single source of truth |
| App readiness wait | Custom polling loops | `page.waitForSelector` on nav | App already has clear loading/loaded states |
| File download interception | Manual download path detection | Playwright's `page.waitForEvent('download')` | Built-in, handles temp paths cleanly |
| Dialog handling | Try/catch around clicks | `page.on('dialog')` listener | Playwright's native dialog API |
| Selector management | Inline strings everywhere | Centralized selectors module | Maintenance when UI changes |

## Common Pitfalls

### Pitfall 1: DuckDB WASM Initialization Timeout
**What goes wrong:** Tests fail intermittently because DuckDB-WASM takes 5-15 seconds to initialize (downloading WASM bundle from CDN + OPFS setup).
**Why it happens:** Default Playwright timeout (30s for actions) may not be enough; the CDN fetch can be slow.
**How to avoid:** Set a generous timeout on the initial readiness wait (30s). Consider using `webServer.timeout` in Playwright config. In CI, the WASM bundle may need to be cached.
**Warning signs:** Flaky "timeout waiting for selector" errors on the first interaction.

### Pitfall 2: OPFS State Persistence Between Tests
**What goes wrong:** Test B sees data from Test A because OPFS persists across page navigations.
**Why it happens:** DuckDB writes to OPFS files (`gymlog.db`, `gymlog.db.wal`). Unlike localStorage, OPFS cannot be cleared with a simple API call from Playwright.
**How to avoid:**
- Option A: Use `clearAllData()` at the start of each test (drops table + deletes OPFS files + clears localStorage, then reloads)
- Option B: Use a fresh browser context per test (slower but guaranteed isolation)
- Option C: Call `page.evaluate` to run the clearAllData logic without the reload, then manually reload
**Warning signs:** Tests pass individually but fail when run together.

### Pitfall 3: localStorage State Persistence
**What goes wrong:** Zustand stores (workout session, rotations, backup counter) persist between tests.
**Why it happens:** `gymlog-workout`, `gymlog-rotations`, `gymlog-backup`, `gymlog-progression-alerts`, `gymlog-volume-thresholds` are stored in localStorage with Zustand persist middleware.
**How to avoid:** Clear all localStorage keys at the start of each test:
```typescript
await page.evaluate(() => {
  localStorage.clear();
});
```

### Pitfall 4: No data-testid Attributes
**What goes wrong:** Tests break on CSS class changes or text content changes.
**Why it happens:** The codebase has zero `data-testid` attributes. All selectors must use text content, form labels, or structural queries.
**How to avoid:** Add `data-testid` attributes to key interactive elements as the first task of this phase. Target: navigation buttons, form inputs, action buttons, dialog elements.
**Warning signs:** Tests using `:has-text()` or CSS class selectors.

### Pitfall 5: window.confirm() Blocking Tests
**What goes wrong:** Test hangs waiting for a button click response because `window.confirm()` blocks execution.
**Why it happens:** DemoDataSection and clearAllData use native browser dialogs.
**How to avoid:** Always set up dialog handlers BEFORE triggering the action:
```typescript
page.on('dialog', d => d.accept()); // Set up first
await page.click('button:has-text("Clear All Data")'); // Then click
```

### Pitfall 6: Download File Handling for Parquet Export
**What goes wrong:** Cannot verify exported Parquet file content.
**Why it happens:** Export creates a blob URL, triggers a download via a temporary `<a>` element, then revokes the URL.
**How to avoid:** Use Playwright's download event:
```typescript
const downloadPromise = page.waitForEvent('download');
await page.click('button:has-text("Export Backup")');
const download = await downloadPromise;
const path = await download.path();
// Can then re-import this file or verify it exists
```

## Code Examples

### Example 1: Full App Readiness Wait + Tab Navigation
```typescript
import { test, expect } from '@playwright/test';

test('navigate to all tabs', async ({ page }) => {
  await page.goto('/');
  // Wait for DuckDB init
  await page.waitForSelector('nav button:has-text("Workouts")', { timeout: 30000 });

  // Navigate to Templates
  await page.click('nav button:has-text("Templates")');
  await expect(page.locator('text=Templates')).toBeVisible();

  // Navigate to Analytics
  await page.click('nav button:has-text("Analytics")');
  await expect(page.locator('text=No exercises yet')).toBeVisible();

  // Navigate to Settings
  await page.click('nav button:has-text("Settings")');
  await expect(page.locator('text=Workout Rotations')).toBeVisible();
});
```

### Example 2: Data Seeding via Demo Data Button (TEST-04)
```typescript
test('import demo data and verify charts', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('nav button:has-text("Workouts")', { timeout: 30000 });

  // Go to Settings
  await page.click('nav button:has-text("Settings")');
  await expect(page.locator('text=Demo & Data Management')).toBeVisible();

  // Click Load Demo Data (no confirm dialog when eventCount = 0)
  const navigationPromise = page.waitForURL('**/*');
  await page.click('button:has-text("Load Demo Data")');
  await navigationPromise;

  // Wait for app to reinitialize after reload
  await page.waitForSelector('nav button:has-text("Workouts")', { timeout: 30000 });

  // Verify event count appears in header
  await expect(page.locator('text=/\\d+ events/')).toBeVisible();

  // Go to Analytics and verify charts populate
  await page.click('nav button:has-text("Analytics")');
  await expect(page.locator('text=Select Exercise')).toBeVisible();
  // Charts should render (Recharts SVG elements)
  await expect(page.locator('.recharts-surface').first()).toBeVisible({ timeout: 10000 });
});
```

### Example 3: Test Setup/Teardown Pattern
```typescript
import { test, expect } from '@playwright/test';

// Clean state before each test
test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('nav button:has-text("Workouts")', { timeout: 30000 });

  // Clear all data
  await page.evaluate(() => {
    localStorage.clear();
  });

  // Navigate to settings and use Clear All Data for OPFS cleanup
  // (only needed if previous test left DuckDB data)
});
```

### Example 4: Parquet Export/Import Round-Trip (TEST-05)
```typescript
test('parquet export and reimport', async ({ page }) => {
  // ... seed demo data first ...

  // Go to Settings > Data Backup
  await page.click('nav button:has-text("Settings")');

  // Get event count before export
  const eventCountText = await page.locator('text=/\\d+ events/').first().textContent();
  const eventCount = parseInt(eventCountText?.match(/(\d+)/)?.[1] || '0');

  // Export
  const downloadPromise = page.waitForEvent('download');
  await page.click('button:has-text("Export Backup")');
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/gymlog-backup-.*\.parquet/);

  // Clear all data
  page.on('dialog', d => d.accept());
  const reloadPromise = page.waitForURL('**/*');
  await page.click('button:has-text("Clear All Data")');
  await reloadPromise;
  await page.waitForSelector('nav button:has-text("Workouts")', { timeout: 30000 });

  // Verify empty state
  await page.click('nav button:has-text("Settings")');
  await expect(page.locator('text=0 events')).toBeVisible();

  // Import the exported file
  const filePath = await download.path();
  const fileInput = page.locator('input[type="file"][accept=".parquet"]');
  await fileInput.setInputFiles(filePath!);

  // Verify import result
  await expect(page.locator(`text=Imported ${eventCount} events`)).toBeVisible({ timeout: 15000 });
});
```

### Example 5: Creating a Gym and Exercise via UI
```typescript
// Create a gym (needed for workout tests)
await page.click('text=+ Add'); // In "Your Gyms" section
await page.fill('#name', 'Test Gym');
await page.fill('#location', 'Test Location');
await page.click('button:has-text("Add Gym")');
await expect(page.locator('text=Test Gym')).toBeVisible();

// Create an exercise
// Scroll down to the Exercises section
await page.click('text=+ Add >> nth=1'); // Second "+ Add" button (exercises)
await page.fill('#name', 'Test Bench Press');
// muscleGroup select defaults to 'Chest'
await page.click('button:has-text("Add Exercise")');
await expect(page.locator('text=Test Bench Press')).toBeVisible();
```

### Example 6: Workout Flow (Start, Log Sets, Complete)
```typescript
// Assumes gym and template already exist
// Select gym and template
await page.selectOption('#gym-select', { label: /Test Gym/ });
await page.selectOption('#template-select', { label: /Test Template/ });
await page.click('button:has-text("Start Workout")');

// Verify active workout
await expect(page.locator('text=WORKOUT ACTIVE')).toBeVisible();

// Log a set - SetRow has inputs labeled "Weight (kg)", "Reps", "RIR"
const weightInput = page.locator('label:has-text("Weight") + div input').first();
const repsInput = page.locator('label:has-text("Reps") + div input').first();
await weightInput.fill('100');
await repsInput.fill('10');
await repsInput.blur(); // Triggers auto-save

// Finish workout
await page.click('button:has-text("Finish Workout")');
// Completion dialog appears
await expect(page.locator('text=Workout Complete')).toBeVisible();
await page.click('button:has-text("Save Workout")');
// After save, shows "Workout Saved!"
await expect(page.locator('text=Workout Saved!')).toBeVisible();
await page.click('button:has-text("Done")');
```

## Detailed UI Flow Analysis for Each Test Scenario

### TEST-01: Plan CRUD with Exercise History Preservation

**Flow:** Create plan (template) > Log workouts > Delete plan > Verify exercise history persists

1. **Create exercises** (Workouts tab > Exercises section > "+ Add" button > modal form)
   - Modal: `input#name`, `select#muscleGroup`, global/per-gym toggle buttons
   - Submit: "Add Exercise" button

2. **Create template** (Templates tab > "+ New Template" button > form view)
   - Input: template name text field (placeholder "e.g., Upper A, Push Day")
   - "Add Exercises" link reveals checkbox picker
   - Each exercise has target_reps_min, target_reps_max, suggested_sets fields
   - Submit: "Create Template" button

3. **Log a workout** using the template (see Example 6 above)
   - Start workout > log sets > finish > save

4. **Delete the template** (Templates tab > template card > 3-dot menu > Delete > confirm)
   - 3-dot menu: SVG button in TemplateCard
   - Delete button in dropdown menu
   - DeleteConfirmation modal with "Delete" and "Cancel" buttons

5. **Verify history persists** - Exercise history is stored in DuckDB events table (set_logged events). Deleting a template writes a `template_deleted` event but does NOT delete set_logged events. Verify by:
   - Going to Analytics tab > selecting the exercise > checking data still shows
   - Or checking event count hasn't dropped significantly

### TEST-02: Batch Logging Edge Cases

**Flow:** Start workout > test empty sets, max values, ghost text

1. **Ghost text** appears as `placeholder` attributes on SetRow inputs:
   - Weight placeholder: `ghostData.weight_kg.toFixed(1)` (e.g., "60.0")
   - Reps placeholder: `ghostData.reps.toString()` (e.g., "10")
   - RIR placeholder: `ghostData.rir?.toString()` (e.g., "2")
   - Ghost data comes from the LAST workout session for same exercise+gym
   - "First time - no previous data" text shows when no ghost data exists

2. **Empty sets**: Sets with `weight_kg: null` and `reps: null` are saved on blur. When completing a workout with 0 sets, the "Save Workout" button is disabled and text says "Log at least one set to save this workout".

3. **Max values**: No explicit max validation in SetRow inputs (type="number"). Exercise weight_kg is a float, reps is an integer. Input elements have `step="0.1"` for weight, `step="1"` for reps, `min="0" max="5"` for RIR.

4. **Add Set button**: "+ Add Set" button in SetGrid adds an empty row beyond the template's suggested_sets count.

### TEST-03: Quick Start + Rotation Advancement

**Flow:** Set up rotation > use Quick Start > complete workout > verify rotation advances

1. **Create rotation** (Settings tab > "Workout Rotations" section):
   - Fill rotation name input
   - Check template checkboxes
   - Click "Create Rotation"
   - Click "Set Active" on the rotation
   - Select default gym from dropdown

2. **Quick Start** (Workouts tab):
   - QuickStartCard shows: "Workout 1 of N in [rotation name]", template name, gym name
   - "Start Workout" button in the card

3. **Complete workout** and verify rotation advances:
   - In WorkoutComplete.handleSave (line 101-103): `useRotationStore.getState().advanceRotation(activeRotationId)`
   - Rotation position increments by 1, wraps via modulo
   - After workout completion, going back to Workouts tab should show next template in QuickStartCard

### TEST-04: Demo Data Import and Clear

**Flow:** Import demo data > verify charts > clear data > verify empty

1. **Import demo data** (Settings tab > "Demo & Data Management" section):
   - "Load Demo Data" button (text changes to "Loading demo data..." while loading)
   - If eventCount > 0: `window.confirm("This will replace all existing data. Continue?")`
   - After load: `window.location.reload()` is called
   - Creates: 1 gym, 10 exercises, 4 templates, ~24 workouts with ~288+ set events

2. **Verify charts** (Analytics tab):
   - Exercise selector dropdown populates with 10 exercises
   - Progress chart section contains Recharts SVG (`.recharts-surface`)
   - Weekly comparison card appears
   - Volume bar chart appears

3. **Clear all data** (Settings tab):
   - "Clear All Data" button (red styling)
   - `window.confirm("Are you sure? This cannot be undone.")`
   - Drops events table, deletes OPFS files, clears localStorage
   - `window.location.reload()`

4. **Verify empty state** (Analytics tab):
   - "No exercises yet" or "Create exercises and log workouts to see analytics"

### TEST-05: Parquet Export/Import Round-Trip

**Flow:** Seed data > export > clear > import > verify match

1. **Export** (Settings tab > "Data Backup" section):
   - "Export Backup" button triggers `useBackupExport.exportBackup()`
   - Creates Parquet file via DuckDB `COPY TO` with zstd compression
   - Downloads as `gymlog-backup-YYYY-MM-DD.parquet`
   - File input: `<input type="file" accept=".parquet" class="hidden">`

2. **Import** (Settings tab > "Restore from Backup" section):
   - "Import Backup" button clicks the hidden file input
   - File registered with DuckDB, schema validated, events inserted (skipping duplicates)
   - Result displayed: "Imported N events (M duplicates skipped)"

3. **Verification**: Compare event counts before export and after re-import.

## No data-testid Attributes Available

**Critical finding:** Zero `data-testid` attributes exist in the codebase. Tests will need to use:
- Text content: `page.locator('text=...')`, `page.locator('button:has-text("...")')`
- HTML attributes: `#id` selectors (exist for some form elements like `#name`, `#gym-select`, `#template-select`, `#exercise-select`)
- Structural: `label:has-text("...") + div input`
- CSS class names (fragile, avoid)

**Recommendation:** Add `data-testid` to these critical elements before writing tests:
- Navigation buttons: `data-testid="nav-workouts"`, `nav-templates`, `nav-analytics`, `nav-settings`
- Key action buttons: `data-testid="btn-start-workout"`, `btn-finish-workout"`, `btn-save-workout"`, `btn-load-demo"`, `btn-clear-data"`, `btn-export-backup"`, `btn-import-backup"`
- Form containers: `data-testid="gym-form"`, `exercise-form"`, `template-builder"`
- Content areas: `data-testid="quick-start-card"`, `event-count"`
- Set row inputs: `data-testid="set-{n}-weight"`, `set-{n}-reps"`, `set-{n}-rir"`

## localStorage Keys Reference

All Zustand-persisted stores and their keys:
| Key | Store | Contents |
|-----|-------|----------|
| `gymlog-workout` | useWorkoutStore | Active session, weight unit, rest timer, sound pref |
| `gymlog-rotations` | useRotationStore | Rotations array, active rotation ID, default gym ID |
| `gymlog-backup` | useBackupStore | Last backup date, workout count since backup |
| `gymlog-progression-alerts` | (alerts store) | Dismissed alert IDs |
| `gymlog-volume-thresholds` | (volume store) | Custom volume thresholds |

## OPFS Files Reference

| File | Purpose |
|------|---------|
| `gymlog.db` | Main DuckDB database file |
| `gymlog.db.wal` | Write-ahead log |

To clear OPFS from Playwright:
```typescript
await page.evaluate(async () => {
  const root = await navigator.storage.getDirectory();
  for (const name of ['gymlog.db', 'gymlog.db.wal']) {
    try { await root.removeEntry(name); } catch {}
  }
});
```

## DuckDB Events Table Schema

```sql
CREATE TABLE IF NOT EXISTS events (
  _event_id VARCHAR PRIMARY KEY,
  _created_at TIMESTAMP NOT NULL,
  event_type VARCHAR NOT NULL,
  payload JSON NOT NULL,
  year INTEGER GENERATED ALWAYS AS (YEAR(_created_at)) VIRTUAL,
  month INTEGER GENERATED ALWAYS AS (MONTH(_created_at)) VIRTUAL
)
```

Event types used: `gym_created`, `gym_updated`, `gym_deleted`, `exercise_created`, `exercise_updated`, `exercise_deleted`, `template_created`, `template_updated`, `template_deleted`, `template_archived`, `workout_started`, `set_logged`, `workout_completed`

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| CSS selectors for E2E | data-testid attributes | Industry standard | More resilient tests |
| Manual browser context cleanup | Playwright's built-in isolation | Playwright 1.x | Use `test.use({ storageState: undefined })` |
| Custom wait loops for async | Playwright auto-waiting | Playwright 1.x | Most locator methods auto-wait |

## Open Questions

1. **Data seeding approach for non-demo tests**
   - What we know: `getDuckDB()` is not exposed on `window`. Demo data button works but seeds a fixed dataset.
   - What's unclear: Best way to inject custom events for specific test scenarios (e.g., just 1 gym + 1 exercise + 1 template for plan CRUD test).
   - Recommendation: Either (a) expose a `window.__testHelpers` object in dev mode that provides `getDuckDB()` and `writeEvent()`, or (b) create test-specific seed functions that go through the UI (slower but more realistic), or (c) use the hidden file input to import a pre-built Parquet fixture.

2. **OPFS cleanup reliability**
   - What we know: `clearAllData()` deletes OPFS files and reloads. But DuckDB holds file locks.
   - What's unclear: Can we reliably delete OPFS files while DuckDB is still running?
   - Recommendation: Use fresh browser context for tests that need guaranteed clean state, or navigate away before OPFS cleanup.

3. **Ghost text verification timing**
   - What we know: Ghost text loads asynchronously from DuckDB (useLastSessionData hook). Shows "Loading last session..." then renders placeholders.
   - What's unclear: How long the DB query takes in test environment.
   - Recommendation: Wait for "Loading last session..." to disappear before asserting placeholder values.

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis of all referenced source files
- `playwright.config.ts` - existing configuration
- `package.json` - dependency versions confirmed
- `vite.config.ts` - COOP/COEP headers confirmed
- All component files referenced above

### Secondary (MEDIUM confidence)
- Playwright documentation patterns (from training data, Playwright 1.58 is very recent)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all from existing codebase
- Architecture: HIGH - traced every UI flow through actual components
- Pitfalls: HIGH - identified from actual code patterns (confirm dialogs, reload calls, OPFS)
- Selectors: HIGH - verified zero data-testid, catalogued all available selectors

**Research date:** 2026-01-31
**Valid until:** 2026-03-01 (stable -- codebase-specific findings don't expire)
