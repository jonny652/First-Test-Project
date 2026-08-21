import { test, expect } from "../fixtures/test-options";


test.describe("Dyson product page", () => {
  // Search for Dyson and open the product page before each test.
  test.beforeEach(async ({ page }) => {
    await page.goto('product/dyson-airblade-9kj-hand-dryer-hu03/fmdLoC3ZGuYUyy8pKSG7Au/jmJPorRKb1DV8KXyP2uCS3');
  });

     // 14. Assert that on the Dyson Product Page the Dyson Logo is visible and contains the hover text "View more from dyson" and the href is correct.
    test("Ensure the Dyson logo for view more link is as expected on the product page", async ({ page }) => {
  
    await page.getByRole('tab', { name: 'Products tab showing all' }).click();
    await page.getByRole('link', { name: 'Dyson Airblade™ 9kJ Hand' }).click();
    await expect(page.getByRole('link', { name: 'View more from dyson' })).toBeVisible();
    
    });
  
      //15. Assert that the dyson telephone number is correct on the Dyson Product Page.
    test("Ensure the HREF attribute on the Dyson telephone number is as expected on the Dyson product page", async ({ page }) => {
    await page.getByRole('tab', { name: 'Products tab showing all' }).click();
    await page.getByRole('link', { name: 'Dyson Airblade™ 9kJ Hand' }).click();
    await expect(page.getByRole('link', { name: "8003457788" })).toBeVisible();
    await expect(page.getByRole('link', { name: "8003457788" })).toHaveAttribute("href", "tel:08003457788");
  
    });

});