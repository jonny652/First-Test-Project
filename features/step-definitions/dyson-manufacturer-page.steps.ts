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

When("i check the source logo the href is as expected {string}", async function (this: CustomWorld, href: string) {
  await expect(this.dysonManufacturerPage.sourceLogo).toHaveAttribute("href", href);
});

When("i check the \"I'm a manufacturer\" button its visible", async function (this: CustomWorld) {
  await expect(this.dysonManufacturerPage.manufacturerButton).toBeVisible();
});

Then("the \"I'm a manufacturer\" button should contain text {string}", async function (this: CustomWorld, text: string) {
  await expect(this.dysonManufacturerPage.manufacturerButton).toContainText(text);
});

Then("the \"I'm a manufacturer\" button should have the correct href {string}", async function (this: CustomWorld, href: string) {
  await expect(this.dysonManufacturerPage.manufacturerButton).toHaveAttribute("href", href); 
});

When('I click the "Back to top" button it behaves as expected', async function (this: CustomWorld) {
  await this.dysonManufacturerPage.clickBackToTopButton();
});

Then("the tabs should be visible, in the correct order, and each href should be correct", async function (this: CustomWorld) {
  await this.dysonManufacturerPage.assertTabsVisibilityOrderAndHref();
});

Then("I'm a manufacturer button should have the correct href {string}", async function (this: CustomWorld) {
  await this.dysonManufacturerPage.verifyImAManufacturerButton();
});

Then("Ensure the HREF attribute on the Dyson telephone number is as expected {string}", async function (this: CustomWorld, href: string) {
  await expect(this.dysonManufacturerPage.dysonTelephoneNumber).toBeVisible();
  await expect(this.dysonManufacturerPage.dysonTelephoneNumber).toHaveAttribute("href", href);
});

Then("Ensure the HREF attribute on the Dyson Website link is as expected {string}", async function (this: CustomWorld, href: string) {
  await expect(this.dysonManufacturerPage.dysonWebsiteLink).toBeVisible();
  await expect(this.dysonManufacturerPage.dysonWebsiteLink).toHaveAttribute("href", href);
});

Then("Ensure the HREF attribute on the LinkedIn icon is as expected {string}", async function (this: CustomWorld, href: string) {
  await expect(this.dysonManufacturerPage.linkedInIcon).toBeVisible();
  await expect(this.dysonManufacturerPage.linkedInIcon).toHaveAttribute("href", href);
});

When("I click the Heart icon on the Dyson manufacturer page then it behaves as expected", async function (this: CustomWorld) {
  await this.dysonManufacturerPage.assertCollectionButtonBehavesAsExpected();
});