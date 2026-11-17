# ReviewPro UI V2 · "Day & Night" (proposal)

V2 is a proposal for a modernised ReviewPro UI. It is not the UI App library. Mockups are always built first exactly like the library (skill `reviewpro-html-mockup`); V2 is a separate copy of the pages made on request (skill `reviewpro-ui-modernise`), so the two can be compared with the switch at the bottom of the page.

- `theme-v2.css`: the kit-wide V2 layer, loaded after `shared.css` and `rp-icons.css`. It remaps the kit tokens, refines the components, thickens the charts and adds the dark mode.
- `.kiro/scripts/make-v2.py <mockup folder>`: makes `<page>-v2.html` next to every page and copies `theme-v2.css` into the folder (`--theme-only` refreshes the copy).
- Example: `mockups/reviews-dashboard/index.html` and `index-v2.html`.

## Rules from Laura's review (17 Nov 2026)

These are hard rules. Every V2 page and every change to `theme-v2.css` follows them.

| Rule | In practice |
|---|---|
| No gradients anywhere in the UI | Flat colours and opacity tints only. The app launcher is solid Midnight in V2. Logos and the Shiji marks keep their own artwork. |
| Buttons are rounded, never pills | Buttons use `--radius-s` (10px). Chips and badges may stay round; buttons never. |
| The button hierarchy never changes | One primary action per area. The page's main action (Download report on a dashboard) stays a primary ghost button; the others stay secondary. V2 restyles, it does not demote. |
| The top bar colour tells the view | Establishment view (a property or group is selected) = the product blue `#014CB7`. Account (corporate) view = Midnight `#172554`. Dark mode: `#1F3A70` and `#1C1F2B`. |
| Energetic Green is for the AI call to action only | Generate Insights and the AI quota chip. Never the avatar, the Knowledge Hub, navigation or decoration. |
| Shiji Day Sans is display only | See Typography. |
| Even padding in a title-only tile | A tile whose only content is its title row gets 20px above and below (the AI tile). |

## Principles

| Principle | In practice |
|---|---|
| One action colour | Reviewpro Blue `#0030FF` for buttons, links, the selected tab and the active page (light theme). |
| Midnight, not black | Text in Midnight `#172554`; greys are tinted with it (slate). |
| Tints by opacity | States and status backgrounds are alpha steps of one colour (`--v2-blue-a08`, `--v2-green-a24`), not new hex values. |
| Cards, not boxes | 16px corners, no border, soft shadow, 24px padding and gaps. |
| Calm data | Thicker lines (3px), round caps, dashed light grid, brand chart palette; gauges 13px. |
| Day and night | Every V2 screen works in Light and Dark. |

## Typography

From Laura's font analysis (DE-2337, "Shiji Day Sans Aeonik vs Noto Sans", 10 Nov 2026, option B), applied as narrowly as possible:

- **Shiji Day Sans (Aeonik)** only for display text of 20px and up: the page title (28/36 bold) and single hero numbers (KPI values, gauge centres, 500 with tabular figures). In the analysis, login, onboarding and empty states can use it too.
- **Noto Sans** for everything else: tile titles (18/26 semibold), body, tables, forms, navigation, chart labels and all guest content (Aeonik covers Latin only).
- Numbers in Aeonik always use `font-variant-numeric: tabular-nums`.
- The font loads from the Shiji website CDN and falls back to Noto Sans. The licence for display use in the product is still to be confirmed (open question 1 of the analysis).

## Tokens

Brand colours (Shiji Brand Kit): `--v2-midnight #172554`, `--v2-twilight #1E3A8A`, `--v2-blue #0030FF`, `--v2-blue-3 #3B82F6`, `--v2-meridian #60A5FA`, `--v2-blue-5 #D5ECFF`, `--v2-daylight #E8F5FF`, `--v2-daylight-60 #F1F9FF`, `--v2-daylight-30 #F8FCFF`, `--v2-night #0C1024`, `--v2-green #0AFFAB`, `--v2-alert #DC2626`, `--v2-alert-dark #F87171`, `--v2-sunrise #8D3791`, `--v2-sunset-yellow #FFB851`, `--v2-sunset-orange #FF8056`, `--v2-sunset-purple #7443A7`. Top bar: `--v2-topbar-establishment`, `--v2-topbar-corporate`.

Opacity ramps: each colour has an RGB triplet (`--v2-blue-rgb`, `--v2-ink-rgb`, `--v2-green-rgb`, `--v2-red-rgb`, `--v2-yellow-rgb`, `--v2-white-rgb`) and named steps:

| Ramp | Steps | Used for |
|---|---|---|
| `--v2-blue-aNN` | 04 08 12 16 24 40 | hover, selected, focus ring, soft buttons |
| `--v2-ink-aNN` | 04 06 08 12 16 24 40 64 | dividers, borders, hover on neutral, tracks |
| `--v2-green-aNN` | 16 24 | success tints |
| `--v2-red-aNN` | 10 16 | error tints |
| `--v2-yellow-aNN` | 24 40 | warning tints |
| `--v2-white-aNN` | 08 12 20 | controls on the top bar |

Any other step: `rgba(var(--v2-blue-rgb), .32)`. In dark mode the same names hold the night values, so a page rule written with them works in both themes.

Chart palette, in order: `--v2-chart-1` Reviewpro Blue, `-2` Meridian, `-3` Energetic Green, `-4` Sunset Purple, `-5` Sunset Orange, `-6` Sunset Yellow, `-7` Sunrise, `-8` Twilight. Grid `--v2-chart-grid`, gauge track `--v2-chart-track`.

The kit tokens V2 remaps (so every component follows): the blue, neutral, green, red, yellow and orange scales, `--text-*`, `--background-*`, `--divider`, `--radius-*` (6 / 10 / 14 / 20), `--shadow-*`, `--field-glow`, the top bar states.

## What changes, component by component

| Component | Current UI (library) | V2 |
|---|---|---|
| Top bar | RPP70 (establishment), DRPP100 (account) | Same two colours by view; badges ringed in the bar colour |
| Avatar | white square, RPP70 initials | white, 8px corners, initials in the bar colour |
| Side bar | grey hover, `#BFD3E3` current | slate hover, blue 8% rounded selection, blue icon; Knowledge Hub in the action blue |
| Page title | h4 34/40 medium or h6 bold | 28/36 bold, Shiji Day Sans |
| Tiles | 4px corners, 1px border, 16px padding | 16px corners, no border, soft shadow, 24px padding and gaps |
| Buttons | `#3F7BAB`, 8px corners | Reviewpro Blue, 10px corners, a soft lift on hover, 4px focus ring |
| Outlined button | 2px grey | 1px ink 16%, white |
| Fields | 1px `#777`, no fill | paper fill, 1px ink 16%, blue border + 4px ring on focus |
| Chips | pastel fill + border | alpha tint, no border |
| Alerts | flat bar, 4px marker | 12px corners, rounded 3px marker, alpha tint |
| AI disclaimer | white bar with a shadow | flat paper bar with a hairline |
| Tabs | 2px indicator | 3px rounded indicator |
| Tables | bold grey header | semibold header, row hover tint |
| Menus, dialogs | 4px corners | 12px (menus) and 20px (dialogs) corners, lifted shadow |
| App launcher | gradient image | solid Midnight |
| Charts | 2px lines, 7px gauges, solid grid | 3px lines, 13px gauges with round caps, dashed grid |
| Progress and volume bars | 8px square | 10px rounded |

## Dark mode

Set by the switch (Light | Dark, saved in the browser) as `html[data-rp-theme="dark"]` on V2 pages. Neutral, not blue:

| Part | Value |
|---|---|
| Page, card, raised (menus, dialogs) | `#0F1012`, `#17181B`, `#1E2024`: elevation by lighter surfaces and a 1px light outline, not by shadows |
| Side bar and panel | `#141518` |
| Text | `#ECEDEF`, secondary `#A2A6AE` (7:1 on cards), hint `#7B808A` |
| Accent | calm periwinkle `#8AA6F2` for links, the active page, selections and chart lines; muted blue `#3D6AD6` for filled buttons (white text 5:1) |
| Status | softened: green `#3FCB8E`, red `#F07878`, yellow `#E4B363` |
| Top bar | establishment `#1F3A70`, account `#1C1F2B` |
| Energetic Green | unchanged, still only on the AI call to action; the AI chip is a dark mint tint |

Logos with dark ink are inverted; the establishment logo keeps a white tile.

## Branding requests

Not received yet. When the list arrives, add it here as a table (request, V2 rule that answers it, status) and point each V2 change at the request it answers.

## Open questions

- Is Reviewpro Blue `#0030FF` the action colour for the product, or only for marketing? V2 assumes the product (light theme).
- The Shiji Day Sans licence for display use inside the product (DE-2337 open question 1).
- Success green: the brand kit has Energetic Green only; V2 derives a darker green (`#007A52`) for text on light backgrounds.
