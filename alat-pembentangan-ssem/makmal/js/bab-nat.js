/* Bab 7 — NAT. Banyak alamat private di dalam, satu IP WAN di luar. srcnat masquerade menukar alamat sumber;
   connection tracking mencatat setiap connection supaya balasan dihantar kepada peranti yang betul.
   Ikut eksport SSeM 22 Okt: srcnat "NAT Unifi" (out pppoe-unifi), "NAT MyGovNet" (out ether13-GITN-MyGovNet),
   "Masquerade to HQ WireGuard" (out wireguard1, sumber 10.255.0.5). IP WAN sebenar TIDAK dipapar.
   Nombor port dan nombor hos ialah ilustrasi (hos dalam pool DHCP sebenar). */
(function () {
  'use strict';
  const { el, teks, W, KUMP } = MG;
  const G = MG.g;
  const KM = KUMP.murid;

  const LORONG = 952, BAS_Y = 228, TRACE_X = 414, BUS_LUAR = 1024;
  const P = { nat: { y: 244, h: 182 }, ct: { y: 440, h: 416 } };
  const BARIS_NAT = (i) => P.nat.y + 40 + i * 46, BARIS_CT = (i) => P.ct.y + 78 + i * 54;
  const COL = { dalam: 456, luar: 630, dst: 774 };
  const LUAR = {
    laman: { y: 290, nama: 'Laman web', sub: 'www.moe.gov.my', port: 443, keluar: 'unifi' },
    opendns: { y: 420, nama: 'OpenDNS', sub: '208.67.222.222', port: 53, keluar: 'unifi' },
    mygovnet: { y: 610, nama: 'Sistem MyGovNet', sub: '10.x.x.x', port: 443, keluar: 'mygovnet' },
    hq: { y: 790, nama: 'Server HQ', sub: '192.168.0.x', port: 443, keluar: 'wg' },
  };
  const KELUAR = {
    unifi: { y: 356, rule: 'unifi', sumber: 'IP WAN', iface: 'pppoe-unifi' },
    mygovnet: { y: 610, rule: 'mygovnet', sumber: 'IP ether13', iface: 'ether13-GITN-MyGovNet' },
    wg: { y: 790, rule: 'wg', sumber: '10.255.0.5', iface: 'wireguard1' },
  };
  const NAT_ASAL = [
    { id: 'unifi', nama: 'NAT Unifi', syarat: 'masquerade · out-interface=pppoe-unifi' },
    { id: 'mygovnet', nama: 'NAT MyGovNet', syarat: 'masquerade · out=ether13-GITN-MyGovNet' },
    { id: 'wg', nama: 'Masquerade to HQ WireGuard', syarat: 'masquerade · out-interface=wireguard1' },
  ];
  // Peranti Murid (nombor hos & port ilustrasi). Peranti 2 sengaja guna port sama dengan peranti 1.
  const MURID = [
    { ip: '192.168.32.57', port: 50112, ke: 'laman' },
    { ip: '192.168.32.58', port: 50112, ke: 'laman' },
    { ip: '192.168.32.91', port: 41890, ke: 'opendns' },
    { ip: '192.168.32.120', port: 37254, ke: 'laman' },
  ].map((d, i) => Object.assign(d, { y: 300 + i * 150, z: KM, nama: 'Murid ' + (i + 1), jenis: i === 2 ? 'telefon' : 'laptop' }));
  const TIGA = {
    murid: { ip: '192.168.32.57', port: 50112, ke: 'laman', y: 320, z: KUMP.murid, nama: 'Murid', jenis: 'laptop' },
    kewangan: { ip: '172.16.12.57', port: 41890, ke: 'mygovnet', y: 548, z: KUMP.kewangan, nama: 'Kewangan', jenis: 'pc' },
    staf: { ip: '172.16.22.57', port: 37254, ke: 'hq', y: 776, z: KUMP.staf, nama: 'Staf', jenis: 'pc' },
  };

  function barisNat(induk, x, y, w, r) {
    const g = G(induk, { class: 'boleh-klik' });
    const kotak = el('rect', { x, y, width: w, height: 40, rx: 9, fill: '#fff', stroke: W.garis2, 'stroke-width': 2, class: 'sorot' }, g);
    const nama = teks(g, x + 14, y + 18, r.nama, { 'font-size': 16, 'font-weight': 800 });
    teks(g, x + 14, y + 34, r.syarat, { 'font-size': 12.5, class: 'mono', fill: W.pudar });
    const sebab = teks(g, x + w - 12, y + 18, '', { 'font-size': 14, 'font-weight': 800, 'text-anchor': 'end' });
    return { g, kotak, nama, sebab, cy: y + 20 };
  }
  const sorot = (n, w, t) => { n.setAttribute('stroke', w || W.garis2); n.setAttribute('stroke-width', t || 2); };

  function binaNat(ctx, o) {
    o = o || {};
    const lap = {};
    ['dasar', 'panel', 'ct', 'label', 'paket'].forEach((n) => (lap[n] = ctx.lapisan(n)));
    const S = { nat: NAT_ASAL.map((r) => Object.assign({ hidup: true }, r)), b: {}, ct: [], dev: [] };

    // kad packet
    const kad = G(lap.dasar);
    el('rect', { x: 400, y: 20, width: 900, height: 124, rx: 16, fill: W.kad, stroke: W.garis, 'stroke-width': 2 }, kad);
    teks(kad, 422, 50, 'PACKET', { 'font-size': 16, 'font-weight': 800, fill: W.pudar, 'letter-spacing': 0.8 });
    teks(kad, 1282, 50, 'nombor port: ilustrasi', { 'font-size': 13.5, fill: W.pudar, 'text-anchor': 'end' });
    const md = {};
    [['dari', 'Dari', 422, 86], ['ke', 'Ke', 422, 122], ['nat', 'NAT', 880, 86], ['ct', 'Jadual', 880, 122]].forEach((m) => {
      teks(kad, m[2], m[3], m[1], { 'font-size': 16, 'font-weight': 700, fill: W.pudar });
      const mono = m[0] === 'dari' || m[0] === 'ke';
      md[m[0]] = teks(kad, m[2] + 70, m[3], '—', { 'font-size': mono ? 19 : 16.5, 'font-weight': 700, class: mono ? 'mono' : null });
    });

    // sumber
    const senarai = o.tiga ? Object.values(TIGA) : MURID;
    if (!o.tiga) {
      MG.zon({ x: 26, y: 226, width: 340, height: 634, rx: 18, fill: KM.cerah, stroke: KM.warna, 'stroke-width': 2.5 }, lap.dasar);
      el('rect', { x: 44, y: 244, width: 90, height: 28, rx: 14, fill: KM.warna }, lap.dasar);
      teks(lap.dasar, 89, 264, 'VLAN 30', { 'font-size': 16, 'font-weight': 800, fill: '#fff', 'text-anchor': 'middle' });
      teks(lap.dasar, 148, 266, 'Murid', { 'font-size': 24, 'font-weight': 800 });
    }
    senarai.forEach((d, i) => {
      const g = G(lap.dasar);
      if (o.tiga) {
        MG.zon({ x: 26, y: d.y - 92, width: 340, height: 184, rx: 18, fill: d.z.cerah, stroke: d.z.warna, 'stroke-width': 2.5 }, g);
        el('rect', { x: 44, y: d.y - 76, width: 90, height: 28, rx: 14, fill: d.z.warna }, g);
        teks(g, 89, d.y - 56, 'VLAN ' + d.z.vlan, { 'font-size': 16, 'font-weight': 800, fill: '#fff', 'text-anchor': 'middle' });
        teks(g, 148, d.y - 54, d.nama, { 'font-size': 22, 'font-weight': 800 });
      }
      MG.peranti(g, d.jenis, 100, d.y + (o.tiga ? 16 : 0), { warna: d.z.warna, skrin: '#fff' });
      teks(g, 154, d.y + (o.tiga ? 12 : -4), d.ip, { 'font-size': 16, class: 'mono', 'font-weight': 700 });
      teks(g, 154, d.y + (o.tiga ? 34 : 18), o.tiga ? d.z.ssem : d.nama, { 'font-size': 14, fill: W.pudar });
      el('line', { x1: 290, y1: d.y, x2: TRACE_X, y2: d.y, stroke: d.z.warna, 'stroke-width': 4 }, g);
      S.dev.push({ d, g, i });
    });
    const yBawah = Math.max.apply(null, senarai.map((d) => d.y));

    // router
    MG.rak(lap.dasar, 400, 160, 590, 712, 'ROUTER', 'MikroTik SSeM');
    MG.garisan(lap.dasar, [{ x: TRACE_X, y: yBawah }, { x: TRACE_X, y: BAS_Y }, { x: LORONG, y: BAS_Y }, { x: LORONG, y: 800 }], { stroke: '#5E6B6E', 'stroke-width': 4, 'stroke-dasharray': '2 6', 'stroke-linecap': 'round' });
    el('rect', { x: 430, y: P.nat.y, width: 490, height: P.nat.h, rx: 12, fill: '#F4F2EC' }, lap.panel);
    teks(lap.panel, 446, P.nat.y + 28, '1 · SRCNAT — tukar alamat sumber', { 'font-size': 18, 'font-weight': 800 });
    teks(lap.panel, 906, P.nat.y + 28, 'klik untuk mati/hidup', { 'font-size': 13, fill: W.pudar, 'text-anchor': 'end' });
    S.nat.forEach((r, i) => {
      const b = (S.b[r.id] = barisNat(lap.panel, 442, BARIS_NAT(i), 466, r));
      b.g.addEventListener('click', () => { r.hidup = !r.hidup; rupa(); if (o.padaUbah) o.padaUbah(); });
    });
    function rupa() { S.nat.forEach((r) => { const b = S.b[r.id]; b.g.setAttribute('opacity', r.hidup ? 1 : 0.45); b.nama.setAttribute('text-decoration', r.hidup ? 'none' : 'line-through'); }); }
    rupa();
    el('rect', { x: 430, y: P.ct.y, width: 490, height: P.ct.h, rx: 12, fill: '#F4F2EC' }, lap.panel);
    teks(lap.panel, 446, P.ct.y + 28, '2 · CONNECTION TRACKING', { 'font-size': 18, 'font-weight': 800 });
    const tBil = teks(lap.panel, 906, P.ct.y + 28, '', { 'font-size': 14, 'font-weight': 700, fill: W.pudar, 'text-anchor': 'end' });
    [['Dalam (asal)', COL.dalam], ['Luar (selepas NAT)', COL.luar], ['Destinasi', COL.dst]].forEach((c) =>
      teks(lap.panel, c[1], P.ct.y + 62, c[0], { 'font-size': 14, 'font-weight': 800, fill: W.pudar }));
    const tKosong = teks(lap.panel, 446, BARIS_CT(0) + 28, 'Jadual kosong.', { 'font-size': 16, fill: W.pudar });

    // luar
    const zonLuar = (y, h, tajuk, isi, garis) => {
      MG.zon({ x: 1004, y, width: 296, height: h, rx: 18, fill: isi, stroke: garis, 'stroke-width': 2 }, lap.dasar);
      teks(lap.dasar, 1022, y + 28, tajuk, { 'font-size': 16, 'font-weight': 800, fill: garis });
    };
    zonLuar(196, 300, 'Internet · pppoe-unifi', '#E7F3EF', W.benar);
    zonLuar(516, 166, 'MyGovNet · ether13', '#E3EAFB', KUMP.kewangan.gelap);
    zonLuar(698, 162, 'HQ · tunnel wireguard1', '#E6EEF2', '#4B6B8A');
    el('line', { x1: 990, y1: KELUAR.unifi.y, x2: BUS_LUAR, y2: KELUAR.unifi.y, stroke: W.dakwat2, 'stroke-width': 6 }, lap.dasar);
    el('line', { x1: BUS_LUAR, y1: LUAR.laman.y, x2: BUS_LUAR, y2: LUAR.opendns.y, stroke: W.dakwat2, 'stroke-width': 4 }, lap.dasar);
    MG.label(lap.dasar, 1196, 484, 'IP WAN (tidak dipaparkan)', { fs: 13.5 });
    el('line', { x1: 990, y1: KELUAR.mygovnet.y, x2: 1050, y2: KELUAR.mygovnet.y, stroke: W.dakwat2, 'stroke-width': 6 }, lap.dasar);
    el('line', { x1: 990, y1: KELUAR.wg.y, x2: 1050, y2: KELUAR.wg.y, stroke: '#4B6B8A', 'stroke-width': 10, 'stroke-linecap': 'round' }, lap.dasar);
    const kotakLuar = {};
    Object.keys(LUAR).forEach((k) => {
      const v = LUAR[k];
      if (v.keluar === 'unifi') el('line', { x1: BUS_LUAR, y1: v.y, x2: 1052, y2: v.y, stroke: W.dakwat2, 'stroke-width': 4 }, lap.dasar);
      kotakLuar[k] = el('rect', { x: 1040, y: v.y - 46, width: 252, height: 92, rx: 12, fill: 'none', stroke: 'none', 'stroke-width': 3 }, lap.dasar);
      MG.peranti(lap.dasar, 'pelayan', 1082, v.y - 2, { skrin: '#fff' });
      teks(lap.dasar, 1124, v.y - 6, v.nama, { 'font-size': 18, 'font-weight': 800 });
      teks(lap.dasar, 1124, v.y + 16, `${v.sub} :${v.port}`, { 'font-size': 13.5, class: 'mono', fill: W.dakwat2 });
    });

    /* jadual connection tracking */
    function lukisCt() {
      MG.kosong(lap.ct);
      tKosong.setAttribute('visibility', S.ct.length ? 'hidden' : 'visible');
      tBil.textContent = S.ct.length ? `${S.ct.length} connection · ${new Set(S.ct.map((c) => c.luarIp)).size} alamat luar` : '';
      S.ct.forEach((c, i) => {
        const y = BARIS_CT(i);
        const g = G(lap.ct, { class: o.klikCt ? 'boleh-klik' : null });
        c.kotak = el('rect', { x: 442, y, width: 466, height: 46, rx: 8, fill: '#fff', stroke: W.garis2, 'stroke-width': 2, class: o.klikCt ? 'sorot' : null }, g);
        el('rect', { x: 442, y, width: 6, height: 46, rx: 3, fill: c.d.z.warna }, g);
        teks(g, COL.dalam, y + 29, `${c.d.ip}:${c.d.port}`, { 'font-size': 13.5, class: 'mono', 'font-weight': 700 });
        c.tLuar = teks(g, COL.luar, y + 29, `${c.luarIp}:${c.luarPort}`, { 'font-size': 13.5, class: 'mono', 'font-weight': 700, fill: c.tiadaNat ? W.sekat : W.aksen });
        teks(g, COL.dst, y + 29, `${LUAR[c.d.ke].sub}:${LUAR[c.d.ke].port}`, { 'font-size': 13, class: 'mono', fill: W.dakwat2 });
        if (c.tukarPort) teks(g, COL.luar, y + 43, 'port ditukar', { 'font-size': 11.5, 'font-weight': 800, fill: W.aksen });
        if (o.klikCt) g.addEventListener('click', () => o.klikCt(c));
      });
    }
    S.lukisCt = lukisCt;

    S.bersih = () => {
      MG.kosong(lap.paket); MG.kosong(lap.label);
      Object.values(S.b).forEach((b) => { b.sebab.textContent = ''; sorot(b.kotak); });
      S.ct.forEach((c) => c.kotak && sorot(c.kotak));
      Object.values(kotakLuar).forEach((k) => k.setAttribute('stroke', 'none'));
    };
    S.pulih = () => { S.nat.forEach((r) => (r.hidup = true)); rupa(); };
    S.kosongCt = () => { S.ct = []; lukisCt(); };
    S.tunjukDev = (n) => S.dev.forEach((x) => x.g.setAttribute('opacity', x.i < n ? 1 : 0.18));

    // masukkan entry tanpa animasi (keadaan awal langkah)
    S.isiCt = (senaraiD) => { senaraiD.forEach((d) => S.ct.push(petaNat(d, true))); lukisCt(); };
    function petaNat(d, paksaHidup) {
      const k = KELUAR[LUAR[d.ke].keluar];
      const r = S.nat.find((x) => x.id === k.rule);
      if (!paksaHidup && !r.hidup) return { d, luarIp: d.ip, luarPort: d.port, tiadaNat: true };
      let port = d.port, tukar = false;
      while (S.ct.some((c) => c.luarIp === k.sumber && c.luarPort === port && c.d.ke === d.ke)) { port++; tukar = true; }
      return { d, luarIp: k.sumber, luarPort: port, tukarPort: tukar };
    }

    const jalanMasuk = (d) => [{ x: 290, y: d.y }, { x: TRACE_X, y: d.y }, { x: TRACE_X, y: BAS_Y }, { x: LORONG, y: BAS_Y }];
    const keLuar = (ke) => {
      const v = LUAR[ke], k = KELUAR[v.keluar];
      return v.keluar === 'unifi' ? [{ x: LORONG, y: k.y }, { x: BUS_LUAR, y: k.y }, { x: BUS_LUAR, y: v.y }, { x: 1050, y: v.y }] : [{ x: LORONG, y: k.y }, { x: 1050, y: v.y }];
    };

    /* Peranti membuka connection baharu: srcnat menukar sumber, entry ditambah, server membalas. */
    S.hantar = async (s, d, o2) => {
      o2 = o2 || {};
      const laju = o2.cepat ? 1.6 : 1;
      const v = LUAR[d.ke], k = KELUAR[v.keluar];
      S.ct = S.ct.filter((c) => c.d !== d); lukisCt(); // connection lama peranti ini digantikan
      md.dari.textContent = `${d.ip}:${d.port}`; md.dari.setAttribute('fill', W.dakwat);
      md.ke.textContent = `${v.sub}:${v.port}`; md.nat.textContent = '…'; md.ct.textContent = '—';
      const env = MG.sampul(lap.paket, { warna: d.z.warna, label: `${d.ip}:${d.port}`, saiz: 1.05, saizLabel: 15 });
      await MG.gerak(s, env, jalanMasuk(d), { laju: 700 * laju });
      // srcnat (postrouting): rule ikut interface keluar
      let entry = null;
      for (const r of S.nat) {
        const b = S.b[r.id];
        await MG.gerak(s, env, [{ x: LORONG, y: env.y }, { x: LORONG, y: b.cy }], { laju: 560 * laju, ease: MG.ease.io });
        sorot(b.kotak, W.dakwat, 3);
        await s.tunggu(200 / laju);
        let sebab = null;
        if (!r.hidup) sebab = 'dimatikan';
        else if (r.id !== k.rule) sebab = '✗ interface lain';
        if (sebab) { b.sebab.textContent = sebab; b.sebab.setAttribute('fill', W.pudar); await s.tunggu(220 / laju); sorot(b.kotak); continue; }
        b.sebab.textContent = '✓ masquerade'; b.sebab.setAttribute('fill', W.aksen); sorot(b.kotak, W.aksen, 4);
        entry = petaNat(d);
        env.setLabel(`${entry.luarIp}:${entry.luarPort}`);
        md.dari.textContent = `${entry.luarIp}:${entry.luarPort}`; md.dari.setAttribute('fill', W.aksen);
        md.nat.textContent = `sumber → ${entry.luarIp}` + (entry.tukarPort ? ' · port ditukar' : '');
        await MG.denyut(s, lap.label, LORONG, b.cy, W.aksen, 40); if (!s.hidup) throw MG.BATAL;
        break;
      }
      if (!entry) {
        entry = petaNat(d);
        md.nat.textContent = 'tiada — sumber kekal private'; md.nat.setAttribute('fill', W.sekat);
      } else md.nat.setAttribute('fill', W.dakwat);
      // entry connection tracking
      S.ct.push(entry); lukisCt();
      const c = S.ct[S.ct.length - 1];
      sorot(c.kotak, W.aksen, 3);
      md.ct.textContent = `entry ${S.ct.length} dicatat`;
      await s.tunggu(450 / laju);
      await MG.gerak(s, env, [{ x: LORONG, y: env.y }].concat(keLuar(d.ke)), { laju: 640 * laju });
      if (entry.tiadaNat) {
        await MG.cop(s, lap.label, 1170, LUAR[d.ke].y - 60, 'TIADA BALASAN', 'sekat');
        if (o.padaHasil) o.padaHasil(d, false, `Alamat private <b>${d.ip}</b> tidak dikenali di Internet. Balasan tidak tahu jalan pulang.`);
        return false;
      }
      kotakLuar[d.ke].setAttribute('stroke', W.benar);
      env.remove();
      if (o2.tanpaBalas) return true;
      return S.balas(s, c, o2);
    };

    /* Balasan dari luar: dipadankan dengan entry, alamat destinasi dipulihkan, dihantar kepada peranti asal. */
    S.balas = async (s, c, o2) => {
      o2 = o2 || {};
      const laju = o2.cepat ? 1.6 : 1;
      S.ct.forEach((x) => sorot(x.kotak));
      const d = c.d, v = LUAR[d.ke];
      md.dari.textContent = `${v.sub}:${v.port}`; md.dari.setAttribute('fill', W.dakwat);
      md.ke.textContent = `${c.luarIp}:${c.luarPort}`; md.ke.setAttribute('fill', W.aksen);
      md.nat.textContent = 'balasan · semak jadual';
      const env = MG.sampul(lap.paket, { warna: W.dakwat2, label: `→ ${c.luarIp}:${c.luarPort}`, saiz: 1.05, saizLabel: 15 });
      await MG.gerak(s, env, keLuar(d.ke).reverse(), { laju: 700 * laju });
      const i = S.ct.indexOf(c), yc = BARIS_CT(i) + 23;
      await MG.gerak(s, env, [{ x: LORONG, y: env.y }, { x: LORONG, y: yc }], { laju: 560 * laju, ease: MG.ease.io });
      sorot(c.kotak, W.benar, 4);
      md.ct.textContent = `padan entry ${i + 1}`;
      await s.tunggu(500 / laju);
      env.setLabel(`→ ${d.ip}:${d.port}`);
      md.ke.textContent = `${d.ip}:${d.port}`; md.ke.setAttribute('fill', W.benar);
      md.nat.textContent = `${c.luarIp} → ${d.ip}`;
      await MG.denyut(s, lap.label, LORONG, yc, W.benar, 40); if (!s.hidup) throw MG.BATAL;
      await MG.gerak(s, env, [{ x: LORONG, y: yc }, { x: LORONG, y: BAS_Y }, { x: TRACE_X, y: BAS_Y }, { x: TRACE_X, y: d.y }, { x: 290, y: d.y }], { laju: 760 * laju });
      env.remove();
      await MG.denyut(s, lap.label, 100, d.y, d.z.warna, 50); if (!s.hidup) throw MG.BATAL;
      if (o.padaHasil) o.padaHasil(d, true, `Padan entry ${i + 1}. Destinasi ditukar kembali kepada <b>${d.ip}</b>.`);
      return true;
    };

    /* Packet baharu dari Internet tanpa entry: tiada padanan → ke router sendiri → chain input menolaknya. */
    S.luarBaharu = async (s) => {
      S.ct.forEach((x) => sorot(x.kotak));
      md.dari.textContent = 'alamat tidak dikenali'; md.dari.setAttribute('fill', W.dakwat);
      md.ke.textContent = 'IP WAN:50200'; md.ke.setAttribute('fill', W.dakwat);
      md.nat.textContent = 'connection baharu dari luar'; md.ct.textContent = 'semak…';
      const env = MG.sampul(lap.paket, { warna: W.sekat, label: '→ IP WAN:50200', saiz: 1.05, saizLabel: 15 });
      await MG.gerak(s, env, [{ x: 1200, y: 236 }, { x: BUS_LUAR, y: 236 }, { x: BUS_LUAR, y: KELUAR.unifi.y }, { x: LORONG, y: KELUAR.unifi.y }], { laju: 640 });
      for (let i = 0; i < S.ct.length; i++) {
        const c = S.ct[i];
        await MG.gerak(s, env, [{ x: LORONG, y: env.y }, { x: LORONG, y: BARIS_CT(i) + 23 }], { laju: 700, ease: MG.ease.io });
        sorot(c.kotak, W.sekat, 3);
        await s.tunggu(180);
        sorot(c.kotak);
      }
      md.ct.textContent = 'tiada entry padan';
      await MG.cop(s, lap.label, LORONG - 120, Math.min(820, BARIS_CT(S.ct.length) + 10), 'DROP', 'sekat');
      if (o.padaHasil) o.padaHasil(null, false, 'Tiada entry padan. Chain input router menolaknya: <b>Drop ALL other traffic to Router</b>.');
    };
    S.md = md;
    lukisCt();
    return S;
  }

  const RSC = {
    kod: [
      '/ip firewall nat\nadd action=<mark>masquerade</mark> chain=srcnat comment="NAT Unifi" <mark>out-interface=\\\n    pppoe-unifi</mark>',
      'add action=masquerade chain=srcnat comment="NAT MyGovNet" out-interface=\\\n    ether13-GITN-MyGovNet\nadd action=masquerade chain=srcnat comment="Masquerade to HQ WireGuard" \\\n    out-interface=wireguard1',
    ],
    fungsi: 'Masquerade menukar alamat sumber kepada alamat interface keluar. Connection tracking mengingati setiap pertukaran supaya balasan dipulangkan kepada peranti asal. (Petikan sebenar SSeM; IP WAN tidak dipaparkan.)',
  };

  function papanCb(papan) {
    return {
      padaHasil: (d, ok, ket) => papan.set(d ? d.nama : 'Dari Internet', ok ? 'SAMPAI' : d ? 'GAGAL' : 'DROP', ket, ok ? 'benar' : 'sekat'),
    };
  }

  const L1 = {
    tajuk: 'Alamat private tidak dikenali di Internet',
    teks: 'Murid menggunakan alamat <b>192.168.32.x</b>, iaitu alamat <b>private</b>. Alamat ini tidak boleh digunakan di Internet. Rule <b>NAT Unifi</b> menukar alamat sumber kepada <b>IP WAN</b> sekolah sebelum packet keluar. Klik rule NAT Unifi untuk mematikannya dan lihat apa yang berlaku.',
    rsc: RSC,
    bina(ctx) {
      const papan = ctx.papan({ mula: ['NAT', '—', 'Tekan Hantar.'] });
      const cb = papanCb(papan);
      const S = binaNat(ctx, cb);
      S.tunjukDev(1);
      const hantar = () => { S.kosongCt(); S.bersih(); papan.set('Murid 1', '…', 'Packet sedang bergerak.'); return ctx.jalan((s) => S.hantar(s, MURID[0])); };
      cb.padaUbah = hantar;
      const k = ctx.kumpulan();
      ctx.butang('▶ Hantar packet', hantar, { utama: true, dalam: k });
      ctx.butang('↺ Pulihkan tetapan SSeM', () => { S.pulih(); hantar(); }, { dalam: k });
      ctx.nota('Alamat private: 10.x, 172.16–31.x dan 192.168.x. Semua VLAN sekolah menggunakan julat ini.');
      hantar();
    },
  };

  const L2 = {
    tajuk: 'Banyak peranti, satu IP WAN',
    teks: 'Setiap peranti membuka connection sendiri. Semuanya keluar dengan <b>IP WAN yang sama</b>. Router mencatat setiap pertukaran dalam jadual <b>connection tracking</b>. Murid 2 menggunakan port yang sama dengan Murid 1, jadi router memberinya <b>port lain</b>.',
    rsc: RSC,
    bina(ctx) {
      const papan = ctx.papan({ mula: ['NAT', '—', 'Tambah peranti.'] });
      const cb = papanCb(papan);
      const S = binaNat(ctx, cb);
      let n = 2;
      const kemas = () => { S.tunjukDev(n); btnTambah.disabled = n >= MURID.length; };
      const semua = () => ctx.jalan(async (s) => {
        S.kosongCt(); S.bersih();
        for (let i = 0; i < n; i++) { S.bersih(); papan.set(MURID[i].nama, '…', 'Membuka connection.'); await S.hantar(s, MURID[i], { cepat: true, tanpaBalas: true }); }
        papan.set(`${n} peranti`, '1 IP WAN', `${n} connection dicatat. Semua berkongsi satu alamat luar; <b>port</b> membezakan setiap connection.`, 'benar');
      });
      const k = ctx.kumpulan('Peranti Murid');
      const btnTambah = ctx.butang('+ Tambah peranti', () => { if (n < MURID.length) { n++; kemas(); semua(); } }, { dalam: k, warna: KM.warna });
      ctx.butang('− Kurang', () => { if (n > 1) { n--; kemas(); semua(); } }, { dalam: k });
      ctx.butang('▶ Hantar semua', semua, { utama: true, kumpulan: null });
      ctx.nota('Masquerade mengekalkan port asal jika boleh. Jika port itu sudah digunakan untuk destinasi yang sama, router memilih port lain. Nombor port di sini ialah ilustrasi.');
      kemas(); semua();
    },
  };

  const L3 = {
    tajuk: 'Balasan dipadankan',
    teks: 'Balasan dari Internet ditujukan kepada <b>IP WAN</b>, bukan kepada laptop. Router mencari entry yang padan dalam jadual, menukar destinasi kembali kepada alamat <b>private</b> asal, lalu menghantarnya kepada peranti yang betul. <b>Klik satu baris</b> dalam jadual untuk menghantar balasannya.',
    rsc: RSC,
    bina(ctx) {
      const papan = ctx.papan({ mula: ['Balasan', '—', 'Klik satu baris jadual.'] });
      const cb = papanCb(papan);
      let S;
      cb.klikCt = (c) => { S.bersih(); papan.set(c.d.nama, '…', 'Balasan sedang kembali.'); ctx.jalan((s) => S.balas(s, c)); };
      S = binaNat(ctx, Object.assign(cb, { klikCt: cb.klikCt }));
      S.tunjukDev(4);
      S.isiCt(MURID);
      const k = ctx.kumpulan('Hantar balasan untuk');
      S.ct.forEach((c) => ctx.butang(`${c.luarIp}:${c.luarPort}`, () => cb.klikCt(c), { dalam: k, warna: KM.warna }));
      ctx.butang('▶ Balasan kepada Murid 2', () => cb.klikCt(S.ct[1]), { utama: true });
      cb.klikCt(S.ct[1]);
    },
  };

  const L4 = {
    tajuk: 'Connection baharu dari luar',
    teks: 'NAT hanya membuka jalan untuk <b>balasan</b> kepada connection yang dimulakan dari dalam. Packet baharu dari Internet tidak padan dengan mana-mana entry. Ia tidak dihantar ke laptop mana pun. Packet ini ditujukan kepada router sendiri, dan chain input menolaknya.',
    rsc: {
      kod: ['/ip firewall filter\nadd action=drop chain=<mark>input</mark> comment=\\\n    <mark>"Drop ALL other traffic to Router (Security Check)"</mark>'],
      fungsi: 'Rule terakhir chain input. Trafik ke router yang tidak dibenarkan oleh rule di atasnya akan dibuang. (Petikan sebenar SSeM.)',
    },
    bina(ctx) {
      const papan = ctx.papan({ mula: ['Dari luar', '—', 'Pilih packet.'] });
      const cb = papanCb(papan);
      const S = binaNat(ctx, cb);
      S.tunjukDev(4);
      S.isiCt(MURID.slice(0, 3));
      const luar = () => { S.bersih(); papan.set('Dari Internet', '…', 'Mencari entry yang padan.'); return ctx.jalan((s) => S.luarBaharu(s)); };
      const k = ctx.kumpulan('Packet dari Internet');
      ctx.butang('Connection baharu (tiada entry)', luar, { dalam: k, warna: W.sekat });
      ctx.butang('Balasan sah (ada entry)', () => { S.bersih(); ctx.jalan((s) => S.balas(s, S.ct[0])); }, { dalam: k, warna: W.benar });
      ctx.nota('SSeM tiada rule dstnat untuk membuka port ke dalam. Satu-satunya dstnat ialah Force OpenDNS (Bab 4).');
      luar();
    },
  };

  const L5 = {
    tajuk: 'Tiga talian, tiga srcnat',
    teks: 'SSeM ada tiga jalan keluar. Setiap jalan ada rule masquerade sendiri. Alamat sumber baharu bergantung pada <b>interface keluar</b>: IP WAN Unifi, IP ether13 MyGovNet, atau <b>10.255.0.5</b> untuk tunnel HQ.',
    rsc: RSC,
    bina(ctx) {
      const papan = ctx.papan({ mula: ['Srcnat', '—', 'Pilih sumber.'] });
      const cb = papanCb(papan);
      const S = binaNat(ctx, Object.assign(cb, { tiga: true }));
      let src = 'kewangan';
      const hantar = () => { S.bersih(); papan.set(TIGA[src].nama, '…', 'Packet sedang bergerak.'); return ctx.jalan((s) => S.hantar(s, TIGA[src])); };
      cb.padaUbah = hantar;
      ctx.segmen('Sumber → destinasi', [{ v: 'murid', t: 'Murid → laman' }, { v: 'kewangan', t: 'Kewangan → 10.x' }, { v: 'staf', t: 'Staf → HQ' }], src, (v) => { src = v; hantar(); });
      const k = ctx.kumpulan();
      ctx.butang('▶ Hantar packet', hantar, { utama: true, dalam: k });
      ctx.butang('↺ Pulihkan tetapan SSeM', () => { S.pulih(); hantar(); }, { dalam: k });
      ctx.nota('Jalan keluar dipilih oleh routing (Bab 6). NAT berlaku <b>selepas</b> routing dan firewall, sejurus sebelum packet keluar.');
      hantar();
    },
  };

  MG.daftarBab({
    id: 'nat', no: 7, tajuk: 'NAT', sub: 'banyak IP dalaman, satu IP WAN', status: 'siap',
    ringkas: 'Banyak IP dalaman, satu IP WAN. Connection tracking memadankan balasan.',
    langkah: [L1, L2, L3, L4, L5],
    ikonMenu(s) {
      [0, 1, 2].forEach((i) => el('rect', { x: 40, y: 22 + i * 26, width: 70, height: 18, rx: 5, fill: '#E9E1FD', stroke: '#8B5CF6', 'stroke-width': 2 }, s));
      [0, 1, 2].forEach((i) => el('path', { d: `M112 ${31 + i * 26} L170 57`, stroke: '#3B4648', 'stroke-width': 3 }, s));
      el('rect', { x: 170, y: 46, width: 90, height: 22, rx: 6, fill: '#B4462E' }, s);
    },
  });
})();
