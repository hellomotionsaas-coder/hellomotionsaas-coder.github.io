/* MotionSaas — "Explore it live": the real Studio (demo/studio, copied by the extension repo's
   scripts/site-demo.js) in an iframe, with a Light / Dark switch.
   The frame is on the same site, so the switch presses the Studio's own theme button (#nav-mode),
   which keeps the Studio's state in step. */
(function () {
  'use strict';
  var frame = document.querySelector('[data-explore-frame]');
  if (!frame) return;
  var btns = document.querySelectorAll('[data-explore-theme]');

  function studio() {
    try { return frame.contentDocument; } catch (e) { return null; }
  }
  function isDark(doc) { return !!(doc && doc.documentElement.classList.contains('dark-mode')); }
  function sync() {
    var dark = isDark(studio());
    btns.forEach(function (b) { b.setAttribute('aria-pressed', String((b.getAttribute('data-explore-theme') === 'dark') === dark)); });
  }

  btns.forEach(function (b) {
    b.addEventListener('click', function () {
      var doc = studio(), want = b.getAttribute('data-explore-theme') === 'dark';
      var toggle = doc && doc.getElementById('nav-mode');
      if (!toggle) return;
      if (isDark(doc) !== want) toggle.click();
      sync();
    });
  });

  frame.addEventListener('load', sync);
})();
