import { type Page, type Locator, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

// The Abloy UK manufacturer page — heading, logo, and the "I'm a manufacturer" button.
export class AbloyManufacturerPage extends BasePage {
  readonly url = "https://source.thenbs.com/en/gb/manufacturer/abloy-uk/nbAnmJUFmBRb9A2M4g4Gpz/overview";

  // LOCATORS

  readonly sourceLogo: Locator;
  readonly manufacturerButton: Locator;
  readonly overviewTab: Locator;
  readonly productsTab: Locator;
  readonly cpdTab: Locator;
  readonly literatureTab: Locator;
  readonly caseStudiesTab: Locator;
  readonly aboutTab: Locator;
  readonly allTabs: Locator;
  readonly abloyTelephoneNumber: Locator;
  readonly abloyWebsiteLink: Locator;
  readonly linkedInIcon: Locator;
  readonly heartAddItemToCollectionIcon: Locator;

  constructor(page: Page) {
    super(page);
    this.sourceLogo = page.locator("a.brand-primary.wrapper");
    this.manufacturerButton = page.locator('a[action="manufacturer-header-link"]');
    this.overviewTab = page.locator('[data-cy="overviewTab"]');
    this.productsTab = page.locator('[data-cy="productsTab"]');
    // Abloy UK's manufacturer page has a "CPD" tab in place of Dyson's "Certifications" tab.
    this.cpdTab = page.locator('[data-cy="cpdTab"]');
    this.literatureTab = page.locator('[data-cy="literatureTab"]');
    this.caseStudiesTab = page.locator('[data-cy="caseStudiesTab"]');
    this.aboutTab = page.locator('[data-cy="aboutTab"]');
    this.allTabs = page.locator('.mat-mdc-tab-links a[role="tab"]');
    this.abloyTelephoneNumber = page.locator('a[href="tel:+44 (0)1902 364500"]');
    this.abloyWebsiteLink = page.locator('a[href="https://www.abloy.co.uk"]');
    this.linkedInIcon = page.locator('a[href="https://www.linkedin.com/company/abloy-uk/"]');
    this.heartAddItemToCollectionIcon = page.locator('[data-mat-icon-name="heart-circle-plus"].foreground-heart').first();
  }

  // ACTIONS

  /** Assert all navigation tabs are visible, in the correct order, and each has the correct href. */
  async assertTabsVisibilityOrderAndHref(): Promise<void> {
    // Each entry pairs a tab locator with its expected href.
    const expectedTabs = [
      { locator: this.overviewTab, href: "/en/gb/manufacturer/abloy-uk/nbAnmJUFmBRb9A2M4g4Gpz/overview" },
      { locator: this.productsTab, href: "/en/gb/manufacturer/abloy-uk/nbAnmJUFmBRb9A2M4g4Gpz/products" },
      { locator: this.cpdTab, href: "/en/gb/manufacturer/abloy-uk/nbAnmJUFmBRb9A2M4g4Gpz/cpd" },
      { locator: this.literatureTab, href: "/en/gb/manufacturer/abloy-uk/nbAnmJUFmBRb9A2M4g4Gpz/literature" },
      { locator: this.caseStudiesTab, href: "/en/gb/manufacturer/abloy-uk/nbAnmJUFmBRb9A2M4g4Gpz/case-studies" },
      { locator: this.aboutTab, href: "/en/gb/manufacturer/abloy-uk/nbAnmJUFmBRb9A2M4g4Gpz/about" },
    ];

    // Assert each tab is visible and carries the correct href.
    for (const tab of expectedTabs) {
      await expect(tab.locator).toBeVisible();
      await expect(tab.locator).toHaveAttribute("href", tab.href);
    }

    // Read every tab's text in DOM order and assert the full sequence matches —
    // catches a tab being added, removed, or reordered without changing individual locators.
    const tabLabels = await this.allTabs.allTextContents();
    expect(tabLabels.map((t) => t.trim())).toEqual(["Overview", "Products", "CPD", "Literature", "Case studies", "About us"]);
  }

  //Assert the Heart icon will allow loged in users to add an item to their collection.
  async assertCollectionButtonBehavesAsExpected(): Promise<void> {
    // 1. Verify the heart icon has the correct title attribute
    await expect(this.heartAddItemToCollectionIcon).toHaveAttribute("title", "Select item");

    //Click the heart icon
    await this.heartAddItemToCollectionIcon.click();

    //Verify the icon changed to the active/selected state
    await expect(this.heartAddItemToCollectionIcon).toHaveClass(/active/);

    //Verify the title changed to "Deselect item"
    await expect(this.heartAddItemToCollectionIcon).toHaveAttribute("title", "Deselect item");

    //Verify the purple bar is displayed showing 1 item has been selected
    const selectionBar = this.page.getByText(/Selected item \(\d+\)/);
    await expect(selectionBar).toBeVisible();
    await expect(selectionBar).toHaveText("Selected item (1)");
  }
}
