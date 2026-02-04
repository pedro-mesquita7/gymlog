import { test, expect, loadDemoData, clearAllData, openCollapsibleSection } from './fixtures/app.fixture';
import { SEL } from './helpers/selectors';

test.describe('Parquet export/import round-trip', () => {
  test('exports Parquet, clears data, re-imports, and event count matches', async ({ appPage: page }) => {
    // --- Step 1: Seed demo data (~288+ events) ---
    await loadDemoData(page);

    // --- Step 2: Navigate to Settings and record event count ---
    await page.click(SEL.navSettings);
    await openCollapsibleSection(page, 'Data Backup');
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

    // Save to a named file with .parquet extension (required for import validation)
    const filePath = '/tmp/gymlog-e2e-backup.parquet';
    await download.saveAs(filePath);

    // --- Step 4: Clear all data ---
    await clearAllData(page);

    // Navigate back to Settings to verify cleared state
    // Note: clearHistoricalData preserves exercise/gym events, so count may be > 0
    await page.click(SEL.navSettings);
    await openCollapsibleSection(page, 'Data Backup');
    const clearedCountText = await page.locator(SEL.eventCount).textContent();
    const clearedCount = parseInt(clearedCountText?.match(/(\d+)/)?.[1] || '0', 10);
    expect(clearedCount).toBeLessThan(originalEventCount);

    // --- Step 5: Import the exported Parquet file ---
    await openCollapsibleSection(page, 'Restore from Backup');
    await page.locator(SEL.fileInputParquet).setInputFiles(filePath);

    // Wait for import result
    const importResultEl = page.locator(SEL.importResult);
    await expect(importResultEl).toBeVisible({ timeout: 30_000 });

    // Verify import result contains "Imported" and event count
    const importResultText = await importResultEl.textContent();
    expect(importResultText).toContain('Imported');

    // --- Step 6: Verify import result shows correct count ---
    // The import result message shows "Imported X events (Y duplicates skipped)"
    // Extract the imported count and verify it matches what was cleared
    const importedMatch = importResultText?.match(/Imported (\d+) events/);
    const importedCount = parseInt(importedMatch?.[1] || '0', 10);
    const skippedMatch = importResultText?.match(/(\d+) duplicates skipped/);
    const skippedCount = parseInt(skippedMatch?.[1] || '0', 10);
    // The total (imported + skipped) should equal the original export count
    expect(importedCount + skippedCount).toBe(originalEventCount);
  });

  test('re-importing same file skips duplicates', async ({ appPage: page }) => {
    // --- Step 1: Seed demo data ---
    await loadDemoData(page);

    // --- Step 2: Record original event count ---
    await page.click(SEL.navSettings);
    await openCollapsibleSection(page, 'Data Backup');
    const eventCountEl = page.locator(SEL.eventCount);
    await expect(eventCountEl).toBeVisible({ timeout: 10_000 });

    const eventCountText = await eventCountEl.textContent();
    const originalEventCount = parseInt(eventCountText?.match(/(\d+)/)?.[1] || '0', 10);
    expect(originalEventCount).toBeGreaterThan(200);

    // --- Step 3: Export Parquet file ---
    const downloadPromise = page.waitForEvent('download');
    await page.click(SEL.btnExportBackup);
    const download = await downloadPromise;
    const filePath = '/tmp/gymlog-e2e-dup-test.parquet';
    await download.saveAs(filePath);

    // --- Step 4: Import the same file (all events are duplicates) ---
    await openCollapsibleSection(page, 'Restore from Backup');
    await page.locator(SEL.fileInputParquet).setInputFiles(filePath);

    // Wait for import result
    const importResultEl = page.locator(SEL.importResult);
    await expect(importResultEl).toBeVisible({ timeout: 30_000 });

    // Verify result shows duplicates skipped
    const importResultText = await importResultEl.textContent();
    expect(importResultText).toContain('duplicates skipped');

    // The imported count should be 0 (all duplicates)
    expect(importResultText).toContain('Imported 0 events');

    // --- Step 5: Verify event count hasn't doubled ---
    await openCollapsibleSection(page, 'Data Backup');
    await expect(page.locator(SEL.eventCount)).toContainText(
      `${originalEventCount} events`,
      { timeout: 10_000 },
    );
  });
});
