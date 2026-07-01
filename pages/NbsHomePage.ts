import { Page, Locator } from '@playwright/test';

export class NbsHomePage {
  readonly page: Page;

  // ============================================================
  //  LOCATORS
  // ============================================================
  readonly closePopupButton: Locator;
  readonly searchField: Locator;
  readonly manufacturerTab: Locator;
  readonly dysonManufacturerTile: Locator;

  constructor(page: Page) {
    this.page = page;
    this.closePopupButton = page.getByRole('button', { name: 'Close dialog' });
    this.searchField = page.getByRole('textbox', { name: 'Search' });
    this.manufacturerTab = page.getByRole('tab', { name: 'Manufacturers' });
    this.dysonManufacturerTile = page.getByRole('link', { name: 'Dyson Dyson Technology for' });
  }

  // ============================================================
  //  ACTIONS
  // ============================================================

  /** Open the NBS Source homepage. */
  async goto() {
    await this.page.goto('https://source.thenbs.com/en/gb');
  }

  /** Close the cookie/marketing popup if it appears. */
  async closePopup() {
    await this.closePopupButton.click();
  }

  /** Type a search term and submit it. */
  async search(term: string) {
    await this.searchField.click();
    await this.searchField.fill(term);
    await this.searchField.press('Enter');
  }

  /** Switch to the Manufacturers results tab. */
  async openManufacturersTab() {
    await this.manufacturerTab.click();
  }

  /** Click the Dyson result tile to open its manufacturer page. */
  async openDysonManufacturer() {
    await this.dysonManufacturerTile.click();
  }
}
