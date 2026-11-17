# Pattern Blueprints

Rules per starter. Every pattern also follows `foundation/rules.md`.

## Pattern 0: Blank page
Shell + breadcrumbs + page title + a `kit-stack` of tiles. Use it when nothing else fits, then compose from tiles (decision tree § Composition).

## Pattern 1: Settings list (`01-settings-list.html`)
- Tile title "Manage {Entities}" with the main action ("Add {entity}") in `rp-tile-title-actions`.
- `rp-toolbar`: search (280px) + 1–3 selects on the left, ghost buttons (Filters → drawer, Export) on the right. All `-size-small`.
- `rp-toolbar-bulk` follows the toolbar and replaces it while rows are selected.
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
- Page title "{Product} Dashboard", toolbar with selectors on the left and an "Actions" default button (menu: Download report, Schedule report) on the right.
- Row of 4 KPI tiles, then a 2:1 grid (chart tile + list tile), then a table tile.
- Charts are inline SVG that fill the tile, with a legend. Hotel = `--blue-main`, competition = `--neutral-40` dashed.

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
