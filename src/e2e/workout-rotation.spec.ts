import { test as base, expect, type BrowserContext, type Page } from '@playwright/test';
import { SEL } from './helpers/selectors';
import { logSet } from './helpers/seed';

// Shared context for serial tests so state (localStorage + OPFS) persists between tests
let sharedContext: BrowserContext;
let sharedPage: Page;

const test = base.extend({});

async function waitForApp(page: Page) {
  await page.waitForSelector(SEL.navWorkouts, { timeout: 30_000 });
}

/**
 * Enable Developer Mode in Settings if not already enabled.
 */
async function enableDeveloperMode(page: Page) {
  const toggle = page.locator(SEL.developerModeToggle);
  await toggle.waitFor({ state: 'visible', timeout: 10_000 });
  await toggle.scrollIntoViewIfNeeded();
  const demoSection = page.locator('button[aria-expanded]:has-text("Demo Data & Reset")');
  if (await demoSection.count() === 0) {
    await toggle.click();
    await demoSection.first().waitFor({ state: 'visible', timeout: 5_000 });
  }
}

/**
 * Open a CollapsibleSection by title if not already open.
 */
async function openCollapsibleSection(page: Page, title: string) {
  const anyButton = page.locator(`button[aria-expanded]:has-text("${title}")`);
  await anyButton.first().waitFor({ state: 'visible', timeout: 10_000 });
  const isExpanded = await anyButton.first().getAttribute('aria-expanded');
  if (isExpanded !== 'true') {
    await anyButton.first().scrollIntoViewIfNeeded();
    await anyButton.first().click();
    await page.waitForTimeout(400);
  }
}

test.describe.serial('Quick Start + Rotation Advancement (TEST-03)', () => {
  test.beforeAll(async ({ browser }) => {
    sharedContext = await browser.newContext({ bypassCSP: true });
    sharedPage = await sharedContext.newPage();
    await sharedPage.goto('/');
    await waitForApp(sharedPage);

    // Clear all data to start fresh
    await sharedPage.click(SEL.navSettings);
    await enableDeveloperMode(sharedPage);
    await openCollapsibleSection(sharedPage, 'Demo Data & Reset');

    await sharedPage.click(SEL.btnClearData);
    await sharedPage.locator('dialog button:has-text("Clear Data")').click();
    // Wait for page to reload
    await sharedPage.waitForSelector(SEL.navWorkouts, { state: 'detached', timeout: 30_000 }).catch(() => {});
    await waitForApp(sharedPage);
  });

  test.afterAll(async () => {
    await sharedContext?.close();
  });

  test('set up rotation with two plans and Quick Start appears', async () => {
    const page = sharedPage;

    // --- Navigate to Workouts tab (gym + exercise forms are here) ---
    await page.click(SEL.navWorkouts);

    // --- Create gym: expand Gyms collapsible section then click "+ Add" ---
    await openCollapsibleSection(page, 'Gyms');
    // After expanding Gyms, find the "+ Add" button within
    // Gyms section is rendered after Exercises, so we need the second "+ Add"
    // But since only Gyms is expanded, the visible one should be in Gyms
    const gymAddBtns = page.locator('button:has-text("+ Add")');
    // The last visible "+ Add" is for Gyms (Exercises section is collapsed)
    await gymAddBtns.last().click();
    await page.waitForSelector(SEL.gymNameInput, { timeout: 5000 });
    await page.fill(SEL.gymNameInput, 'Rotation Gym');
    await page.fill(SEL.gymLocationInput, 'Downtown');
    await page.click(SEL.btnAddGym);
    await page.waitForSelector('text="Rotation Gym"', { timeout: 5000 });

    // --- Create exercise A: expand Exercises collapsible section then click "+ Add" ---
    await openCollapsibleSection(page, 'Exercises');
    // Now Exercises has an "+ Add" button -- it's the first one
    await page.locator('button:has-text("+ Add")').first().click();
    await page.waitForSelector(SEL.exerciseNameInput, { timeout: 5000 });
    await page.fill(SEL.exerciseNameInput, 'Rotation OHP');
    await page.locator(SEL.exerciseMuscleSelect).selectOption('Front Delts');
    await page.click(SEL.btnAddExercise);
    await page.waitForSelector('text="Rotation OHP"', { timeout: 5000 });

    // --- Create exercise B ---
    await page.locator('button:has-text("+ Add")').first().click();
    await page.waitForSelector(SEL.exerciseNameInput, { timeout: 5000 });
    await page.fill(SEL.exerciseNameInput, 'Rotation Row');
    await page.locator(SEL.exerciseMuscleSelect).selectOption('Upper Back');
    await page.click(SEL.btnAddExercise);
    await page.waitForSelector('text="Rotation Row"', { timeout: 5000 });

    // --- Create Plan 1: "Rotation Upper" with OHP ---
    await page.click(SEL.navPlans);
    await page.click('button:has-text("+ New Plan")');
    await page.fill(SEL.planNameInput, 'Rotation Upper');
    await page.click('button:has-text("Add Exercises")');
    await page
      .locator('label')
      .filter({ hasText: 'Rotation OHP' })
      .locator('input[type="checkbox"]')
      .check();
    await page.click(SEL.btnCreatePlan);
    await expect(page.locator('text=Rotation Upper')).toBeVisible({
      timeout: 5000,
    });

    // --- Create Plan 2: "Rotation Lower" with Row ---
    await page.click('button:has-text("+ New Plan")');
    await page.fill(SEL.planNameInput, 'Rotation Lower');
    await page.click('button:has-text("Add Exercises")');
    await page
      .locator('label')
      .filter({ hasText: 'Rotation Row' })
      .locator('input[type="checkbox"]')
      .check();
    await page.click(SEL.btnCreatePlan);
    await expect(page.locator('text=Rotation Lower')).toBeVisible({
      timeout: 5000,
    });

    // --- Settings: create rotation, set active, choose default gym ---
    await page.click(SEL.navSettings);

    // Open Manage Rotations collapsible section
    await openCollapsibleSection(page, 'Manage Rotations');

    // Click the "+" button to show the create form
    await page.locator('button[aria-label="Create new rotation"]').click();
    await page.waitForTimeout(300);

    // Fill rotation name
    await page.fill(
      'input[placeholder="Rotation name (e.g., Push Pull Legs)"]',
      'Test PPL',
    );

    // Check both plan checkboxes in the create form
    // The create form is inside the Manage Rotations collapsible
    const createForm = page.locator('text=Create New Rotation').locator('..');
    await createForm
      .locator('label')
      .filter({ hasText: 'Rotation Upper' })
      .locator('input[type="checkbox"]')
      .check();
    await createForm
      .locator('label')
      .filter({ hasText: 'Rotation Lower' })
      .locator('input[type="checkbox"]')
      .check();

    // Click "Create Rotation"
    await page.click('button:has-text("Create Rotation")');

    // Set Active rotation via the dropdown at top of settings
    // Scroll to top first
    await page.locator('#active-rotation').scrollIntoViewIfNeeded();
    await page.locator('#active-rotation').selectOption({ label: 'Test PPL' });

    // Select default gym
    await page.locator('#default-gym').selectOption({ label: 'Rotation Gym (Downtown)' });

    // --- Navigate to Workouts tab and verify Quick Start ---
    await page.click(SEL.navWorkouts);

    await expect(page.locator(SEL.quickStartCard)).toBeVisible({
      timeout: 5000,
    });
    await expect(page.locator(SEL.rotationInfo)).toContainText(
      'Workout 1 of 2',
    );
    await expect(page.locator(SEL.quickStartCard)).toContainText(
      'Rotation Upper',
    );
  });

  test('Quick Start workout and rotation advances to next plan', async () => {
    const page = sharedPage;

    // Should already be on Workouts tab with Quick Start visible
    await expect(page.locator(SEL.quickStartCard)).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator(SEL.rotationInfo)).toContainText(
      'Workout 1 of 2',
    );

    // Click Quick Start
    await page.click(SEL.btnQuickStart);

    // Wait for workout to start
    await expect(page.locator(SEL.btnFinishWorkout)).toBeVisible({
      timeout: 5000,
    });

    // Log a set: set 1, weight=40, reps=8, rir=2
    await logSet(page, 1, '40', '8', '2');

    // Finish the workout
    await page.click(SEL.btnFinishWorkout);

    // WorkoutComplete dialog - save the workout
    await expect(page.locator(SEL.workoutCompleteHeading)).toBeVisible({
      timeout: 5000,
    });
    await page.click(SEL.btnSaveWorkout);

    // WorkoutSaved phase - click Done
    await expect(page.locator(SEL.workoutSavedHeading)).toBeVisible({
      timeout: 10000,
    });
    await page.click(SEL.btnDoneWorkout);

    // Back on workouts tab - rotation should have advanced
    await expect(page.locator(SEL.quickStartCard)).toBeVisible({
      timeout: 5000,
    });
    await expect(page.locator(SEL.rotationInfo)).toContainText(
      'Workout 2 of 2',
    );
    await expect(page.locator(SEL.quickStartCard)).toContainText(
      'Rotation Lower',
    );
  });

  test('rotation wraps around after completing all plans', async () => {
    const page = sharedPage;

    // Should see Quick Start with Rotation Lower
    await expect(page.locator(SEL.quickStartCard)).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator(SEL.rotationInfo)).toContainText(
      'Workout 2 of 2',
    );

    // Click Quick Start for Rotation Lower
    await page.click(SEL.btnQuickStart);
    await expect(page.locator(SEL.btnFinishWorkout)).toBeVisible({
      timeout: 5000,
    });

    // Log a set: set 1, weight=60, reps=10
    await logSet(page, 1, '60', '10');

    // Finish and save
    await page.click(SEL.btnFinishWorkout);
    await expect(page.locator(SEL.workoutCompleteHeading)).toBeVisible({
      timeout: 5000,
    });
    await page.click(SEL.btnSaveWorkout);
    await expect(page.locator(SEL.workoutSavedHeading)).toBeVisible({
      timeout: 10000,
    });
    await page.click(SEL.btnDoneWorkout);

    // Rotation should wrap back to position 1
    await expect(page.locator(SEL.quickStartCard)).toBeVisible({
      timeout: 5000,
    });
    await expect(page.locator(SEL.rotationInfo)).toContainText(
      'Workout 1 of 2',
    );
    await expect(page.locator(SEL.quickStartCard)).toContainText(
      'Rotation Upper',
    );
  });
});
