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

test.describe.serial('Quick Start + Rotation Advancement (TEST-03)', () => {
  test.beforeAll(async ({ browser }) => {
    sharedContext = await browser.newContext({ bypassCSP: true });
    sharedPage = await sharedContext.newPage();
    await sharedPage.goto('/');
    await waitForApp(sharedPage);

    // Clear all data to start fresh
    await sharedPage.click(SEL.navSettings);
    sharedPage.once('dialog', (d) => d.accept());
    const reloadPromise = sharedPage.waitForURL('**/*');
    await sharedPage.click(SEL.btnClearData);
    await reloadPromise;
    await waitForApp(sharedPage);
  });

  test.afterAll(async () => {
    await sharedContext?.close();
  });

  test('set up rotation with two plans and Quick Start appears', async () => {
    const page = sharedPage;

    // --- Navigate to Workouts tab (gym + exercise forms are here) ---
    await page.click(SEL.navWorkouts);

    // --- Create gym: expand Gyms section then click "+ Add" ---
    const gymsCollapsed = page.locator('button[aria-expanded="false"]', { hasText: 'Gyms' });
    if (await gymsCollapsed.count() > 0) {
      await gymsCollapsed.click();
      await page.waitForTimeout(300);
    }
    const gymSection = page.locator('section').filter({ hasText: 'Your Gyms' });
    await gymSection.locator('button:has-text("+ Add")').click();
    await page.fill(SEL.gymNameInput, 'Rotation Gym');
    await page.fill(SEL.gymLocationInput, 'Downtown');
    await page.click(SEL.btnAddGym);
    await page.waitForSelector('text="Rotation Gym"', { timeout: 5000 });

    // --- Create exercise A: expand Exercises section then click "+ Add" ---
    const exercisesCollapsed = page.locator('button[aria-expanded="false"]', { hasText: 'Exercises' });
    if (await exercisesCollapsed.count() > 0) {
      await exercisesCollapsed.click();
      await page.waitForTimeout(300);
    }
    const exerciseSection = page.locator('section').filter({ hasText: 'Library' });
    await exerciseSection.locator('button:has-text("+ Add")').click();
    await page.fill(SEL.exerciseNameInput, 'Rotation OHP');
    await page.locator(SEL.exerciseMuscleSelect).selectOption('Front Delts');
    await page.click(SEL.btnAddExercise);
    await page.waitForSelector('text="Rotation OHP"', { timeout: 5000 });

    // --- Create exercise B ---
    await exerciseSection.locator('button:has-text("+ Add")').click();
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

    // Fill rotation name
    await page.fill(
      'input[placeholder="Rotation name (e.g., Push Pull Legs)"]',
      'Test PPL',
    );

    // Check both plan checkboxes in the rotation section
    const rotationSection = page
      .locator('section')
      .filter({ hasText: 'Workout Rotations' });
    await rotationSection
      .locator('label')
      .filter({ hasText: 'Rotation Upper' })
      .locator('input[type="checkbox"]')
      .check();
    await rotationSection
      .locator('label')
      .filter({ hasText: 'Rotation Lower' })
      .locator('input[type="checkbox"]')
      .check();

    // Click "Create Rotation"
    await page.click('button:has-text("Create Rotation")');

    // Click "Set Active" on the created rotation
    await page.click('button:has-text("Set Active")');

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
