/* Bab 1 — VLAN. Dalam SSeM, VLAN diasingkan melalui WiFi: peranti → SSID → AP/WAC (tag VLAN)
   → switch (trunk) → router ether16-TRUNK. Empat SSID latihan (KEW, Staff, Student, Guest → VLAN 10,
   20, 30, 40). Mula dengan satu LAN (satu broadcast domain), kemudian bahagi kepada VLAN, ikut tag,
   routing antara VLAN + firewall, dan subnet/DHCP setiap VLAN. Tiada port switch per VLAN dan tiada
   nombor port switch: config switch tiada dalam RSC. */
(function () {
  'use strict';
  const { el, teks, W, KUMP } = MG;
  const G = MG.g;

  const ZON = ['kewangan', 'staf', 'murid', 'tetamu'];
  // SSID ikut dokumen WAC projek (PERBEZAAN-SKPK-SSEM.md); latihan hanya memaparkan empat SSID ini
  const SSID = { kewangan: 'KEW@SSM-KUCHING', staf: 'Staff@SSM-KUCHING', murid: 'Student@SSM-KUCHING', tetamu: 'Guest@SSM-KUCHING' };
  const LORONG = { kewangan: 290, staf: 302, murid: 314, tetamu: 326 };
  const LORONG_RATA = 308;
  const TRUNK_X = 660, CHIP_Y = 94, ROUTER_BAWAH = 136, TRUNK_ATAS = 216, TRUNK_BAWAH = 238;
  const PORT_ATAS = 336, PORT_BAWAH = 358, AP_Y = 420, AP_BAWAH = 436, BARIS_A = 590, BARIS_B = 770;
  // dua kawasan liputan AP (ilustrasi); setiap AP menyiarkan keempat-empat SSID
  const KAWASAN = [{ x: 10, ap: 333, nama: 'AP 1' }, { x: 665, ap: 987, nama: 'AP 2' }];
  const KAW_W = 645;
  const chipX = (k) => 494 + ZON.indexOf(k) * 111;
  const lajurX = (a, k) => KAWASAN[a].x + 80 + ZON.indexOf(k) * 161;
  // vlan-ids pada ether16-TRUNK (RSC). VLAN 25, 98 dan 99 tiada SSID dalam latihan, tetapi tetap dibawa trunk.
  const TRUNK_VLAN = [[10, KUMP.kewangan.warna], [20, KUMP.staf.warna], [25, KUMP.eksekutif.warna], [30, KUMP.murid.warna], [40, KUMP.tetamu.warna], [98, '#475569'], [99, '#EC4899']];

  // [id, zon, kawasan AP, baris (1 = slot peranti baharu), jenis, nama, nombor hos]
  // Peranti VLAN berlainan duduk di bawah AP yang sama: VLAN ditentukan oleh SSID, bukan tempat.
  const PERANTI = [
    ['p1', 'kewangan', 0, 0, 'laptop', 'Laptop Kerani', 20], ['p2', 'kewangan', 1, 0, 'laptop', 'Laptop Akaun', 21], ['p3', 'kewangan', 0, 1, 'laptop', 'Laptop baharu', 22],
    ['g1', 'staf', 0, 0, 'laptop', 'Cikgu Aina', 45], ['g2', 'staf', 1, 0, 'laptop', 'Cikgu Ravi', 46], ['g3', 'staf', 0, 1, 'laptop', 'Laptop baharu', 47],
    ['m1', 'murid', 0, 0, 'laptop', 'Murid 1', 57], ['m2', 'murid', 1, 0, 'laptop', 'Murid 2', 58], ['m3', 'murid', 1, 1, 'laptop', 'Murid baharu', 59],
    ['t1', 'tetamu', 1, 0, 'telefon', 'Telefon Tetamu', 30], ['t2', 'tetamu', 0, 0, 'telefon', 'Tablet Tetamu', 31], ['t3', 'tetamu', 1, 1, 'telefon', 'Tetamu baharu', 32],
  ].map((r) => ({ id: r[0], k: r[1], a: r[2], baharu: r[3] === 1, jenis: r[4], nama: r[5], h: r[6], x: lajurX(r[2], r[1]), y: r[3] ? BARIS_B : BARIS_A }));
  const PER = Object.fromEntries(PERANTI.map((d) => [d.id, d]));
  const apX = (d) => KAWASAN[d.a].ap;
  const atas = (d) => ({ x: d.x, y: d.y - 40 });

  /* ------------------------------------------------------------------ pembina rangkaian */
  function binaRangkaian(ctx, o) {
    o = o || {};
    const N = {
      mod: o.mod || 'rata',
      ada: new Set(PERANTI.filter((d) => !d.baharu).map((d) => d.id)),
      ipBaharu: {}, meter: {},
    };
    const lap = {};
    ['zon', 'kabel', 'rak', 'dalamStub', 'dalamLorong', 'port', 'chip', 'peranti', 'label', 'paket'].forEach((n) => (lap[n] = ctx.lapisan(n)));
    N.lap = lap;
    const laneY = (k) => (N.mod === 'vlan' ? LORONG[k] : LORONG_RATA);
    const warnaK = (k) => (N.mod === 'vlan' ? KUMP[k].warna : W.dakwat2);
    N.laneY = laneY; N.apX = apX;

    // kawasan liputan AP
    KAWASAN.forEach((a) => MG.zon({ x: a.x, y: 452, width: KAW_W, height: 432, rx: 18, fill: W.kad, stroke: W.garis }, lap.zon));
    if (o.slot) PERANTI.filter((d) => d.baharu).forEach((d) => el('rect', { x: d.x - 78, y: d.y - 56, width: 156, height: 170, rx: 12, fill: 'none', stroke: W.garis2, 'stroke-width': 2, 'stroke-dasharray': '6 6' }, lap.zon));

    // kabel: WiFi (putus-putus), uplink AP, trunk ke router
    const kabel = {};
    PERANTI.forEach((d) => {
      kabel[d.id] = el('line', { x1: apX(d), y1: AP_BAWAH + 2, x2: d.x, y2: d.y - 40, stroke: W.garis2, 'stroke-width': 2.5, 'stroke-dasharray': '6 7', 'stroke-linecap': 'round' }, lap.kabel);
    });
    KAWASAN.forEach((a) => el('line', { x1: a.ap, y1: PORT_BAWAH, x2: a.ap, y2: AP_Y - 12, stroke: W.dakwat2, 'stroke-width': 5 }, lap.kabel));
    el('line', { x1: TRUNK_X, y1: ROUTER_BAWAH, x2: TRUNK_X, y2: TRUNK_ATAS, stroke: W.dakwat2, 'stroke-width': 7 }, lap.kabel);
    const tagKabel = G(lap.kabel);

    // rak + AP
    MG.rak(lap.rak, 380, 16, 560, 120, 'ROUTER', 'MikroTik · gateway semua rangkaian');
    MG.rak(lap.rak, 30, 226, 1260, 120, 'SWITCH', null);
    const switchSub = teks(lap.rak, 172, 266, '', { 'font-size': 17, fill: '#B9C2C4' });
    KAWASAN.forEach((a, i) => {
      const ga = G(lap.rak, { class: 'boleh-klik', 'data-ap': i });
      MG.peranti(ga, 'ap', a.ap, AP_Y, { gelombangBawah: true });
      teks(ga, a.ap - 50, AP_Y + 6, a.nama, { 'font-size': 18, 'font-weight': 800, fill: W.dakwat2, 'text-anchor': 'end' });
      ga.addEventListener('click', () => o.klikPort && o.klikPort({ ap: i, x: a.ap, y: AP_Y - 16 }));
    });

    // kad WAC: padanan SSID → VLAN (dipapar dalam langkah tag sahaja)
    if (o.wac) {
      const g = G(lap.rak);
      el('rect', { x: 960, y: 16, width: 340, height: 186, rx: 14, fill: '#fff', stroke: W.garis2, 'stroke-width': 2 }, g);
      teks(g, 978, 44, 'WAC · padanan SSID → VLAN', { 'font-size': 17, 'font-weight': 800 });
      ZON.forEach((k, i) => {
        const z = KUMP[k], y = 77 + i * 30;
        el('rect', { x: 978, y: y - 18, width: 36, height: 24, rx: 6, fill: z.warna }, g);
        teks(g, 996, y, String(z.vlan), { 'font-size': 15, 'font-weight': 800, fill: '#fff', 'text-anchor': 'middle' });
        teks(g, 1024, y, SSID[k], { 'font-size': 16, 'font-weight': 700, fill: z.gelap });
      });
      teks(g, 978, 190, 'Router hanya melihat tag, bukan nama WiFi.', { 'font-size': 14.5, fill: W.pudar });
    }

    function lukisDalam() {
      MG.kosong(lap.dalamStub); MG.kosong(lap.dalamLorong); MG.kosong(lap.chip); MG.kosong(tagKabel);
      const xs = [TRUNK_X].concat(KAWASAN.map((a) => a.ap));
      if (N.mod === 'rata') {
        switchSub.textContent = 'satu rangkaian untuk semua';
        el('line', { x1: 48, y1: LORONG_RATA, x2: 1272, y2: LORONG_RATA, stroke: '#9AA6A8', 'stroke-width': 7, 'stroke-linecap': 'round' }, lap.dalamLorong);
        xs.forEach((x) => {
          el('line', { x1: x, y1: x === TRUNK_X ? TRUNK_BAWAH : PORT_ATAS, x2: x, y2: LORONG_RATA, stroke: '#9AA6A8', 'stroke-width': 4 }, lap.dalamStub);
          el('circle', { cx: x, cy: LORONG_RATA, r: 5, fill: '#C9CFD1' }, lap.dalamLorong);
        });
        el('rect', { x: 430, y: 64, width: 460, height: 58, rx: 10, fill: '#E9E6DE', stroke: '#8E897D', 'stroke-width': 2 }, lap.chip);
        teks(lap.chip, 660, 88, 'Tanpa VLAN — satu rangkaian', { 'font-size': 19, 'font-weight': 800, 'text-anchor': 'middle' });
        teks(lap.chip, 660, 112, 'keadaan sebelum VLAN · bukan config SSeM', { 'font-size': 15, 'text-anchor': 'middle', fill: W.dakwat2 });
      } else {
        switchSub.textContent = 'switch yang sama · setiap VLAN kekal berasingan';
        el('line', { x1: TRUNK_X, y1: TRUNK_BAWAH, x2: TRUNK_X, y2: LORONG.tetamu, stroke: '#9AA6A8', 'stroke-width': 4 }, lap.dalamStub);
        KAWASAN.forEach((a) => el('line', { x1: a.ap, y1: PORT_ATAS, x2: a.ap, y2: LORONG.kewangan, stroke: '#9AA6A8', 'stroke-width': 4 }, lap.dalamStub));
        ZON.forEach((k, j) => {
          const z = KUMP[k], y = LORONG[k];
          const gl = G(lap.dalamLorong, { 'data-z': k });
          el('line', { x1: 48, y1: y, x2: 1272, y2: y, stroke: z.warna, 'stroke-width': 6, 'stroke-linecap': 'round', class: 'lorong' }, gl);
          xs.forEach((x) => el('circle', { cx: x, cy: y, r: 5.5, fill: '#fff', stroke: z.warna, 'stroke-width': 3 }, gl));
          // cip interface VLAN pada router
          const c = G(lap.chip, { 'data-z': k }), cx = chipX(k);
          el('rect', { x: cx - 52, y: 64, width: 104, height: 58, rx: 9, fill: z.cerah, stroke: z.warna, 'stroke-width': 3 }, c);
          teks(c, cx, 88, 'VLAN ' + z.vlan, { 'font-size': 17, 'font-weight': 800, 'text-anchor': 'middle', fill: z.gelap });
          teks(c, cx, 111, z.gw, { 'font-size': 13, 'text-anchor': 'middle', class: 'mono', fill: W.dakwat2 });
          // pelekat tag pada uplink setiap AP (frame dari AP ke switch sudah bertag)
          KAWASAN.forEach((a) => {
            const t = G(tagKabel, { 'data-z': k });
            el('rect', { x: a.ap + 14 + j * 30, y: 366, width: 26, height: 22, rx: 5, fill: z.warna }, t);
            teks(t, a.ap + 27 + j * 30, 382, String(z.vlan), { 'font-size': 13, 'font-weight': 800, fill: '#fff', 'text-anchor': 'middle' });
          });
        });
        // trunk ke router: tujuh VLAN bertag (vlan-ids RSC)
        const tg = G(tagKabel);
        teks(tg, 676, 162, 'ether16-TRUNK · tag', { 'font-size': 16, 'font-weight': 800, fill: W.dakwat2 });
        TRUNK_VLAN.forEach(([v, w], i) => {
          el('rect', { x: 676 + i * 30, y: 172, width: 26, height: 24, rx: 5, fill: w }, tg);
          teks(tg, 689 + i * 30, 189, String(v), { 'font-size': 13, 'font-weight': 800, fill: '#fff', 'text-anchor': 'middle' });
        });
      }
      lukisPort();
    }

    // port: trunk ke router (atas switch) dan uplink AP (bawah switch). Tiada nombor port: config switch tiada dalam RSC.
    function lukisPort() {
      MG.kosong(lap.port);
      const port = (x, y, info) => {
        const gp = G(lap.port, { class: 'boleh-klik', 'data-port': info.trunk ? 'trunk' : 'ap' + info.ap });
        el('rect', { x: x - 18, y, width: 36, height: 22, rx: 4, fill: '#C9CFD1', stroke: W.dakwat, 'stroke-width': 2, class: 'sorot' }, gp);
        if (N.mod === 'vlan') ZON.forEach((k, i) => el('rect', { x: x - 14 + i * 7, y: y + 3, width: 7, height: 16, fill: KUMP[k].warna }, gp));
        gp.addEventListener('click', () => o.klikPort && o.klikPort(Object.assign({ x, y }, info)));
      };
      port(TRUNK_X, TRUNK_ATAS, { trunk: true });
      KAWASAN.forEach((a, i) => port(a.ap, PORT_ATAS, { ap: i }));
    }

    N.ipTeks = (d) => {
      if (!N.ada.has(d.id)) return '';
      if (d.baharu && !N.ipBaharu[d.id]) return 'IP: belum ada';
      if (N.mod === 'rata') return 'satu rangkaian';
      return KUMP[d.k].awal + d.h;
    };
    const devG = {};
    function lukisPeranti() {
      MG.kosong(lap.peranti);
      PERANTI.forEach((d) => {
        const z = KUMP[d.k], v = N.mod === 'vlan';
        const gd = G(lap.peranti, { class: 'boleh-klik', opacity: N.ada.has(d.id) ? 1 : 0 });
        MG.peranti(gd, d.jenis, d.x, d.y, v ? { warna: z.warna, skrin: z.cerah } : {});
        if (v) {
          el('rect', { x: d.x + 26, y: d.y - 52, width: 34, height: 22, rx: 6, fill: z.warna }, gd);
          teks(gd, d.x + 43, d.y - 36, String(z.vlan), { 'font-size': 14, 'font-weight': 800, fill: '#fff', 'text-anchor': 'middle' });
        }
        teks(gd, d.x, d.y + 70, d.nama, { 'font-size': 16, 'font-weight': 700, 'text-anchor': 'middle' });
        if (v) teks(gd, d.x, d.y + 89, SSID[d.k], { 'font-size': 14, 'font-weight': 600, 'letter-spacing': -0.2, 'text-anchor': 'middle', fill: z.gelap });
        const ip = teks(gd, d.x, d.y + (v ? 108 : 90), N.ipTeks(d), { 'font-size': 14.5, 'text-anchor': 'middle', class: 'mono', fill: W.dakwat2 });
        const my = d.y + 118;
        const mBg = el('rect', { x: d.x - 34, y: my, width: 68, height: 8, rx: 4, fill: W.garis, opacity: 0 }, gd);
        const mIsi = el('rect', { x: d.x - 34, y: my, width: 0, height: 8, rx: 4, fill: W.aksen, opacity: 0 }, gd);
        const dapat = el('circle', { cx: d.x, cy: d.y - 4, r: 50, fill: 'none', stroke: v ? z.warna : W.aksen, 'stroke-width': 5, visibility: 'hidden' }, gd);
        const tanda = G(gd, { visibility: 'hidden' });
        el('circle', { cx: d.x, cy: d.y - 4, r: 46, fill: 'none', stroke: W.sekat, 'stroke-width': 4, 'stroke-dasharray': '7 6' }, tanda);
        N.meter[d.id] = { bg: mBg, isi: mIsi, v: 0 };
        devG[d.id] = { g: gd, ip, tanda, dapat };
        gd.style.pointerEvents = N.ada.has(d.id) ? 'auto' : 'none';
        gd.addEventListener('click', () => o.klikPeranti && N.ada.has(d.id) && o.klikPeranti(d));
        kabel[d.id].setAttribute('opacity', N.ada.has(d.id) ? 1 : 0);
      });
    }
    N.kemasIp = (d) => { devG[d.id].ip.textContent = N.ipTeks(d); };
    N.tanda = (id, v) => devG[id].tanda.setAttribute('visibility', v ? 'visible' : 'hidden');
    N.dapat = (id, v) => devG[id].dapat.setAttribute('visibility', v ? 'visible' : 'hidden');
    N.setMeter = (id, v, tunjuk) => {
      const m = N.meter[id]; m.v = v;
      m.bg.setAttribute('opacity', tunjuk ? 1 : 0); m.isi.setAttribute('opacity', tunjuk ? 1 : 0);
      m.isi.setAttribute('width', (68 * Math.max(0, Math.min(1, v))).toFixed(1));
    };
    N.tunjukPeranti = (id) => {
      N.ada.add(id);
      const d = PER[id];
      devG[id].g.style.pointerEvents = 'auto';
      kabel[id].setAttribute('opacity', 1);
      N.kemasIp(d);
      return devG[id].g;
    };

    N.setMod = async function (s, mod, animasi) {
      N.mod = mod;
      lukisDalam(); lukisPeranti();
      if (!animasi || mod !== 'vlan') return;
      const semua = ctx.svg.querySelectorAll('[data-z]');
      semua.forEach((n) => n.setAttribute('opacity', 0));
      try { for (const k of ZON) {
        const nod = ctx.svg.querySelectorAll(`[data-z="${k}"]`);
        const lor = ctx.svg.querySelector(`.lapisan-dalamLorong [data-z="${k}"] .lorong`);
        if (lor) { lor.setAttribute('stroke-dasharray', '1300'); lor.setAttribute('stroke-dashoffset', '1300'); }
        await s.tween(520, (p) => {
          nod.forEach((n) => n.setAttribute('opacity', p));
          if (lor) lor.setAttribute('stroke-dashoffset', (1300 * (1 - p)).toFixed(0));
        });
      } } finally {
        // dibatalkan di tengah pun, mod VLAN mesti kelihatan lengkap
        semua.forEach((n) => n.setAttribute('opacity', 1));
        ctx.svg.querySelectorAll('.lapisan-dalamLorong .lorong').forEach((l) => l.setAttribute('stroke-dashoffset', '0'));
      }
    };

    /* ---------------- laluan */
    const tagPt = (pt, k) => (N.mod === 'vlan' ? Object.assign(pt, { tag: KUMP[k].vlan, warnaTag: KUMP[k].warna }) : pt);
    // peranti → AP (udara: tiada tag) → uplink AP (bertag) → lorong switch
    N.naik = (d) => {
      const x = apX(d);
      return [atas(d), { x, y: AP_BAWAH }, { x, y: AP_Y - 12 }, tagPt({ x, y: PORT_BAWAH }, d.k), { x, y: PORT_ATAS }, { x, y: laneY(d.k) }];
    };
    // dari lorong (pada x) → uplink AP → peranti
    N.turun = (d, dariX) => {
      const x = apX(d), y = laneY(d.k);
      return [{ x: dariX, y }, { x, y }, { x, y: PORT_ATAS }, { x, y: PORT_BAWAH }, tagPt({ x, y: AP_Y - 12 }, d.k), { x, y: AP_BAWAH }, atas(d)];
    };
    // Lapisan 2 (VLAN yang sama): AP yang sama terus melalui udara; AP lain melalui switch
    N.lalu = (d, t) => (d.a === t.a ? [atas(d), { x: apX(d), y: AP_BAWAH }, atas(t)] : N.naik(d).concat(N.turun(t, apX(d)).slice(1)));
    N.keRouter = (k, dariX) => {
      const y = laneY(k), cx = N.mod === 'vlan' ? chipX(k) : TRUNK_X;
      return [{ x: dariX, y }, { x: TRUNK_X, y }, { x: TRUNK_X, y: TRUNK_BAWAH }, { x: TRUNK_X, y: TRUNK_ATAS }, tagPt({ x: TRUNK_X, y: ROUTER_BAWAH }, k), { x: cx, y: CHIP_Y }];
    };
    N.dariRouter = (k, d) => {
      const y = laneY(k), cx = N.mod === 'vlan' ? chipX(k) : TRUNK_X;
      const dari = [{ x: cx, y: CHIP_Y }, { x: TRUNK_X, y: ROUTER_BAWAH }, tagPt({ x: TRUNK_X, y: TRUNK_ATAS }, k), { x: TRUNK_X, y: TRUNK_BAWAH }, { x: TRUNK_X, y }];
      return dari.concat(N.turun(d, TRUNK_X).slice(1));
    };
    N.chipPos = (k) => ({ x: N.mod === 'vlan' ? chipX(k) : TRUNK_X, y: CHIP_Y });

    N.sampul = (k, o2) => MG.sampul(lap.paket, Object.assign({ warna: warnaK(k) }, o2 || {}));
    N.terima = (s, d) => MG.denyut(s, lap.paket, d.x, d.y - 4, N.mod === 'vlan' ? KUMP[d.k].warna : W.aksen, 40);
    N.terimaRouter = (s, k) => { const p = N.chipPos(k); return MG.denyut(s, lap.paket, p.x, p.y, N.mod === 'vlan' ? KUMP[k].warna : W.aksen, 50); };
    N.bersih = () => { MG.kosong(lap.paket); MG.kosong(lap.label); PERANTI.forEach((d) => { N.tanda(d.id, false); N.dapat(d.id, false); }); };

    /* Broadcast dari peranti d. AP menyiarkannya semula pada SSID yang sama dan menghantarnya ke switch;
       switch menyalinnya ke semua port dalam broadcast domain yang sama (AP lain + trunk ke router). */
    N.siaran = async function (s, d, o2) {
      o2 = o2 || {};
      const laju = o2.laju || 520, saiz = o2.saiz || 1;
      const sasaran = PERANTI.filter((t) => t.id !== d.id && N.ada.has(t.id) && (N.mod === 'rata' || t.k === d.k));
      let kira = 0;
      const tiba = (t) => { if (t === 'router') return; kira++; if (o2.padaTiba) o2.padaTiba(t, kira, sasaran.length); };
      const salin = (path, t) => {
        const c = N.sampul(d.k, { siaran: true, saiz });
        return MG.gerak(s, c, path, { laju }).then(() => { c.remove(); tiba(t); if (o2.tanpaDenyut) return; if (t === 'router') return N.terimaRouter(s, d.k); N.dapat(t.id, true); return N.terima(s, t); });
      };
      const p = N.sampul(d.k, { siaran: true, saiz, label: o2.label });
      const naik = N.naik(d), x = apX(d);
      await MG.gerak(s, p, naik.slice(0, 2), { laju });
      const kerja = sasaran.filter((t) => t.a === d.a).map((t) => salin([{ x, y: AP_BAWAH }, atas(t)], t));
      kerja.push(MG.gerak(s, p, naik.slice(1), { laju }).then(() => {
        p.remove();
        const lain = sasaran.filter((t) => t.a !== d.a).map((t) => salin(N.turun(t, x), t));
        lain.push(salin(N.keRouter(d.k, x), 'router'));
        return Promise.all(lain);
      }));
      await Promise.all(kerja);
      return sasaran.length;
    };

    lukisDalam(); lukisPeranti();
    return N;
  }

  /* ------------------------------------------------------------------ pembantu langkah */
  const ikutPapan = (papan, mod) => (t, n, jum) => papan.set('Broadcast diterima oleh', n + ' peranti', mod === 'vlan'
    ? 'Hanya peranti dalam VLAN yang sama, + router (gateway VLAN itu).'
    : 'Semua peranti di sekolah, + router. Termasuk yang tiada kaitan.', mod === 'vlan' ? 'benar' : 'sekat');

  const padamMeter = (N) => PERANTI.forEach((d) => N.setMeter(d.id, 0, false));

  function demoSiaran(ctx, N, papan, d, label) {
    return ctx.jalan(async (s) => {
      N.bersih(); padamMeter(N);
      papan.set('Broadcast diterima oleh', '0 peranti', 'Frame sedang disalin oleh AP dan switch…');
      await N.siaran(s, d, { label: label || 'Apa gateway saya?', laju: 330, padaTiba: ikutPapan(papan, N.mod) });
    });
  }

  // Waktu sibuk: banyak broadcast serentak. Meter = kadar teori setiap peranti (data simulasi).
  function waktuSibuk(ctx, N, papan, hidup) {
    return ctx.jalan(async (s) => {
      N.bersih();
      const ada = () => PERANTI.filter((d) => N.ada.has(d.id));
      if (!hidup) { ada().forEach((d) => N.setMeter(d.id, 0, false)); papan.set('Waktu sibuk', 'Mati', 'Hidupkan untuk lihat beban broadcast.'); return; }
      const KADAR = 2; // broadcast sesaat setiap peranti (andaian simulasi)
      const sasar = (d) => (ada().filter((t) => t.id !== d.id && (N.mod === 'rata' || t.k === d.k)).length) * KADAR;
      const maks = (ada().length - 1) * KADAR;
      const purata = ada().reduce((a, d) => a + sasar(d), 0) / ada().length;
      papan.set('Broadcast diterima setiap peranti', purata.toFixed(0) + ' / saat',
        N.mod === 'rata' ? `Ini baru ${ada().length} peranti. Sekolah sebenar ada ratusan peranti — bebannya berganda.` : 'Hanya daripada peranti dalam VLAN sendiri.', N.mod === 'rata' ? 'sekat' : 'benar');
      ada().forEach((d) => N.setMeter(d.id, 0, true));
      const sasaran = Object.fromEntries(ada().map((d) => [d.id, sasar(d) / Math.max(1, maks)]));
      MG.senyap(s.tween(1400, (p) => ada().forEach((d) => N.setMeter(d.id, sasaran[d.id] * p, true))));
      if (MG.statik) return;
      let t = 0;
      s.ticker((dt) => {
        t += dt;
        if (t < 380) return;
        t = 0;
        const a = ada(), d = a[Math.floor(Math.random() * a.length)];
        MG.senyap(N.siaran(s, d, { laju: 1000, saiz: 0.62, tanpaDenyut: true }));
      });
      await new Promise(() => {}); // kekal hidup sehingga skop dibatalkan
    });
  }

  // Telefon Tetamu dijangkiti cuba mencapai semua peranti lain.
  function imbas(ctx, N, papan) {
    return ctx.jalan(async (s) => {
      N.bersih(); padamMeter(N);
      const d = PER.t1;
      const sasaran = PERANTI.filter((t) => t.id !== d.id && N.ada.has(t.id));
      let terus = 0, sekat = 0;
      const kemas = () => papan.set('Telefon Tetamu dapat capai', terus + ' peranti',
        N.mod === 'rata' ? 'Terus melalui AP dan switch — router tidak nampak, tiada rule boleh menyekat.'
          : `Terus: hanya dalam VLAN 40. ${sekat} percubaan ke VLAN lain mesti melalui router — dan disekat oleh firewall.`, N.mod === 'rata' ? 'sekat' : 'benar');
      kemas();
      if (N.mod === 'rata') MG.label(N.lap.label, 1100, 100, 'Router tidak nampak trafik ini', { fs: 19, garis: W.sekat, warnaTeks: W.sekat });
      const kerja = sasaran.map(async (t, i) => {
        await s.tunggu(i * 120);
        const p = MG.sampul(N.lap.paket, { warna: W.sekat, saiz: 0.7, label: '?' });
        if (N.mod === 'rata' || t.k === d.k) {
          await MG.gerak(s, p, N.lalu(d, t), { laju: 560, kekalTag: true });
          p.remove(); terus++; N.tanda(t.id, true); kemas();
        } else {
          await MG.gerak(s, p, N.naik(d).concat(N.keRouter('tetamu', N.apX(d)).slice(1)), { laju: 560, kekalTag: true });
          p.remove(); sekat++; kemas();
        }
      });
      if (N.mod === 'vlan') {
        MG.label(N.lap.label, 1100, 100, 'Rule SSeM: VLAN 40 → Deny ALL local VLANs', { fs: 17, garis: W.sekat, warnaTeks: W.sekat });
      }
      await Promise.all(kerja);
      if (N.mod === 'vlan') await MG.cop(s, N.lap.label, 1100, 160, 'DISEKAT', 'sekat');
    });
  }

  /* ------------------------------------------------------------------ langkah */
  const RSC_VLAN = {
    kod: ['/interface vlan\nadd interface=bridge-trunk name=VLAN10-Kewangan vlan-id=10\nadd interface=bridge-trunk name=VLAN20-Staff vlan-id=20\nadd interface=bridge-trunk name=VLAN25-Executive vlan-id=25\nadd interface=bridge-trunk name=<mark>VLAN30-Student vlan-id=30</mark>\nadd interface=bridge-trunk name=VLAN40-Guest vlan-id=40'],
    fungsi: 'Mewujudkan interface VLAN pada router SSeM. Setiap satu ialah satu rangkaian logik. (Petikan sebenar, eksport 22 Okt; SSeM juga ada VLAN 98 dan 99.)',
  };

  const L1 = {
    tajuk: 'Satu LAN untuk semua',
    teks: 'Sebelum VLAN, semua peranti sekolah bersambung ke <b>satu WiFi, satu rangkaian</b> — seperti router ISP dan Deco di rumah. Apabila satu peranti menghantar <b>broadcast</b>, AP dan switch menyalinnya ke <b>semua</b> peranti.',
    analogi: 'Pengumuman melalui pembesar suara sekolah: seorang bercakap, <b>semua bilik</b> terpaksa mendengar — termasuk yang tiada kaitan.',
    bina(ctx) {
      const papan = ctx.papan({ mula: ['Broadcast diterima oleh', '—', 'Klik mana-mana peranti untuk menghantar broadcast.'] });
      const N = binaRangkaian(ctx, { mod: 'rata', klikPeranti: (d) => demoSiaran(ctx, N, papan, d) });
      const k = ctx.kumpulan('Hantar broadcast dari');
      ZON.forEach((z) => ctx.butang(KUMP[z].nama, () => demoSiaran(ctx, N, papan, PERANTI.find((d) => d.k === z)), { dalam: k }));
      ctx.nota('Contoh broadcast sebenar: ARP (“siapa pemilik alamat ini?”) dan DHCP Discover.');
      demoSiaran(ctx, N, papan, PER.m1, 'Apa gateway saya?');
    },
  };

  const L2 = {
    tajuk: 'Masalah satu broadcast domain',
    teks: 'Semakin banyak peranti, semakin banyak broadcast yang <b>setiap</b> peranti terpaksa terima. Lebih bahaya lagi: telefon Tetamu boleh terus sampai ke laptop Kewangan dan laptop Cikgu <b>tanpa melalui router</b>.',
    analogi: 'Satu dewan besar tanpa dinding: bising untuk semua, dan sesiapa boleh berjalan terus ke meja pejabat.',
    bina(ctx) {
      const papan = ctx.papan({ mula: ['Simulasi masalah', 'Pilih', ''] });
      ctx.lencanaSim();
      const N = binaRangkaian(ctx, { mod: 'rata' });
      const t = ctx.togol('Waktu sibuk: semua peranti hantar broadcast', true, (v) => waktuSibuk(ctx, N, papan, v), { kumpulan: 'Masalah 1 — bising' });
      ctx.butang('Telefon Tetamu dijangkiti: imbas rangkaian', () => { t.set(false); imbas(ctx, N, papan); }, { kumpulan: 'Masalah 2 — terdedah', warna: W.sekat });
      ctx.nota('Dalam satu LAN, peranti bercakap terus melalui AP dan switch. Router (tempat firewall) tidak berada di laluan itu.');
      waktuSibuk(ctx, N, papan, true);
    },
  };

  const L3 = {
    tajuk: 'Bahagikan dengan VLAN',
    teks: 'WiFi sekolah dibahagikan kepada beberapa <b>SSID</b>. Setiap SSID dipadankan dengan satu <b>VLAN</b>. Broadcast kini hanya sampai ke peranti dalam <b>VLAN yang sama</b>, walaupun di bawah AP yang sama. AP, kabel dan switch <b>tidak bertambah</b>.',
    analogi: 'Seperti headphone berbilang saluran dalam dewan: semua duduk dalam dewan yang sama, tetapi setiap orang hanya mendengar saluran yang dipilihnya (SSID).',
    rsc: RSC_VLAN,
    bina(ctx) {
      const papan = ctx.papan({ mula: ['Mengaktifkan VLAN', '…', 'Setiap SSID dipadankan dengan satu VLAN.'] });
      const N = binaRangkaian(ctx, { mod: 'rata', klikPeranti: (d) => { sibuk.set(false); demoSiaran(ctx, N, papan, d); } });
      const sb = ctx.segmen('Paparan', [{ v: 'rata', t: 'Sebelum: satu LAN' }, { v: 'vlan', t: 'Selepas: VLAN' }], 'vlan', (v) => ctx.jalan(async (s) => { N.bersih(); await N.setMod(s, v, false); sibuk.set(false); demoSiaran(ctx, N, papan, PER.m1); }));
      const k = ctx.kumpulan('Cuba');
      ctx.butang('Broadcast daripada Murid', () => { sibuk.set(false); demoSiaran(ctx, N, papan, PER.m1); }, { dalam: k, warna: KUMP.murid.warna });
      ctx.butang('Imbas daripada Tetamu', () => { sibuk.set(false); imbas(ctx, N, papan); }, { dalam: k, warna: W.sekat });
      const sibuk = ctx.togol('Waktu sibuk', false, (v) => waktuSibuk(ctx, N, papan, v));
      ctx.nota('Nama SSID dan padanan VLAN daripada dokumen WAC projek. SSeM juga ada VLAN 25, 98 dan 99, tetapi tidak dipaparkan di sini.');
      void sb;
      ctx.jalan(async (s) => {
        await s.tunggu(500);
        await N.setMod(s, 'vlan', true);
        papan.set('VLAN aktif', '4 SSID → 4 VLAN', 'AP dan switch yang sama, rangkaian logik berasingan.', 'benar');
        await s.tunggu(900);
        demoSiaran(ctx, N, papan, PER.m1);
      });
    },
  };

  const INFO_PORT = (p, mod) => {
    if (p.trunk) return mod === 'vlan'
      ? '<b>Trunk ke router · ether16-TRUNK</b>Satu kabel membawa VLAN 10, 20, 25, 30, 40, 98 dan 99. Setiap frame bertag VLAN.'
      : '<b>Kabel ke router</b>Tanpa VLAN: satu rangkaian, tiada tag.';
    const nama = 'AP ' + (p.ap + 1);
    return mod === 'vlan'
      ? `<b>${nama} · uplink bertag</b>AP menyiarkan beberapa SSID; empat dipaparkan di sini. Frame dari AP ke switch membawa tag 10, 20, 30 atau 40 mengikut SSID.`
      : `<b>${nama}</b>Tanpa VLAN: satu WiFi, satu rangkaian, tiada tag.`;
  };

  function ikutFrame(ctx, N, papan, jenis) {
    return ctx.jalan(async (s) => {
      N.bersih();
      const L = N.lap.label;
      const nota = (x, y, t, w) => MG.label(L, x, y, t, { fs: 17, garis: w || W.dakwat2 });
      if (jenis === 'staf' || jenis === 'tetamu') {
        const k = jenis, d = k === 'staf' ? PER.g1 : PER.t1, z = KUMP[k], x = N.apX(d);
        const p = N.sampul(k, { label: 'ke Internet' });
        const naik = N.naik(d), keR = N.keRouter(k, x);
        papan.set('Frame daripada ' + d.nama, 'SSID → tag', 'Perhatikan tag pada setiap bahagian laluan.');
        await MG.gerak(s, p, naik.slice(0, 2), { laju: 360 });
        nota(x, 500, `1. WiFi ${SSID[k]} → VLAN ${z.vlan}`, z.gelap);
        await s.tunggu(1000);
        await MG.gerak(s, p, naik.slice(1, 4), { laju: 360 });
        nota(x - 172, 384, `2. Keluar dari AP: tag ${z.vlan}`, z.gelap);
        await s.tunggu(900);
        await MG.gerak(s, p, naik.slice(3).concat(keR.slice(1, 5)), { laju: 360 });
        nota(548, 192, `3. Trunk: tag ${z.vlan}`, z.gelap);
        await s.tunggu(900);
        await MG.gerak(s, p, keR.slice(4), { laju: 360 });
        p.remove();
        N.terimaRouter(s, k);
        papan.set('Router menerima pada', 'VLAN ' + z.vlan, `Tag ${z.vlan} → interface ${z.ssem}. Router tidak melihat nama WiFi.`, 'benar');
      } else {
        const p = MG.sampul(N.lap.paket, { warna: W.dakwat2, label: 'tag 500' });
        p.setTag(500, '#64748B');
        papan.set('Frame bertag 500', '?', 'Tiba di ether16-TRUNK. VLAN 500 (Unifi) hanya wujud pada ether1-TM-Unifi.');
        await MG.gerak(s, p, [{ x: TRUNK_X, y: TRUNK_BAWAH }, { x: TRUNK_X, y: ROUTER_BAWAH + 6 }], { laju: 160, kekalTag: true });
        await MG.cop(s, L, 548, 176, 'DITOLAK', 'sekat');
        p.remove();
        papan.set('Frame tag 500', 'Ditolak', 'bridge-trunk (vlan-filtering=yes) hanya menerima vlan-ids=10,20,25,30,40,98-99.', 'sekat');
      }
    });
  }

  const L4 = {
    tajuk: 'SSID → tag VLAN → trunk',
    teks: 'Peranti memilih <b>SSID</b>. WAC memadankan SSID dengan VLAN, jadi frame keluar dari AP dengan <b>tag VLAN</b>. Switch membawa frame bertag melalui <b>trunk</b> ke <b>ether16-TRUNK</b> pada router. Klik AP atau port untuk butiran.',
    analogi: 'Setiap SSID seperti pintu masuk berlainan. Di pintu, setiap sampul ditampal dengan pelekat warna (tag). Semua sampul dibawa dalam satu beg mel (trunk); pelekat menentukan bilik penerimanya.',
    rsc: {
      kod: ['/interface bridge vlan\nadd bridge=bridge-trunk tagged=<mark>ether16-TRUNK</mark>,bridge-trunk vlan-ids=\\\n    <mark>10,20,25,30,40,98-99</mark>', '/interface bridge port\nadd bridge=bridge-trunk interface=ether16-TRUNK\nadd bridge=<mark>bridge-lan</mark> interface=ether2'],
      fungsi: 'ether16-TRUNK membawa tujuh VLAN SSeM sebagai frame bertag; VLAN di luar senarai ditolak (bridge-trunk, vlan-filtering=yes). Port berwayar ether2 hingga ether12 berada dalam bridge-lan, tanpa VLAN (ether3–ether12 sama seperti ether2). (Petikan sebenar.)',
    },
    bina(ctx) {
      const papan = ctx.papan({ mula: ['Ikut satu frame', 'Pilih', 'Klik AP atau port untuk butiran.'] });
      let tipNo = 0;
      const N = binaRangkaian(ctx, {
        mod: 'vlan', wac: true,
        klikPort: (p) => {
          const n = ++tipNo;
          ctx.tip(p.x, p.y, INFO_PORT(p, N.mod));
          if (!MG.statik) MG.senyap(ctx.skop.tunggu(4500).then(() => { if (n === tipNo) ctx.tip(); }));
        },
      });
      const k = ctx.kumpulan('Ikut satu frame');
      ctx.butang('Staf: Staff@ → tag 20', () => ikutFrame(ctx, N, papan, 'staf'), { dalam: k, warna: KUMP.staf.warna });
      ctx.butang('Tetamu: Guest@ → tag 40', () => ikutFrame(ctx, N, papan, 'tetamu'), { dalam: k, warna: KUMP.tetamu.warna });
      ctx.butang('Frame tag 500', () => ikutFrame(ctx, N, papan, '500'), { dalam: k, warna: '#64748B' });
      ctx.nota('Istilah umum: port switch tanpa tag dipanggil <b>access port</b>. SSeM tidak mengasingkan VLAN dengan cara itu; pengasingan dibuat melalui SSID pada AP/WAC.');
      ctx.nota('Port berwayar ether2–ether12 pada router berada dalam <b>bridge-lan</b>: satu rangkaian tanpa VLAN. Config switch tiada dalam eksport router, jadi nombor port switch tidak ditunjukkan.');
      ikutFrame(ctx, N, papan, 'staf');
    },
  };

  /* -------- L5: antara VLAN */
  function polisiPadan(dari, ke, fwAktif) {
    if (dari === ke) return { lapis2: true };
    if (!fwAktif) return { benar: true, rule: null };
    // forward rule SSeM sebenar (urutan RSC) yang padan trafik antara VLAN. Peranti di sini ialah laptop/telefon, jadi rule
    // "Kewangan -> VLAN 20" (port printer sahaja, 29 Okt) tidak padan; Kewangan → laptop Staf tetap DEFAULT DENY.
    if (dari === 'murid' && ke === 'staf') return { benar: false, rule: 1 };
    if (dari === 'tetamu') return { benar: false, rule: 2 };
    return { benar: false, rule: 3 };
  }

  const L5 = {
    tajuk: 'Antara VLAN: router + firewall',
    teks: 'AP dan switch <b>tidak</b> memindahkan frame dari satu VLAN ke VLAN lain. Peranti menghantar ke <b>gateway</b> (router). Router boleh <b>menghala</b> antara VLAN — <b>firewall</b> yang memutuskan boleh atau tidak.',
    analogi: 'Pejabat am boleh menghantar surat dari blok ke blok. Pegawai keselamatan di pejabat am yang memutuskan surat mana yang dibenarkan.',
    rsc: { kod: ['add action=drop chain=forward comment=<mark>"VLAN 30 -> Deny to VLAN 20"</mark> \\\n    dst-address=172.16.22.0/23 src-address=192.168.32.0/23', 'add action=drop chain=forward comment=\\\n    <mark>"DEFAULT DENY - Drop all unmatched forward traffic"</mark>'], fungsi: 'Murid disekat ke subnet Staf; trafik antara VLAN lain yang tiada rule membenarkannya disekat oleh rule terakhir. (Petikan sebenar.)' },
    bina(ctx) {
      const papan = ctx.papan({ mula: ['Antara VLAN', '—', 'Pilih sumber dan destinasi.'] });
      const N = binaRangkaian(ctx, { mod: 'vlan' });
      let dari = 'murid', ke = 'staf', fw = true;
      // kad firewall
      const kad = document.createElement('div');
      kad.className = 'papanHasil';
      Object.assign(kad.style, { left: 'auto', right: '14px', width: '380px' });
      ctx.html.appendChild(kad);
      const lukisKad = (aktifRule) => {
        const baris = (n, t, a) => `<div style="display:flex;gap:10px;align-items:center;padding:6px 10px;border-radius:9px;margin-top:4px;font-size:15.5px;white-space:nowrap;${aktifRule === n ? 'background:' + (a === 'BENARKAN' ? '#DCEFE9' : '#FDE2E2') + ';font-weight:700' : ''};${fw ? '' : 'opacity:.35;text-decoration:line-through'}">
          <b style="width:20px">${n}</b><span style="flex:1">${t}</span><b style="color:${a === 'BENARKAN' ? W.benar : W.sekat}">${a}</b></div>`;
        kad.innerHTML = `<div class="lbl">Firewall SSeM · forward</div>
          ${baris(1, 'VLAN 30 -> Deny to VLAN 20', 'DROP')}${baris(2, 'VLAN 40 -> Deny ALL local VLANs', 'DROP')}${baris(3, 'DEFAULT DENY', 'DROP')}
          <div class="ket" style="margin-top:8px;font-size:16px">${fw ? 'Hanya rule berkaitan dipaparkan. Rule pertama yang padan menentukan. Satu pengecualian: Kewangan → VLAN 20 dibenarkan untuk <b>print</b>, status printer (SNMP) dan ping sahaja.' : '<b style="color:#DC2626">Firewall dimatikan:</b> router hanya menghala.'}</div>`;
      };
      lukisKad(null);
      const hantar = () => ctx.jalan(async (s) => {
        N.bersih(); lukisKad(null);
        const d = PERANTI.find((x) => x.k === dari && N.ada.has(x.id));
        const t = PERANTI.filter((x) => x.k === ke && N.ada.has(x.id) && x.id !== d.id)[0];
        const pol = polisiPadan(dari, ke, fw);
        const zd = KUMP[dari], zk = KUMP[ke];
        papan.set(`${zd.nama} → ${zk.nama}`, '…', `${zd.awal}${d.h} → ${zk.awal}${t.h}`);
        const p = N.sampul(dari, { label: zd.awal + d.h + ' → ' + zk.awal + t.h, saizLabel: 15 });
        if (pol.lapis2) {
          await MG.gerak(s, p, N.lalu(d, t), { laju: 480 });
          N.terima(s, t);
          papan.set('VLAN yang sama', 'Terus', 'AP dan switch menghantar terus (Lapisan 2). Router tidak terlibat.', 'benar');
          return;
        }
        const xLane = N.apX(d);
        await MG.gerak(s, p, N.naik(d).concat(N.keRouter(dari, xLane).slice(1)), { laju: 480 });
        const lblGw = MG.label(N.lap.label, 205, 196, `Ke gateway ${zd.gw}`, { fs: 17, garis: zd.warna });
        await s.tunggu(600);
        if (fw) {
          lukisKad(pol.rule);
          await s.tunggu(700);
        }
        if (!pol.benar) {
          await MG.cop(s, N.lap.label, chipX(dari), 200, 'SEKAT', 'sekat');
          papan.set(`${zd.nama} → ${zk.nama}`, 'Disekat', `Rule ${pol.rule}: ${['', 'VLAN 30 -> Deny to VLAN 20', 'VLAN 40 -> Deny ALL local VLANs', 'DEFAULT DENY'][pol.rule]} → DROP.` + (dari === 'kewangan' && ke === 'staf' ? ' Ke VLAN 20, Kewangan hanya dibenarkan untuk <b>print</b>, SNMP dan ping. Trafik lain ke laptop Staf disekat.' : ''), 'sekat');
          await s.tween(500, (q) => p.setAttribute('opacity', 1 - q));
          return;
        }
        // router menghala: frame baharu dalam VLAN destinasi
        const a = N.chipPos(dari), b = N.chipPos(ke);
        await MG.gerak(s, p, [a, { x: (a.x + b.x) / 2, y: 130 }, b], { laju: 300 });
        p.setWarna(zk.warna);
        lblGw.remove();
        MG.label(N.lap.label, 205, 196, `Dihalakan ke VLAN ${zk.vlan}`, { fs: 17, garis: zk.warna });
        await MG.gerak(s, p, N.dariRouter(ke, t), { laju: 480 });
        N.terima(s, t);
        papan.set(`${zd.nama} → ${zk.nama}`, 'Sampai', fw ? `Dibenarkan oleh rule ${pol.rule}.` : 'Tiada rule: router menghala semua. <b>VLAN bukan firewall.</b>', fw ? 'benar' : 'sekat');
      });
      const opsyen = ZON.map((k) => ({ v: k, t: KUMP[k].nama }));
      const sDari = ctx.segmen('Dari', opsyen, dari, (v) => { dari = v; hantar(); });
      const sKe = ctx.segmen('Ke', opsyen, ke, (v) => { ke = v; hantar(); });
      void sDari; void sKe;
      ctx.togol('Firewall aktif', true, (v) => { fw = v; lukisKad(null); hantar(); });
      ctx.butang('▶ Hantar packet', hantar, { utama: true });
      ctx.nota('<b>VLAN bukan firewall.</b> Matikan firewall dan cuba Murid → Staf.');
      hantar();
    },
  };

  /* -------- L6: subnet + DHCP setiap VLAN */
  const L6 = {
    tajuk: 'Setiap VLAN: subnet, gateway, DHCP',
    teks: 'Setiap VLAN ialah satu <b>subnet</b> dengan gateway sendiri pada router. Peranti baharu meminta alamat melalui broadcast <b>DHCP</b>. Broadcast kekal dalam VLAN, jadi ia dijawab oleh <b>pool VLAN itu</b> sahaja.',
    analogi: 'Setiap VLAN ada kaunter pendaftaran sendiri. Pelawat yang masuk melalui pintu Murid tidak akan diberi nombor bilik Kewangan.',
    rsc: { kod: ['/ip address\nadd address=<mark>192.168.32.1/23</mark> comment="GW VLAN 30 Student" interface=\\\n    VLAN30-Student network=192.168.32.0', '/ip pool\nadd name=pool-vlan30 ranges=<mark>192.168.32.10-192.168.33.250</mark>'], fungsi: 'Gateway dan julat alamat yang DHCP beri kepada Murid. (Petikan sebenar.)' },
    bina(ctx) {
      const papan = ctx.papan({ mula: ['Peranti baharu', '—', 'Sambungkan peranti baharu ke mana-mana SSID.'] });
      const N = binaRangkaian(ctx, { mod: 'vlan', slot: true });
      const sambung = (k) => ctx.jalan(async (s) => {
        N.bersih();
        const d = PERANTI.find((x) => x.k === k && x.baharu);
        const z = KUMP[k];
        if (N.ada.has(d.id)) { delete N.ipBaharu[d.id]; N.kemasIp(d); }
        const gd = N.tunjukPeranti(d.id);
        await s.tween(400, (p) => gd.setAttribute('opacity', p));
        papan.set(d.nama, 'DHCP Discover', `Broadcast dalam VLAN ${z.vlan} sahaja.`);
        await N.siaran(s, d, { label: 'DHCP Discover', laju: 520 });
        const ip = z.awal + d.h;
        MG.label(N.lap.label, 205, 196, `Subnet VLAN ${z.vlan}: ${z.subnet}`, { fs: 17, garis: z.warna });
        const p = N.sampul(k, { label: 'Offer/ACK: ' + ip, saizLabel: 15 });
        await MG.gerak(s, p, N.dariRouter(k, d), { laju: 520 });
        p.remove();
        N.ipBaharu[d.id] = true; N.kemasIp(d);
        N.terima(s, d);
        papan.set(d.nama + ' dapat', ip, `Gateway ${z.gw} · subnet ${z.subnet}`, 'benar');
      });
      const k = ctx.kumpulan('Sambungkan peranti baharu ke SSID');
      ZON.forEach((z) => ctx.butang(KUMP[z].nama, () => sambung(z), { dalam: k, warna: KUMP[z].warna }));
      ctx.nota('Butiran DHCP (empat mesej, lease, pool penuh) dalam Bab 2.');
      sambung('murid');
    },
  };

  /* -------- L7: rumusan */
  const L7 = {
    tajuk: 'Rumusan: tiga lapisan',
    teks: 'VLAN mengasingkan trafik pada <b>Lapisan 2</b>: SSID menentukan VLAN, trunk membawa tag. Router menghalakan trafik antara subnet pada <b>Lapisan 3</b>. <b>Firewall</b> memutuskan apa yang dibenarkan. Ketiga-tiganya perlu.',
    bina(ctx) {
      const svg = ctx.svg, L = ctx.lapisan('rumusan');
      const kad = [
        { y: 40, t: 'Lapisan 2 · VLAN (SSID → tag)', s: 'Asingkan broadcast. WAC memadankan SSID dengan VLAN; trunk membawa frame bertag ke router.', w: '#475569', ik: 'switch' },
        { y: 300, t: 'Lapisan 3 · Router', s: 'Setiap VLAN = satu subnet + gateway + pool DHCP. Router boleh menghala antara VLAN.', w: W.aksen, ik: 'router' },
        { y: 560, t: 'Polisi · Firewall', s: 'Rule dibaca dari atas. Tentukan siapa boleh ke mana. Tanpa rule, routing tidak menyekat.', w: W.sekat, ik: 'fw' },
      ];
      kad.forEach((c, i) => {
        const g = G(L, { opacity: 0 });
        el('rect', { x: 40, y: c.y, width: 820, height: 230, rx: 22, fill: W.kad, stroke: c.w, 'stroke-width': 4 }, g);
        el('rect', { x: 40, y: c.y, width: 18, height: 230, rx: 9, fill: c.w }, g);
        teks(g, 90, c.y + 66, c.t, { 'font-size': 36, 'font-weight': 800 });
        const fo = el('foreignObject', { x: 90, y: c.y + 90, width: 740, height: 130 }, g);
        const dv = document.createElement('div');
        dv.style.cssText = 'font-size:26px;line-height:1.4;color:#3B4648;font-family:inherit';
        dv.textContent = c.s; fo.appendChild(dv);
        MG.senyap(ctx.skop.tunggu(250 + i * 350).then(() => ctx.skop.tween(500, (p) => { g.setAttribute('opacity', p); MG.pindah(g, 0, (1 - p) * 20); })));
      });
      // salah faham
      const mitos = ['VLAN ≠ kabel berasingan', 'VLAN ≠ firewall', 'Routing ≠ sekatan'];
      mitos.forEach((m, i) => {
        const g = G(L);
        el('rect', { x: 900, y: 40 + i * 110, width: 380, height: 86, rx: 16, fill: '#FDE2E2', stroke: W.sekat, 'stroke-width': 2 }, g);
        teks(g, 922, 93 + i * 110, '✗  ' + m, { 'font-size': 23, 'font-weight': 800, fill: '#991B1B' });
      });
      // jadual VLAN SSeM sebenar
      const g = G(L);
      el('rect', { x: 900, y: 380, width: 380, height: 410, rx: 16, fill: '#fff', stroke: W.garis2, 'stroke-width': 2 }, g);
      teks(g, 922, 418, 'VLAN sebenar SSeM', { 'font-size': 22, 'font-weight': 800 });
      [['10', 'Kewangan', '172.16.12.0/24', '#2563EB'], ['20', 'Staff', '172.16.22.0/23', '#16A34A'], ['25', 'Executive', '172.16.26.0/24', '#06B6D4'], ['30', 'Student', '192.168.32.0/23', '#8B5CF6'], ['40', 'Guest', '192.168.42.0/24', '#F59E0B'], ['98', 'VLAN98', '172.16.102.0/24', '#475569'], ['99', 'Management', '172.16.14.0/24', '#EC4899']].forEach((r, i) => {
        const y = 456 + i * 46;
        el('rect', { x: 922, y: y - 22, width: 44, height: 32, rx: 7, fill: r[3] }, g);
        teks(g, 944, y, r[0], { 'font-size': 18, 'font-weight': 800, fill: '#fff', 'text-anchor': 'middle' });
        teks(g, 980, y, r[1], { 'font-size': 19, 'font-weight': 700 });
        teks(g, 1268, y, r[2], { 'font-size': 16, class: 'mono', 'text-anchor': 'end', fill: W.dakwat2 });
      });
      teks(g, 922, 776, 'Satu trunk (ether16) membawa ketujuh-tujuhnya.', { 'font-size': 16, fill: W.pudar });
      void svg;
    },
  };

  MG.daftarBab({
    id: 'vlan', no: 1, tajuk: 'VLAN', sub: 'satu trunk, banyak rangkaian', status: 'siap', wajib: true,
    ringkas: 'Mengapa satu LAN tidak cukup. SSID → VLAN, trunk, routing antara VLAN dan firewall.',
    langkah: [L1, L2, L3, L4, L5, L6, L7],
    ikonMenu(s) {
      el('rect', { x: 30, y: 30, width: 240, height: 56, rx: 10, fill: '#2B3437' }, s);
      ['#2563EB', '#16A34A', '#8B5CF6', '#F59E0B'].forEach((w, i) => el('line', { x1: 44, y1: 42 + i * 10, x2: 256, y2: 42 + i * 10, stroke: w, 'stroke-width': 4, 'stroke-linecap': 'round' }, s));
    },
  });
  MG.VLAN_PERANTI = PERANTI;
})();
