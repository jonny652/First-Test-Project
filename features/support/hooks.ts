import { Before, After, BeforeAll, AfterAll, setDefaultTimeout, type ITestCaseHookParameter } from "@cucumber/cucumber";
import { chromium, type Browser } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import { CustomWorld } from "./world";
import { applyNetworkStubs } from "../../utils/network-stubs";
import { flushAccessibilityReportMessages } from "../../utils/accessability";
import { BasePage } from "../../pages/BasePage";
import { NbsHomePage } from "../../pages/NbsHomePage";

// Cucumber's default per-step timeout is 5s, too short for real page
// navigation/network waits. Match playwright.config.ts's 60s test timeout.
setDefaultTimeout(60 * 1000);

// One browser for the whole run — starting a new browser per scenario would
// be slow. Playwright's own test runner does this for you; here we do it by hand.
let browser: Browser;

// Same file tests/auth.setup.ts writes to (see playwright.config.ts's
// "setup" project) — sharing it means this suite and the Playwright-native
// one reuse a single signed-in session instead of each signing in on their
// own.
const authFile = path.join(__dirname, "..", "..", "playwright", ".auth", "user.json");

/** True if authFile's saved session still gets us signed in. */
async function isSavedSessionStillValid(): Promise<boolean> {
  const context = await browser.newContext({ storageState: authFile });
  try {
    const page = await context.newPage();
    const nbsHomePage = new NbsHomePage(page);
    await nbsHomePage.goto();
    await nbsHomePage.closePopup();
    await new BasePage(page).userMenuButton.waitFor({ state: "visible", timeout: 5000 });
    return true;
  } catch {
    return false;
  } finally {
    await context.close();
  }
}

/** Signs in fresh (mirrors tests/auth.setup.ts) and (re)writes authFile. */
async function signInAndSaveAuthState(): Promise<void> {
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    const basePage = new BasePage(page);
    const nbsHomePage = new NbsHomePage(page);
    await nbsHomePage.goto();
    await nbsHomePage.closePopup();
    await basePage.verifySignInProcess();
    fs.mkdirSync(path.dirname(authFile), { recursive: true });
    await context.storageState({ path: authFile });
  } finally {
    await context.close();
  }
}

// Reuse the saved session if it's still valid; otherwise sign in fresh so
// every scenario's context (see Before below) starts already signed in —
// same "sign in once, reuse everywhere" idea as auth.setup.ts, just driven
// from this suite instead of depending on a separate `playwright test` run.
async function ensureAuthenticated(): Promise<void> {
  if (fs.existsSync(authFile) && (await isSavedSessionStillValid())) {
    return;
  }
  await signInAndSaveAuthState();
}

// HEADED=true opens a visible browser (slowed down so actions are easy to
// follow) instead of the default headless run — cucumber-js has no built-in
// "UI mode" like Playwright Test's --ui, so this is the equivalent for
// watching a scenario play out.
BeforeAll(async function () {
  const headed = process.env.HEADED === "true";
  browser = await chromium.launch(headed ? { headless: false, slowMo: 250 } : {});
  await ensureAuthenticated();
});

const traceDir = path.join(__dirname, "..", "..", "traces");
const screenshotDir = path.join(__dirname, "..", "..", "screenshots");

// Runs before every scenario: fresh context + page, so scenarios stay isolated
// from each other (no shared cookies/storage), then wires up the page objects.
Before(async function (this: CustomWorld, scenario: ITestCaseHookParameter) {
  this.browser = browser;
  this.context = await browser.newContext({ storageState: authFile });
  // Tag-driven network stubs (see utils/network-stubs.ts) — must be
  // registered before any navigation happens, so this runs before newPage().
  await applyNetworkStubs(this.context, scenario.pickle.tags.map((tag) => tag.name));
  // screenshots/snapshots/sources give the Trace Viewer a full timeline
  // (DOM snapshots + source code), matching what playwright.config.ts
  // collects for the Playwright-only suite.
  await this.context.tracing.start({ screenshots: true, snapshots: true, sources: true });
  this.page = await this.context.newPage();
  this.initPageObjects();
});

After(async function (this: CustomWorld, scenario: ITestCaseHookParameter) {
  fs.mkdirSync(traceDir, { recursive: true });
  const status = (scenario.result?.status ?? "unknown").toLowerCase();
  const safeName = scenario.pickle.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  const uniqueSuffix = scenario.pickle.id.slice(0, 8);

  // Captured only on failure so the auto-bug-logging step (see
  // scripts/log-ci-bugs.js) has an image to attach to the GitHub issue it
  // files. .catch() guards against a page that's already crashed or closed
  // itself as part of the failure.
  if (status === "failed") {
    fs.mkdirSync(screenshotDir, { recursive: true });
    await this.page
      .screenshot({ path: path.join(screenshotDir, `${safeName}-${uniqueSuffix}.png`), fullPage: true })
      .catch(() => {});
  }

  await this.context.tracing.stop({
    path: path.join(traceDir, `${safeName}-${status}-${uniqueSuffix}.zip`),
  });
  // The app keeps firing background GraphQL requests even after a scenario's
  // steps finish. If one of the api-regression stub route handlers (see
  // utils/network-stubs.ts) is still mid route.fetch() when the context
  // below gets disposed, that fetch rejects with "Request context disposed"
  // — and since it's unhandled, it can surface as a failure in a LATER
  // scenario's Before hook instead of this one. unrouteAll with
  // ignoreErrors detaches the handlers first and swallows exactly that.
  await this.page.unrouteAll({ behavior: "ignoreErrors" });
  await this.page.close();
  await this.context.close();
});

// browser.close() has to flush every scenario's accumulated trace data
// (screenshots/snapshots/sources) before it can fully shut down — measured
// at 1m20s for a 5-scenario api-regression run, comfortably past the default
// 60s hook timeout (confirmed via diagnostics: 0 open contexts, 0 pending
// route.fetch() calls at that point — genuinely slow teardown, not a leak).
AfterAll({ timeout: 120 * 1000 }, async function () {
  await browser.close();
  flushAccessibilityReportMessages();
});
