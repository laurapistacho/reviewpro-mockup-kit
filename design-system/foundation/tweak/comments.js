/* Tweak mode — comments (like Figma). The comment tool (toolbar bubble, C) pins a note to the
   element under the pointer. Each comment remembers that element (a path from <body> with tags,
   classes and positions, plus its text), so it finds it again after a reload, in any state of
   the flow (a closed panel just hides its pins until it opens).

   Comments go to Kiro without Save: they are written into tweak-changes.md next to the page
   (one block per page, kiro-log.js) as soon as the folder is connected, and kept in this browser
   (localStorage) until then. Kiro applies a comment and deletes its lines; Tweak reads the file
   again (on load and when the window gets focus) and the pin disappears. Resolve (✓) or the trash
   (on hover in the list, or Delete all in the list header) removes comments by hand: they are
   remembered as deleted until tweak-changes.md no longer has them, so a sync cannot bring them
   back. The page HTML itself never gets comments. */
(function (T) {
  'use strict';
  var S = T.s, F = T.file, I = T.icon, esc = T.esc;
  var KEY = 'dl-tweak-comments:' + location.pathname;
  var list = [];          /* { id, text, at, path, tag, cls, snippet, fx, fy, synced } */
  var gone = {};          /* ids deleted here that tweak-changes.md may still list */
  var openId = null, draft = null;

  /* ── Storage in this browser (until the folder is connected) ── */
  function store() { try { localStorage.setItem(KEY, JSON.stringify(list)); localStorage.setItem(KEY + ':gone', JSON.stringify(gone)); } catch (e) { /* storage blocked */ } }
  try { list = JSON.parse(localStorage.getItem(KEY) || '[]') || []; } catch (e) { list = []; }
  try { gone = JSON.parse(localStorage.getItem(KEY + ':gone') || '{}') || {}; } catch (e) { gone = {}; }
  T.comments = function () { return list; };

  /* ── Where a comment points: a path from <body> ── */
  function own(el) { return T.src.isOwnNode(el) || !!el.closest('#dl-tweak-host'); }
  function classesOf(el) { return Array.prototype.filter.call(el.classList, function (c) { return !T.isStateClass(c); }); }
  function snippetOf(el) { var s = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim(); return s.length > 60 ? s.slice(0, 60) + '…' : s; }
  function pathOf(el) {
    var steps = [];
    for (var n = el; n && n !== document.body && n.parentElement; n = n.parentElement) {
      var i = 0, s = n;
      while ((s = s.previousElementSibling)) if (s.tagName === n.tagName && !own(s)) i++;
      steps.unshift({ t: n.tagName.toLowerCase(), c: classesOf(n).slice(0, 3), i: i, id: n.id || undefined });
    }
    return steps;
  }
  function stepMatch(el, st) { return el.tagName.toLowerCase() === st.t && st.c.every(function (c) { return el.classList.contains(c); }); }
  function resolve(c) {
    if (c._el && c._el.isConnected) return c._el;
    var n = document.body;
    for (var k = 0; n && k < c.path.length; k++) {
      var st = c.path[k], kids = Array.prototype.filter.call(n.children, function (x) { return !own(x); });
      var byId = st.id && document.getElementById(st.id);
      if (byId && byId.parentElement === n) { n = byId; continue; }
      var same = kids.filter(function (x) { return x.tagName.toLowerCase() === st.t; });
      var hit = same[st.i] && stepMatch(same[st.i], st) ? same[st.i] : same.filter(function (x) { return stepMatch(x, st); })[0];
      n = hit || null;
    }
    if (n && c.snippet && snippetOf(n).slice(0, 20) !== c.snippet.slice(0, 20)) {
      /* the page changed: look for the same kind of element with the same text */
      var sel = c.tag + c.cls.map(function (x) { return '.' + CSS.escape(x); }).join('');
      var alt = Array.prototype.filter.call(document.querySelectorAll(sel), function (x) { return !own(x) && snippetOf(x) === c.snippet; })[0];
      if (alt) n = alt;
    }
    c._el = n;
    return n;
  }
  function lineOf(el) {
    var node = el && T.nodeFor(el);
    return node && F.text ? F.text.slice(0, node.start).split('\n').length : null;
  }
  function visible(el) { if (!el || !el.isConnected) return false; var r = el.getBoundingClientRect(); return r.width > 0 || r.height > 0; }

  /* ── Add / resolve ── */
  function add(el, fx, fy, text) {
    var c = { id: 'c' + Math.random().toString(36).slice(2, 6), text: text, at: new Date().toISOString(), path: pathOf(el),
      tag: el.tagName.toLowerCase(), cls: classesOf(el).slice(0, 3), snippet: snippetOf(el), fx: fx, fy: fy, synced: false };
    c._el = el;
    list.push(c);
    changed();
    return c;
  }
  function remove(ids) {
    ids = [].concat(ids);
    list = list.filter(function (c) { if (ids.indexOf(c.id) < 0) return true; if (c.synced) gone[c.id] = 1; return false; });
    if (ids.indexOf(openId) > -1) openId = null;
    changed();
  }
  function changed() { store(); T.renderInspector(); T.renderToolbar(); render(); share(); }
  /* write tweak-changes.md now (no Save needed); kept here until a folder is connected */
  function share() { if (F.dir && T.writeLog) T.writeLog(); }

  /* ── The block for tweak-changes.md (kiro-log.js asks for it on every write) ── */
  function jsonSafe(o) { return JSON.stringify(o).replace(/--/g, '-\\u002d'); }
  T.commentsBlock = function () {
    if (!list.length) return '';
    var page = F.name, out = ['<!-- tweak:comments ' + page + ' -->', '## Comments on ' + page, '',
      'Kiro: for each comment, change the element it points to (read the page from disk first: the line is a hint, the path and the text are exact). ' +
      'Then delete the comment\'s two lines below. When no comment is left, delete this block, and the file when it is empty.', ''];
    list.forEach(function (c) {
      var el = resolve(c), line = lineOf(el), path = c.path.slice(-3).map(function (s) { return s.t + s.c.map(function (x) { return '.' + x; }).join(''); }).join(' > ');
      c.line = line || c.line || null;
      out.push('- [comment ' + c.id + '] ' + (c.line ? 'line ' + c.line + ' · ' : '') + '`' + path + '`' + (c.snippet ? ' ("' + c.snippet.replace(/"/g, '\'') + '")' : '') + (el ? '' : ' — element not found on the page now') + ': ' + c.text.replace(/\s*\n\s*/g, ' / '));
      var data = { page: page, text: c.text, at: c.at, path: c.path, tag: c.tag, cls: c.cls, snippet: c.snippet, fx: c.fx, fy: c.fy, line: c.line };
      out.push('  <!-- ' + c.id + ' ' + jsonSafe(data) + ' -->');
    });
    out.push('<!-- /tweak:comments ' + page + ' -->');
    return out.join('\n') + '\n';
  };
  T.COMMENTS_BLOCK = /<!-- tweak:comments (\S+) -->[\s\S]*?<!-- \/tweak:comments \1 -->\n?/g;

  /* Comments of this page in the file text: only items whose bullet line is still there */
  function parse(text) {
    var out = [], re = new RegExp(T.COMMENTS_BLOCK.source, 'g'), m;
    while ((m = re.exec(text || ''))) {
      if (m[1] !== F.name) continue;
      var b = m[0], dm, dre = /<!-- (c\w+) (\{.*\}) -->/g;
      while ((dm = dre.exec(b))) {
        if (b.indexOf('[comment ' + dm[1] + ']') < 0) continue;
        try { var d = JSON.parse(dm[2]); out.push({ id: dm[1], text: d.text, at: d.at, path: d.path || [], tag: d.tag, cls: d.cls || [], snippet: d.snippet, fx: d.fx, fy: d.fy, line: d.line, synced: true }); } catch (e) { /* broken line */ }
      }
    }
    return out;
  }
  /* Before writing: comments written earlier but gone from the file were applied by Kiro */
  T.syncComments = function (fileText) {
    var inFile = parse(fileText), ids = {};
    inFile.forEach(function (c) { ids[c.id] = c; });
    Object.keys(gone).forEach(function (id) { if (!ids[id]) delete gone[id]; }); /* the file forgot it too */
    inFile = inFile.filter(function (c) { return !gone[c.id]; });
    var before = list.length;
    list = list.filter(function (c) { return !c.synced || ids[c.id]; });
    inFile.forEach(function (c) { if (!list.some(function (x) { return x.id === c.id; })) list.push(c); });
    list.forEach(function (c) { c.synced = true; });
    store();
    if (list.length !== before) { T.renderToolbar(); if (S.tool === 'comment') T.renderInspector(); render(); }
  };
  /* After connecting and when the window gets focus: read the file again (Kiro may have resolved some) */
  T.loadComments = function () {
    if (!F.dir || typeof F.dir.getFileHandle !== 'function') return;
    F.dir.getFileHandle('tweak-changes.md').then(function (h) { return h.getFile(); }).then(function (f) { return f.text(); })
      .then(function (text) { var unsynced = list.some(function (c) { return !c.synced; }); T.syncComments(text); if (unsynced) share(); },
        function () { var unsynced = list.some(function (c) { return !c.synced; }); T.syncComments(''); if (unsynced) share(); });
  };
  window.addEventListener('focus', function () { if (S.active) T.loadComments(); });

  /* ── Canvas: pins + composer / thread popover ── */
  var pins = document.createElement('div'); pins.id = 'pins';
  var pop = document.createElement('div'); pop.className = 'cpop surface'; pop.hidden = true;
  T.$('#ui').insertBefore(pins, T.$('#panel'));
  T.$('#ui').appendChild(pop);
  function pinPos(c) {
    var el = resolve(c);
    if (!visible(el)) return null;
    var r = el.getBoundingClientRect();
    return { x: r.left + Math.max(0, Math.min(1, c.fx || 0)) * r.width, y: r.top + Math.max(0, Math.min(1, c.fy || 0)) * r.height };
  }
  function render() {
    var html = '';
    if (S.active && S.tool === 'comment') list.forEach(function (c, i) {
      var p = pinPos(c);
      if (p && p.y > -30 && p.y < window.innerHeight + 30) html += '<button class="pin' + (openId === c.id ? ' on' : '') + '" data-act="comment-open" data-id="' + c.id + '" style="left:' + p.x + 'px;top:' + p.y + 'px" title="' + esc(c.text) + '">' + (i + 1) + '</button>';
    });
    if (draft) { html += '<span class="pin draft" style="left:' + draft.x + 'px;top:' + draft.y + 'px">+</span>'; }
    if (pins._h !== html) { pins.innerHTML = html; pins._h = html; }
    placePop();
  }
  T.frameHooks.push(render);
  T.renderPins = render;
  function placePop() {
    if (pop.hidden) return;
    var p = draft ? { x: draft.x, y: draft.y } : (function () { var c = byId(openId); return c && pinPos(c); })();
    if (!p) { closePop(); return; }
    var w = 280, x = Math.min(p.x + 18, window.innerWidth - w - 348), y = Math.max(8, Math.min(p.y - 8, window.innerHeight - pop.offsetHeight - 72));
    pop.style.left = Math.max(8, x) + 'px'; pop.style.top = y + 'px';
  }
  function byId(id) { return list.filter(function (c) { return c.id === id; })[0]; }
  function closePop() { pop.hidden = true; draft = null; openId = null; render(); }
  T.closeComment = closePop;
  T.commentOpen = function () { return !pop.hidden; };

  /* click on the page in the comment tool: the deepest element, at the click point */
  T.commentAt = function (t, x, y) {
    if (!t || t === document.body || t === document.documentElement || own(t)) return;
    var r = t.getBoundingClientRect();
    draft = { el: t, x: x, y: y, fx: r.width ? (x - r.left) / r.width : 0, fy: r.height ? (y - r.top) / r.height : 0 };
    openId = null;
    pop.innerHTML = '<div class="ch">' + I('message-circle', 14) + '<b>' + esc(T.nameOf(t)) + '</b></div>' +
      '<textarea id="ctext" rows="3" placeholder="Add a comment for Kiro"></textarea>' +
      '<div class="cfoot"><span></span><button class="btnline" data-act="comment-cancel">Cancel</button><button class="btnblue" data-act="comment-post">Post</button></div>';
    pop.hidden = false;
    render();
    setTimeout(function () { var ta = pop.querySelector('#ctext'); if (ta) ta.focus(); }, 0);
  };
  function openThread(id) {
    var c = byId(id);
    if (!c) return;
    draft = null; openId = id;
    var el = resolve(c), when = new Date(c.at), n = list.indexOf(c) + 1;
    pop.innerHTML = '<div class="ch"><span class="pin inline">' + n + '</span><b>' + esc(el ? T.nameOf(el) : c.tag) + '</b><span class="cwhen">' + esc(when.toLocaleDateString() + ' ' + when.toLocaleTimeString().slice(0, 5)) + '</span>' +
      '<button class="ib" data-act="comment-resolve" data-id="' + id + '" title="Resolve: remove this comment">' + I('check', 14) + '</button></div>' +
      '<textarea id="ctext" rows="3">' + esc(c.text) + '</textarea>' +
      '<div class="cfoot"><span>' + (c.synced ? 'In tweak-changes.md for Kiro' : F.dir ? 'Writing…' : 'In this browser · connect a folder to share') + '</span><button class="btnline" data-act="comment-cancel">Close</button><button class="btnblue" data-act="comment-save" data-id="' + id + '">Save</button></div>';
    pop.hidden = false;
    render();
  }
  function post() {
    var ta = pop.querySelector('#ctext'), text = ta && ta.value.trim();
    if (!text) { T.notify('Write something first'); return; }
    if (draft) { var c = add(draft.el, draft.fx, draft.fy, text); closePop(); T.notify(F.dir ? 'Comment ' + (list.indexOf(c) + 1) + ' is in tweak-changes.md — Copy for Kiro (comment list) gives the chat prompt' : 'Comment kept in this browser — Copy for Kiro (comment list) takes it to the chat'); }
  }
  T.action('comment-post', post);
  T.action('comment-cancel', closePop);
  T.action('comment-open', function (b) { var id = b.getAttribute('data-id'); if (openId === id) closePop(); else openThread(id); });
  T.action('comment-resolve', function (b) { remove(b.getAttribute('data-id')); closePop(); T.notify('Comment resolved'); });
  T.action('comment-delete', function (b) { remove(b.getAttribute('data-id')); closePop(); T.notify('Comment deleted'); });
  T.action('comments-clear', function (b) {
    if (list.length) T.openMenu(b, [{ label: 'Delete all ' + list.length + ' comments', act: 'comments-clear-yes', hint: 'no undo' }]);
  });
  T.action('comments-clear-yes', function () {
    var n = list.length;
    T.closeMenu();
    remove(list.map(function (c) { return c.id; }));
    closePop();
    T.notify(n === 1 ? 'Comment deleted' : n + ' comments deleted');
  });
  T.action('comment-save', function (b) {
    var c = byId(b.getAttribute('data-id')), ta = pop.querySelector('#ctext');
    if (c && ta && ta.value.trim()) { c.text = ta.value.trim(); c.synced = false; changed(); }
    closePop();
  });
  T.action('comment-go', function (b) {
    var c = byId(b.getAttribute('data-id')), el = c && resolve(c);
    if (!visible(el)) { T.notify('Not visible now: open the state of the page where it is (e.g. the panel or modal)'); return; }
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    setTimeout(function () { openThread(c.id); }, 350);
  });
  T.action('comments-share', function () { if (F.state === 'resume') T.resume(); else T.connect(); });
  /* Copy for Kiro: the page address + a prompt to paste into the chat. Without a folder
     connection Kiro cannot read tweak-changes.md, so the comments themselves go along. */
  T.kiroPrompt = function () {
    var url = location.href.split('#')[0];
    try { url = decodeURI(url); } catch (e) { /* keep it encoded */ }
    var text = 'Apply my Tweak comments on ' + F.name + ' (' + url + ').';
    text += F.dir ? ' They are in tweak-changes.md next to the page.' : ' The comments:\n\n' + T.commentsBlock();
    return text;
  };
  T.copyText = copyText;
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (ok, fail) { /* file:// and http: pages: the old way */
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;left:-9999px;top:0';
      document.body.appendChild(ta); ta.select();
      var done = false;
      try { done = document.execCommand('copy'); } catch (e) { /* blocked */ }
      ta.remove();
      if (done) ok(); else fail();
    });
  }
  T.action('comments-copy', function () {
    if (!list.length) return;
    copyText(T.kiroPrompt()).then(function () { T.notify('Copied — paste it into the Kiro chat'); }, function () { T.notify('Copy failed', 'error'); });
  });
  pop.addEventListener('keydown', function (e) {
    if (e.target.id !== 'ctext') return;
    if (e.isComposing || e.keyCode === 229) { e.stopPropagation(); return; } /* IME: Enter / Esc confirm or cancel the composition */
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (draft) post(); else { var s = pop.querySelector('[data-act="comment-save"]'); if (s) s.click(); } }
    else if (e.key === 'Escape') { e.preventDefault(); closePop(); }
    e.stopPropagation();
  });

  /* ── Inspector in the comment tool: the list ── */
  T.renderCommentsPanel = function (panel) {
    var head = '<div class="ph cmt"><span class="t">' + I('message-circle', 14) + 'Comments' + (list.length ? '<span class="mixedtag">' + list.length + '</span>' : '') + '</span>' +
      (list.length ? '<button class="ib danger" data-act="comments-clear" title="Delete all comments">' + I('trash-2', 14) + '</button>' : '') + T.dockButton() + '</div>';
    /* one button: copies the page address + a prompt for the Kiro chat (with the comments when
       Kiro cannot read them from tweak-changes.md); connecting the folder stays one click away */
    var status = list.length ? '<div class="cbar"><button class="btnblue" data-act="comments-copy" title="Copies the page address and a prompt: paste it into the Kiro chat">' + I('clipboard-copy', 12) + 'Copy for Kiro</button>' +
      (!F.dir && F.canPick ? '<button class="btnline" data-act="comments-share" title="Pick the kit folder once: comments then go to tweak-changes.md without Save">' + I('folder-open', 12) + 'Connect folder</button>' : '') + '</div>' : '';
    var items = list.map(function (c, i) {
      var el = resolve(c), vis = visible(el);
      return '<div class="citem' + (openId === c.id ? ' on' : '') + '"><button class="cmain" data-act="comment-go" data-id="' + c.id + '"><span class="pin inline">' + (i + 1) + '</span><span class="cbody"><b>' + esc(el ? T.nameOf(el) : c.tag) + (vis ? '' : '<span class="tag">' + (el ? 'not visible now' : 'not found') + '</span>') + '</b>' +
        '<span>' + esc(c.text) + '</span></span></button>' +
        '<button class="ib danger cdel" data-act="comment-delete" data-id="' + c.id + '" title="Delete comment">' + I('trash-2', 14) + '</button></div>';
    }).join('');
    panel.innerHTML = head + status + (items ? '<div class="clist">' + items + '</div>' : '<div class="empty"><b>No comments yet</b>Click anything on the page to pin a comment to it. Kiro gets the exact element.</div>');
  };
})(window.DLTweakNS);
