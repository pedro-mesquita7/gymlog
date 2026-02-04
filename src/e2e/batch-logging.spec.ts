import { test, expect, waitForApp, clearAllData } from './fixtures/app.fixture';
import { SEL, setRow } from './helpers/selectors';
import { createGym, createExercise, logSet } from './helpers/seed';

/**
 * TEST-02: Batch Logging Edge Cases
 *
 * Validates batch logging handles edge cases correctly:
 * - Empty sets cannot be saved
 * - Large values are accepted and ghost text appears from previous sessions
 * - Add Set button adds rows beyond plan sets
 */
test.describe('Batch Logging Edge Cases', () => {
  /**
   * Shared setup: create gym, exercise, plan.
   * Called at the start of each test for isolation.
   */
  async function setupTestData(page: import('@playwright/test').Page) {
    await clearAllData(page);

    await createGym(page, 'Batch Gym', 'Test Location');
    await createExercise(page, 'Batch Squat', 'Quads');

    // Create plan: navigate to Plans tab
    await page.click(SEL.navPlans);
    await page.click('text="+ New Plan"');
    await page.fill(SEL.planNameInput, 'Batch Plan');

    // Open exercise picker and select our exercise
    await page.click('text="Add Exercises"');
    await page.locator('label:has-text("Batch Squat")').click();

    // Submit and wait for plan to appear in list
    await page.click(SEL.btnCreatePlan);
    await page.waitForSelector('text="Batch Plan"', { timeout: 5000 });
  }

  /**
   * Helper: Start a workout with Batch Gym + Batch Plan.
   */
  async function startWorkout(page: import('@playwright/test').Page) {
    await page.click(SEL.navWorkouts);

    // Open the "Manual select workout" details section
    const details = page.locator('details:has(summary:has-text("Manual select workout"))');
    if (!(await details.getAttribute('open'))) {
      await page.locator('summary:has-text("Manual select workout")').click();
      await page.waitForTimeout(300);
    }

    // Select gym by finding its option value
    const gymSelect = page.locator(SEL.gymSelect);
    await gymSelect.waitFor({ state: 'visible', timeout: 5_000 });
    const gymOption = gymSelect.locator('option', { hasText: 'Batch Gym' });
    const gymValue = await gymOption.getAttribute('value');
    await gymSelect.selectOption(gymValue!);

    // Select plan by finding its option value
    const planSelect = page.locator(SEL.planSelect);
    const planOption = planSelect.locator('option', { hasText: 'Batch Plan' });
    const planValue = await planOption.getAttribute('value');
    await planSelect.selectOption(planValue!);

    // Click Start
    await page.click(SEL.btnStartWorkout);

    // Wait for active workout view (SetGrid renders)
    await page.waitForSelector(SEL.btnFinishWorkout, { timeout: 10_000 });

    // Wait for ghost data loading to finish (if any)
    await page.waitForSelector(SEL.loadingGhostData, { state: 'detached', timeout: 10_000 }).catch(() => {
      // May not appear if no ghost data -- that is fine
    });
  }

  test('Empty sets disable Save Workout button', async ({ appPage: page }) => {
    await setupTestData(page);
    await startWorkout(page);

    // Do NOT fill any set data -- just click Finish
    await page.click(SEL.btnFinishWorkout);

    // Assert Workout Complete heading
    await expect(page.locator(SEL.workoutCompleteHeading)).toBeVisible({ timeout: 5000 });

    // Assert Save Workout is disabled (0 sets logged)
    await expect(page.locator(SEL.btnSaveWorkout)).toBeDisabled();

    // Assert no-sets warning is visible
    await expect(page.locator(SEL.noSetsWarning)).toBeVisible();
  });

  test('Max values accepted and ghost text appears from previous session', async ({ appPage: page }) => {
    await setupTestData(page);

    // --- Part 1: Log a workout with large values ---
    await startWorkout(page);

    // Log set 1 with large values: 500 kg, 100 reps
    await logSet(page, 1, '500', '100');

    // Click Finish
    await page.click(SEL.btnFinishWorkout);

    // Assert Workout Complete heading
    await expect(page.locator(SEL.workoutCompleteHeading)).toBeVisible({ timeout: 5000 });

    // Save should be enabled (we have a valid set)
    await expect(page.locator(SEL.btnSaveWorkout)).toBeEnabled();

    // Click Save
    await page.click(SEL.btnSaveWorkout);

    // Assert saved heading
    await expect(page.locator(SEL.workoutSavedHeading)).toBeVisible({ timeout: 10_000 });

    // Click Done to dismiss
    await page.click(SEL.btnDoneWorkout);

    // --- Part 2: Start a NEW workout and verify ghost text ---
    // Force DuckDB checkpoint so data persists across page reload
    await page.evaluate(async () => {
      // @ts-expect-error -- Vite dev server resolves this path at runtime
      const mod = await import('/src/db/duckdb-init.ts');
      await mod.checkpoint();
    });

    // Full page reload ensures DuckDB reinitializes from OPFS with saved data
    await page.reload();
    await waitForApp(page);

    await startWorkout(page);

    // Ghost data should load from the previous workout (500 kg, 100 reps)
    const weightInput = page.locator(setRow(1).weight);
    const repsInput = page.locator(setRow(1).reps);

    // The placeholder should contain "500" for weight (formatted as "500.0")
    await expect(weightInput).toHaveAttribute('placeholder', /500/, { timeout: 15_000 });

    // The reps placeholder should contain "100"
    await expect(repsInput).toHaveAttribute('placeholder', /100/);

    // First-time hint should NOT be visible (we have ghost data)
    await expect(page.locator(SEL.firstTimeHint)).not.toBeVisible();
  });

  test('Add Set button adds rows beyond plan sets', async ({ appPage: page }) => {
    await setupTestData(page);
    await startWorkout(page);

    // Count initial set rows (plan has suggested_sets=3 by default)
    const initialRowCount = await page.locator('[data-testid^="set-"][data-testid$="-weight"]').count();
    expect(initialRowCount).toBeGreaterThan(0);

    // Click Add Set
    await page.click(SEL.btnAddSet);

    // Assert a new row appeared
    const newRowCount = await page.locator('[data-testid^="set-"][data-testid$="-weight"]').count();
    expect(newRowCount).toBe(initialRowCount + 1);
  });
});
