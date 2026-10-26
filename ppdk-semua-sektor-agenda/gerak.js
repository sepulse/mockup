/* Gerak: animasi data gaya A-1 (assets/overview-swiss.js, master-a1/assets/a1-components.css).
   Gerak.run(root, opts) dipanggil di hujung setiap render. Ia:
   (a) count-up nombor (500 ms, easeOutCubic, dari nilai terakhir; muat pertama dari 0),
   (b) memutar semula bar (grow), titik (pop), kad/baris (muncul berperingkat 40 ms, had 400 ms).
   Tiada MutationObserver. Reduced motion: tiada animasi, nilai akhir terus (CSS + semakan di sini). */
(function () {
  'use strict';
  var PERIOD_MS = 500, STEP_MS = 40, CAP_MS = 400;
  /* Pemilih lalai. Nombor mesti tulen (digit sahaja); teks lain dibiarkan. */
  var NUMS = '[data-n], .nums b, .agg b, .tl b, .bar-r > b, .alert b';
  var BARX = '.bar-r .bar i, .mix .stk i';
  var BARY = '.trend i';
  var POPS = '.wd .dots i';
  var ITEMS = '.it, .li, .next, .alert, .chip, .sl a, .org, .none, .dh, .wd, .tl, .nums > div, .agg > div, .bar-r, .trend > div, .rw, .can li, .empty, .pcard';

  var tweens = (typeof WeakMap === 'function') ? new WeakMap() : null;
  var last = {};
  var typedAt = 0;

  function reduced() { return !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); }

  /* Taip dalam kotak carian: render semula ringan (tanpa stagger panjang). */
  document.addEventListener('input', function (e) {
    var t = e.target;
    if (t && (t.type === 'search' || t.id === 'q')) typedAt = Date.now();
  }, true);

  function readNum(el) {
    var t = String(el.textContent).replace(/^\s+|\s+$/g, '');
    if (!/^(\d{1,3}([,.\s ]\d{3})+|\d+)$/.test(t)) return null;
    var n = Number(t.replace(/\D/g, ''));
    return isFinite(n) ? n : null;
  }

  function stop(el) {
    if (!tweens) return;
    var id = tweens.get(el);
    if (id) cancelAnimationFrame(id);
    tweens.delete(el);
  }

  function tween(el, from, to) {
    stop(el);
    el.textContent = from.toLocaleString();
    var start = null;
    function step(now) {
      if (start === null) start = now;
      var p = Math.min(1, (now - start) / PERIOD_MS);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(from + (to - from) * eased).toLocaleString();
      if (p < 1) { if (tweens) tweens.set(el, requestAnimationFrame(step)); }
      else if (tweens) tweens.delete(el);
    }
    if (tweens) tweens.set(el, requestAnimationFrame(step)); else requestAnimationFrame(step);
  }

  function list(root, sel) { return [].slice.call(root.querySelectorAll(sel)); }

  function replay(els, cls, delayOf) {
    els.forEach(function (el) { el.classList.remove(cls); });
    if (els.length) void els[0].offsetWidth; /* paksa reflow supaya animasi berulang */
    els.forEach(function (el, i) { el.style.animationDelay = delayOf(i) + 'ms'; el.classList.add(cls); });
  }

  function run(root, opts) {
    opts = opts || {};
    if (!root || reduced()) return;
    var light = opts.light || (Date.now() - typedAt < 120);
    var rk = (root.id || root.className || 'r') + '|';
    var delay = light ? function (i) { return Math.min(i, 5) * 8; } : function (i) { return Math.min(i, 10) * STEP_MS; };
    var barDelay = function (i) { return Math.min(i, 10) * STEP_MS; };

    /* (a) nombor */
    list(root, opts.nums ? NUMS + ',' + opts.nums : NUMS).forEach(function (el, i) {
      var to = readNum(el);
      if (to === null) return;
      var key = rk + i, prev = last.hasOwnProperty(key) ? last[key] : 0;
      last[key] = to;
      if (prev === to) { stop(el); return; }
      tween(el, prev, to);
    });

    /* (b) bar, titik, kad */
    replay(list(root, opts.barsX ? BARX + ',' + opts.barsX : BARX), 'g-bx', barDelay);
    replay(list(root, BARY), 'g-by', barDelay);
    replay(list(root, POPS), 'g-pop', function (i) { return Math.min(i, 10) * 20; });
    replay(list(root, opts.items ? ITEMS + ',' + opts.items : ITEMS), 'g-in', delay);
  }

  window.Gerak = { run: run };
  if (window.M) window.M.gerak = run;
})();
