/* Tweak mode — "Ignore auto layout" (Figma; a button in the Size section) takes an element out of its
   flex / grid flow and places it at X / Y inside the parent (position: absolute; the parent
   gets position: relative when it has none). The element stays where it was when you switch;
   then drag it or nudge it with the arrow keys (⇧ = 10 px). Switching back removes the
   offsets, and the parent's relative position when Tweak added it and nothing else needs it. */
(function (T) {
  'use strict';
  var S = T.s, I = T.icon, px = T.px;

  T.isAbsolute = function (el, cs) { return /^(absolute)$/.test((cs || getComputedStyle(el)).position); };
  function inAutoLayout(el) { var p = el.parentElement; return !!p && p !== document.body && /flex|grid/.test(getComputedStyle(p).display); }
  var keptWidth = new WeakMap(); /* width Tweak fixed when the element left the layout (removed on the way back) */
  function inOriginal(el, prop) { return T.src.splitDecls(T.stateOf(el).original || '').some(function (d) { return d[0] === prop; }); }

  /* Offsets of el inside its parent's padding box, so switching does not move it */
  function offsets(el) {
    var p = el.parentElement, pcs = getComputedStyle(p), r = el.getBoundingClientRect(), pr = p.getBoundingClientRect();
    return { x: Math.round(r.left - pr.left - parseFloat(pcs.borderLeftWidth) + p.scrollLeft), y: Math.round(r.top - pr.top - parseFloat(pcs.borderTopWidth) + p.scrollTop), w: Math.round(r.width) };
  }
  /* Try the absolute position for a moment and correct for margins (auto margins, offsets) */
  function settle(el, ch, was) {
    var p = el.parentElement, ps = p.getAttribute('style'), es = el.getAttribute('style');
    if (getComputedStyle(p).position === 'static') p.style.position = 'relative';
    Object.keys(ch).forEach(function (k) { el.style.setProperty(k, ch[k]); });
    var r = el.getBoundingClientRect();
    if (es === null) el.removeAttribute('style'); else el.setAttribute('style', es);
    if (ps === null) p.removeAttribute('style'); else p.setAttribute('style', ps);
    ch.left = (parseFloat(ch.left) + Math.round(was.left - r.left)) + 'px';
    ch.top = (parseFloat(ch.top) + Math.round(was.top - r.top)) + 'px';
  }
  function ignoreOn(el, parents) {
    var p = el.parentElement, list = [], o = offsets(el), was = el.getBoundingClientRect(), ch = { position: 'absolute', left: o.x + 'px', top: o.y + 'px' };
    if (T.sizeMode(el, 'w') === 'fill') { ch.width = o.w + 'px'; keptWidth.set(el, ch.width); } /* a filling element keeps its width (Figma) */
    settle(el, ch, was);
    if (getComputedStyle(p).position === 'static' && !parents.has(p)) { parents.add(p); list.push(T.ops.style(p, { position: 'relative' })); }
    list.push(T.ops.style(el, ch));
    return list;
  }
  function ignoreOff(el, parents, leaving) {
    var p = el.parentElement, list = [], ch = {};
    ch.position = inOriginal(el, 'position') ? 'static' : null;
    ch.left = inOriginal(el, 'left') ? 'auto' : null;
    ch.top = inOriginal(el, 'top') ? 'auto' : null;
    if (keptWidth.get(el) && T.overridesOf(el).get('width') === keptWidth.get(el)) { ch.width = null; keptWidth.delete(el); }
    list.push(T.ops.style(el, ch));
    var others = Array.prototype.some.call(p.children, function (k) { return leaving.indexOf(k) < 0 && T.isAbsolute(k); });
    if (T.overridesOf(p).get('position') === 'relative' && !others && !parents.has(p)) { parents.add(p); list.push(T.ops.style(p, { position: null })); }
    return list;
  }

  /* Shown in the Size section (size.js): the button after W / H, X / Y below it when absolute */
  T.ignoreALButton = function (el, ctx) {
    if (!T.isAbsolute(el, ctx.cs) && !inAutoLayout(el)) return '<span></span>';
    var on = T.common(function (o) { return T.isAbsolute(o); });
    return '<button class="ib' + (on === true ? ' on' : '') + '" data-act="ignore-al" title="' + (on === true ? 'Back into auto layout' : on === T.MIXED ? 'Some of the selected elements ignore auto layout: click to put them all back' : 'Ignore auto layout: place it freely in the parent (X / Y)') + '">' + I('ignoreAL', 14) + '</button>';
  };
  T.absFields = function (el, ctx) {
    if (T.common(function (o) { return T.isAbsolute(o); }) !== true) return '';
    return '<div class="grid3">' +
      T.field('left', 'X', px(ctx.cs.left), { mod: ctx.mod('left'), title: 'X from the parent\'s left edge · drag the element or use the arrow keys' }) +
      T.field('top', 'Y', px(ctx.cs.top), { mod: ctx.mod('top'), title: 'Y from the parent\'s top edge' }) + '<span></span></div>';
  };

  /* Not part of the similar-elements scope: only the selected element(s) */
  T.action('ignore-al', function () {
    var targets = T.targets(true), turnOn = T.common(function (o) { return T.isAbsolute(o); }) !== true, parents = new Set();
    var leaving = targets.filter(function (o) { return T.isAbsolute(o); });
    T.runEach(function (el) {
      if (turnOn) return T.isAbsolute(el) ? null : ignoreOn(el, parents);
      return ignoreOff(el, parents, leaving);
    }, true);
  });

  /* ── Free move: drag an absolute element, or nudge it with the arrow keys ── */
  var mv = null;
  T.absStart = function (el, e) {
    var cs = getComputedStyle(el);
    mv = { el: el, x: e.clientX, y: e.clientY, left: px(cs.left), top: px(cs.top), before: new Map(T.stateOf(el).overrides), started: false, at: null };
  };
  T.absMoving = function () { return !!mv; };
  T.absMove = function (e) {
    var dx = e.clientX - mv.x, dy = e.clientY - mv.y;
    if (!mv.started && Math.abs(dx) + Math.abs(dy) < 4) return;
    mv.started = true;
    var snap = e.shiftKey ? 8 : 1, l = Math.round((mv.left + dx) / snap) * snap, t = Math.round((mv.top + dy) / snap) * snap;
    if (mv.at && mv.at[0] === l && mv.at[1] === t) return;
    mv.at = [l, t];
    var preview = new Map(mv.before);
    preview.set('left', l + 'px'); preview.set('top', t + 'px');
    T.renderLive(mv.el, preview);
  };
  T.absEnd = function () {
    var m = mv;
    mv = null;
    if (!m) return false;
    T.renderLive(m.el, m.before);
    if (!m.started || !m.at) return false;
    T.run(T.ops.style(m.el, { left: m.at[0] + 'px', top: m.at[1] + 'px' }));
    return true;
  };
  T.nudge = function (dx, dy) {
    T.runEach(function (el) {
      if (!T.isAbsolute(el)) return null;
      var cs = getComputedStyle(el), ch = {};
      if (dx) ch.left = (px(cs.left) + dx) + 'px';
      if (dy) ch.top = (px(cs.top) + dy) + 'px';
      return T.ops.style(el, ch);
    }, true);
  };
})(window.DLTweakNS);
