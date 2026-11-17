# ReviewPro — HTML Mockup

Static HTML/CSS/JS prototype. No build tools, no frameworks, no dependencies.

## Quick start
Open `index.html` in a browser. That's it.

## Stack
- **HTML**: semantic markup with ReviewPro design system classes (`@reviewpro/ui-components` names)
- **CSS**: `shared.css` (tokens, components, app shell) + `rp-icons.css` (ReviewPro icons, drawn from Figma)
- **JS**: `shared.js` (selects, menus, dialogs, drawers, snackbars, tabs, tables, validation)
- **Font**: Noto Sans (Google Fonts)

## Files
- `index.html`: entry point; other `*.html`: more screens of the mockup
- `shared.css`, `rp-icons.css`, `shared.js`: copies of the kit runtime (do not edit here)
- `reviewpro-reputation-logo.svg`, `establishment-logo.png`: logos of the app shell
- Tweak mode: click **Edit** in the bottom left corner, add `#edit` to the URL or press Alt+Shift+E for a Figma-like editor that saves into the HTML file (Chrome/Edge). It loads from the kit (`design-system/foundation/tweak/`), so it is not part of this folder or of Figma Make uploads.

## Figma Make
Pre-configured `.figma/make/` scripts included. No setup needed.
