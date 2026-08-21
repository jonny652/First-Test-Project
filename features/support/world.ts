import { setWorldConstructor, World, type IWorldOptions } from "@cucumber/cucumber";
import { type Browser, type BrowserContext, type Page } from "@playwright/test";
import { BasePage } from "../../pages/BasePage";
import { NbsHomePage } from "../../pages/NbsHomePage";
import { DysonManufacturerPage } from "../../pages/DysonManufacturerPage";
import { AbloyManufacturerPage } from "../../pages/AbloyManufacturerPage";

// The Cucumber equivalent of fixtures/test-options.ts — instead of Playwright
// handing page objects to a test via fixtures, every step definition gets
// this same instance through `this`, one fresh CustomWorld per scenario.
export class CustomWorld extends World {
  browser!: Browser;
  context!: BrowserContext;
  page!: Page;

  basePage!: BasePage;
  nbsHomePage!: NbsHomePage;
  dysonManufacturerPage!: DysonManufacturerPage;
  abloyManufacturerPage!: AbloyManufacturerPage;

  constructor(options: IWorldOptions) {
    super(options);
  }

  // Called from the Before hook once `this.page` exists, mirroring the
  // `new XPage(page)` calls fixtures/test-options.ts makes per test.
  initPageObjects(): void {
    this.basePage = new BasePage(this.page);
    this.nbsHomePage = new NbsHomePage(this.page);
    this.dysonManufacturerPage = new DysonManufacturerPage(this.page);
    this.abloyManufacturerPage = new AbloyManufacturerPage(this.page);
  }
}

setWorldConstructor(CustomWorld);
