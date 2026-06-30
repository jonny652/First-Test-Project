import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createHtmlReport } from 'axe-html-reporter';
import fs from 'fs';
import path from 'path';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

async function triggerLazyLoad(page: Page) {
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      let totalHeight = 0;
      const distance = 300;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          window.scrollTo(0, 0);
          resolve();
        }
      }, 100);
    });
  });
}

async function waitForImagesLoaded(page: Page) {
  await page.waitForFunction(
    () => Array.from(document.images).every((img) => img.complete),
    { timeout: 10000 },
  );
}

test.describe('Dyson manufacturer page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://source.thenbs.com/en/gb');
    await page.getByRole('button', { name: 'Close dialog' }).click();
    await page.getByRole('textbox', { name: 'Search' }).click();
    await page.getByRole('textbox', { name: 'Search' }).fill('dyson');
    await page.getByRole('textbox', { name: 'Search' }).press('Enter');
    await page.getByRole('tab', { name: 'Manufacturers' }).click();
    await page.getByRole('link', { name: 'Dyson Dyson Technology for' }).click();
    await expect(page).toHaveURL("https://source.thenbs.com/en/gb/manufacturer/dyson/nakAxHWxDZprdqkBaCdn4U/overview");
  });


  test('assert that the heading is correct on the dyson homepage', async ({ page }) => {
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('Dyson');
  });

  test('Ensure the HREF attribute on the source logo is as expected', async ({ page }) => {
    const logo = page.locator('a.brand-primary.wrapper');
    await expect(logo).toHaveAttribute('href', '/en/gb');
  });

  test("assert the I'm a manufacturer button is visible, has correct text and correct href", async ({ page }) => {
    const manufacturerButton = page.locator('a[action="manufacturer-header-link"]');
    await expect(manufacturerButton).toBeVisible();
    await expect(manufacturerButton).toContainText("I'm a manufacturer");
    await expect(manufacturerButton).toHaveAttribute('href', 'https://manufacturers.thenbs.com/nbs-source');
  });

  test('visual regression of the dyson manufacturer page', async ({ page }) => {
    // 1. Scroll top-to-bottom so lazy-loaded images start fetching.
    await triggerLazyLoad(page);

    // 2. Wait for in-flight network requests (images) to finish.
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    // 3. Soft check that every <img> reports as loaded.
    try {
      await waitForImagesLoaded(page);
    } catch {
      const pending = await page.evaluate(() =>
        Array.from(document.images)
          .filter((img) => !img.complete)
          .map((img) => img.currentSrc || img.src || '<no src>'),
      );
      console.warn(
        `waitForImagesLoaded timed out — ${pending.length} image(s) still loading. ` +
          `Continuing with screenshot. Pending:\n  ${pending.join('\n  ')}`,
      );
    }

    // 4. Wait for web fonts.
    await page.evaluate(() => document.fonts.ready);

    // 5. Short pause to absorb final repaints and CSS transitions.
    await new Promise((resolve) => setTimeout(resolve, 500));

    // --- File paths ---
    const snapshotDir = path.resolve('tests/snapshots');
    const platformSuffix = process.platform;
    const baselinePath = path.join(snapshotDir, `dyson-visual-${platformSuffix}.png`);
    const actualPath = path.join(snapshotDir, `dyson-visual-${platformSuffix}-actual.png`);
    const diffPath = path.join(snapshotDir, `dyson-visual-${platformSuffix}-diff.png`);

    fs.mkdirSync(snapshotDir, { recursive: true });

    // 6. Full-page screenshot.
    const screenshotBuffer = await page.screenshot({ fullPage: true });

    // First run: save baseline and exit.
    if (!fs.existsSync(baselinePath)) {
      fs.writeFileSync(baselinePath, screenshotBuffer);
      console.log(`Baseline created at ${baselinePath}. Re-run to compare.`);
      return;
    }

    // Subsequent runs: compare against baseline.
    fs.writeFileSync(actualPath, screenshotBuffer);

    const baseline = PNG.sync.read(fs.readFileSync(baselinePath));
    const actual = PNG.sync.read(screenshotBuffer);
    const { width, height } = baseline;
    const diff = new PNG({ width, height });

    const diffPixels = pixelmatch(
      baseline.data, actual.data, diff.data,
      width, height,
      { threshold: 0.1 },
    );

    fs.writeFileSync(diffPath, PNG.sync.write(diff));

    const diffRatio = diffPixels / (width * height);
    if (diffRatio > 0) {
      const error = new Error(
        `Visual regression detected: ${diffPixels} pixels differ ` +
          `(${(diffRatio * 100).toFixed(6)}%). Diff saved to ${diffPath}`,
      ) as Error & { diffPath?: string };
      error.diffPath = diffPath;
      throw error;
    }
  });

  test('accessibility audit of the dyson manufacturer page', async ({ page }) => {
    const results = await new AxeBuilder({ page }).analyze();
    createHtmlReport({
      results,
      options: {
        outputDir: 'accessibility-reports',
        reportFileName: 'dyson-accessibility-report.html',
      },
    });
  });
});
