/* Tweak mode — Swap component (like a Figma instance swap, in the component menu of the inspector
   header): turn the selection into a related DS component and keep its content.
     Text controls   main · default · ghost button · link · chip · switch · checkbox · radio
                     (the text is kept; a checkbox / radio swaps together with its label)
     Field type      text field · select · select multiple · search · text area · date picker
                     (the label, the helper text and the options are kept)
   New markup comes from the library.js snippets; kept content comes from the file text
   (T.nodeFor + F.text), never from the live DOM. One element, one undo step (T.ops.replace). */
(function (T) {
  'use strict';
  var S = T.s, F = T.file;
  function has(c) { return function (el) { return el.classList.contains(c); }; }
  function hostInput(type) { return function (el) { var i = el.matches('input') ? el : el.querySelector(':scope > input'); return !!(i && i.type === type); }; }
  function hostSwitch(el) { return el.classList.contains('rp-switch') || !!el.querySelector(':scope > .rp-switch'); }
  /* ── Text controls ── */
  var CONTROLS = [
    { id: 'main', label: 'Main button', lib: 'Main button', is: has('rp-main-button') },
    { id: 'default', label: 'Default button', lib: 'Default button', is: has('rp-default-button') },
    { id: 'ghost', label: 'Ghost button', lib: 'Ghost button', is: has('rp-ghost-button') },
    { id: 'link', label: 'Link', lib: 'Link', is: has('rp-link') },
    { id: 'chip', label: 'Chip', lib: 'Chip', is: has('rp-chip') },
    { id: 'switch', label: 'Switch', lib: 'Switch', is: function (el) { return el.matches('label.rp-form-control-label') && hostSwitch(el); } },
    { id: 'checkbox', label: 'Checkbox', lib: 'Checkbox', is: hostInput('checkbox') },
    { id: 'radio', label: 'Radio', lib: 'Radio', is: hostInput('radio') }
  ];
  function controlSwap(el) {
    var target = T.replaceTarget(el);
    if (target.classList.contains('rp-switch') && target.parentElement && target.parentElement.matches('label.rp-form-control-label')) target = target.parentElement;
    var kind = CONTROLS.filter(function (c) { return c.is(target); })[0];
    if (!kind) return null;
    var text = T.textOf(target);
    return {
      target: target, current: kind.id, text: text, options: CONTROLS,
      build: function (to) { return T.fillSnippet(T.libraryItem(CONTROLS.filter(function (c) { return c.id === to; })[0].lib).html, text); }
    };
  }
  /* ── Field type ── */
  var FIELDS = [
    { id: 'text', label: 'Text field', lib: 'Text field', root: 'rp-text-field' },
    { id: 'select', label: 'Select', lib: 'Select', root: 'rp-select' },
    { id: 'multiple', label: 'Select · multiple', lib: 'Select · multiple', root: 'rp-select' },
    { id: 'search', label: 'Search', lib: 'Search', root: 'rp-search' },
    { id: 'textarea', label: 'Text area', lib: 'Text area', root: 'rp-text-area' },
    { id: 'date', label: 'Date picker', lib: 'Date picker', root: 'rp-date-picker' }
  ];
  var ROOTS = ['rp-text-field', 'rp-select', 'rp-search', 'rp-text-area', 'rp-date-picker'];
  function fieldOf(el) {
    var f = el.closest('.' + ROOTS.join(', .'));
    if (!f || f.closest('#dl-tweak-host') || f.closest('.rp-table-pagination')) return null;
    return f;
  }
  function kindOf(f) {
    if (f.classList.contains('rp-select')) return f.classList.contains('rp-select-multiple') ? 'multiple' : 'select';
    for (var i = 0; i < FIELDS.length; i++) if (f.classList.contains(FIELDS[i].root)) return FIELDS[i].id;
    return 'text';
  }
  function src(el) { var n = T.nodeFor(el); return (n ? F.text.slice(n.start, n.end) : el.outerHTML).replace(/\s*\n\s*/g, ' '); }
  function fromHtml(html) { var t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }
  function fieldSwap(el) {
    var f = fieldOf(el);
    if (!f) return null;
    var kind = kindOf(f);
    var label = f.querySelector(':scope > .rp-field-label'), helper = f.querySelector(':scope > .rp-field-helper');
    var labelText = label ? label.textContent.trim() : '';
    var required = !!(label && label.classList.contains('rp-field-label-required'));
    var opts = Array.prototype.map.call(f.querySelectorAll('.rp-menu-item'), function (o) { return o.textContent.trim(); }).filter(Boolean);
    var keep = Array.prototype.filter.call(f.classList, function (c) { return /-full-width$|-size-small$/.test(c); }).map(function (c) { return c.replace(/^rp-[a-z-]+?-(full-width|size-small)$/, '$1'); });
    return {
      target: f, current: kind, text: labelText, options: FIELDS,
      build: function (to) {
        var o = FIELDS.filter(function (x) { return x.id === to; })[0];
        var nf = fromHtml(T.fillSnippet(T.libraryItem(o.lib).html, labelText));
        ROOTS.forEach(function (r) { ['-full-width', '-size-small'].forEach(function (s) { nf.classList.remove(r + s); }); });
        keep.forEach(function (k) { if (!(o.root === 'rp-text-area' && k === 'size-small')) nf.classList.add(o.root + '-' + k); });
        var nl = nf.querySelector(':scope > .rp-field-label');
        if (nl && required) nl.classList.add('rp-field-label-required');
        if (o.root === 'rp-search' && labelText) { var inp = nf.querySelector('input'); if (inp) { inp.setAttribute('placeholder', labelText); inp.setAttribute('aria-label', labelText); } }
        var menu = nf.querySelector('.rp-menu');
        if (menu && opts.length) {
          var multi = to === 'multiple';
          menu.innerHTML = '\n' + opts.map(function (t, i) {
            var on = !multi && i === 0;
            return '    <button type="button" class="rp-menu-item' + (on ? ' rp-menu-item-selected' : '') + '" role="option" aria-selected="' + on + '">' + (multi ? '<span class="rp-checkbox-glyph"></span>' : '') + T.esc(t) + '</button>';
          }).join('\n') + '\n  ';
          var v = nf.querySelector('.rp-select-value');
          if (v) { v.textContent = multi ? 'Select' : opts[0]; v.classList.toggle('rp-select-placeholder', multi); }
        }
        var html = nf.outerHTML;
        if (helper) { var end = html.lastIndexOf('</div>'); html = html.slice(0, end).replace(/\s*$/, '\n') + '  ' + src(helper) + '\n</div>'; }
        return html;
      }
    };
  }
  T.swapOf = function (el) { return el && el.classList ? fieldSwap(el) || controlSwap(el) : null; };
  /* The options show in the component menu (the name in the inspector header, inspector.js) */
  T.action('swap', function (b) {
    var sw = T.swapOf(S.selected), to = b.getAttribute('data-arg') || b.getAttribute('data-to');
    if (!sw || to === sw.current) return;
    var label = sw.options.filter(function (o) { return o.id === to; })[0].label;
    /* all similar (or ⇧-selected) elements of the same kind, each with its own text */
    T.replaceEach(function (el) { var s = T.swapOf(el); return s && s.current === sw.current ? s.target : null; },
      function (el) { return T.swapOf(el).build(to); }, label);
    T.notify('Swapped to ' + label);
  });
})(window.DLTweakNS);
