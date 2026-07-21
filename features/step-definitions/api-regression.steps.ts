import { When, Then } from "@cucumber/cucumber";
import { CustomWorld } from "../support/world";

When("I open the Certifications tab", async function (this: CustomWorld) {
  await this.dysonManufacturerPage.openCertificatesTab();
});

Then("The first certification tile shows {string}", async function (this: CustomWorld, expectedName: string) {
  await this.dysonManufacturerPage.assertFirstCertificationNameIs(expectedName);
});

Then("a suitable message is shown indicating there are no certifications available", async function (this: CustomWorld) {
  await this.dysonManufacturerPage.assertNoCertificationsMessageVisible();
});
