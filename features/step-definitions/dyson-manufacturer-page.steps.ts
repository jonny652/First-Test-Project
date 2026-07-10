import { Given, When, Then } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { CustomWorld } from "../support/world";

// Background steps — mirrors the beforeEach in tests/first-test.spec.ts:10-17.
// Note: these use `function` (not arrow functions) so `this` is bound to the
// scenario's CustomWorld by Cucumber, giving access to the page objects.

Given("I am on the NBS Source homepage", async function (this: CustomWorld) {
  await this.nbsHomePage.goto();
});

Given("I close the popup", async function (this: CustomWorld) {
  await this.nbsHomePage.closePopup();
});

When("I search for {string}", async function (this: CustomWorld, term: string) {
  await this.nbsHomePage.search(term);
});

When("I open the manufacturers tab", async function (this: CustomWorld) {
  await this.nbsHomePage.openManufacturersTab();
});

When("I open the Dyson manufacturer page", async function (this: CustomWorld) {
  await this.nbsHomePage.openDysonManufacturer();
});

Then("I should be on the Dyson manufacturer page", async function (this: CustomWorld) {
  await expect(this.page).toHaveURL(this.dysonManufacturerPage.url);
});

// Scenario steps — mirrors test 1 in tests/first-test.spec.ts:20-23.

Then("the heading should be visible", async function (this: CustomWorld) {
  await expect(this.dysonManufacturerPage.heading).toBeVisible();
});

Then("the heading should contain {string}", async function (this: CustomWorld, text: string) {
  await expect(this.dysonManufacturerPage.heading).toContainText(text);
});
