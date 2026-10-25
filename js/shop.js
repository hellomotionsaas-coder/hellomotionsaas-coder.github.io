/* MotionSaas — Shop page: shape field that reacts to the cursor, soft cursor light, card spotlight */
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- cursor light ---------- */
  var glow = document.querySelector('[data-glow]');
  var mx = -9999, my = -9999, gx = -9999, gy = -9999, hasMouse = false;
  window.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse') return;
    mx = e.clientX; my = e.clientY;
    if (!hasMouse) { hasMouse = true; gx = mx; gy = my; if (glow) glow.classList.add('is-on'); }
    kick();
  }, { passive: true });
  document.addEventListener('pointerleave', function () { mx = my = -9999; if (glow) glow.classList.remove('is-on'); kick(); });

  /* ---------- card spotlight ---------- */
  document.querySelectorAll('[data-spot]').forEach(function (el) {
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      el.style.setProperty('--x', (e.clientX - r.left) + 'px');
      el.style.setProperty('--y', (e.clientY - r.top) + 'px');
    });
  });

  /* ---------- intro: split the title into words for the entrance ---------- */
  var title = document.querySelector('.intro__title');
  if (title && !reduce) {
    var words = title.textContent.trim().split(/\s+/);
    title.setAttribute('aria-label', title.textContent.trim());
    title.innerHTML = words.map(function (w, i) {
      return '<span class="w" aria-hidden="true" style="--i:' + i + '">' + w.replace(/[&<>]/g, '') + '</span>';
    }).join(' ');
    title.classList.add('is-split');
  }

  /* ---------- shape field ---------- */
  var cv = document.querySelector('[data-field]');
  if (!cv || !cv.getContext) return;
  var ctx = cv.getContext('2d');
  var dpr = 1, W = 0, H = 0, cells = [];
  var GAP = 46, R = 190;
  var KINDS = ['sq', 'ci', 'tr', 'pl'];

  function rand(i) { var x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); }

  function build() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    GAP = W < 720 ? 40 : 46;
    cells = [];
    var cols = Math.ceil(W / GAP) + 1, rows = Math.ceil(H / GAP) + 1, n = 0;
    var ox = (W - (cols - 1) * GAP) / 2, oy = (H - (rows - 1) * GAP) / 2;
    for (var y = 0; y < rows; y++) for (var x = 0; x < cols; x++) {
      var r = rand(++n);
      if (r < 0.42) continue; // keep it sparse
      cells.push({ x: ox + x * GAP, y: oy + y * GAP, k: KINDS[Math.floor(rand(n + 999) * KINDS.length)], rot: rand(n + 7) * Math.PI, t: 0 });
    }
  }

  function shape(c, s, a, hot) {
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.rot + hot * 0.9);
    var col = hot > 0.02 ? 'rgba(' + Math.round(150 - 80 * hot) + ',' + Math.round(160 + 10 * hot) + ',255,' + a + ')' : 'rgba(255,255,255,' + a + ')';
    ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineWidth = 1.4;
    var h = s / 2;
    ctx.beginPath();
    if (c.k === 'sq') { ctx.rect(-h, -h, s, s); ctx.fill(); }
    else if (c.k === 'ci') { ctx.arc(0, 0, h, 0, Math.PI * 2); ctx.fill(); }
    else if (c.k === 'tr') { ctx.moveTo(0, -h); ctx.lineTo(h, h * 0.8); ctx.lineTo(-h, h * 0.8); ctx.closePath(); ctx.fill(); }
    else { ctx.moveTo(-h, 0); ctx.lineTo(h, 0); ctx.moveTo(0, -h); ctx.lineTo(0, h); ctx.stroke(); }
    ctx.restore();
  }

  var raf = 0, running = false;
  function kick() { if (!running && !reduce && fine) { running = true; raf = requestAnimationFrame(frame); } }

  function frame() {
    if (glow && hasMouse) {
      gx += (mx - gx) * 0.12; gy += (my - gy) * 0.12;
      glow.style.transform = 'translate3d(' + gx.toFixed(1) + 'px,' + gy.toFixed(1) + 'px,0)';
    }
    ctx.clearRect(0, 0, W, H);
    var moving = Math.abs(mx - gx) > 0.5 || Math.abs(my - gy) > 0.5;
    for (var i = 0; i < cells.length; i++) {
      var c = cells[i];
      var dx = c.x - mx, dy = c.y - my;
      var d = Math.sqrt(dx * dx + dy * dy);
      var target = d < R ? Math.pow(1 - d / R, 2) : 0;
      c.t += (target - c.t) * 0.14;
      if (Math.abs(target - c.t) > 0.002) moving = true;
      shape(c, 5 + c.t * 6, 0.07 + c.t * 0.5, c.t);
    }
    if (moving) raf = requestAnimationFrame(frame); else running = false;
  }

  function drawStatic() {
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < cells.length; i++) shape(cells[i], 5, 0.07, 0);
  }

  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () { build(); if (running) return; drawStatic(); kick(); }, 120);
  });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden && running) { cancelAnimationFrame(raf); running = false; }
  });

  build();
  drawStatic();
})();
