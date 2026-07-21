import { Then } from "@cucumber/cucumber";
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
  await applyVisualRegression(this.page, "cucumber-chromium", getSnapshotName(page));
});
