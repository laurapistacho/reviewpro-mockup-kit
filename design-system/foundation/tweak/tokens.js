/* Tweak mode — DS tokens. Values mirror shared.css :root (the production theme ui-app.ts). */
(function (T) {
  'use strict';
  var K = T.tokens = {};
  /* spacing = theme.spacing(n): --spacing-{n} */
  K.SPACE = [[0, null], [2, '--spacing-0-25'], [4, '--spacing-0-5'], [8, '--spacing-1'], [12, '--spacing-1-5'], [16, '--spacing-2'], [20, '--spacing-2-5'], [24, '--spacing-3'], [32, '--spacing-4'], [40, '--spacing-5'], [48, '--spacing-6']];
  K.FONT = [[12, '--font-size-caption'], [14, '--font-size-body2'], [16, '--font-size-body1'], [20, '--font-size-h6'], [34, '--font-size-h4']];
  K.RADIUS = [[0, null], [4, '--radius-xs'], [8, '--radius-s'], [12, '--radius-m'], [16, '--radius-l'], [9999, '--radius-round']];
  K.STROKE = [[0, null], [1, null], [2, null]]; /* no stroke-width tokens: presets only */
  K.COUNT = [[1, null], [2, null], [3, null], [4, null], [6, null], [12, null]]; /* grid columns / rows */
  /* line height: a ratio of the font size (0 = Auto). Figma: Body02 22/14, Body01 24/16, Title 28/20, Caption 18/12 */
  K.LINE = [[0, null], [1, null], [1.17, null], [1.4, null], [1.5, null], [1.57, null]];
  K.SCALES = { space: K.SPACE, font: K.FONT, radius: K.RADIUS, stroke: K.STROKE, count: K.COUNT, line: K.LINE };
  K.WEIGHT = [['400', 'Regular', 'var(--font-regular)'], ['500', 'Medium', 'var(--font-medium)'], ['600', 'Semibold', 'var(--font-semibold)'], ['700', 'Bold', 'var(--font-bold)']];
  K.TEXT_COLORS = [['--text-primary', 'Primary'], ['--text-secondary', 'Secondary'], ['--text-active', 'Active (link)'], ['--text-hint', 'Hint'], ['--text-error', 'Error'], ['--text-success', 'Success'], ['--brand-rpp70', 'Brand'], ['--text-inverse', 'White']];
  K.FILLS = [[null, 'None'], ['--background-paper', 'Paper (white)'], ['--background-default', 'Background'], ['--background-secondary', 'Secondary'], ['--background-edit', 'Edit'], ['--blue-05', 'Blue 05'], ['--green-10', 'Green 10'], ['--red-10', 'Red 10'], ['--yellow-10', 'Yellow 10']];
  K.STROKES = [[null, 'None'], ['--divider', 'Divider'], ['--neutral-30', 'Neutral 30'], ['--neutral-main', 'Neutral main'], ['--blue-60', 'Blue 60'], ['--brand-rpp70', 'Brand'], ['--red-main', 'Red'], ['--green-40', 'Green 40']];
  /* icon sizes: '' = the default (24px, no class) */
  K.ICON_SIZES = [['rp-icon-size-12', '12', 12], ['rp-icon-size-16', '16', 16], ['rp-icon-size-20', '20', 20], ['', '24', 24], ['rp-icon-size-32', '32', 32], ['rp-icon-size-48', '48', 48]];
  /* Full theme palette (palette.{hue}.{hue}_{shade}). Hue → one value per shade */
  K.SHADES = ['05', '10', '20', '30', '40', '50', '60', '70', '80', '90'];
  K.PALETTE = {
    blue: ['#EBF2F8', '#D9E5EE', '#BFD3E3', '#9FBDD5', '#7FA7C7', '#5F91B9', '#35678F', '#2A5272', '#203E56', '#003350'],
    neutral: ['#F8F8F8', '#E4E4E4', '#D2D2D2', '#BBBBBB', '#A4A4A4', '#8E8E8E', '#636363', '#4F4F4F', '#3C3C3C', '#282828'],
    green: [null, '#D0E4D6', '#B1D2BB', '#8ABC9A', '#63A678', '#3C8F56', '#12652B', '#0E5123', '#0B3D1A', '#072811'],
    red: [null, '#F6CCCE', '#F0AAAE', '#E98086', '#E2555D', '#DA2A34', '#B0000A', '#8D0008', '#6A0006', '#460004'],
    orange: [null, '#F6DFCC', '#F0CAAA', '#E9AF80', '#E29455', '#DA7A2A', '#B04F00', '#8D3F00', '#6A3000', '#462000'],
    yellow: [null, '#FBEDD6', '#F8E1BA', '#F4D398', '#F0C476', '#EDB553', '#C28A29', '#9B6F21', '#755319', '#4E3710'],
    brand: ['#F1F9FF', '#D5ECFF', '#AED0FF', '#93B4FF', '#60A5FA', '#3B82F6', '#0141D8', '#014CB7', '#02519B', '#1E3A8A']
  };
  /* null = a shade the theme does not define (green, red, orange, yellow have no 05) */
  K.tokenName = function (hue, shade) { return hue === 'brand' ? '--brand-rpp' + shade : '--' + hue + '-' + shade; };
  /* Transparent overlays (rgba of palette.background.black / white) */
  K.OVERLAYS = {
    dark: [[5, 'rgba(25,28,29,0.05)'], [10, 'rgba(25,28,29,0.10)'], [20, 'rgba(25,28,29,0.20)'], [40, 'rgba(25,28,29,0.40)'], [50, 'rgba(0,0,0,0.50)']],
    light: [[10, 'rgba(255,255,255,0.10)'], [20, 'rgba(255,255,255,0.20)'], [60, 'rgba(255,255,255,0.60)'], [80, 'rgba(255,255,255,0.80)']]
  };
  /* token name ('--blue-60', '--brand-rpp70', '--overlay-dark-10') → { token, hex, css } */
  K.color = function (token) {
    var hex = null, m = /^--(blue|neutral|green|red|orange|yellow)-(\d\d)$/.exec(token) || /^--(brand)-rpp(\d\d)$/.exec(token);
    if (m && K.PALETTE[m[1]]) hex = K.PALETTE[m[1]][K.SHADES.indexOf(m[2])] || null;
    var o = /^--overlay-(dark|light)-(\d+)$/.exec(token);
    if (o) { var hit = K.OVERLAYS[o[1]].filter(function (x) { return x[0] === +o[2]; })[0]; hex = hit ? hit[1] : null; }
    return { token: token, hex: hex, css: o ? 'var(' + token + ', ' + hex + ')' : 'var(' + token + ')' };
  };
  /* Resolve any CSS color / var() to an rgb() string in the page */
  var cache = {};
  T.resolveVar = function (token) {
    if (cache[token]) return cache[token];
    var t = document.createElement('span');
    t.style.color = /^--/.test(token) ? 'var(' + token + ')' : token;
    document.body.appendChild(t);
    cache[token] = getComputedStyle(t).color;
    t.remove();
    return cache[token];
  };
  /* Relative luminance 0..1 of a #hex or rgb() color */
  T.luminance = function (color) {
    var r, g, b, m = /^#([0-9a-f]{6})$/i.exec(color);
    if (m) { r = parseInt(m[1].slice(0, 2), 16); g = parseInt(m[1].slice(2, 4), 16); b = parseInt(m[1].slice(4), 16); }
    else { var n = (color.match(/[\d.]+/g) || [0, 0, 0]).map(Number); r = n[0]; g = n[1]; b = n[2]; }
    var f = function (c) { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  /* the DS token for a value, only when the page defines it (a page without shared.css gets plain px) */
  var defined = {};
  T.tokenFor = function (scale, n) {
    var t = K.SCALES[scale].filter(function (s) { return s[0] === n; })[0];
    t = t ? t[1] : undefined;
    if (t && !(t in defined)) defined[t] = !!getComputedStyle(document.documentElement).getPropertyValue(t).trim();
    return t && defined[t] ? t : undefined;
  };
})(window.DLTweakNS);
