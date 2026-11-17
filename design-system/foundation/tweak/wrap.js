/* Tweak mode — wrap the selection in a new auto layout frame, like Figma (⇧A, ⌘G / Ctrl+G).
   The selected elements (one, or several ⇧-selected siblings) move into a new <div> placed
   where the first one was. The div gets the auto layout that matches how they sit now:
   - direction: side by side → row, stacked → column
   - gap: the space between them (a DS spacing token when it is one, e.g. 16 → var(--spacing-lg))
   - alignment: the edge (or center) they already line up on
   Nothing moves on screen; then change the layout in the inspector. One undo step. */
(function (T) {
  'use strict';
  var S = T.s, K = T.tokens;

  function median(a) { var b = a.slice().sort(function (x, y) { return x - y; }); return b.length ? b[Math.floor((b.length - 1) / 2)] : 0; }
  function spread(a) { return Math.max.apply(null, a) - Math.min.apply(null, a); }
  /* the space value written: the token when the page has it and the gap is (within 2 px of) a step */
  function spaceValue(n) {
    var near = K.SPACE.filter(function (s) { return Math.abs(s[0] - n) <= 2; }).sort(function (a, b) { return Math.abs(a[0] - n) - Math.abs(b[0] - n); })[0];
    if (near) { var tok = T.tokenFor('space', near[0]); if (tok) return 'var(' + tok + ')'; n = near[0]; }
    return n ? Math.round(n) + 'px' : '0';
  }
  /* auto layout that keeps the elements where they are */
  T.guessLayout = function (els) {
    var rs = els.map(function (e) { return e.getBoundingClientRect(); });
    if (rs.length < 2) return { dir: 'column', gap: 0, align: 'flex-start' };
    var cx = rs.map(function (r) { return r.left + r.width / 2; }), cy = rs.map(function (r) { return r.top + r.height / 2; });
    var row = spread(cx) > spread(cy);
    var order = rs.slice().sort(function (a, b) { return row ? a.left - b.left : a.top - b.top; }), gaps = [];
    for (var i = 1; i < order.length; i++) gaps.push(Math.max(0, row ? order[i].left - order[i - 1].right : order[i].top - order[i - 1].bottom));
    /* which line they share: start edges, centers or end edges (the smallest spread wins) */
    var start = spread(rs.map(function (r) { return row ? r.top : r.left; })), center = spread(row ? cy : cx), end = spread(rs.map(function (r) { return row ? r.bottom : r.right; }));
    var align = start <= center + 0.5 && start <= end + 0.5 ? 'flex-start' : center <= end + 0.5 ? 'center' : 'flex-end';
    return { dir: row ? 'row' : 'column', gap: median(gaps), align: align, order: order.map(function (r) { return els[rs.indexOf(r)]; }) };
  };

  T.wrapSelection = function () {
    var els = T.selection().filter(function (e) { return e && e.isConnected; });
    if (!els.length) { T.notify('Select the elements to wrap first'); return; }
    var parent = els[0].parentElement;
    if (!els.every(function (e) { return e.parentElement === parent; })) { T.notify('Wrap needs elements of the same parent (⇧-click siblings)'); return; }
    if (!T.nodeFor(els[0]) && T.file.text !== null) { T.notify('This element is made by a script: it cannot be wrapped in the file'); return; }
    /* keep the page order (DOM order), not the click order */
    els.sort(function (a, b) { return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1; });
    var L = T.guessLayout(els);
    var style = 'display: flex; flex-direction: ' + L.dir + '; gap: ' + spaceValue(L.gap) + '; align-items: ' + L.align;
    var ins = T.ops.insert('<div style="' + style + '">\n</div>', els[0], 'before', 'Auto layout');
    var list = [ins].concat(els.map(function (e) { return T.ops.move(e, ins.el, 'inside'); }));
    T.run(T.ops.batch(list));
    T.select(ins.el);
    T.notify('Wrapped ' + els.length + ' in an auto layout · ' + (L.dir === 'row' ? 'horizontal' : 'vertical') + ', gap ' + Math.round(L.gap));
  };
  T.action('wrap', function () { T.wrapSelection(); });
})(window.DLTweakNS);
