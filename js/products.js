/* =====================================================================
   MotionSaas — PRODUCT CATALOG
   ---------------------------------------------------------------------
   This is the file to edit to add, remove or re-price products.
   Every page (Home, Shop, product pages, cart) reads from this list.
   ===================================================================== */

window.VFX_STORE = {
  name: 'MotionSaas',
  currency: 'USD',
  payhipStore: 'https://payhip.com/MotionSaas'
};

window.VFX_PRODUCTS = [
  {
    id: 'motionsaas',
    name: 'MotionSaas Tool',
    payhip: 'rnUz6',
    price: 39,
    compareAt: 56,
    savePercent: 30,               // shown as "Save 30%" (56 → 39)
    category: 'After Effects plugin',
    tagline: 'Professional SaaS animations in one click.',
    short: '13+ one-click tools for text, UI, transitions, cursor and hover animations in After Effects.',
    image: 'images/panel-square.webp',
    page: '#top',
    badge: 'Bestseller',
    // Evergreen offer timer (restarts automatically every cycleDays)
    offer: { cycleDays: 7, anchorUTC: '2026-10-20T20:00:00Z' },
    description: 'MotionSaas is your all-in-one animation toolkit for Adobe After Effects.',
    features: ['13+ tools', 'Mac & Windows', 'After Effects 2019+', 'Instant download'],
    gallery: ['images/panel-hero.jpg', 'images/panel-square.webp'],
    video: 'media/trial-v2.mp4'
  },
  // Alias for backward compatibility with existing links/elements
  {
    id: 'saasfx',
    name: 'MotionSaas Tool',
    payhip: 'rnUz6',
    price: 39,
    compareAt: 56,
    savePercent: 30,
    category: 'After Effects plugin',
    tagline: 'Professional SaaS animations in one click.',
    short: '13+ one-click tools for text, UI, transitions, cursor and hover animations in After Effects.',
    image: 'images/panel-square.webp',
    page: '#top',
    badge: 'Bestseller',
    offer: { cycleDays: 7, anchorUTC: '2026-10-20T20:00:00Z' },
    description: 'MotionSaas is your all-in-one animation toolkit for Adobe After Effects.',
    features: ['13+ tools', 'Mac & Windows', 'After Effects 2019+', 'Instant download'],
    gallery: ['images/panel-hero.jpg', 'images/panel-square.webp'],
    video: 'media/trial-v2.mp4'
  }
];

/* =====================================================================
   AFFILIATES
   ===================================================================== */
window.VFX_AFFILIATES = {};

(function () {
  'use strict';
  var KEY = 'ms-aff-v1', DAYS = 30;
  try {
    var q = new URLSearchParams(window.location.search);
    var r = q.get('ref') || q.get('aff');
    if (r) localStorage.setItem(KEY, JSON.stringify({ r: r.trim(), t: Date.now() }));
  } catch (e) {}

  function affiliateKey() {
    try {
      var v = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (!v || !v.r || Date.now() - v.t > DAYS * 864e5) return '';
      var map = window.VFX_AFFILIATES || {};
      return map[v.r.toLowerCase()] || map[v.r] || v.r;
    } catch (e) { return ''; }
  }
  window.VFX_AFFILIATE = affiliateKey;

  /* Pass the affiliate key to every Payhip checkout */
  function wrapCheckout() {
    var C = window.Payhip && window.Payhip.Checkout;
    if (!C || C.__vfxAff || typeof C.open !== 'function') return;
    var open = C.open;
    C.open = function (opts) {
      var k = affiliateKey();
      if (k && opts && typeof opts === 'object' && !opts.affiliate) opts.affiliate = k;
      return open.apply(this, arguments);
    };
    C.__vfxAff = true;
  }
  document.addEventListener('click', wrapCheckout, true);
  window.addEventListener('load', wrapCheckout);
})();
