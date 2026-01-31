import { test, expect, clearAllData } from './fixtures/app.fixture';
import { SEL, setRow } from './helpers/selectors';
import { createGym, createExercise, logSet } from './helpers/seed';

/**
 * Helper: select an <option> whose visible label contains `text`.
 * Works around strict typing on selectOption({ label }) by reading
 * the matching option value first, then selecting by value.
 */
async function selectByLabelSubstring(
  page: import('@playwright/test').Page,
  selector: string,
  text: string,
) {
  const value = await page.locator(selector)
    .locator('option', { hasText: text })
    .first()
    .getAttribute('value');
  if (!value) throw new Error(`No option containing "${text}" in ${selector}`);
  await page.locator(selector).selectOption(value);
}

test.describe('Plan CRUD with exercise history preservation', () => {
  test('creates gym + exercise + template, logs workout, deletes template, verifies history persists', async ({ appPage: page }) => {
    // --- Step 0: Clean slate ---
    await clearAllData(page);

    // --- Step 1: Create gym and exercise via seed helpers ---
    await createGym(page, 'E2E Test Gym', 'Test Location');
    await createExercise(page, 'E2E Bench Press', 'Chest');

    // --- Step 2: Create template ---
    await page.click(SEL.navTemplates);
    await page.click('button:has-text("+ New Template")');
    await page.fill(SEL.templateNameInput, 'E2E Push Day');

    // Open exercise picker and select "E2E Bench Press"
    await page.click('button:has-text("Add Exercises")');
    await page.locator('label').filter({ hasText: 'E2E Bench Press' }).locator('input[type="checkbox"]').check();

    // Submit template creation
    await page.click(SEL.btnCreateTemplate);

    // Assert template appears in the list
    await expect(page.locator('text=E2E Push Day')).toBeVisible({ timeout: 5000 });

    // --- Step 3: Log a workout using the template ---
    await page.click(SEL.navWorkouts);

    // Select gym and template from dropdowns
    await selectByLabelSubstring(page, SEL.gymSelect, 'E2E Test Gym');
    await selectByLabelSubstring(page, SEL.templateSelect, 'E2E Push Day');

    await page.click(SEL.btnStartWorkout);

    // Wait for set grid to load (wait for first set weight input)
    await page.waitForSelector(setRow(1).weight, { timeout: 10_000 });

    // Log a set: 80kg x 10 @ RIR 2
    await logSet(page, 1, '80', '10', '2');

    // Finish the workout
    await page.click(SEL.btnFinishWorkout);
    await expect(page.locator(SEL.workoutCompleteHeading)).toBeVisible({ timeout: 5000 });

    // Save the workout
    await page.click(SEL.btnSaveWorkout);
    await expect(page.locator(SEL.workoutSavedHeading)).toBeVisible({ timeout: 10_000 });

    // Click Done to return to main view
    await page.click(SEL.btnDoneWorkout);

    // --- Step 4: Verify exercise appears in analytics BEFORE deletion ---
    await page.click(SEL.navAnalytics);
    // Analytics should show charts (not empty state) since we have logged data
    await expect(page.locator(SEL.analyticsCharts)).toBeVisible({ timeout: 15_000 });

    // Select "E2E Bench Press" in the exercise dropdown
    await selectByLabelSubstring(page, SEL.analyticsExerciseSelect, 'E2E Bench Press');

    // Verify chart section is visible with data
    await expect(page.locator(SEL.analyticsCharts)).toBeVisible();

    // --- Step 5: Delete the template ---
    await page.click(SEL.navTemplates);

    // Wait for template card to load
    await expect(page.locator('text=E2E Push Day')).toBeVisible({ timeout: 5000 });

    // Open the 3-dot menu on the template card
    await page.click(SEL.btnTemplateMenu);

    // Click delete in the dropdown
    await page.click(SEL.btnTemplateDelete);

    // Confirm deletion in the modal
    await page.click(SEL.btnConfirmDelete);

    // Assert "E2E Push Day" is gone
    await expect(page.locator('text=E2E Push Day')).not.toBeVisible({ timeout: 5000 });

    // --- Step 6: Verify exercise history STILL persists after deletion ---
    // This is the critical regression test for BUG-01 (Phase 12 fix)
    await page.click(SEL.navAnalytics);

    // Analytics should still show charts, NOT the empty state
    await expect(page.locator(SEL.analyticsCharts)).toBeVisible({ timeout: 15_000 });

    // Select "E2E Bench Press" again to confirm its data survives template deletion
    await selectByLabelSubstring(page, SEL.analyticsExerciseSelect, 'E2E Bench Press');

    // The charts container should still be visible (not the "No exercises yet" empty state)
    await expect(page.locator(SEL.analyticsCharts)).toBeVisible();
    await expect(page.locator(SEL.analyticsEmpty)).not.toBeVisible();
  });
});
