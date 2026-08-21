import { type Page, type Locator, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

// The Dyson manufacturer page — heading, logo, and the "I'm a manufacturer" button.
export class DysonManufacturerPage extends BasePage {
  readonly url = "/en/gb/manufacturer/dyson/nakAxHWxDZprdqkBaCdn4U/overview";

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
  readonly certificationTileTitles: Locator;
  readonly noCertificationsMessage: Locator;
  readonly certificationTilesContainer: Locator;

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
    this.certificationTileTitles = page.locator('[data-cy="searchResultTileTitle"]');
    // <app-no-results-guidance>'s heading — the site's generic "no results"
    // component, shared across search/list contexts, not certifications-specific.
    this.noCertificationsMessage = page.getByRole("heading", { name: "Sorry, no results were found" });
    // <app-certificate-list> — stays mounted (and empty, no tiles, no
    // no-results messaging) when the certifications request fails, distinct
    // from the "no results" empty state above (a real search returning zero
    // results vs. the request failing outright).
    this.certificationTilesContainer = page.locator('app-certificate-list');
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

  /** Click the Certifications tab (client-side routed — no full page navigation). */
  async openCertificatesTab(): Promise<void> {
    await this.certificatesTab.click();
  }

  /** Assert the first certification tile displays the given name. */
  async assertFirstCertificationNameIs(expectedName: string): Promise<void> {
    const firstTileTitle = this.certificationTileTitles.first();
    await expect(firstTileTitle).toBeVisible();
    await expect(firstTileTitle).toContainText(expectedName);
  }

  /** Assert the Certifications tab shows its empty-state message when there are no certifications. */
  async assertNoCertificationsMessageVisible(): Promise<void> {
    await expect(this.noCertificationsMessage).toBeVisible();
  }

  /**
   * Assert the tile container itself still renders (the tab didn't blow up)
   * but holds no certification tiles — the request-failed case, distinct
   * from a genuine empty search result. Checking toBeAttached() rather than
   * toBeVisible(): the container is an empty flex element with no intrinsic
   * content, so it collapses to a 0x0 box — genuinely CSS-visible, but
   * Playwright's toBeVisible() also requires a non-zero bounding box, which
   * an intentionally-empty container will never have.
   */
  async assertNoCertificationsVisible(): Promise<void> {
    await expect(this.certificationTilesContainer).toBeAttached();
    await expect(this.certificationTileTitles).toHaveCount(0);
  }
}
