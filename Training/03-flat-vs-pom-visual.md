# Flat File vs Page Object Model — A Visual Guide

This is the **picture** version of the previous document. No walls of code — just diagrams that
show how our old single test file gets split up into the Page Object Model (POM), and where each
piece ends up.

> 📌 **How to read this:** the diagrams below are written in *Mermaid*. GitHub (and VS Code with a
> Mermaid extension) draws them automatically. The colours are the key — every box is coloured by
> **what kind of thing it is**:
>
> - 🟦 **Locators** — *WHERE* things are on the page
> - 🟩 **Actions** — *WHAT* we do on the page
> - 🟨 **Fixtures** — the "glue" that builds page objects for us
> - 🟧 **Tests** — the actual checks

---

## 1. The big picture — before and after

On the left, **everything lives in one file**. On the right, POM gives each kind of code its
**own home**.

```mermaid
flowchart LR
  subgraph BEFORE["😵 FLAT — one file does everything"]
    direction TB
    F1["first-test.spec.ts<br/>─────────────<br/>locators<br/>+ actions<br/>+ tests<br/>all mixed together"]
  end

  subgraph AFTER["😎 POM — a place for everything"]
    direction TB
    P1["pages/NbsHomePage.ts<br/>pages/DysonManufacturerPage.ts"]
    P2["fixtures/test-options.ts"]
    P3["tests/first-test.spec.ts"]
    P1 --> P2 --> P3
  end

  BEFORE ==>|"migrate"| AFTER

  classDef flat fill:#ffe0e0,stroke:#c00,stroke-width:2px,color:#000
  classDef page fill:#e0ecff,stroke:#06c,stroke-width:2px,color:#000
  classDef fix  fill:#fff4cc,stroke:#e6a800,stroke-width:2px,color:#000
  classDef test fill:#ffe6cc,stroke:#e67300,stroke-width:2px,color:#000
  class F1 flat
  class P1 page
  class P2 fix
  class P3 test
```

---

## 2. Where does each line of the flat file go?

This is the heart of it. The single flat file gets **pulled apart**, and each type of code moves to
a specific new file.

```mermaid
flowchart TB
  FLAT["📄 first-test.spec.ts<br/>(the old flat file)"]

  FLAT --> LOC["🟦 LOCATORS<br/>page.getByRole('textbox'…)<br/>page.locator('a.brand…')<br/><br/>➡ move into the constructor of<br/>pages/*.ts"]
  FLAT --> ACT["🟩 ACTIONS<br/>click / fill / goto / press<br/><br/>➡ become named methods in<br/>pages/*.ts"]
  FLAT --> TST["🟧 TESTS<br/>expect(…).toBeVisible()<br/><br/>➡ stay as tests, but now call<br/>the page objects"]

  LOC --> POM["pages/NbsHomePage.ts<br/>pages/DysonManufacturerPage.ts"]
  ACT --> POM
  POM --> FIX["🟨 fixtures/test-options.ts<br/>builds the page objects for us"]
  FIX --> NEW["🟧 tests/first-test.spec.ts<br/>(the new, tidy test)"]
  TST --> NEW

  classDef flat fill:#ffe0e0,stroke:#c00,stroke-width:2px,color:#000
  classDef loc  fill:#e0ecff,stroke:#06c,stroke-width:2px,color:#000
  classDef act  fill:#e2f6e2,stroke:#2a2,stroke-width:2px,color:#000
  classDef fix  fill:#fff4cc,stroke:#e6a800,stroke-width:2px,color:#000
  classDef test fill:#ffe6cc,stroke:#e67300,stroke-width:2px,color:#000
  class FLAT flat
  class LOC loc
  class ACT act
  class POM loc
  class FIX fix
  class TST,NEW test
```

**In one sentence:** locators and actions leave the test and move into `pages/`, a fixture builds
those page objects, and the test just *uses* them.

---

## 3. Locators vs Actions — the split inside one page object

Inside each `pages/*.ts` file there are **two clearly-labelled sections**. Same file, two jobs.

```mermaid
flowchart LR
  subgraph NBS["pages/NbsHomePage.ts"]
    direction TB
    L["🟦 LOCATORS section<br/>────────────<br/>searchField<br/>manufacturerTab<br/>dysonManufacturerTile<br/><br/>(WHERE things are)"]
    A["🟩 ACTIONS section<br/>────────────<br/>goto()<br/>search(term)<br/>openManufacturersTab()<br/><br/>(WHAT we do)"]
    A -->|"uses"| L
  end

  classDef loc fill:#e0ecff,stroke:#06c,stroke-width:2px,color:#000
  classDef act fill:#e2f6e2,stroke:#2a2,stroke-width:2px,color:#000
  class L loc
  class A act
```

> 💡 The **actions use the locators** — e.g. `search()` uses `searchField`. That's why an action
> arrow points *into* the locators box. Change a locator once, and every action still works.

---

## 4. How it all connects when a test runs

This shows the "flow" at run-time — who builds what, and who talks to whom.

```mermaid
flowchart LR
  T["🟧 Test<br/>tests/first-test.spec.ts"]
  F["🟨 Fixture<br/>fixtures/test-options.ts"]
  N["🟦🟩 NbsHomePage"]
  D["🟦🟩 DysonManufacturerPage"]
  W["🌐 The website"]

  T -->|"1 asks for nbsHomePage"| F
  F -->|"2 builds & hands over"| N
  F -->|"2 builds & hands over"| D
  T -->|"3 calls actions"| N
  T -->|"3 checks locators"| D
  N -->|"drives"| W
  D -->|"reads"| W

  classDef test fill:#ffe6cc,stroke:#e67300,stroke-width:2px,color:#000
  classDef fix  fill:#fff4cc,stroke:#e6a800,stroke-width:2px,color:#000
  classDef page fill:#eef2ff,stroke:#06c,stroke-width:2px,color:#000
  classDef web  fill:#eee,stroke:#888,stroke-width:1px,color:#000
  class T test
  class F fix
  class N,D page
  class W web
```

**The story in 3 steps:**
1. The test says *"I need `nbsHomePage`"* — it never writes `new NbsHomePage(page)` itself.
2. The **fixture** builds the page object(s) and hands them over.
3. The test **calls actions** and **checks locators** — reading almost like plain English.

---

## 5. The one-locator journey (a concrete example)

Follow a *single* locator — the search box — from the old file to the new one.

```mermaid
flowchart LR
  A["🟥 BEFORE<br/>inside the test:<br/>const searchField =<br/>page.getByRole('textbox'…)"]
  B["🟦 AFTER<br/>pages/NbsHomePage.ts<br/>this.searchField =<br/>page.getByRole('textbox'…)"]
  C["🟩 used by action<br/>search(term) {<br/> searchField.fill(term) }"]
  D["🟧 called by test<br/>nbsHomePage.search('dyson')"]

  A ==>|"moved"| B ==> C ==> D

  classDef before fill:#ffe0e0,stroke:#c00,stroke-width:2px,color:#000
  classDef loc fill:#e0ecff,stroke:#06c,stroke-width:2px,color:#000
  classDef act fill:#e2f6e2,stroke:#2a2,stroke-width:2px,color:#000
  classDef test fill:#ffe6cc,stroke:#e67300,stroke-width:2px,color:#000
  class A before
  class B loc
  class C act
  class D test
```

If the website changes that search box, you now fix it in **one place** (the blue box) instead of
in every test. That single benefit is the whole reason POM exists. 🎉

---

## 6. Cheat-sheet

| Old flat file had…            | In POM it becomes…                        | Which file             |
| ----------------------------- | ----------------------------------------- | ---------------------- |
| 🟦 `page.getByRole(...)`       | a locator property in the constructor     | `pages/*.ts` (LOCATORS)|
| 🟩 `click` / `fill` / `goto`   | a named `async` action method             | `pages/*.ts` (ACTIONS) |
| `new SomePage(page)`          | done for you automatically                | `fixtures/test-options.ts` |
| 🟧 `expect(...)` checks        | stays a test, but calls the page objects  | `tests/*.spec.ts`      |

> 👉 For the full step-by-step code walkthrough, see **`02-page-object-model.md`**. This document is
> the map; that one is the guided tour.
