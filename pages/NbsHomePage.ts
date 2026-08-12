import { type Page, type Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

// The NBS Source home page — search, popups, and navigation into a manufacturer.
export class NbsHomePage extends BasePage {

  // LOCATORS
  readonly searchField: Locator;
  readonly manufacturerTab: Locator;
  readonly dysonManufacturerTile: Locator;
  readonly abloyManufacturerTile: Locator;

  constructor(page: Page) {
    super(page);
    this.searchField = page.getByRole("textbox", { name: "Search" });
    this.manufacturerTab = page.getByRole("tab", { name: "Manufacturers" });
    this.dysonManufacturerTile = page.getByRole("link", { name: "Dyson Dyson Technology for" });
    this.abloyManufacturerTile = page.getByRole("link", { name: /Abloy UK/i });
  }

  // ACTIONS

/** Open t//he NBS Source homepage. */
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

  /** Click the Abloy UK result tile to open its manufacturer page. */
  async openAbloyManufacturer(): Promise<void> {
    await this.abloyManufacturerTile.click();
  }

  // Not currently used anywhere — search()/openManufacturersTab()/openDysonManufacturer()
  // above cover the same journey and are what the tests actually call.
  async navigateToDysonManufacturerPage(): Promise<void> {
    //await this.page.goto("https://source.thenbs.com/en/gb");
    await this.closeDialogButton.click();
    //await this.searchField.click();
    //await this.searchField.fill("dyson");
    //await this.searchField.press("Enter");
    //await this.manufacturerTab.click();
    //await this.dysonManufacturerTile.click();
  }
}