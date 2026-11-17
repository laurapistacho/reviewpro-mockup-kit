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
  function parentMenu(el) { return el && el.parentElement ? closest(el.parentElement, '.rp-menu') : null; }
  function innerMenu() { var o = $$('.rp-menu.open'); return o.filter(function (m) { return !o.some(function (x) { return x !== m && m.contains(x); }); }).pop() || null; }
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
    var search = menu.querySelector('input[type="search"], [data-rp-autofocus]');
    if (search) { search.value = ''; filterMenu(menu, ''); setTimeout(function () { search.focus(); }, 0); }
    else if (viaKeyboard) { var it = items(menu)[0]; if (it) it.focus(); }
  }
  function items(menu) { return $$('.rp-menu-item', menu).filter(function (i) { return !i.disabled && !i.hidden && i.offsetParent !== null; }); }
  function filterMenu(menu, q) {
    q = q.trim().toLowerCase();
    $$('.rp-menu-item', menu).forEach(function (i) { i.hidden = !!q && text(i).toLowerCase().indexOf(q) < 0; });
    $$('.rp-list-subheader, .rp-menu-group-label', menu).forEach(function (h) {
      var n = h.nextElementSibling, any = false;
      while (n && !n.matches('.rp-list-subheader, .rp-menu-group-label')) { if (n.matches('.rp-menu-item') && !n.hidden) any = true; n = n.nextElementSibling; }
      h.hidden = !any;
    });
    $$('[data-rp-menu-empty]', menu).forEach(function (e) { e.hidden = $$('.rp-menu-item', e.parentElement).some(function (i) { return !i.hidden; }); });
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
    if (!multiple) { closeMenus(parentMenu(sel)); var t = sel.querySelector('.rp-select-trigger'); if (t) t.focus(); }
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
  /* Figma UI App › Navigation › SideNav/Desktop (one panel per section). "*" = New chip, "—" = divider.
     Social Media and LiveFAQ are not in the Figma rail; they stay for accounts that have them. */
  var NAV = {
    dashboard: ['Dynamic Dashboard', ['My dashboards*']],
    home: ['My Page', ['My page']],
    reviews: ['Reviews', ['Dashboard', 'Results', 'Tracking', 'Competition', 'Brand Competition', 'Management Response']],
    surveys: ['Surveys', ['Dashboard', 'Results', 'Results by Question', 'Responses', 'Management Response', 'Delivery', 'Behavior', 'Reports']],
    semantic: ['Semantic', ['Dashboard', 'Results', 'Results Topics', 'Mentions', 'Competition', 'Brand Competition']],
    cases: ['Cases', ['To Do', 'Inbox', 'Results']],
    messaging: ['Messaging', ['Conversations*', 'Performance', 'Chatbot Performance', 'Chatbot Conversion', 'Usage']],
    guests: ['Guests', ['Stays', 'Delivery', 'Profiles*', 'Activities*']],
    revenue: ['Revenue Optimizer*', ['Dashboard', 'Data Import']],
    analytics: ['Analytics', ['My analytics']],
    manage: ['Manage', ['Alerts', 'Warnings', 'Configuration', 'Reports', 'Goals', 'Usage']],
    settings: ['Settings', ['All Settings', '—', 'Your Profile', 'Account Administration', 'Organisation', 'Surveys', 'Case Management', 'Live FAQ', 'Messaging', 'Guests', 'Integrations', 'Legal & Privacy']],
    socialmedia: ['Social Media', ['Dashboard', 'Stream', 'Saved Searches']],
    livefaq: ['LiveFAQ', ['Establishment Profile', 'Knowledge Base']]
  };
  var NEW_CHIP = '<span class="rp-chip rp-chip-size-small rp-chip-brand rp-chip-squared">New</span>';
  function navLabel(s) { return s.replace(/\*$/, ''); }
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
      p.innerHTML = '<div class="rp-side-bar-panel-header"><span></span>' + (/\*$/.test(nav[0]) ? NEW_CHIP : '') + '</div><ul class="rp-side-bar-panel-list">' +
        nav[1].map(function (it) {
          return it === '—' ? '<li class="rp-side-bar-panel-divider" role="separator"></li>'
            : '<li><a class="rp-side-bar-panel-item" href="#"><span></span>' + (/\*$/.test(it) ? NEW_CHIP : '') + '</a></li>';
        }).join('') + '</ul>' +
        (logo ? '<img class="rp-side-bar-panel-logo" alt="ReviewPro Reputation" src="' + logo.getAttribute('src') + '" />' : '');
      p.querySelector('.rp-side-bar-panel-header > span').textContent = navLabel(nav[0]);
      var labels = nav[1].filter(function (it) { return it !== '—'; });
      $$('.rp-side-bar-panel-item > span:first-child', p).forEach(function (s, i) { s.textContent = navLabel(labels[i]); });
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
    if (!open) { p.classList.add('open'); item.classList.add('rp-side-bar-item-active'); item.setAttribute('aria-expanded', 'true'); pins(p); railExpanded(rail, false, true); }
    else { var cur = rail.querySelector('[data-rp-current]'); if (cur) cur.classList.add('rp-side-bar-item-active'); railExpanded(rail, null); }
  }
  /* expanded rail (SidebarNav isExpanded): the edge handle toggles it; it folds while a section panel is open */
  function railExpanded(rail, on, temporary) {
    if (!rail) return;
    if (on === null) on = !!rail._rpExpanded;
    else if (!temporary) rail._rpExpanded = on;
    rail.classList.toggle('rp-side-bar-expanded', on);
    var h = rail.querySelector('.rp-side-bar-toggle');
    if (h) { var l = on ? 'Collapse navigation' : 'Expand navigation'; h.setAttribute('aria-label', l); h.setAttribute('data-rp-tooltip', l); h.setAttribute('aria-expanded', on); }
  }
  function decorateRail(rail) {
    if (rail._rpDecorated) return;
    rail._rpDecorated = true;
    var h = doc.createElement('button');
    h.type = 'button'; h.className = 'rp-side-bar-toggle'; h.setAttribute('data-dl-runtime', ''); h.setAttribute('data-rp-tooltip-placement', 'right');
    rail.appendChild(h);
    $$('.rp-side-bar-item', rail).forEach(function (i) {
      var label = i.getAttribute('aria-label') || '';
      if (label && !i.querySelector('.rp-side-bar-item-label')) {
        var s = doc.createElement('span'); s.className = 'rp-side-bar-item-label'; s.setAttribute('data-dl-runtime', ''); s.textContent = label; i.appendChild(s);
      }
      if (i.querySelector('.rp-badge-dot') && !i.querySelector('.rp-side-bar-item-chip')) {
        var c = doc.createElement('span'); c.className = 'rp-side-bar-item-chip rp-chip rp-chip-size-small rp-chip-brand rp-chip-squared'; c.setAttribute('data-dl-runtime', ''); c.textContent = 'New'; i.appendChild(c);
      }
    });
    railExpanded(rail, false);
  }
  /* pin = set the page as your default (SidebarNav panel items, shown on hover; the pinned one stays visible) */
  function pins(panel) {
    $$('.rp-side-bar-panel-item', panel).forEach(function (it) {
      if (it.querySelector('.rp-side-bar-panel-pin') || it.classList.contains('rp-side-bar-panel-divider')) return;
      var box = it.querySelector('.rp-side-bar-panel-actions');
      if (!box) { box = doc.createElement('span'); box.className = 'rp-side-bar-panel-actions'; box.setAttribute('data-dl-runtime', ''); it.appendChild(box); }
      $$('.rp-chip', it).forEach(function (c) { if (c.parentNode === it) box.appendChild(c); });
      var b = doc.createElement('button');
      b.type = 'button'; b.className = 'rp-side-bar-panel-pin'; b.setAttribute('data-dl-runtime', ''); b.setAttribute('aria-pressed', 'false');
      b.setAttribute('aria-label', 'Set as default'); b.setAttribute('data-rp-tooltip', 'Set as default'); b.setAttribute('data-rp-tooltip-placement', 'right');
      b.innerHTML = '<span class="rp-icon rp-icon-pin"></span>';
      box.appendChild(b);
    });
  }
  doc.addEventListener('click', function (e) {
    var b = closest(e.target, '.rp-side-bar-panel-pin, .rp-side-bar-toggle');
    if (!b || closest(e.target, '#dl-tweak-host')) return;
    e.preventDefault(); e.stopPropagation(); hideTip();
    if (b.classList.contains('rp-side-bar-toggle')) { var rail = closest(b, '.rp-side-bar'); closeSections(); railExpanded(rail, !rail._rpExpanded); return; }
    var on = b.getAttribute('aria-pressed') !== 'true';
    $$('.rp-side-bar-panel-pin').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); x.setAttribute('aria-label', 'Set as default'); x.setAttribute('data-rp-tooltip', 'Set as default'); });
    if (on) { b.setAttribute('aria-pressed', 'true'); b.setAttribute('aria-label', 'Remove default'); b.setAttribute('data-rp-tooltip', 'Remove default'); }
    window.rpSnackbar(on ? text(closest(b, '.rp-side-bar-panel-item')) + ' is now your default page' : 'Default page removed', 'info');
  }, true);
  /* the panel is a flyout, closed on page load (Sidebar.mdx, QA): choosing a page, a click outside it or Escape closes it */
  function closeSections() {
    var open = $$('.rp-side-bar-panel.open');
    if (!open.length) return false;
    open.forEach(function (x) { x.classList.remove('open'); });
    $$('.rp-side-bar').forEach(function (rail) {
      $$('.rp-side-bar-item', rail).forEach(function (i) { i.classList.remove('rp-side-bar-item-active'); if (i.hasAttribute('aria-expanded')) i.setAttribute('aria-expanded', 'false'); });
      var cur = rail.querySelector('[data-rp-current]'); if (cur) cur.classList.add('rp-side-bar-item-active');
      railExpanded(rail, null);
    });
    return true;
  }
  doc.addEventListener('click', function (e) {
    var t = e.target;
    if (!doc.querySelector('.rp-side-bar-panel.open') || closest(t, '#dl-tweak-host') || doc.documentElement.classList.contains('dl-tweaking')) return;
    if (closest(t, '.rp-side-bar-panel-pin')) return;
    if (closest(t, '.rp-side-bar-panel-item') || (!closest(t, '.rp-side-bar') && !closest(t, '.rp-side-bar-panel'))) closeSections();
  }, true);

  /* ═══ TOOLTIP — data-rp-tooltip="Text" (data-rp-tooltip-placement: top | right | bottom | left) ═══ */
  var tip = null, tipFor = null;
  function showTip(el) {
    var msg = el.getAttribute('data-rp-tooltip');
    if (!msg || (el.classList.contains('rp-side-bar-item') && closest(el, '.rp-side-bar-expanded'))) return;
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
      if (sel.classList.contains('open')) closeMenus(parentMenu(sel)); else { sel.classList.add('open'); openMenu(menu, el, e.detail === 0); }
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
    if ((el = closest(t, '.rp-side-bar-item')) && !el.classList.contains('rp-side-bar-knowledge-hub')) {
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
    if (closest(t, '.rp-menu') && t.matches('input[type="search"], .rp-select-search input')) filterMenu(closest(t, '.rp-menu'), t.value);
    var ta = closest(t, '.rp-text-area[data-rp-max]');
    if (ta) { var c = ta.querySelector('.rp-text-area-count'); if (c) c.textContent = t.value.length + '/' + ta.getAttribute('data-rp-max'); }
    if ((f = fieldRoot(t)) && !fieldEmpty(f)) setError(f, false);
  });

  /* ═══ KEYBOARD ═══ */
  doc.addEventListener('keydown', function (e) {
    if (closest(e.target, '#dl-tweak-host') || doc.documentElement.classList.contains('dl-tweaking')) return;
    var openMenu_ = innerMenu(), inPopover = !!closest(e.target, '.rp-popover');
    if (e.key === 'Escape') {
      if (openMenu_) { var tr = openMenu_._trigger; closeMenus(parentMenu(openMenu_)); if (tr) tr.focus(); e.preventDefault(); return; }
      if (tipFor) { var railTip = closest(tipFor, '.rp-side-bar'); hideTip(); if (railTip) closeSections(); return; }
      var top = topOverlay();
      if (top && !top.hasAttribute('data-rp-static')) { window.rpClose(top); e.preventDefault(); return; }
      if (!top && closeSections()) e.preventDefault();
      return;
    }
    if (openMenu_ && (e.key === 'Enter' || e.key === ' ') && e.target.matches('div.rp-menu-item')) { e.target.click(); e.preventDefault(); return; }
    if (openMenu_ && (e.key === 'ArrowDown' || e.key === 'ArrowUp') && !(inPopover && e.target.matches('input:not([type="search"])')) && !closest(e.target, '.rp-select:not(.open)')) {
      var list = items(openMenu_), i = list.indexOf(doc.activeElement);
      i = e.key === 'ArrowDown' ? (i + 1) % list.length : (i <= 0 ? list.length - 1 : i - 1);
      if (list[i]) list[i].focus();
      e.preventDefault();
      return;
    }
    if (openMenu_ && e.key === 'Tab' && !closest(openMenu_, '.rp-popover') && !inPopover) closeMenus();
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

  /* ═══ TOP BAR — the production overlays: establishment selector (ProductNavigatorNext), date period (DateGroupComparison),
     All Messages (ui-gmh-engine UnreadRoster), help, app launcher (AppLauncher), account menu (MainBarNext) and About.
     Controls carry data-rp-top-bar="establishment | date | notifications | help | apps | account". shared.js builds each overlay
     once with the kit's sample data (runtime, Tweak never saves it); a page that ships an element with the same id keeps its own:
     rp-top-bar-establishment · rp-top-bar-date · rp-top-bar-messages · rp-top-bar-help · rp-top-bar-apps · rp-top-bar-account. ═══ */
  var TB_PRODUCTS = {
    Establishment: { frequent: [['Grand Marina Resort & Spa'], ['Coastal Hotels Group', 5]],
      groups: [['Coastal Hotels Group', 5], ['Mediterranean Collection', 3], ['City Breaks', 2]],
      establishments: [['Grand Marina Resort & Spa'], ['Azure Bay Hotel'], ['Seaside Palace'], ['Harbor View Suites'], ['Cliff Edge Resort'], ['Coral Coast Hotel'], ['Old Town Suites']] },
    Restaurant: { frequent: [['Marina Grill']], groups: [['Coastal Restaurants', 3]],
      establishments: [['Marina Grill'], ['Azure Bay Terrace'], ['Seaside Brasserie']] }
  };
  var TB_PERIODS = [['Day', [['today', 'Today'], ['yesterday', 'Yesterday']]], ['Week', [['thisWeek', 'This week'], ['lastWeek', 'Last week']]],
    ['Month', [['thisMonth', 'This month'], ['lastMonth', 'Last month'], ['last30Days', 'Last 30 days']]],
    ['Quarter', [['thisQuarter', 'This quarter'], ['lastQuarter', 'Last quarter'], ['last90Days', 'Last 90 days']]],
    ['Year', [['thisYear', 'This year'], ['lastYear', 'Last year'], ['last365Days', 'Last 365 days']]], ['Custom', [['custom', 'Custom']]]];
  var TB_COMPARE = [['samePeriodLastYear', 'Same period last year'], ['previousPeriod', 'Previous period'], ['custom', 'Custom']];
  /* [date group, guest, guest hub, establishment, last message, time, channel icon, unread] */
  var TB_MESSAGES = [
    ['Today', 'Maria Lopez', 'Coastal WhatsApp', 'Grand Marina Resort & Spa', 'Hi! Is a late check-out possible tomorrow?', '10:24', 'whatsapp', 1],
    ['Today', 'Tom Becker', 'Web chat', 'Azure Bay Hotel', 'Thank you for your patience. Our staff is currently busy and will answer shortly.', '09:02', 'web-messenger', 1],
    ['Yesterday', 'Yuki Tanaka', 'Messenger', 'Seaside Palace', 'Can we book a table for two at 8 pm?', 'Yesterday', 'fb-messenger', 1],
    ['Last 7 days', 'Liam O\u2019Connor', 'Telegram', 'Harbor View Suites', 'Our staff is currently out of office. We will get back to you soon.', 'Mon', 'telegram', 1],
    ['Last month', 'Guest 1304094497', 'Web chat', 'Cliff Edge Resort', 'We will get back to you as soon as possible.', 'Last month', 'web-messenger', 0],
    ['Last month', 'Sofia Russo', 'Coastal WhatsApp', 'Grand Marina Resort & Spa', 'Perfect, see you on Friday.', 'Last month', 'whatsapp', 0]];
  var TB_CHANNEL = { whatsapp: '#25D366', 'fb-messenger': '#007FFF', telegram: '#0088CC', 'web-messenger': '#3F7BAB' }; /* theme.palette.socialmedia */
  var TB_APPS = ['Reviewpro Reputation', 'Daylight PMS', 'Meridian Experiences', 'Iceportal Content', 'Infrasys\nPOS', 'Horizon Distribution',
    'Digital\nDine', 'Digital\nStay', 'Digital Payby', 'Guest Communication', 'Astral Payments', 'Twilight Data + AI'];
  var TB_LANGUAGES = ['English', 'Fran\u00e7ais', 'Espa\u00f1ol', 'Italiano', 'Portugu\u00eas', 'Deutsch', 'Nederlands', '\u0420\u0443\u0441\u0441\u043a\u0438\u0439', '\u4e2d\u6587', '\u65e5\u672c\u8a9e', 'T\u00fcrk\u00e7e'];
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fmtDate(d) { return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear(); }
  function parseDate(s) {
    var m = /^\s*(\d{1,2})\s+([A-Za-z]{3})[A-Za-z]*\.?\s+(\d{4})\s*$/.exec(s || ''), mi;
    if (!m) return null;
    mi = MONTHS.indexOf(m[2].charAt(0).toUpperCase() + m[2].slice(1).toLowerCase());
    return mi < 0 ? null : new Date(+m[3], mi, +m[1]);
  }
  function addDays(d, n) { var x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() + n); return x; }
  function periodRange(key, t) {
    var y = t.getFullYear(), m = t.getMonth(), q = Math.floor(m / 3), dow = (t.getDay() + 6) % 7;
    return ({ today: [t, t], yesterday: [addDays(t, -1), addDays(t, -1)], thisWeek: [addDays(t, -dow), t], lastWeek: [addDays(t, -dow - 7), addDays(t, -dow - 1)],
      thisMonth: [new Date(y, m, 1), t], lastMonth: [new Date(y, m - 1, 1), new Date(y, m, 0)], last30Days: [addDays(t, -29), t],
      thisQuarter: [new Date(y, q * 3, 1), t], lastQuarter: [new Date(y, q * 3 - 3, 1), new Date(y, q * 3, 0)], last90Days: [addDays(t, -89), t],
      thisYear: [new Date(y, 0, 1), t], lastYear: [new Date(y - 1, 0, 1), new Date(y - 1, 11, 31)], last365Days: [addDays(t, -364), t] })[key] || null;
  }
  function compareRange(key, from, to) {
    if (key === 'samePeriodLastYear') return [new Date(from.getFullYear() - 1, from.getMonth(), from.getDate()), new Date(to.getFullYear() - 1, to.getMonth(), to.getDate())];
    if (key === 'previousPeriod') {
      /* whole months (a quarter, a month, a year) shift by months; any other range by its number of days */
      if (from.getDate() === 1 && addDays(to, 1).getDate() === 1) { var n = (to.getFullYear() - from.getFullYear()) * 12 + to.getMonth() - from.getMonth() + 1; return [new Date(from.getFullYear(), from.getMonth() - n, 1), new Date(from.getFullYear(), from.getMonth(), 0)]; }
      var len = Math.round((to - from) / 864e5) + 1; return [addDays(from, -len), addDays(from, -1)];
    }
    return null;
  }
  function tbEl(id, html) {
    var el = doc.getElementById(id);
    if (el) return el;
    var w = doc.createElement('div');
    w.innerHTML = html.trim();
    el = w.firstChild;
    el.setAttribute('data-dl-runtime', '');
    doc.body.appendChild(el);
    return el;
  }
  function tbSelect(key, label, groups, value) {
    var opts = groups.map(function (g) {
      return (g[0] ? '<div class="rp-list-subheader">' + esc(g[0]) + '</div>' : '') + g[1].map(function (o) {
        var on = o[0] === value;
        return '<button type="button" class="rp-menu-item' + (on ? ' rp-menu-item-selected' : '') + '" role="option" aria-selected="' + on + '" data-rp-period="' + o[0] + '">' + esc(o[1]) + '</button>';
      }).join('');
    }).join('');
    return '<div class="rp-select rp-select-full-width" data-rp-date="' + key + '"><span class="rp-field-label">' + esc(label) + '</span>' +
      '<button type="button" class="rp-field-box rp-select-trigger" aria-haspopup="listbox" aria-expanded="false" aria-label="' + esc(label) + '"><span class="rp-select-value"></span></button>' +
      '<div class="rp-menu" role="listbox">' + opts + '</div></div>';
  }
  function tbDateField(key, label, value) {
    return '<div class="rp-date-picker"><span class="rp-field-label">' + label + '</span><div class="rp-field-box"><span class="rp-icon rp-icon-calendar"></span>' +
      '<input class="rp-field-input" data-rp-date="' + key + '" value="' + esc(value) + '" aria-label="' + label + '" /></div></div>';
  }
  function tbEstablishment(trigger) {
    var tabs = Object.keys(TB_PRODUCTS);
    function rows(tab, data) {
      function sec(label, list) {
        if (!list.length) return '';
        return '<div class="rp-list-subheader">' + esc(label) + '</div>' + list.map(function (p) {
          var group = p[1] != null, kind = group ? 'group' : tab === 'Restaurant' ? 'restaurant' : 'establishment';
          return '<div class="rp-menu-item" role="option" tabindex="-1" data-rp-establishment="' + esc(p[0]) + '" data-rp-kind="' + kind + '"><span>' + esc(p[0]) +
            (group ? '<span class="rp-top-bar-establishment-count"> (' + p[1] + ')</span>' : '') + '</span>' +
            '<button type="button" class="rp-top-bar-establishment-pin" aria-pressed="false" aria-label="Set as default" data-rp-tooltip="Set as default"><span class="rp-icon rp-icon-pin"></span></button></div>';
        }).join('');
      }
      var g = data.groups.length, e = data.establishments.length;
      return sec('Most frequent', data.frequent) + sec(g + (g === 1 ? ' Group' : ' Groups'), data.groups) + sec(e + (e === 1 ? ' Establishment' : ' Establishments'), data.establishments) +
        '<div class="rp-top-bar-establishment-empty" data-rp-menu-empty hidden>No products found</div>';
    }
    var pop = tbEl('rp-top-bar-establishment', '<div class="rp-menu rp-popover rp-top-bar-establishment-popover" id="rp-top-bar-establishment" role="dialog" aria-label="Establishments">' +
      '<div class="rp-tabs" role="tablist" aria-label="Product">' + tabs.map(function (t, i) {
        return '<button type="button" class="rp-tab' + (i ? '' : ' rp-tab-selected') + '" role="tab" aria-selected="' + !i + '" aria-controls="rp-top-bar-establishment-' + i + '">' + t + '</button>';
      }).join('') + '</div>' +
      '<div class="rp-top-bar-establishment-search"><div class="rp-search rp-search-size-small rp-search-full-width"><div class="rp-field-box"><span class="rp-icon rp-icon-search"></span>' +
      '<input class="rp-field-input" type="search" placeholder="Search" aria-label="Search establishments" /></div></div></div>' +
      tabs.map(function (t, i) { return '<div class="rp-tab-panel rp-top-bar-establishment-list" id="rp-top-bar-establishment-' + i + '" role="listbox" aria-label="' + t + '"' + (i ? ' hidden' : '') + '>' + rows(t, TB_PRODUCTS[t]) + '</div>'; }).join('') + '</div>');
    var name = trigger.querySelector('.rp-top-bar-establishment-text > strong');
    tbPin(pop, name ? text(name) : '');
    return pop;
  }
  function tbPin(pop, value) {
    $$('[data-rp-establishment]', pop).forEach(function (r) {
      var on = !!value && r.getAttribute('data-rp-establishment') === value, b = r.querySelector('.rp-top-bar-establishment-pin'), l = on ? 'Remove default' : 'Set as default';
      b.setAttribute('aria-pressed', on); b.setAttribute('aria-label', l); b.setAttribute('data-rp-tooltip', l);
    });
  }
  function tbDate(trigger) {
    var strong = trigger.querySelector('.rp-top-bar-date-text strong'), vs = trigger.querySelector('.rp-top-bar-date-text span');
    var cur = text(strong).split(/\s+-\s+/), prev = text(vs).replace(/^vs\.?\s*/, '').split(/\s+-\s+/);
    var from = parseDate(cur[0]) || new Date(2026, 0, 1), to = parseDate(cur[1]) || new Date(2026, 2, 31);
    var pFrom = parseDate(prev[0]) || addDays(from, -365), pTo = parseDate(prev[1]) || addDays(to, -365);
    var today = parseDate(trigger.getAttribute('data-rp-today')) || to, key = 'custom', cmp = 'custom';
    TB_PERIODS.forEach(function (g) { g[1].forEach(function (o) { var r = periodRange(o[0], today); if (key === 'custom' && r && +r[0] === +from && +r[1] === +to) key = o[0]; }); });
    TB_COMPARE.forEach(function (o) { var r = compareRange(o[0], from, to); if (cmp === 'custom' && r && +r[0] === +pFrom && +r[1] === +pTo) cmp = o[0]; });
    var pop = tbEl('rp-top-bar-date', '<div class="rp-menu rp-popover rp-top-bar-date-popover" id="rp-top-bar-date" role="dialog" aria-label="Select a Date Period">' +
      '<h2 class="rp-top-bar-date-title">Select a Date Period</h2>' + tbSelect('current', 'Current Period', TB_PERIODS, key) +
      '<div class="rp-top-bar-date-row">' + tbDateField('from', 'From', fmtDate(from)) + '<span class="rp-top-bar-date-separator">-</span>' + tbDateField('to', 'To', fmtDate(to)) + '</div>' +
      tbSelect('compare', 'Compare With:', [['', TB_COMPARE]], cmp) +
      '<div class="rp-top-bar-date-row">' + tbDateField('prev-from', 'From', fmtDate(pFrom)) + '<span class="rp-top-bar-date-separator">-</span>' + tbDateField('prev-to', 'To', fmtDate(pTo)) + '</div>' +
      '<label class="rp-form-control-label" data-rp-date="default-row"><input type="checkbox" class="rp-checkbox" data-rp-date="default" /> Set as default</label>' +
      '<button type="button" class="rp-main-button rp-main-button-full-width" data-rp-date="apply">Apply</button></div>');
    pop._rpToday = today;
    $$('.rp-select', pop).forEach(selectValue);
    tbDateDefaultRow(pop);
    return pop;
  }
  function tbDateVal(pop, k) { return pop.querySelector('[data-rp-date="' + k + '"]'); }
  function tbDateKey(pop, k) { var i = tbDateVal(pop, k).querySelector('.rp-menu-item-selected'); return i ? i.getAttribute('data-rp-period') : 'custom'; }
  function tbDateSet(pop, k, period) {
    $$('.rp-menu-item', tbDateVal(pop, k)).forEach(function (i) { var on = i.getAttribute('data-rp-period') === period; i.classList.toggle('rp-menu-item-selected', on); i.setAttribute('aria-selected', on); });
    selectValue(tbDateVal(pop, k));
  }
  function tbDateDefaultRow(pop) { tbDateVal(pop, 'default-row').hidden = tbDateKey(pop, 'current') === 'custom' || tbDateKey(pop, 'compare') === 'custom'; }
  function tbDateCompare(pop) {
    var r = compareRange(tbDateKey(pop, 'compare'), parseDate(tbDateVal(pop, 'from').value), parseDate(tbDateVal(pop, 'to').value));
    if (r && r[0] && !isNaN(r[0])) { tbDateVal(pop, 'prev-from').value = fmtDate(r[0]); tbDateVal(pop, 'prev-to').value = fmtDate(r[1]); }
  }
  function tbMessages() {
    var d = tbEl('rp-top-bar-messages', '<div class="rp-drawer-overlay" id="rp-top-bar-messages"><aside class="rp-drawer rp-drawer-anchor-right rp-drawer-width-medium rp-drawer-below-nav-bar" role="dialog" aria-modal="true" aria-labelledby="rp-top-bar-messages-title">' +
      '<div class="rp-top-bar-messages-title"><h2 id="rp-top-bar-messages-title">All Messages</h2><button type="button" class="rp-icon-button" data-rp-close aria-label="Close"><span class="rp-icon rp-icon-close"></span></button></div>' +
      '<div class="rp-top-bar-messages-actions"><button type="button" class="rp-icon-button" data-rp-menu="rp-top-bar-messages-sort" aria-haspopup="menu" aria-expanded="false" aria-label="Sort messages"><span class="rp-icon rp-icon-size-32 rp-icon-sort-by"></span></button></div>' +
      '<div class="rp-top-bar-messages-list"></div></aside></div>');
    tbEl('rp-top-bar-messages-sort', '<div class="rp-menu" id="rp-top-bar-messages-sort" role="menu" aria-label="Sort messages" data-rp-align-right data-rp-selectable style="min-width: 180px">' +
      [['newest', 'Newest'], ['priority', 'Priority'], ['oldest', 'Oldest']].map(function (s, i) { return '<button type="button" class="rp-menu-item' + (i ? '' : ' rp-menu-item-selected') + '" role="menuitem" data-rp-sort="' + s[0] + '">' + s[1] + '</button>'; }).join('') + '</div>');
    if (d.hasAttribute('data-dl-runtime') && !d._rpMessages) {
      d._rpMessages = TB_MESSAGES.map(function (m, i) { return { i: i, g: m[0], name: m[1], hub: m[2], hotel: m[3], text: m[4], time: m[5], ch: m[6], unread: !!m[7] }; });
      tbRenderMessages(d, 'newest');
    }
    return d;
  }
  function tbRenderMessages(d, sort) {
    var list = d.querySelector('.rp-top-bar-messages-list');
    if (!list || !d._rpMessages) return;
    var rows = d._rpMessages.slice(), html = '', last = null;
    if (sort === 'oldest') rows.reverse();
    if (sort === 'priority') rows.sort(function (a, b) { return (b.unread - a.unread) || (a.i - b.i); });
    rows.forEach(function (m) {
      if (sort !== 'priority' && m.g !== last) { html += '<div class="rp-top-bar-messages-group">' + esc(m.g) + '</div>'; last = m.g; }
      html += '<button type="button" class="rp-top-bar-message' + (m.unread ? '' : ' rp-top-bar-message-read') + '" data-rp-message="' + m.i + '">' +
        '<span class="rp-top-bar-message-avatar"><span class="rp-top-bar-message-unread" aria-label="Unread"></span><span class="rp-top-bar-message-picture"><span class="rp-icon rp-icon-size-32 rp-icon-user"></span>' +
        '<span class="rp-top-bar-message-channel"><span class="rp-icon rp-icon-' + m.ch + '" style="color: ' + (TB_CHANNEL[m.ch] || 'inherit') + '"></span></span></span></span>' +
        '<span class="rp-top-bar-message-body"><span class="rp-top-bar-message-head"><span class="rp-top-bar-message-name"><strong>' + esc(m.name) + '</strong> \u00b7 <span class="rp-top-bar-message-hub">' + esc(m.hub) + '</span></span>' +
        '<span class="rp-top-bar-message-time">' + esc(m.time) + '</span></span><span class="rp-top-bar-message-text">' + esc(m.hotel) + '<i></i><span>' + esc(m.text) + '</span></span></span></button>';
    });
    list.innerHTML = html;
    d._rpSort = sort;
  }
  /* the bell keeps the page's count; reading an unread message lowers it (Badge: dot from 100) */
  function tbCountDown() {
    $$('[data-rp-top-bar="notifications"]').forEach(function (t) {
      var c = t.querySelector('.rp-badge-content'), n = c ? Math.max(0, (parseInt(c.textContent, 10) || 0) - 1) : 0;
      if (c) { c.textContent = n; c.hidden = !n; }
      t.setAttribute('aria-label', 'Notifications, ' + n + ' unread');
    });
  }
  function tbHelp() {
    return tbEl('rp-top-bar-help', '<div class="rp-menu" id="rp-top-bar-help" role="menu" aria-label="Help" data-rp-align-right>' +
      '<button type="button" class="rp-menu-item" role="menuitem" data-rp-snackbar="Opens the Help Center" data-rp-snackbar-variant="info">Help Center</button>' +
      '<button type="button" class="rp-menu-item" role="menuitem" data-rp-snackbar="Opens What\u2019s new" data-rp-snackbar-variant="info">What\u2019s new</button></div>');
  }
  function tbApps() {
    return tbEl('rp-top-bar-apps', '<div class="rp-menu rp-popover rp-top-bar-apps-popover" id="rp-top-bar-apps" role="dialog" aria-label="Explore all Shiji Products" data-rp-align-right>' +
      '<div class="rp-top-bar-apps-block"><div class="rp-top-bar-apps-title">Explore all Shiji Products</div><div class="rp-top-bar-apps-grid">' +
      TB_APPS.map(function (a) { return '<a class="rp-top-bar-apps-item" href="#" data-rp-snackbar="Opens ' + esc(a.replace('\n', ' ')) + '" data-rp-snackbar-variant="info">' + esc(a) + '</a>'; }).join('') +
      '</div></div><div class="rp-top-bar-apps-demo"><p><strong>Want to learn more about how we can help boosting your business? Get a product demo now!</strong></p>' +
      '<button type="button" class="rp-main-button rp-main-button-size-small" data-rp-snackbar="Opens the Shiji demo request" data-rp-snackbar-variant="info">Let\u2019s talk</button></div></div>');
  }
  function tbAccount(trigger) {
    var name = trigger.getAttribute('data-rp-user-name') || 'Alex Rivera', mail = trigger.getAttribute('data-rp-user-email') || 'alex.rivera@coastalhotels.com';
    tbEl('rp-top-bar-about', '<div class="rp-dialog-overlay" id="rp-top-bar-about"><div class="rp-dialog rp-dialog-max-width-xs" role="dialog" aria-modal="true" aria-labelledby="rp-top-bar-about-title">' +
      '<div class="rp-dialog-title"><h2 class="rp-dialog-title-label" id="rp-top-bar-about-title">About Reviewpro Reputation</h2><button type="button" class="rp-icon-button" data-rp-close aria-label="Close"><span class="rp-icon rp-icon-close"></span></button></div>' +
      '<div class="rp-dialog-content">' + (function () { var l = doc.querySelector('.rp-side-bar-panel-logo, .kit-settings-nav-logo'); return l ? '<img class="rp-top-bar-about-logo" src="' + esc(l.getAttribute('src')) + '" alt="ReviewPro Reputation" />' : ''; })() +
      '<p>Version 2026.11</p><p><a class="rp-link" href="https://www.shijigroup.com/legal/terms-and-conditions-reviewpro" target="_blank" rel="noopener">Terms and Conditions</a></p>' +
      '<p><a class="rp-link" href="https://www.shijigroup.com/legal/privacy-policy" target="_blank" rel="noopener">Privacy Policy</a></p><p class="rp-text-secondary">\u00a9 2026 Shiji Group. All rights reserved.</p></div>' +
      '<div class="rp-dialog-actions"><button type="button" class="rp-main-button" data-rp-close>Close</button></div></div></div>');
    return tbEl('rp-top-bar-account', '<div class="rp-menu rp-top-bar-account-menu" id="rp-top-bar-account" role="menu" aria-label="Account options" data-rp-align-right>' +
      '<div data-rp-account-view="main"><div class="rp-menu-header"><strong>' + esc(name) + '</strong><span>' + esc(mail) + '</span></div>' +
      '<button type="button" class="rp-menu-item" role="menuitem" data-rp-snackbar="Opens Personal Information" data-rp-snackbar-variant="info"><span class="rp-icon rp-icon-user"></span>Personal Information</button>' +
      '<button type="button" class="rp-menu-item" role="menuitem" data-rp-keep-open data-rp-account-go="language"><span class="rp-icon rp-icon-languages"></span>Language<span class="rp-icon rp-icon-right"></span></button>' +
      '<button type="button" class="rp-menu-item" role="menuitem" data-rp-snackbar="Opens Change Password" data-rp-snackbar-variant="info"><span class="rp-icon rp-icon-password"></span>Change Password</button>' +
      '<div class="rp-menu-divider"></div><button type="button" class="rp-menu-item" role="menuitem" data-rp-open="rp-top-bar-about"><span class="rp-icon rp-icon-about"></span>About Reviewpro Reputation</button>' +
      '<div class="rp-menu-divider"></div><button type="button" class="rp-menu-item" role="menuitem" data-rp-snackbar="Logged out" data-rp-snackbar-variant="info"><span class="rp-icon rp-icon-log-out"></span>Logout</button></div>' +
      '<div data-rp-account-view="language" hidden><button type="button" class="rp-top-bar-account-back" data-rp-account-go="main"><span class="rp-icon rp-icon-left"></span>Back</button>' +
      '<div class="rp-top-bar-account-caption">Select language</div>' +
      TB_LANGUAGES.map(function (l, i) { return '<button type="button" class="rp-menu-item' + (i ? '' : ' rp-menu-item-selected') + '" role="menuitem" data-rp-language>' + esc(l) + '</button>'; }).join('') + '</div></div>');
  }
  function tbView(menu, view) { $$('[data-rp-account-view]', menu).forEach(function (v) { v.hidden = v.getAttribute('data-rp-account-view') !== view; }); }
  function initTopBar() {
    $$('[data-rp-top-bar]').forEach(function (t) {
      var kind = t.getAttribute('data-rp-top-bar'), el = null;
      if (kind === 'establishment') el = tbEstablishment(t);
      else if (kind === 'date') el = tbDate(t);
      else if (kind === 'help') el = tbHelp();
      else if (kind === 'apps') el = tbApps();
      else if (kind === 'account') el = tbAccount(t);
      else if (kind === 'notifications') { el = tbMessages(); if (!t.hasAttribute('data-rp-open')) t.setAttribute('data-rp-open', el.id); t.setAttribute('aria-haspopup', 'dialog'); return; }
      if (el && !t.hasAttribute('data-rp-menu')) { t.setAttribute('data-rp-menu', el.id); t.setAttribute('aria-haspopup', kind === 'account' || kind === 'help' ? 'menu' : 'dialog'); t.setAttribute('aria-expanded', 'false'); }
    });
  }
  /* top bar overlay clicks run first (capture) so the generic menu handler does not close a popover on its own rows */
  doc.addEventListener('click', function (e) {
    var t = e.target, el, pop, trig;
    if (closest(t, '#dl-tweak-host')) return;
    if ((el = closest(t, '[data-rp-top-bar="account"]'))) { var am = doc.getElementById('rp-top-bar-account'); if (am) tbView(am, 'main'); return; }
    if ((el = closest(t, '.rp-top-bar-establishment-pin'))) {
      e.preventDefault(); e.stopPropagation(); hideTip();
      pop = closest(el, '.rp-menu');
      var row = closest(el, '[data-rp-establishment]'), on = el.getAttribute('aria-pressed') !== 'true';
      tbPin(pop, on ? row.getAttribute('data-rp-establishment') : '');
      window.rpSnackbar(on ? row.getAttribute('data-rp-establishment') + ' is now your default' : 'Default removed', 'info');
      return;
    }
    if ((el = closest(t, '#rp-top-bar-establishment [data-rp-establishment]'))) {
      e.preventDefault(); e.stopPropagation();
      pop = closest(el, '.rp-menu'); trig = pop._trigger;
      var nm = trig && trig.querySelector('.rp-top-bar-establishment-text > strong'), sub = trig && trig.querySelector('.rp-top-bar-establishment-text > span'), kind = el.getAttribute('data-rp-kind');
      if (nm) nm.textContent = el.getAttribute('data-rp-establishment');
      if (sub) sub.textContent = kind === 'group' ? 'Group view' : kind === 'restaurant' ? 'Restaurant view' : 'Establishment view';
      closeMenus(); if (trig) trig.focus();
      return;
    }
    if ((el = closest(t, '[data-rp-date="apply"]'))) {
      pop = closest(el, '.rp-menu'); trig = pop._trigger;
      if (trig) {
        trig.querySelector('.rp-top-bar-date-text strong').textContent = tbDateVal(pop, 'from').value + ' - ' + tbDateVal(pop, 'to').value;
        trig.querySelector('.rp-top-bar-date-text span').textContent = 'vs. ' + tbDateVal(pop, 'prev-from').value + ' - ' + tbDateVal(pop, 'prev-to').value;
      }
      var def = tbDateVal(pop, 'default');
      closeMenus(); if (trig) trig.focus();
      if (def && def.checked && !tbDateVal(pop, 'default-row').hidden) window.rpSnackbar('Saved as your default date period');
      return;
    }
    if ((el = closest(t, '[data-rp-account-go]'))) { e.preventDefault(); e.stopPropagation(); tbView(closest(el, '.rp-menu'), el.getAttribute('data-rp-account-go')); return; }
    if ((el = closest(t, '[data-rp-language]'))) {
      $$('[data-rp-language]', closest(el, '.rp-menu')).forEach(function (x) { x.classList.toggle('rp-menu-item-selected', x === el); });
      window.rpSnackbar('Language changed to ' + text(el), 'info');
      return;
    }
    if ((el = closest(t, '#rp-top-bar-apps a, #rp-top-bar-apps button'))) { setTimeout(closeMenus, 0); return; }
    if ((el = closest(t, '[data-rp-sort]'))) { var dr = doc.getElementById('rp-top-bar-messages'); if (dr) tbRenderMessages(dr, el.getAttribute('data-rp-sort')); return; }
    if ((el = closest(t, '[data-rp-message]'))) {
      var drw = doc.getElementById('rp-top-bar-messages'), m = drw && drw._rpMessages[+el.getAttribute('data-rp-message')];
      if (m) { if (m.unread) tbCountDown(); m.unread = false; tbRenderMessages(drw, drw._rpSort || 'newest'); window.rpSnackbar('Opens the conversation with ' + m.name, 'info'); }
    }
  }, true);
  doc.addEventListener('change', function (e) {
    var sel = closest(e.target, '[data-rp-date]'), pop = sel && closest(sel, '#rp-top-bar-date');
    if (!pop) return;
    var k = sel.getAttribute('data-rp-date');
    if (k === 'current') {
      var r = periodRange(tbDateKey(pop, 'current'), pop._rpToday);
      if (r) { tbDateVal(pop, 'from').value = fmtDate(r[0]); tbDateVal(pop, 'to').value = fmtDate(r[1]); tbDateCompare(pop); }
    } else if (k === 'compare') tbDateCompare(pop);
    else if (k === 'from' || k === 'to') { tbDateSet(pop, 'current', 'custom'); tbDateCompare(pop); }
    else if (k === 'prev-from' || k === 'prev-to') tbDateSet(pop, 'compare', 'custom');
    tbDateDefaultRow(pop);
  });

  /* ═══ SETTINGS HUB (ui-settings-app AccountSettingsNext) — [data-rp-settings]: a search filters the setting cards and highlights
     the matches, the nav panel counts them per section, chips filter one section; nav items show one section or All Settings ═══ */
  function settingsHub(hub, term, only) {
    var q = (term || '').trim().toLowerCase(), sections = $$('[data-rp-settings-section]', hub), total = 0, counts = {};
    var nav = hub._rpNav || 'all';
    sections.forEach(function (s) {
      var key = s.getAttribute('data-rp-settings-section'), n = 0;
      $$('.kit-setting-card', s).forEach(function (c) {
        var title = c.querySelector('.kit-setting-card-title a') || c.querySelector('.kit-setting-card-title');
        if (title && !title._rpText) title._rpText = title.textContent;
        var hit = !q || text(c).toLowerCase().indexOf(q) >= 0;
        c.hidden = !hit;
        if (title) {
          if (q && hit && title._rpText.toLowerCase().indexOf(q) >= 0) {
            var i = title._rpText.toLowerCase().indexOf(q);
            title.innerHTML = esc(title._rpText.slice(0, i)) + '<mark class="kit-settings-highlight">' + esc(title._rpText.slice(i, i + q.length)) + '</mark>' + esc(title._rpText.slice(i + q.length));
          } else if (title.innerHTML !== esc(title._rpText)) title.textContent = title._rpText;
        }
        if (hit) n++;
      });
      counts[key] = n; total += q ? n : 0;
      s.hidden = q ? (!n || (only && only !== key)) : (nav !== 'all' && nav !== key);
    });
    $$('[data-rp-settings-nav]', hub).forEach(function (b) {
      var key = b.getAttribute('data-rp-settings-nav'), badge = b.querySelector('.rp-badge');
      var n = key === 'all' ? total : counts[key] || 0;
      b.classList.toggle('kit-settings-nav-item-active', !q && key === nav);
      b.classList.toggle('kit-settings-nav-item-no-match', !!q && !n);
      if (!q && key === nav) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
      if (q && n && key !== 'all') {
        if (!badge) { badge = doc.createElement('span'); badge.className = 'rp-badge rp-badge-inline rp-badge-size-small'; badge.setAttribute('data-dl-runtime', ''); badge.innerHTML = '<span class="rp-badge-content"></span>'; b.appendChild(badge); }
        badge.firstChild.textContent = n; badge.hidden = false;
      } else if (badge) badge.hidden = true;
    });
    var res = hub.querySelector('[data-rp-settings-results]'), empty = hub.querySelector('[data-rp-settings-empty]');
    if (res) {
      res.hidden = !q || !total;
      if (q && total) res.innerHTML = '<span>' + total + ' results</span>' + sections.filter(function (s) { return counts[s.getAttribute('data-rp-settings-section')]; }).map(function (s) {
        var key = s.getAttribute('data-rp-settings-section'), h = s.querySelector('h2');
        return '<button type="button" class="rp-chip rp-chip-size-small rp-chip-clickable' + (only === key ? '' : ' rp-chip-secondary') + '" data-rp-settings-chip="' + key + '">' + esc(h ? text(h) : key) + ' ' + counts[key] + '</button>';
      }).join('');
    }
    if (empty) empty.hidden = !q || !!total;
    hub._rpOnly = only || null;
  }
  doc.addEventListener('input', function (e) {
    var hub = closest(e.target, '[data-rp-settings]');
    if (hub && e.target.matches('[data-rp-settings-search]')) settingsHub(hub, e.target.value, null);
  });
  doc.addEventListener('click', function (e) {
    var hub = closest(e.target, '[data-rp-settings]'), b, s;
    if (!hub) return;
    s = hub.querySelector('[data-rp-settings-search]');
    if ((b = closest(e.target, '[data-rp-settings-nav]'))) { hub._rpNav = b.getAttribute('data-rp-settings-nav'); history.replaceState(null, '', hub._rpNav === 'all' ? location.pathname : '#' + hub._rpNav); if (s) { s.value = ''; syncClear(closest(s, '.rp-search')); } settingsHub(hub, '', null); window.scrollTo(0, 0); }
    else if ((b = closest(e.target, '[data-rp-settings-chip]'))) { var k = b.getAttribute('data-rp-settings-chip'); settingsHub(hub, s ? s.value : '', hub._rpOnly === k ? null : k); }
    else if (closest(e.target, '.rp-search-clear') && s) setTimeout(function () { settingsHub(hub, '', null); }, 0);
  });

  /* ═══ INIT ═══ */
  function init() {
    initTopBar();
    $$('.rp-side-bar').forEach(decorateRail);
    $$('[data-rp-settings]').forEach(function (h) {
      var k = location.hash.slice(1);
      if (k && h.querySelector('[data-rp-settings-nav="' + k + '"]')) h._rpNav = k;
      settingsHub(h, '', null);
    });
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
    st.textContent = '@media print { #dlEditButton { display: none !important } } html.dl-tweaking #dlEditButton, html:has(#dl-tweak-host) #dlEditButton { display: none !important } body:has(.rp-side-bar-spacer, .rp-side-bar-knowledge-hub) #dlEditButton { bottom: 64px !important } body:has(.rp-snackbar) #dlEditButton { bottom: 88px !important }';
    document.head.appendChild(st);
  }
  function ready() { fromHash(); editButton(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready); else ready();
})();
// Partial checkbox (Figma Checkbox Selected=Partial, React indeterminate): <input type="checkbox" class="rp-checkbox" data-rp-indeterminate>
(function () {
  function apply() { Array.prototype.forEach.call(document.querySelectorAll('input[data-rp-indeterminate]'), function (el) { el.indeterminate = true; }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply); else apply();
})();

// Slider (Figma Slider): fill the track up to the value and show it in [data-rp-slider-value]
(function () {
  function paint(el) {
    var min = +el.min || 0, max = +(el.max || 100), v = +el.value;
    el.style.setProperty('--rp-slider-value', ((v - min) / ((max - min) || 1) * 100) + '%');
    var out = el.closest('.rp-slider') && el.closest('.rp-slider').querySelector('[data-rp-slider-value]');
    if (out) out.textContent = (out.getAttribute('data-rp-slider-value') || '{v}').replace('{v}', v);
  }
  function init() { Array.prototype.forEach.call(document.querySelectorAll('.rp-slider-input'), paint); }
  document.addEventListener('input', function (e) { if (e.target.classList && e.target.classList.contains('rp-slider-input')) paint(e.target); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
// Uploader (Figma Uploader): drag-over state, and chosen files listed under the zone (names only: nothing is uploaded)
(function () {
  function list(up, files) {
    var box = up.querySelector('.rp-uploader-files');
    if (!box) { box = document.createElement('div'); box.className = 'rp-uploader-files'; up.appendChild(box); }
    Array.prototype.forEach.call(files, function (f) {
      var row = document.createElement('div'); row.className = 'rp-uploader-file';
      row.innerHTML = '<span class="rp-icon rp-icon-file"></span><span class="rp-uploader-file-name"></span><span class="rp-uploader-file-size"></span>' +
        '<button type="button" class="rp-icon-button" aria-label="Remove file" data-rp-uploader-remove><span class="rp-icon rp-icon-delete"></span></button>';
      row.querySelector('.rp-uploader-file-name').textContent = f.name;
      row.querySelector('.rp-uploader-file-size').textContent = f.size ? (f.size > 1048576 ? (f.size / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(f.size / 1024)) + ' KB') : '';
      box.appendChild(row);
    });
  }
  document.addEventListener('change', function (e) {
    var up = e.target.closest && e.target.closest('.rp-uploader');
    if (up && e.target.type === 'file') { list(up, e.target.files); e.target.value = ''; }
  });
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-rp-uploader-remove]');
    if (b) b.closest('.rp-uploader-file').remove();
  });
  ['dragenter', 'dragover'].forEach(function (t) {
    document.addEventListener(t, function (e) { var up = e.target.closest && e.target.closest('.rp-uploader'); if (up) up.classList.add('rp-uploader-dragover'); });
  });
  ['dragleave', 'drop'].forEach(function (t) {
    document.addEventListener(t, function (e) { var up = e.target.closest && e.target.closest('.rp-uploader'); if (up) up.classList.remove('rp-uploader-dragover'); });
  });
})();

// Version switch (kit prototype control, not product UI). A page offers it with
//   <link rel="alternate" data-rp-version="v2" href="index-v2.html" title="Modernised">   (in the current page)
//   <link rel="alternate" data-rp-version="current" href="index.html" title="Current UI"> (in the V2 page)
// The pill keeps the scroll position across the two files; on V2 it also switches Light / Dark (saved per browser).
(function () {
  var root = document.documentElement, KEY = 'rp-v2-theme';
  if (root.getAttribute('data-rp-version') === 'v2') {
    try { if (localStorage.getItem(KEY) === 'dark') root.setAttribute('data-rp-theme', 'dark'); } catch (e) { /* storage off */ }
  }
  function init() {
    var links = document.querySelectorAll('link[rel="alternate"][data-rp-version]');
    if (!links.length || document.getElementById('kitVersionSwitch')) return;
    var mine = root.getAttribute('data-rp-version') === 'v2' ? 'v2' : 'current';
    var here = location.pathname.split('/').pop() || 'index.html';
    var opts = [{ v: mine, href: here, title: mine === 'v2' ? 'Modernised' : 'Current UI' }];
    Array.prototype.forEach.call(links, function (l) { opts.push({ v: l.getAttribute('data-rp-version'), href: l.getAttribute('href'), title: l.getAttribute('title') || l.getAttribute('data-rp-version') }); });
    opts.sort(function (a, b) { return a.v === 'current' ? -1 : b.v === 'current' ? 1 : 0; });
    var bar = document.createElement('div');
    bar.id = 'kitVersionSwitch'; bar.className = 'kit-version-switch'; bar.setAttribute('data-dl-runtime', '');
    bar.setAttribute('role', 'group'); bar.setAttribute('aria-label', 'UI version');
    var html = '<span class="kit-version-switch-label">UI</span>';
    opts.forEach(function (o) {
      html += '<a class="kit-version-switch-option' + (o.v === mine ? ' kit-version-switch-option-selected" aria-current="page' : '') + '" href="' + o.href + '" data-rp-version-go>' + o.title + '</a>';
    });
    if (mine === 'v2') {
      var dark = root.getAttribute('data-rp-theme') === 'dark';
      html += '<span class="kit-version-switch-divider"></span><button type="button" class="kit-version-switch-option' + (dark ? '' : ' kit-version-switch-option-selected') + '" data-rp-theme-set="light" aria-pressed="' + !dark + '">Light</button>' +
        '<button type="button" class="kit-version-switch-option' + (dark ? ' kit-version-switch-option-selected' : '') + '" data-rp-theme-set="dark" aria-pressed="' + dark + '">Dark</button>';
    }
    bar.innerHTML = html;
    document.body.appendChild(bar);
    var saved = sessionStorage.getItem('rp-version-scroll');
    if (saved) { sessionStorage.removeItem('rp-version-scroll'); setTimeout(function () { window.scrollTo(0, +saved); }, 30); }
    bar.addEventListener('click', function (e) {
      var go = e.target.closest('[data-rp-version-go]');
      if (go) {
        e.preventDefault();
        if (go.classList.contains('kit-version-switch-option-selected')) return;
        try { sessionStorage.setItem('rp-version-scroll', String(window.scrollY)); } catch (err) { /* storage off */ }
        location.href = go.getAttribute('href') + location.hash;
        return;
      }
      var t = e.target.closest('[data-rp-theme-set]');
      if (t) {
        var d = t.getAttribute('data-rp-theme-set') === 'dark';
        if (d) root.setAttribute('data-rp-theme', 'dark'); else root.removeAttribute('data-rp-theme');
        try { localStorage.setItem(KEY, d ? 'dark' : 'light'); } catch (err) { /* storage off */ }
        Array.prototype.forEach.call(bar.querySelectorAll('[data-rp-theme-set]'), function (b) {
          var on = b === t; b.classList.toggle('kit-version-switch-option-selected', on); b.setAttribute('aria-pressed', on);
        });
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.altKey && e.shiftKey && (e.key === 'V' || e.key === 'v' || e.code === 'KeyV')) {
        var other = bar.querySelector('[data-rp-version-go]:not(.kit-version-switch-option-selected)');
        if (other) other.click();
      }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
