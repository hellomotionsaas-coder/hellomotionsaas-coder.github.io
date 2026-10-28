// Theme colour for every hard-coded blue, in the panel and in the Studio frame (studio/index.html loads
// ../js/ms-tint.js before studio-tools.js).
// The ported panel CSS and the Studio's CSS were drawn in blue: light-blue pages and cards, navy text, blue
// glows and shadows. When the accent is not blue, apply(document, "#ff453a") rewrites each of those colours in
// the stylesheets (and in style="" attributes from the markup) to the same role in the accent's hue:
//   pale surfaces (lightness ≥ 75%) → a faint tint of the accent      dark navy text → a near-neutral ink
//   greyish blues (muted text, lines) → a quiet grey of the accent   real blues (buttons, glows) → the accent
// apply(document, null) puts the original blues back. Colours that are content, not chrome (AE label colours,
// palette swatches, template art, colour pickers), keep theirs: see KEEP.
// Published as MSUI.tint in the panel and MSStudio.tint in the Studio. Plain ES5 (After Effects 2020).
(function () {
  "use strict";

  var KEEP = /color-btn|swatch|saas-sw|saas-art|saas-palette|palette|\.mk\b|cp-|#cp|colorPicker|color-picker|kh-color|hue|rainbow|spectrum|label-col|ms-ico-dot|brand/i;
  var LITERAL = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b|rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*(?:,\s*[\d.]+%?\s*)?\)/g;

  function parse(s) {
    var h, m;
    if (s.charAt(0) === "#") {
      h = s.slice(1);
      if (h.length === 3 || h.length === 4) { h = h.replace(/./g, function (c) { return c + c; }); }
      return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1];
    }
    m = /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)(%?)\s*)?\)/.exec(s);
    if (!m) { return null; }
    return [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : m[5] ? +m[4] / 100 : +m[4]];
  }
  function toHsl(c) {
    var r = c[0] / 255, g = c[1] / 255, b = c[2] / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn, h = 0, s = 0;
    if (d) {
      s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
      h *= 60;
    }
    return [h, s, l];
  }
  function rgba(h, s, l, a) {
    var q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    function f(t) { t = (t + 360) % 360 / 360; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 0.5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; }
    var rgb = Math.round(f(h + 120) * 255) + ", " + Math.round(f(h) * 255) + ", " + Math.round(f(h - 120) * 255);
    return a < 1 ? "rgba(" + rgb + ", " + Math.round(a * 1000) / 1000 + ")" : "rgb(" + rgb + ")";
  }
  function isBlue(hsl) { return hsl[0] >= 188 && hsl[0] <= 252 && hsl[1] >= 0.22 && hsl[2] > 0.06 && hsl[2] < 0.995; }

  // One colour literal → the same role in the accent's hue, or the literal unchanged when it isn't a blue.
  var cache = {};
  function color(lit, accent) {
    var key = accent + lit;
    if (cache.hasOwnProperty(key)) { return cache[key]; }
    var c = parse(lit), out = lit;
    if (c) {
      var hsl = toHsl(c), t = toHsl(parse(accent)), grey = t[1] < 0.15, s = hsl[1], l = hsl[2];
      if (isBlue(hsl)) {
        if (l >= 0.75) { out = rgba(t[0], grey ? 0.04 : s * 0.22, l, c[3]); }                             // page, cards: a hint
        else if (l < 0.33) { out = rgba(t[0], grey ? 0.04 : Math.min(s, 0.35) * 0.5, l, c[3]); }          // ink
        else if (s < 0.5) { out = rgba(t[0], grey ? 0.03 : s * 0.3, l, c[3]); }                          // muted, lines
        else { out = rgba(t[0], grey ? 0.06 : Math.min(1, t[1] * (0.6 + s * 0.4)), Math.max(0.12, Math.min(0.92, l + (t[2] - 0.54) * 0.8)), c[3]); }   // accents, glows
      }
    }
    cache[key] = out;
    return out;
  }
  function hasBlue(v) {
    var m = String(v).match(LITERAL), i, c;
    if (!m) { return false; }
    for (i = 0; i < m.length; i++) { if ((c = parse(m[i])) && isBlue(toHsl(c))) { return true; } }
    return false;
  }
  function value(v, accent) { return String(v).replace(LITERAL, function (lit) { return color(lit, accent); }); }

  // Every declaration that holds a blue: in all stylesheets (with @media / @keyframes inside) and in the
  // markup's style="" attributes. Found once, before anything is rewritten, so the originals stay known.
  // A shorthand that uses a var() (background: linear-gradient(90deg, #1760ff 0 var(--fill), …)) keeps its
  // text only on the shorthand; its longhands read empty. Those are found by name.
  var SHORT = ["background", "border", "border-top", "border-right", "border-bottom", "border-left", "border-color", "outline", "text-decoration"];
  function collect(style, out) {
    var i, p, v;
    for (i = 0; i < style.length; i++) {
      p = style[i]; v = style.getPropertyValue(p);
      if (v && v.indexOf("url(") < 0 && hasBlue(v)) { out.push({ s: style, p: p, v: v, pr: style.getPropertyPriority(p) }); }
    }
    for (i = 0; i < SHORT.length; i++) {
      p = SHORT[i]; v = style.getPropertyValue(p);
      if (v && v.indexOf("var(") >= 0 && v.indexOf("url(") < 0 && hasBlue(v)) { out.push({ s: style, p: p, v: v, pr: style.getPropertyPriority(p) }); }
    }
  }
  function scan(doc) {
    var out = [], i, j, rules;
    function walk(list) {
      for (var k = 0; k < list.length; k++) {
        var r = list[k];
        if (r.style) {
          if (!(r.selectorText && KEEP.test(r.selectorText))) { collect(r.style, out); }
        } else if (r.cssRules) { walk(r.cssRules); }
      }
    }
    for (i = 0; i < doc.styleSheets.length; i++) {
      try { rules = doc.styleSheets[i].cssRules; } catch (e) { rules = null; }
      if (rules) { walk(rules); }
    }
    var els = doc.querySelectorAll("[style]");
    for (j = 0; j < els.length; j++) {
      var el = els[j], keep = false, n;
      for (n = el; n && n.nodeType === 1 && !keep; n = n.parentNode) {
        keep = KEEP.test(n.className && n.className.baseVal !== undefined ? n.className.baseVal : n.className || "") || KEEP.test(n.id || "") || n.hasAttribute("data-ms-keep-color");
      }
      if (!keep) { collect(el.style, out); }
    }
    return out;
  }

  var found = [];   // [{ doc, recs }]
  function apply(doc, accent) {
    var entry = null, i;
    for (i = 0; i < found.length; i++) { if (found[i].doc === doc) { entry = found[i]; } }
    if (!entry) {
      if (!accent) { return; }   // still all original blues: nothing to undo
      entry = { doc: doc, recs: scan(doc) };
      found.push(entry);
    }
    for (i = 0; i < entry.recs.length; i++) {
      var r = entry.recs[i], v = accent ? value(r.v, accent) : r.v;
      if (r.s.getPropertyValue(r.p) !== v) { r.s.setProperty(r.p, v, r.pr); }
    }
  }

  var api = { apply: apply, color: color, value: value, isBlue: function (lit) { var c = parse(lit); return !!c && isBlue(toHsl(c)); } };
  if (typeof window !== "undefined") {
    if (window.MSUI) { window.MSUI.tint = api; }
    if (window.MSStudio) { window.MSStudio.tint = api; }
  }
  if (typeof module !== "undefined" && module.exports) { module.exports = api; }   // scripts/check.js
})();
