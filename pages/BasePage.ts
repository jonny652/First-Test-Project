import { type Page, type Locator } from "@playwright/test";

// Shared behaviour that applies to ANY page on the site (not specific to one page).
// Page objects extend this to inherit common locators/actions like closing the popup.
export class BasePage {
  readonly page: Page;

  // LOCATORS
  readonly closeDialogButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.closeDialogButton = page.getByRole("button", { name: "Close dialog" });
  }

  // ACTIONS

  /** Close the cookie/marketing popup. It can appear across the site, not just one page. */
  async closePopup(): Promise<void> {
    await this.closeDialogButton.click();
  }
}
