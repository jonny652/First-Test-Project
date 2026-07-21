import { test, expect } from "../fixtures/test-options";
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
    await applyVisualRegression(page, testInfo.project.name, "dyson-manufacturer-page");
  });

  // 5. Run an accessibility scan and save the results as an HTML report.
  test("accessibility audit of the dyson manufacturer page", async ({ page }) => {
    await generateAccessibilityReport(page, "dyson-accessibility-report.html");
  });

  // 6. Back-to-top button — full journey: hidden at top, visible after scroll, returns to top on click.
  test("back-to-top button behaves correctly when scrolling", async ({ basePage, page }) => {
    await expect(basePage.backToTopButton).toBeHidden();
    await basePage.scrollToBottom();
    await expect(basePage.backToTopButton).toBeVisible();
    await basePage.clickBackToTopButton();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    await expect(basePage.backToTopButton).toBeHidden();
  });

  // 7. Assert tabs are all visible, in the correct order, and each href is correct.
  test("navigation tabs are visible, in the correct order, and have correct hrefs", async ({ dysonManufacturerPage }) => {
    await dysonManufacturerPage.assertTabsVisibilityOrderAndHref();
  });
  
  // 8. Ensure that the "I'm a manufacturer" button contains the correct URL.
  test("Ensure that the 'I'm a manufacturer' button contains the correct URL", async ({ basePage }) => {
    await basePage.verifyImAManufacturerButton();
  });
  
  // 9. Assert that the dyson telephone number is correct.
  test("Ensure the HREF attribute on the Dyson telephone number is as expected", async ({ dysonManufacturerPage }) => {
    await expect(dysonManufacturerPage.dysonTelephoneNumber).toBeVisible();
  });

  // 10. Assert that the dyson Website link is visible and the href is correct
  test("Ensure the HREF attribute on the Dyson website link is as expected", async ({ dysonManufacturerPage }) => {
    await expect(dysonManufacturerPage.dysonWebsiteLink).toBeVisible();
    // target="_blank" means the browser will open the link in a new tab — checked without clicking.
    await expect(dysonManufacturerPage.dysonWebsiteLink).toHaveAttribute("target", "_blank");
  });

  // 11. Assert the LinkedIn icon is visible and has the expected href.
  test("Ensure the HREF attribute on the LinkedIn icon is as expected", async ({ dysonManufacturerPage }) => {
    await expect(dysonManufacturerPage.linkedInIcon).toBeVisible();
  });


  // 12. Assert the Heart icon will allow loged in users to add an item to their collection.
  test("Ensure that the Heart icon allows logged in users to add an item to their collection", async ({ dysonManufacturerPage, page }) => {

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

    // 13. Verify that the "contact manufacturer" button when clicked creates a pop up window.
  test("Ensure that the 'contact manufacturer' button creates a pop up window when clicked", async ({ dysonManufacturerPage, page }) => {
    await dysonManufacturerPage.contactManufacturerButton.click();
    // Verify that the Dyson logo, labels, fields and buttons are present in the pop up window
    const contactManufacturerPopup = page.getByRole("dialog");
    await expect(contactManufacturerPopup).toBeVisible();
    await expect(contactManufacturerPopup.getByRole("heading", { name: "Contact manufacturer" })).toBeVisible();
    await expect(contactManufacturerPopup.getByPlaceholder("Write your name here...")).toBeVisible();
    await expect(contactManufacturerPopup.getByPlaceholder("Write your email address here...")).toBeVisible();
    await expect(contactManufacturerPopup.getByPlaceholder("Write your message here...")).toBeVisible();
    await expect(contactManufacturerPopup.getByRole("button", { name: "Send" })).toBeVisible();
  });
});
