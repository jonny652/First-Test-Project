import { Before, After, BeforeAll, AfterAll, setDefaultTimeout } from "@cucumber/cucumber";
import { chromium, type Browser } from "@playwright/test";
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

// Runs before every scenario: fresh context + page, so scenarios stay isolated
// from each other (no shared cookies/storage), then wires up the page objects.
Before(async function (this: CustomWorld) {
  this.browser = browser;
  this.context = await browser.newContext();
  this.page = await this.context.newPage();
  this.initPageObjects();
});

After(async function (this: CustomWorld) {
  await this.page.close();
  await this.context.close();
});

AfterAll(async function () {
  await browser.close();
});
