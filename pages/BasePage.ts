import "dotenv/config";
import { type Page, type Locator, expect } from "@playwright/test";

// Shared behaviour that applies to ANY page on the site (not specific to one page).
// Page objects extend this to inherit common locators/actions like closing the popup.
export class BasePage {
  // LOCATORS
  readonly page: Page;
  readonly backToTopButton: Locator;
  readonly closeDialogButton: Locator;
  readonly signInButton: Locator;
  readonly emailField: Locator;
  readonly passwordField: Locator;
  readonly next: Locator;
  readonly imAManufacturerButton: Locator;
  readonly userMenuButton: Locator;
  readonly manufactureUrl = "https://manufacturers.thenbs.com/nbs-source";
  readonly heading: Locator;
  readonly contactManufacturerButton: Locator;
  readonly contactManufacturerPopup: Locator;
  readonly contactManufacturePopupHeading: Locator
  readonly contactManufacturePopupNameField: Locator 
  readonly contactManufacturePopupEmailField: Locator 
  readonly contactManufacturePopupMessageField: Locator 
  readonly contactManufactureSendButton: Locator 

  constructor(page: Page) {
    this.page = page;
    this.closeDialogButton = page.getByRole("button", { name: "Close dialog" });
    this.backToTopButton = page.locator('[data-cy="backToTopButton"]');
    this.signInButton = page.getByRole("button", { name: "Sign in" });
    this.emailField = page.getByRole("textbox", { name: "Email address" });
    this.passwordField = page.getByRole("textbox", { name: "Password" });
    this.next = page.getByRole("button", { name: "Next" });
    this.imAManufacturerButton = page.locator('a[action="manufacturer-header-link"]');
    this.userMenuButton = page.getByRole("button", { name: "Open user menu" });
    this.heading = page.locator('h1') 
    this.contactManufacturerButton = page.getByRole("button", { name: "Contact manufacturer" });
    this.contactManufacturerPopup = page.getByRole("dialog");
    this.contactManufacturePopupHeading = page.getByRole("heading", { name: "Contact manufacturer" })
    this.contactManufacturePopupNameField = page.getByPlaceholder("Write your name here...")
    this.contactManufacturePopupEmailField = page.getByPlaceholder("Write your email address here...")
    this.contactManufacturePopupMessageField = page.getByPlaceholder("Write your message here...")
    this.contactManufactureSendButton = page.getByRole("button", {name: "Send"})

  }

  // ACTIONS

  /** Close the cookie/marketing popup. It can appear across the site, not just one page.
   *  Skipped when absent — e.g. a reused signed-in storage state already carries the
   *  cookie-consent dismissal, so the popup never shows up again. */
  async closePopup(): Promise<void> {
    try {
      await this.closeDialogButton.waitFor({ state: "visible", timeout: 5000 });
      await this.closeDialogButton.click();
    } catch {
      // Popup didn't appear — nothing to close.
    }
  }

  //** Scroll to the very bottom of the page. */
  async scrollToBottom(): Promise<void> {
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  }

  //** Click the "Back to top" button (page must already be scrolled down). */
  async clickBackToTopButton(): Promise<void> {
    await this.backToTopButton.waitFor({ state: "visible" });
    await this.backToTopButton.click();
  }

  /**
   * Full "Back to top" journey: hidden at top, appears after scrolling down,
   * clicking it scrolls the page back to top under its own steam (we only
   * poll for that, we don't drive the scroll ourselves), and it hides again.
   * Mirrors tests/first-test.spec.ts's "back-to-top button behaves correctly
   * when scrolling" test.
   */
  async assertBackToTopButtonBehavesAsExpected(): Promise<void> {
    await expect(this.backToTopButton).toBeHidden();
    await this.scrollToBottom();
    await expect(this.backToTopButton).toBeVisible();
    await this.clickBackToTopButton();
    await expect.poll(() => this.page.evaluate(() => window.scrollY)).toBe(0);
    await expect(this.backToTopButton).toBeHidden();
  }

  //** Verify the sign in process is working correctly. */
  async verifySignInProcess(): Promise<void> {
    const email = process.env.NBS_EMAIL;
    const password = process.env.NBS_PASSWORD;
    if (!email || !password) {
      throw new Error("NBS_EMAIL and NBS_PASSWORD must be set (see .env.example).");
    }

    // Implementation for sign in verification goes here.
    await this.signInButton.click();
    await this.emailField.fill(email);
    await this.next.click();
    await this.passwordField.click();
    await this.passwordField.fill(password);
    await this.signInButton.click();
    // Wait for the header's user menu to appear before returning, so callers
    // know sign in has actually completed rather than just having clicked through it.
    await this.userMenuButton.waitFor({ state: "visible" });
  }

  //** Verify the "I'm a manufacturer" button links to the correct URL. */
  async verifyImAManufacturerButton(): Promise<void> {
    await this.imAManufacturerButton.waitFor({ state: "visible" });
    const href = await this.imAManufacturerButton.getAttribute("href");
    if (href !== this.manufactureUrl) {
      throw new Error(`Expected href "${this.manufactureUrl}" but got "${href}"`);
    }
  }

    //** Ensure that the 'contact manufacturer' button creates a pop up window when clicked. */
  async contactManufacturerButtonBehavior(): Promise<void> {
    await this.contactManufacturerButton.click();
    // Verify that the Dyson logo, labels, fields and buttons are present in the pop up window
    await expect(this.contactManufacturerPopup).toBeVisible();
    await expect(this.contactManufacturePopupHeading).toBeVisible();
    await expect(this.contactManufacturePopupNameField).toBeVisible();
    await expect(this.contactManufacturePopupEmailField).toBeVisible();
    await expect(this.contactManufacturePopupMessageField).toBeVisible();
    await expect(this.contactManufactureSendButton).toBeVisible();
  }
}
