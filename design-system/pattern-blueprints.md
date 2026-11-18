# Pattern Blueprints

Rules per starter. Every pattern also follows `foundation/rules.md`.

## Pattern 0: Blank page
Shell + breadcrumbs + page title + a `kit-stack` of tiles. Use it when nothing else fits, then compose from tiles (decision tree § Composition).

## Pattern 1: Settings list (`01-settings-list.html`)
- Tile title "Manage {Entities}" with the main action ("Add {entity}") in `rp-tile-title-actions`.
- `rp-toolbar`: search (280px) + 1–3 selects on the left, ghost buttons (Filters → drawer, Export) on the right. All `-size-small`.
- `rp-toolbar-bulk` follows the toolbar and shows below it while rows are selected (the toolbar stays).
- Table: checkbox column, a person or name column with a two-line header when useful, numbers right aligned, status chip, row switch when the item can be turned on and off, kebab last.
- Empty state (`data-rp-empty-for`) with "Clear filters"; pagination with rows per page 5 / 10 / 25.
- Add / edit in a right drawer (`rp-drawer-width-medium`), delete in an xs dialog.

## Pattern 2: Settings hub (`02-settings-hub.html`)
The new Settings page (ui-settings-app `AccountSettingsNext`, in production):
- Account-view top bar (`rp-top-bar-corporate`, DRPP100) with the user name; the Settings rail item is current. Its panel (closed on load, Figma SideNav Settings) lists All Settings, a divider, then the sections, each linking to `02-settings-hub.html#<section>` (`#organisation` opens that section).
- `rp-content kit-settings-hub` with `data-rp-settings`: a 230px `kit-settings-nav` (Settings heading, All Settings, divider, one item per section, ReviewPro logo) and a white `kit-settings-content`.
- A full-width `rp-search` with `data-rp-settings-search`, a divider, then one `kit-settings-section` per area: icon + h6 title, then a `kit-settings-grid` of `kit-setting-card` (blue bold title link, "New" = small squared brand chip, grey description).
- shared.js does the rest: search filters the cards and highlights the match, shows "N results" with one chip per section (a chip filters to that section) and a count badge on each nav item; sections without results go grey; no match shows "No settings found". A nav item shows only its section; All Settings shows them all. Opening a rail section folds the nav panel.
- Sections and items come from production (`settingItems.jsx`): Your Profile, Account Administration, Organisation, Surveys, Case Management, Live FAQ, Messaging, Guests, Integrations, Legal & Privacy. Keep their order; remove the ones the account does not have.
## Pattern 3: Dashboard (`03-dashboard.html`)
- PageHeader like the production dashboards (`rp-page-header`): the title "{Product} Dashboard" and the page actions in one row (Schedule report = secondary ghost, Download report = the one primary ghost action, with its menu), the divider, then the filters toolbar (selectors). No breadcrumbs on dashboards.
- Row of 4 KPI tiles, then a 2:1 grid (chart tile + list tile), then a table tile.
- Charts are inline SVG that fill the tile, with a legend. Hotel = `--blue-main`, competition = `--neutral-40` dashed.
- Example from production: the Reviews Dashboard (`mockups/reviews-dashboard/`): the AI disclaimer first, the PageHeader, the divider, the Index select, then the tiles (`rp-app-shell.md` § Page header).

## Pattern 4: Results table (`04-results-table.html`)
- Toggle button group for the measure, a "Group by" select, Download on the right.
- Sortable columns, the sorted header in blue with the underline (`rp-table-sorted`), volume bars for shares, a bold total row.
- More rows behind `rp-tile-expand` ("Show all …").

## Pattern 5: Tabs in a tile (`05-tabs-tile.html`)
- `rp-tabs rp-tile-tabs` first in the tile, full width tabs. One `rp-tab-panel` per tab, each with its own heading, table and pagination.
- Row edit icon opens a drawer.

## Pattern 6: Edit form (`06-edit-form.html`)
- Optional info alert on top. One tile per section, fields in `kit-form` (2 columns), required labels marked.
- `rp-tile-actions`: Cancel + "Save changes" (`data-rp-validate`). Switch rows in a table for notification settings.
- Content width limited (`max-width: 1080px` in the page style) for long forms.

## Pattern 7: Tracking inbox (`07-tracking-inbox.html`)
- Toolbar filters + live count. Rows: rating, guest + review snippet (two lines), source, date (sorted), status chip, View + kebab.
- View opens a right drawer: details, the full text, department chips, reply composer (`rp-text-area` with counter), "Publish reply".

## Pattern 8: Dialog form (`08-dialog-form.html`)
- Create in a `md` dialog with `kit-form`; delete confirmation in an `xs` dialog with a danger main button.

## Pattern 9: Wizard (`09-wizard.html`)
- Stepper in the first tile content, one `wizard-panel` per step (`data-rp-form` to validate), TileActions Back / Next; the last step says what happens and the main button uses the action verb ("Create survey").

## Tables (patterns 10–15)
Every table pattern follows `components/rp-table.md`: § 1 for type, construction and density, § 2 for the header, cell and row markup, and its Rules. All of them use the Design team's Tables documentation (classes marked "(Tables doc)"), so the report to the user names the parts that are not in code yet.

Design-review lessons that hold for every table (`rules.md` 20–26): every value column sorts; the page's main list has no tile title that only repeats the page title and no subtitle that explains the UI; open detail rows keep 16px under them; a view switch is the library toggle, small; an AI disclaimer goes right under the top bar; a search or filter for one column lives in that column's header; a row opens through its name link, never a whole-row click with a decorative chevron. Rebuilt product tables that apply all of them: `mockups/table-patterns/`.

## Pattern 10: Analysis table (`10-analysis-table.html`)
- Simple construction (no toolbar), `rp-table-density-regular`. Read only: no checkboxes, no row actions, no footer count.
- The identifier column is a field as header (`rp-table-head-filter`); the applied value shows in the header with the funnel.
- Each KPI is a group: value, its change column (icon-only header, sign on every value), then its bar. Volumes and percentages sort descending first (`data-rp-sort-first`).
- The aggregate row is first, `rp-table-row-highlighted` + `data-rp-static` (it stays on top while sorting).
- The tile title actions: Download and a show / hide columns menu. Pagination without first / last (fewer than 5 pages).

## Pattern 11: Accordion table (`11-accordion-table.html`)
- Expand to compare: `rp-table-density-compact`. Parent rows (`data-rp-row`, `rp-table-row-clickable`, regular weight) open their children (`rp-table-row-secondary`, `data-rp-parent`). A third level is `rp-table-row-tertiary` and cannot expand.
- A group with more than 5 children ends with a pager row (`tr.rp-table-row-pagination` + `data-rp-children-of`).
- The first header has two levels: the parent label and, with `rp-icon-sub-division`, the child label, each with its own sort (`data-rp-sort-level="child"`).
- Children show the bar on a grey range (`rp-volume-bar-neutral`); positive and negative columns use `rp-table-positive` / `rp-table-negative`.
- The first column is pinned (`rp-table-cell-pinned`) and the table has a `min-width`, so it scrolls sideways in narrow tiles. All rows start collapsed.

## Pattern 12: Hybrid table (`12-hybrid-table.html`)
- Tile tabs on top (Reviews, Surveys, Cases), then the tile title with Download and Upload Excel.
- Complex construction, `rp-table-density-regular`. Toolbar left: single-choice selects and a search field that takes the free width. Right: an X that clears every filter and the Sort by menu.
- A select that filters one column marks that header (`rp-table-head-filtered`). No chips: the selects and the field show their values.
- Selecting rows shows `rp-toolbar-bulk` below the toolbar: clear selection, the count, the actions (destructive ones confirm).
- The goal difference is a small chip with its sign next to the goal; a screen-reader text says "Goal reached" or "Below goal". A trash icon per row.
- Footer: "{n} / {total} results found - {selected} items selected" + pagination.

## Pattern 13: Index table (`13-index-table.html`)
- Simple construction, `rp-table-density-regular`, `rp-table-resizable`. Leading switch column: the header switch turns every rule on or off; the page script shows one snackbar.
- Searchers in the headers of the two text columns (`rp-table-head-search`): the label with a magnifier in the actions slot, a click anywhere in the cell opens it, it looks only in its column, and the column doesn't sort. Never more than two, otherwise use a toolbar searcher. Never a row of search fields above the table.
- Names are links (`rp-table-name`) with a warning icon that has a name and a tooltip. Channels are an icon chain (`rp-table-icons` + separators).
- One kebab per row; the main action ("Add rule") in the tile title.

## Pattern 14: Index navigation (`14-index-navigation.html`)
- Each row opens its item through its name: the establishment is a link (`<a class="rp-link" href="#" data-rp-open="…">`, blue semibold); `<a href>` when it goes to a page. No whole-row click and no chevron (the Figma case has none).
- A field as header filters the grouping column. Default values are a small info chip ("Default").

## Pattern 15: Editable table (`15-editable-table.html`)
- `rp-tile rp-tile-edit` (blue dividers come with it), `rp-table-density-comfortable`. Toolbar: the period select, and a toggle group for the input method (Excel shows an upload panel, Manual shows the table).
- Every editable cell is `td.rp-table-cell-input` with a small text field and an `aria-label` ("January RGI"). Each row ends with a reset icon button (`data-rp-reset-row`).
- TileActions: Cancel + Save changes. Abbreviated headers (RGI, ARI, MPI) carry the full name in a tooltip.

## Pattern 16: Operations list (`16-operations-list.html`)
- Tile title with the page-level ghost actions and one main button ("Add users").
- Toolbar: 1–2 selects, the collapsed searcher (a query becomes a chip with Clear all), Sort by on the right.
- Bulk bar: clear selection, "{n} selected items", 3 actions with dividers, the rest in an overflow kebab.
- Rows: checkbox, name as a bold link, attributes, numbers right aligned, status icon centred, a status chip, a chevron that opens the item.
