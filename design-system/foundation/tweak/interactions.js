/* Tweak mode — pointer + keyboard on the page: selection, text editing, drag & drop
   (moving the selection or dropping a library component), shortcuts. All listeners are
   capture-phase on window so page handlers do not fire while selecting. */
(function (T) {
  'use strict';
  var S = T.s;
  var ovGhost = T.$('.ghost');

  function fromUI(e) { return e.composedPath && e.composedPath().indexOf(T.host) > -1; }
  function pageTarget(e) {
    var t = e.target;
    if (t && t.nodeType === 3) t = t.parentElement;
    if (t && t.closest && t.closest('svg')) t = t.closest('svg'); /* an svg is one layer */
    return t && t !== T.host ? t : null;
  }

  /* ── What a click selects, like Figma ──
     Click: the outermost layer under the pointer, at the depth you are working at: a child of the
     page's top frame, or of the selection's parent / grandparent… (another card → that card;
     a sibling in the same card → that sibling). Each click inside the selection goes one level
     deeper (padding / gap: the nearest child). Double-click: one deeper, or edit text. ⌘-click (Ctrl on Windows): the deepest layer right away.
     The top frame = the page's single wrapper(s): like a top-level frame in Figma it is not
     picked by clicking inside it (Esc from its children selects it). */
  function layerKids(el) {
    return Array.prototype.filter.call(el.children, function (k) {
      return k !== T.host && !T.src.isOwnNode(k) && !/^(SCRIPT|STYLE|LINK|META|TEMPLATE|NOSCRIPT)$/.test(k.tagName) && getComputedStyle(k).display !== 'none';
    });
  }
  T.topFrame = function () {
    var r = document.body;
    for (var i = 0; i < 6; i++) { var k = layerKids(r); if (k.length !== 1) break; r = k[0]; }
    return r;
  };
  /* HTML has layers a designer never drew: page shells, body grids, column wrappers. A click
     passes through them to the first layer that looks like something on the canvas:
       - a wrapper that fills the screen (≥ 90 % wide and ≥ 60 % high in view),
       - a full-height region (≥ 85 % of the view's height, ≥ 25 % of its area: sidebars, columns),
       - anything covering half the view or more (content panes),
       - a big invisible box (no fill, border or shadow; ≥ 30 % of the view),
       - a box with one child and nothing of its own to see (no fill / border / shadow / text).
     DS components (cards, tables, panels) are always layers. Wrappers stay reachable with Esc
     (parent) or ⌘-click into empty space inside them. */
  function seen(cs) {
    var bw = parseFloat(cs.borderTopWidth) + parseFloat(cs.borderRightWidth) + parseFloat(cs.borderBottomWidth) + parseFloat(cs.borderLeftWidth);
    return !/^(rgba\(0, 0, 0, 0\)|transparent)$/.test(cs.backgroundColor) || cs.backgroundImage !== 'none' || cs.boxShadow !== 'none' || (bw > 0 && cs.borderTopStyle + cs.borderBottomStyle + cs.borderLeftStyle + cs.borderRightStyle !== 'nonenonenonenone');
  }
  function inView(n) {
    var r = n.getBoundingClientRect(), vw = window.innerWidth, vh = window.innerHeight;
    var w = Math.max(0, Math.min(r.right, vw) - Math.max(r.left, 0)), h = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0));
    return { w: w / vw, h: h / vh, a: w * h / (vw * vh) };
  }
  function passThrough(n) {
    if (T.directTextNodes(n).length) return false;
    var k = layerKids(n);
    if (!k.length) return false;
    if (/^(TBODY|THEAD|TFOOT)$/.test(n.tagName)) return true; /* table → row → cell, like Figma */
    if (T.componentOf(n)) return false;                      /* a DS component is a layer */
    if (/^(BUTTON|A|LABEL|SELECT)$/.test(n.tagName)) return false; /* controls are layers, even with one child */
    var v = inView(n), cs = getComputedStyle(n);
    if (v.w >= 0.9 && v.h >= 0.6) return true;               /* fills the screen */
    if (v.h >= 0.85 && v.a >= 0.25) return true;             /* full-height column or region */
    if (v.a >= 0.5) return true;                             /* half the screen or more: a content pane */
    if (!seen(cs) && (v.a >= 0.3 || k.length === 1)) return true; /* big or single-child invisible box */
    return false;
  }
  /* from n down toward the clicked element t, past every pass-through wrapper */
  function unwrap(n, t) {
    for (var i = 0; n && n !== t && i < 24 && passThrough(n); i++) {
      var c = t; while (c && c.parentElement !== n) c = c.parentElement;
      if (!c) break;
      n = c;
    }
    return n;
  }
  /* Empty space (a gap, padding, the background of a wrapper) has no layer under the pointer:
     the nearest child is the one meant, past pass-through wrappers again */
  function gap(r, x, y) { var dx = Math.max(r.left - x, 0, x - r.right), dy = Math.max(r.top - y, 0, y - r.bottom); return dx * dx + dy * dy; }
  function nearestKid(n, x, y) {
    var best = null, bd = Infinity;
    layerKids(n).forEach(function (k) { var r = k.getBoundingClientRect(); if (!r.width && !r.height) return; var d = gap(r, x, y); if (d < bd) { bd = d; best = k; } });
    return best;
  }
  function descendNear(n, x, y) {
    for (var i = 0; n && i < 24 && passThrough(n); i++) { var k = nearestKid(n, x, y); if (!k) break; n = k; }
    return n;
  }
  T.isDeep = function (e) { return !!(e && (e.metaKey || e.ctrlKey)); };
  T.pickTarget = function (t, deep) {
    if (!t || t === T.host || t === document.documentElement || t === document.body) return null;
    if (deep) return t;
    var root = T.topFrame();
    if (t === root) return null;
    if (!root.contains(t)) root = document.body;
    var context = new Set([root]), sel = S.selected && S.selected.isConnected ? S.selected : null;
    for (var a = sel && sel.parentElement; a && a !== document.documentElement; a = a.parentElement) context.add(a);
    var pick = null;
    for (var n = t; n && n !== root; n = n.parentElement) if (context.has(n.parentElement)) { pick = n; break; }
    if (pick && pick === sel) return sel;
    pick = pick ? unwrap(pick, t) : t;
    /* empty space of a wrapper (a gap between cards, the page background): nothing, like Figma */
    return pick === t && pick !== sel && passThrough(pick) ? null : pick;
  };
  /* Double-click: the child of the selection under the pointer (one level deeper) */
  function deeper(sel, t) { var n = t; while (n && n.parentElement !== sel) n = n.parentElement; return n ? unwrap(n, t) : n; }
  function editTool() { return S.tool === 'select' || S.tool === 'comment'; } /* tools that own the page clicks */
  function block(e) {
    if (!editTool() || fromUI(e)) return;
    if (inEdit(e)) { shield(e); return; }
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
  }
  /* Text editing: the browser places the caret and selects words, but the page never hears it.
     A click on the text of a button or link used to reach the page (its onclick ran, the link
     opened, a label toggled its checkbox) */
  function inEdit(e) { return !!(S.editing && e.target && e.target.nodeType && S.editing.el.contains(e.target)); }
  function shield(e) {
    if (/^(click|submit|auxclick)$/.test(e.type)) e.preventDefault(); /* no navigation, submit or label toggle */
    e.stopPropagation(); e.stopImmediatePropagation();
  }
  /* other page events while editing: typing, focus (shared.js reformats fields on focus / input) */
  function shieldEdit(e) { if (editTool() && !fromUI(e) && inEdit(e)) { e.stopPropagation(); e.stopImmediatePropagation(); } }
  function gesture() { if (T.file.state === 'resume') T.resume(); }

  /* ── Text editing: only the element's own text nodes; child elements stay locked ── */
  T.startEditing = function (el) {
    if (!el || S.editing) return;
    var texts = T.directTextNodes(el);
    if (!texts.length) { T.notify('No text here — double-click the text itself'); return; }
    var nodes = Array.prototype.slice.call(el.childNodes);
    S.editing = { el: el, nodes: nodes, values: nodes.map(function (n) { return n.nodeValue; }), before: texts.map(function (n) { return n.nodeValue; }) };
    Array.prototype.forEach.call(el.children, function (k) { k.setAttribute('contenteditable', 'false'); });
    el.setAttribute('data-dl-editing', '');
    el.setAttribute('contenteditable', 'plaintext-only');
    if (el.contentEditable !== 'plaintext-only') el.setAttribute('contenteditable', 'true');
    el.focus();
    var longest = texts.reduce(function (a, b) { return b.nodeValue.trim().length > a.nodeValue.trim().length ? b : a; });
    var v = longest.nodeValue, s = v.length - v.replace(/^\s+/, '').length, end = v.replace(/\s+$/, '').length;
    var range = document.createRange();
    range.setStart(longest, s); range.setEnd(longest, Math.max(s, end));
    var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
  };
  T.stopEditing = function (cancel) {
    var ed = S.editing;
    if (!ed) return;
    var el = ed.el;
    S.editing = null;
    el.removeAttribute('contenteditable');
    el.removeAttribute('data-dl-editing');
    Array.prototype.forEach.call(el.children, function (k) { k.removeAttribute('contenteditable'); });
    window.getSelection().removeAllRanges();
    var now = Array.prototype.slice.call(el.childNodes);
    var same = now.length === ed.nodes.length && now.every(function (n, i) { return n === ed.nodes[i]; });
    var after = same ? T.directTextNodes(el).map(function (n) { return n.nodeValue; }) : null;
    if (!same || cancel || after.length !== ed.before.length) {
      now.forEach(function (n) { n.remove(); });
      ed.nodes.forEach(function (n, i) { if (n.nodeType === 3) n.nodeValue = ed.values[i]; el.appendChild(n); });
      if (!same && !cancel) T.notify('Only text can change here — icons and badges stay. Edit reverted', 'error');
      T.renderInspector();
      return;
    }
    if (after.join('\u0000') === ed.before.join('\u0000')) { T.renderInspector(); return; }
    T.directTextNodes(el).forEach(function (n, i) { n.nodeValue = ed.before[i]; });
    T.run(T.ops.text(el, ed.before, after));
  };

  /* ── Drag & drop ── (rules in dnd.js)
     Figma-like: the selection or a library component drops into the deepest valid container
     under the pointer, at the slot along that container's layout axis. Cmd/Ctrl keeps the
     current parent. Esc cancels. */
  var ENV = {
    styleOf: function (e) {
      var cs = getComputedStyle(e), g = cs.gridTemplateColumns;
      return { display: cs.display, flexDirection: cs.flexDirection, gridColumns: g && g !== 'none' ? g.split(' ').length : 1 };
    },
    rectOf: function (e) { return e.getBoundingClientRect(); },
    kids: function (e) {
      return Array.prototype.filter.call(e.children, function (k) {
        return k !== T.host && !T.src.isOwnNode(k) && k.tagName !== 'SCRIPT' && k.tagName !== 'STYLE' && getComputedStyle(k).display !== 'none';
      });
    },
    isOwn: function (e) { return e === T.host || T.src.isOwnNode(e); }
  };
  T.dndEnv = ENV;
  function target(x, y) {
    var d = S.drag;
    var stack = Array.prototype.filter.call(document.elementsFromPoint(x, y), function (c) { return c !== T.host && c !== document.documentElement && !T.src.isOwnNode(c); });
    var t = T.dropTarget(stack, { el: d.library !== undefined ? null : d.el, tag: d.tag, keepParent: d.keep }, x, y, ENV);
    if (!t) return null;
    t.rect = (t.pos === 'inside' ? t.container : t.ref).getBoundingClientRect();
    t.box = t.container.getBoundingClientRect();
    t.horizontal = t.axis === 'h';
    return t;
  }
  function autoScroll() {
    var d = S.drag, y = d.lastY, edge = 48, speed = 0;
    if (y > window.innerHeight - edge) speed = Math.ceil((y - (window.innerHeight - edge)) / 4);
    else if (y < edge + 56) speed = -Math.ceil((edge + 56 - y) / 4);
    if (!speed) return;
    var el = document.elementFromPoint(d.lastX, Math.min(Math.max(y, 1), window.innerHeight - 1));
    while (el && el !== document.body && el !== document.documentElement) {
      var ov = getComputedStyle(el).overflowY;
      if ((ov === 'auto' || ov === 'scroll') && el.scrollHeight > el.clientHeight) break;
      el = el.parentElement;
    }
    var scroller = el && el !== document.body && el !== document.documentElement ? el : (document.scrollingElement || document.documentElement);
    scroller.scrollTop += speed;
    d.target = target(d.lastX, d.lastY);
    T.showDrop(d.target);
  }
  T.frameHooks.push(function () { if (S.drag && S.drag.started) autoScroll(); });

  function dragMove(e) {
    var d = S.drag;
    if (!d.started) {
      if (Math.abs(e.clientX - d.x) + Math.abs(e.clientY - d.y) < 6) return;
      d.started = true;
      if (d.library !== undefined) { T.clearLibraryPreview(); ovGhost.textContent = '+ ' + d.name; }
      else { if (S.selected !== d.el) T.select(d.el); d.el.setAttribute('data-dl-dragging', ''); ovGhost.textContent = T.nameOf(d.el); }
    }
    d.lastX = e.clientX; d.lastY = e.clientY;
    ovGhost.style.display = 'block';
    ovGhost.style.left = (e.clientX + 12) + 'px';
    ovGhost.style.top = (e.clientY + 12) + 'px';
    d.keep = e.metaKey || e.ctrlKey;
    if (d.cancelled) return;
    var overUI = fromUI(e) && e.composedPath()[0] !== T.host;
    d.target = overUI ? null : target(e.clientX, e.clientY);
    T.showDrop(d.target);
  }
  function dragEnd() {
    var d = S.drag;
    S.drag = null;
    T.hide(T.$('.drop'), T.$('.dropbox'), ovGhost);
    if (!d.started) return;
    S.suppressClick = true;
    S.lastDragEnd = Date.now();
    setTimeout(function () { S.suppressClick = false; }, 0);
    var t = d.cancelled ? null : d.target;
    if (d.library !== undefined) { if (t) T.libraryDrop(d.library, t); return; }
    d.el.removeAttribute('data-dl-dragging');
    if (t && !T.dropIsNoop(t, d.el, ENV)) T.run(T.ops.move(d.el, t.ref, t.pos));
  }

  /* ── Pointer ── */
  function onPointerDown(e) {
    gesture();
    if (S.tool === 'comment' && !fromUI(e)) { block(e); return; } /* comments: no drag */
    if (S.tool !== 'select' || fromUI(e)) return;
    if (inEdit(e)) { shield(e); return; }
    block(e);
    if (e.button !== 0) return;
    var t = pageTarget(e);
    if (e.shiftKey) return; /* ⇧-click adds to the selection, never drags */
    /* press on the selection drags it; press on another layer drags that one (Figma) */
    var el = t && S.selected && S.selected.contains(t) && !T.isDeep(e) ? S.selected : T.pickTarget(t, T.isDeep(e));
    if (!el) return;
    /* an element that ignores auto layout moves freely (position.js) */
    if (el === S.selected && T.isAbsolute(el)) { T.absStart(el, e); return; }
    S.drag = { el: el, tag: el.tagName, x: e.clientX, y: e.clientY, started: false, target: null };
  }
  function onPointerMove(e) {
    if (T.resizing()) { T.resizeMove(e); return; }
    if (T.scrubbing()) { T.scrubMove(e); return; }
    if (T.absMoving()) { T.absMove(e); return; }
    if (S.drag) { dragMove(e); return; }
    if (S.tool === 'comment' && !fromUI(e)) { S.hovered = pageTarget(e); return; } /* comments pin to the deepest element */
    if (S.tool !== 'select' || fromUI(e)) { if (!S.altDown) S.hovered = null; return; }
    S.hotBox = null;
    S.lastTarget = pageTarget(e);
    S.hovered = T.pickTarget(S.lastTarget, T.isDeep(e)); /* outline what a click would select */
  }
  function onPointerUp(e) {
    if (T.resizing()) { T.resizeEnd(); return; }
    if (T.scrubbing()) { T.scrubEnd(); return; }
    if (T.absMoving()) { if (T.absEnd()) { S.suppressClick = true; setTimeout(function () { S.suppressClick = false; }, 0); block(e); } return; }
    if (S.drag) { var started = S.drag.started; dragEnd(); if (started) block(e); }
  }
  function onClick(e) {
    if (S.tool === 'comment' && !fromUI(e)) { block(e); if (T.commentOpen()) T.closeComment(); else T.commentAt(pageTarget(e), e.clientX, e.clientY); return; }
    if (S.tool !== 'select' || fromUI(e)) return;
    if (inEdit(e)) { shield(e); return; }
    block(e);
    if (S.suppressClick) return;
    if (S.editing) T.stopEditing();
    var t = pageTarget(e), sel = S.selected;
    /* a click inside the selection goes one level deeper: the child under the pointer, or on
       empty space (padding, a gap) the nearest child. Each click goes one further; a leaf stays */
    if (t && sel && sel.contains(t) && !T.isDeep(e) && !e.shiftKey && !T.isMulti()) {
      if (e.detail > 1) return; /* the second click of a double-click: onDblClick handles it */
      var d = descend(sel, t, e.clientX, e.clientY);
      if (d) { T.select(d); S.clickedDeeper = { el: d, at: Date.now(), x: e.clientX, y: e.clientY }; }
      return;
    }
    /* the same spot again after going deeper into empty space (the pointer is on the parent's
       padding, not on the selection): keep going down from the selection, never back up */
    var cd = S.clickedDeeper;
    if (t && sel && cd && cd.el === sel && t.contains(sel) && !T.isDeep(e) && !e.shiftKey && Math.abs(e.clientX - cd.x) < 6 && Math.abs(e.clientY - cd.y) < 6) {
      if (e.detail > 1) return;
      var d2 = descend(sel, sel, e.clientX, e.clientY);
      if (d2) { T.select(d2); S.clickedDeeper = { el: d2, at: Date.now(), x: e.clientX, y: e.clientY }; }
      else cd.at = Date.now();
      return;
    }
    var pick = T.pickTarget(t, T.isDeep(e));
    if (e.shiftKey) { if (pick) T.toggleSelect(pick); } /* ⇧-click: several elements at once (Figma) */
    else if (pick !== S.selected || T.isMulti()) T.select(pick);
  }
  /* one level below sel at the pointer (null on a leaf) */
  function descend(sel, t, x, y) {
    var el = sel !== t ? deeper(sel, t) : null;
    if ((!el && !T.directTextNodes(sel).length) || (el && el === t && passThrough(el))) { var near = nearestKid(el || sel, x, y); if (near) el = descendNear(near, x, y); }
    return el && el !== sel ? el : null;
  }
  function onDblClick(e) {
    if (S.tool === 'comment' && !fromUI(e)) { block(e); return; }
    if (S.tool !== 'select' || fromUI(e)) return;
    if (inEdit(e)) { shield(e); return; } /* a double-click in the text selects a word */
    block(e);
    var t = pageTarget(e);
    if (!t) return;
    var sel = S.selected, deep = T.isDeep(e), el;
    /* the first click of this double-click already went one level deeper: only edit a text leaf */
    var cd = S.clickedDeeper;
    S.clickedDeeper = null;
    if (!deep && cd && cd.el === sel && Date.now() - cd.at < 700) {
      if (!sel.children.length && !T.componentOf(sel) && T.directTextNodes(sel).length) T.startEditing(sel);
      else if (T.isIcon(sel)) T.openIconPicker();
      return;
    }
    if (!deep && sel && sel.contains(t)) {
      /* one level deeper: the child under the pointer, or on empty space (padding, a gap) the
         nearest child; a plain text layer opens for editing right away */
      el = sel !== t ? deeper(sel, t) : null;
      if ((!el && !T.directTextNodes(sel).length) || (el && el === t && passThrough(el))) { var near = nearestKid(el || sel, e.clientX, e.clientY); if (near) el = descendNear(near, e.clientX, e.clientY); }
      if (el && el !== sel) {
        T.select(el);
        if (!el.children.length && !T.componentOf(el) && T.directTextNodes(el).length) T.startEditing(el);
        return;
      }
      /* a leaf: edit its text or its icon */
      if (T.isIcon(sel)) T.openIconPicker(); else if (T.directTextNodes(sel).length) T.startEditing(sel);
      return;
    }
    el = deep ? t : sel && sel.contains(t) ? sel : T.pickTarget(t);
    if (!el) return;
    if (el !== S.selected) T.select(el);
    if (T.isIcon(el)) T.openIconPicker();
    else if (T.directTextNodes(el).length) T.startEditing(el);
    else if (el.firstElementChild) { var d = deeper(el, t); if (d && d !== el) T.select(d); }
  }

  /* ── Keyboard ── */
  function inField(e) { var p = e.composedPath ? e.composedPath()[0] : e.target; return p && (p.tagName === 'INPUT' || p.tagName === 'SELECT' || p.tagName === 'TEXTAREA'); }
  function closeTopmost() {
    if (T.dropdownOpen()) T.closeDropdown();
    else if (T.colorPickerOpen()) T.closeColorPicker();
    else if (T.menuOpen()) T.closeMenu();
    else if (T.iconPickerOpen()) T.closeIconPicker();
    else if (T.libraryOpen()) T.closeLibrary();
    else if (T.historyOpen && T.historyOpen()) T.closeHistory();
    else return false;
    return true;
  }
  function rehover(e) { if (S.lastTarget && S.tool === 'select' && !S.drag) S.hovered = T.pickTarget(S.lastTarget, T.isDeep(e)); }
  function onKeyDown(e) {
    if (e.key === 'Alt') S.altDown = true;
    if (e.key === 'Meta' || e.key === 'Control') rehover(e);
    if (e.altKey && e.shiftKey && (e.code === 'KeyE' || e.code === 'KeyT')) { e.preventDefault(); e.stopImmediatePropagation(); T.off(); return; }
    gesture();
    if (S.drag && e.key === 'Escape') { e.preventDefault(); S.drag.cancelled = true; S.drag.target = null; T.showDrop(null); return; }
    if ((e.metaKey || e.ctrlKey) && (e.key === 's' || e.key === 'S') && !S.editing) { e.preventDefault(); e.stopImmediatePropagation(); T.saveNow(); return; }
    if (S.editing) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); T.stopEditing(); }
      else if (e.key === 'Escape') { e.preventDefault(); T.stopEditing(true); }
      e.stopImmediatePropagation();
      return;
    }
    if (fromUI(e) && inField(e)) return; /* inspector inputs handle their own keys */
    if (S.tool === 'interact') {
      if (e.key === 'v' || e.key === 'V') { T.setTool('select'); e.preventDefault(); }
      return;
    }
    if (S.tool === 'comment') {
      if (e.key === 'Escape') { if (T.commentOpen()) T.closeComment(); else if (!closeTopmost()) T.setTool('select'); e.preventDefault(); }
      else if (e.key === 'v' || e.key === 'V') { T.setTool('select'); e.preventDefault(); }
      else if (e.key === 'p' || e.key === 'P') { T.setTool('interact'); e.preventDefault(); }
      else if ((e.metaKey || e.ctrlKey) && (e.key === 'z' || e.key === 'Z')) { if (e.shiftKey) T.redo(); else T.undo(); e.preventDefault(); }
      e.stopImmediatePropagation();
      return;
    }
    var mod = e.metaKey || e.ctrlKey, k = e.key, handled = true, sel = S.selected;
    if (mod && (k === 'z' || k === 'Z')) { if (e.shiftKey) T.redo(); else T.undo(); }
    else if (mod && (k === 'y' || k === 'Y')) T.redo();
    else if (mod && (k === 'd' || k === 'D')) { if (sel) T.run(T.ops.dup(sel)); }
    else if (mod && !e.shiftKey && !e.altKey && (k === 'g' || k === 'G')) T.wrapSelection(); /* group = auto layout frame here */
    else if (mod) handled = false;
    else if (k === 'Escape') { if (!closeTopmost() && sel) T.select(T.isMulti() ? sel : sel.parentElement); }
    else if (e.shiftKey && !e.altKey && (k === 'A' || k === 'a')) T.wrapSelection(); /* ⇧A: add auto layout (Figma) */
    else if (k === 'Enter') {
      /* Figma: Enter selects the children, ⇧Enter the parent */
      if (sel && e.shiftKey) T.select(sel.parentElement);
      else if (sel) { var kids = layerKids(sel); if (kids.length) { T.select(kids[0]); S.multi = kids.slice(1); T.renderInspector(); } }
    }
    else if (k === 'Tab') { if (sel) { var s = T.siblingEl(sel, e.shiftKey ? -1 : 1); if (s) T.select(s); } }
    else if ((k === 'Backspace' || k === 'Delete') && sel) T.deleteSelection();
    else if (/^Arrow/.test(k) && sel && T.isAbsolute(sel)) {
      /* ignores auto layout: arrows nudge it (⇧ = 10 px), like Figma */
      var step = e.shiftKey ? 10 : 1;
      T.nudge(k === 'ArrowLeft' ? -step : k === 'ArrowRight' ? step : 0, k === 'ArrowUp' ? -step : k === 'ArrowDown' ? step : 0);
    }
    else if (/^Arrow/.test(k) && sel) {
      /* reorder along the layout axis: ← → in rows, ↑ ↓ in columns */
      var h = T.axisFor(sel) === 'h', horizontalKey = k === 'ArrowLeft' || k === 'ArrowRight';
      if (h === horizontalKey) T.reorder(k === 'ArrowLeft' || k === 'ArrowUp' ? -1 : 1);
      else T.notify(h ? 'This layout is horizontal — use ← →' : 'This layout is vertical — use ↑ ↓');
    }
    else if (k === 'i' || k === 'I') T.openLibrary(e.shiftKey && sel ? 'replace' : 'insert');
    else if (k === 'p' || k === 'P') T.setTool('interact');
    else if (k === 'c' || k === 'C') T.setTool('comment');
    else if (k === 'v' || k === 'V') T.setTool('select');
    else handled = false;
    if (handled) { e.preventDefault(); e.stopImmediatePropagation(); }
  }
  function onKeyUp(e) { if (e.key === 'Alt') S.altDown = false; if (e.key === 'Meta' || e.key === 'Control') rehover(e); shieldEdit(e); }
  function onBlur() { S.altDown = false; }

  T.setTool = function (t) {
    S.tool = t;
    document.documentElement.classList.toggle('dl-tweaking', t !== 'interact');
    document.documentElement.classList.toggle('dl-commenting', t === 'comment');
    if (t !== 'select') { S.hovered = null; if (S.editing) T.stopEditing(); T.closeDropdown(); T.closeIconPicker(); T.closeLibrary(); T.closeColorPicker(); }
    if (t !== 'comment' && T.closeComment) T.closeComment();
    T.renderToolbar();
    T.renderInspector();
    if (T.showModeHint) T.showModeHint(t);
  };

  var LISTENERS = [
    ['pointerdown', onPointerDown], ['pointermove', onPointerMove], ['pointerup', onPointerUp],
    ['mousedown', block], ['mouseup', block], ['click', onClick], ['dblclick', onDblClick],
    ['submit', block], ['keydown', onKeyDown], ['keyup', onKeyUp], ['contextmenu', block], ['dragstart', block],
    ['auxclick', block], ['keypress', shieldEdit], ['beforeinput', shieldEdit], ['input', shieldEdit], ['change', shieldEdit],
    ['focusin', shieldEdit], ['focusout', shieldEdit], ['paste', shieldEdit]
  ];
  T.bindPage = function () { LISTENERS.forEach(function (l) { window.addEventListener(l[0], l[1], true); }); window.addEventListener('blur', onBlur); };
  T.unbindPage = function () { LISTENERS.forEach(function (l) { window.removeEventListener(l[0], l[1], true); }); window.removeEventListener('blur', onBlur); };
  /* Pointer moves / ups that start in the editor UI (library drag, scrub) still reach these */
})(window.DLTweakNS);
