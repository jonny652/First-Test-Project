# Understanding the Key Files in This Project

Welcome! 👋 This document explains the important files in this project and what each one does.
When you open the project for the first time, all these files can look confusing. Don't worry —
by the end of this page you'll know what each one is for and why it's there.

> **Tip:** You don't need to memorise this. Just read it through once, then come back to it
> whenever you see a file you don't recognise.

---

## The "big picture" first

This is a **test automation project** built with **Playwright** (a tool for automatically
controlling a web browser) and written in **TypeScript** (JavaScript with type-checking added).

A project like this is really just a folder full of files. Some files contain your actual tests,
and others are **configuration** — they tell the tools *how* to behave. Let's go through them.

---

## The most important files

### `package.json` — the heart of your project ❤️

This is the single most important file. Think of it as the **ID card and instruction manual**
for the whole project. It contains:

- **Project details** — the name, version, author, and description.
- **Dependencies** — the list of external tools your project needs to run. In this project you'll
  see `@playwright/test` (Playwright itself) and `@types/node` (type information for Node.js).
- **Scripts** — handy shortcut commands you can run. In this project we have:
  - `npm run test:headless` → runs the tests silently in the background (no visible browser).
  - `npm run test:ui` → runs the tests in Playwright's visual **UI mode**, so you can watch them.
  - `npm run codegen` → opens Playwright's code generator to help you record tests.

> **Why it matters:** When someone new clones this project, they run `npm install`, and npm reads
> `package.json` to download exactly the right tools. Everyone ends up with the same setup.

---

### `package-lock.json` — the exact recipe 🔒

You'll rarely edit this file by hand — and that's fine! While `package.json` says *roughly* which
versions you need (e.g. "Playwright version 1.61 or newer"), `package-lock.json` records the
**exact** versions that were actually installed, right down to the tiniest sub-dependency.

> **Why it matters:** It guarantees that your machine, your teammate's machine, and the CI server
> all install *identical* versions. This avoids the classic "but it works on my computer!" problem.
> **Rule of thumb:** let the tools update it, and commit it to Git.

---

### `playwright.config.ts` — the control panel for Playwright ⚙️

This is the main configuration file for Playwright. It's where you set the "rules of the game" for
how your tests run. In this project it controls things like:

- **`testDir: './tests'`** — where your test files live (the `tests` folder).
- **`timeout: 60000`** — how long (in milliseconds) a test is allowed to run before it's counted as
  failed. Here it's 60 seconds.
- **`fullyParallel: true`** — allows tests to run at the same time instead of one after another,
  which makes them finish faster.
- **`workers`** — how many tests run in parallel at once. A "worker" is like a separate lane on a
  motorway; more workers = more tests running side-by-side. We set
  `workers: process.env.CI ? 1 : undefined`, which means *run one at a time on the CI server*
  (stable) but *use the fast parallel default on your own machine*.
- **`retries`** — how many times to automatically re-run a test if it fails (useful on the CI server
  to smooth over occasional flaky failures).
- **`reporter: 'html'`** — after a test run, Playwright builds a nice HTML report you can open in a
  browser to see what passed and failed.
- **`projects`** — the different browsers to test against. Here we test on **Chromium** (Chrome),
  **Firefox**, and **WebKit** (Safari).

> **Why it matters:** Instead of repeating settings in every test, you set them **once** here and
> they apply everywhere. Change a setting in this file and it affects the whole test suite.

---

### `tsconfig.json` — the TypeScript rulebook 📘

This file configures **TypeScript**, the language the tests are written in. It tells the TypeScript
tooling how strict to be and which features to allow — for example, `"strict": true` turns on extra
safety checks that catch mistakes *before* you even run the tests.

> **Why it matters:** You usually set this up once and forget about it. It quietly helps you write
> safer code by warning you about errors (like a typo in a variable name) as you type.

---

### `tests/` — where your actual tests live 🧪

This folder holds your test files. Each one ends in `.spec.ts` (the `.spec` part signals "this is a
test specification"). For example, `tests/first-test.spec.ts` searches NBS Source for Dyson, opens
its manufacturer page, and then checks the heading, links, appearance, and accessibility.

A single test typically follows a simple pattern:
1. **Go** to a web page.
2. **Do** something (click a link, type into a box).
3. **Check** that the result is what you expected.

Notice the tests are short and readable — they say *what* to check, not *how* to find every button.
That "how" lives in the `pages/`, `fixtures/`, and `utils/` folders described next. This is the
**Page Object Model (POM)** in action.

> **Why it matters:** This is the part you'll spend most of your time in. Everything else in this
> list exists to *support* the files in this folder.

---

### `pages/` — the Page Object Model classes 🗺️

This folder holds one **class per page** of the website. Each class keeps all the **locators**
(*where* things are on that page) and **actions** (*what* you can do there) in one place, so your
tests don't have to. If the website changes a button, you fix it *once* here instead of in every
test.

- **`pages/NbsHomePage.ts`** — the home page: searching and navigating to a manufacturer.
- **`pages/DysonManufacturerPage.ts`** — the Dyson page: the heading, logo, and buttons we check.
- **`pages/BasePage.ts`** — the **parent class** the others `extend`. It holds behaviour that works
  on *any* page (like `closePopup()`), so every page inherits it for free instead of copy-pasting it.

> **Why it matters:** One page = one file. This is the single biggest habit for keeping a growing
> test suite maintainable. See training docs `02` and `05` for the full story.

---

### `fixtures/` — the "toolbox assistant" 🧰

This folder holds our custom **fixtures** (`fixtures/test-options.ts`). A fixture is something
Playwright prepares *before* a test and hands straight to it. We use it to build our page objects
automatically, so tests can just ask for `nbsHomePage` or `dysonManufacturerPage` by name and never
have to write `new NbsHomePage(page)` themselves.

Tests import `test` and `expect` from **this file** instead of from `@playwright/test`, and get all
our page objects wired up for free.

> **Why it matters:** It removes repetitive setup boilerplate from every test and guarantees each
> test gets a fresh, ready-to-use page object. See training doc `02` for a deep dive.

---

### `utils/` — reusable test machinery 🔧

This folder holds **helper functions that aren't tied to any one page** — cross-cutting "test
machinery" that any test can call:

- **`utils/visual-regression.ts`** — takes a screenshot and compares it against a saved baseline to
  catch unexpected visual changes.
- **`utils/accessibility.ts`** — scans the page for accessibility problems and writes an HTML report.

These live here (rather than inside a page object) because pixel-diffing and accessibility scanning
aren't things a *user does on a page* — they're QA techniques that work on *any* page.

> **Why it matters:** It keeps page objects focused purely on locators and actions. The rule of
> thumb: *shared things a **page** does → `pages/BasePage.ts`; shared **test machinery** →
> `utils/`.* Training doc `05` explains this distinction in full.

---

## Supporting files (good to know, but you'll touch them less)

### `.gitignore` — the "please ignore these" list 🙈

Git is the tool that tracks changes to your code. But some files and folders should **never** be
saved into Git — like `node_modules/` (the huge folder of downloaded dependencies) or the generated
test reports. `.gitignore` lists exactly those things so Git leaves them alone.

> **Why it matters:** It keeps your repository small and clean. Anyone can regenerate `node_modules`
> just by running `npm install`, so there's no need to store it.

---

### `.github/workflows/playwright.yml` — the robot that runs your tests 🤖

This file sets up **CI (Continuous Integration)**. It lives inside the special `.github` folder and
tells **GitHub Actions** to automatically run your tests every time code is pushed or a pull request
is opened. It installs Node.js, installs the browsers, runs the tests, and then saves the report.

> **Why it matters:** You don't have to *remember* to run the tests — GitHub runs them for you on
> every change. If someone breaks something, you find out straight away.

---

### `README.md` — the project's welcome page 📖

A README is the first thing people read when they find your project on GitHub. This one explains
what the project is for and what techniques it demonstrates (Page Object Model, API testing,
accessibility checks, and more).

> **Why it matters:** It's the friendly front door to your project. A good README saves everyone
> time by answering "what is this and why does it exist?"

---

### `node_modules/` — the downloaded toolbox 📦

This is a large, auto-generated folder containing all the dependencies from `package.json`. You
**never** edit anything inside it by hand, and (thanks to `.gitignore`) it's never committed to Git.

> **Why it matters:** It's created automatically by `npm install`. If it ever gets corrupted, you
> can safely delete the whole folder and run `npm install` again to rebuild it.

---

## Quick reference cheat sheet

| File / Folder                     | In one sentence                                             |
| --------------------------------- | ----------------------------------------------------------- |
| `package.json`                    | The heart of the project: details, dependencies, scripts.   |
| `package-lock.json`               | Locks the exact versions so everyone installs the same set. |
| `playwright.config.ts`            | The control panel for how Playwright runs your tests.       |
| `tsconfig.json`                   | The rulebook for the TypeScript language.                   |
| `tests/`                          | Where your actual test files live.                          |
| `pages/`                          | Page Object Model classes: locators + actions, one per page.|
| `pages/BasePage.ts`               | Parent class with behaviour shared by every page.           |
| `fixtures/`                       | Builds page objects and hands them to tests automatically.  |
| `utils/`                          | Reusable test machinery (visual regression, accessibility). |
| `.gitignore`                      | Tells Git which files to ignore.                            |
| `.github/workflows/playwright.yml`| Automatically runs your tests on GitHub (CI).               |
| `README.md`                       | The welcome page explaining what the project is.            |
| `node_modules/`                   | The auto-downloaded folder of dependencies.                 |

---

## What to do next

1. Open each file mentioned above and see if you can spot the settings we talked about.
2. Try running the tests with `npm run test:ui` and watch them run in the browser.
3. When you're ready, move on to the next training document.

Happy testing! 🎉
