/* Pembantu isometrik 2:1 (gaya pilot VLAN) yang menghasilkan rentetan SVG.
   Paksi dunia: x ke kanan-bawah, y ke kiri-bawah, z ke atas. Unit ≈ piksel skrin. */
(function () {
  "use strict";
  var T = {
    krim: "#F4EDE1", permukaan: "#FFFBF3", bayang: "#EAE0CE", grafit: "#2E2B28", asfalt: "#57534E",
    terracotta: "#C8643B", bata: "#A9362C", tepi: "#BDB4A6", tepi2: "#979084", rumput: "#E6DCCB",
    dinding: "#F3EEE4", atapNeutral: "#8C857B", keretaBadan: "#E8E2D6", keretaNeutral: "#B9AFA0",
    v10: "#2563EB", v20: "#16A34A", v30: "#8B5CF6", v25: "#06B6D4", v40: "#F59E0B", v50: "#0F766E"
  };

  function P(x, y, z) { return [x - y, (x + y) * 0.5 - (z || 0)]; }
  function f1(n) { return Math.round(n * 10) / 10; }
  function titik(arr) { return arr.map(function (p) { var s = P(p[0], p[1], p[2]); return f1(s[0]) + "," + f1(s[1]); }).join(" "); }

  function warna(hex, f) {
    var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    function c(v) { return Math.max(0, Math.min(255, Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f))); }
    return "#" + ((1 << 24) | (c(r) << 16) | (c(g) << 8) | c(b)).toString(16).slice(1);
  }

  function poli(arr, isi, o) {
    o = o || {};
    return '<polygon points="' + titik(arr) + '" fill="' + isi + '" stroke="' + (o.garis || T.grafit) +
      '" stroke-width="' + (o.tebal == null ? 2.5 : o.tebal) + '" stroke-linejoin="round"' + (o.attr || "") + "/>";
  }

  /* Kotak: muka atas, muka +y (kiri-depan) dan muka +x (kanan-depan). o.f = faktor rona [atas, kiri, kanan]. */
  function kotak(x, y, z, w, d, h, isi, o) {
    o = o || {};
    var f = o.f || [0, -0.1, -0.22], a = o.attr || "";
    var atas = [[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]];
    var kiri = [[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h]];
    var kanan = [[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]];
    function m(arr, k) { return poli(arr, warna(isi, f[k]), { garis: o.garis, tebal: o.tebal, attr: a + ' data-f="' + f[k] + '"' }); }
    return m(kiri, 1) + m(kanan, 2) + m(atas, 0);
  }

  /* Rumah: dinding, pintu dan tingkap pada muka +y, bumbung pelana sepanjang x. */
  function rumah(x, y, w, d, h, o) {
    o = o || {};
    var atap = o.atap || T.atapNeutral, rh = o.tinggiAtap || 22, e = 5;
    var s = kotak(x, y, 0, w, d, h, T.dinding);
    var pintuX = x + w * 0.38, pw = w * 0.24;
    s += poli([[pintuX, y + d, 0], [pintuX + pw, y + d, 0], [pintuX + pw, y + d, h * 0.62], [pintuX, y + d, h * 0.62]], T.asfalt, { tebal: 2 });
    [x + w * 0.1, x + w * 0.72].forEach(function (tx) {
      s += poli([[tx, y + d, h * 0.42], [tx + w * 0.17, y + d, h * 0.42], [tx + w * 0.17, y + d, h * 0.78], [tx, y + d, h * 0.78]], "#B9CDD6", { tebal: 2 });
    });
    var g = '<g class="atap" data-asal="' + atap + '">';
    g += poli([[x - e, y - e, h], [x + w + e, y - e, h], [x + w + e, y + d / 2, h + rh], [x - e, y + d / 2, h + rh]], warna(atap, -0.18), { attr: ' data-f="-0.18"' });
    g += poli([[x + w, y, h], [x + w, y + d, h], [x + w, y + d / 2, h + rh]], warna(T.dinding, -0.2), { attr: ' data-tetap="1"' });
    g += poli([[x - e, y + d / 2, h + rh], [x + w + e, y + d / 2, h + rh], [x + w + e, y + d + e, h], [x - e, y + d + e, h]], atap, { attr: ' data-f="0"' });
    g += "</g>";
    return s + g;
  }

  /* Kamera CCTV di atas tiang (peranti zon 50). */
  function tiangCctv(x, y, o) {
    o = o || {};
    var s = kotak(x - 4, y - 4, 0, 8, 8, 70, "#A8A196");
    s += kotak(x - 18, y - 9, 66, 30, 18, 14, o.badan || "#D9D3C8");
    s += poli([[x + 12, y - 6, 69], [x + 18, y - 6, 69], [x + 18, y + 6, 77], [x + 12, y + 6, 77]], T.grafit, { tebal: 1.5 });
    return '<g class="atap" data-asal="#D9D3C8">' + s + "</g>";
  }

  /* Kereta (trafik). arah "x" atau "y". Dilukis di asal (0,0) supaya boleh dialih dengan translate. */
  function kereta(arah, jalur) {
    var L = 50, W = 26, s = "";
    var b = arah === "x" ? [-L / 2, -W / 2, L, W] : [-W / 2, -L / 2, W, L];
    var c = arah === "x" ? [-L / 2 + 12, -W / 2 + 3, 24, W - 6] : [-W / 2 + 3, -L / 2 + 12, W - 6, 24];
    s += '<ellipse cx="0" cy="6" rx="38" ry="16" fill="#000" opacity=".12"/>';
    s += kotak(b[0], b[1], 5, b[2], b[3], 11, T.keretaBadan, { tebal: 2 });
    if (arah === "x") s += poli([[b[0], b[1] + W, 8], [b[0] + L, b[1] + W, 8], [b[0] + L, b[1] + W, 12], [b[0], b[1] + W, 12]], jalur, { tebal: 0, attr: ' class="jalur-kereta"' });
    else s += poli([[b[0] + W, b[1], 8], [b[0] + W, b[1] + L, 8], [b[0] + W, b[1] + L, 12], [b[0] + W, b[1], 12]], jalur, { tebal: 0, attr: ' class="jalur-kereta"' });
    s += kotak(c[0], c[1], 16, c[2], c[3], 9, "#D5DEE2", { tebal: 2, f: [0.1, -0.12, -0.25] });
    return s;
  }

  /* Elips bulatan di lantai (z) dengan jejari r dunia. */
  function bulatan(cx, cy, z, r) {
    var p = P(cx, cy, z);
    return { cx: f1(p[0]), cy: f1(p[1]), rx: f1(r * 1.414), ry: f1(r * 0.707) };
  }

  /* Papan tanda skrin-rata di atas tiang (teks mudah dibaca di projektor). */
  function papan(x, y, teks, o) {
    o = o || {};
    var h = o.tinggi || 60, p = P(x, y, h), lebar = o.lebar || (teks.length * 13 + 36);
    var s = kotak(x - 2, y - 2, 0, 4, 4, h, "#8C857B", { tebal: 1.5 });
    s += '<g class="papan" transform="translate(' + f1(p[0]) + " " + f1(p[1]) + ')">';
    s += '<rect x="' + f1(-lebar / 2) + '" y="-44" width="' + lebar + '" height="44" rx="8" fill="' + (o.isi || T.grafit) + '" stroke="' + T.grafit + '" stroke-width="2.5"/>';
    if (o.jalur) s += '<rect class="papan-jalur" x="' + f1(-lebar / 2 + 6) + '" y="-40" width="' + (lebar - 12) + '" height="5" rx="2.5" fill="' + o.jalur + '"/>';
    s += '<text class="papan-teks" x="0" y="-13" text-anchor="middle" font-family="Segoe UI, sans-serif" font-size="' + (o.saiz || 22) + '" font-weight="700" fill="' + (o.teksWarna || T.permukaan) + '">' + teks + "</text></g>";
    return s;
  }

  window.Iso = { T: T, P: P, titik: titik, warna: warna, poli: poli, kotak: kotak, rumah: rumah, tiangCctv: tiangCctv, kereta: kereta, bulatan: bulatan, papan: papan, f1: f1 };
})();
