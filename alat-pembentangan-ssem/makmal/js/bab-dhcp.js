/* Bab 2 — DHCP. Kaunter pas IP sementara pada router untuk VLAN 30 (Murid).
   Empat mesej DORA, pool alamat, lease yang diperbaharui, dan apa yang berlaku apabila pool habis. */
(function () {
  'use strict';
  const { el, teks, W, KUMP } = MG;
  const G = MG.g;
  const Z = KUMP.murid;
  const AP = { x: 325, y: 300 };
  const LALUAN_Y = 266, ROUTER_X = 700, KAUNTER = { x: 742, y: LALUAN_Y };
  const SLOT_DEV = Array.from({ length: 12 }, (_, i) => ({ x: 105 + (i % 4) * 145, y: 440 + Math.floor(i / 4) * 150 }));
  const LEASE_MS = 24000; // satu tempoh lease = 24 s masa simulasi

  function binaDhcp(ctx, o) {
    o = o || {};
    const S = {
      saizPool: o.poolKecil ? 6 : 24, slot: [], dev: [], manual: false,
      lap: {},
    };
    ['zon', 'kabel', 'rak', 'pool', 'peranti', 'label', 'paket'].forEach((n) => (S.lap[n] = ctx.lapisan(n)));
    const L = S.lap;

    // zon WiFi Murid
    MG.zon({ x: 30, y: 300, width: 590, height: 572, rx: 20, fill: Z.cerah, stroke: Z.warna, 'stroke-width': 2.5 }, L.zon);
    teks(L.zon, 52, 858, 'SSID Student@SSM-KUCHING → VLAN 30 · 192.168.32.0/23', { 'font-size': 18, 'font-weight': 700, fill: Z.gelap });
    // laluan AP → router (melalui switch & trunk, dipermudah)
    MG.garisan(L.kabel, [{ x: AP.x, y: AP.y - 14 }, { x: AP.x, y: LALUAN_Y }, { x: ROUTER_X, y: LALUAN_Y }], { stroke: W.dakwat2, 'stroke-width': 6, 'stroke-linejoin': 'round' });
    MG.label(L.kabel, 520, LALUAN_Y - 26, 'melalui switch + trunk (tag 30)', { fs: 15, isi: W.kertas, garis: W.kertas, warnaTeks: W.pudar, tebal: 600 });
    MG.peranti(L.rak, 'ap', AP.x, AP.y, { gelombangBawah: true });

    // router + kaunter DHCP
    MG.rak(L.rak, ROUTER_X, 40, 590, 830, 'ROUTER', 'DHCP server · VLAN30-Student');
    const info = G(L.rak);
    el('rect', { x: 728, y: 96, width: 534, height: 126, rx: 12, fill: '#F4F2EC' }, info);
    teks(info, 748, 126, 'Pool', { 'font-size': 16, 'font-weight': 800, fill: W.pudar });
    const tPool = teks(info, 808, 126, '', { 'font-size': 17, class: 'mono' });
    teks(info, 748, 158, 'Gateway', { 'font-size': 16, 'font-weight': 800, fill: W.pudar });
    teks(info, 838, 158, '192.168.32.1', { 'font-size': 17, class: 'mono' });
    teks(info, 748, 190, 'DNS', { 'font-size': 16, 'font-weight': 800, fill: W.pudar });
    teks(info, 808, 190, '208.67.222.222, 208.67.220.220 (OpenDNS)', { 'font-size': 17, class: 'mono' });
    teks(info, 748, 212, '', { 'font-size': 1 });

    const panelPool = G(L.rak);
    el('rect', { x: 728, y: 252, width: 534, height: 372, rx: 12, fill: '#F4F2EC' }, panelPool);
    const tajukPool = teks(panelPool, 748, 284, '', { 'font-size': 18, 'font-weight': 800 });
    const legenda = [['Bebas', '#fff', W.garis2], ['Ditawarkan', '#FEF3C7', '#D97706'], ['Dipinjam (lease)', Z.cerah, Z.warna]];
    legenda.forEach((l, i) => {
      el('rect', { x: 748 + i * 160, y: 596, width: 18, height: 18, rx: 4, fill: l[1], stroke: l[2], 'stroke-width': 2 }, panelPool);
      teks(panelPool, 774 + i * 160, 611, l[0], { 'font-size': 15, fill: W.dakwat2 });
    });

    const panelLease = G(L.rak);
    el('rect', { x: 728, y: 646, width: 534, height: 206, rx: 12, fill: '#F4F2EC' }, panelLease);
    teks(panelLease, 748, 676, 'IP → DHCP Server → Leases', { 'font-size': 17, 'font-weight': 800 });
    teks(panelLease, 1242, 676, 'masa dipercepat', { 'font-size': 14, fill: W.pudar, 'text-anchor': 'end' });
    const barisLease = G(panelLease);

    // slot pool
    function binaPool() {
      MG.kosong(L.pool);
      S.slot = [];
      tPool.textContent = S.saizPool === 6 ? '192.168.32.10 – .15 (pool demo: 6 alamat)' : '192.168.32.10 – 192.168.33.250';
      tajukPool.textContent = S.saizPool === 6 ? 'Pool demo kecil: 6 alamat sahaja' : 'Pool sebenar: 497 alamat (24 pertama dipaparkan)';
      for (let j = 0; j < S.saizPool; j++) {
        const c = j % 6, r = Math.floor(j / 6);
        const x = 748 + c * 84, y = 304 + r * 70;
        const g = G(L.pool);
        const kotak = el('rect', { x, y, width: 76, height: 60, rx: 9, fill: '#fff', stroke: W.garis2, 'stroke-width': 2 }, g);
        teks(g, x + 38, y + 27, '.' + (10 + j), { 'font-size': 19, 'font-weight': 800, 'text-anchor': 'middle', class: 'mono' });
        const pemilik = teks(g, x + 38, y + 46, '', { 'font-size': 12.5, 'text-anchor': 'middle', fill: W.dakwat2 });
        const bar = el('rect', { x: x + 8, y: y + 51, width: 0, height: 4, rx: 2, fill: Z.warna }, g);
        S.slot.push({ j, ip: '192.168.32.' + (10 + j), x: x + 38, y: y + 30, kotak, pemilik, bar, status: 'bebas', dev: null, sisa: 0 });
      }
    }
    S.lukisSlot = (sl) => {
      const st = { bebas: ['#fff', W.garis2], tawar: ['#FEF3C7', '#D97706'], pajak: [Z.cerah, Z.warna] }[sl.status];
      sl.kotak.setAttribute('fill', st[0]); sl.kotak.setAttribute('stroke', st[1]);
      sl.pemilik.textContent = sl.dev ? sl.dev.nama : '';
      sl.bar.setAttribute('width', sl.status === 'pajak' ? (60 * Math.max(0, sl.sisa)).toFixed(1) : 0);
      sl.bar.setAttribute('fill', sl.dev && !sl.dev.ada ? W.sekat : Z.warna);
    };
    S.lukisLease = () => {
      MG.kosong(barisLease);
      const aktif = S.slot.filter((s) => s.status === 'pajak').slice(0, 5);
      if (!aktif.length) teks(barisLease, 748, 712, 'Tiada lease lagi.', { 'font-size': 17, fill: W.pudar });
      aktif.forEach((s, i) => {
        const y = 712 + i * 30;
        teks(barisLease, 748, y, s.ip, { 'font-size': 16, class: 'mono' });
        teks(barisLease, 920, y, s.dev.nama + (s.dev.ada ? '' : ' (sudah keluar)'), { 'font-size': 16, fill: s.dev.ada ? W.dakwat : W.sekat });
        el('rect', { x: 1130, y: y - 12, width: 112, height: 10, rx: 5, fill: W.garis }, barisLease);
        el('rect', { x: 1130, y: y - 12, width: (112 * Math.max(0, s.sisa)).toFixed(1), height: 10, rx: 5, fill: s.dev.ada ? Z.warna : W.sekat }, barisLease);
      });
    };

    // peranti
    S.dev = SLOT_DEV.map((p, i) => ({ i, x: p.x, y: p.y, nama: 'Murid ' + (i + 1), ada: false, ip: null, g: null }));
    S.lukisDev = (d) => {
      if (d.g) d.g.remove();
      if (!d.ada && !d.ip) { d.g = null; return; }
      const g = (d.g = G(L.peranti, { opacity: d.ada ? 1 : 0.3 }));
      el('line', { x1: AP.x, y1: AP.y + 16, x2: d.x, y2: d.y - 38, stroke: Z.warna, 'stroke-width': 2.2, 'stroke-dasharray': '6 7', opacity: 0.7 }, g);
      MG.peranti(g, 'laptop', d.x, d.y, { warna: Z.warna, skrin: d.ip && !d.apipa ? Z.cerah : '#E7ECEE' });
      teks(g, d.x, d.y + 66, d.nama, { 'font-size': 16, 'font-weight': 700, 'text-anchor': 'middle' });
      const ipT = d.ip ? d.ip : 'IP: tiada';
      teks(g, d.x, d.y + 86, ipT, { 'font-size': 14.5, 'text-anchor': 'middle', class: 'mono', fill: d.apipa ? W.sekat : d.ip ? W.dakwat2 : W.sekat, 'font-weight': d.ip && !d.apipa ? 400 : 700 });
    };

    // lease berjalan: peranti yang masih ada memperbaharui pada 50%; yang sudah keluar tamat
    S.mulaLease = (skop) => {
      if (MG.statik) return;
      skop.ticker((dt) => {
        let ubah = false;
        S.slot.forEach((sl) => {
          if (sl.status !== 'pajak') return;
          sl.sisa -= dt / LEASE_MS;
          if (sl.dev.ada && sl.sisa <= 0.5 && !sl.baharu) {
            sl.baharu = true;
            MG.senyap(S.perbaharui(skop, sl.dev, sl).then(() => { sl.baharu = false; }));
          }
          if (sl.sisa <= 0) {
            const d = sl.dev; sl.status = 'bebas'; sl.dev = null; sl.sisa = 0;
            if (d) { d.ip = null; S.lukisDev(d); }
            if (o.padaTamat) o.padaTamat(sl, d);
          }
          S.lukisSlot(sl); ubah = true;
        });
        if (ubah) S.lukisLease();
      });
    };

    // DORA card
    const kad = document.createElement('div');
    kad.className = 'papanHasil';
    Object.assign(kad.style, { left: '398px', width: '292px', padding: '10px 14px' });
    ctx.html.appendChild(kad);
    const MESEJ = [['DISCOVER', 'Ada DHCP server?', 'broadcast'], ['OFFER', 'Cuba alamat ini', 'router → laptop'], ['REQUEST', 'Saya mahu alamat itu', 'broadcast'], ['ACK', 'Sah. Ini tetapan anda', 'router → laptop']];
    S.kadDora = (aktif) => {
      kad.innerHTML = '<div class="lbl">Empat mesej DHCP</div>' + MESEJ.map((m, i) => `<div style="display:flex;gap:8px;align-items:baseline;margin-top:4px;padding:3px 8px;white-space:nowrap;border-radius:8px;${aktif === i ? 'background:' + Z.cerah + ';' : ''}${aktif != null && i > aktif ? 'opacity:.4;' : ''}">
        <b style="width:18px;color:${Z.gelap}">${i + 1}</b><b style="font-size:18px;width:100px">${m[0]}</b><span style="font-size:14px;color:#5E6769">${m[2]}</span></div>`).join('');
    };
    S.kadDora(null);

    S.pathKe = (d) => [{ x: d.x, y: d.y - 38 }, { x: AP.x, y: AP.y + 16 }, { x: AP.x, y: AP.y - 14 }, { x: AP.x, y: LALUAN_Y }, { x: ROUTER_X, y: LALUAN_Y }, KAUNTER];
    S.pathDari = (d) => S.pathKe(d).slice().reverse();

    S.langkahManual = null;
    const tahan = async (s, ms) => {
      if (S.manual) {
        await new Promise((res) => { S.langkahManual = res; });
        S.langkahManual = null;
        if (!s.hidup) throw MG.BATAL; // larian lama yang sudah dibatalkan tidak boleh disambung
      }
      else await s.tunggu(ms);
    };

    S.hantar = async (s, d, dari, label, siaran, laju) => {
      const p = MG.sampul(L.paket, { warna: Z.warna, label, siaran, saizLabel: 16 });
      const path = dari ? S.pathKe(d) : S.pathDari(d);
      const kerja = [MG.gerak(s, p, path, { laju })];
      if (siaran && dari) {
        // broadcast juga sampai ke peranti lain dalam VLAN 30 — mereka abaikan
        S.dev.filter((x) => x.ada && x !== d).forEach((x) => {
          const c = MG.sampul(L.paket, { warna: Z.warna, siaran: true, saiz: 0.6 });
          c.setAttribute('opacity', 0.45);
          kerja.push(MG.gerak(s, c, [path[0], path[1], { x: x.x, y: x.y - 38 }], { laju }).finally(() => c.remove()));
        });
      }
      try { await Promise.all(kerja); } finally { p.remove(); } // dibatalkan pun, sampul sendiri dibuang
    };

    // satu kitaran DORA penuh; jika dibatalkan di tengah, tawaran dan peranti dikembalikan
    S.dora = async (s, d, opt) => {
      const st = { sl: null };
      try { return await doraTeras(s, d, opt, st); } catch (e) {
        const sl = st.sl;
        if (sl && sl.dev === d && !d.ip && (sl.status === 'tawar' || sl.status === 'pajak')) { sl.status = 'bebas'; sl.dev = null; sl.sisa = 0; S.lukisSlot(sl); S.lukisLease(); }
        if (!d.ip) { d.ada = false; d.apipa = false; S.lukisDev(d); }
        throw e;
      }
    };

    async function doraTeras(s, d, opt, st) {
      opt = opt || {};
      const laju = opt.cepat ? 1100 : 420, jeda = opt.cepat ? 0 : 900;
      const tunjuk = (i) => { if (!opt.cepat) S.kadDora(i); };
      d.ada = true; d.apipa = false; S.lukisDev(d);
      if (!opt.cepat) await s.tween(300, (p) => d.g.setAttribute('opacity', p));
      tunjuk(0);
      if (o.padaMesej) o.padaMesej(0, d);
      await S.hantar(s, d, true, opt.cepat ? null : 'DISCOVER', true, laju);
      const sl = S.slot.find((x) => x.status === 'bebas');
      if (!sl) {
        // pool habis: tiada OFFER. Peranti cuba lagi, kemudian guna alamat link-local.
        MG.label(L.label, 995, 286, 'POOL HABIS — tiada OFFER', { fs: 20, garis: W.sekat, warnaTeks: W.sekat, isi: '#FDE2E2' });
        await s.tunggu(opt.cepat ? 300 : 900);
        await S.hantar(s, d, true, 'DISCOVER (cuba lagi)', true, laju);
        await s.tunggu(600);
        d.ip = '169.254.' + (20 + d.i * 7) + '.' + (40 + d.i * 11); d.apipa = true; S.lukisDev(d);
        if (o.padaGagal) o.padaGagal(d);
        return false;
      }
      sl.status = 'tawar'; sl.dev = d; st.sl = sl; S.lukisSlot(sl);
      await tahan(s, jeda);
      tunjuk(1); if (o.padaMesej) o.padaMesej(1, d, sl);
      await S.hantar(s, d, false, opt.cepat ? null : 'OFFER: ' + sl.ip, false, laju);
      await tahan(s, jeda);
      tunjuk(2); if (o.padaMesej) o.padaMesej(2, d, sl);
      await S.hantar(s, d, true, opt.cepat ? null : 'REQUEST: ' + sl.ip, true, laju);
      await tahan(s, jeda);
      tunjuk(3);
      sl.status = 'pajak'; sl.sisa = 1; S.lukisSlot(sl); S.lukisLease();
      await S.hantar(s, d, false, opt.cepat ? null : 'ACK', false, laju);
      d.ip = sl.ip; S.lukisDev(d);
      MG.senyap(MG.denyut(s, L.paket, d.x, d.y - 4, Z.warna, 40));
      if (o.padaMesej) o.padaMesej(4, d, sl);
      return true;
    }

    // pembaharuan lease: REQUEST + ACK terus (unicast), alamat sama
    S.perbaharui = async (s, d, sl) => {
      const p = MG.sampul(L.paket, { warna: Z.warna, label: 'REQUEST (baharui)', saiz: 0.8, saizLabel: 14 });
      await MG.gerak(s, p, S.pathKe(d), { laju: 700 });
      p.remove();
      const a = MG.sampul(L.paket, { warna: Z.warna, label: 'ACK', saiz: 0.8, saizLabel: 14 });
      await MG.gerak(s, a, S.pathDari(d), { laju: 700 });
      a.remove();
      if (sl.dev === d) { sl.sisa = 1; S.lukisSlot(sl); S.lukisLease(); }
      if (o.padaBaharu) o.padaBaharu(d, sl);
    };

    S.keluar = (d) => {
      d.ada = false; S.lukisDev(d);
      const sl = S.slot.find((x) => x.dev === d);
      if (sl) S.lukisSlot(sl);
      S.lukisLease();
    };
    S.setPool = (kecil) => {
      S.saizPool = kecil ? 6 : 24;
      S.dev.forEach((d) => { d.ada = false; d.ip = null; d.apipa = false; S.lukisDev(d); });
      MG.kosong(L.label); MG.kosong(L.paket);
      binaPool(); S.lukisLease();
    };

    binaPool(); S.lukisLease();
    return S;
  }

  const ketPas = (sl) => `Subnet /23 (255.255.254.0) · Gateway 192.168.32.1 · DNS OpenDNS`;
  const RSC_DHCP = {
    kod: ['/ip pool\nadd name=pool-vlan30 ranges=<mark>192.168.32.10-192.168.33.250</mark>', '/ip dhcp-server network\nadd address=192.168.32.0/23 dns-server=<mark>208.67.222.222,208.67.220.220</mark> \\\n    gateway=<mark>192.168.32.1</mark>'],
    fungsi: 'Julat alamat yang boleh dipinjamkan kepada Murid, serta gateway dan DNS yang diberi bersama. (Petikan sebenar SSeM.)',
  };

  const L1 = {
    tajuk: 'Empat mesej DORA',
    teks: 'Laptop baharu masuk WiFi Murid <b>tanpa alamat IP</b>. Ia bertanya dengan <b>broadcast</b>, dan DHCP server pada router menjawab. Empat mesej: <b>D</b>iscover, <b>O</b>ffer, <b>R</b>equest, <b>A</b>ck.',
    analogi: 'Kaunter pendaftaran pelawat: “Ada kaunter?” → “Ini pas no. 10” → “Saya ambil no. 10” → “Sah, ini pas anda dan peta bangunan.”',
    rsc: RSC_DHCP,
    bina(ctx) {
      const papan = ctx.papan({ mula: ['Murid 1', 'IP: tiada', 'Tanpa IP, laptop tidak boleh berhubung dengan sesiapa.', 'sekat'] });
      let S;
      const ket = ['Broadcast: “Ada DHCP server di sini?” Semua dalam VLAN 30 dengar; hanya router menjawab.', 'Router menawarkan alamat bebas daripada pool.', 'Laptop minta alamat itu secara rasmi.', 'Router sahkan. Alamat dipinjamkan untuk satu tempoh (lease).'];
      S = binaDhcp(ctx, {
        padaMesej: (i, d, sl) => {
          if (i < 4) papan.set(['DISCOVER', 'OFFER', 'REQUEST', 'ACK'][i], sl ? sl.ip : '?', ket[i]);
          else papan.set('Murid 1 dapat', sl.ip, ketPas(sl), 'benar');
          if (btnSeterus) btnSeterus.disabled = !S.manual || i >= 3;
        },
      });
      const main = () => ctx.jalan(async (s) => { S.setPool(false); await s.tunggu(400); await S.dora(s, S.dev[0]); });
      ctx.butang('↺ Ulang DORA', main, { utama: true });
      const t = ctx.togol('Satu mesej pada satu masa', false, (v) => { S.manual = v; btnSeterus.disabled = !v; main(); });
      void t;
      const btnSeterus = ctx.butang('Mesej seterusnya ▶', () => { if (S.langkahManual) S.langkahManual(); });
      btnSeterus.disabled = true;
      ctx.nota('DHCP juga memberi <b>gateway</b> (jalan keluar) dan <b>DNS</b> (pencari alamat laman) bersama IP.');
      main();
    },
  };

  const L2 = {
    tajuk: 'Banyak peranti, alamat berlainan',
    teks: 'Setiap peranti dapat alamat <b>berbeza</b> daripada pool. Alamat itu <b>dipinjam</b>, bukan dimiliki: laptop memperbaharui lease sebelum tamat. Apabila peranti terputus, lease tamat dan alamat <b>kembali ke pool</b>.',
    analogi: 'Pas pelawat sementara, bukan nombor plat JPJ yang kekal. Pas dipulangkan apabila tamat tempoh.',
    bina(ctx) {
      const papan = ctx.papan({ mula: ['Lease aktif', '0', 'Tambah peranti untuk melihat pool diisi.'] });
      ctx.lencanaSim('Masa lease dipercepat — simulasi');
      let S;
      const kemas = (teks2, jenis) => {
        const n = S.slot.filter((x) => x.status === 'pajak').length;
        papan.set('Lease aktif', n + ' alamat', teks2 || 'Bar ungu = baki lease. Diperbaharui pada separuh tempoh.', jenis);
      };
      S = binaDhcp(ctx, {
        padaMesej: (i) => { if (i === 4) kemas(); },
        padaBaharu: (d) => kemas(`${d.nama} perbaharui lease — alamat sama.`, 'benar'),
        padaTamat: (sl, d) => kemas(`Lease ${sl.ip} tamat. Alamat kembali ke pool.`, 'sekat'),
      });
      S.mulaLease(ctx.skop);
      const tambah = (n) => ctx.jalan(async (s) => {
        for (let k = 0; k < n; k++) {
          const d = S.dev.find((x) => !x.ada && !x.ip);
          if (!d) { kemas('Semua 12 tempat dalam simulasi sudah penuh.'); return; }
          await S.dora(s, d, { cepat: true });
        }
      });
      const k = ctx.kumpulan('Peranti');
      ctx.butang('+1 peranti', () => tambah(1), { dalam: k, warna: Z.warna });
      ctx.butang('+4 peranti', () => tambah(4), { dalam: k, warna: Z.warna });
      ctx.butang('Seorang murid balik', () => {
        const ada = S.dev.filter((x) => x.ada && x.ip);
        if (!ada.length) return;
        const d = ada[ada.length - 1];
        S.keluar(d);
        kemas(`${d.nama} keluar. Lease (merah) terus berkurang hingga tamat.`);
      }, { dalam: k });
      tambah(5);
    },
  };

  const L3 = {
    tajuk: 'Apabila pool habis',
    teks: 'Pool ialah julat alamat yang terhad. Di sini pool dikecilkan kepada <b>6 alamat</b>. Peranti ke-7 tidak mendapat OFFER, lalu menetapkan sendiri alamat <b>169.254.x.x</b> — dan <b>tiada Internet</b>.',
    analogi: 'Kaunter kehabisan pas. Pelawat ketujuh menulis nama sendiri pada kertas — tetapi pengawal tidak mengiktirafnya.',
    bina(ctx) {
      const papan = ctx.papan({ mula: ['Pool demo', '6 alamat', ''] });
      let S;
      S = binaDhcp(ctx, {
        poolKecil: true,
        padaMesej: (i, d, sl) => { if (i === 4) papan.set(d.nama + ' dapat', sl.ip, 'Masih ada alamat dalam pool.', 'benar'); },
        padaGagal: (d) => papan.set(d.nama, d.ip, 'Alamat link-local: tiada gateway, tiada Internet. Penyelesaian: pool lebih besar atau lease lebih pendek.', 'sekat'),
        padaTamat: (sl) => papan.set('Lease tamat', sl.ip, 'Alamat kembali ke pool — peranti seterusnya boleh dapat.', 'benar'),
      });
      S.mulaLease(ctx.skop);
      const isi = (n) => ctx.jalan(async (s) => {
        for (let k = 0; k < n; k++) {
          const d = S.dev.find((x) => !x.ada && !x.ip);
          if (!d) return;
          await S.dora(s, d, { cepat: true });
        }
      });
      ctx.butang('+1 peranti', () => isi(1), { warna: Z.warna, kumpulan: 'Cuba' });
      ctx.butang('Seorang murid balik', () => {
        const d = S.dev.filter((x) => x.ada && x.ip && !x.apipa).pop();
        if (d) { S.keluar(d); papan.set(d.nama + ' keluar', 'Tunggu', 'Alamat hanya kembali selepas lease tamat.'); }
      });
      ctx.butang('↺ Ulang senario', () => ctx.jalan(async (s) => { S.setPool(true); await s.tunggu(200); isi(7); }));
      ctx.nota('SSeM menggunakan subnet <b>/23</b> untuk Murid: kira-kira 497 alamat dalam pool.');
      isi(7);
    },
  };

  MG.daftarBab({
    id: 'dhcp', no: 2, tajuk: 'DHCP', sub: 'alamat IP secara automatik', status: 'siap',
    ringkas: 'DORA, pool alamat, lease yang diperbaharui, dan apa yang berlaku apabila pool habis.',
    langkah: [L1, L2, L3],
    ikonMenu(s) {
      for (let i = 0; i < 12; i++) el('rect', { x: 40 + (i % 6) * 38, y: 28 + Math.floor(i / 6) * 34, width: 32, height: 28, rx: 6, fill: i < 7 ? '#E9E1FD' : '#fff', stroke: i < 7 ? '#8B5CF6' : '#C7C1B4', 'stroke-width': 2 }, s);
    },
  });
})();
