/* Tweak mode — + panel: insert DS components or replace the selection with one. It opens in
   the inspector's place (the inspector comes back when it closes), like the comment list.
   Hover an item → preview inside the panel, under the search (the page does not change).
   Click → insert after the selection (or replace it).
   Drag an item onto the page → drops where the blue line shows. Snippets: library.js. */
(function (T) {
  'use strict';
  var S = T.s, I = T.icon, esc = T.esc;
  var panel = T.$('#library'), mode = 'insert', query = '', preview = null;

  T.openLibrary = function (m) {
    T.closeIconPicker();
    if (T.closeHistory) T.closeHistory();
    mode = m || (S.selected ? 'insert' : 'insert');
    query = '';
    panel.hidden = false;
    render(true);
    T.renderToolbar();
    T.renderInspector();
  };
  T.closeLibrary = function () { if (panel.hidden) return; clearPreview(); panel.hidden = true; T.renderToolbar(); T.renderInspector(); };
  T.libraryOpen = function () { return !panel.hidden; };

  /* Replace acts on the whole control (checkbox + its label) and keeps its text (library.js) */
  function textOf(el) { return T.textOf(el && T.replaceTarget(el)); }

  function render(focus) {
    var q = query.trim().toLowerCase();
    var items = T.LIBRARY.map(function (it, i) { return [it, i]; }).filter(function (x) { return !q || (x[0].name + ' ' + x[0].cat).toLowerCase().indexOf(q) > -1; });
    var target = S.selected ? T.nameOf(mode === 'replace' ? T.replaceTarget(S.selected) : S.selected) : 'page';
    if (!panel.querySelector('#lq')) {
      /* less is more: title, mode, search, list. The preview shows only on hover, over the
         bottom of the list; where it goes is in the mode buttons' tooltip */
      panel.innerHTML = '<div class="ph"><span class="t">Components</span><button class="ib" data-act="library-close" title="Close  Esc">' + I('x', 14) + '</button></div>' +
        '<div class="seg libmode"></div>' +
        '<label class="search">' + I('search', 14) + '<input id="lq" placeholder="Search" spellcheck="false" autocomplete="off" /></label>' +
        '<div class="lib" id="llist" title="Click to apply · drag onto the page"></div>' +
        '<div class="libpreview" id="lpreview"></div>';
    }
    var count = S.selected ? T.targets().length : 0;
    var insTip = S.selected ? 'Insert after ' + target : 'Insert at the end of the page content';
    var repTip = S.selected ? 'Replace ' + (count > 1 ? count + ' × ' : '') + target + (textOf(S.selected) ? (count > 1 ? ' · each keeps its text' : ' · keeps its text') : '') : 'Select an element to replace it';
    panel.querySelector('.libmode').innerHTML =
      '<button data-act="library-mode" data-mode="insert" class="' + (mode === 'insert' ? 'on' : '') + '" title="' + esc(insTip) + '">' + I('plus', 12) + 'Insert</button>' +
      '<button data-act="library-mode" data-mode="replace" class="' + (mode === 'replace' ? 'on' : '') + '"' + (S.selected ? '' : ' disabled') + ' title="' + esc(repTip) + '">' + I('replace', 12) + 'Replace</button>';
    var html = '';
    T.LIBRARY_CATS.forEach(function (cat) {
      var list = items.filter(function (x) { return x[0].cat === cat; });
      if (!list.length) return;
      html += '<div class="libcat">' + cat + '</div>' + list.map(function (x) {
        return '<button class="libitem" data-act="library-pick" data-i="' + x[1] + '" data-lib="' + x[1] + '">' + I(x[0].icon || 'square', 14) + '<span>' + esc(x[0].name) + '</span></button>';
      }).join('');
    });
    panel.querySelector('#llist').innerHTML = html || '<div class="empty">No component matches “' + esc(q) + '”</div>';
    if (focus) { var input = panel.querySelector('#lq'); input.value = ''; setTimeout(function () { input.focus(); }, 0); }
  }

  /* Where a click inserts: after the selection, or at the end of the main content */
  function defaultTarget() {
    if (S.selected && S.selected.isConnected) return { ref: S.selected, pos: 'after' };
    var host = document.querySelector('.rp-content-wrapper, main, .happy') || document.body;
    var script = Array.prototype.filter.call(host.children, function (c) { return c.tagName === 'SCRIPT'; })[0];
    return script ? { ref: script, pos: 'before' } : { ref: host, pos: 'inside' };
  }
  function snippet(i) {
    var it = T.LIBRARY[i];
    return T.fillSnippet(it.html, mode === 'replace' && S.selected ? textOf(S.selected) : '');
  }

  /* ── Preview on hover: rendered in the panel with the page's own stylesheets ── */
  var pvRoot = null, pvLast = -1;
  function previewRoot() {
    var box = panel.querySelector('#lpreview');
    if (!box) return null;
    if (!box.shadowRoot) {
      pvRoot = box.attachShadow({ mode: 'open' });
      var links = Array.prototype.filter.call(document.querySelectorAll('link[rel="stylesheet"]'), function (l) { return /shared\.css|rp-icons\.css/.test(l.getAttribute('href') || ''); });
      pvRoot.innerHTML = links.map(function (l) { return '<link rel="stylesheet" href="' + esc(l.href) + '">'; }).join('') +
        '<style>:host { display: block; } .pv { display: inline-block; padding: 12px; transform-origin: 0 0; font-family: var(--font-family); font-size: 13px; color: var(--text-primary); }' +
        '.pv .rp-dialog-overlay, .pv .rp-drawer-overlay { position: static; display: flex; background: none; padding: 0; } .pv .rp-drawer { position: static; } .pv .rp-menu { display: block; position: static; }</style>' +
        '<div class="pv"></div><slot></slot>';
    }
    return box.shadowRoot;
  }
  function clearPreview() {
    pvLast = -1;
    var r = panel.querySelector('#lpreview');
    if (r) r.classList.remove('on');
    if (r && r.shadowRoot) { var pv = r.shadowRoot.querySelector('.pv'); pv.innerHTML = ''; pv.style.transform = ''; r.style.height = ''; }
  }
  function showPreview(i) {
    if (i === pvLast) return;
    var root = previewRoot();
    if (!root) return;
    pvLast = i;
    var box = panel.querySelector('#lpreview'), pv = root.querySelector('.pv');
    pv.style.transform = ''; pv.style.width = '';
    pv.innerHTML = snippet(i);
    box.classList.add('on');
    /* fit wide components (tables, modals) into the panel */
    var w = pv.scrollWidth, avail = box.clientWidth, sc = w > avail ? avail / w : 1;
    pv.style.transform = sc < 1 ? 'scale(' + sc + ')' : '';
    box.style.height = Math.min(160, Math.ceil(pv.scrollHeight * sc) + 2) + 'px';
  }

  function apply(i, target) {
    clearPreview();
    var it = T.LIBRARY[i], html = snippet(i);
    if (target) T.run(T.ops.insert(html, target.ref, target.pos, it.name));
    else if (mode === 'replace' && S.selected) {
      /* every similar (or ⇧-selected) element, each keeping its own text */
      var n = T.replaceEach(T.replaceTarget, function (el, r) { return T.fillSnippet(it.html, T.textOf(r)); }, it.name);
      T.notify(n > 1 ? n + ' elements replaced with ' + it.name : it.name + ' replaced the selection');
      blurUI();
      return;
    }
    else { var t = defaultTarget(); T.run(T.ops.insert(html, t.ref, t.pos, it.name)); }
    T.notify(it.name + ' added');
    blurUI();
  }
  function blurUI() { var f = T.root.activeElement; if (f && f.blur) f.blur(); } /* so ⌘Z / arrows go to the canvas */

  T.action('library', function (b) {
    var m = b && b.getAttribute && b.getAttribute('data-mode');
    if (!panel.hidden && !m) { T.closeLibrary(); return; }
    T.openLibrary(m || 'insert');
  });
  T.action('library-close', function () { T.closeLibrary(); });
  T.action('library-mode', function (b) { mode = b.getAttribute('data-mode'); clearPreview(); render(); });
  T.action('library-pick', function (b) { if (!S.drag && !S.suppressClick && Date.now() - (S.lastDragEnd || 0) > 300) apply(+b.getAttribute('data-i')); });

  panel.addEventListener('pointerover', function (e) {
    var b = e.target.closest('[data-lib]');
    if (b && !S.drag) showPreview(+b.getAttribute('data-lib'));
  });
  panel.addEventListener('pointerleave', function () { if (!S.drag) clearPreview(); });
  panel.addEventListener('input', function (e) { if (e.target.id === 'lq') { query = e.target.value; render(); } });
  panel.addEventListener('keydown', function (e) {
    if (e.target.id !== 'lq') return;
    if (e.isComposing || e.keyCode === 229) { e.stopPropagation(); return; } /* IME composition */
    if (e.key === 'Escape') { T.closeLibrary(); e.preventDefault(); }
    else if (e.key === 'Enter') { var first = panel.querySelector('[data-lib]'); if (first) apply(+first.getAttribute('data-lib')); e.preventDefault(); }
    e.stopPropagation();
  });

  /* ── Drag from the panel onto the page (drop handled in interactions.js) ── */
  panel.addEventListener('pointerdown', function (e) {
    var b = e.target.closest('[data-lib]');
    if (!b || e.button !== 0) return;
    e.preventDefault();
    var lib = T.LIBRARY[+b.getAttribute('data-lib')], root = T.elementFromHTML(lib.html.replace(/\{\{text\|([^}]*)\}\}/g, '$1'));
    S.drag = { library: +b.getAttribute('data-lib'), name: lib.name, tag: root ? root.tagName : 'DIV', x: e.clientX, y: e.clientY, started: false, target: null };
  });
  T.libraryDrop = function (i, target) { apply(i, target); };
  T.clearLibraryPreview = clearPreview;
  T.on('select', function () { if (!panel.hidden) { clearPreview(); render(); } });
})(window.DLTweakNS);
