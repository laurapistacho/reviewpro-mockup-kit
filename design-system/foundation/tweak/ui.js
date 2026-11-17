/* Tweak mode — UI shell: shadow root, toolbar, notifications, preview probe.
   All editor UI lives in a shadow root (styles in tweak.css), so page CSS never leaks in.
   Buttons use data-act="actionName"; the delegate below calls T.actions[actionName]. */
(function (T) {
  'use strict';
  var I = T.icon, esc = T.esc, F = T.file;

  var host = T.host = document.createElement('div');
  host.id = 'dl-tweak-host';
  host.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483000;';
  var root = T.root = host.attachShadow({ mode: 'open' });
  root.innerHTML = '<link rel="stylesheet" href="' + T.base + 'tweak.css?v=' + T.stamp + '" />' +
    '<div class="ui" id="ui" style="visibility:hidden">' +
    '<div class="ov mar"></div><div class="ov pad"></div><div id="gaps"></div><div class="ov hover"></div>' +
    '<div class="ov sel"><b data-rz="n"></b><b data-rz="s"></b><b data-rz="w"></b><b data-rz="e"></b><i data-rz="nw"></i><i data-rz="ne"></i><i data-rz="sw"></i><i data-rz="se"></i></div><div class="name"></div><div class="size"></div><div id="measure"></div>' +
    '<div class="dropbox"></div><div class="drop"></div><div class="ghost"></div>' +
    '<aside class="panel surface" id="panel"></aside>' +
    '<div class="pop surface iconpop" id="iconpicker" hidden></div>' +
    '<aside class="side surface" id="library" hidden></aside>' +
    '<div class="pop surface" id="colorpicker" hidden></div>' +
    '<div class="dd" id="dd" hidden></div>' +
    '<div class="menu" id="menu" hidden></div>' +
    '<div class="bar surface" id="bar"></div>' +
    '<div class="note" id="note"></div><div class="mhint" id="mhint"></div><div class="mhint tip" id="tip"></div></div>';
  var cssReady = false;
  root.querySelector('link').addEventListener('load', function () {
    cssReady = true;
    var ui = root.getElementById('ui');
    ui.style.visibility = '';
    requestAnimationFrame(function () { ui.classList.add('ready'); if (pendingHint) T.showModeHint(pendingHint); }); /* transitions only once styled */
  });
  /* Events in the editor UI stay in the editor: a click on the toolbar or the inspector is not a
     click "outside" for the page, so its open dropdowns, calendars and menus stay open
     (the editor's own window listeners run first, in the capture phase) */
  ['click', 'dblclick', 'mousedown', 'mouseup', 'pointerdown', 'pointerup', 'contextmenu', 'keydown', 'keyup', 'keypress', 'input', 'change', 'focusin', 'focusout']
    .forEach(function (t) { host.addEventListener(t, function (e) { e.stopPropagation(); }); });
  T.$ = function (sel) { return root.querySelector(sel); };

  /* Page-level style while Tweak mode is on */
  T.pageStyle = document.createElement('style');
  T.pageStyle.textContent =
    'html.dl-tweaking, html.dl-tweaking *{cursor:default!important;user-select:none!important;-webkit-user-select:none!important}' +
    'html.dl-tweaking [data-dl-editing], html.dl-tweaking [data-dl-editing] *{cursor:text!important;user-select:text!important;-webkit-user-select:text!important;outline:none}' +
    'html.dl-tweaking [data-dl-dragging]{opacity:.35!important}' +
    '[data-dl-preview]{outline:1.5px dashed #9747ff!important;outline-offset:2px;opacity:.9}' +
    '[data-dl-hidden]{display:none!important}' +
    'html.dl-commenting, html.dl-commenting *{cursor:crosshair!important}';

  /* Delegated clicks for every data-act button inside the editor UI */
  root.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]');
    if (!b) return;
    var fn = T.actions[b.getAttribute('data-act')];
    if (b.closest('#menu') && T.closeMenu) T.closeMenu(); /* a menu item: close the menu first */
    if (fn) fn(b, e);
  });

  /* ── Mode hint: what a click does now, above the active mode (on start and on every switch) ── */
  var HINTS = {
    select: 'Click to edit · double-click text',
    interact: 'Click through like a user',
    comment: 'Click to comment'
  };
  T.modeHints = HINTS; /* build-tweak-ui.py */
  var pendingHint = null, hintTimer = null;
  T.showModeHint = function (mode) {
    var h = T.$('#mhint');
    if (!HINTS[mode] || !h) return;
    if (!cssReady) { pendingHint = mode; return; } /* the toolbar has no size before tweak.css */
    pendingHint = null;
    if (/\bshow\b/.test(T.$('#note').className)) return; /* a notification has the spot above the toolbar */
    requestAnimationFrame(function () {
      var b = T.$('#bar .modes [data-tool="' + mode + '"]');
      if (!b || !T.s.active) return;
      var r = b.getBoundingClientRect();
      h.textContent = HINTS[mode];
      h.style.left = (r.left + r.width / 2) + 'px';
      h.style.bottom = (window.innerHeight - r.top + 10) + 'px';
      h.className = 'mhint show';
      clearTimeout(hintTimer);
      hintTimer = setTimeout(T.hideModeHint, 4000);
    });
  };
  T.hideModeHint = function () { clearTimeout(hintTimer); var h = T.$('#mhint'); if (h) h.className = 'mhint'; };
  window.addEventListener('pointerdown', function () { if (T.s.active) T.hideModeHint(); }, true);

  /* ── Toolbar tooltips: the same dark label above every toolbar button (data-tip, data-key) ── */
  var tipTimer = null, tipFor = null, tipArmed = false, armAt = null;
  T.disarmTips = function () { tipArmed = false; armAt = null; hideTip(); };
  function showTip(b) {
    var t = T.$('#tip'), r = b.getBoundingClientRect();
    t.innerHTML = esc(b.getAttribute('data-tip')) + (b.getAttribute('data-key') ? '<kbd>' + esc(b.getAttribute('data-key')) + '</kbd>' : '');
    t.style.left = (r.left + r.width / 2) + 'px';
    t.style.bottom = (window.innerHeight - r.top + 10) + 'px';
    t.className = 'mhint tip show';
    T.hideModeHint();
  }
  function hideTip() { clearTimeout(tipTimer); tipFor = null; var t = T.$('#tip'); if (t) t.className = 'mhint tip'; }
  /* armed by the first real pointer move after opening (≥ 4 px), so a toolbar that opens under the cursor shows nothing */
  window.addEventListener('pointermove', function (e) {
    if (tipArmed || !T.s.active) return;
    if (!armAt) { armAt = [e.clientX, e.clientY]; return; }
    if (Math.abs(e.clientX - armAt[0]) + Math.abs(e.clientY - armAt[1]) < 4) return;
    tipArmed = true;
    var on = e.composedPath().filter(function (n) { return n.matches && n.matches('#bar [data-tip]'); })[0];
    if (on) overTip(on); /* already resting on a button */
  }, true);
  root.addEventListener('pointerover', function (e) {
    if (!tipArmed) return;
    overTip(e.target.closest && e.target.closest('#bar [data-tip]'));
  });
  function overTip(b) {
    if (b === tipFor) return;
    var wasOpen = /\bshow\b/.test(T.$('#tip').className);
    hideTip();
    if (!b || /\bshow\b/.test(T.$('#note').className)) return;
    tipFor = b;
    tipTimer = setTimeout(function () { if (tipFor === b && b.isConnected) showTip(b); }, wasOpen ? 0 : 350); /* moving along the bar: at once */
  }
  root.getElementById('bar').addEventListener('pointerleave', hideTip); /* the bar element stays, only its buttons are redrawn */
  root.addEventListener('pointerdown', hideTip, true);
  T.hideTip = hideTip;

  /* ── Notifications ── */
  var noteTimer;
  T.notify = function (msg, kind) {
    var n = T.$('#note');
    if (T.hideModeHint) T.hideModeHint(); /* one message at a time above the toolbar */
    if (T.hideTip) T.hideTip();
    n.textContent = msg;
    n.className = 'note show' + (kind ? ' ' + kind : '');
    clearTimeout(noteTimer);
    noteTimer = setTimeout(function () { n.className = 'note'; }, 2400);
  };

  /* ── Toolbar ── */
  /* Toolbar: tools, + panel, one save button and exit. Undo / redo are ⌘Z / ⇧⌘Z.
     The save button shows the file state; once the folder is connected it opens Save & history
     (versions.js): save now, auto-save, versions. Before that it connects, after a conflict it reloads. */
  T.renderToolbar = function () {
    var st = F.state, n = T.unsavedCount(), has = T.history.length, open = T.historyOpen && T.historyOpen(), status;
    var chev = '<span class="tb-chev">' + I('chevron-down', 12) + '</span>';
    var menu = function (cls, icon, label, title) { return '<button class="tb status ' + cls + (open ? ' open' : '') + '" data-act="history" title="' + esc(title) + '">' + (icon === 'loader-circle' ? '<span class="spin">' + I(icon, 14) + '</span>' : I(icon)) + label + chev + '</button>'; };
    if (st === 'unsupported') status = '<button class="tb status ' + (has ? 'cta' : 'muted') + '" data-act="copy" title="This browser cannot write files here. Copy the changes and paste them into Kiro.">' + I('clipboard-copy') + 'Copy for Kiro</button>';
    else if (st === 'disconnected') status = '<button class="tb status cta' + (has ? ' pulse' : '') + '" data-act="connect" title="Browsers write only to folders you allowed (a file:// page cannot save on its own). Pick the kit folder ONCE: every mockup inside then saves without a dialog; Chrome only asks “Allow” per visit, or never with “Allow on every visit”.">' + I('folder-open') + 'Save to file' + (n ? ' <span class="tb-badge">' + n + '</span>' : '') + '</button>';
    else if (st === 'resume') status = '<button class="tb status cta' + (has ? ' pulse' : '') + '" data-act="resume" title="Allow saving again — choose “Allow on every visit” to skip this next time">' + I('folder-open') + 'Allow saving</button>';
    else if (st === 'conflict') status = '<button class="tb status warn" data-act="reload" title="' + esc(F.name) + ' changed outside Tweak mode (e.g. Kiro edited it). Reload to continue — your saved changes are in the file.">' + I('refresh-cw') + 'File changed · Reload</button>';
    else if (st === 'error') status = '<button class="tb status warn" data-act="resume" title="Saving failed — click to retry">' + I('cloud-off') + 'Not saved · Retry</button>';
    else if (st === 'saving') status = menu('muted', 'loader-circle', 'Saving…', 'Save & history');
    else if (st === 'unsaved') status = menu('cta', 'save', 'Save', 'Unsaved changes: save, auto-save and versions  ⌘S saves');
    else status = menu('ok', 'folder-check', n ? 'Saved · ' + n + ' not in file' : 'Saved', 'Saved to ' + F.name + ' · auto-save, versions, restore');
    var t = T.s.tool, nc = T.comments ? T.comments().length : 0;
    var TIPS = {
      'tool:select': ['Edit', 'V'], 'tool:interact': ['Preview', 'P'], 'tool:comment': ['Comment', 'C'], library: ['Insert component', 'I'],
      connect: ['Save to file: pick the kit folder once'], resume: ['Allow saving'], reload: ['File changed outside Tweak: reload'],
      copy: ['Copy changes for Kiro'], exit: ['Exit', '⌥⇧E'],
      history: st === 'unsaved' ? ['Save & history', '⌘S'] : st === 'saving' ? ['Saving…'] : ['Save & history']
    };
    /* one mode at a time: a segmented control (Edit · Preview · Comment) */
    var mode = function (id, icon, label, title, extra) {
      return '<button class="tb' + (t === id ? ' on' : '') + '" data-act="tool" data-tool="' + id + '" title="' + esc(title) + '"' + (t === id ? ' aria-pressed="true"' : ' aria-pressed="false"') + ' aria-label="' + label + '">' + I(icon, 16) + (extra || '') + '</button>';
    };
    T.$('#bar').innerHTML =
      '<div class="modes" role="group" aria-label="Mode">' +
      mode('select', 'mouse-pointer-2', 'Edit', 'Edit: select, move and change elements  V') +
      mode('interact', 'play', 'Preview', 'Preview: click through the prototype like a user  P') +
      mode('comment', 'message-circle', 'Comment', 'Comment for Kiro: click an element  C', nc ? '<span class="tb-badge blue">' + nc + '</span>' : '') +
      '</div>' +
      '<button class="tb' + (!T.$('#library').hidden ? ' on' : '') + '" data-act="library" title="Insert a DS component  I">' + I('plus') + '</button>' +
      '<span class="sep"></span>' + status +
      '<span class="sep"></span>' +
      '<button class="tb" data-act="exit" title="Exit Tweak mode  ⌥⇧E">' + I('x') + '</button>';
    /* native titles → our tooltip (short name + key); the full text stays for screen readers */
    T.$('#bar').querySelectorAll('[title]').forEach(function (b) {
      var k = b.getAttribute('data-act') + (b.getAttribute('data-tool') ? ':' + b.getAttribute('data-tool') : ''), tip = TIPS[k] || [b.getAttribute('title')];
      b.setAttribute('aria-description', b.getAttribute('title'));
      if (!b.getAttribute('aria-label') && !b.textContent.trim()) b.setAttribute('aria-label', tip[0]);
      b.setAttribute('data-tip', tip[0]);
      if (tip[1]) b.setAttribute('data-key', tip[1]);
      b.removeAttribute('title');
    });
    if (tipFor && !tipFor.isConnected) hideTip();
  };

  /* ── Probe: computed style of a DS class combination (variant previews) ── */
  var probeHost = null, probeCache = {};
  T.probe = function (classes, tag) {
    var key = (tag || 'span') + '|' + classes;
    if (probeCache[key]) return probeCache[key];
    if (!probeHost) {
      probeHost = document.createElement('div');
      probeHost.setAttribute('data-dl-probe', '');
      probeHost.style.cssText = 'position:absolute;left:-9999px;top:0;visibility:hidden;pointer-events:none';
    }
    if (!probeHost.isConnected) document.body.appendChild(probeHost);
    var e = document.createElement(tag || 'span');
    e.className = classes;
    e.textContent = 'Ag';
    probeHost.appendChild(e);
    var cs = getComputedStyle(e);
    var r = { bg: cs.backgroundColor, color: cs.color, border: cs.borderTopWidth + ' ' + cs.borderTopStyle + ' ' + cs.borderTopColor, shadow: cs.boxShadow, radius: cs.borderTopLeftRadius };
    e.remove();
    probeCache[key] = r;
    return r;
  };
  T.removeProbe = function () { if (probeHost) probeHost.remove(); };
  T.hasBorder = function (b) { return b.indexOf('none') < 0 && b.indexOf('0px') !== 0; };

  T.on('change', function () { T.renderToolbar(); T.renderInspector(); });
  T.on('state', function () { T.renderToolbar(); });
})(window.DLTweakNS);
