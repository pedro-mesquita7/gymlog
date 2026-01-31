import type { Page } from '@playwright/test';
import { SEL, setRow } from './selectors';

/**
 * Create a gym via the Settings UI.
 * Navigates to Settings, fills form, and waits for confirmation.
 */
export async function createGym(page: Page, name: string, location: string) {
  await page.click(SEL.navWorkouts);
  // Scroll to the "Your Gyms" section and click "+ Add"
  await page.locator('text="+ Add"').first().click();
  await page.fill(SEL.gymNameInput, name);
  await page.fill(SEL.gymLocationInput, location);
  await page.click(SEL.btnAddGym);
  await page.waitForSelector(`text="${name}"`, { timeout: 5000 });
}

/**
 * Create an exercise via the Settings UI.
 * Navigates to Settings, fills form, and waits for confirmation.
 */
export async function createExercise(page: Page, name: string, muscleGroup: string) {
  await page.click(SEL.navWorkouts);
  // Click the second "+ Add" link on the page (the one in the Exercises section)
  await page.locator('text="+ Add"').nth(1).click();
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
