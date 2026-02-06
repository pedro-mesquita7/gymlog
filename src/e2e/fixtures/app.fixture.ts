import { test as base, expect, type Page } from '@playwright/test';
import { SEL } from '../helpers/selectors';

/**
 * Wait for the app to be fully loaded and DuckDB initialized.
 * Detects readiness by waiting for the navigation bar to render.
 */
async function waitForApp(page: Page) {
  await page.waitForSelector(SEL.navWorkouts, { timeout: 30_000 });
}

/**
 * Enable Developer Mode in Settings if not already enabled.
 * Must be on the Settings tab before calling.
 */
async function enableDeveloperMode(page: Page) {
  const toggle = page.locator(SEL.developerModeToggle);
  // Wait for toggle to be visible (settings tab animation may be in progress)
  await toggle.waitFor({ state: 'visible', timeout: 10_000 });
  await toggle.scrollIntoViewIfNeeded();
  // Check if developer mode is already on by looking for the Demo Data section
  const demoSection = page.locator('button[aria-expanded]:has-text("Demo Data & Reset")');
  if (await demoSection.count() === 0) {
    await toggle.click();
    // Wait for the Demo Data section to appear
    await demoSection.first().waitFor({ state: 'visible', timeout: 5_000 });
  }
}

/**
 * Open a CollapsibleSection by title if not already open.
 * Clicks the section button and waits for animation to complete.
 */
async function openCollapsibleSection(page: Page, title: string) {
  // Wait for the button to be present in DOM (it may be animating in)
  const anyButton = page.locator(`button[aria-expanded]:has-text("${title}")`);
  await anyButton.first().waitFor({ state: 'visible', timeout: 10_000 });

  // Check if it needs to be expanded
  const isExpanded = await anyButton.first().getAttribute('aria-expanded');
  if (isExpanded !== 'true') {
    await anyButton.first().scrollIntoViewIfNeeded();
    await anyButton.first().click();
    await page.waitForTimeout(400);
  }
}

/**
 * Clear all data via the Settings UI and wait for app reload.
 * Navigates to settings, enables developer mode, opens Demo Data section,
 * clicks Clear button, and confirms in the Dialog.
 */
async function clearAllData(page: Page) {
  await page.click(SEL.navSettings);
  await enableDeveloperMode(page);
  await openCollapsibleSection(page, 'Demo Data & Reset');

  // Click "Clear Historical Data" button
  await page.click(SEL.btnClearData);

  // Confirm in the Dialog component (not window.confirm)
  await page.locator('dialog button:has-text("Clear Data")').click();

  // Wait for the page to reload (clearHistoricalData calls window.location.reload())
  await page.waitForSelector(SEL.navWorkouts, { state: 'detached', timeout: 30_000 }).catch(() => {});
  await waitForApp(page);
}

/**
 * Load demo data via the Settings UI and wait for app reload.
 * Navigates to settings, enables developer mode, opens Demo Data section,
 * clicks Import button, and confirms in any Dialog if data already exists.
 */
async function loadDemoData(page: Page) {
  await page.click(SEL.navSettings);
  await enableDeveloperMode(page);
  await openCollapsibleSection(page, 'Demo Data & Reset');

  // Click "Import Demo Data" button
  await page.click(SEL.btnLoadDemo);

  // If a confirmation dialog appears (data exists), confirm it
  const confirmBtn = page.locator('dialog button:has-text("Confirm")');
  if (await confirmBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
    await confirmBtn.click();
  }

  // Wait for the page to reload (demo data calls window.location.reload())
  // The nav bar will disappear during reload and reappear
  await page.waitForSelector(SEL.navWorkouts, { state: 'detached', timeout: 30_000 }).catch(() => {});
  await waitForApp(page);
}

/**
 * Custom Playwright fixture that navigates to the app and waits for readiness.
 *
 * Usage in spec files:
 *   import { test, expect } from '../fixtures/app.fixture';
 *   test('my test', async ({ appPage }) => { ... });
 */
export const test = base.extend<{
  appPage: Page;
}>({
  appPage: async ({ page }, use) => {
    await page.goto('/');
    await waitForApp(page);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(page);
  },
});

export { expect, waitForApp, clearAllData, loadDemoData, enableDeveloperMode, openCollapsibleSection };
