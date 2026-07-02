# The Page Object Model (POM) — Step by Step

In the last document we learned what each file in the project does. Now we're going to improve
**how our tests are written** by introducing the **Page Object Model** (POM).

This guide walks you through it slowly, using the code we *already have* in
`tests/first-test.spec.ts`. By the end you'll have:

- A page object for the **NBS homepage** (searching and navigating).
- A page object for the **Dyson manufacturer page** (the checks/assertions).
- Each page object neatly split into a **Locators** section and an **Actions** section.
- A **fixture** that creates those page objects for you and hands them to your tests —
  the "best practice" way, so you never write `new SomePage(page)` in a test again.

---

## 1. What problem does POM solve?

Look at our current test. The locators are written *inside* the test:

```ts
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
  // ...
});
```

This works, but imagine we have **20 tests** that all search for a manufacturer. If the website
changes the search box, we'd have to fix the locator in **20 places**. 😱

**The Page Object Model fixes this.** The idea is simple:

> For every page (or major component) of the website, we create **one class** that holds
> all the locators and all the actions for that page. Tests then talk to that class instead
> of poking at the page directly.

**Benefits:**
- **One place to change.** If a locator changes, you fix it in *one* file.
- **Readable tests.** Tests read like plain English: `await nbsHomePage.searchForManufacturer('dyson')`.
- **No repetition.** Write the "search" steps once, reuse them everywhere.

---

## 2. Where do the files go?

Let's create two new folders in the project root:

```
First-Test-Project/
├── pages/            ← our Page Object classes live here
│   ├── NbsHomePage.ts
│   └── DysonManufacturerPage.ts
├── fixtures/         ← our custom fixture lives here
│   └── test-options.ts
├── tests/
│   └── first-test.spec.ts
└── ...
```

> **Naming tip:** page object files are usually named after the page in `PascalCase` and end in
> `Page` — e.g. `NbsHomePage.ts`. Keep it consistent so files are easy to find.

---

## 3. Anatomy of a Page Object class

Every page object we write follows the **same skeleton**. Learn this shape once and every page
object becomes easy:

```ts
import { Page, Locator } from '@playwright/test';

export class ExamplePage {
  // The 'page' is Playwright's browser tab. Every page object needs it.
  readonly page: Page;

  // ============================================================
  //  LOCATORS  (WHERE things are on the page)
  // ============================================================
  readonly someButton: Locator;

  // The constructor runs when we do `new ExamplePage(page)`.
  // It's where we wire up every locator, once.
  constructor(page: Page) {
    this.page = page;
    this.someButton = page.getByRole('button', { name: 'Click me' });
  }

  // ============================================================
  //  ACTIONS  (WHAT we do on the page)
  // ============================================================
  async clickTheButton() {
    await this.someButton.click();
  }
}
```

Notice the two clearly commented sections — **LOCATORS** and **ACTIONS**. This is exactly the
separation you wanted, and it's a great habit.

- **Locators** are declared as class properties and assigned once in the `constructor`.
- **Actions** are `async` methods that *use* those locators to do something.
- `readonly` just means "this is set once and shouldn't be reassigned" — a small safety net.

---

## 4. Build the first page object — `NbsHomePage`

This page object owns everything about landing on NBS Source and navigating to a manufacturer.
Create `pages/NbsHomePage.ts`:

```ts
import { Page, Locator } from '@playwright/test';

export class NbsHomePage {
  readonly page: Page;

  // ============================================================
  //  LOCATORS
  // ============================================================
  readonly closePopupButton: Locator;
  readonly searchField: Locator;
  readonly manufacturerTab: Locator;
  readonly dysonManufacturerTile: Locator;

  constructor(page: Page) {
    this.page = page;
    this.closePopupButton = page.getByRole('button', { name: 'Close dialog' });
    this.searchField = page.getByRole('textbox', { name: 'Search' });
    this.manufacturerTab = page.getByRole('tab', { name: 'Manufacturers' });
    this.dysonManufacturerTile = page.getByRole('link', { name: 'Dyson Dyson Technology for' });
  }

  // ============================================================
  //  ACTIONS
  // ============================================================

  /** Open the NBS Source homepage. */
  async goto() {
    await this.page.goto('https://source.thenbs.com/en/gb');
  }

  /** Close the cookie/marketing popup if it appears. */
  async closePopup() {
    await this.closePopupButton.click();
  }

  /** Type a search term and submit it. */
  async search(term: string) {
    await this.searchField.click();
    await this.searchField.fill(term);
    await this.searchField.press('Enter');
  }

  /** Switch to the Manufacturers results tab. */
  async openManufacturersTab() {
    await this.manufacturerTab.click();
  }

  /** Click the Dyson result tile to open its manufacturer page. */
  async openDysonManufacturer() {
    await this.dysonManufacturerTile.click();
  }
}
```

See what happened? Every locator from our old `beforeEach` now lives in the **LOCATORS** section,
and every step became a small, well-named **ACTION** method.

> **Best-practice note — keep assertions OUT of most action methods.** A page object's job is
> mostly to *do* things and *expose* elements. Let the **test** decide what to assert. (There are
> exceptions, but as a beginner, start with this rule — it keeps page objects reusable.)

---

## 5. Build the second page object — `DysonManufacturerPage`

This one owns the elements we *check* on the Dyson page. Create
`pages/DysonManufacturerPage.ts`:

```ts
import { Page, Locator } from '@playwright/test';

export class DysonManufacturerPage {
  readonly page: Page;

  // The URL we expect to land on.
  readonly expectedUrl =
    'https://source.thenbs.com/en/gb/manufacturer/dyson/nakAxHWxDZprdqkBaCdn4U/overview';

  // ============================================================
  //  LOCATORS
  // ============================================================
  readonly heading: Locator;
  readonly sourceLogo: Locator;
  readonly manufacturerButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { level: 1 });
    this.sourceLogo = page.locator('a.brand-primary.wrapper');
    this.manufacturerButton = page.locator('a[action="manufacturer-header-link"]');
  }

  // ============================================================
  //  ACTIONS
  // ============================================================
  // (This page is mostly about verifying elements, so the test will do the
  //  assertions using the locators above. We keep the page object focused on
  //  exposing WHERE things are.)
}
```

> **Why expose locators instead of hiding every check?** Because our tests here are *verifying
> attributes* (href, text, visibility). The cleanest approach is to let the page object say
> "here is the heading / logo / button" and let the test say "and it should look like this".

---

## 6. Now the part you asked about — Fixtures 🔑

Here's the problem fixtures solve. Without them, every test has to build its own page objects:

```ts
test('example', async ({ page }) => {
  const nbsHomePage = new NbsHomePage(page);            // repeated in every test 😴
  const dysonPage = new DysonManufacturerPage(page);    // repeated in every test 😴
  // ...
});
```

That `new ...(page)` boilerplate gets repeated in *every single test*. **Fixtures let Playwright
create those objects for us and inject them straight into the test**, exactly like the built-in
`page` fixture is injected.

### 6a. What is a fixture, really?

A **fixture** is just a named thing Playwright prepares *before* your test and hands to it. You've
already been using one: `{ page }`. That `page` is a built-in fixture — Playwright creates a fresh
browser tab and passes it in.

We're going to create **our own fixtures**: `nbsHomePage` and `dysonManufacturerPage`. Then any
test can ask for them by name, and Playwright builds them automatically.

### 6b. Create the fixture file

Create `fixtures/test-options.ts`:

```ts
import { test as base } from '@playwright/test';
import { NbsHomePage } from '../pages/NbsHomePage';
import { DysonManufacturerPage } from '../pages/DysonManufacturerPage';

// 1. Describe the SHAPE of our custom fixtures — the names and their types.
type MyFixtures = {
  nbsHomePage: NbsHomePage;
  dysonManufacturerPage: DysonManufacturerPage;
};

// 2. Extend Playwright's base `test` with our fixtures.
export const test = base.extend<MyFixtures>({
  // Each fixture is a function. Playwright gives it the built-in `page`,
  // and we give back the ready-to-use page object via `use(...)`.
  nbsHomePage: async ({ page }, use) => {
    await use(new NbsHomePage(page));
  },

  dysonManufacturerPage: async ({ page }, use) => {
    await use(new DysonManufacturerPage(page));
  },
});

// 3. Re-export `expect` so tests import everything from one place.
export { expect } from '@playwright/test';
```

**Let's decode the fixture function**, because this is the bit that's new to you:

```ts
nbsHomePage: async ({ page }, use) => {
  await use(new NbsHomePage(page));
},
```

- `async ({ page }, use) => { ... }` — the fixture receives the built-in `page` fixture, plus a
  special `use` function.
- `new NbsHomePage(page)` — we build our page object, passing in the current browser tab.
- `await use(theObject)` — this is the important line. `use` **hands the object to your test**.
  Playwright pauses here, runs your test with that object available, and resumes afterwards
  (which is where you'd put any cleanup, if you needed it).

> **Mental model:** `use(x)` means *"here you go, test — here is `x` to work with."* Anything before
> `use` is **setup**; anything after `use` is **teardown**.

### 6c. Why this is the "intended" / best-practice way

- **No boilerplate.** Tests never call `new NbsHomePage(page)` again.
- **Lazy creation.** A fixture is only built if a test actually *asks* for it. A test that only
  needs `dysonManufacturerPage` won't waste time creating `nbsHomePage`.
- **Consistent lifecycle.** Playwright manages setup/teardown for you, per test, automatically.
- **One import.** Tests import `test` and `expect` from our fixture file, and get everything.

---

## 7. Rewrite the test using the page objects + fixtures

Now the payoff. Update `tests/first-test.spec.ts` — notice we now import `test` and `expect` from
our **fixture file**, not from `@playwright/test`:

```ts
import { test, expect } from '../fixtures/test-options';

test.describe('Dyson manufacturer page', () => {
  // Ask for `nbsHomePage` and `dysonManufacturerPage` — the fixtures build them for us.
  test.beforeEach(async ({ nbsHomePage, dysonManufacturerPage, page }) => {
    await nbsHomePage.goto();
    await nbsHomePage.closePopup();
    await nbsHomePage.search('dyson');
    await nbsHomePage.openManufacturersTab();
    await nbsHomePage.openDysonManufacturer();
    await expect(page).toHaveURL(dysonManufacturerPage.expectedUrl);
  });

  test('assert that the heading is correct on the dyson homepage', async ({ dysonManufacturerPage }) => {
    await expect(dysonManufacturerPage.heading).toBeVisible();
    await expect(dysonManufacturerPage.heading).toContainText('Dyson');
  });

  test('Ensure the HREF attribute on the source logo is as expected', async ({ dysonManufacturerPage }) => {
    await expect(dysonManufacturerPage.sourceLogo).toHaveAttribute('href', '/en/gb');
  });

  test("assert the I'm a manufacturer button is visible, has correct text and correct href", async ({ dysonManufacturerPage }) => {
    await expect(dysonManufacturerPage.manufacturerButton).toBeVisible();
    await expect(dysonManufacturerPage.manufacturerButton).toContainText("I'm a manufacturer");
    await expect(dysonManufacturerPage.manufacturerButton).toHaveAttribute(
      'href',
      'https://manufacturers.thenbs.com/nbs-source',
    );
  });
});
```

Compare this to the original. The test now reads like a story: *go, close popup, search, open tab,
open Dyson*. And there is **not a single locator string** in the test file — they all live safely in
the page objects. 🎉

---

## 8. Your step-by-step checklist

Follow this order and you can't go wrong:

1. **Create the folders** `pages/` and `fixtures/`.
2. **Create one page object per page.** Start with the skeleton from section 3.
3. **Fill in the LOCATORS section** — move every `page.getByRole(...)` / `page.locator(...)` out of
   the test and into the constructor.
4. **Fill in the ACTIONS section** — turn each step (`click`, `fill`, `goto`) into a named method.
5. **Create the fixture file** (`fixtures/test-options.ts`) and register each page object.
6. **Update the test's import** to come from the fixture file.
7. **Ask for the page objects** in `beforeEach` / tests instead of using raw `page`.
8. **Run the tests** (`npm run test:ui`) and confirm everything still passes. ✅

> **Golden rule:** migrate **one page at a time** and run the tests after each step. If something
> breaks, you'll know exactly which change caused it.

---

## 9. Common beginner mistakes to avoid

- ❌ **Creating locators inside action methods** (e.g. `page.getByRole(...)` inside a `click`
  method). Keep them in the constructor's LOCATORS section so there's one home for them.
- ❌ **Putting `expect` assertions inside every page object method.** Let the test own the
  assertions where possible — it keeps page objects reusable.
- ❌ **Importing `test` from `@playwright/test` after building the fixture.** Once you have
  `fixtures/test-options.ts`, always import `test` and `expect` from there.
- ❌ **One giant page object for the whole site.** One class per page (or major component) keeps
  things tidy.

---

## 10. Where to go next

Once you're comfortable, good follow-up topics are:
- Adding a **`BasePage`** that shared actions (like `closePopup`) can live on.
- Returning page objects from actions to enable **chaining** (e.g. navigation methods that return
  the next page).
- Introducing **test data** files so search terms and URLs aren't hard-coded.

But don't rush — get these two page objects and the fixture working first. That's the foundation
everything else builds on. Happy testing! 🎉
