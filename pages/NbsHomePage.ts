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
  async navigateToDysonManufacturerPage(): Promise<void> {
    await this.page.goto("https://source.thenbs.com/en/gb");
    await this.closeDialogButton.click();
    await this.searchField.click();
    await this.searchField.fill("dyson");
    await this.searchField.press("Enter");
    await this.manufacturerTab.click();
    await this.dysonManufacturerTile.click();
  }
}