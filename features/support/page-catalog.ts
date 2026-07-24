import { expect } from "@playwright/test";
import { CustomWorld } from "./world";

// One catalog entry: how to get from a blank page to this named page.
export interface RegressionPage {
  navigate: (world: CustomWorld) => Promise<void>;
}

// Add an entry here to bring another page into any Scenario Outline that
// keys off a page name — e.g. accessability-regression.feature and
// visual-regression.feature both drive their navigation off this catalog.
export const pageCatalog: Record<string, RegressionPage> = {
  "NBS Source homepage": {
    navigate: async (world) => {
      await world.nbsHomePage.goto();
      await world.nbsHomePage.closePopup();
    },
  },
  "Dyson manufacturer": {
    navigate: async (world) => {
      await world.nbsHomePage.goto();
      await world.nbsHomePage.closePopup();
      await world.nbsHomePage.search("dyson");
      await world.nbsHomePage.openManufacturersTab();
      await world.nbsHomePage.openDysonManufacturer();
      // Same generous timeout as dyson-manufacturer-page.steps.ts's equivalent
      // assertion — Playwright's expect() defaults to a 5s poll, too tight for
      // this navigation under real network conditions.
      await expect(world.page).toHaveURL(world.dysonManufacturerPage.url, { timeout: 15000 });
    },
  },
};

export function getRegressionPage(name: string): RegressionPage {
  const page = pageCatalog[name];
  if (!page) {
    throw new Error(`Unknown page "${name}" — add it to \`pageCatalog\` in features/support/page-catalog.ts.`);
  }
  return page;
}
