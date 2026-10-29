/* Bab 6 — Laluan keluar: Mangle + jadual routing + dua WAN (MyGovNet & Unifi).
   Mangle hanya menampal pelekat (routing mark); jadual routing yang memilih jalan. Logik ikut eksport SSeM 22 Okt. */
(function () {
  'use strict';
  const { el, teks, W, KUMP } = MG;
  const G = MG.g;

  const SUMBER = {
    kewangan: { nama: 'Kewangan', vlan: 10, ip: '172.16.12.57', subnet: '172.16.12.0/24', z: KUMP.kewangan },
    staf: { nama: 'Staf', vlan: 20, ip: '172.16.22.57', subnet: '172.16.22.0/23', z: KUMP.staf },
    murid: { nama: 'Murid', vlan: 30, ip: '192.168.32.57', subnet: '192.168.32.0/23', z: KUMP.murid },
  };
  const DEST = {
    internet: { nama: 'Laman Internet', ip: 'laman web awam', lokal: false },
    intranet: { nama: 'Intranet MyGovNet', ip: '10.x.x.x (sistem kerajaan)', lokal: false, intranet: true },
    dalaman: { nama: 'VLAN lain', ip: '172.16.22.20 (PC Staf)', lokal: true },
  };
  const MANGLE_ASAL = [
    { id: 'm10', nama: 'VLAN 10 -> MyGovNet', syarat: 'src=172.16.12.0/24  dst=!LOCAL_SUBNETS', src: 'kewangan', tanda: 'to-MyGovNet', hidup: true },
    { id: 'm20', nama: 'VLAN 20 -> Unifi', syarat: 'src=172.16.22.0/23  dst=!LOCAL_SUBNETS', src: 'staf', tanda: 'to-Unifi', hidup: true },
    { id: 'm30', nama: 'VLAN 30 -> Unifi', syarat: 'src=192.168.32.0/23  dst=!LOCAL_SUBNETS', src: 'murid', tanda: 'to-Unifi', hidup: false },
  ];
  // Destinasi dalaman ikut sumber (Staf ke subnet sendiri tidak melalui router langsung).
  const ipDest = (dst, srcK) => (dst.lokal && srcK === 'staf' ? '172.16.12.20 (PC Kewangan)' : dst.ip);
  // Keputusan firewall forward SSeM bagi kes yang dipapar di sini (rujuk Bab 5); null = dibenarkan.
  function fwDrop(srcK, keluar) {
    if (srcK === 'murid' && keluar === 'mygovnet') return 'VLAN 30 -> Deny MyGovNet';
    if (keluar === 'dalaman') return srcK === 'murid' ? 'VLAN 30 -> Deny to VLAN 20' : 'DEFAULT DENY';
    return null;
  }
  const WARNA_TANDA = { 'to-MyGovNet': '#1D4ED8', 'to-Unifi': '#0F766E' };
  const LORONG_X = 944, BAS_Y = 224;
  const KELUAR = { mygovnet: { y: 300, nama: 'MyGovNet', sub: 'ether13-GITN-MyGovNet' }, dalaman: { y: 520, nama: 'Dalam sekolah', sub: 'VLAN lain · tiada WAN' }, unifi: { y: 760, nama: 'Unifi', sub: 'pppoe-unifi' } };

  function binaLaluan(ctx, o) {
    o = o || {};
    const S = { mangle: MANGLE_ASAL.map((r) => Object.assign({}, r)), baris: {}, jadual: {} };
    const lap = {};
    ['dasar', 'panel', 'label', 'paket'].forEach((n) => (lap[n] = ctx.lapisan(n)));

    // kad packet
    const kad = G(lap.dasar);
    el('rect', { x: 400, y: 20, width: 900, height: 124, rx: 16, fill: W.kad, stroke: W.garis, 'stroke-width': 2 }, kad);
    teks(kad, 422, 50, 'PACKET', { 'font-size': 16, 'font-weight': 800, fill: W.pudar, 'letter-spacing': 0.8 });
    const md = {};
    [['dari', 'Dari', 422, 86], ['ke', 'Ke', 422, 122], ['tanda', 'Pelekat', 860, 86], ['jadual', 'Jadual', 860, 122]].forEach((m) => {
      teks(kad, m[2], m[3], m[1], { 'font-size': 16, 'font-weight': 700, fill: W.pudar });
      md[m[0]] = teks(kad, m[2] + 80, m[3], '', { 'font-size': 19, 'font-weight': 700 });
    });

    // sumber
    const srcPos = {};
    Object.keys(SUMBER).forEach((k, i) => {
      const s = SUMBER[k], y0 = 250 + i * 205;
      MG.zon({ x: 26, y: y0, width: 300, height: 190, rx: 18, fill: s.z.cerah, stroke: s.z.warna, 'stroke-width': 2.5 }, lap.dasar);
      el('rect', { x: 44, y: y0 + 18, width: 90, height: 28, rx: 14, fill: s.z.warna }, lap.dasar);
      teks(lap.dasar, 89, y0 + 38, 'VLAN ' + s.vlan, { 'font-size': 16, 'font-weight': 800, fill: '#fff', 'text-anchor': 'middle' });
      teks(lap.dasar, 148, y0 + 40, s.nama, { 'font-size': 24, 'font-weight': 800 });
      MG.peranti(lap.dasar, 'laptop', 100, y0 + 112, { warna: s.z.warna, skrin: '#fff' });
      teks(lap.dasar, 158, y0 + 108, s.ip, { 'font-size': 16, class: 'mono' });
      teks(lap.dasar, 158, y0 + 132, s.subnet, { 'font-size': 14, class: 'mono', fill: W.pudar });
      srcPos[k] = { x: 326, y: y0 + 112 };
      el('line', { x1: 326, y1: y0 + 112, x2: 380, y2: y0 + 112, stroke: s.z.warna, 'stroke-width': 5 }, lap.dasar);
    });

    // router
    MG.rak(lap.dasar, 380, 160, 580, 712, 'ROUTER', 'MikroTik SSeM');
    MG.garisan(lap.dasar, [{ x: 395, y: srcPos.murid.y }, { x: 395, y: BAS_Y }, { x: LORONG_X, y: BAS_Y }, { x: LORONG_X, y: 850 }], { stroke: '#5E6B6E', 'stroke-width': 4, 'stroke-dasharray': '2 6', 'stroke-linecap': 'round' });

    // panel mangle
    const pm = G(lap.panel);
    el('rect', { x: 410, y: 244, width: 512, height: 286, rx: 12, fill: '#F4F2EC' }, pm);
    teks(pm, 428, 274, '1 · MANGLE — tampal pelekat', { 'font-size': 19, 'font-weight': 800 });
    teks(pm, 906, 274, 'klik untuk mati/hidup', { 'font-size': 13.5, fill: W.pudar, 'text-anchor': 'end' });
    S.mangle.forEach((r, i) => {
      const y = 290 + i * 76;
      const g = G(pm, { class: 'boleh-klik' });
      const kotak = el('rect', { x: 422, y, width: 488, height: 68, rx: 10, fill: '#fff', stroke: W.garis2, 'stroke-width': 2 }, g);
      const nama = teks(g, 438, y + 28, r.nama, { 'font-size': 19, 'font-weight': 800 });
      teks(g, 438, y + 52, r.syarat, { 'font-size': 13.5, class: 'mono', fill: W.pudar });
      const pel = G(g);
      el('rect', { x: 770, y: y + 10, width: 128, height: 26, rx: 6, fill: WARNA_TANDA[r.tanda] }, pel);
      teks(pel, 834, y + 28, r.tanda, { 'font-size': 14.5, 'font-weight': 800, fill: '#fff', 'text-anchor': 'middle' });
      const sebab = teks(g, 898, y + 56, '', { 'font-size': 14, 'font-weight': 700, 'text-anchor': 'end' });
      const lblMati = teks(g, 760, y + 28, 'DIMATIKAN', { 'font-size': 13, 'font-weight': 800, fill: W.sekat, 'text-anchor': 'end' });
      g.addEventListener('click', () => { r.hidup = !r.hidup; rupa(); if (o.padaUbah) o.padaUbah(); });
      S.baris[r.id] = { y: y + 34, kotak, nama, sebab, lblMati, g, pel };
    });
    teks(pm, 428, 522, 'VLAN 25, 98, 99 juga ditanda; VLAN 30 & 40 dimatikan di SSeM.', { 'font-size': 13.5, fill: W.pudar });
    function rupa() {
      S.mangle.forEach((r) => {
        const b = S.baris[r.id];
        b.g.setAttribute('opacity', r.hidup ? 1 : 0.55);
        b.nama.setAttribute('text-decoration', r.hidup ? 'none' : 'line-through');
        b.lblMati.setAttribute('visibility', r.hidup ? 'hidden' : 'visible');
      });
    }
    rupa();

    // panel routing
    const pr = G(lap.panel);
    el('rect', { x: 410, y: 548, width: 512, height: 304, rx: 12, fill: '#F4F2EC' }, pr);
    teks(pr, 428, 578, '2 · JADUAL ROUTING — pilih jalan', { 'font-size': 19, 'font-weight': 800 });
    const jadual = [
      { id: 'to-MyGovNet', y: 592, baris: [['0.0.0.0/0', '→ MyGovNet (ether13)', 'mygovnet']] },
      { id: 'to-Unifi', y: 656, baris: [['0.0.0.0/0', '→ pppoe-unifi', 'unifi']] },
      { id: 'main', y: 720, baris: [['VLAN sekolah', '→ terus (connected)', 'dalaman'], ['10.0.0.0/8', '→ MyGovNet', 'mygovnet-intranet'], ['0.0.0.0/0', '→ pppoe-unifi', 'unifi']] },
    ];
    jadual.forEach((j) => {
      const h = j.baris.length * 26 + 32;
      const kotak = el('rect', { x: 422, y: j.y, width: 488, height: h - 6, rx: 10, fill: '#fff', stroke: W.garis2, 'stroke-width': 2 }, pr);
      el('rect', { x: 432, y: j.y + 10, width: 128, height: 26, rx: 6, fill: WARNA_TANDA[j.id] || W.dakwat2 }, pr);
      teks(pr, 496, j.y + 28, j.id, { 'font-size': 14.5, 'font-weight': 800, fill: '#fff', 'text-anchor': 'middle' });
      const bt = j.baris.map((b, i) => {
        const y = j.y + 29 + i * 26;
        const t1 = teks(pr, 576, y, b[0], { 'font-size': 15, class: 'mono' });
        const t2 = teks(pr, 716, y, b[1], { 'font-size': 15, 'font-weight': 700 });
        return { k: b[2], t1, t2, y: y - 5 };
      });
      S.jadual[j.id] = { kotak, bt, y: j.y + (h - 6) / 2 };
    });

    // keluar
    Object.keys(KELUAR).forEach((k) => {
      const e = KELUAR[k];
      el('line', { x1: 960, y1: e.y, x2: 1040, y2: e.y, stroke: W.dakwat2, 'stroke-width': 6 }, lap.dasar);
      if (k === 'dalaman') {
        el('rect', { x: 1040, y: e.y - 56, width: 250, height: 112, rx: 16, fill: W.kad, stroke: W.dakwat2, 'stroke-width': 3 }, lap.dasar);
        teks(lap.dasar, 1165, e.y - 6, e.nama, { 'font-size': 22, 'font-weight': 800, 'text-anchor': 'middle' });
        teks(lap.dasar, 1165, e.y + 22, e.sub, { 'font-size': 15, 'text-anchor': 'middle', fill: W.pudar });
      } else {
        MG.awan(lap.dasar, 1170, e.y, 1.05, e.nama, k === 'mygovnet' ? '#E3EAFB' : '#DDF1EC');
        teks(lap.dasar, 1170, e.y + 64, e.sub, { 'font-size': 15, 'text-anchor': 'middle', class: 'mono', fill: W.dakwat2 });
      }
    });

    S.bersih = () => {
      MG.kosong(lap.paket); MG.kosong(lap.label);
      S.mangle.forEach((r) => { const b = S.baris[r.id]; b.sebab.textContent = ''; b.kotak.setAttribute('stroke', W.garis2); b.kotak.setAttribute('stroke-width', 2); });
      Object.values(S.jadual).forEach((j) => { j.kotak.setAttribute('stroke', W.garis2); j.kotak.setAttribute('stroke-width', 2); j.bt.forEach((b) => { b.t1.setAttribute('fill', W.dakwat); b.t2.setAttribute('fill', W.dakwat); }); });
      md.tanda.textContent = ''; md.jadual.textContent = '';
    };
    S.pulih = () => { S.mangle.forEach((r, i) => (r.hidup = MANGLE_ASAL[i].hidup)); rupa(); }; // objek sama: pengendali klik merujuknya

    S.hantar = async (s, srcK, destK) => {
      S.bersih();
      const src = SUMBER[srcK], dst = DEST[destK];
      md.dari.textContent = `${src.ip} (${src.nama})`;
      md.ke.textContent = ipDest(dst, srcK);
      md.tanda.textContent = '—'; md.jadual.textContent = '…';
      if (o.padaMula) o.padaMula(src, dst);
      const env = MG.sampul(lap.paket, { warna: src.z.warna, saiz: 1.1 });
      const p0 = srcPos[srcK];
      await MG.gerak(s, env, [{ x: p0.x - 30, y: p0.y }, { x: 395, y: p0.y }, { x: 395, y: BAS_Y }, { x: LORONG_X, y: BAS_Y }], { laju: 620 });
      // stesen 1: mangle (passthrough=no → berhenti pada pelekat pertama)
      let tanda = null;
      for (const r of S.mangle) {
        const b = S.baris[r.id];
        await MG.gerak(s, env, [{ x: env.x, y: env.y }, { x: LORONG_X, y: b.y }], { laju: 520, ease: MG.ease.io });
        b.kotak.setAttribute('stroke', W.dakwat); b.kotak.setAttribute('stroke-width', 3);
        await s.tunggu(300);
        let sebab = null;
        if (!r.hidup) sebab = 'dimatikan';
        else if (r.src !== srcK) sebab = '✗ sumber lain';
        else if (dst.lokal) sebab = '✗ destinasi dalaman';
        if (sebab) {
          b.sebab.textContent = sebab; b.sebab.setAttribute('fill', W.pudar);
          await s.tunggu(300);
          b.kotak.setAttribute('stroke', W.garis2); b.kotak.setAttribute('stroke-width', 2);
          continue;
        }
        b.sebab.textContent = '✓ padan'; b.sebab.setAttribute('fill', W.benar);
        b.kotak.setAttribute('stroke', WARNA_TANDA[r.tanda]); b.kotak.setAttribute('stroke-width', 4);
        tanda = r.tanda;
        await s.tunggu(250);
        env.setPelekat(tanda, WARNA_TANDA[tanda]);
        md.tanda.textContent = tanda; md.tanda.setAttribute('fill', WARNA_TANDA[tanda]);
        await s.tunggu(700);
        break;
      }
      if (!tanda) { md.tanda.textContent = 'tiada'; md.tanda.setAttribute('fill', W.pudar); }
      // stesen 2: jadual routing
      const jid = tanda || 'main';
      md.jadual.textContent = jid;
      const j = S.jadual[jid];
      await MG.gerak(s, env, [{ x: env.x, y: env.y }, { x: LORONG_X, y: j.y }], { laju: 520, ease: MG.ease.io });
      j.kotak.setAttribute('stroke', WARNA_TANDA[jid] || W.dakwat); j.kotak.setAttribute('stroke-width', 4);
      let arah;
      if (jid === 'to-MyGovNet') arah = 'mygovnet';
      else if (jid === 'to-Unifi') arah = 'unifi';
      else arah = dst.lokal ? 'dalaman' : dst.intranet ? 'mygovnet-intranet' : 'unifi';
      const baris = j.bt.find((b) => b.k === arah) || j.bt[0];
      baris.t1.setAttribute('fill', W.aksen); baris.t2.setAttribute('fill', W.aksen);
      await s.tunggu(800);
      const keluar = arah === 'mygovnet-intranet' ? 'mygovnet' : arah;
      const e = KELUAR[keluar];
      if (fwDrop(srcK, keluar)) {
        // routing sudah memilih jalan, tetapi firewall forward menggugurkannya sebelum keluar
        await MG.gerak(s, env, [{ x: LORONG_X, y: j.y }, { x: LORONG_X, y: e.y }], { laju: 560 });
        await MG.cop(s, lap.label, 1000, e.y - (keluar === 'dalaman' ? 84 : 56), 'DROP · firewall', 'sekat');
      } else await MG.gerak(s, env, [{ x: LORONG_X, y: j.y }, { x: LORONG_X, y: e.y }, { x: 1060, y: e.y }], { laju: 560 });
      if (o.padaTiba) o.padaTiba(src, dst, tanda, jid, keluar, srcK);
      return keluar;
    };
    return S;
  }

  function ringkasan(papan) {
    return {
      padaMula: (src, dst) => papan.set(`${src.nama} → ${dst.nama}`, '…', 'Stesen 1 Mangle, stesen 2 routing.'),
      padaTiba: (src, dst, tanda, jid, keluar, srcK) => {
        const nama = { mygovnet: 'MyGovNet', unifi: 'Unifi', dalaman: 'Dalaman' }[keluar];
        let ket = tanda ? `Pelekat <b>${tanda}</b> → jadual ${jid}.` : `Tiada pelekat → jadual <b>main</b> → ${nama}.`;
        const drop = fwDrop(srcK, keluar);
        if (drop) ket += ` Firewall “${drop}” → DROP.`;
        if (srcK === 'staf' && dst.intranet) ket += ' (10.0.0.0/8 tiada dalam LOCAL_SUBNETS.)';
        papan.set(`${src.nama} → ${dst.nama}`, drop ? 'DROP' : nama, ket, drop ? 'sekat' : 'benar');
      },
    };
  }

  const RSC = {
    kod: ['/ip firewall mangle\nadd action=<mark>mark-routing</mark> chain=prerouting comment="VLAN 10 -> MyGovNet" \\\n    dst-address-list=<mark>!LOCAL_SUBNETS</mark> new-routing-mark=<mark>to-MyGovNet</mark> \\\n    passthrough=no src-address=172.16.12.0/24', '/ip route\nadd comment="PBR Route -> Unifi" dst-address=0.0.0.0/0 \\\n    gateway=pppoe-unifi routing-table=<mark>to-Unifi</mark>'],
    fungsi: 'Mangle hanya menanda; route dalam jadual to-Unifi / to-MyGovNet yang menghantar keluar. (Petikan sebenar; gateway MyGovNet tidak dipaparkan.)',
  };

  function langkah(tajuk, teks2, auto, extra) {
    return Object.assign({
      tajuk, teks: teks2, rsc: RSC,
      bina(ctx) {
        const papan = ctx.papan({ mula: ['Laluan keluar', '—', 'Pilih sumber dan destinasi.'] });
        const cb = ringkasan(papan);
        const S = binaLaluan(ctx, cb);
        let src = auto ? auto[0] : 'murid', dst = auto ? auto[1] : 'intranet';
        const hantar = () => ctx.jalan((s) => S.hantar(s, src, dst));
        ctx.segmen('Sumber', [{ v: 'kewangan', t: 'Kewangan' }, { v: 'staf', t: 'Staf' }, { v: 'murid', t: 'Murid' }], src, (v) => { src = v; hantar(); });
        ctx.segmen('Destinasi', [{ v: 'internet', t: 'Internet' }, { v: 'intranet', t: 'MyGovNet 10.x' }, { v: 'dalaman', t: 'VLAN lain' }], dst, (v) => { dst = v; hantar(); });
        const k = ctx.kumpulan();
        ctx.butang('▶ Hantar packet', hantar, { utama: true, dalam: k });
        ctx.butang('↺ Pulihkan tetapan SSeM', () => { S.pulih(); hantar(); }, { dalam: k });
        cb.padaUbah = hantar; // rule Mangle diklik semasa packet bergerak: hantar semula
        if (this.nota) ctx.nota(this.nota);
        hantar();
      },
    }, extra || {});
  }

  const L1 = langkah('Dua jalan keluar',
    'SSeM ada <b>dua talian WAN</b>: MyGovNet dan Unifi. Router memilih dalam dua langkah: <b>Mangle</b> menampal pelekat, kemudian <b>jadual routing</b> membaca pelekat untuk memilih jalan.',
    ['kewangan', 'internet'], { analogi: 'Petugas di pintu menampal pelekat destinasi pada sampul. Papan arah selepasnya membaca pelekat dan menunjukkan jalan. Petugas tidak memandu.' });
  const L2 = langkah('Staf: pelekat to-Unifi',
    'Trafik Internet Staf ditanda <b>to-Unifi</b>. Jadual to-Unifi hanya ada satu route: semua keluar melalui <b>pppoe-unifi</b>.', ['staf', 'internet']);
  const L3 = langkah('Murid: tiada pelekat',
    'Rule Mangle Murid <b>dimatikan</b> di SSeM. Tanpa pelekat, packet menggunakan jadual <b>main</b> — default route ke Unifi. Klik rule 3 untuk hidupkan: hasil sama, sebab berbeza.', ['murid', 'internet'],
    { nota: 'Mangle bukan firewall: ia tidak membenarkan atau menyekat apa-apa.' });
  const L4 = langkah('Destinasi dalaman: tiada pelekat',
    'Setiap rule Mangle bersyarat <b>dst=!LOCAL_SUBNETS</b>. Trafik ke VLAN lain dalam sekolah tidak ditanda; jadual main menghalakannya terus — <b>tidak keluar WAN</b>. Tetapi firewall yang memutuskan. Kewangan → PC Staf (contohnya folder kongsi) tiada rule yang membenarkannya, jadi jatuh ke <b>DEFAULT DENY</b>.', ['kewangan', 'dalaman'],
    { nota: 'Routing memilih jalan; firewall memberi kebenaran. Laluan wujud tidak bermaksud dibenarkan.<br><br><b>Contoh: printer.</b> Printer berada dalam VLAN Staf. Sejak 29 Okt 2026, SSeM ada tiga rule <b>Kewangan -> VLAN 20</b> sebelum DEFAULT DENY: print (TCP 9100, 631, 515), status printer (UDP 161) dan ping. Kewangan boleh print ke printer dalam VLAN 20. Trafik lain, seperti folder kongsi PC Staf, masih jatuh ke DEFAULT DENY.' });
  const L5 = langkah('Cuba sendiri',
    'Pilih sumber dan destinasi. Cuba <b>Murid → MyGovNet 10.x</b>: jadual main menghala ke MyGovNet, tetapi firewall SSeM menyekatnya. Routing pilih jalan; firewall beri kebenaran.', ['murid', 'intranet']);

  MG.daftarBab({
    id: 'laluan', no: 6, tajuk: 'Laluan keluar', sub: 'Mangle + routing + dua WAN', status: 'siap',
    ringkas: 'Mangle tampal pelekat, jadual routing pilih MyGovNet atau Unifi.',
    langkah: [L1, L2, L3, L4, L5],
    ikonMenu(s) {
      el('path', { d: 'M30 60 H140 C180 60 180 26 220 26 H270 M140 60 C180 60 180 92 220 92 H270', fill: 'none', stroke: '#3B4648', 'stroke-width': 6 }, s);
      el('rect', { x: 110, y: 46, width: 54, height: 26, rx: 6, fill: '#1D4ED8' }, s);
    },
  });
})();
