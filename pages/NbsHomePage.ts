import { type Page, type Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

// The NBS Source home page — search and navigation into a manufacturer.
// Inherits `page` and `closePopup()` from BasePage.
export class NbsHomePage extends BasePage {
  // LOCATORS
  readonly searchField: Locator;
  readonly manufacturerTab: Locator;
  readonly dysonManufacturerTile: Locator;

  constructor(page: Page) {
    super(page);
    this.searchField = page.getByRole("textbox", { name: "Search" });
    this.manufacturerTab = page.getByRole("tab", { name: "Manufacturers" });
    this.dysonManufacturerTile = page.getByRole("link", { name: "Dyson Dyson Technology for" });
  }

  // ACTIONS

  /** Open the NBS Source homepage. */
  async goto(): Promise<void> {
    await this.page.goto("https://source.thenbs.com/en/gb");
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
