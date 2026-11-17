/* Tweak mode — file access (File System Access API, Chrome / Edge).
   Browsers only write to folders the user granted. One grant covers that folder and everything
   below it, so picking the kit folder (or mockups/) once works for every mockup. Chrome then
   offers "Allow on every visit" and later sessions connect silently. */
(function (T) {
  'use strict';
  var segs = decodeURIComponent(location.pathname).split('/').filter(Boolean);
  var F = T.file = {
    name: segs[segs.length - 1] || 'index.html',
    dirSegs: segs.slice(0, -1),
    canPick: typeof window.showDirectoryPicker === 'function' && window.top === window.self,
    handle: null,     // FileSystemFileHandle of this page
    text: null,       // current file text (with all applied ops)
    lastDisk: null,   // text last read from / written to disk
    root: null,       // parsed source tree
    map: new Map(),   // live element → source node
    pending: null,    // stored folder handle waiting for permission
    timer: null
  };
  F.state = F.canPick ? 'disconnected' : 'unsupported'; // disconnected | resume | saving | saved | unsaved | conflict | error | unsupported
  /* Auto-save on: every change is written 350 ms later. Off: changes wait for Save / ⌘S ('unsaved'). */
  T.s.autosave = T.store.get('dl-tweak-autosave') !== 'off';
  T.dirty = function () { return !!F.handle && F.text !== F.lastDisk; };
  T.setFileState = function (s) { F.state = s; T.emit('state', s); };

  /* ── IndexedDB: remembered folder handles, keyed by folder path ── */
  function idbOpen() {
    return new Promise(function (resolve) {
      try {
        var req = indexedDB.open('dl-tweak', 1);
        req.onupgradeneeded = function () { req.result.createObjectStore('handles'); };
        req.onerror = function () { resolve(null); };
        req.onsuccess = function () { resolve(req.result); };
      } catch (e) { resolve(null); }
    });
  }
  function idbPut(key, value) {
    return idbOpen().then(function (db) { if (db) db.transaction('handles', 'readwrite').objectStore('handles').put(value, key); });
  }
  /* Longest stored folder whose path contains this page */
  function idbFindRoot() {
    return idbOpen().then(function (db) {
      if (!db) return null;
      return new Promise(function (resolve) {
        var best = null, here = '/' + F.dirSegs.join('/');
        var cur = db.transaction('handles', 'readonly').objectStore('handles').openCursor();
        cur.onsuccess = function () {
          var c = cur.result;
          if (!c) { resolve(best && best.value); return; }
          var key = String(c.key);
          if ((here === key || here.indexOf(key + '/') === 0) && (!best || key.length > best.key.length)) best = { key: key, value: c.value };
          c.continue();
        };
        cur.onerror = function () { resolve(null); };
      });
    });
  }

  /* folder handle → [file handle, folder path key]; the folder may be any ancestor of the page */
  /* → [file handle, folder path key, folder handle of the page] */
  function resolveFile(dir) {
    return dir.getFileHandle(F.name).then(function (h) { return [h, '/' + F.dirSegs.join('/'), dir]; }, function () {
      var idx = F.dirSegs.lastIndexOf(dir.name);
      if (idx < 0) throw new Error('outside');
      return F.dirSegs.slice(idx + 1).reduce(function (p, seg) { return p.then(function (d) { return d.getDirectoryHandle(seg); }); }, Promise.resolve(dir))
        .then(function (d) { return d.getFileHandle(F.name).then(function (h) { return [h, '/' + F.dirSegs.slice(0, idx + 1).join('/'), d]; }); });
    });
  }

  T.reindex = function () {
    F.root = T.src.parse(F.text);
    F.map = T.src.align(F.root);
  };
  /* Source node for a live element, only when it really corresponds */
  T.nodeFor = function (el) {
    var n = F.text !== null ? F.map.get(el) : null;
    return n && T.src.compatible(el, n) ? n : null;
  };
  T.splice = function (from, to, text) { F.text = F.text.slice(0, from) + text + F.text.slice(to); };
  /* [lineStart, lineEndInclNewline, indent] when the node sits alone on its line(s), else null */
  T.lineRange = function (node) {
    var t = F.text, ls = t.lastIndexOf('\n', node.start - 1) + 1, le = t.indexOf('\n', node.end);
    if (le < 0) le = t.length;
    if (!t.slice(ls, node.start).trim() && !t.slice(node.end, le).trim()) return [ls, Math.min(le + 1, t.length), t.slice(ls, node.start)];
    return null;
  };
  T.indentOf = function (node) {
    var t = F.text, ls = t.lastIndexOf('\n', node.start - 1) + 1;
    return /^[ \t]*/.exec(t.slice(ls, node.start))[0];
  };

  function attach(dir, remember) {
    return resolveFile(dir).then(function (res) {
      return res[0].getFile().then(function (f) { return f.text(); }).then(function (text) {
        var title = document.title.trim();
        if (title && text.indexOf(title) < 0 && text.indexOf(T.src.escapeText(title)) < 0) throw new Error('mismatch');
        F.handle = res[0];
        F.dir = res[2];
        if (T.findPages) T.findPages();
        F.text = F.lastDisk = text;
        F.pending = null;
        if (remember) idbPut(res[1], dir);
        T.setFileState('saved');
        T.replayWithSource(); /* edits made before connecting → saving / unsaved */
        if (T.loadComments) T.loadComments(); /* comments.js: drop the ones Kiro applied, share the new ones */
        if (remember) T.notify('Saving to ' + F.name); /* picked just now; a remembered folder is silent (the toolbar says Saved) */
      });
    }).catch(function (err) {
      if (remember) T.notify(err && err.message === 'mismatch' ? F.name + ' in that folder is a different page' : 'That folder does not contain ' + F.name + ' — pick the kit or mockups folder', 'error');
      T.setFileState(F.handle ? 'saved' : 'disconnected');
    });
  }
  T.attachFolder = attach;

  /* The kit folder (parent of mockups/ or design-system/): granting it once covers every mockup */
  F.kitName = (function () {
    var i = F.dirSegs.lastIndexOf('mockups'); if (i < 1) i = F.dirSegs.lastIndexOf('design-system');
    return i > 0 ? F.dirSegs[i - 1] : null;
  })();
  T.connect = function () {
    if (!F.canPick) return;
    var opts = { id: 'dl-mockup', mode: 'readwrite' };
    if (F.pending) opts.startIn = F.pending;
    if (F.kitName) T.notify('One time only: pick the “' + F.kitName + '” folder. Every mockup in it then saves without this dialog.');
    window.showDirectoryPicker(opts).then(function (dir) {
      return attach(dir, true).then(function () {
        if (F.kitName && dir.name !== F.kitName && F.handle) T.notify('Saving works for this folder only. Pick “' + F.kitName + '” next time to cover all mockups.');
      });
    }).catch(function () { /* dismissed */ });
  };
  /* Needs a user gesture: called on the first click / key press in Tweak mode */
  T.resume = function () {
    var dir = F.pending;
    if (!dir) { T.connect(); return; }
    try {
      dir.requestPermission({ mode: 'readwrite' }).then(function (p) { if (p === 'granted') attach(dir, false); }, function () { /* no activation yet */ });
    } catch (e) { /* no activation yet */ }
  };
  T.autoConnect = function () {
    if (!F.canPick || F.handle) return;
    idbFindRoot().then(function (dir) {
      if (!dir || !dir.queryPermission) return;
      F.pending = dir;
      dir.queryPermission({ mode: 'readwrite' }).then(function (p) {
        if (p === 'granted') attach(dir, false);
        else { T.setFileState('resume'); T.resume(); }
      });
    });
  };

  T.scheduleSave = function () {
    if (!F.handle) return;
    T.setFileState('saving');
    clearTimeout(F.timer);
    F.timer = setTimeout(T.writeNow, 350);
  };
  T.writeNow = function () {
    var text = F.text;
    return F.handle.getFile().then(function (f) { return f.text(); }).then(function (disk) {
      if (disk !== F.lastDisk) { T.setFileState('conflict'); return null; }
      return (T.versionBeforeWrite ? T.versionBeforeWrite(disk) : Promise.resolve()).then(function () { return F.handle.createWritable(); }) /* versions.js keeps the file first */
        .then(function (w) { return w.write(text).then(function () { return w.close(); }); })
        .then(function () {
          F.lastDisk = text;
          if (T.versionAfterWrite) T.versionAfterWrite(text); /* versions.js: the session's autosave */
          T.setFileState(F.text === text ? 'saved' : T.s.autosave ? 'saving' : 'unsaved');
          if (T.writeLog) T.writeLog(); /* kiro-log.js: tweak-changes.md next to the page */
        });
    }).catch(function () { T.setFileState('error'); });
  };
  /* Save button / ⌘S: write now (asks for the folder first when not connected yet) */
  T.saveNow = function () {
    if (!F.handle) { if (F.state === 'resume') T.resume(); else T.connect(); return; }
    if (F.state === 'conflict') { T.notify(F.name + ' changed outside Tweak mode — reload first', 'error'); return; }
    if (F.text === F.lastDisk) { T.notify('Nothing to save'); return; }
    clearTimeout(F.timer);
    T.setFileState('saving');
    T.writeNow();
  };
  T.setAutosave = function (on) {
    T.s.autosave = !!on;
    T.store.set('dl-tweak-autosave', on ? 'on' : 'off');
    if (on && T.dirty() && F.state !== 'conflict') T.scheduleSave();
    T.notify(on ? 'Auto-save on: every change goes into ' + F.name : 'Auto-save off: save with the Save button or ⌘S');
    T.emit('state', F.state);
  };
})(window.DLTweakNS);
