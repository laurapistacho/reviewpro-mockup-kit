# ReviewPro Mockup Rules

Read before writing any HTML. Non-negotiable.

## Absolute rules
| # | Rule |
|---|------|
| 1 | **Compose only from DS classes** (`shared.css`, listed in `rp-map.json`). The only CSS a page writes is layout (grid / flex containers, gap, widths) with tokens: `var(--spacing-2)`, `var(--neutral-10)`. |
| 2 | **Never emoji, never inline SVG icons, never icon libraries.** Icons are `<span class="rp-icon rp-icon-{name}"></span>` from `icons-full-reference.md`. Charts are the only inline SVG. |
| 3 | **Every page has the app shell** (top bar, side bar, section panel, content) from the starters, unchanged except the active section, the rail icons, panel items, breadcrumbs and title. The section panel is closed when the page loads. |
| 4 | **Content lives in tiles.** Never put text, tables or fields directly on the grey `--background-default` canvas. The breadcrumbs, the page title and the page toolbar are the only things on the canvas. |
| 5 | **Tables have horizontal lines only**, headers in sentence case, never uppercase. |
| 6 | **Status is never color alone**: a chip with text, or an icon + text. |
| 7 | **No native `<select>`**: use `rp-select`. Native checkboxes and radios are fine with `rp-checkbox` / `rp-radio`. |
| 8 | **Every interactive element works**: menus open, kebab actions do something (dialog, drawer, snackbar or navigation), filters filter, pagination pages, save validates. |
| 9 | **Icon-only buttons have `aria-label`**; actions are `<button>`, navigation is `<a href>`. |
| 10 | **No raw hex colors and no invented z-index** in pages: tokens and the ladder in the skill. |
| 11 | **No state switchers or demo toolbars.** Empty, error and loading states appear through a real interaction. |
| 12 | **Realistic hospitality data**: 8–12 rows, the standard placeholder names below. Never "Item 1" or lorem ipsum. |
| 13 | **Sizes inside containers are small**: buttons, fields, chips in tiles, toolbars, tables, dialogs and drawers use the `-size-small` variants (40px / 24px chips). |
| 14 | **One main button per area** (tile, dialog, drawer), on the right, after Cancel. |

## Standard sample data
| Field | Value |
|---|---|
| Hotel | Grand Marina Resort &amp; Spa (Barcelona) |
| Group | Coastal Hotels Group |
| Establishments | Grand Marina Resort &amp; Spa, Azure Bay Hotel, Seaside Palace, Harbor View Suites, Cliff Edge Resort |
| Competitors | Riviera Grand Hotel, Sunset Beach Resort, Palm Court Hotel, Competition Average |
| People | Alex Rivera (General Manager), Sam Torres (staff), Jordan M. (reviewer) |
| Departments | Service, Cleanliness, Location, Value, Room, F&amp;B |
| Sources | Google, Booking.com, Tripadvisor, Expedia, Hotels.com, Trip.com (real system values) |
| Scores | GRI™ 85–95%, NPS 40–70, rating 3.5–4.5 / 5, response rate 60–95% |
| Dates | DD/MM/YYYY, ranges "1 Jan 2026 - 31 Mar 2026" |

Never copy real customer names from screenshots into a mockup.

## Copying a screenshot
- **QA screenshots have a green top bar.** Green marks the QA environment; the product is blue. Always build the blue production bar (plain `rp-top-bar`, brand RPP70 `#014CB7`) and never add `rp-top-bar-qa`, unless the designer asks to show the QA environment. The checker warns when a page uses it.
- Everything else in a QA screenshot is the product: copy it.
- **Rail icons:** the side bar shows only the sections the account has. Keep exactly the icons the screenshot shows, in its order, plus any dot (`rp-badge rp-badge-dot` around the icon) and the items pinned to the bottom (see `components/rp-app-shell.md`).
- If the screenshot shows the section panel open, open it in the page with `open` on `rp-side-bar-panel`; otherwise leave it closed.

## Writing
American English. Contractions are fine in descriptions, not in buttons.

| Text | Case | Example |
|------|------|---------|
| Page, tile, dialog and drawer titles, navigation items, tabs | Title Case | Manage Users, Create Alert |
| Buttons, menu items | Sentence case, verb + noun | Add user, Download report, Cancel |
| Field labels, table headers, chips | Sentence case | First name, Last login, Invitation sent |
| Helper, error, alert, empty state, snackbar, tooltip | Sentence case | Email is required |

- Error messages: one sentence, no period, what to fix ("Threshold must be between 1 and 5").
- Snackbar: object + past participle ("User deleted"); failures "Failed to save changes". Never "successfully".
- Confirmation dialog title: the decision ("Delete this user?"); main button: the action ("Delete user"). Never "Are you sure?" or "OK".
- Empty state: what is empty + how to fix it ("No users found" / "Try another name or email, or clear the filters").
- Never "Something went wrong", "Oops", error codes or "Click here".

## Assets
Every mockup folder has these siblings of its HTML (`new-mockup` copies them from `templates/`): `shared.css`, `rp-icons.css`, `shared.js`, `reviewpro-reputation-logo.svg`, `establishment-logo.png`. Noto Sans is a Google Fonts `<link>` in each page head, before `shared.css`.
