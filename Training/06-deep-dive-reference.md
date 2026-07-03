# Deep Dive Reference — Everything Explained

This document goes one level deeper than the crib sheet. It explains not just *what* each element
is, but *why* it exists, *how* it works under the hood, and *how* it is used in this project.

---

## Imports

### What is an import?

An `import` statement brings code from another file into the current file so you can use it.
Without it, TypeScript has no idea what `Page`, `test`, or `expect` are.

```ts
import { test, expect } from "../fixtures/test-options";
```

The `{ }` curly braces pick out *named exports* — specific things the other file has chosen to
share. The path `"../fixtures/test-options"` means "go up one folder, then into `fixtures/`,
then the file called `test-options.ts`".

### `import { type Page }`

The `type` keyword in an import means "I only need this for TypeScript's type-checking — don't
include it in the compiled JavaScript output." `Page` is Playwright's object that represents one
browser tab. We use it to type our constructor arguments so TypeScript knows what methods are
available on it.

---

## Classes

### What is a class?

A class is a **blueprint** for creating objects. You define it once, then create as many instances
of it as you need. In this project, each Page Object is a class. The class groups together all the
locators (the addresses of elements) and actions (the things you can do) for one web page.

```ts
export class NbsHomePage {
  // everything about the NBS homepage lives here
}
```

`export` means "make this class available to import in other files".

### `readonly`

Marking a property `readonly` means it can only be assigned once — in the `constructor`. After
that, nothing can overwrite it. It's a safety net. If you accidentally wrote
`this.searchField = somethingElse` later in a method, TypeScript would immediately show an error.

```ts
readonly searchField: Locator;
```

### The `constructor`

The constructor is a special method that runs automatically whenever you write `new SomePage(page)`.
Its job is to receive the `page` object and use it to set up all the locators.

```ts
constructor(page: Page) {
  this.page = page;                                               // store the tab
  this.searchField = page.getByRole("textbox", { name: "Search" }); // wire up locator
}
```

`this` refers to the specific instance of the class being created. So `this.page` means "the
`page` property on *this* object".

---

## Locators

### What is a `Locator`?

A `Locator` is Playwright's way of describing *where an element is* on the page. Think of it as a
stored address. It doesn't actually touch the browser when you declare it — it only interacts with
the page when you call an action on it (`click()`, `fill()`, etc.) or pass it to `expect()`.

### `page.getByRole()`

Finds an element by its ARIA role — the accessibility label browsers give to elements like buttons,
textboxes, links, headings, and tabs.

```ts
page.getByRole("button", { name: "Close dialog" })  // finds <button>Close dialog</button>
page.getByRole("textbox", { name: "Search" })        // finds an <input type="text"> labelled "Search"
page.getByRole("tab", { name: "Manufacturers" })     // finds a tab element with that label
page.getByRole("link", { name: "Dyson ..." })        // finds an <a> tag with that text
page.getByRole("heading", { level: 1 })              // finds the <h1> heading
```

This is the **recommended** way to find elements in Playwright because it mirrors how screen readers
navigate, making your tests more accessible and resilient to styling changes.

### `page.locator()`

Finds elements using a CSS selector. Used when `getByRole` isn't specific enough.

```ts
page.locator("a.brand-primary.wrapper")              // CSS: an <a> tag with both those classes
page.locator('a[action="manufacturer-header-link"]') // CSS: an <a> with a custom attribute
```

---

## Actions

### What is an action method?

An action method is an `async` function on a Page Object class that *does something* on the page —
clicking, typing, navigating. By putting actions here instead of directly in tests, you write the
steps once and reuse them everywhere.

### `async` and `await`

Almost everything in Playwright involves waiting for the browser to respond. `async` marks a
function as "this does something that takes time". Inside that function, `await` pauses execution
until the operation completes before moving to the next line.

```ts
async navigateToDysonManufacturerPage(): Promise<void> {
  await this.page.goto("https://source.thenbs.com/en/gb");  // wait for page to load
  await this.closeDialogButton.click();                       // wait for click to register
}
```

Without `await`, the test would fire all the commands at once without waiting — the browser would
still be loading when the test tried to click things that don't exist yet.

### `Promise<void>`

`Promise<void>` is the return type of an `async` function that doesn't return a useful value — it
just *does* something. The `Promise` part is automatic when you use `async`; `void` means "nothing
comes back". You'll see this on every action method in the POMs.

### `this.page.goto(url)`

Navigates the browser tab to a URL and waits for the page to load.

### `locator.click()`

Clicks the element. Playwright automatically waits for it to be visible and enabled first.

### `locator.fill(text)`

Clears a text input and types the given text into it.

### `locator.press(key)`

Simulates pressing a keyboard key. `"Enter"` submits a search, for example.

### `this.page.waitForLoadState("networkidle")`

Waits until there are no more than 2 in-flight network requests for at least 500ms. Used in the
visual regression flow to ensure images have finished downloading before taking a screenshot.

### `this.page.evaluate(fn)`

Runs a JavaScript function *inside the browser tab* (not in Node.js). Used in `triggerLazyLoad`
to scroll the page using `window.scrollBy`, which only exists inside the browser.

### `this.page.waitForFunction(fn)`

Runs a JavaScript function inside the browser repeatedly until it returns `true`. Used in
`waitForImagesLoaded` to keep checking until every `<img>` has `complete === true`.

### `this.page.screenshot({ fullPage: true })`

Takes a PNG screenshot. `fullPage: true` stitches the entire scrollable page together, not just
the visible viewport.

---

## Assertions (`expect`)

Assertions are the checks — the part of the test that says "this should be true". If an assertion
fails, the test fails and Playwright reports exactly what was expected vs what actually happened.

| Assertion | What it checks |
|---|---|
| `expect(page).toHaveURL("...")` | The browser's current URL matches exactly |
| `expect(locator).toBeVisible()` | The element exists in the DOM and is visible on screen |
| `expect(locator).toContainText("...")` | The element's text content includes the given string |
| `expect(locator).toHaveAttribute("href", "...")` | The element has an HTML attribute with that exact value |

All Playwright assertions automatically **retry** for up to 5 seconds (by default) before giving
up. This means minor timing delays don't cause false failures.

---

## The Fixture file (`fixtures/test-options.ts`)

### What is a fixture?

A fixture is something Playwright sets up for you *before* each test and tears down *after* it.
Playwright's built-in fixtures include `page` (a fresh browser tab) and `browser`. Our fixture file
adds `nbsHomePage` and `dysonManufacturerPage` on top of those.

### `base.extend<Pages>(...)`

`extend` creates a new `test` function that includes everything in `base` (Playwright's defaults)
plus whatever you add. `<Pages>` is a TypeScript generic — it tells the type system the shape of
the new fixtures so VS Code can autocomplete them in tests.

### `async ({ page }, use) => { ... }`

Each fixture is an async function that receives already-built fixtures (here, `page`) and a `use`
callback. You build your object, pass it to `use(...)`, and Playwright hands it to the test.
Anything you put *after* `use(...)` runs as teardown.

```ts
nbsHomePage: async ({ page }, use) => {
  await use(new NbsHomePage(page));  // build the POM and hand it to the test
  // after use() — teardown code would go here if needed
},
```

### Why use a fixture instead of `new NbsHomePage(page)` in the test?

If you wrote `new NbsHomePage(page)` in every test, you'd have to repeat that in 10, 20, 100 tests.
The fixture does it once. It also means Playwright controls the lifecycle — the POM is created
fresh for each test, with its own `page` object, so tests never share state.

---

## The Test file (`tests/first-test.spec.ts`)

### `test.describe("name", () => { ... })`

Groups tests under a shared label. All tests inside share the same `beforeEach` hook. The name
appears in the HTML report, making it easy to see which group a test belongs to.

### `test.beforeEach(async ({ ... }) => { ... })`

Runs before *every* test inside the `describe` block. In this project it navigates to the Dyson
manufacturer page. Because every test needs to start there, it makes sense to do it once here
rather than repeat the navigation in every test.

### Fixture destructuring `{ nbsHomePage, dysonManufacturerPage, page }`

When a test function declares `{ nbsHomePage }` in its arguments, Playwright's fixture system sees
that and creates the `nbsHomePage` fixture automatically — you don't call `new` anywhere. Only
request what you need; if a test only checks the heading, it only asks for `dysonManufacturerPage`.

### `test("name", async ({ ... }) => { ... })`

A single test. The name appears in reports and in the VS Code Playwright panel. Keep names
descriptive — they're the first thing you read when a test fails.

---

## Visual Regression (`applyVisualRegression`)

### How it works

1. **Lazy load trigger** — scrolls the page so images start downloading
2. **Network idle** — waits until all downloads finish
3. **Images loaded** — soft check that every `<img>` is complete
4. **Fonts ready** — waits for web fonts to render
5. **500ms pause** — absorbs any final CSS transitions
6. **Screenshot** — captures the full page as a PNG buffer
7. **First run** — if no baseline file exists, saves the screenshot as the baseline and exits
8. **Subsequent runs** — loads the baseline, crops both images to the same size, runs pixelmatch,
   saves a diff image, and throws an error if more than 1% of pixels differ

### pixelmatch

`pixelmatch` compares two images pixel-by-pixel and returns the number of pixels that are
different. The `threshold: 0.1` setting means a pixel must be at least 10% different in colour
before it's counted — this filters out tiny anti-aliasing differences that don't matter visually.

### Platform suffix

The baseline filename includes `process.platform` (`win32` or `linux`) and the browser name.
Windows and Linux render text slightly differently, so they need separate baselines. Committing
both means CI (Linux) and local (Windows) each compare against their own reference image.

---

## Accessibility Audit (`verifyNoAccessibilityIssues`)

### How it works

`AxeBuilder` injects the `axe-core` engine into the live browser page and runs a full scan. It
returns a results object containing any violations found (missing alt text, poor contrast, missing
labels, etc.). `createHtmlReport` turns those results into a readable HTML file saved to
`accessibility-reports/`.

The test does not assert on violations — it always passes. The HTML report is the output; a human
reviews it.

---

## Quick mental model

```
Browser tab (page)
       │
       ▼
Page Object (NbsHomePage / DysonManufacturerPage)
  holds: locators   ── point at elements
  holds: actions    ── do things / capture things
       │
       ▼
Fixture (test-options.ts)
  builds the page objects once per test, hands them in
       │
       ▼
Test (first-test.spec.ts)
  calls actions → makes assertions → pass or fail
```
