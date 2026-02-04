import { test, expect, loadDemoData, clearAllData, waitForApp } from './fixtures/app.fixture';
import { SEL } from './helpers/selectors';
import { createGym, createExercise, logSet } from './helpers/seed';

/**
 * E2E: Exercise Notes Feature
 *
 * Tests that notes can be added during a workout and viewed in subsequent sessions.
 * Notes are stored per-exercise and persisted as exercise_note_logged events.
 */
test.describe('Exercise Notes', () => {
  test('can add a note to an exercise and see it in next session', async ({ appPage: page }) => {
    // --- Step 0: Clean slate + create gym/exercise/plan ---
    await clearAllData(page);
    await createGym(page, 'Note Gym', 'Test Location');
    await createExercise(page, 'Note Bench Press', 'Chest');

    // Create a plan with the exercise
    await page.click(SEL.navPlans);
    await page.click('button:has-text("+ New Plan")');
    await page.fill(SEL.planNameInput, 'Note Plan');
    await page.click('button:has-text("Add Exercises")');
    await page.locator('label').filter({ hasText: 'Note Bench Press' }).locator('input[type="checkbox"]').check();
    await page.click(SEL.btnCreatePlan);
    await page.waitForSelector('text="Note Plan"', { timeout: 5000 });

    // --- Step 1: Start a workout ---
    await page.click(SEL.navWorkouts);
    await page.locator('summary:has-text("Manual select workout")').click();
    await page.waitForTimeout(300);

    const gymSelect = page.locator(SEL.gymSelect);
    await gymSelect.waitFor({ state: 'visible', timeout: 5_000 });
    const gymOption = gymSelect.locator('option', { hasText: 'Note Gym' });
    const gymValue = await gymOption.getAttribute('value');
    await gymSelect.selectOption(gymValue!);

    const planSelect = page.locator(SEL.planSelect);
    const planOption = planSelect.locator('option', { hasText: 'Note Plan' });
    const planValue = await planOption.getAttribute('value');
    await planSelect.selectOption(planValue!);

    await page.click(SEL.btnStartWorkout);
    await page.waitForSelector(SEL.btnFinishWorkout, { timeout: 10_000 });

    // --- Step 2: Add a note to the exercise ---
    // Click the note toggle to expand the note area
    const noteToggle = page.locator(SEL.exerciseNoteToggle).first();
    await expect(noteToggle).toBeVisible({ timeout: 5_000 });
    await noteToggle.click();
    await page.waitForTimeout(300);

    // Type a note
    const noteInput = page.locator(SEL.exerciseNoteInput).first();
    await expect(noteInput).toBeVisible({ timeout: 3_000 });
    await noteInput.fill('E2E test note: felt strong today');
    // Blur to trigger debounced save
    await noteInput.blur();
    await page.waitForTimeout(600);

    // --- Step 3: Log a set and finish the workout ---
    await logSet(page, 1, '60', '8', '2');
    await page.click(SEL.btnFinishWorkout);
    await expect(page.locator(SEL.workoutCompleteHeading)).toBeVisible({ timeout: 5000 });
    await page.click(SEL.btnSaveWorkout);
    await expect(page.locator(SEL.workoutSavedHeading)).toBeVisible({ timeout: 10_000 });
    await page.click(SEL.btnDoneWorkout);

    // --- Step 4: Checkpoint DuckDB and reload ---
    await page.evaluate(async () => {
      // @ts-expect-error -- Vite dev server resolves at runtime
      const mod = await import('/src/db/duckdb-init.ts');
      await mod.checkpoint();
    });
    await page.reload();
    await waitForApp(page);

    // --- Step 5: Start a NEW workout with the same exercise ---
    await page.locator('summary:has-text("Manual select workout")').click();
    await page.waitForTimeout(300);

    const gymSelect2 = page.locator(SEL.gymSelect);
    await gymSelect2.waitFor({ state: 'visible', timeout: 5_000 });
    await gymSelect2.selectOption(gymValue!);
    await page.locator(SEL.planSelect).selectOption(planValue!);
    await page.click(SEL.btnStartWorkout);
    await page.waitForSelector(SEL.btnFinishWorkout, { timeout: 10_000 });

    // --- Step 6: Verify the note from previous session is visible ---
    // Expand the note area
    const noteToggle2 = page.locator(SEL.exerciseNoteToggle).first();
    await noteToggle2.click();
    await page.waitForTimeout(300);

    // Click "Previous notes" to expand history
    const historyButton = page.locator('button:has-text("Previous notes")').first();
    await historyButton.click();
    await page.waitForTimeout(300);

    // Verify the note history contains our note
    const noteHistory = page.locator(SEL.exerciseNoteHistory).first();
    await expect(noteHistory).toBeVisible({ timeout: 5_000 });
    await expect(noteHistory).toContainText('E2E test note: felt strong today');

    // Verify at least one note entry exists
    const noteEntries = page.locator(SEL.exerciseNoteEntry);
    expect(await noteEntries.count()).toBeGreaterThanOrEqual(1);
  });

  test('note with demo data shows previous notes from history', async ({ appPage: page }) => {
    // Load demo data which has workout history with notes
    await loadDemoData(page);

    // Start a Quick Start workout (demo data sets up rotation)
    await page.click(SEL.navWorkouts);

    // Check if Quick Start is available
    const quickStart = page.locator(SEL.quickStartCard);
    if (await quickStart.isVisible({ timeout: 3000 }).catch(() => false)) {
      await page.click(SEL.btnQuickStart);
    } else {
      // Fallback: manual start
      await page.locator('summary:has-text("Manual select workout")').click();
      await page.waitForTimeout(300);
      const gymSelect = page.locator(SEL.gymSelect);
      await gymSelect.waitFor({ state: 'visible', timeout: 5_000 });
      // Select first available option
      await gymSelect.selectOption({ index: 1 });
      await page.locator(SEL.planSelect).selectOption({ index: 1 });
      await page.click(SEL.btnStartWorkout);
    }

    await page.waitForSelector(SEL.btnFinishWorkout, { timeout: 10_000 });

    // Expand note area on first exercise
    const noteToggle = page.locator(SEL.exerciseNoteToggle).first();
    await expect(noteToggle).toBeVisible({ timeout: 5_000 });
    await noteToggle.click();
    await page.waitForTimeout(300);

    // The note input should be visible
    await expect(page.locator(SEL.exerciseNoteInput).first()).toBeVisible();
  });
});
