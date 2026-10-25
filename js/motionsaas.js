/* MotionSaas page: 3D panel, Hover demo, Carousel demo, video sound */
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function smooth(e0, e1, x) { var t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); }

  /* Run a rAF loop only while an element is on screen */
  function visibleLoop(el, frame) {
    var on = false, raf = 0, last = 0;
    function step(t) {
      var dt = last ? Math.min(0.05, (t - last) / 1000) : 0.016; last = t;
      frame(dt, t / 1000);
      if (on) raf = requestAnimationFrame(step);
    }
    function start() { if (!on) { on = true; last = 0; raf = requestAnimationFrame(step); } }
    function stop() { on = false; cancelAnimationFrame(raf); }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { en[0].isIntersecting ? start() : stop(); }, { threshold: 0 }).observe(el);
    } else start();
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); });
    return { kick: start };
  }

  /* =================================================================
     1) 3D PANEL — tilts toward the cursor, shadow + light reflection
     ================================================================= */
  (function panel3d() {
var stage = document.querySelector('[data-tilt-stage]');
    var card = document.querySelector('[data-tilt]');
    if (!stage || !card) return;
    var panel = card.querySelector('.panel');
    if (!panel) return;
    var shadow = stage.querySelector('.p3d__shadow');
    var floatEl = stage.querySelector('[data-apply-float]');
    var applyBtn = stage.querySelector('[data-apply3d]');
    var zone = stage.closest('.hero') || stage;
    var MAX_X = 10, MAX_Y = 14;               // max tilt in degrees
    var LIGHT = { x: -0.72, y: -0.69 };       // light comes from the top-left
    var tx = 0, ty = 0, cx = 0, cy = 0;       // target / current tilt (-1..1)
    var active = false, raf = 0, last = 0, flash = 0;

    function setTarget(clientX, clientY) {
      var r = card.getBoundingClientRect();
      tx = clamp((clientX - (r.left + r.width / 2)) / (r.width * 0.9), -1, 1);
      ty = clamp((clientY - (r.top + r.height / 2)) / (r.height * 0.9), -1, 1);
      active = true; kick();
    }
    function release() { active = false; tx = 0; ty = 0; kick(); }
    if (!reduce) {
      zone.addEventListener('pointermove', function (e) { if (e.pointerType === 'mouse' || e.pointerType === 'pen') setTarget(e.clientX, e.clientY); });
      zone.addEventListener('pointerleave', release);
    }

    function paintLight(x, y) {
      var face = (x * LIGHT.x) + (y * LIGHT.y);
      var hit = smooth(0.35, 0.95, face);
      panel.style.setProperty('--gx', (50 - x * 45).toFixed(1) + '%');
      panel.style.setProperty('--gy', (40 - y * 45).toFixed(1) + '%');
      panel.style.setProperty('--glare', (0.16 + hit * 0.5).toFixed(3));
      var sweep = -30 + 160 * smooth(0.1, 1.0, face);
      var bell = Math.exp(-Math.pow((sweep - 50) / 42, 2));
      if (flash > 0) { sweep = -30 + 160 * (1 - flash); bell = Math.max(bell, Math.sin(Math.PI * (1 - flash)) * 0.9); }
      panel.style.setProperty('--sx', sweep.toFixed(1) + '%');
      panel.style.setProperty('--sheen', (bell * 0.9).toFixed(3));
      panel.style.setProperty('--rim', (0.08 + hit * 0.35).toFixed(3));
    }
    paintLight(0, 0);

    function frame(t) {
      var dt = last ? Math.min(0.05, (t - last) / 1000) : 0.016; last = t;
      var k = 1 - Math.pow(active ? 0.0009 : 0.004, dt);   // smooth, frame-rate independent
      cx = lerp(cx, tx, k); cy = lerp(cy, ty, k);
      if (flash > 0) flash = Math.max(0, flash - dt / 0.9);
      var rest = !active && flash === 0 && Math.abs(cx) < 0.002 && Math.abs(cy) < 0.002;
      if (rest) {
        // Back at rest: drop every transform so the browser draws the panel pixel-sharp
        cx = cy = 0;
        card.style.transform = '';
        if (floatEl) floatEl.style.transform = '';
        if (shadow) { shadow.style.transform = ''; shadow.style.opacity = ''; }
        paintLight(0, 0);
        raf = 0; last = 0; return;
      }
      var ry = cx * MAX_Y, rx = -cy * MAX_X;
      card.style.transform = 'rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';
      // The Apply button floats in front, so it shifts further (parallax)
      if (floatEl) floatEl.style.transform = 'translate(' + (cx * 16).toFixed(1) + 'px,' + (cy * 12).toFixed(1) + 'px)';
      paintLight(cx, cy);
      if (shadow) {
        shadow.style.transform = 'translate(' + (-cx * 22).toFixed(1) + 'px,' + (cy * 6).toFixed(1) + 'px) scale(' + (1 + Math.abs(cx) * 0.08).toFixed(3) + ',' + (1 - cy * 0.12).toFixed(3) + ')';
        shadow.style.opacity = (0.85 - Math.abs(cx) * 0.15 + cy * 0.1).toFixed(3);
      }
      raf = requestAnimationFrame(frame);
    }
    function kick() { if (!raf) raf = requestAnimationFrame(frame); }

    // Apply button: ripple + "Applied" + a light sweep over the panel
    if (applyBtn) {
      var timer = 0;
      applyBtn.addEventListener('click', function (e) {
        var r = applyBtn.getBoundingClientRect(), d = Math.max(r.width, r.height) * 2.2;
        var rp = document.createElement('span'); rp.className = 'ripple';
        var x = (e.clientX || r.left + r.width / 2) - r.left, y = (e.clientY || r.top + r.height / 2) - r.top;
        rp.style.cssText = 'width:' + d + 'px;height:' + d + 'px;left:' + (x - d / 2) + 'px;top:' + (y - d / 2) + 'px';
        applyBtn.appendChild(rp); setTimeout(function () { rp.remove(); }, 650);
        applyBtn.classList.add('is-done'); floatEl.classList.add('is-used');
        clearTimeout(timer); timer = setTimeout(function () { applyBtn.classList.remove('is-done'); }, 1600);
        if (!reduce) { flash = 1; kick(); }
      });
    }
  })();

  /* =================================================================
     2) HOVER DEMO — squares grow when the cursor gets close
     ================================================================= */
  (function hoverDemo() {
    var stage = document.querySelector('[data-hover-demo]');
    if (!stage) return;
    var sqs = Array.prototype.slice.call(stage.querySelectorAll('.hsq'));
    var ghost = stage.querySelector('.ghost-cursor');
    var grid = stage.querySelector('.hgrid');
    var hint = stage.querySelector('.stage-hint');
    var scales = sqs.map(function () { return 1; });
    var px = -9999, py = -9999, inside = false, lastReal = 0;

    stage.addEventListener('pointermove', function (e) {
      var r = stage.getBoundingClientRect();
      px = e.clientX - r.left; py = e.clientY - r.top; inside = true; lastReal = performance.now();
    });
    stage.addEventListener('pointerdown', function (e) {
      var r = stage.getBoundingClientRect();
      px = e.clientX - r.left; py = e.clientY - r.top; inside = true; lastReal = performance.now();
    });
    stage.addEventListener('pointerleave', function () { inside = false; });
    stage.addEventListener('pointerup', function (e) { if (e.pointerType !== 'mouse') inside = false; });

    visibleLoop(stage, function (dt, time) {
      var r = stage.getBoundingClientRect();
      var useGhost = !inside && performance.now() - lastReal > 1500 && !reduce;
      var x = px, y = py;
      if (useGhost) {
        var g = grid.getBoundingClientRect();
        var gw = g.width, gh = g.height, ox = g.left - r.left, oy = g.top - r.top;
        x = ox + gw / 2 + Math.sin(time * 0.9) * gw * 0.55;
        y = oy + gh / 2 + Math.sin(time * 1.37 + 0.6) * gh * 0.55;
        if (ghost) ghost.style.transform = 'translate(' + (x - 4).toFixed(1) + 'px,' + (y - 2).toFixed(1) + 'px)';
      } else if (!inside) { x = -9999; y = -9999; }
      if (ghost) ghost.classList.toggle('is-on', useGhost);
      if (hint) hint.style.opacity = inside ? 0 : 1;

      sqs.forEach(function (sq, i) {
        var b = sq.getBoundingClientRect();
        var size = sq.offsetWidth;
        var cx = b.left - r.left + b.width / 2, cy = b.top - r.top + b.height / 2;
        var d = Math.hypot(x - cx, y - cy);
        var R = size * 0.75;
        var target = 1 + 0.42 * Math.exp(-(d * d) / (2 * R * R));
        scales[i] = lerp(scales[i], target, 0.16);
        sq.style.transform = 'scale(' + scales[i].toFixed(4) + ')';
        sq.style.zIndex = scales[i] > 1.05 ? 2 : 1;
      });
    });
  })();

  /* =================================================================
     3) CAROUSEL DEMO — Radial / Curved Line / Linear
        Items are only moved & scaled in 2D, so they always face the screen.
     ================================================================= */
  (function carouselDemo() {
    var stage = document.querySelector('[data-carousel-demo]');
    if (!stage) return;
    var root = stage.closest('.demo');
    var items = Array.prototype.slice.call(stage.querySelectorAll('.car-item'));
    var N = items.length;
    var svgPath = stage.querySelector('.car-svg path.curve');
    var guide = stage.querySelector('.car-svg path.guide');
    var pins = Array.prototype.slice.call(stage.querySelectorAll('.pin'));
    var modeBtns = root.querySelectorAll('[data-mode-btn]');
    var ctlPanels = root.querySelectorAll('[data-ctl]');
    var rxIn = root.querySelector('[data-rx]'), ryIn = root.querySelector('[data-ry]');
    var rxOut = root.querySelector('[data-rx-out]'), ryOut = root.querySelector('[data-ry-out]');
    var playBtn = root.querySelector('[data-play]');
    var resetBtn = root.querySelector('[data-reset-pins]');

    var mode = 'radial', playing = !reduce, phase = 0;
    var DEFAULT_PINS = [{ x: 0.12, y: 0.24 }, { x: 0.5, y: 0.7 }, { x: 0.88, y: 0.24 }];
    var P = DEFAULT_PINS.map(function (p) { return { x: p.x, y: p.y }; });
    var state = items.map(function () { return { x: 0, y: 0, s: 1, o: 0, init: false }; });
    var W = 0, H = 0;

    function measure() { W = stage.clientWidth; H = stage.clientHeight; }
    measure();
    window.addEventListener('resize', measure);

    function setFill(input) {
      var pct = (input.value - input.min) / (input.max - input.min) * 100;
      input.style.setProperty('--fill', pct + '%');
    }
    [rxIn, ryIn].forEach(function (inp) {
      if (!inp) return;
      setFill(inp);
      inp.addEventListener('input', function () {
        setFill(inp);
        if (inp === rxIn && rxOut) rxOut.textContent = inp.value + '°';
        if (inp === ryIn && ryOut) ryOut.textContent = inp.value + '°';
      });
    });

    function setMode(m) {
      mode = m;
      stage.setAttribute('data-mode', m);
      modeBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-mode-btn') === m)); });
      ctlPanels.forEach(function (c) { c.hidden = c.getAttribute('data-ctl') !== m; });
    }
    modeBtns.forEach(function (b) { b.addEventListener('click', function () { setMode(b.getAttribute('data-mode-btn')); }); });
    if (playBtn) {
      var syncPlay = function () {
        playBtn.setAttribute('aria-label', playing ? 'Pause animation' : 'Play animation');
        playBtn.innerHTML = playing
          ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6v12M15 6v12"/></svg>'
          : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" style="fill:currentColor;stroke:none"/></svg>';
      };
      playBtn.addEventListener('click', function () { playing = !playing; syncPlay(); loop.kick(); });
      syncPlay();
    }
    if (resetBtn) resetBtn.addEventListener('click', function () {
      DEFAULT_PINS.forEach(function (p, i) { P[i].x = p.x; P[i].y = p.y; });
    });

    /* Draggable pins */
    pins.forEach(function (pin, i) {
      pin.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        pin.setPointerCapture(e.pointerId);
        pin.classList.add('is-drag');
        var move = function (ev) {
          var r = stage.getBoundingClientRect();
          P[i].x = clamp((ev.clientX - r.left) / r.width, 0.04, 0.96);
          P[i].y = clamp((ev.clientY - r.top) / r.height, 0.06, 0.94);
        };
        var up = function () {
          pin.classList.remove('is-drag');
          pin.removeEventListener('pointermove', move);
          pin.removeEventListener('pointerup', up);
          pin.removeEventListener('pointercancel', up);
        };
        pin.addEventListener('pointermove', move);
        pin.addEventListener('pointerup', up);
        pin.addEventListener('pointercancel', up);
      });
      // keyboard nudging for accessibility
      pin.addEventListener('keydown', function (e) {
        var step = 0.02, used = true;
        if (e.key === 'ArrowLeft') P[i].x -= step; else if (e.key === 'ArrowRight') P[i].x += step;
        else if (e.key === 'ArrowUp') P[i].y -= step; else if (e.key === 'ArrowDown') P[i].y += step;
        else used = false;
        if (used) { e.preventDefault(); P[i].x = clamp(P[i].x, 0.04, 0.96); P[i].y = clamp(P[i].y, 0.06, 0.94); }
      });
    });

    /* Quadratic curve that passes through all three pins (middle at t = 0.5) */
    function curvePts() {
      var p0 = { x: P[0].x * W, y: P[0].y * H }, p1 = { x: P[1].x * W, y: P[1].y * H }, p2 = { x: P[2].x * W, y: P[2].y * H };
      var c = { x: 2 * p1.x - (p0.x + p2.x) / 2, y: 2 * p1.y - (p0.y + p2.y) / 2 };
      return { p0: p0, c: c, p2: p2, p1: p1 };
    }
    function qAt(cp, t) {
      var u = 1 - t;
      return { x: u * u * cp.p0.x + 2 * u * t * cp.c.x + t * t * cp.p2.x, y: u * u * cp.p0.y + 2 * u * t * cp.c.y + t * t * cp.p2.y };
    }
    var SAMPLES = 160, lut = new Array(SAMPLES + 1);
    function buildLut(cp) {
      var len = 0, prev = qAt(cp, 0); lut[0] = { t: 0, len: 0, x: prev.x, y: prev.y };
      for (var i = 1; i <= SAMPLES; i++) {
        var t = i / SAMPLES, pt = qAt(cp, t);
        len += Math.hypot(pt.x - prev.x, pt.y - prev.y);
        lut[i] = { t: t, len: len, x: pt.x, y: pt.y }; prev = pt;
      }
      return len;
    }
    function atLength(L) {
      var lo = 0, hi = SAMPLES;
      while (hi - lo > 1) { var mid = (lo + hi) >> 1; if (lut[mid].len < L) lo = mid; else hi = mid; }
      var a = lut[lo], b = lut[hi], f = (L - a.len) / ((b.len - a.len) || 1);
      return { x: lerp(a.x, b.x, f), y: lerp(a.y, b.y, f) };
    }

    var loop = visibleLoop(stage, function (dt) {
      if (!W) measure();
      if (playing) phase += dt;
      var base = mode === 'radial' ? Math.min(Math.max(W * 0.15, 56), 110) : Math.min(Math.max(W * 0.17, 66), 132);
      stage.style.setProperty('--cw', base.toFixed(1) + 'px');
      var targets = [];

      if (mode === 'radial') {
        var rx = (rxIn ? +rxIn.value : 20) * Math.PI / 180;
        var ry = (ryIn ? +ryIn.value : 0) * Math.PI / 180;
        var R = Math.min(W * (W < 600 ? 0.37 : 0.36), H * 0.42, 300), persp = 900;
        var spin = phase * 0.35;
        for (var i = 0; i < N; i++) {
          var a = spin + i * Math.PI * 2 / N;
          var x = R * Math.sin(a), y = 0, z = -R * Math.cos(a);   // ring in the X/Z plane
          var y1 = y * Math.cos(rx) - z * Math.sin(rx);           // rotate around X
          var z1 = y * Math.sin(rx) + z * Math.cos(rx);
          var x2 = x * Math.cos(ry) + z1 * Math.sin(ry);          // rotate around Y
          var z2 = -x * Math.sin(ry) + z1 * Math.cos(ry);
          var k = persp / (persp + z2 + R);                       // perspective
          targets.push({ x: W / 2 + x2 * k, y: H * 0.47 + y1 * k, s: k * 0.95, o: clamp(0.35 + k * 0.6, 0, 1), z: -z2 });
        }
      } else if (mode === 'curved') {
        var cp = curvePts();
        var total = buildLut(cp);
        // where the middle pin sits along the line
        var midLen = (function () { var best = 0, bd = 1e9; for (var j = 0; j <= SAMPLES; j++) { var d = Math.hypot(lut[j].x - cp.p1.x, lut[j].y - cp.p1.y); if (d < bd) { bd = d; best = lut[j].len; } } return best; })();
        var gap = 1 / N;
        for (var n = 0; n < N; n++) {
          var u = ((n * gap + phase * 0.06) % 1 + 1) % 1;
          var L = u * total, pt = atLength(L);
          var dm = (L - midLen) / Math.max(total, 1);
          var s = 0.72 + 0.68 * Math.exp(-(dm * dm) / (2 * 0.075 * 0.075));   // bigger at the middle pin
          var o = smooth(0, 0.07, u) * (1 - smooth(0.93, 1, u));
          targets.push({ x: pt.x, y: pt.y, s: s, o: o, z: s * 100 });
        }
        if (svgPath) svgPath.setAttribute('d', 'M' + cp.p0.x + ' ' + cp.p0.y + ' Q' + cp.c.x + ' ' + cp.c.y + ' ' + cp.p2.x + ' ' + cp.p2.y);
        if (guide) guide.setAttribute('d', 'M' + cp.p0.x + ' ' + cp.p0.y + ' L' + cp.p1.x + ' ' + cp.p1.y + ' L' + cp.p2.x + ' ' + cp.p2.y);
        pins.forEach(function (pin, i) { pin.style.transform = 'translate(' + (P[i].x * W).toFixed(1) + 'px,' + (P[i].y * H).toFixed(1) + 'px)'; });
      } else { // linear
        var spacing = Math.min(W * 0.19, 170);
        var count = N, span = spacing * count;
        for (var m = 0; m < N; m++) {
          var off = ((m * spacing - phase * 38) % span + span) % span - span / 2;
          var f = off / spacing;
          var sc = 0.62 + 0.62 * Math.exp(-(f * f) / 1.1);
          var op = 1 - smooth(span / 2 - spacing * 1.2, span / 2, Math.abs(off));
          targets.push({ x: W / 2 + off * (0.86 + 0.14 / (1 + f * f)), y: H / 2, s: sc, o: op, z: sc * 100 });
        }
      }

      for (var q = 0; q < N; q++) {
        var st = state[q], tg = targets[q], el = items[q];
        if (!st.init) { st.x = tg.x; st.y = tg.y; st.s = tg.s; st.o = tg.o; st.init = true; }
        var jump = Math.abs(tg.x - st.x) > W * 0.5;   // wrap-around: don't sweep across the stage
        var kk = jump ? 1 : 0.16;
        if (jump) st.o = 0;
        st.x = lerp(st.x, tg.x, kk); st.y = lerp(st.y, tg.y, kk); st.s = lerp(st.s, tg.s, 0.16); st.o = lerp(st.o, tg.o, 0.2);
        el.style.transform = 'translate3d(' + st.x.toFixed(1) + 'px,' + st.y.toFixed(1) + 'px,0) translate(-50%,-50%) scale(' + st.s.toFixed(4) + ')';
        el.style.opacity = st.o.toFixed(3);
        el.style.zIndex = String(Math.round(1000 + tg.z));
      }
    });

    setMode('radial');
  })();

  /* =================================================================
     4) TEXT ANIMATION DEMO — the same styles and settings as the plugin
     ================================================================= */
  (function textDemo() {
    var root = document.querySelector('[data-ta-demo]');
    if (!root) return;
    var stage = root.querySelector('[data-ta-stage]'), box = root.querySelector('[data-ta-text]');
    var input = root.querySelector('[data-ta-input]'), play = root.querySelector('[data-ta-play]');
    var styleBtns = root.querySelectorAll('[data-ta-style]'), amtRow = root.querySelector('[data-ta-amount-row]');
    var S = { style: 'rise', amt: 40, stag: 0.04, dur: 0.7, blur: 5 }, anims = [], timer = 0, visible = false;
    var UNITS = { amt: ' px', stag: ' s', dur: ' s', blur: ' px' };
    var EASE = 'cubic-bezier(.215,.61,.355,1)';

    function fromState() {
      var F = { o: 0, x: 0, y: 0, s: 1, b: S.blur };
      if (S.style === 'rise') F.y = S.amt;
      else if (S.style === 'drop') F.y = -S.amt;
      else if (S.style === 'left') F.x = -S.amt;
      else if (S.style === 'scale') F.s = 0;
      else if (S.style === 'blur') F.b = Math.max(S.blur, 18);
      return F;
    }
    function frame(F, a) {                       // a = 1 at the start, 0 when the letter has arrived
      return { opacity: 1 - a * (1 - F.o), transform: 'translate(' + (F.x * a).toFixed(2) + 'px,' + (F.y * a).toFixed(2) + 'px) scale(' + (1 + (F.s - 1) * a).toFixed(3) + ')', filter: 'blur(' + (F.b * a).toFixed(2) + 'px)' };
    }
    function build() {
      var txt = (input.value || ' ').slice(0, 24), html = '', i, ch;
      for (i = 0; i < txt.length; i++) { ch = txt.charAt(i); html += ch === ' ' ? ' ' : '<span>' + ch.replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }) + '</span>'; }
      box.innerHTML = html;
    }
    function stop() { clearTimeout(timer); anims.forEach(function (a) { try { a.cancel(); } catch (e) {} }); anims = []; }
    function run() {
      stop(); build();
      var spans = box.querySelectorAll('span'), F = fromState(), last = 0;
      if (!spans.length || !spans[0].animate || reduce) { return; }
      spans.forEach(function (sp, k) {
        var d = k * S.stag; last = d;
        anims.push(sp.animate([frame(F, 1), frame(F, 0)], { duration: S.dur * 1000, delay: d * 1000, easing: EASE, fill: 'both' }));
      });
      var total = (last + S.dur) * 1000;
      timer = setTimeout(function () {                       // hold, fade out, play again
        anims.push(box.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 350, easing: 'ease-in', fill: 'forwards' }));
        timer = setTimeout(function () { box.getAnimations && box.getAnimations().forEach(function (a) { a.cancel(); }); if (visible) run(); }, 420);
      }, total + 1300);
    }
    function fill(inp) { inp.style.setProperty('--fill', ((inp.value - inp.min) / (inp.max - inp.min) * 100) + '%'); }
    root.querySelectorAll('[data-ta]').forEach(function (inp) {
      var k = inp.getAttribute('data-ta'), out = root.querySelector('[data-ta-out="' + k + '"]');
      fill(inp);
      inp.addEventListener('input', function () {
        S[k] = +inp.value; fill(inp);
        if (out) out.textContent = (k === 'stag' ? S[k].toFixed(3).replace(/0$/, '') : String(S[k])) + UNITS[k];
      });
      inp.addEventListener('change', run);
    });
    styleBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        S.style = b.getAttribute('data-ta-style');
        styleBtns.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        amtRow.hidden = !(S.style === 'rise' || S.style === 'drop' || S.style === 'left');   // Amount only moves letters
        run();
      });
    });
    input.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(run, 250); });
    play.addEventListener('click', run);
    stage.addEventListener('click', run);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { var was = visible; visible = en[0].isIntersecting; if (visible && !was) run(); if (!visible) stop(); }, { threshold: 0.3 }).observe(stage);
    } else { visible = true; run(); }
  })();

  /* =================================================================
     5) Demo video sound toggle
     ================================================================= */
  (function sound() {
    var t = document.querySelector('[data-sound-toggle]');
    var v = document.querySelector('[data-demo-video]');
    if (!t || !v) return;
    t.addEventListener('click', function () {
      v.muted = !v.muted;
      if (!v.muted) { v.volume = 1; var p = v.play(); if (p && p.catch) p.catch(function () {}); }
      t.setAttribute('aria-pressed', String(!v.muted));
    });
  })();

  /* =================================================================
     6) Interactive section: glow + grid highlight follow the cursor
     ================================================================= */
  (function tryGlow() {
    var sec = document.getElementById('try');
    if (!sec) return;
    var nav = document.querySelector('.nav');
    function navTone() {
      if (!nav) return;
      var r = sec.getBoundingClientRect(), mid = 40;
      nav.classList.toggle('nav--dark', r.top < mid && r.bottom > mid);
    }
    window.addEventListener('scroll', navTone, { passive: true });
    window.addEventListener('resize', navTone);
    navTone();
    if (reduce) return;
    var x = 0, y = 0, raf = 0;
    function paint() { raf = 0; sec.style.setProperty('--mx', x + 'px'); sec.style.setProperty('--my', y + 'px'); }
    sec.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
      var r = sec.getBoundingClientRect();
      x = e.clientX - r.left; y = e.clientY - r.top;
      sec.style.setProperty('--glow', '1');
      if (!raf) raf = requestAnimationFrame(paint);
    });
    sec.addEventListener('pointerleave', function () { sec.style.setProperty('--glow', '0'); });
  })();
})();
