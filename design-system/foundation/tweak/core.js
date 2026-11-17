/* Tweak mode — core: namespace, shared state, registries, small helpers */
(function (T) {
  'use strict';

  /* Shared editor state. Modules read and write T.s; nothing else is global. */
  T.s = {
    active: false,
    tool: 'select',       // 'select' | 'interact'
    selected: null,       // selected page element
    hovered: null,
    editing: null,        // text editing session
    altDown: false,       // ⌥ held → measure
    hotBox: null,         // 'pad' | 'mar' | 'gap' while hovering a field
    sidesOpen: false,     // { padding, margin }: 4 fields instead of 2 (sections.js)
    dockLeft: false,      // inspector side
    drag: null,           // drag session (element move or library insert)
    suppressClick: false
  };
  try { T.s.dockLeft = localStorage.getItem('dl-tweak-dock') === 'left'; } catch (e) { /* storage blocked */ }

  /* Actions: buttons in the UI carry data-act="name"; the click delegate in ui.js calls
     T.actions[name](button, event). Any module can register actions. */
  T.actions = {};
  T.action = function (name, fn) { T.actions[name] = fn; };

  /* Inspector sections: { id, order, when(el, ctx) → bool, render(el, ctx) → html, multi }.
     inspector.js renders every section whose when() is true, sorted by order. With several
     elements selected it needs when() true for all of them; multi: false hides it then. */
  T.sections = [];
  T.section = function (def) {
    T.sections = T.sections.filter(function (s) { return s.id !== def.id; });
    T.sections.push(def);
    T.sections.sort(function (a, b) { return a.order - b.order; });
  };

  /* Tiny event bus: 'change' (after any op), 'select', 'state' (file state) */
  var listeners = {};
  T.on = function (ev, fn) { (listeners[ev] = listeners[ev] || []).push(fn); };
  T.emit = function (ev, data) { (listeners[ev] || []).forEach(function (fn) { fn(data); }); };

  T.esc = function (s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
  T.px = function (v) { return Math.round(parseFloat(v) || 0); };
  T.store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } }
  };
})(window.DLTweakNS);
