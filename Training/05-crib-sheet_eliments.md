# Crib Sheet — Tests, POMs & Fixture Explained

A quick reference for every element used across the three layers of this project.
Use this whenever you see something and think *"what does that do again?"*

---

## Layer 1 — Page Object Models (`pages/`)

### `NbsHomePage.ts`

| Element | What it is | What it does |
|---|---|---|
| `readonly page: Page` | Property | Stores the Playwright browser tab so the class can control it |
| `readonly closeDialogButton: Locator` | Locator | Points to the "Close dialog" button on the NBS homepage |
| `readonly searchField: Locator` | Locator | Points to the search text box |
| `readonly manufacturerTab: Locator` | Locator | Points to the "Manufacturers" results tab |
| `readonly dysonManufacturerTile: Locator` | Locator | Points to the Dyson result tile in the search results |
| `constructor(page: Page)` | Constructor | Runs once when the class is created — wires up `this.page` and all locators |
| `navigateToDysonManufacturerPage()` | Action | Opens NBS Source, closes the popup, searches "dyson", clicks the Manufacturers tab, then clicks the Dyson tile |

---

### `DysonManufacturerPage.ts`

| Element | What it is | What it does |
|---|---|---|
| `readonly page: Page` | Property | Stores the Playwright browser tab |
| `readonly url` | Constant | The expected URL of the Dyson manufacturer page — used in `beforeEach` to assert navigation landed correctly |
| `readonly heading: Locator` | Locator | Points to the `<h1>` heading on the Dyson page |
| `readonly sourceLogo: Locator` | Locator | Points to the NBS Source logo link in the header (`a.brand-primary.wrapper`) |
| `readonly manufacturerButton: Locator` | Locator | Points to the "I'm a manufacturer" header button (`a[action="manufacturer-header-link"]`) |
| `constructor(page: Page)` | Constructor | Wires up `this.page` and all locators |
| `triggerLazyLoad()` | Action | Scrolls the page from top to bottom in 300px steps so lazy-loaded images start downloading, then scrolls back to the top |
| `waitForImagesLoaded()` | Action | Waits until every `<img>` on the page has `complete === true` (i.e. finished downloading). Times out after 10 seconds |
| `applyVisualRegression(testInfo)` | Action | Full visual regression flow: triggers lazy load → waits for network idle → waits for images → waits for fonts → takes a full-page screenshot → on first run saves it as the baseline → on subsequent runs compares it using pixelmatch and throws if more than 1% of pixels differ |
| `verifyNoAccessibilityIssues()` | Action | Runs an axe accessibility scan on the current page and saves the results as an HTML report in `accessibility-reports/` |

---

## Layer 2 — Fixture (`fixtures/test-options.ts`)

| Element | What it is | What it does |
|---|---|---|
| `import { test as base }` | Import | Pulls in Playwright's built-in `test` function and renames it `base` so we can extend it |
| `type Pages` | Type | Declares the shape of our two custom fixtures — tells TypeScript what properties tests can ask for |
| `base.extend<Pages>(...)` | Fixture registration | Creates a new `test` function that includes our two custom page objects on top of Playwright's defaults |
| `nbsHomePage: async ({ page }, use)` | Fixture | Creates a new `NbsHomePage` instance with the current `page` and hands it to the test via `use(...)`. Playwright manages the lifecycle |
| `dysonManufacturerPage: async ({ page }, use)` | Fixture | Same as above but for `DysonManufacturerPage` |
| `export { expect }` | Re-export | Makes `expect` available from this file so tests only need one import line for both `test` and `expect` |

---

## Layer 3 — Test file (`tests/first-test.spec.ts`)

| Element | What it is | What it does |
|---|---|---|
| `import { test, expect } from "../fixtures/test-options"` | Import | Loads our custom `test` (with POM fixtures) and `expect` from the fixture file — NOT directly from Playwright |
| `test.describe("Dyson manufacturer page", ...)` | Group | Wraps all tests in a named group. Keeps related tests together and makes reports easier to read |
| `test.beforeEach(...)` | Hook | Runs automatically before every test in the describe block. Navigates to the Dyson page and asserts the URL |
| `{ nbsHomePage, dysonManufacturerPage, page }` | Fixture destructuring | Asks Playwright's fixture system to provide the named objects. Playwright builds them automatically |
| `await nbsHomePage.navigateToDysonManufacturerPage()` | Action call | Calls the navigation action defined in the POM — no locators needed in the test |
| `await expect(page).toHaveURL(dysonManufacturerPage.url)` | Assertion | Checks the browser is on the expected URL using the constant stored in the POM |
| `test("...", async ({ dysonManufacturerPage }) => {...})` | Individual test | A single test that receives only the fixtures it needs. Tests 1–3 only need `dysonManufacturerPage` |
| `await expect(dysonManufacturerPage.heading).toBeVisible()` | Assertion | Checks the heading locator (defined in the POM) is visible on screen |
| `await expect(...).toContainText("Dyson")` | Assertion | Checks an element contains a specific string anywhere in its text content |
| `await expect(...).toHaveAttribute("href", "...")` | Assertion | Checks an element has a specific HTML attribute value |
| `test("visual regression ...", async ({ page, dysonManufacturerPage }, testInfo) => {...})` | Test | Calls `dysonManufacturerPage.applyVisualRegression(testInfo)` — `testInfo` provides the browser name used in the baseline filename |
| `test("accessibility audit ...", async ({ dysonManufacturerPage }) => {...})` | Test | Calls `dysonManufacturerPage.verifyNoAccessibilityIssues()` — one line in the test, all logic in the POM |

---

## Key TypeScript keywords used

| Keyword | What it means |
|---|---|
| `readonly` | The property can only be set once (in the constructor). Prevents it being accidentally overwritten |
| `async` | The function does something that takes time (like clicking or waiting). You must `await` it |
| `await` | Pauses execution until the async operation finishes before moving to the next line |
| `Promise<void>` | The return type of an async function that doesn't return a value — it just does something |
| `export class` | Makes the class available to import in other files |
| `this.page` | Refers to the `page` stored on the class instance — used inside POM methods to control the browser |

---

## How the three layers connect

```
fixtures/test-options.ts          pages/NbsHomePage.ts
        │                                  │
        │  builds & provides               │  contains locators & actions
        ▼                                  ▼
tests/first-test.spec.ts  ──uses──▶  nbsHomePage.navigateToDysonManufacturerPage()
                          ──uses──▶  dysonManufacturerPage.heading
                          ──uses──▶  dysonManufacturerPage.applyVisualRegression(testInfo)
                          ──uses──▶  dysonManufacturerPage.verifyNoAccessibilityIssues()
```

> **One rule to remember:** locators and actions live in the POM. Assertions live in the test.
> The fixture just builds the POMs so you never write `new SomePage(page)` in a test.
