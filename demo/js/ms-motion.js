// Switch motion, in the panel and in the Studio frame (studio/index.html loads ../js/ms-motion.js): a
// switch's knob stretches a little while it glides across (any .toggle-control whose aria-checked changes,
// and the tool panels' .ms-switch checkboxes). Buttons need no script: they press in and ease back in CSS.
// The curves and keyframes live in css/ms-extra.css and css/studio-extra.css (ms-knob). Nothing runs when
// the system asks for reduced motion. Plain ES5 for After Effects 2020 (Chromium 61).
(function () {
  "use strict";
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) { return; }

  function replay(el, cls) {   // restart a CSS animation on el
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }

  function knob(el) { if (el) { replay(el, "ms-flip"); } }
  if (window.MutationObserver) {
    new MutationObserver(function (records) {
      for (var i = 0; i < records.length; i++) {
        var t = records[i].target;
        if (t.classList && t.classList.contains("toggle-control") && records[i].oldValue !== t.getAttribute("aria-checked")) { knob(t); }
      }
    }).observe(document.documentElement, { subtree: true, attributes: true, attributeOldValue: true, attributeFilter: ["aria-checked"] });
  }
  document.addEventListener("change", function (e) {
    var t = e.target;
    if (t && t.type === "checkbox" && t.parentNode && t.parentNode.classList && t.parentNode.classList.contains("ms-switch")) { knob(t.parentNode); }
  }, true);

  document.addEventListener("animationend", function (e) {
    if (e.animationName === "ms-knob") { var f = e.target.closest ? e.target.closest(".ms-flip") : null; if (f) { f.classList.remove("ms-flip"); } }
  }, true);
})();
