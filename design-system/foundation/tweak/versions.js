/* Tweak mode — version history (like Figma's). Before Tweak overwrites a page it keeps the
   previous file, so a bad save can always be taken back, also after a reload:
     - "Before Tweak": the file as it was before the first write of this visit,
     - "Autosave": the page after your changes. One per session: the first save creates it and
       every later save updates it; after 15 minutes the next save starts a new one. While the
       session runs it is not a row: the panel shows it as "Current version · Unsaved". A reload
       starts a new session (a new "Before Tweak" when the file changed, then a new autosave),
     - "Saved by you": History → Save a version now (when the page equals this session's autosave,
       the autosave becomes the saved version: one row),
   No version is kept when the page equals the newest one (Tweak and the Kiro hook).
     - "Before restore": the current file, kept when you restore an older one,
     - "Before Kiro edit": kept by the Kiro hook (.kiro/scripts/keep-version.sh) before Kiro writes the page.
   Versions are plain copies in .tweak-history/<page>/ next to the page (gitignored, the 40 newest
   per page are kept). Short names live in names.json there: { "<version file>": { name, by } },
   by = tweak (a summary of the session's changes, rewritten on every save), kiro (Kiro names the
   version before its edit with what it did, see the skill) or you (double-click a name). A version
   without a name shows what changed (T.describeDiff): a Kiro version against the page after it,
   an autosave / saved version against the version before it. Restore writes the version into the page and reloads it. Kiro can restore
   one too: copy the file over the page. Needs the folder connection (no history in Safari). */
(function (T) {
  'use strict';
  var S = T.s, F = T.file, I = T.icon, esc = T.esc;
  var DIR = '.tweak-history', KEEP = 40, EVERY = 15 * 60 * 1000;
  var firstDone = false, auto = null, items = null, armed = null, panel = null; /* auto: { name, at } of this session */
  var LABELS = { before: 'Before Tweak', auto: 'Autosave', manual: 'Saved by you', restore: 'Before restore', kiro: 'Before Kiro edit' };
  var NAMES = 'names.json', MAXLEN = 48, histEnd = 0; /* histEnd: T.history length at the last autosave write */

  function stem() { return F.name.replace(/\.html?$/i, ''); }
  async function folder(create) {
    if (!F.dir || typeof F.dir.getDirectoryHandle !== 'function') return null;
    try { var h = await F.dir.getDirectoryHandle(DIR, { create: !!create }); return await h.getDirectoryHandle(stem(), { create: !!create }); } catch (e) { return null; }
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function fileName(kind, d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + '_' + pad(d.getHours()) + '-' + pad(d.getMinutes()) + '-' + pad(d.getSeconds()) + '__' + kind + '.html'; }
  function parseName(n) {
    var m = /^(\d{4})-(\d\d)-(\d\d)_(\d\d)-(\d\d)-(\d\d)__(\w+)\.html$/.exec(n);
    return m ? { name: n, at: new Date(+m[1], m[2] - 1, +m[3], +m[4], +m[5], +m[6]), kind: m[7] } : null;
  }

  /* ── names.json ── */
  async function readNames(dir) {
    try { var o = JSON.parse(await (await (await dir.getFileHandle(NAMES)).getFile()).text()); return o && typeof o === 'object' ? o : {}; } catch (e) { return {}; }
  }
  /* read, change, write back (Kiro may have written it meanwhile); drops names of deleted versions */
  var nameQueue = Promise.resolve();
  function setName(file, name, by) {
    nameQueue = nameQueue.then(async function () {
      var dir = await folder(true);
      if (!dir) return;
      var names = await readNames(dir), cur = names[file], live = {};
      if (by === 'tweak' && cur && cur.by && cur.by !== 'tweak') return; /* never overwrite Kiro's or your name */
      if (name) names[file] = { name: String(name).slice(0, 80), by: by }; else delete names[file];
      (await listAll(dir)).forEach(function (v) { live[v.name] = 1; });
      Object.keys(names).forEach(function (k) { if (!live[k]) delete names[k]; });
      var w = await (await dir.getFileHandle(NAMES, { create: true })).createWritable();
      await w.write(JSON.stringify(names, null, 1) + '\n'); await w.close();
    }).catch(function (e) { console.warn('[Tweak] version name not kept', e); });
    return nameQueue;
  }

  /* ── Short names in plain words: what the Tweak edits of a session did ("Moved fields",
     "Button spacing, Text “Apply”"). No counts or signs: +/− belong to the line diff on the right ── */
  function human(n) { n = String(n || '').replace(/^(ac|dl)[-\s]+/i, '').replace(/[-_]+/g, ' ').trim(); return n.charAt(0).toUpperCase() + n.slice(1); }
  function elName(el) { try { return human(T.nameOf(el)); } catch (e) { return 'Element'; } }
  function family(p) {
    if (/^(padding|margin)/.test(p)) return 'spacing';
    if (/gap$/.test(p)) return 'gap';
    if (/^(width|height|min-|max-|flex$|flex-grow|flex-shrink|flex-basis|align-self|grid-template)/.test(p)) return 'size';
    if (p === 'color') return 'text color';
    if (/^background/.test(p)) return 'fill';
    if (p === 'border-radius') return 'radius';
    if (/^border/.test(p)) return 'stroke';
    if (/^(font|line-height|letter-spacing)/.test(p)) return 'type';
    if (/^(text-align|align-content|vertical-align|justify-content|align-items)$/.test(p)) return 'alignment';
    if (/^(display|flex-direction|flex-wrap)$/.test(p)) return 'layout';
    if (/^(position|left|top|right|bottom|z-index)$/.test(p)) return 'position';
    if (p === 'white-space') return 'text wrap';
    return p;
  }
  function phrasesOf(op, out) {
    if (!op) return;
    if (op.kind === 'batch') { (op.list || []).forEach(function (o) { phrasesOf(o, out); }); return; }
    var el = op.el, n = el ? elName(el) : 'Element';
    if (op.kind === 'style') {
      var seen = {};
      (op.describe() || '').split('; ').forEach(function (d) { var f = family(d.split(':')[0].trim()); if (f && !seen[f]) { seen[f] = 1; out.push(n + ' ' + f); } });
    } else if (op.kind === 'text') { var m = /→ "(.*)"$/.exec(op.describe() || ''); out.push('Text “' + (m ? (m[1].length > 18 ? m[1].slice(0, 18) + '…' : m[1]) : n) + '”'); }
    else if (op.kind === 'cls') out.push(n + ' props');
    else if (op.kind === 'insert') out.push('Added ' + n);
    else if (op.kind === 'del') out.push('Removed ' + n);
    else if (op.kind === 'dup') out.push('Duplicated ' + n);
    else if (op.kind === 'move') out.push('Moved ' + n);
    else if (op.kind === 'replace') out.push('Swapped ' + n);
  }
  var VERB = /^(Added|Removed|Duplicated|Moved|Swapped) (.+)$/;
  /* the same change on several elements is said once, in the plural for actions ("Moved fields");
     two kinds at most, then "and more" */
  function shorten(phrases) {
    var count = {}, order = [];
    phrases.forEach(function (p) { if (!count[p]) order.push(p); count[p] = (count[p] || 0) + 1; });
    var parts = order.map(function (p, i) { return say(p, count[p] > 1, i); }), out = '', used = 0;
    for (var i = 0; i < parts.length; i++) {
      var next = out ? out + ', ' + parts[i] : parts[i];
      if (used >= 2 || (out && next.length > MAXLEN)) break;
      out = next; used++;
    }
    return out ? out + (parts.length > used ? ' and more' : '') : '';
  }
  /* one phrase: actions name the element in lower case ("Moved field", plural "Moved fields");
     after the first phrase the sentence goes on in lower case. Quoted text stays as it is */
  function say(p, many, i) {
    var m = /“/.test(p) ? null : VERB.exec(p);
    if (m) p = m[1] + ' ' + m[2].toLowerCase() + (many && !/s$/i.test(m[2]) ? 's' : '');
    return i ? p.charAt(0).toLowerCase() + p.slice(1) : p;
  }
  /* names written before plain names ("− Icon ×3, − Select +12"): shown in the same plain words */
  function plain(label) {
    if (!/[×+−]/.test(label)) return label;
    var more = / \+\d+$/.test(label), parts = label.replace(/ \+\d+$/, '').split(', ').map(function (p, i) {
      var many = / ×\d+$/.test(p); p = p.replace(/ ×\d+$/, '');
      var m = /^([+−]) (.+?)( copy)?$/.exec(p);
      if (m) p = (m[3] ? 'Duplicated ' : m[1] === '+' ? 'Added ' : 'Removed ') + m[2];
      else if (/ moved$/.test(p)) p = 'Moved ' + p.replace(/ moved$/, '');
      else if (/ swapped$/.test(p)) p = 'Swapped ' + p.replace(/ swapped$/, '');
      return say(p, many, i);
    });
    return parts.join(', ') + (more ? ' and more' : '');
  }
  T.plainVersionName = plain; /* tests */
  T.summarizeOps = function (ops) { var out = []; (ops || []).forEach(function (o) { phrasesOf(o, out); }); return shorten(out); };
  /* A Kiro version without a name: what changed in the page after it (components added / removed, new text) */
  var parser = new DOMParser();
  function roots() { var r = []; (T.COMPONENTS || []).forEach(function (c) { [].concat(c.root).forEach(function (x) { if (x && r.indexOf(x) < 0) r.push(x); }); }); return r; }
  function texts(doc) {
    var out = {}, w = doc.createTreeWalker(doc.body || doc, NodeFilter.SHOW_TEXT), n;
    while ((n = w.nextNode())) { if (n.parentNode && /^(SCRIPT|STYLE)$/.test(n.parentNode.nodeName)) continue; var t = n.nodeValue.replace(/\s+/g, ' ').trim(); if (t) out[t] = (out[t] || 0) + 1; }
    return out;
  }
  /* elements by kind (tag + first class), in document order: a style or class change on the n-th one
     of a kind becomes "Badge spacing", "Card props"; added / removed components and new text too */
  var TAG = { div: 'Frame', span: 'Text', p: 'Paragraph', a: 'Link', button: 'Button', img: 'Image', label: 'Label', h1: 'Heading', h2: 'Heading', h3: 'Heading', h4: 'Heading', li: 'List item', td: 'Cell', th: 'Header cell', tr: 'Row', input: 'Input', section: 'Section' };
  var STATE = /^(open|active|selected|on|visible|collapsed|hidden|show)$/;
  function kinds(doc) {
    var out = {};
    Array.prototype.forEach.call((doc.body || doc).querySelectorAll('*'), function (el) {
      if (/^(SCRIPT|STYLE|TEMPLATE)$/.test(el.tagName)) return;
      var c = Array.prototype.filter.call(el.classList, function (x) { return !STATE.test(x); });
      var k = el.tagName.toLowerCase() + '.' + (c[0] || '');
      (out[k] = out[k] || []).push({ style: el.getAttribute('style') || '', cls: c.slice(1).sort().join(' '), name: c[0] ? human(c[0]) : TAG[el.tagName.toLowerCase()] || el.tagName.toLowerCase() });
    });
    return out;
  }
  function decls(st) { var o = {}; st.split(';').forEach(function (d) { var k = d.indexOf(':'); if (k > 0) o[d.slice(0, k).trim().toLowerCase()] = d.slice(k + 1).trim(); }); return o; }
  T.describeDiff = function (a, b) {
    if (a == null || b == null || a === b) return '';
    var A = parser.parseFromString(a, 'text/html'), B = parser.parseFromString(b, 'text/html'), out = [], rs = roots(), isRoot = {};
    rs.forEach(function (r) { isRoot[r] = 1; });
    rs.forEach(function (r) {
      var d = B.getElementsByClassName(r).length - A.getElementsByClassName(r).length;
      for (var k = 0; k < Math.abs(d); k++) out.push((d > 0 ? 'Added ' : 'Removed ') + human(r));
    });
    var ka = kinds(A), kb = kinds(B);
    /* plain elements added / removed (components are counted above) */
    Object.keys(ka).concat(Object.keys(kb)).filter(function (k, i, all) { return all.indexOf(k) === i && !isRoot[k.split('.')[1]]; }).forEach(function (k) {
      var d = (kb[k] || []).length - (ka[k] || []).length, nm = ((kb[k] || ka[k])[0] || {}).name;
      for (var i = 0; i < Math.abs(d); i++) out.push((d > 0 ? 'Added ' : 'Removed ') + nm);
    });
    Object.keys(kb).forEach(function (k) {
      var la = ka[k] || [], lb = kb[k];
      for (var i = 0; i < Math.min(la.length, lb.length); i++) {
        var x = la[i], y = lb[i];
        if (x.cls !== y.cls) out.push(y.name + ' props');
        if (x.style === y.style) continue;
        var da = decls(x.style), db = decls(y.style), fams = {};
        Object.keys(da).concat(Object.keys(db)).forEach(function (p) { if (da[p] !== db[p]) fams[family(p)] = 1; });
        Object.keys(fams).forEach(function (f) { out.push(y.name + ' ' + f); });
      }
    });
    var ta = texts(A), tb = texts(B), added = Object.keys(tb).filter(function (t) { return !ta[t] && t.length > 1; });
    var cut = function (t) { return t.length > 18 ? t.slice(0, 18) + '…' : t; };
    added.forEach(function (t) { out.push('Text “' + cut(t) + '”'); });
    Object.keys(ta).filter(function (t) { return !tb[t] && t.length > 1; }).forEach(function (t) { if (!added.length) out.push('Removed text “' + cut(t) + '”'); });
    return shorten(out) || (a.replace(/\s+/g, '') === b.replace(/\s+/g, '') ? 'Formatting' : 'Small edits');
  };

  /* the newest version with its text (null when there is none) */
  async function newest(dir) {
    var list = await listAll(dir), v = list[0];
    if (!v) return null;
    try { v.text = await (await (await dir.getFileHandle(v.name)).getFile()).text(); } catch (e) { v.text = undefined; }
    return v;
  }
  /* Nothing changed since the newest version → no new one. Save (manual) on a page that equals
     this session's autosave turns that autosave into the saved version (one row, not two) */
  async function keep(text, kind) {
    var dir = await folder(true);
    if (!dir || text == null) return;
    if (kind === 'manual' && auto) {
      var live = { name: auto.name, kind: 'auto' };
      try { live.text = await (await (await dir.getFileHandle(auto.name)).getFile()).text(); } catch (e) { live.text = undefined; }
      if (live.text === text) { await promote(dir, live); return; }
    }
    var top = await newest(dir);
    if (top && top.text === text) {
      if (kind === 'manual' && top.kind === 'auto') await promote(dir, top);
      return;
    }
    var file = fileName(kind, new Date()), h = await dir.getFileHandle(file, { create: true }), w = await h.createWritable();
    await w.write(text); await w.close();
    if (kind === 'manual') { var sum = T.summarizeOps(T.history); if (sum) await setName(file, sum, 'tweak'); }
    var list = await listAll(dir);
    for (var i = KEEP; i < list.length; i++) { try { await dir.removeEntry(list[i].name); } catch (e) { /* keep */ } }
    items = null;
    if (panel && !panel.hidden) T.openHistory();
  }
  async function promote(dir, v) {
    var file = v.name.replace(/__auto\.html$/, '__manual.html'), w = await (await dir.getFileHandle(file, { create: true })).createWritable();
    await w.write(v.text); await w.close();
    try { await dir.removeEntry(v.name); } catch (e) { /* keep */ }
    if (auto && auto.name === v.name) auto = null; /* the next change starts a new autosave */
    var names = await readNames(dir), n = names[v.name];
    await setName(file, n ? n.name : T.summarizeOps(T.history), n ? n.by : 'tweak');
    items = null;
  }
  async function listAll(dir) {
    var out = [];
    try { for await (var h of dir.values()) { if (h.kind !== 'file') continue; var p = parseName(h.name); if (p) out.push(p); } } catch (e) { /* no listing */ }
    var ORDER = { before: 0, restore: 1, kiro: 1, auto: 2, manual: 3 };
    out.sort(function (a, b) { return b.at - a.at || (ORDER[b.kind] || 0) - (ORDER[a.kind] || 0); });
    return out;
  }

  /* file.js calls this with the file as it is on disk, right before overwriting it: the original
     of this session (once; skipped when it equals the newest version, e.g. the last autosave) */
  T.versionBeforeWrite = function (disk) {
    if (firstDone) return Promise.resolve();
    firstDone = true;
    return keep(disk, 'before').catch(function (e) { console.warn('[Tweak] version not kept', e); });
  };
  /* …and with the new text right after writing it: the session's autosave, rewritten on every
     save; a new one when the current one is 15 minutes old */
  var autoQueue = Promise.resolve();
  T.versionAfterWrite = function (text) {
    autoQueue = autoQueue.then(async function () {
      var dir = await folder(true);
      if (!dir) return;
      var now = new Date();
      if (!auto || now - auto.at >= EVERY) {
        var top = await newest(dir);
        if (top && top.text === text) return; /* same as the newest version: nothing to keep yet */
        auto = { name: fileName('auto', now), at: now, base: Math.min(histEnd, T.history.length) };
        var list = await listAll(dir);
        for (var i = KEEP - 1; i < list.length; i++) { try { await dir.removeEntry(list[i].name); } catch (e) { /* keep */ } }
      }
      else {
        /* undone back to the version before this autosave: the autosave has nothing of its own */
        var prev = (await listAll(dir)).filter(function (v) { return v.name !== auto.name; })[0], pt;
        if (prev) { try { pt = await (await (await dir.getFileHandle(prev.name)).getFile()).text(); } catch (e) { /* unreadable */ } }
        if (pt === text) { try { await dir.removeEntry(auto.name); } catch (e) { /* keep */ } auto = null; items = null; if (panel && !panel.hidden) T.openHistory(); return; }
      }
      var w = await (await dir.getFileHandle(auto.name, { create: true })).createWritable();
      await w.write(text); await w.close();
      histEnd = T.history.length;
      var sum = T.summarizeOps(T.history.slice(Math.min(auto.base, T.history.length)));
      if (sum) await setName(auto.name, sum, 'tweak');
      items = null;
      if (panel && !panel.hidden) T.openHistory();
    }).catch(function (e) { console.warn('[Tweak] autosave version not kept', e); });
    return autoQueue;
  };

  /* ── Panel ── */
  panel = document.createElement('aside');
  panel.className = 'hpop surface'; panel.id = 'history'; panel.hidden = true;
  T.$('#ui').insertBefore(panel, T.$('#colorpicker'));
  function changedLines(a, b) {
    var A = (a || '').split('\n'), B = (b || '').split('\n'), count = {}, add = 0, del = 0;
    A.forEach(function (l) { count[l] = (count[l] || 0) + 1; });
    B.forEach(function (l) { if (count[l]) count[l]--; else add++; });
    Object.keys(count).forEach(function (k) { del += count[k]; });
    return { add: add, del: del };
  }
  function when(d) {
    var today = new Date(), y = new Date(today.getTime() - 864e5);
    var day = d.toDateString() === today.toDateString() ? 'Today' : d.toDateString() === y.toDateString() ? 'Yesterday' : d.toLocaleDateString();
    return { day: day, time: pad(d.getHours()) + ':' + pad(d.getMinutes()) };
  }
  /* Save & history: the toolbar's save button opens it.
     Top: Copy for Kiro + the Auto-save switch. Then the list: the day line (undo / redo on the
     right), the current file as the first row ("Unsaved changes" with Save, or "Saved"), then
     the versions. Row actions show on hover, over the +/− column.
     list: [{ name, at, kind, add, del }] (build-tweak-ui.py passes sample rows) */
  function saveSection() {
    var n = T.unsavedCount(), auto = S.autosave;
    /* one Copy for Kiro: the prompt, plus the changes the file cannot hold (script-made elements) */
    return '<div class="fsec"><div class="fstate">' +
      '<button class="btnline" data-act="copy-kiro" title="Copy the page address and a prompt for the Kiro chat' + (n ? ' · includes ' + n + ' change' + (n > 1 ? 's' : '') + ' that are not in the file (script-made elements)' : '') + '">' + I('clipboard-copy', 12) + 'Copy for Kiro' + (n ? '<span class="tb-badge">' + n + '</span>' : '') + '</button><span class="fsp"></span>' +
      '<button class="tog' + (auto ? ' on' : '') + '" data-act="autosave" title="' + (auto ? 'Every change is written into the file right away' : 'Changes wait for Save or ⌘S') + '"><span class="box"></span>Auto-save</button></div></div>';
  }
  function dayLine(label, arrows) {
    return '<div class="libcat hday"><span>' + esc(label) + '</span>' + (arrows ?
      '<button class="ib" data-act="undo" title="Undo  ⌘Z"' + (T.history.length ? '' : ' disabled') + '>' + I('undo-2', 14) + '</button>' +
      '<button class="ib" data-act="redo" title="Redo  ⇧⌘Z"' + (T.future.length ? '' : ' disabled') + '>' + I('redo-2', 14) + '</button>' : '') + '</div>';
  }
  /* "Current version": the page now (Figma's name), its state in gray next to it. Any edit makes it
     Unsaved (blue Save always visible) until Save keeps it as a named version, also with auto-save
     on: the file is written, but the session's autosave is this row, not a row of its own.
     Saved: Save keeps a version (on hover). demo: build-tweak-ui.py draws the unsaved state */
  var demoPending = false;
  function pendingVersion() { return F.state === 'unsaved' || !!auto || demoPending; }
  function currentRow() {
    var saving = F.state === 'saving', dirty = !saving && pendingVersion();
    var state = saving ? 'Saving…' : dirty ? 'Unsaved' : 'Saved';
    var tip = dirty ? (F.state === 'unsaved' ? 'Not in ' + F.name + ' yet' : 'Written to ' + F.name + ' (auto-save), not kept as a version yet') + ' · Save keeps it as a named version' : F.name;
    return '<div class="hrow hcur' + (dirty ? ' dirty' : '') + '"><span class="htime">Now</span><span class="hbody" title="' + esc(tip) + '"><span class="hname">Current version</span><span class="hkind' + (dirty ? ' warn' : '') + '">' + state + '</span></span>' +
      '<span class="hside"><span class="hdiff">' + esc(F.name) + '</span><span class="hact">' +
      '<button class="btnline" data-act="history-keep" title="Save the file now and keep it as a version  ⌘S saves without a version"' + (saving ? ' disabled' : '') + '>Save</button></span></span></div>';
  }
  T.renderHistory = function (list, note, demo) {
    var html = '';
    demoPending = !!demo;
    /* the session's autosave is the current version (Unsaved), not a row below it */
    list = (list || []).filter(function (v) { return !(auto && v.name === auto.name); });
    if (note) html += '<div class="cstat">' + I('folder-open', 12) + '<span>' + note + '</span></div>';
    else {
      var today = when(new Date()).day, day = today;
      html += saveSection() + '<div class="lib">' + dayLine(today, true) + currentRow() + (list.length ? list.map(function (v) {
        var w = when(v.at), head = w.day !== day ? dayLine(w.day) : '';
        day = w.day;
        var diff = v.add || v.del ? '<span class="hdiff"><i>+' + v.add + '</i> <s>−' + v.del + '</s></span>' : '<span class="hdiff">same as now</span>';
        var on = armed === v.name;
        /* an autosave covers a stretch of time: 13:01–13:12 */
        var until = v.kind === 'auto' && v.until && v.until - v.at > 60000 ? '–' + when(v.until).time : '';
        /* the name fills the row; the kind (Autosave, Before Kiro edit…) is in the tooltip, Kiro rows are purple */
        var label = v.label || LABELS[v.kind] || v.kind, tip = (LABELS[v.kind] || v.kind) + (v.label ? ': ' + v.label : '') + ' · double-click to rename';
        return head + '<div class="hrow' + (on ? ' armed' : '') + (v.kind === 'kiro' ? ' kiro' : '') + '"><span class="htime' + (until ? ' range' : '') + '">' + w.time + until + '</span><span class="hbody" title="' + esc(tip) + '"><span class="hname" data-rename="' + esc(v.name) + '">' + esc(label) + '</span>' +
          '</span>' +
          '<span class="hside">' + diff + '<span class="hact">' +
          '<button class="ib" data-act="history-preview" data-name="' + esc(v.name) + '" title="Open this version in a new tab">' + I('eye', 14) + '</button>' +
          (on ? '<button class="btnline" data-act="history-restore" data-name="' + esc(v.name) + '" title="Write this version into ' + esc(F.name) + '">Restore?</button>'
            : '<button class="ib" data-act="history-restore" data-name="' + esc(v.name) + '" title="Restore this version (the current file is kept as a version first)">' + I('rotate-ccw', 14) + '</button>') + '</span></span></div>';
      }).join('') : '<div class="hempty">No versions yet. Tweak keeps the original before your first change, one autosave per session (a new one every 15 minutes) and the file before Kiro changes it.</div>') + '</div>';
    }
    panel.innerHTML = html;
    place();
  };
  /* a small list right above the save button (like a menu), not a side panel */
  function place() {
    if (panel.hidden) return;
    var b = T.$('#bar [data-act="history"], #bar [data-act="connect"], #bar [data-act="resume"]');
    var r = b ? b.getBoundingClientRect() : { left: window.innerWidth / 2, width: 0, top: window.innerHeight - 56 };
    var w = panel.offsetWidth || 300, x = Math.max(8, Math.min(r.left + r.width / 2 - w / 2, window.innerWidth - w - 8));
    panel.style.left = x + 'px';
    panel.style.bottom = (window.innerHeight - r.top + 8) + 'px';
  }
  T.frameHooks.push(place);
  /* a click anywhere outside the editor closes it, like a menu */
  window.addEventListener('pointerdown', function (e) { if (!panel.hidden && e.composedPath().indexOf(T.host) < 0) T.closeHistory(); }, true);
  T.openHistory = async function () {
    T.closeLibrary(); T.closeIconPicker();
    panel.hidden = false;
    T.renderToolbar();
    if (!F.dir) { T.renderHistory([], F.canPick ? 'History needs the folder connection: click <b>Save to file</b> once (pick the kit folder).' : 'This browser cannot write files, so there is no version history here (use Chrome or Edge).'); return; }
    T.renderHistory(items || [], null);
    var dir = await folder(false), list = dir ? await listAll(dir) : [];
    for (var i = 0; i < list.length; i++) {
      try { var fl = await (await dir.getFileHandle(list[i].name)).getFile(); list[i].text = await fl.text(); list[i].until = new Date(fl.lastModified); var c = changedLines(F.lastDisk, list[i].text); list[i].add = c.add; list[i].del = c.del; } catch (e) { /* skip */ }
    }
    var names = dir ? await readNames(dir) : {};
    list.forEach(function (v, i) {
      var n = names[v.name];
      if (n && n.name) { v.label = n.by === 'tweak' ? plain(n.name.replace(/^Ac /, '')) : n.name.replace(/^Ac /, ''); v.by = n.by; return; }
      var d = '';
      /* Kiro's version is the page before its edit: describe what the next state changed */
      if (v.kind === 'kiro') d = T.describeDiff(v.text, i ? list[i - 1].text : F.lastDisk);
      /* an autosave or a saved version without a name (made before names existed): what it changed since the version before */
      else if ((v.kind === 'auto' || v.kind === 'manual') && list[i + 1]) d = T.describeDiff(list[i + 1].text, v.text);
      if (d) { v.label = d; v.by = 'diff'; }
    });
    items = list;
    if (!panel.hidden) T.renderHistory(items, null);
  };
  /* Rename: double-click a version's name, Enter keeps it, Esc cancels, empty = back to automatic */
  panel.addEventListener('dblclick', function (e) {
    var n = e.target.closest && e.target.closest('[data-rename]'), v = n && byName(n.getAttribute('data-rename'));
    if (!v) return;
    var inp = document.createElement('input');
    inp.className = 'hrename'; inp.value = v.by === 'diff' ? '' : v.label || ''; inp.placeholder = LABELS[v.kind] || v.kind; inp.maxLength = 80;
    n.replaceWith(inp); inp.focus(); inp.select();
    var done = false;
    function finish(save) {
      if (done) return; done = true;
      var val = inp.value.trim();
      if (!save) { T.renderHistory(items, null); return; }
      setName(v.name, val, 'you').then(function () { T.openHistory(); });
    }
    inp.addEventListener('keydown', function (k) { k.stopPropagation(); if (k.isComposing || k.keyCode === 229) return; /* IME composition */ if (k.key === 'Enter') { k.preventDefault(); finish(true); } else if (k.key === 'Escape') { k.preventDefault(); finish(false); } });
    inp.addEventListener('blur', function () { finish(true); });
  });
  T.closeHistory = function () { panel.hidden = true; armed = null; T.renderToolbar(); };
  /* keep the save part live while the panel is open */
  T.on('state', function () { if (!panel.hidden && F.dir) T.renderHistory(items || [], null); });
  T.on('change', function () { if (!panel.hidden && F.dir) T.renderHistory(items || [], null); }); /* undo / redo buttons */
  T.historyOpen = function () { return !panel.hidden; };
  function byName(n) { return (items || []).filter(function (v) { return v.name === n; })[0]; }

  T.action('history', function () { if (!panel.hidden) T.closeHistory(); else T.openHistory(); });
  T.action('history-close', function () { T.closeHistory(); });
  /* Copy for Kiro: the page address + a prompt (tweak-changes.md has the changes and comments) */
  T.action('copy-kiro', function () {
    var url = location.href.split('#')[0];
    try { url = decodeURI(url); } catch (e) { /* keep it encoded */ }
    var c = T.comments ? T.comments().length : 0;
    var text = 'Apply my Tweak changes' + (c ? ' and comments' : '') + ' on ' + F.name + ' (' + url + '). They are in tweak-changes.md next to the page.';
    var extra = T.unsavedCount() ? T.exportText() : null; /* changes on script-made elements: not in the file */
    if (extra) text += '\n\nThese changes could not be written into the file, apply them too:\n' + extra;
    T.copyText(text).then(function () { T.notify('Copied — paste it into the Kiro chat'); }, function () { T.notify('Copy failed', 'error'); });
  });
  T.action('history-keep', function () {
    if (!F.handle) return;
    var go = function () { autoQueue.then(function () { return keep(F.text, 'manual'); }).then(function () { T.notify('Saved · kept as a version'); if (!panel.hidden) T.openHistory(); }); };
    if (F.text !== F.lastDisk) { clearTimeout(F.timer); T.writeNow().then(go); } else go();
  });
  /* Preview: the version as a file in .tweak-history/<page>/preview.html (a blob: page cannot load
     the local shared.css), with the page folder as <base> and a bar at the bottom: Back closes the
     tab, Restore asks this tab to restore it (postMessage), then the preview closes */
  var previewWin = null, previewName = null;
  function previewHtml(v) {
    var w = when(v.at), label = (LABELS[v.kind] || v.kind) + (v.label ? ': ' + v.label : '');
    var bar = '<div id="dl-version-bar" style="position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:2147483647;display:flex;align-items:center;gap:6px;padding:6px 6px 6px 14px;background:#1e1e1e;color:#fff;border-radius:10px;font:12px/16px Inter,-apple-system,BlinkMacSystemFont,\'Segoe UI\',system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.25);white-space:nowrap">' +
      '<span style="margin-right:8px">Previous version · <b>' + esc(w.day + ' ' + w.time) + '</b> · ' + esc(label) + '</span>' +
      '<button type="button" data-dlv="back" style="all:unset;cursor:pointer;height:28px;padding:0 12px;border-radius:6px;background:#3a3a3a">Back</button>' +
      '<button type="button" data-dlv="restore" style="all:unset;cursor:pointer;height:28px;padding:0 12px;border-radius:6px;background:#0d99ff;font-weight:600">Restore this version</button></div>' +
      '<script>(function(){var bar=document.getElementById("dl-version-bar"),msg=bar.querySelector("span");' +
      'function back(){window.close();setTimeout(function(){if(!window.closed&&history.length>1)history.back();},150);}' +
      'bar.addEventListener("click",function(e){var b=e.target.closest("[data-dlv]");if(!b)return;' +
      'if(b.getAttribute("data-dlv")==="back")return back();' +
      'if(!window.opener){msg.textContent="Open Save & history in the editor tab to restore this version";return;}' +
      'msg.textContent="Restoring…";window.opener.postMessage({dlTweakRestore:' + JSON.stringify(v.name) + '},"*");});' +
      'window.addEventListener("message",function(e){if(e.data&&e.data.dlTweakRestored)back();if(e.data&&e.data.dlTweakRestoreFailed)msg.textContent="Restore failed";});' +
      'document.addEventListener("keydown",function(e){if(e.key==="Escape")back();});})();<\/script>';
    var html = v.text.replace(/<head([^>]*)>/i, '<head$1><base href="../../">');
    return /<\/body>/i.test(html) ? html.replace(/<\/body>(?![\s\S]*<\/body>)/i, bar + '</body>') : html + bar;
  }
  T.versionPreviewHtml = previewHtml; /* tests */
  T.action('history-preview', function (b) {
    var v = byName(b.getAttribute('data-name'));
    if (!v || v.text == null) return;
    var tab = window.open('', '_blank'); /* open now (inside the click), fill it once the file is written */
    (async function () {
      var dir = await folder(true);
      if (!dir) throw new Error('no history folder');
      var h = await dir.getFileHandle('preview.html', { create: true }), w = await h.createWritable();
      await w.write(previewHtml(v)); await w.close();
      var url = location.href.replace(/[#?].*$/, '').replace(/[^/]*$/, '') + DIR + '/' + encodeURIComponent(stem()) + '/preview.html?v=' + Date.now();
      previewWin = tab || window.open(url, '_blank'); previewName = v.name;
      if (tab) tab.location.href = url;
    })().catch(function () { if (tab) tab.close(); T.notify('Preview failed', 'error'); });
  });
  /* Restore asked for by the preview tab */
  window.addEventListener('message', function (e) {
    var name = e.data && e.data.dlTweakRestore;
    if (!name || !previewWin || e.source !== previewWin || name !== previewName) return;
    var v = byName(name), src = e.source;
    if (!v) { src.postMessage({ dlTweakRestoreFailed: true }, '*'); return; }
    restore(v).then(function () { src.postMessage({ dlTweakRestored: true }, '*'); }, function () { src.postMessage({ dlTweakRestoreFailed: true }, '*'); });
  });
  async function restore(v) {
    clearTimeout(F.timer);
    var disk = await (await F.handle.getFile()).text();
    await keep(disk, 'restore');
    var w = await F.handle.createWritable(); await w.write(v.text); await w.close();
    F.text = F.lastDisk = v.text;
    T.setFileState('saved');
    if (T.forgetSession) await T.forgetSession(); /* this visit's notes no longer match the file */
    T.notify('Restored the version from ' + when(v.at).time + ' — reloading');
    setTimeout(function () { location.reload(); }, 600);
  }
  T.action('history-restore', function (b) {
    var name = b.getAttribute('data-name'), v = byName(name);
    if (!v || v.text == null || !F.handle) return;
    if (armed !== name) { armed = name; T.renderHistory(items, null); setTimeout(function () { if (armed === name) { armed = null; if (!panel.hidden) T.renderHistory(items, null); } }, 4000); return; }
    armed = null;
    restore(v).catch(function () { T.notify('Restore failed', 'error'); });
  });
})(window.DLTweakNS);
