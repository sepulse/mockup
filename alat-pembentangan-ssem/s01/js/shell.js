/* S01 · Shell kongsi untuk ketiga-tiga variasi: pentas 16:9, langkah, kawalan, panel.
   Skrip klasik (bukan ES module) supaya halaman boleh dibuka terus melalui file://.
   Pelukis (renderer) mesti menyediakan:
     init(bekas) → Promise | void
     setKeadaan({ warna, bahagi, beban, babak, ...medan langkah.keadaan lain }, { animasi })
     main(nama) → Promise          nama: "unicast" | "siaran" | "siaran-zon" | "bahagi" | "beban" | nama lain milik pelukis
     henti()                       batalkan animasi yang sedang berjalan
     jeda(benar)                   jeda / sambung jam animasi
     setLabel("analogi" | "teknikal")
   dan boleh memanggil this.bacaan(teks) untuk mengemas kini bacaan langsung.
   Medan langkah: banding: true (togol "bahagi") atau nama medan keadaan yang ditogol;
   butang[].kumpulan: butang dalam kumpulan yang sama bertindak sebagai pilihan (aria-pressed). */
(function () {
  "use strict";

  function el(tag, attrs, html) {
    var n = document.createElement(tag);
    for (var k in attrs || {}) n.setAttribute(k, attrs[k]);
    if (html != null) n.innerHTML = html;
    return n;
  }

  function mount(opt) {
    var langkah = opt.langkah, r = opt.renderer;
    /* Awalan "Bab NN" daripada pemetaan slaid (js/slaid.js), jika ada. */
    function bab(bb) { var m = opt.slaid && opt.slaid.babak[bb]; return m ? "Bab " + m.bab + " · " : ""; }
    var pentas = el("div", { class: "pentas", "data-panel": "buka" });
    pentas.innerHTML =
      '<header class="jalur-atas"><span class="tag-babak"></span><span class="tajuk"></span>' +
      '<span class="variasi-nama"></span></header>' +
      '<div class="kawasan-lukis" aria-live="off"></div>' +
      '<div class="kad-tindih" role="note"></div>' +
      '<aside class="panel">' +
      '  <div class="bacaan" aria-live="polite"></div>' +
      '  <div class="kad" data-jenis="analogi"><h3>Analogi</h3><div class="isi"></div></div>' +
      '  <div class="kad" data-jenis="teknikal"><h3>Istilah sebenar</h3><div class="isi"></div></div>' +
      '  <div class="kad" data-jenis="had" hidden><h3>ⓘ Nota analogi</h3><div class="isi"></div></div>' +
      '  <div class="aksi"></div>' +
      '</aside>' +
      '<nav class="jalur-bawah" aria-label="Kawalan simulator">' +
      '  <button data-k="sebelum" title="Langkah sebelumnya (←)">◀ Langkah</button>' +
      '  <button data-k="mula" class="utama" title="Mula (Space)">▶ Mula</button>' +
      '  <button data-k="jeda" aria-pressed="false" title="Pause (Space)">❚❚ Pause</button>' +
      '  <button data-k="ulang" title="Ulang langkah (R)">↺ Ulang</button>' +
      '  <button data-k="seterusnya" class="utama" title="Langkah seterusnya (→)">Langkah ▶</button>' +
      '  <span class="pemisah"></span>' +
      '  <button data-k="banding" aria-pressed="false" title="Sebelum / Selepas (B)">Sebelum | Selepas</button>' +
      '  <button data-k="label" aria-pressed="false" title="Analogi ↔ Teknikal (T)">A ↔ T</button>' +
      '  <button data-k="had" aria-pressed="false" title="Nota analogi (I)">ⓘ Nota</button>' +
      '  <button data-k="panel" title="Sembunyikan panel (H)">▤</button>' +
      '  <button data-k="penuh" title="Skrin penuh (F)">⛶</button>' +
      '  <span class="titik"></span>' +
      '</nav>';
    document.body.appendChild(pentas);

    var q = function (s) { return pentas.querySelector(s); };
    var kawasan = q(".kawasan-lukis"), tindih = q(".kad-tindih"), aksi = q(".aksi");
    q(".variasi-nama").textContent = opt.variasi || "";
    if (opt.notaKaki) pentas.insertBefore(el("p", { class: "nota-kaki" }, opt.notaKaki), q(".panel"));

    function skala() {
      var s = Math.min(innerWidth / 1920, innerHeight / 1080);
      pentas.style.transform = "translate(" + (-960 * s) + "px," + (-540 * s) + "px) scale(" + s + ")";
    }
    addEventListener("resize", skala);
    skala();

    r.bacaan = function (t) { q(".bacaan").textContent = t || ""; };

    var i = -1, labelMod = "analogi", sedangMain = false, dijeda = false, banding = false, bebanSemasa = 15, idMain = 0, semasa = null;

    /* Navigasi: butang babak (B1…B6) dan butang langkah bagi babak semasa sahaja, supaya muat dalam jalur. */
    var titik = q(".titik"), babakAwal = {}, senaraiBabak = [];
    langkah.forEach(function (l, n) {
      if (babakAwal[l.babak] == null) { babakAwal[l.babak] = n; senaraiBabak.push(l.babak); }
    });
    senaraiBabak.forEach(function (bb) {
      var b = el("button", { class: "label-babak", "data-babak": bb, title: bab(bb) + bb + " · " + langkah[babakAwal[bb]].namaBabak }, bb);
      b.onclick = function () { pergi(babakAwal[bb], false); };
      titik.appendChild(b);
      langkah.forEach(function (l, n) {
        if (l.babak !== bb) return;
        var s = el("button", { "data-n": n, "data-babak-sub": bb, title: bb + "." + (l.sub || n + 1) + " · " + l.tajuk, "aria-label": "Langkah " + bb + "." + (l.sub || n + 1) }, String(l.sub || n + 1));
        s.onclick = function () { pergi(n, false); };
        titik.appendChild(s);
      });
    });

    function keadaanPada(n) {
      var k = Object.assign({}, langkah[n].keadaan);
      k.warna = !!k.warna; k.bahagi = !!k.bahagi; k.beban = k.beban || 15; k.babak = langkah[n].babak;
      return k;
    }

    function papar(l) {
      q(".tag-babak").textContent = bab(l.babak) + l.babak + " · " + l.namaBabak;
      q(".tajuk").textContent = l.tajuk;
      q(".tajuk").classList.toggle("panjang", l.tajuk.length > 30);
      q('[data-jenis="analogi"] .isi').innerHTML = l.analogi;
      q('[data-jenis="teknikal"] .isi').innerHTML = l.teknikal;
      q('[data-jenis="had"] .isi').innerHTML = l.had;
      r.bacaan("");

      tindih.className = "kad-tindih";
      tindih.innerHTML = "";
      if (l.kad) {
        tindih.dataset.jenis = l.kad.jenis;
        tindih.innerHTML = l.kad.html;
        requestAnimationFrame(function () { tindih.classList.add("papar"); });
      } else if (l.senarai) {
        tindih.dataset.jenis = "senarai";
        tindih.innerHTML = "<b>" + l.senarai.tajuk + "</b><ol>" +
          l.senarai.item.map(function (t) { return "<li>" + t + "</li>"; }).join("") + "</ol>";
        requestAnimationFrame(function () { tindih.classList.add("papar"); });
      }

      aksi.innerHTML = "";
      (l.butang || []).forEach(function (b) {
        var n = el("button", b.kumpulan ? { "data-kumpulan": b.kumpulan, "data-main": b.main, "aria-pressed": String(!!b.aktif) } : {}, b.label);
        n.onclick = function () {
          if (b.kumpulan) Array.prototype.forEach.call(aksi.querySelectorAll('[data-kumpulan="' + b.kumpulan + '"]'), function (x) { x.setAttribute("aria-pressed", String(x === n)); });
          jalan(b.main);
        };
        aksi.appendChild(n);
      });
      if (l.slider) {
        var lab = el("label", {}, l.slider.label + ': <b class="nilai">' + bebanSemasa + "</b>");
        var inp = el("input", { type: "range", min: l.slider.min, max: l.slider.max, step: l.slider.step, value: bebanSemasa });
        inp.oninput = function () {
          bebanSemasa = +inp.value;
          lab.querySelector(".nilai").textContent = inp.value;
          setKeadaan(Object.assign({}, semasa, { beban: bebanSemasa }), true);
          if (!sedangMain && l.auto) jalan(l.auto);
        };
        inp.onchange = function () { inp.blur(); };
        lab.appendChild(inp);
        aksi.appendChild(lab);
      }
      if (l.senarai) {
        var s = el("button", {}, "Manfaat seterusnya");
        s.onclick = function () {
          var li = tindih.querySelector("li:not(.papar)");
          if (li) li.classList.add("papar");
          if (!tindih.querySelector("li:not(.papar)")) s.disabled = true;
        };
        aksi.appendChild(s);
      }

      Array.prototype.forEach.call(titik.querySelectorAll("button[data-n]"), function (b) {
        if (+b.dataset.n === i) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current");
        b.hidden = b.dataset.babakSub !== l.babak;
      });
      Array.prototype.forEach.call(titik.querySelectorAll("button[data-babak]"), function (b) {
        b.classList.toggle("semasa", b.dataset.babak === l.babak);
      });
      q('[data-k="banding"]').disabled = !l.banding;
      q('[data-k="banding"]').setAttribute("aria-pressed", "false");
      banding = false;
    }

    function setKeadaan(k, animasi) {
      semasa = Object.assign({}, k);
      r.setKeadaan(Object.assign({}, k), { animasi: animasi });
    }

    function jalan(nama) {
      if (!nama) return Promise.resolve();
      r.henti();
      if (dijeda) togolJeda();
      // Siaran zon tidak bermakna tanpa pagar (paparan "Sebelum"): mainkan siaran penuh.
      if (nama === "siaran-zon" && semasa && !semasa.bahagi) nama = "siaran";
      if (nama === "bahagi" && semasa) semasa.bahagi = true;
      var id = ++idMain;
      sedangMain = true;
      var tamat = function () { if (id === idMain) sedangMain = false; };
      return Promise.resolve(r.main(nama)).then(tamat, tamat);
    }

    function pergi(n, animasi) {
      if (!(n >= 0 && n < langkah.length)) return;
      r.henti();
      idMain++;
      sedangMain = false;
      var maju = n === i + 1;
      i = n;
      var k = keadaanPada(n);
      if (langkah[n].slider) k.beban = bebanSemasa;
      setKeadaan(k, !!(animasi && maju));
      papar(langkah[n]);
      if (animasi && maju && langkah[n].auto) jalan(langkah[n].auto);
    }

    function togolJeda() {
      dijeda = !dijeda;
      r.jeda(dijeda);
      q('[data-k="jeda"]').setAttribute("aria-pressed", String(dijeda));
    }

    function togolBanding() {
      var l = langkah[i];
      if (!l.banding) return;
      banding = !banding;
      q('[data-k="banding"]').setAttribute("aria-pressed", String(banding));
      var medan = l.banding === true ? "bahagi" : l.banding, k = Object.assign({}, semasa);
      k[medan] = !k[medan];
      r.henti();
      idMain++;
      sedangMain = false;
      r.bacaan("");
      setKeadaan(k, true);
    }

    function togolLabel() {
      labelMod = labelMod === "analogi" ? "teknikal" : "analogi";
      q('[data-k="label"]').setAttribute("aria-pressed", String(labelMod === "teknikal"));
      r.setLabel(labelMod);
    }

    function togolHad() {
      var h = q('[data-jenis="had"]');
      h.hidden = !h.hidden;
      q('[data-k="had"]').setAttribute("aria-pressed", String(!h.hidden));
    }

    function togolPanel() {
      pentas.dataset.panel = pentas.dataset.panel === "tutup" ? "buka" : "tutup";
      if (r.ubahSaiz) setTimeout(function () { r.ubahSaiz(); }, 420);
    }

    function penuh() {
      if (document.fullscreenElement) document.exitFullscreen();
      else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(function () {});
    }

    /* Butang utama langkah: pilihan kumpulan yang sedang ditekan, jika ada; jika tidak, butang pertama. */
    function mainUtama() {
      var p = aksi.querySelector('[data-kumpulan][aria-pressed="true"]');
      return p ? p.getAttribute("data-main") : langkah[i].butang && langkah[i].butang[0].main;
    }

    var tindakan = {
      sebelum: function () { pergi(i - 1, false); },
      seterusnya: function () { pergi(i + 1, true); },
      mula: function () { if (dijeda) togolJeda(); else jalan(langkah[i].auto || mainUtama()); },
      jeda: togolJeda,
      ulang: function () {
        var n = i, m = mainUtama(); i = n - 1; pergi(n, true);
        Array.prototype.forEach.call(aksi.querySelectorAll("[data-kumpulan]"), function (x) { x.setAttribute("aria-pressed", String(x.getAttribute("data-main") === m)); });
        if (!langkah[n].auto && m) jalan(m);
      },
      banding: togolBanding,
      label: togolLabel,
      had: togolHad,
      panel: togolPanel,
      penuh: penuh
    };
    Array.prototype.forEach.call(pentas.querySelectorAll(".jalur-bawah [data-k]"), function (b) {
      b.onclick = function () { if (i >= 0) tindakan[b.dataset.k](); };
    });

    addEventListener("keydown", function (e) {
      if (e.target.tagName === "INPUT" || i < 0) return;
      var k = e.key, f = null;
      if (k === "ArrowRight" || k === "PageDown") f = "seterusnya";
      else if (k === "ArrowLeft" || k === "PageUp") f = "sebelum";
      else if (k === " ") f = sedangMain ? "jeda" : "mula";
      else if (k === "r" || k === "R") f = "ulang";
      else if (k === "f" || k === "F") f = "penuh";
      else if (k === "h" || k === "H") f = "panel";
      else if (k === "t" || k === "T") f = "label";
      else if (k === "i" || k === "I") f = "had";
      else if (k === "b" || k === "B") f = "banding";
      else if (/^[1-9]$/.test(k)) {
        var bb = senaraiBabak[+k - 1];
        if (bb) pergi(babakAwal[bb], false);
        e.preventDefault();
        return;
      }
      if (f) { e.preventDefault(); tindakan[f](); }
    });

    Promise.resolve(r.init(kawasan)).then(function () {
      r.setLabel(labelMod);
      var h = location.hash.replace("#", "").toUpperCase();
      var awal = babakAwal[h] != null ? babakAwal[h] : parseInt(h, 10) - 1;
      pergi(isFinite(awal) ? Math.max(0, Math.min(langkah.length - 1, awal)) : 0, false);
    });

    return { pergi: pergi };
  }

  window.S01Shell = { mount: mount };
})();
