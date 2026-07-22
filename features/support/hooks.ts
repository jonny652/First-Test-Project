import { Before, After, BeforeAll, AfterAll, setDefaultTimeout, type ITestCaseHookParameter } from "@cucumber/cucumber";
import { chromium, type Browser } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import { CustomWorld } from "./world";
import { applyNetworkStubs } from "../../utils/network-stubs";

// Cucumber's default per-step timeout is 5s, too short for real page
// navigation/network waits. Match playwright.config.ts's 60s test timeout.
setDefaultTimeout(60 * 1000);

// One browser for the whole run — starting a new browser per scenario would
// be slow. Playwright's own test runner does this for you; here we do it by hand.
let browser: Browser;

// HEADED=true opens a visible browser (slowed down so actions are easy to
// follow) instead of the default headless run — cucumber-js has no built-in
// "UI mode" like Playwright Test's --ui, so this is the equivalent for
// watching a scenario play out.
BeforeAll(async function () {
  const headed = process.env.HEADED === "true";
  browser = await chromium.launch(headed ? { headless: false, slowMo: 250 } : {});
});

const traceDir = path.join(__dirname, "..", "..", "traces");

// Runs before every scenario: fresh context + page, so scenarios stay isolated
// from each other (no shared cookies/storage), then wires up the page objects.
Before(async function (this: CustomWorld, scenario: ITestCaseHookParameter) {
  this.browser = browser;
  this.context = await browser.newContext();
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
});
