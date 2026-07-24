import { When, Then } from "@cucumber/cucumber";
import { CustomWorld } from "../support/world";

// Steps for api-regression.feature's Certifications-tab scenarios. The actual
// faked API responses (a renamed certification, an empty list, a 500 error,
// a malformed payload, a dropped connection) are set up separately per
// scenario tag — see features/support/hooks.ts and utils/network-stubs.ts.

When("I open the Certifications tab", async function (this: CustomWorld) {
  await this.dysonManufacturerPage.openCertificatesTab();
});

Then("The first certification tile shows {string}", async function (this: CustomWorld, expectedName: string) {
  await this.dysonManufacturerPage.assertFirstCertificationNameIs(expectedName);
});

Then("a suitable message is shown indicating there are no certifications available", async function (this: CustomWorld) {
  await this.dysonManufacturerPage.assertNoCertificationsMessageVisible();
});

Then("the certifications tab renders no certifications", async function (this: CustomWorld) {
  await this.dysonManufacturerPage.assertNoCertificationsVisible();
});



