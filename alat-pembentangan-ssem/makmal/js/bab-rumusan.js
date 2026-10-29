/* Bab 10 — Rumusan: perjalanan satu laptop Murid melalui semua stesen, dari WiFi hingga Unifi.
   Susunan stesen dalam router ikut aliran packet RouterOS: mangle/routing → firewall forward → srcnat → queue.
   Semua nilai dari eksport SSeM 22 Okt; SSID dari dokumen WAC projek. Setiap stesen merujuk bab berkaitan. */
(function () {
  'use strict';
  const { el, teks, W, KUMP } = MG;
  const G = MG.g;
  const KM = KUMP.murid;

  const LORONG = 962, BAS_Y = 222, TRACE_X = 466, BUS_LUAR = 1046;
  const LAPTOP = { x: 110, y: 290 }, AP = { x: 110, y: 452 }, TRUNK_Y = 596;
  const KAD = (i) => 236 + i * 90; // stesen 3..9 dalam router
  const KELUAR_Y = KAD(6) + 42;
  const SV = { opendns: { x: 1110, y: 290, nama: 'OpenDNS', sub: '208.67.222.222' }, laman: { x: 1110, y: 560, nama: 'Laman web', sub: 'www.moe.gov.my' } };
  const DEST = {
    internet: { t: 'Laman Internet', ke: 'www.moe.gov.my' },
    mygovnet: { t: 'MyGovNet 10.x', ke: 'sistem MyGovNet (10.x)' },
    staf: { t: 'PC Staf', ke: '172.16.22.20 (PC Staf)' },
  };
  const STESEN = [
    { k: 'dhcp', no: 3, nama: 'DHCP', bab: 'dhcp', noBab: 2, cfg: 'pool-vlan30 · lease-time=1d' },
    { k: 'hs', no: 4, nama: 'HotSpot', bab: 'hotspot', noBab: 3, cfg: 'hotspot-vlan30 · wifi.student.lan' },
    { k: 'dns', no: 5, nama: 'DNS', bab: 'dns', noBab: 4, cfg: 'dns-server=208.67.222.222 · Force OpenDNS' },
    { k: 'rt', no: 6, nama: 'Mangle + routing', bab: 'laluan', noBab: 6, cfg: '"VLAN 30 -> Unifi" disabled=yes' },
    { k: 'fw', no: 7, nama: 'Firewall forward', bab: 'firewall', noBab: 5, cfg: 'rule pertama yang padan' },
    { k: 'nat', no: 8, nama: 'NAT srcnat', bab: 'nat', noBab: 7, cfg: '"NAT Unifi" masquerade · pppoe-unifi' },
    { k: 'q', no: 9, nama: 'Queue', bab: 'kapasiti', noBab: 8, cfg: '"Limit VLAN 30 Student (50M per-user)"' },
  ];

  // Cip "Bab N ›": membuka bab berkaitan
  function cipBab(induk, x, y, noBab, id) {
    const g = G(induk, { class: 'boleh-klik' });
    el('rect', { x, y, width: 74, height: 24, rx: 12, fill: W.kertas2, stroke: W.garis2, 'stroke-width': 1.5, class: 'sorot' }, g);
    teks(g, x + 37, y + 17, `Bab ${noBab} ›`, { 'font-size': 13.5, 'font-weight': 800, 'text-anchor': 'middle', fill: W.dakwat2 });
    g.addEventListener('click', () => MG.bukaBab(id));
    return g;
  }

  function kadStesen(induk, x, y, w, h, st) {
    const g = G(induk);
    const kotak = el('rect', { x, y, width: w, height: h, rx: 10, fill: '#F4F2EC', stroke: '#8E897D', 'stroke-width': 2 }, g);
    teks(g, x + 14, y + 25, `${st.no} · ${st.nama}`, { 'font-size': 17, 'font-weight': 800 });
    teks(g, x + 14, y + 49, st.cfg, { 'font-size': 13, class: 'mono', fill: W.dakwat2 });
    const hasil = teks(g, x + 14, y + h - 12, '', { 'font-size': 15, 'font-weight': 800 });
    cipBab(g, x + w - 84, y + 8, st.noBab, st.bab);
    return { kotak, hasil, cy: y + h / 2 };
  }

  function binaRumusan(ctx, o) {
    o = o || {};
    const lap = {};
    ['dasar', 'stesen', 'label', 'paket'].forEach((n) => (lap[n] = ctx.lapisan(n)));
    const st = {};

    // kad packet
    const kad = G(lap.dasar);
    el('rect', { x: 400, y: 20, width: 900, height: 124, rx: 16, fill: W.kad, stroke: W.garis, 'stroke-width': 2 }, kad);
    teks(kad, 422, 50, 'PACKET', { 'font-size': 16, 'font-weight': 800, fill: W.pudar, 'letter-spacing': 0.8 });
    const md = {};
    [['dari', 'Dari', 422, 86], ['ke', 'Ke', 422, 122], ['tag', 'Tanda', 880, 86], ['st', 'Stesen', 880, 122]].forEach((m) => {
      teks(kad, m[2], m[3], m[1], { 'font-size': 16, 'font-weight': 700, fill: W.pudar });
      md[m[0]] = teks(kad, m[2] + 70, m[3], '—', { 'font-size': 18, 'font-weight': 700 });
    });

    // laptop, AP, switch (di luar router)
    MG.peranti(lap.dasar, 'laptop', LAPTOP.x, LAPTOP.y, { warna: KM.warna, skrin: '#fff' });
    teks(lap.dasar, 172, LAPTOP.y - 8, 'Laptop Murid', { 'font-size': 20, 'font-weight': 800 });
    const tIp = teks(lap.dasar, 172, LAPTOP.y + 18, '', { 'font-size': 16, class: 'mono', 'font-weight': 700 });
    el('line', { x1: LAPTOP.x, y1: LAPTOP.y + 36, x2: AP.x, y2: AP.y - 26, stroke: KM.warna, 'stroke-width': 3, 'stroke-dasharray': '3 7', 'stroke-linecap': 'round' }, lap.dasar);
    el('line', { x1: AP.x, y1: AP.y + 16, x2: AP.x, y2: 562, stroke: KM.warna, 'stroke-width': 5 }, lap.dasar);
    MG.peranti(lap.dasar, 'ap', AP.x, AP.y, { warna: KM.warna });
    MG.rak(lap.dasar, 30, 562, 372, 70, 'SWITCH', null);
    el('line', { x1: 402, y1: TRUNK_Y, x2: 450, y2: TRUNK_Y, stroke: W.dakwat2, 'stroke-width': 7 }, lap.dasar);
    // stesen 1 & 2
    const kadLuar = (x, y, w, h, no, nama, cfg, noBab, id) => {
      const g = G(lap.stesen);
      const kotak = el('rect', { x, y, width: w, height: h, rx: 10, fill: '#F4F2EC', stroke: '#8E897D', 'stroke-width': 2 }, g);
      teks(g, x + 14, y + 25, `${no} · ${nama}`, { 'font-size': 17, 'font-weight': 800 });
      cfg.forEach((c, i) => teks(g, x + 14, y + 49 + i * 21, c, { 'font-size': 13.5, class: i === 0 ? 'mono' : null, fill: W.dakwat2 }));
      cipBab(g, x + w - 84, y + 8, noBab, id);
      return { kotak, cy: y + h / 2, hasil: { textContent: '' } };
    };
    st.wifi = kadLuar(176, 400, 262, 104, 1, 'WiFi', ['Student@SSM-KUCHING', 'SSID dipadankan dengan VLAN 30'], 1, 'vlan');
    st.trunk = kadLuar(30, 654, 408, 104, 2, 'Trunk ke router', ['ether16-TRUNK · tag 30', 'Frame bertag sejak keluar dari AP.'], 1, 'vlan');
    teks(lap.dasar, 34, 790, 'SSID daripada dokumen WAC projek; nilai lain daripada RSC.', { 'font-size': 13.5, fill: W.pudar });

    // router + stesen 3..9
    MG.rak(lap.dasar, 450, 160, 552, 712, 'ROUTER', 'MikroTik SSeM');
    MG.garisan(lap.dasar, [{ x: TRACE_X, y: TRUNK_Y }, { x: TRACE_X, y: BAS_Y }, { x: LORONG, y: BAS_Y }, { x: LORONG, y: KELUAR_Y }], { stroke: '#5E6B6E', 'stroke-width': 4, 'stroke-dasharray': '2 6', 'stroke-linecap': 'round' });
    STESEN.forEach((s, i) => (st[s.k] = kadStesen(lap.stesen, 480, KAD(i), 450, 84, s)));

    // stesen 10: Unifi + Internet
    MG.zon({ x: 1022, y: 196, width: 278, height: 664, rx: 18, fill: '#E7F3EF', stroke: W.benar, 'stroke-width': 2 }, lap.dasar);
    teks(lap.dasar, 1040, 224, 'Internet', { 'font-size': 18, 'font-weight': 800, fill: W.benar });
    el('line', { x1: LORONG, y1: KELUAR_Y, x2: BUS_LUAR, y2: KELUAR_Y, stroke: W.dakwat2, 'stroke-width': 6 }, lap.dasar);
    el('line', { x1: BUS_LUAR, y1: KELUAR_Y, x2: BUS_LUAR, y2: SV.opendns.y, stroke: W.dakwat2, 'stroke-width': 4 }, lap.dasar);
    Object.values(SV).forEach((v) => {
      el('line', { x1: BUS_LUAR, y1: v.y, x2: v.x - 28, y2: v.y, stroke: W.dakwat2, 'stroke-width': 4 }, lap.dasar);
      MG.peranti(lap.dasar, 'pelayan', v.x, v.y - 2, { skrin: '#fff' });
      teks(lap.dasar, v.x + 42, v.y - 6, v.nama, { 'font-size': 17, 'font-weight': 800 });
      teks(lap.dasar, v.x + 42, v.y + 15, v.sub, { 'font-size': 12.5, class: 'mono', fill: W.dakwat2 });
    });
    const gU = G(lap.stesen);
    const kotakU = el('rect', { x: 1062, y: KELUAR_Y - 64, width: 226, height: 96, rx: 10, fill: '#fff', stroke: '#8E897D', 'stroke-width': 2 }, gU);
    teks(gU, 1076, KELUAR_Y - 38, '10 · Unifi', { 'font-size': 17, 'font-weight': 800 });
    teks(gU, 1076, KELUAR_Y - 16, 'pppoe-unifi', { 'font-size': 13, class: 'mono', fill: W.dakwat2 });
    cipBab(gU, 1076, KELUAR_Y - 4, 6, 'laluan');
    st.unifi = { kotak: kotakU, cy: KELUAR_Y, hasil: { textContent: '' } };
    teks(lap.dasar, 1040, 246, 'soalan DNS diringkaskan', { 'font-size': 13, fill: W.pudar });

    function sorot(k, w) {
      Object.keys(st).forEach((x) => { st[x].kotak.setAttribute('stroke', x === k ? (w || W.dakwat) : '#8E897D'); st[x].kotak.setAttribute('stroke-width', x === k ? 4 : 2); });
    }
    const hasil = (k, t, w) => { st[k].hasil.textContent = t; if (st[k].hasil.setAttribute) st[k].hasil.setAttribute('fill', w || W.dakwat2); };
    const S = {};
    S.bersih = () => {
      MG.kosong(lap.paket); MG.kosong(lap.label); sorot(null);
      STESEN.forEach((s) => hasil(s.k, ''));
      tIp.textContent = 'belum ada IP'; tIp.setAttribute('fill', W.pudar);
      Object.values(md).forEach((t) => { t.textContent = '—'; t.setAttribute('fill', W.dakwat); });
    };
    const keLorong = (s, env, y) => MG.gerak(s, env, [{ x: env.x, y: env.y }, { x: LORONG, y }], { laju: 560, ease: MG.ease.io });
    async function henti(s, k, y, tajuk, nilai, ket) {
      sorot(k, W.sekat);
      await MG.cop(s, lap.label, LORONG - 90, y - 40, tajuk, 'sekat');
      if (o.padaHasil) o.padaHasil(nilai, ket, 'sekat');
    }

    S.jalan = async (s, login, dest) => {
      S.bersih();
      const D = DEST[dest];
      if (o.padaMula) o.padaMula();
      md.dari.textContent = 'Laptop Murid'; md.ke.textContent = D.ke; md.st.textContent = '1 · WiFi';
      const env = MG.sampul(lap.paket, { warna: KM.warna, saiz: 1.1, label: 'Murid', saizLabel: 15 });
      // 1 WiFi → AP
      sorot('wifi');
      await MG.gerak(s, env, [{ x: LAPTOP.x, y: LAPTOP.y + 36 }, { x: AP.x, y: AP.y - 20 }], { laju: 360 });
      await s.tunggu(500);
      // 2 trunk: frame keluar dari AP sudah bertag 30 (WAC padankan SSID → VLAN); tag dipapar pada kabel sahaja
      sorot('trunk'); md.st.textContent = '2 · Trunk';
      md.tag.textContent = 'tag VLAN 30'; md.tag.setAttribute('fill', KM.gelap);
      await MG.gerak(s, env, [{ x: AP.x, y: AP.y }, { x: AP.x, y: TRUNK_Y, tag: 30, warnaTag: KM.warna }, { x: 402, y: TRUNK_Y }], { laju: 520 });
      await MG.gerak(s, env, [{ x: 402, y: TRUNK_Y }, { x: TRACE_X, y: TRUNK_Y, tag: 30, warnaTag: KM.warna }], { laju: 260 });
      md.tag.textContent = '— (tag dibuang pada router)'; md.tag.setAttribute('fill', W.pudar);
      await MG.gerak(s, env, [{ x: TRACE_X, y: TRUNK_Y }, { x: TRACE_X, y: BAS_Y }, { x: LORONG, y: BAS_Y }], { laju: 680 });
      // 3 DHCP
      await keLorong(s, env, st.dhcp.cy); sorot('dhcp'); md.st.textContent = '3 · DHCP';
      hasil('dhcp', '192.168.32.57 · gw .1 · DNS OpenDNS', W.benar);
      tIp.textContent = '192.168.32.57'; tIp.setAttribute('fill', W.dakwat);
      md.dari.textContent = '192.168.32.57 (Murid)';
      env.setLabel('192.168.32.57');
      await s.tunggu(800);
      // 4 HotSpot
      await keLorong(s, env, st.hs.cy); sorot('hs'); md.st.textContent = '4 · HotSpot';
      await s.tunggu(400);
      if (!login) {
        hasil('hs', '✗ belum login → halaman login', W.sekat);
        return henti(s, 'hs', st.hs.cy, 'HALAMAN LOGIN', 'Belum login', 'Belum login: HotSpot menghantar <b>halaman login</b>. Packet tidak sampai ke stesen seterusnya.');
      }
      hasil('hs', '✓ ada dalam senarai Active', W.benar);
      await s.tunggu(600);
      // 5 DNS (soalan berasingan, diringkaskan)
      await keLorong(s, env, st.dns.cy); sorot('dns'); md.st.textContent = '5 · DNS';
      if (dest === 'internet') {
        const q = MG.sampul(lap.paket, { warna: W.dakwat2, label: 'DNS?', saiz: 0.9 });
        const ke = [{ x: LORONG, y: st.dns.cy }, { x: BUS_LUAR, y: st.dns.cy }, { x: BUS_LUAR, y: SV.opendns.y }, { x: SV.opendns.x - 32, y: SV.opendns.y }];
        await MG.gerak(s, q, ke, { laju: 760 });
        q.setLabel('alamat IP');
        await MG.gerak(s, q, ke.slice().reverse(), { laju: 760 });
        q.remove();
        hasil('dns', 'www.moe.gov.my → alamat IP (OpenDNS)', W.benar);
      } else hasil('dns', 'tidak perlu: alamat IP sudah diketahui', W.pudar);
      await s.tunggu(600);
      // 6 mangle + routing
      await keLorong(s, env, st.rt.cy); sorot('rt'); md.st.textContent = '6 · Mangle + routing';
      const rt = { internet: 'tiada pelekat → main → pppoe-unifi', mygovnet: 'main: 10.0.0.0/8 → ether13 (MyGovNet)', staf: 'main: VLAN 20 (connected), dalam sekolah' }[dest];
      hasil('rt', rt);
      await s.tunggu(900);
      // 7 firewall forward
      await keLorong(s, env, st.fw.cy); sorot('fw'); md.st.textContent = '7 · Firewall';
      await s.tunggu(400);
      if (dest === 'mygovnet') { hasil('fw', '✗ VLAN 30 -> Deny MyGovNet', W.sekat); return henti(s, 'fw', st.fw.cy, 'DROP', 'DROP', 'Routing memilih ether13, tetapi <b>VLAN 30 -> Deny MyGovNet</b> menyekatnya.'); }
      if (dest === 'staf') { hasil('fw', '✗ VLAN 30 -> Deny to VLAN 20', W.sekat); return henti(s, 'fw', st.fw.cy, 'DROP', 'DROP', 'Laluan ke VLAN 20 wujud, tetapi rule <b>VLAN 30 -> Deny to VLAN 20</b> menyekatnya.'); }
      hasil('fw', '✓ Allow LAN to WAN', W.benar);
      await s.tunggu(600);
      // 8 NAT
      await keLorong(s, env, st.nat.cy); sorot('nat'); md.st.textContent = '8 · NAT';
      env.setLabel('IP WAN');
      md.dari.textContent = 'IP WAN (asal 192.168.32.57)'; md.dari.setAttribute('fill', W.aksen);
      hasil('nat', 'sumber 192.168.32.57 → IP WAN', W.aksen);
      await s.tunggu(900);
      // 9 queue
      await keLorong(s, env, st.q.cy); sorot('q'); md.st.textContent = '9 · Queue';
      hasil('q', 'PCQ 50M seorang · priority 5', W.benar);
      await s.tunggu(800);
      // 10 Unifi → laman
      sorot('unifi'); md.st.textContent = '10 · Unifi';
      await MG.gerak(s, env, [{ x: LORONG, y: env.y }, { x: BUS_LUAR, y: KELUAR_Y }, { x: BUS_LUAR, y: SV.laman.y }, { x: SV.laman.x - 32, y: SV.laman.y }], { laju: 600 });
      await MG.cop(s, lap.label, SV.laman.x + 60, SV.laman.y - 70, 'SAMPAI', 'benar');
      sorot(null);
      if (o.padaHasil) o.padaHasil('SAMPAI', 'Sepuluh stesen: WiFi, trunk, DHCP, HotSpot, DNS, mangle/routing, firewall, NAT, queue dan Unifi.', 'benar');
    };
    S.bersih();
    return S;
  }

  const RSC = {
    kod: [
      '/ip firewall filter\nadd action=accept chain=forward comment="Allow LAN to WAN" in-interface-list=\\\n    LAN out-interface-list=WAN',
      '/ip firewall nat\nadd action=masquerade chain=srcnat comment="NAT Unifi" out-interface=\\\n    pppoe-unifi',
    ],
    fungsi: 'Dua baris sebenar yang dilalui oleh setiap packet Murid ke Internet. Petikan untuk stesen lain ada dalam bab masing-masing (klik “Bab N ›”).',
  };

  function langkah(tajuk, teks2, pilihan, extra) {
    return Object.assign({
      tajuk, teks: teks2, rsc: RSC,
      bina(ctx) {
        const papan = ctx.papan({ mula: ['Perjalanan', '—', 'Tekan Mula.'] });
        const S = binaRumusan(ctx, {
          padaMula: () => papan.set('Perjalanan', '…', 'Ikuti packet melalui setiap stesen.'),
          padaHasil: (nilai, ket, jenis) => papan.set('Keputusan', nilai, ket, jenis),
        });
        let login = pilihan.login !== false, dest = pilihan.dest || 'internet';
        const mula = () => ctx.jalan((s) => S.jalan(s, login, dest));
        if (pilihan.kawal) {
          ctx.segmen('Destinasi', Object.keys(DEST).map((k) => ({ v: k, t: DEST[k].t })), dest, (v) => { dest = v; mula(); });
          ctx.togol('Sudah login HotSpot', login, (v) => { login = v; mula(); });
        }
        ctx.butang('▶ Mula perjalanan', mula, { utama: true });
        if (this.nota) ctx.nota(this.nota);
        mula();
      },
    }, extra || {});
  }

  const L1 = langkah('Sepuluh stesen, satu laptop',
    'Ikuti satu laptop Murid dari WiFi hingga ke laman web. Setiap stesen ialah satu bab dalam makmal ini. Lihat perubahan tag VLAN, alamat IP dan alamat sumber pada kad di atas.',
    {}, { nota: 'Klik <b>Bab N ›</b> pada mana-mana stesen untuk membuka bab berkaitan.' });
  const L2 = langkah('Jika belum login',
    'Laptop sudah ada IP, tetapi belum login HotSpot. Perjalanan berhenti di stesen 4. Firewall, NAT dan queue belum dilalui.',
    { login: false, kawal: true });
  const L3 = langkah('Destinasi lain',
    'Murid ke <b>MyGovNet 10.x</b> atau ke <b>PC Staf</b>: routing tetap jumpa jalan, tetapi <b>firewall</b> menyekatnya di stesen 7. Tukar destinasi dan bandingkan.',
    { dest: 'mygovnet', kawal: true }, { nota: 'Susunan dalam router mengikut aliran packet RouterOS: mangle dan routing dahulu, kemudian firewall forward, NAT dan queue. Queue diletakkan di hujung sebagai ringkasan. Simple queue Murid sebenar memadankan alamat private (target=192.168.32.0/23), bukan IP WAN.' });

  MG.daftarBab({
    id: 'rumusan', no: 10, tajuk: 'Rumusan: perjalanan Murid', sub: 'dari WiFi ke Internet', status: 'siap',
    ringkas: 'Sebuah laptop Murid melalui semua stesen, dari WiFi ke Internet.',
    langkah: [L1, L2, L3],
    ikonMenu(s) {
      el('path', { d: 'M30 80 C90 20 150 100 210 40 S260 50 280 30', fill: 'none', stroke: '#5E6769', 'stroke-width': 5, 'stroke-dasharray': '10 8' }, s);
      [[30, 80], [120, 62], [210, 40], [280, 30]].forEach((p, i) => el('circle', { cx: p[0], cy: p[1], r: 8, fill: i === 3 ? '#0F766E' : '#8B5CF6', stroke: '#111819', 'stroke-width': 2 }, s));
    },
  });
})();
