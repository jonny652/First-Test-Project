import { Then } from "@cucumber/cucumber";
import { type Locator } from "@playwright/test";
import { CustomWorld } from "../support/world";
import { applyVisualRegression } from "../../utils/visual-regression";

// Add an entry here to bring another page into the visual regression suite's
// Scenario Outline (navigation itself lives in features/support/page-catalog.ts).
// "Dyson manufacturer" keeps its existing snapshot name so it reuses the
// baseline already saved under tests/snapshots/dyson-manufacturer-page-*.
const snapshotNames: Record<string, string> = {
  "NBS Source homepage": "nbs-homepage",
  "Dyson manufacturer": "dyson-manufacturer-page",
};

// The homepage's manufacturer/CPD thumbnails are served from a rotating,
// non-deterministic feed — they differ between runs even with no real
// regression, so they'd fail the pixel comparison forever. Matched by `src`
// substring (not a layout-dependent selector) and masked out before the
// screenshot is taken; see applyVisualRegression's `mask` option.
const dynamicMaskSelectors: Partial<Record<string, string[]>> = {
  "NBS Source homepage": [
    'img[src*="asset.source.thenbs.com/api/thumbnail"]',
    'img[src*="riba-cpd-logo"]',
  ],
};

function getSnapshotName(page: string): string {
  const snapshotName = snapshotNames[page];
  if (!snapshotName) {
    throw new Error(`Unknown page "${page}" — add it to \`snapshotNames\` in visual-regression.steps.ts.`);
  }
  return snapshotName;
}

// "cucumber-chromium" replaces Playwright's TestInfo.project.name, giving
// this runner's screenshots their own baseline (see utils/visual-regression.ts).
Then("the {string} page should match the saved screenshot", async function (this: CustomWorld, page: string) {
  const mask: Locator[] | undefined = dynamicMaskSelectors[page]?.map((selector) => this.page.locator(selector));
  await applyVisualRegression(this.page, "cucumber-chromium", getSnapshotName(page), { mask });
});
