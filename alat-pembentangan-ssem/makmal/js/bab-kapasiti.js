/* Bab 8 — Kapasiti: satu talian 750M dikongsi; PCQ (adil setiap pengguna) dan QoS (keutamaan Meet).
   Angka kelas (limit-at, priority, PCQ rate, max-limit) ikut eksport SSeM 22 Okt. Permintaan peranti,
   bilangan connection dan lengah Meet ialah ANGGARAN SIMULASI, dilabel begitu pada skrin. */
(function () {
  'use strict';
  const { el, teks, W, KUMP } = MG;
  const G = MG.g;

  const KAP = 750; // max-limit arah turun UNIFI-JUMLAH (720M/750M → naik/turun)
  // Kelas ikut /queue simple SSeM. bulk = "Download besar Student" (packet-mark bulk selepas 10 MB).
  const KELAS = {
    meet: { nama: 'Google Meet', warna: '#0284C7', cerah: '#DCEFFA', limitAt: 50, max: 750, prio: 1, seorang: 100 },
    staf: { nama: 'Staf', warna: KUMP.staf.warna, cerah: KUMP.staf.cerah, limitAt: 250, max: 750, prio: 2, seorang: 100 },
    murid: { nama: 'Murid', warna: KUMP.murid.warna, cerah: KUMP.murid.cerah, limitAt: 250, max: 750, prio: 5, seorang: 50 },
    tetamu: { nama: 'Tetamu', warna: KUMP.tetamu.warna, cerah: KUMP.tetamu.cerah, limitAt: 80, max: 200, prio: 7, seorang: 20 },
    bulk: { nama: 'Download besar', warna: '#78716C', cerah: '#ECEAE6', limitAt: 5, max: 750, prio: 8, seorang: 50 },
  };
  const SUSUN = ['meet', 'staf', 'murid', 'tetamu', 'bulk'];
  // Anggaran simulasi: apa yang setiap peranti "mahu" dan berapa connection TCP/UDP dibuka.
  const MAHU = { meet: 4, staf: 80, murid: 40, tetamu: 30, bulk: 500 };
  const CONN = { meet: 1, staf: 2, murid: 2, tetamu: 2, bulk: 16 };
  // Simulasi: apabila packet lewat (talian sesak tanpa QoS), Meet menurunkan kualiti video ke kadar ini (M setiap panggilan)
  const MEET_LEMAH = { A: 1.2, B: 2.5 };
  const nMeet = (sc) => (sc.meet === true ? 1 : +sc.meet || 0);
  
  /* Bahagi adil max-min ("isi air"): setiap permintaan dapat bahagian sama rata; lebihan
     daripada yang sudah cukup diagih semula kepada yang masih mahu. */
  function isi(perm, kap) {
    const a = perm.map(() => 0);
    let baki = kap, aktif = perm.map((d, i) => i).filter((i) => perm[i] > 0);
    while (aktif.length && baki > 1e-6) {
      const bah = baki / aktif.length, seterus = [];
      let guna = 0;
      for (const i of aktif) {
        const perlu = perm[i] - a[i];
        if (perlu <= bah) { a[i] += perlu; guna += perlu; } else seterus.push(i);
      }
      if (seterus.length === aktif.length) { seterus.forEach((i) => (a[i] += bah)); break; }
      baki -= guna; aktif = seterus;
    }
    return a;
  }

  function senaraiPeranti(sc) {
    const d = [];
    for (let i = 0; i < nMeet(sc); i++) d.push({ id: i ? 'meet' + i : 'meet', k: 'meet', kump: 'meet', jenis: 'laptop' });
    for (let i = 0; i < sc.staf; i++) d.push({ id: 'staf' + i, k: 'staf', kump: 'staf', jenis: 'laptop' });
    for (let i = 0; i < sc.murid; i++) {
      const dl = i === 0 && sc.dl;
      d.push({ id: 'murid' + i, k: dl ? 'bulk' : 'murid', kump: 'murid', jenis: i % 3 === 0 ? 'laptop' : 'telefon', dl });
    }
    for (let i = 0; i < sc.tetamu; i++) d.push({ id: 'tetamu' + i, k: 'tetamu', kump: 'tetamu', jenis: 'telefon' });
    return d;
  }

  // Model: kadar setiap peranti (Mbps) untuk satu senario dan satu mod.
  function kira(sc, mod) {
    const dev = senaraiPeranti(sc);
    const permEfektif = dev.reduce((t, d) => t + (mod === 'A' ? MAHU[d.k] : Math.min(MAHU[d.k], KELAS[d.k].seorang)), 0);
    const sesak = permEfektif > KAP * 0.97;
    const M = Object.assign({}, MAHU);
    if (sesak && mod !== 'C') M.meet = MEET_LEMAH[mod];
    let kadar;
    if (mod === 'A') {
      // tiada queue: setiap connection berebut sama rata — banyak connection, banyak bahagian
      const kepingan = [];
      dev.forEach((d, i) => { for (let c = 0; c < CONN[d.k]; c++) kepingan.push({ i, m: M[d.k] / CONN[d.k] }); });
      const a = isi(kepingan.map((x) => x.m), KAP);
      kadar = dev.map(() => 0);
      kepingan.forEach((x, j) => (kadar[x.i] += a[j]));
    } else if (mod === 'B') {
      // PCQ: setiap alamat IP satu barisan, dihadkan kadar seorang; tiada keutamaan kelas
      kadar = isi(dev.map((d) => Math.min(M[d.k], KELAS[d.k].seorang)), KAP);
    } else {
      // PCQ + QoS: limit-at dijamin dahulu, baki ikut priority (1 dahulu), dalam kelas adil per IP
      const perm = {}, dapat = {};
      SUSUN.forEach((k) => {
        perm[k] = dev.filter((d) => d.k === k).reduce((t, d) => t + Math.min(M[k], KELAS[k].seorang), 0);
        dapat[k] = Math.min(perm[k], KELAS[k].limitAt);
      });
      let baki = KAP - SUSUN.reduce((t, k) => t + dapat[k], 0);
      SUSUN.slice().sort((a, b) => KELAS[a].prio - KELAS[b].prio).forEach((k) => {
        const tambah = Math.max(0, Math.min(baki, Math.min(perm[k], KELAS[k].max) - dapat[k]));
        dapat[k] += tambah; baki -= tambah;
      });
      kadar = dev.map(() => 0);
      SUSUN.forEach((k) => {
        const idx = dev.map((d, i) => (d.k === k ? i : -1)).filter((i) => i >= 0);
        const a = isi(idx.map(() => Math.min(M[k], KELAS[k].seorang)), dapat[k]);
        idx.forEach((i, j) => (kadar[i] = a[j]));
      });
    }
    const jumlah = kadar.reduce((t, x) => t + x, 0);
    let lengah = null;
    if (nMeet(sc)) lengah = mod === 'C' ? 30 : !sesak ? 30 : mod === 'B' ? 80 : 260;
    const kelas = {};
    SUSUN.forEach((k) => (kelas[k] = dev.reduce((t, d, i) => t + (d.k === k ? kadar[i] : 0), 0)));
    return { dev, kadar, jumlah, permMentah: dev.reduce((t, d) => t + MAHU[d.k], 0), sesak, lengah, kelas };
  }

  /* ------------------------------------------------------------------ paparan */
  const KUMP_KAP = {
    meet: { x: 30, w: 220, tajuk: 'Bilik mesyuarat', sub: 'Staf · Meet', kol: 1 },
    staf: { x: 266, w: 280, tajuk: 'Staf', sub: 'VLAN 20', kol: 3 },
    murid: { x: 562, w: 470, tajuk: 'Murid', sub: 'VLAN 30', kol: 6 },
    tetamu: { x: 1048, w: 242, tajuk: 'Tetamu', sub: 'VLAN 40', kol: 3 },
  };
  const ZON_Y = 340, ZON_H = 536, BARIS0 = 420, BARIS_H = 122;

  function binaKapasiti(ctx, o) {
    const lap = {};
    ['dasar', 'zon', 'peranti', 'atas'].forEach((n) => (lap[n] = ctx.lapisan(n)));
    const S = { mod: o.mod, sc: Object.assign({}, o.sc), nod: {}, kadarKini: {} };

    // corak jalur yang bergerak = aliran data
    const defs = el('defs', null, lap.dasar);
    const pat = el('pattern', { id: 'jalurAlir', width: 14, height: 14, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(35)' }, defs);
    el('rect', { x: 0, y: 0, width: 6, height: 14, fill: '#fff', opacity: 0.32 }, pat);
    if (!MG.statik) {
      let ofs = 0;
      ctx.skop.ticker((dt) => { ofs = (ofs + dt * 0.03) % 14; pat.setAttribute('patternTransform', `rotate(35) translate(${ofs.toFixed(2)},0)`); });
    }

    // kad talian
    const kad = G(lap.dasar);
    el('rect', { x: 420, y: 20, width: 880, height: 168, rx: 16, fill: W.kad, stroke: W.garis, 'stroke-width': 2 }, kad);
    teks(kad, 442, 52, 'TALIAN UNIFI · arah turun · had 750M', { 'font-size': 17, 'font-weight': 800, fill: W.pudar, 'letter-spacing': 0.6 });
    const tPerm = teks(kad, 1000, 52, '', { 'font-size': 17, 'font-weight': 700, 'text-anchor': 'end', fill: W.dakwat2 });
    el('rect', { x: 440, y: 70, width: 840, height: 52, rx: 10, fill: W.kertas2, stroke: W.dakwat2, 'stroke-width': 2.5 }, kad);
    const segG = G(kad), segLbl = G(kad);
    const seg = {};
    SUSUN.forEach((k) => {
      const r = el('rect', { x: 442, y: 72, width: 0, height: 48, fill: KELAS[k].warna }, segG);
      const j = el('rect', { x: 442, y: 72, width: 0, height: 48, fill: 'url(#jalurAlir)' }, segG);
      const t = teks(segLbl, 0, 152, '', { 'font-size': 16, 'font-weight': 800, fill: KELAS[k].warna, 'text-anchor': 'middle' });
      const t2 = teks(segLbl, 0, 174, '', { 'font-size': 15, 'font-weight': 700, fill: W.dakwat2, 'text-anchor': 'middle', class: 'mono' });
      seg[k] = { r, j, t, t2 };
    });
    for (let m = 0; m <= 750; m += 150) {
      const x = 442 + (m / KAP) * 836;
      el('line', { x1: x, y1: 122, x2: x, y2: 130, stroke: W.dakwat2, 'stroke-width': 2 }, kad);
    }
    const tGuna = teks(kad, 1280, 52, '', { 'font-size': 17, 'font-weight': 800, 'text-anchor': 'end' });

    // rak router dengan laci kelas queue
    MG.rak(lap.dasar, 30, 206, 1260, 114, 'ROUTER', 'Simple Queue');
    const laci = {};
    SUSUN.forEach((k, i) => {
      const x = 330 + i * 190, c = KELAS[k];
      const gg = G(lap.dasar);
      el('rect', { x, y: 222, width: 180, height: 84, rx: 8, fill: '#E9E6DE', stroke: '#8E897D', 'stroke-width': 1.5 }, gg);
      el('rect', { x: x + 10, y: 232, width: 14, height: 14, rx: 3, fill: c.warna }, gg);
      teks(gg, x + 30, 245, c.nama, { 'font-size': 16, 'font-weight': 800 });
      const t1 = teks(gg, x + 10, 271, '', { 'font-size': 14.5, 'font-weight': 700, fill: W.dakwat2 });
      const t2 = teks(gg, x + 10, 293, '', { 'font-size': 14.5, fill: W.dakwat2 });
      laci[k] = { gg, t1, t2 };
    });
    const tiadaQ = G(lap.dasar);
    el('rect', { x: 324, y: 218, width: 954, height: 92, rx: 10, fill: '#2B3437', opacity: 0.92 }, tiadaQ);
    teks(tiadaQ, 801, 258, 'Tiada queue: semua connection berebut satu barisan', { 'font-size': 21, 'font-weight': 800, fill: '#fff', 'text-anchor': 'middle' });
    teks(tiadaQ, 801, 288, 'lebih banyak connection = lebih besar bahagian', { 'font-size': 17, fill: '#B9C2C4', 'text-anchor': 'middle' });

    // zon kumpulan
    const zonT = {};
    Object.keys(KUMP_KAP).forEach((k) => {
      const z = KUMP_KAP[k], c = KELAS[k];
      MG.zon({ x: z.x, y: ZON_Y, width: z.w, height: ZON_H, rx: 18, fill: c.cerah, stroke: c.warna, 'stroke-width': 2.5 }, lap.zon);
      teks(lap.zon, z.x + 16, ZON_Y + 34, z.tajuk, { 'font-size': 21, 'font-weight': 800 });
      zonT[k] = k === 'meet'
        ? teks(lap.zon, z.x + 16, ZON_Y + 60, z.sub, { 'font-size': 15, 'font-weight': 700, fill: W.pudar })
        : teks(lap.zon, z.x + z.w - 14, ZON_Y + 34, z.sub, { 'font-size': 15, 'font-weight': 700, fill: W.pudar, 'text-anchor': 'end' });
      el('line', { x1: z.x + z.w / 2, y1: 320, x2: z.x + z.w / 2, y2: ZON_Y, stroke: c.warna, 'stroke-width': 5 }, lap.zon);
    });

    // jubin video Meet
    const meetG = G(lap.zon);
    const vx = 46, vy = 600, vw = 188, vh = 140;
    el('rect', { x: vx, y: vy, width: vw, height: vh, rx: 10, fill: '#1F2A2D', stroke: W.dakwat, 'stroke-width': 3 }, meetG);
    const orang = G(meetG);
    el('circle', { cx: vx + vw / 2, cy: vy + 58, r: 22, fill: '#C9B9A6' }, orang);
    el('path', { d: `M${vx + vw / 2 - 46} ${vy + vh - 8} Q${vx + vw / 2} ${vy + 68} ${vx + vw / 2 + 46} ${vy + vh - 8} Z`, fill: '#4B6B8A' }, orang);
    teks(meetG, vx + 10, vy + 22, 'Google Meet', { 'font-size': 14, 'font-weight': 700, fill: '#E7ECEE' });
    const beku = G(meetG, { visibility: 'hidden' });
    el('rect', { x: vx, y: vy, width: vw, height: vh, rx: 10, fill: '#000', opacity: 0.55 }, beku);
    teks(beku, vx + vw / 2, vy + vh / 2 + 8, '⏸ tersangkut', { 'font-size': 20, 'font-weight': 800, fill: '#fff', 'text-anchor': 'middle' });
    const tLengah = teks(meetG, vx + vw / 2, vy + vh + 34, '', { 'font-size': 22, 'font-weight': 800, 'text-anchor': 'middle' });
    teks(meetG, vx + vw / 2, vy + vh + 58, 'anggaran kelewatan (simulasi)', { 'font-size': 14, fill: W.pudar, 'text-anchor': 'middle' });
    const tKualiti = teks(meetG, vx + vw / 2, vy + vh + 84, '', { 'font-size': 17, 'font-weight': 800, 'text-anchor': 'middle' });
    let masaBeku = 0, lengahKini = null;
    if (!MG.statik) ctx.skop.ticker((dt) => {
      // video tersangkut sekali-sekala apabila lengah tinggi; goyang kecil untuk "jitter"
      if (lengahKini == null || lengahKini < 50) { beku.setAttribute('visibility', 'hidden'); orang.removeAttribute('transform'); return; }
      masaBeku += dt;
      const kitar = lengahKini > 150 ? 1400 : 3200, lama = lengahKini > 150 ? 650 : 300;
      const f = masaBeku % kitar;
      beku.setAttribute('visibility', f < lama ? 'visible' : 'hidden');
      orang.setAttribute('transform', f < lama ? '' : `translate(${(Math.sin(masaBeku / 90) * 1.5).toFixed(1)},0)`);
    });

    function kedudukan(d, idx) {
      const z = KUMP_KAP[d.kump];
      if (d.kump === 'meet') return { x: z.x + z.w / 2, y: 470 };
      const kol = z.kol, cw = (z.w - 20) / kol;
      return { x: z.x + 10 + cw * (idx % kol) + cw / 2, y: BARIS0 + Math.floor(idx / kol) * BARIS_H };
    }

    function binaPeranti() {
      MG.kosong(lap.peranti); S.nod = {};
      const kira2 = {};
      senaraiPeranti(S.sc).forEach((d) => {
        const idx = (kira2[d.kump] = (kira2[d.kump] || 0) + 1) - 1;
        if (d.kump === 'meet' && idx > 0) return; // semua panggilan Meet dilukis sebagai satu peranti
        const p = kedudukan(d, idx);
        const gg = G(lap.peranti);
        const ik = G(gg, { transform: `translate(${p.x},${p.y - 12}) scale(0.62)` });
        MG.peranti(ik, d.jenis, 0, 0, { warna: KELAS[d.kump].warna, skrin: '#fff' });
        if (d.dl) el('path', { d: `M${p.x} ${p.y - 28} V${p.y - 14} M${p.x - 6} ${p.y - 20} L${p.x} ${p.y - 13} L${p.x + 6} ${p.y - 20}`, fill: 'none', stroke: KELAS.bulk.warna, 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, gg);
        const bw = d.kump === 'meet' ? 120 : 64;
        el('rect', { x: p.x - bw / 2, y: p.y + 22, width: bw, height: 10, rx: 3, fill: '#fff', stroke: W.dakwat2, 'stroke-width': 1.5 }, gg);
        const bar = el('rect', { x: p.x - bw / 2 + 1, y: p.y + 23, width: 0, height: 8, rx: 2, fill: KELAS[d.k].warna }, gg);
        const jal = el('rect', { x: p.x - bw / 2 + 1, y: p.y + 23, width: 0, height: 8, rx: 2, fill: 'url(#jalurAlir)' }, gg);
        const t = teks(gg, p.x, p.y + 52, '', { 'font-size': 16, 'font-weight': 800, 'text-anchor': 'middle', class: 'mono', fill: d.dl ? KELAS.bulk.warna : W.dakwat });
        S.nod[d.id] = { bar, jal, t, bw: bw - 2, d, dl: d.dl };
      });
    }

    function tulisLaci() {
      tiadaQ.setAttribute('visibility', S.mod === 'A' ? 'visible' : 'hidden');
      SUSUN.forEach((k) => {
        const c = KELAS[k], l = laci[k];
        if (S.mod === 'C') {
          l.t1.textContent = `limit-at ${c.limitAt}M · prio ${c.prio}`;
          l.t2.textContent = `${c.seorang}M seorang` + (c.max < KAP ? ` · maks ${c.max}M` : '');
        } else {
          l.t1.textContent = 'tiada jaminan, tiada prio';
          l.t2.textContent = `${c.seorang}M seorang`;
        }
      });
    }

    // lukis keadaan h; p = 0..1 untuk animasi peralihan dari keadaan lama
    function lukis(h, lama, p) {
      const camp = (a, b) => a + (b - a) * p;
      let x = 442;
      const lebarJum = 836;
      MG.kosong(segLbl);
      SUSUN.forEach((k) => {
        const v = camp(lama.kelas[k] || 0, h.kelas[k]);
        const w = (v / KAP) * lebarJum;
        [seg[k].r, seg[k].j].forEach((r) => { r.setAttribute('x', x.toFixed(1)); r.setAttribute('width', Math.max(0, w).toFixed(1)); });
        if (h.kelas[k] > 0 && w > 54) {
          teks(segLbl, x + w / 2, 152, KELAS[k].nama.split(' ')[0], { 'font-size': 16, 'font-weight': 800, fill: KELAS[k].warna, 'text-anchor': 'middle' });
          teks(segLbl, x + w / 2, 174, Math.round(v) + 'M', { 'font-size': 15, 'font-weight': 700, fill: W.dakwat2, 'text-anchor': 'middle', class: 'mono' });
        }
        x += w;
      });
      h.dev.forEach((d, i) => {
        const n = S.nod[d.id]; if (!n) return;
        const meetN = d.id === 'meet' ? nMeet(S.sc) : 0;
        const v = meetN > 1 ? camp(lama.kelas.meet || 0, h.kelas.meet) : camp(lama.peranti[d.id] || 0, h.kadar[i]);
        const w = Math.min(1, v / 100) * n.bw;
        n.bar.setAttribute('width', w.toFixed(1)); n.jal.setAttribute('width', w.toFixed(1));
        n.t.textContent = (n.dl ? '⬇' : '') + (v < 10 ? v.toFixed(1) : Math.round(v)) + 'M' + (meetN > 1 ? ` · ${meetN} panggilan` : '');
      });
    }

    S.kemas = async (s) => {
      const h = kira(S.sc, S.mod);
      const lama = { kelas: Object.assign({}, S.kelasKini || {}), peranti: Object.assign({}, S.kadarKini) };
      tulisLaci();
      Object.keys(KUMP_KAP).forEach((k) => {
        const n = k === 'meet' ? nMeet(S.sc) : S.sc[k];
        zonT[k].textContent = k === 'meet' ? (n ? `${n} panggilan aktif` : 'tiada panggilan') : `${KUMP_KAP[k].sub} · ${n} aktif`;
      });
      tPerm.textContent = `Permintaan ≈ ${Math.round(h.permMentah)}M`;
      const util = h.jumlah / KAP;
      tGuna.textContent = `Digunakan ${Math.round(h.jumlah)}M (${Math.round(util * 100)}%)`;
      tGuna.setAttribute('fill', h.sesak ? W.sekat : W.benar);
      lengahKini = h.lengah;
      meetG.setAttribute('visibility', nMeet(S.sc) ? 'visible' : 'hidden');
      if (h.lengah != null) {
        const q = h.lengah < 50 ? ['Lancar', W.benar] : h.lengah < 150 ? ['Kadang-kadang tersangkut', '#B45309'] : ['Tersekat-sekat', W.sekat];
        tLengah.textContent = `~${h.lengah} ms`; tLengah.setAttribute('fill', q[1]);
        tKualiti.textContent = q[0]; tKualiti.setAttribute('fill', q[1]);
      }
      if (o.padaHasil) o.padaHasil(h, S);
      await s.tween(700, (p) => lukis(h, lama, p), MG.ease.io);
      S.kelasKini = h.kelas;
      S.kadarKini = {}; h.dev.forEach((d, i) => (S.kadarKini[d.id] = h.kadar[i]));
    };
    S.set = (ubah, binaSemula) => {
      Object.assign(S.sc, ubah);
      if (binaSemula) {
        const ada = new Set(senaraiPeranti(S.sc).map((d) => d.id));
        Object.keys(S.kadarKini).forEach((id) => { if (!ada.has(id)) delete S.kadarKini[id]; });
        binaPeranti();
      }
    };
    binaPeranti();
    return S;
  }

  function hasilKePapan(papan) {
    return (h, S) => {
      const dl = h.dev.findIndex((d) => d.dl);
      const meet = h.dev.findIndex((d) => d.k === 'meet');
      let ket = '';
      if (dl >= 0) ket += `Download besar dapat <b>${Math.round(h.kadar[dl])}M</b>. `;
      if (!h.sesak) ket += 'Talian belum penuh.';
      else if (S.mod === 'A') ket += 'Talian penuh: semua beratur panjang.';
      else if (S.mod === 'B') ket += 'Talian penuh, tetapi adil bagi setiap pengguna.';
      else ket += 'Talian penuh; Meet didahulukan.';
      if (meet >= 0) ket += ` Meet: <b>${Math.round(h.kelas.meet)}M</b>.`;
      if (meet < 0) papan.set('Talian Unifi', `${Math.round(h.jumlah)}M`, ket, h.sesak ? 'sekat' : 'benar');
      else {
        const lancar = h.lengah < 50;
        papan.set('Google Meet', lancar ? 'Lancar' : h.lengah < 150 ? 'Tersangkut' : 'Teruk', ket, lancar ? 'benar' : 'sekat');
      }
    };
  }

  const RSC = {
    kod: [
      '/queue type\nadd kind=<mark>pcq</mark> name=pcq-down-50m pcq-classifier=<mark>dst-address</mark> pcq-rate=<mark>50M</mark>',
      '/queue simple\nadd dst=pppoe-unifi limit-at=<mark>250M/250M</mark> max-limit=720M/750M name=\\\n    "Limit VLAN 30 Student (50M per-user)" parent=UNIFI-JUMLAH <mark>priority=5/5</mark> \\\n    queue=pcq-up-50m/pcq-down-50m target=192.168.32.0/23',
      'add comment="QOS-P1: Google Meet priority 1" dst=pppoe-unifi limit-at=50M/50M \\\n    max-limit=720M/750M name=Meet <mark>packet-marks=meet</mark> parent=UNIFI-JUMLAH \\\n    <mark>priority=1/1</mark> target=...',
    ],
    fungsi: 'PCQ memecahkan satu kelas kepada barisan kecil bagi setiap alamat IP (dst-address untuk arah turun). limit-at = bahagian yang dijamin; priority = siapa dapat baki dahulu (1 paling tinggi). (Petikan sebenar SSeM; target Meet dipendekkan.)',
  };

  function langkah(tajuk, teks2, mod, sc, extra) {
    return Object.assign({
      tajuk, teks: teks2, rsc: RSC,
      bina(ctx) {
        const papan = ctx.papan({ mula: ['Talian Unifi', '—', ''] });
        const S = binaKapasiti(ctx, { mod, sc, padaHasil: hasilKePapan(papan) });
        const kemas = () => ctx.jalan((s) => S.kemas(s));
        ctx.segmen('Kawalan trafik', [{ v: 'A', t: 'Tanpa kawalan' }, { v: 'B', t: 'PCQ sahaja' }, { v: 'C', t: 'PCQ + QoS' }], mod, (v) => { S.mod = v; kemas(); });
        const ubah = (u) => { S.set(u, true); kemas(); };
        const grid = document.createElement('div');
        Object.assign(grid.style, { display: 'grid', gridTemplateColumns: '1.3fr 0.9fr 1.3fr', gap: '12px' });
        [
          ctx.segmen('Murid', [{ v: '6', t: '6' }, { v: '12', t: '12' }, { v: '24', t: '24' }], String(sc.murid), (v) => ubah({ murid: +v })),
          ctx.segmen('Staf', [{ v: '3', t: '3' }, { v: '6', t: '6' }], String(sc.staf), (v) => ubah({ staf: +v })),
          ctx.segmen('Tetamu', [{ v: '0', t: '0' }, { v: '4', t: '4' }, { v: '8', t: '8' }], String(sc.tetamu), (v) => ubah({ tetamu: +v })),
        ].forEach((x) => grid.appendChild(x.el.parentNode.parentNode));
        document.getElementById('kawalan').appendChild(grid);
        const k2 = ctx.kumpulan();
        ctx.togol('Download besar 5 GB', sc.dl, (v) => ubah({ dl: v }), { dalam: k2 });
        ctx.segmen('Panggilan Meet serentak', [{ v: '0', t: '0' }, { v: '1', t: '1' }, { v: '10', t: '10' }, { v: '25', t: '25' }], String(nMeet(sc)), (v) => ubah({ meet: +v }));
        if (this.nota) ctx.nota(this.nota);
        ctx.lencanaSim('Simulasi: permintaan peranti, kelewatan dan kualiti Meet ialah anggaran');
        kemas();
      },
    }, extra || {});
  }

  const L1 = langkah('Satu talian, ramai pengguna',
    'Semua VLAN berkongsi <b>satu talian Unifi</b> (had 750M arah turun dalam config). Apabila permintaan kecil, tiada masalah. Tukar <b>Murid 24</b> dan <b>Staf 6</b> — apa yang berlaku kepada Meet?',
    'A', { murid: 6, staf: 3, tetamu: 0, dl: false, meet: true },
    { analogi: 'Satu paip air utama ke seluruh sekolah. Waktu rehat, semua paip dibuka serentak — air di hujung jadi perlahan.' });
  const L2 = langkah('Seorang, banyak connection',
    'Sebuah laptop download fail 5 GB dengan <b>16 connection</b>. Tanpa kawalan, setiap connection dapat bahagian yang sama — jadi laptop itu dapat jauh lebih banyak daripada orang lain.',
    'A', { murid: 6, staf: 3, tetamu: 0, dl: true, meet: true },
    { nota: 'Meet hanya memerlukan ~4M, tetapi ia tetap tersangkut: masalahnya <b>menunggu giliran</b> dalam barisan panjang, bukan kerana talian kurang laju.' });
  const L3 = langkah('PCQ: adil setiap pengguna',
    '<b>PCQ</b> memberikan setiap alamat IP barisannya sendiri dan had seorang: Murid 50M, Staf 100M, Tetamu 20M (rate-limit HotSpot). Laptop download kini terhad kepada 50M, tidak kira berapa banyak connection.',
    'B', { murid: 6, staf: 3, tetamu: 0, dl: true, meet: true },
    { analogi: 'Kaunter bank dengan nombor giliran: setiap pelanggan dilayan secara bergilir-gilir, bukan siapa paling ramai kawan dalam barisan.' });
  const L4 = langkah('QoS: Meet didahulukan',
    'Waktu sibuk. <b>limit-at</b> menjamin bahagian setiap kelas; baki diberi mengikut <b>priority</b>. Meet (prio 1) sentiasa dilayan dahulu; download besar (prio 8) hanya dapat baki. Kini <b>25 panggilan Meet</b> serentak: bandingkan segmen Meet pada bar talian dalam tiga mod.',
    'C', { murid: 24, staf: 6, tetamu: 8, dl: true, meet: 25 },
    { analogi: 'Kaunter keutamaan: panggilan video kecil tetapi tidak boleh menunggu, jadi ia tidak beratur di belakang download besar.' });
  const L5 = langkah('Cuba sendiri',
    'Ubah bilangan pengguna, download dan mod kawalan. Perhatikan bar talian, bar setiap peranti dan status Meet.',
    'C', { murid: 12, staf: 3, tetamu: 4, dl: true, meet: true },
    { nota: 'Bulk ditanda selepas connection melebihi 10 MB (connection-bytes). VLAN 25/98/99 juga ada queue sendiri — tidak dipaparkan di sini.' });

  MG.daftarBab({
    id: 'kapasiti', no: 8, tajuk: 'Kapasiti talian', sub: 'PCQ + QoS + Google Meet', status: 'siap',
    ringkas: 'Satu talian 750M dikongsi: PCQ adil setiap pengguna, QoS dahulukan Meet.',
    langkah: [L1, L2, L3, L4, L5],
    ikonMenu(s) {
      [['#0284C7', 30], ['#16A34A', 80], ['#8B5CF6', 110], ['#F59E0B', 40]].reduce((x, c) => { el('rect', { x, y: 40, width: c[1], height: 40, fill: c[0] }, s); return x + c[1]; }, 20);
      el('rect', { x: 20, y: 40, width: 260, height: 40, rx: 6, fill: 'none', stroke: '#3B4648', 'stroke-width': 4 }, s);
    },
  });
  MG._kiraKapasiti = kira; // untuk ujian konsol
})();
