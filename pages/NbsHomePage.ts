import { type Page } from "@playwright/test";

// The NBS Source home page — search, popups, and navigation into a manufacturer.
export class NbsHomePage {
  readonly page: Page;

  // LOCATORS

  // ACTIONS

  constructor(page: Page) {
    this.page = page;
  }
}