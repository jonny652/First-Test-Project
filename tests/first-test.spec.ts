import { test, expect } from '@playwright/test';

test('navigate to the dyson homepage', async ({ page }) => {
  await page.goto('https://source.thenbs.com/en/gb');
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.getByRole('textbox', { name: 'Search' }).click();
  await page.getByRole('textbox', { name: 'Search' }).fill('dyson');
  await page.getByRole('textbox', { name: 'Search' }).press('Enter');
  await page.getByRole('tab', { name: 'Manufacturers' }).click();
  await page.getByRole('link', { name: 'Dyson Dyson Technology for' }).click();
  await expect(page).toHaveURL("https://source.thenbs.com/en/gb/manufacturer/dyson/nakAxHWxDZprdqkBaCdn4U/overview");
});

test('assert that the heading is correct on the dyson homepage', async ({ page }) => {
  await page.goto('https://source.thenbs.com/en/gb');
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.getByRole('textbox', { name: 'Search' }).click();
  await page.getByRole('textbox', { name: 'Search' }).fill('dyson');
  await page.getByRole('textbox', { name: 'Search' }).press('Enter');
  await page.getByRole('tab', { name: 'Manufacturers' }).click();
  await page.getByRole('link', { name: 'Dyson Dyson Technology for' }).click();
  await expect(page).toHaveURL("https://source.thenbs.com/en/gb/manufacturer/dyson/nakAxHWxDZprdqkBaCdn4U/overview");

  const heading = page.getByRole('heading', { level: 1 });
  await expect(heading).toBeVisible();
  await expect(heading).toContainText('Dyson');
});

test('Ensure the HREF attribute on the source logo is as expected', async ({ page }) => {
  await page.goto('https://source.thenbs.com/en/gb');
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.getByRole('textbox', { name: 'Search' }).click();
  await page.getByRole('textbox', { name: 'Search' }).fill('dyson');
  await page.getByRole('textbox', { name: 'Search' }).press('Enter');
  await page.getByRole('tab', { name: 'Manufacturers' }).click();
  await page.getByRole('link', { name: 'Dyson Dyson Technology for' }).click();
  const logo = page.locator('a.brand-primary.wrapper');
  await expect(logo).toHaveAttribute('href', '/en/gb');
});

test("assert the I'm a manufacturer button is visible, has correct text and correct href", async ({ page }) => {
  await page.goto('https://source.thenbs.com/en/gb');
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.getByRole('textbox', { name: 'Search' }).click();
  await page.getByRole('textbox', { name: 'Search' }).fill('dyson');
  await page.getByRole('textbox', { name: 'Search' }).press('Enter');
  await page.getByRole('tab', { name: 'Manufacturers' }).click();
  await page.getByRole('link', { name: 'Dyson Dyson Technology for' }).click();
  const manufacturerButton = page.locator('a[action="manufacturer-header-link"]');
  await expect(manufacturerButton).toBeVisible();
  await expect(manufacturerButton).toContainText("I'm a manufacturer");
  await expect(manufacturerButton).toHaveAttribute('href', 'https://manufacturers.thenbs.com/nbs-source');
});