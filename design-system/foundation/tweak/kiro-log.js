/* Tweak mode — notes for Kiro. Every save also writes tweak-changes.md next to the page:
   the net changes of this editing session (undone edits disappear, five padding steps are one
   line), grouped by kind of element, plus what Kiro should do with them: fold repeated inline
   styles into the page classes, make the same change on the other pages of the mockup, delete
   the file. Kiro looks for the file when the designer says they changed something (steering
   project-rules.md, rule 6), so the designer only says "apply my tweaks". Nothing is copied by hand.

   One block per editing session (marked with HTML comments). When Kiro deletes the file, the
   next save starts over from what was already written, so applied changes are not repeated.
   Copy for Kiro (browsers without file access) uses the same text. */
(function (T) {
  'use strict';
  var F = T.file, LOG = 'tweak-changes.md';
  var HEADER = '# Tweak changes for Kiro\n\n<!-- Tweak mode writes this file when it saves a page or gets a comment. Kiro: follow the tags in each block\n' +
    '     ([done] = already in the file, do nothing; [comment] = make that change, then delete its two lines),\n' +
    '     see the reviewpro-html-mockup skill § Tweak changes, then delete this file. -->\n';
  var session = Math.random().toString(36).slice(2, 8), started = null, wrote = false, histBase = 0, snap = null;
  var touched = new Map(); /* el → { cls: classes before, base: style overrides before, keys: classes the editor touched } */
  var queue = Promise.resolve();
  F.pages = [];

  T.touch = function (el, classes) {
    var t = touched.get(el);
    if (!t) { t = { cls: (el.getAttribute('class') || '').split(/\s+/).filter(Boolean), base: new Map(T.overridesOf(el)), keys: {} }; touched.set(el, t); }
    (classes || []).forEach(function (c) { if (c) t.keys[c] = 1; });
  };

  /* Other pages of this mockup (same folder) */
  T.findPages = function () {
    F.pages = [];
    if (!F.dir || typeof F.dir.values !== 'function') return;
    (async function () {
      try { for await (var h of F.dir.values()) if (h.kind === 'file' && /\.html?$/i.test(h.name) && h.name !== F.name && !/^__/.test(h.name)) F.pages.push(h.name); } catch (e) { /* no listing */ }
      F.pages.sort();
    })();
  };
  F.relPath = (function () {
    var i = F.dirSegs.lastIndexOf('mockups'); if (i < 0) i = F.dirSegs.lastIndexOf('design-system');
    return (i < 0 ? [] : F.dirSegs.slice(i)).concat(F.name).join('/');
  })();

  /* ── Net changes ── */
  function classes(el) { return (el.getAttribute('class') || '').split(/\s+/).filter(Boolean); }
  function origDecl(el, p) { var d = T.src.splitDecls(T.stateOf(el).original || '').filter(function (x) { return x[0] === p; })[0]; return d ? d[1] : undefined; }
  function styleNet(el, t) {
    var cur = T.overridesOf(el), props = {}, out = [];
    cur.forEach(function (v, p) { props[p] = 1; });
    t.base.forEach(function (v, p) { props[p] = 1; });
    Object.keys(props).forEach(function (p) {
      var a = t.base.has(p) ? t.base.get(p) : origDecl(el, p), b = cur.has(p) ? cur.get(p) : origDecl(el, p);
      if (a === b || (a == null && b == null)) return;
      out.push(p + ': ' + (a == null ? '' : a + ' → ') + (b == null ? 'none (removed, back to the class value)' : b));
    });
    return out;
  }
  function classNet(el, t) {
    var now = classes(el), parts = [];
    Object.keys(t.keys).forEach(function (c) { var was = t.cls.indexOf(c) > -1, is = now.indexOf(c) > -1; if (was !== is) parts.push((is ? '+' : '−') + c); });
    return parts.length ? ['class ' + parts.join(' ')] : [];
  }
  function label(el, t) {
    var own = el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + t.cls.filter(function (c) { return !T.isStateClass(c); }).slice(0, 3).map(function (c) { return '.' + c; }).join('');
    var p = el.parentElement, pl = '';
    if (p && p !== document.body && p !== document.documentElement) pl = p.id ? '#' + p.id : p.tagName.toLowerCase() + Array.prototype.slice.call(p.classList, 0, 2).map(function (c) { return '.' + c; }).join('');
    return '`' + (pl ? pl + ' > ' : '') + own + '`';
  }
  /* text hint only for elements that carry text themselves (a button, a label), not containers */
  function textOf(el) {
    var s = T.directTextNodes(el).map(function (n) { return n.nodeValue; }).join(' ').replace(/\s+/g, ' ').trim();
    return s ? ' ("' + (s.length > 40 ? s.slice(0, 40) + '…' : s) + '")' : '';
  }
  function flat(list) { var out = []; list.forEach(function (o) { if (o.kind === 'batch') out = out.concat(flat(o.list)); else out.push(o); }); return out; }

  function lists() {
    var groups = new Map(), ds = false;
    touched.forEach(function (t, el) {
      if (!el.isConnected) return;
      var ch = classNet(el, t).concat(styleNet(el, t));
      if (!ch.length) return;
      if (t.cls.some(function (c) { return /^rp-/.test(c); })) ds = true;
      var lab = label(el, t);
      /* one line per change, so "×3 padding-top" stays one line even if one card got more */
      ch.forEach(function (c) {
        var key = lab + '|' + c, g = groups.get(key);
        if (!g) groups.set(key, g = { label: lab, ch: [c], els: [], script: false });
        g.els.push(el);
        if (!T.nodeFor(el)) g.script = true;
      });
    });
    var styles = [];
    /* a single element among similar ones: say which one ("2nd of 3") */
    function which(el) {
      var all = [el].concat(T.findSimilar(el));
      if (all.length < 2) return '';
      all.sort(function (a, b) { return a.compareDocumentPosition(b) & 4 ? -1 : 1; });
      var k = all.indexOf(el) + 1;
      return ' (' + k + ['th', 'st', 'nd', 'rd'][k % 100 > 10 && k % 100 < 14 ? 0 : Math.min(k % 10, 4) % 4] + ' of ' + all.length + ' similar, only this one)';
    }
    /* Every line says what Kiro does with it, so nothing that is already in the file gets redone:
       [fold] in the file, repeated: move into the page class · [script] made by a script, not in the
       file: change the script · [done] in the file, nothing to do · [apply] not saved: apply it */
    groups.forEach(function (g) {
      var tag = !F.handle ? '[apply]' : g.script ? '[script]' : g.els.length > 1 ? '[fold]' : '[done]';
      styles.push('- ' + tag + ' ' + g.label + (g.els.length > 1 ? ' ×' + g.els.length : textOf(g.els[0]) + which(g.els[0])) + ': ' + g.ch.join('; ') +
        (g.script ? ' — not in the HTML file (made by a script)' : ''));
    });
    var structure = flat(T.history.slice(Math.min(histBase, T.history.length)))
      .filter(function (o) { return /^(text|del|dup|move|insert|replace)$/.test(o.kind); })
      .map(function (o) { return '- ' + (F.handle ? '[done] ' : '[apply] ') + T.describeEl(o.el) + ' — ' + o.describe(); });
    return { styles: styles, structure: structure, ds: ds };
  }

  /* Block text for this session ('' when nothing changed). marked = with the session comments */
  function block(marked) {
    var L = lists();
    if (!L.styles.length && !L.structure.length) return '';
    if (!started) started = new Date();
    var d = started, pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var when = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
    var others = F.pages.map(function (p) { return '`' + p + '`'; }).join(', '), n = 1, out = [];
    out.push('## ' + F.name + ' · edited ' + when, '');
    if (F.handle) {
      out.push('**Everything below is already in `' + F.relPath + '`.** Do not redo it: no second insert, move, delete or style. ' +
        'Any copy of the page from earlier in the chat is out of date: read the file again before the first edit, then edit only the lines you just read.', '');
      out.push('Kiro, by tag:');
      out.push((n++) + '. `[done]`: nothing to do on this page.');
      if (L.styles.some(function (s) { return s.indexOf('[fold]') > -1; })) out.push((n++) + '. `[fold]`: the same inline style is on several elements. Move it into the element\'s own page class in the page `<style>` and remove the inline copies (elements with only `ac-*` / `dl-*` classes keep it inline). Keep the DS tokens.');
      if (L.styles.some(function (s) { return s.indexOf('[script]') > -1; })) out.push((n++) + '. `[script]`: these elements are made by a script, so the change is not in the file: change the script or the page class it uses.');
      if (L.styles.length) out.push((n++) + '. Make the same style and prop changes on the other pages of this mockup wherever the same elements appear: ' + (others || '(no other pages found in this folder)') + '.');
    } else {
      out.push('**NOT saved.** Apply every `[apply]` line to `' + F.relPath + '` (read the file first).');
      if (L.styles.length) out.push((n++) + '. Make the same style and prop changes on the other pages of this mockup wherever the same elements appear: ' + (others || '(no other pages found in this folder)') + '.');
    }
    out.push((n++) + '. Delete this file when you are done, and reply with one line per page you changed.');
    if (L.ds) out.push('', 'Rows on `rp-*` components change them on these pages only: keep shared.css as it is and tell the designer if the change belongs in the design system.');
    if (L.styles.length) out.push('', '### Styles and props (all pages of the mockup)', L.styles.join('\n'));
    if (L.structure.length) out.push('', '### Text and structure (this page only' + (F.handle ? ', already done' : '') + ')', L.structure.join('\n'));
    var body = out.join('\n');
    return marked ? '<!-- tweak:begin ' + session + ' -->\n' + body + '\n<!-- tweak:end ' + session + ' -->\n' : body;
  }
  T.kiroNotes = function () { return block(false); };
  /* Copy for Kiro: same text as the file */
  T.exportText = function () {
    var b = block(false), c = T.commentsBlock ? T.commentsBlock() : '';
    return b || c ? '# Tweak changes for Kiro\n\n' + [b, c].filter(Boolean).join('\n') : null;
  };

  /* ── tweak-changes.md ── */
  var BLOCK = /<!-- tweak:begin (\w+) -->[\s\S]*?<!-- tweak:end \1 -->\n?/g;
  function takeSnapshot() {
    var els = new Map();
    touched.forEach(function (t, el) { els.set(el, { cls: classes(el), ov: new Map(T.overridesOf(el)) }); });
    snap = { hist: T.history.length, els: els };
  }
  /* Kiro applied and deleted the file: what was already written counts as the new starting point */
  function consumed() {
    if (snap) snap.els.forEach(function (s, el) { var t = touched.get(el); if (t) { t.cls = s.cls; t.base = s.ov; } });
    histBase = snap ? snap.hist : T.history.length;
    started = null;
    wrote = false;
  }
  async function writeLog() {
    var dir = F.dir;
    if (!dir || typeof dir.getFileHandle !== 'function') return;
    var h = null, existing = '';
    try { h = await dir.getFileHandle(LOG); existing = await (await h.getFile()).text(); } catch (e) { h = null; }
    if (h === F.handle) return; /* test doubles hand back the page itself */
    var mine = existing.indexOf('<!-- tweak:begin ' + session + ' -->') > -1;
    if (wrote && !mine) consumed();
    if (T.syncComments) T.syncComments(existing); /* comments Kiro deleted are done (comments.js) */
    var others = (existing.match(BLOCK) || []).filter(function (b) { return b.indexOf('tweak:begin ' + session + ' ') < 0; });
    var otherNotes = T.COMMENTS_BLOCK ? (existing.match(T.COMMENTS_BLOCK) || []).filter(function (b) { return b.indexOf('tweak:comments ' + F.name + ' ') < 0; }) : [];
    var ours = block(true), notes = T.commentsBlock ? T.commentsBlock() : '';
    var blocks = others.concat(ours ? [ours] : [], otherNotes, notes ? [notes] : []);
    if (!blocks.length) {
      if (h && dir.removeEntry) { try { await dir.removeEntry(LOG); } catch (e) { /* keep */ } }
      wrote = false;
      takeSnapshot();
      return;
    }
    var text = HEADER + '\n' + blocks.map(function (b) { return b.replace(/\n*$/, '\n'); }).join('\n');
    if (text === existing) { takeSnapshot(); return; }
    if (!h) h = await dir.getFileHandle(LOG, { create: true });
    if (h === F.handle) return;
    var w = await h.createWritable();
    await w.write(text);
    await w.close();
    wrote = !!ours;
    takeSnapshot();
  }
  /* after a version restore: this visit's notes no longer match the file */
  T.forgetSession = function () { touched.clear(); histBase = T.history.length; started = null; return T.writeLog(); };
  T.writeLog = function () {
    queue = queue.then(writeLog).catch(function (e) { console.warn('[Tweak] ' + LOG + ' not written', e); });
    return queue;
  };
})(window.DLTweakNS);
