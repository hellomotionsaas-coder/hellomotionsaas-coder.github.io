// MotionSaaS Studio — flex/grid `gap` for After Effects 2020-2021 (Chromium 61), loaded last in the Studio frame.
// Old Chromium ignores `gap` on flexbox (and only knows grid-row-gap / grid-column-gap on grids), so the
// Studio's spacing would collapse. scripts/build-studio.js collects every gap rule from the Studio CSS into
// RULES below; this turns them into child margins, and keeps them right as the Studio re-renders or resizes.
// Does nothing where flex gap works. Plain ES5.
(function () {
  "use strict";
  var RULES = [{"sel":".workspace","spec":100,"imp":0,"row":"12px","col":"12px"},{"sel":".nav-bar","spec":100,"imp":0,"row":"8px","col":"8px"},{"sel":".tabs","spec":100,"imp":0,"row":"8px","col":"8px"},{"sel":".tabs button","spec":101,"imp":0,"row":"9px","col":"9px"},{"sel":".connection-pill","spec":100,"imp":0,"row":"7px","col":"7px"},{"sel":".content-column","spec":100,"imp":0,"row":"12px","col":"12px"},{"sel":".toolbar","spec":100,"imp":0,"row":"8px","col":"8px"},{"sel":".search-field","spec":100,"imp":0,"row":"8px","col":"8px"},{"sel":".soft-button","spec":100,"imp":0,"row":"7px","col":"7px"},{"sel":"main","spec":1,"imp":0,"row":"12px","col":"12px"},{"sel":".preset-panel","spec":100,"imp":0,"row":"10px","col":"10px"},{"sel":"#presets","spec":10000,"imp":0,"row":"7px","col":"7px"},{"sel":"#presets button","spec":10001,"imp":0,"row":"12px","col":"12px"},{"sel":".title","spec":100,"imp":0,"row":"8px","col":"8px"},{"sel":".curve-tools","spec":100,"imp":0,"row":"8px","col":"8px"},{"sel":".tool-heading","spec":100,"imp":0,"row":"12px","col":"12px"},{"sel":".tool-grid","spec":100,"imp":0,"row":"12px","col":"12px"},{"sel":".quick-actions","spec":100,"imp":0,"row":"6px","col":"6px"},{"sel":".mini-preview","spec":100,"imp":0,"row":"8px","col":"8px"},{"sel":".ease-transfer","spec":100,"imp":0,"row":"8px","col":"8px"},{"sel":".ease-transfer label","spec":101,"imp":0,"row":"4px","col":"4px"},{"sel":".ease-transfer .compact-check","spec":200,"imp":0,"row":"5px","col":"5px"},{"sel":".bake-options>div","spec":101,"imp":0,"row":"8px","col":"8px"},{"sel":".bake-options label","spec":101,"imp":0,"row":"4px","col":"4px"},{"sel":"form label","spec":2,"imp":0,"row":"10px","col":"10px"},{"sel":".range-control","spec":100,"imp":0,"row":"10px","col":"10px"},{"sel":".segmented-control","spec":100,"imp":0,"row":"3px","col":"3px"},{"sel":".preview-footer","spec":100,"imp":0,"row":"10px","col":"10px"},{"sel":".replay-button","spec":100,"imp":0,"row":"7px","col":"7px"},{"sel":".actions","spec":100,"imp":0,"row":"6px","col":"6px"},{"sel":".replace","spec":100,"imp":0,"row":"7px","col":"7px"},{"sel":".code-inspector>button","spec":101,"imp":0,"row":"6px","col":"6px"},{"sel":".apply-row","spec":100,"imp":0,"row":"14px","col":"14px"},{"sel":".primary","spec":100,"imp":0,"row":"10px","col":"10px"},{"sel":"#saved>div","spec":10001,"imp":0,"row":"8px","col":"8px"},{"sel":".advanced-controls summary","spec":101,"imp":0,"row":"7px","col":"7px"},{"sel":".mini-preview .apply-row","spec":200,"imp":0,"row":"8px","col":"8px"},{"sel":".workspace","spec":100,"imp":0,"row":"16px","col":"16px"},{"sel":"main","spec":1,"imp":0,"row":"16px","col":"16px"},{"sel":".workspace","spec":100,"imp":0,"row":"8px","col":"8px"},{"sel":".tabs button","spec":101,"imp":0,"row":"6px","col":"6px"},{"sel":".content-column","spec":100,"imp":0,"row":"8px","col":"8px"},{"sel":"main","spec":1,"imp":0,"row":"8px","col":"8px"},{"sel":"#presets button","spec":10001,"imp":0,"row":"8px","col":"8px"},{"sel":".connection-pill","spec":100,"imp":0,"row":"4px","col":"4px"},{"sel":".tool-grid","spec":100,"imp":0,"row":"8px","col":"8px"},{"sel":".tool-heading","spec":100,"imp":0,"row":"8px","col":"8px"},{"sel":".workspace","spec":100,"imp":0,"row":"5px","col":"5px"},{"sel":".tabs button","spec":101,"imp":0,"row":"0","col":"0"},{"sel":"main","spec":1,"imp":0,"row":"5px","col":"5px"},{"sel":"#presets button","spec":10001,"imp":0,"row":"0","col":"0"},{"sel":".title","spec":100,"imp":0,"row":"5px","col":"5px"},{"sel":".curve-tools","spec":100,"imp":0,"row":"4px","col":"4px"},{"sel":"form label","spec":2,"imp":0,"row":"5px","col":"5px"},{"sel":".primary","spec":100,"imp":0,"row":"3px","col":"3px"},{"sel":".toolbar","spec":100,"imp":0,"row":"4px","col":"4px"},{"sel":"#presets","spec":10000,"imp":0,"row":"4px","col":"4px"},{"sel":".field-label","spec":100,"imp":0,"row":"3px","col":"3px"},{"sel":"body[data-category=\"Carousel\"] .field-label","spec":201,"imp":0,"row":"4px","col":"4px"},{"sel":".tabs button","spec":101,"imp":0,"row":"0","col":"0"},{"sel":".fps-popover label","spec":101,"imp":0,"row":"8px","col":"8px"},{"sel":".fps-actions","spec":100,"imp":0,"row":"8px","col":"8px"},{"sel":".alive-popover header div","spec":102,"imp":0,"row":"2px","col":"2px"},{"sel":".alive-enabled","spec":100,"imp":1,"row":"7px","col":"7px"},{"sel":".alive-check","spec":100,"imp":1,"row":"7px","col":"7px"},{"sel":".alive-styles","spec":100,"imp":0,"row":"5px","col":"5px"},{"sel":".alive-popover>label","spec":101,"imp":0,"row":"8px","col":"8px"},{"sel":".alive-advanced label","spec":101,"imp":0,"row":"8px","col":"8px"},{"sel":".alive-popover label span","spec":102,"imp":0,"row":"6px","col":"6px"},{"sel":".alive-popover footer","spec":101,"imp":0,"row":"5px","col":"5px"},{"sel":"body[data-category=\"Glass\"] .field-label","spec":201,"imp":0,"row":"4px","col":"4px"},{"sel":".apply-row","spec":100,"imp":0,"row":"6px","col":"6px"},{"sel":".copy-paste-menu","spec":100,"imp":0,"row":"5px","col":"5px"},{"sel":".kh-color-dialog","spec":100,"imp":0,"row":"12px","col":"12px"},{"sel":".kh-color-dialog label","spec":101,"imp":0,"row":"10px","col":"10px"},{"sel":".kh-color-dialog footer","spec":101,"imp":0,"row":"8px","col":"8px"},{"sel":".motion-blur-control","spec":100,"imp":0,"row":"10px","col":"10px"},{"sel":"#style-source-options","spec":10000,"imp":0,"row":"14px","col":"14px"},{"sel":"#style-source-options label","spec":10001,"imp":0,"row":"12px","col":"12px"},{"sel":".style-choice-row","spec":100,"imp":0,"row":"8px","col":"8px"},{"sel":".style-choice-buttons","spec":100,"imp":0,"row":"4px","col":"4px"},{"sel":"#style-source-options .style-choice-row","spec":10100,"imp":0,"row":"8px","col":"8px"},{"sel":".style-palette-colors","spec":100,"imp":0,"row":"8px","col":"8px"},{"sel":"#alive-popover header","spec":10001,"imp":0,"row":"12px","col":"12px"},{"sel":"#alive-popover footer","spec":10001,"imp":0,"row":"8px","col":"8px"},{"sel":".motion-toggle-row","spec":100,"imp":0,"row":"12px","col":"20px"},{"sel":".motion-toggle-row>label","spec":101,"imp":0,"row":"7px","col":"7px"},{"sel":".reverb-dialog header","spec":101,"imp":0,"row":"8px","col":"8px"},{"sel":".reverb-dialog footer","spec":101,"imp":0,"row":"8px","col":"8px"},{"sel":".reverb-dialog label","spec":101,"imp":0,"row":"8px","col":"8px"},{"sel":".reverb-dialog label>span","spec":102,"imp":0,"row":"7px","col":"7px"},{"sel":".reverb-dialog label","spec":101,"imp":0,"row":"10px","col":"10px"},{"sel":".reverb-dialog footer","spec":101,"imp":0,"row":"9px","col":"9px"},{"sel":".smart-highlighter-form>label","spec":101,"imp":0,"row":"6px","col":"6px"},{"sel":".smart-highlighter-form>label .segmented-control","spec":201,"imp":0,"row":"4px","col":"4px"},{"sel":".highlighter-advanced-grid","spec":100,"imp":0,"row":"4px","col":"4px"},{"sel":".highlighter-advanced-grid .style-choice-row","spec":200,"imp":0,"row":"8px","col":"8px"},{"sel":".highlighter-advanced-actions","spec":100,"imp":0,"row":"7px","col":"7px"},{"sel":"#glass-card-actions","spec":10000,"imp":0,"row":"8px","col":"8px"},{"sel":".glass-card-color","spec":100,"imp":0,"row":"10px","col":"10px"},{"sel":".glass-card-font-row","spec":100,"imp":0,"row":"8px","col":"8px"},{"sel":".glass-card-font-row label","spec":101,"imp":0,"row":"5px","col":"5px"},{"sel":".glass-card-buttons","spec":100,"imp":0,"row":"7px","col":"7px"},{"sel":"body[data-preset=\"text.counter\"] #params","spec":10101,"imp":0,"row":"4px","col":"8px"},{"sel":"body[data-preset=\"text.counter\"] #params>label[data-field=\"prefix\"]","spec":10202,"imp":0,"row":"5px","col":"5px"},{"sel":"body[data-preset=\"text.counter\"] #params>label[data-field=\"suffix\"]","spec":10202,"imp":0,"row":"5px","col":"5px"},{"sel":"body[data-preset=\"text.counter\"] #params>label[data-field=\"abbreviation\"]","spec":10202,"imp":0,"row":"5px","col":"5px"},{"sel":"body[data-preset=\"text.counter\"] #params>label[data-field=\"motionBlur\"]","spec":10202,"imp":0,"row":"5px","col":"5px"},{"sel":"#style-source-options .style-choice-row[data-choice=\"motion\"]","spec":10200,"imp":0,"row":"7px","col":"7px"},{"sel":"#style-source-options .style-motion-duration","spec":10100,"imp":0,"row":"8px","col":"8px"},{"sel":"#shake-advanced>label","spec":10001,"imp":0,"row":"6px","col":"6px"},{"sel":".motion-toggle-row","spec":100,"imp":0,"row":"8px","col":"8px"},{"sel":".motion-toggle-row>label","spec":101,"imp":0,"row":"7px","col":"7px"},{"sel":".motion-toggle-row .motion-blur-control","spec":200,"imp":0,"row":"4px","col":"4px"},{"sel":"#style-source-options .style-choice-row[data-choice=\"palette\"]","spec":10200,"imp":0,"row":"5px","col":"5px"},{"sel":".toolbar","spec":100,"imp":0,"row":"4px","col":"4px"},{"sel":".apply-row","spec":100,"imp":0,"row":"4px","col":"4px"},{"sel":".kh-color-hex-row","spec":100,"imp":0,"row":"8px","col":"8px"},{"sel":"#params>label[data-field=\"motionBlur\"]","spec":10101,"imp":0,"row":"10px","col":"10px"},{"sel":".motion-toggle-row>label[data-field=\"motionBlur\"]","spec":201,"imp":0,"row":"10px","col":"10px"},{"sel":"#alive-popover header","spec":10001,"imp":0,"row":"10px","col":"10px"},{"sel":".fps-popover header","spec":101,"imp":0,"row":"10px","col":"10px"},{"sel":"#alive-popover>label","spec":10001,"imp":0,"row":"10px","col":"10px"},{"sel":"#alive-popover footer","spec":10001,"imp":0,"row":"8px","col":"8px"},{"sel":"#glass-card-actions","spec":10000,"imp":0,"row":"12px","col":"12px"},{"sel":"#glass-card-actions .glass-card-font-row","spec":10100,"imp":0,"row":"10px","col":"10px"},{"sel":"#glass-card-actions .glass-card-buttons","spec":10100,"imp":0,"row":"8px","col":"8px"},{"sel":".range-control","spec":100,"imp":0,"col":"10px"},{"sel":"#params label[data-field=\"motionBlur\"]","spec":10101,"imp":0,"row":"10px","col":"10px"},{"sel":"#params label[data-field=\"abbreviation\"]","spec":10101,"imp":0,"row":"10px","col":"10px"},{"sel":"#params label[data-field=\"fade\"]","spec":10101,"imp":0,"row":"10px","col":"10px"},{"sel":"#params label[data-field=\"loop\"]","spec":10101,"imp":0,"row":"10px","col":"10px"},{"sel":"#params label[data-field=\"cursor\"]","spec":10101,"imp":0,"row":"10px","col":"10px"},{"sel":"#params label[data-field=\"blinkWhileTyping\"]","spec":10101,"imp":0,"row":"10px","col":"10px"},{"sel":"#params label[data-field=\"blinkAfterTyping\"]","spec":10101,"imp":0,"row":"10px","col":"10px"},{"sel":"#params label[data-field=\"fillEnabled\"]","spec":10101,"imp":0,"row":"10px","col":"10px"},{"sel":"#params label[data-field=\"strokeEnabled\"]","spec":10101,"imp":0,"row":"10px","col":"10px"},{"sel":"#params label[data-field=\"depthBlur\"]","spec":10101,"imp":0,"row":"10px","col":"10px"},{"sel":"#params label[data-field=\"backgroundColorize\"]","spec":10101,"imp":0,"row":"10px","col":"10px"},{"sel":"#params label .motion-blur-control","spec":10101,"imp":0,"row":"6px","col":"6px"},{"sel":".motion-toggle-row","spec":100,"imp":0,"row":"2px","col":"2px"},{"sel":".content-column main","spec":101,"imp":1,"row":"6px","col":"6px","media":"(max-width:410px)"},{"sel":".content-column main>.preset-panel>#presets","spec":10201,"imp":1,"row":"5px","col":"5px","media":"(max-width:410px)"},{"sel":".toolbar","spec":100,"imp":1,"row":"5px","col":"5px"},{"sel":".toolbar","spec":100,"imp":1,"row":"4px","col":"4px","media":"(max-width:380px)"},{"sel":"#params .style-choice-row","spec":10100,"imp":1,"row":"6px","col":"6px"},{"sel":"#params .style-choice-row .style-swatches","spec":10200,"imp":0,"row":"6px","col":"6px"},{"sel":"#params .style-choice-row>div","spec":10101,"imp":0,"row":"6px","col":"6px"},{"sel":"body[data-preset=\"text.counter\"] #params","spec":10101,"imp":0,"col":"10px"},{"sel":"#params .style-palette-colors","spec":10100,"imp":0,"row":"6px","col":"6px"},{"sel":".alive-popover>label:not(.alive-enabled)>span","spec":202,"imp":0,"row":"10px","col":"10px"},{"sel":"#params .segmented-control.kh-wrap","spec":10200,"imp":1,"row":"4px"},{"sel":".style-choice-buttons.kh-wrap","spec":200,"imp":1,"row":"4px"}];
  var AUTOS = [{"sel":"#presets button:after","sides":["margin-left"]},{"sel":".curve-tools button:last-child","sides":["margin-left"]},{"sel":"#alive-popover .alive-enabled","sides":["margin-left"]},{"sel":"#alive-popover header [data-alive-close]","sides":["margin-left"]},{"sel":".fps-popover header #fps-close","sides":["margin-left"]},{"sel":"#alive-popover .alive-enabled","sides":["margin-left"]},{"sel":"#nav-mode","sides":["margin-right","margin-left"]}];   // { sel, sides: ["margin-top", …] } — margins that are "auto" (spacers)

  function isAuto(el, side) {
    for (var i = 0; i < AUTOS.length; i++) {
      if (AUTOS[i].sides.indexOf(side) === -1) { continue; }
      try { if (el.matches ? el.matches(AUTOS[i].sel) : el.webkitMatchesSelector(AUTOS[i].sel)) { return true; } } catch (e) {}
    }
    return false;
  }

  // :has() needs Chromium 105, newer than the panel browser in every After Effects up to 2025, and the
  // Studio uses it once: .mini-preview:has(.apply-row). Mirror it with a class (styled in studio-extra.css).
  // Runs everywhere, independent of the gap fallback below.
  var hasOk = false;
  try { hasOk = !!(window.CSS && CSS.supports && CSS.supports("selector(:has(a))")); } catch (eHas) { hasOk = false; }
  if (!hasOk && document.body) {
    var markHas = function () {
      var list = document.querySelectorAll(".mini-preview"), i;
      for (i = 0; i < list.length; i++) { list[i].classList.toggle("ms-has-apply-row", !!list[i].querySelector(".apply-row")); }
    };
    new MutationObserver(function () { clearTimeout(markHas.t); markHas.t = setTimeout(markHas, 50); }).observe(document.body, { childList: true, subtree: true });
    markHas();
  }

  function supportsFlexGap() {
    // `all:initial` so no Studio stylesheet rule (padding, min-height…) can change the measurement.
    var d = document.createElement("div"), i;
    d.style.cssText = "all:initial;display:flex;flex-direction:column;row-gap:1px;position:absolute;visibility:hidden;top:0;left:0";
    for (i = 0; i < 2; i++) { var c = document.createElement("div"); c.style.cssText = "all:initial;display:block;height:0"; d.appendChild(c); }
    document.body.appendChild(d);
    var ok = Math.round(d.getBoundingClientRect().height) === 1;
    document.body.removeChild(d);
    return ok;
  }
  if (!document.body || supportsFlexGap() || !window.Map) { return; }

  var touched = [];   // parents we changed last run
  var mediaCache = {};
  function mediaOk(m) {
    if (!m) { return true; }
    if (!mediaCache[m]) { try { mediaCache[m] = window.matchMedia(m); } catch (e) { mediaCache[m] = { matches: false }; } }
    return mediaCache[m].matches;
  }
  function parseInline(style) {
    var out = null, m, re = /(?:^|;)\s*(row-gap|column-gap|gap)\s*:\s*([^;!]+)/g;
    while ((m = re.exec(style))) {
      out = out || {};
      var v = m[2].replace(/^\s+|\s+$/g, "").split(/\s+/);
      if (m[1] === "gap") { out.row = v[0]; out.col = v[1] || v[0]; } else if (m[1] === "row-gap") { out.row = v[0]; } else { out.col = v[0]; }
    }
    return out;
  }
  function own(el, want) {   // set exactly the margins in `want` that we own; drop ones we set before
    var had = (el.getAttribute("data-msgap") || "").split(",").filter(Boolean), keep = [], p, cs, any = false;
    for (var i = 0; i < had.length; i++) { el.style.removeProperty(had[i]); }   // measure without ours
    var inline = el.getAttribute("style") || "";
    for (p in want) { if (want.hasOwnProperty(p)) { any = true; } }
    if (any) { cs = getComputedStyle(el); }
    for (p in want) {
      if (!want.hasOwnProperty(p)) { continue; }
      // the author's own inline margin wins
      if (new RegExp("(^|;)\\s*" + p + "\\s*:").test(inline) || /(^|;)\s*margin\s*:/.test(inline)) { continue; }
      // An auto margin (a spacer pushing the item along) absorbs free space: real `gap` doesn't change it.
      if (isAuto(el, p)) { continue; }
      // Real gap adds to the item's own margin, so the stand-in is margin + gap.
      var own = parseFloat(cs.getPropertyValue(p)) || 0, v = own ? "calc(" + own + "px + " + want[p] + ")" : want[p];
      // !important: some Studio rules force `margin: 0 !important` on buttons, which would cancel the gap.
      if (el.style.getPropertyValue(p) !== v || el.style.getPropertyPriority(p) !== "important") { el.style.setProperty(p, v, "important"); }
      keep.push(p);
    }
    if (keep.length) { el.setAttribute("data-msgap", keep.join(",")); } else if (had.length) { el.removeAttribute("data-msgap"); }
  }
  function ok(v) { return v && v !== "normal" && v !== "0" && v !== "0px"; }

  function applyTo(el, g) {
    var cs = getComputedStyle(el), kids = el.children, i;
    if (cs.display === "grid" || cs.display === "inline-grid") {
      if (ok(g.row)) { el.style.gridRowGap = g.row; }
      if (ok(g.col)) { el.style.gridColumnGap = g.col; }
      return;
    }
    var flex = cs.display === "flex" || cs.display === "inline-flex";
    var dir = cs.flexDirection, wrap = cs.flexWrap !== "nowrap", col = dir.indexOf("column") === 0, first = true;
    for (i = 0; i < kids.length; i++) {
      var c = kids[i], want = {};
      if (flex) {
        var ccs = getComputedStyle(c);
        if (ccs.display !== "none" && ccs.position !== "absolute" && ccs.position !== "fixed") {
          if (wrap) {
            // wrapping rows/columns: every item gets the gap after it (a little extra at the ends is harmless)
            if (ok(g.row)) { want["margin-bottom"] = g.row; }
            if (ok(g.col)) { want["margin-right"] = g.col; }
          } else if (!first) {
            var v = col ? g.row : g.col;
            if (ok(v)) { want[dir === "row" ? "margin-left" : dir === "row-reverse" ? "margin-right" : dir === "column" ? "margin-top" : "margin-bottom"] = v; }
          }
          first = false;
        }
      }
      own(c, want);
    }
  }

  // Does rule r beat the rule that set the current value (rank = [important, specificity, order])?
  function wins(r, order, cur) {
    if (!cur) { return true; }
    if ((r.imp || 0) !== cur[0]) { return (r.imp || 0) > cur[0]; }
    if ((r.spec || 0) !== cur[1]) { return (r.spec || 0) > cur[1]; }
    return order >= cur[2];
  }
  function run() {
    var map = new Map(), i, j, els;
    for (i = 0; i < RULES.length; i++) {
      var r = RULES[i];
      if (!mediaOk(r.media)) { continue; }
      try { els = document.querySelectorAll(r.sel); } catch (e) { continue; }
      for (j = 0; j < els.length; j++) {
        var g = map.get(els[j]) || {};
        // row and column gap are separate properties: each keeps its own winning rule
        if (r.row && wins(r, i, g.rowRank)) { g.row = r.row; g.rowRank = [r.imp || 0, r.spec || 0, i]; }
        if (r.col && wins(r, i, g.colRank)) { g.col = r.col; g.colRank = [r.imp || 0, r.spec || 0, i]; }
        map.set(els[j], g);
      }
    }
    els = document.querySelectorAll('[style*="gap"]');
    for (j = 0; j < els.length; j++) {
      var d = parseInline(els[j].getAttribute("style") || "");
      // An inline gap beats every stylesheet rule except an !important one.
      if (d) {
        var g2 = map.get(els[j]) || {};
        if (d.row && !(g2.rowRank && g2.rowRank[0])) { g2.row = d.row; }
        if (d.col && !(g2.colRank && g2.colRank[0])) { g2.col = d.col; }
        map.set(els[j], g2);
      }
    }
    for (i = 0; i < touched.length; i++) { if (!map.has(touched[i])) { applyTo(touched[i], {}); } }
    touched = [];
    map.forEach(function (g, el) { applyTo(el, g); touched.push(el); });
  }

  var timer = null, last = 0;
  function soon() {
    if (timer) { return; }
    timer = setTimeout(function () { timer = null; last = Date.now(); run(); }, Math.max(60, 250 - (Date.now() - last)));
  }
  new MutationObserver(soon).observe(document.body, { childList: true, subtree: true });
  window.addEventListener("resize", soon);
  document.addEventListener("click", soon, true);
  run();
})();
