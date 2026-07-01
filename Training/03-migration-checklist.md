# POM Migration — One-Page Checklist

Work top to bottom. **Each step ends with tests green → commit → stop & review.** Never move on red.

> **Golden rule:** POM *holds* the tools ·· Fixture *builds* the tools ·· Test *uses* the tools.

**What that actually means** (think of a workshop 🔧):

- **POM = the toolbox.** Each `pages/*.ts` file *holds* the tools for one page — the **locators**
  (where things are on the page) and the **actions** (what you can do, like `search()` or
  `goto()`). The toolbox owns the tools, but it doesn't decide when they get used.
- **Fixture = the assistant who hands you the toolbox.** `fixtures/test-options.ts` *builds* the
  page objects for you so the test never has to write `new NbsHomePage(page)` itself. You just ask
  for `nbsHomePage` and it's ready to go.
- **Test = the job you're doing.** `first-test.spec.ts` *uses* the tools — it calls the actions
  (`nbsHomePage.search('dyson')`) and checks the results (`expect(...)`). It reads almost like plain
  English because all the messy detail lives in the toolbox.

Why split it three ways? So each piece has **one job**. If the website changes a button, you fix it
**once** in the toolbox (POM) and every test keeps working. The test itself barely changes.

---

### ☐ Step 0 — Baseline (already done ✅)
- On branch `practice/pom-migration`, flat `first-test.spec.ts`, no `pages/` or `fixtures/`.
- `npx playwright test first-test.spec.ts --project=chromium -g "assert|Ensure"` → **green**.

### ☐ Step 1 — Empty POM shells
- Create `pages/NbsHomePage.ts` and `pages/DysonManufacturerPage.ts`.
- Each has: `readonly page`, a `// LOCATORS` header, a `// ACTIONS` header, empty `constructor(page)`.
- Nothing uses them yet. **Review → commit.**

### ☐ Step 2 — Fixture scaffolding
- Create `fixtures/test-options.ts`: extend `base` test, register `nbsHomePage` + `dysonManufacturerPage`, re-export `expect`.
- Still unused. **Review → commit.**

### ☐ Step 3 — Switch the test's import
- Change `first-test.spec.ts` import from `@playwright/test` → `../fixtures/test-options`.
- One line. Run tests → still green. **Review → commit.**

### ☐ Step 4 — Migrate `NbsHomePage` (the `beforeEach`)
- **4a.** Add the 4 **locators** to the constructor. Leave `beforeEach` as-is (temporary duplication). → green.
- **4b.** Add **action methods**: `goto`, `closePopup`, `search`, `openManufacturersTab`, `openDysonManufacturer`. → green.
- **4c.** Rewrite `beforeEach` to call those methods; **delete** the inline locators/steps. → green. **Review → commit.**

### ☐ Step 5 — Migrate `DysonManufacturerPage` (the assertions)
- **5a.** Add `heading`, `sourceLogo`, `manufacturerButton` locators + `expectedUrl`.
- **5b.** Point the 3 tests at `dysonManufacturerPage.heading` etc.; drop their inline locators. → green. **Review → commit.** 🎉

---

### Where does each bit of code go?
| Old flat code | New home |
| --- | --- |
| 🟦 `page.getByRole(...)` locators | POM **constructor** (LOCATORS) |
| 🟩 `click` / `fill` / `goto` steps | POM **action methods** (ACTIONS) |
| `new SomePage(page)` boilerplate | the **fixture** (built for you) |
| 🟧 `beforeEach` + `expect(...)` | **stays in the test**, now calls the POM |

### Run tests after every step
```
npx playwright test first-test.spec.ts --project=chromium -g "assert|Ensure"
```

### If a step goes red
Undo just that step — the last green commit is your safety net:
```
git restore .        # discard uncommitted changes, back to last green
```

> Full walkthrough: `02-page-object-model.md` · Visual map: `03-flat-vs-pom-visual.md`
