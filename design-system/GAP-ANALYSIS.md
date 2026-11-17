# Gap analysis: mockup kits, skills and the Figma UI App library

Date: 17 Nov 2026. Scope: `ai-tools-design-test/mockup-kit`, `ai-tools-design-test/kiro-mockup-designer`, the skills and steering that route ReviewPro mockup requests, and the 30 component pages of the Figma UI App library (`ubE7R2jeqiwS8BZ4a5vwHw`).

## 1. The two kits, and what was combined

| | mockup-kit (Nov 10) | kiro-mockup-designer |
|---|---|---|
| Stack | React + Vite, needs `npm run dev` | Plain HTML, CSS, JS; opens from disk, Figma Make ready |
| Scope | Figma Tables page only: table atoms, toolbar, footer, 4 example sheets | The whole app: shell, 45+ components, 10 page starters, settings hub, icons, Tweak editor, website |
| Fidelity proof | Pixel diffs of 4 table sheets (0.22% to 0.38%) | None before this pass |
| Routing | `user-mockup-kit` steering pointed every mockup request here | Its skill lived only inside the kit folder, so Laura's workspaces never loaded it |

Decision: **kiro-mockup-designer is the one kit.** From mockup-kit it now has:

- the table sizes and states measured against the Figma Tables page (merged earlier, see `components/rp-table.md`);
- the pixel-diff method, rebuilt for the HTML kit as `.kiro/scripts/figma-check.py` and extended from tables to the whole library (57 checks, `figma/README.md`);
- the coverage method (`COVERAGE.md`), extended to the whole library in section 3 below.

mockup-kit stays where it is (nothing deleted): its `node_modules` provide the Chrome driver some maintainer scripts use, and its 4 verified sheets are the reference for the table checks still to write. Its README and the `user-mockup-kit` steering now send mockup work to kiro-mockup-designer.

## 2. Gaps found in the skills, and what was done

| Gap | Effect | Done |
|---|---|---|
| Three routes for one request (mockup-kit steering, the product `reviewpro-mockup` skill, the kit skill nobody loaded) | The same request could produce React, product-cookbook or kit mockups | Workspace steering and two `user-` skills route ReviewPro mockups to this kit and modernisation to V2 |
| No way to read a Figma mockup into kit markup | "Make this Figma screen" was guesswork | `figma-map.json` (every library set and variant to kit classes) and `figma-outline.py` (Figma frame to build plan); skill section "From a Figma frame" |
| No proof the kit matches the library | Drift went unnoticed | `figma-check.py` with 57 checks; run it after any CSS change |
| Components had drifted from the library | Buttons, outlined borders, chips, badge, tooltip, alerts, tabs, menus, breadcrumbs, radio, switch, field icons and the pagination arrow looked off | All fixed to the library values (section 3) |
| Library components missing | Mockups using them could not be built | Slider, Uploader, Timeline added; the rest listed in section 3 |
| A bug: the establishment selector was always rendered, invisible but present, at the bottom of every page | Full-page screenshots showed it under the last tile | Fixed (`display` only when open) |
| No separation between "as it is" and "ideal" UI | Improvements would leak into faithful mockups | `reviewpro-ui-modernise` skill, `v2/theme-v2.css`, `make-v2.py` and the version switch |
| Documentation spread across the kit | Hard to know where to start | `README.md` rewritten as the entry point; `figma/README.md`, `v2/README.md` and this file |

## 3. Library coverage

Verified = pixel check in `figma/checks.json` passes. Built = in the kit and documented, no pixel check yet (the Figma reference PNG is already in `figma/ref/` where listed).

| Figma page | Kit | Status |
|---|---|---|
| Buttons (Button, IconButton, IconButton_Squared, FAB) | `rp-main-button`, `rp-default-button`, `rp-ghost-button`, `rp-icon-button`, `rp-floating-button` | Verified (12 Button variants, 2 icon buttons); FAB built |
| Chips | `rp-chip` | Verified (10 variants); Neon and Topic styles missing |
| Avatar | `rp-avatar` | Verified (3 sizes) |
| Badge | `rp-badge` | Verified (digit); dot built |
| Selectors (Checkbox, Radio) | `rp-checkbox`, `rp-radio` | Verified (5 states) |
| Switch | `rp-switch` | Verified (4 variants of the current set) |
| Fields (Select, Text field, Searcher, Text area, Autocomplete) | `rp-select`, `rp-text-field`, `rp-search`, `rp-text-area` | Verified (6); text area and autocomplete built; Ghost style missing |
| Tooltip | `data-rp-tooltip` | Verified |
| Alert | `rp-alert` | Verified (4 feedbacks, inline); multiline built |
| Tabs | `rp-tabs`, `rp-tab` | Verified (medium, small) |
| Menu | `rp-menu`, `rp-menu-item`, `rp-menu-search` | Verified (menu with search) |
| Breadcrumbs | `rp-breadcrumbs` | Verified |
| Paginator | `rp-table-pagination` | Verified |
| Text Compositions (Volume-Bar) | `rp-volume-bar` | Verified (Style 01); styles 02-05 built as the positive/negative bar |
| Slider | `rp-slider` (new) | Verified |
| Uploader | `rp-uploader` (new) | Verified (empty); file list built |
| Timeline | `rp-timeline` (new) | Verified |
| Navigation (Top Bar / Side Bar) | app shell | Specs applied and compared screen by screen (`components/rp-app-shell.md`) |
| Tables | `rp-table`, `rp-toolbar` | Built from the measured Tables page values; HTML pixel checks to write (references in mockup-kit `figma/ref/`) |
| Tiles, Card | `rp-tile` | Built (references `248-6831`, `1931-10627`) |
| Dialog & Modal | `rp-dialog` | Built (reference `1213-1168`) |
| Sidebar (Drawer/Panel) | `rp-drawer` | Built (reference `9561-22067`) |
| Accordion, More-less | `rp-accordion`, `rp-link` | Built (references `3763-21700`, `3763-21754`, `3763-21814`) |
| Toggle Button (new style) | `rp-toggle-button-group` | Built (references `10053-838`, `10053-848`, `10053-888`) |
| Pages Headers | page title + `kit-toolbar` | Built (reference `8002-44935`) |
| Popover | `rp-popover` | Built (reference `27-9330`); the Translation and Informative layouts are not starters |
| Notification (Snackbar, Toast) | `rp-snackbar` | Built as the dark Toast (reference `313-16706`); the light Snackbar (reference `952-13719`) is not in the kit |
| Progress | `rp-progress-bar` | Percentage built (reference `5893-3490`); Steps missing |
| Process | `rp-stepper` | Follows the product Stepper, not the library drawing (reference `182-1290`) |
| Calendar | date popover (top bar) | DateRange built (reference `247-9457`); the month grid is missing |
| Dividers, Styles, Layout | `rp-divider`, tokens | Built; tokens from the product theme and the library styles |
| Show/Hide, Translation, Playground, Getting Started | | Not components |

## 4. Next steps, in order of use

1. Write the pixel checks for the built components that already have a reference PNG (tiles, dialog, drawer, accordion, toggle buttons, page header, popover, toast, date popover).
2. Port the 4 mockup-kit table sheets to HTML and check them against their Figma references.
3. Add the missing pieces when a mockup needs them: the month grid, Progress Steps, the light Snackbar.
4. When branding sends its list, record it in `v2/README.md` § Branding requests and map each request to a V2 rule.
