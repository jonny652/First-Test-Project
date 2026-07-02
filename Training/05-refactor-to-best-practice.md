# Refactoring to Best Practice — Tidying Up the POM

In doc `02` we migrated our tests to the Page Object Model. It *worked*, but a few things had
drifted from best practice. This guide walks through the clean-up we did, so you can replicate it
step by step.

**The one idea behind everything below:** every file should have **one job**.

```
pages/      →  WHERE things are + WHAT you can do on a page   (locators + actions)
utils/      →  reusable test machinery                        (visual diff, a11y scan)
fixtures/   →  hands ready-made page objects to tests         (the "toolbox assistant")
tests/      →  WHAT should be true                            (the assertions)
```

We did this in **4 small commits**. Do them in order and run the tests after each one.

---

## Step 1 — Move test machinery out of the page object

**Problem:** `DysonManufacturerPage` had grown to ~167 lines. Buried inside were screenshot-diffing
and accessibility-scanning code. That's *test machinery*, not "the Dyson page" — it doesn't belong
in a page object.

### 1a. Create a `utils/` folder with two helpers

Create **`utils/visual-regression.ts`** and move the visual-regression code there. It becomes a
plain function that takes `page`, `testInfo`, and a `snapshotName` (so any page can reuse it):

```ts
import { type Page, type TestInfo } from "@playwright/test";
import fs from "fs";
import path from "path";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

// (the same triggerLazyLoad / waitForImagesLoaded / pixelmatch logic we already had,
//  just moved here as standalone functions instead of page-object methods)
export async function applyVisualRegression(
  page: Page,
  testInfo: TestInfo,
  snapshotName: string,
): Promise<void> {
  // ...screenshot, compare against baseline, save diff...
}
```

Create **`utils/accessibility.ts`** and move the axe scan there. Keep the comment explaining
*why there's no assertion* (see Step 1c):

```ts
import { type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createHtmlReport } from "axe-html-reporter";

export async function generateAccessibilityReport(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page }).analyze();
  createHtmlReport({ results, options: { outputDir: "accessibility-reports", reportFileName: "dyson-accessibility-report.html" } });
}
```

> Copy the full bodies from this repo's `utils/` files — the logic is unchanged, it just moved.

### 1b. Slim the page object down to locators only

`pages/DysonManufacturerPage.ts` now holds **just the locators** (plus the `url` and a
`snapshotName` constant). Delete all the `fs` / `pixelmatch` / `axe` imports and methods:

```ts
import { type Page, type Locator } from "@playwright/test";

export class DysonManufacturerPage {
  readonly page: Page;
  readonly url = "https://source.thenbs.com/en/gb/manufacturer/dyson/nakAxHWxDZprdqkBaCdn4U/overview";
  readonly snapshotName = "dyson-visual";

  // LOCATORS
  readonly heading: Locator;
  readonly sourceLogo: Locator;
  readonly manufacturerButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { level: 1 });
    this.sourceLogo = page.locator("a.brand-primary.wrapper");
    this.manufacturerButton = page.locator('a[action="manufacturer-header-link"]');
  }
}
```

### 1c. Point the tests at the new helpers

In `tests/first-test.spec.ts`, import the helpers and call them. Remove the now-unused
`fs` / `path` / `pixelmatch` / `PNG` imports. Keep the accessibility test green **on purpose** and
say so in a comment:

```ts
import { applyVisualRegression } from "../utils/visual-regression";
import { generateAccessibilityReport } from "../utils/accessibility";

// visual regression
await applyVisualRegression(page, testInfo, dysonManufacturerPage.snapshotName);

// accessibility — NOTE: intentionally does NOT assert zero violations. This site has
// known, permanent issues that won't be fixed, so asserting would make the suite always
// red. We keep it green and just publish the violations to a report.
await generateAccessibilityReport(page);
```

### 1d. Split the big navigation method into small actions

`pages/NbsHomePage.ts` had one `navigateToDysonManufacturerPage()` that did everything with
"dyson" hard-coded. Split it into small, reusable actions (this matches doc `02`):

```ts
async goto()                 { await this.page.goto("https://source.thenbs.com/en/gb"); }
async closePopup()           { await this.closeDialogButton.click(); }
async search(term: string)   { await this.searchField.click(); await this.searchField.fill(term); await this.searchField.press("Enter"); }
async openManufacturersTab() { await this.manufacturerTab.click(); }
async openDysonManufacturer(){ await this.dysonManufacturerTile.click(); }
```

Then the test's `beforeEach` reads like a story:

```ts
await nbsHomePage.goto();
await nbsHomePage.closePopup();
await nbsHomePage.search("dyson");
await nbsHomePage.openManufacturersTab();
await nbsHomePage.openDysonManufacturer();
```

### 1e. Tell TypeScript about the new folder

Add `utils/**/*` to `include` in `tsconfig.json`:

```json
"include": ["tests/**/*", "fixtures/**/*", "pages/**/*", "utils/**/*"]
```

**Check it compiles:** `npx playwright test --list` (should list the tests with no errors).

```bash
git add utils/ pages/ tests/first-test.spec.ts tsconfig.json
git commit -m "refactor: extract test infrastructure out of page objects into utils/"
```

---

## Step 2 — Delete the leftover scaffold test

`tests/example.spec.ts` is Playwright's auto-generated starter. It doesn't use our page objects or
fixtures, so remove it.

```bash
git rm tests/example.spec.ts
git commit -m "chore: remove leftover Playwright scaffold test"
```

---

## Step 3 — Only commit the baseline screenshots

Visual regression makes three image types per run: the **baseline** (the trusted picture) plus a
throwaway **-actual** and **-diff**. Only the baseline belongs in git.

Add to **`.gitignore`**:

```gitignore
# Visual-regression run artifacts (only the baseline *.png should be committed)
tests/snapshots/*-actual.png
tests/snapshots/*-diff.png
```

Stop tracking the throwaway files already committed:

```bash
git rm --cached "tests/snapshots/*-actual.png" "tests/snapshots/*-diff.png"
git add .gitignore
git commit -m "chore: stop tracking visual-regression run artifacts"
```

---

## Step 4 — Fix the parallel-vs-workers contradiction

`playwright.config.ts` said `fullyParallel: true` but also `workers: 1`, which cancelled it out.
Gate workers on CI so it runs in parallel locally (fast) and serial on CI (stable):

```ts
// before:  workers: 1,
workers: process.env.CI ? 1 : undefined,
```

```bash
git add playwright.config.ts
git commit -m "fix: run tests in parallel locally, serial only on CI"
```

---

## Final check

Run the whole suite once to confirm green ticks (this hits the live NBS site, so it takes a minute):

```bash
npm run test:headless
```

You should end with **4 clean commits** and a project where every folder has exactly one job. ✅
```
