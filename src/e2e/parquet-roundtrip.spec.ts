import { test, expect, loadDemoData, clearAllData } from './fixtures/app.fixture';
import { SEL } from './helpers/selectors';

test.describe('Parquet export/import round-trip', () => {
  test('exports Parquet, clears data, re-imports, and event count matches', async ({ appPage: page }) => {
    // --- Step 1: Seed demo data (~288+ events) ---
    await loadDemoData(page);

    // --- Step 2: Navigate to Settings and record event count ---
    await page.click(SEL.navSettings);
    const eventCountEl = page.locator(SEL.eventCount);
    await expect(eventCountEl).toBeVisible({ timeout: 10_000 });

    const eventCountText = await eventCountEl.textContent();
    const originalEventCount = parseInt(eventCountText?.match(/(\d+)/)?.[1] || '0', 10);
    expect(originalEventCount).toBeGreaterThan(200);

    // --- Step 3: Export Parquet file ---
    const downloadPromise = page.waitForEvent('download');
    await page.click(SEL.btnExportBackup);
    const download = await downloadPromise;

    // Verify filename pattern
    expect(download.suggestedFilename()).toMatch(/gymlog-backup-.*\.parquet/);

    // Save to temp path (persists for test duration)
    const filePath = await download.path();
    expect(filePath).toBeTruthy();

    // --- Step 4: Clear all data ---
    await clearAllData(page);

    // Navigate back to Settings to verify empty state
    await page.click(SEL.navSettings);
    await expect(page.locator(SEL.eventCount)).toContainText('0 events', { timeout: 10_000 });

    // --- Step 5: Import the exported Parquet file ---
    await page.locator(SEL.fileInputParquet).setInputFiles(filePath!);

    // Wait for import result
    const importResultEl = page.locator(SEL.importResult);
    await expect(importResultEl).toBeVisible({ timeout: 30_000 });

    // Verify import result contains "Imported" and the correct count
    const importResultText = await importResultEl.textContent();
    expect(importResultText).toContain('Imported');
    expect(importResultText).toContain(`${originalEventCount} events`);

    // --- Step 6: Verify event count matches original ---
    await expect(page.locator(SEL.eventCount)).toContainText(
      `${originalEventCount} events`,
      { timeout: 10_000 },
    );
  });

  test('re-importing same file skips duplicates', async ({ appPage: page }) => {
    // --- Step 1: Seed demo data ---
    await loadDemoData(page);

    // --- Step 2: Record original event count ---
    await page.click(SEL.navSettings);
    const eventCountEl = page.locator(SEL.eventCount);
    await expect(eventCountEl).toBeVisible({ timeout: 10_000 });

    const eventCountText = await eventCountEl.textContent();
    const originalEventCount = parseInt(eventCountText?.match(/(\d+)/)?.[1] || '0', 10);
    expect(originalEventCount).toBeGreaterThan(200);

    // --- Step 3: Export Parquet file ---
    const downloadPromise = page.waitForEvent('download');
    await page.click(SEL.btnExportBackup);
    const download = await downloadPromise;
    const filePath = await download.path();
    expect(filePath).toBeTruthy();

    // --- Step 4: Import the same file (all events are duplicates) ---
    await page.locator(SEL.fileInputParquet).setInputFiles(filePath!);

    // Wait for import result
    const importResultEl = page.locator(SEL.importResult);
    await expect(importResultEl).toBeVisible({ timeout: 30_000 });

    // Verify result shows duplicates skipped
    const importResultText = await importResultEl.textContent();
    expect(importResultText).toContain('duplicates skipped');

    // The imported count should be 0 (all duplicates)
    expect(importResultText).toContain('Imported 0 events');

    // --- Step 5: Verify event count hasn't doubled ---
    await expect(page.locator(SEL.eventCount)).toContainText(
      `${originalEventCount} events`,
      { timeout: 10_000 },
    );
  });
});
