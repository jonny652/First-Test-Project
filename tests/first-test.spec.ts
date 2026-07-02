import { test, expect } from "../fixtures/test-options";
import AxeBuilder from "@axe-core/playwright";
import { createHtmlReport } from "axe-html-reporter";
import fs from "fs";
import path from "path";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

test.describe("Dyson manufacturer page", () => {
  // Search for Dyson and open its manufacturer page before each test.
  test.beforeEach(async ({ nbsHomePage, dysonManufacturerPage, page }) => {
    await nbsHomePage.navigateToDysonManufacturerPage();
    await expect(page).toHaveURL(dysonManufacturerPage.url);
  });

  // 1. Check the main heading is visible and mentions Dyson.
  test("assert that the heading is correct on the dyson homepage", async ({ dysonManufacturerPage }) => {
    await expect(dysonManufacturerPage.heading).toBeVisible();
    await expect(dysonManufacturerPage.heading).toContainText("Dyson");
  });

  // 2. Check the Source logo links back to the homepage.
  test("Ensure the HREF attribute on the source logo is as expected", async ({ dysonManufacturerPage }) => {
    await expect(dysonManufacturerPage.sourceLogo).toHaveAttribute("href", "/en/gb");
  });

  // 3. Check the "I'm a manufacturer" button is visible with the right text and link.
  test("assert the I'm a manufacturer button is visible, has correct text and correct href", async ({ dysonManufacturerPage }) => {
    await expect(dysonManufacturerPage.manufacturerButton).toBeVisible();
    await expect(dysonManufacturerPage.manufacturerButton).toContainText("I'm a manufacturer");
    await expect(dysonManufacturerPage.manufacturerButton).toHaveAttribute("href", "https://manufacturers.thenbs.com/nbs-source");
  });

  // 4. Compare the page against a saved screenshot (visual regression).
  test("visual regression of the dyson manufacturer page", async ({ page, dysonManufacturerPage }, testInfo) => {
    // Get the page fully loaded and settled before screenshotting.
    await dysonManufacturerPage.triggerLazyLoad();
    await page.waitForLoadState("networkidle", { timeout: 30000 });

    // Check every image loaded (warn but carry on if not).
    try {
      await dysonManufacturerPage.waitForImagesLoaded();
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
    const baselinePath = path.join(snapshotDir, `dyson-visual-${platformSuffix}.png`);
    const actualPath = path.join(snapshotDir, `dyson-visual-${platformSuffix}-actual.png`);
    const diffPath = path.join(snapshotDir, `dyson-visual-${platformSuffix}-diff.png`);

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
  });

  // 5. Run an accessibility scan and save the results as an HTML report.
  test("accessibility audit of the dyson manufacturer page", async ({ page }) => {
    const results = await new AxeBuilder({ page }).analyze();
    createHtmlReport({
      results,
      options: {
        outputDir: "accessibility-reports",
        reportFileName: "dyson-accessibility-report.html",
      },
    });
  });
});
