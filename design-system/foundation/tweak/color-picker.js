/* Tweak mode — color picker: the full theme palette (22 hues × 11 shades) + transparent
   overlays. T.openColorPicker(anchor, { title, current, allowNone, onPick(token|null),
   presets: [{ key, label, bg, color, on }], onPreset(key), quick: [[token | null, label]] }) — presets
   (e.g. chip colors) or quick DS swatches (fill, text, stroke; null = None → onPick('none')) on top.
   Picked colors are written as var(--token) for shared.css tokens and var(--token, #hex)
   for the extended palette, so they render with or without tokens-extended.css. */
(function (T) {
  'use strict';
  var K = T.tokens, esc = T.esc, I = T.icon;
  var pop = T.$('#colorpicker'), opts = null, anchorEl = null;

  T.openColorPicker = function (anchor, o) {
    opts = o; anchorEl = anchor;
    render();
    pop.hidden = false;
    position();
  };
  T.closeColorPicker = function () { pop.hidden = true; opts = null; };
  T.colorPickerOpen = function () { return !pop.hidden; };

  function cell(token, color, title) {
    var cur = opts.current === token;
    return '<button class="cp' + (cur ? ' on' : '') + '" data-act="cp-pick" data-token="' + token + '" style="background:' + color + '" title="' + esc(title) + '"></button>';
  }
  function render() {
    var html = '<div class="cph"><b>' + esc(opts.title || 'Color') + '</b><span class="cpname" id="cpname">' + (opts.current ? esc(opts.current) : '') + '</span>' +
      '<button class="ib" data-act="cp-close" title="Close  Esc">' + I('x', 14) + '</button></div>';
    if (opts.presets) html += '<div class="cpre">' + opts.presets.map(function (p) {
      return '<button class="' + (p.on ? 'on' : '') + '" data-act="cp-preset" data-key="' + esc(p.key) + '" style="background:' + p.bg + ';color:' + p.color + '" title="' + esc(p.key ? '.' + p.key : 'no modifier') + '">' + esc(p.label) + '</button>';
    }).join('') + '</div><div class="cpsub">Any color</div>';
    if (opts.quick) html += '<div class="sw cpq">' + opts.quick.map(function (c) {
      var on = c[0] ? opts.current === c[0] : false;
      return '<button data-act="cp-pick" data-token="' + (c[0] || 'none') + '" class="' + (c[0] ? '' : 'none ') + (on ? 'on' : '') + '" title="' + esc(c[1] + (c[0] ? ' · var(' + c[0] + ')' : '')) + '"' + (c[0] ? ' style="background:var(' + c[0] + ')"' : '') + '></button>';
    }).join('') + '</div>';
    html += '<div class="cpgrid"><span></span>' + K.SHADES.map(function (s) { return '<span class="cpsh">' + s + '</span>'; }).join('');
    Object.keys(K.PALETTE).forEach(function (hue) {
      html += '<span class="cphue">' + hue + '</span>' + K.PALETTE[hue].map(function (hex, i) { return hex ? cell(K.tokenName(hue, K.SHADES[i]), hex, hue + ' ' + K.SHADES[i] + ' · ' + hex) : '<span></span>'; }).join('');
    });
    html += '</div><div class="cprow"><span class="cphue">dark α</span>' + K.OVERLAYS.dark.map(function (o) { return cell('--overlay-dark-' + o[0], o[1], 'overlay dark ' + o[0] + '%'); }).join('') + '</div>';
    html += '<div class="cprow light"><span class="cphue">light α</span>' + K.OVERLAYS.light.map(function (o) { return cell('--overlay-light-' + o[0], o[1], 'overlay light ' + o[0] + '%'); }).join('') + '</div>';
    if (opts.allowNone !== false) html += '<div class="cpfoot"><button class="btnline" data-act="cp-pick" data-token="">Reset to default</button></div>';
    pop.innerHTML = html;
  }
  function position() {
    var r = anchorEl.getBoundingClientRect(), w = pop.offsetWidth, h = pop.offsetHeight;
    var left = T.s.dockLeft ? r.right + 8 : r.left - w - 8;
    left = Math.max(8, Math.min(left, window.innerWidth - w - 8));
    pop.style.left = left + 'px';
    pop.style.top = Math.max(8, Math.min(r.top - 40, window.innerHeight - h - 8)) + 'px';
  }

  T.action('cp-close', function () { T.closeColorPicker(); });
  T.action('cp-preset', function (b) { var fn = opts && opts.onPreset, k = b.getAttribute('data-key'); T.closeColorPicker(); if (fn) fn(k); });
  T.action('cp-pick', function (b) {
    var token = b.getAttribute('data-token') || null, fn = opts && opts.onPick;
    T.closeColorPicker();
    if (fn) fn(token);
  });
  pop.addEventListener('pointerover', function (e) {
    var c = e.target.closest('[data-token]'), n = T.$('#cpname');
    if (c && n) n.textContent = c.getAttribute('title');
  });
})(window.DLTweakNS);
