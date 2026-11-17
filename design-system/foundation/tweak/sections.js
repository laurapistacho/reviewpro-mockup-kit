/* Tweak mode — inspector sections. Each section: T.section({ id, order, when, render }).
   Add a section: register it here (or in a new module listed in boot.js). Buttons inside use
   data-act="…" and register their handler with T.action(). */
(function (T) {
  'use strict';
  var S = T.s, K = T.tokens, I = T.icon, esc = T.esc, px = T.px;
  var BLUE = '#0d99ff';
  var TEXT_STYLES = [[null, 'Default'], ['rp-text-bold', 'Bold'], ['rp-text-secondary', 'Secondary'], ['rp-text-caption rp-text-secondary', 'Meta'], ['rp-text-active', 'Active'], ['rp-link', 'Link']];

  /* Section with the title in a narrow left column and the controls on the right (keeps the
     panel short). opts: { reset: action of a small reset icon next to the title, resetArg: its data-arg, tip } */
  T.sec2 = function (title, body, opts) {
    opts = opts || {};
    return '<div class="sec row2"><div class="sh"' + (opts.tip ? ' title="' + esc(opts.tip) + '"' : '') + '><span class="t">' + title + '</span>' +
      (opts.reset && T.componentOf(S.selected) ? '<button class="ib rs" data-act="' + opts.reset + '"' + (opts.resetArg ? ' data-arg="' + opts.resetArg + '"' : '') + ' title="Reset ' + title.toLowerCase() + ' to the component\'s design">' + I('rotate-ccw', 12) + '</button>' : '') +
      '</div><div class="sb">' + body + '</div></div>';
  };
  function sel() { return S.selected; }
  /* style families with a reset icon on their section (DS components with custom styles only) */
  var FAMILY = {
    padding: /^padding(-|$)/, margin: /^margin(-|$)/,
    layout: /^(display|flex-direction|flex-wrap|justify-content|align-items|align-content|gap|row-gap|column-gap|grid-template-(columns|rows))$/,
    text: /^(font(-.+)?|line-height|color|text-align|vertical-align|letter-spacing|text-transform|text-decoration(-.+)?)$/,
    fill: /^background(-.+)?$/, radius: /^border(-(top|bottom)-(left|right))?-radius$/,
    stroke: function (p) { return /^border(-|$)/.test(p) && !/radius$/.test(p); }
  };
  function famTest(f) { var t = FAMILY[f]; return typeof t === 'function' ? t : function (p) { return t.test(p); }; }
  function famCustom(el, f) { var t = famTest(f), hit = false; T.customOf(el).forEach(function (v, p) { if (t(p)) hit = true; }); return hit; }
  /* sec2 opts for a family: a reset icon when any selected DS component has custom styles in it */
  function famReset(f, opts) {
    opts = opts || {};
    if (T.selection().some(function (o) { return T.componentOf(o) && famCustom(o, f); })) { opts.reset = 'sec-reset'; opts.resetArg = f; }
    return opts;
  }
  T.famReset = famReset;
  T.action('sec-reset', function (b) {
    var f = b.getAttribute('data-arg'), t = famTest(f);
    if (f === 'stroke') S.strokeCustom = null;
    T.runEach(function (el) { return T.componentOf(el) ? T.resetOp(el, t) : null; });
  });
  function propsOf(el) { var c = T.componentOf(el); return c && c.props ? c.props : []; }
  function visibleProps(el) { return propsOf(el).map(function (p, i) { return [p, i]; }).filter(function (x) { return !x[0].when || x[0].when(el); }); }
  function inlineVar(el, v) { return el.style.getPropertyValue(v).trim(); }
  function tokenIn(value) { var m = /var\((--[\w-]+)/.exec(value || ''); return m ? m[1] : null; }

  /* ── Props (component variants) ──
     One choice: a segmented control (short options), a dropdown (long or many options), or
     visual chips when the options preview their look (button pattern, card pattern). Booleans
     (selected, disabled…) are chips side by side; several can be on. Two short segmented props
     sit next to each other (size | fill). Badge color: one color select (presets + palette). */
  function currentOf(g) { return T.common(function (o) { var c = null; g.options.forEach(function (x) { if (x[0] && o.classList.contains(x[0])) c = x[0]; }); return c; }); }
  function shortGroup(g) { return !g.preview && g.options.length <= 4 && g.options.reduce(function (n, o) { return n + o[1].length; }, 0) <= 26; }
  T.section({
    id: 'props', order: 10,
    /* several selected: only when they are the same component (the same props) */
    when: function (el) { return visibleProps(el).length > 0 && T.common(T.componentOf) !== T.MIXED; },
    /* no "Props" heading: one row per prop, its label in the left column like the other sections */
    render: function (el) {
      var html = '<div class="sec props">', list = visibleProps(el), k = 0;
      while (k < list.length) {
        var p = list[k][0], i = list[k][1];
        if (p.type === 'toggle') {
          var chips = '';
          for (; k < list.length && list[k][0].type === 'toggle'; k++) chips += stateChip(list[k][0]);
          html += prow('Options', '', '<div class="chipset">' + chips + '</div>');
          continue;
        }
        if (p.type === 'group') html += group(el, p, i);
        else if (p.type === 'colorselect') html += colorSelect(el, p, i);
        else if (p.type === 'color') html += colorRow(el, p, i);
        else if (p.type === 'icon') html += iconProp(el);
        else if (p.type === 'swap') html += swapProp(el, p);
        k++;
      }
      return html + '</div>';
    }
  });
  function prow(label, tip, body, mixed) { return '<div class="prow"><div class="pl" title="' + esc(tip || label) + '">' + esc(label) + (mixed ? '<small>Mixed</small>' : '') + '</div><div class="pc">' + body + '</div></div>'; }
  function stateChip(p) {
    var st = T.common(function (o) { return o.classList.contains(p.cls); });
    return '<button class="chip' + (st === T.MIXED ? ' mixed' : st ? ' on' : '') + '" data-act="prop-toggle" data-cls="' + p.cls + '" title="' + esc([T.propTip(p), '.' + p.cls].filter(Boolean).join(' · ')) + (st === T.MIXED ? ' · mixed: click to turn on for all' : '') + '">' + esc(T.propLabel(p)) + '</button>';
  }
  /* a prop row: the label (Mixed under it when the selected elements differ), the control */
  function propRow(p, body, mixed) { return prow(T.propLabel(p), T.propTip(p), body, mixed); }
  function group(el, g, i) {
    var current = currentOf(g), mixed = current === T.MIXED;
    if (!g.preview && shortGroup(g)) {
      return propRow(g, '<div class="seg">' + g.options.map(function (o) {
        return '<button data-act="prop-group" data-prop="' + i + '" data-opt="' + (o[0] || '') + '" class="' + (o[0] === current ? 'on' : '') + '" title="' + esc(o[0] ? '.' + o[0] : 'no modifier') + '">' + esc(T.human(o[1])) + '</button>';
      }).join('') + '</div>', mixed);
    }
    if (!g.preview) {
      var cur = g.options.filter(function (o) { return o[0] === current; })[0];
      return propRow(g, '<button class="selectbtn" data-act="prop-group-menu" data-prop="' + i + '">' + esc(mixed ? 'Mixed' : cur ? T.human(cur[1]) : '—') + I('chevron-down', 12) + '</button>');
    }
    /* preview groups (button pattern, card pattern, severity…): a dropdown with a chip of the current look */
    var cur = g.options.filter(function (o) { return o[0] === current; })[0], chip = '';
    if (!mixed) {
      var pr = g.preview === 'card' ? T.probe(g.probe ? g.probe(current) : current, 'div') : T.probe((g.sample || '') + ' ' + (current || ''), g.tag);
      chip = '<span class="swatch-chip" style="background:' + pr.bg + ';' + (T.hasBorder(pr.border) ? 'box-shadow:inset 0 0 0 1px ' + pr.border.split(' ').slice(2).join(' ') : '') + '"></span>';
    }
    return propRow(g, '<button class="swatchbtn" data-act="prop-group-menu" data-prop="' + i + '">' + chip + '<span class="cname">' + esc(mixed ? 'Mixed' : cur ? T.human(cur[1]) : '—') + '</span>' + I('chevron-down', 12) + '</button>');
  }
  /* one select for a color prop with presets (React color values) and the whole palette */
  function colorSelect(el, p, i) {
    var val = inlineVar(el, p.cssVar), tok = tokenIn(val), preset = currentOf({ options: p.presets });
    var name = preset === T.MIXED ? 'Mixed' : val ? (tok ? tok.slice(2) : val) : (p.presets.filter(function (o) { return o[0] === preset; })[0] || [null, 'Default'])[1];
    var pr = T.probe((p.sample || '') + ' ' + (preset && preset !== T.MIXED ? preset : ''), 'span'), chip = val ? getComputedStyle(el).getPropertyValue(p.cssVar).trim() : pr.bg;
    return propRow(p, '<button class="swatchbtn" data-act="prop-colorselect" data-prop="' + i + '" title="Component colors and the whole palette">' +
      '<span class="swatch-chip" style="background:' + (chip || 'transparent') + '"></span><span class="cname">' + esc(name) + '</span>' + I('chevron-down', 12) + '</button>');
  }
  function colorRow(el, p, i) {
    var val = inlineVar(el, p.cssVar), tok = tokenIn(val), computed = getComputedStyle(el).getPropertyValue(p.cssVar).trim();
    return propRow(p, '<div class="colorrow">' +
      '<button class="swatchbtn" data-act="prop-color" data-prop="' + i + '" title="Pick any theme color">' +
      '<span class="swatch-chip" style="background:' + (computed || 'transparent') + '"></span><span class="cname">' + esc(tok ? tok.slice(2) : (val || 'Default')) + '</span>' + I('chevron-down', 12) + '</button>' +
      (val ? '<button class="ib" data-act="prop-color-clear" data-prop="' + i + '" title="Remove custom color">' + I('x', 14) + '</button>' : '') + '</div>');
  }
  /* swap options as a select (field type…): the same list as the component menu */
  function swapProp(el, p) {
    var sw = T.swapOf && T.swapOf(el);
    if (!sw) return '';
    var cur = sw.options.filter(function (o) { return o.id === sw.current; })[0];
    return propRow(p, '<button class="selectbtn" data-act="prop-swap-menu">' + esc(cur ? cur.label : '—') + I('chevron-down', 12) + '</button>');
  }
  T.action('prop-swap-menu', function (b) {
    var sw = T.swapOf(sel());
    if (sw) T.openMenu(b, sw.options.map(function (o) { return { label: o.label, act: 'swap', data: o.id, on: o.id === sw.current }; }));
  });
  /* the glyph opens the icon picker; the size is the segmented control below (not repeated) */
  function iconProp(el) {
    var ic = T.iconClass(el), entry = ic && T.glyphEntry(ic.slice(8));
    var size = K.ICON_SIZES.filter(function (s) { return s[0] && el.classList.contains(s[0]); })[0] || K.ICON_SIZES.filter(function (s) { return !s[0]; })[0];
    return prow('Icon', 'ReviewPro icon', '<button class="iconrow" data-act="icons-open" title="Change icon"><span class="iconprev glyph">' + (entry ? '<span class="rp-icon rp-icon-' + esc(T.glyphName(entry)) + '"></span>' : '?') + '</span>' +
      '<span class="iconname">' + esc(ic ? ic.slice(8) : 'no icon class') + '</span>' + I('chevron-down', 12) + '</button>') +
      prow('Size', 'Icon size', '<div class="seg">' + K.ICON_SIZES.map(function (s) { return '<button data-act="icon-size" data-size="' + s[0] + '" class="' + (size && size[0] === s[0] ? 'on' : '') + '" title="' + s[2] + 'px">' + s[1] + '</button>'; }).join('') + '</div>');
  }

  /* Props apply to all similar elements, except state props (selected, active, checked…): those stay per element */
  T.action('prop-group', function (b) { applyGroup(propsOf(sel())[+b.getAttribute('data-prop')], b.getAttribute('data-opt') || null); });
  T.action('prop-group-menu', function (b) {
    var i = +b.getAttribute('data-prop'), g = propsOf(sel())[i], current = currentOf(g);
    T.openMenu(b, g.options.map(function (o) { return { label: T.human(o[1]), act: 'prop-group-pick', data: i + ':' + (o[0] || ''), on: o[0] === current, hint: o[0] ? '' : 'default' }; }));
  });
  T.action('prop-group-pick', function (b) { var a = b.getAttribute('data-arg'), k = a.indexOf(':'); applyGroup(propsOf(sel())[+a.slice(0, k)], a.slice(k + 1) || null); });
  T.action('prop-colorselect', function (b) {
    var el = sel(), p = propsOf(el)[+b.getAttribute('data-prop')], preset = currentOf({ options: p.presets });
    T.openColorPicker(b, {
      title: T.propLabel(p), current: tokenIn(inlineVar(el, p.cssVar)),
      presets: p.presets.map(function (o) { var pr = T.probe((p.sample || '') + ' ' + (o[0] || ''), 'span'); return { key: o[0] || '', label: o[1], bg: pr.bg, color: pr.color, on: !inlineVar(el, p.cssVar) && o[0] === preset }; }),
      onPreset: function (cls) { applyGroup({ options: p.presets, clears: { vars: [p.cssVar, p.contrastVar].filter(Boolean) } }, cls || null); },
      onPick: function (token) { applyColorProp({ cssVar: p.cssVar, contrastVar: p.contrastVar, clearClasses: p.presets.map(function (o) { return o[0]; }).filter(Boolean) }, token); }
    });
  });
  function applyGroup(g, opt) {
    var single = g.options.some(function (o) { return T.isStateClass(o[0]); });
    T.runEach(function (el) {
      var remove = g.options.map(function (o) { return o[0]; }).filter(function (c) { return c && c !== opt && el.classList.contains(c); });
      var list = [];
      if (remove.length || (opt && !el.classList.contains(opt))) list.push(T.ops.cls(el, remove, [opt]));
      if (g.clears && g.clears.vars) {
        var ch = {};
        g.clears.vars.forEach(function (v) { if (inlineVar(el, v) || (T.stateOf(el).srcOriginal || '').indexOf(v) > -1) ch[v] = T.REMOVE; });
        if (Object.keys(ch).length) list.push(T.ops.style(el, ch));
      }
      return list;
    }, single);
  }
  T.action('prop-toggle', function (b) {
    var c = b.getAttribute('data-cls'), on = T.common(function (o) { return o.classList.contains(c); }) !== true; /* mixed → on for all */
    T.runEach(function (el) {
      if (el.classList.contains(c) === on) return null;
      return on ? T.ops.cls(el, [], [c]) : T.ops.cls(el, [c], []);
    }, T.isStateClass(c));
  });
  T.action('prop-color', function (b) {
    var el = sel(), p = propsOf(el)[+b.getAttribute('data-prop')];
    T.openColorPicker(b, {
      title: T.propLabel(p), current: tokenIn(inlineVar(el, p.cssVar)),
      onPick: function (token) { applyColorProp(p, token); }
    });
  });
  T.action('prop-color-clear', function (b) { applyColorProp(propsOf(sel())[+b.getAttribute('data-prop')], null); });
  function applyColorProp(p, token) {
    T.runEach(function (el) {
      var ch = {}, list = [];
      if (!token) { ch[p.cssVar] = T.REMOVE; if (p.contrastVar) ch[p.contrastVar] = T.REMOVE; }
      else {
        var c = K.color(token);
        ch[p.cssVar] = c.css;
        if (p.contrastVar) ch[p.contrastVar] = T.luminance(c.hex || T.resolveVar(token)) < 0.4 ? '#fff' : T.REMOVE;
        var presets = (p.clearClasses || []).filter(function (x) { return el.classList.contains(x); });
        if (presets.length) list.push(T.ops.cls(el, presets, []));
      }
      list.push(T.ops.style(el, ch));
      return list;
    });
  }
  T.action('icon-size', function (b) {
    var size = b.getAttribute('data-size');
    T.runEach(function (el) {
      var cur = K.ICON_SIZES.map(function (s) { return s[0]; }).filter(function (c) { return c && el.classList.contains(c); });
      if (!cur.length && !size) return null;
      return cur[0] !== size ? T.ops.cls(el, cur, size ? [size] : []) : null;
    });
  });

  /* ── Layout (auto layout, like Figma): type = horizontal · vertical · grid ──
     Flex: alignment box, direction, gap, space between. Grid: columns × rows (equal tracks;
     one item's track is its W / H in Size) and the two gaps. */
  T.section({
    id: 'layout', order: 20,
    when: function (el, ctx) { return /flex|grid/.test(ctx.cs.display); },
    render: function (el, ctx) {
      var cs = ctx.cs, col = cs.flexDirection.indexOf('column') === 0, gapVal = px(col ? cs.rowGap : cs.columnGap);
      var csOf = function (o) { return o === el ? cs : getComputedStyle(o); };
      var type = T.common(function (o) { var c = csOf(o); return /grid/.test(c.display) ? 'grid' : c.flexDirection.indexOf('column') === 0 ? 'column' : 'row'; }); /* T.MIXED when they differ */
      var types = '<div class="seg">' + [['row', 'dirRow', 'Horizontal'], ['column', 'dirCol', 'Vertical'], ['grid', 'layout-grid', 'Grid']].map(function (t) {
        return '<button data-act="dir" data-dir="' + t[0] + '" class="' + (type === t[0] ? 'on' : '') + '" title="' + t[2] + '">' + I(t[1], 14) + '</button>';
      }).join('') + '</div>';
      var tip = 'Auto layout: ' + (type === 'grid' ? 'grid columns, rows and gaps' : 'alignment, direction, gap');
      if (type === 'grid') return T.sec2('Layout', types + '<div class="grid3">' +
        T.field('grid-cols', I('columns-2', 12), T.fieldValue('grid-cols', el), { mod: ctx.mod('grid-template-columns'), title: 'Columns (equal width)' }) +
        T.field('grid-rows', I('rows-2', 12), T.fieldValue('grid-rows', el), { mod: ctx.mod('grid-template-rows'), title: 'Rows' }) + '<span></span>' +
        T.field('column-gap', I('gapH', 12), px(cs.columnGap), { mod: ctx.mod('column-gap') || ctx.mod('gap'), hot: 'gap', title: 'Horizontal gap (between columns)' }) +
        T.field('row-gap', I('gapV', 12), px(cs.rowGap), { mod: ctx.mod('row-gap') || ctx.mod('gap'), hot: 'gap', title: 'Vertical gap (between rows)' }) + '<span></span></div>', famReset('layout', { tip: tip }));
      var jc = cs.justifyContent, spread = /space-(between|around|evenly)/.test(jc);
      var pos = function (v) { return /center/.test(v) ? 1 : /end|right/.test(v) ? 2 : 0; };
      var main = T.common(function (o) { return pos(csOf(o).justifyContent); }), cross = T.common(function (o) { return pos(csOf(o).alignItems); }), cells = '';
      if (T.common(function (o) { return /space-/.test(csOf(o).justifyContent); }) === T.MIXED) spread = false;
      for (var yy = 0; yy < 3; yy++) for (var xx = 0; xx < 3; xx++) {
        var mainIdx = col ? yy : xx, crossIdx = col ? xx : yy;
        cells += '<button data-act="align" data-align="' + mainIdx + ',' + crossIdx + '" class="' + ((spread || mainIdx === main) && crossIdx === cross ? 'on' : '') + '"></button>';
      }
      return T.sec2('Layout', '<div class="alrow"><div class="align' + (spread ? ' spread' : '') + '"' + (ctx.mod('justify-content') || ctx.mod('align-items') ? ' style="box-shadow:inset 0 0 0 1px ' + BLUE + '"' : '') + '>' + cells + '</div>' +
        '<div class="alside">' + types +
        /* the gap icon follows the direction: items side by side or stacked */
        '<div class="gaprow">' + T.field('gap', I(col ? 'gapV' : 'gapH', 12), gapVal, { mod: ctx.mod('gap'), hot: 'gap', title: col ? 'Vertical gap between items' : 'Horizontal gap between items' }) +
        '<button class="ib' + (spread ? ' on' : '') + '" data-act="spread" title="Space between">' + I('spread', 14) + '</button></div></div></div>', famReset('layout', { tip: tip }));
    }
  });
  /* Same style change on every target (the selection + similar elements, see similar.js) */
  function styleAll(ch) { T.runEach(function (el) { return T.ops.style(el, ch); }); }
  T.styleAll = styleAll;
  /* type: flex row / column, or grid (columns = the items side by side now, like Figma's switch) */
  T.action('dir', function (b) {
    var d = b.getAttribute('data-dir');
    T.runEach(function (el) {
      var cs = getComputedStyle(el), ov = T.overridesOf(el), ch = {};
      if (d === 'grid') {
        if (/grid/.test(cs.display)) return null;
        var kids = Array.prototype.filter.call(el.children, function (k) { return !T.src.isOwnNode(k) && getComputedStyle(k).display !== 'none'; }).length;
        ch.display = 'grid';
        ch['grid-template-columns'] = 'repeat(' + (cs.flexDirection.indexOf('column') === 0 ? 1 : Math.max(1, Math.min(12, kids))) + ', minmax(0, 1fr))';
        return T.ops.style(el, ch);
      }
      if (/grid/.test(cs.display)) {
        ch.display = 'flex';
        ['grid-template-columns', 'grid-template-rows'].forEach(function (k) { if (ov.has(k)) ch[k] = null; });
      }
      if (cs.flexDirection !== d || ch.display) ch['flex-direction'] = d;
      return Object.keys(ch).length ? T.ops.style(el, ch) : null;
    });
  });
  T.action('spread', function () { styleAll({ 'justify-content': /space-/.test(getComputedStyle(sel()).justifyContent) ? 'flex-start' : 'space-between' }); });
  T.action('align', function (b) {
    var v = b.getAttribute('data-align').split(','), vals = ['flex-start', 'center', 'flex-end'], ch = { 'align-items': vals[+v[1]] };
    if (!/space-/.test(getComputedStyle(sel()).justifyContent)) ch['justify-content'] = vals[+v[0]];
    styleAll(ch);
  });

  /* ── Padding + margin, laid out like Figma's auto-layout panel ──
     Together: [horizontal (left + right)] [vertical (top + bottom)] [individual sides button]
     Individual: [left] [top] [button] / [right] [bottom]. Uneven sides always show individually. */
  var SIDES4 = [['left', 'L', 'Left'], ['top', 'T', 'Top'], ['right', 'R', 'Right'], ['bottom', 'B', 'Bottom']];
  function spacingBox(el, ctx, prop, hot, x, y, title) {
    var cs = ctx.cs, m = ctx.mod, f = T.field, v = {};
    SIDES4.forEach(function (sd) { v[sd[0]] = px(cs.getPropertyValue(prop + '-' + sd[0])); });
    var uneven = function (o) { var c = o === el ? cs : getComputedStyle(o), g = function (sd) { return px(c.getPropertyValue(prop + '-' + sd)); }; return g('top') !== g('bottom') || g('left') !== g('right'); };
    var open = S.sidesOpen[prop], four = open || T.selection().some(uneven);
    var btn = '<button class="ib' + (four ? ' on' : '') + '" data-act="sides" data-prop="' + prop + '" title="' + (!four ? 'Individual sides' : open ? 'Same value on both sides' : 'Sides differ: make them equal to combine') + '"' + (four && !open ? ' disabled' : '') + '>' + I('sides', 14) + '</button>';
    var cell = function (sd) { return f(prop + '-' + sd[0], I('pad' + sd[1], 12), v[sd[0]], { mod: m(prop + '-' + sd[0]), hot: hot, title: sd[2] + ' ' + prop }); };
    var body = '<div class="grid3">' + (four
      ? cell(SIDES4[0]) + cell(SIDES4[1]) + btn + cell(SIDES4[2]) + cell(SIDES4[3]) + '<span></span>'
      : f(x, I('padH', 12), v.left, { mod: m(prop + '-left') || m(prop + '-right'), hot: hot, title: 'Horizontal ' + prop + ' (left + right)' }) +
        f(y, I('padV', 12), v.top, { mod: m(prop + '-top') || m(prop + '-bottom'), hot: hot, title: 'Vertical ' + prop + ' (top + bottom)' }) + btn) + '</div>';
    return T.sec2(title, body, famReset(prop));
  }
  S.sidesOpen = { padding: false, margin: false };
  T.section({
    id: 'spacing', order: 30, when: function () { return true; },
    render: function (el, ctx) {
      return spacingBox(el, ctx, 'padding', 'pad', 'pad-x', 'pad-y', 'Padding') + spacingBox(el, ctx, 'margin', 'mar', 'mar-x', 'mar-y', 'Margin');
    }
  });
  T.action('sides', function (b) { var p = b.getAttribute('data-prop'); S.sidesOpen[p] = !S.sidesOpen[p]; T.renderInspector(); });

  /* ── Colors: one trigger per color (chip + name); the picker has the DS presets on top ── */
  var TRANSPARENT = 'rgba(0, 0, 0, 0)';
  /* name of a color: the token written inline, else the preset it matches, else None / the value */
  function colorName(list, computed, inline) {
    if (computed === T.MIXED) return 'Mixed';
    var tok = tokenIn(inline);
    if (tok) { var hit = list.filter(function (c) { return c[0] === tok; })[0]; return hit ? hit[1] : tok.slice(2); }
    if (!computed || computed === TRANSPARENT || computed === 'none') return 'None';
    var pre = list.filter(function (c) { return c[0] && T.resolveVar(c[0]) === computed; })[0];
    return pre ? pre[1] : paletteName(computed);
  }
  /* any CSS color (rgb, oklch…) → the palette shade it is ("Blue 800"), else its hex */
  var cv = document.createElement('canvas'), cx = null, names = {};
  cv.width = cv.height = 1;
  function rgbOf(css) {
    cx = cx || cv.getContext('2d', { willReadFrequently: true });
    cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = css; cx.fillRect(0, 0, 1, 1);
    return cx.getImageData(0, 0, 1, 1).data;
  }
  function paletteName(css) {
    if (names[css]) return names[css];
    var c = rgbOf(css), best = null, bd = 12;
    if (!c[3]) return (names[css] = 'None');
    Object.keys(K.PALETTE).forEach(function (hue) {
      K.PALETTE[hue].forEach(function (hex, i) {
        if (!hex) return;
        var n = parseInt(hex.slice(1), 16), d = Math.abs((n >> 16) - c[0]) + Math.abs((n >> 8 & 255) - c[1]) + Math.abs((n & 255) - c[2]);
        if (d < bd) { bd = d; best = hue[0].toUpperCase() + hue.slice(1) + ' ' + K.SHADES[i]; }
      });
    });
    return (names[css] = best || '#' + [c[0], c[1], c[2]].map(function (v) { return ('0' + v.toString(16)).slice(-2); }).join(''));
  }
  function colorTrigger(act, chip, name, title) {
    var empty = !chip || chip === TRANSPARENT || chip === 'none' || chip === T.MIXED;
    return '<button class="swatchbtn" data-act="' + act + '" title="' + esc(title) + '"><span class="swatch-chip' + (empty ? ' nonechip' : '') + '"' + (empty ? '' : ' style="background:' + chip + '"') + '></span><span class="cname">' + esc(name) + '</span>' + I('chevron-down', 12) + '</button>';
  }
  /* quick = the DS presets ([token | null, label]); null = None (only when the list has it) */
  function pickColor(b, title, list, current, onPick) {
    T.openColorPicker(b, { title: title, current: current, quick: list, onPick: onPick });
  }

  /* ── Text ── */
  T.section({
    id: 'text', order: 40,
    when: function (el) { return T.directTextNodes(el).length > 0 || T.isIcon(el); },
    render: function (el, ctx) {
      var cs = ctx.cs, color = T.common(function (o) { return getComputedStyle(o).color; });
      var trigger = colorTrigger('text-color', color, colorName(K.TEXT_COLORS, color, el.style.color), 'Text color: DS presets and the whole palette');
      if (T.isIcon(el)) return T.sec2('Color', trigger, famReset('text'));
      var fs = px(cs.fontSize), fw = T.common(function (o) { return String(getComputedStyle(o).fontWeight >= 600 ? 600 : 400); });
      var styleC = T.common(function (o) { var t = TEXT_STYLES.filter(function (x) { return x[0] && o.classList.contains(x[0]); })[0]; return t ? t[0] : null; });
      var styleName = styleC === T.MIXED ? 'Mixed' : TEXT_STYLES.filter(function (t) { return t[0] === styleC; })[0][1];
      return T.sec2('Text', '<div class="grid2">' +
        T.field('font-size', I('fontSize', 12), fs, { mod: ctx.mod('font-size'), title: 'Font size' }) +
        T.field('line-height', I('lineHeight', 12), T.fieldValue('line-height', el), { mod: ctx.mod('line-height'), title: 'Line height: a DS token (sm 1.27, md 1.3, lg 1.38, xl 1.64), a ratio or px · Auto = the font default' }) + '</div>' +
        '<div class="seg">' + K.WEIGHT.map(function (w) { return '<button data-act="weight" data-w="' + w[0] + '" class="' + (w[0] === fw ? 'on' : '') + '">' + w[1] + '</button>'; }).join('') + '</div>' +
        '<button class="selectbtn" data-act="text-style-menu" title="Text style (DS text classes)"><span class="sbk">' + I('type', 12) + esc(styleName) + '</span>' + I('chevron-down', 12) + '</button>' +
        trigger + alignRow(), famReset('text'));
    }
  });

  /* ── Text alignment (Figma): left · center · right, top · middle · bottom ──
     Text in a flex box (a button, a badge) moves with the box's alignment; elsewhere
     horizontal = text-align, vertical = align-content (block / grid) or vertical-align (table cell).
     Vertical alignment shows only when the box is taller than its text (Fixed size), like Figma. */
  var H_ALIGN = [['alignL', 'Align left', 'left'], ['alignC', 'Align center', 'center'], ['alignR', 'Align right', 'right']];
  var V_ALIGN = [['alignTop', 'Align top'], ['alignMid', 'Align middle'], ['alignBot', 'Align bottom']];
  var FLEX_POS = ['flex-start', 'center', 'flex-end'], BLOCK_POS = ['start', 'center', 'end'], CELL_POS = ['top', 'middle', 'bottom'];
  function axisPos(v) { return /center|middle/.test(v) ? 1 : /end|right|bottom/.test(v) ? 2 : 0; }
  function isFlex(cs) { return /flex/.test(cs.display); }
  function isCol(cs) { return cs.flexDirection.indexOf('column') === 0; }
  function hAlignOf(o) { var c = getComputedStyle(o); return isFlex(c) ? axisPos(isCol(c) ? c.alignItems : c.justifyContent) : axisPos(c.textAlign); }
  function vAlignOf(o) {
    var c = getComputedStyle(o);
    if (isFlex(c)) return axisPos(isCol(c) ? c.justifyContent : c.alignItems);
    return axisPos(c.display === 'table-cell' ? c.verticalAlign : c.alignContent);
  }
  function alignRow() {
    var h = T.common(hAlignOf), v = T.common(vAlignOf);
    var seg = function (list, cur, act) { return '<div class="seg">' + list.map(function (x, i) { return '<button data-act="' + act + '" data-i="' + i + '" class="' + (cur === i ? 'on' : '') + '" title="' + x[1] + '">' + I(x[0], 14) + '</button>'; }).join('') + '</div>'; };
    return '<div class="grid2">' + seg(H_ALIGN, h, 'text-align') + seg(V_ALIGN, v, 'text-valign') + '</div>';
  }
  T.action('text-align', function (b) {
    var i = +b.getAttribute('data-i');
    T.runEach(function (el) {
      var c = getComputedStyle(el), ch = { 'text-align': H_ALIGN[i][2] };
      if (isFlex(c)) ch[isCol(c) ? 'align-items' : 'justify-content'] = FLEX_POS[i];
      return T.ops.style(el, ch);
    });
  });
  T.action('text-valign', function (b) {
    var i = +b.getAttribute('data-i');
    T.runEach(function (el) {
      var c = getComputedStyle(el), ch = {};
      if (isFlex(c)) ch[isCol(c) ? 'justify-content' : 'align-items'] = FLEX_POS[i];
      else if (c.display === 'table-cell') ch['vertical-align'] = CELL_POS[i];
      else ch['align-content'] = BLOCK_POS[i];
      return T.ops.style(el, ch);
    });
  });

  /* ── Text layer resizing (Figma's Layout for text): auto width · auto height · fixed size ──
     A text layer = own text, no auto layout, only inline children (b, a, br, an icon…).
     Auto width: hugs the text on one line (nowrap). Auto height: the width stays (Fixed / Fill),
     the text wraps and the height follows. Fixed size: width and height in px.
     An inline element becomes inline-block so W / H apply. W / H stay in Size. */
  T.isTextLayer = function (el, cs) {
    if (!el || T.isIcon(el) || !T.directTextNodes(el).length || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return false;
    cs = cs || getComputedStyle(el);
    if (/flex|grid|table|none|contents/.test(cs.display)) return false;
    return Array.prototype.every.call(el.children, function (k) { return T.src.isOwnNode(k) || /^(inline|none|contents)/.test(getComputedStyle(k).display); });
  };
  /* the white-space the page gives the element without Tweak's inline value */
  function baseWhiteSpace(el) {
    var attr = el.getAttribute('style');
    el.style.removeProperty('white-space');
    var v = getComputedStyle(el).whiteSpace;
    if (attr === null) el.removeAttribute('style'); else el.setAttribute('style', attr);
    return v;
  }
  function nowrap(v) { return /nowrap|^pre$/.test(v); }
  /* Figma: the width follows the text = auto width; a Fixed / Fill width = auto height */
  function textMode(o) {
    if (T.sizeMode(o, 'h') === 'fixed') return 'fixed';
    return T.sizeMode(o, 'w') === 'hug' ? 'auto-w' : 'auto-h';
  }
  var TEXT_MODES = [['auto-w', 'textAutoW', 'Auto width: one line, the width follows the text'], ['auto-h', 'textAutoH', 'Auto height: the width stays, the text wraps'], ['fixed', 'textFixed', 'Fixed size: width and height in px']];
  T.section({
    id: 'text-layout', order: 20,
    when: function (el, ctx) { return T.isTextLayer(el, ctx.cs); },
    render: function () {
      var mode = T.common(textMode);
      return T.sec2('Layout', '<div class="seg">' + TEXT_MODES.map(function (m) {
        return '<button data-act="text-resize" data-mode="' + m[0] + '" class="' + (mode === m[0] ? 'on' : '') + '" title="' + m[2] + '">' + I(m[1], 14) + '</button>';
      }).join('') + '</div>', { tip: 'Resizing of a text layer, like Figma' });
    }
  });
  T.action('text-resize', function (b) {
    var mode = b.getAttribute('data-mode'), wMode = T.sizeMode(sel(), 'w');
    var keepW = wMode === 'fixed' || wMode === 'fill';
    var spec = mode === 'auto-w' ? { w: 'hug', h: 'hug' } : mode === 'auto-h' ? { h: 'hug' } : { h: 'fixed' };
    if (mode !== 'auto-w' && !keepW) spec.w = 'fixed';
    T.setSizes(spec, function (el) {
      var cs = getComputedStyle(el), ch = {};
      if (mode === 'auto-w') { if (!nowrap(cs.whiteSpace)) ch['white-space'] = 'nowrap'; return ch; }
      if (nowrap(cs.whiteSpace)) ch['white-space'] = nowrap(baseWhiteSpace(el)) ? 'normal' : null;
      if (cs.display === 'inline') ch.display = 'inline-block';
      return ch;
    });
  });
  T.action('weight', function (b) { styleAll({ 'font-weight': K.WEIGHT.filter(function (w) { return w[0] === b.getAttribute('data-w'); })[0][2] }); });
  T.action('text-style-menu', function (b) {
    var cur = T.common(function (o) { var t = TEXT_STYLES.filter(function (x) { return x[0] && o.classList.contains(x[0]); })[0]; return t ? t[0] : null; });
    T.openMenu(b, TEXT_STYLES.map(function (t) { return { label: t[1], act: 'text-style', data: t[0] || '', on: t[0] === cur, hint: t[0] ? '' : 'no class' }; }));
  });
  T.action('text-style', function (b) {
    var c = b.getAttribute('data-arg') || b.getAttribute('data-cls') || null;
    T.runEach(function (el) {
      var remove = TEXT_STYLES.map(function (t) { return t[0]; }).filter(function (x) { return x && x !== c && el.classList.contains(x); });
      return remove.length || (c && !el.classList.contains(c)) ? T.ops.cls(el, remove, [c]) : null;
    });
  });
  T.action('text-color', function (b) {
    pickColor(b, 'Text color', K.TEXT_COLORS, tokenIn(sel().style.color), function (t) { styleAll({ color: t ? K.color(t).css : null }); });
  });

  /* ── Fill ── */
  T.section({
    id: 'fill', order: 50, when: function () { return true; },
    render: function (el, ctx) {
      var bg = T.common(function (o) { return getComputedStyle(o).backgroundColor; });
      return T.sec2('Fill', colorTrigger('fill', bg, colorName(K.FILLS, bg, el.style.backgroundColor), 'Fill: DS presets and the whole palette'),
        famReset('fill'));
    }
  });
  T.action('fill', function (b) {
    pickColor(b, 'Fill', K.FILLS, tokenIn(sel().style.backgroundColor), function (t) { styleAll({ 'background-color': t === 'none' ? 'transparent' : t ? K.color(t).css : null }); });
  });

  /* ── Radius ── */
  T.section({
    id: 'radius', order: 52, when: function () { return true; },
    render: function (el, ctx) {
      var rad = px(ctx.cs.borderTopLeftRadius);
      return T.sec2('Radius', '<div class="grid3">' + T.field('border-radius', I('radius', 12), rad > 100 ? 9999 : rad, { mod: ctx.mod('border-radius'), title: 'Corner radius: a token from the list or any value' }) + '<span></span><span></span></div>', famReset('radius'));
    }
  });

  /* ── Stroke (border): color, width, style and sides, like Figma ──
     Sides: All, one side (only that side has a stroke) or Custom (a width per side).
     The panel reads the sides from the element: 4 equal sides = All, one side = that side,
     anything else = Custom. */
  var SIDES = ['top', 'right', 'bottom', 'left'];
  var SIDE_ICON = { all: 'square', top: 'padT', right: 'padR', bottom: 'padB', left: 'padL', custom: 'sides' };
  S.strokeSide = 'all';
  S.strokeCustom = null; /* the element whose sides are shown one by one (Custom) */
  function bprop(side, part) { return side === 'all' ? 'border-' + part : 'border-' + side + '-' + part; }
  function sideOf(cs, s) { var k = s[0].toUpperCase() + s.slice(1); return { width: px(cs['border' + k + 'Width']), style: cs['border' + k + 'Style'], color: cs['border' + k + 'Color'] }; }
  function shown(st) { return st.style !== 'none' && st.style !== 'hidden' && st.width > 0; }
  /* stroke shown in the panel: the chosen side, or for "All" the first visible side (+ mixed flag) */
  function strokeOf(cs, side) {
    if (side !== 'all') return sideOf(cs, side);
    var all = SIDES.map(function (s) { return sideOf(cs, s); }), vis = all.filter(shown);
    var key = function (st) { return shown(st) ? st.width + st.style + st.color : 'none'; };
    var st = vis[0] || all[0];
    st.mixed = all.some(function (o) { return key(o) !== key(all[0]); });
    return st;
  }
  /* all | top | right | bottom | left | custom, from the element's computed sides */
  function sidesMode(cs) {
    var all = SIDES.map(function (s) { return sideOf(cs, s); }), vis = SIDES.filter(function (s, i) { return shown(all[i]); });
    if (!vis.length || (vis.length === 4 && !strokeOf(cs, 'all').mixed)) return 'all';
    return vis.length === 1 ? vis[0] : 'custom';
  }
  function strokeChanges(el, side, part, value) {
    var cs = getComputedStyle(el), st = strokeOf(cs, side), ch = {}, ov = T.overridesOf(el);
    if (part === 'none') ch[bprop(side, 'style')] = 'none';
    else {
      ch[bprop(side, part)] = value;
      if (!shown(st)) { /* no stroke yet: give it a visible default */
        if (part !== 'width') ch[bprop(side, 'width')] = '1px';
        if (part !== 'style') ch[bprop(side, 'style')] = 'solid';
        if (part !== 'color') ch[bprop(side, 'color')] = 'var(--border)';
      }
    }
    /* "All" wins over earlier per-side edits of the same kind */
    if (side === 'all') SIDES.forEach(function (s) {
      ['width', 'style', 'color'].forEach(function (k) { if ((part === 'none' || ch[bprop('all', k)] !== undefined) && ov.has('border-' + s + '-' + k)) ch['border-' + s + '-' + k] = null; });
    });
    return ch;
  }
  T.strokeChanges = strokeChanges;
  T.strokeWidthOf = function (el, side) { var st = strokeOf(getComputedStyle(el), side || S.strokeSide); return shown(st) ? st.width : 0; };
  /* color / style go to the visible sides: the edited side, or all of them */
  function strokeAll(part, value) { var side = S.strokeSide; T.runEach(function (el) { return T.ops.style(el, strokeChanges(el, side, part, value)); }); }
  /* switch the sides: All = the current stroke on every side; one side = only there */
  function setSides(el, mode) {
    var cs = getComputedStyle(el), st = strokeOf(cs, 'all'), ch = {};
    var w = shown(st) ? st.width + 'px' : '1px', sty = shown(st) ? st.style : 'solid', col = shown(st) ? st.color : 'var(--border)';
    var tokenColor = el.style.getPropertyValue('border-color') || SIDES.map(function (s) { return el.style.getPropertyValue('border-' + s + '-color'); }).filter(Boolean)[0];
    if (tokenColor) col = tokenColor; /* keep var(--token) instead of the resolved rgb */
    T.overridesOf(el).forEach(function (v, p) { if (/^border-(top|right|bottom|left)-(width|style|color)$/.test(p)) ch[p] = null; });
    ch['border-width'] = mode === 'all' ? w : '0'; ch['border-style'] = sty; ch['border-color'] = col;
    if (mode !== 'all') ch['border-' + mode + '-width'] = w;
    return T.ops.style(el, ch);
  }

  T.section({
    id: 'stroke', order: 55, when: function () { return true; },
    render: function (el, ctx) {
      var mode = S.strokeCustom === el ? 'custom' : sidesMode(ctx.cs);
      S.strokeSide = mode === 'custom' ? 'all' : mode;
      var side = S.strokeSide, st = strokeOf(ctx.cs, side), on = shown(st);
      var colC = T.common(function (o) { var x = strokeOf(getComputedStyle(o), side); return shown(x) ? x.color : 'none'; });
      var styC = T.common(function (o) { var x = strokeOf(getComputedStyle(o), side); return shown(x) ? x.style : 'none'; });
      var inline = el.style.getPropertyValue(bprop(side, 'color')) || el.style.getPropertyValue('border-color');
      var html = colorTrigger('stroke-color', colC, colorName(K.STROKES, colC, inline), 'Stroke color: DS presets and the whole palette');
      var sidesBtn = '<button class="ib' + (mode !== 'all' ? ' on' : '') + '" data-act="stroke-sides" title="Sides: ' + (mode === 'all' ? 'all' : mode) + '">' + I(SIDE_ICON[mode], 14) + '</button>';
      var styleSeg = '<div class="seg">' + ['solid', 'dashed'].map(function (s) {
        return '<button data-act="stroke-style" data-v="' + s + '" class="' + (styC === s ? 'on' : '') + '">' + s[0].toUpperCase() + s.slice(1) + '</button>';
      }).join('') + '</div>';
      if (mode === 'custom') {
        var cell = function (s) { return T.field('stroke-' + s, I(SIDE_ICON[s], 12), T.strokeWidthOf(el, s), { title: s[0].toUpperCase() + s.slice(1) + ' stroke width' }); };
        html += '<div class="grid3"><div class="span2">' + styleSeg + '</div>' + sidesBtn + cell('left') + cell('top') + '<span></span>' + cell('right') + cell('bottom') + '<span></span></div>';
      } else {
        html += '<div class="grid3">' + T.field('stroke', I('strokeW', 12), on ? st.width : 0, { title: 'Stroke width: 1, 2 or any value' }) + styleSeg + sidesBtn + '</div>';
      }
      return T.sec2('Stroke', html, famReset('stroke'));
    }
  });
  T.action('stroke-sides', function (b) {
    var mode = S.strokeCustom === sel() ? 'custom' : sidesMode(getComputedStyle(sel()));
    T.openMenu(b, [['all', 'All'], ['top', 'Top'], ['bottom', 'Bottom'], ['left', 'Left'], ['right', 'Right'], ['custom', 'Custom']].map(function (m) {
      return { label: m[1], act: 'stroke-sides-pick', data: m[0], on: m[0] === mode };
    }));
  });
  T.action('stroke-sides-pick', function (b) {
    var m = b.getAttribute('data-arg');
    if (m === 'custom') { S.strokeCustom = sel(); T.renderInspector(); return; }
    S.strokeCustom = null;
    T.runEach(function (el) { return setSides(el, m); });
  });
  T.action('stroke-color', function (b) {
    pickColor(b, 'Stroke', K.STROKES, null, function (t) { if (t === 'none' || !t) strokeAll('none'); else strokeAll('color', K.color(t).css); });
  });
  T.action('stroke-style', function (b) { strokeAll('style', b.getAttribute('data-v')); });
})(window.DLTweakNS);
