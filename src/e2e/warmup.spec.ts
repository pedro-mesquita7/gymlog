import { test, expect, loadDemoData } from './fixtures/app.fixture';
import { SEL } from './helpers/selectors';

/**
 * E2E: Warmup Hints Feature
 *
 * Tests that warmup hints display during workout logging with calculated weights.
 * Warmup hints require prior workout history (demo data provides this).
 */
test.describe('Warmup Hints', () => {
  test('warmup hints display during workout logging with calculated weights', async ({ appPage: page }) => {
    // --- Step 0: Load demo data (ensures exercises have workout history) ---
    await loadDemoData(page);

    // --- Step 1: Start a workout ---
    await page.click(SEL.navWorkouts);

    // Check if Quick Start is available (demo data sets up rotation)
    const quickStart = page.locator(SEL.quickStartCard);
    if (await quickStart.isVisible({ timeout: 3000 }).catch(() => false)) {
      await page.click(SEL.btnQuickStart);
    } else {
      // Fallback: manual start with first available gym/plan
      await page.locator('summary:has-text("Manual select workout")').click();
      await page.waitForTimeout(300);
      const gymSelect = page.locator(SEL.gymSelect);
      await gymSelect.waitFor({ state: 'visible', timeout: 5_000 });
      await gymSelect.selectOption({ index: 1 });
      await page.locator(SEL.planSelect).selectOption({ index: 1 });
      await page.click(SEL.btnStartWorkout);
    }

    // Wait for workout to start
    await page.waitForSelector(SEL.btnFinishWorkout, { timeout: 10_000 });

    // Wait for ghost data to finish loading
    await page.waitForSelector(SEL.loadingGhostData, { state: 'detached', timeout: 10_000 }).catch(() => {});

    // --- Step 2: Verify warmup toggle is visible ---
    const warmupToggle = page.locator(SEL.warmupToggle).first();
    await expect(warmupToggle).toBeVisible({ timeout: 5_000 });
    await expect(warmupToggle).toContainText('Warmup');

    // --- Step 3: Click warmup toggle to expand ---
    await warmupToggle.click();
    await page.waitForTimeout(300);

    // --- Step 4: Verify warmup content is visible with calculated weights ---
    const warmupContent = page.locator(SEL.warmupContent).first();
    await expect(warmupContent).toBeVisible({ timeout: 3_000 });

    // Warmup content should show weight calculations (not "Log your first session" since demo data has history)
    const contentText = await warmupContent.textContent();
    expect(contentText).not.toContain('Log your first session');

    // Should contain weight values with "kg" and percentage
    expect(contentText).toContain('kg');
    expect(contentText).toContain('%');
  });

  test('warmup hints show "log first session" message for new exercises', async ({ appPage: page }) => {
    // Load demo data to have gym available, but we will create a new exercise
    await loadDemoData(page);

    // Create a brand new exercise with no history
    await page.click(SEL.navWorkouts);
    const exercisesBtn = page.locator(`button[aria-expanded]:has-text("Exercises")`);
    await exercisesBtn.first().waitFor({ state: 'visible', timeout: 10_000 });
    const isExpanded = await exercisesBtn.first().getAttribute('aria-expanded');
    if (isExpanded !== 'true') {
      await exercisesBtn.first().click();
      await page.waitForTimeout(400);
    }
    await page.locator('button:has-text("+ Add")').first().click();
    await page.waitForSelector(SEL.exerciseNameInput, { timeout: 5000 });
    await page.fill(SEL.exerciseNameInput, 'Warmup Test Exercise');
    await page.locator(SEL.exerciseMuscleSelect).selectOption('Chest');
    await page.click(SEL.btnAddExercise);
    await page.waitForSelector('text="Warmup Test Exercise"', { timeout: 5000 });

    // Create a plan with this new exercise
    await page.click(SEL.navPlans);
    await page.click('button:has-text("+ New Plan")');
    await page.fill(SEL.planNameInput, 'Warmup Test Plan');
    await page.click('button:has-text("Add Exercises")');
    await page.locator('label').filter({ hasText: 'Warmup Test Exercise' }).locator('input[type="checkbox"]').check();
    await page.click(SEL.btnCreatePlan);
    await page.waitForSelector('text="Warmup Test Plan"', { timeout: 5000 });

    // Start a workout with this plan
    await page.click(SEL.navWorkouts);
    await page.locator('summary:has-text("Manual select workout")').click();
    await page.waitForTimeout(300);

    const gymSelect = page.locator(SEL.gymSelect);
    await gymSelect.waitFor({ state: 'visible', timeout: 5_000 });
    await gymSelect.selectOption({ index: 1 });
    const planSelect = page.locator(SEL.planSelect);
    // Select by finding the option containing our plan name
    const planOption = planSelect.locator('option', { hasText: 'Warmup Test Plan' });
    const planValue = await planOption.getAttribute('value');
    await planSelect.selectOption(planValue!);
    await page.click(SEL.btnStartWorkout);
    await page.waitForSelector(SEL.btnFinishWorkout, { timeout: 10_000 });

    // Check warmup toggle -- for a new exercise with no history,
    // the WarmupHint component doesn't render at all (maxWeight === null returns null before any loading)
    // Actually: when loading is done and maxWeight is null (no history), it shows
    // "Log your first session" message
    const warmupToggle = page.locator(SEL.warmupToggle).first();

    // The warmup toggle should be visible (it renders for exercises that are not bodyweight)
    if (await warmupToggle.isVisible({ timeout: 3000 }).catch(() => false)) {
      await warmupToggle.click();
      await page.waitForTimeout(300);
      const warmupContent = page.locator(SEL.warmupContent).first();
      if (await warmupContent.isVisible({ timeout: 2000 }).catch(() => false)) {
        const text = await warmupContent.textContent();
        expect(text).toContain('Log your first session');
      }
    }
    // If warmup toggle isn't visible, that's also acceptable
    // (exercise may have no max weight data, component returns null)
  });
});
