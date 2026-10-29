/* Makmal Rangkaian SSeM — teras: jam animasi, skop (batal tanpa bocor), pembantu SVG,
   objek peranti, sampul packet, kawalan panel dan penjalan bab. Tiada kebergantungan luar. */
(function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const MG = (window.MG = {});
  const BATAL = (MG.BATAL = Object.freeze({ batal: true }));

  /* ------------------------------------------------------------------ warna */
  MG.W = {
    kertas: '#F2F0EA', kertas2: '#E9E6DE', kad: '#FAF9F5', dakwat: '#111819', dakwat2: '#3B4648',
    pudar: '#5E6769', garis: '#D8D3C8', garis2: '#C7C1B4', grid: '#E4E0D6', aksen: '#B4462E',
    aksenGelap: '#5C2416', aksenCerah: '#F4C2B2', benar: '#0F766E', sekat: '#DC2626', putih: '#FFFFFF',
  };
  // Kumpulan VLAN ikut RSC SSeM sebenar (nama, subnet, gateway). Warna ikut token projek (video/enjin-iso/token.mjs).
  MG.KUMP = {
    kewangan: { nama: 'Kewangan', vlan: 10, warna: '#2563EB', gelap: '#1D4ED8', cerah: '#DBE6FD', subnet: '172.16.12.0/24', gw: '172.16.12.1', awal: '172.16.12.', ssem: 'VLAN10-Kewangan' },
    staf: { nama: 'Staf', vlan: 20, warna: '#16A34A', gelap: '#15803D', cerah: '#D7F0DF', subnet: '172.16.22.0/23', gw: '172.16.22.1', awal: '172.16.22.', ssem: 'VLAN20-Staff' },
    murid: { nama: 'Murid', vlan: 30, warna: '#8B5CF6', gelap: '#6D28D9', cerah: '#E9E1FD', subnet: '192.168.32.0/23', gw: '192.168.32.1', awal: '192.168.32.', ssem: 'VLAN30-Student' },
    tetamu: { nama: 'Tetamu', vlan: 40, warna: '#F59E0B', gelap: '#B45309', cerah: '#FCEBCB', subnet: '192.168.42.0/24', gw: '192.168.42.1', awal: '192.168.42.', ssem: 'VLAN40-Guest' },
    eksekutif: { nama: 'Eksekutif', vlan: 25, warna: '#06B6D4', gelap: '#0E7490', cerah: '#CFF3F9', subnet: '172.16.26.0/24', gw: '172.16.26.1', awal: '172.16.26.', ssem: 'VLAN25-Executive' },
  };

  /* ------------------------------------------------------------------ jam */
  const tugas = new Set();
  let dijeda = false, laju = 1, akhir = performance.now();
  const qs = new URLSearchParams(location.search);
  MG.statik = qs.has('statik') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  function gelung(t) {
    requestAnimationFrame(gelung); // didaftar dahulu: ralat dalam satu tugas tidak membekukan jam
    const dt = Math.min(50, t - akhir); akhir = t;
    if (!dijeda) for (const k of Array.from(tugas)) { try { k(dt * laju); } catch (e) { console.error(e); if (k.batal) k.batal(); } }
  }
  requestAnimationFrame(gelung);
  MG.jeda = (v) => { dijeda = v; document.dispatchEvent(new CustomEvent('mg-jeda', { detail: v })); };
  MG.dijeda = () => dijeda;
  MG.setLaju = (v) => { laju = v; };
  MG.bilTugas = () => tugas.size; // diagnostik: bilangan tween/ticker aktif (ujian kebocoran)

  const ease = {
    linear: (p) => p,
    io: (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2),
    out: (p) => 1 - Math.pow(1 - p, 3),
    keluarLantun: (p) => { const c = 1.6; return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); },
  };
  MG.ease = ease;

  /* Skop: semua tween, penanda masa dan ticker milik satu skop. henti() membatalkan semuanya
     sekali gus, jadi tukar langkah / ulang tidak meninggalkan timer yang bocor. */
  class Skop {
    constructor(induk) {
      this.hidup = true; this.ahli = new Set(); this.anak = new Set(); this.induk = induk || null;
      if (induk) induk.anak.add(this);
    }
    _daftar(k) { this.ahli.add(k); tugas.add(k); }
    _buang(k) { this.ahli.delete(k); tugas.delete(k); }
    tween(ms, fn, e) {
      const f = e || ease.io;
      return new Promise((res, rej) => {
        if (!this.hidup) return rej(BATAL);
        if (MG.statik || ms <= 0) { fn(1); return res(); }
        let t = 0;
        const k = (dt) => {
          t += dt; const p = Math.min(1, t / ms);
          fn(f(p));
          if (p >= 1) { this._buang(k); res(); }
        };
        k.batal = () => { this._buang(k); rej(BATAL); };
        this._daftar(k);
      });
    }
    tunggu(ms) { return this.tween(MG.statik ? 0 : ms, () => {}, ease.linear); }
    ticker(fn) {
      if (!this.hidup) return () => {};
      const k = (dt) => fn(dt);
      k.batal = () => this._buang(k);
      this._daftar(k);
      return () => this._buang(k);
    }
    henti() {
      this.hidup = false;
      if (this.induk) this.induk.anak.delete(this);
      for (const c of Array.from(this.anak)) c.henti();
      for (const k of Array.from(this.ahli)) k.batal();
      this.ahli.clear(); this.anak.clear();
    }
  }
  MG.Skop = Skop;
  MG.senyap = (p) => p.catch((e) => { if (e !== BATAL) console.error(e); });

  /* ------------------------------------------------------------------ SVG */
  const el = (MG.el = function (tag, at, induk) {
    const e = document.createElementNS(NS, tag);
    if (at) for (const k in at) if (at[k] != null) e.setAttribute(k, at[k]);
    if (induk) induk.appendChild(e);
    return e;
  });
  MG.g = (induk, at) => el('g', at, induk);
  MG.teks = function (induk, x, y, s, at) {
    const t = el('text', Object.assign({ x, y, 'font-size': 18, fill: MG.W.dakwat }, at), induk);
    t.textContent = s; return t;
  };
  MG.pindah = (n, x, y, s) => n.setAttribute('transform', `translate(${x.toFixed(1)},${y.toFixed(1)})` + (s != null && s !== 1 ? ` scale(${s.toFixed(3)})` : ''));
  MG.kosong = (n) => { while (n.firstChild) n.removeChild(n.firstChild); };
  MG.garisan = (induk, pts, at) => el('polyline', Object.assign({ points: pts.map((p) => p.x + ',' + p.y).join(' '), fill: 'none' }, at), induk);
  /* Defs bersama (kecerunan, bayang, gril). Diletak dalam <svg> tersembunyi sendiri kerana #svg
     dikosongkan setiap langkah; url(#id) dirujuk dari mana-mana SVG dalam dokumen. */
  MG.pastiDefs = function () {
    if (document.getElementById('mgDefs')) return;
    const s = el('svg', { id: 'mgDefs', width: 0, height: 0, 'aria-hidden': 'true', style: 'position:absolute;width:0;height:0;overflow:hidden' });
    const d = el('defs', null, s);
    const cerun = (id, hentian, at) => {
      const k = el('linearGradient', Object.assign({ id, x1: 0, y1: 0, x2: 0, y2: 1 }, at), d);
      hentian.forEach(([o, c, op]) => el('stop', { offset: o, 'stop-color': c, 'stop-opacity': op == null ? 1 : op }, k));
    };
    cerun('mgCasing', [[0, '#FFFFFF'], [1, '#E3DFD5']]);
    cerun('mgCasingGelap', [[0, '#E4E0D6'], [1, '#C6C0B2']]);
    cerun('mgLogam', [[0, '#46534F'], [0.08, '#3A4548'], [1, '#232B2E']]);
    cerun('mgMuka', [[0, '#3B4649'], [1, '#2C3538']]);
    cerun('mgTelefon', [[0, '#4A5558'], [1, '#2A3235']]);
    cerun('mgPlat', [[0, '#F6F3EC'], [1, '#D6D0C3']]);
    cerun('mgAwan', [[0, '#FCFDFD'], [1, '#D9E1E3']]);
    cerun('mgSampul', [[0, '#FFFFFF'], [1, '#EFECE4']]);
    const rb = el('radialGradient', { id: 'mgBayang' }, d);
    el('stop', { offset: 0, 'stop-color': '#111819', 'stop-opacity': 0.2 }, rb);
    el('stop', { offset: 0.6, 'stop-color': '#111819', 'stop-opacity': 0.08 }, rb);
    el('stop', { offset: 1, 'stop-color': '#111819', 'stop-opacity': 0 }, rb);
    const gril = el('pattern', { id: 'mgGril', width: 5, height: 8, patternUnits: 'userSpaceOnUse' }, d);
    el('rect', { x: 1, y: 0.5, width: 2.2, height: 7, rx: 1.1, fill: '#1F2729', opacity: 0.32 }, gril);
    document.body.appendChild(s);
  };

  MG.bayang = (induk, x, y, w, h) => el('ellipse', { cx: x, cy: y, rx: w * 0.55, ry: h * 0.6, fill: 'url(#mgBayang)' }, induk);
  // Skru kepala silang: kepala berkecerunan, alur silang condong, satu titik kilau
  MG.skru = (induk, x, y) => {
    el('circle', { cx: x, cy: y, r: 2.8, fill: 'url(#mgPlat)', stroke: '#6F6A60', 'stroke-width': 0.9 }, induk);
    el('path', { d: `M${x - 1.5} ${y - 0.9} L${x + 1.5} ${y + 0.9} M${x - 0.9} ${y + 1.5} L${x + 0.9} ${y - 1.5}`, stroke: '#5E594F', 'stroke-width': 0.9, 'stroke-linecap': 'round' }, induk);
  };

  /* ------------------------------------------------------------------ objek peranti
     Setiap peranti dilukis berpusat pada (0,0), ~70 px lebar. Garis luar 1.8 px dakwat, butiran
     garis rambut, kecerunan lembut (atas cerah, bawah gelap) dan satu kilau kaca pada skrin. */
  const W = MG.W;
  const DAKWAT = '#1F2729';
  const kaca = (g, x, y, w, h) => el('path', { d: `M${x} ${y} H${x + w * 0.58} L${x + w * 0.22} ${y + h} H${x} Z`, fill: '#fff', opacity: 0.2, 'pointer-events': 'none' }, g);
  MG.peranti = function (induk, jenis, x, y, o) {
    o = o || {};
    const g = MG.g(induk, { transform: `translate(${x},${y})` });
    const warna = o.warna || W.dakwat2, skrin = o.skrin || '#E7ECEE';
    const garis = { stroke: DAKWAT, 'stroke-width': 1.8, 'stroke-linejoin': 'round' };
    const halus = (w) => ({ stroke: DAKWAT, 'stroke-width': w || 1.3, 'stroke-linejoin': 'round' });
    if (jenis === 'pc') {
      MG.bayang(g, 0, 32, 74, 9);
      el('path', Object.assign({ d: 'M-21 26.5 Q-21 24 -18 24 H18 Q21 24 21 26.5 V28.5 Q21 31 18 31 H-18 Q-21 31 -21 28.5 Z', fill: 'url(#mgCasingGelap)' }, halus(1.5)), g);
      el('line', { x1: -17, y1: 25.3, x2: 17, y2: 25.3, stroke: '#fff', 'stroke-width': 1, opacity: 0.7 }, g);
      el('path', Object.assign({ d: 'M-6 16 H6 L7.5 24.2 H-7.5 Z', fill: 'url(#mgCasingGelap)' }, halus(1.4)), g);
      el('rect', { x: 1.6, y: 16.5, width: 4.6, height: 7.4, fill: '#000', opacity: 0.08 }, g);
      el('rect', { x: -33, y: -31, width: 70, height: 50, rx: 4.5, fill: '#B3AD9F' }, g); // tebal bezel (kanan/bawah)
      el('rect', Object.assign({ x: -35, y: -33, width: 70, height: 50, rx: 4.5, fill: 'url(#mgCasing)' }, garis), g);
      el('path', { d: 'M-34.1 9.5 H34.1 V12.5 Q34.1 16.1 30.5 16.1 H-30.5 Q-34.1 16.1 -34.1 12.5 Z', fill: '#E2DDD2' }, g);
      el('line', { x1: -34.1, y1: 9.5, x2: 34.1, y2: 9.5, stroke: '#A9A397', 'stroke-width': 0.8 }, g);
      el('rect', { x: -4, y: 11.8, width: 8, height: 2, rx: 1, fill: '#B5AFA2' }, g);
      el('circle', { cx: 29, cy: 12.8, r: 3, fill: W.benar, opacity: 0.18 }, g);
      el('circle', { cx: 29, cy: 12.8, r: 1.4, fill: W.benar }, g);
      el('rect', { x: -30.5, y: -28.5, width: 61, height: 35.5, rx: 1.5, fill: skrin, class: 'skrin', stroke: '#4E5857', 'stroke-width': 1 }, g);
      el('rect', { x: -30, y: -28, width: 60, height: 2.6, fill: '#000', opacity: 0.08 }, g);
      kaca(g, -30.5, -28.5, 61, 35.5);
    } else if (jenis === 'laptop') {
      MG.bayang(g, 0, 29, 86, 9);
      el('rect', Object.assign({ x: -29, y: -31, width: 58, height: 42, rx: 4, fill: 'url(#mgCasing)' }, garis), g);
      el('rect', { x: -25, y: -27, width: 50, height: 32.5, rx: 1.5, fill: skrin, class: 'skrin', stroke: '#4E5857', 'stroke-width': 1 }, g);
      el('rect', { x: -24.5, y: -26.5, width: 49, height: 2.4, fill: '#000', opacity: 0.08 }, g);
      kaca(g, -25, -27, 50, 32.5);
      el('circle', { cx: 0, cy: -29.1, r: 0.95, fill: '#4E5857' }, g);
      el('rect', Object.assign({ x: -22, y: 9.8, width: 44, height: 3.2, rx: 1.6, fill: '#B9B3A6' }, halus(1.1)), g);
      el('path', Object.assign({ d: 'M-33.5 13 H33.5 L38.5 21 H-38.5 Z', fill: 'url(#mgCasing)' }, garis), g);
      el('path', Object.assign({ d: 'M-38.5 21 H38.5 V22.8 Q38.5 25.3 36 25.3 H-36 Q-38.5 25.3 -38.5 22.8 Z', fill: 'url(#mgCasingGelap)' }, halus(1.5)), g);
      for (let r = 0; r < 2; r++) {
        const yy = 14.6 + r * 2.7, lebar = 58 + r * 4.4, n = 12, kk = lebar / n;
        for (let i = 0; i < n; i++) el('rect', { x: -lebar / 2 + i * kk + 0.45, y: yy, width: kk - 0.9, height: 1.9, rx: 0.4, fill: '#9C968A', opacity: 0.75 }, g);
      }
      el('rect', { x: -7, y: 20, width: 14, height: 0.9, rx: 0.45, fill: '#9C968A' }, g);
      el('rect', { x: -5, y: 22.9, width: 10, height: 1, rx: 0.5, fill: '#8E897D', opacity: 0.7 }, g);
    } else if (jenis === 'telefon') {
      MG.bayang(g, 0, 31, 46, 7);
      el('rect', { x: 16.2, y: -19, width: 2.6, height: 9, rx: 1.2, fill: '#2B3437' }, g);
      el('rect', { x: 16.2, y: -7, width: 2.6, height: 5.5, rx: 1.2, fill: '#2B3437' }, g);
      el('rect', { x: -18.8, y: -15, width: 2.6, height: 7, rx: 1.2, fill: '#2B3437' }, g);
      el('rect', Object.assign({ x: -17, y: -32, width: 34, height: 60, rx: 7, fill: 'url(#mgTelefon)' }, garis), g);
      el('rect', { x: -15.6, y: -30.6, width: 31.2, height: 57.2, rx: 5.8, fill: 'none', stroke: '#fff', 'stroke-width': 0.8, opacity: 0.16 }, g);
      el('rect', { x: -13.5, y: -26.5, width: 27, height: 47, rx: 2.5, fill: skrin, class: 'skrin' }, g);
      kaca(g, -13.5, -26.5, 27, 47);
      el('rect', { x: -4.5, y: -29.6, width: 9, height: 2.3, rx: 1.15, fill: '#0E1314' }, g);
      el('circle', { cx: 2.6, cy: -28.45, r: 0.8, fill: '#3E5A66' }, g);
      el('rect', { x: -5, y: 23, width: 10, height: 1.6, rx: 0.8, fill: '#8F999B' }, g);
    } else if (jenis === 'kamera') {
      MG.bayang(g, 0, 34, 70, 9);
      el('path', Object.assign({ d: 'M14 -30 H30 V-18 H14 Z', fill: 'url(#mgCasingGelap)' }, halus(1.5)), g);
      MG.skru(g, 18, -24); MG.skru(g, 26, -24);
      el('path', Object.assign({ d: 'M22 -18 L22 -8 L12 -2', fill: 'none' }, garis), g);
      el('rect', Object.assign({ x: -30, y: -14, width: 48, height: 26, rx: 9, fill: 'url(#mgCasing)', transform: 'rotate(12)' }, garis), g);
      el('circle', Object.assign({ cx: -26, cy: -5, r: 10, fill: W.dakwat2 }, garis), g);
      el('circle', { cx: -26, cy: -5, r: 5.5, fill: skrin, class: 'skrin' }, g);
      el('circle', { cx: -28, cy: -7, r: 1.8, fill: '#fff', opacity: 0.8 }, g);
    } else if (jenis === 'ap') {
      MG.bayang(g, 0, 26, 70, 7);
      el('path', Object.assign({ d: 'M-38 0 V5 Q-38 15 0 15 Q38 15 38 5 V0', fill: 'url(#mgCasingGelap)' }, halus(1.5)), g);
      el('ellipse', Object.assign({ cx: 0, cy: 0, rx: 38, ry: 11, fill: 'url(#mgCasing)' }, halus(1.6)), g);
      el('ellipse', { cx: 0, cy: -0.6, rx: 25, ry: 6.6, fill: 'none', stroke: '#CFC9BC', 'stroke-width': 1.1 }, g);
      el('ellipse', { cx: 0, cy: -0.6, rx: 9, ry: 2.4, fill: 'none', stroke: W.benar, 'stroke-width': 1.7 }, g);
      el('circle', { cx: 0, cy: 10.4, r: 1.4, fill: W.benar }, g);
      const gw = MG.g(g, { transform: o.gelombangBawah ? 'scale(1,-1)' : null });
      for (let i = 1; i <= 2; i++) el('path', { d: `M${-10 - i * 7} ${-14 - i * 6} Q0 ${-26 - i * 9} ${10 + i * 7} ${-14 - i * 6}`, fill: 'none', stroke: W.dakwat2, 'stroke-width': 2, 'stroke-linecap': 'round', opacity: 0.6 }, gw);
    } else if (jenis === 'pelayan') {
      MG.bayang(g, 2, 34, 74, 9);
      el('path', Object.assign({ d: 'M-26 -34 L-20 -39 H32 L26 -34 Z', fill: '#F7F5EF' }, halus(1.4)), g);
      el('path', Object.assign({ d: 'M26 -34 L32 -39 V27 L26 32 Z', fill: '#C9C3B5' }, halus(1.4)), g);
      el('rect', Object.assign({ x: -26, y: -34, width: 52, height: 66, rx: 2.5, fill: 'url(#mgCasing)' }, garis), g);
      for (let i = 0; i < 3; i++) {
        const yy = -28 + i * 14;
        el('rect', { x: -20, y: yy, width: 40, height: 11, rx: 1.5, fill: skrin, class: i === 0 ? 'skrin' : null, stroke: '#8E897D', 'stroke-width': 1 }, g);
        el('line', { x1: -16, y1: yy + 5.5, x2: 4, y2: yy + 5.5, stroke: '#9C968A', 'stroke-width': 1.3, 'stroke-linecap': 'round' }, g);
        el('circle', { cx: 15, cy: yy + 5.5, r: 1.6, fill: W.benar }, g);
      }
      el('rect', { x: -20, y: 15, width: 40, height: 9, fill: 'url(#mgGril)' }, g);
      el('circle', { cx: 0, cy: 28, r: 2.2, fill: '#E2DED3', stroke: DAKWAT, 'stroke-width': 1 }, g);
    }
    if (o.warna) el('rect', { x: -32, y: 37, width: 64, height: 4.5, rx: 2.25, fill: warna, class: 'jalurWarna' }, g);
    return g;
  };

  // Kotak peralatan rak (switch / router): casis logam berkecerunan, telinga rak dengan skru,
  // muka dalam, bevel atas dan plat label terukir.
  MG.rak = function (induk, x, y, w, h, tajuk, sub) {
    const g = MG.g(induk);
    MG.bayang(g, x + w / 2, y + h + 5, w * 0.96, 14);
    el('rect', { x, y, width: w, height: h, rx: 9, fill: 'url(#mgLogam)', stroke: DAKWAT, 'stroke-width': 2 }, g);
    el('rect', { x: x + 6, y: y + 6, width: w - 12, height: h - 12, rx: 6, fill: 'url(#mgMuka)', stroke: '#1A2123', 'stroke-width': 1 }, g);
    el('line', { x1: x + 12, y1: y + 6.8, x2: x + w - 12, y2: y + 6.8, stroke: '#fff', 'stroke-width': 1, opacity: 0.1 }, g);
    el('line', { x1: x + 10, y1: y + 1.6, x2: x + w - 10, y2: y + 1.6, stroke: '#fff', 'stroke-width': 1.1, opacity: 0.16 }, g);
    [x + 3, x + w - 10].forEach((ex) => {
      el('rect', { x: ex, y: y + 4, width: 7, height: h - 8, rx: 3, fill: '#283033', stroke: '#141A1C', 'stroke-width': 0.8 }, g);
      [y + 14, y + h - 14].forEach((sy) => MG.skru(g, ex + 3.5, sy));
    });
    if (tajuk) {
      const pw = tajuk.length * 12 + 26;
      el('rect', { x: x + 26, y: y + 18, width: pw, height: 30, rx: 4, fill: 'url(#mgPlat)', stroke: '#6F6A60', 'stroke-width': 1 }, g);
      el('rect', { x: x + 28.5, y: y + 20.5, width: pw - 5, height: 25, rx: 2.5, fill: 'none', stroke: '#fff', 'stroke-width': 0.9, opacity: 0.7 }, g);
      MG.teks(g, x + 39, y + 40, tajuk, { 'font-size': 19, 'font-weight': 800, fill: DAKWAT, 'letter-spacing': 1 });
      if (sub) MG.teks(g, x + 26 + pw + 14, y + 40, sub, { 'font-size': 17, fill: '#B3BDBF' });
    }
    return g;
  };

  // Awan Internet: isi berkecerunan, garis 2 px, dua garis kilau di bahagian atas
  MG.awan = function (induk, x, y, s, label, warna) {
    const g = MG.g(induk, { transform: `translate(${x},${y}) scale(${s || 1})` });
    el('ellipse', { cx: 0, cy: 34, rx: 112, ry: 7, fill: 'url(#mgBayang)' }, g);
    el('path', { d: 'M-90 30 Q-120 30 -118 4 Q-116 -22 -86 -20 Q-80 -56 -40 -54 Q-14 -80 22 -62 Q54 -78 74 -46 Q114 -46 112 -10 Q124 30 84 30 Z', fill: warna || 'url(#mgAwan)', stroke: W.dakwat2, 'stroke-width': 2, 'stroke-linejoin': 'round' }, g);
    el('path', { d: 'M-74 -24 Q-66 -44 -42 -46 M-6 -62 Q14 -70 32 -60 M70 -38 Q92 -38 100 -22', fill: 'none', stroke: '#fff', 'stroke-width': 2.4, 'stroke-linecap': 'round', opacity: 0.9 }, g);
    if (label) MG.teks(g, 0, 12, label, { 'font-size': 22, 'font-weight': 700, 'text-anchor': 'middle', fill: W.dakwat2 });
    return g;
  };

  // Zon (bilik / kumpulan): isi cerah, garis 1.75 px dan garis kilau dalam supaya tepi kelihatan bersih
  MG.zon = function (at, induk) {
    const r = el('rect', Object.assign({}, at, { 'stroke-width': 1.75 }), induk);
    el('rect', { x: at.x + 3, y: at.y + 3, width: at.width - 6, height: at.height - 6, rx: Math.max(0, (at.rx || 0) - 3), fill: 'none', stroke: '#fff', 'stroke-width': 1.2, opacity: 0.75, 'pointer-events': 'none' }, induk);
    return r;
  };

  /* ------------------------------------------------------------------ sampul (packet / frame)
     Satu packet = satu sampul beralamat. Tag VLAN = pelekat berwarna yang hanya dipasang pada
     kabel trunk. Siaran (broadcast) = sampul bertanda gelombang. Tiada objek yang "berubah jenis". */
  MG.sampul = function (induk, o) {
    o = o || {};
    const s = o.saiz || 1;
    const g = MG.g(induk, { class: 'sampul' });
    const isi = MG.g(g, { transform: s !== 1 ? `scale(${s})` : null });
    const warna = o.warna || W.dakwat2;
    el('rect', { x: -17, y: -11, width: 38, height: 26, rx: 3, fill: '#111819', opacity: 0.12 }, isi);
    el('rect', { x: -19, y: -13, width: 38, height: 26, rx: 3, fill: 'url(#mgSampul)', stroke: warna, 'stroke-width': 2.4, class: 'badan' }, isi);
    el('path', { d: 'M-18 12 L-4 0.5 M4 0.5 L18 12', fill: 'none', stroke: warna, 'stroke-width': 1, opacity: 0.4, class: 'lipat' }, isi);
    el('path', { d: 'M-18.2 -12.2 L0 2 L18.2 -12.2 Z', fill: '#F3F0E9' }, isi);
    el('polyline', { points: '-19,-13 0,2 19,-13', fill: 'none', stroke: warna, 'stroke-width': 1.8, 'stroke-linejoin': 'round', class: 'lipat' }, isi);
    if (o.siaran) {
      for (let i = 1; i <= 2; i++) el('path', { d: `M${21 + i * 5} ${-7 - i * 3} Q${27 + i * 7} 0 ${21 + i * 5} ${7 + i * 3}`, fill: 'none', stroke: warna, 'stroke-width': 2.4, 'stroke-linecap': 'round' }, isi);
    }
    const tag = MG.g(isi, { visibility: 'hidden' });
    const tagKotak = el('rect', { x: -48, y: -13, width: 26, height: 26, rx: 5, fill: warna, stroke: DAKWAT, 'stroke-width': 1.5 }, tag);
    el('rect', { x: -46, y: -11, width: 22, height: 6, rx: 3, fill: '#fff', opacity: 0.22 }, tag);
    const tagTeks = MG.teks(tag, -35, 6, '', { 'font-size': 15, 'font-weight': 800, fill: '#fff', 'text-anchor': 'middle' });
    let lbl = null;
    if (o.label) {
      lbl = MG.g(isi);
      const t = MG.teks(lbl, 0, -22, o.label, { 'font-size': o.saizLabel || 17, 'font-weight': 700, 'text-anchor': 'middle', fill: W.dakwat, stroke: W.kertas, 'stroke-width': 5, 'paint-order': 'stroke' });
      g._lblTeks = t;
    }
    let pelekat = null;
    g.setTag = (n, w) => {
      if (n == null) { tag.setAttribute('visibility', 'hidden'); return; }
      tag.setAttribute('visibility', 'visible'); tagTeks.textContent = n; tagKotak.setAttribute('fill', w || warna);
    };
    g.setLabel = (t) => { if (g._lblTeks) g._lblTeks.textContent = t; };
    g.setPelekat = (t, w) => {
      if (pelekat) pelekat.remove();
      if (!t) { pelekat = null; return; }
      pelekat = MG.g(isi);
      const lw = t.length * 9.5 + 18;
      el('rect', { x: -lw / 2, y: 16, width: lw, height: 24, rx: 5, fill: w || W.aksen, stroke: DAKWAT, 'stroke-width': 1.5 }, pelekat);
      el('rect', { x: -lw / 2 + 2, y: 18, width: lw - 4, height: 6, rx: 3, fill: '#fff', opacity: 0.2 }, pelekat);
      MG.teks(pelekat, 0, 33, t, { 'font-size': 15, 'font-weight': 800, fill: '#fff', 'text-anchor': 'middle' });
    };
    g.setWarna = (w) => { isi.querySelectorAll('.badan,.lipat').forEach((n) => n.setAttribute('stroke', w)); };
    g.x = 0; g.y = 0;
    g.ke = (x, y) => { g.x = x; g.y = y; MG.pindah(g, x, y); };
    return g;
  };

  /* Gerakkan nod sepanjang garis berbilang titik pada laju tetap (px/s).
     Titik boleh bawa {tag:n, warnaTag} — tag dipapar semasa segmen yang berakhir pada titik itu. */
  MG.gerak = function (skop, n, titik, o) {
    o = o || {};
    const v = o.laju || 460;
    const seg = []; let jum = 0;
    for (let i = 1; i < titik.length; i++) {
      const a = titik[i - 1], b = titik[i], d = Math.hypot(b.x - a.x, b.y - a.y);
      seg.push({ a, b, d, mula: jum }); jum += d;
    }
    if (!seg.length) { n.ke(titik[0].x, titik[0].y); return Promise.resolve(); }
    let kini = -1;
    const kemas = (p) => {
      const s = p * jum;
      let i = seg.findIndex((z) => s <= z.mula + z.d); if (i < 0) i = seg.length - 1;
      const z = seg[i], q = z.d ? (s - z.mula) / z.d : 1;
      n.ke(z.a.x + (z.b.x - z.a.x) * q, z.a.y + (z.b.y - z.a.y) * q);
      if (i !== kini) {
        kini = i;
        if (n.setTag && !o.kekalTag) n.setTag(z.b.tag != null ? z.b.tag : null, z.b.warnaTag);
        if (o.padaSegmen) o.padaSegmen(i, z.b);
      }
    };
    kemas(0);
    return skop.tween((jum / v) * 1000, kemas, o.ease || ease.linear);
  };

  MG.denyut = function (skop, induk, x, y, warna, r) {
    const c = el('circle', { cx: x, cy: y, r: 10, fill: 'none', stroke: warna, 'stroke-width': 5 }, induk);
    return MG.senyap(skop.tween(650, (p) => { c.setAttribute('r', 10 + p * (r || 46)); c.setAttribute('opacity', 1 - p); }, ease.out)).then(() => c.remove());
  };

  // Cop keputusan besar (BENAR / SEKAT) yang muncul dengan lantun lembut
  MG.cop = function (skop, induk, x, y, teks, jenis) {
    const w = jenis === 'sekat' ? W.sekat : W.benar;
    const g = MG.g(induk);
    const lw = teks.length * 15 + 40;
    // cop getah: bingkai tebal + garis dalam nipis
    el('rect', { x: -lw / 2 + 2, y: -21, width: lw, height: 48, rx: 10, fill: '#111819', opacity: 0.1, transform: 'rotate(-4)' }, g);
    el('rect', { x: -lw / 2, y: -24, width: lw, height: 48, rx: 10, fill: '#fff', stroke: w, 'stroke-width': 3.5, transform: 'rotate(-4)' }, g);
    el('rect', { x: -lw / 2 + 5, y: -19, width: lw - 10, height: 38, rx: 6, fill: 'none', stroke: w, 'stroke-width': 1.2, opacity: 0.7, transform: 'rotate(-4)' }, g);
    MG.teks(g, 0, 9, teks, { 'font-size': 25, 'font-weight': 900, fill: w, 'text-anchor': 'middle', 'letter-spacing': 1.5, transform: 'rotate(-4)' });
    MG.pindah(g, x, y, 0.01);
    return skop.tween(380, (p) => MG.pindah(g, x, y, 0.01 + p), ease.keluarLantun).then(() => g);
  };

  /* Petak label pada SVG: kotak bulat + teks satu baris, sesuai untuk callout */
  MG.label = function (induk, x, y, teks, o) {
    o = o || {};
    const g = MG.g(induk);
    const fs = o.fs || 18;
    const t = MG.teks(g, 0, 0, teks, { 'font-size': fs, 'font-weight': o.tebal || 700, fill: o.warnaTeks || W.dakwat, 'text-anchor': 'middle', 'dominant-baseline': 'central' });
    const lw = Math.max(o.minW || 0, teks.length * fs * 0.56 + 24);
    const r = el('rect', { x: -lw / 2, y: -fs * 0.9, width: lw, height: fs * 1.8, rx: 8, fill: o.isi || '#fff', stroke: o.garis || W.garis2, 'stroke-width': 1.6 }, g);
    const bg = el('rect', { x: -lw / 2 + 1.5, y: -fs * 0.9 + 2.5, width: lw, height: fs * 1.8, rx: 8, fill: '#111819', opacity: 0.08 }, g);
    g.insertBefore(r, t); g.insertBefore(bg, r);
    MG.pindah(g, x, y);
    return g;
  };

  /* ------------------------------------------------------------------ penjalan bab */
  const BAB = (MG.BAB = []);
  MG.daftarBab = (b) => { BAB.push(b); BAB.sort((a, c) => a.no - c.no); };

  const $ = (id) => document.getElementById(id);
  const P = { bab: null, i: 0, skop: null, aksi: null };
  MG.P = P;

  function skala() {
    const s = Math.min(innerWidth / 1920, innerHeight / 1080);
    const p = $('pentas');
    p.style.transform = `scale(${s})`;
    p.style.left = (innerWidth - 1920 * s) / 2 + 'px';
    p.style.top = (innerHeight - 1080 * s) / 2 + 'px';
    MG.skalaPentas = s;
  }

  function buatCtx(skop) {
    const svg = $('svg'), kawalan = $('kawalan'), html = $('lapisanHtml');
    const ctx = {
      svg, skop, html, KUMP: MG.KUMP,
      lapisan: (nama) => MG.g(svg, { class: 'lapisan-' + nama }),
      jalan(fn) {
        if (P.aksi) P.aksi.henti();
        const s = (P.aksi = new Skop(skop));
        return MG.senyap(Promise.resolve().then(() => fn(s)));
      },
      kumpulan(label) {
        const k = document.createElement('div'); k.className = 'kumpulan';
        if (label) { const l = document.createElement('label'); l.textContent = label; k.appendChild(l); }
        const b = document.createElement('div'); b.className = 'baris'; k.appendChild(b);
        kawalan.appendChild(k); k.baris = b; return k;
      },
      butang(label, fn, o) {
        o = o || {};
        const b = document.createElement('button'); b.className = 'btn' + (o.utama ? ' utama' : '');
        if (o.warna) { const t = document.createElement('span'); t.className = 'titik'; t.style.background = o.warna; b.appendChild(t); }
        b.appendChild(document.createTextNode(label));
        b.addEventListener('click', () => fn(b));
        (o.dalam ? o.dalam.baris : ctx.kumpulan(o.kumpulan).baris).appendChild(b);
        return b;
      },
      segmen(label, pilihan, nilai, fn, o) {
        o = o || {};
        const k = o.dalam || ctx.kumpulan(label);
        const s = document.createElement('div'); s.className = 'segmen';
        const btns = pilihan.map((p) => {
          const b = document.createElement('button'); b.textContent = p.t; b.dataset.v = p.v;
          if (p.v === nilai) b.classList.add('aktif');
          b.addEventListener('click', () => { set(p.v); fn(p.v); });
          s.appendChild(b); return b;
        });
        function set(v) { btns.forEach((b) => b.classList.toggle('aktif', b.dataset.v === String(v))); }
        k.baris.appendChild(s); s.style.flex = '1';
        return { set, el: s };
      },
      togol(label, nilai, fn, o) {
        o = o || {};
        const b = document.createElement('button'); b.className = 'togol' + (nilai ? ' hidup' : '');
        b.innerHTML = '<span class="suis"></span><span class="t"></span>';
        b.querySelector('.t').textContent = label;
        let v = !!nilai;
        b.addEventListener('click', () => { v = !v; b.classList.toggle('hidup', v); fn(v); });
        (o.dalam ? o.dalam.baris : ctx.kumpulan(o.kumpulan).baris).appendChild(b);
        return { set(x) { v = !!x; b.classList.toggle('hidup', v); }, get: () => v, el: b };
      },
      nota(teks) { const p = document.createElement('p'); p.className = 'nota'; p.innerHTML = teks; kawalan.appendChild(p); return p; },
      papan(o) {
        const d = document.createElement('div'); d.className = 'papanHasil';
        Object.assign(d.style, o && o.gaya || {});
        d.innerHTML = '<div class="lbl"></div><div class="nilai"></div><div class="ket"></div>';
        d.setAttribute('aria-live', 'polite');
        html.appendChild(d);
        const api = {
          el: d,
          set(lbl, nilai, ket, jenis) {
            d.querySelector('.lbl').textContent = lbl || '';
            d.querySelector('.nilai').textContent = nilai == null ? '' : nilai;
            d.querySelector('.ket').innerHTML = ket || '';
            d.classList.toggle('benar', jenis === 'benar'); d.classList.toggle('sekat', jenis === 'sekat');
          },
        };
        if (o && o.mula) api.set.apply(null, o.mula);
        return api;
      },
      lencanaSim(t) { const d = document.createElement('div'); d.className = 'lencanaSim'; d.textContent = t || 'Data simulasi — bukan pengukuran sebenar'; html.appendChild(d); return d; },
      tip(x, y, htmlTeks) {
        const t = $('tip');
        if (!htmlTeks) { t.hidden = true; return; }
        t.innerHTML = htmlTeks; t.hidden = false;
        const w = t.offsetWidth, h = t.offsetHeight;
        t.style.left = Math.max(10, Math.min(1320 - w - 10, x - w / 2)) + 'px';
        t.style.top = Math.max(10, y - h - 16) + 'px';
      },
    };
    return ctx;
  }

  function binaLangkah() {
    const bab = P.bab, L = bab.langkah[P.i];
    if (P.skop) P.skop.henti();
    P.aksi = null;
    P.skop = new Skop();
    MG.jeda(false);
    MG.kosong($('svg')); $('kawalan').innerHTML = ''; $('lapisanHtml').innerHTML = ''; $('tip').hidden = true;
    $('lgNo').textContent = `Langkah ${P.i + 1} / ${bab.langkah.length}`;
    $('lgTajuk').textContent = L.tajuk;
    $('lgTeks').innerHTML = L.teks || '';
    const an = $('analogi');
    if (L.analogi) { an.hidden = false; an.innerHTML = '<span class="kepala">Bayangkan</span>' + L.analogi; } else an.hidden = true;
    const r = $('rsc');
    if (L.rsc) {
      r.hidden = false; r.open = false;
      $('rscIsi').innerHTML = L.rsc.kod.map((k) => '<pre>' + k + '</pre>').join('') + (L.rsc.fungsi ? '<p><b>Fungsi:</b> ' + L.rsc.fungsi + '</p>' : '');
    } else r.hidden = true;
    $('panel').scrollTop = 0;
    const dots = $('titikLangkah'); dots.innerHTML = '';
    bab.langkah.forEach((x, j) => {
      const b = document.createElement('button');
      b.className = j < P.i ? 'siap' : j === P.i ? 'kini' : '';
      b.title = `Langkah ${j + 1}: ${x.tajuk}`;
      b.addEventListener('click', () => { P.i = j; binaLangkah(); });
      dots.appendChild(b);
    });
    $('btnSebelum').disabled = P.i === 0;
    const akhirBab = P.i === bab.langkah.length - 1;
    const babSeterus = BAB.find((b) => b.no > bab.no && b.status === 'siap');
    $('btnSeterusnya').textContent = akhirBab ? (babSeterus ? 'Bab seterusnya ▶' : 'Menu ▶') : 'Seterusnya ▶';
    const ctx = buatCtx(P.skop);
    try { L.bina(ctx); } catch (e) { console.error(e); }
    P.ctx = ctx;
  }

  MG.bukaBab = function (id, i) {
    const bab = BAB.find((b) => b.id === id);
    if (!bab || bab.status !== 'siap') return;
    P.bab = bab; P.i = i || 0;
    document.body.classList.remove('diMenu');
    $('menu').hidden = true; $('bab').hidden = false;
    $('tajukBab').innerHTML = `${bab.no}. ${bab.tajuk}<small>${bab.sub || ''}</small>`;
    binaLangkah();
    history.replaceState(null, '', '#' + bab.id);
  };
  MG.keMenu = function () {
    if (P.skop) P.skop.henti();
    P.bab = null; MG.jeda(false);
    document.body.classList.add('diMenu');
    $('bab').hidden = true; $('menu').hidden = false;
    $('tajukBab').innerHTML = ''; $('titikLangkah').innerHTML = '';
    history.replaceState(null, '', location.pathname + location.search);
  };
  MG.seterusnya = function () {
    if (!P.bab) return;
    if (P.i < P.bab.langkah.length - 1) { P.i++; binaLangkah(); return; }
    const b = BAB.find((x) => x.no > P.bab.no && x.status === 'siap');
    if (b) MG.bukaBab(b.id); else MG.keMenu();
  };
  MG.sebelum = function () { if (P.bab && P.i > 0) { P.i--; binaLangkah(); } };
  MG.ulang = function () { if (P.bab) binaLangkah(); };

  /* ------------------------------------------------------------------ menu */
  function binaMenu() {
    const m = $('menu');
    const siap = BAB.filter((b) => b.status === 'siap').length;
    m.innerHTML = `
      <div class="heroMenu">
        <div>
          <h1>Lihat apa yang <span>sebenarnya</span> berlaku<br>dalam rangkaian sekolah.</h1>
          <p>Setiap bab ialah simulasi kecil: packet dilukis sebagai sampul beralamat yang bergerak melalui switch, router dan talian sebenar SSeM. Tekan, tukar tetapan, lihat akibatnya.</p>
        </div>
        <div class="legenda">
          <span><i style="background:${MG.KUMP.kewangan.warna}"></i>Kewangan</span>
          <span><i style="background:${MG.KUMP.staf.warna}"></i>Staf</span>
          <span><i style="background:${MG.KUMP.eksekutif.warna}"></i>Eksekutif</span>
          <span><i style="background:${MG.KUMP.murid.warna}"></i>Murid</span>
          <span><i style="background:${MG.KUMP.tetamu.warna}"></i>Tetamu</span>
        </div>
      </div>
      <div class="gridBab"></div>`;
    const grid = m.querySelector('.gridBab');
    BAB.forEach((b) => {
      const k = document.createElement('button');
      k.className = 'kadBab' + (b.status === 'siap' ? '' : ' belum') + (b.wajib ? ' wajib' : '');
      k.innerHTML = `<span class="no">BAB ${b.no}</span><span class="status ${b.status === 'siap' ? 'siap' : 'belum'}">${b.status === 'siap' ? 'Interaktif' : 'Belum dibina'}</span>
        <h3>${b.tajuk}</h3><p>${b.ringkas}</p>`;
      const s = el('svg', { viewBox: '0 0 300 110' }); k.appendChild(s);
      if (b.ikonMenu) b.ikonMenu(s);
      if (b.status === 'siap') k.addEventListener('click', () => MG.bukaBab(b.id));
      else k.disabled = true;
      grid.appendChild(k);
    });
    m.dataset.siap = siap;
  }

  /* ------------------------------------------------------------------ but */
  MG.mula = function () {
    MG.pastiDefs(); skala(); addEventListener('resize', skala);
    // objek SVG yang boleh diklik (juga yang dilukis semula kemudian) boleh dicapai dengan Tab, aktif dengan Enter/Space
    const aksesibel = () => $('svg').querySelectorAll('.boleh-klik:not([tabindex])').forEach((n) => { n.setAttribute('tabindex', '0'); n.setAttribute('role', 'button'); });
    new MutationObserver(aksesibel).observe($('svg'), { childList: true, subtree: true });
    binaMenu();
    $('btnRumah').addEventListener('click', MG.keMenu);
    $('btnSeterusnya').addEventListener('click', MG.seterusnya);
    $('btnSebelum').addEventListener('click', MG.sebelum);
    $('btnUlang').addEventListener('click', MG.ulang);
    const bj = $('btnJeda');
    bj.addEventListener('click', () => MG.jeda(!MG.dijeda()));
    // buka "Dalam router SSeM": skrol panel supaya petikan kelihatan
    $('rsc').addEventListener('toggle', () => { if ($('rsc').open) $('panel').scrollTop = $('panel').scrollHeight; });
    document.addEventListener('mg-jeda', (e) => { bj.textContent = e.detail ? '▶ Sambung' : '⏸ Pause'; bj.classList.toggle('dijeda', e.detail); });
    $('laju').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
      $('laju').querySelectorAll('button').forEach((x) => x.classList.toggle('aktif', x === b));
      MG.setLaju(parseFloat(b.dataset.v));
    }));
    const penuh = () => { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen().catch(() => {}); };
    $('btnPenuh').addEventListener('click', penuh);
    addEventListener('keydown', (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT')) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return; // biar pintasan browser (Ctrl+R, Ctrl+F, Alt+←)
      const fokus = e.target && e.target.closest && e.target.closest('#svg .boleh-klik');
      if (fokus && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); fokus.dispatchEvent(new MouseEvent('click', { bubbles: true })); return; }
      const k = e.key;
      if (k === 'ArrowRight' || k === 'PageDown') { e.preventDefault(); MG.seterusnya(); }
      else if (k === 'ArrowLeft' || k === 'PageUp') { e.preventDefault(); MG.sebelum(); }
      else if (k === ' ') { if (P.bab && !(e.target && e.target.tagName === 'BUTTON')) { e.preventDefault(); MG.jeda(!MG.dijeda()); } }
      else if (k === 'r' || k === 'R') MG.ulang();
      else if (k === 'm' || k === 'M' || k === 'Escape') { if (P.bab && k !== 'Escape') MG.keMenu(); else if (P.bab && !document.fullscreenElement) MG.keMenu(); }
      else if (k === 'f' || k === 'F') penuh();
      else if (!P.bab && /^[1-9]$/.test(k)) { const b = BAB.find((x) => x.no === +k); if (b) MG.bukaBab(b.id); }
      else if (!P.bab && k === '0') { const b = BAB.find((x) => x.no === 10); if (b) MG.bukaBab(b.id); }
    });
    const h = location.hash.slice(1);
    if (h && BAB.some((b) => b.id === h && b.status === 'siap')) MG.bukaBab(h); else MG.keMenu();
  };
})();
