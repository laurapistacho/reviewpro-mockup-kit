/* Tweak mode — source engine (pure functions, no UI).
   Tokenizes the original HTML file text into a tree with exact offsets, aligns it with the
   live DOM, and rewrites single attributes. Edits are applied as text patches, so everything
   the editor did not touch stays byte-identical. */
(function (T) {
  'use strict';
  var S = T.src = {};
  var VOID = { area: 1, base: 1, br: 1, col: 1, embed: 1, hr: 1, img: 1, input: 1, link: 1, meta: 1, param: 1, source: 1, track: 1, wbr: 1 };
  var RAW = { script: 1, style: 1, textarea: 1, title: 1 };

  /* text → { tag:'#root', children:[node] }; node = { tag, attrs, start, openEnd, closeStart, end, children, parent } */
  S.parse = function (text) {
    var lower = text.toLowerCase(), len = text.length;
    var root = { tag: '#root', children: [], start: 0, openEnd: 0, closeStart: len, end: len, attrs: {} };
    var stack = [root], i = 0;
    var nameRe = /<([a-zA-Z][\w:-]*)/y, endRe = /<\/([a-zA-Z][\w:-]*)[^>]*>/y;
    while (i < len) {
      var lt = text.indexOf('<', i);
      if (lt < 0) break;
      if (text.startsWith('<!--', lt)) { var ce = text.indexOf('-->', lt + 4); i = ce < 0 ? len : ce + 3; continue; }
      var c1 = text[lt + 1];
      if (c1 === '!' || c1 === '?') { var ge = text.indexOf('>', lt); i = ge < 0 ? len : ge + 1; continue; }
      if (c1 === '/') {
        endRe.lastIndex = lt;
        var em = endRe.exec(text);
        if (!em) { i = lt + 1; continue; }
        var etag = em[1].toLowerCase();
        for (var k = stack.length - 1; k > 0; k--) {
          if (stack[k].tag === etag) {
            while (stack.length - 1 > k) { var open = stack.pop(); open.closeStart = open.end = lt; }
            var node = stack.pop(); node.closeStart = lt; node.end = endRe.lastIndex;
            break;
          }
        }
        i = endRe.lastIndex;
        continue;
      }
      nameRe.lastIndex = lt;
      var nm = nameRe.exec(text);
      if (!nm) { i = lt + 1; continue; }
      var tag = nm[1].toLowerCase(), j = nameRe.lastIndex, q = null;
      for (; j < len; j++) {
        var ch = text[j];
        if (q) { if (ch === q) q = null; } else if (ch === '"' || ch === "'") q = ch; else if (ch === '>') break;
      }
      var openEnd = Math.min(j + 1, len);
      var tagText = text.slice(lt, openEnd);
      var n = { tag: tag, start: lt, openEnd: openEnd, closeStart: openEnd, end: openEnd, children: [], parent: stack[stack.length - 1], attrs: S.parseAttrs(tagText) };
      n.parent.children.push(n);
      if (VOID[tag] || /\/\s*>$/.test(tagText)) { i = openEnd; continue; }
      if (RAW[tag]) {
        var cs = lower.indexOf('</' + tag, openEnd);
        if (cs < 0) cs = len;
        n.closeStart = cs;
        var ge2 = text.indexOf('>', cs);
        n.end = ge2 < 0 ? len : ge2 + 1;
        i = n.end;
        continue;
      }
      stack.push(n);
      i = openEnd;
    }
    while (stack.length > 1) { var u = stack.pop(); u.closeStart = u.end = len; }
    return root;
  };

  S.parseAttrs = function (tagText) {
    var out = {}, re = /\s([^\s=\/>"']+)(?:\s*=\s*("[^"]*"|'[^']*'|[^\s>]+))?/g, m;
    while ((m = re.exec(tagText))) {
      var v = m[2] || '';
      if (v[0] === '"' || v[0] === "'") v = v.slice(1, -1);
      out[m[1].toLowerCase()] = v;
    }
    return out;
  };

  /* Elements the editor or shared.js injected into the page (never part of the file):
     data-dl-runtime marks decorations shared.js draws (e.g. tree lines) */
  S.isOwnNode = function (el) {
    return el.id === 'dl-tweak-host' || el.id === 'dlToastStack' || el.hasAttribute('data-dl-probe') || el.hasAttribute('data-dl-preview') || el.hasAttribute('data-dl-runtime');
  };

  /* live element ↔ source node, matching by tag + id + shared class; script-made elements are skipped */
  S.compatible = function (el, node) {
    if (!node || el.tagName.toLowerCase() !== node.tag) return false;
    if (node.attrs.id && el.id && node.attrs.id !== el.id) return false;
    var cls = (node.attrs.class || '').split(/\s+/).filter(Boolean);
    if (!cls.length) return true;
    for (var i = 0; i < cls.length; i++) if (cls[i].indexOf('{') < 0 && el.classList.contains(cls[i])) return true;
    return false;
  };
  S.align = function (srcRoot) {
    var map = new Map();
    var html = srcRoot.children.filter(function (c) { return c.tag === 'html'; })[0];
    if (html) alignEl(document.documentElement, html, map);
    return map;
  };
  function alignEl(el, node, map) { map.set(el, node); alignChildren(el, node.children, 0, map); }
  function alignChildren(el, list, si, map) {
    var kids = el.children;
    for (var li = 0; li < kids.length; li++) {
      var L = kids[li];
      if (S.isOwnNode(L)) continue;
      var tag = L.tagName.toLowerCase();
      if (tag === 'tbody' && !(list[si] && list[si].tag === 'tbody')) { si = alignChildren(L, list, si, map); continue; }
      var k = -1;
      for (var a = si; a < Math.min(list.length, si + 4); a++) { if (S.compatible(L, list[a])) { k = a; break; } }
      if (k < 0) continue;
      alignEl(L, list[k], map);
      si = k + 1;
    }
    return si;
  }

  /* Rewrite one attribute inside an opening tag, keep the rest verbatim ('' removes it) */
  S.setAttr = function (tagText, name, value) {
    var re = new RegExp('(\\s' + name + '\\s*=\\s*)("([^"]*)"|\'([^\']*)\')', 'i'), m = re.exec(tagText);
    if (m) {
      if (!value) return tagText.slice(0, m.index) + tagText.slice(m.index + m[0].length);
      var quote = m[2][0];
      return tagText.slice(0, m.index) + m[1] + quote + value.replace(new RegExp(quote, 'g'), quote === '"' ? "'" : '"') + quote + tagText.slice(m.index + m[0].length);
    }
    if (!value) return tagText;
    var close = /\s*\/?>$/.exec(tagText);
    return tagText.slice(0, close.index) + ' ' + name + '="' + value + '"' + tagText.slice(close.index);
  };

  S.splitDecls = function (css) {
    var out = [], depth = 0, cur = '', q = null;
    for (var i = 0; i < css.length; i++) {
      var c = css[i];
      if (q) { if (c === q) q = null; } else if (c === '"' || c === "'") q = c;
      else if (c === '(') depth++; else if (c === ')') depth--;
      else if (c === ';' && !depth) { if (cur.trim()) out.push(cur.trim()); cur = ''; continue; }
      cur += c;
    }
    if (cur.trim()) out.push(cur.trim());
    return out.map(function (d) { var p = d.indexOf(':'); return [d.slice(0, p).trim().toLowerCase(), d.slice(p + 1).trim()]; })
      .filter(function (d) { return d[0]; });
  };
  /* original style text + Map(prop → value | null) → new style text (null removes the prop) */
  S.mergeStyle = function (original, overrides) {
    var decls = S.splitDecls(original || ''), clash = false, removes = false;
    overrides.forEach(function (v, p) { if (v === null) removes = true; if (decls.some(function (d) { return d[0] === p; })) clash = true; });
    if (!clash && !removes) { /* keep the author's formatting, only append */
      var add = [];
      overrides.forEach(function (v, p) { add.push(p + ': ' + v); });
      var base = (original || '').trim().replace(/;\s*$/, '');
      return add.length ? (base ? base + '; ' : '') + add.join('; ') : (original || '');
    }
    overrides.forEach(function (value, prop) {
      if (value === null) { decls = decls.filter(function (d) { return d[0] !== prop; }); return; }
      var hit = decls.filter(function (d) { return d[0] === prop; });
      if (hit.length) hit.forEach(function (d) { d[1] = value; }); else decls.push([prop, value]);
    });
    return decls.map(function (d) { return d[0] + ': ' + d[1]; }).join('; ');
  };
  S.escapeText = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); };
  S.decode = function (s) { var t = document.createElement('textarea'); t.innerHTML = s; return t.value; };

  /* Re-indent a multi-line snippet to `indent` (first line not indented — caller places it) */
  S.indentSnippet = function (html, indent) {
    return html.split('\n').map(function (l, i) { return i ? indent + l : l; }).join('\n');
  };
})(window.DLTweakNS);
