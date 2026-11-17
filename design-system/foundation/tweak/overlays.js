/* Tweak mode — canvas overlays, redrawn every animation frame while active:
   hover outline, selection (handles, name, size), padding / margin / gap visualisation,
   ⌥ distance redlines, drop indicator for drag & drop. */
(function (T) {
  'use strict';
  var S = T.s, raf = 0;
  var $ = T.$;
  var ovHover = $('.hover'), ovSel = $('.sel'), ovName = $('.name'), ovSize = $('.size'), ovPad = $('.pad'), ovMar = $('.mar');
  var ovDropBox = $('.dropbox'), ovDrop = $('.drop'), gapsEl = $('#gaps'), measureEl = $('#measure');

  T.place = function (box, r) {
    box.style.display = 'block';
    box.style.left = r.left + 'px'; box.style.top = r.top + 'px';
    box.style.width = r.width + 'px'; box.style.height = r.height + 'px';
  };
  T.hide = function () { for (var i = 0; i < arguments.length; i++) arguments[i].style.display = 'none'; };
  var place = T.place, hide = T.hide;

  T.startFrames = function () { if (!raf) raf = requestAnimationFrame(frame); };
  T.stopFrames = function () { cancelAnimationFrame(raf); raf = 0; };

  /* Per-frame hooks other modules can add (e.g. dropdown positioning, drag autoscroll) */
  T.frameHooks = [];

  function frame() {
    raf = S.active ? requestAnimationFrame(frame) : 0;
    var interact = S.tool === 'interact', sel = S.tool === 'comment' ? null : S.selected;
    if (!interact && !S.drag && S.hovered && S.hovered !== sel && S.hovered.isConnected) place(ovHover, S.hovered.getBoundingClientRect()); else hide(ovHover);
    if (!interact && sel && sel.isConnected) {
      var r = sel.getBoundingClientRect(), cs = getComputedStyle(sel), comp = T.componentOf(sel);
      place(ovSel, r);
      ovName.style.display = 'block';
      ovName.textContent = (comp ? '◇ ' : '') + T.nameOf(sel);
      ovName.className = 'name' + (comp ? ' comp' : '');
      ovName.style.left = Math.max(4, r.left) + 'px';
      ovName.style.top = (r.top > 20 ? r.top - 18 : r.bottom + 4) + 'px';
      ovSize.style.display = 'block';
      ovSize.textContent = Math.round(r.width) + ' × ' + Math.round(r.height);
      ovSize.style.left = (r.left + r.width / 2) + 'px';
      ovSize.style.top = (r.bottom + 6 + (r.top <= 20 ? 18 : 0)) + 'px';
      place(ovPad, r);
      ovPad.style.borderWidth = cs.paddingTop + ' ' + cs.paddingRight + ' ' + cs.paddingBottom + ' ' + cs.paddingLeft;
      ovPad.className = 'ov pad' + (S.hotBox === 'pad' ? ' hot' : '');
      var mt = parseFloat(cs.marginTop) || 0, mr = parseFloat(cs.marginRight) || 0, mb = parseFloat(cs.marginBottom) || 0, ml = parseFloat(cs.marginLeft) || 0;
      if (mt > 0 || mr > 0 || mb > 0 || ml > 0) {
        place(ovMar, { left: r.left - Math.max(ml, 0), top: r.top - Math.max(mt, 0), width: r.width + Math.max(ml, 0) + Math.max(mr, 0), height: r.height + Math.max(mt, 0) + Math.max(mb, 0) });
        ovMar.style.borderWidth = Math.max(mt, 0) + 'px ' + Math.max(mr, 0) + 'px ' + Math.max(mb, 0) + 'px ' + Math.max(ml, 0) + 'px';
        ovMar.className = 'ov mar' + (S.hotBox === 'mar' ? ' hot' : '');
      } else hide(ovMar);
      drawGaps(S.hotBox === 'gap' ? sel : null);
    } else { hide(ovSel, ovName, ovSize, ovPad, ovMar); drawGaps(null); }
    drawMeasure(!interact && !S.drag && S.altDown && sel && S.hovered && S.hovered !== sel ? [sel, S.hovered] : null);
    T.frameHooks.forEach(function (fn) { fn(); });
  }

  function drawGaps(el) {
    var html = '';
    if (el) {
      var kids = Array.prototype.filter.call(el.children, function (c) { return c.getBoundingClientRect().width; });
      var col = T.axisOf(el) === 'v';
      for (var i = 0; i < kids.length - 1; i++) {
        var a = kids[i].getBoundingClientRect(), b = kids[i + 1].getBoundingClientRect(), r;
        if (col) r = { left: Math.min(a.left, b.left), top: a.bottom, width: Math.max(a.right, b.right) - Math.min(a.left, b.left), height: b.top - a.bottom };
        else r = { left: a.right, top: Math.min(a.top, b.top), width: b.left - a.right, height: Math.max(a.bottom, b.bottom) - Math.min(a.top, b.top) };
        if (r.width > 0 && r.height > 0) html += '<div class="gapov" style="left:' + r.left + 'px;top:' + r.top + 'px;width:' + r.width + 'px;height:' + r.height + 'px"></div>';
      }
    }
    if (gapsEl._h !== html) { gapsEl.innerHTML = html; gapsEl._h = html; }
  }

  /* Figma-style redlines between the selection and the hovered element */
  function drawMeasure(pair) {
    var html = '';
    if (pair) {
      var s = pair[0].getBoundingClientRect(), h = pair[1].getBoundingClientRect(), lines = [];
      var inside = function (a, b) { return a.left >= b.left && a.right <= b.right && a.top >= b.top && a.bottom <= b.bottom; };
      if (inside(s, h) || inside(h, s)) {
        var inner = inside(s, h) ? s : h, outer = inside(s, h) ? h : s, cx = inner.left + inner.width / 2, cy = inner.top + inner.height / 2;
        lines.push(['v', cx, outer.top, inner.top], ['v', cx, inner.bottom, outer.bottom], ['h', cy, outer.left, inner.left], ['h', cy, inner.right, outer.right]);
      } else {
        var ox1 = Math.max(s.left, h.left), ox2 = Math.min(s.right, h.right), oy1 = Math.max(s.top, h.top), oy2 = Math.min(s.bottom, h.bottom);
        var x = ox2 > ox1 ? (ox1 + ox2) / 2 : s.left + s.width / 2, y = oy2 > oy1 ? (oy1 + oy2) / 2 : s.top + s.height / 2;
        if (h.top >= s.bottom) lines.push(['v', x, s.bottom, h.top]); else if (h.bottom <= s.top) lines.push(['v', x, h.bottom, s.top]);
        if (h.left >= s.right) lines.push(['h', y, s.right, h.left]); else if (h.right <= s.left) lines.push(['h', y, h.right, s.left]);
      }
      lines.forEach(function (l) {
        var d = Math.round(l[3] - l[2]);
        if (d <= 0) return;
        if (l[0] === 'v') html += '<div class="mline" style="left:' + (l[1] - .5) + 'px;top:' + l[2] + 'px;width:1px;height:' + d + 'px"></div><div class="mlabel" style="left:' + l[1] + 'px;top:' + (l[2] + d / 2) + 'px">' + d + '</div>';
        else html += '<div class="mline" style="top:' + (l[1] - .5) + 'px;left:' + l[2] + 'px;height:1px;width:' + d + 'px"></div><div class="mlabel" style="top:' + l[1] + 'px;left:' + (l[2] + d / 2) + 'px">' + d + '</div>';
      });
      place(ovHover, h);
    }
    if (measureEl._h !== html) { measureEl.innerHTML = html; measureEl._h = html; }
  }

  /* Drop indicator: t = { rect, pos: before|after|inside, horizontal } or null */
  T.showDrop = function (t) {
    if (!t) { hide(ovDrop, ovDropBox); return; }
    var r = t.rect, b = t.box;
    /* frame the target container (Figma: the frame it lands in), then the insertion line */
    if (b && t.pos !== 'inside') { ovDropBox.style.display = 'block'; place(ovDropBox, { left: b.left, top: b.top, width: b.width, height: b.height }); }
    else hide(ovDropBox);
    if (t.pos === 'inside') { ovDrop.className = 'drop in'; place(ovDrop, { left: r.left + 2, top: r.top + 2, width: r.width - 4, height: r.height - 4 }); }
    else if (t.horizontal) { ovDrop.className = 'drop v'; place(ovDrop, { left: (t.pos === 'before' ? r.left : r.right) - 1.5, top: r.top, width: 3, height: r.height }); }
    else { ovDrop.className = 'drop h'; place(ovDrop, { left: r.left, top: (t.pos === 'before' ? r.top : r.bottom) - 1.5, width: r.width, height: 3 }); }
  };

  /* Layout axis of a container: 'h' (row flex, grid, inline) or 'v' (column flex, block flow) */
  T.axisOf = function (container) {
    if (!container) return 'v';
    var cs = getComputedStyle(container);
    if (/flex/.test(cs.display)) return cs.flexDirection.indexOf('row') === 0 ? 'h' : 'v';
    if (/grid/.test(cs.display)) return cs.gridTemplateColumns && cs.gridTemplateColumns.split(' ').length > 1 ? 'h' : 'v';
    if (container.tagName === 'TR') return 'h';
    return 'v';
  };
  /* Axis along which an element is ordered inside its parent (inline children flow horizontally) */
  T.axisFor = function (el) {
    var p = el.parentElement;
    if (!p) return 'v';
    var pd = getComputedStyle(p).display;
    if (/flex|grid/.test(pd) || p.tagName === 'TR') return T.axisOf(p);
    return /^inline/.test(getComputedStyle(el).display) ? 'h' : 'v';
  };
})(window.DLTweakNS);
