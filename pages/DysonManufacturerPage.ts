import { type Page, type Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

// The Dyson manufacturer page — heading, logo, and the "I'm a manufacturer" button.
// This page is mostly about *verifying* elements, so the page object just exposes
// WHERE things are and lets the tests do the assertions. Reusable test infrastructure
// (visual regression, accessibility scanning) lives in `utils/`, not here.
export class DysonManufacturerPage extends BasePage {
  readonly url = "https://source.thenbs.com/en/gb/manufacturer/dyson/nakAxHWxDZprdqkBaCdn4U/overview";

  // Snapshot file-name prefix used by the visual-regression helper.
  readonly snapshotName = "dyson-visual";

  // LOCATORS
  readonly heading: Locator;
  readonly sourceLogo: Locator;
  readonly manufacturerButton: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole("heading", { level: 1 });
    this.sourceLogo = page.locator("a.brand-primary.wrapper");
    this.manufacturerButton = page.locator('a[action="manufacturer-header-link"]');
  }
}
