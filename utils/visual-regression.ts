import { type Page, type TestInfo } from "@playwright/test";
import fs from "fs";
import path from "path";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

/**
 * Reusable visual-regression helper.
 *
 * This is deliberately framework-agnostic test *infrastructure*, not page-specific
 * behaviour, so it lives in `utils/` rather than inside a page object. Any test can
 * screenshot the current page and compare it against a saved baseline.
 *
 * `snapshotName` is the file-name prefix for this page's baseline (e.g. "dyson-visual").
 */

/** Scrolls the full page top-to-bottom so lazy-loaded images start fetching. */
async function triggerLazyLoad(page: Page): Promise<void> {
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

/** Waits until every <img> on the page reports as fully loaded. */
async function waitForImagesLoaded(page: Page): Promise<void> {
  await page.waitForFunction(
    () => Array.from(document.images).every((img) => img.complete),
    { timeout: 10000 },
  );
}

/** Screenshots the page and compares it against a saved baseline (visual regression). */
export async function applyVisualRegression(
  page: Page,
  testInfo: TestInfo,
  snapshotName: string,
): Promise<void> {
  // Get the page fully loaded and settled before screenshotting.
  await triggerLazyLoad(page);
  await page.waitForLoadState("networkidle", { timeout: 30000 });

  // Check every image loaded (warn but carry on if not).
  try {
    await waitForImagesLoaded(page);
  } catch {
    const pending = await page.evaluate(() =>
      Array.from(document.images)
        .filter((img) => !img.complete)
        .map((img) => img.currentSrc || img.src || "<no src>"),
    );
    console.warn(
      `waitForImagesLoaded timed out — ${pending.length} image(s) still loading. ` +
      `Continuing with screenshot. Pending:\n  ${pending.join("\n  ")}`,
    );
  }

  // Wait for web fonts and any final animations to settle.
  await page.evaluate(() => document.fonts.ready);
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Each browser gets its own baseline (they render at different sizes).
  const snapshotDir = path.resolve("tests/snapshots");
  const platformSuffix = `${process.platform}-${testInfo.project.name}`;
  const baselinePath = path.join(snapshotDir, `${snapshotName}-${platformSuffix}.png`);
  const actualPath = path.join(snapshotDir, `${snapshotName}-${platformSuffix}-actual.png`);
  const diffPath = path.join(snapshotDir, `${snapshotName}-${platformSuffix}-diff.png`);

  fs.mkdirSync(snapshotDir, { recursive: true });

  // Take a full-page screenshot.
  const screenshotBuffer = await page.screenshot({ fullPage: true });

  // First run: save the screenshot as the baseline, then stop.
  if (!fs.existsSync(baselinePath)) {
    fs.writeFileSync(baselinePath, screenshotBuffer);
    console.log(`Baseline created at ${baselinePath}. Re-run to compare.`);
    return;
  }

  // Later runs: save the screenshot and compare it to the baseline.
  fs.writeFileSync(actualPath, screenshotBuffer);

  const baseline = PNG.sync.read(fs.readFileSync(baselinePath));
  const actual = PNG.sync.read(screenshotBuffer);

  // Crop both to the smaller size so a small height change doesn't error.
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
        out.data[dstIdx] = src.data[srcIdx];
        out.data[dstIdx + 1] = src.data[srcIdx + 1];
        out.data[dstIdx + 2] = src.data[srcIdx + 2];
        out.data[dstIdx + 3] = src.data[srcIdx + 3];
      }
    }
    return out;
  };

  const croppedBaseline = cropPNG(baseline);
  const croppedActual = cropPNG(actual);
  const diff = new PNG({ width, height });

  const diffPixels = pixelmatch(croppedBaseline.data, croppedActual.data, diff.data, width, height, {
    threshold: 0.1,
  });

  // Save the diff image, highlighting any pixels that changed.
  fs.writeFileSync(diffPath, PNG.sync.write(diff));

  // Allow up to 1% difference to ignore minor rendering noise.
  const diffRatio = diffPixels / (width * height);
  const diffThreshold = 0.01;
  if (diffRatio > diffThreshold) {
    const error = new Error(
      `Visual regression detected: ${diffPixels} pixels differ ` +
      `(${(diffRatio * 100).toFixed(6)}%). Diff saved to ${diffPath}`,
    ) as Error & { diffPath?: string };
    error.diffPath = diffPath;
    throw error;
  }
}
