/* Tweak mode — editor UI icons.
   Lucide (https://lucide.dev), ISC License. Copyright (c) for portions of Lucide are held by
   Cole Bemis 2013-2022 as part of Feather (MIT). All other copyright (c) for Lucide are held by
   Lucide Contributors 2022. Add an icon: copy the inner SVG of lucide-static/icons/<name>.svg. */
(function (T) {
  'use strict';
  var ICONS = {
    "mouse-pointer-2": "<path d=\"M4.037 4.688a.495.495 0 0 1 .651-.651l16 6.5a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063z\"/>",
    "eye": "<path d=\"M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0\"/> <circle cx=\"12\" cy=\"12\" r=\"3\"/>",
    "undo-2": "<path d=\"M9 14 4 9l5-5\"/> <path d=\"M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11\"/>",
    "redo-2": "<path d=\"m15 14 5-5-5-5\"/> <path d=\"M20 9H9.5A5.5 5.5 0 0 0 4 14.5A5.5 5.5 0 0 0 9.5 20H13\"/>",
    "x": "<path d=\"M18 6 6 18\"/> <path d=\"m6 6 12 12\"/>",
    "folder-open": "<path d=\"m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2\"/>",
    "folder-check": "<path d=\"M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z\"/> <path d=\"m9 13 2 2 4-4\"/>",
    "check": "<path d=\"M20 6 9 17l-5-5\"/>",
    "loader-circle": "<path d=\"M21 12a9 9 0 1 1-6.219-8.56\"/>",
    "clipboard-copy": "<rect width=\"8\" height=\"4\" x=\"8\" y=\"2\" rx=\"1\" ry=\"1\"/> <path d=\"M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2\"/> <path d=\"M16 4h2a2 2 0 0 1 2 2v4\"/> <path d=\"M21 14H11\"/> <path d=\"m15 10-4 4 4 4\"/>",
    "cloud-off": "<path d=\"m2 2 20 20\"/> <path d=\"M5.782 5.782A7 7 0 0 0 9 19h8.5a4.5 4.5 0 0 0 1.307-.193\"/> <path d=\"M21.532 16.5A4.5 4.5 0 0 0 17.5 10h-1.79A7.008 7.008 0 0 0 10 5.07\"/>",
    "corner-left-up": "<polyline points=\"14 9 9 4 4 9\"/> <path d=\"M20 20h-7a4 4 0 0 1-4-4V4\"/>",
    "arrow-up": "<path d=\"m5 12 7-7 7 7\"/> <path d=\"M12 19V5\"/>",
    "arrow-down": "<path d=\"M12 5v14\"/> <path d=\"m19 12-7 7-7-7\"/>",
    "arrow-left": "<path d=\"m12 19-7-7 7-7\"/> <path d=\"M19 12H5\"/>",
    "arrow-right": "<path d=\"M5 12h14\"/> <path d=\"m12 5 7 7-7 7\"/>",
    "copy-plus": "<line x1=\"15\" x2=\"15\" y1=\"12\" y2=\"18\"/> <line x1=\"12\" x2=\"18\" y1=\"15\" y2=\"15\"/> <rect width=\"14\" height=\"14\" x=\"8\" y=\"8\" rx=\"2\" ry=\"2\"/> <path d=\"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2\"/>",
    "trash-2": "<path d=\"M3 6h18\"/> <path d=\"M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6\"/> <path d=\"M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2\"/> <line x1=\"10\" x2=\"10\" y1=\"11\" y2=\"17\"/> <line x1=\"14\" x2=\"14\" y1=\"11\" y2=\"17\"/>",
    "rotate-ccw": "<path d=\"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8\"/> <path d=\"M3 3v5h5\"/>",
    "type": "<polyline points=\"4 7 4 4 20 4 20 7\"/> <line x1=\"9\" x2=\"15\" y1=\"20\" y2=\"20\"/> <line x1=\"12\" x2=\"12\" y1=\"4\" y2=\"20\"/>",
    "keyboard": "<path d=\"M10 8h.01\"/> <path d=\"M12 12h.01\"/> <path d=\"M14 8h.01\"/> <path d=\"M16 12h.01\"/> <path d=\"M18 8h.01\"/> <path d=\"M6 8h.01\"/> <path d=\"M7 16h10\"/> <path d=\"M8 12h.01\"/> <rect width=\"20\" height=\"16\" x=\"2\" y=\"4\" rx=\"2\"/>",
    "refresh-cw": "<path d=\"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8\"/> <path d=\"M21 3v5h-5\"/> <path d=\"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16\"/> <path d=\"M8 16H3v5\"/>",
    "panel-left": "<rect width=\"18\" height=\"18\" x=\"3\" y=\"3\" rx=\"2\"/> <path d=\"M9 3v18\"/>",
    "panel-right": "<rect width=\"18\" height=\"18\" x=\"3\" y=\"3\" rx=\"2\"/> <path d=\"M15 3v18\"/>",
    "arrow-left-to-line": "<path d=\"M3 19V5\"/> <path d=\"m13 6-6 6 6 6\"/> <path d=\"M7 12h14\"/>",
    "arrow-right-to-line": "<path d=\"M17 12H3\"/> <path d=\"m11 18 6-6-6-6\"/> <path d=\"M21 5v14\"/>",
    "component": "<path d=\"M15.536 11.293a1 1 0 0 0 0 1.414l2.376 2.377a1 1 0 0 0 1.414 0l2.377-2.377a1 1 0 0 0 0-1.414l-2.377-2.377a1 1 0 0 0-1.414 0z\"/> <path d=\"M2.297 11.293a1 1 0 0 0 0 1.414l2.377 2.377a1 1 0 0 0 1.414 0l2.377-2.377a1 1 0 0 0 0-1.414L6.088 8.916a1 1 0 0 0-1.414 0z\"/> <path d=\"M8.916 17.912a1 1 0 0 0 0 1.415l2.377 2.376a1 1 0 0 0 1.414 0l2.377-2.376a1 1 0 0 0 0-1.415l-2.377-2.376a1 1 0 0 0-1.414 0z\"/> <path d=\"M8.916 4.674a1 1 0 0 0 0 1.414l2.377 2.376a1 1 0 0 0 1.414 0l2.377-2.376a1 1 0 0 0 0-1.414l-2.377-2.377a1 1 0 0 0-1.414 0z\"/>",
    "search": "<circle cx=\"11\" cy=\"11\" r=\"8\"/> <path d=\"m21 21-4.3-4.3\"/>",
    "chevron-down": "<path d=\"m6 9 6 6 6-6\"/>",
    "plus": "<path d=\"M5 12h14\"/> <path d=\"M12 5v14\"/>",
    "replace": "<path d=\"M14 4a2 2 0 0 1 2-2\"/> <path d=\"M16 10a2 2 0 0 1-2-2\"/> <path d=\"M20 2a2 2 0 0 1 2 2\"/> <path d=\"M22 8a2 2 0 0 1-2 2\"/> <path d=\"m3 7 3 3 3-3\"/> <path d=\"M6 10V5a3 3 0 0 1 3-3h1\"/> <rect x=\"2\" y=\"14\" width=\"8\" height=\"8\" rx=\"2\"/>",
    "palette": "<circle cx=\"13.5\" cy=\"6.5\" r=\".5\" fill=\"currentColor\"/> <circle cx=\"17.5\" cy=\"10.5\" r=\".5\" fill=\"currentColor\"/> <circle cx=\"8.5\" cy=\"7.5\" r=\".5\" fill=\"currentColor\"/> <circle cx=\"6.5\" cy=\"12.5\" r=\".5\" fill=\"currentColor\"/> <path d=\"M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z\"/>",
    "layout-grid": "<rect width=\"7\" height=\"7\" x=\"3\" y=\"3\" rx=\"1\"/> <rect width=\"7\" height=\"7\" x=\"14\" y=\"3\" rx=\"1\"/> <rect width=\"7\" height=\"7\" x=\"14\" y=\"14\" rx=\"1\"/> <rect width=\"7\" height=\"7\" x=\"3\" y=\"14\" rx=\"1\"/>",
    "tag": "<path d=\"M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z\"/> <circle cx=\"7.5\" cy=\"7.5\" r=\".5\" fill=\"currentColor\"/>",
    "toggle-right": "<rect width=\"20\" height=\"12\" x=\"2\" y=\"6\" rx=\"6\" ry=\"6\"/> <circle cx=\"16\" cy=\"12\" r=\"2\"/>",
    "table-2": "<path d=\"M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18\"/>",
    "text": "<path d=\"M17 6.1H3\"/> <path d=\"M21 12.1H3\"/> <path d=\"M15.1 18H3\"/>",
    "circle-alert": "<circle cx=\"12\" cy=\"12\" r=\"10\"/> <line x1=\"12\" x2=\"12\" y1=\"8\" y2=\"12\"/> <line x1=\"12\" x2=\"12.01\" y1=\"16\" y2=\"16\"/>",
    "square": "<rect width=\"18\" height=\"18\" x=\"3\" y=\"3\" rx=\"2\"/>",
    "rectangle-horizontal": "<rect width=\"20\" height=\"12\" x=\"2\" y=\"6\" rx=\"2\"/>",
    "user": "<path d=\"M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2\"/> <circle cx=\"12\" cy=\"7\" r=\"4\"/>",
    "heading": "<path d=\"M6 12h12\"/> <path d=\"M6 20V4\"/> <path d=\"M18 20V4\"/>",
    "text-cursor-input": "<path d=\"M5 4h1a3 3 0 0 1 3 3 3 3 0 0 1 3-3h1\"/> <path d=\"M13 20h-1a3 3 0 0 1-3-3 3 3 0 0 1-3 3H5\"/> <path d=\"M5 16H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h1\"/> <path d=\"M13 8h7a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-7\"/> <path d=\"M9 7v10\"/>",
    "list": "<path d=\"M3 12h.01\"/> <path d=\"M3 18h.01\"/> <path d=\"M3 6h.01\"/> <path d=\"M8 12h13\"/> <path d=\"M8 18h13\"/> <path d=\"M8 6h13\"/>",
    "minus": "<path d=\"M5 12h14\"/>",
    "columns-2": "<rect width=\"18\" height=\"18\" x=\"3\" y=\"3\" rx=\"2\"/> <path d=\"M12 3v18\"/>",
    "rows-2": "<rect width=\"18\" height=\"18\" x=\"3\" y=\"3\" rx=\"2\"/> <path d=\"M3 12h18\"/>",
    "badge": "<path d=\"M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z\"/>",
    "square-stack": "<path d=\"M4 10c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2\"/> <path d=\"M10 16c-1.1 0-2-.9-2-2v-4c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2\"/> <rect width=\"8\" height=\"8\" x=\"14\" y=\"14\" rx=\"2\"/>",
    "image": "<rect width=\"18\" height=\"18\" x=\"3\" y=\"3\" rx=\"2\" ry=\"2\"/> <circle cx=\"9\" cy=\"9\" r=\"2\"/> <path d=\"m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21\"/>",
    "ellipsis": "<circle cx=\"12\" cy=\"12\" r=\"1\"/> <circle cx=\"19\" cy=\"12\" r=\"1\"/> <circle cx=\"5\" cy=\"12\" r=\"1\"/>",
    "grip-vertical": "<circle cx=\"9\" cy=\"12\" r=\"1\"/> <circle cx=\"9\" cy=\"5\" r=\"1\"/> <circle cx=\"9\" cy=\"19\" r=\"1\"/> <circle cx=\"15\" cy=\"12\" r=\"1\"/> <circle cx=\"15\" cy=\"5\" r=\"1\"/> <circle cx=\"15\" cy=\"19\" r=\"1\"/>"
  };
  /* Editor-specific glyphs */
  ICONS.save = '<path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/><path d="M7 3v4a1 1 0 0 0 1 1h7"/>';
  ICONS.dirRow = '<path d="M4 12h16"/><path d="m15 7 5 5-5 5"/>';
  ICONS.dirCol = '<path d="M12 4v16"/><path d="m7 15 5 5 5-5"/>';
  /* Spacing, drawn like Figma's auto-layout panel: a frame with the edited side(s) solid */
  var FRAME = '<rect x="4" y="4" width="16" height="16" rx="2" opacity=".4"/>';
  ICONS.padH = FRAME + '<path d="M8 8v8M16 8v8"/>';      /* left + right */
  ICONS.padV = FRAME + '<path d="M8 8h8M8 16h8"/>';      /* top + bottom */
  ICONS.padL = FRAME + '<path d="M4 6v12" stroke-width="3"/>';
  ICONS.padT = FRAME + '<path d="M6 4h12" stroke-width="3"/>';
  ICONS.padR = FRAME + '<path d="M20 6v12" stroke-width="3"/>';
  ICONS.padB = FRAME + '<path d="M6 20h12" stroke-width="3"/>';
  ICONS.sides = '<rect x="3" y="3" width="18" height="18" rx="2"/><rect x="8" y="8" width="8" height="8" rx="1"/>';
  ICONS.gapH = '<path d="M4 5h2v14H4"/><path d="M20 5h-2v14h2"/><path d="M12 9v6"/>';  /* between items in a row */
  ICONS.gapV = '<path d="M5 4v2h14V4"/><path d="M5 20v-2h14v2"/><path d="M9 12h6"/>';  /* between items in a column */
  ICONS.radius = '<path d="M4 20v-9a7 7 0 0 1 7-7h9"/>';
  ICONS.strokeW = '<path d="M4 6h16" stroke-width="1"/><path d="M4 12h16" stroke-width="2"/><path d="M4 18h16" stroke-width="3.5"/>';
  ICONS.history = '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>'; /* Lucide history */
  ICONS.bookmark = '<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>'; /* Lucide bookmark */
  ICONS['message-circle'] = '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>'; /* Lucide message-circle */
  ICONS.ignoreAL = '<path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3"/><rect x="9" y="9" width="6" height="6" rx="1"/>';
  ICONS.spread = '<path d="M3 4v16M21 4v16"/><rect x="7" y="8" width="3" height="8" rx="1"/><rect x="14" y="8" width="3" height="8" rx="1"/>';
  ICONS.fontSize = '<path d="M4 18 9 6l5 12"/><path d="M5.5 14h7"/><path d="M15 18l3-7 3 7"/><path d="M16 16h4"/>';
  /* Text alignment (Figma): lines left / center / right; vertical = arrow to the top / middle / bottom line */
  ICONS.alignL = '<path d="M4 6h16M4 12h10M4 18h13"/>';
  ICONS.alignC = '<path d="M4 6h16M7 12h10M5.5 18h13"/>';
  ICONS.alignR = '<path d="M4 6h16M10 12h10M7 18h13"/>';
  ICONS.alignTop = '<path d="M5 4h14"/><path d="M12 20V9"/><path d="m8 12 4-4 4 4"/>';
  ICONS.alignMid = '<path d="M5 12h14"/><path d="M12 3v5M12 16v5"/><path d="m9 5 3 3 3-3M9 19l3-3 3 3"/>';
  ICONS.alignBot = '<path d="M5 20h14"/><path d="M12 4v11"/><path d="m8 12 4 4 4-4"/>';
  /* Text resizing (Figma): auto width |→ · auto height |≡| · fixed size ▣ */
  ICONS.textAutoW = '<path d="M4 5v14"/><path d="M8 12h12"/><path d="m16 8 4 4-4 4"/>';
  ICONS.textAutoH = '<path d="M4 4v16M20 4v16"/><path d="M8 8h8M8 12h8M8 16h5"/>';
  ICONS.textFixed = '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 9h8M8 12.5h8M8 16h4"/>';
  ICONS.play = '<polygon points="6 3 20 12 6 21 6 3"/>'; /* Lucide play: Preview (Figma's prototype) */
  ICONS.lineHeight = '<path d="M4 4h16M4 20h16"/><path d="M9 16l3-8 3 8M10.2 13h3.6"/>'; /* text between two lines */
  T.ICONS = ICONS;
  T.icon = function (name, size) {
    return '<svg width="' + (size || 16) + '" height="' + (size || 16) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || '') + '</svg>';
  };
})(window.DLTweakNS);
