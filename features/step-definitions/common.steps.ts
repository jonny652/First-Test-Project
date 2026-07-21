import { Given } from "@cucumber/cucumber";
import { CustomWorld } from "../support/world";
import { getRegressionPage } from "../support/page-catalog";

// Shared by every Scenario Outline that parametrizes on a page name (e.g.
// accessability-regression.feature, visual-regression.feature).
Given("I navigate to the {string} page", async function (this: CustomWorld, page: string) {
  await getRegressionPage(page).navigate(this);
});
