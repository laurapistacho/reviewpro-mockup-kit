# Figma fidelity

The kit copies the Figma **UI App** library (file `ubE7R2jeqiwS8BZ4a5vwHw`). This folder holds what proves it and what turns a Figma frame into kit markup.

**Which source wins.** Figma UI App wins on how things look (sizes, spacing, colours, radius, states). The product (`frontend-workspace`) wins on what things do and say (behaviour, labels, which elements exist). Where they disagree the kit says so in the component docs and below.

| File | What it is |
|---|---|
| `checks.json` | One entry per library variant: the Figma node and the kit markup that must look the same |
| `ref/<node>.png` | The Figma render of each node at scale 1 (maintainer data, not in the download) |
| `out/` | Figma, kit and difference side by side for every check above its threshold (made by the script) |
| `figma-map.json` | Every library component set and variant mapped to kit classes |

## Check the kit against Figma

```bash
python3 .kiro/scripts/figma-check.py            # all checks (about a minute, needs Chrome)
python3 .kiro/scripts/figma-check.py chip alert  # only these groups
python3 .kiro/scripts/figma-check.py --missing   # nodes that still need a reference PNG
```

It renders each kit snippet in Chrome at the size of the Figma render and counts the pixels that differ. Text anti-aliasing alone gives 0.2 to 1% (2 to 7% on small coloured chips); a wrong size, colour, radius or spacing gives far more. Status today: 57 checks across buttons, icon buttons, chips, avatars, checkbox, radio, switch, badge, tooltip, alerts, tabs, fields, search, menu, breadcrumbs, paginator, volume bar, slider, uploader and timeline. All pass or are a documented difference (`known`).

To add a check: add the variant to `checks.json` (node, kit markup with the same text and icons as the Figma variant), export the node with the Figma MCP (`download_figma_images`, `pngScale: 1`, file name = node id with `-` instead of `:`) into `ref/`, run the script, fix the kit until it passes.

## Build a page from a Figma frame

1. `get_figma_data(fileKey, nodeId)` with the Figma MCP. Large results are saved to a file: copy it next to the mockup.
2. `python3 .kiro/scripts/figma-outline.py <file.yaml> --node <frame id>` prints the frame as a build plan: every library instance as its kit class (with the variant turned into modifier classes), every auto-layout frame with its gap and padding, every text with its kit text style, every icon as its `rp-icon` class. YAML needs PyYAML (`pip install pyyaml`).
3. Build the page from the outline with the kit starters and components. Lines marked `NOT IN KIT` or `unmapped component` need a decision (closest kit component, or add it).
4. Export the frame as PNG (`download_figma_images`, scale 1) and compare it with a screenshot of the page side by side.

## Known differences

| Where | Figma | Kit (and why) |
|---|---|---|
| Chip Medium Outlined, Medium Success, Small Outlined | 4px corners, 4px icon gap | Pills with 8px gaps like every other chip variant and the product. `rp-chip-squared` gives 4px corners. |
| Avatar Small | exported at 25px | 24px |
| Item-Dropdown atom | bold value | Regular 14/22, like the library's Menu component and the product |
| Date fields | chevron, no "-" between From and To | "-" and no chevron, like the product |
| Account menu labels | "Change language", "Log Out" | "Language", "Logout", like the product |
| Group count in the establishment selector | same colour as the name | Grey, like the product |
| Outlined button and chip border | 1px in the component data, 2px in the render | 2px, like the render and the product |
| Expanded side bar | 267px | 267px (the product draws 250px) |

## Not in the kit yet

| Library | Why |
|---|---|
| DayPicker-Calendar (the month grid) | The date popover uses From/To fields; the grid is not drawn |
| Progress Bar Type=Steps | Only the percentage bar exists (`rp-progress-bar`) |
| Chip Neon, TopicPositive, TopicNegative | No product use found yet |
| NewField Style=Ghost | No product use found yet |
| Process (the library stepper look) | The kit stepper follows the product `Stepper` |

Added from the library in this pass: Slider (`rp-slider`), Uploader (`rp-uploader`), Timeline (`rp-timeline`), the square icon button hover (`rp-icon-button-squared`), Avatar Large 50px (`rp-avatar-size-50`), Volume-Bar Style 01 (`rp-volume-bar-neutral`), the partial checkbox hook (`data-rp-indeterminate`).
