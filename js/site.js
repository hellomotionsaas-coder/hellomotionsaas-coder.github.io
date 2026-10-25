/* MotionSaas — shared site logic: prices, offer timers, cart, checkout, navigation, modals */
(function () {
  'use strict';

  var STORE = window.VFX_STORE || { name: 'MotionSaas', currency: 'USD' };
  var PRODUCTS = window.VFX_PRODUCTS || [];
  var CART_KEY = 'ms-cart-v1';

  function byId(id) {
    for (var i = 0; i < PRODUCTS.length; i++) if (PRODUCTS[i].id === id) return PRODUCTS[i];
    return null;
  }
  function money(n) {
    var s = (Math.round(n * 100) / 100).toFixed(2);
    if (s.slice(-3) === '.00') s = s.slice(0, -3);
    return '$' + s;
  }
  function savePct(p) {
    if (p.savePercent) return p.savePercent;
    return p.compareAt && p.compareAt > p.price ? Math.round((1 - p.price / p.compareAt) * 100) : 0;
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function productUrl(p) { return p.page || '#top'; }
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  window.VFX = { byId: byId, money: money, savePct: savePct, esc: esc, productUrl: productUrl };

  /* ------------------------------------------------------------------
     Price bindings: <span data-price="motionsaas">, data-compare, data-save
     ------------------------------------------------------------------ */
  function bindPrices(root) {
    root = root || document;
    root.querySelectorAll('[data-price]').forEach(function (el) {
      var p = byId(el.getAttribute('data-price')) || PRODUCTS[0];
      if (p) el.textContent = money(p.price);
    });
    root.querySelectorAll('[data-compare]').forEach(function (el) {
      var p = byId(el.getAttribute('data-compare')) || PRODUCTS[0];
      if (!p) return;
      if (p.compareAt && p.compareAt > p.price) { el.textContent = money(p.compareAt); el.hidden = false; }
      else el.hidden = true;
    });
    root.querySelectorAll('[data-save]').forEach(function (el) {
      var p = byId(el.getAttribute('data-save')) || PRODUCTS[0];
      if (!p) return;
      var pct = savePct(p);
      if (pct) { el.textContent = (el.getAttribute('data-save-format') || 'Save {p}%').replace('{p}', pct); el.hidden = false; }
      else el.hidden = true;
    });
  }

  /* ------------------------------------------------------------------
     Evergreen offer timers. Same for every visitor; restarts each cycle.
     ------------------------------------------------------------------ */
  function remaining(offer, now) {
    if (offer.endsUTC) {
      var left = Math.max(0, Math.floor((Date.parse(offer.endsUTC) - now) / 1000));
      return { d: Math.floor(left / 86400), h: Math.floor((left % 86400) / 3600), m: Math.floor((left % 3600) / 60), s: left % 60 };
    }
    var cycle = (offer.cycleDays || 7) * 86400000;
    var anchor = Date.parse(offer.anchorUTC || '2026-10-20T20:00:00Z');
    var elapsed = (now - anchor) % cycle;
    if (elapsed < 0) elapsed += cycle;
    var total = Math.floor((cycle - elapsed) / 1000);
    if (total >= cycle / 1000) total = cycle / 1000 - 1;
    return {
      d: Math.floor(total / 86400),
      h: Math.floor((total % 86400) / 3600),
      m: Math.floor((total % 3600) / 60),
      s: total % 60
    };
  }

  function rollDigits(el, v) {
    if (el.getAttribute('data-val') === v) return;
    var first = !el.hasAttribute('data-val');
    el.setAttribute('data-val', v);
    var slots = el.querySelectorAll('.dg');
    if (first || slots.length !== v.length) {
      el.textContent = '';
      for (var i = 0; i < v.length; i++) {
        var dg = document.createElement('span'); dg.className = 'dg';
        var cur = document.createElement('span'); cur.textContent = v.charAt(i);
        dg.appendChild(cur); el.appendChild(dg);
      }
      return;
    }
    for (var j = 0; j < v.length; j++) {
      var slot = slots[j];
      var live = slot.querySelector('span:not(.dg__out)');
      if (live && live.textContent === v.charAt(j)) continue;
      slot.querySelectorAll('.dg__out').forEach(function (o) { o.remove(); });
      if (live) {
        live.className = 'dg__out';
        (function (o) { setTimeout(function () { if (o.parentNode) o.remove(); }, 650); })(live);
      }
      var inn = document.createElement('span'); inn.className = 'dg__in'; inn.textContent = v.charAt(j);
      slot.appendChild(inn);
    }
  }

  function tickTimers() {
    var now = Date.now();
    document.querySelectorAll('[data-countdown]').forEach(function (g) {
      var p = byId(g.getAttribute('data-countdown')) || PRODUCTS[0];
      if (!p || !p.offer) return;
      var r = remaining(p.offer, now);
      var set = function (sel, v) { var e = g.querySelector(sel); if (e) rollDigits(e, v); };
      set('[data-d]', pad(r.d)); set('[data-h]', pad(r.h)); set('[data-m]', pad(r.m)); set('[data-s]', pad(r.s));
    });
    document.querySelectorAll('[data-countdown-inline]').forEach(function (el) {
      var p = byId(el.getAttribute('data-countdown-inline')) || PRODUCTS[0];
      if (!p || !p.offer) return;
      var r = remaining(p.offer, now);
      el.textContent = r.d + 'd ' + pad(r.h) + 'h ' + pad(r.m) + 'm ' + pad(r.s) + 's';
    });
  }

  /* ------------------------------------------------------------------
     Direct Free Download (Replaced payment checkout)
     ------------------------------------------------------------------ */
  function checkout(id) {
    var a = document.createElement('a');
    a.href = 'MotionSaaS.zip';
    a.setAttribute('download', 'MotionSaaS.zip');
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { if (a.parentNode) a.parentNode.removeChild(a); }, 100);
  }
  window.VFX.checkout = checkout;

  /* ------------------------------------------------------------------
     Cart (stored in this browser only; digital products → qty 1)
     ------------------------------------------------------------------ */
  function readCart() {
    try {
      var raw = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
      return Array.isArray(raw) ? raw.filter(function (id) { return !!byId(id); }) : [];
    } catch (e) { return memCart; }
  }
  var memCart = [];
  function writeCart(list) {
    memCart = list;
    try { localStorage.setItem(CART_KEY, JSON.stringify(list)); } catch (e) {}
    // cart disabled
  }
  function addToCart(id) {
    var p = byId(id) || PRODUCTS[0];
    if (!p) return;
    var targetId = p.id;
    var c = readCart();
    if (c.indexOf(targetId) === -1) c.push(targetId);
    writeCart(c);
  }
  function removeFromCart(id) {
    writeCart(readCart().filter(function (x) { return x !== id && byId(x) !== byId(id); }));
  }

  var drawer, overlay, lastFocus;
  function buildDrawer() {
    return; // Cart disabled for free direct download
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && document.documentElement.classList.contains('cart-open')) closeCart(); });
  }

  function renderCart() {
    var list = readCart();
    document.querySelectorAll('[data-cart-count]').forEach(function (b) {
      b.textContent = list.length; b.hidden = list.length === 0;
    });
    document.querySelectorAll('[data-cart-open]').forEach(function (b) {
      b.setAttribute('aria-label', 'Cart, ' + list.length + (list.length === 1 ? ' item' : ' items'));
    });
    if (!drawer) return;
    var body = drawer.querySelector('[data-cart-body]');
    var foot = drawer.querySelector('[data-cart-foot]');
    if (!list.length) {
      body.innerHTML = '<div class="cart__empty"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6.2"/><circle cx="10" cy="20" r="1.3"/><circle cx="17" cy="20" r="1.3"/></svg>' +
        '<p>Your cart is empty.</p><a class="btn btn--ghost btn--sm" href="#pricing" data-cart-close>Browse tools</a></div>';
      foot.innerHTML = '';
      return;
    }
    var total = 0, html = '';
    list.forEach(function (id) {
      var p = byId(id);
      if (!p) return;
      total += p.price;
      html += '<div class="cart-item">' +
        '<a href="' + esc(productUrl(p)) + '" class="cart-item__img" data-cart-close><img src="' + esc(p.image) + '" alt="' + esc(p.name) + '" width="64" height="64"></a>' +
        '<div class="cart-item__info"><a href="' + esc(productUrl(p)) + '" class="cart-item__name" data-cart-close>' + esc(p.name) + '</a>' +
        '<p class="cart-item__price"><strong>' + money(p.price) + '</strong>' + (p.compareAt && p.compareAt > p.price ? ' <s>' + money(p.compareAt) + '</s>' : '') + '</p>' +
        (list.length > 1 ? '<a href="https://payhip.com/b/' + esc(p.payhip) + '" class="btn btn--primary btn--xs" data-buy="' + esc(p.id) + '">Checkout this item</a>' : '') +
        '</div><button class="icon-btn icon-btn--sm" type="button" data-cart-remove="' + esc(p.id) + '" aria-label="Remove ' + esc(p.name) + '">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>';
    });
    body.innerHTML = html;
    if (list.length >= 1) {
      var only = byId(list[0]);
      foot.innerHTML = '<div class="cart__total"><span>Total</span><strong>' + money(total) + '</strong></div>' +
        '<a href="https://payhip.com/b/' + esc(only.payhip) + '" class="btn btn--primary btn--block" data-buy="' + esc(only.id) + '">Checkout MotionSaas</a>' +
        '<p class="cart__note">Secure checkout by Payhip · Instant download</p>';
    }
  }

  function openCart() {
    if (!drawer) // cart disabled
    // cart disabled
    lastFocus = document.activeElement;
    document.documentElement.classList.add('cart-open');
    drawer.setAttribute('aria-hidden', 'false');
    var btn = drawer.querySelector('[data-cart-close]'); if (btn) btn.focus();
  }

  function closeCart() {
    if (!drawer || !document.documentElement.classList.contains('cart-open')) return;
    document.documentElement.classList.remove('cart-open');
    drawer.setAttribute('aria-hidden', 'true');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  window.addEventListener('storage', function (e) { if (e.key === CART_KEY) renderCart(); });

  /* ------------------------------------------------------------------
     Modals: Contact Modal & Privacy Modal
     ------------------------------------------------------------------ */
  var contactModal, privacyModal;

  function buildContactModal() {
    if (contactModal) return;
    contactModal = document.createElement('div');
    contactModal.className = 'site-modal';
    contactModal.setAttribute('role', 'dialog');
    contactModal.setAttribute('aria-modal', 'true');
    contactModal.setAttribute('aria-labelledby', 'contact-modal-title');
    contactModal.hidden = true;
    contactModal.innerHTML =
      '<div class="site-modal__backdrop" data-contact-close></div>' +
      '<div class="site-modal__card">' +
        '<button class="site-modal__x" type="button" data-contact-close aria-label="Close">' +
          '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>' +
        '</button>' +
        '<div class="site-modal__head">' +
          '<h2 id="contact-modal-title">Get in touch</h2>' +
          '<p class="site-modal__sub">Have questions about MotionSaas or need support? We’re here to help.</p>' +
        '</div>' +
        '<form class="site-modal__form" data-contact-form>' +
          '<label class="site-modal__field"><span>Your Name</span>' +
            '<input type="text" name="name" required placeholder="Alex Morgan">' +
          '</label>' +
          '<label class="site-modal__field"><span>Email Address</span>' +
            '<input type="email" name="email" required placeholder="alex@example.com">' +
          '</label>' +
          '<label class="site-modal__field"><span>Message</span>' +
            '<textarea name="message" rows="4" required placeholder="How can we help you?"></textarea>' +
          '</label>' +
          '<button class="btn btn--primary btn--block" type="submit"><span>Send Message</span></button>' +
          '<p class="site-modal__success" hidden>Thank you! Your message has been sent. We will get back to you shortly.</p>' +
        '</form>' +
        '<div class="site-modal__direct">' +
          '<span>Or email us directly: </span>' +
          '<a href="mailto:support@motionsaas.com">support@motionsaas.com</a>' +
        '</div>' +
      '</div>';
    document.body.appendChild(contactModal);

    var cForm = contactModal.querySelector('[data-contact-form]');
    var sMsg = contactModal.querySelector('.site-modal__success');
    cForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var sBtn = cForm.querySelector('button[type="submit"]');
      sBtn.disabled = true;
      sBtn.querySelector('span').textContent = 'Sending…';
      setTimeout(function () {
        sBtn.hidden = true;
        sMsg.hidden = false;
        cForm.reset();
        setTimeout(function () {
          closeContactModal();
          sBtn.hidden = false;
          sBtn.disabled = false;
          sBtn.querySelector('span').textContent = 'Send Message';
          sMsg.hidden = true;
        }, 2200);
      }, 700);
    });
  }

  function openContactModal() {
    if (!contactModal) buildContactModal();
    contactModal.hidden = false;
    document.documentElement.classList.add('modal-open');
    requestAnimationFrame(function () { requestAnimationFrame(function () { contactModal.classList.add('is-open'); }); });
    var inp = contactModal.querySelector('input');
    if (inp) inp.focus();
  }

  function closeContactModal() {
    if (!contactModal || contactModal.hidden) return;
    contactModal.classList.remove('is-open');
    document.documentElement.classList.remove('modal-open');
    setTimeout(function () { contactModal.hidden = true; }, 300);
  }

  function buildPrivacyModal() {
    if (privacyModal) return;
    privacyModal = document.createElement('div');
    privacyModal.className = 'site-modal site-modal--wide';
    privacyModal.setAttribute('role', 'dialog');
    privacyModal.setAttribute('aria-modal', 'true');
    privacyModal.setAttribute('aria-labelledby', 'privacy-modal-title');
    privacyModal.hidden = true;
    privacyModal.innerHTML =
      '<div class="site-modal__backdrop" data-privacy-close></div>' +
      '<div class="site-modal__card">' +
        '<button class="site-modal__x" type="button" data-privacy-close aria-label="Close">' +
          '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>' +
        '</button>' +
        '<div class="site-modal__head">' +
          '<h2 id="privacy-modal-title">Privacy Policy</h2>' +
          '<p class="site-modal__sub">Last updated: 2026. Your privacy is respected and protected.</p>' +
        '</div>' +
        '<div class="site-modal__content legal-copy">' +
          '<h3>1. Payments & Personal Information</h3>' +
          '<p>All purchases of MotionSaas are processed securely by <strong>Payhip</strong>. Your sensitive payment details (credit cards, PayPal credentials) are never stored or seen by our servers.</p>' +
          '<h3>2. Local Storage</h3>' +
          '<p>We use standard browser localStorage to remember your shopping cart items and promotional discount state. This data stays on your device and is not shared with third parties.</p>' +
          '<h3>3. Analytics & Communications</h3>' +
          '<p>If you subscribe for promotional offers, we only use your email to provide discount codes and essential product updates. You can unsubscribe at any time with one click.</p>' +
          '<h3>4. Contact</h3>' +
          '<p>For privacy inquiries, contact us at <a href="mailto:support@motionsaas.com">support@motionsaas.com</a>.</p>' +
        '</div>' +
        '<button class="btn btn--ghost btn--block" type="button" data-privacy-close>Close</button>' +
      '</div>';
    document.body.appendChild(privacyModal);
  }

  function openPrivacyModal() {
    if (!privacyModal) buildPrivacyModal();
    privacyModal.hidden = false;
    document.documentElement.classList.add('modal-open');
    requestAnimationFrame(function () { requestAnimationFrame(function () { privacyModal.classList.add('is-open'); }); });
  }

  function closePrivacyModal() {
    if (!privacyModal || privacyModal.hidden) return;
    privacyModal.classList.remove('is-open');
    document.documentElement.classList.remove('modal-open');
    setTimeout(function () { privacyModal.hidden = true; }, 300);
  }

  /* ------------------------------------------------------------------
     Global click listener for all interactive triggers
     ------------------------------------------------------------------ */
  document.addEventListener('click', function (e) {
    var buy = e.target.closest('[data-buy]');
    if (buy) { e.preventDefault(); closeCart(); checkout(buy.getAttribute('data-buy')); return; }

    var add = e.target.closest('[data-add-to-cart]');
    if (add) {
      e.preventDefault();
      addToCart(add.getAttribute('data-add-to-cart'));
      var label = add.querySelector('[data-label]') || add;
      var original = add.getAttribute('data-original-label') || label.textContent;
      add.setAttribute('data-original-label', original);
      label.textContent = 'Added ✓';
      setTimeout(function () { label.textContent = original; }, 1600);
      openCart();
      return;
    }

    if (e.target.closest('[data-cart-open]')) { e.preventDefault(); openCart(); return; }
    if (e.target.closest('[data-cart-close]')) { e.preventDefault(); closeCart(); return; }

    var rm = e.target.closest('[data-cart-remove]');
    if (rm) { e.preventDefault(); removeFromCart(rm.getAttribute('data-cart-remove')); return; }

    if (e.target.closest('[data-contact-open]')) { e.preventDefault(); openContactModal(); return; }
    if (e.target.closest('[data-contact-close]')) { e.preventDefault(); closeContactModal(); return; }

    if (e.target.closest('[data-privacy-open]')) { e.preventDefault(); openPrivacyModal(); return; }
    if (e.target.closest('[data-privacy-close]')) { e.preventDefault(); closePrivacyModal(); return; }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closeContactModal();
      closePrivacyModal();
    }
  });

  /* ------------------------------------------------------------------
     Navigation with smooth scrolling & sliding indicator
     ------------------------------------------------------------------ */
  /* Highlights current nav tab based on URL path */
  function initNav() {
    var nav = document.querySelector('.nav');
    var buybar = document.querySelector('[data-buybar]');
    var trigger = document.querySelector('[data-buybar-trigger]');

    function onScroll() {
      var y = window.scrollY || window.pageYOffset;
      if (nav) nav.classList.toggle('is-scrolled', y > 8);
      if (buybar && trigger) buybar.classList.toggle('is-visible', trigger.getBoundingClientRect().bottom < 0);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    initNavIndicator();
  }

  /* Sliding glass highlight behind the current tab (bouncy), carried across page loads */
  function initNavIndicator() {
    var wrap = document.querySelector('.nav__links');
    if (!wrap) return;
    var links = Array.prototype.slice.call(wrap.querySelectorAll('a'));
    if (!links.length) return;

    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var ind = wrap.querySelector('.nav__ind');
    if (!ind) {
      ind = document.createElement('span');
      ind.className = 'nav__ind';
      ind.setAttribute('aria-hidden', 'true');
      wrap.insertBefore(ind, wrap.firstChild);
    }
    wrap.classList.add('has-ind');

    // Determine current active link
    var path = (window.location.pathname || '').toLowerCase();
    var isContact = path.includes('contact');
    var cur = null;

    if (isContact) {
      cur = wrap.querySelector('a[href*="contact"]') || links[links.length - 1];
    } else {
      cur = wrap.querySelector('a[aria-current="page"]') || 
            wrap.querySelector('a.is-on') || 
            links[0];
    }
    if (!cur) cur = links[0];

    var target = cur, shown = false;

    function mark(a) {
      links.forEach(function (l) {
        var active = (l === a);
        l.classList.toggle('is-on', active);
        if (active) l.setAttribute('aria-current', 'page');
        else l.removeAttribute('aria-current');
      });
    }

    function place(a, animate) {
      if (!a) { ind.style.opacity = '0'; wrap.classList.remove('ind-ready'); shown = false; return; }
      var w = a.offsetWidth;
      var left = a.offsetLeft;
      if (w <= 0) {
        wrap.classList.remove('ind-ready');
        return;
      }
      var instant = !animate || !shown || reduce;
      if (instant) ind.classList.add('no-anim');
      ind.style.width = w + 'px';
      ind.style.transform = 'translateX(' + left + 'px)';
      ind.style.opacity = '1';
      wrap.classList.add('ind-ready');
      shown = true;
      if (instant) { void ind.offsetWidth; ind.classList.remove('no-anim'); }
    }

    mark(cur);
    place(cur, false);

    links.forEach(function (a) {
      a.addEventListener('mouseenter', function () { place(a, true); });
      a.addEventListener('focus', function () { place(a, true); });
      a.addEventListener('click', function (e) {
        var href = a.getAttribute('href') || '';
        if (href.startsWith('#')) {
          e.preventDefault();
          target = a; place(a, true); mark(a);
          var targetEl = document.querySelector(href);
          if (targetEl) {
            targetEl.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
          }
          return;
        }
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        target = a; place(a, true); mark(a);
      });
    });
    wrap.addEventListener('mouseleave', function () { place(target, true); });

    window.addEventListener('resize', function () { place(target, false); });
    window.addEventListener('pageshow', function (e) {
      mark(cur);
      place(cur, false);
    });
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { place(target, false); });
    }
    setTimeout(function () { place(target, false); }, 50);
    setTimeout(function () { place(target, false); }, 250);
  }

  function initReveal() {
    var els = document.querySelectorAll('.reveal:not(.is-in)');
    if (!('IntersectionObserver' in window)) { els.forEach(function (el) { el.classList.add('is-in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
    els.forEach(function (el) { io.observe(el); });
  }

  function initLazyVideos() {
    var vids = document.querySelectorAll('video[data-lazy-video]');
    if (!('IntersectionObserver' in window)) { vids.forEach(function (v) { v.preload = 'auto'; v.autoplay = true; }); return; }
    var vo = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) { if (v.preload === 'none') v.preload = 'auto'; var p = v.play(); if (p && p.catch) p.catch(function () {}); }
        else v.pause();
      });
    }, { threshold: 0.25 });
    vids.forEach(function (v) { vo.observe(v); });
  }

  function init() {
    bindPrices();
    tickTimers();
    setInterval(tickTimers, 1000);
    // cart disabled
    buildContactModal();
    buildPrivacyModal();
    // cart disabled
    initNav();
    initReveal();
    initLazyVideos();
    document.querySelectorAll('[data-year]').forEach(function (y) { y.textContent = new Date().getFullYear(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
