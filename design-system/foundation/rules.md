# Reviewpro Mockup Rules

Read before writing any HTML. Non-negotiable.

## Absolute rules
| # | Rule |
|---|------|
| 1 | **Compose only from DS classes** (`shared.css`, listed in `rp-map.json`). The only CSS a page writes is layout (grid / flex containers, gap, widths) with tokens: `var(--spacing-2)`, `var(--neutral-10)`. |
| 2 | **Never emoji, never inline SVG icons, never icon libraries.** Icons are `<span class="rp-icon rp-icon-{name}"></span>` from `icons-full-reference.md`. Charts are the only inline SVG. |
| 3 | **Every page has the app shell** (top bar, side bar, section panel, content) from the starters, unchanged except the active section, the rail icons, panel items, breadcrumbs and title. The section panel is closed when the page loads. |
| 4 | **Content lives in tiles.** Never put text, tables or fields directly on the grey `--background-default` canvas. The breadcrumbs, the page title and the page toolbar are the only things on the canvas. |
| 5 | **Tables have horizontal lines only**, headers in sentence case, never uppercase. |
| 6 | **Status is never colour alone**: a chip with text, or an icon + text. |
| 7 | **No native `<select>`**: use `rp-select`. Native checkboxes and radios are fine with `rp-checkbox` / `rp-radio`. |
| 8 | **Every interactive element works**: menus open, kebab actions do something (dialog, drawer, snackbar or navigation), filters filter, pagination pages, save validates. |
| 9 | **Icon-only buttons have `aria-label`**; actions are `<button>`, navigation is `<a href>`. |
| 10 | **No raw hex colours and no invented z-index** in pages: tokens and the ladder in the skill. |
| 11 | **No state switchers or demo toolbars.** Empty, error and loading states appear through a real interaction. The only exception is the Current UI / Modernised switch that `make-v2.py` adds. |
| 12 | **Realistic hospitality data**: 8–12 rows, the standard sample data below. People come from The Metamorphosis (Gregor Samsa is the signed-in user) and filler text is The Metamorphosis, never "Item 1" or lorem ipsum. |
| 13 | **Sizes inside containers are small**: buttons, fields, chips in tiles, toolbars, tables, dialogs and drawers use the `-size-small` variants (40px / 24px chips). |
| 14 | **One main button per area** (tile, dialog, drawer), on the right, after Cancel. |
| 15 | **One primary page action.** Page header actions are ghost buttons: the main one primary (`rp-ghost-button`, e.g. Download report on a dashboard), the others secondary (`rp-ghost-button rp-ghost-button-inherit` inside a `rp-text-secondary` group). Never turn the primary one grey. |
| 16 | **Two top bars.** Establishment view (a property or a group is selected) = `rp-top-bar`, RPP70 blue. Account view (no property: settings, profile, account-level pages; Figma TopNav Corporate) = `rp-top-bar rp-top-bar-corporate`, DRPP100 midnight, with the user or account name instead of the selectors. A QA screenshot is green: build blue. |
| 17 | **The page header is the PageHeader.** Dashboards and product pages: `rp-page-header` (the h1 title and the page actions in one row), then the divider (`rp-page-header-divider`) and 24px to the filters. Leave the divider out only when nothing follows the header (`data-rp-hide-divider`, like `hideDivider`). |
| 18 | **Product messages use the product component.** An AI notice is the Disclaimer (`rp-disclaimer`), a page message is an Alert, a confirmation is a Snackbar. Never invent a banner or an alert that the product does not show. |
| 19 | **Fields keep the library look**: outlined, no fill, the label cuts the outline on the colour of the surface around it (`--rp-surface`). Never give a field a background to make it stand out. |
| 20 | **Value columns sort.** In index and analysis tables every column of names, text, numbers or dates has a sort button (`rp-table-sort`), so clicking any header sorts. Columns of controls, icons, actions or free lists (concepts, recipients) don't, and neither does a column whose header holds a search or a filter (Zeroheight · Inline filtering: never sort a filterable column). When the table copies a Figma case, keep the case's columns. |
| 21 | **No tile title that only repeats the page.** A tile that holds the page's main list has no title when the title would only repeat the page title and carries no action or tab (the product's Reviews Tracking and Mentions lists): leave `rp-tile-title` out and name the section with `aria-label`. Never add a subtitle that explains the UI ("Expand a review to…", "Click a row to…"): the UI shows that. A subtitle that describes the content stays. |
| 22 | **Open rows are separate accordions.** An expanded detail row is `tr.rp-table-expandable-row`, so the kit leaves 16px under it: two open rows never run into each other. Don't remove that gap or put the detail in the parent row. |
| 23 | **The toggle is the library toggle.** Concepts / Topics style switches are `rp-toggle-button-group` (Figma Toggle Button_New): small (`rp-toggle-button-group-size-small`) in toolbars, tiles and tables. Never build one from buttons, chips or tabs. |
| 24 | **The AI disclaimer sits right under the top bar.** `rp-disclaimer rp-disclaimer-compact` is the first child of `rp-content`, before the content wrapper: edge to edge, no space above or at the sides. Never put it inside the wrapper, the page header or a tile. |
| 25 | **Search and filter in the header, not above it.** When a search or a filter applies to one column (Simple construction), it lives in that column's header: `rp-table-head-search` (the label with a magnifier in the actions slot; a click anywhere in the cell opens an inline search that looks only in that column) or `rp-table-head-filter`. Never a toolbar of fields that repeats the column names. A toolbar holds what applies to the whole table: a search across columns, the filters drawer, views, Sort by. |
| 26 | **A row opens through its name.** When a row leads to a page or a drawer, its name (the first column) is the link: `rp-link`, blue semibold; `<a href>` for a page, `data-rp-open` for a drawer. Never a whole-row click with a decorative chevron at the end. A chevron button only where the Figma case draws one (Operations, Complex: the user list). Expand rows (`rp-table-expand`) are the exception: their whole row toggles. |

## Standard sample data
| Field | Value |
|---|---|
| Hotel | Grand Marina Resort &amp; Spa (Barcelona) |
| Group | Coastal Hotels Group |
| Establishments | Grand Marina Resort &amp; Spa, Azure Bay Hotel, Seaside Palace, Harbor View Suites, Cliff Edge Resort |
| Competitors | Riviera Grand Hotel, Sunset Beach Resort, Palm Court Hotel, Competition Average |
| People | **The Metamorphosis** (Kafka) is the cast. **Gregor Samsa** is the signed-in user, General Manager: initials GS, gregor.samsa@coastalhotels.com. Grete Samsa (Front Office, staff), Anna (Housekeeping; the family's maid). Reviewers and guests: Mr Samsa, Mrs Samsa, the three lodgers ("the three gentlemen"), the chief clerk, the charwoman, the cook, the doctor, the locksmith, a cashier from a hat shop, a chambermaid from a provincial hotel. Longer lists (10+ users) keep the cast first; names copied from a Figma frame stay as in the frame |
| Filler text | The Metamorphosis instead of lorem ipsum, quoted from David Wyllie's translation (Project Gutenberg #5200): "One morning, when Gregor Samsa woke from troubled dreams, he found himself transformed in his bed into a horrible vermin." · "His room, a proper human room although a little too small, lay peacefully between its four familiar walls." · "Drops of rain could be heard hitting the pane, which made him feel quite sad." · "“Where is our breakfast?”, the middle gentleman asked the cleaner irritably." · "I give immediate notice on my room." · "They had the tram, filled with warm sunshine, all to themselves." Review and mention texts use such lines when they carry a hotel concept (room, breakfast, beds, rain on the window); never real reviews from a screenshot. Data a pattern needs (hotels, sources, scores, dates) stays hospitality |
| Departments | Service, Cleanliness, Location, Value, Room, F&amp;B |
| Sources | Google, Booking.com, Tripadvisor, Expedia, Hotels.com, Trip.com (real system values) |
| Scores | GRI™ 85–95%, NPS 40–70, rating 3.5–4.5 / 5, response rate 60–95% |
| Dates | DD/MM/YYYY, ranges "1 Jan 2026 - 31 Mar 2026" |

Never copy real customer or reviewer names from screenshots into a mockup: use the cast above.

## Copying a screenshot
- **QA screenshots have a green top bar.** Green marks the QA environment; the product is blue. Always build the blue production bar (plain `rp-top-bar`, brand RPP70 `#014CB7`) and never add `rp-top-bar-qa`, unless the designer asks to show the QA environment. The checker warns when a page uses it.
- Everything else in a QA screenshot is the product: copy it. Before writing its text, ask whether to keep the copy in the app or improve it (§ Writing, When these rules apply).
- **Rail icons:** the side bar shows only the sections the account has. Keep exactly the icons the screenshot shows, in its order, plus any dot (`rp-badge rp-badge-dot` around the icon) and the Knowledge Hub button at the bottom when the screenshot has it (see `components/rp-app-shell.md`).
- **Top bar:** keep the production top bar of the starter (bell with count, help, app launcher, initials). Change only the establishment, the dates and the count to what the screenshot shows.
- If the screenshot shows the section panel open, open it in the page with `open` on `rp-side-bar-panel`; otherwise leave it closed.

## Writing
British English: behaviour, colour, organisation, customise, cancelled. The product is **Reviewpro**, lowercase p (Reviewpro Reputation); code and file names keep their spelling (`@reviewpro/ui-components`). Other product names keep theirs (Revenue Optimizer). Contractions are fine in descriptions, not in buttons.

**When these rules apply**

- New mockups and V2 copies: always.
- Recreating a screen that already exists (a screenshot, or a Figma frame of a live screen): ask the designer first whether to keep the copy in the app or improve it with these rules. Never decide alone.

These rules combine the kit's own rules with the UX writing rules of the Daylight kit. Where the two disagree, the Reviewpro rule stays: sentence case for buttons, labels and chips; contractions in descriptions; example values as placeholders, never "Fill"; a question as the title of a confirmation; email, never E-mail.

**Principles**

1. Don't blame the user. Say what is needed and how to fix it: "Threshold must be between 1 and 5", not "You entered an invalid threshold".
2. Lead with the action and be clear. A label says what happens: "Download report", not "Continue" or "OK".
3. Professional and plain, neither stiff nor chatty. No jokes, slang or exclamation marks.
4. Match the tone to the situation. For danger or something that can't be undone, state the object and the consequence once, calmly: "This deletes 12 replies. You can't undo this." No "Warning!", capitals or exclamation marks; the danger button carries the weight.
5. Simple, intuitive, short. Cut every word that doesn't help the user act.
6. One action, one word, everywhere: the verb from `ux-glossary.md`, the same from the button to the dialog to the snackbar.
7. Add helper text or a tooltip with specifics whenever a field, a setting or a number needs explaining: the format, the limit, what happens next, where a number comes from.
8. Reviewpro ships in many languages. Check that the German and Finnish versions would fit: in translation, a label of up to 10 characters can end up 2–3 times as long, and text over 70 characters about 1.3 times (W3C, from IBM's figures). If the translation wouldn't fit, shorten the English.
9. Avoid the ellipsis (…). Use it only when it means something, like an action in progress ("Saving…"). Buttons, navigation, tabs, titles and primary actions never use it and never truncate: write them to fit. Truncation is for user content only (names, review text, file names), with the full text in a tooltip (`rp-table-truncate` + `data-rp-tooltip`).
10. The copy fits the component; the component doesn't change for the copy. Don't widen a button or grow a tile for one long text: reword it. Exception: display areas made to show content, such as a hero title or a full review.
11. One word per thing: the nouns in `ux-glossary.md` § Nouns. Never swap synonyms (establishment, never hotel or property).
12. Key words first. People read the first two or three words: "Export reviews to Excel", not "Use this option to export your reviews".
13. A disabled control says why, in a tooltip: "Only admins can export reviews". Put `data-rp-tooltip` on a `<span>` around the control, because a disabled button doesn't react to hover. Never leave a grey button unexplained.
14. A switch or a checkbox says what "on" does, with no negatives: "Email me new reviews", not "Don't send review emails".
15. Never build a sentence from pieces. Write each message as one full string with its number ("12 reviews deleted"), with real plurals ("1 review", never "review(s)") and numerals for numbers. Pieces break German and Finnish word order.
16. No words that talk down or pad: "simply", "just" and "easily" as softeners, "please".
17. A link says where it goes: "View all reviews", not "Click here" or a bare "Learn more". Never point by position or colour ("the button above", "the green button").
18. AI text is labelled, with the Disclaimer (`rp-disclaimer`, absolute rule 18): "Generated with AI. Check it before you send it." The product never speaks as "I".

**Case**

| Text | Case | Example |
|------|------|---------|
| Page, tile, dialog and drawer titles, navigation items, tabs | Title Case | Manage Users, New Alert |
| Buttons, menu items | Sentence case, verb + noun | New user, Download report, Cancel |
| Field labels, table headers, chips | Sentence case | First name, Last login, Invitation sent |
| Helper, error, alert, empty state, snackbar, tooltip, placeholder | Sentence case | Email is required |

**Actions**

Take the verb from `ux-glossary.md` (buttons, menu items, links). It separates look-alikes such as New / Add / Create, Remove / Delete and Reset / Clear / Undo.

| Text | Pattern | Example |
|------|---------|---------|
| Main action of a list page | New + object, never a bare Create | New alert |
| Main button of a form or dialog | The specific verb, 1–2 words | Save, Update, Send survey |
| Destructive button | Verb + object, danger variant | Delete user |
| Menu item | A bare verb, or verb + object | Edit, Delete, Download report |
| Wizard | Back and Next; the button of the last step names the action. Never Continue or Previous | Next, Send survey |
| Cancel | Always Cancel | Cancel |

The trigger, the dialog title, the main button and the snackbar name the same object: Edit → Edit User → Update → User updated; Delete → Delete this user? → Delete user → User deleted.

**Messages**

| Text | Pattern | Example |
|------|---------|---------|
| Field error | The constraint, what to fix | Threshold must be between 1 and 5 |
| Snackbar, success | Object + past participle | User deleted |
| Snackbar, failure | Failed to + verb + object | Failed to save changes |
| Alert | What happened + what to do, 1–2 sentences | Review source disconnected / Connect Google again to reply to reviews |
| Empty state | What is empty + how to fix it | No users found / Try another name or email, or clear the filters |
| Confirmation dialog | Title: the decision. Main button: the action | Delete this user? / Delete user |

**Placeholders**

| Field | Placeholder |
|-------|-------------|
| Select | Select |
| Search | Search by + what it searches: Search by name or email |
| Date | DD/MM/YYYY |
| Text | An example in the expected format: name@hotel.com, +34 600 000 000 |
| Message box | What to write: Write a reply |

A placeholder never replaces the label. Outside message boxes it never gives an instruction ("Enter your name", "Choose a status").

**Punctuation**

- One sentence: no full stop. Two or more sentences: a full stop after each.
- No colon after a field label. A colon only in label: value pairs and before the content it introduces.
- No & or # in labels and messages. Names and data keep them (Grand Marina Resort &amp; Spa, F&amp;B).

**Words**

- Use: check-in (noun, hyphenated), checkout (noun, one word), cancellation, cancelled, email.
- Never: "Are you sure?", "Do you want to…", "successfully", "Sorry", "Oops", "Something went wrong", "Click here", "please", "simply", "just" and "easily" as softeners, error codes, and OK when a specific verb exists.

## Assets
Every mockup folder has these siblings of its HTML (`new-mockup` copies them from `templates/`): `shared.css`, `rp-icons.css`, `shared.js`, `reviewpro-reputation-logo.svg`, `establishment-logo.png`. Noto Sans is a Google Fonts `<link>` in each page head, before `shared.css`.
