import type { Page } from '@playwright/test';
import { SEL, setRow } from './selectors';

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

/**
 * Create a gym via the Workouts tab UI.
 * Navigates to Workouts, expands Gyms collapsible section, fills form, and waits for confirmation.
 */
export async function createGym(page: Page, name: string, location: string) {
  await page.click(SEL.navWorkouts);
  // Expand Gyms collapsible section
  await openCollapsibleSection(page, 'Gyms');
  // Click "+ Add" inside the Gyms section content
  // The "+ Add" button is inside the GymList section rendered within CollapsibleSection
  await page.locator('button:has-text("+ Add")').first().click();
  // Wait for the form to appear (multiple + Add may exist, but gym form has gym-name-input)
  await page.waitForSelector(SEL.gymNameInput, { timeout: 5000 });
  await page.fill(SEL.gymNameInput, name);
  await page.fill(SEL.gymLocationInput, location);
  await page.click(SEL.btnAddGym);
  await page.waitForSelector(`text="${name}"`, { timeout: 5000 });
}

/**
 * Create an exercise via the Workouts tab UI.
 * Navigates to Workouts, expands Exercises collapsible section, fills form, and waits for confirmation.
 */
export async function createExercise(page: Page, name: string, muscleGroup: string) {
  await page.click(SEL.navWorkouts);
  // Expand Exercises collapsible section
  await openCollapsibleSection(page, 'Exercises');
  // Click "+ Add" inside the Exercises section content
  // Need to distinguish from Gyms "+ Add" -- Exercises section is first
  const exerciseAddBtn = page.locator('button:has-text("+ Add")').first();
  await exerciseAddBtn.click();
  // Wait for the exercise form to appear
  await page.waitForSelector(SEL.exerciseNameInput, { timeout: 5000 });
  await page.fill(SEL.exerciseNameInput, name);
  await page.locator(SEL.exerciseMuscleSelect).selectOption(muscleGroup);
  await page.click(SEL.btnAddExercise);
  await page.waitForSelector(`text="${name}"`, { timeout: 5000 });
}

/**
 * Log a single set by filling weight, reps, and optionally RIR.
 * Assumes the set row is already visible on the page.
 */
export async function logSet(
  page: Page,
  setNumber: number,
  weight: string,
  reps: string,
  rir?: string,
) {
  const row = setRow(setNumber);
  await page.fill(row.weight, weight);
  await page.fill(row.reps, reps);
  if (rir) {
    await page.fill(row.rir, rir);
  }
  // Trigger blur to auto-save
  await page.locator(row.reps).blur();
}
