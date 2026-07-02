import { type Page, type Locator } from "@playwright/test";

// The NBS Source home page — search, popups, and navigation into a manufacturer.
export class NbsHomePage {
  readonly page: Page;

  // LOCATORS
  readonly closeDialogButton: Locator;
  readonly searchField: Locator;
  readonly manufacturerTab: Locator;
  readonly dysonManufacturerTile: Locator;

  constructor(page: Page) {
    this.page = page;
    this.closeDialogButton = page.getByRole("button", { name: "Close dialog" });
    this.searchField = page.getByRole("textbox", { name: "Search" });
    this.manufacturerTab = page.getByRole("tab", { name: "Manufacturers" });
    this.dysonManufacturerTile = page.getByRole("link", { name: "Dyson Dyson Technology for" });
  }

  // ACTIONS

  /** Open the NBS Source homepage. */
  async goto(): Promise<void> {
    await this.page.goto("https://source.thenbs.com/en/gb");
  }

  /** Close the cookie/marketing popup. */
  async closePopup(): Promise<void> {
    await this.closeDialogButton.click();
  }

  /** Type a search term and submit it. */
  async search(term: string): Promise<void> {
    await this.searchField.click();
    await this.searchField.fill(term);
    await this.searchField.press("Enter");
  }

  /** Switch to the Manufacturers results tab. */
  async openManufacturersTab(): Promise<void> {
    await this.manufacturerTab.click();
  }

  /** Click the Dyson result tile to open its manufacturer page. */
  async openDysonManufacturer(): Promise<void> {
    await this.dysonManufacturerTile.click();
  }
}
