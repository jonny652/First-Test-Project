import { type Page, type Locator } from "@playwright/test";
 
// Shared behaviour that applies to ANY page on the site (not specific to one page).
// Page objects extend this to inherit common locators/actions like closing the popup.
export class BasePage {
     // LOCATORS
  readonly page: Page;
  readonly backToTopButton: Locator;
  readonly closeDialogButton: Locator;

 
  
 
  constructor(page: Page) {
    this.page = page;
    this.closeDialogButton = page.getByRole("button", { name: "Close dialog" });
    this.backToTopButton = page.locator('[data-cy="backToTopButton"]');
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
}