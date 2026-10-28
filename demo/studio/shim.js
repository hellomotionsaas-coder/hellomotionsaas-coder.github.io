// MotionSaaS Studio — runs before js/panel.js inside the Studio frame (extension/studio/index.html).
// 1. Fills in browser APIs that After Effects 2020-2021 (Chromium 61) lacks and the Studio uses.
// 2. When the frame is embedded in the extension (?embedded=1), gives the Studio a host:
//    window.MSStudio.call(cmd, payload) → Promise<result>, answered by the extension (js/ms-studio.js)
//    which runs MS.studio(cmd, payload) in After Effects (jsx/studio.jsx).
// Plain ES5 on purpose: it must run before anything else, on every supported After Effects.
(function () {
  "use strict";

  /* ---------- polyfills (AE 2020: Chromium 61) ---------- */

  // ResizeObserver (Chromium 64). The Studio only uses it to re-layout, so polling sizes is enough.
  if (!window.ResizeObserver) {
    var watched = [];
    var tick = function () {
      for (var i = 0; i < watched.length; i++) {
        var w = watched[i], r = w.el.getBoundingClientRect();
        if (r.width !== w.w || r.height !== w.h) {
          w.w = r.width; w.h = r.height;
          try { w.cb([{ target: w.el, contentRect: r }], w.owner); } catch (e) { setTimeout(function () { throw e; }); }
        }
      }
    };
    setInterval(tick, 200);
    window.addEventListener("resize", tick);
    window.ResizeObserver = function (cb) { this._cb = cb; };
    window.ResizeObserver.prototype.observe = function (el) { watched.push({ el: el, cb: this._cb, owner: this, w: -1, h: -1 }); setTimeout(tick, 0); };
    window.ResizeObserver.prototype.unobserve = function (el) { watched = watched.filter(function (w) { return !(w.el === el && w.owner === this); }, this); };
    window.ResizeObserver.prototype.disconnect = function () { watched = watched.filter(function (w) { return w.owner !== this; }, this); };
  }

  // Element.replaceChildren (Chromium 86).
  [window.Element, window.Document, window.DocumentFragment].forEach(function (C) {
    if (C && !C.prototype.replaceChildren) {
      C.prototype.replaceChildren = function () {
        while (this.lastChild) { this.removeChild(this.lastChild); }
        for (var i = 0; i < arguments.length; i++) {
          var n = arguments[i];
          this.appendChild(typeof n === "string" ? document.createTextNode(n) : n);
        }
      };
    }
  });

  // Element.toggleAttribute (Chromium 69).
  if (window.Element && !Element.prototype.toggleAttribute) {
    Element.prototype.toggleAttribute = function (name, force) {
      var on = force === undefined ? !this.hasAttribute(name) : !!force;
      if (on) { this.setAttribute(name, ""); } else { this.removeAttribute(name); }
      return on;
    };
  }

  // Promise.prototype.finally (Chromium 63).
  if (window.Promise && !Promise.prototype.finally) {
    Promise.prototype.finally = function (fn) {
      return this.then(function (v) { return Promise.resolve(fn()).then(function () { return v; }); },
        function (e) { return Promise.resolve(fn()).then(function () { throw e; }); });
    };
  }

  /* ---------- host bridge (only inside the extension) ---------- */

  var query = {};
  location.search.replace(/[?&]([^=&]+)=([^&]*)/g, function (m, k, v) { query[k] = decodeURIComponent(v); return m; });
  if (query.embedded !== "1" || window.parent === window) { return; }

  document.documentElement.className += " ms-embedded";
  var HOST_TIMEOUT = 60000;   // a long Apply (big comps, many layers) can take a while; never hang forever
  var pending = {}, nextId = 1;

  function post(msg) { msg.ms = msg.ms || "studio"; window.parent.postMessage(msg, "*"); }

  window.MSStudio = {
    query: query,
    post: post,
    current: null,   // the preset the Studio last sent ({ id, category, params }) — studio-tools.js reads it
    call: function (cmd, payload) {
      if (payload && payload.id) { window.MSStudio.current = { id: payload.id, category: payload.category, params: payload.params }; }
      return new Promise(function (resolve) {
        var id = nextId++;
        var timer = setTimeout(function () {
          delete pending[id];
          resolve({ ok: false, errors: ["After Effects did not answer in time. If a dialog is open in After Effects, close it and try again."] });
        }, HOST_TIMEOUT);
        pending[id] = function (result) { clearTimeout(timer); resolve(result); };
        post({ ms: "studio", id: id, cmd: String(cmd), payload: payload || {} });
      });
    }
  };

  window.addEventListener("message", function (ev) {
    var d = ev.data;
    if (!d || ev.source !== window.parent) { return; }
    if (d.ms === "studio-reply" && pending[d.id]) {
      var done = pending[d.id];
      delete pending[d.id];
      done(d.result && typeof d.result === "object" ? d.result : { ok: false, errors: ["Empty answer from After Effects."] });
    }
  });

  // The Studio enables Apply/Remove only when it sees a CEP host, and reads the panel colour from it to
  // pick light or dark. The real object lives in the extension window, so describe it here.
  // (cep=0: the extension itself is open in a plain browser — stay in the Studio's "Browser preview" mode.)
  if (!window.__adobe_cep__ && query.cep !== "0") {
    var dark = query.dark !== "0", grey = dark ? 50 : 214;
    window.__adobe_cep__ = {
      getHostEnvironment: function () {
        return JSON.stringify({
          appName: "AEFT", appVersion: query.ae || "",
          appSkinInfo: { panelBackgroundColor: { color: { red: grey, green: grey, blue: grey, alpha: 255 } } }
        });
      },
      evalScript: function (script, cb) { if (cb) { cb("EvalScript error."); } },
      addEventListener: function () {}, removeEventListener: function () {}, dispatchEvent: function () {}
    };
  }

  // Canvas colours pass through MSStudio.color(value, canvas) — studio-tools.js swaps it for the theme
  // recolouring. Hooked here, before panel.js, so the Studio's very first drawings go through it too.
  window.MSStudio.color = function (v) { return v; };
  (function () {
    var C = window.CanvasRenderingContext2D, G = window.CanvasGradient;
    if (!C || !G || !Object.getOwnPropertyDescriptor) { return; }
    ["fillStyle", "strokeStyle", "shadowColor"].forEach(function (prop) {
      var d = Object.getOwnPropertyDescriptor(C.prototype, prop);
      if (!d || !d.set || !d.configurable) { return; }
      Object.defineProperty(C.prototype, prop, {
        configurable: true, enumerable: d.enumerable, get: d.get,
        set: function (v) { d.set.call(this, typeof v === "string" ? window.MSStudio.color(v, this.canvas) : v); }
      });
    });
    ["createLinearGradient", "createRadialGradient"].forEach(function (fn) {
      var orig = C.prototype[fn];
      if (!orig) { return; }
      C.prototype[fn] = function () { var g = orig.apply(this, arguments); try { g._msCanvas = this.canvas; } catch (e) {} return g; };
    });
    var stop = G.prototype.addColorStop;
    G.prototype.addColorStop = function (o, c) { return stop.call(this, o, typeof c === "string" ? window.MSStudio.color(c, this._msCanvas) : c); };
  })();
})();
