/* Bab 3 — HotSpot Murid: sambung WiFi dan dapat IP belum cukup; login dahulu sebelum Internet.
   Ikut eksport SSeM 22 Okt: hotspot-vlan30 (profil hsp-vlan30: wifi.student.lan, 192.168.32.1,
   login-by=cookie,http-chap,http-pap,trial, trial-uptime-limit=15h, trial-user-profile=profile-student),
   rule input "Hotspot: Allow DNS / Login Page", rule forward "Allow LAN to WAN" dan
   "Hotspot: Allow VLAN 30 to Internet", profil user lalai rate-limit=20M/20M (Tetamu).
   Landing page: login satu klik "Saya Faham & Sambung" (Laporan Teknikal SSeMS, Lampiran A Rajah A.2). */
(function () {
  'use strict';
  const { el, teks, W, KUMP } = MG;
  const G = MG.g;
  const KM = KUMP.murid, KT = KUMP.tetamu;

  const LORONG = 952, BAS_Y = 228, TRACE_X = 414, KELUAR_Y = 806;
  const AP = { x: 196, y: 300 }, LAPTOP = { x: 196, y: 470 }, AWAN = { x: 1160, y: 800 };
  const IP = '192.168.32.57';
  const PANEL = { hs: { y: 244, h: 196 }, inp: { y: 452, h: 238 }, fwd: { y: 702, h: 156 } };
  const BARIS_INP = (i) => 494 + i * 48;
  const INPUT_ASAL = [
    { id: 'dnsu', nama: 'Hotspot: Allow DNS UDP (VLAN 30)', syarat: 'udp 53,64872 · in VLAN30-Student', aksi: 'accept', padan: (p) => (p.jenis === 'dns' ? null : '✗ bukan DNS') },
    { id: 'dnst', nama: 'Hotspot: Allow DNS TCP (VLAN 30)', syarat: 'tcp 53 · in VLAN30-Student', aksi: 'accept', padan: (p) => (p.jenis === 'dns' ? '✗ bukan TCP' : '✗ bukan DNS') },
    { id: 'login', nama: 'Hotspot: Allow Login Page for VLAN 30', syarat: 'tcp 80,443,64872,64873', aksi: 'accept', padan: (p) => (p.jenis === 'web' ? null : '✗ bukan web') },
    { id: 'semua', nama: 'Drop ALL other traffic to Router', syarat: '(Security Check) · semua yang belum padan', aksi: 'drop', padan: () => null },
  ];
  const URL_LAMAN = 'www.moe.gov.my';

  // Satu baris rule: nama, syarat ringkas (nilai sebenar), cip ACCEPT/DROP dan ruang sebab
  function barisRule(induk, x, y, w, r, klik) {
    const g = G(induk, { class: klik ? 'boleh-klik' : null });
    const kotak = el('rect', { x, y, width: w, height: 42, rx: 9, fill: '#fff', stroke: W.garis2, 'stroke-width': 2, class: klik ? 'sorot' : null }, g);
    const nama = teks(g, x + 14, y + 19, r.nama, { 'font-size': 16.5, 'font-weight': 800 });
    teks(g, x + 14, y + 36, r.syarat, { 'font-size': 12.5, class: 'mono', fill: W.pudar });
    const ak = r.aksi === 'accept';
    el('rect', { x: x + w - 84, y: y + 9, width: 74, height: 24, rx: 6, fill: ak ? '#DCEFE9' : '#FDE2E2', stroke: ak ? W.benar : W.sekat, 'stroke-width': 1.6 }, g);
    teks(g, x + w - 47, y + 26, ak ? 'ACCEPT' : 'DROP', { 'font-size': 13.5, 'font-weight': 900, 'text-anchor': 'middle', fill: ak ? W.benar : W.sekat });
    const sebab = teks(g, x + w - 94, y + 36, '', { 'font-size': 13.5, 'font-weight': 700, 'text-anchor': 'end' });
    return { g, kotak, nama, sebab, cy: y + 21 };
  }
  const sorotBaris = (b, w, tebal) => { b.kotak.setAttribute('stroke', w || W.garis2); b.kotak.setAttribute('stroke-width', tebal || 2); };

  /* Skrin laptop Murid (HTML): keadaan browser selepas setiap cubaan */
  function skrinLaptop(ctx) {
    const d = document.createElement('div');
    Object.assign(d.style, { position: 'absolute', left: '1008px', top: '196px', width: '294px', background: W.kad, border: '2px solid ' + W.garis, borderRadius: '14px', padding: '10px 12px 12px', boxShadow: '0 6px 16px rgba(17,24,25,.07)', fontSize: '17px', lineHeight: '1.3' });
    d.innerHTML = '<div style="font-weight:800;font-size:15px;color:' + W.pudar + ';text-transform:uppercase;letter-spacing:.6px">Skrin laptop Murid</div>' +
      '<div class="url" style="margin-top:6px;background:#fff;border:1.5px solid ' + W.garis2 + ';border-radius:8px;padding:4px 10px;font:15px/1.4 var(--mono);color:' + W.dakwat2 + ';white-space:nowrap;overflow:hidden;text-overflow:ellipsis">&nbsp;</div>' +
      '<div class="isi" style="margin-top:10px;min-height:170px"></div>';
    ctx.html.appendChild(d);
    const url = d.querySelector('.url'), isi = d.querySelector('.isi');
    const KEADAAN = {
      kosong: ['', '<span style="color:' + W.pudar + '">Belum membuka apa-apa.</span>'],
      // Landing page sebenar (Laporan Teknikal SSeMS, Lampiran A Rajah A.2): login satu klik, tiada medan nama atau password
      login: ['wifi.student.lan', '<div style="text-align:center;background:#fff;border:1.5px solid ' + W.garis2 + ';border-radius:10px;padding:10px 10px 8px">' +
        '<div style="font-size:12px;font-weight:700;letter-spacing:2px;color:' + W.pudar + '">SELAMAT DATANG</div>' +
        '<div style="font-size:23px;font-weight:900;line-height:1.15">PELAJAR <span style="color:' + W.aksen + '">SSeMS</span></div>' +
        '<div style="font-size:13.5px;color:' + W.dakwat2 + ';margin:2px 0 8px">Akses Wi-Fi untuk pelajar SSeMS</div>' +
        '<div class="btnSambung" style="background:' + W.aksen + ';color:#fff;border-radius:8px;padding:7px 6px;font-weight:800;font-size:13.5px;letter-spacing:.3px;white-space:nowrap">SAYA FAHAM &amp; SAMBUNG →</div>' +
        '<div style="margin-top:8px;background:#151B1D;color:#fff;border-radius:8px;padding:5px 6px;font-size:11.5px;letter-spacing:1px">AKSES WI-FI PELAJAR<br><b style="font-size:14px;letter-spacing:0">7:00 PAGI — 10:00 MALAM</b></div></div>' +
        '<div style="margin-top:6px;font-size:13px;color:' + W.pudar + '">Ringkasan landing page sebenar (Laporan Teknikal SSeMS, Lampiran A). Satu klik; tiada nama pengguna atau password.</div>'],
      tiadaNama: [URL_LAMAN, '<b style="color:' + W.sekat + '">Laman tidak dapat dibuka.</b><br>Nama laman tidak dapat dicari: soalan DNS tidak dijawab.'],
      tiadaLogin: [URL_LAMAN, '<b style="color:' + W.sekat + '">Laman tidak dapat dibuka.</b><br>Halaman login tidak muncul, jadi Murid tidak dapat login.'],
      tunggu: [URL_LAMAN, '<span style="color:' + W.pudar + '">Memuatkan…</span>'],
      buka: [URL_LAMAN, '<b style="color:' + W.benar + '">✓ Laman dibuka.</b><br>Trafik keluar ke Internet melalui pppoe-unifi.'],
    };
    const f = (k) => {
      const v = KEADAAN[k]; url.textContent = v[0] || ' '; isi.innerHTML = v[1];
      const b = isi.querySelector('.btnSambung');
      if (b && f.klik) { b.style.cursor = 'pointer'; b.addEventListener('click', f.klik); }
    };
    return f;
  }

  function binaHs(ctx, o) {
    o = o || {};
    const lap = {};
    ['dasar', 'panel', 'label', 'paket'].forEach((n) => (lap[n] = ctx.lapisan(n)));
    const S = { rule: INPUT_ASAL.map((r) => Object.assign({ hidup: true }, r)), baris: {}, aktif: null };

    // kad packet
    const kad = G(lap.dasar);
    el('rect', { x: 400, y: 20, width: 900, height: 124, rx: 16, fill: W.kad, stroke: W.garis, 'stroke-width': 2 }, kad);
    teks(kad, 422, 50, 'PACKET', { 'font-size': 16, 'font-weight': 800, fill: W.pudar, 'letter-spacing': 0.8 });
    const md = {};
    [['dari', 'Dari', 422, 86], ['ke', 'Ke', 422, 122], ['jenis', 'Jenis', 860, 86], ['status', 'HotSpot', 860, 122]].forEach((m) => {
      teks(kad, m[2], m[3], m[1], { 'font-size': 16, 'font-weight': 700, fill: W.pudar });
      md[m[0]] = teks(kad, m[2] + 80, m[3], '—', { 'font-size': 19, 'font-weight': 700 });
    });

    // zon Murid: AP + laptop
    MG.zon({ x: 26, y: 226, width: 340, height: 414, rx: 18, fill: KM.cerah, stroke: KM.warna, 'stroke-width': 2.5 }, lap.dasar);
    el('rect', { x: 44, y: 244, width: 90, height: 28, rx: 14, fill: KM.warna }, lap.dasar);
    teks(lap.dasar, 89, 264, 'VLAN 30', { 'font-size': 16, 'font-weight': 800, fill: '#fff', 'text-anchor': 'middle' });
    teks(lap.dasar, 148, 266, 'Murid', { 'font-size': 24, 'font-weight': 800 });
    el('line', { x1: AP.x, y1: LAPTOP.y - 40, x2: AP.x, y2: AP.y + 22, stroke: KM.warna, 'stroke-width': 3, 'stroke-dasharray': '3 7', 'stroke-linecap': 'round' }, lap.dasar);
    el('line', { x1: AP.x + 38, y1: AP.y, x2: TRACE_X, y2: AP.y, stroke: KM.warna, 'stroke-width': 5 }, lap.dasar);
    MG.peranti(lap.dasar, 'ap', AP.x, AP.y, { warna: KM.warna });
    MG.label(lap.dasar, AP.x, AP.y + 58, 'Student@SSM-KUCHING', { fs: 15, garis: KM.warna });
    MG.peranti(lap.dasar, 'laptop', LAPTOP.x, LAPTOP.y, { warna: KM.warna, skrin: '#fff' });
    teks(lap.dasar, LAPTOP.x, LAPTOP.y + 72, IP, { 'font-size': 17, class: 'mono', 'text-anchor': 'middle', 'font-weight': 700 });
    teks(lap.dasar, LAPTOP.x, LAPTOP.y + 96, 'IP daripada DHCP (Bab 2)', { 'font-size': 14.5, 'text-anchor': 'middle', fill: W.pudar });
    teks(lap.dasar, 46, 622, 'SSID daripada dokumen WAC projek', { 'font-size': 13, fill: W.pudar });

    // zon Tetamu: ringkasan config (dibincang dalam Langkah 3)
    MG.zon({ x: 26, y: 656, width: 340, height: 204, rx: 18, fill: KT.cerah, stroke: KT.warna, 'stroke-width': 2.5 }, lap.dasar);
    el('rect', { x: 44, y: 674, width: 90, height: 28, rx: 14, fill: KT.warna }, lap.dasar);
    teks(lap.dasar, 89, 694, 'VLAN 40', { 'font-size': 16, 'font-weight': 800, fill: '#fff', 'text-anchor': 'middle' });
    teks(lap.dasar, 148, 696, 'Tetamu', { 'font-size': 24, 'font-weight': 800 });
    MG.peranti(lap.dasar, 'telefon', 76, 776, { warna: KT.warna, skrin: '#fff' });
    [['hotspot-vlan40', 742], ['wifi.guest.lan', 766], ['tiada trial', 790], ['rate-limit 20M seorang', 814]].forEach((t, i) =>
      teks(lap.dasar, 118, t[1], t[0], { 'font-size': i === 3 ? 15 : 14.5, class: i < 2 ? 'mono' : null, 'font-weight': i === 3 ? 800 : 500, fill: i === 3 ? KT.gelap : W.dakwat2 }));
    teks(lap.dasar, 118, 840, '→ Langkah 3', { 'font-size': 14, fill: W.pudar });

    // router
    MG.rak(lap.dasar, 400, 160, 590, 712, 'ROUTER', 'MikroTik SSeM');
    MG.garisan(lap.dasar, [{ x: TRACE_X, y: AP.y }, { x: TRACE_X, y: BAS_Y }, { x: LORONG, y: BAS_Y }, { x: LORONG, y: KELUAR_Y }], { stroke: '#5E6B6E', 'stroke-width': 4, 'stroke-dasharray': '2 6', 'stroke-linecap': 'round' });

    // panel 1: HotSpot
    const ph = PANEL.hs;
    el('rect', { x: 430, y: ph.y, width: 490, height: ph.h, rx: 12, fill: '#F4F2EC' }, lap.panel);
    teks(lap.panel, 446, ph.y + 28, '1 · HOTSPOT  hotspot-vlan30', { 'font-size': 18, 'font-weight': 800 });
    const hsHasil = teks(lap.panel, 908, ph.y + 28, '', { 'font-size': 15, 'font-weight': 800, 'text-anchor': 'end' });
    ['dns-name=wifi.student.lan  hotspot-address=192.168.32.1', 'login-by=cookie,http-chap,http-pap,trial', 'trial-uptime-limit=15h  user-profile=profile-student'].forEach((t, i) =>
      teks(lap.panel, 446, ph.y + 56 + i * 21, t, { 'font-size': 13.5, class: 'mono', fill: W.dakwat2 }));
    teks(lap.panel, 446, ph.y + 138, 'ACTIVE — peranti yang sudah login', { 'font-size': 14, 'font-weight': 800, fill: W.pudar, 'letter-spacing': 0.5 });
    const kotakAktif = el('rect', { x: 442, y: ph.y + 146, width: 466, height: 40, rx: 8, fill: '#fff', stroke: W.garis2, 'stroke-width': 2 }, lap.panel);
    const tAktif = teks(lap.panel, 456, ph.y + 172, '', { 'font-size': 16, 'font-weight': 700 });

    // panel 2: firewall input
    const pi = PANEL.inp;
    el('rect', { x: 430, y: pi.y, width: 490, height: pi.h, rx: 12, fill: '#F4F2EC' }, lap.panel);
    teks(lap.panel, 446, pi.y + 28, '2 · FIREWALL INPUT — ke router', { 'font-size': 18, 'font-weight': 800 });
    S.rule.forEach((r, i) => {
      const b = barisRule(lap.panel, 442, BARIS_INP(i), 466, r, false);
      S.baris[r.id] = b;
    });
    function rupa() {
      S.rule.forEach((r) => {
        const b = S.baris[r.id];
        b.g.setAttribute('opacity', r.hidup ? 1 : 0.45);
        b.nama.setAttribute('text-decoration', r.hidup ? 'none' : 'line-through');
      });
    }

    // panel 3: firewall forward
    const pf = PANEL.fwd;
    el('rect', { x: 430, y: pf.y, width: 490, height: pf.h, rx: 12, fill: '#F4F2EC' }, lap.panel);
    teks(lap.panel, 446, pf.y + 28, '3 · FIREWALL FORWARD — ke Internet', { 'font-size': 18, 'font-weight': 800 });
    const bLan = barisRule(lap.panel, 442, pf.y + 42, 466, { nama: 'Allow LAN to WAN', syarat: 'in LAN · out WAN', aksi: 'accept' });
    const bHs = barisRule(lap.panel, 442, pf.y + 92, 466, { nama: 'Hotspot: Allow VLAN 30 to Internet', syarat: 'lebih bawah dalam senarai', aksi: 'accept' });
    bHs.g.setAttribute('opacity', 0.6);

    // keluar ke Internet
    el('line', { x1: LORONG, y1: KELUAR_Y, x2: 1050, y2: KELUAR_Y, stroke: W.dakwat2, 'stroke-width': 6 }, lap.dasar);
    MG.awan(lap.dasar, AWAN.x, AWAN.y, 0.95, 'Internet', '#DDF1EC');
    teks(lap.dasar, AWAN.x, AWAN.y + 60, 'pppoe-unifi', { 'font-size': 15, class: 'mono', 'text-anchor': 'middle', fill: W.dakwat2 });

    const skrin = (S.skrin = skrinLaptop(ctx));
    skrin('kosong');

    function tulisAktif() {
      if (!S.aktif) { tAktif.textContent = '(kosong — belum ada yang login)'; tAktif.setAttribute('fill', W.pudar); return; }
      tAktif.textContent = `${IP}  ·  student  ·  profile-student`;
      tAktif.setAttribute('fill', W.dakwat);
    }
    tulisAktif(); rupa();

    S.bersih = () => {
      MG.kosong(lap.paket); MG.kosong(lap.label);
      Object.values(S.baris).concat([bLan]).forEach((b) => { b.sebab.textContent = ''; sorotBaris(b); });
      hsHasil.textContent = ''; kotakAktif.setAttribute('stroke', W.garis2); kotakAktif.setAttribute('stroke-width', 2);
    };
    S.setAktif = (v) => { S.aktif = v; tulisAktif(); };

    const keRouter = [{ x: LAPTOP.x, y: LAPTOP.y - 40 }, { x: AP.x, y: AP.y }, { x: TRACE_X, y: AP.y }, { x: TRACE_X, y: BAS_Y }, { x: LORONG, y: BAS_Y }];
    const keLorong = (s, env, y) => MG.gerak(s, env, [{ x: env.x, y: env.y }, { x: LORONG, y }], { laju: 520, ease: MG.ease.io });
    async function balikKeLaptop(s, dariY, label, warna) {
      const r = MG.sampul(lap.paket, { warna: warna || W.dakwat2, label, saiz: 1 });
      await MG.gerak(s, r, [{ x: LORONG, y: dariY }, { x: LORONG, y: BAS_Y }, { x: TRACE_X, y: BAS_Y }, { x: TRACE_X, y: AP.y }, { x: AP.x, y: AP.y }, { x: LAPTOP.x, y: LAPTOP.y - 40 }], { laju: 760 });
      r.remove();
    }

    // HotSpot memeriksa senarai Active
    async function semakHs(s, env) {
      await keLorong(s, env, PANEL.hs.y + 166);
      kotakAktif.setAttribute('stroke', W.dakwat); kotakAktif.setAttribute('stroke-width', 3);
      await s.tunggu(450);
      hsHasil.textContent = S.aktif ? '✓ sudah login' : '✗ belum login → ke router';
      hsHasil.setAttribute('fill', S.aktif ? W.benar : W.aksen);
      await s.tunggu(650);
    }

    // Rule input dibaca dari atas; pulangkan rule yang memutuskan
    async function semakInput(s, env, p) {
      for (let i = 0; i < S.rule.length; i++) {
        const r = S.rule[i], b = S.baris[r.id];
        await keLorong(s, env, b.cy);
        sorotBaris(b, W.dakwat, 3);
        await s.tunggu(240);
        const sebab = r.hidup ? r.padan(p) : 'dimatikan';
        if (sebab) {
          b.sebab.textContent = sebab; b.sebab.setAttribute('fill', W.pudar);
          await s.tunggu(300); sorotBaris(b);
          continue;
        }
        const ak = r.aksi === 'accept';
        b.sebab.textContent = '✓ PADAN'; b.sebab.setAttribute('fill', ak ? W.benar : W.sekat);
        sorotBaris(b, ak ? W.benar : W.sekat, 4);
        if (!ak) await MG.cop(s, lap.label, LORONG - 50, b.cy - 50, 'DROP', 'sekat');
        await s.tunggu(400);
        return r;
      }
      return null;
    }

    // Murid membuka laman web
    S.buka = async (s) => {
      S.bersih();
      md.dari.textContent = `${IP} (Murid)`; md.ke.textContent = URL_LAMAN;
      md.status.textContent = S.aktif ? 'sudah login' : 'belum login';
      md.status.setAttribute('fill', S.aktif ? W.benar : W.aksen);
      skrin('tunggu');
      if (o.padaMula) o.padaMula();
      if (S.aktif) {
        md.jenis.textContent = 'web (tcp 443)';
        const env = MG.sampul(lap.paket, { warna: KM.warna, label: 'web', saiz: 1.1 });
        await MG.gerak(s, env, keRouter, { laju: 640 });
        await semakHs(s, env);
        await keLorong(s, env, bLan.cy);
        sorotBaris(bLan, W.benar, 4); bLan.sebab.textContent = '✓ PADAN'; bLan.sebab.setAttribute('fill', W.benar);
        await s.tunggu(700);
        await MG.gerak(s, env, [{ x: LORONG, y: env.y }, { x: LORONG, y: KELUAR_Y }, { x: AWAN.x - 40, y: KELUAR_Y }], { laju: 560 });
        await MG.cop(s, lap.label, AWAN.x, AWAN.y - 96, 'SAMPAI', 'benar');
        skrin('buka');
        if (o.padaHasil) o.padaHasil('Internet', 'Ada dalam senarai Active. Firewall forward: <b>Allow LAN to WAN</b> padan dahulu.', 'benar');
        return;
      }
      // belum login: soalan DNS dibelokkan ke router dahulu
      md.jenis.textContent = 'DNS (udp 53)';
      const dns = MG.sampul(lap.paket, { warna: KM.warna, label: 'DNS?', saiz: 1.1 });
      await MG.gerak(s, dns, keRouter, { laju: 640 });
      await semakHs(s, dns);
      const r1 = await semakInput(s, dns, { jenis: 'dns' });
      if (r1.aksi !== 'accept') {
        skrin('tiadaNama');
        if (o.padaHasil) o.padaHasil('DNS gagal', 'Andaian rule statik sahaja: soalan DNS jatuh ke <b>Drop ALL other traffic to Router</b>. Nama laman tidak dapat dicari.', 'sekat');
        return;
      }
      dns.remove();
      await balikKeLaptop(s, S.baris.dnsu.cy, 'jawapan DNS');
      // packet web: HotSpot membelokkannya ke halaman login router
      S.bersih();
      md.jenis.textContent = 'web (tcp 80/443)';
      const web = MG.sampul(lap.paket, { warna: KM.warna, label: 'web', saiz: 1.1 });
      await MG.gerak(s, web, keRouter, { laju: 640 });
      await semakHs(s, web);
      const r2 = await semakInput(s, web, { jenis: 'web' });
      if (r2.aksi !== 'accept') {
        skrin('tiadaLogin');
        if (o.padaHasil) o.padaHasil('Tiada login', 'Andaian rule statik sahaja: <b>Allow Login Page</b> dimatikan, halaman login tidak sampai.', 'sekat');
        return;
      }
      web.remove();
      await balikKeLaptop(s, S.baris.login.cy, 'halaman login', W.aksen);
      skrin('login');
      if (o.padaHasil) o.padaHasil('Dibelokkan', 'Belum login: HotSpot menghantar <b>halaman login</b> wifi.student.lan, bukan laman yang diminta.', null);
    };

    // Murid menekan "Saya Faham & Sambung" (login satu klik): perlu sampai ke landing page dahulu
    S.login = async (s, jenis) => {
      S.bersih();
      md.dari.textContent = `${IP} (Murid)`; md.ke.textContent = 'wifi.student.lan (192.168.32.1)';
      md.jenis.textContent = 'login satu klik';
      md.status.textContent = 'belum login'; md.status.setAttribute('fill', W.aksen);
      if (o.padaMula) o.padaMula();
      const env = MG.sampul(lap.paket, { warna: KM.warna, label: 'login', saiz: 1.1 });
      await MG.gerak(s, env, keRouter, { laju: 640 });
      await semakHs(s, env);
      const r = await semakInput(s, env, { jenis: 'web' });
      if (r.aksi !== 'accept') {
        skrin('tiadaLogin');
        if (o.padaHasil) o.padaHasil('Gagal login', 'Halaman login tidak boleh dicapai. Hidupkan semula rule <b>Allow Login Page</b>.', 'sekat');
        return;
      }
      await keLorong(s, env, PANEL.hs.y + 166);
      env.remove();
      S.setAktif(jenis);
      kotakAktif.setAttribute('stroke', W.benar); kotakAktif.setAttribute('stroke-width', 4);
      md.status.textContent = 'sudah login'; md.status.setAttribute('fill', W.benar);
      hsHasil.textContent = '✓ ditambah ke Active'; hsHasil.setAttribute('fill', W.benar);
      await s.tunggu(500);
      skrin('kosong');
      if (o.padaHasil) o.padaHasil('Sudah login', 'Satu klik: login sebagai akaun <b>student</b> (profile-student). Sekarang cuba buka laman web.', 'benar');
    };

    S.logout = () => { S.setAktif(null); S.bersih(); skrin('kosong'); md.status.textContent = 'belum login'; md.status.setAttribute('fill', W.aksen); };
    return S;
  }

  const RSC = {
    kod: [
      '/ip hotspot profile\nadd dns-name=<mark>wifi.student.lan</mark> hotspot-address=192.168.32.1 html-directory=\\\n    hotspot-student login-by=cookie,http-chap,http-pap,<mark>trial</mark> name=hsp-vlan30 \\\n    <mark>trial-uptime-limit=15h</mark> trial-user-profile=profile-student',
      '/ip hotspot\nadd disabled=no interface=<mark>VLAN30-Student</mark> name=hotspot-vlan30 profile=\\\n    hsp-vlan30',
      '/ip firewall filter\nadd action=accept chain=<mark>input</mark> comment="Hotspot: Allow Login Page for VLAN 30" \\\n    dst-port=80,443,64872,64873 in-interface=VLAN30-Student protocol=tcp',
    ],
    fungsi: 'HotSpot dipasang pada VLAN30-Student. Peranti yang belum login dibelokkan ke halaman login pada 192.168.32.1. Rule input membenarkan DNS dan halaman login sampai ke router. (Petikan sebenar SSeM; akaun dan password tidak dipaparkan.)',
  };

  function langkah(tajuk, teks2, pilihan, extra) {
    return Object.assign({
      tajuk, teks: teks2, rsc: RSC,
      bina(ctx) {
        const papan = ctx.papan({ mula: ['HotSpot', '—', 'Tekan Buka laman web.'] });
        const cb = {
          padaMula: () => papan.set('HotSpot', '…', 'Packet sedang bergerak.'),
          padaHasil: (nilai, ket, jenis) => papan.set('Keputusan', nilai, ket, jenis),
        };
        const S = binaHs(ctx, cb);
        if (pilihan.aktif) S.setAktif(pilihan.aktif);
        const buka = () => ctx.jalan((s) => S.buka(s));
        const k = ctx.kumpulan('Laptop Murid');
        ctx.butang('▶ Buka laman web', buka, { utama: true, dalam: k });
        if (pilihan.login) {
          const k2 = ctx.kumpulan('Landing page');
          const sambung = () => ctx.jalan((s) => S.login(s, 'klik'));
          S.skrin.klik = sambung;
          ctx.butang('Saya Faham & Sambung', sambung, { dalam: k2, warna: KM.warna });
        }
        if (this.nota) ctx.nota(this.nota);
        buka();
      },
    }, extra || {});
  }

  /* ---------------------------------------------------------------- Langkah 3: Tetamu */
  const BIL = [1, 4, 8, 12], MAHU = 40, MAX_Q = 200;
  function binaTetamu(ctx) {
    const lap = {};
    ['dasar', 'panel', 'bar'].forEach((n) => (lap[n] = ctx.lapisan(n)));
    MG.zon({ x: 26, y: 226, width: 410, height: 634, rx: 18, fill: KT.cerah, stroke: KT.warna, 'stroke-width': 2.5 }, lap.dasar);
    el('rect', { x: 44, y: 244, width: 90, height: 28, rx: 14, fill: KT.warna }, lap.dasar);
    teks(lap.dasar, 89, 264, 'VLAN 40', { 'font-size': 16, 'font-weight': 800, fill: '#fff', 'text-anchor': 'middle' });
    teks(lap.dasar, 148, 266, 'Tetamu', { 'font-size': 24, 'font-weight': 800 });
    teks(lap.dasar, 420, 266, 'Guest@SSM-KUCHING', { 'font-size': 15, 'text-anchor': 'end', fill: KT.gelap, 'font-weight': 700 });
    const fon = [];
    for (let i = 0; i < 12; i++) {
      const c = i % 4, r = Math.floor(i / 4), x = 86 + c * 96, y = 340 + r * 182;
      const g = G(lap.bar);
      MG.peranti(g, 'telefon', x, y, { warna: KT.warna, skrin: '#fff' });
      el('rect', { x: x - 36, y: y + 52, width: 72, height: 12, rx: 6, fill: '#fff', stroke: W.garis2, 'stroke-width': 1.5 }, g);
      const isi = el('rect', { x: x - 36, y: y + 52, width: 0, height: 12, rx: 6, fill: KT.gelap }, g);
      const t = teks(g, x, y + 86, '', { 'font-size': 17, 'font-weight': 800, 'text-anchor': 'middle', class: 'mono' });
      fon.push({ g, isi, t, x, w: 0 });
    }
    el('line', { x1: 436, y1: 540, x2: 470, y2: 540, stroke: KT.warna, 'stroke-width': 6 }, lap.dasar);

    MG.rak(lap.dasar, 470, 160, 520, 712, 'ROUTER', 'MikroTik SSeM');
    const panel = (y, h, tajuk) => { el('rect', { x: 496, y, width: 468, height: h, rx: 12, fill: '#F4F2EC' }, lap.panel); teks(lap.panel, 512, y + 28, tajuk, { 'font-size': 18, 'font-weight': 800 }); };
    panel(236, 160, '1 · HOTSPOT  hotspot-vlan40');
    ['user profile (lalai):', 'rate-limit=20M/20M', 'parent-queue="Limit VLAN 40 Guest', '  (30M per-user)"'].forEach((t, i) =>
      teks(lap.panel, 512, 290 + i * 24, t, { 'font-size': i === 0 ? 14.5 : 14, class: i ? 'mono' : null, fill: i === 1 ? KT.gelap : W.dakwat2, 'font-weight': i === 1 ? 800 : 500 }));
    const tRl = teks(lap.panel, 948, 314, '', { 'font-size': 14, 'font-weight': 800, 'text-anchor': 'end' });
    panel(412, 214, '2 · QUEUE  Limit VLAN 40 Guest');
    ['limit-at=80M  max-limit=200M  priority=7', 'queue=pcq-up-30m/pcq-down-30m'].forEach((t, i) =>
      teks(lap.panel, 512, 466 + i * 24, t, { 'font-size': 14, class: 'mono', fill: W.dakwat2 }));
    teks(lap.panel, 512, 532, 'Jumlah semua Tetamu', { 'font-size': 15, 'font-weight': 700, fill: W.pudar });
    el('rect', { x: 512, y: 546, width: 436, height: 30, rx: 8, fill: '#fff', stroke: W.garis2, 'stroke-width': 2 }, lap.panel);
    const tolok = el('rect', { x: 512, y: 546, width: 0, height: 30, rx: 8, fill: KT.warna }, lap.panel);
    const tJum = teks(lap.panel, 948, 532, '', { 'font-size': 16, 'font-weight': 800, 'text-anchor': 'end', class: 'mono' });
    teks(lap.panel, 948, 600, 'max-limit 200M', { 'font-size': 13.5, fill: W.pudar, 'text-anchor': 'end' });
    panel(642, 214, '3 · SETIAP TETAMU MENDAPAT');
    const tSeorang = teks(lap.panel, 512, 742, '', { 'font-size': 54, 'font-weight': 900, fill: KT.gelap });
    const tFormula = teks(lap.panel, 512, 790, '', { 'font-size': 15, fill: W.dakwat2, class: 'mono' });
    const tSebab = teks(lap.panel, 512, 820, '', { 'font-size': 15.5, 'font-weight': 700, fill: W.dakwat2 });

    el('line', { x1: 990, y1: 540, x2: 1060, y2: 540, stroke: W.dakwat2, 'stroke-width': 6 }, lap.dasar);
    MG.awan(lap.dasar, 1172, 540, 0.95, 'Internet', '#DDF1EC');
    teks(lap.dasar, 1172, 600, 'pppoe-unifi', { 'font-size': 15, class: 'mono', 'text-anchor': 'middle', fill: W.dakwat2 });

    const fmt = (v) => (Math.abs(v - Math.round(v)) < 0.05 ? String(Math.round(v)) : v.toFixed(1)) + 'M';
    return function kira(s, n, rl) {
      const had = rl ? 20 : 30, seorang = Math.min(MAHU, had, MAX_Q / n), jum = seorang * n;
      tRl.textContent = rl ? '✓ aktif' : '✗ dimatikan'; tRl.setAttribute('fill', rl ? W.benar : W.sekat);
      const sebab = seorang === MAX_Q / n && MAX_Q / n < had ? `max-limit 200M dikongsi ${n} orang` : rl ? 'had rate-limit HotSpot' : 'had PCQ 30M seorang';
      tFormula.textContent = `min(mahu ${MAHU}M, had ${had}M, 200M ÷ ${n})`;
      tSebab.textContent = 'Penentu: ' + sebab;
      tJum.textContent = `${fmt(jum)} / 200M`;
      const w0 = +tolok.getAttribute('width'), w1 = (436 * jum) / MAX_Q;
      const lama = fon.map((f) => f.w);
      fon.forEach((f, i) => { f.g.setAttribute('opacity', i < n ? 1 : 0.18); f.t.textContent = i < n ? fmt(seorang) : ''; });
      const baru = fon.map((f, i) => (i < n ? (72 * seorang) / MAHU : 0));
      tSeorang.textContent = fmt(seorang);
      return s.tween(700, (p) => {
        tolok.setAttribute('width', (w0 + (w1 - w0) * p).toFixed(1));
        fon.forEach((f, i) => { f.w = lama[i] + (baru[i] - lama[i]) * p; f.isi.setAttribute('width', f.w.toFixed(1)); });
      }, MG.ease.out).then(() => ({ seorang, jum, sebab }));
    };
  }

  const L1 = langkah('Sambung WiFi belum cukup',
    'Laptop Murid sudah bersambung ke <b>Student@SSM-KUCHING</b> dan mendapat IP. Namun, apabila Murid membuka laman web, <b>HotSpot</b> menyemak dahulu: peranti ini belum login, jadi laman yang muncul ialah <b>halaman login</b>.',
    {}, { analogi: 'Seperti WiFi hotel atau lapangan terbang: telefon sudah bersambung, tetapi halaman login muncul dahulu sebelum boleh melayari Internet.' });
  const L2 = langkah('Login, kemudian Internet',
    'Landing page hanya ada satu butang: <b>Saya Faham &amp; Sambung</b>. Satu klik terus login sebagai akaun <b>student</b>. Semua Murid berkongsi akaun ini (<b>shared-users=unlimited</b>). Selepas login, alamat laptop masuk ke senarai <b>Active</b> dan boleh ke Internet.',
    { login: true }, { nota: 'User hotspot "1-Click Student": name=student, profile=profile-student. profile-student tiada had masa. Profile hsp-vlan30 juga membenarkan trial (trial-uptime-limit=15h), tetapi butang satu klik menggunakan akaun student.' });
  const L3 = {
    tajuk: 'Tetamu: had 20M seorang',
    teks: 'Tetamu login melalui <b>hotspot-vlan40</b> (tiada trial). Profil user lalai menetapkan <b>rate-limit=20M/20M</b>. Queue Tetamu pula ada <b>max-limit 200M</b> untuk semua Tetamu. Tambah bilangan Tetamu dan lihat apa yang menentukan kelajuan.',
    rsc: {
      kod: ['/ip hotspot user profile\nset [ find default=yes ] parent-queue=<mark>"Limit VLAN 40 Guest (30M per-user)"</mark> \\\n    <mark>rate-limit=20M/20M</mark> shared-users=unlimited', '/ip hotspot profile\nadd dns-name=wifi.guest.lan hotspot-address=192.168.42.1 login-by=\\\n    cookie,http-chap,http-pap name=hsp-vlan40'],
      fungsi: 'Setiap Tetamu yang login mendapat had 20M download dan upload. Queue induknya ialah queue Tetamu (Bab 8). Profil Tetamu tiada pilihan trial. (Petikan sebenar SSeM.)',
    },
    bina(ctx) {
      const papan = ctx.papan({ mula: ['Tetamu', '—', 'Pilih bilangan Tetamu.'] });
      const kira = binaTetamu(ctx);
      let n = 4, rl = true;
      const jalan = () => ctx.jalan((s) => kira(s, n, rl).then((h) => papan.set(`${n} Tetamu login`, h.seorang ? `${(Math.round(h.seorang * 10) / 10)}M` : '—', `Untuk setiap Tetamu. Penentu: <b>${h.sebab}</b>.`, 'benar')));
      ctx.segmen('Bilangan Tetamu login', BIL.map((v) => ({ v: String(v), t: String(v) })), String(n), (v) => { n = +v; jalan(); });
      ctx.togol('rate-limit 20M (profil HotSpot)', rl, (v) => { rl = v; jalan(); });
      ctx.nota('Murid tiada rate-limit dalam profil HotSpot (profile-student). Kelajuan Murid dihadkan oleh queue PCQ 50M seorang (Bab 8).');
      ctx.lencanaSim('Simulasi: setiap Tetamu mahu 40M; talian tidak sesak');
      jalan();
    },
  };

  MG.daftarBab({
    id: 'hotspot', no: 3, tajuk: 'HotSpot Murid', sub: 'login dahulu, baru Internet', status: 'siap',
    ringkas: 'Sambung WiFi belum cukup. Login dahulu sebelum melayari Internet.',
    langkah: [L1, L2, L3],
    ikonMenu(s) {
      el('rect', { x: 92, y: 18, width: 116, height: 74, rx: 10, fill: '#fff', stroke: '#3B4648', 'stroke-width': 4 }, s);
      el('rect', { x: 110, y: 40, width: 80, height: 12, rx: 4, fill: '#E9E1FD', stroke: '#8B5CF6', 'stroke-width': 2 }, s);
      el('rect', { x: 110, y: 60, width: 46, height: 16, rx: 5, fill: '#8B5CF6' }, s);
    },
  });
})();
