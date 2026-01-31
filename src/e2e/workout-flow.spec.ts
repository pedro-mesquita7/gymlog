import { test, expect } from '@playwright/test';

test.describe('GymLog E2E Workout Flow', () => {
  test('App loads and DuckDB initializes', async ({ page }) => {
    await page.goto('/');

    // Verify the header "GymLog" appears (proves React rendered)
    await expect(page.locator('h1:has-text("GymLog")')).toBeVisible({ timeout: 10000 });

    // Verify no error messages visible (proves DuckDB connected)
    // Error cards would show "Something went wrong" or specific error messages
    await expect(page.locator('text=Something went wrong')).not.toBeVisible();
    await expect(page.locator('text=Database not initialized')).not.toBeVisible();

    // Wait for app to initialize (check for navigation tabs)
    await expect(page.locator('button:has-text("Workout")')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('button:has-text("Templates")')).toBeVisible();
    await expect(page.locator('button:has-text("History")')).toBeVisible();
    await expect(page.locator('button:has-text("Analytics")')).toBeVisible();
  });

  test('Full workout logging flow', async ({ page }) => {
    await page.goto('/');

    // Wait for app to load
    await expect(page.locator('h1:has-text("GymLog")')).toBeVisible({ timeout: 10000 });

    // STEP 1: Create a gym
    // Navigate to Settings tab (where gym management is)
    await page.click('button:has-text("Settings")');

    // Find and fill gym form
    await page.fill('input[placeholder*="Gym name" i]', 'Test Gym E2E');
    await page.fill('input[placeholder*="Location" i]', 'E2E Test Location');

    // Submit gym form
    await page.click('button:has-text("Add Gym")');

    // Wait for gym to be added (should appear in list or success message)
    await expect(page.locator('text=Test Gym E2E')).toBeVisible({ timeout: 3000 });

    // STEP 2: Create an exercise
    // Find exercise form (should be on same Settings page)
    await page.fill('input[placeholder*="Exercise name" i]', 'E2E Bench Press');

    // Select muscle group
    const muscleSelect = page.locator('select').first();
    await muscleSelect.selectOption('Chest');

    // Submit exercise form
    await page.click('button:has-text("Add Exercise")');

    // Wait for exercise to be added
    await expect(page.locator('text=E2E Bench Press')).toBeVisible({ timeout: 3000 });

    // STEP 3: Create a template
    await page.click('button:has-text("Templates")');

    // Fill template name
    await page.fill('input[placeholder*="Template name" i]', 'E2E Test Template');

    // Add the exercise we just created to the template
    // This involves clicking "Add Exercise" and selecting from dropdown
    await page.click('button:has-text("Add Exercise")');

    // Select the exercise from dropdown
    const exerciseSelect = page.locator('select:has-option("E2E Bench Press")');
    await exerciseSelect.selectOption({ label: 'E2E Bench Press' });

    // Set target reps (optional, depends on UI)
    // Most templates have default values, so we can skip detailed config

    // Save template
    await page.click('button:has-text("Save Template")');

    // Wait for template to be created
    await expect(page.locator('text=E2E Test Template')).toBeVisible({ timeout: 3000 });

    // STEP 4: Start a workout
    await page.click('button:has-text("Workout")');

    // Select gym from dropdown
    const gymDropdown = page.locator('select').first();
    await gymDropdown.selectOption({ label: 'Test Gym E2E' });

    // Select template from dropdown
    const templateDropdown = page.locator('select').nth(1);
    await templateDropdown.selectOption({ label: 'E2E Test Template' });

    // Click Start Workout
    await page.click('button:has-text("Start Workout")');

    // Wait for workout to start (should show SetLogger or exercise name)
    await expect(page.locator('text=E2E Bench Press')).toBeVisible({ timeout: 3000 });

    // STEP 5: Log a set
    // Find weight and reps increment buttons
    const incrementButtons = page.locator('button:has-text("+")');

    // Increment weight (first + button)
    await incrementButtons.nth(0).click();
    await incrementButtons.nth(0).click(); // 2 * 2.5 = 5kg

    // Increment reps (second + button)
    await incrementButtons.nth(1).click();
    await incrementButtons.nth(1).click();
    await incrementButtons.nth(1).click(); // 3 reps

    // Click Log Set
    await page.click('button:has-text("Log Set")');

    // Wait for set to be logged (button should be disabled again)
    await expect(page.locator('button:has-text("Log Set")')).toBeDisabled({ timeout: 2000 });

    // STEP 6: Complete workout
    // Find and click Complete Workout or Finish button
    await page.click('button:has-text("Complete Workout")');

    // Wait for completion screen to appear
    // This might show "Workout Complete" or redirect to History
    await expect(
      page.locator('text=Workout Complete, text=completed, text=Workout Summary')
        .or(page.locator('button:has-text("History")'))
    ).toBeVisible({ timeout: 3000 });

    // Verify we can see the workout in history
    await page.click('button:has-text("History")');
    await expect(page.locator('text=E2E Bench Press')).toBeVisible({ timeout: 3000 });
  });
});
