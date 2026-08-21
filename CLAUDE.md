# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A Playwright/TypeScript test project targeting https://source.thenbs.com/. It demonstrates the Page Object Model, independent tests, visual regression, accessibility (axe-core) auditing, API-level testing via network stubbing, and both native Playwright Test specs and Cucumber/Gherkin BDD — two separate runners exercising the same site through one shared Page Object layer.

## Setup

```
npm install
```

Copy `.env.example` to `.env` and fill in `NBS_EMAIL` / `NBS_PASSWORD` (site login) and `BASE_URL` (defaults to the production site if unset). `.env` is gitignored.

## Commands

Playwright suite (`tests/*.spec.ts`):
```
npm run test:ui                     # Playwright UI mode — pick projects/tests from the sidebar
npm run test:headless               # headless run, "Microsoft Edge" project only
npm run test:all                    # every project: setup, chromium, firefox, webkit, Microsoft Edge
npx playwright test --project=chromium                       # single project
npx playwright test tests/first-test.spec.ts -g "heading"    # single test by name/grep
```
Note: only `chromium` is installed in CI (see `.github/workflows/playwright.yml`) — `firefox`/`webkit`/`Microsoft Edge` require the browser to be installed locally (`npx playwright install <browser>`) before they'll run.

Cucumber/BDD suite (`features/*.feature`):
```
npm run test:bdd                    # cucumber-js, then always generates the HTML report (even on failure)
npx cucumber-js                     # raw run, no report generation — what CI uses
HEADED=true npx cucumber-js         # visible, slowed-down browser (cucumber-js has no UI-mode equivalent)
```

Other:
```
npm run lint / lint:fix             # eslint
npx tsc --noEmit -p .               # type-check (not wired into an npm script)
```
Husky's pre-commit hook runs `npx lint-staged`, which runs `eslint --fix` on staged `.ts`/`.js` files.

## Architecture

**Two test runners, one Page Object layer.** `pages/*.ts` is shared by both suites:
- `BasePage` — locators/actions common to every page (popup close, back-to-top, sign-in, "I'm a manufacturer" button, contact-manufacturer popup).
- `NbsHomePage` — the search/navigation entry point both suites use to reach a manufacturer page.
- `DysonManufacturerPage` / `AbloyManufacturerPage` — extend `BasePage`, add page-specific locators plus shared-shape methods like `assertTabsVisibilityOrderAndHref()` and `assertCollectionButtonBehavesAsExpected()`. Adding a new manufacturer page means following this same pattern.

The two suites wire these page objects up differently:
- **Playwright Test** (`tests/*.spec.ts`) gets them via `fixtures/test-options.ts`, which extends Playwright's `test` with a fixture per page object (`nbsHomePage`, `dysonManufacturerPage`, `abloyManufacturerPage`, `basePage`). A new page object needs a fixture added here to be usable in a spec.
- **Cucumber** (`features/step-definitions/*.steps.ts`) gets them via `features/support/world.ts`'s `CustomWorld` — `initPageObjects()` builds one instance of each per scenario, accessed as `this.xyzPage` in step definitions. `features/support/hooks.ts` drives the browser/context/page/tracing lifecycle by hand (cucumber-js has no built-in per-test browser/worker model the way Playwright Test does).

**Shared login session.** Both suites reuse the same signed-in session file, `playwright/.auth/user.json`:
- Playwright's `setup` project (`tests/auth.setup.ts`) signs in and writes it; every other Playwright project depends on `setup` and starts already authenticated.
- `hooks.ts`'s `ensureAuthenticated()` reuses that same file if it's still valid, otherwise re-signs-in and rewrites it — so running either suite alone keeps the file fresh for the other.
- Both paths call `BasePage.verifySignInProcess()` — keep that in sync if the sign-in flow changes.

**Page catalog for parametrized scenarios.** `features/support/page-catalog.ts` maps a page name string (e.g. `"Dyson manufacturer"`) to a `navigate()` function. `accessability-regression.feature` and `visual-regression.feature` use Scenario Outlines that key off these names. A new manufacturer page needs an entry here to be included in those outlines.

**Base URL.** `playwright.config.ts`'s `use.baseURL` comes from `process.env.BASE_URL` (falls back to production). Page objects store paths relative to it (`DysonManufacturerPage.url`, `AbloyManufacturerPage.url`, `NbsHomePage.goto()`), which also lets `expect(page).toHaveURL(pageObject.url)` resolve correctly against a relative path.

**`utils/` — framework-agnostic helpers**, callable from either suite:
- `visual-regression.ts` — screenshots the page, compares against a baseline in `tests/snapshots/` via pixelmatch (1% diff threshold), first run writes the baseline. Baselines are keyed by `${snapshotName}-${platform}-${projectName}`, so each browser/runner gets its own.
- `accessability.ts` — runs an axe-core scan and writes an HTML report to `accessibility-reports/`. Deliberately does **not** assert zero violations — the site under test has known, permanent issues, so the check is report-only unless a calling test adds its own assertion.
- `network-stubs.ts` — tag-driven GraphQL response stubbing for `features/api-regression.feature`. `networkStubRegistry` maps a Cucumber tag (e.g. `@stub-empty-certifications`) to a stub setup function; `hooks.ts`'s `Before` hook applies whichever stubs match a scenario's tags automatically. To add a new API scenario: tag it in the `.feature` file and add a matching registry entry — no other wiring needed.

**CI** (`.github/workflows/playwright.yml`): the `bdd-tests` job is currently commented out — only the `playwright-tests` job runs, executing the Playwright `.spec.ts` suite against `--project=chromium` (the only browser installed on the runner). To bring Cucumber back into CI, uncomment `bdd-tests`.

**Reports/artifacts** (all gitignored):
- `playwright-report/` — Playwright's own HTML reporter output.
- `allure-results/` / `allure-report/`, `cucumber-report/` — Cucumber suite reporting; `cucumber-report/cucumber-report.json` feeds `scripts/log-ci-bugs.js`, which files (or comments on, or reopens) a GitHub issue per failed scenario when the `AUTO_LOG_BUGS` repo variable is `"true"`.
- `accessibility-reports/` — axe HTML reports, one per page scanned.
- `traces/`, `screenshots/` — written manually by `hooks.ts`'s `After` hook for the Cucumber suite (the Playwright suite's tracing is configured separately via `playwright.config.ts`'s `trace: 'on-first-retry'`).
