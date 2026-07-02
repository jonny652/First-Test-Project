import { test as base } from "@playwright/test";
import { NbsHomePage } from "../pages/NbsHomePage";
import { DysonManufacturerPage } from "../pages/DysonManufacturerPage";

// The shape of the custom fixtures we're adding on top of Playwright's built-ins.
type Pages = {
  nbsHomePage: NbsHomePage;
  dysonManufacturerPage: DysonManufacturerPage;
};

// Extend the base test so every test can just ask for `nbsHomePage` /
// `dysonManufacturerPage` — the fixture builds them (the "assistant who
// hands you the toolbox"), so tests never write `new NbsHomePage(page)`.
export const test = base.extend<Pages>({
  nbsHomePage: async ({ page }, use) => {
    await use(new NbsHomePage(page));
  },
  dysonManufacturerPage: async ({ page }, use) => {
    await use(new DysonManufacturerPage(page));
  },
});

// Re-export expect so tests import both `test` and `expect` from here.
export { expect } from "@playwright/test";