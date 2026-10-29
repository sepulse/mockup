/* Bab 5 — Firewall. Buku rule forward SSeM (subset sebenar, susunan sebenar).
   Packet diperiksa dari atas; rule pertama yang padan memutuskan. Rule boleh dimatikan dan disusun semula. */
(function () {
  'use strict';
  const { el, teks, W, KUMP } = MG;
  const G = MG.g;

  const NAMA_SUB = { staf: 'Staf', murid: 'Murid', tetamu: 'Tetamu', kewangan: 'Kewangan', internet: 'Internet', hq: 'HQ', mygovnet: 'MyGovNet' };
  const RULE_ASAL = [
    { id: 'est', nama: 'Allow Established/Related', syarat: 'connection-state=established,related', aksi: 'accept',
      semak: (p) => (p.state !== 'new' ? null : 'connection baharu') },
    { id: 'v40mg', nama: 'VLAN 40 -> Deny MyGovNet', syarat: 'src=192.168.42.0/24  out=ether13-GITN-MyGovNet', aksi: 'drop',
      semak: (p) => (p.src !== 'tetamu' ? 'sumber bukan Tetamu' : p.out !== 'mygovnet' ? 'tidak keluar ke MyGovNet' : null) },
    { id: 'v30mg', nama: 'VLAN 30 -> Deny MyGovNet', syarat: 'src=192.168.32.0/23  out=ether13-GITN-MyGovNet', aksi: 'drop',
      semak: (p) => (p.src !== 'murid' ? 'sumber bukan Murid' : p.out !== 'mygovnet' ? 'tidak keluar ke MyGovNet' : null) },
    { id: 'lanwan', nama: 'Allow LAN to WAN', syarat: 'in-interface-list=LAN  out-interface-list=WAN', aksi: 'accept',
      semak: (p) => (p.in !== 'LAN' ? 'masuk dari WAN' : (p.out !== 'unifi' && p.out !== 'mygovnet') ? 'tidak keluar ke WAN' : null) },
    { id: 'v30v20', nama: 'VLAN 30 -> Deny to VLAN 20', syarat: 'src=192.168.32.0/23  dst=172.16.22.0/23', aksi: 'drop',
      semak: (p) => (p.src !== 'murid' ? 'sumber bukan Murid' : p.dst !== 'staf' ? 'destinasi bukan Staf' : null) },
    { id: 'v40all', nama: 'VLAN 40 -> Deny ALL local VLANs', syarat: 'src=192.168.42.0/24  dst=LOCAL_SUBNETS', aksi: 'drop',
      semak: (p) => (p.src !== 'tetamu' ? 'sumber bukan Tetamu' : !p.dstLokal ? 'destinasi bukan VLAN dalaman' : null) },
    { id: 'wg', nama: 'Allow Site LAN to HQ WireGuard', syarat: 'in-interface-list=LAN  out=wireguard1', aksi: 'accept',
      semak: (p) => (p.in !== 'LAN' ? 'masuk dari WAN' : p.out !== 'wg' ? 'bukan ke tunnel HQ' : null) },
    // ditambah di SSeM 29 Okt 2026 (eksport 11:12): Kewangan ke VLAN 20 untuk print sahaja
    { id: 'kewprint', nama: 'Kewangan -> VLAN 20 (print)', syarat: 'src=172.16.12.0/24  dst=172.16.22.0/23  tcp 9100,631,515', aksi: 'accept',
      semak: (p) => (p.src !== 'kewangan' ? 'sumber bukan Kewangan' : p.dst !== 'staf' ? 'destinasi bukan VLAN 20' : !p.print ? 'bukan port print' : null) },
    { id: 'deny', nama: 'DEFAULT DENY', syarat: '(semua yang belum padan)', aksi: 'drop', semak: () => null },
  ];

  const PACKET = [
    { id: 'stafnet', t: 'Staf → Internet', src: 'staf', dari: '172.16.22.57 (Staf)', ke: 'laman web di Internet', in: 'LAN', out: 'unifi', keluar: 'pppoe-unifi', state: 'new' },
    { id: 'muridstaf', t: 'Murid → PC Staf', src: 'murid', dst: 'staf', dari: '192.168.32.57 (Murid)', ke: '172.16.22.20 (PC Staf)', in: 'LAN', out: 'lan', keluar: 'VLAN20-Staff', dstLokal: true, state: 'new' },
    { id: 'balas', t: 'Balasan web → Murid', src: 'internet', dst: 'murid', dari: 'laman web (Internet)', ke: '192.168.32.57 (Murid)', in: 'WAN', out: 'lan', keluar: 'VLAN30-Student', dstLokal: true, state: 'established' },
    { id: 'luar', t: 'Internet → PC Staf (baharu)', src: 'internet', dst: 'staf', dari: 'alamat tidak dikenali (Internet)', ke: '172.16.22.20 (PC Staf)', in: 'WAN', out: 'lan', keluar: 'VLAN20-Staff', dstLokal: true, state: 'new' },
    { id: 'tetamukew', t: 'Tetamu → PC Kewangan', src: 'tetamu', dst: 'kewangan', dari: '192.168.42.30 (Tetamu)', ke: '172.16.12.20 (Kewangan)', in: 'LAN', out: 'lan', keluar: 'VLAN10-Kewangan', dstLokal: true, state: 'new' },
    { id: 'muridmg', t: 'Murid → MyGovNet', src: 'murid', dst: 'mygovnet', dari: '192.168.32.57 (Murid)', ke: 'sistem dalam MyGovNet', in: 'LAN', out: 'mygovnet', keluar: 'ether13-GITN-MyGovNet', state: 'new' },
    { id: 'hq', t: 'Staf → Server HQ', src: 'staf', dst: 'hq', dari: '172.16.22.57 (Staf)', ke: '192.168.0.x (rangkaian HQ)', in: 'LAN', out: 'wg', keluar: 'wireguard1', state: 'new' },
    { id: 'kewprint', t: 'Kewangan → printer Staf', src: 'kewangan', dst: 'staf', print: true, dari: '172.16.12.20 (Kewangan)', ke: 'printer dalam VLAN 20 · TCP 9100', in: 'LAN', out: 'lan', keluar: 'VLAN20-Staff', dstLokal: true, state: 'new' },
    { id: 'kewstaf', t: 'Kewangan → PC Staf', src: 'kewangan', dst: 'staf', dari: '172.16.12.20 (Kewangan)', ke: '172.16.22.20 (PC Staf) · folder kongsi', in: 'LAN', out: 'lan', keluar: 'VLAN20-Staff', dstLokal: true, state: 'new' },
  ];
  const PK = Object.fromEntries(PACKET.map((p) => [p.id, p]));
  const WARNA_SRC = { staf: KUMP.staf.warna, murid: KUMP.murid.warna, tetamu: KUMP.tetamu.warna, kewangan: KUMP.kewangan.warna, internet: W.dakwat2 };

  const BARIS_Y0 = 226, BARIS_H = 72, LORONG_X = 1000;

  function binaFw(ctx, o) {
    o = o || {};
    const S = { rule: RULE_ASAL.map((r) => Object.assign({ hidup: true }, r)), baris: {} };
    const lapBuku = ctx.lapisan('buku'), lapPk = ctx.lapisan('pk'), lapLabel = ctx.lapisan('label'), lapPaket = ctx.lapisan('paket');

    // kad packet di atas
    const kadPk = G(lapPk);
    el('rect', { x: 400, y: 20, width: 900, height: 182, rx: 16, fill: W.kad, stroke: W.garis, 'stroke-width': 2 }, kadPk);
    teks(kadPk, 422, 50, 'PACKET YANG DIPERIKSA', { 'font-size': 16, 'font-weight': 800, fill: W.pudar, 'letter-spacing': 0.8 });
    const medan = {};
    [['dari', 'Dari', 422, 86], ['ke', 'Ke', 422, 122], ['masuk', 'Masuk dari', 422, 158], ['keluar', 'Keluar ke', 860, 158], ['state', 'Keadaan', 860, 86]].forEach((m) => {
      teks(kadPk, m[2], m[3], m[1], { 'font-size': 16, 'font-weight': 700, fill: W.pudar });
      medan[m[0]] = teks(kadPk, m[2] + 112, m[3], '', { 'font-size': 19, 'font-weight': 700 });
    });
    teks(kadPk, 422, 190, 'Chain forward · 9 rule forward SSeM, ikut susunan sebenar (rule DoH/QUIC dan beberapa allow khusus tidak dipaparkan)', { 'font-size': 13.5, fill: W.pudar });

    // tajuk lajur
    teks(lapBuku, 40, 222, 'BUKU RULE FIREWALL', { 'font-size': 16, 'font-weight': 800, fill: W.pudar, 'letter-spacing': 0.8 });
    teks(lapBuku, 892, 222, 'klik untuk mati/hidup · ▲▼ susun', { 'font-size': 14, fill: W.pudar, 'text-anchor': 'end' });
    // tong buang & pintu keluar
    const tong = G(lapBuku);
    el('path', { d: 'M1090 812 h120 l-12 62 h-96 z', fill: '#FDE2E2', stroke: W.sekat, 'stroke-width': 3 }, tong);
    el('rect', { x: 1080, y: 798, width: 140, height: 16, rx: 6, fill: W.sekat }, tong);
    teks(tong, 1150, 856, 'DIBUANG', { 'font-size': 18, 'font-weight': 900, fill: W.sekat, 'text-anchor': 'middle' });
    el('line', { x1: LORONG_X, y1: 214, x2: LORONG_X, y2: 860, stroke: W.garis2, 'stroke-width': 3, 'stroke-dasharray': '4 8' }, tong);

    function lukisBaris() {
      S.rule.forEach((r, i) => {
        let b = S.baris[r.id];
        if (!b) {
          b = S.baris[r.id] = { g: G(lapBuku), y: BARIS_Y0 + i * BARIS_H };
          const g = b.g;
          b.kotak = el('rect', { x: 30, y: 0, width: 870, height: BARIS_H - 8, rx: 12, fill: '#fff', stroke: W.garis2, 'stroke-width': 2 }, g);
          b.no = teks(g, 60, 44, '', { 'font-size': 22, 'font-weight': 900, 'text-anchor': 'middle', fill: W.pudar });
          const klik = G(g, { class: 'boleh-klik' });
          el('rect', { x: 84, y: 4, width: 600, height: BARIS_H - 16, fill: 'transparent' }, klik);
          b.nama = teks(klik, 92, 32, r.nama, { 'font-size': 21, 'font-weight': 800 });
          b.syarat = teks(klik, 92, 56, r.syarat, { 'font-size': 14.5, class: 'mono', fill: W.pudar });
          klik.addEventListener('click', () => { r.hidup = !r.hidup; kemasRupa(); if (o.padaUbah) o.padaUbah(); });
          const ak = r.aksi === 'accept';
          el('rect', { x: 700, y: 20, width: 104, height: 32, rx: 8, fill: ak ? '#DCEFE9' : '#FDE2E2', stroke: ak ? W.benar : W.sekat, 'stroke-width': 2 }, g);
          teks(g, 752, 42, ak ? 'ACCEPT' : 'DROP', { 'font-size': 17, 'font-weight': 900, 'text-anchor': 'middle', fill: ak ? W.benar : W.sekat });
          b.sebab = teks(g, 684, 32, '', { 'font-size': 15, 'font-weight': 700, 'text-anchor': 'end' });
          [['▲', -1, 4], ['▼', 1, 34]].forEach((a) => {
            const t = G(g, { class: 'boleh-klik' });
            el('rect', { x: 820, y: a[2], width: 66, height: 28, rx: 7, fill: W.kertas2, stroke: W.garis2, 'stroke-width': 1.5, class: 'sorot' }, t);
            teks(t, 853, a[2] + 20, a[0], { 'font-size': 15, 'text-anchor': 'middle', fill: W.dakwat2 });
            t.addEventListener('click', () => { S.alih(r.id, a[1]); if (o.padaUbah) o.padaUbah(); });
          });
        }
        b.no.textContent = String(i + 1);
      });
      kemasRupa();
    }
    function kemasRupa() {
      S.rule.forEach((r) => {
        const b = S.baris[r.id];
        b.g.setAttribute('opacity', r.hidup ? 1 : 0.38);
        b.nama.setAttribute('text-decoration', r.hidup ? 'none' : 'line-through');
      });
    }
    S.letak = (anim) => {
      const sk = ctx.skop;
      S.rule.forEach((r, i) => {
        const b = S.baris[r.id], y1 = BARIS_Y0 + i * BARIS_H, y0 = b.y;
        b.y = y1;
        if (!anim || y0 === y1) MG.pindah(b.g, 0, y1);
        else MG.senyap(sk.tween(450, (p) => MG.pindah(b.g, 0, y0 + (y1 - y0) * p)));
        b.no.textContent = String(i + 1);
      });
    };
    S.alih = (id, arah) => {
      const i = S.rule.findIndex((r) => r.id === id), j = i + arah;
      if (j < 0 || j >= S.rule.length) return;
      [S.rule[i], S.rule[j]] = [S.rule[j], S.rule[i]];
      S.bersih(); S.letak(true);
    };
    S.pulih = () => {
      // objek rule yang sama (pengendali klik merujuknya) — hanya susunan dan hidup dipulihkan
      S.rule = RULE_ASAL.map((r) => S.rule.find((x) => x.id === r.id));
      S.rule.forEach((r) => (r.hidup = true));
      S.bersih(); S.letak(true); kemasRupa();
    };
    S.bersih = () => {
      MG.kosong(lapPaket); MG.kosong(lapLabel);
      S.rule.forEach((r) => { const b = S.baris[r.id]; b.sebab.textContent = ''; b.kotak.setAttribute('stroke', W.garis2); b.kotak.setAttribute('stroke-width', 2); b.kotak.setAttribute('fill', '#fff'); });
      kemasRupa();
    };

    S.semak = async (s, pk) => {
      S.bersih();
      medan.dari.textContent = pk.dari; medan.ke.textContent = pk.ke;
      medan.masuk.textContent = pk.in === 'LAN' ? 'LAN (VLAN sekolah)' : 'WAN (Internet)';
      medan.keluar.textContent = pk.keluar;
      medan.state.textContent = pk.state === 'new' ? 'connection baharu' : 'balasan (established)';
      medan.state.setAttribute('fill', pk.state === 'new' ? W.dakwat : W.benar);
      const w = WARNA_SRC[pk.src] || W.dakwat2;
      const env = MG.sampul(lapPaket, { warna: w, saiz: 1.25 });
      env.ke(LORONG_X, 214);
      if (o.padaMula) o.padaMula(pk);
      for (let i = 0; i < S.rule.length; i++) {
        const r = S.rule[i], b = S.baris[r.id], yc = BARIS_Y0 + i * BARIS_H + 35;
        await MG.gerak(s, env, [{ x: env.x, y: env.y }, { x: LORONG_X, y: yc }], { laju: 520, ease: MG.ease.io });
        b.kotak.setAttribute('stroke', W.dakwat); b.kotak.setAttribute('stroke-width', 3);
        await s.tunggu(260);
        if (!r.hidup) {
          b.sebab.textContent = 'dimatikan — dilangkau'; b.sebab.setAttribute('fill', W.pudar);
          b.kotak.setAttribute('stroke', W.garis2); b.kotak.setAttribute('stroke-width', 2);
          continue;
        }
        const sebab = r.semak(pk);
        if (sebab) {
          b.sebab.textContent = '✗ ' + sebab; b.sebab.setAttribute('fill', W.pudar);
          await s.tunggu(380);
          b.kotak.setAttribute('stroke', W.garis2); b.kotak.setAttribute('stroke-width', 2);
          continue;
        }
        // padan — keputusan terminal
        const ak = r.aksi === 'accept';
        b.sebab.textContent = '✓ PADAN'; b.sebab.setAttribute('fill', ak ? W.benar : W.sekat);
        b.kotak.setAttribute('stroke', ak ? W.benar : W.sekat); b.kotak.setAttribute('stroke-width', 4);
        b.kotak.setAttribute('fill', ak ? '#F0FAF7' : '#FEF2F2');
        S.rule.slice(i + 1).forEach((x) => S.baris[x.id].g.setAttribute('opacity', 0.25));
        if (ak) {
          await MG.cop(s, lapLabel, 1180, yc > 790 ? yc - 60 : yc, 'ACCEPT', 'benar');
          await MG.gerak(s, env, [{ x: LORONG_X, y: yc }, { x: 1290, y: yc }], { laju: 520 });
          MG.label(lapLabel, 1150, yc > 790 ? yc - 110 : yc > 700 ? yc - 50 : yc + 46, '→ ' + pk.keluar, { fs: 16, garis: W.benar, warnaTeks: W.benar });
        } else {
          await MG.cop(s, lapLabel, 1180, yc > 790 ? yc - 60 : yc, 'DROP', 'sekat'); // baris bawah: cop di atas tong supaya DIBUANG kelihatan
          await MG.gerak(s, env, [{ x: LORONG_X, y: yc }, { x: 1150, y: Math.max(yc, 780) }, { x: 1150, y: 830 }], { laju: 520 });
          env.remove();
        }
        if (o.padaKeputusan) o.padaKeputusan(pk, r, i);
        return { rule: r, i };
      }
      return null;
    };

    lukisBaris(); S.letak(false);
    return S;
  }

  function kawalanPacket(ctx, S, papan, mula) {
    let semasa = mula;
    const jalan = (id) => { semasa = id; return ctx.jalan((s) => S.semak(s, PK[id])); };
    jalan.semasa = () => semasa;
    const k = ctx.kumpulan('Pilih packet');
    k.baris.style.display = 'grid'; k.baris.style.gridTemplateColumns = '1fr 1fr'; k.baris.style.gap = '8px';
    PACKET.forEach((p) => {
      const b = ctx.butang(p.t, () => jalan(p.id), { dalam: k, warna: WARNA_SRC[p.src] });
      b.style.fontSize = '18px'; b.style.padding = '9px 10px'; b.style.textAlign = 'left';
    });
    const k2 = ctx.kumpulan();
    ctx.butang('↺ Pulihkan susunan SSeM', () => { S.pulih(); jalan(semasa || 'muridmg'); }, { dalam: k2 });
    void papan;
    return jalan;
  }

  const papanKeputusan = (papan) => ({
    padaMula: (pk) => papan.set(pk.t, '…', 'Diperiksa dari rule 1 ke bawah.'),
    padaKeputusan: (pk, r, i) => papan.set(pk.t, r.aksi === 'accept' ? 'ACCEPT' : 'DROP', `Rule ${i + 1}: ${r.nama}. Rule di bawahnya tidak dibaca.`, r.aksi === 'accept' ? 'benar' : 'sekat'),
  });

  const RSC_FW = {
    kod: ['/ip firewall filter\nadd action=accept chain=forward comment=<mark>"Allow Established/Related"</mark> \\\n    connection-state=established,related', 'add action=drop chain=forward comment="VLAN 30 -> Deny to VLAN 20" \\\n    dst-address=172.16.22.0/23 src-address=192.168.32.0/23', 'add action=accept chain=forward comment=<mark>"Kewangan -> VLAN 20 (print)"</mark> \\\n    dst-address=172.16.22.0/23 dst-port=9100,631,515 protocol=tcp \\\n    src-address=172.16.12.0/24', 'add action=drop chain=forward comment=\\\n    <mark>"DEFAULT DENY - Drop all unmatched forward traffic"</mark>'],
    fungsi: 'Chain forward menapis trafik yang melalui router (antara VLAN, ke WAN, ke tunnel). Chain input — trafik ke router sendiri — ialah buku berasingan. (Petikan sebenar SSeM.)',
  };

  function langkah(tajuk, teks2, mula, extra) {
    return Object.assign({
      tajuk, teks: teks2, rsc: RSC_FW,
      bina(ctx) {
        const papan = ctx.papan({ mula: ['Firewall', '—', 'Pilih packet.'] });
        const cb = papanKeputusan(papan);
        const S = binaFw(ctx, cb);
        const jalan = kawalanPacket(ctx, S, papan, mula);
        // ubah rule semasa packet diperiksa: batalkan dan periksa semula dengan buku yang baharu
        cb.padaUbah = () => { const x = jalan.semasa(); if (x) jalan(x); };
        if (this.persediaan) this.persediaan(ctx, S, papan, jalan);
        else if (mula) jalan(mula);
      },
    }, extra || {});
  }

  const L1 = langkah('Dibaca dari atas ke bawah',
    'Firewall membaca rule <b>dari atas</b>. Rule pertama yang <b>padan</b> menentukan keputusan: <b>ACCEPT</b> atau <b>DROP</b>. Rule di bawahnya tidak dibaca lagi.',
    'stafnet', { analogi: 'Pengawal pintu dengan buku peraturan bernombor: baca dari baris 1, berhenti pada baris pertama yang kena.' });
  const L2 = langkah('Rule sekat yang khusus',
    'Murid cuba membuka PC Staf. Rule <b>VLAN 30 → Deny to VLAN 20</b> padan dahulu: <b>DROP</b>. Inilah yang memisahkan Murid daripada Staf — bukan VLAN.', 'muridstaf');
  const L3 = langkah('Balasan dibenarkan',
    'Apabila Murid membuka laman web, <b>balasan</b> datang dari Internet. Rule 1 <b>Allow Established/Related</b> menerimanya kerana connection itu <b>dimulakan oleh Murid</b>. Ia bukan pintu terbuka untuk semua.', 'balas');
  const L4 = langkah('Tiada padanan → DEFAULT DENY',
    'Connection <b>baharu</b> dari Internet ke PC Staf tidak sepadan dengan mana-mana rule kebenaran. Ia jatuh ke rule terakhir: <b>DEFAULT DENY</b>. Rule terakhir ialah jaring keselamatan.', 'luar');
  const L5 = langkah('Susunan rule penting',
    'Kita alihkan <b>Allow LAN to WAN</b> ke atas <b>VLAN 30 → Deny MyGovNet</b>. Murid ke MyGovNet kini <b>DITERIMA</b> — rule sekat tidak sempat dibaca. Tekan <b>Pulihkan</b> untuk lihat beza.', null, {
      persediaan(ctx, S, papan, jalan) {
        ctx.jalan(async (s) => {
          papan.set('Ubah susunan', '…', 'Allow LAN to WAN dinaikkan satu baris.');
          await s.tunggu(700);
          S.alih('lanwan', -1);
          await s.tunggu(900);
          jalan('muridmg');
        });
      },
    });
  const L6 = langkah('Cuba sendiri',
    'Pilih packet. <b>Klik</b> nama rule untuk mematikannya. Gunakan <b>▲▼</b> untuk mengubah susunan. Cuba: matikan rule 5, kemudian hantar Murid → PC Staf. Apa yang menyekatnya sekarang?', 'tetamukew');

  MG.daftarBab({
    id: 'firewall', no: 5, tajuk: 'Firewall', sub: 'rule pertama yang padan', status: 'siap',
    ringkas: 'Buku rule sebenar SSeM. Ubah susunan dan lihat keputusan berubah.',
    langkah: [L1, L2, L3, L4, L5, L6],
    ikonMenu(s) {
      for (let i = 0; i < 4; i++) {
        el('rect', { x: 40, y: 18 + i * 22, width: 180, height: 16, rx: 4, fill: i === 2 ? '#FDE2E2' : '#fff', stroke: i === 2 ? '#DC2626' : '#C7C1B4', 'stroke-width': 2 }, s);
      }
      el('rect', { x: 236, y: 60, width: 30, height: 22, rx: 3, fill: '#fff', stroke: '#111819', 'stroke-width': 2.5 }, s);
    },
  });
})();
