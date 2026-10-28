// MotionSaaS Studio — runs after js/panel.js inside the Studio frame.
// Wires the toolbar tools the demo only drew (Alive, Layer FPS) to After Effects, and adds the
// extension's own buttons to the left rail: the tool panels turned on in Settings, Settings (⚙) and About (ⓘ).
// Talks to the extension only through window.MSStudio (studio/shim.js). Plain ES5.
(function () {
  "use strict";
  var host = window.MSStudio;

  function $(sel, root) { return (root || document).querySelector(sel); }
  function toast(msg) {
    var t = document.getElementById("toast");
    if (!t) { return; }
    t.textContent = msg;
    t.classList.add("visible");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(function () { t.classList.remove("visible"); }, 2600);
  }
  function message(res, fallback) {
    if (!res) { return fallback; }
    if (res.ok) { return fallback; }
    return (res.errors && res.errors[0]) || "Something went wrong.";
  }
  function run(cmd, payload, okText, busyEl) {
    if (!host) { toast("Open MotionSaaS inside After Effects to apply."); return Promise.resolve(null); }
    if (busyEl) { busyEl.disabled = true; }
    return host.call(cmd, payload).then(function (res) {
      if (busyEl) { busyEl.disabled = false; }
      var n = res && res.ok ? (res.applied || 0) : 0;
      toast(res && res.ok ? okText.replace("{n}", n).replace("{s}", n === 1 ? "" : "s") : message(res));
      return res;
    });
  }

  /* ---------- Alive ---------- */
  var alive = document.getElementById("alive-popover");
  if (alive && host) {
    // The web demo adds a looping before/after canvas (and its hint / choices) to explain Alive; the
    // extension shows the plain controls with Apply · Copy · Remove, like the product.
    var demoBits = alive.querySelectorAll(".alive-demo-canvas, .alive-demo-hint, .alive-demo-choices");
    for (var di = 0; di < demoBits.length; di++) { demoBits[di].parentNode.removeChild(demoBits[di]); }
    var howto = alive.querySelector(".alive-howto"), aliveStatus = alive.querySelector("[data-alive-status]");
    if (howto) { howto.textContent = "Select the animated layer (not its keyframes) and press Apply. Works on shape layers with Position, Scale or Rotation animation."; }
    if (aliveStatus && !aliveStatus.textContent) { aliveStatus.textContent = "Select a 2D shape layer, then press Apply."; }
  }
  if (alive) {
    var status = $("[data-alive-status]", alive);
    var aliveVal = function (k, d) { var el = $('[data-alive="' + k + '"]', alive); var v = el ? Number(el.value) : NaN; return isNaN(v) ? d : v; };
    var say = function (res, okText) { if (status && res) { status.textContent = res.ok ? okText.replace("{n}", res.applied || 0) : message(res); } };
    var apply = $("[data-alive-apply]", alive), remove = $("[data-alive-remove]", alive);
    if (apply) {
      apply.addEventListener("click", function () {
        run("alive-apply", { amount: aliveVal("amount", 90), softness: aliveVal("softness", 65), damping: aliveVal("damping", 8) }, "Alive added to {n} layer{s}", apply)
          .then(function (res) { say(res, "Alive is on for {n} layer(s). Press Play to see it."); });
      });
    }
    if (remove) {
      remove.textContent = "Remove";
      remove.addEventListener("click", function () {
        run("alive-remove", {}, "Alive removed from {n} layer{s}", remove).then(function (res) { say(res, "Removed from {n} layer(s)."); });
      });
    }
    // Footer like the product: Apply · Copy ▾ · Remove. Copy keeps the three slider values; Paste puts them
    // back and applies them to the selected layers.
    var aliveFooter = apply && apply.parentNode;
    if (aliveFooter && host) {
      var cp = document.createElement("div");
      cp.className = "copy-paste-control";
      var cpBtn = document.createElement("button");
      cpBtn.type = "button";
      cpBtn.textContent = "Copy ▾";
      cpBtn.setAttribute("aria-expanded", "false");
      var cpMenu = document.createElement("div");
      cpMenu.className = "copy-paste-menu";
      cpMenu.hidden = true;
      var closeMenu = function () { cpMenu.hidden = true; cpBtn.setAttribute("aria-expanded", "false"); };
      var KEY = "ms.alive.copy", keys = ["amount", "softness", "damping"];
      var item = function (label, fn) { var b = document.createElement("button"); b.type = "button"; b.textContent = label; b.addEventListener("click", function () { closeMenu(); fn(); }); cpMenu.appendChild(b); };
      item("Copy", function () {
        var s = {};
        keys.forEach(function (k) { s[k] = aliveVal(k, 0); });
        try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
        toast("Alive settings copied");
      });
      item("Paste", function () {
        var s = null;
        try { s = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { s = null; }
        if (!s) { toast("Copy Alive settings first"); return; }
        keys.forEach(function (k) {
          var el = $('[data-alive="' + k + '"]', alive);
          if (el && s[k] !== undefined) { el.value = s[k]; el.dispatchEvent(new Event("input", { bubbles: true })); }
        });
        apply.click();
      });
      cpBtn.addEventListener("click", function () { cpMenu.hidden = !cpMenu.hidden; cpBtn.setAttribute("aria-expanded", String(!cpMenu.hidden)); });
      document.addEventListener("pointerdown", function (e) { if (!cp.contains(e.target)) { closeMenu(); } });
      cp.appendChild(cpBtn);
      cp.appendChild(cpMenu);
      aliveFooter.insertBefore(apply, aliveFooter.firstChild);   // Apply first
      aliveFooter.insertBefore(cp, apply.nextSibling);
      if (remove) { aliveFooter.appendChild(remove); }
    }
  }

  /* ---------- Layer FPS ---------- */
  // The Studio turns the FPS popover into a live "smooth vs N fps" preview (#fps-demo-range). Keep that,
  // and add the After Effects buttons under it: Reset / Apply to layer, using the previewed frame rate.
  var fpsControl = document.getElementById("fps-control");
  var fpsRange = document.getElementById("fps-range") || document.getElementById("fps-demo-range");
  var fpsPopover = document.querySelector(".fps-popover");
  if (fpsRange) {
    var fpsValue = document.getElementById("fps-value");
    if (fpsValue) {
      var showFps = function () { fpsValue.textContent = fpsRange.value + " fps"; };
      fpsRange.addEventListener("input", showFps);
      showFps();
    }
    var fpsApply = document.getElementById("fps-apply"), fpsReset = document.getElementById("fps-reset");
    if (!fpsApply && fpsPopover) {
      var actions = document.createElement("div");
      actions.className = "fps-actions";
      fpsReset = document.createElement("button");
      fpsReset.type = "button";
      fpsReset.id = "fps-reset";
      fpsReset.textContent = "Reset";
      fpsReset.title = "Remove the frame-rate effect from the selected layers";
      fpsApply = document.createElement("button");
      fpsApply.type = "button";
      fpsApply.id = "fps-apply";
      fpsApply.textContent = "Apply to layer";
      fpsApply.title = "Play the selected layers at this frame rate (Posterize Time)";
      actions.appendChild(fpsReset);
      actions.appendChild(fpsApply);
      fpsPopover.appendChild(actions);
    }
    if (fpsApply) { fpsApply.addEventListener("click", function () { run("fps-apply", { fps: Number(fpsRange.value) || 12 }, fpsRange.value + " fps on {n} layer{s}", fpsApply); }); }
    if (fpsReset) { fpsReset.addEventListener("click", function () { run("fps-reset", {}, "Frame rate reset on {n} layer{s}", fpsReset); }); }
    var fpsClose = document.getElementById("fps-close");
    if (fpsClose && fpsControl) { fpsClose.addEventListener("click", function () { fpsControl.removeAttribute("open"); }); }
  }

  /* ---------- Reverb Out ---------- */
  // The Studio's Reverb dialog only previews a beat in the browser. Add the After Effects side: apply the
  // reverb tail (Tail length / Amount from the dialog) to the selected audio layers, or remove it.
  // The panel CSS shows a short "Reverb" label under 380 px (kh-long / kh-short); the web-demo build
  // created the button with plain text, so it clipped to "Reverb Ou" in narrow panels.
  var reverbBtn = document.getElementById("reverb-out");
  if (reverbBtn && !reverbBtn.querySelector(".kh-short")) { reverbBtn.innerHTML = '<span class="kh-long">Reverb Out</span><span class="kh-short">Reverb</span>'; }
  var reverb = document.querySelector(".reverb-dialog");
  if (reverb && host) {
    var rvFooter = reverb.querySelector("footer") || reverb;
    var rvLength = reverb.querySelector("[data-length]"), rvAmount = reverb.querySelector("[data-amount]");
    var rvRow = document.createElement("footer");   // a footer, so it picks up the dialog's own button styles
    rvRow.className = "ms-reverb-ae";
    var rvApply = document.createElement("button");
    rvApply.type = "button";
    rvApply.className = "primary";
    rvApply.textContent = "Apply to audio layer";
    rvApply.title = "Cut the selected audio layers at their end and let a reverb tail ring out after it";
    var rvRemove = document.createElement("button");
    rvRemove.type = "button";
    rvRemove.textContent = "Remove";
    rvRow.appendChild(rvRemove);
    rvRow.appendChild(rvApply);
    rvFooter.parentNode.insertBefore(rvRow, rvFooter.nextSibling);
    rvApply.addEventListener("click", function () {
      run("reverb-out", { length: rvLength ? Number(rvLength.value) : 2, amount: rvAmount ? Number(rvAmount.value) : 40 }, "Reverb tail on {n} layer{s}", rvApply);
    });
    rvRemove.addEventListener("click", function () { run("reverb-out-remove", {}, "Reverb removed from {n} layer{s}", rvRemove); });
  }

  /* ---------- Controls → Motion Blur ---------- */
  // The web-demo build of the Studio dropped the Motion Blur switch from Controls. This one switches motion
  // blur for the selected layers right away (and the comp switch) and follows the selection.
  var params = document.getElementById("params");
  if (params && host) {
    var mbRow = document.createElement("label");
    mbRow.className = "ms-control-row";
    var mbText = document.createElement("span");
    mbText.className = "field-label";
    mbText.textContent = "Motion Blur";
    var mbSwitch = document.createElement("button");
    mbSwitch.type = "button";
    mbSwitch.className = "toggle-control";
    mbSwitch.setAttribute("role", "switch");
    mbSwitch.setAttribute("aria-label", "Motion Blur");
    mbSwitch.setAttribute("aria-checked", "false");
    mbSwitch.title = "Motion blur on the selected layers";
    mbRow.appendChild(mbText);
    mbRow.appendChild(mbSwitch);
    var setMb = function (on) { mbSwitch.setAttribute("aria-checked", on ? "true" : "false"); };
    mbSwitch.addEventListener("click", function (e) {
      e.preventDefault();
      var on = mbSwitch.getAttribute("aria-checked") !== "true";
      setMb(on);
      run("motion-blur", { on: on }, "Motion blur " + (on ? "on" : "off") + " for {n} layer{s}", mbSwitch).then(function (res) { if (!res || !res.ok) { setMb(!on); } });
    });
    // The Studio redraws #params on every preset change: put the row back (last) whenever it's gone.
    var keepMb = function () { if (mbRow.parentNode !== params) { params.appendChild(mbRow); } };
    new MutationObserver(keepMb).observe(params, { childList: true });
    keepMb();
    // Follow the selection: the Studio rewrites #context whenever it changes.
    var ctxLine = document.getElementById("context"), lastCtx = "";
    var syncMb = function () {
      var t = ctxLine ? ctxLine.textContent : "";
      if (t === lastCtx) { return; }
      lastCtx = t;
      host.call("context", {}).then(function (r) { if (r && r.ok) { setMb(!!r.motionBlur); } });
    };
    if (ctxLine) { new MutationObserver(syncMb).observe(ctxLine, { childList: true, characterData: true, subtree: true }); }
  }

  /* ---------- Code (Easing / Expressions) ---------- */
  // What the preset writes to After Effects: the Bézier and keyframe influences for Easing, the expression
  // for Expressions. The Studio shows #code-inspector for those two categories (it toggles .hidden itself).
  var card = document.querySelector(".parameters-card");
  if (card && host && !document.getElementById("code-inspector")) {
    var code = document.createElement("details");
    code.id = "code-inspector";
    code.className = "ms-code";
    code.innerHTML = '<summary>Code</summary><pre class="ms-code-text"></pre><button type="button" class="ms-code-copy">Copy code</button>';
    card.parentNode.insertBefore(code, card.nextSibling);
    var pre = code.querySelector("pre"), copyBtn = code.querySelector("button");
    var showFor = function () { code.hidden = ["Easing", "Expressions"].indexOf(document.body.getAttribute("data-category") || "") === -1; };
    new MutationObserver(showFor).observe(document.body, { attributes: true, attributeFilter: ["data-category"] });
    showFor();
    var refresh = function () {
      if (!code.open || code.hidden) { return; }
      var cur = host.current;
      if (!cur) { pre.textContent = "Pick a preset first."; return; }
      host.call("code", { id: cur.id, category: cur.category, params: cur.params }).then(function (r) {
        pre.textContent = r && r.ok && r.code ? r.code : ((r && r.errors && r.errors[0]) || "No code for this preset.");
      });
    };
    code.addEventListener("toggle", refresh);
    document.body.addEventListener("click", function () { setTimeout(refresh, 400); }, true);   // preset / control changes
    document.body.addEventListener("input", function () { clearTimeout(refresh.t); refresh.t = setTimeout(refresh, 400); }, true);
    copyBtn.addEventListener("click", function () {
      var ta = document.createElement("textarea");
      ta.value = pre.textContent;
      ta.style.cssText = "position:fixed;left:-9999px;top:0";
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      toast(ok ? "Code copied" : "Couldn't copy — select the text and press Ctrl/Cmd+C");
    });
  }

  /* ---------- extension buttons in the left rail ---------- */
  var nav = $(".nav-bar"), mode = document.getElementById("nav-mode");
  if (!nav || !host) { return; }

  var rail = document.createElement("div");
  rail.className = "ms-rail";
  rail.setAttribute("aria-label", "MotionSaaS tools");
  var panelBox = document.createElement("div");
  panelBox.className = "ms-rail-panels";
  rail.appendChild(panelBox);

  var ICONS = {
    gear: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.2"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
    info: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="M12 16.5v-5"/><path d="M12 8h.01"/></svg>'
  };
  function railButton(label, icon, onClick, cls, html) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "ms-rail-btn" + (cls ? " " + cls : "");
    b.title = label;
    b.setAttribute("aria-label", label);
    if (html) { b.innerHTML = html; } else { b.textContent = icon; }
    b.addEventListener("click", onClick);
    return b;
  }
  var fixed = document.createElement("div");
  fixed.className = "ms-rail-fixed";
  // One button: About (version, updates, diagnostics, self-test) is the last section of Settings.
  fixed.appendChild(railButton("Settings & About", "", function () { openSettings(); }, "ms-rail-icon", ICONS.gear));
  rail.appendChild(fixed);
  nav.insertBefore(rail, mode || null);
  if (mode) { mode.hidden = true; mode.setAttribute("aria-hidden", "true"); }   // Light / Dark moved into Settings

  function renderPanels(list) {
    [].forEach.call(document.querySelectorAll("button[data-panel]"), function (b) { b.parentNode.removeChild(b); });
    (list || []).forEach(function (p) {
      var b = railButton(p.name, p.icon || "•", function () { host.post({ ms: "studio-ui", action: "panel", id: p.id }); }, "ms-rail-panel");
      b.setAttribute("data-panel", p.id);
      panelBox.appendChild(b);
    });
    applyRail();
    setTool(toolOpen);
  }

  /* ---------- the rail as arranged in Settings → Rail ---------- */
  // Tool panel buttons join the Studio's category buttons in one list (#tabs), so the user can put them in
  // any order; Studio categories can be hidden (tool panels are shown / hidden by turning them on / off).
  // The extension stores it (js/ms-studio.js, ms_rail) and sends it as studio-rail.
  var railState = { order: [], hidden: [], hero: "cat:Easing" };
  var tabsBox = document.getElementById("tabs");
  function railId(b) {
    return b.getAttribute("data-category") ? "cat:" + b.getAttribute("data-category") : "panel:" + b.getAttribute("data-panel");
  }
  function applyRail() {
    if (!tabsBox || !tabsBox.querySelector("button[data-category]")) {   // the Studio hasn't built its rail yet
      rail.classList.toggle("has-panels", panelBox.children.length > 0);
      return;
    }
    while (panelBox.firstChild) { tabsBox.appendChild(panelBox.firstChild); }
    var pos = {};
    railState.order.forEach(function (id, i) { pos[id] = i; });
    [].forEach.call(tabsBox.querySelectorAll("button[data-category], button[data-panel]"), function (b, i) {
      var id = railId(b);
      b.style.order = pos.hasOwnProperty(id) ? pos[id] : 1000 + i;
      b.classList.toggle("ms-rail-hidden", railState.hidden.indexOf(id) >= 0);
    });
    rail.classList.remove("has-panels");
  }
  // Every rail entry in the user's order, for Settings: Studio categories plus all tool panels (on or off).
  function railItems() {
    var items = [];
    if (tabsBox) {
      [].forEach.call(tabsBox.querySelectorAll("button[data-category]"), function (b) {
        var id = railId(b), svg = b.querySelector("svg");
        items.push({ id: id, name: b.getAttribute("aria-label") || b.getAttribute("data-category"), kind: "cat", on: railState.hidden.indexOf(id) < 0, svg: svg });
      });
    }
    ((settingsData && settingsData.panels) || []).forEach(function (p) {
      items.push({ id: "panel:" + p.id, name: p.name, kind: "panel", on: p.state !== "off", emoji: p.icon, panel: p.id });
    });
    var pos = {};
    railState.order.forEach(function (id, i) { pos[id] = i; });
    items.forEach(function (it, i) { it.rank = pos.hasOwnProperty(it.id) ? pos[it.id] : 1000 + i; });
    return items.sort(function (a, b) { return a.rank - b.rank; });
  }
  function sendRail() {
    host.post({ ms: "studio-settings-set", what: "rail", value: { order: railState.order, hidden: railState.hidden, hero: railState.hero } });
    applyRail();
  }
  // The extension asks for the hero category at start-up; the Studio's rail may still be building.
  function openCategory(cat, tries) {
    var b = tabsBox && tabsBox.querySelector('button[data-category="' + String(cat).replace(/"/g, "") + '"]');
    if (b) { b.click(); return; }
    if ((tries || 0) < 40) { setTimeout(function () { openCategory(cat, (tries || 0) + 1); }, 100); }
  }
  if (tabsBox && window.MutationObserver) {
    new MutationObserver(function () { if (tabsBox.querySelector("button[data-category]") && panelBox.children.length) { applyRail(); } })
      .observe(tabsBox, { childList: true });
  }

  /* ---------- tool panels open inside the Studio ---------- */
  // A tool panel (Comp Tools, SaaS Kit, …) is part of the Studio, not a separate page: its rail button lights
  // up like a category and the extension draws the panel exactly over the Studio's content column, so the
  // rail, toolbar and frame stay. This tells the extension where that column is; a category click goes back.
  var toolOpen = null;
  // The inside of the content column, toolbar included (Reverb Out / Alive / FPS belong to the Studio's
  // categories, not to tool panels): the column minus its border and padding, where the extension draws the
  // panel as the Studio's inner card.
  function contentRect() {
    var cc = $(".content-column"), r = cc && cc.getBoundingClientRect();
    if (!r) { return null; }
    var cs = getComputedStyle(cc), n = function (v) { return parseFloat(v) || 0; };
    var l = n(cs.borderLeftWidth) + n(cs.paddingLeft), t = n(cs.borderTopWidth) + n(cs.paddingTop);
    var rr = n(cs.borderRightWidth) + n(cs.paddingRight), b = n(cs.borderBottomWidth) + n(cs.paddingBottom);
    return { x: r.left + l, y: r.top + t, w: r.width - l - rr, h: r.height - t - b };
  }
  function sendRect() { if (toolOpen) { host.post({ ms: "studio-tool-rect", rect: contentRect() }); } }
  // Studio categories the extension draws itself (built-in panels, js/ms-studio.js): their category button
  // opens the panel instead of the Studio's own page.
  var BUILT_IN = { Carousel: "carousel" };
  function setTool(id) {
    toolOpen = id || null;
    document.documentElement.classList.toggle("ms-tool-open", !!toolOpen);
    [].forEach.call(document.querySelectorAll("button[data-panel]"), function (b) { b.classList.toggle("active", !!toolOpen && b.getAttribute("data-panel") === toolOpen); });
    [].forEach.call(document.querySelectorAll("#tabs button[data-category]"), function (b) {
      var mine = !!toolOpen && BUILT_IN[b.getAttribute("data-category")] === toolOpen;
      b.classList.toggle("ms-rail-panel", mine);
      if (mine) { b.classList.add("active"); b.setAttribute("data-ms-lit", "1"); }
      else if (b.hasAttribute("data-ms-lit")) { b.classList.remove("active"); b.removeAttribute("data-ms-lit"); }
    });
    sendRect();
  }
  window.addEventListener("resize", sendRect);
  if (window.ResizeObserver && $(".content-column")) {
    var ro = new window.ResizeObserver(sendRect);
    ro.observe($(".content-column"));
    if ($(".content-column main")) { ro.observe($(".content-column main")); }
  }
  document.addEventListener("click", function (e) {
    var t = e.target && e.target.closest ? e.target.closest("#tabs button[data-category]") : null, own = t && BUILT_IN[t.getAttribute("data-category")];
    if (own) {   // Carousel: the extension's panel, not the Studio's page
      e.preventDefault();
      e.stopPropagation();
      if (toolOpen !== own) { host.post({ ms: "studio-ui", action: "panel", id: own }); }
      return;
    }
    if (t && toolOpen) { host.post({ ms: "studio-ui", action: "studio" }); setTool(null); }
  }, true);

  // The tool panel lies on top of this frame, so anything the Studio opens over its content (Settings &
  // About, colour picker, Reverb / FPS / Alive, any future dialog) would sit under it. Tell the extension
  // whenever such a layer is open, so it steps the tool panel aside; and pass Studio toasts up so they show
  // above the tool panel. Any visible full-panel shade or [role=dialog] counts, so new dialogs are covered too.
  var OVERLAYS = ".ms-dialog-shade, .kh-modal-shade, .reverb-shade, .kh-color-shade, .alive-backdrop, [role=dialog], [aria-modal=true]";
  function shown(el) {
    if (el.hidden) { return false; }
    var r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) { return false; }
    var cs = getComputedStyle(el);
    return cs.display !== "none" && cs.visibility !== "hidden" && cs.opacity !== "0";
  }
  var overlayWas = false, toastWas = "", watchQueued = false;
  function watchLayers() {
    watchQueued = false;
    var open = [].some.call(document.querySelectorAll(OVERLAYS), shown);
    if (open !== overlayWas) { overlayWas = open; host.post({ ms: "studio-overlay", open: open }); }
    var t = document.getElementById("toast"), txt = t && t.classList.contains("visible") ? String(t.textContent || "") : "";
    if (txt && txt !== toastWas && toolOpen) { host.post({ ms: "studio-toast-up", text: txt }); }
    toastWas = txt;
  }
  // Report in the same task as the change (a MutationObserver callback runs right after it), not a frame
  // later, so the tool panel is already gone when the dialog first paints.
  function queueWatch() { if (!watchQueued) { watchQueued = true; watchLayers(); } }
  if (window.MutationObserver) {
    new MutationObserver(queueWatch).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["hidden", "class", "open", "aria-hidden"] });
  }
  setInterval(watchLayers, 1000);   // safety net for changes the observer can't see (CSS transitions)
  // A (re)loaded Studio has no dialog open: say so, in case the previous page closed while one was.
  host.post({ ms: "studio-overlay", open: false });

  /* ---------- dialogs in the Studio's own style (the Reverb dialog's card) ---------- */
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) { e.className = cls; } if (text !== undefined) { e.textContent = text; } return e; }
  function makeDialog(title) {
    var shade = el("div", "reverb-shade ms-dialog-shade");
    shade.hidden = true;
    var box = el("section", "reverb-dialog ms-dialog");
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-label", title);
    var head = el("header"), h = el("h2", "", title), x = el("button", "", "×");
    x.type = "button";
    x.setAttribute("aria-label", "Close");
    head.appendChild(h);
    head.appendChild(x);
    var body = el("div", "ms-dialog-body");
    box.appendChild(head);
    box.appendChild(body);
    shade.appendChild(box);
    document.body.appendChild(shade);
    var d = {
      body: body,
      // Tell the extension before the dialog paints (a tool panel lying over the Studio steps aside).
      open: function () { clearTimeout(shade._t); shade.classList.remove("closing"); if (host) { host.post({ ms: "studio-overlay", open: true }); } shade.hidden = false; },
      // A short fade-out (.closing in studio-extra.css), then hidden.
      close: function () {
        if (shade.hidden) { return; }
        shade.classList.add("closing");
        clearTimeout(shade._t);
        shade._t = setTimeout(function () { shade.hidden = true; shade.classList.remove("closing"); }, 180);
      }
    };
    x.addEventListener("click", d.close);
    shade.addEventListener("pointerdown", function (e) { if (e.target === shade) { d.close(); } });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !shade.hidden) { d.close(); } });
    return d;
  }
  function group(parent, title) { var g = el("div", "ms-dlg-group"); g.appendChild(el("h3", "ms-dlg-h", title)); parent.appendChild(g); return g; }
  function switchBtn(on, mixed, label) {
    var s = el("button", "toggle-control" + (mixed ? " ms-mixed" : ""));
    s.type = "button";
    s.setAttribute("role", "switch");
    s.setAttribute("aria-checked", on || mixed ? "true" : "false");
    s.setAttribute("aria-label", label);
    // Flip right away, so the knob springs across (ms-motion.js) while the extension saves the change.
    s.addEventListener("click", function () {
      if (s.disabled) { return; }
      s.classList.remove("ms-mixed");
      s.setAttribute("aria-checked", s.getAttribute("aria-checked") === "true" ? "false" : "true");
    });
    return s;
  }
  // Settings is rebuilt from the extension's answer after each change. Wait until the control the user just
  // touched has finished its animation, so the rebuild doesn't cut it off.
  var lastTouch = 0;
  document.addEventListener("pointerdown", function () { lastTouch = Date.now(); }, true);
  document.addEventListener("keydown", function () { lastTouch = Date.now(); }, true);
  function renderSettingsSoon() {
    clearTimeout(renderSettingsSoon.t);
    var wait = lastTouch + 560 - Date.now();
    if (wait > 0) { renderSettingsSoon.t = setTimeout(renderSettingsSoon, wait); return; }
    if (!settings.body.parentNode.parentNode.hidden) { renderSettings(); }
  }

  /* ---------- appearance: light / dark / follow After Effects, and accent colour ---------- */
  // Each accent: its colour (solid), the text on it (ink) and, for the gradient, a warmer or cooler
  // highlight (hi) next to it on the colour wheel. The gradient is soft on purpose: highlight → colour →
  // only a little darker → a gentle lift, so no stop goes muddy (owner: "the darker parts feel harsh").
  var THEMES = {
    blue:   { solid: "#1f6bff", hi: "#3fc4ff", ink: "#fff" },
    purple: { solid: "#9b55f5", hi: "#d68cff", ink: "#fff" },
    indigo: { solid: "#5f5ff0", hi: "#8fa4ff", ink: "#fff" },
    pink:   { solid: "#ff4787", hi: "#ff8fb8", ink: "#fff" },
    red:    { solid: "#ff453a", hi: "#ff8a6b", ink: "#fff" },
    coral:  { solid: "#ff7a5c", hi: "#ffb08a", ink: "#fff" },
    orange: { solid: "#ff9500", hi: "#ffc04d", ink: "#fff" },
    yellow: { solid: "#f7c600", hi: "#ffe366", ink: "#3b2c00" },
    green:  { solid: "#30c15a", hi: "#7fe08a", ink: "#fff" },
    mint:   { solid: "#1ccf96", hi: "#6ff0c6", ink: "#fff" },
    teal:   { solid: "#14b8c6", hi: "#5fe0e6", ink: "#fff" },
    silver: { solid: "#b4b7c0", hi: "#eceef2", ink: "#1c1d22" }
  };
  function mix(a, b, t) {   // two #rrggbb colours → #rrggbb, t of the way from a to b
    var x = parseColor(a), y = parseColor(b), i, o = "#";
    for (i = 0; i < 3; i++) { o += ("0" + Math.round(x[i] + (y[i] - x[i]) * t).toString(16)).slice(-2); }
    return o;
  }
  (function () {
    for (var k in THEMES) {
      if (!THEMES.hasOwnProperty(k)) { continue; }
      var t = THEMES[k], c = parseColor(t.solid);
      t.g = [mix(t.hi, t.solid, 0.15), t.solid, mix(t.solid, "#000000", 0.1), mix(t.solid, t.hi, 0.35)];
      t.rim = "rgba(255,255,255,.38)";
      t.glow = c[0] + "," + c[1] + "," + c[2];
    }
  })();
  var theme = THEMES.blue, themeName = "blue";
  function applyAccent(name) {
    var root = document.documentElement, t;
    name = THEMES[name] ? name : "blue";
    t = THEMES[name];
    root.setAttribute("data-ms-accent", name);
    // Blue gets the same soft gradient; only the preview recolouring leaves the Studio's own blues alone.
    root.classList.add("ms-themed");
    var fill = "linear-gradient(135deg," + t.g[0] + "," + t.g[1] + " 45%," + t.g[2] + " 82%," + t.g[3] + ")";
    root.style.setProperty("--active-fill", fill);
    root.style.setProperty("--blue-fill", fill);
    root.style.setProperty("--accent", t.solid);
    root.style.setProperty("--accent-2", t.g[3]);
    root.style.setProperty("--ms-rim", t.rim);
    root.style.setProperty("--ms-glow", t.glow);
    root.style.setProperty("--ms-ink", t.ink);
    theme = t; themeName = name; colorCache = {};
    // The rest of the Studio's fixed blues (light page, cards, navy text, glows, shadows) take the accent's
    // hue too (../js/ms-tint.js, shared with the tool panels); blue keeps the Studio's own colours.
    if (window.MSStudio && window.MSStudio.tint) { window.MSStudio.tint.apply(document, name === "blue" ? null : t.solid); }
  }

  /* ---------- previews follow the theme ---------- */
  // The Studio draws its previews on canvases with its own blues. Swap those blues for the theme colour as
  // they are drawn (other colours stay), and in dark mode give the Frame rate / Reverb previews, which are
  // drawn for a light page, dark colours.
  var colorCache = {};
  function parseColor(s) {
    var m, h;
    s = String(s).replace(/\s+/g, "").toLowerCase();
    if (s.charAt(0) === "#") {
      h = s.slice(1);
      if (h.length === 3 || h.length === 4) { h = h.replace(/./g, function (c) { return c + c; }); }
      if (h.length !== 6 && h.length !== 8) { return null; }
      return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1];
    }
    m = /^rgba?\(([\d.]+),([\d.]+),([\d.]+)(?:,([\d.]+))?\)$/.exec(s);
    return m ? [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]] : null;
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
  function fromHsl(h, s, l, a) {
    var q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    function f(t) { t = (t + 360) % 360 / 360; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 0.5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; }
    return "rgba(" + Math.round(f(h + 120) * 255) + "," + Math.round(f(h) * 255) + "," + Math.round(f(h - 120) * 255) + "," + a + ")";
  }
  // Frame rate and Reverb previews in dark mode: their light colours, one by one.
  var DARK_DEMO = {
    "#eaf6ff": "#20252e", "#cce5ff": "#151a22", "#e5f3ff": "#1b2028",
    "#284c80": "#a3b1c6", "#234c83": "#a3b1c6",
    "rgba(39,92,169,.25)": "rgba(255,255,255,.12)", "rgba(47,103,173,.25)": "rgba(255,255,255,.14)",
    "#9bc4ef": "#c4cad3", "#5a83b7": "#5d6573", "#4a8bd8": "#8792a3"
  };
  var rawColors = false;   // true while drawing something that must keep its own colours
  function themedColor(v, canvas) {
    if (typeof v !== "string" || rawColors) { return v; }
    var demo = !!canvas && !!canvas.getAttribute && isDark() && (canvas.className === "fps-demo-canvas" || canvas.hasAttribute("data-wave"));
    var key = (demo ? "d" : "") + v;
    if (colorCache.hasOwnProperty(key)) { return colorCache[key]; }
    var out = v, k = v.replace(/\s+/g, "").toLowerCase().replace(/([(,])0\./g, "$1.");
    if (demo && DARK_DEMO[k]) { out = DARK_DEMO[k]; }
    else if (themeName !== "blue" && window.MSStudio && window.MSStudio.tint) {
      out = window.MSStudio.tint.color(v, theme.solid);   // the same roles as the CSS: pale, ink, muted, accent
    }
    else if (themeName !== "blue") {
      var c = parseColor(v), hsl, to;
      // The Studio's accent blues: hue 195–240, clearly coloured, neither near-white nor near-black.
      if (c && (hsl = toHsl(c)) && hsl[0] >= 195 && hsl[0] <= 240 && hsl[1] >= 0.45 && hsl[2] > 0.2 && hsl[2] < 0.88) {
        to = toHsl(parseColor(theme.solid));
        out = fromHsl(to[0], themeName === "silver" ? 0.06 : Math.min(1, to[1] * (0.6 + hsl[1] * 0.4)), Math.max(0.12, Math.min(0.92, hsl[2] + (to[2] - 0.54) * 0.8)), c[3]);
      }
    }
    colorCache[key] = out;
    return out;
  }
  if (window.MSStudio) { window.MSStudio.color = themedColor; }   // the canvas hook lives in shim.js

  /* ---------- Backgrounds previews drawn in code ---------- */
  // The Studio shows Backgrounds from pre-rendered image sheets (previews/background-*.webp), which the
  // saved demo doesn't include, so the preview was an empty black box. When those images aren't there the
  // Studio calls this (hooked in by scripts/build-studio.js) to draw an animated stand-in in each
  // background's own colours, on its 600 × 320 canvas. The Studio's hue / saturation filter stays applied.
  function blob(c, x, y, r, col, a) {
    var g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, col);
    g.addColorStop(1, "rgba(0,0,0,0)");
    c.globalAlpha = a === undefined ? 1 : a;
    c.fillStyle = g;
    c.fillRect(x - r, y - r, r * 2, r * 2);
    c.globalAlpha = 1;
  }
  function band(c, y0, amp, freq, phase, width, cols, a) {
    var g = c.createLinearGradient(0, 0, 600, 0), i, x;
    for (i = 0; i < cols.length; i++) { g.addColorStop(i / (cols.length - 1), cols[i]); }
    c.globalAlpha = a;
    c.strokeStyle = g;
    c.lineWidth = width;
    c.lineCap = "round";
    c.beginPath();
    for (x = -40; x <= 640; x += 10) {
      var y = y0 + Math.sin(x / 600 * Math.PI * 2 * freq + phase) * amp;
      if (x === -40) { c.moveTo(x, y); } else { c.lineTo(x, y); }
    }
    c.stroke();
    c.globalAlpha = 1;
  }
  function softly(c, px, draw) {   // draw with a blur on top of whatever filter the Studio set
    var f = c.filter && c.filter !== "none" ? c.filter + " " : "";
    var old = c.filter;
    try { c.filter = f + "blur(" + px + "px)"; } catch (e) {}
    draw();
    try { c.filter = old; } catch (e) {}
  }
  function bgPreview(c, key, P, time) {
    P = P || {};
    var sp = Math.max(10, P.backgroundSpeed === undefined ? 50 : +P.backgroundSpeed) / 50, t = (time || 0) * sp, s = Math.sin, k = Math.cos;
    rawColors = true;
    try {
      c.save();
      if (key === "ion-eclipse") {
        c.fillStyle = "#02040c"; c.fillRect(0, 0, 600, 320);
        blob(c, 300, 165, 230, "rgba(30,107,255,.75)");
        blob(c, 300 + s(t * .6) * 18, 160, 150, "rgba(120,210,255,.9)");
        c.fillStyle = "#010208"; c.beginPath(); c.arc(300 + s(t * .6) * 30, 160, 104, 0, Math.PI * 2); c.fill();
        softly(c, 6, function () { c.strokeStyle = "rgba(160,225,255,.85)"; c.lineWidth = 3; c.beginPath(); c.arc(300, 160, 108, Math.PI * (1.05 + s(t * .4) * .1), Math.PI * (1.65 + s(t * .4) * .1)); c.stroke(); });
      } else if (key === "thermal-ribbon") {
        c.fillStyle = "#0b0614"; c.fillRect(0, 0, 600, 320);
        softly(c, 22, function () {
          band(c, 170, 70, 1.1, t * .7, 90, ["#ff5a2e", "#ff2d87", "#7a3cff"], .9);
          band(c, 150, 50, 1.3, t * .7 + 1.4, 40, ["#ffd06a", "#ff7a3d", "#ff2d87"], .8);
        });
        band(c, 158, 58, 1.2, t * .7 + .7, 4, ["#fff1d6", "#ffc0d9", "#d7c2ff"], .55);
      } else if (key === "violet-halo") {
        c.fillStyle = "#07030f"; c.fillRect(0, 0, 600, 320);
        blob(c, 300, 175, 260, "rgba(110,50,220,.55)");
        c.translate(300, 170); c.rotate(-.35 + s(t * .3) * .06);
        softly(c, 10, function () {
          for (var i = 0; i < 3; i++) {
            c.strokeStyle = ["rgba(155,92,255,.9)", "rgba(210,155,255,.7)", "rgba(120,80,255,.6)"][i];
            c.lineWidth = 10 - i * 3;
            c.beginPath(); c.ellipse(0, 0, 210 - i * 34, 82 - i * 16, 0, Math.PI * 1.05, Math.PI * 1.95 + s(t + i) * .05); c.stroke();
          }
        });
        c.strokeStyle = "rgba(235,215,255,.8)"; c.lineWidth = 1.5; c.beginPath(); c.ellipse(0, 0, 210, 82, 0, Math.PI * 1.15, Math.PI * 1.75); c.stroke();
      } else if (key === "solar-horizon") {
        var sky = c.createLinearGradient(0, 0, 0, 320);
        sky.addColorStop(0, "#140a24"); sky.addColorStop(.55, "#5a1f4a"); sky.addColorStop(.85, "#ff7a3d"); sky.addColorStop(1, "#ffcf7a");
        c.fillStyle = sky; c.fillRect(0, 0, 600, 320);
        blob(c, 300 + s(t * .3) * 40, 330, 260, "rgba(255,200,110,.85)");
        blob(c, 300 + s(t * .3) * 40, 320, 120, "rgba(255,240,200,.9)");
        softly(c, 14, function () { band(c, 268, 8, .8, t * .5, 26, ["#ff9a5a", "#ffd27a", "#ff9a5a"], .6); });
      } else if (key === "aurora-veil") {
        c.fillStyle = "#020a0c"; c.fillRect(0, 0, 600, 320);
        softly(c, 20, function () {
          for (var i = 0; i < 5; i++) {
            var x0 = 80 + i * 110 + s(t * .5 + i) * 30;
            var g = c.createLinearGradient(0, 30, 0, 300);
            g.addColorStop(0, "rgba(25,227,160,0)"); g.addColorStop(.45, i % 2 ? "rgba(16,181,200,.75)" : "rgba(25,227,160,.85)"); g.addColorStop(1, "rgba(25,227,160,0)");
            c.fillStyle = g;
            c.beginPath(); c.moveTo(x0 - 30, 40);
            for (var y = 40; y <= 300; y += 20) { c.lineTo(x0 + s(y / 60 + t * .8 + i) * 26 - 20, y); }
            for (var y2 = 300; y2 >= 40; y2 -= 20) { c.lineTo(x0 + s(y2 / 60 + t * .8 + i) * 26 + 22, y2); }
            c.closePath(); c.fill();
          }
        });
      } else if (key === "opal-flow") {
        c.fillStyle = "#dcd7ea"; c.fillRect(0, 0, 600, 320);
        blob(c, 160 + s(t * .5) * 50, 110 + k(t * .4) * 30, 230, "rgba(255,206,230,.95)");
        blob(c, 440 + k(t * .45) * 50, 120 + s(t * .5) * 30, 220, "rgba(196,236,255,.95)");
        blob(c, 300 + s(t * .35) * 70, 260, 240, "rgba(226,210,255,.95)");
        blob(c, 300, 160 + s(t * .6) * 20, 120, "rgba(255,246,214,.8)");
      } else {   // ember-form and anything new: sculpted warm light
        c.fillStyle = "#120405"; c.fillRect(0, 0, 600, 320);
        blob(c, 200 + s(t * .5) * 60, 170 + k(t * .4) * 30, 270, "rgba(255,59,31,.9)");
        blob(c, 420 + k(t * .45) * 50, 120 + s(t * .5) * 20, 210, "rgba(255,138,61,.85)");
        blob(c, 300, 330, 300, "rgba(107,10,10,.9)");
        blob(c, 260 + s(t * .7) * 40, 140, 90, "rgba(255,214,170,.55)");
      }
      c.restore();
      var v = c.createRadialGradient(300, 160, 120, 300, 160, 380);   // gentle vignette like the renders
      v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,.35)");
      c.fillStyle = v; c.fillRect(0, 0, 600, 320);
    } finally { rawColors = false; }
  }
  if (window.MSStudio) { window.MSStudio.bgPreview = bgPreview; }
  function isDark() { return document.documentElement.classList.contains("dark-mode"); }
  // Light / Dark use the Studio's own switch (which saves the choice). Follow AE forgets the choice and takes
  // After Effects' panel colour, in place (it used to reload the Studio, which closed Settings and left an
  // open tool panel hidden). hostDark: After Effects is dark (from the extension; updated live).
  var MODE_KEY = "kh.brandTheme.v1";
  var hostDark = !(window.MSStudio && window.MSStudio.query && window.MSStudio.query.dark === "0");
  function setMode(m) {
    try {
      var want = m === "auto" ? hostDark : m === "dark";
      if (want !== isDark() && mode) { mode.click(); }
      if (m === "auto") { localStorage.removeItem(MODE_KEY); }
    } catch (e) {}
  }
  function followHost(dark) {   // After Effects' theme changed: follow it if the user chose Follow AE
    hostDark = !!dark;
    if (modeNow() === "auto") { setMode("auto"); }
  }
  // Tell the extension whether the Studio is light or dark (its tool panels dress to match).
  var modeWas = null;
  function sendMode() { var d = isDark(); if (d !== modeWas) { modeWas = d; host.post({ ms: "studio-mode", dark: d }); } }
  if (window.MutationObserver) { new MutationObserver(sendMode).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] }); }
  sendMode();
  function modeNow() { var v = null; try { v = localStorage.getItem(MODE_KEY); } catch (e) {} return v === null ? "auto" : (isDark() ? "dark" : "light"); }

  /* ---------- Settings ---------- */
  var settings = makeDialog("Settings & About"), settingsData = null;
  function renderSettings() {
    var b = settings.body, s = settingsData || {};
    while (b.lastChild) { b.removeChild(b.lastChild); }
    // Appearance
    // Light / Dark / Follow AE: a pill (the thumb) slides on a spring to the chosen option.
    var ga = group(b, "Appearance"), seg = el("div", "ms-seg has-thumb"), cur = modeNow(), thumb = el("span", "ms-seg-thumb");
    var MODES = [["light", "Light"], ["dark", "Dark"], ["auto", "Follow AE"]];
    var place = function (i) { thumb.style.left = "calc(3px + " + i + " * ((100% - 12px) / 3 + 3px))"; };
    seg.appendChild(thumb);
    MODES.forEach(function (o, i) {
      var btn = el("button", cur === o[0] ? "active" : "", o[1]);
      btn.type = "button";
      if (cur === o[0]) { place(i); }
      btn.addEventListener("click", function () {
        [].forEach.call(seg.querySelectorAll("button"), function (x) { x.classList.toggle("active", x === btn); });
        place(i);
        thumb.classList.remove("moving"); void thumb.offsetWidth; thumb.classList.add("moving");
        setTimeout(function () { setMode(o[0]); renderSettingsSoon(); }, 200);   // the pill moves first, then the colours change
      });
      seg.appendChild(btn);
    });
    ga.appendChild(seg);
    var sw = el("div", "ms-swatches");
    (s.accents || []).forEach(function (a) {
      var dot = el("button", "ms-swatch" + (a.id === s.accent ? " active" : ""));
      dot.type = "button";
      dot.title = a.id.charAt(0).toUpperCase() + a.id.slice(1);
      dot.setAttribute("aria-label", "Accent " + dot.title);
      dot.style.background = a.hex;
      dot.addEventListener("click", function () {
        [].forEach.call(sw.children, function (x) { x.classList.toggle("active", x === dot); });   // ring moves at once
        host.post({ ms: "studio-settings-set", what: "accent", value: a.id });
      });
      sw.appendChild(dot);
    });
    ga.appendChild(el("p", "ms-dlg-note", "Accent colour"));
    ga.appendChild(sw);
    renderRailSettings(group(b, "Rail"));
    // Profile
    var gn = group(b, "Your name"), inp = el("input", "ms-dlg-input");
    inp.type = "text";
    inp.value = s.name || "";
    inp.placeholder = "Editor";
    inp.addEventListener("change", function () { host.post({ ms: "studio-settings-set", what: "name", value: inp.value }); });
    gn.appendChild(inp);
    // About (kept as one element, so a running self-test or its report survives re-renders)
    group(b, "About").appendChild(aboutBlock);
  }
  function openSettings() { renderSettings(); settings.open(); host.post({ ms: "studio-settings-get" }); }

  // Settings → Rail: one row per rail button (Studio categories and tool panels) to move it up / down, show or
  // hide it, and pick the hero (⌂) — the panel the extension opens whenever it starts. The hero can't be hidden.
  var HOME = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10.6 11.2 4.4a1.2 1.2 0 0 1 1.6 0L20 10.6M6 9v9.25A1.75 1.75 0 0 0 7.75 20h2.5v-5.25h3.5V20h2.5A1.75 1.75 0 0 0 18 18.25V9"/></svg>';
  function miniBtn(html, label, cls) {
    var b = el("button", "ms-rail-mini" + (cls ? " " + cls : ""));
    b.type = "button";
    b.innerHTML = html;
    b.title = label;
    b.setAttribute("aria-label", label);
    return b;
  }
  var GRIP = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14M5 12h14M5 16h14"/></svg>';
  var openSections = {};   // tool panels whose "Sections" list is open, kept across re-renders
  function renderRailSettings(g) {
    g.appendChild(el("p", "ms-dlg-note", "Drag ☰ to arrange the left rail, hide what you don't use, pick the hero (⌂) that opens when MotionSaaS starts, and choose a tool panel's sections."));
    var items = railItems(), list = el("div", "ms-rail-list");
    var panelsById = {};
    ((settingsData && settingsData.panels) || []).forEach(function (p) { panelsById[p.id] = p; });
    g.appendChild(list);
    var commitOrder = function (from, to) {
      if (from === to) { return; }
      var ids = items.map(function (x) { return x.id; });
      ids.splice(to, 0, ids.splice(from, 1)[0]);
      railState.order = ids;
      sendRail();
    };
    items.forEach(function (it, i) {
      var item = el("div", "ms-rail-item"), row = el("div", "ms-rail-row" + (it.on ? "" : " off")), icon = el("span", "ms-rail-row-icon");
      var p = it.kind === "panel" ? panelsById[it.panel] : null;
      var grip = miniBtn(GRIP, "Drag to move " + it.name + " (or use the arrow keys)", "grip");
      grip.addEventListener("pointerdown", function (e) { dragRow(e, list, i, commitOrder); });
      grip.addEventListener("keydown", function (e) {
        var by = e.key === "ArrowUp" ? -1 : (e.key === "ArrowDown" ? 1 : 0);
        if (!by || i + by < 0 || i + by >= items.length) { return; }
        e.preventDefault();
        commitOrder(i, i + by);
        setTimeout(function () { var gs = settings.body.querySelectorAll(".ms-rail-mini.grip"); if (gs[i + by]) { gs[i + by].focus(); } }, 120);
      });
      row.appendChild(grip);
      if (it.svg) { icon.appendChild(it.svg.cloneNode(true)); } else { icon.textContent = it.emoji || "•"; }
      row.appendChild(icon);
      row.appendChild(el("span", "ms-rail-row-name", it.name));
      // Tool panels: how many sections are on, and the "Sections" list to pick them (opens under the row).
      var secList = null;
      if (p && p.sections && p.sections.length) {
        if (p.state === "some") { row.appendChild(el("small", "ms-panel-count", p.sections.filter(function (x) { return x.on; }).length + "/" + p.sections.length)); }
        var more = el("button", "ms-panel-more", "Sections");
        more.type = "button";
        more.setAttribute("aria-expanded", openSections[p.id] ? "true" : "false");
        row.appendChild(more);
        secList = el("div", "ms-panel-sections");
        secList.hidden = !openSections[p.id];
        p.sections.forEach(function (sec) {
          var line = el("div", "ms-section-line");
          line.appendChild(el("span", "", sec.name));
          var t2 = switchBtn(sec.on, false, sec.name);
          t2.addEventListener("click", function () { openSections[p.id] = true; host.post({ ms: "studio-settings-set", what: "section", id: p.id, key: sec.key, on: !sec.on }); });
          line.appendChild(t2);
          secList.appendChild(line);
        });
        more.addEventListener("click", function () { slideSections(secList, more, p.id); });
      }
      var isHero = railState.hero === it.id;
      var hero = miniBtn(HOME, isHero ? it.name + " opens first" : "Open " + it.name + " first", isHero ? "hero active" : "hero");
      hero.addEventListener("click", function () {
        [].forEach.call(list.querySelectorAll(".ms-rail-mini.hero"), function (x) { x.classList.toggle("active", x === hero); });   // lights up at once
        railState.hero = it.id;
        railState.hidden = railState.hidden.filter(function (x) { return x !== it.id; });
        if (it.kind === "panel" && !it.on) { host.post({ ms: "studio-settings-set", what: "panel", id: it.panel, on: true }); }
        sendRail();
      });
      // A tool panel with only some sections on shows its switch half-on; a click turns the whole panel on.
      var sw2 = switchBtn(p ? p.state === "all" : it.on, p ? p.state === "some" : false, (it.on ? "Hide " : "Show ") + it.name);
      if (isHero) { sw2.disabled = true; sw2.title = "The hero panel is always shown"; }
      sw2.addEventListener("click", function () {
        if (isHero) { return; }
        if (p) { host.post({ ms: "studio-settings-set", what: "panel", id: p.id, on: p.state !== "all" }); return; }
        // From the current list, not the one Settings was drawn with (clicks can come before it redraws).
        var hiddenNow = railState.hidden.indexOf(it.id) >= 0;
        railState.hidden = hiddenNow ? railState.hidden.filter(function (x) { return x !== it.id; }) : railState.hidden.concat([it.id]);
        sendRail();
      });
      row.appendChild(hero);
      row.appendChild(sw2);
      item.appendChild(row);
      if (secList) { item.appendChild(secList); }
      list.appendChild(item);
    });
  }

  // Open / close a tool panel's Sections list smoothly: its height eases from 0 to its content (and back).
  function slideSections(listEl, btn, id) {
    var opening = listEl.hidden;
    openSections[id] = opening;
    btn.setAttribute("aria-expanded", opening ? "true" : "false");
    clearTimeout(listEl._t);
    if (opening) {
      listEl.hidden = false;
      listEl.style.maxHeight = "0px";
      listEl.style.opacity = "0";
      void listEl.offsetHeight;
      listEl.style.maxHeight = listEl.scrollHeight + "px";
      listEl.style.opacity = "1";
      listEl._t = setTimeout(function () { listEl.style.maxHeight = ""; }, 450);
    } else {
      listEl.style.maxHeight = listEl.scrollHeight + "px";
      void listEl.offsetHeight;
      listEl.style.maxHeight = "0px";
      listEl.style.opacity = "0";
      listEl._t = setTimeout(function () { listEl.hidden = true; listEl.style.maxHeight = ""; listEl.style.opacity = ""; }, 420);
    }
  }

  // Drag a rail row by its ☰ handle. The row lifts and follows the pointer, stretching and softening a
  // little with speed (motion blur); the other rows spring aside to make room (an elastic overshoot); on
  // release the row springs into its slot and the new order is saved once it has settled. Near the top or
  // bottom of the dialog the list scrolls. Transforms only, so it stays smooth.
  var SPRING = "cubic-bezier(.34,1.56,.64,1)";
  function dragRow(e, list, from, commit) {
    if (e.button !== 0 && e.pointerType === "mouse") { return; }
    e.preventDefault();
    var rows = [].slice.call(list.children), n = rows.length, row = rows[from], handle = e.currentTarget;
    var box = settings.body.parentNode;
    // Rows can differ in height (a tool panel's open "Sections" list), so work from each row's own box.
    var tops = rows.map(function (r) { return r.offsetTop; }), hs = rows.map(function (r) { return r.offsetHeight; });
    var slot = hs[from];
    var startY = e.clientY, startScroll = box.scrollTop, y = 0, target = from, v = 0, lastY = e.clientY, lastT = Date.now(), done = false, raf = 0;
    try { handle.setPointerCapture(e.pointerId); } catch (err) {}
    list.classList.add("dragging");
    row.classList.add("lifted");
    rows.forEach(function (r) { if (r !== row) { r.style.transition = "transform .32s " + SPRING; } });
    row.style.transition = "box-shadow .2s ease, background-color .2s ease";
    function offset() { return y + (box.scrollTop - startScroll); }
    function layout() {
      // The new place: after every other row whose middle the dragged row's middle has passed.
      var mid = tops[from] + hs[from] / 2 + offset(), t = 0;
      rows.forEach(function (r, i) { if (i !== from && tops[i] + hs[i] / 2 < mid) { t++; } });
      target = t;
      rows.forEach(function (r, i) {
        if (r === row) { return; }
        var s = (from < target && i > from && i <= target) ? -slot : ((from > target && i >= target && i < from) ? slot : 0);
        r.style.transform = s ? "translate3d(0," + s + "px,0)" : "";
      });
    }
    function paint() {
      if (done) { return; }
      v *= 0.86;   // speed fades when the pointer rests, so the stretch and blur ease off
      var sp = Math.min(Math.abs(v), 3), stretch = 1 + sp * 0.025, blur = Math.min(1.4, sp * 0.5);
      row.style.transform = "translate3d(0," + offset() + "px,0) scale(" + (1.025 / Math.sqrt(stretch)).toFixed(4) + "," + (1.025 * stretch).toFixed(4) + ")";
      row.style.filter = blur > 0.08 ? "blur(" + blur.toFixed(2) + "px)" : "";
      // Near the dialog's top or bottom edge: scroll it, faster the closer the pointer gets.
      var r = box.getBoundingClientRect(), edge = 44, py = lastY;
      if (py < r.top + edge) { box.scrollTop -= Math.ceil((r.top + edge - py) / 4); layout(); }
      else if (py > r.bottom - edge) { box.scrollTop += Math.ceil((py - (r.bottom - edge)) / 4); layout(); }
      raf = requestAnimationFrame(paint);
    }
    function move(ev) {
      var now = Date.now(), dt = Math.max(1, now - lastT);
      v = v * 0.5 + ((ev.clientY - lastY) / dt) * 0.5;
      lastY = ev.clientY; lastT = now;
      y = ev.clientY - startY;
      layout();
    }
    function up() {
      if (done) { return; }
      done = true;
      cancelAnimationFrame(raf);
      handle.removeEventListener("pointermove", move);
      handle.removeEventListener("pointerup", up);
      handle.removeEventListener("pointercancel", up);
      // Where the row lands: past the heights of the rows it moved over.
      var final = 0, k;
      if (target > from) { for (k = from + 1; k <= target; k++) { final += hs[k]; } }
      else { for (k = target; k < from; k++) { final -= hs[k]; } }
      row.style.transition = "transform .42s " + SPRING + ", filter .2s ease, box-shadow .35s ease";
      row.style.filter = "";
      row.style.transform = "translate3d(0," + final + "px,0) scale(1,1)";
      row.classList.remove("lifted");
      setTimeout(function () {
        list.classList.remove("dragging");
        if (target === from) { rows.forEach(function (r) { r.style.transition = ""; r.style.transform = ""; }); return; }
        // Put the row in its new place in the DOM with no visible jump, then save (the dialog re-renders).
        rows.forEach(function (r) { r.style.transition = "none"; r.style.transform = ""; });
        list.insertBefore(row, target > from ? rows[target].nextSibling : rows[target]);
        commit(from, target);
      }, 430);
    }
    handle.addEventListener("pointermove", move);
    handle.addEventListener("pointerup", up);
    handle.addEventListener("pointercancel", up);
    raf = requestAnimationFrame(paint);
  }

  /* ---------- About ---------- */
  var aboutBlock = el("div", "ms-about-block"), aboutOut, reportBox, reportText;
  (function () {
    var b = aboutBlock;
    var brand = el("div", "ms-about-brand"), logo = el("img", "ms-about-logo");
    logo.src = "../img/logo.webp";   // the MotionSaaS mark (extension/img), with a slow shine
    logo.alt = "";
    brand.appendChild(logo);
    var t = el("div");
    t.appendChild(el("strong", "", "MotionSaaS Studio"));
    t.appendChild(el("small", "ms-about-version", ""));
    brand.appendChild(t);
    b.appendChild(brand);
    b.appendChild(el("p", "ms-dlg-note", "Motion tools for SaaS video editors in After Effects."));
    var row = el("div", "ms-about-actions");
    [["update", "Check for updates"], ["diagnostics", "Copy diagnostics"], ["selftest", "Run self-test"]].forEach(function (a) {
      var btn = el("button", a[0] === "update" ? "primary" : "", a[1]);
      btn.type = "button";
      btn.addEventListener("click", function () { aboutOut.textContent = "…"; host.post({ ms: "studio-about", action: a[0] }); });
      row.appendChild(btn);
    });
    b.appendChild(row);
    aboutOut = el("output", "ms-about-out");
    aboutOut.setAttribute("role", "status");
    b.appendChild(aboutOut);
    reportBox = el("div", "ms-about-report");
    reportBox.hidden = true;
    reportText = el("textarea", "ms-code-text");
    reportText.readOnly = true;
    var copyRep = el("button", "", "Copy report");
    copyRep.type = "button";
    copyRep.addEventListener("click", function () { copyText(reportText.value, "Report copied"); });
    reportBox.appendChild(reportText);
    reportBox.appendChild(copyRep);
    b.appendChild(reportBox);
  })();
  function copyText(text, okMsg) {
    var ta = el("textarea");
    ta.value = text;
    ta.style.cssText = "position:fixed;left:-9999px;top:0";
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    toast(ok ? okMsg : "Couldn't copy — select the text and press Ctrl/Cmd+C");
    return ok;
  }

  /* ---------- engine banner ---------- */
  var banner = null;
  function showEngine(ok, error) {
    if (ok) { if (banner) { banner.hidden = true; } return; }
    if (!banner) {
      banner = el("div", "ms-engine-banner");
      var msg = el("span", "ms-engine-msg"), again = el("button", "", "Retry"), cp = el("button", "", "Copy");
      again.type = cp.type = "button";
      again.addEventListener("click", function () { host.post({ ms: "studio-ui", action: "reload-engine" }); });
      cp.addEventListener("click", function () { copyText(msg.textContent, "Error copied"); });
      banner.appendChild(msg);
      banner.appendChild(again);
      banner.appendChild(cp);
      var col = document.querySelector(".content-column") || document.body;
      col.insertBefore(banner, col.firstChild);
    }
    banner.hidden = false;
    banner.querySelector(".ms-engine-msg").textContent = "The After Effects engine didn't load, so buttons can't work yet: " + error;
  }

  /* ---------- scrolling safety net ---------- */
  // Some After Effects versions don't scroll a panel's inner frames with the mouse wheel. Scroll the nearest
  // scrollable box by hand when the browser didn't (the Studio's own wheel handlers run first).
  window.addEventListener("wheel", function (e) {
    if (e.defaultPrevented || e.ctrlKey) { return; }
    var k = e.deltaMode === 1 ? 18 : (e.deltaMode === 2 ? 300 : 1), dy = e.deltaY * k, dx = e.deltaX * k, n = e.target;
    while (n && n.nodeType === 1 && n !== document.documentElement) {
      var cs = getComputedStyle(n);
      // The sideways preset strip (narrow panels): an ordinary wheel turn scrolls it left / right; at either
      // end the wheel goes back to scrolling the panel.
      if (n.id === "presets" && dy && !dx && cs.flexDirection === "row" && n.scrollWidth > n.clientWidth + 1) {
        var sx = n.scrollLeft;
        n.scrollLeft = sx + dy;
        if (n.scrollLeft !== sx) { e.preventDefault(); return; }
      }
      if (dy && /(auto|scroll)/.test(cs.overflowY) && n.scrollHeight > n.clientHeight + 1) {
        var before = n.scrollTop;
        n.scrollTop = before + dy;
        if (n.scrollTop !== before) { e.preventDefault(); return; }
      }
      if (dx && /(auto|scroll)/.test(cs.overflowX) && n.scrollWidth > n.clientWidth + 1) {
        var bx = n.scrollLeft;
        n.scrollLeft = bx + dx;
        if (n.scrollLeft !== bx) { e.preventDefault(); return; }
      }
      n = n.parentNode;
    }
  }, { passive: false });

  /* ---------- your palettes in the colour dialog ---------- */
  // The Studio's colour dialog (.kh-color-dialog, drawn by panel.js) gets the panel's palette library
  // (js/ms-palettes.js keeps it in localStorage "ms_palettes", which this frame shares): the active palette
  // first, then your own, then the built-in ones. Click a swatch to load it into the dialog; double-click to
  // apply it right away.
  var PC = host && host.paletteCore;
  function studioPalettes() {
    var st = null, out = [], seen = {}, list;
    try { st = JSON.parse(localStorage.getItem("ms_palettes") || "null"); } catch (e) { st = null; }
    list = (st && st.mine instanceof Array ? st.mine : []).concat(PC.BUILTIN);
    list.forEach(function (p) {
      if (!p || !p.name || !(p.colors instanceof Array) || seen[p.name]) { return; }
      seen[p.name] = 1;
      if (st && st.active === p.name) { out.unshift(p); } else { out.push(p); }
    });
    return out;
  }
  function addPalettes(dlg) {
    if (!PC || dlg.querySelector(".ms-pal")) { return; }
    var hexIn = dlg.querySelector('input[aria-label="Hex color"]'), ok = dlg.querySelector("footer button.primary"), foot = dlg.querySelector("footer");
    if (!hexIn || !foot) { return; }
    var box = el("div", "ms-pal"), head = el("div", "ms-pal-head"), sel = el("select", "ms-pal-pick"), strip = el("div", "ms-pal-strip"), pals = studioPalettes();
    head.appendChild(el("span", "", "Palettes"));
    pals.forEach(function (p, i) { var o = el("option", "", p.name); o.value = String(i); sel.appendChild(o); });
    head.appendChild(sel);
    function show() {
      var p = pals[Number(sel.value) || 0];
      while (strip.firstChild) { strip.removeChild(strip.firstChild); }
      p.colors.forEach(function (hex) {
        var b = el("button", "ms-pal-sw");
        b.type = "button";
        b.style.background = hex;
        b.title = PC.name(hex) + " · " + hex + " (double-click to apply)";
        b.addEventListener("click", function () {
          hexIn.value = hex;
          hexIn.dispatchEvent(new Event("input", { bubbles: true }));
        });
        b.addEventListener("dblclick", function () { if (ok && !ok.disabled) { ok.click(); } });
        strip.appendChild(b);
      });
    }
    sel.addEventListener("change", show);
    show();
    box.appendChild(head);
    box.appendChild(strip);
    foot.parentNode.insertBefore(box, foot);
  }
  if (PC && window.MutationObserver) {
    new MutationObserver(function () {
      var d = document.querySelector(".kh-color-dialog");
      if (d) { addPalettes(d); }
    }).observe(document.body, { childList: true });
  }

  /* ---------- focus outline only for the keyboard ---------- */
  // After Effects' browser draws its white focus box around whatever button the mouse just clicked.
  // Show focus outlines only while the keyboard is moving focus (Tab / arrows); a click hides them again.
  document.addEventListener("keydown", function (e) {
    if (e.key === "Tab" || /^Arrow/.test(e.key)) { document.documentElement.classList.add("ms-keys"); }
  }, true);
  document.addEventListener("mousedown", function () { document.documentElement.classList.remove("ms-keys"); }, true);

  window.addEventListener("message", function (ev) {
    var d = ev.data;
    if (!d || ev.source !== window.parent) { return; }
    if (d.ms === "studio-panels") { renderPanels(d.panels); }
    if (d.ms === "studio-tool") { setTool(d.id ? String(d.id) : null); }
    if (d.ms === "studio-rail" && d.rail) {
      railState = { order: d.rail.order || [], hidden: d.rail.hidden || [], hero: d.rail.hero || "cat:Easing" };
      applyRail();
    }
    if (d.ms === "studio-hero" && d.category) { openCategory(String(d.category)); }
    if (d.ms === "studio-host-theme") { followHost(!!d.dark); renderSettingsSoon(); }
    if (d.ms === "studio-toast" && d.text) { toast(String(d.text)); }
    if (d.ms === "studio-engine") { showEngine(!!d.ok, String(d.error || "")); }
    if (d.ms === "studio-theme") { applyAccent(String(d.accent || "blue")); }
    if (d.ms === "studio-settings" && d.data) {
      settingsData = d.data;
      applyAccent(settingsData.accent);
      renderSettingsSoon();
      var v = aboutBlock.querySelector(".ms-about-version");
      if (v) { v.textContent = "v" + settingsData.version + (settingsData.ae && settingsData.ae !== "unknown" ? " · After Effects " + settingsData.ae : ""); }
    }
    if (d.ms === "studio-about-msg") {
      aboutOut.textContent = String(d.text || "");
      aboutOut.className = "ms-about-out" + (d.error ? " error" : "");
      if (d.kind === "diagnostics") {
        // Shown as well as copied: the copy runs after a round trip, which some hosts no longer count as a click.
        reportBox.hidden = false;
        reportText.value = String(d.text || "");
        var copied = copyText(reportText.value, "Diagnostics copied — paste them into your message to support");
        aboutOut.textContent = copied ? "Diagnostics copied." : "Select the text below and press Ctrl/Cmd+C.";
        reportText.focus();
        reportText.select();
      }
      if (d.kind === "selftest" && d.report) { reportBox.hidden = false; reportText.value = String(d.report); }
    }
  });
  host.post({ ms: "studio-ready" });
})();
