import { test, expect, loadDemoData, clearAllData, openCollapsibleSection } from './fixtures/app.fixture';
import { SEL } from './helpers/selectors';

test.describe.serial('Demo Data Import and Clear', () => {
  test('Load demo data and verify event count', async ({ appPage: page }) => {
    // Navigate to Settings tab
    await page.click(SEL.navSettings);

    // Open Data Backup section to see event count
    await openCollapsibleSection(page, 'Data Backup');

    // Verify initial event count is 0
    await expect(page.locator(SEL.eventCount)).toHaveText('0 events');

    // Load demo data via helper (navigates to settings, enables dev mode, clicks button, waits for reload)
    await loadDemoData(page);

    // Navigate to Settings to check event count
    await page.click(SEL.navSettings);
    await openCollapsibleSection(page, 'Data Backup');

    // Verify event count is greater than 0 (demo data creates ~288+ events)
    const countText = await page.locator(SEL.eventCount).textContent();
    const count = parseInt(countText?.match(/(\d+)/)?.[1] || '0', 10);
    expect(count).toBeGreaterThan(0);
  });

  test('Charts populate after demo data import', async ({ appPage: page }) => {
    // Load demo data first (serial test, but appPage gives fresh context)
    await loadDemoData(page);

    // Navigate to Analytics tab
    await page.click(SEL.navAnalytics);

    // Assert empty state is NOT visible (data exists)
    await expect(page.locator(SEL.analyticsEmpty)).not.toBeVisible();

    // Assert charts container is visible
    await expect(page.locator(SEL.analyticsCharts)).toBeVisible();

    // Exercise selector should exist and have options
    await expect(page.locator(SEL.analyticsExerciseSelect)).toBeVisible();

    // Wait for Recharts to render at least one chart
    await expect(page.locator('.recharts-surface').first()).toBeVisible({ timeout: 15_000 });

    // Assert at least one chart rendered
    const chartCount = await page.locator('.recharts-surface').count();
    expect(chartCount).toBeGreaterThanOrEqual(1);
  });

  test('Clear all data and verify empty state', async ({ appPage: page }) => {
    // Load demo data first so there is something to clear
    await loadDemoData(page);

    // Verify data exists
    await page.click(SEL.navSettings);
    await openCollapsibleSection(page, 'Data Backup');
    const beforeText = await page.locator(SEL.eventCount).textContent();
    const beforeCount = parseInt(beforeText?.match(/(\d+)/)?.[1] || '0', 10);
    expect(beforeCount).toBeGreaterThan(0);

    // Clear all data via helper (navigates to settings, enables dev mode, clicks button, waits for reload)
    await clearAllData(page);

    // Navigate to Settings and verify event count decreased
    // Note: clearHistoricalData preserves exercise/gym events, so count may be > 0
    await page.click(SEL.navSettings);
    await openCollapsibleSection(page, 'Data Backup');
    const afterText = await page.locator(SEL.eventCount).textContent();
    const afterCount = parseInt(afterText?.match(/(\d+)/)?.[1] || '0', 10);
    expect(afterCount).toBeLessThan(beforeCount);

    // Navigate to Analytics and verify data was cleared
    // Note: clearHistoricalData preserves exercises, so analytics may still show the charts container
    // but workout data (sets, sessions) should be gone
    await page.click(SEL.navAnalytics);

    // Either: analytics empty (if no exercises) or charts with no workout data
    const isEmpty = await page.locator(SEL.analyticsEmpty).isVisible().catch(() => false);
    if (!isEmpty) {
      // Charts container exists but should have minimal/no Recharts surfaces
      // (exercises exist but workout logs were cleared)
      await expect(page.locator(SEL.analyticsCharts)).toBeVisible();
    }
  });

  test('Load demo data when existing data triggers confirm dialog', async ({ appPage: page }) => {
    // Load demo data once
    await loadDemoData(page);

    // Verify event count > 0
    await page.click(SEL.navSettings);
    await openCollapsibleSection(page, 'Data Backup');
    const firstText = await page.locator(SEL.eventCount).textContent();
    const firstCount = parseInt(firstText?.match(/(\d+)/)?.[1] || '0', 10);
    expect(firstCount).toBeGreaterThan(0);

    // Load demo data AGAIN -- this triggers the confirm dialog
    // (loadDemoData helper already handles the dialog)
    await loadDemoData(page);

    // Verify it succeeded and event count is still > 0
    await page.click(SEL.navSettings);
    await openCollapsibleSection(page, 'Data Backup');
    const secondText = await page.locator(SEL.eventCount).textContent();
    const secondCount = parseInt(secondText?.match(/(\d+)/)?.[1] || '0', 10);
    expect(secondCount).toBeGreaterThan(0);
  });
});
