import { type Page, type Locator } from "@playwright/test";

// The Dyson manufacturer page — heading, logo, and the "I'm a manufacturer" button.
export class DysonManufacturerPage {
  readonly page: Page;
  readonly url = "https://source.thenbs.com/en/gb/manufacturer/dyson/nakAxHWxDZprdqkBaCdn4U/overview";

  // LOCATORS
  readonly heading: Locator;
  readonly sourceLogo: Locator;
  readonly manufacturerButton: Locator;


  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { level: 1 });
    this.sourceLogo = page.locator("a.brand-primary.wrapper");
    this.manufacturerButton = page.locator('a[action="manufacturer-header-link"]');}

   // ACTIONS


}
