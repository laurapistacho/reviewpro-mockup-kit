# Pattern Decision Tree

Map the request to a starter, then read its section in `../pattern-blueprints.md` and only the component docs you need.

```
Any table: decide its type first (components/rp-table.md § 1): read and compare = analysis, analyse and act = hybrid,
find and go = index, edit row by row = operations. Then Simple (no toolbar, ≤ 2 single filters in the headers) or Complex (toolbar).
"compare" / "by country / market / source" / "KPIs per row" / "change vs previous period"
  → 10 Analysis table: field-as-header filter, change columns, bars, highlighted total row on top (Regular)
"group → establishments" / "expand" / "drill down in the table" / "by language and establishment"
  → 11 Accordion table: parent rows expand into child rows, two-level header, pinned first column (Compact)
"goals" / "analyse and act" / "KPIs and actions in one list"
  → 12 Hybrid table: tile tabs, toolbar (selects, search field, clear all, Sort by), bulk bar, column actions, trash per row
"manage users" / "take action on items" / "bulk actions" / "filter chips"
  → 16 Operations list: toolbar (selects, collapsed searcher → chip, Sort by), bulk bar with overflow, links, status chips
"rules" / "turn on and off" / "search in a column" / "delivery channels"
  → 13 Index table: switch column with a select-all switch, searchers in the headers, icon chains, resizable columns
"list where each row opens its settings" / "navigator list"
  → 14 Index navigation: clickable rows (mouse and keyboard) open a drawer, field-as-header filter
"enter figures" / "edit in the table" / "monthly data" / "STR"
  → 15 Editable table: edit tile, inline fields, reset per row, Excel or manual input (Comfortable)
"list" / "table" / "manage …" / "users" / "settings page with items"
  → 01 Settings list: tile + toolbar (search, filters) + selectable table + bulk bar + pagination
  → Items are created or edited in a drawer → keep the drawer of 01
  → Short create form (2–5 fields) → dialog: 08

"settings" / "hub" / "overview of options"
  → 02 Settings hub: tiles with link cards in a 3-column grid

"dashboard" / "KPIs" / "overview" / "chart"
  → 03 Dashboard: page title + toolbar (selectors, Actions menu) + KPI tiles + chart tile + table tile

"results" / "breakdown" / "by language / source / department" / "ranking"
  → 04 Results table: toggle (volume / rating) + sortable table with volume bars, total row, tile expand

"tabs" / "hotel vs restaurants" / "two kinds of the same list"
  → 05 Tabs in a tile: tile tabs + one table per tab + edit drawer

"edit" / "profile" / "form" / "configuration"
  → 06 Edit form: one tile per section, fields in kit-form, TileActions (Cancel, Save changes)

"inbox" / "tracking" / "reviews to reply" / "list → detail"
  → 07 Tracking inbox: filtered list + View opens a detail drawer with a reply composer

"create" / "new" / "confirm" / "delete"
  → 08 Dialog form: list with a "Create …" dialog (md) and a delete confirmation (xs)

"wizard" / "steps" / "create survey"
  → 09 Wizard: stepper in a tile, one panel per step, Back / Next / action verb

Nothing fits → 00 Blank page + compose from tiles (below)
```

## Pattern → starter example
| # | Starter | Shell section |
|---|---------|---------------|
| 00 | `examples/00-blank-page.html` | Settings |
| 01 | `examples/01-settings-list.html` | Settings › Organisation |
| 02 | `examples/02-settings-hub.html` | Settings |
| 03 | `examples/03-dashboard.html` | Reviews › Dashboard |
| 04 | `examples/04-results-table.html` | Reviews › Results |
| 05 | `examples/05-tabs-tile.html` | Settings |
| 06 | `examples/06-edit-form.html` | Settings › Your Profile |
| 07 | `examples/07-tracking-inbox.html` | Reviews › Tracking |
| 08 | `examples/08-dialog-form.html` | Manage › Alerts |
| 09 | `examples/09-wizard.html` | Surveys |
| 10 | `examples/10-analysis-table.html` | Reviews › Results |
| 11 | `examples/11-accordion-table.html` | Semantic › Results |
| 12 | `examples/12-hybrid-table.html` | Manage › Goals |
| 13 | `examples/13-index-table.html` | Settings › Messaging (account view) |
| 14 | `examples/14-index-navigation.html` | Settings › Organisation (account view) |
| 15 | `examples/15-editable-table.html` | Revenue Optimizer › STR Data |
| 16 | `examples/16-operations-list.html` | Settings › Account Administration (account view) |

## Composition (no pattern fits)
| Need | Use |
|------|-----|
| A widget, a form section, a card | `rp-tile` (+ title, content or table, actions) |
| Label / value pairs (read only) | `kit-label-value` in a `kit-grid` inside a tile |
| A number that matters | `kit-kpi` in a tile |
| A list of records | `rp-table` in `rp-tile-table`, with a density class (`rp-table.md` § 1) |
| A score per item | `rp-progress-bar` or `rp-volume-bar` |
| Status | `rp-chip` (small in tables) |
| Views of the same content | `rp-tabs` or `rp-toggle-button-group` |
| Filtering | toolbar `rp-search` + `rp-select` (`data-rp-filter`), more filters in a drawer |
| Feedback | `rpSnackbar`, `rp-alert`, `rp-placeholder` |
| A kanban or timeline | tiles in a `kit-grid`, chips for status |

## Selection components
| Choice | Component |
|---|---|
| One of 2–5 visible options | `rp-radio` group, or `rp-toggle-button-group` for views |
| One of many | `rp-select` |
| Several of many | `rp-select rp-select-multiple` |
| On / off that applies at once | `rp-switch` |
| Several independent options | `rp-checkbox` group |
