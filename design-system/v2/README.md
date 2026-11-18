# ReviewPro UI V2 · "Day & Night" (design concept)

> **A concept for discussion, owned by the Design team.** V2 is not the UI App library and not a decision to build anything. Use it only if you work in Design, to explore and compare ideas. Product managers and developers build from the Current UI (the library) and read V2 screens as proposals. Every V2 page carries a **Concept** tag in the switch at the bottom.

V2 is a modernised version of the ReviewPro admin app: the Shiji brand colours, softer cards, thicker charts, a dark mode, restrained motion and full accessibility (WCAG 2.2 AA). It is always a separate copy of a finished mockup, so the two versions can be compared screen by screen with the switch at the bottom of the page (Current UI | Modernised, Light | Dark, Alt+Shift+V).

What it would take to build, in parts and with the difficulty of each: [`MODERNISATION-PLAN.md`](MODERNISATION-PLAN.md), and the same content as Confluence wiki markup in `modernisation-plan.confluence.txt` (`python3 .kiro/scripts/md-to-confluence.py` makes it from the Markdown). Both are internal: they stay in the kit repository and on Confluence, never on the public website or in the zip (if you downloaded the kit, read the plan on Confluence). Published page: [UI Modernisation (V2): What It Contains and What It Takes](https://confluence.shijidev.com/pages/viewpage.action?pageId=926010279) (Design space, User experience and interface). Related: [Design Language Analysis: UI App, Daylight and KTW Workshop Proposals](https://confluence.shijidev.com/pages/viewpage.action?pageId=926194529).

## Files

| File | What it is |
|---|---|
| `theme-v2.css` | The kit-wide V2 layer, loaded after `shared.css` and `rp-icons.css`: tokens, components, charts, dark mode, motion (§ 6), accessibility (§ 7) |
| `motion-v2.js` | Loaded after `shared.js`: the charts draw themselves once |
| `.kiro/scripts/make-v2.py` | Makes `<page>-v2.html` next to a page, copies the two files, adds the accessibility markup (skip link, main target, rail button). `--theme-only` refreshes them |
| `.kiro/scripts/check-mockup.py` | Checks the V2 rules a script can check (gradients, pills, Energetic Green, display font, motion, files up to date) |
| `.kiro/scripts/a11y-check.py` | Checks WCAG 2.2 AA in Chrome, in Light and Dark, with real keyboard presses |
| Examples | the component showcase `design-system/examples/index-v2.html`; the Reviews dashboard in V2 is on the website (https://laurapistacho.github.io/reviewpro-mockup-kit/#modernised), not in the download |

## How a V2 page is made (the same steps for every designer)

1. The faithful mockup exists and passes `check-mockup.py` (skill `reviewpro-html-mockup`). V2 never starts from a sketch.
2. `python3 .kiro/scripts/make-v2.py mockups/<slug>` makes the copy. The theme does most of the work.
3. Change the `-v2` page only where a rule below asks for it (a legend for a chart told by colour, a status in words, a small-screen fix). Page-only classes start with `v2-`. Kit-wide ideas go into `theme-v2.css`, never into one page.
4. `python3 .kiro/scripts/check-mockup.py mockups/<slug>` and `python3 .kiro/scripts/a11y-check.py mockups/<slug>`: no errors, in Light and Dark.
5. Review it with Tweak comments. When a comment sets a new rule, write it here (§ The rules, § Review log) and, if a script can check it, in `check-mockup.py`, before the next mockup. A rule that only lives in one page is lost.

## The rules

Hard rules. Every V2 page and every change to `theme-v2.css` follows them. The number is the one to quote in a review.

### Scope

| # | Rule | Source |
|---|---|---|
| V2-1 | **Two versions, never mixed.** The current page stays exactly like the library; V2 lives in the `-v2` copy, `theme-v2.css` and `motion-v2.js`. Nothing of V2 goes into `shared.css`, `shared.js` or a current page (only the switch link). | Design system |
| V2-2 | **Same data, same behaviour, same hierarchy.** Same interactions, same components, one primary action per area. V2 restyles; it changes a layout only to meet a rule below (accessibility, small screens) and says so. The copy follows the Writing rules in `foundation/rules.md`: V2 may reword labels and messages, never the data. | Review 17 Nov; copy 18 Nov |
| V2-3 | **No improvised treatments.** A component without a rule here keeps the library structure with V2 tokens. A new idea goes into the report as a proposal and becomes a rule only after the Design review. | Consistency |
| V2-4 | **A concept, labelled as one.** The switch shows "Concept" on every V2 page; reports and handoffs call V2 a proposal, never "the new library". | Review 17 Nov |

### Colour

| # | Rule | Source |
|---|---|---|
| V2-5 | **No gradients anywhere.** Flat colours and opacity tints only. Logos and the Shiji marks keep their own artwork. | Review 17 Nov |
| V2-6 | **One action colour.** Reviewpro Blue `#0030FF` for buttons, links, the selected tab and the active page (Light); calm periwinkle `#8AA6F2` in Dark. | Brand kit |
| V2-7 | **Energetic Green only for the AI call to action** (Generate Insights) and its quota chip. Never the avatar, the Knowledge Hub, navigation, decoration or a chart. | Review 17 Nov |
| V2-8 | **Tints by opacity.** States and status backgrounds are alpha steps of one colour (`--v2-blue-a08`, `--v2-green-a24`). No new hex values in pages. | Principle |
| V2-9 | **Never colour alone.** Status says it in words or with an icon and text ("On track", chips); charts with more than one colour have a legend with the values. | WCAG 1.4.1 |

### Type, shape and layout

| # | Rule | Source |
|---|---|---|
| V2-10 | **Shiji Day Sans is display only**: the page title and single hero numbers ("super display"). Noto Sans for everything else. Numbers in Aeonik use tabular figures. | DE-2337 option B |
| V2-11 | **Buttons get 10px corners, never pills.** Chips and badges may stay round. | Review 17 Nov |
| V2-12 | **Cards, not boxes**: 16px corners, no border, soft shadow, 24px padding and gaps. A tile with only its title row gets even padding. | Review 17 Nov |
| V2-13 | **The page stays light**: canvas `#F5F8FC` with the same container padding. No darker containers. | Review 17 Nov |
| V2-14 | **The page header keeps its divider**: title row, divider, 24px, then the selectors (PageHeader). | Review 17 Nov (2) |
| V2-15 | **Fields are outlined, with no fill.** The outline keeps 3:1, the label takes the colour of the surface around it, focus is a 2px blue border. | Review 17 Nov (2), WCAG 1.4.11 |

### Navigation

| # | Rule | Source |
|---|---|---|
| V2-16 | **The top bar colour tells the view**, in both themes: establishment view `#014CB7` (Dark `#11439A`), account (corporate) view Midnight `#172554` (Dark `#151D44`). Two clearly different blues; never grey. | Reviews 17 Nov (1, 2) |
| V2-17 | **Side bar**: soft rounded selection, blue icon for the current section; each icon grows a little on hover; "Expand navigation" is also a 32px button at the bottom of the rail. | Review 17 Nov (2), WCAG 2.5.8 |

### Charts and motion

| # | Rule | Source |
|---|---|---|
| V2-18 | **Calm data**: 3px lines with round joins, 13px gauges with round caps, dashed light grid, the chart palette below (3:1 on a card), comparison series as a dashed slate line, filled areas with a 3:1 edge. | Principle, WCAG 1.4.11 |
| V2-19 | **Charts draw themselves once** when they come into view (donuts sweep and count up, lines draw from left to right) and end exactly on the written values. | Review 17 Nov (2) |
| V2-20 | **Restrained motion**: only for feedback (press, hover) and for where things come from (menus, dialogs, drawers). Interface motion under 300ms on ease-out curves, nothing loops, nothing moves with reduced motion or while Tweak is editing. Never `transition: all`. | Review 17 Nov (2) |

### Dark mode and accessibility

| # | Rule | Source |
|---|---|---|
| V2-21 | **Day and night.** Every V2 screen works in Light and Dark. Dark is neutral grey with a calm blue accent and softened status colours; no blue-tinted surfaces. | Review 17 Nov |
| V2-22 | **Accessible by default: WCAG 2.2 AA in both themes**, checked with `a11y-check.py` (no errors before a V2 page is shared). See § Accessibility. | Law and policy |

## Rejected ideas (do not propose again)

| Idea | When | Why |
|---|---|---|
| A darker background and new paddings for the page containers | 17 Nov 2026 | "Container paddings is weird... darker background... doesn't work here" |
| Pill-shaped buttons | 17 Nov 2026 | Corners roundish, never fully round |
| Gradients (app launcher, AI tile, disclaimer) | 17 Nov 2026 | No gradients anywhere |
| Midnight top bar for every view | 17 Nov 2026 | The colour must tell establishment from account view |
| Energetic Green avatar | 17 Nov 2026 | Green is for the AI call to action only |
| A dark (Midnight) AI tile | 17 Nov 2026 | Too heavy; the AI tile is a normal card |
| Shiji Day Sans on tile titles | 17 Nov 2026 | Display only (DE-2337 option B) |
| Blue-tinted night surfaces (`#0B1022`, `#121933`) | 17 Nov 2026 | "Too blue": dark mode is neutral |
| A grey corporate top bar in Dark (`#1C1F2B`) | 17 Nov 2026 | Both bars must read as blue |
| Fields with a white fill on the grey page | 17 Nov 2026 | The label showed as a white patch |
| Energetic Green as a chart colour | 17 Nov 2026 | Rule V2-7, and 1.3:1 on white |

## Review log

| Date | What was asked | What it decided |
|---|---|---|
| 17 Nov 2026 (1) | 7 Tweak comments on the dashboard: container padding, round buttons, Aeonik title, gradients, two kinds of top bar, one primary action, green avatar; dark mode too blue | V2-2, V2-5, V2-7, V2-10, V2-11, V2-12, V2-13, V2-16, V2-21 |
| 17 Nov 2026 (2) | 6 comments: animate the donuts and the index chart, animate the side bar icons, two blues for the dark top bars, keep the page header divider, the label background of the Index select | V2-14, V2-15, V2-16, V2-17, V2-19, V2-20 |
| 17 Nov 2026 (3) | Make the skills consistent for every designer; V2 accessible and compliant, with keyboard navigation; V2 in the Design System website, marked as a concept; a plan for Confluence | V2-1, V2-3, V2-4, V2-9, V2-18, V2-22; `a11y-check.py`; the V2 checks in `check-mockup.py`; `MODERNISATION-PLAN.md` |
| 18 Nov 2026 | Take the KTW workshop decisions (Design Language Analysis page, 4 Nov) into account, and unify the blues | Documented only, nothing applied. The differences (action blue, round buttons, page background, cards without shadow, rectangular labels, blue family) are recorded as decisions M0.1, M0.7 to M0.11 in `MODERNISATION-PLAN.md`. V2 tokens and rules V2-1 to V2-22 stay unchanged |

## Principles

| Principle | In practice |
|---|---|
| One action colour | Reviewpro Blue for actions and the active state |
| Midnight, not black | Text in Midnight `#172554`; greys are tinted with it (slate) |
| Tints by opacity | Alpha steps of one colour instead of new hex values |
| Cards, not boxes | 16px corners, no border, soft shadow, 24px padding and gaps |
| Calm data | Thicker lines, round caps, dashed light grid, an accessible palette |
| Quiet motion | Feedback and orientation only; charts draw once |
| Day and night | Every V2 screen works in Light and Dark |
| For everyone | WCAG 2.2 AA, keyboard first, nothing told by colour alone |

## Typography

From Laura's font analysis (DE-2337, "Shiji Day Sans Aeonik vs Noto Sans", 10 Nov 2026, option B), applied as narrowly as possible:

- **Shiji Day Sans (Aeonik)** only for display text of 20px and up: the page title (28/36 bold) and single hero numbers (KPI values, gauge centres, 500 with tabular figures). In the analysis, login, onboarding and empty states can use it too.
- **Noto Sans** for everything else: tile titles (18/26 semibold), body, tables, forms, navigation, chart labels and all guest content (Aeonik covers Latin only).
- The font loads from the Shiji website CDN and falls back to Noto Sans. The licence for display use in the product is still to be confirmed (open question 1 of the analysis).

## Tokens

Brand colours (Shiji Brand Kit): `--v2-midnight #172554`, `--v2-twilight #1E3A8A`, `--v2-blue #0030FF`, `--v2-blue-3 #3B82F6`, `--v2-meridian #60A5FA`, `--v2-blue-5 #D5ECFF`, `--v2-daylight #E8F5FF`, `--v2-daylight-60 #F1F9FF`, `--v2-daylight-30 #F8FCFF`, `--v2-night #0C1024`, `--v2-green #0AFFAB`, `--v2-alert #DC2626`, `--v2-alert-dark #F87171`, `--v2-sunrise #8D3791`, `--v2-sunset-yellow #FFB851`, `--v2-sunset-orange #FF8056`, `--v2-sunset-purple #7443A7`. Top bar: `--v2-topbar-establishment`, `--v2-topbar-corporate`. Focus: `--v2-focus`.

Opacity ramps: each colour has an RGB triplet (`--v2-blue-rgb`, `--v2-ink-rgb`, `--v2-green-rgb`, `--v2-red-rgb`, `--v2-yellow-rgb`, `--v2-white-rgb`) and named steps:

| Ramp | Steps | Used for |
|---|---|---|
| `--v2-blue-aNN` | 04 08 12 16 24 40 | hover, selected, soft buttons |
| `--v2-ink-aNN` | 04 06 08 12 16 24 40 64 | dividers, hover on neutral, tracks |
| `--v2-green-aNN` | 16 24 | success tints |
| `--v2-red-aNN` | 10 16 | error tints |
| `--v2-yellow-aNN` | 24 40 | warning tints |
| `--v2-white-aNN` | 08 12 20 | controls on the top bar |

Any other step: `rgba(var(--v2-blue-rgb), .32)`. In dark mode the same names hold the night values, so a page rule written with them works in both themes. Tints are backgrounds: text and lines on them use the solid tokens below.

Text and lines (Light, all on white and on the page): text `#172554`, secondary `#5D6887` (5.6:1), hint `#646F8C` (5:1), field outline `--neutral-50 #7A859F` (3.7:1), success text `#007A52`, error text `#B91C1C`, warning text `--yellow-60 #9A5B00`. Data colours with 3:1 on white: green `#00A06B`, orange `#E8652F`, red `#DC2626`.

Chart palette, in order, 3:1 or more on a card in both themes. Light: `--v2-chart-1` Reviewpro Blue `#0030FF`, `-2` `#C2410C` (deep Sunset Orange), `-3` Sunset Purple `#7443A7`, `-4` `#00805A` (green), `-5` Sunrise `#8D3791`, `-6` `#B26A00` (amber), `-7` Twilight `#1E3A8A`, `-8` slate `#5D6887`. Dark: `#8AA6F2`, `#F2A06B`, `#B79BE0`, `#3FCB8E`, `#E39BE6`, `#E4B363`, `#93B4FF`, `#A2A6AE`. Grid `--v2-chart-grid`, gauge track `--v2-chart-track`.

The kit tokens V2 remaps (so every component follows): the blue, neutral, green, red, yellow and orange scales, `--text-*`, `--background-*`, `--divider`, `--radius-*` (6 / 10 / 14 / 20), `--shadow-*`, `--field-glow`, the top bar states.

## What changes, component by component

| Component | Current UI (library) | V2 |
|---|---|---|
| Top bar | RPP70 (establishment), DRPP100 (account) | Same two colours by view, two blues in Dark; badges ringed in the bar colour; white focus ring |
| Avatar | white square, RPP70 initials | white, 8px corners, initials in the bar colour |
| Side bar | grey hover, `#BFD3E3` current | slate hover, blue 8% rounded selection, blue icon, hover growth, Expand navigation button; Knowledge Hub in the action blue |
| Page header | h6 bold title, ghost actions, divider | the same, title in Shiji Day Sans 28/36; actions wrap under the title on small screens (the library hides them) |
| Page title | h4 34/40 medium or h6 bold | 28/36 bold, Shiji Day Sans |
| Tiles | 4px corners, 1px border, 16px padding | 16px corners, no border, soft shadow, 24px padding and gaps |
| Buttons | `#3F7BAB`, 8px corners | Reviewpro Blue, 10px corners, a soft lift on hover, a 3% dip when pressed |
| Focus | browser default or library rings (often under 3:1) | one solid 2px ring, 3:1 or more everywhere, white on dark surfaces |
| Outlined button | 2px grey | 1px ink 16%, white |
| Fields | 1px `#777`, no fill | no fill, 1px `#7A859F` (3:1), 2px blue border and a soft glow on focus |
| Chips | pastel fill + border | alpha tint, no border |
| Alerts | flat bar, 4px marker | 12px corners, rounded 3px marker, alpha tint |
| AI disclaimer | white bar with a shadow | flat paper bar with a hairline |
| Tabs | 2px indicator | 3px rounded indicator |
| Tables | bold grey header | semibold header, row hover tint |
| Menus, dialogs | 4px corners | 12px (menus) and 20px (dialogs) corners, lifted shadow, ease in from their trigger |
| App launcher | gradient image | solid Midnight |
| Charts | 2px lines, 7px gauges, solid grid, colour-only donuts | 3px lines, 13px gauges with round caps, dashed grid, legends with values, accessible palette, draw once |
| Progress and volume bars | 8px square | 10px rounded |
| Loading skeleton | gradient shimmer, endless | flat pulse, three times, then still |
| Small screens | side bar, date range and page actions hidden below 768px | everything stays: 48px rail, calendar button, wrapped actions, one-column grids |

## Motion

The current UI is static. V2 adds a small set of movements, each with a reason, and nothing that loops or plays on every hover of a list. They follow Emil Kowalski's animation guidelines: ease-out curves, interface motion under 300ms, only `transform`, `opacity`, clip and stroke properties, never `transition: all`.

| What | How | Why |
|---|---|---|
| Donut gauges (Summary) | Once, when about a third of the chart is on screen: the segments sweep round in order as one stroke (900ms), the number counts up with the sweep, the change fades in; donuts start 80ms apart, left to right | The numbers arrive instead of sitting there; the eye follows the order |
| Line charts (`svg.kit-chart`, Indexes Evolution) | Once, when on screen: the line draws from left to right (1100ms) and the filled area (review volume) is revealed at the same pace | Reads as a timeline |
| Side bar icons | On hover the icon grows 12% with a small overshoot (280ms); pressed it dips to 92%. The Knowledge Hub square grows 8%. The "new" dot moves with its icon | Feedback without changing the layout |
| Buttons and icon buttons | Pressed: scale 97% (icon buttons 92%), 160ms. Hover shadows ease in; focus rings appear at once | The interface confirms the press |
| Menus, selects, top bar popovers | Fade in from 4px above and 98% (180ms) | They open from their trigger |
| Dialogs and drawers | Backdrop fades (200ms); the dialog grows from 96% (240ms); a drawer slides in from its side (300ms) | Keeps the place and the direction |
| Snackbars | The library's slide-up, on the V2 ease-out; no slide with reduced motion | One family of curves |
| Loading skeletons | A flat pulse three times, then still | No gradients; nothing moves for more than 5 seconds |

Curves (theme-v2.css): `--v2-ease-out` `cubic-bezier(0.23, 1, 0.32, 1)` for interface motion, `--v2-ease-pop` `cubic-bezier(0.34, 1.56, 0.64, 1)` for the side bar hover, `--v2-ease-drawer` `cubic-bezier(0.32, 0.72, 0, 1)` for drawers. Charts use an ease-out cubic, `cubic-bezier(0.33, 1, 0.68, 1)`.

- Nothing moves with the system setting *Reduce motion* (`prefers-reduced-motion`), while Tweak is open or editing, or when printing: the page shows its final state.
- Charts out of view (below the fold, or above it after the version switch kept the scroll) wait until they are on screen. A chart that is already on screen when it first gets near (a tab, a fast scroll) stays still.
- Nothing is saved into the page: `motion-v2.js` animates with the Web Animations API and puts each counted number back exactly as written, so Tweak and the checker see the same markup.
- Not animated on purpose: page load of tiles and text, tables and the small bars in them, tooltips (they appear on every hover), tabs, the side bar panel. Add them only with a reason.
- Screenshots: emulate reduced motion, or call `rpMotionStop()` in the page, to capture final states.

## Accessibility

**Target: WCAG 2.2 level AA, in Light and Dark.** That is the level of EN 301 549 v4.1.1, the European standard for accessible ICT, published on 2 September 2026 and built on WCAG 2.2 ([AccessiWay](https://www.accessiway.com/legal-guidance/en-301-549), [Level Access](https://www.levelaccess.com/compliance-overview/en-301-549-compliance/)). The version cited today in the EU Official Journal, v3.2.1, is built on WCAG 2.1 AA, so meeting 2.2 AA meets both. The European Accessibility Act (Directive (EU) 2019/882, [EUR-Lex](https://eur-lex.europa.eu/eli/dir/2019/882/oj)) applies since 28 June 2025 to a closed list of consumer services; whether it covers the ReviewPro admin app, and which customer contracts or tenders ask for EN 301 549, is for Legal to confirm `[TBD — Requires Input]`. V2 does not wait for that answer: it meets the standard either way. Criteria: [WCAG 2.2](https://www.w3.org/TR/WCAG22/).

What V2 guarantees, and where:

| Criterion | What V2 does | Where |
|---|---|---|
| 1.4.3 Contrast (text) | Every text 4.5:1 (large 3:1) on its surface in both themes, placeholders and helper text included | theme tokens, § 3 and § 7 |
| 1.4.11 Non-text contrast | Field outlines, checkbox and radio glyphs, switches, icon-only controls, focus rings and chart marks 3:1 | theme § 3, § 4, § 7 |
| 1.4.1 Use of colour | Charts with several colours have legends with values; goals say "On track" / "Off track"; status chips have text | page markup, rule V2-9 |
| 2.1.1, 2.1.2, 2.4.3 Keyboard | Every control reachable with Tab in a logical order; selects, menus, popovers, dialogs, drawers, tabs and the side bar work with Enter, Space, arrows and Escape, and give focus back; dialogs keep focus inside | `shared.js` (both versions) |
| 2.4.1 Bypass blocks | "Skip to main content" is the first Tab stop and moves focus to the content | `make-v2.py`, theme § 7 |
| 2.4.7, 2.4.11 Focus visible, not hidden | One solid 2px ring on every control; the page scrolls a focused control clear of the top bar and the bottom switch | theme § 7 (`scroll-padding`) |
| 2.5.8 Target size | Targets 24px or more; the 8px rail edge has a 32px Expand navigation button | `make-v2.py`, theme § 7 |
| 1.4.10 Reflow, 1.4.4 Resize text | Works at 320 CSS px (400% zoom): nothing hidden, rows wrap, grids go to one column, tables scroll inside their tile | theme § 7 |
| 1.4.13 Content on hover or focus | Tooltips show on focus too, stay while the focus scrolls, and Escape closes them | `shared.js` |
| 2.2.2, 2.3.3 Motion | Nothing loops for more than 5 seconds; nothing moves with reduced motion | theme § 6, `motion-v2.js` |
| 4.1.2, 4.1.3 Name, role, value; status messages | Every control has a name; required fields say so; snackbars are announced (`role="status"`) | `shared.js`, markup |
| Windows high contrast | Focus rings are outlines; field borders and selections stay visible | theme § 7 |

How it is checked: `python3 .kiro/scripts/a11y-check.py mockups/<slug>` loads each page in Chrome, walks it with real Tab presses (every stop must show a 3:1 focus ring and stay visible), drives each component with the keyboard, measures every text and control against the colour behind it, tests reduced motion, 200% and 400% zoom and wider text spacing, in Light and Dark. A V2 page is shared only with **no errors**. Warnings are a look-at list. On Current UI pages the same check lists the library's own issues as `library` warnings: they are the product backlog in `MODERNISATION-PLAN.md` § Accessibility, not fixed in the faithful mockup.

Accepted exceptions: the loading spinner keeps turning while something loads (essential); the version switch and the Tweak editor are kit tools, not product; data tables and charts scroll sideways inside their tile at 320px (WCAG allows two-dimensional content).

What a mockup cannot prove, and the product build must still do: screen reader passes (NVDA with Chrome, VoiceOver with Safari) on the real React components; announcements for content that updates on its own; error messages tied to their fields; accessible PDF and Excel reports; a data table behind each chart; and testing with people who use assistive technology.

## Dark mode

Set by the switch (Light | Dark, saved in the browser) as `html[data-rp-theme="dark"]` on V2 pages. Neutral, not blue:

| Part | Value |
|---|---|
| Page, card, raised (menus, dialogs) | `#0F1012`, `#17181B`, `#1E2024`: elevation by lighter surfaces and a 1px light outline, not by shadows |
| Side bar and panel | `#141518` |
| Text | `#ECEDEF`, secondary `#A2A6AE` (7:1 on cards), hint `#8A8F99` (5:1) |
| Accent | calm periwinkle `#8AA6F2` for links, the active page, selections, chart lines and the focus ring; muted blue `#3D6AD6` for filled buttons (white text 5:1) |
| Status | softened: green `#3FCB8E`, red `#F07878`, yellow `#E4B363`; filled danger buttons and badges use a deeper red `#C93C3C` so white text keeps 4.5:1 |
| Top bar | establishment `#11439A`, account `#151D44`: two blues, one step darker than in Day (white text 9:1 and 16:1) |
| Energetic Green | unchanged, still only on the AI call to action; the AI chip is a dark mint tint |

Logos with dark ink are inverted; the establishment logo keeps a white tile.

## Branding requests

Not received yet. When the list arrives, add it here as a table (request, V2 rule that answers it, status) and point each V2 change at the request it answers.

## Open questions

- Is Reviewpro Blue `#0030FF` the action colour for the product, or only for marketing? V2 assumes the product (Light).
- **Unify the blues** (a task Laura plans soon). Today there are two families. The library: steel blue `--blue-main #3F7BAB` (and its 05-90 scale) for buttons and selections, and RPP70 `#014CB7` for the top bar, rail icons and focus. The brand: Reviewpro Blue `#0030FF` (already in the library tokens as `--brand-rpp`). V2 already moves every action, link, selection and focus to `#0030FF` and its tints; the only old blue left is the establishment top bar (`#014CB7`, Dark `#11439A`), kept on purpose by rule V2-16. Unifying means choosing that bar's blue too; when it is decided, change `--v2-topbar-establishment` in `theme-v2.css` (Light and Dark) and rule V2-16, nothing else.
- The Shiji Day Sans licence for display use inside the product (DE-2337 open question 1).
- Knowledge Hub in the action blue instead of green: confirm.
- Success green: the brand kit has Energetic Green only; V2 derives darker greens (`#00A06B` data, `#007A52` text).
- Legal scope: does the European Accessibility Act, or a customer contract, require EN 301 549 for the admin app? `[TBD — Requires Input]`
