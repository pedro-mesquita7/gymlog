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
 * Clear all data via the Settings UI and wait for app reload.
 * Accepts the confirmation dialog automatically.
 */
async function clearAllData(page: Page) {
  await page.click(SEL.navSettings);
  // Accept the "Are you sure?" confirmation dialog
  page.once('dialog', (d) => d.accept());
  const reloadPromise = page.waitForURL('**/*');
  await page.click(SEL.btnClearData);
  await reloadPromise;
  await waitForApp(page);
}

/**
 * Load demo data via the Settings UI and wait for app reload.
 * Accepts any confirmation dialogs automatically.
 */
async function loadDemoData(page: Page) {
  await page.click(SEL.navSettings);
  // Accept all dialogs during demo data load (may prompt about existing data)
  page.on('dialog', (d) => d.accept());
  const reloadPromise = page.waitForURL('**/*');
  await page.click(SEL.btnLoadDemo);
  await reloadPromise;
  page.removeAllListeners('dialog');
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
    await use(page);
  },
});

export { expect, waitForApp, clearAllData, loadDemoData };
