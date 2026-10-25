/* MotionSaas — 15% off popup.
   Shows once when the user opens the website for the first time.
   Does not appear again during the same session once closed.
   Appears again only when the user opens the site again (new browser session).
   Permanently stops once the user signs up. */
(function () {
  'use strict';

  var LOCAL_KEY = 'ms-offer-v1';
  var SESSION_KEY = 'ms_offer_shown_session';
  var CODE = 'MOTION15';
  var FIRST_DELAY = 3000; // 3 seconds after opening

  function readLocal() {
    try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}') || {}; }
    catch (e) { return {}; }
  }
  function writeLocal(o) {
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(o)); } catch (e) {}
  }

  // If user already signed up, never show again
  if (readLocal().joined) return;

  // If already shown during this session, do not show again
  try {
    if (sessionStorage.getItem(SESSION_KEY)) return;
  } catch (e) {}

  var box = document.createElement('div');
  box.className = 'offer';
  box.hidden = true;
  box.innerHTML =
    '<div class="offer__backdrop" data-offer-close></div>' +
    '<div class="offer__card" role="dialog" aria-modal="true" aria-labelledby="offer-h">' +
      '<button class="offer__x" type="button" data-offer-close aria-label="Close"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button>' +
      '<div class="offer__step" data-step="form">' +
        '<p class="offer__big" id="offer-h"><span>15%</span> off</p>' +
        '<p class="offer__sub">Enter your email to unlock your exclusive MotionSaas discount code.</p>' +
        '<form class="offer__form" name="newsletter" method="POST" novalidate>' +
          '<input type="hidden" name="form-name" value="newsletter">' +
          '<p hidden><label>Leave this empty <input name="bot-field" tabindex="-1" autocomplete="off"></label></p>' +
          '<label class="sr-only" for="offer-email">Email</label>' +
          '<input class="offer__input" id="offer-email" type="email" name="email" required autocomplete="email" placeholder="Enter your email">' +
          '<button class="offer__btn" type="submit"><span data-label>Get my code</span></button>' +
        '</form>' +
        '<p class="offer__err" data-err hidden>Please enter a valid email address.</p>' +
        '<p class="offer__fine">No spam. One-click unsubscribe anytime.</p>' +
      '</div>' +
      '<div class="offer__step" data-step="done" hidden>' +
        '<p class="offer__big"><span>15%</span> off</p>' +
        '<p class="offer__sub">Use this code at checkout for 15% off MotionSaas.</p>' +
        '<div class="offer__code"><code>' + CODE + '</code><button type="button" class="offer__copy" data-copy>Copy</button></div>' +
        '<a href="MotionSaaS.zip" download class="offer__btn offer__btn--wide" data-offer-close>Download MotionSaas</a>' +
      '</div>' +
    '</div>';

  var isOpen = false;
  var lastFocus = null;
  var timer = null;

  function busy() {
    var a = document.activeElement;
    return document.documentElement.classList.contains('modal-open') ||
      (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) && !box.contains(a));
  }

  function open() {
    if (isOpen || readLocal().joined) return;

    if (document.hidden || busy()) {
      // Retry in 4 seconds if tab is hidden or user is interacting with input
      timer = setTimeout(open, 4000);
      return;
    }

    // Mark as shown in this session so it will NEVER appear again in this visit
    try { sessionStorage.setItem(SESSION_KEY, 'true'); } catch (e) {}

    if (!box.parentNode) document.body.appendChild(box);
    isOpen = true;
    lastFocus = document.activeElement;
    box.hidden = false;
    document.documentElement.classList.add('offer-open');

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        box.classList.add('is-open');
      });
    });

    var input = box.querySelector('input[type=email]');
    if (input && window.matchMedia && window.matchMedia('(hover: hover)').matches) {
      setTimeout(function () { input.focus(); }, 450);
    }
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    box.classList.remove('is-open');
    document.documentElement.classList.remove('offer-open');
    setTimeout(function () {
      if (!isOpen) box.hidden = true;
    }, 450);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
    // Intentionally DO NOT reschedule! Once closed, it stays closed for this session.
  }

  box.addEventListener('click', function (e) {
    var c = e.target.closest('[data-offer-close]');
    if (!c) return;
    if (c.tagName !== 'A') e.preventDefault();
    close();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen) close();
  });

  var form = box.querySelector('form');
  var err = box.querySelector('[data-err]');
  var label = box.querySelector('[data-label]');

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    err.hidden = true;
    var email = form.email.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      err.textContent = 'Please enter a valid email address.';
      err.hidden = false;
      form.email.focus();
      return;
    }
    var btn = form.querySelector('button[type=submit]');
    btn.disabled = true;
    label.textContent = 'One sec…';

    function grantCode() {
      var s = readLocal();
      s.joined = Date.now();
      s.email = email;
      writeLocal(s);
      try { sessionStorage.setItem(SESSION_KEY, 'true'); } catch (e) {}

      try {
        var subs = JSON.parse(localStorage.getItem('motionsaas_subscribers') || '[]');
        if (subs.indexOf(email) === -1) {
          subs.push(email);
          localStorage.setItem('motionsaas_subscribers', JSON.stringify(subs));
        }
      } catch (err) {}

      if (timer) clearTimeout(timer);
      box.querySelector('[data-step="form"]').hidden = true;
      box.querySelector('[data-step="done"]').hidden = false;
      btn.disabled = false;
      label.textContent = 'Get my code';
    }

    try {
      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(new FormData(form)).toString()
      }).then(function () {
        grantCode();
      }).catch(function () {
        grantCode();
      });
    } catch (ex) {
      grantCode();
    }
  });

  var copy = box.querySelector('[data-copy]');
  if (copy) {
    copy.addEventListener('click', function () {
      var done = function () {
        copy.textContent = 'Copied';
        setTimeout(function () { copy.textContent = 'Copy'; }, 1600);
      };
      var fallback = function () {
        var r = document.createRange();
        r.selectNodeContents(box.querySelector('.offer__code code'));
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(r);
        try { document.execCommand('copy'); done(); } catch (e) { copy.textContent = 'Select & copy'; }
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(CODE).then(done, fallback);
      } else {
        fallback();
      }
    });
  }

  // Schedule to show once after FIRST_DELAY
  timer = setTimeout(open, FIRST_DELAY);
})();
