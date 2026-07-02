import { type Page, type Locator } from "@playwright/test";

// The Dyson manufacturer page — heading, logo, and the "I'm a manufacturer" button.
export class DysonManufacturerPage {
  readonly page: Page;
  readonly url = "https://source.thenbs.com/en/gb/manufacturer/dyson/nakAxHWxDZprdqkBaCdn4U/overview";

  // LOCATORS
  readonly heading: Locator;
  readonly sourceLogo: Locator;
  readonly manufacturerButton: Locator;


  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { level: 1 });
    this.sourceLogo = page.locator("a.brand-primary.wrapper");
    this.manufacturerButton = page.locator('a[action="manufacturer-header-link"]');}

   // ACTIONS

  /** Scrolls the full page top-to-bottom so lazy-loaded images start fetching. */
  async triggerLazyLoad(): Promise<void> {
    await this.page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let totalHeight = 0;
        const distance = 300;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;
          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            window.scrollTo(0, 0);
            resolve();
          }
        }, 100);
      });
    });
  }

  /** Waits until every <img> on the page reports as fully loaded. */
  async waitForImagesLoaded(): Promise<void> {
    await this.page.waitForFunction(
      () => Array.from(document.images).every((img) => img.complete),
      { timeout: 10000 },
    );
  }

}
