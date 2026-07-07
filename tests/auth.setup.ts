import { test as setup, expect } from "../fixtures/test-options";

const authFile = "playwright/.auth/user.json";

// 1. Sign in once and save the authenticated session so every other test can reuse it.
setup("authenticate", async ({ nbsHomePage, basePage, page }) => {
  await nbsHomePage.goto();
  await nbsHomePage.closePopup();
  await basePage.verifySignInProcess();
  await expect(basePage.userMenuButton).toBeVisible();

  await page.context().storageState({ path: authFile });
});
