/* Tweak mode — size: W / H fields (Fixed · Hug · Fill, like Figma) and resize handles on the
   selection. Sizes are free px values, not tokens.

   Where the size is written depends on the layout around the element:
   - grid item in an explicit track (e.g. a 448px sidebar column): the parent's
     grid-template-columns / -rows change, because the track decides the size
   - flex item on the main axis: width / height + flex: none (Fixed) or flex: 1 1 0% (Fill)
   - anything else: width / height (Hug = fit-content / auto, Fill = auto / 100%)
   Edits apply to the selection and its similar elements (similar.js), as one undo step. */
(function (T) {
  'use strict';
  var S = T.s, I = T.icon, esc = T.esc;
  var AX = {
    w: { size: 'width', min: 'min-width', max: 'max-width', track: 'grid-template-columns', gap: 'columnGap', start: 'left', end: 'right', dim: 'width', key: 'W', name: 'Width', line: 'column' },
    h: { size: 'height', min: 'min-height', max: 'max-height', track: 'grid-template-rows', gap: 'rowGap', start: 'top', end: 'bottom', dim: 'height', key: 'H', name: 'Height', line: 'row' }
  };
  var MODES = { fixed: 'Fixed', hug: 'Hug', fill: 'Fill' };
  var SIZE_PROPS = ['width', 'height', 'min-width', 'max-width', 'min-height', 'max-height', 'flex', 'flex-shrink', 'align-self'];
  var TRACK_PROPS = ['grid-template-columns', 'grid-template-rows'];

  T.sizeable = function (el, cs) {
    if (!el || !el.isConnected || el === document.body || el === document.documentElement) return false;
    cs = cs || getComputedStyle(el);
    return !/^(inline|contents|none|table-row|table-row-group|table-header-group|table-footer-group|table-column|table-column-group)$/.test(cs.display);
  };

  /* Authored value of a property: inline style, then the page's readable style rules (last match
     wins, specificity ignored). Returns '' when nothing sets it, null when a stylesheet could not
     be read (linked sheets on file:// are off limits to scripts) and nothing readable sets it. */
  function scan(rules, el, prop) {
    var hit = '';
    for (var j = 0; j < rules.length; j++) {
      var r = rules[j];
      if (r.cssRules && !r.selectorText) {
        if (r.media && r.media.mediaText && !window.matchMedia(r.media.mediaText).matches) continue;
        var h = scan(r.cssRules, el, prop);
        if (h) hit = h;
        continue;
      }
      if (!r.selectorText || !r.style) continue;
      var v = r.style.getPropertyValue(prop);
      if (!v) continue;
      try { if (el.matches(r.selectorText)) hit = v.trim(); } catch (e) { /* pseudo-element selector */ }
    }
    return hit;
  }
  function authored(el, prop, skipInline) {
    if (!skipInline) { var inl = el.style.getPropertyValue(prop); if (inl) return inl.trim(); }
    var found = '', blind = false;
    for (var i = 0; i < document.styleSheets.length; i++) {
      var sheet = document.styleSheets[i], rules;
      if (/fonts\.googleapis\.com/.test(sheet.href || '')) continue; /* @font-face only */
      try { rules = sheet.cssRules; } catch (e) { blind = true; continue; }
      if (!rules) continue;
      found = scan(rules, el, prop) || found;
    }
    return found || (blind ? null : '');
  }
  /* Run fn with one property forced inline, then put the style attribute back exactly as it was */
  function withStyle(el, prop, value, fn) {
    var attr = el.getAttribute('style');
    el.style.setProperty(prop, value, 'important');
    try { return fn(); } finally { if (attr === null) el.removeAttribute('style'); else el.setAttribute('style', attr); }
  }

  /* ── Grid tracks ── */
  function splitTracks(spec) {
    var out = [], depth = 0, cur = '';
    for (var i = 0; i < spec.length; i++) {
      var c = spec[i];
      if (c === '(') depth++; else if (c === ')') depth--;
      if (/\s/.test(c) && !depth) { if (cur) out.push(cur); cur = ''; } else cur += c;
    }
    if (cur) out.push(cur);
    return out;
  }
  /* "200px repeat(2, 1fr)" → ['200px', '1fr', '1fr']; null for auto-fill / line names / areas */
  function explicitTracks(spec) {
    if (!spec || /\[|subgrid|masonry|auto-fill|auto-fit|^none$/.test(spec)) return null;
    var out = [];
    var ok = splitTracks(spec).every(function (t) {
      var m = /^repeat\(\s*(\d+)\s*,(.*)\)$/.exec(t);
      if (!m) { out.push(t); return true; }
      var inner = splitTracks(m[2].trim());
      for (var k = 0; k < +m[1]; k++) out = out.concat(inner);
      return inner.length > 0;
    });
    return ok ? out : null;
  }
  /* { parent, a, index, sizes, tracks } when el fills exactly one track of its grid parent.
     tracks = authored track list (null when the stylesheet cannot be read: rebuilt from px). */
  function gridSlot(el, a) {
    var p = el.parentElement;
    if (!p || p === document.documentElement) return null;
    var pcs = getComputedStyle(p), cs = getComputedStyle(el), A = AX[a];
    if (!/grid/.test(pcs.display) || /absolute|fixed/.test(cs.position)) return null;
    var sizes = splitTracks(pcs.getPropertyValue(A.track).trim()).map(parseFloat);
    if (!sizes.length || sizes.some(isNaN)) return null;
    var spec = authored(p, A.track), tracks = null;
    if (spec === '') return null; /* implicit tracks: the item's own size decides */
    if (spec !== null) { tracks = explicitTracks(spec); if (!tracks || tracks.length !== sizes.length) return null; }
    else {
      /* unreadable stylesheet: grid-auto-* only resizes implicit tracks, so a probe value finds the explicit ones */
      var probe = withStyle(p, a === 'w' ? 'grid-auto-columns' : 'grid-auto-rows', '3.5px', function () {
        return splitTracks(getComputedStyle(p).getPropertyValue(A.track).trim()).map(parseFloat);
      });
      var explicit = 0;
      while (explicit < sizes.length && !(Math.abs(probe[explicit] - 3.5) < 0.01 && Math.abs(sizes[explicit] - 3.5) > 0.01)) explicit++;
      if (!explicit) return null;
      sizes = sizes.slice(0, explicit);
    }
    var pr = p.getBoundingClientRect(), r = el.getBoundingClientRect(), gap = parseFloat(pcs[A.gap]) || 0;
    var pos = pr[A.start] + (a === 'w' ? parseFloat(pcs.borderLeftWidth) + parseFloat(pcs.paddingLeft) - p.scrollLeft : parseFloat(pcs.borderTopWidth) + parseFloat(pcs.paddingTop) - p.scrollTop);
    for (var i = 0; i < sizes.length; i++) {
      if (Math.abs(r[A.start] - pos) < 1.5) return Math.abs(r[A.end] - (pos + sizes[i])) < 1.5 ? { parent: p, a: a, index: i, sizes: sizes, tracks: tracks } : null;
      pos += sizes[i] + gap;
    }
    return null;
  }
  function template(slot, idxs, mode, n) {
    var t = slot.tracks ? slot.tracks.slice() : slot.sizes.map(function (s) { return Math.round(s) + 'px'; });
    idxs.forEach(function (i) { t[i] = mode === 'fixed' ? Math.max(0, Math.round(n)) + 'px' : mode === 'hug' ? 'auto' : '1fr'; });
    return t.join(' ');
  }

  /* ── Layout context of an element on one axis (snapshot: previews must not read their own output) ── */
  function px(v) { return parseFloat(v) || 0; }
  function ctxOf(el, a) {
    var cs = getComputedStyle(el), p = el.parentElement, pcs = p ? getComputedStyle(p) : null, A = AX[a];
    var abs = /absolute|fixed/.test(cs.position), flex = !!pcs && /flex/.test(pcs.display) && !abs;
    var as = cs.alignSelf === 'auto' || cs.alignSelf === 'normal' ? (pcs ? pcs.alignItems : 'normal') : cs.alignSelf;
    return {
      flex: flex, main: flex && ((pcs.flexDirection.indexOf('row') === 0) === (a === 'w')), abs: abs,
      grow: px(cs.flexGrow), shrink: px(cs.flexShrink), basis: cs.flexBasis, stretch: /stretch|normal/.test(as),
      contentBox: cs.boxSizing === 'content-box',
      extra: a === 'w' ? px(cs.paddingLeft) + px(cs.paddingRight) + px(cs.borderLeftWidth) + px(cs.borderRightWidth) : px(cs.paddingTop) + px(cs.paddingBottom) + px(cs.borderTopWidth) + px(cs.borderBottomWidth),
      max: cs.getPropertyValue(A.max), min: cs.getPropertyValue(A.min),
      blockFill: !abs && cs.cssFloat === 'none' && /^(block|flex|grid|table|list-item|flow-root)$/.test(cs.display)
    };
  }
  /* 'auto' when something else sets the size (original inline style or a stylesheet), else null = drop the override */
  function autoVal(el, prop) {
    var orig = T.stateOf(el).original || '';
    if (T.src.splitDecls(orig).some(function (d) { return d[0] === prop; })) return 'auto';
    return authored(el, prop, true) === '' ? null : 'auto';
  }
  T.sizeMode = function (el, a) {
    var slot = gridSlot(el, a);
    if (slot) { if (!slot.tracks) return null; var t = slot.tracks[slot.index]; return /\dfr/.test(t) ? 'fill' : /^(auto|min-content|max-content|fit-content)/.test(t) ? 'hug' : 'fixed'; }
    var c = ctxOf(el, a), v = authored(el, AX[a].size);
    if (c.main && c.grow > 0) return 'fill';
    if (v && /^(100%|stretch|-webkit-fill-available)$/.test(v)) return 'fill';
    if (v && /content/.test(v)) return 'hug';
    if (v && v !== 'auto') return 'fixed';
    if (v === null) {
      /* an unreadable stylesheet (shared.css on file://) may set it: does forcing auto change the size? */
      var dim = AX[a].dim, was = el.getBoundingClientRect()[dim];
      if (Math.abs(withStyle(el, AX[a].size, 'auto', function () { return el.getBoundingClientRect()[dim]; }) - was) > 0.5) return 'fixed';
    }
    if (c.flex) return c.main ? 'hug' : c.stretch ? 'fill' : 'hug';
    return a === 'w' && c.blockFill ? 'fill' : 'hug';
  };

  /* ── Plans: Map(element → style changes), then one op per element in one undo step ── */
  function prepare(a, single) {
    return T.targets(single).map(function (el) {
      var slot = gridSlot(el, a);
      return { el: el, a: a, slot: slot, c: slot ? null : ctxOf(el, a), auto: slot ? null : autoVal(el, AX[a].size) };
    });
  }
  function merge(plan, el, ch) { plan.set(el, Object.assign(plan.get(el) || {}, ch)); }
  function flowChanges(p, mode, n) {
    var A = AX[p.a], c = p.c, ch = {};
    if (mode === 'fixed') {
      ch[A.size] = Math.max(0, Math.round(c.contentBox ? n - c.extra : n)) + 'px';
      if (/px$/.test(c.max) && px(c.max) < n) ch[A.max] = 'none';
      if (/px$/.test(c.min) && px(c.min) > n) ch[A.min] = '0';
      if (c.main && (c.grow > 0 || c.basis !== 'auto')) ch.flex = 'none';
      else if (c.main && c.shrink > 0) ch['flex-shrink'] = '0';
    } else if (mode === 'hug') {
      ch[A.size] = p.auto;
      if (c.main && (c.grow > 0 || c.basis !== 'auto')) ch.flex = 'none';
      else if (c.flex && !c.main && c.stretch) ch['align-self'] = 'flex-start';
      else if (!c.flex && p.a === 'w' && c.blockFill) ch.width = 'fit-content';
    } else {
      ch[A.size] = p.auto;
      if (c.main) { ch.flex = '1 1 0%'; ch[A.min] = '0'; }
      else if (c.flex) ch['align-self'] = 'stretch';
      else if (p.a === 'h' || !c.blockFill) ch[A.size] = '100%';
    }
    return ch;
  }
  function buildPlan(prep, mode, n, plan) {
    var grids = new Map();
    prep.forEach(function (p) {
      if (!p.slot) { merge(plan, p.el, flowChanges(p, mode, n)); return; }
      var g = grids.get(p.slot.parent);
      if (!g) grids.set(p.slot.parent, g = { slot: p.slot, idx: [] });
      if (g.idx.indexOf(p.slot.index) < 0) g.idx.push(p.slot.index);
    });
    grids.forEach(function (g, parent) { var ch = {}; ch[AX[g.slot.a].track] = template(g.slot, g.idx, mode, n); merge(plan, parent, ch); });
    return plan;
  }
  function runPlan(plan) {
    var list = [];
    plan.forEach(function (ch, el) { list.push(T.ops.style(el, ch)); });
    if (list.length) T.run(list.length === 1 ? list[0] : T.ops.batch(list));
  }
  function current(a) { return Math.round(S.selected.getBoundingClientRect()[AX[a].dim]); }
  T.setSize = function (a, mode, n) {
    if (!S.selected) return;
    if (mode === 'fixed' && n === undefined) n = current(a);
    runPlan(buildPlan(prepare(a), mode, n, new Map()));
  };
  /* Several axes and extra style changes in one undo step (text resizing):
     spec = { w: 'fixed' | 'hug' | 'fill', h: … } (fixed = the selection's size now),
     extra(el) = more changes per target, e.g. { 'white-space': 'nowrap' } */
  T.setSizes = function (spec, extra) {
    if (!S.selected) return;
    var plan = new Map();
    Object.keys(spec).forEach(function (a) { buildPlan(prepare(a), spec[a], spec[a] === 'fixed' ? current(a) : undefined, plan); });
    if (extra) T.targets().forEach(function (el) { var ch = extra(el); if (ch && Object.keys(ch).length) merge(plan, el, ch); });
    runPlan(plan);
  };

  /* ── Inspector section ── */
  function modified(el, a) {
    if (!T.componentOf(el)) return false; /* dots and reset only on DS components */
    var cu = T.customOf(el), A = AX[a], p = el.parentElement;
    return [A.size, A.min, A.max, 'flex', 'flex-shrink', 'align-self'].some(function (k) { return T.customHas(cu, k); }) || !!(p && T.overridesOf(p).has(A.track));
  }
  function sfield(el, a, mode) {
    var A = AX[a], mixed = T.common(function (o) { return Math.round(o.getBoundingClientRect()[A.dim]); }) === T.MIXED;
    mode = T.common(function (o) { return T.sizeMode(o, a); });
    if (mode === T.MIXED) mode = null;
    return '<label class="f' + (modified(el, a) ? ' mod' : '') + (mixed ? ' mixed' : '') + '" data-sfield="' + a + '" title="' + A.name + ' in px · ↑↓ ±1, ⇧ ±10 · drag the letter or the selection edge · type hug or fill">' +
      '<span class="k" data-sscrub="' + a + '">' + A.key + '</span>' +
      '<input data-sinput="' + a + '" value="' + (mixed ? '' : current(a)) + '"' + (mixed ? ' placeholder="Mix"' : '') + ' inputmode="numeric" spellcheck="false" autocomplete="off" />' +
      (mode ? '<span class="tok">' + MODES[mode] + '</span>' : '') +
      '<span class="chev" data-act="size-menu" data-axis="' + a + '">' + I('chevron-down', 12) + '</span></label>';
  }
  T.section({
    id: 'size', order: 15,
    when: function (el, ctx) { return T.sizeable(el, ctx.cs); },
    /* a grid item's W / H = its track (Fixed px, Hug = auto, Fill = 1fr): no extra note */
    render: function (el, ctx) {
      var any = T.targets().some(function (t) { return modified(t, 'w') || modified(t, 'h'); });
      /* [W] [H] [ignore auto layout] like Padding's sides button; X / Y below when it is out of the layout (position.js) */
      return T.sec2('Size', '<div class="grid3">' + sfield(el, 'w', T.sizeMode(el, 'w')) + sfield(el, 'h', T.sizeMode(el, 'h')) + (T.ignoreALButton ? T.ignoreALButton(el, ctx) : '<span></span>') + '</div>' +
        (T.absFields ? T.absFields(el, ctx) : ''), { reset: any ? 'size-reset' : null });
    }
  });

  T.action('size-menu', function (b, e) {
    e.preventDefault();
    var a = b.getAttribute('data-axis'), mode = T.sizeMode(S.selected, a);
    T.openMenu(b, [
      { label: 'Fixed', act: 'size-mode', data: a + ':fixed', on: mode === 'fixed', hint: current(a) + ' px' },
      { label: 'Hug contents', act: 'size-mode', data: a + ':hug', on: mode === 'hug' },
      { label: 'Fill container', act: 'size-mode', data: a + ':fill', on: mode === 'fill' }
    ]);
  });
  T.action('size-mode', function (b) {
    var v = b.getAttribute('data-arg').split(':');
    T.closeMenu();
    T.setSize(v[0], v[1]);
  });
  T.action('size-reset', function () {
    var plan = new Map();
    T.targets().forEach(function (el) {
      var ch = T.componentOf(el) ? T.resetChanges(el, function (k) { return SIZE_PROPS.indexOf(k) > -1 || /^flex(-|$)/.test(k); }) : null, p = el.parentElement;
      if (ch) merge(plan, el, ch);
      if (!p) return;
      var po = T.overridesOf(p), pc = {};
      TRACK_PROPS.forEach(function (k) { if (po.has(k)) pc[k] = null; });
      if (Object.keys(pc).length) merge(plan, p, pc);
    });
    runPlan(plan);
  });

  /* ── W / H inputs ── */
  var root = T.root;
  function axisOf(e) { return e.target.getAttribute && e.target.getAttribute('data-sinput'); }
  function refocus(a) { var f = root.querySelector('[data-sinput="' + a + '"]'); if (f) { f.focus(); f.select(); } }
  root.addEventListener('focusin', function (e) { if (axisOf(e)) e.target.select(); });
  root.addEventListener('keydown', function (e) {
    var a = axisOf(e);
    if (!a || !S.selected) return;
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      var cur = parseFloat(e.target.value);
      if (isNaN(cur)) cur = current(a);
      T.setSize(a, 'fixed', Math.max(0, Math.round(cur) + (e.key === 'ArrowUp' ? 1 : -1) * (e.shiftKey ? 10 : 1)));
      refocus(a);
    } else if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); }
    else if (e.key === 'Escape') { e.preventDefault(); e.target.setAttribute('data-cancel', ''); e.target.blur(); T.renderInspector(); }
    e.stopPropagation();
  });
  root.addEventListener('focusout', function (e) {
    var a = axisOf(e);
    if (!a || !S.selected || e.target.hasAttribute('data-cancel') || e.target.value === e.target.defaultValue) return; /* only what was typed */
    var v = e.target.value.trim().toLowerCase();
    if (/^(hug|auto|fit)/.test(v)) { T.setSize(a, 'hug'); return; }
    if (/^(fill|100%)/.test(v)) { T.setSize(a, 'fill'); return; }
    var n = Math.round(parseFloat(v));
    if (isNaN(n) || n < 0) { T.renderInspector(); return; }
    if (T.isMulti() || n !== current(a) || T.sizeMode(S.selected, a) !== 'fixed') T.setSize(a, 'fixed', n);
  });

  /* ── Resize sessions: selection edges / corners, or scrubbing the W / H letter ── */
  var rs = null;
  T.resizing = function () { return !!rs; };
  root.addEventListener('pointerdown', function (e) {
    var h = e.target.closest && e.target.closest('[data-rz], [data-sscrub]');
    if (!h || !S.selected || e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    T.closeMenu();
    T.closeDropdown();
    var dir = h.getAttribute('data-rz'), scrubAxis = h.getAttribute('data-sscrub'), r = S.selected.getBoundingClientRect();
    var axes = scrubAxis ? [scrubAxis] : ['w', 'h'].filter(function (a) { return a === 'w' ? /[ew]/.test(dir) : /[ns]/.test(dir); });
    var sign = { w: dir && dir.indexOf('w') > -1 ? -1 : 1, h: dir && dir.indexOf('n') > -1 ? -1 : 1 };
    var prep = {}, before = new Map();
    axes.forEach(function (a) {
      prep[a] = prepare(a);
      prep[a].forEach(function (p) {
        [p.el, p.slot && p.slot.parent].forEach(function (t) { if (t && !before.has(t)) before.set(t, new Map(T.stateOf(t).overrides)); });
      });
    });
    rs = { axes: axes, prep: prep, before: before, sign: sign, scrub: !!scrubAxis, x: e.clientX, y: e.clientY, start: { w: r.width, h: r.height }, vals: null, plan: null };
  });
  T.resizeMove = function (e) {
    var snap = e.shiftKey ? 8 : 1, vals = {}, plan = new Map(), key = '';
    rs.axes.forEach(function (a) {
      var d = rs.scrub || a === 'w' ? e.clientX - rs.x : e.clientY - rs.y;
      vals[a] = Math.max(0, Math.round((rs.start[a] + rs.sign[a] * d) / snap) * snap);
      key += a + vals[a];
      buildPlan(rs.prep[a], 'fixed', vals[a], plan);
    });
    if (key === rs.key) return;
    rs.key = key; rs.vals = vals; rs.plan = plan;
    rs.before.forEach(function (ov, t) {
      var ch = plan.get(t), preview = new Map(ov);
      if (ch) Object.keys(ch).forEach(function (k) { if (ch[k] === null) preview.delete(k); else preview.set(k, ch[k]); });
      T.renderLive(t, preview);
    });
    Object.keys(vals).forEach(function (a) { var f = root.querySelector('[data-sinput="' + a + '"]'); if (f) f.value = vals[a]; });
  };
  T.resizeEnd = function () {
    var s = rs;
    rs = null;
    if (!s) return;
    s.before.forEach(function (ov, t) { T.renderLive(t, ov); });
    if (s.plan) runPlan(s.plan); else T.renderInspector();
  };

  /* Handles are live only for sizeable selections; edge strips need room so clicks still reach small elements */
  var ovSel = T.$('.ov.sel');
  T.frameHooks.push(function () {
    var el = S.selected, cls = 'ov sel';
    if (rs) cls += ' rz rz-ns rz-ew';
    else if (el && el.isConnected && S.tool === 'select' && !S.editing && !S.drag && T.sizeable(el)) {
      var r = el.getBoundingClientRect();
      cls += ' rz' + (r.width >= 24 && r.height >= 12 ? ' rz-ns' : '') + (r.height >= 24 && r.width >= 12 ? ' rz-ew' : '');
    }
    if (ovSel.className !== cls) ovSel.className = cls;
  });
})(window.DLTweakNS);
