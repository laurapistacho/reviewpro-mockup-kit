/* Tweak mode — undoable operations + history.
   An op is { el, saved, describe(), apply(), revert() }. apply() changes the live page and,
   when a file is connected and the element maps to a source node, patches T.file.text.
   T.run(op) applies it, records it for undo and triggers a save + re-render.

   New kind of edit? Write an op factory here (see style / cls / insert) and call T.run(). */
(function (T) {
  'use strict';
  var F = T.file;
  T.history = [];
  T.future = [];
  T.REMOVE = { remove: true }; /* style value: drop the property even if the file had it */

  T.run = function (op) { op.apply(); T.history.push(op); T.future = []; after(); };
  T.undo = function () { var op = T.history.pop(); if (!op) return; op.revert(); T.future.push(op); after(); };
  T.redo = function () { var op = T.future.pop(); if (!op) return; op.apply(); T.history.push(op); after(); };
  T.unsavedCount = function () { return T.history.filter(function (o) { return !o.saved; }).length; };
  function after() {
    if (F.handle) {
      if (F.text === F.lastDisk) { if (F.state === 'unsaved') T.setFileState('saved'); }
      else if (T.s.autosave) T.scheduleSave();
      else T.setFileState('unsaved');
    }
    T.emit('change');
  }
  /* Ops made before a file was connected: rewind, align, re-apply against the file */
  T.replayWithSource = function () {
    var ops = T.history.slice();
    for (var i = ops.length - 1; i >= 0; i--) ops[i].revert();
    T.reindex();
    ops.forEach(function (o) { o.apply(); });
    after();
  };
  /* Snapshot helper: every op that patches the file restores the whole text on revert */
  function snapshot() { return F.text; }
  function restore(text) { if (text !== null && text !== undefined) { F.text = text; T.reindex(); } }

  /* ── style: inline style overrides (relative to the original style attribute) ── */
  var styleState = new WeakMap(); /* el → { original, srcOriginal, overrides: Map(prop → value|null) } */
  T.stateOf = function (el) {
    var s = styleState.get(el);
    if (!s) { s = { original: el.getAttribute('style'), srcOriginal: undefined, overrides: new Map() }; styleState.set(el, s); }
    return s;
  };
  T.overridesOf = function (el) { var s = styleState.get(el); return s ? s.overrides : new Map(); };
  /* Custom styles = everything the element's style attribute says now: what the file has (written by
     Kiro, an earlier session or by hand) plus this session's edits. On a DS component each of them is
     a change from the component's design: dots, section resets and "Reset all changes" use this. */
  T.customOf = function (el) {
    var out = new Map(), node = T.nodeFor && T.nodeFor(el);
    if (node) {
      T.src.splitDecls(node.attrs.style === undefined ? '' : T.src.decode(node.attrs.style)).forEach(function (d) { out.set(d[0], d[1]); });
      return out;
    }
    var s = styleState.get(el);
    T.src.splitDecls((s ? s.original : el.getAttribute('style')) || '').forEach(function (d) { out.set(d[0], d[1]); });
    T.overridesOf(el).forEach(function (v, p) { if (v === null) out.delete(p); else out.set(p, v); });
    return out;
  };
  /* shorthand ↔ longhands: padding changes padding-top, border-top-left-radius changes border-radius … */
  var LONG = { padding: /^padding-/, margin: /^margin-/, gap: /^(row|column)-gap$/, inset: /^(top|right|bottom|left)$/,
    border: /^border-(top|right|bottom|left|width|style|color)/, 'border-radius': /^border-(top|bottom)-(left|right)-radius$/,
    background: /^background-/, font: /^(font-|line-height$)/, flex: /^flex-(grow|shrink|basis)$/ };
  T.customHas = function (custom, p) {
    if (custom.has(p)) return true;
    for (var k in LONG) if (custom.has(k) && LONG[k].test(p)) return true;
    var hit = false;
    if (LONG[p]) custom.forEach(function (v, q) { if (LONG[p].test(q)) hit = true; });
    return hit;
  };
  /* style changes that bring the matching custom styles back to the component's own (class) values;
     null when there is nothing to reset. test(prop) picks the properties (all when omitted). */
  T.resetChanges = function (el, test) {
    var s = T.stateOf(el), orig = {}, ch = {}, n = 0, node = T.nodeFor && T.nodeFor(el);
    /* the style the session's overrides are relative to: in the file, else on the live element */
    var base = s.srcOriginal !== undefined ? s.srcOriginal : node ? (node.attrs.style === undefined ? '' : node.attrs.style) : s.original;
    T.src.splitDecls(base || '').forEach(function (d) { orig[d[0]] = 1; });
    T.customOf(el).forEach(function (v, p) {
      if (test && !test(p)) return;
      ch[p] = s.overrides.has(p) && !orig[p] ? null : T.REMOVE; n++;
    });
    return n ? ch : null;
  };
  T.resetOp = function (el, test) { var ch = T.resetChanges(el, test); return ch ? T.ops.style(el, ch) : null; };
  T.renderLive = function (el, overrides) {
    var s = T.stateOf(el);
    if (s.original === null) el.removeAttribute('style'); else el.setAttribute('style', s.original);
    overrides.forEach(function (v, p) { if (v === null) el.style.removeProperty(p); else el.style.setProperty(p, v); });
  };

  var ops = T.ops = {};

  /* changes: { prop: value | null (back to original) | T.REMOVE (drop) } */
  ops.style = function (el, changes) {
    if (T.touch) T.touch(el, null); /* kiro-log.js: remember the state before this edit */
    var s = T.stateOf(el), before = new Map(s.overrides), next = new Map(s.overrides), srcBefore = null;
    Object.keys(changes).forEach(function (p) {
      var v = changes[p];
      if (v === null) next.delete(p); else if (v === T.REMOVE) next.set(p, null); else next.set(p, v);
    });
    return {
      kind: 'style', el: el, saved: false,
      describe: function () {
        var parts = [];
        next.forEach(function (v, p) { if (before.get(p) !== v) parts.push(p + ': ' + (v === null ? '(removed)' : v)); });
        before.forEach(function (v, p) { if (!next.has(p)) parts.push(p + ': (reset)'); });
        return parts.join('; ');
      },
      apply: function () {
        var node = T.nodeFor(el);
        s.overrides = new Map(next);
        T.renderLive(el, next);
        this.saved = false;
        if (!node) return;
        if (s.srcOriginal === undefined) s.srcOriginal = node.attrs.style === undefined ? null : node.attrs.style;
        srcBefore = snapshot();
        T.splice(node.start, node.openEnd, T.src.setAttr(F.text.slice(node.start, node.openEnd), 'style', T.src.mergeStyle(s.srcOriginal, next)));
        T.reindex();
        this.saved = true;
      },
      revert: function () { s.overrides = new Map(before); T.renderLive(el, before); restore(srcBefore); srcBefore = null; }
    };
  };

  /* ── cls: swap classes (component props, icon glyph / size) ── */
  ops.cls = function (el, remove, add) {
    var liveBefore = el.getAttribute('class'), srcBefore = null;
    remove = remove.filter(Boolean); add = add.filter(Boolean);
    if (T.touch) T.touch(el, remove.concat(add));
    function swap(list) {
      var out = [], placed = false;
      list.forEach(function (c) {
        if (remove.indexOf(c) > -1) { if (!placed) { add.forEach(function (a) { if (out.indexOf(a) < 0) out.push(a); }); placed = true; } }
        else if (out.indexOf(c) < 0) out.push(c);
      });
      if (!placed) add.forEach(function (a) { if (out.indexOf(a) < 0) out.push(a); });
      return out;
    }
    return {
      kind: 'cls', el: el, saved: false,
      describe: function () { return 'class ' + (remove.length ? '−' + remove.join(' −') + ' ' : '') + (add.length ? '+' + add.join(' +') : ''); },
      apply: function () {
        var node = T.nodeFor(el);
        el.className = swap((liveBefore || '').split(/\s+/).filter(Boolean)).join(' ');
        this.saved = false;
        if (!node) return;
        srcBefore = snapshot();
        T.splice(node.start, node.openEnd, T.src.setAttr(F.text.slice(node.start, node.openEnd), 'class', swap((node.attrs.class || '').split(/\s+/).filter(Boolean)).join(' ')));
        T.reindex();
        this.saved = true;
      },
      revert: function () {
        if (liveBefore === null) el.removeAttribute('class'); else el.setAttribute('class', liveBefore);
        restore(srcBefore); srcBefore = null;
      }
    };
  };

  /* ── text: the element's own text nodes ── */
  T.directTextNodes = function (el) {
    return Array.prototype.filter.call(el.childNodes, function (n) { return n.nodeType === 3 && n.nodeValue.trim(); });
  };
  ops.text = function (el, beforeTexts, afterTexts) {
    var srcBefore = null;
    function setLive(texts) { T.directTextNodes(el).forEach(function (n, i) { if (texts[i] !== undefined) n.nodeValue = texts[i]; }); }
    return {
      kind: 'text', el: el, saved: false,
      describe: function () { return 'text "' + beforeTexts.join(' ').trim() + '" → "' + afterTexts.join(' ').trim() + '"'; },
      apply: function () {
        setLive(afterTexts);
        this.saved = false;
        var node = T.nodeFor(el);
        if (!node) return;
        var segs = [], pos = node.openEnd;
        node.children.concat([{ start: node.closeStart, end: node.closeStart }]).forEach(function (c) {
          if (F.text.slice(pos, c.start).trim()) segs.push([pos, c.start]);
          pos = c.end;
        });
        if (segs.length !== beforeTexts.length) return;
        for (var i = 0; i < segs.length; i++) if (T.src.decode(F.text.slice(segs[i][0], segs[i][1])).trim() !== beforeTexts[i].trim()) return;
        srcBefore = snapshot();
        for (var k = segs.length - 1; k >= 0; k--) {
          if (beforeTexts[k] === afterTexts[k]) continue;
          var raw = F.text.slice(segs[k][0], segs[k][1]);
          T.splice(segs[k][0], segs[k][1], /^\s*/.exec(raw)[0] + T.src.escapeText(afterTexts[k].trim()) + /\s*$/.exec(raw)[0]);
        }
        T.reindex();
        this.saved = true;
      },
      revert: function () { setLive(beforeTexts); restore(srcBefore); srcBefore = null; }
    };
  };

  /* ── structure: delete / duplicate / move / insert / replace ── */
  function reindexIfFile() { if (F.text !== null) T.reindex(); }

  ops.del = function (el) {
    var parent = el.parentNode, next = el.nextSibling, srcBefore = null;
    return {
      kind: 'del', el: el, saved: false,
      describe: function () { return 'delete element'; },
      apply: function () {
        var node = T.nodeFor(el);
        el.remove();
        this.saved = false;
        if (node) {
          srcBefore = snapshot();
          var r = T.lineRange(node);
          if (r) T.splice(r[0], r[1], ''); else T.splice(node.start, node.end, '');
          this.saved = true;
        }
        reindexIfFile();
        if (T.s.selected && !T.s.selected.isConnected) T.select(null);
      },
      revert: function () {
        parent.insertBefore(el, next && next.parentNode === parent ? next : null);
        if (srcBefore !== null) F.text = srcBefore;
        srcBefore = null;
        reindexIfFile();
      }
    };
  };

  ops.dup = function (el) {
    var clone = el.cloneNode(true), srcBefore = null;
    return {
      kind: 'dup', el: el, saved: false,
      describe: function () { return 'duplicate element'; },
      apply: function () {
        var node = T.nodeFor(el);
        el.after(clone);
        this.saved = false;
        if (node) {
          srcBefore = snapshot();
          var copy = F.text.slice(node.start, node.end), r = T.lineRange(node);
          T.splice(node.end, node.end, (r ? '\n' + r[2] : '') + copy);
          this.saved = true;
        }
        reindexIfFile();
        T.select(clone);
      },
      revert: function () {
        clone.remove();
        if (srcBefore !== null) F.text = srcBefore;
        srcBefore = null;
        reindexIfFile();
        if (T.s.selected === clone) T.select(el);
      }
    };
  };

  /* Insert `text` into the file before / after `node`, matching its indentation */
  function insertText(node, pos, text) {
    var r = T.lineRange(node), p, ins;
    if (pos === 'inside') {
      var t = F.text, ls = t.lastIndexOf('\n', node.closeStart - 1) + 1;
      var closeAlone = !t.slice(ls, node.closeStart).trim();
      var childIndent = T.indentOf(node) + '  ';
      if (closeAlone) { p = ls; ins = childIndent + T.src.indentSnippet(text, childIndent) + '\n'; }
      else { p = node.closeStart; ins = text; }
    } else if (r) {
      var indent = r[2];
      p = pos === 'before' ? r[0] : r[1];
      ins = indent + T.src.indentSnippet(text, indent) + '\n';
      if (pos === 'after' && r[1] === F.text.length && F.text[r[1] - 1] !== '\n') ins = '\n' + ins;
    } else {
      p = pos === 'before' ? node.start : node.end;
      ins = text;
    }
    T.splice(p, p, ins);
  }

  /* Continuation lines of a moved element follow its new indentation */
  function reindent(piece, from, to) {
    if (from === to) return piece;
    return piece.split('\n').map(function (l, i) { return i && l.indexOf(from) === 0 ? to + l.slice(from.length) : l; }).join('\n');
  }
  /* Move el before / after ref, or 'inside' ref (appended). Any parent. Drag & drop and arrow keys. */
  ops.move = function (el, ref, pos) {
    var fromParent = el.parentNode, fromNext = el.nextSibling, srcBefore = null;
    return {
      kind: 'move', el: el, saved: false,
      describe: function () { return 'move ' + pos + ' ' + T.describeEl(ref); },
      apply: function () {
        var node = T.nodeFor(el), refNode = T.nodeFor(ref);
        if (pos === 'inside') ref.appendChild(el); else ref.parentNode.insertBefore(el, pos === 'before' ? ref : ref.nextSibling);
        this.saved = false;
        if (node && refNode) {
          srcBefore = snapshot();
          var cut = T.lineRange(node), piece = F.text.slice(node.start, node.end);
          var rs = cut ? cut[0] : node.start, re = cut ? cut[1] : node.end;
          var rr = T.lineRange(refNode), p, ins;
          if (pos === 'inside') {
            var ls = F.text.lastIndexOf('\n', refNode.closeStart - 1) + 1, kidIndent = T.indentOf(refNode) + '  ';
            if (cut && !F.text.slice(ls, refNode.closeStart).trim()) { p = ls; ins = kidIndent + reindent(piece, cut[2], kidIndent) + '\n'; }
            else { p = refNode.closeStart; ins = piece; }
          } else if (rr && cut) { p = pos === 'before' ? rr[0] : rr[1]; ins = rr[2] + reindent(piece, cut[2], rr[2]) + '\n'; if (pos === 'after' && rr[1] === F.text.length && F.text[rr[1] - 1] !== '\n') ins = '\n' + ins; }
          else { p = pos === 'before' ? refNode.start : refNode.end; ins = piece; }
          var t = F.text.slice(0, rs) + F.text.slice(re);
          if (p >= re) p -= (re - rs);
          F.text = t.slice(0, p) + ins + t.slice(p);
          this.saved = true;
        }
        reindexIfFile();
      },
      revert: function () {
        fromParent.insertBefore(el, fromNext && fromNext.parentNode === fromParent ? fromNext : null);
        if (srcBefore !== null) F.text = srcBefore;
        srcBefore = null;
        reindexIfFile();
      }
    };
  };

  T.elementFromHTML = function (html) {
    var tpl = document.createElement('template');
    tpl.innerHTML = html.trim();
    return tpl.content.firstElementChild;
  };

  /* Insert a DS snippet relative to ref: 'before' | 'after' | 'inside' (appended) */
  ops.insert = function (html, ref, pos, label) {
    var el = T.elementFromHTML(html), srcBefore = null;
    return {
      kind: 'insert', el: el, saved: false,
      describe: function () { return 'insert ' + (label || 'component') + ' ' + pos + ' ' + T.describeEl(ref) + ':\n```html\n' + html + '\n```'; },
      apply: function () {
        var refNode = T.nodeFor(ref);
        if (pos === 'inside') ref.appendChild(el); else ref.parentNode.insertBefore(el, pos === 'before' ? ref : ref.nextSibling);
        this.saved = false;
        if (refNode) { srcBefore = snapshot(); insertText(refNode, pos, html); this.saved = true; }
        reindexIfFile();
        T.select(el);
      },
      revert: function () {
        el.remove();
        if (srcBefore !== null) F.text = srcBefore;
        srcBefore = null;
        reindexIfFile();
        if (T.s.selected === el) T.select(ref.isConnected ? ref : null);
      }
    };
  };

  /* Behavior travels with a replaced element: id, name, inline handlers (on*), data-* / aria-*,
     title, tabindex; href/target only onto <a>. A link replaced by a non-link keeps its target as
     onclick="location.href='…'". Without this, page scripts bound to the old element stop working. */
  function attrEsc(v) { return String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }
  T.carryBehavior = function (old, html) {
    var m = /^(\s*<)([a-zA-Z][\w-]*)([^>]*?)(\/?>)/.exec(html);
    if (!m || !old || !old.attributes) return html;
    var tag = m[2].toLowerCase(), have = {}, add = [];
    (m[3].match(/[\w:-]+(?==|\s|$)/g) || []).forEach(function (a) { have[a.toLowerCase()] = 1; });
    /* attributes as written in the file: shared.js adds role / tabindex / aria-checked to switches,
       aria-expanded / aria-selected / aria-haspopup and role / tabindex to keyboard controls (el._dlKb)
       at runtime; those must not travel to the new element */
    var node = T.nodeFor(old), attrs = node ? Object.keys(node.attrs).map(function (k) { return { name: k, value: T.src.decode(node.attrs[k]) }; })
      : Array.prototype.filter.call(old.attributes, function (a) { return !/^(aria-checked|aria-expanded|aria-selected|aria-haspopup)$/.test(a.name) && !((old.classList.contains('rp-switch') || old._dlKb) && /^(role|tabindex|aria-disabled)$/.test(a.name)); });
    attrs.forEach(function (a) {
      var n = a.name.toLowerCase();
      if (have[n] || /^data-dl-/.test(n) || n === 'contenteditable') return;
      var keep = n === 'id' || n === 'name' || n === 'title' || n === 'tabindex' || n === 'role' || /^on/.test(n) || /^data-/.test(n) || /^aria-/.test(n) ||
        ((n === 'href' || n === 'target') && tag === 'a') || (n === 'disabled' && /^(button|input|select|textarea)$/.test(tag));
      if (keep) { add.push(n + '="' + attrEsc(a.value) + '"'); have[n] = 1; }
    });
    var href = old.tagName === 'A' && old.getAttribute('href');
    if (tag !== 'a' && href && href !== '#' && !/^javascript:/i.test(href) && !have.onclick) add.push('onclick="location.href=\'' + attrEsc(href.replace(/'/g, "\\'")) + '\'"');
    if (!add.length) return html;
    return html.slice(0, m.index) + m[1] + m[2] + m[3] + ' ' + add.join(' ') + m[4] + html.slice(m.index + m[0].length);
  };
  /* Replace el with a DS snippet (keeps the element's behavior, see carryBehavior) */
  ops.replace = function (el, html, label) {
    html = T.carryBehavior(el, html);
    var nu = T.elementFromHTML(html), srcBefore = null, inline = [];
    /* listeners added by page scripts (addEventListener) cannot be copied: forward clicks to the
       detached original until the page reloads; after a reload the kept id / attributes rebind them */
    Array.prototype.forEach.call(el.attributes, function (a) { if (/^on/i.test(a.name)) inline.push([a.name, a.value]); });
    nu.addEventListener('click', function (e) { if (!el.isConnected && !e.__dlForwarded) { var f = new MouseEvent('click', e); f.__dlForwarded = true; el.dispatchEvent(f); } });
    return {
      kind: 'replace', el: el, saved: false,
      describe: function () { return 'replace with ' + (label || 'component') + ':\n```html\n' + html + '\n```'; },
      apply: function () {
        var node = T.nodeFor(el);
        el.replaceWith(nu);
        inline.forEach(function (a) { el.removeAttribute(a[0]); }); /* nu has them; no double firing */
        this.saved = false;
        if (node) {
          srcBefore = snapshot();
          T.splice(node.start, node.end, T.src.indentSnippet(html, T.indentOf(node)));
          this.saved = true;
        }
        reindexIfFile();
        if (!this.quiet) T.select(nu); /* several replaced at once: only the first one gets selected */
      },
      revert: function () {
        nu.replaceWith(el);
        inline.forEach(function (a) { el.setAttribute(a[0], a[1]); });
        if (srcBefore !== null) F.text = srcBefore;
        srcBefore = null;
        reindexIfFile();
        if (T.s.selected === nu) T.select(el);
      }
    };
  };

  /* Several ops as one undo step (e.g. the same edit on all similar elements) */
  ops.batch = function (list) {
    return {
      kind: 'batch', list: list, el: list[0] && list[0].el, saved: false,
      describe: function () {
        var order = [], count = {};
        list.forEach(function (o) { var d = o.describe(); if (!d) return; if (!count[d]) { count[d] = 0; order.push(d); } count[d]++; });
        return order.map(function (d) { return count[d] > 1 ? d + ' (on ' + count[d] + ' similar elements)' : d; }).join('; ');
      },
      apply: function () { list.forEach(function (o) { o.apply(); }); this.saved = list.every(function (o) { return o.saved; }); },
      revert: function () { for (var i = list.length - 1; i >= 0; i--) list[i].revert(); }
    };
  };

  /* ── Copy for Kiro (browsers without file access, or script-made elements) ── */
  T.describeEl = function (el) {
    var path = [], n = el;
    while (n && n.nodeType === 1 && n !== document.body && path.length < 4) {
      var part = n.tagName.toLowerCase();
      if (n.id) { path.unshift('#' + n.id); break; }
      var cls = Array.prototype.slice.call(n.classList, 0, 2);
      if (cls.length) part += '.' + cls.join('.');
      path.unshift(part);
      n = n.parentElement;
    }
    return '`' + path.join(' > ') + '`';
  };
  T.exportText = function () {
    var list = T.history.filter(function (o) { return F.handle ? !o.saved : true; });
    if (!list.length) return null;
    return 'Tweak changes for `' + F.name + '` — apply them to the source (values are DS tokens):\n' + list.map(function (o, i) {
      var text = o.el ? (o.el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 40) : '';
      return (i + 1) + '. ' + (o.el ? T.describeEl(o.el) : '') + (text ? ' ("' + text + '")' : '') + ' — ' + o.describe();
    }).join('\n');
  };
  T.copyChanges = function () {
    var text = T.exportText();
    if (!text) { T.notify('No changes to copy yet'); return; }
    var done = function () { T.notify('Copied — paste into the Kiro chat'); };
    function fallback() {
      var t = document.createElement('textarea');
      t.value = text; t.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(t); t.select();
      try { document.execCommand('copy'); done(); } catch (e) { T.notify('Copy failed', 'error'); }
      t.remove();
    }
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, fallback); else fallback();
  };
})(window.DLTweakNS);
