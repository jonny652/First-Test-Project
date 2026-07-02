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
    await dysonManufacturerPage.applyVisualRegression(testInfo);
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
