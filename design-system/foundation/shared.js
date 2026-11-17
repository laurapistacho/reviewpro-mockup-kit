/* ReviewPro HTML mockup kit — shared behaviors (no build step, no dependencies).
   Everything is wired by event delegation from the DS markup, so pages write no handlers for it:
   selects, menus, dialogs, drawers, snackbars, tabs, accordions, tile expand, switches, toggle buttons,
   chips, table selection / sort / filter / pagination, form validation, side bar panels, tooltips.
   Declarative hooks on any element:
     data-rp-open="id"        open a dialog or drawer          data-rp-close         close the overlay it is in
     data-rp-menu="id"        open the menu with that id        data-rp-snackbar="…"  show a snackbar
     data-rp-validate="…"     check required fields, then show the snackbar "…" (and close the overlay)
   Public API: rpOpen(id) · rpClose(id) · rpSnackbar(message, variant) · rpRefreshTable(tableOrId). */
(function () {
  'use strict';
  var doc = document;
  function $$(sel, root) { return Array.prototype.slice.call((root || doc).querySelectorAll(sel)); }
  function closest(el, sel) { return el && el.nodeType === 1 ? el.closest(sel) : null; }
  function text(el) { return (el ? el.textContent : '').replace(/\s+/g, ' ').trim(); }
  function fire(el, name) { el.dispatchEvent(new Event(name, { bubbles: true })); }
  /* elements this script decorates at runtime (Tweak mode never saves these attributes) */
  function kb(el, attrs) { el._dlKb = true; Object.keys(attrs).forEach(function (k) { if (!el.hasAttribute(k)) el.setAttribute(k, attrs[k]); }); }

  /* ═══ SNACKBAR — rpSnackbar('Report scheduled'), rpSnackbar('Failed to save changes', 'error') ═══
     variants: confirmation (default) · info · warning · error. Position: data-rp-snackbar-position on <body>. */
  var SNACK_ICON = { confirmation: 'check', info: 'info', warning: 'warning', error: 'error' };
  function stack() {
    var s = doc.querySelector('.rp-snackbar-stack');
    if (!s) {
      s = doc.createElement('div');
      var pos = doc.body.getAttribute('data-rp-snackbar-position');
      s.className = 'rp-snackbar-stack' + (pos === 'center' || pos === 'right' ? ' rp-snackbar-stack-' + pos : '');
      s.setAttribute('data-dl-runtime', '');
      s.setAttribute('aria-live', 'polite');
      doc.body.appendChild(s);
    }
    return s;
  }
  function closeSnack(el) {
    if (!el || el._closing) return;
    el._closing = true;
    el.classList.add('rp-snackbar-leave');
    setTimeout(function () { el.remove(); }, 200);
  }
  window.rpSnackbar = function (message, variant, opts) {
    variant = SNACK_ICON[variant] ? variant : 'confirmation';
    opts = opts || {};
    var el = doc.createElement('div');
    el.className = 'rp-snackbar rp-snackbar-' + variant;
    el.setAttribute('role', variant === 'error' ? 'alert' : 'status');
    el.setAttribute('data-dl-runtime', '');
    el.innerHTML = '<span class="rp-icon rp-icon-' + SNACK_ICON[variant] + '"></span><span class="rp-snackbar-message"></span>' +
      (opts.action ? '<button type="button" class="rp-ghost-button rp-snackbar-action"></button>' : '') +
      '<button type="button" class="rp-icon-button rp-icon-button-size-small" aria-label="Close message"><span class="rp-icon rp-icon-close"></span></button>';
    el.querySelector('.rp-snackbar-message').textContent = message;
    if (opts.action) {
      var a = el.querySelector('.rp-snackbar-action');
      a.textContent = opts.action;
      a.onclick = function () { if (opts.onAction) opts.onAction(); closeSnack(el); };
    }
    el.querySelector('.rp-icon-button').onclick = function () { closeSnack(el); };
    stack().appendChild(el);
    setTimeout(function () { closeSnack(el); }, opts.duration || 5000);
    return el;
  };
  window.showToast = window.rpSnackbar; /* the Daylight kit name, so older prompts still work */

  /* ═══ OVERLAYS — dialogs and drawers. Hidden until .open; X ([data-rp-close]), backdrop and Escape close them ═══ */
  var OVERLAY = '.rp-dialog-overlay, .rp-drawer-overlay';
  var opened = [];
  function focusables(root) {
    return $$('a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])', root)
      .filter(function (e) { return e.offsetParent !== null || e === doc.activeElement; });
  }
  function overlayEl(id) {
    var o = typeof id === 'string' ? doc.getElementById(id) : id;
    if (!o) return null;
    return o.matches(OVERLAY) ? o : (o.closest(OVERLAY) || o.querySelector(OVERLAY) || o);
  }
  window.rpOpen = function (id, opener) {
    var o = overlayEl(id);
    if (!o) { console.warn('[rp] no dialog or drawer with id', id); return; }
    closeMenus();
    hideTip();
    o.classList.add('open');
    opened = opened.filter(function (x) { return x.o !== o; });
    opened.push({ o: o, f: opener || doc.activeElement });
    var box = o.querySelector('.rp-dialog, .rp-drawer') || o;
    if (!box.hasAttribute('role')) kb(box, { role: 'dialog', 'aria-modal': 'true' });
    var first = focusables(box).filter(function (e) { return !e.matches('[data-rp-close]'); })[0] || focusables(box)[0];
    setTimeout(function () { if (first) first.focus(); }, 0);
  };
  window.rpClose = function (id) {
    var o = id ? overlayEl(id) : (opened.length ? opened[opened.length - 1].o : null);
    if (!o) return;
    o.classList.remove('open');
    var rec = opened.filter(function (x) { return x.o === o; })[0];
    opened = opened.filter(function (x) { return x.o !== o; });
    if (rec && rec.f && rec.f.focus && doc.contains(rec.f)) rec.f.focus();
  };
  window.openModal = window.rpOpen; window.closeModal = window.rpClose; window.openPanel = window.rpOpen; window.closePanel = window.rpClose;
  function topOverlay() { for (var i = opened.length - 1; i >= 0; i--) if (opened[i].o.classList.contains('open')) return opened[i].o; return null; }

  /* ═══ MENUS — page menus (kebab, actions, top bar) open with data-rp-menu="id"; select menus live inside .rp-select ═══ */
  function closeMenus(except) {
    $$('.rp-menu.open').forEach(function (m) {
      if (except && (m === except || m.contains(except))) return;
      m.classList.remove('open');
      if (m._trigger) m._trigger.setAttribute('aria-expanded', 'false');
      var sel = closest(m, '.rp-select');
      if (sel) sel.classList.remove('open');
    });
  }
  function place(menu, trigger) {
    menu.classList.add('rp-menu-fixed');
    var r = trigger.getBoundingClientRect(), w = menu.offsetWidth, h = menu.offsetHeight;
    var left = menu.hasAttribute('data-rp-align-right') || r.left + w > window.innerWidth - 8 ? r.right - w : r.left;
    var top = r.bottom + 4;
    if (top + h > window.innerHeight - 8 && r.top - h - 4 > 8) top = r.top - h - 4;
    menu.style.left = Math.max(8, left) + 'px';
    menu.style.top = Math.max(8, top) + 'px';
  }
  function openMenu(menu, trigger, viaKeyboard) {
    closeMenus(menu);
    menu.classList.add('open');
    menu._trigger = trigger;
    trigger.setAttribute('aria-expanded', 'true');
    if (!closest(menu, '.rp-select')) place(menu, trigger);
    var search = menu.querySelector('input');
    if (search) { search.value = ''; filterMenu(menu, ''); setTimeout(function () { search.focus(); }, 0); }
    else if (viaKeyboard) { var it = items(menu)[0]; if (it) it.focus(); }
  }
  function items(menu) { return $$('.rp-menu-item', menu).filter(function (i) { return !i.disabled && !i.hidden && i.offsetParent !== null; }); }
  function filterMenu(menu, q) {
    q = q.trim().toLowerCase();
    $$('.rp-menu-item', menu).forEach(function (i) { i.hidden = !!q && text(i).toLowerCase().indexOf(q) < 0; });
  }
  window.openKebabMenu = function (e, btn) { var m = doc.getElementById(btn.getAttribute('data-rp-menu') || 'rowMenu'); if (m) openMenu(m, btn); if (e) e.stopPropagation(); };

  /* ═══ SELECT — single (default) or .rp-select-multiple; .rp-select-search filters the options ═══ */
  function selectValue(sel) {
    var val = sel.querySelector('.rp-select-value');
    if (!val) return;
    var chosen = $$('.rp-menu-item-selected', sel).map(function (i) { return i.getAttribute('data-rp-value') || text(i); });
    var all = $$('.rp-menu-item', sel).length;
    var ph = sel.getAttribute('data-rp-placeholder') || 'Select';
    var label = !chosen.length ? ph
      : sel.classList.contains('rp-select-multiple') && chosen.length === all && sel.hasAttribute('data-rp-all-text') ? sel.getAttribute('data-rp-all-text')
      : sel.classList.contains('rp-select-multiple') && chosen.length > 2 ? chosen.length + ' selected'
      : chosen.join(', ');
    val.textContent = label;
    val.classList.toggle('rp-select-placeholder', !chosen.length);
  }
  function pick(item) {
    var sel = closest(item, '.rp-select');
    if (!sel) return;
    var multiple = sel.classList.contains('rp-select-multiple');
    if (multiple) {
      item.classList.toggle('rp-menu-item-selected');
      item.setAttribute('aria-selected', item.classList.contains('rp-menu-item-selected'));
    } else {
      $$('.rp-menu-item', sel).forEach(function (i) { i.classList.toggle('rp-menu-item-selected', i === item); i.setAttribute('aria-selected', i === item); });
    }
    selectValue(sel);
    fire(sel, 'change');
    if (!multiple) { closeMenus(); var t = sel.querySelector('.rp-select-trigger'); if (t) t.focus(); }
  }
  window.rpSelectValues = function (sel) { return $$('.rp-menu-item-selected', sel).map(function (i) { return i.getAttribute('data-rp-value') || text(i); }); };

  /* ═══ TABLES — row selection + bulk bar, sort, filter (search + selects), pagination, empty state ═══ */
  function bodyRows(t) { return t && t.tBodies[0] ? $$(':scope > tr', t.tBodies[0]).filter(function (r) { return !r.classList.contains('rp-table-row-total') && !r.hasAttribute('data-rp-static'); }) : []; }
  function syncSelection(t) {
    var rows = bodyRows(t).filter(function (r) { return !r.hidden; });
    var boxes = rows.map(function (r) { return r.querySelector('td .rp-checkbox'); }).filter(Boolean);
    rows.forEach(function (r) { var c = r.querySelector('td .rp-checkbox'); if (c) r.classList.toggle('rp-table-row-selected', c.checked); });
    var n = boxes.filter(function (c) { return c.checked; }).length;
    var head = t.querySelector('thead .rp-checkbox');
    if (head) { head.checked = boxes.length > 0 && n === boxes.length; head.indeterminate = n > 0 && n < boxes.length; }
    var tile = closest(t, '.rp-tile');
    var bulk = (t.id && doc.querySelector('.rp-toolbar-bulk[data-rp-table="' + t.id + '"]')) || (tile && tile.querySelector('.rp-toolbar-bulk'));
    if (bulk) {
      bulk.classList.toggle('open', n > 0);
      var cnt = bulk.querySelector('.rp-toolbar-bulk-count');
      if (cnt) cnt.textContent = (cnt.getAttribute('data-rp-label') || '{n} selected').replace('{n}', n);
    }
  }
  function cellValue(row, idx) {
    var c = row.cells[idx];
    return c ? (c.getAttribute('data-rp-sort-value') || text(c)) : '';
  }
  function sortBy(th) {
    var t = closest(th, 'table'), idx = th.cellIndex;
    var dir = th.getAttribute('aria-sort') === 'ascending' ? 'descending' : 'ascending';
    $$('thead th', t).forEach(function (h) {
      h.classList.remove('rp-table-sorted'); h.removeAttribute('aria-sort');
      var ic = h.querySelector('.rp-table-sort .rp-icon');
      if (ic) { ic.classList.remove('rp-icon-arrow-up', 'rp-icon-arrow-down'); ic.classList.add('rp-icon-sort-by'); }
    });
    th.classList.add('rp-table-sorted');
    th.setAttribute('aria-sort', dir);
    var icon = th.querySelector('.rp-table-sort .rp-icon');
    if (icon) { icon.classList.remove('rp-icon-sort-by', 'rp-icon-arrow-up', 'rp-icon-arrow-down'); icon.classList.add(dir === 'ascending' ? 'rp-icon-arrow-up' : 'rp-icon-arrow-down'); }
    var rows = bodyRows(t), body = t.tBodies[0], totals = $$(':scope > tr.rp-table-row-total', body);
    var num = function (s) { var v = parseFloat(String(s).replace(/[^\d.,-]/g, '').replace(/,(?=\d{3}\b)/g, '').replace(',', '.')); return isNaN(v) ? null : v; };
    rows.sort(function (a, b) {
      var x = cellValue(a, idx), y = cellValue(b, idx), nx = num(x), ny = num(y);
      var r = nx !== null && ny !== null ? nx - ny : x.localeCompare(y, undefined, { numeric: true, sensitivity: 'base' });
      return dir === 'ascending' ? r : -r;
    });
    rows.forEach(function (r) { body.appendChild(r); });
    totals.forEach(function (r) { body.appendChild(r); });
    t._rpPage = 0;
    refreshTable(t);
  }
  function filtersFor(t) { return t.id ? $$('[data-rp-filter="' + t.id + '"]') : []; }
  function matches(row, t) {
    return filtersFor(t).every(function (f) {
      if (f.classList.contains('rp-select')) {
        var vals = window.rpSelectValues(f), col = parseInt(f.getAttribute('data-rp-filter-column'), 10);
        var any = f.getAttribute('data-rp-filter-all') || 'All';
        if (!vals.length || vals.indexOf(any) > -1) return true;
        var cell = isNaN(col) ? text(row) : cellValue(row, col);
        return vals.some(function (v) { return cell.toLowerCase().indexOf(v.toLowerCase()) > -1; });
      }
      var input = f.matches('input') ? f : f.querySelector('input');
      var q = input ? input.value.trim().toLowerCase() : '';
      return !q || text(row).toLowerCase().indexOf(q) > -1;
    });
  }
  function pagerFor(t) { return t.id ? doc.querySelector('.rp-table-pagination[data-rp-table="' + t.id + '"]') : null; }
  function perPage(pager) {
    var sel = pager && pager.querySelector('.rp-select');
    var v = sel ? parseInt(window.rpSelectValues(sel)[0], 10) : NaN;
    return isNaN(v) ? parseInt(pager && pager.getAttribute('data-rp-rows') || '10', 10) : v;
  }
  function refreshTable(t) {
    if (typeof t === 'string') t = doc.getElementById(t);
    if (!t) return;
    var rows = bodyRows(t), shown = rows.filter(function (r) { return matches(r, t); });
    var pager = pagerFor(t), size = pager ? perPage(pager) : shown.length || 1;
    var pages = Math.max(1, Math.ceil(shown.length / size));
    t._rpPage = Math.min(t._rpPage || 0, pages - 1);
    var from = t._rpPage * size;
    rows.forEach(function (r) { r.hidden = true; });
    shown.forEach(function (r, i) { r.hidden = !!pager && (i < from || i >= from + size); });
    if (pager) {
      var range = pager.querySelector('.rp-table-pagination-range');
      var total = pager.hasAttribute('data-rp-total') && !t._rpFiltered ? parseInt(pager.getAttribute('data-rp-total'), 10) : shown.length;
      if (range) range.textContent = shown.length ? (from + 1) + '-' + Math.min(from + size, shown.length) + ' of ' + Math.max(total, shown.length) : '0 of 0';
      var at = function (k, off) { var b = pager.querySelector('[data-rp-page="' + k + '"]'); if (b) b.disabled = off; };
      at('first', t._rpPage === 0); at('prev', t._rpPage === 0); at('next', t._rpPage >= pages - 1); at('last', t._rpPage >= pages - 1);
    }
    if (t.id) {
      $$('[data-rp-empty-for="' + t.id + '"]').forEach(function (p) { p.classList.toggle('rp-placeholder-show', shown.length === 0); });
      $$('[data-rp-count-for="' + t.id + '"]').forEach(function (c) {
        var lab = (shown.length === 1 && c.getAttribute('data-rp-label-one')) || c.getAttribute('data-rp-label') || '{n} results';
        c.textContent = lab.replace('{n}', shown.length);
      });
    }
    syncSelection(t);
  }
  window.rpRefreshTable = refreshTable;
  function refreshFiltered(f) {
    var t = doc.getElementById(f.getAttribute('data-rp-filter'));
    if (!t) return;
    t._rpPage = 0;
    t._rpFiltered = filtersFor(t).some(function (x) {
      if (x.classList.contains('rp-select')) { var v = window.rpSelectValues(x); return v.length && v.indexOf(x.getAttribute('data-rp-filter-all') || 'All') < 0; }
      var i = x.matches('input') ? x : x.querySelector('input'); return i && i.value.trim();
    });
    refreshTable(t);
  }
  /* reset every filter of a table: data-rp-clear-filters="tableId" */
  function clearFilters(id) {
    var t = doc.getElementById(id);
    if (!t) return;
    filtersFor(t).forEach(function (f) {
      if (f.classList.contains('rp-select')) {
        var all = f.getAttribute('data-rp-filter-all') || 'All';
        $$('.rp-menu-item', f).forEach(function (i) { var on = !f.classList.contains('rp-select-multiple') && text(i) === all; i.classList.toggle('rp-menu-item-selected', on); i.setAttribute('aria-selected', on); });
        selectValue(f);
      } else { var i = f.matches('input') ? f : f.querySelector('input'); if (i) i.value = ''; syncClear(f); }
    });
    t._rpPage = 0; t._rpFiltered = false;
    refreshTable(t);
  }
  function syncClear(search) {
    var root = closest(search, '.rp-search') || search, input = root.querySelector('input'), clear = root.querySelector('.rp-search-clear');
    if (clear && input) clear.hidden = !input.value;
  }

  /* ═══ FORM VALIDATION — data-rp-validate="Settings saved" on the save button ═══
     Required = a field whose label has .rp-field-label-required. Missing value → {root}-error + helper text. */
  var FIELD_ROOTS = ['rp-text-field', 'rp-select', 'rp-search', 'rp-text-area', 'rp-date-picker'];
  function fieldRoot(el) { return closest(el, '.' + FIELD_ROOTS.join(', .')); }
  function rootClass(f) { return FIELD_ROOTS.filter(function (c) { return f.classList.contains(c); })[0]; }
  function fieldEmpty(f) {
    if (f.classList.contains('rp-select')) return !f.querySelector('.rp-menu-item-selected');
    var i = f.querySelector('input, textarea');
    return i ? !i.value.trim() : false;
  }
  function setError(f, on) {
    var cls = rootClass(f) + '-error', helper = f.querySelector('.rp-field-helper');
    f.classList.toggle(cls, on);
    if (on) {
      var label = text(f.querySelector('.rp-field-label')).replace(/\s*\*$/, '');
      var msg = f.getAttribute('data-rp-required-text') || (label ? label + ' is required' : 'This field is required');
      if (!helper) { helper = doc.createElement('span'); helper.className = 'rp-field-helper'; helper.setAttribute('data-rp-runtime-helper', ''); f.appendChild(helper); }
      if (!helper.hasAttribute('data-rp-original')) helper.setAttribute('data-rp-original', helper.textContent);
      helper.textContent = msg;
    } else if (helper) {
      if (helper.hasAttribute('data-rp-runtime-helper')) helper.remove();
      else if (helper.hasAttribute('data-rp-original')) { helper.textContent = helper.getAttribute('data-rp-original'); helper.removeAttribute('data-rp-original'); }
    }
  }
  function validate(btn) {
    var scope = btn.matches('[data-rp-form]') ? btn : closest(btn, '[data-rp-form], .rp-dialog, .rp-drawer, form, .rp-tile') || doc.body;
    var bad = $$('.rp-field-label-required', scope).map(fieldRoot).filter(Boolean).filter(fieldEmpty);
    $$('.rp-field-label-required', scope).map(fieldRoot).filter(Boolean).forEach(function (f) { setError(f, bad.indexOf(f) > -1); });
    if (bad.length) {
      bad[0].scrollIntoView({ block: 'center', behavior: 'smooth' });
      var i = bad[0].querySelector('input, textarea, .rp-select-trigger'); if (i) setTimeout(function () { i.focus(); }, 250);
      return false;
    }
    var ov = btn.hasAttribute('data-rp-validate') && closest(btn, OVERLAY);
    if (ov) window.rpClose(ov);
    var msg = btn.getAttribute('data-rp-validate');
    if (msg) window.rpSnackbar(msg, btn.getAttribute('data-rp-snackbar-variant') || 'confirmation');
    return true;
  }
  window.rpValidate = validate;

  /* ═══ SIDE BAR — rail items open their section panel (aria-controls); sections without a panel in the page
     get the production section list (compositions/Navigation constants) as a runtime panel ═══ */
  var NAV = {
    reviews: ['Reviews', ['Dashboard', 'Results', 'Tracking', 'Competition', 'Management Response', 'Internal Ranking']],
    surveys: ['Surveys', ['Dashboard', 'Results', 'Results by Question', 'Responses', 'Management Response', 'Delivery', 'Behavior', 'Reports']],
    semantic: ['Semantic', ['Dashboard', 'Results', 'Results by Topics', 'Mentions', 'Competition']],
    cases: ['Cases', ['To Do', 'Inbox', 'Results']],
    messaging: ['Messaging', ['Conversations', 'Performance', 'Chatbot Results', 'Usage']],
    guests: ['Guests', ['Stays', 'Delivery', 'Profiles']],
    socialmedia: ['Social Media', ['Dashboard', 'Stream', 'Saved Searches']],
    revenue: ['Revenue Optimizer', ['Dashboard', 'Data Import']],
    manage: ['Manage', ['Alerts', 'Snapshot', 'Configuration', 'Reports', 'Goals', 'Usage']],
    livefaq: ['LiveFAQ', ['Establishment Profile', 'Knowledge Base']],
    settings: ['Settings', ['Your Profile', 'Organisation', 'Surveys', 'Case Management', 'Live FAQ', 'Messaging', 'Guests', 'Integrations', 'Legal']]
  };
  function panelFor(item) {
    var id = item.getAttribute('aria-controls'), p = id && doc.getElementById(id);
    if (p) return p;
    var key = item.getAttribute('data-rp-section'), nav = NAV[key];
    if (!nav) return null;
    p = doc.getElementById('rp-runtime-panel-' + key);
    if (!p) {
      var logo = doc.querySelector('.rp-side-bar-panel-logo');
      p = doc.createElement('aside');
      p.className = 'rp-side-bar-panel';
      p.id = 'rp-runtime-panel-' + key;
      p.setAttribute('data-dl-runtime', '');
      p.setAttribute('aria-label', nav[0] + ' pages');
      p.innerHTML = '<div class="rp-side-bar-panel-header"></div><ul class="rp-side-bar-panel-list">' +
        nav[1].map(function () { return '<li><a class="rp-side-bar-panel-item" href="#"></a></li>'; }).join('') + '</ul>' +
        (logo ? '<img class="rp-side-bar-panel-logo" alt="ReviewPro Reputation" src="' + logo.getAttribute('src') + '" />' : '');
      p.querySelector('.rp-side-bar-panel-header').textContent = nav[0];
      $$('.rp-side-bar-panel-item', p).forEach(function (a, i) { a.textContent = nav[1][i]; });
      var rail = closest(item, '.rp-side-bar');
      rail.parentNode.insertBefore(p, rail.nextSibling);
    }
    return p;
  }
  function toggleSection(item) {
    var p = panelFor(item);
    var rail = closest(item, '.rp-side-bar');
    if (!p) {
      if (item.tagName !== 'A') window.rpSnackbar(text(item) || item.getAttribute('aria-label') || 'Page', 'info');
      return;
    }
    var open = p.classList.contains('open');
    $$('.rp-side-bar-panel.open').forEach(function (x) { x.classList.remove('open'); });
    $$('.rp-side-bar-item', rail).forEach(function (i) { i.classList.remove('rp-side-bar-item-active'); i.setAttribute('aria-expanded', 'false'); });
    if (!open) { p.classList.add('open'); item.classList.add('rp-side-bar-item-active'); item.setAttribute('aria-expanded', 'true'); }
    else { var cur = rail.querySelector('[data-rp-current]'); if (cur) cur.classList.add('rp-side-bar-item-active'); }
  }
  /* the panel is a flyout, closed on page load (Sidebar.mdx, QA): choosing a page, a click outside it or Escape closes it */
  function closeSections() {
    var open = $$('.rp-side-bar-panel.open');
    if (!open.length) return false;
    open.forEach(function (x) { x.classList.remove('open'); });
    $$('.rp-side-bar').forEach(function (rail) {
      $$('.rp-side-bar-item', rail).forEach(function (i) { i.classList.remove('rp-side-bar-item-active'); if (i.hasAttribute('aria-expanded')) i.setAttribute('aria-expanded', 'false'); });
      var cur = rail.querySelector('[data-rp-current]'); if (cur) cur.classList.add('rp-side-bar-item-active');
    });
    return true;
  }
  doc.addEventListener('click', function (e) {
    var t = e.target;
    if (!doc.querySelector('.rp-side-bar-panel.open') || closest(t, '#dl-tweak-host') || doc.documentElement.classList.contains('dl-tweaking')) return;
    if (closest(t, '.rp-side-bar-panel-item') || (!closest(t, '.rp-side-bar') && !closest(t, '.rp-side-bar-panel'))) closeSections();
  }, true);

  /* ═══ TOOLTIP — data-rp-tooltip="Text" (data-rp-tooltip-placement: top | right | bottom | left) ═══ */
  var tip = null, tipFor = null;
  function showTip(el) {
    var msg = el.getAttribute('data-rp-tooltip');
    if (!msg) return;
    if (!tip) { tip = doc.createElement('div'); tip.className = 'rp-tooltip'; tip.setAttribute('role', 'tooltip'); tip.setAttribute('data-dl-runtime', ''); doc.body.appendChild(tip); }
    tip.textContent = msg;
    tip.hidden = false;
    tipFor = el;
    var r = el.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight, pl = el.getAttribute('data-rp-tooltip-placement') || 'top';
    var x = r.left + r.width / 2 - w / 2, y = r.top - h - 4;
    if (pl === 'right') { x = r.right + 4; y = r.top + r.height / 2 - h / 2; }
    else if (pl === 'left') { x = r.left - w - 4; y = r.top + r.height / 2 - h / 2; }
    else if (pl === 'bottom' || y < 8) { y = r.bottom + 4; }
    tip.style.left = Math.max(8, Math.min(x, window.innerWidth - w - 8)) + 'px';
    tip.style.top = Math.max(8, y) + 'px';
  }
  function hideTip() { if (tip) tip.hidden = true; tipFor = null; }
  doc.addEventListener('mouseover', function (e) { var el = closest(e.target, '[data-rp-tooltip]'); if (el && el !== tipFor) showTip(el); else if (!el && tipFor) hideTip(); });
  doc.addEventListener('focusin', function (e) { var el = closest(e.target, '[data-rp-tooltip]'); if (el) showTip(el); });
  doc.addEventListener('focusout', hideTip);
  window.addEventListener('scroll', function () { hideTip(); $$('.rp-menu.open.rp-menu-fixed').forEach(function (m) { if (m._trigger) place(m, m._trigger); }); }, true);

  /* ═══ CLICK DELEGATION ═══ */
  doc.addEventListener('click', function (e) {
    if (closest(e.target, '#dl-tweak-host')) return;
    var t = e.target, el;
    /* overlays: backdrop click closes */
    if (t.matches && t.matches(OVERLAY) && t.classList.contains('open') && !t.hasAttribute('data-rp-static')) { window.rpClose(t); return; }
    if ((el = closest(t, '[data-rp-close]'))) { var cid = el.getAttribute('data-rp-close'); window.rpClose(cid || closest(el, OVERLAY)); return; }
    /* select */
    if ((el = closest(t, '.rp-select-trigger'))) {
      var sel = closest(el, '.rp-select'), menu = sel && sel.querySelector('.rp-menu');
      if (!menu || sel.classList.contains('rp-select-disabled')) return;
      if (sel.classList.contains('open')) closeMenus(); else { sel.classList.add('open'); openMenu(menu, el, e.detail === 0); }
      return;
    }
    if ((el = closest(t, '.rp-select .rp-menu-item'))) { pick(el); return; }
    if (closest(t, '.rp-select .rp-menu')) return;
    /* menu triggers */
    if ((el = closest(t, '[data-rp-menu]'))) {
      var m = doc.getElementById(el.getAttribute('data-rp-menu'));
      if (m) { if (m.classList.contains('open') && m._trigger === el) closeMenus(); else openMenu(m, el, e.detail === 0); }
      e.preventDefault();
      return;
    }
    if ((el = closest(t, '.rp-menu .rp-menu-item'))) {
      var menuEl = closest(el, '.rp-menu'), trig = menuEl._trigger;
      if (menuEl.hasAttribute('data-rp-selectable')) {
        $$('.rp-menu-item', menuEl).forEach(function (i) { i.classList.toggle('rp-menu-item-selected', i === el); });
        var lab = trig && trig.querySelector('[data-rp-menu-label]');
        if (lab) lab.textContent = el.getAttribute('data-rp-value') || text(el);
      }
      if (!el.hasAttribute('data-rp-keep-open')) closeMenus();
      /* fall through: the item may also carry data-rp-open / data-rp-snackbar / href */
    } else if (!closest(t, '.rp-menu')) closeMenus();
    if ((el = closest(t, '[data-rp-open]'))) { e.preventDefault(); window.rpOpen(el.getAttribute('data-rp-open'), el); }
    if ((el = closest(t, '[data-rp-validate]'))) { e.preventDefault(); validate(el); return; }
    if ((el = closest(t, '[data-rp-snackbar]'))) { if (el.getAttribute('href') === '#') e.preventDefault(); window.rpSnackbar(el.getAttribute('data-rp-snackbar'), el.getAttribute('data-rp-snackbar-variant')); }
    if ((el = closest(t, '[data-rp-clear-filters]'))) { clearFilters(el.getAttribute('data-rp-clear-filters')); }
    /* switch */
    if ((el = closest(t, '.rp-switch'))) {
      if (el.disabled || el.classList.contains('rp-switch-disabled')) return;
      if (el.tagName === 'LABEL') return;
      var on = !el.classList.contains('rp-switch-checked');
      el.classList.toggle('rp-switch-checked', on);
      el.setAttribute('aria-checked', on);
      fire(el, 'change');
      return;
    }
    /* toggle buttons */
    if ((el = closest(t, '.rp-toggle-button'))) {
      var grp = closest(el, '.rp-toggle-button-group');
      if (grp && !grp.hasAttribute('data-rp-multiple')) $$('.rp-toggle-button', grp).forEach(function (b) { b.classList.toggle('rp-toggle-button-selected', b === el); b.setAttribute('aria-pressed', b === el); });
      else { el.classList.toggle('rp-toggle-button-selected'); el.setAttribute('aria-pressed', el.classList.contains('rp-toggle-button-selected')); }
      fire(el, 'change');
    }
    /* tabs */
    if ((el = closest(t, '.rp-tab'))) {
      if (el.disabled || el.classList.contains('rp-tab-disabled')) return;
      var href = el.getAttribute('href');
      if (href && href !== '#') return;
      e.preventDefault();
      selectTab(el);
    }
    /* accordion */
    if ((el = closest(t, '.rp-accordion-summary'))) {
      var acc = closest(el, '.rp-accordion');
      if (acc.classList.contains('rp-accordion-disabled')) return;
      acc.classList.toggle('rp-accordion-expanded');
      el.setAttribute('aria-expanded', acc.classList.contains('rp-accordion-expanded'));
    }
    /* tile expand */
    if ((el = closest(t, '.rp-tile-expand'))) {
      var tile = closest(el, '.rp-tile'), exp = !tile.classList.contains('rp-tile-expanded');
      tile.classList.toggle('rp-tile-expanded', exp);
      el.setAttribute('aria-expanded', exp);
      var l = el.querySelector('.rp-tile-expand-label');
      if (l && el.hasAttribute('data-rp-label-expanded')) {
        if (!el.hasAttribute('data-rp-label-collapsed')) el.setAttribute('data-rp-label-collapsed', l.textContent);
        l.textContent = exp ? el.getAttribute('data-rp-label-expanded') : el.getAttribute('data-rp-label-collapsed');
      }
    }
    /* chips */
    if ((el = closest(t, '.rp-chip-delete'))) { var chip = closest(el, '.rp-chip'), box = chip.parentNode; chip.remove(); fire(box, 'change'); return; }
    /* table */
    if ((el = closest(t, '.rp-table-sort'))) { sortBy(closest(el, 'th')); return; }
    if ((el = closest(t, '.rp-table-pagination [data-rp-page]'))) {
      var pg = closest(el, '.rp-table-pagination'), tb = doc.getElementById(pg.getAttribute('data-rp-table'));
      if (!tb) return;
      var shownRows = bodyRows(tb).filter(function (r) { return matches(r, tb); }).length, size = perPage(pg), last = Math.max(0, Math.ceil(shownRows / size) - 1);
      var k = el.getAttribute('data-rp-page');
      tb._rpPage = k === 'first' ? 0 : k === 'last' ? last : k === 'prev' ? Math.max(0, (tb._rpPage || 0) - 1) : Math.min(last, (tb._rpPage || 0) + 1);
      refreshTable(tb);
      return;
    }
    if ((el = closest(t, '.rp-search-clear'))) { var root = closest(el, '.rp-search'), inp = root.querySelector('input'); inp.value = ''; fire(inp, 'input'); inp.focus(); return; }
    /* side bar */
    if ((el = closest(t, '.rp-side-bar-item'))) {
      if (el.tagName === 'A' && el.getAttribute('href') && el.getAttribute('href') !== '#' && !el.hasAttribute('aria-controls')) return;
      e.preventDefault();
      toggleSection(el);
    }
    /* links that go nowhere in a mockup */
    if ((el = closest(t, 'a[href="#"]')) && !el.hasAttribute('data-rp-snackbar') && !el.hasAttribute('data-rp-open')) e.preventDefault();
  });

  function selectTab(tab) {
    var list = closest(tab, '.rp-tabs');
    $$('.rp-tab', list).forEach(function (x) {
      var on = x === tab;
      x.classList.toggle('rp-tab-selected', on);
      x.setAttribute('aria-selected', on);
      var pid = x.getAttribute('aria-controls'), p = pid && doc.getElementById(pid);
      if (p) p.hidden = !on;
    });
    fire(tab, 'change');
  }

  /* ═══ CHANGE / INPUT — selection checkboxes, filters, counters ═══ */
  doc.addEventListener('change', function (e) {
    var t = e.target;
    if (t.matches && t.matches('.rp-table .rp-checkbox')) {
      var table = closest(t, 'table');
      if (closest(t, 'thead')) bodyRows(table).filter(function (r) { return !r.hidden; }).forEach(function (r) { var c = r.querySelector('td .rp-checkbox'); if (c && !c.disabled) c.checked = t.checked; });
      syncSelection(table);
    }
    if (t.matches && t.matches('.rp-select[data-rp-filter]')) refreshFiltered(t);
    if (t.matches && t.matches('.rp-table-pagination .rp-select')) { var tb = doc.getElementById(closest(t, '.rp-table-pagination').getAttribute('data-rp-table')); if (tb) { tb._rpPage = 0; refreshTable(tb); } }
    var f = fieldRoot(t);
    if (f && !fieldEmpty(f)) setError(f, false);
  });
  doc.addEventListener('input', function (e) {
    var t = e.target, f;
    if ((f = closest(t, '[data-rp-filter]')) && !f.classList.contains('rp-select')) { syncClear(f); refreshFiltered(f); }
    else if (closest(t, '.rp-search')) syncClear(closest(t, '.rp-search'));
    if (closest(t, '.rp-menu') && t.matches('input')) filterMenu(closest(t, '.rp-menu'), t.value);
    var ta = closest(t, '.rp-text-area[data-rp-max]');
    if (ta) { var c = ta.querySelector('.rp-text-area-count'); if (c) c.textContent = t.value.length + '/' + ta.getAttribute('data-rp-max'); }
    if ((f = fieldRoot(t)) && !fieldEmpty(f)) setError(f, false);
  });

  /* ═══ KEYBOARD ═══ */
  doc.addEventListener('keydown', function (e) {
    if (closest(e.target, '#dl-tweak-host') || doc.documentElement.classList.contains('dl-tweaking')) return;
    var openMenu_ = doc.querySelector('.rp-menu.open');
    if (e.key === 'Escape') {
      if (openMenu_) { var tr = openMenu_._trigger; closeMenus(); if (tr) tr.focus(); e.preventDefault(); return; }
      if (tipFor) { var railTip = closest(tipFor, '.rp-side-bar'); hideTip(); if (railTip) closeSections(); return; }
      var top = topOverlay();
      if (top && !top.hasAttribute('data-rp-static')) { window.rpClose(top); e.preventDefault(); return; }
      if (!top && closeSections()) e.preventDefault();
      return;
    }
    if (openMenu_ && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      var list = items(openMenu_), i = list.indexOf(doc.activeElement);
      i = e.key === 'ArrowDown' ? (i + 1) % list.length : (i <= 0 ? list.length - 1 : i - 1);
      if (list[i]) list[i].focus();
      e.preventDefault();
      return;
    }
    if (openMenu_ && e.key === 'Tab') closeMenus();
    var tab = closest(e.target, '.rp-tab');
    if (tab && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
      var tabs = $$('.rp-tab', closest(tab, '.rp-tabs')).filter(function (x) { return !x.disabled; }), j = tabs.indexOf(tab);
      var next = tabs[(j + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
      next.focus(); if (!next.getAttribute('href') || next.getAttribute('href') === '#') selectTab(next);
      e.preventDefault();
      return;
    }
    if (e.key === 'Tab') {
      var o = topOverlay();
      if (!o) return;
      var box = o.querySelector('.rp-dialog, .rp-drawer') || o, f = focusables(box);
      if (!f.length) return;
      if (e.shiftKey && doc.activeElement === f[0]) { f[f.length - 1].focus(); e.preventDefault(); }
      else if (!e.shiftKey && doc.activeElement === f[f.length - 1]) { f[0].focus(); e.preventDefault(); }
      else if (!box.contains(doc.activeElement)) { f[0].focus(); e.preventDefault(); }
    }
  });

  /* ═══ INIT ═══ */
  function init() {
    $$('.rp-select').forEach(function (s) { if (s.querySelector('.rp-menu-item-selected')) selectValue(s); });
    $$('table.rp-table').forEach(function (t) { if (pagerFor(t) || filtersFor(t).length || t.querySelector('.rp-checkbox')) refreshTable(t); });
    $$('.rp-search').forEach(syncClear);
    $$('.rp-tabs').forEach(function (list) {
      var sel = list.querySelector('.rp-tab-selected');
      $$('.rp-tab', list).forEach(function (x) { var pid = x.getAttribute('aria-controls'), p = pid && doc.getElementById(pid); if (p) p.hidden = x !== sel; });
    });
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init); else init();
})();

/* ═══ TWEAK MODE (loader) ═══ */
/* The Edit button (bottom left, on pages opened from this computer), #edit in the URL or
   Alt+Shift+E opens the visual editor (Tweak mode; #tweak and Alt+Shift+T still work). It lives in ONE place, the kit
   (design-system/foundation/tweak/), and is not copied into mockups: a mockup inside the kit
   finds it at ../../design-system/foundation/tweak/. Copied out of the kit (Figma Make, zip)
   a mockup simply has no editor. Source: tweak/README.md. */
(function() {
  var me = document.querySelector('script[src$="shared.js"]');
  var src = me ? me.getAttribute('src') : 'shared.js';
  var tries = [src.replace(/shared\.js$/, 'tweak/boot.js'),
    '../../design-system/foundation/tweak/boot.js', '../../../design-system/foundation/tweak/boot.js', '../design-system/foundation/tweak/boot.js']
    .filter(function(v, i, a) { return a.indexOf(v) === i; });
  var loading = false;
  function load() {
    if (window.DLTweak) { window.DLTweak.toggle(); return; }
    if (loading) return;
    loading = true;
    (function attempt(i) {
      if (i >= tries.length) {
        loading = false;
        if (typeof rpSnackbar === 'function') rpSnackbar('Tweak mode runs from the mockup kit. Open this mockup from the kit folder (mockups/…).', 'info');
        return;
      }
      var s = document.createElement('script');
      s.src = tries[i] + '?v=' + Date.now(); /* a kit update must not run a cached editor */
      s.onload = function() { loading = false; };
      s.onerror = function() { s.remove(); attempt(i + 1); };
      document.body.appendChild(s);
    })(0);
  }
  function fromHash() { if (/^#(edit|tweak)$/.test(location.hash) && !(window.DLTweak && document.getElementById('dl-tweak-host'))) load(); }
  window.addEventListener('hashchange', fromHash);
  document.addEventListener('keydown', function(e) {
    if (e.altKey && e.shiftKey && (e.code === 'KeyE' || e.code === 'KeyT')) { e.preventDefault(); load(); }
  });
  /* the Edit button: only where the editor can save (this computer: file://, localhost), never
     inside a frame (DS showcase, Figma Make) or on paper; hidden while the editor is open */
  var local = location.protocol === 'file:' || /^(localhost|127\.\d+\.\d+\.\d+|\[::1\])$/.test(location.hostname);
  var framed = false; try { framed = window.top !== window; } catch (e) { framed = true; }
  function editButton() {
    if (!local || framed || document.getElementById('dlEditButton')) return;
    var b = document.createElement('button');
    b.id = 'dlEditButton'; b.type = 'button'; b.setAttribute('data-dl-runtime', '');
    b.title = 'Edit this page: change layout, spacing, text and components, comment for Kiro (Alt+Shift+E)';
    b.innerHTML = '<span class="rp-icon rp-icon-size-16 rp-icon-edit" style="color:inherit"></span>Edit';
    b.style.cssText = 'position:fixed;left:16px;bottom:16px;z-index:1650;display:flex;align-items:center;gap:6px;height:28px;padding:0 12px;border:1px solid var(--neutral-30);border-radius:14px;background:var(--background-paper);color:var(--text-primary);font:600 12px var(--font-family);box-shadow:0 2px 8px rgba(0,0,0,.12);cursor:pointer;opacity:.75';
    b.onmouseenter = function() { b.style.opacity = '1'; }; b.onmouseleave = function() { b.style.opacity = '.75'; };
    b.onclick = function(e) { e.stopPropagation(); load(); };
    document.body.appendChild(b);
    var st = document.createElement('style'); st.setAttribute('data-dl-runtime', '');
    /* above the items pinned to the bottom of the rail (rp-side-bar-spacer), and above a snackbar */
    st.textContent = '@media print { #dlEditButton { display: none !important } } html.dl-tweaking #dlEditButton, html:has(#dl-tweak-host) #dlEditButton { display: none !important } body:has(.rp-side-bar-spacer) #dlEditButton { bottom: 64px !important } body:has(.rp-snackbar) #dlEditButton { bottom: 88px !important }';
    document.head.appendChild(st);
  }
  function ready() { fromHash(); editButton(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready); else ready();
})();
