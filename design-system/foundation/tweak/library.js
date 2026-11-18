/* Tweak mode — insertable DS components (the + panel).
   Snippets are the canonical markup from design-system/components/*.md and the showcase
   (examples/index.html). {{text}} is replaced with the text of the element being replaced
   (or the default after |). Every component of rp-map.json should have one entry.
   Add a component: one entry here. Keep snippets small and realistic. */
(function (T) {
  'use strict';
  var ic = function (n, size) { return '<span class="rp-icon' + (size ? ' rp-icon-size-' + size : '') + ' rp-icon-' + n + '"></span>'; };
  var field = function (cls, label, inner, helper) {
    return '<div class="' + cls + '">\n  <label class="rp-field-label">{{text|' + label + '}}</label>\n  ' + inner + (helper ? '\n  <span class="rp-field-helper">' + helper + '</span>' : '') + '\n</div>';
  };
  var options = function (list, sel, multi) {
    return list.map(function (o) {
      var on = o === sel;
      return '    <button type="button" class="rp-menu-item' + (on ? ' rp-menu-item-selected' : '') + '" role="option" aria-selected="' + on + '">' + (multi ? '<span class="rp-checkbox-glyph"></span>' : '') + o + '</button>';
    }).join('\n');
  };
  var select = function (label, list, sel, multi) {
    return '<div class="rp-select' + (multi ? ' rp-select-multiple' : '') + ' rp-select-size-small">\n  <span class="rp-field-label">{{text|' + label + '}}</span>\n' +
      '  <button type="button" class="rp-field-box rp-select-trigger" aria-haspopup="listbox" aria-expanded="false" aria-label="' + label + '"><span class="rp-select-value' + (sel ? '' : ' rp-select-placeholder') + '">' + (sel || 'Select') + '</span></button>\n' +
      '  <div class="rp-menu" role="listbox">\n' + options(list, sel, multi) + '\n  </div>\n</div>';
  };
  T.LIBRARY = [
    /* Actions */
    { cat: 'Actions', name: 'Main button', icon: 'rectangle-horizontal', html: '<button type="button" class="rp-main-button rp-main-button-size-small">{{text|Save changes}}</button>' },
    { cat: 'Actions', name: 'Main button · danger', icon: 'rectangle-horizontal', html: '<button type="button" class="rp-main-button rp-main-button-size-small rp-main-button-danger">{{text|Delete}}</button>' },
    { cat: 'Actions', name: 'Default button', icon: 'rectangle-horizontal', html: '<button type="button" class="rp-default-button rp-default-button-size-small">{{text|Cancel}}</button>' },
    { cat: 'Actions', name: 'Ghost button', icon: 'rectangle-horizontal', html: '<button type="button" class="rp-ghost-button">{{text|Show more}}</button>' },
    { cat: 'Actions', name: 'Button with icon', icon: 'plus', html: '<button type="button" class="rp-main-button rp-main-button-size-small">' + ic('add') + '<span>{{text|Add user}}</span></button>' },
    { cat: 'Actions', name: 'Icon button', icon: 'square', html: '<button type="button" class="rp-icon-button" aria-label="Edit">' + ic('edit') + '</button>' },
    { cat: 'Actions', name: 'Kebab menu button', icon: 'ellipsis', html: '<button type="button" class="rp-icon-button" data-rp-menu="rowMenu" aria-label="More actions">' + ic('actions') + '</button>' },
    { cat: 'Actions', name: 'Floating button', icon: 'plus', html: '<button type="button" class="rp-floating-button" aria-label="{{text|Create}}">' + ic('add') + '</button>' },
    { cat: 'Actions', name: 'Toggle buttons', icon: 'columns-2', html: '<div class="rp-toggle-button-group rp-toggle-button-group-size-small" role="group" aria-label="Show">\n  <button type="button" class="rp-toggle-button rp-toggle-button-selected" aria-pressed="true">{{text|Volume}}</button>\n  <button type="button" class="rp-toggle-button" aria-pressed="false">Rating</button>\n</div>' },
    { cat: 'Actions', name: 'Toggle buttons with label', icon: 'columns-2', html: '<div class="rp-toggle-button-group-field"><span class="rp-toggle-button-group-label">{{text|Input method}}</span>\n  <div class="rp-toggle-button-group rp-toggle-button-group-size-small" role="group" aria-label="Input method">\n    <button type="button" class="rp-toggle-button rp-toggle-button-selected" aria-pressed="true">Excel</button>\n    <button type="button" class="rp-toggle-button" aria-pressed="false">Manual input</button>\n  </div>\n</div>' },
    { cat: 'Actions', name: 'Link', icon: 'text', html: '<a class="rp-link" href="#">{{text|View all reviews}}</a>' },
    /* Status */
    { cat: 'Status', name: 'Chip', icon: 'tag', html: '<span class="rp-chip rp-chip-size-small rp-chip-confirmation">{{text|Active}}</span>' },
    { cat: 'Status', name: 'Chip · new', icon: 'tag', html: '<span class="rp-chip rp-chip-size-small rp-chip-brand">{{text|New}}</span>' },
    { cat: 'Status', name: 'Chip · removable', icon: 'tag', html: '<span class="rp-chip rp-chip-secondary">{{text|Room}} <button type="button" class="rp-chip-delete" aria-label="Remove">' + ic('close') + '</button></span>' },
    { cat: 'Status', name: 'Badge on icon', icon: 'badge', html: '<span class="rp-badge rp-badge-size-small">' + ic('notification') + '<span class="rp-badge-content">{{text|3}}</span></span>' },
    { cat: 'Status', name: 'Avatar', icon: 'user', html: '<span class="rp-avatar">{{text|AR}}</span>' },
    { cat: 'Status', name: 'Alert · info', icon: 'circle-alert', html: '<div class="rp-alert rp-alert-info" role="status">\n  ' + ic('info') + '\n  <div class="rp-alert-content">{{text|This setting applies to every establishment of the group.}}</div>\n</div>' },
    { cat: 'Status', name: 'Alert · warning', icon: 'circle-alert', html: '<div class="rp-alert" role="status">\n  ' + ic('warning') + '\n  <div class="rp-alert-content">{{text|Response rate is below goal. Reply to the pending reviews.}}</div>\n</div>' },
    { cat: 'Status', name: 'Alert · error', icon: 'circle-alert', html: '<div class="rp-alert rp-alert-error" role="alert">\n  ' + ic('error') + '\n  <div class="rp-alert-content">{{text|Google is disconnected. Connect it again to reply to reviews.}}</div>\n</div>' },
    { cat: 'Status', name: 'Progress bar', icon: 'minus', html: '<div class="rp-progress-bar">\n  <div class="rp-progress-bar-label"><span>{{text|Service}}</span><span>91.2%</span></div>\n  <div class="rp-progress-bar-track" role="progressbar" aria-label="Service" aria-valuenow="91" aria-valuemin="0" aria-valuemax="100"><div class="rp-progress-bar-value" style="width: 91.2%"></div></div>\n</div>' },
    { cat: 'Status', name: 'Loader', icon: 'loader-circle', html: '<span class="rp-loader" role="status" aria-label="Loading"></span>' },
    { cat: 'Status', name: 'Empty state', icon: 'search', html: '<div class="rp-placeholder rp-placeholder-show">\n  ' + ic('not-found', 80) + '\n  <div class="rp-placeholder-content"><span class="rp-placeholder-title">{{text|No results found}}</span><span>Change the filters and try again</span></div>\n</div>' },
    { cat: 'Status', name: 'Icon', icon: 'image', html: ic('info') },
    /* Text */
    { cat: 'Text', name: 'Page title', icon: 'heading', html: '<h1 class="rp-page-title">{{text|Page Title}}</h1>' },
    { cat: 'Text', name: 'Title (h6)', icon: 'heading', html: '<h3 class="rp-text-h6">{{text|Section Title}}</h3>' },
    { cat: 'Text', name: 'Paragraph', icon: 'text', html: '<p>{{text|Short description of what this area is for.}}</p>' },
    { cat: 'Text', name: 'Secondary text', icon: 'text', html: '<span class="rp-text-caption rp-text-secondary">{{text|Updated 17/03/2026}}</span>' },
    { cat: 'Text', name: 'Label and value', icon: 'list', html: '<div class="kit-label-value"><span class="kit-label-value-label">{{text|Source}}</span><span>Google</span></div>' },
    { cat: 'Text', name: 'KPI', icon: 'heading', html: '<div class="kit-kpi">\n  <span class="kit-kpi-value">{{text|87.4%}}</span>\n  <span class="kit-kpi-label"><span class="kit-kpi-delta-up">+1.2</span> vs previous period</span>\n</div>' },
    /* Inputs */
    { cat: 'Inputs', name: 'Text field', icon: 'text-cursor-input', html: field('rp-text-field rp-text-field-size-small', 'Name', '<div class="rp-field-box"><input class="rp-field-input" type="text" aria-label="Name" /></div>') },
    { cat: 'Inputs', name: 'Select', icon: 'chevron-down', html: select('Role', ['Administrator', 'Account Manager', 'Analyst', 'Viewer'], 'Analyst') },
    { cat: 'Inputs', name: 'Select · multiple', icon: 'chevron-down', html: select('Establishments', ['Grand Marina Resort &amp; Spa', 'Azure Bay Hotel', 'Seaside Palace'], 'Grand Marina Resort &amp; Spa', true) },
    { cat: 'Inputs', name: 'Search', icon: 'search', html: '<div class="rp-search rp-search-size-small">\n  <div class="rp-field-box">' + ic('search') + '<input class="rp-field-input" type="search" placeholder="{{text|Search}}" aria-label="Search" /><button type="button" class="rp-icon-button rp-icon-button-size-small rp-search-clear" aria-label="Clear search">' + ic('close') + '</button></div>\n</div>' },
    { cat: 'Inputs', name: 'Text area', icon: 'text', html: field('rp-text-area rp-text-area-full-width', 'Comment', '<div class="rp-field-box"><textarea class="rp-field-input" rows="3" aria-label="Comment"></textarea></div>') },
    { cat: 'Inputs', name: 'Date picker', icon: 'text-cursor-input', html: '<div class="rp-date-picker rp-date-picker-size-small">\n  <span class="rp-field-label">{{text|Date}}</span>\n  <button type="button" class="rp-field-box" aria-label="Date">' + ic('calendar') + '<span>01/03/2026 - 31/03/2026</span></button>\n</div>' },
    { cat: 'Inputs', name: 'Checkbox', icon: 'square', html: '<label class="rp-form-control-label"><input type="checkbox" class="rp-checkbox" checked /> {{text|Email}}</label>' },
    { cat: 'Inputs', name: 'Radio', icon: 'square', html: '<label class="rp-form-control-label"><input type="radio" class="rp-radio" name="option" checked /> {{text|Option}}</label>' },
    { cat: 'Inputs', name: 'Switch', icon: 'toggle-right', html: '<label class="rp-form-control-label"><button type="button" class="rp-switch rp-switch-checked" role="switch" aria-checked="true"></button> {{text|Label}}</label>' },
    { cat: 'Inputs', name: 'Switch (table)', icon: 'toggle-right', html: '<button type="button" class="rp-switch rp-switch-size-small rp-switch-checked" role="switch" aria-checked="true" aria-label="{{text|Active}}"></button>' },
    /* Navigation */
    { cat: 'Navigation', name: 'Tabs', icon: 'columns-2', html: '<div class="rp-tabs" role="tablist">\n  <button type="button" class="rp-tab rp-tab-selected" role="tab" aria-selected="true">{{text|Overview}}</button>\n  <button type="button" class="rp-tab" role="tab" aria-selected="false">Details</button>\n</div>' },
    { cat: 'Navigation', name: 'Breadcrumbs', icon: 'arrow-right', html: '<nav class="rp-breadcrumbs" aria-label="Breadcrumb"><a class="rp-breadcrumb-link" href="#">Settings</a><span class="rp-breadcrumb-separator">/</span><span class="rp-breadcrumb-text">{{text|Users}}</span></nav>' },
    { cat: 'Navigation', name: 'Stepper', icon: 'columns-2', html: '<div class="rp-stepper">\n  <div class="rp-step rp-step-completed"><span class="rp-step-icon">1</span><span>Details</span></div>\n  <span class="rp-step-connector"></span>\n  <div class="rp-step rp-step-active"><span class="rp-step-icon">2</span><span>{{text|Questions}}</span></div>\n</div>' },
    /* Layout */
    { cat: 'Layout', name: 'Tile', icon: 'square-stack', html: '<section class="rp-tile">\n  <div class="rp-tile-title"><div class="rp-tile-title-text"><h2 class="rp-tile-title-label">{{text|Tile Title}}</h2></div></div>\n  <div class="rp-tile-content">Content</div>\n</section>' },
    { cat: 'Layout', name: 'Tile with actions', icon: 'square-stack', html: '<section class="rp-tile">\n  <div class="rp-tile-title"><div class="rp-tile-title-text"><h2 class="rp-tile-title-label">{{text|Preferences}}</h2></div></div>\n  <div class="rp-tile-content">Content</div>\n  <div class="rp-tile-actions"><button type="button" class="rp-default-button rp-default-button-size-small">Cancel</button><button type="button" class="rp-main-button rp-main-button-size-small">Save changes</button></div>\n</section>' },
    { cat: 'Layout', name: 'Tile title', icon: 'heading', html: '<div class="rp-tile-title"><div class="rp-tile-title-text"><h2 class="rp-tile-title-label">{{text|Tile Title}}</h2><p class="rp-tile-title-secondary">Secondary text</p></div></div>' },
    { cat: 'Layout', name: 'Tile expand', icon: 'chevron-down', html: '<button type="button" class="rp-tile-expand" aria-expanded="false"><span class="rp-tile-expand-label">{{text|Show more}}</span>' + ic('down') + '</button>' },
    { cat: 'Layout', name: 'Grid of tiles', icon: 'layout-grid', html: '<div class="kit-grid" style="--kit-columns: 3">\n  <section class="rp-tile"><div class="rp-tile-content">One</div></section>\n  <section class="rp-tile"><div class="rp-tile-content">Two</div></section>\n  <section class="rp-tile"><div class="rp-tile-content">Three</div></section>\n</div>' },
    { cat: 'Layout', name: 'Accordion', icon: 'rows-2', html: '<div class="rp-accordion">\n  <button type="button" class="rp-accordion-summary" aria-expanded="false"><span class="rp-accordion-title">{{text|Applied filters}}</span></button>\n  <div class="rp-accordion-details">Details</div>\n</div>' },
    { cat: 'Layout', name: 'Divider', icon: 'minus', html: '<hr class="rp-divider" />' },
    /* Overlays */
    { cat: 'Overlays', name: 'Menu', icon: 'list', html: '<div class="rp-menu open" style="position: static" role="menu">\n  <button type="button" class="rp-menu-item" role="menuitem">' + ic('edit') + ' {{text|Edit}}</button>\n  <button type="button" class="rp-menu-item rp-menu-item-danger" role="menuitem">' + ic('delete') + ' Delete</button>\n</div>' },
    { cat: 'Overlays', name: 'Menu item', icon: 'list', html: '<button type="button" class="rp-menu-item" role="menuitem">{{text|Duplicate}}</button>' },
    /* Data */
    { cat: 'Data', name: 'Table', icon: 'table-2', html: '<table class="rp-table">\n  <thead><tr><th>Name</th><th class="rp-table-numeric">Reviews</th><th>Status</th></tr></thead>\n  <tbody>\n    <tr><td>{{text|Grand Marina Resort &amp; Spa}}</td><td class="rp-table-numeric">1,247</td><td><span class="rp-chip rp-chip-size-small rp-chip-confirmation">Active</span></td></tr>\n    <tr><td>Azure Bay Hotel</td><td class="rp-table-numeric">864</td><td><span class="rp-chip rp-chip-size-small rp-chip-confirmation">Active</span></td></tr>\n  </tbody>\n</table>' },
    { cat: 'Data', name: 'Table row', icon: 'rows-2', html: '<tr><td>{{text|Seaside Palace}}</td><td class="rp-table-numeric">512</td><td><span class="rp-chip rp-chip-size-small rp-chip-deactivated">Inactive</span></td></tr>' },
    { cat: 'Data', name: 'Person cell', icon: 'user', html: '<div class="rp-table-person"><span class="rp-avatar">MC</span><div class="rp-table-person-text"><span class="rp-table-person-primary">{{text|Maya Chen}}</span><span class="rp-table-person-secondary">maya.chen@coastalhotels.com</span></div></div>' },
    { cat: 'Data', name: 'Change cell', icon: 'arrow-up', html: '<span class="rp-table-delta rp-table-delta-positive"><span class="rp-icon rp-icon-trend-positive"></span>{{text|+2.1}}</span>' },
    { cat: 'Data', name: 'Sentiment bar', icon: 'minus', html: '<div class="rp-volume-bar" role="img" aria-label="74% positive, 18% neutral"><div class="rp-volume-bar-value" style="width: 74%"></div><div class="rp-volume-bar-value-neutral" style="width: 18%"></div></div>' },
    { cat: 'Data', name: 'Expandable row', icon: 'list', html: '<tr class="rp-table-row-clickable" data-rp-row="{{text|group1}}"><td><button type="button" class="rp-table-expand" aria-expanded="false"><span class="rp-icon rp-icon-right"></span><span>Coastal Hotels Group</span></button></td><td class="rp-table-numeric">1,247</td></tr>' },
    { cat: 'Data', name: 'Volume bar', icon: 'minus', html: '<div class="rp-volume-bar" role="img" aria-label="81% positive"><div class="rp-volume-bar-value" style="width: 81%"></div></div>' },
    { cat: 'Data', name: 'Toolbar', icon: 'columns-2', html: '<div class="rp-toolbar">\n  <div class="rp-toolbar-left"><div class="rp-search rp-search-size-small"><div class="rp-field-box">' + ic('search') + '<input class="rp-field-input" type="search" placeholder="{{text|Search}}" aria-label="Search" /></div></div></div>\n  <div class="rp-toolbar-right"><button type="button" class="rp-ghost-button">' + ic('filter') + '<span>Filters</span></button></div>\n</div>' }
  ];
  T.LIBRARY_CATS = ['Actions', 'Status', 'Text', 'Inputs', 'Navigation', 'Layout', 'Overlays', 'Data'];
  T.libraryItem = function (name) { return T.LIBRARY.filter(function (it) { return it.name === name; })[0]; };
  /* Fill {{text|default}} with the given text (escaped) or the default */
  T.fillSnippet = function (html, text) {
    return html.replace(/\{\{text\|([^}]*)\}\}/g, function (m, def) { return text ? T.src.escapeText(text) : def; });
  };
  /* A checkbox / radio and its label are one control: <label><input> Text</label>. Returns that wrapper
     for the input (or for the text next to it), else null. Replace and swap act on the wrapper. */
  var CONTROL = 'input.rp-checkbox, input.rp-radio, input[type="checkbox"], input[type="radio"]';
  function controlInput(box) { var i = box && box.querySelector(':scope > input'); return i && i.matches(CONTROL) ? i : null; }
  T.controlHost = function (el) {
    if (!el || !el.parentElement) return null;
    var host = null;
    if (el.matches(CONTROL)) host = el.parentElement;
    else if (controlInput(el)) host = el;
    else if (controlInput(el.parentElement)) host = el.parentElement;
    if (!host || host === document.body || host.children.length > 2 || host.matches('.rp-table-cell-checkbox, .rp-menu-item')) return null;
    return host;
  };
  /* What Replace swaps out: the whole control for a checkbox / radio, else the element */
  T.replaceTarget = function (el) { return T.controlHost(el) || el; };
  /* The visible text of an element, kept when it is replaced by another component.
     Own text first; else the first text inside it (button icon + label, wrapper + span). */
  T.textOf = function (el) {
    if (!el || el.nodeType !== 1) return '';
    var clean = function (s) { return s.replace(/\s+/g, ' ').trim(); };
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) { var host = T.controlHost(el); return host ? T.textOf(host) : ''; }
    var own = clean(T.directTextNodes(el).map(function (n) { return n.nodeValue; }).join(' '));
    if (own) return own;
    var w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), n;
    while ((n = w.nextNode())) if (n.nodeValue.trim() && !n.parentElement.closest('script, style, textarea, select, .rp-menu')) return clean(n.nodeValue);
    return '';
  };
})(window.DLTweakNS);
