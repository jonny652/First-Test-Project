import { Then } from "@cucumber/cucumber";
import { CustomWorld } from "../support/world";
import { generateAccessibilityReport } from "../../utils/accessability";

// Add an entry here to bring another page into the accessibility regression
// suite's Scenario Outline — the Examples table in
// accessability-regression.feature drives everything off this page name
// (navigation itself lives in features/support/page-catalog.ts).
const reportFileNames: Record<string, string> = {
  "NBS Source homepage": "nbs-homepage-accessibility-report.html",
  "Dyson manufacturer": "dyson-manufacturer-accessibility-report.html",
};

function getReportFileName(page: string): string {
  const fileName = reportFileNames[page];
  if (!fileName) {
    throw new Error(`Unknown page "${page}" — add it to \`reportFileNames\` in accessibility-regression.steps.ts.`);
  }
  return fileName;
}

Then("an accessibility report should be generated for the {string} page", async function (this: CustomWorld, page: string) {
  await generateAccessibilityReport(this.page, getReportFileName(page));
});
