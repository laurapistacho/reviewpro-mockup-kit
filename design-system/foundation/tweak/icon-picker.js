/* Tweak mode — icon picker: every ReviewPro icon with search (T.GLYPHS from glyphs.js).
   A small popover next to the icon in the inspector, like the color picker. The editor's shadow root
   links the page's rp-icons.css so the icons draw exactly as on the page. */
(function (T) {
  'use strict';
  var S = T.s, I = T.icon, esc = T.esc;
  var panel = T.$('#iconpicker'), query = '';
  /* rp-icons.css inside the editor (icon picker grid + the icon row of the inspector) */
  (function linkIcons() {
    if (T.root.querySelector('link[data-rp-icons]')) return;
    var page = document.querySelector('link[rel="stylesheet"][href*="rp-icons.css"]');
    if (!page) return;
    var l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = page.href; l.setAttribute('data-rp-icons', '');
    T.root.insertBefore(l, T.root.firstChild);
  })();
  T.openIconPicker = function () {
    if (!S.selected || !T.isIcon(S.selected)) return;
    T.closeLibrary();
    query = '';
    panel.hidden = false;
    T.renderIconPicker(true);
  };
  T.closeIconPicker = function () { panel.hidden = true; };
  T.iconPickerOpen = function () { return !panel.hidden; };
  T.renderIconPicker = function (focus) {
    if (panel.hidden) return;
    if (!S.selected || !T.isIcon(S.selected)) { panel.hidden = true; return; }
    var cur = T.iconClass(S.selected), curEntry = cur && T.glyphEntry(cur.slice(8));
    var q = query.trim().toLowerCase();
    var list = T.GLYPHS.filter(function (e) { return !q || e.indexOf(q) > -1; });
    if (!panel.querySelector('#iq')) {
      panel.innerHTML = '<div class="iph"><label class="search">' + I('search', 14) + '<input id="iq" placeholder="Search icons" spellcheck="false" autocomplete="off" /></label>' +
        '<button class="ib" data-act="icons-close" title="Close  Esc">' + I('x', 14) + '</button></div><div class="icons" id="igrid"></div>';
    }
    panel.querySelector('#igrid').innerHTML = list.slice(0, 400).map(function (e) {
      var name = T.glyphName(e);
      return '<button class="glyph' + (curEntry === e ? ' on' : '') + '" data-act="icon-pick" data-icon="' + esc(name) + '" title="rp-icon-' + esc(name) + '"><span class="rp-icon rp-icon-' + esc(name) + '"></span></button>';
    }).join('') || '<div class="empty" style="grid-column:1/-1">No icon matches “' + esc(q) + '”</div>';
    if (focus) { var input = panel.querySelector('#iq'); input.value = ''; setTimeout(function () { input.focus(); }, 0); }
    place();
  };
  /* beside the panel, level with the icon row (the color picker's place) */
  function place() {
    var a = T.root.querySelector('#panel [data-act="icons-open"]'), w = panel.offsetWidth, h = panel.offsetHeight;
    if (!a) return;
    var r = a.getBoundingClientRect(), left = T.s.dockLeft ? T.$('#panel').getBoundingClientRect().right + 8 : T.$('#panel').getBoundingClientRect().left - w - 8;
    panel.style.left = Math.max(8, Math.min(left, window.innerWidth - w - 8)) + 'px';
    panel.style.top = Math.max(8, Math.min(r.top - 8, window.innerHeight - h - 8)) + 'px';
  }
  T.action('icons-open', function () { T.openIconPicker(); });
  T.action('icons-close', function () { T.closeIconPicker(); });
  T.action('icon-pick', function (b) {
    var nu = 'rp-icon-' + b.getAttribute('data-icon');
    T.runEach(function (el) { var old = T.iconClass(el); return old !== nu ? T.ops.cls(el, old ? [old] : [], [nu]) : null; });
  });
  panel.addEventListener('input', function (e) { if (e.target.id === 'iq') { query = e.target.value; T.renderIconPicker(); } });
  panel.addEventListener('keydown', function (e) {
    if (e.target.id !== 'iq') return;
    if (e.isComposing || e.keyCode === 229) { e.stopPropagation(); return; } /* IME composition */
    if (e.key === 'Escape') { T.closeIconPicker(); e.preventDefault(); }
    else if (e.key === 'Enter') { var first = panel.querySelector('[data-icon]'); if (first) first.click(); e.preventDefault(); }
    e.stopPropagation();
  });
})(window.DLTweakNS);
