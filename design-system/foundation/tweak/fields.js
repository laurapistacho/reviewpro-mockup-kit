/* Tweak mode — token fields (spacing, gap, font size, corner radius, stroke width).
   Click a field → token dropdown. ↑↓ steps through tokens. Drag the label → scrub.
   Typed values are kept as typed (1 → 1px, shown plain); a typed value that equals a token is
   written as that token (16 → var(--spacing-lg)) and its number sits in a box, like Figma. Field ids are CSS properties, plus 'pad-x' / 'pad-y' / 'mar-x' / 'mar-y' (both sides). */
(function (T) {
  'use strict';
  var S = T.s, K = T.tokens, I = T.icon, esc = T.esc, px = T.px;
  var dd = T.$('#dd'), ddField = null;

  var SCALE_OF = { 'font-size': 'font', 'line-height': 'line', 'border-radius': 'radius', stroke: 'stroke', 'grid-cols': 'count', 'grid-rows': 'count' };
  var STROKE_SIDE = /^stroke-(top|right|bottom|left)$/; /* Custom stroke: one width per side */
  T.scaleOf = function (id) { return STROKE_SIDE.test(id) ? 'stroke' : SCALE_OF[id] || 'space'; };
  T.step = function (scale, n, d) {
    var vals = K.SCALES[scale].map(function (s) { return s[0]; });
    if (d > 0) { for (var i = 0; i < vals.length; i++) if (vals[i] > n) return vals[i]; return vals[vals.length - 1]; }
    for (var j = vals.length - 1; j >= 0; j--) if (vals[j] < n) return vals[j];
    return vals[0];
  };
  function expr(scale, n) {
    var t = T.tokenFor(scale, n);
    if (t) return 'var(' + t + ')';
    if (scale === 'line') return n ? String(n) : 'normal'; /* a ratio, no unit; 0 = Auto */
    return n ? n + 'px' : '0';
  }
  /* line height as a ratio of the font size, 2 decimals (Auto = 0) */
  function lineOf(cs) { var lh = cs.lineHeight; return lh === 'normal' ? 0 : Math.round(parseFloat(lh) / parseFloat(cs.fontSize) * 100) / 100; }
  T.isRatio = function (id) { return T.scaleOf(id) === 'line'; };
  var PAIRS = { 'pad-x': ['padding-left', 'padding-right'], 'pad-y': ['padding-top', 'padding-bottom'],
    'mar-x': ['margin-left', 'margin-right'], 'mar-y': ['margin-top', 'margin-bottom'] };
  /* el: needed for the stroke (its side and current style come from the element) */
  T.changesFor = function (id, n, el) {
    if (id === 'stroke') return T.strokeChanges(el || S.selected, S.strokeSide, n ? 'width' : 'none', n + 'px');
    /* grid: equal columns / rows (Figma grid auto layout); a track's own size is set from the item's W / H */
    if (id === 'grid-cols') return { 'grid-template-columns': 'repeat(' + Math.max(1, n) + ', minmax(0, 1fr))' };
    if (id === 'grid-rows') return { 'grid-template-rows': 'repeat(' + Math.max(1, n) + ', auto)' };
    var side = STROKE_SIDE.exec(id);
    if (side) return T.strokeChanges(el || S.selected, side[1], 'width', n + 'px');
    var v = expr(T.scaleOf(id), n), c = {};
    var pair = PAIRS[id];
    if (pair) { c[pair[0]] = v; c[pair[1]] = v; } else c[id] = v;
    return c;
  };
  T.fieldValue = function (id, el) {
    var cs = getComputedStyle(el || S.selected);
    if (PAIRS[id]) return px(cs.getPropertyValue(PAIRS[id][0]));
    if (id === 'border-radius') return px(cs.borderTopLeftRadius);
    if (id === 'stroke') return T.strokeWidthOf(el || S.selected);
    if (id === 'grid-cols' || id === 'grid-rows') { var tr = cs.getPropertyValue(id === 'grid-cols' ? 'grid-template-columns' : 'grid-template-rows').trim(); return tr && tr !== 'none' ? tr.split(/\s+/).length : 1; }
    if (STROKE_SIDE.test(id)) return T.strokeWidthOf(el || S.selected, id.slice(7));
    if (id === 'gap') return px(cs.flexDirection.indexOf('column') === 0 ? cs.rowGap : cs.columnGap);
    if (id === 'line-height') return lineOf(cs);
    return px(cs.getPropertyValue(id));
  };
  /* Applies to the selection and its similar elements (similar.js) */
  T.setField = function (id, n) {
    if (!S.selected || T.targets().every(function (el) { return T.fieldValue(id, el) === n; })) { T.renderInspector(); return; }
    T.runEach(function (el) { return T.ops.style(el, T.changesFor(id, n, el)); });
  };
  /* Field label: only the step ("lg", "2xxl"); the dropdown lists keep the full token name */
  T.shortToken = function (tok) { return String(tok).replace(/^--(spacing|font-size|line-height|radius|font)-/, ''); };
  function refocus(id) { var f = T.root.querySelector('[data-input="' + id + '"]'); if (f) { f.focus(); f.select(); } }

  /* Field markup. opts: { mod, hot: 'pad'|'mar'|'gap', title } */
  T.field = function (id, key, value, opts) {
    opts = opts || {};
    /* several selected elements with different values: "Mixed"; typing a value sets it on all */
    if (T.isMulti() && T.common(function (o) { return T.fieldValue(id, o); }) === T.MIXED) {
      return '<label class="f mixed" data-field="' + id + '" data-hot="' + (opts.hot || '') + '" title="' + esc((opts.title || '') + ' · values differ, type one for all') + '">' +
        '<span class="k" data-scrub="' + id + '">' + key + '</span>' +
        '<input data-input="' + id + '" value="" placeholder="Mixed" inputmode="numeric" spellcheck="false" autocomplete="off" />' +
        '<span class="chev" data-act="field-open" data-id="' + id + '">' + I('chevron-down', 12) + '</span></label>';
    }
    var tok = T.tokenFor(T.scaleOf(id), value), shown = T.isRatio(id) && !value ? 'Auto' : value;
    return '<label class="f' + (opts.mod ? ' mod' : '') + '" data-field="' + id + '" data-hot="' + (opts.hot || '') + '" title="' + esc(opts.title || '') + '">' +
      '<span class="k" data-scrub="' + id + '">' + key + '</span>' +
      /* a DS token value sits in a box (like a bound variable in Figma); a custom value is plain */
      '<input data-input="' + id + '" value="' + shown + '"' + (tok ? ' class="tokv" style="width:calc(' + String(value).length + 'ch + 10px)" title="DS token ' + tok + '"' : '') + ' inputmode="' + (T.isRatio(id) ? 'decimal' : 'numeric') + '" spellcheck="false" autocomplete="off" />' +
      (tok ? '<span class="tok" title="' + tok + '">' + T.shortToken(tok) + '</span>' : '') +
      '<span class="chev" data-act="field-open" data-id="' + id + '">' + I('chevron-down', 12) + '</span></label>';
  };

  /* ── Token dropdown ── */
  function open(id) {
    if (!S.selected) return;
    ddField = id;
    var scale = T.scaleOf(id), cur = T.fieldValue(id);
    /* value on the left, the token step on the right (lg, xs…): the full name is in the tooltip */
    dd.innerHTML = K.SCALES[scale].map(function (s) {
      return '<button data-tok="' + s[0] + '" class="' + (s[0] === cur ? 'cur' : '') + '"' + (s[1] ? ' title="' + s[1] + '"' : '') + '><span class="ck">' + I('check', 12) + '</span><span class="v">' + (s[0] === 9999 ? 'Full' : scale === 'line' && !s[0] ? 'Auto' : s[0]) + '</span><span class="n">' + (s[1] ? T.shortToken(s[1]) : '') + '</span></button>';
    }).join('');
    dd.hidden = false;
    position();
  }
  T.closeDropdown = function () { endPreview(); dd.hidden = true; ddField = null; };

  /* Hover a value in the list: the element shows it live (nothing is written until you click) */
  var hov = null;
  function previewValue(n) {
    if (!ddField || !S.selected) return;
    if (!hov) { var els = T.targets(); hov = { id: ddField, els: els, before: els.map(function (el) { return new Map(T.stateOf(el).overrides); }) }; }
    if (hov.n === n) return;
    hov.n = n;
    hov.els.forEach(function (el, i) {
      var ch = T.changesFor(hov.id, n, el), pv = new Map(hov.before[i]);
      Object.keys(ch).forEach(function (k) { if (ch[k] === null) pv.delete(k); else pv.set(k, ch[k]); });
      T.renderLive(el, pv);
    });
  }
  function endPreview() {
    var h = hov;
    hov = null;
    if (h) h.els.forEach(function (el, i) { T.renderLive(el, h.before[i]); });
  }
  dd.addEventListener('pointerover', function (e) { var b = e.target.closest('[data-tok]'); if (b) previewValue(+b.getAttribute('data-tok')); });
  dd.addEventListener('pointerleave', endPreview);
  T.dropdownOpen = function () { return !dd.hidden; };
  function position() {
    var f = T.root.querySelector('[data-field="' + ddField + '"]');
    if (!f) { T.closeDropdown(); return; }
    var r = f.getBoundingClientRect(), h = dd.offsetHeight;
    var top = r.bottom + 4 + h > window.innerHeight - 8 ? r.top - 4 - h : r.bottom + 4;
    dd.style.left = Math.min(r.left, window.innerWidth - dd.offsetWidth - 8) + 'px';
    dd.style.top = Math.max(8, top) + 'px';
    dd.style.minWidth = Math.max(96, r.width) + 'px';
  }
  T.frameHooks.push(function () { if (!dd.hidden && ddField) position(); });
  T.action('field-open', function (b, e) { e.preventDefault(); refocus(b.getAttribute('data-id')); });

  dd.addEventListener('pointerdown', function (e) {
    e.preventDefault(); /* keep focus in the field */
    var b = e.target.closest('[data-tok]');
    if (!b || !ddField) return;
    var id = ddField;
    endPreview();
    T.setField(id, +b.getAttribute('data-tok'));
    refocus(id);
  });

  /* ── Field events ── */
  var root = T.root;
  root.addEventListener('focusin', function (e) {
    var id = e.target.getAttribute && e.target.getAttribute('data-input');
    if (id) { e.target.select(); open(id); }
  });
  root.addEventListener('keydown', function (e) {
    var id = e.target.getAttribute && e.target.getAttribute('data-input');
    if (!id || !S.selected) return;
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      T.setField(id, T.step(T.scaleOf(id), T.fieldValue(id), e.key === 'ArrowUp' ? 1 : -1));
      refocus(id);
    } else if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); }
    else if (e.key === 'Escape') { e.preventDefault(); e.target.value = e.target.defaultValue; T.closeDropdown(); e.target.blur(); }
    e.stopPropagation();
  });
  root.addEventListener('focusout', function (e) {
    var id = e.target.getAttribute && e.target.getAttribute('data-input');
    if (!id) return;
    /* only what was typed: a field the inspector redraws after a pick from the list leaves the focus
       with the value it was drawn with, and must not write that old value back */
    if (ddField === id && e.target.isConnected) T.closeDropdown();
    if (e.target.value === e.target.defaultValue) return;
    if (!S.selected) return;
    var raw = e.target.value.trim().toLowerCase(), n;
    if (T.isRatio(id)) {
      /* 1.4 = a ratio; 20 or 20px = px, turned into a ratio of the font size; auto = normal */
      if (/^(auto|normal)$/.test(raw)) n = 0;
      else { n = parseFloat(raw); if (/px$/.test(raw) || n > 4) n = n / parseFloat(getComputedStyle(S.selected).fontSize); n = Math.round(n * 100) / 100; }
    } else n = Math.round(parseFloat(raw));
    if (isNaN(n)) { T.renderInspector(); return; }
    if (n < 0 && !/^(margin|mar-|left|top)/.test(id)) n = 0; /* only margins and X / Y go negative */
    T.setField(id, n);
  });
  root.addEventListener('pointerover', function (e) {
    var f = e.target.closest && e.target.closest('[data-hot]');
    S.hotBox = f ? f.getAttribute('data-hot') || null : null;
  });

  /* ── Scrub: drag a field label left / right through the token scale (one undo step) ── */
  var scrub = null;
  root.addEventListener('pointerdown', function (e) {
    var k = e.target.closest && e.target.closest('[data-scrub]');
    if (!k || !S.selected) return;
    e.preventDefault();
    T.closeDropdown();
    var id = k.getAttribute('data-scrub');
    var els = T.targets();
    scrub = { id: id, x: e.clientX, start: T.fieldValue(id), els: els, before: els.map(function (el) { return new Map(T.stateOf(el).overrides); }), value: null };
  });
  T.scrubbing = function () { return !!scrub; };
  T.scrubMove = function (e) {
    var steps = Math.round((e.clientX - scrub.x) / 8), v = scrub.start, sc = T.scaleOf(scrub.id);
    for (var i = 0; i < Math.abs(steps); i++) v = T.step(sc, v, steps > 0 ? 1 : -1);
    if (v === scrub.value) return;
    scrub.value = v;
    scrub.els.forEach(function (el, i) {
      var ch = T.changesFor(scrub.id, v, el), preview = new Map(scrub.before[i]);
      Object.keys(ch).forEach(function (k) { preview.set(k, ch[k]); });
      T.renderLive(el, preview);
    });
    var input = root.querySelector('[data-input="' + scrub.id + '"]');
    if (input) input.value = v;
  };
  T.scrubEnd = function () {
    var sc = scrub;
    scrub = null;
    if (!sc) return;
    sc.els.forEach(function (el, i) { T.renderLive(el, sc.before[i]); });
    if (sc.value === null || sc.value === sc.start) return;
    var list = sc.els.map(function (el) { return T.ops.style(el, T.changesFor(sc.id, sc.value, el)); });
    T.run(list.length === 1 ? list[0] : T.ops.batch(list));
  };
})(window.DLTweakNS);
