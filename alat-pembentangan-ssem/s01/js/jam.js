/* Jam animasi kongsi untuk variasi B dan C: tween berasaskan masa, boleh dijeda dan dibatalkan. */
(function () {
  "use strict";
  function cipta() {
    var t = 0, akhir = 0, dijeda = false, tugas = [], token = 0, setiapBingkai = [];
    function gelung(ts) {
      var dt = akhir ? Math.min(ts - akhir, 50) : 16;
      akhir = ts;
      if (!dijeda) {
        t += dt;
        var semasa = tugas;
        tugas = [];
        semasa = semasa.filter(function (k) {
          var p = Math.min(1, (t - k.mula) / k.ms);
          k.fn(p);
          if (p >= 1) { k.res(); return false; }
          return true;
        });
        tugas = semasa.concat(tugas);
      }
      setiapBingkai.forEach(function (f) { f(dt, dijeda); });
      requestAnimationFrame(gelung);
    }
    requestAnimationFrame(gelung);
    var jam = {
      tween: function (ms, fn) { return new Promise(function (res) { tugas.push({ mula: t, ms: ms, fn: fn, res: res }); }); },
      tunggu: function (ms) { return jam.tween(ms, function () {}); },
      jeda: function (b) { dijeda = b; },
      /* Batal: token baharu dahulu, kemudian setiap tween dibawa ke penghujung (keadaan akhir tidak tergantung separuh). */
      batal: function () { token++; var lama = tugas; tugas = []; lama.forEach(function (k) { k.fn(1); k.res(); }); return token; },
      token: function () { return token; },
      setiapBingkai: function (f) { setiapBingkai.push(f); },
      lembut: function (p) { return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; },
      /* Gerak sepanjang titik skrin pada laju tetap (unit/saat). fn(x, y, p) */
      sepanjang: function (titik, laju, fn) {
        var seg = [], jumlah = 0;
        for (var i = 1; i < titik.length; i++) {
          var d = Math.hypot(titik[i][0] - titik[i - 1][0], titik[i][1] - titik[i - 1][1]);
          seg.push(d); jumlah += d;
        }
        return jam.tween(Math.max(1, jumlah / laju * 1000), function (p) {
          var jarak = p * jumlah, j = 0;
          while (j < seg.length - 1 && jarak > seg[j]) { jarak -= seg[j]; j++; }
          var u = seg[j] ? Math.min(1, jarak / seg[j]) : 1, a = titik[j], b = titik[j + 1];
          fn(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, p);
        });
      }
    };
    return jam;
  }
  window.S01Jam = { cipta: cipta };
})();
