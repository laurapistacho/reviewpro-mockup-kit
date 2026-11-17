# Tweak mode — developer guide

Visual editor for kit mockups. Opens with the Edit button shared.js shows bottom left on local pages
(file://, localhost; not in frames, not printed), `#edit` in the URL or Alt+Shift+E (`#tweak` / Alt+Shift+T still work)
(`shared.js` loads `tweak/boot.js`). Plain classic scripts, no build step — they must
run from `file://`, inside Figma Make and in every mockup folder.

## Files

| File | Responsibility |
|------|----------------|
| `boot.js` | Ordered module list; loads them, then calls `T.start()` |
| `core.js` | Namespace `window.DLTweakNS` (= `T`), shared state `T.s`, registries, event bus |
| `tokens.js` | DS tokens (spacing, font, colors, radii) + full theme palette from `@reviewpro/ui-components` |
| `editor-icons.js` | Lucide icons for the editor UI (`T.icon(name, size)`) |
| `glyphs.js` | Every ReviewPro icon — **generated** by `.kiro/scripts/build-icons.py` |
| `components.js` | Component props registry: DS class → editable variants |
| `library.js` | Insertable DS component snippets (the + panel) |
| `source.js` | HTML tokenizer, live DOM ↔ file alignment, attribute patching (pure) |
| `file.js` | File System Access: folder grant, resolve file, save, conflict detection |
| `ops.js` | Undoable operations + history (`T.run(op)`, `T.undo()`, `T.ops.*`) |
| `ui.js` | Shadow-root shell, toolbar, notifications, `T.probe()` |
| `overlays.js` | Per-frame canvas drawing: hover, selection, spacing, ⌥ redlines, drop line |
| `fields.js` | Number fields (spacing, gap, font size, radius, stroke): any typed value, written as a token when it is one; token dropdown, ↑↓ stepping, scrubbing |
| `color-picker.js` | Palette popover (`T.openColorPicker(anchor, opts)`) |
| `icon-picker.js` | Glyph popover |
| `inspector.js` | Panel shell: header, one-line path, actions; renders registered sections |
| `similar.js` | Similar elements + scope bar: `T.targets()`, `T.runEach(make, single)`; ⇧-click multi-selection (`T.selection()`, `T.common(fn)` → value or `T.MIXED`) |
| `versions.js` | Version names in `.tweak-history/<page>/names.json` (Tweak: `T.summarizeOps` of the session; Kiro: its own; you: double-click; unnamed Kiro version: `T.describeDiff`). Save & history popover above the save button: Copy for Kiro + auto-save, then the list: day line with undo / redo, the current file (Save = write + manual version), versions with hover actions, versions in `.tweak-history/<page>/` (original per session, one rolling autosave per session / 15 min, manual, `kiro` from the keep-version hook), undo / redo, preview tab (`preview.html` with a Back / Restore bar, restore via postMessage), restore |
| `comments.js` | Comment tool: pins on elements (path + text), composer, thread, list (trash on hover, Delete all in the header); written into `tweak-changes.md` for Kiro without Save, re-read on load / focus; deleted ids are kept until the file drops them, so a sync does not bring them back |
| `kiro-log.js` | `tweak-changes.md` next to the page on every save; Copy for Kiro uses the same text |
| `sections.js` | Inspector sections: props, auto layout (gap icon per direction, grid: column + row gap), padding / margin (Figma order: H, V or L, T / R, B), text (+ alignment: horizontal, vertical), text layer Layout (auto width / auto height / fixed size), fill, radius, stroke (sides: All / one / Custom); `T.sec2` = title column + controls; colors = one trigger each |
| `size.js` | Size section (W / H: Fixed · Hug · Fill) and resize handles on the selection; `T.setSizes(spec, extra)` = several axes + extra styles in one undo step |
| `position.js` | Ignore auto layout (a button in Size: absolute in the parent, no jump), X / Y, free drag, arrow nudge |
| `wrap.js` | ⇧A / ⌘G: wrap the selection in a new auto layout `<div>` (direction, gap token, alignment guessed from how the elements sit) |
| `swap.js` | Swap component (in the component menu: click the name in the inspector header): main ↔ default ↔ ghost button ↔ link ↔ chip ↔ switch ↔ checkbox ↔ radio keep the text; text field ↔ select ↔ search ↔ text area ↔ date picker keep the label, helper and options |
| `library-panel.js` | + panel (in the inspector's place): insert / replace / drag in DS components |
| `dnd.js` | Drop-target rules for drag & drop (pure) |
| `interactions.js` | Page pointer + keyboard, text editing, drag & drop |
| `main.js` | Lifecycle (`T.turnOn`, `T.off`) and `window.DLTweak` API |
| `tweak.css` | Editor UI styles (shadow root only — never affects the page) |

## Rules

- **Never serialize the live DOM into the file.** Every edit is an op that patches the
  original file text (`T.splice`) at offsets from `T.nodeFor(el)`. Scripts change the live
  DOM (classes, inline styles, injected nodes); the file must only get what the designer did.
- Every change goes through an op in `ops.js` and `T.run(op)` → undo, save, re-render.
- Values come from DS tokens (a typed value that is not a token stays as px and shows plain; a token value shows in a gray box): spacing `var(--spacing-*)`, font `var(--font-size-*)`, colors `var(--text-*)`, `var(--background-*)`,
  palette tokens `var(--blue-60)` (every palette token is defined in shared.css).
- Components are switched through React modifier classes from `shared.css` (`rp-map.json`), never inline styles
  that imitate a variant.
- UI buttons use `data-act="name"`; register handlers with `T.action('name', fn)`.
- Style and prop edits go through `T.runEach(el => op)` so they reach every similar element
  (one undo step). Pass `single = true` for state classes (`T.isStateClass`). Text, move,
  duplicate, delete, insert and replace stay on the selection only.

## Similar elements

Same tag + same classes (state classes ignored) inside the same kind of parent (tag + classes).
Elements without classes also match on their position (nth of tag) up to the nearest parent
with classes; `tr` / `li` positions do not count, so one table column is similar. The scope bar
("Apply to: This one / N Similar") keeps the designer's choice for every next selection and
after a reload (`localStorage` `dl-tweak-scope`) until it is switched again.

## Size

The W / H fields show the rendered px size and the mode (Fixed / Hug / Fill). The value is
written where the layout takes it from: an explicit grid track of the parent
(`grid-template-columns: 600px 1fr` on the parent), `width` + `flex: none` for flex items on
the main axis, otherwise `width` / `height`. Linked stylesheets cannot be read on `file://`,
so `size.js` probes the layout (temporarily forces a value, measures, restores the attribute).

## Reset to the component's design
On a DS component every inline style is a change from its design, whether it was made in this session
or is already in the file (Kiro, an earlier session, by hand). `T.customOf(el)` lists them (from the file
when the page is connected, else from the live element plus this session's edits); `T.customHas` also
matches shorthands (`padding` → `padding-left`). Each changed value gets a dot; Padding, Margin, Layout,
Text / Color, Fill, Radius, Stroke and Size get a reset icon (`sec-reset` + family, `size-reset`), and the
name menu has **Reset all changes** (count on the right). `T.resetChanges(el, test)` removes the matching
styles from the file too (`T.REMOVE`). Plain divs have no dots or resets: their inline style is their design.
All resets follow Apply to and are one undo step.

## Notes for Kiro (`tweak-changes.md`)

After every successful write of the page, `kiro-log.js` rewrites `tweak-changes.md` in the same
folder: the **net** changes of this session per element (state before the first edit vs now, so
undone edits vanish), grouped by element and change (`×N` = similar elements), plus text and
structure ops as "this page only", plus the steps for Kiro and the other `.html` pages of the
folder. One block per session between `<!-- tweak:begin id -->` / `<!-- tweak:end id -->`; other
sessions' blocks are kept. When the block is gone (Kiro applied it and deleted the file), the
next save treats what was written as the new baseline. No changes left → the file is deleted.
Every line carries a tag so Kiro never redoes what is saved: `[done]` (in the file, incl. every
insert / move / delete / text edit), `[fold]` (same inline style on N elements → page class),
`[script]` (element made by a script: change the script), `[apply]` (not saved: Safari, Figma Make).
Kiro looks for the file when the designer says they changed something (project-rules rule 6);
the skill (§ Tweak changes) says how to apply it. Style / class ops call `T.touch(el, classes)` when
they are created; new op kinds need a `kind` (see `ops.js`) to show up.

## Saving

Auto-save (switch in Save & history, opened from the toolbar's save button; stored in `localStorage` `dl-tweak-autosave`) writes 350 ms after
each change. Off: the file state becomes `unsaved`, the toolbar shows **Save**, ⌘S writes,
leaving Tweak mode asks, and the browser warns before closing the tab.

## Extension points

| Want to… | Do this |
|----------|---------|
| Make a new variant switchable | Add the class to `shared.css`, then a prop in `components.js` (`group`, `toggle`, `color`, `icon`) |
| Add a component to the + panel | One entry in `library.js` (`{{text\|Default}}` keeps the replaced element's text, `T.textOf`) |
| Add a swap option | A `CONTROLS` entry in `swap.js` (`is(el)` + the library snippet name), or a new family returning `{ target, current, options, build(to) }` |
| Add an inspector section | `T.section({ id, order, when(el, ctx), render(el, ctx) })` in `sections.js` or a new module |
| Add a new kind of edit | Op factory in `ops.js` (`apply` patches `T.file.text`, `revert` restores the snapshot) |
| Add a module | New file writing into `window.DLTweakNS`, listed in `boot.js` |
| Draw something every frame | `T.frameHooks.push(fn)` |
| React to edits / selection | `T.on('change' \| 'select' \| 'state', fn)` |

## Drag & drop (Figma-like)

The selection (or a + panel component) drops into the **deepest valid container under the
pointer**, at the slot along that container's layout axis (row flex / grid = x, otherwise y).
Leaving a card drops into its parent; entering another card or an empty frame drops into it.
Hold Cmd/Ctrl to stay in the current parent; Esc cancels. The blue frame shows the target
container, the line shows the slot.

Never a container: void and text-level tags (input, img, button, a, p, headings…), inline
spans without children, and one-element React components (`LEAF` in `dnd.js`). Table and list
internals stay valid: `tr` only in thead/tbody/tfoot, `td/th` only in `tr`, `li` only in ul/ol.
The source patch moves the element's lines and re-indents them to the new parent.

## Replace keeps behavior

Replacing an element from the + panel (e.g. a link with a button) carries its behavior to the new
element, in the file and live: `id`, `name`, inline handlers (`on*`), `data-*`, `aria-*`, `title`,
`tabindex`, `role`; `href`/`target` only onto an `<a>`. A link replaced by a non-link gets
`onclick="location.href='…'"`. Listeners that page scripts added with `addEventListener` cannot be
copied: clicks are forwarded to the original element until the page reloads, and the kept `id`
rebinds them after a reload (`T.carryBehavior` in `ops.js`).

## Tests
The Daylight kit's editor tests (`dnd-test.js`, `tweak-test.py`, `build-tweak-ui.py`) checked Daylight
components and were not ported. Until ReviewPro versions exist, check an editor change by hand on
`design-system/examples/01-settings-list.html#edit`: select a button, switch a prop, open the icon
picker, insert a snippet from the + panel, save, undo everything and compare the file with git.
## Testing saving without the folder dialog

```js
const fh = { getFile: async () => ({ text: async () => disk }), createWritable: async () => ({ write: async t => (disk = t), close: async () => {} }) };
await DLTweak.connectTo({ name: 'x', getFileHandle: async () => fh });
// …edit, then compare `disk` with the original; DLTweak.ns.undo() until empty must restore it byte for byte
```

This folder is the only copy. `shared.js` loads it from the kit (`../../design-system/foundation/tweak/` for a mockup), so mockup folders and Figma Make uploads never contain it. Edit here, nothing to sync.
