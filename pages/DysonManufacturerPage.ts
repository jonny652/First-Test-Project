import { type Page, type Locator, type TestInfo, expect } from "@playwright/test";
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

  /** Assert all navigation tabs are visible, in the correct order, and each has the correct href. */
  async assertTabsVisibilityOrderAndHref(): Promise<void> {
    // Each entry pairs a tab locator with its expected href.
    const expectedTabs = [
      { locator: this.overviewTab, href: "/en/gb/manufacturer/dyson/nakAxHWxDZprdqkBaCdn4U/overview" },
      { locator: this.productsTab, href: "/en/gb/manufacturer/dyson/nakAxHWxDZprdqkBaCdn4U/products" },
      { locator: this.certificatesTab, href: "/en/gb/manufacturer/dyson/nakAxHWxDZprdqkBaCdn4U/third-party-certifications" },
      { locator: this.literatureTab, href: "/en/gb/manufacturer/dyson/nakAxHWxDZprdqkBaCdn4U/literature" },
      { locator: this.caseStudiesTab, href: "/en/gb/manufacturer/dyson/nakAxHWxDZprdqkBaCdn4U/case-studies" },
      { locator: this.aboutTab, href: "/en/gb/manufacturer/dyson/nakAxHWxDZprdqkBaCdn4U/about" },
    ];

    // Assert each tab is visible and carries the correct href.
    for (const tab of expectedTabs) {
      await expect(tab.locator).toBeVisible();
      await expect(tab.locator).toHaveAttribute("href", tab.href);
    }

    // Read every tab's text in DOM order and assert the full sequence matches —
    // catches a tab being added, removed, or reordered without changing individual locators.
    const tabLabels = await this.allTabs.allTextContents();
    expect(tabLabels.map((t) => t.trim())).toEqual(["Overview", "Products", "Certifications", "Literature", "Case studies", "About us"]);
  }
}
