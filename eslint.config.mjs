import tseslint from "typescript-eslint";
import playwright from "eslint-plugin-playwright";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  {
    ignores: [
      "node_modules",
      "allure-report",
      "allure-results",
      "cucumber-report",
      "playwright-report",
      "test-results",
      "accessibility-reports",
      "traces",
      "reports",
      "playwright/.auth",
      "playwright/.cache",
    ],
  },
  {
    files: ["**/*.ts"],
    extends: [tseslint.configs.recommended],
  },
  {
    files: ["tests/**/*.ts"],
    plugins: { playwright },
    rules: {
      ...playwright.configs["flat/recommended"].rules,
      // These tests delegate their assertions to page-object helper
      // methods rather than inlining expect() calls — tell the rule about
      // them so it doesn't flag the tests as assertion-less.
      "playwright/expect-expect": [
        "warn",
        {
          assertFunctionNames: [
            "applyVisualRegression",
            "generateAccessibilityReport",
            "assertTabsVisibilityOrderAndHref",
            "verifyImAManufacturerButton",
          ],
        },
      ],
    },
  },
  {
    // Cucumber step definitions call `expect()` directly inside
    // Given/When/Then callbacks rather than inside a Playwright test()
    // block, which is what these two rules assume — they don't apply to
    // this project's Cucumber runner.
    files: ["features/**/*.ts"],
    plugins: { playwright },
    rules: {
      ...playwright.configs["flat/recommended"].rules,
      "playwright/no-standalone-expect": "off",
      "playwright/expect-expect": "off",
    },
  },
  prettier
);
