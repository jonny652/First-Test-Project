import { test, expect } from "../fixtures/test-options";
import { BasePage } from "../pages/BasePage";
import { generateAccessibilityReport } from "../utils/accessability";
import { applyVisualRegression } from "../utils/visual-regression";
 

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
  test("assert that the heading is correct on the dyson manufacturer page", async ({ dysonManufacturerPage }) => {
    await expect(dysonManufacturerPage.heading).toBeVisible();
    await expect(dysonManufacturerPage.heading).toContainText("Dyson");
  });

  // 2. Check the Source logo links back to the homepage.
  test("Ensure the HREF attribute on the source logo is as expected", async ({ dysonManufacturerPage }) => {
    await expect(dysonManufacturerPage.sourceLogo).toHaveAttribute("href", "/en/gb");// Base page because all pages have a source logo that links back to the homepage  
  });

  // 3. Check the "I'm a manufacturer" button is visible with the right text and link.
  test("assert the I'm a manufacturer button is visible, has correct text and correct href", async ({ dysonManufacturerPage }) => {
    await expect(dysonManufacturerPage.manufacturerButton).toBeVisible();
    await expect(dysonManufacturerPage.manufacturerButton).toContainText("I'm a manufacturer");
    await expect(dysonManufacturerPage.manufacturerButton).toHaveAttribute("href", "https://manufacturers.thenbs.com/nbs-source");
  });

  // 4. Compare the page against a saved screenshot (visual regression).
  test("visual regression of the dyson manufacturer page", async ({ page }, testInfo) => {
    await applyVisualRegression(page, testInfo, "dyson-manufacturer-page");
  });

  // 5. Run an accessibility scan and save the results as an HTML report.
  test("accessibility audit of the dyson manufacturer page", async ({ page }) => {
    await generateAccessibilityReport(page);
  });

  // 6. Back-to-top button — full journey: hidden at top, visible after scroll, returns to top on click.
  test("back-to-top button behaves correctly when scrolling", async ({ basePage, page }) => {
    await expect(basePage.backToTopButton).not.toBeVisible();
    await basePage.scrollToBottom();
    await expect(basePage.backToTopButton).toBeVisible();
    await basePage.clickBackToTopButton();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    await expect(basePage.backToTopButton).not.toBeVisible();
  });

  // 7. Assert tabs are all visible, in the correct order, and each href is correct.
  test("navigation tabs are visible, in the correct order, and have correct hrefs", async ({ dysonManufacturerPage }) => {
    // Each entry pairs a tab locator (targeting the element via data-cy) with its expected href.
    // This drives two assertions per tab: is it visible, and does it point to the right URL?
    const expectedTabs = [
      { locator: dysonManufacturerPage.overviewTab, href: "/en/gb/manufacturer/dyson/nakAxHWxDZprdqkBaCdn4U/overview" },
      { locator: dysonManufacturerPage.productsTab, href: "/en/gb/manufacturer/dyson/nakAxHWxDZprdqkBaCdn4U/products" },
      { locator: dysonManufacturerPage.certificatesTab, href: "/en/gb/manufacturer/dyson/nakAxHWxDZprdqkBaCdn4U/third-party-certifications" },
      { locator: dysonManufacturerPage.literatureTab, href: "/en/gb/manufacturer/dyson/nakAxHWxDZprdqkBaCdn4U/literature" },
      { locator: dysonManufacturerPage.caseStudiesTab, href: "/en/gb/manufacturer/dyson/nakAxHWxDZprdqkBaCdn4U/case-studies" },
      { locator: dysonManufacturerPage.aboutTab, href: "/en/gb/manufacturer/dyson/nakAxHWxDZprdqkBaCdn4U/about" },
    ];

    // Loop through each tab and assert it is visible on the page and carries the correct href attribute.
    for (const tab of expectedTabs) {
      await expect(tab.locator).toBeVisible();
      await expect(tab.locator).toHaveAttribute("href", tab.href);
    }

    // Read the text of every tab in DOM order, trim whitespace, and assert the full sequence matches.
    // This catches any tab being added, removed, or reordered without changing individual locators.
    const tabLabels = await dysonManufacturerPage.allTabs.allTextContents();
    expect(tabLabels.map((t) => t.trim())).toEqual(["Overview", "Products", "Certifications", "Literature", "Case studies", "About us"]);
  });

  // 8. Ensure that the sign in process is working as expected.
  test("Ensure that the sign in process works correctly", async ({ basePage, page }) => {
    await basePage.verifySignInProcess();
  });
  
  // 9. Ensure that the "I'm a manufacturer" button contains the correct URL.
  test("Ensure that the 'I'm a manufacturer' button contains the correct URL", async ({ basePage, page }) => {
    await basePage.verifyImAManufacturerButton();
  });
  
  // 10. Assert that the dyson telephone number is correct.
  test("Ensure the HREF attribute on the Dyson telephone number is as expected", async ({ dysonManufacturerPage }) => {
    await expect(dysonManufacturerPage.dysonTelephoneNumber).toBeVisible();
    await expect(dysonManufacturerPage.dysonTelephoneNumber).toHaveAttribute("href", "tel:08003457788"); //this is already proven by the locator in the DysonManufacturerPage.ts file, but this test ensures that the href is correct and visible on the page.
  });

  // 11. Assert that the dyson Website link is visible and the href is correct
  test("Ensure the HREF attribute on the Dyson website link is as expected", async ({ dysonManufacturerPage }) => {
    await expect(dysonManufacturerPage.dysonWebsiteLink).toBeVisible();
    await expect(dysonManufacturerPage.dysonWebsiteLink).toHaveAttribute("href", "https://www.dyson.co.uk/commercial/overview");
    // target="_blank" means the browser will open the link in a new tab — checked without clicking.
    await expect(dysonManufacturerPage.dysonWebsiteLink).toHaveAttribute("target", "_blank");
  });

  // 12. Assert the LinkedIn icon is visible and has the expected href.
  test("Ensure the HREF attribute on the LinkedIn icon is as expected", async ({ dysonManufacturerPage }) => {
    await expect(dysonManufacturerPage.linkedInIcon).toBeVisible();
    await expect(dysonManufacturerPage.linkedInIcon).toHaveAttribute("href", "https://www.linkedin.com/company/dyson/");
  });


  // 13. Assert the Heart icon will allow loged in users to add an item to their collection.
  test("Ensure that the Heart icon allows logged in users to add an item to their collection", async ({ dysonManufacturerPage, page, basePage }) => {
    // 0. Sign in — adding to a collection requires an authenticated user.
    await basePage.verifySignInProcess();

    // 1. Verify the heart icon has the correct title attribute
    await expect(dysonManufacturerPage.heartAddItemToCollectionIcon).toHaveAttribute("title", "Select item");

    //Click the heart icon
    await dysonManufacturerPage.heartAddItemToCollectionIcon.click();

    //Verify the icon changed to the active/selected state
    await expect(dysonManufacturerPage.heartAddItemToCollectionIcon).toHaveClass(/active/);

    //Verify the title changed to "Deselect item"
    await expect(dysonManufacturerPage.heartAddItemToCollectionIcon).toHaveAttribute("title", "Deselect item");

    //Verify the purple bar is displayed showing 1 item has been selected
    const selectionBar = page.getByText(/Selected item \(\d+\)/);
    await expect(selectionBar).toBeVisible();
    await expect(selectionBar).toHaveText("Selected item (1)");
  });
});
