import { test as base } from '@playwright/test';
import { NbsHomePage } from '../pages/NbsHomePage';
import { DysonManufacturerPage } from '../pages/DysonManufacturerPage';

// 1. Describe the SHAPE of our custom fixtures — the names and their types.
type MyFixtures = {
  nbsHomePage: NbsHomePage;
  dysonManufacturerPage: DysonManufacturerPage;
};

// 2. Extend Playwright's base `test` with our fixtures.
export const test = base.extend<MyFixtures>({
  // Each fixture is a function. Playwright gives it the built-in `page`,
  // and we give back the ready-to-use page object via `use(...)`.
  nbsHomePage: async ({ page }, use) => {
    await use(new NbsHomePage(page));
  },

  dysonManufacturerPage: async ({ page }, use) => {
    await use(new DysonManufacturerPage(page));
  },
});

// 3. Re-export `expect` so tests import everything from one place.
export { expect } from '@playwright/test';
