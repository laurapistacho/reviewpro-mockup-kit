/* Tweak mode — component props registry.
   Each entry maps a DS component (its root class in shared.css) to editable props.
   First matching entry wins, so more specific roots go first.
   Prop types (rendered in sections.js: segmented, dropdown, preview chips, state chips):
     group   one option at a time; option = [modifierClass | null, label]
             preview: 'pill' renders each option with the real DS styles (sample = base classes, tag)
     toggle  on / off modifier class
     icon    a ReviewPro icon + size
     swap    a select of the component's swap options (swap.js), e.g. the field type
   when(el) on any prop hides it unless true.
   Adding a variant to shared.css? Add it here too so designers can switch it. Names come from
   design-system/rp-map.json: label = the React prop name (shown in the tooltip), option labels = prop values,
   null = the default value (no class). */
(function (T) {
  'use strict';
  var SIZE_MS = function (root) { return { type: 'group', label: 'size', options: [[null, 'medium'], [root + '-size-small', 'small']] }; };
  function fieldProps(root, own) {
    return [{ type: 'swap', label: 'type', name: 'Type' }].concat(own || [], [
      { type: 'toggle', cls: root + '-error', label: 'error' },
      { type: 'toggle', cls: root + '-warning', label: 'warning', when: function () { return root !== 'rp-search' && root !== 'rp-date-picker'; } },
      { type: 'toggle', cls: root + '-disabled', label: 'disabled' },
      { type: 'toggle', cls: root + '-full-width', label: 'fullWidth', name: 'Full width' }]);
  }
  T.COMPONENTS = [
    { name: 'Icon', root: 'rp-icon', props: [{ type: 'icon' }] },
    { name: 'MainButton', root: 'rp-main-button', props: [
      { type: 'group', label: 'color', preview: 'pill', sample: 'rp-main-button rp-main-button-size-small', tag: 'button', options: [[null, 'primary'], ['rp-main-button-secondary', 'secondary']] },
      SIZE_MS('rp-main-button'),
      { type: 'toggle', cls: 'rp-main-button-danger', label: 'danger' },
      { type: 'toggle', cls: 'rp-main-button-full-width', label: 'fullWidth', name: 'Full width' },
      { type: 'toggle', cls: 'rp-main-button-disabled', label: 'disabled' }] },
    { name: 'DefaultButton', root: 'rp-default-button', props: [
      { type: 'group', label: 'color', preview: 'pill', sample: 'rp-default-button rp-default-button-size-small', tag: 'button', options: [[null, 'neutral'], ['rp-default-button-primary', 'primary']] },
      SIZE_MS('rp-default-button'),
      { type: 'toggle', cls: 'rp-default-button-danger', label: 'danger' },
      { type: 'toggle', cls: 'rp-default-button-full-width', label: 'fullWidth', name: 'Full width' },
      { type: 'toggle', cls: 'rp-default-button-disabled', label: 'disabled' }] },
    { name: 'GhostButton', root: 'rp-ghost-button', props: [
      { type: 'group', label: 'color', options: [[null, 'primary'], ['rp-ghost-button-inherit', 'inherit']] },
      { type: 'group', label: 'size', options: [[null, 'small'], ['rp-ghost-button-size-medium', 'medium']] },
      { type: 'toggle', cls: 'rp-ghost-button-danger', label: 'danger' },
      { type: 'toggle', cls: 'rp-ghost-button-full-width', label: 'fullWidth', name: 'Full width' },
      { type: 'toggle', cls: 'rp-ghost-button-disabled', label: 'disabled' }] },
    { name: 'IconButton', root: 'rp-icon-button', props: [
      { type: 'group', label: 'size', options: [[null, 'large · 32'], ['rp-icon-button-size-small', 'small · 24']] },
      { type: 'toggle', cls: 'rp-icon-button-primary', label: 'color: primary', name: 'Primary' },
      { type: 'toggle', cls: 'rp-icon-button-disabled', label: 'disabled' }] },
    { name: 'ToggleButton', root: 'rp-toggle-button', props: [
      { type: 'toggle', cls: 'rp-toggle-button-selected', label: 'selected' },
      { type: 'group', label: 'size', options: [['rp-toggle-button-size-small', 'small · 32'], [null, 'large · 40']] }] },
    { name: 'ToggleButtonGroup', root: 'rp-toggle-button-group' },
    { name: 'FloatingButton', root: 'rp-floating-button' },
    { name: 'Chip', root: 'rp-chip', props: [
      { type: 'group', label: 'color', preview: 'pill', sample: 'rp-chip rp-chip-size-small', tag: 'span', options: [[null, 'primary'], ['rp-chip-brand', 'brand'], ['rp-chip-secondary', 'secondary'], ['rp-chip-confirmation', 'confirmation'], ['rp-chip-info', 'info'], ['rp-chip-warning', 'warning'], ['rp-chip-error', 'error'], ['rp-chip-deactivated', 'deactivated']] },
      { type: 'group', label: 'size', options: [['rp-chip-size-small', 'small · 24'], [null, 'medium · 32'], ['rp-chip-size-large', 'large · 40']] },
      { type: 'toggle', cls: 'rp-chip-squared', label: 'squared' },
      { type: 'toggle', cls: 'rp-chip-clickable', label: 'clickable' },
      { type: 'toggle', cls: 'rp-chip-disabled', label: 'disabled' }] },
    { name: 'Badge content', root: 'rp-badge-content' },
    { name: 'Badge', root: 'rp-badge', props: [
      { type: 'group', label: 'variant', options: [[null, 'standard'], ['rp-badge-dot', 'dot']] },
      { type: 'group', label: 'color', options: [[null, 'informative'], ['rp-badge-error', 'error'], ['rp-badge-confirmation', 'confirmation'], ['rp-badge-warning', 'warning'], ['rp-badge-neutral', 'neutral']] },
      { type: 'group', label: 'size', options: [['rp-badge-size-small', 'small'], [null, 'medium'], ['rp-badge-size-large', 'large']] },
      { type: 'toggle', cls: 'rp-badge-inline', label: 'inline' }] },
    { name: 'Avatar', root: 'rp-avatar', props: [
      { type: 'group', label: 'shape', options: [[null, 'square'], ['rp-avatar-round', 'round']] },
      { type: 'group', label: 'size', options: [['rp-avatar-size-24', '24'], [null, '32'], ['rp-avatar-size-40', '40'], ['rp-avatar-size-48', '48'], ['rp-avatar-size-64', '64']] }] },
    { name: 'Alert', root: 'rp-alert', props: [
      { type: 'group', label: 'variant', preview: 'pill', sample: 'rp-alert rp-alert-compact', tag: 'div', options: [['rp-alert-confirmation', 'confirmation'], ['rp-alert-info', 'info'], [null, 'warning'], ['rp-alert-error', 'error']] },
      { type: 'toggle', cls: 'rp-alert-compact', label: 'compact' },
      { type: 'toggle', cls: 'rp-alert-multiline', label: 'multiline' }] },
    { name: 'Switch', root: 'rp-switch', props: [
      { type: 'toggle', cls: 'rp-switch-checked', label: 'checked' },
      { type: 'group', label: 'size', options: [['rp-switch-size-small', 'small'], [null, 'medium']] },
      { type: 'toggle', cls: 'rp-switch-disabled', label: 'disabled' }] },
    { name: 'Checkbox', root: 'rp-checkbox', props: [{ type: 'toggle', cls: 'rp-checkbox-error', label: 'error' }] },
    { name: 'Radio', root: 'rp-radio', props: [{ type: 'toggle', cls: 'rp-radio-error', label: 'error' }] },
    { name: 'FormControlLabel', root: 'rp-form-control-label' },
    { name: 'FormGroup', root: 'rp-form-group', props: [{ type: 'toggle', cls: 'rp-form-group-row', label: 'row' }] },
    { name: 'Field label', root: 'rp-field-label', props: [{ type: 'toggle', cls: 'rp-field-label-required', label: 'required' }] },
    { name: 'Field helper', root: 'rp-field-helper' },
    { name: 'TextField', root: 'rp-text-field', props: fieldProps('rp-text-field', [SIZE_MS('rp-text-field')]) },
    { name: 'Select', root: 'rp-select', props: fieldProps('rp-select', [SIZE_MS('rp-select'),
      { type: 'toggle', cls: 'rp-select-multiple', label: 'multiple' },
      { type: 'toggle', cls: 'rp-select-inline', label: 'inline' }]) },
    { name: 'Search', root: 'rp-search', props: fieldProps('rp-search', [SIZE_MS('rp-search')]) },
    { name: 'TextArea', root: 'rp-text-area', props: fieldProps('rp-text-area') },
    { name: 'DatePicker', root: 'rp-date-picker', props: fieldProps('rp-date-picker', [SIZE_MS('rp-date-picker')]) },
    { name: 'TileTitle', root: 'rp-tile-title', props: [{ type: 'toggle', cls: 'rp-tile-title-no-wrap', label: 'noWrap', name: 'No wrap' }] },
    { name: 'TileContent', root: 'rp-tile-content' }, { name: 'TileTable', root: 'rp-tile-table' }, { name: 'TileActions', root: 'rp-tile-actions' },
    { name: 'TileExpand', root: 'rp-tile-expand' }, { name: 'TileAlert', root: 'rp-tile-alert' },
    { name: 'Tile', root: 'rp-tile', props: [
      { type: 'group', label: 'variant', options: [[null, 'default'], ['rp-tile-edit', 'edit'], ['rp-tile-secondary', 'secondary'], ['rp-tile-outlined', 'outlined'], ['rp-tile-error', 'error']] },
      { type: 'toggle', cls: 'rp-tile-deactivated', label: 'deactivated' },
      { type: 'toggle', cls: 'rp-tile-expanded', label: 'TileExpand isExpanded', name: 'Expanded' }] },
    { name: 'Tab', root: 'rp-tab', props: [
      { type: 'toggle', cls: 'rp-tab-selected', label: 'selected' },
      { type: 'toggle', cls: 'rp-tab-disabled', label: 'disabled' },
      { type: 'group', label: 'size', options: [['rp-tab-size-small', 'small'], [null, 'medium'], ['rp-tab-size-large', 'large']] }] },
    { name: 'Tabs', root: 'rp-tabs', props: [{ type: 'group', label: 'variant', options: [[null, 'fullWidth'], ['rp-tabs-standard', 'standard'], ['rp-tabs-scrollable', 'scrollable']] }] },
    { name: 'AccordionSummary', root: 'rp-accordion-summary' }, { name: 'AccordionDetails', root: 'rp-accordion-details' },
    { name: 'Accordion', root: 'rp-accordion', props: [
      { type: 'toggle', cls: 'rp-accordion-expanded', label: 'expanded' },
      { type: 'group', label: 'variant', options: [[null, 'default'], ['rp-accordion-secondary', 'secondary']] },
      { type: 'toggle', cls: 'rp-accordion-show-dividers', label: 'showDividers', name: 'Dividers' },
      { type: 'toggle', cls: 'rp-accordion-disabled', label: 'disabled' }] },
    { name: 'Divider', root: 'rp-divider', props: [
      { type: 'group', label: 'orientation', options: [[null, 'horizontal'], ['rp-divider-vertical', 'vertical']] },
      { type: 'group', label: 'color', options: [[null, 'grey'], ['rp-divider-primary', 'primary'], ['rp-divider-secondary', 'secondary'], ['rp-divider-active', 'active']] }] },
    { name: 'Table', root: 'rp-table', props: [
      { type: 'toggle', cls: 'rp-table-fixed', label: 'fixed' },
      { type: 'toggle', cls: 'rp-table-compact', label: 'Compact rows (kit)' },
      { type: 'toggle', cls: 'rp-table-sticky-header', label: 'Sticky header (kit)' }] },
    { name: 'TableSortableHead', root: 'rp-table-sort' },
    { name: 'Toolbar', root: 'rp-toolbar' }, { name: 'Toolbar bulk actions', root: 'rp-toolbar-bulk' },
    { name: 'TablePagination', root: 'rp-table-pagination' },
    { name: 'Volume bar', root: 'rp-volume-bar' },
    { name: 'MenuItem', root: 'rp-menu-item', props: [
      { type: 'toggle', cls: 'rp-menu-item-selected', label: 'selected' },
      { type: 'toggle', cls: 'rp-menu-item-danger', label: 'Destructive' },
      { type: 'toggle', cls: 'rp-menu-item-disabled', label: 'disabled' }] },
    { name: 'Menu', root: 'rp-menu' },
    { name: 'Dialog', root: 'rp-dialog', props: [{ type: 'group', label: 'maxWidth', options: [['rp-dialog-max-width-xs', 'xs · 444'], [null, 'sm · 600'], ['rp-dialog-max-width-md', 'md · 900'], ['rp-dialog-max-width-lg', 'lg · 1200']] }] },
    { name: 'Drawer', root: 'rp-drawer', props: [
      { type: 'group', label: 'anchor', options: [[null, 'left'], ['rp-drawer-anchor-right', 'right']] },
      { type: 'group', label: 'width', options: [[null, 'default · 360'], ['rp-drawer-width-small', 'small'], ['rp-drawer-width-medium', 'medium'], ['rp-drawer-width-large', 'large'], ['rp-drawer-width-xlarge', 'xlarge']] },
      { type: 'toggle', cls: 'rp-drawer-secondary', label: 'variant: secondary', name: 'Secondary' }] },
    { name: 'ProgressBar', root: 'rp-progress-bar', props: [{ type: 'group', label: 'size', options: [['rp-progress-bar-size-small', 'small'], [null, 'medium']] }] },
    { name: 'Loader', root: 'rp-loader', props: [{ type: 'group', label: 'size', options: [['rp-loader-size-24', '24'], [null, '40'], ['rp-loader-size-64', '64']] }] },
    { name: 'Placeholder', root: 'rp-placeholder', props: [{ type: 'toggle', cls: 'rp-placeholder-show', label: 'show' }] },
    { name: 'Step', root: 'rp-step', props: [{ type: 'group', label: 'state', options: [[null, 'pending'], ['rp-step-active', 'active'], ['rp-step-completed', 'completed'], ['rp-step-error', 'error']] }] },
    { name: 'Stepper', root: 'rp-stepper' }, { name: 'Breadcrumbs', root: 'rp-breadcrumbs' },
    { name: 'Side bar item', root: 'rp-side-bar-item', props: [{ type: 'toggle', cls: 'rp-side-bar-item-active', label: 'isActive', name: 'Active' }] },
    { name: 'Panel item', root: 'rp-side-bar-panel-item', props: [{ type: 'toggle', cls: 'rp-side-bar-panel-item-active', label: 'isActive', name: 'Active' }] },
    { name: 'Top bar', root: 'rp-top-bar' }, { name: 'Side bar', root: 'rp-side-bar' }, { name: 'Section panel', root: 'rp-side-bar-panel' },
    { name: 'Content', root: 'rp-content-wrapper', props: [{ type: 'toggle', cls: 'rp-content-wrapper-constrained', label: 'constrained' }] }
  ];
  var KEEP = /^(xs|s|sm|md|lg|xl|xlg|xxl)$/;
  T.human = function (s) {
    if (!s || KEEP.test(s) || /[^a-zA-Z -]/.test(s)) return s; /* sizes, numbers, "small · 24" stay */
    var t = s.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/-/g, ' ').toLowerCase();
    return t.charAt(0).toUpperCase() + t.slice(1);
  };
  T.propLabel = function (p) { return p.name || T.human(p.label) || ''; };
  T.propTip = function (p) { return p.label && /^[a-z]/.test(p.label) ? 'React prop: ' + p.label : ''; }; /* kit-only props have human labels already */
  T.componentOf = function (el) {
    if (!el || !el.classList) return null;
    for (var i = 0; i < T.COMPONENTS.length; i++) {
      var roots = [].concat(T.COMPONENTS[i].root);
      for (var j = 0; j < roots.length; j++) if (el.classList.contains(roots[j])) return T.COMPONENTS[i];
    }
    return null;
  };
  T.isIcon = function (el) { var c = T.componentOf(el); return !!(c && c.props && c.props[0] && c.props[0].type === 'icon'); };
  /* the icon class of an element ('rp-icon-search'); 'rp-icon-'.length = 8, like the old 'ac-icon-' */
  T.iconClass = function (el) {
    return Array.prototype.filter.call(el.classList, function (c) { return c.indexOf('rp-icon-') === 0 && c.indexOf('rp-icon-size-') !== 0 && c !== 'rp-icon-multicolor'; })[0] || null;
  };
  var TAG_NAMES = { div: 'Frame', section: 'Section', main: 'Main', aside: 'Aside', header: 'Header', footer: 'Footer', nav: 'Nav', span: 'Text', p: 'Paragraph', a: 'Link', button: 'Button', input: 'Input', img: 'Image', table: 'Table', thead: 'Table head', tbody: 'Table body', tr: 'Table row', td: 'Cell', th: 'Header cell', ul: 'List', li: 'List item', label: 'Label', h1: 'Heading 1', h2: 'Heading 2', h3: 'Heading 3', h4: 'Heading 4', svg: 'Chart', strong: 'Strong text', hr: 'Line' };
  T.nameOf = function (el) {
    var comp = T.componentOf(el);
    if (comp && T.isIcon(el)) { var ic = T.iconClass(el); return 'Icon' + (ic ? ' · ' + ic.slice(8) : ''); }
    if (comp) return comp.name;
    var cls = Array.prototype.filter.call(el.classList, function (c) { return !/^(open|active|selected|on|visible|collapsed)$/.test(c) && !/--/.test(c); })[0];
    return cls ? cls.replace(/^(rp|kit)-/, '').replace(/[-_]+/g, ' ').replace(/^\w/, function (m) { return m.toUpperCase(); }) : (TAG_NAMES[el.tagName.toLowerCase()] || el.tagName.toLowerCase());
  };
})(window.DLTweakNS);
