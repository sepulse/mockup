/* Lakaran pegun setiap babak S01 untuk index storyboard dan fallback tanpa WebGL (pembantu Iso, gaya pilot).
   VLAN, subnet dan komen rule ialah config sebenar router SSeM. Setiap fungsi memulangkan isi SVG;
   viewBox dikira daripada kotak sempadan sebenar. */
(function () {
  "use strict";
  var I = window.Iso, T = I.T, P = I.P, f1 = I.f1;
  var W = { 10: T.v10, 20: T.v20, 25: T.v25, 30: T.v30, 40: T.v40 };

  function teks(x, y, z, s, o) {
    o = o || {};
    var p = P(x, y, z);
    return '<text x="' + f1(p[0]) + '" y="' + f1(p[1]) + '" text-anchor="' + (o.anchor || "middle") + '" font-family="Segoe UI, sans-serif" font-size="' + (o.saiz || 20) +
      '" font-weight="700" fill="' + (o.warna || T.grafit) + '">' + s + "</text>";
  }
  function label(x, y, z, s, o) {
    o = o || {};
    var p = P(x, y, z), w = s.length * (o.saiz || 18) * 0.56 + 24;
    return '<g transform="translate(' + f1(p[0]) + " " + f1(p[1]) + ')"><rect x="' + f1(-w / 2) + '" y="-17" width="' + f1(w) + '" height="34" rx="7" fill="' + (o.isi || T.grafit) +
      '" stroke="' + T.grafit + '" stroke-width="2.5"/>' + (o.jalur ? '<rect x="' + f1(-w / 2 + 3) + '" y="-14" width="6" height="28" rx="2" fill="' + o.jalur + '"/>' : "") +
      '<text x="' + (o.jalur ? 4 : 0) + '" y="6.5" text-anchor="middle" font-family="Segoe UI, sans-serif" font-size="' + (o.saiz || 18) + '" font-weight="700" fill="' + (o.teks || T.permukaan) + '">' + s + "</text></g>";
  }
  function lantai(x0, y0, x1, y1, isi) { return I.poli([[x0, y0, 0], [x1, y0, 0], [x1, y1, 0], [x0, y1, 0]], isi, { tebal: 0 }); }
  function jalanX(x0, x1, y, lebar) {
    var s = lantai(x0, y - lebar / 2, x1, y + lebar / 2, T.asfalt);
    for (var x = x0 + 20; x < x1 - 30; x += 60) s += lantai(x, y - 2, x + 30, y + 2, T.permukaan);
    return s;
  }
  function jalanY(x, y0, y1, lebar, isi) { return lantai(x - lebar / 2, y0, x + lebar / 2, y1, isi || "#6B665F"); }
  function warnakanAtap(svg, zon) {
    return svg.replace(/(<g class="atap"[^>]*>)([\s\S]*?)(<\/g>)/, function (m, a, isi, b) {
      return a + isi.replace(/<polygon([^>]*)data-f="(-?[\d.]+)"/g, function (pm, attrs, f) {
        return "<polygon" + attrs.replace(/fill="[^"]*"/, 'fill="' + I.warna(W[zon], +f) + '"') + 'data-f="' + f + '"';
      }) + b;
    });
  }
  function rumah(x, y, zon) { var s = I.rumah(x - 28, y - 28, 56, 56, 42); return zon ? warnakanAtap(s, zon) : s; }
  function pagar(x0, y0, x1, y1, zon) {
    var w = W[zon], s = "";
    [[x0, y0, x1, y0], [x0, y0, x0, y1]].forEach(function (g) { s += I.poli([[g[0], g[1], 10], [g[2], g[3], 10], [g[2], g[3], 15], [g[0], g[1], 15]], I.warna(w, 0.2), { tebal: 1.8 }); });
    return s;
  }
  function pagarDepan(x0, y0, x1, y1, zon) {
    var w = W[zon], s = "";
    [[x0, y1, x1, y1], [x1, y0, x1, y1]].forEach(function (g) { s += I.poli([[g[0], g[1], 10], [g[2], g[3], 10], [g[2], g[3], 15], [g[0], g[1], 15]], I.warna(w, 0.2), { tebal: 1.8 }); });
    [[x0, y1], [x1, y1], [x1, y0]].forEach(function (c) { s += I.kotak(c[0] - 3, c[1] - 3, 0, 6, 6, 20, w, { tebal: 1.4 }); });
    return s;
  }
  function kereta(x, y, arah, jalur, bendera) {
    var p = P(x, y, 0), s = '<g transform="translate(' + f1(p[0]) + " " + f1(p[1]) + ')">' + I.kereta(arah, jalur);
    if (bendera) {
      s += '<line x1="0" y1="-26" x2="0" y2="-62" stroke="' + T.grafit + '" stroke-width="2.5"/>' +
        '<rect x="0" y="-64" width="40" height="24" rx="3" fill="' + W[bendera] + '" stroke="' + T.grafit + '" stroke-width="2"/>' +
        '<text x="20" y="-46.5" text-anchor="middle" font-family="Segoe UI, sans-serif" font-size="17" font-weight="700" fill="#fff">' + bendera + "</text>";
    }
    return s + "</g>";
  }
  function cincin(x, y, r, warna) { var b = I.bulatan(x, y, 0, r); return '<ellipse cx="' + b.cx + '" cy="' + b.cy + '" rx="' + b.rx + '" ry="' + b.ry + '" fill="none" stroke="' + warna + '" stroke-width="3.5"/>'; }
  function silang(x, y, z) { var p = P(x, y, z); return '<g transform="translate(' + f1(p[0]) + " " + f1(p[1]) + ')"><circle r="17" fill="' + T.bata + '"/><path d="M-7 -7 L7 7 M7 -7 L-7 7" stroke="#fff" stroke-width="4" stroke-linecap="round"/></g>'; }
  function tanda(x, y, z) { var p = P(x, y, z); return '<g transform="translate(' + f1(p[0]) + " " + f1(p[1]) + ')"><circle r="17" fill="' + T.v20 + '"/><path d="M-8 0 L-2 6 L8 -6" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></g>'; }
  function laluanPutus(titik, warna) {
    return '<polyline points="' + I.titik(titik.map(function (t) { return [t[0], t[1], 2]; })) + '" fill="none" stroke="' + (warna || T.terracotta) + '" stroke-width="4" stroke-dasharray="10 8" stroke-linecap="round"/>';
  }
  /* ---------- Babak ---------- */
  var DUNIA = [[-260, -150, 10], [-140, -150, 20], [20, -150, 25], [-200, 150, 30], [-80, 150, 30], [120, 150, 40]];
  function duniaKecil(bahagi) {
    var s = jalanX(-420, 300, 0, 80);
    DUNIA.forEach(function (d) { s += jalanY(d[0], d[1] < 0 ? d[1] + 30 : 40, d[1] < 0 ? -40 : d[1] - 30, 22); });
    if (bahagi) [[10, -260], [20, -140], [25, 20]].forEach(function (z) { s += pagar(z[1] - 50, -210, z[1] + 50, -96, z[0]); });
    DUNIA.filter(function (d) { return d[1] < 0; }).forEach(function (d) { s += rumah(d[0], d[1], bahagi ? d[2] : 0); });
    if (bahagi) [[10, -260], [20, -140], [25, 20]].forEach(function (z) { s += pagarDepan(z[1] - 50, -210, z[1] + 50, -96, z[0]); });
    s += I.kotak(-30, -70, 0, 14, 14, 90, "#9A938A") + I.kotak(-36, -76, 90, 52, 152, 34, T.grafit, { f: [0.12, 0, -0.15] }) + I.kotak(-30, 56, 0, 14, 14, 90, "#9A938A");
    if (bahagi) s += pagar(-250, 96, -30, 210, 30) + pagar(70, 96, 170, 210, 40);
    DUNIA.filter(function (d) { return d[1] > 0; }).forEach(function (d) { s += rumah(d[0], d[1], bahagi ? d[2] : 0); });
    if (bahagi) s += pagarDepan(-250, 96, -30, 210, 30) + pagarDepan(70, 96, 170, 210, 40);
    return s;
  }

  var LAKARAN = {
    b1: function () {
      var s = duniaKecil(false);
      DUNIA.forEach(function (d, i) { if (i !== 2) s += cincin(d[0], d[1], 46, T.terracotta); });
      s += cincin(20, -150, 30, T.terracotta) + cincin(20, -150, 60, T.terracotta);
      return s + label(20, -150, 150, "Pengumuman → semua", { isi: T.terracotta });
    },
    b2: function () {
      var s = duniaKecil(true);
      s += cincin(-80, 150, 46, T.v30) + cincin(-200, 150, 30, T.v30) + cincin(-200, 150, 56, T.v30);
      return s + label(-260, -210, 70, "10 Kewangan", { jalur: T.v10 }) + label(-140, -210, 70, "20 Staff", { jalur: T.v20 }) + label(20, -210, 70, "25 Executive", { jalur: T.v25 }) +
        label(-250, 210, 60, "30 Student", { jalur: T.v30 }) + label(70, 210, 60, "40 Guest", { jalur: T.v40 });
    },
    b3: function () {
      var s = jalanX(-330, 330, 0, 90);
      [[-60, 20], [0, 30], [60, 40]].forEach(function (d) { s += jalanY(-300 + d[0], 50, 190, 20); });
      s += I.kotak(-360, -70, 0, 90, 140, 80, T.grafit, { f: [0.15, 0, -0.18] }) + I.kotak(270, -70, 0, 90, 140, 80, T.terracotta, { f: [0.1, -0.05, -0.2] });
      s += kereta(-120, -18, "x", T.v20, 20) + kereta(0, 18, "x", T.v30, 30) + kereta(120, -18, "x", T.v40, 40);
      s += rumah(-360, 230, 20) + rumah(-300, 230, 30) + rumah(-240, 230, 40);
      return s + label(-315, 0, 110, "Switch", { isi: T.permukaan, teks: T.grafit }) + label(315, 0, 110, "Router MikroTik", { isi: T.permukaan, teks: T.grafit }) +
        label(0, 110, 0, "ether16-TRUNK · tag 10 20 25 30 40 98 99", { isi: T.terracotta, saiz: 16 });
    },
    b4: function () {
      var s = lantai(-340, -200, 340, 200, T.krim);
      s += lantai(-60, -190, 60, -110, "#D6CDBE");
      s += pagar(-320, -60, -40, 180, 20);
      s += rumah(-200, 80, 20) + I.kotak(160, 50, 0, 90, 60, 50, T.permukaan) + I.kotak(155, 45, 50, 100, 70, 8, T.asfalt);
      s += pagarDepan(-320, -60, -40, 180, 20);
      s += I.kotak(-30, -180, 0, 60, 60, 70, T.terracotta, { f: [0.1, -0.05, -0.2] });
      s += laluanPutus([[-200, 50], [-200, -60], [-30, -150], [30, -150], [200, -60], [200, 50]]);
      s += silang(0, 80, 20);
      return s + label(0, -150, 120, "Router MikroTik (Layer 3)", { isi: T.terracotta }) +
        label(-200, 180, 0, "VLAN 20 Staff · 172.16.22.0/23", { jalur: T.v20 }) + label(200, 180, 0, "Local Tech Bridge · 192.168.6.0/24", { isi: T.permukaan, teks: T.grafit }) +
        label(-200, -60, 60, "Gateway 172.16.22.1", { isi: T.permukaan, teks: T.grafit, saiz: 16 }) + label(200, -60, 60, "Gateway 192.168.6.1", { isi: T.permukaan, teks: T.grafit, saiz: 16 });
    },
    b6: function () {
      var s = lantai(-320, -160, 320, 220, T.krim);
      s += jalanX(-320, 320, 60, 80);
      s += I.kotak(-40, -80, 0, 80, 60, 60, T.permukaan) + I.kotak(-46, -86, 60, 92, 72, 10, T.bata, { f: [0, -0.1, -0.25] });
      s += kereta(-170, 60, "x", T.v20) + tanda(-170, 60, 70) + kereta(170, 60, "x", T.v30) + silang(170, 60, 70);
      var p = P(-40, -80, 150);
      s += '<g transform="translate(' + f1(p[0] + 60) + " " + f1(p[1] - 150) + ')"><rect width="480" height="166" rx="10" fill="' + T.permukaan + '" stroke="' + T.grafit + '" stroke-width="2.5"/>' +
        ["3  Allow Staff/Exec to Local LAN Resources", "4  VLAN 30 -> Deny to VLAN 20", "5  VLAN 40 -> Deny ALL local VLANs", "7  DEFAULT DENY"].map(function (r, i) {
          return '<text x="16" y="' + (36 + i * 36) + '" font-family="Consolas, monospace" font-size="17" font-weight="' + (i === 1 ? 700 : 500) + '" fill="' + (i === 1 ? T.bata : T.grafit) + '">' + r + "</text>";
        }).join("") + '<rect x="6" y="' + (14 + 36) + '" width="468" height="32" rx="6" fill="none" stroke="' + T.terracotta + '" stroke-width="3"/></g>';
      return s + label(0, -50, 100, "Firewall · chain forward", { isi: T.grafit }) + label(-170, 60, 110, "Staff", { jalur: T.v20 }) + label(170, 60, 110, "Student → Staff", { jalur: T.v30 });
    },
    b5: function () {
      var s = lantai(-340, -220, 340, 220, T.krim);
      s += pagar(-300, -160, 160, 180, 30);
      s += rumah(-200, -60, 30) + rumah(-60, -60, 30) + rumah(-200, 90, 30);
      s += I.kotak(50, -130, 0, 80, 70, 56, T.permukaan) + I.kotak(44, -136, 56, 92, 82, 10, T.v30, { f: [0, -0.1, -0.25] });
      s += cincin(-20, 100, 50, T.v30) + cincin(-20, 100, 90, T.v30) + rumah(-20, 100, 30);
      s += pagarDepan(-300, -160, 160, 180, 30);
      return s + label(90, -95, 110, "DHCP server VLAN 30 (router)", { jalur: T.v30 }) + label(-20, 100, 95, "DHCP Discover", { isi: T.v30 }) +
        label(80, 215, 0, "192.168.32.0/23 · pool .32.10 – .33.250 · lease 1d", { isi: T.permukaan, teks: T.grafit, saiz: 16 });
    }
  };

  function lukis(id, bekas) {
    var NS = "http://www.w3.org/2000/svg", svg = document.createElementNS(NS, "svg");
    svg.setAttribute("role", "img");
    svg.innerHTML = LAKARAN[id]();
    bekas.appendChild(svg);
    var b = svg.getBBox(), pad = 16;
    svg.setAttribute("viewBox", [b.x - pad, b.y - pad, b.width + pad * 2, b.height + pad * 2].map(f1).join(" "));
  }
  window.S01Lakaran = { lukis: lukis };
})();
