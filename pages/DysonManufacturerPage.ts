import { type Page, type Locator, type TestInfo } from "@playwright/test";
import fs from "fs";
import path from "path";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import AxeBuilder from "@axe-core/playwright";
import { createHtmlReport } from "axe-html-reporter";
import { BasePage } from "./BasePage";

// The Dyson manufacturer page — heading, logo, and the "I'm a manufacturer" button.
export class DysonManufacturerPage extends BasePage {
  readonly url = "https://source.thenbs.com/en/gb/manufacturer/dyson/nakAxHWxDZprdqkBaCdn4U/overview";

  // LOCATORS
  
  readonly sourceLogo: Locator;
  readonly manufacturerButton: Locator;
  readonly overviewTab: Locator;
  readonly productsTab: Locator;
  readonly certificatesTab: Locator;
  readonly literatureTab: Locator;
  readonly caseStudiesTab: Locator;
  readonly aboutTab: Locator;
  readonly allTabs: Locator;
  readonly dysonTelephoneNumber: Locator;
  readonly dysonWebsiteLink: Locator;
  readonly linkedInIcon: Locator;
  readonly heartAddItemToCollectionIcon: Locator;
  
  

  constructor(page: Page) {
    super(page);
    this.sourceLogo = page.locator("a.brand-primary.wrapper");
    this.manufacturerButton = page.locator('a[action="manufacturer-header-link"]');
    this.overviewTab = page.locator('[data-cy="overviewTab"]');
    this.productsTab = page.locator('[data-cy="productsTab"]');
    this.certificatesTab = page.locator('[data-cy="certificatesTab"]');
    this.literatureTab = page.locator('[data-cy="literatureTab"]');
    this.caseStudiesTab = page.locator('[data-cy="caseStudiesTab"]');
    this.aboutTab = page.locator('[data-cy="aboutTab"]');
    this.allTabs = page.locator('.mat-mdc-tab-links a[role="tab"]');
    this.dysonTelephoneNumber = page.locator('a[href="tel:08003457788"]');
    this.dysonWebsiteLink = page.locator('a[href="https://www.dyson.co.uk/commercial/overview"]');
    this.linkedInIcon = page.locator('a[href="https://www.linkedin.com/company/dyson/"]');
    //this.heartAddItemToCollectionIcon = page.locator('[data-mat-icon-name="heart-circle-plus"]');
    this.heartAddItemToCollectionIcon = page.locator('[data-mat-icon-name="heart-circle-plus"].foreground-heart').first();
  }

  // ACTIONS

  


}
