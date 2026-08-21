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

  // Test 01 - Ensure that the "Visit Twitter Link" button contains the correct URL.
  test("Ensure that the 'Visit Twitter Link' button contains the correct URL", async ({ abloyManufacturerPage }) => {
    await expect(abloyManufacturerPage.visitTwitterLink).toBeVisible();
    await expect(abloyManufacturerPage.visitTwitterLink).toHaveAttribute("href", "https://twitter.com/abloymedia");
  });

  // Test 02 - Navigate to the Abloy Manufacture page and assert that the company logo is visible and has the correct href.
test('assert the Abloy company logo is visible and has the correct alt text', async ({ page }) => {
  const logoContainer = page.getByRole('img', { name: 'Abloy UK' })

  await expect(logoContainer).toBeVisible();
});

  //  Test 03 - Check the main heading is visible and mentions Abloy UK.
  test("assert that the heading is correct on the Abloy UK manufacturer page", async ({ abloyManufacturerPage }) => {
    await expect(abloyManufacturerPage.heading).toBeVisible();
    await expect (abloyManufacturerPage.heading).toHaveText('Abloy UK');
  });

  // Test 04 - Same check as Test 03, via a different route: instead of locating the
  // heading first and then asserting its text. Accessability Tree is used. 
  test("assert the H1 heading has the correct accessible name via getByRole", async ({ page }) => {
    const heading = page.getByRole('heading', { level: 1, name: 'Abloy UK' });
    await expect(heading).toBeVisible();
  });

  // Test 05 - Back-to-top button — full journey: hidden at top, visible after scroll, returns to top on click.
  test("back-to-top button behaves correctly when scrolling", async ({ basePage, page }) => {
    await expect(basePage.backToTopButton).toBeHidden();
    await basePage.scrollToBottom();
    await expect(basePage.backToTopButton).toBeVisible();
    await basePage.clickBackToTopButton();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    await expect(basePage.backToTopButton).toBeHidden();
  });
});
