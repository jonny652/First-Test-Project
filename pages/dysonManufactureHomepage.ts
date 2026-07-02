import { type Page } from "@playwright/test";

// The Dyson manufacturer page — heading, logo, and the "I'm a manufacturer" button.
export class DysonManufacturerPage {
  readonly page: Page;

  // LOCATORS

  // ACTIONS

  constructor(page: Page) {
    this.page = page;
  }
}