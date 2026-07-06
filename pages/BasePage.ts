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

  constructor(page: Page) {
    this.page = page;
    this.closeDialogButton = page.getByRole("button", { name: "Close dialog" });
    this.backToTopButton = page.locator('[data-cy="backToTopButton"]');
    this.signInButton = page.getByRole("button", { name: "Sign in" });
    this.emailField = page.getByRole("textbox", { name: "Email address" });
  }

  // ACTIONS

  /** Close the cookie/marketing popup. It can appear across the site, not just one page. */
  async closePopup(): Promise<void> {
    await this.closeDialogButton.click();
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
    await this.page.getByRole("button", { name: "Next" }).click();
    await this.signInButton.click();
    await this.page.getByRole("button", { name: "Open user menu" }).waitFor({ state: "visible" });
  }
}
