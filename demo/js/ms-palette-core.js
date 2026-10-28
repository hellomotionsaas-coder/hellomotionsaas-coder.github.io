/*
 * MotionSaaS — Palettes: colour maths shared by every palette in the panel (js/ms-palettes.js) and by
 * scripts/check.js. No DOM here.
 * - hex / rgb / hsl conversions, readable text colour on a swatch, colour names for swatch titles
 * - harmony(base, mode, n): analogous, complementary, split, triadic, tetradic, monochrome, shades, random
 * - mood(text): a local "describe a vibe" palette (no account or API key)
 * - ase(palettes) / parseAse(bytes): Adobe Swatch Exchange, the swatch file Illustrator, Photoshop and
 *   InDesign read and write
 * Published as MSUI.paletteCore in the panel, MSStudio.paletteCore in the Studio (+ module.exports).
 */
(function (root) {
  "use strict";

  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function norm(v) {
    var h = String(v || "").replace(/[^0-9a-f]/gi, "").toUpperCase();
    if (h.length === 3) h = h.charAt(0) + h.charAt(0) + h.charAt(1) + h.charAt(1) + h.charAt(2) + h.charAt(2);
    return h.length === 6 ? "#" + h : null;
  }
  function rgb(hex) {
    var h = norm(hex) || "#000000";
    return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)];
  }
  function hex(r, g, b) {
    function x(v) { var s = Math.round(clamp(v, 0, 255)).toString(16).toUpperCase(); return s.length < 2 ? "0" + s : s; }
    return "#" + x(r) + x(g) + x(b);
  }
  // → [h 0–360, s 0–100, l 0–100]
  function hsl(h) {
    var c = rgb(h), r = c[0] / 255, g = c[1] / 255, b = c[2] / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b),
      l = (mx + mn) / 2, s = 0, hu = 0, d = mx - mn;
    if (d > 0) {
      s = d / (1 - Math.abs(2 * l - 1));
      if (mx === r) hu = ((g - b) / d) % 6; else if (mx === g) hu = (b - r) / d + 2; else hu = (r - g) / d + 4;
      hu *= 60;
      if (hu < 0) hu += 360;
    }
    return [hu, s * 100, l * 100];
  }
  function fromHsl(h, s, l) {
    h = ((h % 360) + 360) % 360; s = clamp(s, 0, 100) / 100; l = clamp(l, 0, 100) / 100;
    var k = function (n) { return (n + h / 30) % 12; }, a = s * Math.min(l, 1 - l);
    var f = function (n) { return l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))); };
    return hex(f(0) * 255, f(8) * 255, f(4) * 255);
  }
  // WCAG relative luminance, and the text colour that reads best on a swatch.
  function luminance(h) {
    var c = rgb(h).map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  function ink(h) { return luminance(h) > 0.42 ? "#111111" : "#FFFFFF"; }
  function contrast(a, b) { var x = luminance(a), y = luminance(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }

  var NAMES = [[0, "Red"], [18, "Vermilion"], [30, "Orange"], [45, "Amber"], [55, "Yellow"], [75, "Lime"], [100, "Green"], [150, "Emerald"],
    [170, "Teal"], [190, "Cyan"], [205, "Sky"], [220, "Blue"], [240, "Indigo"], [262, "Violet"], [285, "Purple"], [305, "Magenta"],
    [325, "Pink"], [345, "Rose"], [360, "Red"]];
  // A friendly name for a colour ("Deep teal", "Pale pink", "Grey").
  function name(h) {
    var c = hsl(h), i, best = NAMES[0][1], pre = "";
    if (c[1] < 10) { return c[2] > 92 ? "White" : c[2] < 9 ? "Black" : c[2] > 65 ? "Light grey" : c[2] < 30 ? "Charcoal" : "Grey"; }
    for (i = 0; i < NAMES.length; i++) { if (c[0] >= NAMES[i][0] - 8) best = NAMES[i][1]; }
    if (c[2] > 80) pre = "Pale "; else if (c[2] > 64) pre = "Light "; else if (c[2] < 22) pre = "Deep "; else if (c[2] < 36) pre = "Dark ";
    return pre ? pre + best.toLowerCase() : best;
  }

  // Seeded random (so a "Generate" is repeatable from its seed).
  function rnd(seed) { var s = (seed >>> 0) || 1; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

  var MODES = [
    ["analogous", "Analogous"], ["complementary", "Complementary"], ["split", "Split"], ["triadic", "Triadic"],
    ["tetradic", "Tetradic"], ["mono", "Monochrome"], ["shades", "Shades"], ["random", "Surprise me"]
  ];
  // n colours that sit well with `base` (which is always the first one).
  function harmony(base, mode, n, seed) {
    var b = hsl(norm(base) || "#635BFF"), H = b[0], S = Math.max(b[1], 18), L = clamp(b[2], 18, 82), out = [norm(base) || "#635BFF"], i, r = rnd(seed || 7), hues;
    n = clamp(Math.round(n || 5), 2, 10);
    if (mode === "mono") {
      for (i = 1; i < n; i++) out.push(fromHsl(H, S * (1 - i * 0.08), clamp(L + (i % 2 ? 1 : -1) * Math.ceil(i / 2) * (60 / n), 8, 94)));
      return out;
    }
    if (mode === "shades") {
      for (i = 1; i < n; i++) out.push(fromHsl(H, S, clamp(L + (i / (n - 1)) * (L > 50 ? -L + 10 : 92 - L), 6, 96)));
      return out;
    }
    hues = { analogous: [-30, 30, -60, 60], complementary: [180, 0, 180, 0], split: [150, 210, 0, 180], triadic: [120, 240, 120, 240], tetradic: [90, 180, 270, 0] }[mode];
    for (i = 1; i < n; i++) {
      var dh, s2, l2;
      if (mode === "random" || !hues) { dh = i * 137.508 + r() * 40 - 20; s2 = clamp(S + r() * 30 - 15, 25, 95); l2 = clamp(30 + r() * 50, 12, 90); }
      else {
        dh = hues[(i - 1) % hues.length];
        s2 = clamp(S + (i % 2 ? -10 : 6), 12, 98);
        l2 = clamp(L + (i > hues.length ? (i % 2 ? 22 : -22) : (i % 2 ? 10 : -10)), 10, 92);
      }
      out.push(fromHsl(H + dh, s2, l2));
    }
    return out;
  }

  // Describe a vibe → a palette. Known moods steer hue, saturation and lightness; anything else is seeded by
  // the words themselves, so the same words always give the same colours.
  var MOODS = [
    [/cyber|neon|synth|night ?city/, [300, 190, 265, 330, 175], 90, 55],
    [/vintage|retro|70s|film|sepia/, [28, 12, 45, 160, 350], 45, 55],
    [/ocean|sea|beach|aqua|wave/, [195, 185, 210, 170, 45], 70, 52],
    [/forest|nature|earth|green|eco/, [130, 95, 75, 35, 160], 45, 42],
    [/sunset|warm|summer|fire/, [12, 32, 345, 48, 280], 85, 58],
    [/luxury|gold|premium|elegant/, [45, 40, 0, 220, 30], 55, 45],
    [/pastel|soft|dream|kawaii|candy/, [330, 200, 270, 150, 40], 70, 82],
    [/saas|startup|tech|product|app|fintech/, [222, 252, 190, 160, 330], 85, 58],
    [/dark|mono|minimal|noir/, [230, 230, 230, 210, 200], 10, 25],
    [/ice|winter|cold|frost/, [200, 190, 215, 180, 230], 55, 78],
    [/coffee|chocolate|autumn|fall|cozy/, [25, 18, 35, 10, 45], 45, 40],
    [/spring|fresh|mint|garden/, [140, 90, 160, 50, 320], 60, 70]
  ];
  function hashStr(str) { var h = 2166136261, i; for (i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = (h * 16777619) >>> 0; } return h; }
  function mood(text, n) {
    var p = String(text || "").trim().toLowerCase(), hit = null, s = hashStr(p), cols = [], i, r = rnd(s);
    n = clamp(Math.round(n || 5), 2, 10);
    for (i = 0; i < MOODS.length; i++) if (MOODS[i][0].test(p)) { hit = MOODS[i]; break; }
    for (i = 0; i < n; i++) {
      var hue = hit ? hit[1][i % 5] + r() * 14 - 7 : (s % 360) + i * 47;
      var sat = hit ? hit[2] : 60 + r() * 30, lig = hit ? hit[3] + ((i % 2) ? 8 : -6) : 45 + r() * 25;
      cols.push(fromHsl(hue, clamp(sat, 5, 100), clamp(lig, 8, 92)));
    }
    return cols;
  }

  /* ------------------------------------------------ Adobe Swatch Exchange */

  // palettes: [{ name, colors: ["#RRGGBB", …] }] → Uint8Array (one group per palette).
  function ase(palettes) {
    var blocks = [], total = 12, i, j;
    function str(s) { s = String(s); var a = [], k; a.push((s.length + 1) >> 8, (s.length + 1) & 255); for (k = 0; k < s.length; k++) { a.push(s.charCodeAt(k) >> 8, s.charCodeAt(k) & 255); } a.push(0, 0); return a; }
    function f32(v) { var b = new DataView(new ArrayBuffer(4)); b.setFloat32(0, v); return [b.getUint8(0), b.getUint8(1), b.getUint8(2), b.getUint8(3)]; }
    function block(type, body) { var a = [type >> 8, type & 255, (body.length >>> 24) & 255, (body.length >>> 16) & 255, (body.length >>> 8) & 255, body.length & 255]; blocks.push(a.concat(body)); total += a.length + body.length; }
    for (i = 0; i < palettes.length; i++) {
      block(0xC001, str(palettes[i].name || "MotionSaaS"));
      for (j = 0; j < palettes[i].colors.length; j++) {
        var h = norm(palettes[i].colors[j]);
        if (!h) continue;
        var c = rgb(h);
        block(0x0001, str(h).concat([82, 71, 66, 32], f32(c[0] / 255), f32(c[1] / 255), f32(c[2] / 255), [0, 2]));
      }
      block(0xC002, []);
    }
    var out = new Uint8Array(total), n = 0, head = [65, 83, 69, 70, 0, 1, 0, 0, (blocks.length >>> 24) & 255, (blocks.length >>> 16) & 255, (blocks.length >>> 8) & 255, blocks.length & 255];
    for (i = 0; i < head.length; i++) out[n++] = head[i];
    for (i = 0; i < blocks.length; i++) { for (j = 0; j < blocks[i].length; j++) out[n++] = blocks[i][j]; }
    return out;
  }
  // Uint8Array (or Node Buffer) → [{ name, colors }]. RGB, CMYK, Gray and Lab swatches; swatches outside a
  // group go into one palette named after the file (`fallback`).
  function parseAse(bytes, fallback) {
    var d = new DataView(bytes.buffer, bytes.byteOffset || 0, bytes.byteLength), p = 12, i, out = [], cur = null, loose = null, count;
    if (bytes.byteLength < 12 || d.getUint32(0) !== 0x41534546) throw new Error("This isn't a swatch exchange (.ase) file");
    count = d.getUint32(8);
    function rd() { var len = d.getUint16(p), s = "", k; p += 2; for (k = 0; k < len; k++) { var ch = d.getUint16(p + k * 2); if (ch) s += String.fromCharCode(ch); } p += len * 2; return s; }
    for (i = 0; i < count && p + 6 <= bytes.byteLength; i++) {
      var type = d.getUint16(p), len = d.getUint32(p + 2), end = p + 6 + len;
      p += 6;
      if (type === 0xC001) { cur = { name: rd() || "Swatches", colors: [] }; out.push(cur); }
      else if (type === 0xC002) { cur = null; }
      else if (type === 0x0001) {
        rd();
        var model = String.fromCharCode(d.getUint8(p), d.getUint8(p + 1), d.getUint8(p + 2), d.getUint8(p + 3)), v = [], h = null, k;
        p += 4;
        for (k = 0; k < 4 && p + k * 4 + 4 <= end; k++) v.push(d.getFloat32(p + k * 4));
        if (model === "RGB ") h = hex(v[0] * 255, v[1] * 255, v[2] * 255);
        else if (model === "CMYK") h = hex(255 * (1 - v[0]) * (1 - v[3]), 255 * (1 - v[1]) * (1 - v[3]), 255 * (1 - v[2]) * (1 - v[3]));
        else if (model === "Gray") h = hex(v[0] * 255, v[0] * 255, v[0] * 255);
        else if (model === "LAB ") h = labHex(v[0] * 100, v[1], v[2]);
        if (h) {
          if (!cur) { if (!loose) { loose = { name: fallback || "Swatches", colors: [] }; out.push(loose); } loose.colors.push(h); }
          else cur.colors.push(h);
        }
      }
      p = end;
    }
    return out.filter(function (x) { return x.colors.length > 0; });
  }
  function labHex(L, a, b) {
    var y = (L + 16) / 116, x = a / 500 + y, z = y - b / 200;
    function f(t) { return t * t * t > 0.008856 ? t * t * t : (t - 16 / 116) / 7.787; }
    x = 0.95047 * f(x); y = f(y); z = 1.08883 * f(z);
    function g(c) { return c > 0.0031308 ? 1.055 * Math.pow(c, 1 / 2.4) - 0.055 : 12.92 * c; }
    return hex(g(x * 3.2406 + y * -1.5372 + z * -0.4986) * 255, g(x * -0.9689 + y * 1.8758 + z * 0.0415) * 255, g(x * 0.0557 + y * -0.204 + z * 1.057) * 255);
  }

  // Built-in palettes (the SaaS Kit's originals plus a few more).
  var BUILTIN = [
    { name: "Apple", colors: ["#0A84FF", "#30D158", "#FF9F0A", "#FF375F", "#BF5AF2"] },
    { name: "Indigo Night", colors: ["#5E6AD2", "#8B5CF6", "#C4B5FD", "#1E1B4B", "#F7F8F8"] },
    { name: "Fintech", colors: ["#635BFF", "#00D4FF", "#80E9FF", "#0A2540", "#F6F9FC"] },
    { name: "Sunset", colors: ["#FF7A59", "#FFB86B", "#FF5E8A", "#7B61FF", "#FFE8D6"] },
    { name: "Mint", colors: ["#00C2A8", "#9BF6E3", "#0E3B43", "#4ADE80", "#E8FFF9"] },
    { name: "Mono", colors: ["#FFFFFF", "#E5E5EA", "#8E8E93", "#1C1C1E", "#000000"] },
    { name: "Petal", colors: ["#FF8FAB", "#FFC2D1", "#FB6F92", "#FFE5EC", "#6D2E46"] },
    { name: "Aurora", colors: ["#00F5A0", "#00D9F5", "#7B2FF7", "#F107A3", "#0B0B1F"] },
    { name: "Terracotta", colors: ["#E07A5F", "#3D405B", "#81B29A", "#F2CC8F", "#F4F1DE"] },
    { name: "Ocean", colors: ["#03045E", "#0077B6", "#00B4D8", "#90E0EF", "#CAF0F8"] }
  ];

  var api = { norm: norm, rgb: rgb, hex: hex, hsl: hsl, fromHsl: fromHsl, luminance: luminance, ink: ink, contrast: contrast, name: name,
    MODES: MODES, harmony: harmony, mood: mood, ase: ase, parseAse: parseAse, BUILTIN: BUILTIN };
  if (root && root.MSUI) { root.MSUI.paletteCore = api; }
  if (root && root.MSStudio) { root.MSStudio.paletteCore = api; }   // the Studio's colour dialog (studio-tools.js)
  if (typeof module !== "undefined" && module.exports) { module.exports = api; }
})(typeof window !== "undefined" ? window : this);
