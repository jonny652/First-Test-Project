import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createHtmlReport } from "axe-html-reporter";
import fs from "fs";
import path from "path";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

// The URL we expect to land on after opening the Dyson manufacturer page.
const dysonManufacturerUrl =
  "https://source.thenbs.com/en/gb/manufacturer/dyson/nakAxHWxDZprdqkBaCdn4U/overview";

// Helper function to scroll down the page to trigger lazy loading of images.
// Scroll down the whole page so lazy-loaded images start downloading.
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

// Helper function to wait until all images on the page have finished loading.
// Wait until every image on the page has finished loading.
async function waitForImagesLoaded(page: Page) {
  await page.waitForFunction(() => Array.from(document.images).every((img) => img.complete), { timeout: 10000 });
}

test.describe("Dyson manufacturer page", () => {
  // Search for Dyson and open its manufacturer page before each test.
  test.beforeEach(async ({ page }) => {
    // LOCATORS — declared inline, right here in the test file.
    const closePopupButton = page.getByRole("button", { name: "Close dialog" });
    const searchField = page.getByRole("textbox", { name: "Search" });
    const manufacturerTab = page.getByRole("tab", { name: "Manufacturers" });
    const dysonManufacturerTile = page.getByRole("link", { name: "Dyson Dyson Technology for" });

    // ACTIONS — the navigation steps, also inline.
    await page.goto("https://source.thenbs.com/en/gb");
    await closePopupButton.click();
    await searchField.click();
    await searchField.fill("dyson");
    await searchField.press("Enter");
    await manufacturerTab.click();
    await dysonManufacturerTile.click();

    await expect(page).toHaveURL(dysonManufacturerUrl);
  });

  // 1. Check the main heading is visible and mentions Dyson.
  test("assert that the heading is correct on the dyson homepage", async ({ page }) => {
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible();
    await expect(heading).toContainText("Dyson");
  });

  // 2. Check the Source logo links back to the homepage.
  test("Ensure the HREF attribute on the source logo is as expected", async ({ page }) => {
    const sourceLogo = page.locator("a.brand-primary.wrapper");
    await expect(sourceLogo).toHaveAttribute("href", "/en/gb");
  });

  // 3. Check the "I'm a manufacturer" button is visible with the right text and link.
  test("assert the I'm a manufacturer button is visible, has correct text and correct href", async ({ page }) => {
    const manufacturerButton = page.locator('a[action="manufacturer-header-link"]');
    await expect(manufacturerButton).toBeVisible();
    await expect(manufacturerButton).toContainText("I'm a manufacturer");
    await expect(manufacturerButton).toHaveAttribute("href", "https://manufacturers.thenbs.com/nbs-source");
  });

  // 4. Compare the page against a saved screenshot (visual regression).
  test("visual regression of the dyson manufacturer page", async ({ page }, testInfo) => {
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
