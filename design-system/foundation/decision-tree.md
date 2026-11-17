# Pattern Decision Tree

Map the request to a starter, then read its section in `../pattern-blueprints.md` and only the component docs you need.

```
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

## Composition (no pattern fits)
| Need | Use |
|------|-----|
| A widget, a form section, a card | `rp-tile` (+ title, content or table, actions) |
| Label / value pairs (read only) | `kit-label-value` in a `kit-grid` inside a tile |
| A number that matters | `kit-kpi` in a tile |
| A list of records | `rp-table` in `rp-tile-table` |
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
