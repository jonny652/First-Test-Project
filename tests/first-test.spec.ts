import { test, expect } from '@playwright/test';



test.describe('Dyson manufacturer page', () => {
  test.beforeEach(async ({ page }) => {
    const closePopup = page.getByRole('button', { name: 'Close dialog' });
    const searchField = page.getByRole('textbox', { name: 'Search' });
    const manufacturerTab = page.getByRole('tab', { name: 'Manufacturers' });
    const dysonManufacturerTile = page.getByRole('link', { name: 'Dyson Dyson Technology for' });

    await page.goto('https://source.thenbs.com/en/gb');
    await closePopup.click();
    await searchField.click();
    await searchField.fill('dyson');
    await searchField.press('Enter');
    await manufacturerTab.click();
    await dysonManufacturerTile.click();
    await expect(page).toHaveURL("https://source.thenbs.com/en/gb/manufacturer/dyson/nakAxHWxDZprdqkBaCdn4U/overview");
  });


  test('assert that the heading is correct on the dyson homepage', async ({ page }) => {
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('Dyson');
  });

  test('Ensure the HREF attribute on the source logo is as expected', async ({ page }) => {
    const logo = page.locator('a.brand-primary.wrapper');
    await expect(logo).toHaveAttribute('href', '/en/gb');
  });

  test("assert the I'm a manufacturer button is visible, has correct text and correct href", async ({ page }) => {
    const manufacturerButton = page.locator('a[action="manufacturer-header-link"]');
    await expect(manufacturerButton).toBeVisible();
    await expect(manufacturerButton).toContainText("I'm a manufacturer");
    await expect(manufacturerButton).toHaveAttribute('href', 'https://manufacturers.thenbs.com/nbs-source');
  });
});
