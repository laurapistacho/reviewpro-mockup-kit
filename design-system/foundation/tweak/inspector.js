/* Tweak mode — inspector panel shell: header, one-line path, actions, then sections.
   Sections themselves live in sections.js (registered with T.section). */
(function (T) {
  'use strict';
  var S = T.s, I = T.icon, esc = T.esc;
  var panel = T.$('#panel'), menu = T.$('#menu');

  /* ── Selection ── */
  T.select = function (el) {
    if (S.editing) T.stopEditing();
    T.closeDropdown();
    T.closeColorPicker();
    closeMenu();
    S.multi = [];
    S.selected = el && el !== document.body && el !== document.documentElement ? el : null;
    /* S.scope (This one / N Similar) stays as the designer set it, for every next selection */
    if (!S.selected || !T.isIcon(S.selected)) T.closeIconPicker();
    T.renderInspector();
    T.emit('select', S.selected);
  };
  T.siblingEl = function (el, dir) {
    var s = dir < 0 ? el.previousElementSibling : el.nextElementSibling;
    while (s && (T.src.isOwnNode(s) || s.tagName === 'SCRIPT' || s.tagName === 'STYLE')) s = dir < 0 ? s.previousElementSibling : s.nextElementSibling;
    return s;
  };
  T.reorder = function (dir) {
    if (!S.selected) return;
    var other = T.siblingEl(S.selected, dir);
    if (!other) { T.notify(dir < 0 ? 'Already first in its layout' : 'Already last in its layout'); return; }
    T.run(T.ops.move(S.selected, other, dir < 0 ? 'before' : 'after'));
  };

  /* ── Small menu (path overflow) ── */
  /* items: { label, act, data, comp, on (check mark), hint (right-aligned) } */
  function openMenu(anchor, items) {
    menu.innerHTML = items.map(function (it) {
      if (it.sep) return '<div class="msep"></div>';
      return '<button data-act="' + it.act + '"' + (it.data ? ' data-arg="' + esc(it.data) + '"' : '') + ' class="' + (it.comp ? 'comp' : '') + '">' +
        (it.comp ? I('component', 12) : it.on ? I('check', 12) : '<span class="sp"></span>') + esc(it.label) +
        (it.hint ? '<span class="mhint">' + esc(it.hint) + '</span>' : '') + '</button>';
    }).join('');
    menu.hidden = false;
    var r = anchor.getBoundingClientRect();
    menu.style.left = Math.max(8, Math.min(r.left, window.innerWidth - menu.offsetWidth - 8)) + 'px';
    menu.style.top = (r.bottom + 4) + 'px';
  }
  function closeMenu() { menu.hidden = true; }
  T.openMenu = openMenu;
  T.closeMenu = closeMenu;
  T.menuOpen = function () { return !menu.hidden; };

  function ancestors(el) {
    var chain = [], p = el.parentElement;
    while (p && p !== document.body && p !== document.documentElement) { chain.unshift(p); p = p.parentElement; }
    return chain;
  }

  T.dockButton = function () {
    return '<button class="ib" data-act="dock" title="' + (S.dockLeft ? 'Move panel to the right' : 'Move panel to the left') + '">' + I(S.dockLeft ? 'panel-right' : 'panel-left', 14) + '</button>';
  };

  /* The + panel (library-panel.js) takes the inspector's place, like the comment list */
  var CRUMBS = 3; /* parents shown in the path; the rest under … */
  T.renderInspector = function () {
    var lib = T.libraryOpen && T.libraryOpen();
    panel.className = 'panel surface' + (S.dockLeft ? ' left' : '');
    T.$('#iconpicker').classList.toggle('left', S.dockLeft);
    T.$('#library').classList.toggle('left', S.dockLeft);
    panel.hidden = S.tool === 'interact' || lib;
    if (S.tool === 'comment' && T.renderCommentsPanel) { if (!lib) T.renderCommentsPanel(panel); return; }
    var el = S.selected;
    T.refreshSimilar();
    /* nothing selected: no panel (the toolbar has the tools and +) */
    if (!el || !el.isConnected) { T.closeIconPicker(); panel.hidden = true; panel.innerHTML = ''; return; }
    var comp = T.componentOf(el), ctx = { cs: getComputedStyle(el), comp: comp, overrides: T.overridesOf(el), custom: T.customOf(el) };
    /* changed-value dots and reset icons only on DS components: on a plain div the inline style is its design.
       A dot = the value differs from the component's design: changed now or already in the file */
    ctx.mod = function (p) { return !!comp && T.customHas(ctx.custom, p); };

    if (T.isMulti()) { panel.innerHTML = multiHeader(ctx) + sectionsHtml(el, ctx); T.renderIconPicker(); return; }
    /* path above the name: … / parents (click one to select it) and the dock button, a divider, then
     the element itself as the name */
    var chain = ancestors(el), shown = chain.slice(-CRUMBS), hidden = chain.length - shown.length, html = '';
    if (chain.length) {
      html += '<div class="phtop"><div class="crumbs">' + (hidden ? '<button data-act="crumbs-more" title="More parents">…</button><span>/</span>' : '') +
        shown.map(function (c, i) {
          var up = shown.length - i, isC = !!T.componentOf(c);
          /* far parents give up their width first; the nearest parent stays readable */
          return (i ? '<span>/</span>' : '') + '<button data-act="crumb" data-up="' + up + '" class="' + (isC ? 'comp' : '') + '" style="flex-shrink:' + (up === 1 ? 0 : up) + '" title="' + esc(T.nameOf(c)) + '">' + (isC ? I('component', 10) : '') + '<em>' + esc(T.nameOf(c)) + '</em></button>';
        }).join('') + '</div>' + T.dockButton() + '</div>';
    }
    /* the name opens the component menu: swap to a similar component, replace, insert, edit… */
    html += '<div class="ph ' + (chain.length ? 'under' : 'top') + '"><button class="t namebtn' + (comp ? ' comp' : '') + '" data-act="comp-menu" title="Swap, replace or edit ' + esc(T.nameOf(el)) + '">' + (comp ? I('component', 14) : '') + '<span>' + esc(T.nameOf(el)) + '</span>' + I('chevron-down', 12) + '</button>' +
      (chain.length ? '' : T.dockButton()) + '</div>';
    html += T.scopeBar();
    panel.innerHTML = html + sectionsHtml(el, ctx);
    /* a cut name fades out at the end (a mask, not "…": three dots alone say nothing) */
    panel.querySelectorAll('.crumbs em').forEach(function (e) { e.classList.toggle('cut', e.scrollWidth > e.clientWidth + 1); });
    T.renderIconPicker();
  };
  /* Sections render for the first selected element; with several selected a section shows only
     when it applies to all of them (sec.multi === false hides it), values come from T.common */
  function sectionsHtml(el, ctx) {
    var html = '', all = T.selection();
    T.sections.forEach(function (sec) {
      try {
        if (all.length > 1 && (sec.multi === false || !all.every(function (o) { return sec.when(o, o === el ? ctx : { cs: getComputedStyle(o), comp: T.componentOf(o), overrides: T.overridesOf(o) }); }))) return;
        if (sec.when(el, ctx)) html += sec.render(el, ctx);
      } catch (err) { console.error('[Tweak] section ' + sec.id, err); }
    });
    return html;
  }
  /* Header for several selected elements, no path, no scope bar (edits change all of them):
     same kind → its name + "+N Selected" tag (the others); different kinds → just "N selected" as the name */
  function multiHeader(ctx) {
    var all = T.selection(), name = T.common(T.nameOf), tip = ' title="⇧-click adds or removes · edits change all of them"';
    if (name === T.MIXED) return '<div class="ph top"><span class="t"' + tip + '><span class="nm">' + all.length + ' selected</span></span>' + T.dockButton() + '</div>';
    return '<div class="ph top"><span class="t' + (ctx.comp ? ' comp' : '') + '">' + (ctx.comp ? I('component', 14) : '') + '<span class="nm">' + esc(name) + '</span>' +
      '<span class="seltag"' + tip + '>+' + (all.length - 1) + ' Selected</span></span>' + T.dockButton() + '</div>';
  }

  /* ── Actions ── */
  T.action('dock', function () { S.dockLeft = !S.dockLeft; T.store.set('dl-tweak-dock', S.dockLeft ? 'left' : 'right'); T.renderInspector(); });
  T.action('parent', function () { if (S.selected) T.select(S.selected.parentElement); });
  T.action('crumb', function (b) { var n = +b.getAttribute('data-up'), t = S.selected; while (n-- && t.parentElement) t = t.parentElement; T.select(t); });
  T.action('crumbs-more', function (b) {
    var chain = ancestors(S.selected), hiddenOnes = chain.slice(0, -CRUMBS);
    openMenu(b, hiddenOnes.reverse().map(function (c) { return { label: T.nameOf(c), act: 'crumb-menu', data: String(chain.indexOf(c)), comp: !!T.componentOf(c) }; }));
  });
  T.action('crumb-menu', function (b) { var chain = ancestors(S.selected); closeMenu(); T.select(chain[+b.getAttribute('data-arg')]); });
  T.action('move', function (b) { T.reorder(+b.getAttribute('data-dir')); });
  T.action('dup', function () { if (S.selected) T.run(T.ops.dup(S.selected)); });
  T.deleteSelection = function () {
    var all = T.selection();
    if (!all.length) return;
    T.run(all.length === 1 ? T.ops.del(all[0]) : T.ops.batch(all.map(function (o) { return T.ops.del(o); })));
    if (S.selected && !S.selected.isConnected) T.select(null);
  };
  T.action('delete', function () { T.deleteSelection(); });
  T.action('edit-text', function () { if (S.selected) T.startEditing(S.selected); });
  /* component menu (the name in the header) */
  T.action('comp-menu', function (b) {
    var el = S.selected; if (!el) return;
    var sw = T.swapOf && T.swapOf(el), items = [];
    if (sw) {
      sw.options.forEach(function (o) { items.push({ label: o.label, act: 'swap', data: o.id, on: o.id === sw.current }); });
      items.push({ sep: true });
    }
    items.push({ label: 'Replace with component…', act: 'menu-library', data: 'replace', hint: '⇧I' });
    items.push({ label: 'Insert component after…', act: 'menu-library', data: 'insert', hint: 'I' });
    if (T.directTextNodes(el).length) items.push({ label: 'Edit text', act: 'edit-text', hint: 'Double-click' });
    items.push({ label: 'Wrap in auto layout', act: 'wrap', hint: '⇧A' });
    items.push({ label: 'Duplicate', act: 'dup', hint: '⌘D' });
    var nCustom = T.componentOf(el) ? T.customOf(el).size : 0;
    if (nCustom) items.push({ label: 'Reset all changes', act: 'reset-all', hint: nCustom === 1 ? '1 style' : nCustom + ' styles' });
    items.push({ sep: true }, { label: 'Delete', act: 'delete', hint: '⌫' });
    openMenu(b, items);
  });
  T.action('menu-library', function (b) { T.openLibrary(b.getAttribute('data-arg')); });
  /* back to the component's design: every inline style on it goes (this session's and the file's) */
  T.action('reset-all', function () { T.runEach(function (el) { return T.componentOf(el) ? T.resetOp(el) : null; }); });
})(window.DLTweakNS);
