/* MotionSaas — contact form.
   GitHub Pages can't receive form posts, so the form opens the visitor's email app with the
   topic and message filled in (mailto:). Nothing is sent from the page and nothing goes into the URL bar. */
(function () {
  'use strict';
  var form = document.querySelector('[data-mail-form]');
  if (!form) return;
  var to = form.getAttribute('data-mail-form');
  var err = form.querySelector('[data-mail-err]');
  var fallback = form.querySelector('[data-mail-fallback]');

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var msg = form.message.value.trim();
    if (!msg) {
      err.hidden = false;
      form.message.focus();
      return;
    }
    err.hidden = true;
    var subject = 'MotionSaas: ' + form.topic.value;
    window.location.href = 'mailto:' + to + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(msg);
    // If no email app is set up, nothing visible happens; show the address to copy instead.
    setTimeout(function () { if (fallback) fallback.hidden = false; }, 1200);
  });

  form.message.addEventListener('input', function () { if (err && form.message.value.trim()) err.hidden = true; });
})();
