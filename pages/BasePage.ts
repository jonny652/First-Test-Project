import { type Page, type Locator } from "@playwright/test";

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
    this.heading = page.getByRole("heading", { level: 1 });// this can moved to the base page if all manufacturer pages have a heading with level 1
    this.contactManufacturerButton = page.getByRole("button", { name: "Contact manufacturer" });
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

  //** Verify the sign in process is working correctly. */
  async verifySignInProcess(): Promise<void> {
    // Implementation for sign in verification goes here.
    await this.signInButton.click();
    await this.emailField.fill("jonny_uk@live.co.uk");
    await this.next.click();
    await this.passwordField.click();
    await this.passwordField.fill('Spitfire2026!');
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
}
