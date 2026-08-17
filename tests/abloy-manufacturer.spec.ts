import { test, expect } from "../fixtures/test-options";
import { NbsHomePage } from '../pages/NbsHomePage';
import { AbloyManufacturerPage } from "../pages/AbloyManufacturerPage";

test.describe("Abloy UK manufacturer page", () => {
  // Search for Abloy UK and open its manufacturer page before each test.
  test.beforeEach(async ({ page }) => {

    const nbsHomePage = new NbsHomePage(page);
    const abloyManufacturerPage = new AbloyManufacturerPage(page);
    await nbsHomePage.goto();
    await nbsHomePage.closePopup();
    await nbsHomePage.search("abloy");
    await nbsHomePage.openManufacturersTab();
    await nbsHomePage.openAbloyManufacturer();
    await expect(page).toHaveURL(abloyManufacturerPage.url);
  });

  // Ensure that the "Visit Twitter Link" button contains the correct URL.
  test("Ensure that the 'Visit Twitter Link' button contains the correct URL", async ({ abloyManufacturerPage }) => {
    await expect(abloyManufacturerPage.visitTwitterLink).toBeVisible();
    await expect(abloyManufacturerPage.visitTwitterLink).toHaveAttribute("href", "https://twitter.com/abloymedia");
  });
});
