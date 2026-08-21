This is a small Playwright project that runs various tests against https://source.thenbs.com/
 
The main purpose of the project is to demonstrate the following:
 - Different ways of interacting with and verifying web element attributes
 - Using the Page Object Model design pattern
 - Independent tests
 - Repository created in GitHub
 - CI Pipeline Integration
 - Implementation of the Axe-plugin for usability reporting
 - API Testing
 - Cucumber/Gherkin and Feature file implementation

## Requirements

Before running this project, install [Node.js](https://nodejs.org/) (v24+) and run `npm install` from the project root to pull in all `devDependencies` listed in `package.json`.

## VS Code Extensions

Install each extension by running its command below, or by searching the ID in the VS Code Extensions panel. VS Code will also prompt you to install the recommended ones automatically (from `.vscode/extensions.json`) when you open the project.

### ESLint
Lints code inline and powers `npm run lint` + the pre-commit hook.
- Extension: `code --install-extension dbaeumer.vscode-eslint`
- npm: included in `npm install` (`eslint`)

### Prettier
Formats code on save using `.prettierrc`.
- Extension: `code --install-extension esbenp.prettier-vscode`
- npm: not required — this project only formats via the extension

### Cucumber (Gherkin) Full Support
Autocomplete/validation for `.feature` files against step definitions.
- Extension: `code --install-extension alexkrechik.cucumberautocomplete`
- npm: not required for the extension itself — the BDD test runner (`@cucumber/cucumber`) is included in `npm install`

### Playwright Test for VSCode
Run/debug Playwright tests from the editor's Test Explorer.
- Extension: `code --install-extension ms-playwright.playwright`
- npm: included in `npm install` (`@playwright/test`)

### GitHub Actions
Validates/edits the CI workflow at `.github/workflows/playwright.yml`.
- Extension: `code --install-extension github.vscode-github-actions`
- npm: not available — extension only

### Claude Code
AI coding assistant integration.
- Extension: `code --install-extension anthropic.claude-code`
- npm: included in `npm install` (`@anthropic-ai/claude-code`), or install globally with `npm install -g @anthropic-ai/claude-code`