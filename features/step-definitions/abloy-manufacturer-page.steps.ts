import { When, Then } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { CustomWorld } from "../support/world";

// Background steps ("I am on the NBS Source homepage", "I close the popup",
// "I search for {string}", "I open the manufacturers tab") are manufacturer-
// agnostic and already registered in dyson-manufacturer-page.steps.ts —
// reused as-is here, not redefined (Cucumber errors on duplicate patterns).

When("I open the Abloy UK manufacturer page", async function (this: CustomWorld) {
  await this.nbsHomePage.openAbloyManufacturer();
});

Then("I should be on the Abloy UK manufacturer page", async function (this: CustomWorld) {
  // See dyson-manufacturer-page.steps.ts for why this uses an explicit
  // timeout longer than Playwright's default 5s poll.
  await expect(this.page).toHaveURL(this.abloyManufacturerPage.url, { timeout: 15000 });
});

// Scenario steps — mirrors dyson-manufacturer-page.steps.ts, retargeted at abloyManufacturerPage.

Then("the Abloy heading should be visible", async function (this: CustomWorld) {
  await expect(this.abloyManufacturerPage.heading).toBeVisible();
});

Then("the Abloy heading should contain {string}", async function (this: CustomWorld, text: string) {
  await expect(this.abloyManufacturerPage.heading).toContainText(text);
});

When("i check the Abloy source logo the href is as expected {string}", async function (this: CustomWorld, href: string) {
  await expect(this.abloyManufacturerPage.sourceLogo).toHaveAttribute("href", href);
});

When("i check the Abloy \"I'm a manufacturer\" button its visible", async function (this: CustomWorld) {
  await expect(this.abloyManufacturerPage.manufacturerButton).toBeVisible();
});

Then("the Abloy \"I'm a manufacturer\" button should contain text {string}", async function (this: CustomWorld, text: string) {
  await expect(this.abloyManufacturerPage.manufacturerButton).toContainText(text);
});

Then("the Abloy \"I'm a manufacturer\" button should have the correct href {string}", async function (this: CustomWorld, href: string) {
  await expect(this.abloyManufacturerPage.manufacturerButton).toHaveAttribute("href", href);
});

When('I click the "Back to top" button on the Abloy page it behaves as expected', async function (this: CustomWorld) {
  await this.abloyManufacturerPage.assertBackToTopButtonBehavesAsExpected();
});

Then("the Abloy tabs should be visible, in the correct order, and each href should be correct", async function (this: CustomWorld) {
  await this.abloyManufacturerPage.assertTabsVisibilityOrderAndHref();
});

Then("Abloy I'm a manufacturer button should have the correct href {string}", async function (this: CustomWorld, href: string) {
  await expect(this.abloyManufacturerPage.manufacturerButton).toHaveAttribute("href", href);
});

Then("Ensure the HREF attribute on the Abloy telephone number is as expected {string}", async function (this: CustomWorld, href: string) {
  await expect(this.abloyManufacturerPage.abloyTelephoneNumber).toBeVisible();
  await expect(this.abloyManufacturerPage.abloyTelephoneNumber).toHaveAttribute("href", href);
});

Then("Ensure the HREF attribute on the Abloy Website link is as expected {string}", async function (this: CustomWorld, href: string) {
  await expect(this.abloyManufacturerPage.abloyWebsiteLink).toBeVisible();
  await expect(this.abloyManufacturerPage.abloyWebsiteLink).toHaveAttribute("href", href);
});

Then("Ensure the HREF attribute on the Abloy LinkedIn icon is as expected {string}", async function (this: CustomWorld, href: string) {
  await expect(this.abloyManufacturerPage.linkedInIcon).toBeVisible();
  await expect(this.abloyManufacturerPage.linkedInIcon).toHaveAttribute("href", href);
});

When("I click the Heart icon on the Abloy manufacturer page then it behaves as expected", async function (this: CustomWorld) {
  await this.abloyManufacturerPage.assertCollectionButtonBehavesAsExpected();
});
