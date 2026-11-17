/* Tweak mode: drop targets for drag & drop, Figma-like (move between containers).
   Pure logic, no DOM globals: everything comes in through `env`, so node can test it
   (.kiro/scripts/dnd-test.js). Used by interactions.js for moves and library drops.

   dropTarget(stack, drag, x, y, env) -> { container, ref, pos: 'before'|'after'|'inside', axis } | null
     stack  elements under the pointer, top-most first (document.elementsFromPoint, editor UI removed)
     drag   { el, tag, keepParent }  el = moved element (null for a library drop), tag = its tag name
     env    { styleOf(el) -> {display, flexDirection, gridColumns}, rectOf(el), kids(el) -> element children
              that count (no editor nodes, scripts, styles), isOwn(el) }
   Rules (why): the deepest valid container under the pointer wins, so leaving a card drops into
   its parent and entering another card drops into that card. Never produces invalid HTML. */
(function (T) {
  'use strict';
  var VOID = { INPUT: 1, IMG: 1, BR: 1, HR: 1, TEXTAREA: 1, SELECT: 1, OPTION: 1, META: 1, LINK: 1, SCRIPT: 1, STYLE: 1, SVG: 1, svg: 1, PATH: 1, path: 1, HTML: 1 };
  var TEXT_LEVEL = { BUTTON: 1, A: 1, P: 1, H1: 1, H2: 1, H3: 1, H4: 1, H5: 1, H6: 1, KBD: 1, B: 1, STRONG: 1, EM: 1, I: 1, SMALL: 1, CODE: 1 };
  /* DS components that are one element: never drop into them */
  var LEAF = ['rp-main-button', 'rp-default-button', 'rp-ghost-button', 'rp-icon-button', 'rp-floating-button', 'rp-toggle-button', 'rp-chip', 'rp-badge-content',
    'rp-icon', 'rp-switch', 'rp-avatar', 'rp-checkbox', 'rp-radio', 'rp-field-input', 'rp-field-box', 'rp-loader', 'rp-skeleton',
    'rp-divider', 'rp-link', 'rp-select-trigger', 'rp-tab', 'rp-breadcrumb-link', 'rp-breadcrumb-text', 'rp-step-icon',
    'rp-side-bar-item', 'rp-side-bar-panel-item', 'rp-top-bar-button', 'rp-menu-item', 'rp-volume-bar', 'rp-progress-bar-track'];
  /* parent tag -> allowed child tags (and the reverse for table / list internals) */
  var ONLY = { TABLE: { THEAD: 1, TBODY: 1, TFOOT: 1, CAPTION: 1, COLGROUP: 1 }, THEAD: { TR: 1 }, TBODY: { TR: 1 }, TFOOT: { TR: 1 },
    TR: { TD: 1, TH: 1 }, UL: { LI: 1 }, OL: { LI: 1 }, SELECT: { OPTION: 1 } };
  var NEEDS = { TR: { THEAD: 1, TBODY: 1, TFOOT: 1 }, TD: { TR: 1 }, TH: { TR: 1 }, LI: { UL: 1, OL: 1 }, OPTION: { SELECT: 1 },
    THEAD: { TABLE: 1 }, TBODY: { TABLE: 1 }, TFOOT: { TABLE: 1 } };

  function isLeaf(el) {
    var cl = el.classList;
    if (!cl) return false;
    for (var i = 0; i < LEAF.length; i++) if (cl.contains(LEAF[i])) return true;
    return false;
  }
  /* Can `el` take `tag` as a direct child? */
  function accepts(el, tag, env) {
    var t = el.tagName;
    if (VOID[t] || TEXT_LEVEL[t] || isLeaf(el) || env.isOwn(el)) return false;
    if (ONLY[t] && !ONLY[t][tag]) return false;
    if (NEEDS[tag] && !NEEDS[tag][t]) return false;
    var st = env.styleOf(el);
    /* inline text-level wrappers (span, label as text) are not layout containers */
    if (/^inline/.test(st.display) && !/flex|grid/.test(st.display) && !env.kids(el).length) return false;
    if (/^inline$/.test(st.display)) return false;
    return true;
  }
  function axisOf(el, env) {
    var st = env.styleOf(el);
    if (/flex/.test(st.display)) return st.flexDirection.indexOf('row') === 0 ? 'h' : 'v';
    if (/grid/.test(st.display)) return st.gridColumns > 1 ? 'h' : 'v';
    if (el.tagName === 'TR') return 'h';
    return 'v';
  }
  function contains(a, b) { for (var n = b; n; n = n.parentElement) if (n === a) return true; return false; }

  /* Index along the container axis: first child whose midpoint is past the pointer */
  function slot(container, drag, x, y, env) {
    var axis = axisOf(container, env);
    var kids = env.kids(container).filter(function (k) { return k !== drag.el; });
    for (var i = 0; i < kids.length; i++) {
      var r = env.rectOf(kids[i]);
      var before = axis === 'v' ? y < r.top + r.height / 2
        : (y < r.top || (y <= r.bottom && x < r.left + r.width / 2));
      if (before) return { container: container, ref: kids[i], pos: 'before', axis: axis };
    }
    if (kids.length) return { container: container, ref: kids[kids.length - 1], pos: 'after', axis: axis };
    return { container: container, ref: container, pos: 'inside', axis: axis };
  }

  T.dropTarget = function (stack, drag, x, y, env) {
    var tag = drag.tag;
    if (drag.keepParent && drag.el && drag.el.parentElement) return slot(drag.el.parentElement, drag, x, y, env);
    for (var i = 0; i < stack.length; i++) {
      var c = stack[i];
      if (!c || env.isOwn(c)) continue;
      for (; c && c.tagName !== 'HTML'; c = c.parentElement) {
        if (drag.el && contains(drag.el, c)) continue; /* never into itself */
        if (accepts(c, tag, env)) return slot(c, drag, x, y, env);
      }
      return null;
    }
    return null;
  };
  /* Dropping here changes nothing (same parent, same place)? */
  T.dropIsNoop = function (t, el, env) {
    if (!t || !el) return true;
    if (t.ref === el) return true;
    if (t.pos === 'inside') return false;
    var kids = env.kids(t.container), i = kids.indexOf(t.ref), j = kids.indexOf(el);
    if (j < 0) return false;
    return t.pos === 'before' ? i - 1 === j : i + 1 === j;
  };
  T.dndAccepts = accepts;
})(typeof window !== 'undefined' ? window.DLTweakNS : module.exports);
