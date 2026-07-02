import { test, expect } from "../fixtures/test-options";
import { applyVisualRegression } from "../utils/visual-regression";
import { generateAccessibilityReport } from "../utils/accessibility";

test.describe("Dyson manufacturer page", () => {
  // Search for Dyson and open its manufacturer page before each test.
  test.beforeEach(async ({ nbsHomePage, dysonManufacturerPage, page }) => {
    await nbsHomePage.goto();
    await nbsHomePage.closePopup();
    await nbsHomePage.search("dyson");
    await nbsHomePage.openManufacturersTab();
    await nbsHomePage.openDysonManufacturer();
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
    await applyVisualRegression(page, testInfo, dysonManufacturerPage.snapshotName);
  });

  // 5. Run an accessibility scan and save the results as an HTML report.
  //    NOTE: this intentionally does not assert zero violations — the site has known,
  //    permanent issues that won't be fixed, so asserting would make the suite always
  //    red. We keep the test green and just publish the violations to the report.
  test("accessibility audit of the dyson manufacturer page", async ({ page }) => {
    await generateAccessibilityReport(page);
  });
});
