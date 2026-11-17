/* Tweak mode — similar elements. Style and prop edits apply to every element like the selection
   (Figma: editing the main component), unless the designer picks "This one" in the scope bar.

   Similar = same tag + same classes, in the same kind of parent (tag + classes of the parent).
   Elements without classes also need the same position (nth of their tag) up to the nearest
   parent with classes, so a card's title and subtitle stay apart; rows (tr) and list items (li)
   do not count positions, so cells of one table column are similar.
   State classes (selected, active, open, disabled…) are ignored, and toggling them stays per
   element. Text edits, moves, duplicate, delete and insert always touch only the selection.

   Multi-selection (⇧-click, like Figma): S.selected is the first element, S.multi the others.
   Then edits go to exactly the selected elements (no similar ones), and fields whose values
   differ show "Mixed" (T.common). */
(function (T) {
  'use strict';
  var S = T.s;
  /* 'all' | 'one': the Apply to choice sticks (next selections, reloads) until the designer switches it */
  S.scope = 'all';
  try { if (localStorage.getItem('dl-tweak-scope') === 'one') S.scope = 'one'; } catch (e) { /* storage blocked */ }
  S.similar = [];   // elements like the selection (live), without the selection itself
  S.multi = [];     // ⇧-click: more selected elements besides S.selected

  T.isMulti = function () { S.multi = S.multi.filter(function (o) { return o.isConnected; }); return S.multi.length > 0; };
  T.selection = function () { return S.selected ? [S.selected].concat(T.isMulti() ? S.multi : []) : []; };
  /* fn(el) on every selected element: the value when all agree, else T.MIXED */
  T.MIXED = { mixed: true };
  T.common = function (fn) {
    var list = T.selection(), v;
    for (var i = 0; i < list.length; i++) { var x = fn(list[i]); if (i === 0) v = x; else if (x !== v) return T.MIXED; }
    return v;
  };
  /* ⇧-click: add the element, or take it out when it is selected already */
  T.toggleSelect = function (el) {
    if (!el || el === document.body || el === document.documentElement) return;
    if (!S.selected) { T.select(el); return; }
    var list = T.selection(), i = list.indexOf(el);
    if (i > -1) list.splice(i, 1);
    else list = list.filter(function (o) { return !o.contains(el) && !el.contains(o); }).concat([el]); /* no parent + child together */
    var keep = list.slice(1);
    T.select(list[0] || null);
    S.multi = keep;
    T.renderInspector();
    T.emit('select', S.selected);
  };

  var STATE = /^(open|opened|active|selected|on|off|visible|hidden|show|shown|collapsed|expanded|checked|disabled|readonly|loading|current|error|invalid)$|-(open|opened|active|selected|visible|hidden|collapsed|expanded|checked|disabled|readonly|loading|current|error|invalid|in-progress|completed)$/;
  T.isStateClass = function (c) { return !!c && STATE.test(c); };
  var REPEAT = { TR: 1, LI: 1 };
  var MAX = 400;

  function classKey(el) { return Array.prototype.filter.call(el.classList, function (c) { return !STATE.test(c); }).sort().join('.'); }
  function nth(el) { var i = 0, n = el; while ((n = n.previousElementSibling)) if (n.tagName === el.tagName) i++; return i; }
  function top(el) { return !el || el === document.body || el === document.documentElement; }
  function chain(el, depth) {
    var cls = classKey(el);
    if (cls) return el.tagName + '.' + cls;
    var own = el.tagName + (REPEAT[el.tagName] ? '' : ':' + nth(el));
    return top(el.parentElement) || depth > 4 ? own : chain(el.parentElement, depth + 1) + '>' + own;
  }
  T.signature = function (el) {
    var cls = classKey(el), p = el.parentElement;
    if (!cls) return chain(el, 0);
    var own = el.tagName + '.' + cls;
    if (top(p)) return own;
    var pc = classKey(p);
    return p.tagName + (pc ? '.' + pc : '') + '>' + own;
  };

  function own(el) { return T.src.isOwnNode(el) || !!el.closest('#dl-tweak-host, [data-dl-preview], [data-dl-probe]'); }
  T.findSimilar = function (el) {
    if (!el || !el.isConnected || top(el) || own(el)) return [];
    var sig = T.signature(el), out = [];
    var all = document.body.getElementsByTagName(el.tagName);
    for (var i = 0; i < all.length && out.length < MAX; i++) {
      var o = all[i];
      if (o === el || o.contains(el) || el.contains(o) || own(o)) continue;
      if (T.signature(o) === sig) out.push(o);
    }
    return out;
  };
  T.refreshSimilar = function () { S.similar = T.isMulti() ? [] : T.findSimilar(S.selected); return S.similar; };

  /* Elements an edit applies to: the selection, plus every similar element unless scope is 'one' */
  T.targets = function (single) {
    var el = S.selected;
    if (!el) return [];
    if (T.isMulti()) return T.selection();
    if (single || S.scope === 'one') return [el];
    return [el].concat(S.similar.filter(function (o) { return o.isConnected; }));
  };
  /* Replace / swap on every target (similar or ⇧-selected) as one undo step; the first new
     element is selected. root(el) = what gets replaced (a checkbox's label…), build(el) = its HTML */
  T.replaceEach = function (root, build, label) {
    var seen = [], ops = [];
    T.targets().forEach(function (el) {
      var r = root(el);
      if (!r || seen.some(function (s) { return s === r || s.contains(r) || r.contains(s); })) return;
      var html = build(el, r);
      if (!html) return;
      seen.push(r);
      var op = T.ops.replace(r, html, label);
      if (ops.length) op.quiet = true;
      ops.push(op);
    });
    if (ops.length) T.run(ops.length === 1 ? ops[0] : T.ops.batch(ops));
    return ops.length;
  };
  /* make(el) → op | [op…] | null for each target; all of them become one undo step */
  T.runEach = function (make, single) {
    var list = [];
    T.targets(single).forEach(function (el) {
      var r = make(el);
      if (r) list = list.concat(r).filter(Boolean);
    });
    if (list.length) T.run(list.length === 1 ? list[0] : T.ops.batch(list));
  };

  T.action('scope', function (b) { S.scope = b.getAttribute('data-scope') === 'one' ? 'one' : 'all'; T.store.set('dl-tweak-scope', S.scope); T.renderInspector(); });

  /* Scope bar under the inspector header: label and choices on the inspector grid */
  T.scopeBar = function () {
    var n = S.similar.length;
    if (T.isMulti() || !n) return '';
    var all = S.scope !== 'one';
    return '<div class="scope" title="Similar = same tag and classes in the same kind of parent. Text, move, duplicate and delete always change only this element.">' +
      '<span class="scope-l">Apply to</span><div class="seg">' +
      '<button data-act="scope" data-scope="one" class="' + (all ? '' : 'on') + '">This one</button>' +
      '<button data-act="scope" data-scope="all" class="' + (all ? 'on' : '') + '">' + (n + 1) + ' Similar</button></div></div>';
  };

  /* Canvas: outline the similar elements while edits apply to all of them */
  var box = document.createElement('div');
  box.id = 'similar';
  T.$('#ui').insertBefore(box, T.$('.ov.hover'));
  T.frameHooks.push(function () {
    var html = '';
    if (S.tool === 'select' && !S.drag && T.isMulti()) S.multi.forEach(function (o) {
      var r = o.getBoundingClientRect();
      if (r.width || r.height) html += '<div class="multiov" style="left:' + r.left + 'px;top:' + r.top + 'px;width:' + r.width + 'px;height:' + r.height + 'px"></div>';
    });
    else if (S.tool === 'select' && !S.drag && S.selected && S.scope !== 'one' && S.similar.length) {
      var vw = window.innerWidth, vh = window.innerHeight;
      S.similar.forEach(function (o) {
        if (!o.isConnected) return;
        var r = o.getBoundingClientRect();
        if (!r.width || !r.height || r.bottom < 0 || r.right < 0 || r.top > vh || r.left > vw) return;
        html += '<div class="simov" style="left:' + r.left + 'px;top:' + r.top + 'px;width:' + r.width + 'px;height:' + r.height + 'px"></div>';
      });
    }
    if (box._h !== html) { box.innerHTML = html; box._h = html; }
  });
})(window.DLTweakNS);
