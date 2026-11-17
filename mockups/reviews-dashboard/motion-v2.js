/*
 * ReviewPro UI V2 · motion for charts (a proposal, NOT the current UI App library).
 * Loaded after shared.js in a page's -v2 copy: .kiro/scripts/make-v2.py copies it next to theme-v2.css and links it.
 * The CSS half of V2 motion (press, hover, menus, dialogs, drawers) is theme-v2.css § 6. Rules: design-system/v2/README.md.
 *
 * Each chart draws itself once, when about a third of it is on screen (on load for the ones already in view):
 *   - donuts (an <svg> of concentric circles and texts; segments are circle[pathLength] with stroke-dasharray and
 *     stroke-dashoffset): the segments sweep round in order as one stroke, the first number counts up with the sweep,
 *     the other texts (the change) fade in;
 *   - line charts (svg.kit-chart): lines draw from left to right and filled areas are revealed at the same pace.
 * Never with prefers-reduced-motion, while Tweak is editing (html.dl-tweaking), when printing, or outside V2.
 * Nothing is saved into the page: strokes and fades run on the Web Animations API (no attribute, style or class is
 * written) and a counted number is put back exactly as it was written. No dependencies.
 */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement;
  if (root.getAttribute('data-rp-version') !== 'v2' || typeof Element.prototype.animate !== 'function' || !window.IntersectionObserver) return;
  var reduce = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  function tweaking() { return root.classList.contains('dl-tweaking') || !!doc.getElementById('dl-tweak-host'); }
  if ((reduce && reduce.matches) || tweaking()) return;

  var DONUT_MS = 900, LINE_MS = 1100, FADE_MS = 320, STAGGER_MS = 80, STEPS = 48;
  var EASE = bezier(0.33, 1, 0.68, 1);              /* charts: ease-out, quick start and a soft, readable landing */
  var UI_EASE = 'cubic-bezier(0.23, 1, 0.32, 1)';    /* = --v2-ease-out in theme-v2.css */

  /* CSS cubic-bezier timing, as a function of progress 0..1 */
  function bezier(x1, y1, x2, y2) {
    function at(t, p1, p2) { return ((1 + 3 * p1 - 3 * p2) * t + (3 * p2 - 6 * p1)) * t * t + 3 * p1 * t; }
    function slope(t, p1, p2) { return 3 * (1 + 3 * p1 - 3 * p2) * t * t + 2 * (3 * p2 - 6 * p1) * t + 3 * p1; }
    return function (x) {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      var t = x, i, d, s;
      for (i = 0; i < 8; i++) {
        d = at(t, x1, x2) - x; s = slope(t, x1, x2);
        if (Math.abs(d) < 1e-6) break;
        if (Math.abs(s) < 1e-6) { t = -1; break; }
        t -= d / s;
      }
      if (!(t >= 0 && t <= 1) || Math.abs(at(t, x1, x2) - x) > 1e-4) {
        var lo = 0, hi = 1;
        for (i = 0, t = x; i < 40; i++) { d = at(t, x1, x2); if (Math.abs(d - x) < 1e-6) break; if (d < x) lo = t; else hi = t; t = (lo + hi) / 2; }
      }
      return at(t, y1, y2);
    };
  }
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  function num(v) { return Math.round(v * 1000) / 1000; }

  /* A number written in a <text> ("88.1%", "157", "1,204") that can count up from zero and be put back exactly */
  var NUMBER = /^(\D*?)([-+\u2212]?)(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d+))?(\D*)$/;
  function counter(el) {
    if (el.childNodes.length !== 1 || el.firstChild.nodeType !== 3) return null;
    var node = el.firstChild, original = node.nodeValue, core = original.trim(), m = NUMBER.exec(core);
    if (!m) return null;
    var value = parseFloat(m[3].replace(/,/g, '') + (m[4] ? '.' + m[4] : ''));
    if (!(value > 0)) return null;
    var pre = original.slice(0, original.indexOf(core)), post = original.slice(original.indexOf(core) + core.length);
    var places = m[4] ? m[4].length : 0, grouped = m[3].indexOf(',') >= 0;
    return {
      show: function (p) {
        var v = value * p;
        var s = grouped ? v.toLocaleString('en-US', { minimumFractionDigits: places, maximumFractionDigits: places }) : v.toFixed(places);
        node.nodeValue = pre + m[1] + m[2] + s + m[5] + post;
      },
      restore: function () { node.nodeValue = original; }
    };
  }

  /* ── what each chart animates: a list of { el, frames, timing } plus counters driven by the same eased clock ── */
  function isDonut(svg) {
    var circles = svg.querySelectorAll('circle');
    if (!circles.length || !svg.querySelector('text') || svg.querySelector('path, polyline, polygon, line, rect, ellipse, image')) return false;
    for (var i = 1; i < circles.length; i++) {
      for (var a = 0, at = ['cx', 'cy', 'r']; a < 3; a++) if (circles[i].getAttribute(at[a]) !== circles[0].getAttribute(at[a])) return false;
    }
    return true;
  }
  function donut(svg) {
    var parts = [], counters = [], segs = [], total = 0;
    [].forEach.call(svg.querySelectorAll('circle[pathLength][stroke-dasharray]'), function (c) {
      var P = parseFloat(c.getAttribute('pathLength')), len = parseFloat(c.getAttribute('stroke-dasharray'));
      var start = -parseFloat(c.getAttribute('stroke-dashoffset') || '0');
      if (!(P > 0) || !(len > 0) || isNaN(start)) return;
      start = ((start % P) + P) % P;
      segs.push({ el: c, P: P, len: len, start: start });
      total = Math.max(total, start + len);
    });
    segs.forEach(function (s) {   /* one continuous sweep: each segment grows only while the sweep crosses it */
      var frames = [];
      for (var k = 0; k <= STEPS; k++) {
        var shown = clamp(EASE(k / STEPS) * total - s.start, 0, s.len);
        frames.push({ offset: k / STEPS, strokeDasharray: num(shown) + ' ' + s.P, opacity: shown > 0 ? 1 : 0 });
      }
      parts.push({ el: s.el, frames: frames, timing: { duration: DONUT_MS, fill: 'backwards' } });
    });
    var texts = svg.querySelectorAll('text');
    [].forEach.call(texts, function (t, i) {
      var c = i === 0 && segs.length ? counter(t) : null;
      if (c) {
        counters.push(c);
        parts.push({ el: t, frames: [{ opacity: 0 }, { opacity: 1, offset: 0.12 }, { opacity: 1 }], timing: { duration: DONUT_MS, fill: 'backwards' } });
      } else if (i > 0) {
        parts.push({ el: t, frames: [{ opacity: 0 }, { opacity: 1 }], timing: { duration: FADE_MS, delay: DONUT_MS * 0.45, easing: UI_EASE, fill: 'backwards' } });
      }
    });
    return { parts: parts, counters: counters, duration: DONUT_MS };
  }
  function lineChart(svg) {
    var parts = [], lines = [], areas = [], x0 = Infinity, x1 = -Infinity;
    [].forEach.call(svg.querySelectorAll('polyline, path'), function (el) {
      var cs = getComputedStyle(el), box;
      try { box = el.getBBox(); } catch (e) { return; }
      if (!(box.width > 0)) return;
      if (cs.fill === 'none' && cs.stroke !== 'none') lines.push({ el: el, box: box, dashed: cs.strokeDasharray && cs.strokeDasharray !== 'none' });
      else if (cs.fill !== 'none') areas.push({ el: el, box: box });
      else return;
      x0 = Math.min(x0, box.x); x1 = Math.max(x1, box.x + box.width);
    });
    if (!(x1 > x0)) return null;
    function xAt(k) { return x0 + EASE(k / STEPS) * (x1 - x0); }
    function reveal(item) {   /* clip from the right, keeping pace with the lines */
      var frames = [], bx = item.box.x, bw = item.box.width;
      for (var k = 0; k <= STEPS; k++) frames.push({ offset: k / STEPS, clipPath: 'inset(0 ' + num((1 - clamp((xAt(k) - bx) / bw, 0, 1)) * 100) + '% 0 0)' });
      parts.push({ el: item.el, frames: frames, timing: { duration: LINE_MS, fill: 'backwards' } });
    }
    areas.forEach(reveal);
    lines.forEach(function (item) {
      if (item.dashed) return reveal(item);
      var el = item.el, L = el.getTotalLength(), pts = [], i, k;
      if (!(L > 0)) return;
      if (el.points && el.points.numberOfItems > 1) {
        for (i = 0; i < el.points.numberOfItems; i++) { var p = el.points.getItem(i); pts.push({ x: p.x, y: p.y }); }
      } else {
        for (i = 0; i <= 200; i++) { var q = el.getPointAtLength(L * i / 200); pts.push({ x: q.x, y: q.y }); }
      }
      var cum = [0];
      for (i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
      var sum = cum[cum.length - 1] || 1, rising = pts.every(function (p, j) { return !j || p.x >= pts[j - 1].x; });
      function drawnAt(x, k) {   /* length of line left of x (time series), or plain length progress otherwise */
        if (!rising) return EASE(k / STEPS) * sum;
        if (x <= pts[0].x) return 0;
        if (x >= pts[pts.length - 1].x) return sum;
        var lo = 0, hi = pts.length - 1;
        while (hi - lo > 1) { var mid = (lo + hi) >> 1; if (pts[mid].x <= x) lo = mid; else hi = mid; }
        var w = pts[hi].x - pts[lo].x, f = w > 0 ? (x - pts[lo].x) / w : 1;
        return cum[lo] + f * (cum[hi] - cum[lo]);
      }
      var frames = [];
      for (k = 0; k <= STEPS; k++) {
        var d = clamp(drawnAt(xAt(k), k) * L / sum, 0, L);
        frames.push({ offset: k / STEPS, strokeDasharray: num(L) + ' ' + num(L), strokeDashoffset: num(L - d), opacity: d > 0.5 ? 1 : 0 });
      }
      parts.push({ el: el, frames: frames, timing: { duration: LINE_MS, fill: 'backwards' } });
    });
    return parts.length ? { parts: parts, counters: [], duration: LINE_MS } : null;
  }

  /* ── a chart: armed (held at its first frame, before it shows), then played once, or stopped (final state) ── */
  function chart(el, plan) {
    var anims = null, raf = 0, played = false, over = false;
    var c = {
      el: el,
      arm: function () {
        if (anims || over) return;
        anims = plan.parts.map(function (p) { var a = p.el.animate(p.frames, p.timing); a.pause(); return a; });
      },
      play: function (delay) {
        if (over || played) return;
        played = true;
        c.arm();
        anims.forEach(function (a) { a.effect.updateTiming({ delay: (a.effect.getTiming().delay || 0) + delay }); a.play(); });
        Promise.all(anims.map(function (a) { return a.finished; })).then(c.stop, function () { /* stopped early */ });
        if (!plan.counters.length) return;
        var t0 = performance.now() + delay;
        (function frame(now) {
          if (over) return;
          var x = (now - t0) / plan.duration;
          if (x >= 1) { plan.counters.forEach(function (n) { n.restore(); }); return; }
          plan.counters.forEach(function (n) { n.show(EASE(clamp(x, 0, 1))); });
          raf = requestAnimationFrame(frame);
        })(performance.now());
      },
      stop: function () {
        if (over) return;
        over = true;
        cancelAnimationFrame(raf);
        (anims || []).forEach(function (a) { a.cancel(); });
        plan.counters.forEach(function (n) { n.restore(); });
      }
    };
    return c;
  }

  var charts = [];
  [].forEach.call(doc.querySelectorAll('svg'), function (svg) {
    if (svg.closest('#dl-tweak-host, [data-dl-runtime]')) return;
    try {
      var plan = isDonut(svg) ? donut(svg) : svg.classList.contains('kit-chart') ? lineChart(svg) : null;
      if (plan && plan.parts.length) charts.push(chart(svg, plan));
    } catch (e) { /* a chart we cannot read stays as it is */ }
  });
  if (!charts.length) return;
  function find(el) { for (var i = 0; i < charts.length; i++) if (charts[i].el === el) return charts[i]; return null; }
  function onScreen(r) { return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight; }

  var play = new IntersectionObserver(function (entries) {
    entries.filter(function (e) {
      return e.isIntersecting && (e.intersectionRatio >= 0.35 || e.intersectionRect.height >= innerHeight * 0.35);
    }).map(function (e) { return e.target; }).sort(function (a, b) {
      return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
    }).forEach(function (el, i) { play.unobserve(el); var c = find(el); if (c) c.play(i * STAGGER_MS); });
  }, { threshold: [0, 0.1, 0.2, 0.35, 0.5] });
  var arm = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      arm.unobserve(e.target);
      var c = find(e.target);
      if (!c) return;
      if (onScreen(e.boundingClientRect)) { c.stop(); return; }   /* it already showed drawn (a tab, a fast scroll): leave it */
      c.arm();
      play.observe(e.target);
    });
  }, { rootMargin: '25% 0px 25% 0px' });
  /* The version switch (shared.js, key rp-version-scroll) puts the scroll position back just after load. Judge what is
     near the view at that position, and start watching once it is back, so no chart draws unseen or is skipped. */
  var restoreY = null;
  try { var saved = sessionStorage.getItem('rp-version-scroll'); if (saved !== null && saved !== '' && !isNaN(+saved)) restoreY = +saved; } catch (e) { /* storage off */ }
  var dy = restoreY === null ? 0 : restoreY - scrollY, near = [], far = [];
  charts.forEach(function (c) {   /* the ones in view or near it (above or below) are held empty before the first paint */
    var r = c.el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0 && r.bottom - dy > -innerHeight * 0.25 && r.top - dy < innerHeight * 1.25) { c.arm(); near.push(c); }
    else far.push(c);
  });
  function start() {
    near.forEach(function (c) { play.observe(c.el); });
    far.forEach(function (c) { arm.observe(c.el); });
  }
  if (Math.abs(dy) < 1) start();
  else {
    var started = false, go = function () { if (started) return; started = true; removeEventListener('scroll', go); start(); };
    addEventListener('scroll', go, { passive: true });
    setTimeout(go, 600);
  }

  function stopAll() {
    play.disconnect(); arm.disconnect(); watch.disconnect();
    charts.forEach(function (c) { c.stop(); });
  }
  var watch = new MutationObserver(function () { if (tweaking()) stopAll(); });   /* Tweak opened or editing */
  watch.observe(root, { attributes: true, attributeFilter: ['class'], childList: true });
  if (doc.body) watch.observe(doc.body, { childList: true });
  if (reduce) {
    var onReduce = function () { if (reduce.matches) stopAll(); };
    if (reduce.addEventListener) reduce.addEventListener('change', onReduce); else if (reduce.addListener) reduce.addListener(onReduce);
  }
  window.addEventListener('beforeprint', stopAll);
  window.rpMotionStop = stopAll;   /* screenshot tools: call it to show every chart in its final state */
})();
