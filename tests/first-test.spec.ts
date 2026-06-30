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

  test('visual regression of the dyson manufacturer page', async ({ page }, testInfo) => {
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
    // Include the browser/project name in the suffix so each browser keeps its
    // own baseline. Browsers render at different device scale factors (e.g.
    // webkit/Desktop Safari uses DPR 2), so a shared baseline would never match.
    const platformSuffix = `${process.platform}-${testInfo.project.name}`;
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

    // Crop both images to the smaller of the two dimensions so that minor
    // page-height differences (dynamic content, ads, cookie banners) don't
    // crash pixelmatch, which requires identical image sizes.
    const width = Math.min(baseline.width, actual.width);
    const height = Math.min(baseline.height, actual.height);

    if (baseline.width !== actual.width || baseline.height !== actual.height) {
      console.warn(
        `Image dimensions differ — baseline: ${baseline.width}x${baseline.height}, ` +
          `actual: ${actual.width}x${actual.height}. Comparing cropped region ${width}x${height}.`,
      );
    }

    const cropPNG = (src: PNG): PNG => {
      const out = new PNG({ width, height });
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const srcIdx = (y * src.width + x) * 4;
          const dstIdx = (y * width + x) * 4;
          out.data[dstIdx]     = src.data[srcIdx];
          out.data[dstIdx + 1] = src.data[srcIdx + 1];
          out.data[dstIdx + 2] = src.data[srcIdx + 2];
          out.data[dstIdx + 3] = src.data[srcIdx + 3];
        }
      }
      return out;
    };

    const croppedBaseline = cropPNG(baseline);
    const croppedActual   = cropPNG(actual);
    const diff = new PNG({ width, height });

    const diffPixels = pixelmatch(
      croppedBaseline.data, croppedActual.data, diff.data,
      width, height,
      { threshold: 0.1 },
    );

    fs.writeFileSync(diffPath, PNG.sync.write(diff));

    const diffRatio = diffPixels / (width * height);
    // Allow a small tolerance to absorb anti-aliasing, sub-pixel font shifts and
    // other harmless rendering noise. Fail only when the diff exceeds 1%.
    const diffThreshold = 0.01;
    if (diffRatio > diffThreshold) {
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
