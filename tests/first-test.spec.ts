import { test, expect } from '@playwright/test';

test('navigate to the dyson homepage', async ({ page }) => {
  await page.goto('https://source.thenbs.com/en/gb');
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.getByRole('textbox', { name: 'Search' }).click();
  await page.getByRole('textbox', { name: 'Search' }).fill('dyson');
  await page.getByRole('textbox', { name: 'Search' }).press('Enter');
  await page.getByRole('tab', { name: 'Manufacturers' }).click();
  await page.getByRole('link', { name: 'Dyson Dyson Technology for' }).click();
  await expect(page).toHaveURL("https://source.thebs.com/en/gb/manufacturer/dyson/nakAxHWxDZprdqkBaCdn4U/overview");
});