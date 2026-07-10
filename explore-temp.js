const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://source.thenbs.com/en/gb/manufacturer/dyson/nakAxHWxDZprdqkBaCdn4U/overview');

  try {
    await page.getByRole('button', { name: 'Close dialog' }).click({ timeout: 5000 });
  } catch {}

  // Sign in
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('jonny_uk@live.co.uk');
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('textbox', { name: 'Password' }).click();
  await page.getByRole('textbox', { name: 'Password' }).fill('Spitfire2026!');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.getByRole('button', { name: 'Open user menu' }).waitFor({ state: 'visible' });

  console.log('Signed in. Current URL:', page.url());
  await page.waitForLoadState('networkidle').catch(() => {});

  if (!page.url().includes('/dyson/')) {
    console.log('Navigating back to Dyson page...');
    await page.goto('https://source.thenbs.com/en/gb/manufacturer/dyson/nakAxHWxDZprdqkBaCdn4U/overview');
    await page.waitForLoadState('networkidle').catch(() => {});
  }

  console.log('Looking for contact manufacturer button...');

  const contactCandidates = await page.locator('text=/contact/i').all();
  for (const c of contactCandidates) {
    const text = await c.textContent();
    const tag = await c.evaluate(el => el.tagName);
    console.log('CANDIDATE:', tag, JSON.stringify(text));
  }

  await page.screenshot({ path: 'C:\\Users\\jonny\\AppData\\Local\\Temp\\claude\\C--Users-jonny-OneDrive-Desktop-First-Test-Project\\26f0f78b-fa66-4b62-b7fd-9e64023d1db2\\scratchpad\\dyson-page2.png', fullPage: true });

  console.log('DONE');
  await browser.close();
})();
