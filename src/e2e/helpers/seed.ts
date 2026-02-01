import type { Page } from '@playwright/test';
import { SEL, setRow } from './selectors';

/**
 * Create a gym via the Workouts tab UI.
 * Navigates to Workouts, expands Gyms section, fills form, and waits for confirmation.
 */
export async function createGym(page: Page, name: string, location: string) {
  await page.click(SEL.navWorkouts);
  // Expand Gyms section (collapsed by default)
  const gymsHeader = page.locator('button[aria-expanded="false"]', { hasText: 'Gyms' });
  if (await gymsHeader.count() > 0) {
    await gymsHeader.click();
    await page.waitForTimeout(300);
  }
  // Click "+ Add" inside the Gyms section content
  await page.locator('section').filter({ hasText: 'Your Gyms' }).locator('button:has-text("+ Add")').click();
  await page.fill(SEL.gymNameInput, name);
  await page.fill(SEL.gymLocationInput, location);
  await page.click(SEL.btnAddGym);
  await page.waitForSelector(`text="${name}"`, { timeout: 5000 });
}

/**
 * Create an exercise via the Workouts tab UI.
 * Navigates to Workouts, expands Exercises section, fills form, and waits for confirmation.
 */
export async function createExercise(page: Page, name: string, muscleGroup: string) {
  await page.click(SEL.navWorkouts);
  // Expand Exercises section (collapsed by default)
  const exercisesHeader = page.locator('button[aria-expanded="false"]', { hasText: 'Exercises' });
  if (await exercisesHeader.count() > 0) {
    await exercisesHeader.click();
    await page.waitForTimeout(300);
  }
  // Click "+ Add" inside the Exercises section content
  await page.locator('section').filter({ hasText: 'Library' }).locator('button:has-text("+ Add")').click();
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
