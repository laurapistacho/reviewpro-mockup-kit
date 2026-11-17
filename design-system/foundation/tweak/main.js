/* Tweak mode — lifecycle + public API (window.DLTweak) */
(function (T) {
  'use strict';
  var S = T.s, F = T.file;

  T.action('tool', function (b) { T.setTool(b.getAttribute('data-tool')); });
  T.action('undo', function () { T.undo(); });
  T.action('redo', function () { T.redo(); });
  T.action('connect', function () { T.connect(); });
  T.action('resume', function () { T.resume(); });
  T.action('reload', function () { location.reload(); });
  T.action('copy', function () { T.copyChanges(); });
  T.action('save', function () { T.saveNow(); });
  T.action('autosave', function () { T.setAutosave(!S.autosave); });
  T.action('exit', function () { T.off(); });

  T.turnOn = function () {
    if (S.active) return;
    S.active = true;
    document.head.appendChild(T.pageStyle);
    document.body.appendChild(T.host);
    if (T.disarmTips) T.disarmTips();
    T.bindPage();
    /* #edit in the address: a reload or a copied link opens the editor again. A page that uses the
       hash for its own state (the showcase: #sec-…, #pattern=…) keeps it */
    if (!location.hash || location.hash === '#tweak') window.history.replaceState(window.history.state, '', location.pathname + location.search + '#edit');
    T.setTool('select');
    T.startFrames();
    T.autoConnect();
  };
  T.off = function () {
    if (!S.active) return;
    if (S.editing) T.stopEditing();
    if (T.scrubbing()) T.scrubEnd();
    if (T.resizing()) T.resizeEnd();
    if (S.drag && S.drag.el) S.drag.el.removeAttribute('data-dl-dragging');
    S.drag = null;
    T.clearLibraryPreview();
    S.active = false;
    T.stopFrames();
    T.unbindPage();
    document.documentElement.classList.remove('dl-tweaking', 'dl-commenting');
    T.pageStyle.remove();
    T.host.remove();
    T.removeProbe();
    if (T.hideModeHint) T.hideModeHint();
    if (/^#(edit|tweak)$/.test(location.hash)) window.history.replaceState(window.history.state, '', location.pathname + location.search);
    if (T.dirty() && F.state !== 'conflict') {
      /* auto-save off: leaving Tweak mode asks; Cancel keeps the changes on the page (unsaved) */
      if (S.autosave || window.confirm('Save your Tweak changes to ' + F.name + '?')) { clearTimeout(F.timer); T.writeNow(); }
    }
  };

  window.addEventListener('beforeunload', function (e) {
    if (!T.dirty()) return;
    if (F.state === 'saving') { clearTimeout(F.timer); T.writeNow(); e.preventDefault(); e.returnValue = ''; }
    else if (F.state === 'unsaved') { e.preventDefault(); e.returnValue = ''; } /* browser asks: leave without saving? */
  });

  T.start = function () {
    window.DLTweak = {
      on: T.turnOn,
      off: T.off,
      toggle: function () { if (S.active) T.off(); else T.turnOn(); },
      changes: T.exportText,
      /* connectTo(dirHandle): attach a folder handle programmatically (tests) */
      connectTo: function (dir) { return T.attachFolder(dir, false); },
      ns: T
    };
    T.turnOn();
  };
})(window.DLTweakNS);
