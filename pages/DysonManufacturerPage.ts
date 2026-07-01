import { Page, Locator } from '@playwright/test';

export class DysonManufacturerPage {
  readonly page: Page;

  // The URL we expect to land on.
  readonly expectedUrl =
    'https://source.thenbs.com/en/gb/manufacturer/dyson/nakAxHWxDZprdqkBaCdn4U/overview';

  // ============================================================
  //  LOCATORS
  // ============================================================
  readonly heading: Locator;
  readonly sourceLogo: Locator;
  readonly manufacturerButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { level: 1 });
    this.sourceLogo = page.locator('a.brand-primary.wrapper');
    this.manufacturerButton = page.locator('a[action="manufacturer-header-link"]');
  }

  // ============================================================
  //  ACTIONS
  // ============================================================
  // (This page is mostly about verifying elements, so the test will do the
  //  assertions using the locators above. We keep the page object focused on
  //  exposing WHERE things are.)
}
