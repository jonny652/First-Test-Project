import { Before, After, BeforeAll, AfterAll, setDefaultTimeout, type ITestCaseHookParameter } from "@cucumber/cucumber";
import { chromium, type Browser } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import { CustomWorld } from "./world";

// Cucumber's default per-step timeout is 5s, too short for real page
// navigation/network waits. Match playwright.config.ts's 60s test timeout.
setDefaultTimeout(60 * 1000);

// One browser for the whole run — starting a new browser per scenario would
// be slow. Playwright's own test runner does this for you; here we do it by hand.
let browser: Browser;

BeforeAll(async function () {
  browser = await chromium.launch();
});

const traceDir = path.join(__dirname, "..", "..", "traces");

// Runs before every scenario: fresh context + page, so scenarios stay isolated
// from each other (no shared cookies/storage), then wires up the page objects.
Before(async function (this: CustomWorld) {
  this.browser = browser;
  this.context = await browser.newContext();
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
  await this.page.close();
  await this.context.close();
});

AfterAll(async function () {
  await browser.close();
});
