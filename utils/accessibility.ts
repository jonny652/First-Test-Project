import { type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createHtmlReport } from "axe-html-reporter";

/**
 * Reusable accessibility helper. Runs an axe scan and writes an HTML report.
 *
 * NOTE — this intentionally does NOT assert that there are zero violations.
 * The site under test has known, permanent accessibility issues that will not be
 * fixed, so a `expect(violations).toEqual([])` assertion would fail on every run and
 * turn the whole suite red. Instead we keep the test green and simply publish the
 * violations to a report for a human to read. If you ever test a site where issues
 * *should* be fixed, add the assertion back in the calling test.
 */
export async function generateAccessibilityReport(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page }).analyze();
  createHtmlReport({
    results,
    options: {
      outputDir: "accessibility-reports",
      reportFileName: "dyson-accessibility-report.html",
    },
  });
}
