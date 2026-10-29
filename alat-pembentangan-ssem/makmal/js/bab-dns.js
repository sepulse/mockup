/* Bab 4 — DNS & OpenDNS. DNS mencari alamat; routing memilih jalan.
   Ikut eksport SSeM 22 Okt: dns-server per VLAN dalam /ip dhcp-server network, dstnat "Force OpenDNS - VLAN 30
   Student (UDP/TCP)" (hotspot=auth), rule forward "Block DoH/DoT/QUIC", rule input "Drop External DNS Queries",
   /ip dns allow-remote-requests=yes. Alamat DNS MyGovNet dan IP WAN TIDAK dipapar.
   Nota: "Drop External DNS Queries" ialah chain input dari WAN (melindungi DNS router); yang memaksa DNS Murid
   ke OpenDNS ialah dstnat. Tapisan kandungan OpenDNS berlaku di luar router dan tiada dalam RSC. */
(function () {
  'use strict';
  const { el, teks, W, KUMP } = MG;
  const G = MG.g;

  const LORONG = 944, BAS_Y = 228, TRACE_X = 414;
  const LAPTOP = { x: 196, y: 420 };
  const OPENDNS = '208.67.222.222';
  const P = { dhcp: { y: 244, h: 96 }, dnat: { y: 352, h: 148 }, rt: { y: 512, h: 88 }, fw: { y: 612, h: 244 } };
  const BARIS_DNAT = (i) => P.dnat.y + 42 + i * 50, BARIS_FW = (i) => P.fw.y + 40 + i * 50;
  const SERVER = {
    opendns: { x: 1080, y: 290, nama: 'OpenDNS', ip: OPENDNS, keluar: 'unifi' },
    awam: { x: 1080, y: 410, nama: 'DNS awam', ip: '8.8.8.8 · 1.1.1.1', keluar: 'unifi' },
    laman: { x: 1080, y: 534, nama: 'Laman web', ip: 'www.moe.gov.my', keluar: 'unifi' },
    mygovnet: { x: 1080, y: 772, nama: 'DNS MyGovNet', ip: '10.x (tidak dipaparkan)', keluar: 'mygovnet' },
    // packet web Kewangan: berhenti di pintu masuk MyGovNet (tidak dilukis sebagai server)
    mygovnetWeb: { x: 1040, y: 772, nama: 'MyGovNet', keluar: 'mygovnet', maya: true },
  };
  const KELUAR = { unifi: { y: 472, bas: 1024 }, mygovnet: { y: 772, bas: null } };
  // Sumber dan DNS yang diberi DHCP (dns-server sebenar; DNS MyGovNet tidak dipapar)
  const SUMBER = {
    kewangan: { z: KUMP.kewangan, ip: '172.16.12.57', dhcp: 'dns-server=(2 alamat DNS MyGovNet, 10.x)', dns: 'mygovnet', dnsIp: 'DNS MyGovNet 10.x', tanda: 'to-MyGovNet', keluar: 'mygovnet' },
    staf: { z: KUMP.staf, ip: '172.16.22.57', dhcp: 'dns-server=8.8.8.8,8.8.4.4', dns: 'awam', dnsIp: '8.8.8.8', tanda: 'to-Unifi', keluar: 'unifi' },
    murid: { z: KUMP.murid, ip: '192.168.32.57', dhcp: 'dns-server=208.67.222.222,208.67.220.220', dns: 'opendns', dnsIp: OPENDNS, tanda: null, keluar: 'unifi' },
  };
  const KAEDAH = {
    dns: { t: 'DNS biasa', proto: 'udp 53', lbl: 'DNS?' },
    doh: { t: 'DoH', proto: 'tcp 443 → 1.1.1.1', lbl: 'DoH' },
    dot: { t: 'DoT', proto: 'tcp 853 → 1.1.1.1', lbl: 'DoT' },
    quic: { t: 'QUIC', proto: 'udp 443', lbl: 'QUIC' },
  };
  const DNAT_ASAL = [
    { id: 'udp', nama: 'Force OpenDNS - VLAN 30 Student (UDP)', syarat: 'udp 53 → ' + OPENDNS, aksi: 'dst-nat' },
    { id: 'tcp', nama: 'Force OpenDNS - VLAN 30 Student (TCP)', syarat: 'tcp 53 → ' + OPENDNS, aksi: 'dst-nat' },
  ];
  const FW_ASAL = [
    { id: 'doh', nama: 'Block DoH for Student', syarat: 'tcp 443 · dst DOH_SERVERS', aksi: 'reject', kaedah: 'doh' },
    { id: 'dot', nama: 'Block DoT for VLAN 30 Student', syarat: 'tcp 853', aksi: 'reject', kaedah: 'dot' },
    { id: 'quic', nama: 'Block QUIC for VLAN 30 Student', syarat: 'udp 443', aksi: 'reject', kaedah: 'quic' },
    { id: 'lanwan', nama: 'Allow LAN to WAN', syarat: 'in LAN · out WAN', aksi: 'accept' },
  ];

  function barisRule(induk, x, y, w, r, o) {
    o = o || {};
    const g = G(induk, { class: o.klik ? 'boleh-klik' : null });
    const kotak = el('rect', { x, y, width: w, height: 42, rx: 9, fill: '#fff', stroke: W.garis2, 'stroke-width': 2, class: o.klik ? 'sorot' : null }, g);
    const nama = teks(g, x + 14, y + 19, r.nama, { 'font-size': o.fs || 16, 'font-weight': 800 });
    teks(g, x + 14, y + 36, r.syarat, { 'font-size': 12.5, class: 'mono', fill: W.pudar });
    const ak = r.aksi === 'accept', nat = r.aksi === 'dst-nat';
    const isi = ak ? '#DCEFE9' : nat ? '#F4E3DC' : '#FDE2E2', garis = ak ? W.benar : nat ? W.aksen : W.sekat;
    el('rect', { x: x + w - 84, y: y + 9, width: 74, height: 24, rx: 6, fill: isi, stroke: garis, 'stroke-width': 1.6 }, g);
    teks(g, x + w - 47, y + 26, r.aksi.toUpperCase(), { 'font-size': 12.5, 'font-weight': 900, 'text-anchor': 'middle', fill: garis });
    const sebab = teks(g, x + w - 94, y + 36, '', { 'font-size': 13.5, 'font-weight': 700, 'text-anchor': 'end' });
    return { g, kotak, nama, sebab, cy: y + 21 };
  }
  const sorot = (b, w, t) => { b.kotak.setAttribute('stroke', w || W.garis2); b.kotak.setAttribute('stroke-width', t || 2); };

  function binaDns(ctx, o) {
    o = o || {};
    const lap = {};
    ['dasar', 'panel', 'label', 'paket'].forEach((n) => (lap[n] = ctx.lapisan(n)));
    const S = { dnat: DNAT_ASAL.map((r) => Object.assign({ hidup: true }, r)), fw: FW_ASAL.map((r) => Object.assign({ hidup: true }, r)), b: {} };

    // kad soalan
    const kad = G(lap.dasar);
    el('rect', { x: 400, y: 20, width: 900, height: 124, rx: 16, fill: W.kad, stroke: W.garis, 'stroke-width': 2 }, kad);
    teks(kad, 422, 50, 'PACKET', { 'font-size': 16, 'font-weight': 800, fill: W.pudar, 'letter-spacing': 0.8 });
    const md = {};
    [['tanya', 'Isi', 422, 86], ['ke', 'Ke', 422, 122], ['jawab', 'Jawapan', 860, 86], ['keluar', 'Keluar', 860, 122]].forEach((m) => {
      teks(kad, m[2], m[3], m[1], { 'font-size': 16, 'font-weight': 700, fill: W.pudar });
      md[m[0]] = teks(kad, m[2] + 84, m[3], '—', { 'font-size': 19, 'font-weight': 700 });
    });

    // zon sumber (warna ikut VLAN dipilih)
    const zon = MG.zon({ x: 26, y: 226, width: 340, height: 404, rx: 18, fill: '#fff', stroke: W.garis2, 'stroke-width': 2.5 }, lap.dasar);
    const cip = el('rect', { x: 44, y: 244, width: 90, height: 28, rx: 14, fill: W.pudar }, lap.dasar);
    const tCip = teks(lap.dasar, 89, 264, '', { 'font-size': 16, 'font-weight': 800, fill: '#fff', 'text-anchor': 'middle' });
    const tNama = teks(lap.dasar, 148, 266, '', { 'font-size': 24, 'font-weight': 800 });
    const gLaptop = G(lap.dasar);
    const tIp = teks(lap.dasar, LAPTOP.x, LAPTOP.y + 72, '', { 'font-size': 17, class: 'mono', 'text-anchor': 'middle', 'font-weight': 700 });
    teks(lap.dasar, 46, 536, 'DNS pada laptop', { 'font-size': 15, 'font-weight': 800, fill: W.pudar, 'letter-spacing': 0.5 });
    const tDnsLaptop = teks(lap.dasar, 46, 566, '', { 'font-size': 19, class: 'mono', 'font-weight': 700 });
    const tDnsAsal = teks(lap.dasar, 46, 594, '', { 'font-size': 14.5, fill: W.pudar });
    const kabel = el('line', { x1: LAPTOP.x + 42, y1: LAPTOP.y, x2: TRACE_X, y2: LAPTOP.y, 'stroke-width': 5 }, lap.dasar);
    teks(lap.dasar, 46, 668, 'Murid dianggap sudah login HotSpot', { 'font-size': 14.5, fill: W.pudar });
    teks(lap.dasar, 46, 690, '(rule dstnat bersyarat hotspot=auth).', { 'font-size': 14.5, fill: W.pudar });

    // router
    MG.rak(lap.dasar, 400, 160, 580, 712, 'ROUTER', 'MikroTik SSeM');
    MG.garisan(lap.dasar, [{ x: TRACE_X, y: LAPTOP.y }, { x: TRACE_X, y: BAS_Y }, { x: LORONG, y: BAS_Y }, { x: LORONG, y: 846 }], { stroke: '#5E6B6E', 'stroke-width': 4, 'stroke-dasharray': '2 6', 'stroke-linecap': 'round' });
    const panel = (p, tajuk) => { el('rect', { x: 430, y: p.y, width: 488, height: p.h, rx: 12, fill: '#F4F2EC' }, lap.panel); teks(lap.panel, 446, p.y + 28, tajuk, { 'font-size': 18, 'font-weight': 800 }); };
    panel(P.dhcp, '1 · DHCP — alamat DNS untuk laptop');
    const tDhcp = teks(lap.panel, 446, P.dhcp.y + 58, '', { 'font-size': 13.5, class: 'mono', fill: W.dakwat2 });
    teks(lap.panel, 446, P.dhcp.y + 82, 'Diberi semasa laptop mendapat IP (Bab 2).', { 'font-size': 14, fill: W.pudar });
    panel(P.dnat, '2 · DSTNAT — tukar destinasi');
    S.dnat.forEach((r, i) => {
      const b = (S.b['n' + r.id] = barisRule(lap.panel, 442, BARIS_DNAT(i), 464, r, { klik: true, fs: 15 }));
      b.g.addEventListener('click', () => { r.hidup = !r.hidup; rupa(); if (o.padaUbah) o.padaUbah(); });
    });
    panel(P.rt, '3 · ROUTING — pilih jalan');
    const tRt = teks(lap.panel, 446, P.rt.y + 62, '', { 'font-size': 15, class: 'mono', fill: W.dakwat2 });
    panel(P.fw, '4 · FIREWALL FORWARD');
    teks(lap.panel, 906, P.fw.y + 28, 'klik untuk mati/hidup', { 'font-size': 13, fill: W.pudar, 'text-anchor': 'end' });
    S.fw.forEach((r, i) => {
      const b = (S.b['f' + r.id] = barisRule(lap.panel, 442, BARIS_FW(i), 464, r, { klik: true }));
      b.g.addEventListener('click', () => { r.hidup = !r.hidup; rupa(); if (o.padaUbah) o.padaUbah(); });
    });
    function rupa() {
      S.dnat.concat(S.fw).forEach((r) => {
        const b = S.b[(S.dnat.includes(r) ? 'n' : 'f') + r.id];
        b.g.setAttribute('opacity', r.hidup ? 1 : 0.45);
        b.nama.setAttribute('text-decoration', r.hidup ? 'none' : 'line-through');
      });
    }
    rupa();

    // luar: Internet (melalui pppoe-unifi) dan MyGovNet (ether13)
    MG.zon({ x: 1004, y: 196, width: 296, height: 420, rx: 18, fill: '#E7F3EF', stroke: W.benar, 'stroke-width': 2 }, lap.dasar);
    teks(lap.dasar, 1022, 224, 'Internet · pppoe-unifi', { 'font-size': 16, 'font-weight': 800, fill: W.benar });
    MG.zon({ x: 1004, y: 650, width: 296, height: 210, rx: 18, fill: '#E3EAFB', stroke: KUMP.kewangan.gelap, 'stroke-width': 2 }, lap.dasar);
    teks(lap.dasar, 1022, 678, 'MyGovNet · ether13', { 'font-size': 16, 'font-weight': 800, fill: KUMP.kewangan.gelap });
    el('line', { x1: 980, y1: KELUAR.unifi.y, x2: KELUAR.unifi.bas, y2: KELUAR.unifi.y, stroke: W.dakwat2, 'stroke-width': 6 }, lap.dasar);
    el('line', { x1: KELUAR.unifi.bas, y1: SERVER.opendns.y, x2: KELUAR.unifi.bas, y2: SERVER.laman.y, stroke: W.dakwat2, 'stroke-width': 4 }, lap.dasar);
    el('line', { x1: 980, y1: KELUAR.mygovnet.y, x2: SERVER.mygovnet.x - 30, y2: KELUAR.mygovnet.y, stroke: W.dakwat2, 'stroke-width': 6 }, lap.dasar);
    const kotakSv = {};
    Object.keys(SERVER).forEach((k) => {
      const v = SERVER[k];
      if (v.maya) return;
      if (v.keluar === 'unifi') el('line', { x1: KELUAR.unifi.bas, y1: v.y, x2: v.x - 28, y2: v.y, stroke: W.dakwat2, 'stroke-width': 4 }, lap.dasar);
      kotakSv[k] = el('rect', { x: v.x - 40, y: v.y - 50, width: 210, height: 100, rx: 12, fill: 'none', stroke: 'none', 'stroke-width': 3 }, lap.dasar);
      MG.peranti(lap.dasar, 'pelayan', v.x, v.y - 4, { skrin: '#fff' });
      teks(lap.dasar, v.x + 44, v.y - 6, v.nama, { 'font-size': 18, 'font-weight': 800 });
      teks(lap.dasar, v.x + 44, v.y + 16, v.ip, { 'font-size': 13.5, class: 'mono', fill: W.dakwat2 });
    });

    S.setSumber = (k, dnsSendiri) => {
      const sb = SUMBER[k];
      S.src = k; S.dnsSendiri = dnsSendiri || null;
      zon.setAttribute('fill', sb.z.cerah); zon.setAttribute('stroke', sb.z.warna);
      cip.setAttribute('fill', sb.z.warna); tCip.textContent = 'VLAN ' + sb.z.vlan; tNama.textContent = sb.z.nama;
      MG.kosong(gLaptop); MG.peranti(gLaptop, 'laptop', LAPTOP.x, LAPTOP.y, { warna: sb.z.warna, skrin: '#fff' });
      kabel.setAttribute('stroke', sb.z.warna);
      tIp.textContent = sb.ip;
      tDhcp.textContent = sb.dhcp;
      tDnsLaptop.textContent = dnsSendiri || sb.dnsIp;
      tDnsLaptop.setAttribute('fill', dnsSendiri ? W.aksen : W.dakwat);
      tDnsAsal.textContent = dnsSendiri ? 'ditukar sendiri oleh pengguna' : 'diterima daripada DHCP';
    };
    S.bersih = () => {
      MG.kosong(lap.paket); MG.kosong(lap.label);
      Object.values(S.b).forEach((b) => { b.sebab.textContent = ''; sorot(b); });
      Object.values(kotakSv).forEach((k) => k.setAttribute('stroke', 'none'));
      tRt.textContent = ''; md.jawab.textContent = '—'; md.keluar.textContent = '—';
    };
    S.pulih = () => { S.dnat.concat(S.fw).forEach((r) => (r.hidup = true)); rupa(); };

    const keLorong = (s, env, y) => MG.gerak(s, env, [{ x: env.x, y: env.y }, { x: LORONG, y }], { laju: 540, ease: MG.ease.io });
    const laluanKe = (sv) => {
      const v = SERVER[sv], e = KELUAR[v.keluar];
      return e.bas ? [{ x: LORONG, y: e.y }, { x: e.bas, y: e.y }, { x: e.bas, y: v.y }, { x: v.x - 34, y: v.y }] : [{ x: LORONG, y: e.y }, { x: v.x - 34, y: v.y }];
    };

    /* Satu packet dari laptop. p = { kaedah, dst (kunci SERVER), ket (teks Ke) }.
       Pulangkan { ok, sv, rule } — sv ialah server yang akhirnya menerima packet. */
    S.hantar = async (s, p) => {
      const sb = SUMBER[S.src], kd = KAEDAH[p.kaedah];
      let sv = p.dst, keTeks = p.ket;
      md.ke.textContent = keTeks;
      const env = MG.sampul(lap.paket, { warna: sb.z.warna, label: p.lbl || kd.lbl, saiz: 1.1 });
      await MG.gerak(s, env, [{ x: LAPTOP.x + 42, y: LAPTOP.y }, { x: TRACE_X, y: LAPTOP.y }, { x: TRACE_X, y: BAS_Y }, { x: LORONG, y: BAS_Y }], { laju: 640 });
      // 1 DHCP (maklumat sahaja)
      await keLorong(s, env, P.dhcp.y + 48);
      await s.tunggu(250);
      // 2 dstnat (prerouting): hanya DNS port 53 dari VLAN 30
      for (const r of S.dnat) {
        const b = S.b['n' + r.id];
        await keLorong(s, env, b.cy);
        sorot(b, W.dakwat, 3);
        await s.tunggu(220);
        let sebab = null;
        if (!r.hidup) sebab = 'dimatikan';
        else if (S.src !== 'murid') sebab = '✗ bukan VLAN 30';
        else if (p.kaedah !== 'dns') sebab = '✗ bukan port 53';
        else if (r.id === 'tcp') sebab = '✗ bukan TCP';
        if (sebab) { b.sebab.textContent = sebab; b.sebab.setAttribute('fill', W.pudar); await s.tunggu(260); sorot(b); continue; }
        sorot(b, W.aksen, 4);
        if (sv !== 'opendns') {
          b.sebab.textContent = '✓ dibelokkan'; b.sebab.setAttribute('fill', W.aksen);
          sv = 'opendns'; keTeks = `${OPENDNS} (asal: ${p.ket})`;
          md.ke.textContent = keTeks; md.ke.setAttribute('fill', W.aksen);
          await MG.denyut(s, lap.label, LORONG, b.cy, W.aksen, 40); if (!s.hidup) throw MG.BATAL;
        } else { b.sebab.textContent = '✓ sudah OpenDNS'; b.sebab.setAttribute('fill', W.benar); }
        await s.tunggu(500);
        break;
      }
      // 3 routing
      const keluar = SERVER[sv].keluar;
      await keLorong(s, env, P.rt.y + 56);
      tRt.textContent = sb.tanda ? `pelekat ${sb.tanda} → ${keluar === 'mygovnet' ? 'ether13 (MyGovNet)' : 'pppoe-unifi'}` : 'tiada pelekat → main → 0.0.0.0/0 → pppoe-unifi';
      if (sb.tanda) env.setPelekat(sb.tanda, sb.tanda === 'to-MyGovNet' ? '#1D4ED8' : '#0F766E');
      md.keluar.textContent = keluar === 'mygovnet' ? 'ether13 (MyGovNet)' : 'pppoe-unifi';
      await s.tunggu(650);
      // 4 firewall forward (rule Block di bahagian atas senarai sebenar)
      let lulus = false;
      for (const r of S.fw) {
        const b = S.b['f' + r.id];
        await keLorong(s, env, b.cy);
        sorot(b, W.dakwat, 3);
        await s.tunggu(220);
        let sebab = null;
        if (!r.hidup) sebab = 'dimatikan';
        else if (r.kaedah && S.src !== 'murid') sebab = '✗ bukan VLAN 30';
        else if (r.kaedah && r.kaedah !== p.kaedah) sebab = '✗ ' + (r.kaedah === 'doh' ? 'bukan DoH' : r.kaedah === 'dot' ? 'bukan port 853' : 'bukan udp 443');
        if (sebab) { b.sebab.textContent = sebab; b.sebab.setAttribute('fill', W.pudar); await s.tunggu(260); sorot(b); continue; }
        const ak = r.aksi === 'accept';
        b.sebab.textContent = '✓ PADAN'; b.sebab.setAttribute('fill', ak ? W.benar : W.sekat);
        sorot(b, ak ? W.benar : W.sekat, 4);
        if (!ak) {
          await MG.cop(s, lap.label, LORONG - 64, b.cy - 46, 'REJECT', 'sekat');
          return { ok: false, sv, rule: r };
        }
        await s.tunggu(400);
        lulus = true;
        break;
      }
      if (!lulus) {
        // Allow LAN to WAN dimatikan: dalam RSC hanya Murid diselamatkan oleh rule Hotspot di bawahnya; lain jatuh ke DEFAULT DENY
        const bA = S.b['f' + S.fw[S.fw.length - 1].id];
        const murid = S.src === 'murid';
        bA.sebab.textContent = murid ? '↓ Hotspot: Allow VLAN 30 ✓' : '↓ DEFAULT DENY';
        bA.sebab.setAttribute('fill', murid ? W.benar : W.sekat);
        await s.tunggu(500);
        if (!murid) {
          await MG.cop(s, lap.label, LORONG - 64, bA.cy - 46, 'DROP', 'sekat');
          return { ok: false, sv, rule: { nama: 'DEFAULT DENY - Drop all unmatched forward traffic', aksi: 'drop' } };
        }
      }
      await MG.gerak(s, env, [{ x: LORONG, y: env.y }].concat(laluanKe(sv)), { laju: 620 });
      if (kotakSv[sv]) kotakSv[sv].setAttribute('stroke', W.benar);
      env.remove();
      return { ok: true, sv };
    };

    // Jawapan kembali ke laptop melalui jalan yang sama (connection tracking memulihkan alamat asal)
    S.balas = async (s, sv, label) => {
      const sb = SUMBER[S.src];
      const r = MG.sampul(lap.paket, { warna: W.dakwat2, label, saiz: 1.05 });
      const jalan = laluanKe(sv).reverse().concat([{ x: LORONG, y: BAS_Y }, { x: TRACE_X, y: BAS_Y }, { x: TRACE_X, y: LAPTOP.y }, { x: LAPTOP.x + 42, y: LAPTOP.y }]);
      await MG.gerak(s, r, jalan, { laju: 820 });
      r.remove();
      await MG.denyut(s, lap.label, LAPTOP.x, LAPTOP.y - 6, sb.z.warna, 50); if (!s.hidup) throw MG.BATAL;
    };
    S.md = md;
    return S;
  }

  /* ---------------------------------------------------------------- Langkah 4: chain input router */
  const INPUT = [
    { nama: 'Allow Established/Related', syarat: 'established,related,untracked', aksi: 'accept', semak: () => '✗ connection baharu' },
    { nama: 'Drop Invalid Packets', syarat: 'invalid', aksi: 'drop', semak: () => '✗ bukan invalid' },
    { nama: 'Allow DHCP Request from LAN', syarat: 'udp 67 · in LAN', aksi: 'accept', semak: () => '✗ bukan port 67' },
    { nama: 'Allow ICMP/Ping', syarat: 'protocol=icmp', aksi: 'accept', semak: () => '✗ bukan ICMP' },
    { nama: 'Allow Admin Access (Mgmt/Staff/Emergency)', syarat: 'in MANAGEMENT', aksi: 'accept', semak: (k) => (k === 'staf' ? null : '✗ bukan MANAGEMENT') },
    { nama: 'Drop External DNS Queries', syarat: 'udp 53 · in WAN', aksi: 'drop', semak: (k) => (k === 'wan' ? null : '✗ bukan dari WAN') },
    { nama: '(tiada komen)', syarat: 'tcp 53 · in WAN', aksi: 'drop', semak: () => '✗ bukan TCP' },
    { nama: 'Allow WireGuard Inbound', syarat: 'udp 51820', aksi: 'accept', semak: () => '✗ bukan 51820' },
    { nama: '6 rule Hotspot: Allow DNS / Login Page', syarat: 'in VLAN40 / VLAN30', aksi: 'accept', semak: (k) => (k === 'murid' ? null : '✗ bukan VLAN HotSpot') },
    { nama: 'Drop ALL other traffic to Router', syarat: '(Security Check)', aksi: 'drop', semak: () => null },
  ];
  const PENANYA = {
    wan: { nama: 'Internet', sub: 'alamat luar (WAN)', y: 300, warna: W.dakwat2, jenis: 'awan' },
    murid: { nama: 'Murid', sub: 'sebelum login HotSpot', y: 470, warna: KUMP.murid.warna, jenis: 'laptop' },
    staf: { nama: 'Staf', sub: 'VLAN20 · senarai MANAGEMENT', y: 620, warna: KUMP.staf.warna, jenis: 'pc' },
    kewangan: { nama: 'Kewangan', sub: 'VLAN10 · bukan MANAGEMENT', y: 770, warna: KUMP.kewangan.warna, jenis: 'pc' },
  };
  function binaInput(ctx, o) {
    const lap = {};
    ['dasar', 'panel', 'label', 'paket'].forEach((n) => (lap[n] = ctx.lapisan(n)));
    const rule = INPUT.map((r) => Object.assign({ hidup: true }, r));
    const X0 = 430, LR = 940, Y0 = 226, H = 63;
    Object.keys(PENANYA).forEach((k) => {
      const v = PENANYA[k];
      if (v.jenis === 'awan') MG.awan(lap.dasar, 120, v.y, 0.55, null, '#EEF2F3');
      else MG.peranti(lap.dasar, v.jenis, 100, v.y - 6, { warna: v.warna, skrin: '#fff' });
      teks(lap.dasar, 196, v.y - 6, v.nama, { 'font-size': 21, 'font-weight': 800 });
      teks(lap.dasar, 196, v.y + 18, v.sub, { 'font-size': 14, fill: W.pudar });
      el('line', { x1: 196, y1: v.y + 34, x2: 400, y2: v.y + 34, stroke: v.warna, 'stroke-width': 4, opacity: 0.55 }, lap.dasar);
    });
    MG.rak(lap.dasar, 400, 160, 580, 712, 'ROUTER', 'chain input');
    MG.garisan(lap.dasar, [{ x: LR, y: Y0 - 6 }, { x: LR, y: Y0 + 10 * H }], { stroke: '#5E6B6E', 'stroke-width': 4, 'stroke-dasharray': '2 6', 'stroke-linecap': 'round' });
    const baris = rule.map((r, i) => {
      const b = barisRule(lap.panel, X0, Y0 + i * H, 470, r, { klik: true, fs: 15 });
      b.g.addEventListener('click', () => { r.hidup = !r.hidup; rupa(); if (o.padaUbah) o.padaUbah(); });
      teks(lap.panel, X0 - 8, Y0 + i * H + 27, String(i + 1), { 'font-size': 16, 'font-weight': 900, fill: '#B3BDBF', 'text-anchor': 'end' });
      return b;
    });
    function rupa() { rule.forEach((r, i) => { baris[i].g.setAttribute('opacity', r.hidup ? 1 : 0.45); baris[i].nama.setAttribute('text-decoration', r.hidup ? 'none' : 'line-through'); }); }
    // DNS router
    const kd = document.createElement('div');
    Object.assign(kd.style, { position: 'absolute', left: '1004px', top: '196px', width: '298px', background: W.kad, border: '2px solid ' + W.garis, borderRadius: '14px', padding: '12px 14px', fontSize: '16px', lineHeight: '1.35', boxShadow: '0 6px 16px rgba(17,24,25,.07)' });
    kd.innerHTML = '<div style="font-weight:800;font-size:15px;color:' + W.pudar + ';text-transform:uppercase;letter-spacing:.6px">DNS dalam router</div>' +
      '<div style="font:14px/1.45 var(--mono);margin-top:6px">allow-remote-requests=yes<br>servers=8.8.8.8,1.1.1.1<br>+ 2 DNS MyGovNet (tidak dipaparkan)</div>' +
      '<div style="margin-top:8px;font-size:15px;color:' + W.dakwat2 + '">Router boleh menjawab soalan DNS. Chain input menentukan <b>siapa</b> boleh bertanya.</div>';
    ctx.html.appendChild(kd);
    // kad "Kenapa?": sebab keputusan bagi penanya yang dipilih (tetapan SSeM asal)
    const kk = document.createElement('div');
    Object.assign(kk.style, { position: 'absolute', left: '1004px', top: '452px', width: '298px', background: W.kad, border: '2px solid ' + W.garis, borderRadius: '14px', padding: '12px 14px', fontSize: '15px', lineHeight: '1.4', color: W.dakwat2, boxShadow: '0 6px 16px rgba(17,24,25,.07)', display: 'none' });
    ctx.html.appendChild(kk);
    rupa();
    const S = {};
    S.pulih = () => { rule.forEach((r) => (r.hidup = true)); rupa(); };
    S.asal = () => rule.every((r) => r.hidup);
    S.kenapa = (html) => { kk.style.display = html ? 'block' : 'none'; kk.innerHTML = html ? '<div style="font-weight:800;font-size:15px;color:' + W.pudar + ';text-transform:uppercase;letter-spacing:.6px;margin-bottom:4px">Kenapa?</div>' + html : ''; };
    S.tanya = async (s, k) => {
      MG.kosong(lap.paket); MG.kosong(lap.label);
      baris.forEach((b) => { b.sebab.textContent = ''; sorot(b); });
      const v = PENANYA[k];
      const env = MG.sampul(lap.paket, { warna: v.warna, label: 'DNS?', saiz: 1.05 });
      await MG.gerak(s, env, [{ x: 220, y: v.y + 34 }, { x: 410, y: v.y + 34 }, { x: 410, y: Y0 - 6 }, { x: LR, y: Y0 - 6 }], { laju: 680 });
      for (let i = 0; i < rule.length; i++) {
        const r = rule[i], b = baris[i];
        await MG.gerak(s, env, [{ x: LR, y: env.y }, { x: LR, y: b.cy }], { laju: 520, ease: MG.ease.io });
        sorot(b, W.dakwat, 3);
        await s.tunggu(200);
        const sebab = r.hidup ? r.semak(k) : 'dimatikan';
        if (sebab) { b.sebab.textContent = sebab; b.sebab.setAttribute('fill', W.pudar); await s.tunggu(200); sorot(b); continue; }
        const ak = r.aksi === 'accept';
        b.sebab.textContent = '✓ PADAN'; b.sebab.setAttribute('fill', ak ? W.benar : W.sekat);
        sorot(b, ak ? W.benar : W.sekat, 4);
        await MG.cop(s, lap.label, LR - 70, b.cy - 44, ak ? 'DIJAWAB' : 'DROP', ak ? 'benar' : 'sekat');
        if (o.padaHasil) o.padaHasil(k, r, i, ak);
        return;
      }
      // semua rule dimatikan: chain input tanpa padanan menerima packet
      await MG.cop(s, lap.label, LR - 70, Y0 + 10 * H - 30, 'DIJAWAB', 'benar');
      if (o.padaHasil) o.padaHasil(k, null, -1, true);
    };
    return S;
  }

  const RSC = {
    kod: [
      '/ip dhcp-server network\nadd address=192.168.32.0/23 <mark>dns-server=208.67.222.222,208.67.220.220</mark> \\\n    gateway=192.168.32.1',
      '/ip firewall nat\nadd action=<mark>dst-nat</mark> chain=dstnat comment=\\\n    "Force OpenDNS - VLAN 30 Student (UDP)" dst-address-type=!local dst-port=\\\n    53 <mark>hotspot=auth</mark> in-interface=VLAN30-Student protocol=udp to-addresses=\\\n    <mark>208.67.222.222</mark> to-ports=53',
    ],
    fungsi: 'DHCP memberi alamat OpenDNS kepada Murid. Jika Murid menukar DNS sendiri, dstnat menukar destinasi soalan DNS kepada OpenDNS. (Petikan sebenar SSeM.)',
  };
  const RSC_BLOK = {
    kod: ['/ip firewall filter\nadd action=reject chain=forward comment=<mark>"Block DoH for Student"</mark> \\\n    dst-address-list=DOH_SERVERS dst-port=443 in-interface=VLAN30-Student \\\n    protocol=tcp reject-with=tcp-reset', 'add action=reject chain=forward comment=<mark>"Block QUIC for VLAN 30 Student"</mark> \\\n    dst-port=443 in-interface=VLAN30-Student protocol=udp reject-with=\\\n    icmp-network-unreachable'],
    fungsi: 'DOH_SERVERS ialah 1.1.1.1, 1.0.0.1, 8.8.8.8, 8.8.4.4, 9.9.9.9 dan 149.112.112.112. Rule ini berada di bahagian paling atas chain forward. Rule serupa ada untuk VLAN 40 Tetamu dan DoH Kewangan. (Petikan sebenar SSeM.)',
  };
  const RSC_INPUT = {
    kod: ['/ip dns\nset <mark>allow-remote-requests=yes</mark> servers=8.8.8.8,1.1.1.1,<i>(2 DNS MyGovNet)</i>', '/ip firewall filter\nadd action=drop chain=<mark>input</mark> comment="Drop External DNS Queries" dst-port=53 \\\n    <mark>in-interface-list=WAN</mark> protocol=udp'],
    fungsi: 'allow-remote-requests=yes membolehkan router menjawab DNS. Rule input ini menghalang orang di Internet daripada menggunakan router sebagai DNS awam. (Petikan sebenar SSeM; alamat DNS MyGovNet tidak dipaparkan.)',
  };

  const NAMA_LAMAN = 'www.moe.gov.my';
  function langkahDns(tajuk, teks2, mod, extra) {
    return Object.assign({
      tajuk, teks: teks2, rsc: mod === 'blok' ? RSC_BLOK : RSC,
      bina(ctx) {
        const papan = ctx.papan({ mula: ['DNS', '—', 'Tekan Hantar.'] });
        const cb = {};
        const S = binaDns(ctx, cb);
        let src = 'murid', dnsSendiri = mod === 'tukar', kaedah = mod === 'blok' ? 'doh' : 'dns';
        const kemas = () => S.setSumber(src, dnsSendiri ? '8.8.8.8' : null);
        const hantar = () => ctx.jalan(async (s) => {
          S.bersih(); kemas();
          const sb = SUMBER[src];
          S.md.ke.setAttribute('fill', W.dakwat);
          if (mod === 'blok') {
            const kd = KAEDAH[kaedah];
            S.md.tanya.textContent = `${kd.t} · ${kd.proto}`;
            papan.set(kd.t, '…', 'Packet sedang diperiksa.');
            const dst = kaedah === 'dns' ? 'opendns' : kaedah === 'quic' ? 'laman' : 'awam';
            const ket = kaedah === 'dns' ? OPENDNS : kaedah === 'quic' ? NAMA_LAMAN + ' (udp 443)' : kaedah === 'doh' ? '1.1.1.1:443' : '1.1.1.1:853';
            const h = await S.hantar(s, { kaedah, dst, ket });
            if (!h.ok) {
              S.md.jawab.textContent = 'ditolak (reject)'; S.md.jawab.setAttribute('fill', W.sekat);
              papan.set(kd.t, h.rule.aksi === 'drop' ? 'DROP' : 'REJECT', `Rule <b>${h.rule.nama}</b>. ${kaedah === 'quic' ? 'Browser beralih kepada TCP biasa.' : 'Laptop terpaksa menggunakan DNS biasa, yang dibelokkan ke OpenDNS.'}`, 'sekat');
              return;
            }
            await S.balas(s, h.sv, kaedah === 'quic' ? 'laman' : 'jawapan');
            const lepas = kaedah !== 'dns' && kaedah !== 'quic';
            S.md.jawab.textContent = lepas ? 'daripada 1.1.1.1, bukan OpenDNS' : kaedah === 'quic' ? 'laman dibuka melalui QUIC' : 'daripada OpenDNS';
            S.md.jawab.setAttribute('fill', lepas ? W.sekat : W.benar);
            if (kaedah === 'dns') papan.set('DNS biasa', 'OpenDNS', 'Port 53 tidak disekat; soalan dijawab oleh OpenDNS.', 'benar');
            else if (kaedah === 'quic') papan.set('QUIC', 'Lepas', 'Rule QUIC dimatikan: HTTP/3 lalu. DoH di dalamnya kelihatan seperti trafik web biasa.', 'sekat');
            else papan.set(kd.t, 'Terlepas', 'Rule sekat dimatikan. Soalan DNS disulitkan dan terus ke 1.1.1.1. OpenDNS <b>tidak</b> menapisnya.', 'sekat');
            return;
          }
          S.md.tanya.textContent = `${NAMA_LAMAN} = ?`;
          papan.set(sb.z.nama, '…', 'Laptop bertanya alamat IP.');
          const dst = dnsSendiri ? 'awam' : sb.dns;
          const h = await S.hantar(s, { kaedah: 'dns', dst, ket: dnsSendiri ? '8.8.8.8' : sb.dnsIp });
          if (!h.ok) { S.md.jawab.textContent = 'tiada jawapan'; S.md.jawab.setAttribute('fill', W.sekat); papan.set(sb.z.nama, 'DROP', `<b>Allow LAN to WAN</b> dimatikan. Soalan DNS jatuh ke <b>DEFAULT DENY</b>.`, 'sekat'); return; }
          await S.balas(s, h.sv, 'jawapan');
          const nama = SERVER[h.sv].nama;
          S.md.jawab.textContent = `alamat IP · daripada ${h.sv === 'opendns' ? 'OpenDNS' : h.sv === 'awam' ? '8.8.8.8' : 'DNS MyGovNet'}`;
          S.md.jawab.setAttribute('fill', h.sv === 'opendns' ? W.benar : W.dakwat);
          if (mod === 'tukar') {
            if (!dnsSendiri) papan.set('DNS daripada DHCP', 'OpenDNS', 'Laptop memang bertanya kepada OpenDNS. Rule dstnat padan, tetapi destinasi kekal sama.', 'benar');
            else if (h.sv === 'opendns') papan.set('DNS 8.8.8.8?', 'OpenDNS', 'Dstnat menukar destinasi kepada <b>208.67.222.222</b>. Laptop menyangka 8.8.8.8 yang menjawab.', 'benar');
            else papan.set('DNS 8.8.8.8?', '8.8.8.8', 'Rule dstnat dimatikan: soalan terus ke 8.8.8.8. Tapisan OpenDNS <b>terlepas</b>.', 'sekat');
            return;
          }
          papan.set(`${sb.z.nama} bertanya`, nama, 'DNS memberi alamat IP. Kini packet web dihantar ke alamat itu.', 'benar');
          // packet web: routing memilih jalan, bukan DNS
          await s.tunggu(500);
          S.bersih();
          S.md.tanya.textContent = 'packet web (tcp 443)';
          const lamanMyGov = sb.keluar === 'mygovnet';
          const h2 = await S.hantar(s, { kaedah: 'web', dst: lamanMyGov ? 'mygovnetWeb' : 'laman', ket: `alamat IP ${NAMA_LAMAN}`, lbl: 'web' });
          if (!h2.ok) { papan.set('Packet web', 'DROP', `<b>Allow LAN to WAN</b> dimatikan. Packet jatuh ke <b>DEFAULT DENY</b>.`, 'sekat'); return; }
          papan.set('Packet web', lamanMyGov ? 'ether13' : 'pppoe-unifi', lamanMyGov ? 'Pelekat <b>to-MyGovNet</b>: web Kewangan keluar melalui MyGovNet. Routing memilih jalan, bukan DNS.' : 'DNS hanya memberi alamat. <b>Routing</b> yang memilih jalan keluar (Bab 6).', 'benar');
        });
        cb.padaUbah = hantar;
        if (mod === 'asas') ctx.segmen('Sumber', [{ v: 'kewangan', t: 'Kewangan' }, { v: 'staf', t: 'Staf' }, { v: 'murid', t: 'Murid' }], src, (v) => { src = v; hantar(); });
        if (mod === 'tukar') ctx.segmen('DNS pada laptop Murid', [{ v: 'dhcp', t: 'OpenDNS (DHCP)' }, { v: 'sendiri', t: '8.8.8.8 (sendiri)' }], 'sendiri', (v) => { dnsSendiri = v === 'sendiri'; hantar(); });
        if (mod === 'blok') ctx.segmen('Cara bertanya DNS', Object.keys(KAEDAH).map((k) => ({ v: k, t: KAEDAH[k].t })), kaedah, (v) => { kaedah = v; hantar(); });
        const k = ctx.kumpulan();
        ctx.butang('▶ Hantar', hantar, { utama: true, dalam: k });
        if (mod !== 'asas') ctx.butang('↺ Pulihkan tetapan SSeM', () => { S.pulih(); hantar(); }, { dalam: k });
        if (this.nota) ctx.nota(this.nota);
        kemas();
        hantar();
      },
    }, extra || {});
  }

  const L1 = langkahDns('Nama → alamat IP',
    'Komputer tidak faham nama laman. Ia bertanya kepada <b>DNS</b>: “Apakah alamat IP www.moe.gov.my?” Selepas mendapat jawapan, barulah packet web dihantar. <b>DNS mencari alamat; routing memilih jalan.</b> Pilih sumber: setiap VLAN diberi DNS berbeza oleh DHCP.',
    'asas', { analogi: 'Seperti mencari nombor dalam direktori telefon. Direktori memberi nombor, tetapi tidak menyambungkan panggilan.', nota: 'Tapisan kandungan berlaku di OpenDNS sendiri. Tetapan kategorinya tiada dalam RSC.' });
  const L2 = langkahDns('Tukar DNS sendiri? Tetap ke OpenDNS',
    'Murid boleh menukar DNS laptop kepada <b>8.8.8.8</b>. Namun, rule <b>dstnat “Force OpenDNS”</b> menukar destinasi setiap soalan DNS port 53 kepada <b>208.67.222.222</b>. Klik rule dstnat untuk mematikannya dan bandingkan.',
    'tukar', { nota: 'Rule ini bersyarat <b>hotspot=auth</b>: ia untuk peranti yang sudah login. Sebelum login, HotSpot sendiri yang menjawab DNS (Bab 3). VLAN 40 Tetamu ada dua rule yang sama.' });
  const L3 = langkahDns('Pintu belakang: DoH, DoT, QUIC',
    'DNS juga boleh <b>disulitkan</b>: DoH (port 443) atau DoT (port 853). Dstnat tidak dapat melihatnya. Tiga rule <b>reject</b> di bahagian atas firewall menutup jalan ini. Pilih cara, kemudian cuba matikan rule.',
    'blok', { nota: 'QUIC (udp 443) disekat supaya browser kembali kepada TCP biasa.' });
  // Sebab keputusan setiap penanya (senarai MANAGEMENT dalam RSC: VLAN99-Management, VLAN20-Staff, bridge-lan, wireguard1)
  const KENAPA = {
    wan: 'Rule 6 menolak soalan DNS dari WAN. Tanpanya, router menjadi DNS awam yang terbuka kepada sesiapa di Internet.',
    murid: 'Sebelum login, Murid perlu DNS untuk membuka landing page. Rule HotSpot untuk VLAN 30 (rule 9) membenarkannya.',
    staf: 'VLAN20 Staff ada dalam senarai <b>MANAGEMENT</b>. Rule 5 membenarkan semua trafik Staf ke router, termasuk DNS.',
    kewangan: 'VLAN10 Kewangan <b>tiada</b> dalam senarai MANAGEMENT (hanya VLAN99, VLAN20, bridge-lan dan wireguard1). Ia juga bukan VLAN HotSpot. Tiada rule yang membenarkannya, jadi rule 10 menolak.<br><br>Ini tidak mengganggu kerja harian: DHCP memberi Kewangan <b>DNS MyGovNet</b>, jadi PC Kewangan tidak bertanya kepada router.',
  };
  const L4 = {
    tajuk: 'Router bukan DNS awam',
    teks: 'DNS router dihidupkan (<b>allow-remote-requests=yes</b>). Chain <b>input</b> menentukan siapa yang boleh bertanya. <b>Drop External DNS Queries</b> menolak soalan dari Internet. Rule ini <b>melindungi router</b>, bukan memaksa DNS Murid. Pilih siapa yang bertanya, kemudian cuba matikan rule.',
    rsc: RSC_INPUT,
    bina(ctx) {
      const papan = ctx.papan({ mula: ['Chain input', '—', 'Pilih siapa yang bertanya.'] });
      let k = 'wan';
      const o = {
        padaHasil: (kk, r, i, ak) => {
          S.kenapa(S.asal() ? KENAPA[kk] : 'Tetapan diubah. Keputusan mengikut rule pertama yang padan.');
          papan.set(PENANYA[kk].nama + ' → router', ak ? 'Dijawab' : 'DROP', r ? `Rule ${i + 1}: <b>${r.nama}</b>.` : 'Tiada rule yang padan, jadi router menjawab. Inilah DNS awam yang terbuka.', ak ? (kk === 'wan' ? 'sekat' : 'benar') : 'sekat');
        },
      };
      const S = binaInput(ctx, o);
      const tanya = () => { S.kenapa(null); papan.set(PENANYA[k].nama + ' → router', '…', 'Dibaca dari rule 1 ke bawah.'); return ctx.jalan((s) => S.tanya(s, k)); };
      o.padaUbah = tanya;
      ctx.segmen('Siapa yang bertanya kepada router?', Object.keys(PENANYA).map((x) => ({ v: x, t: PENANYA[x].nama })), k, (v) => { k = v; tanya(); });
      const kk = ctx.kumpulan();
      ctx.butang('▶ Hantar soalan', tanya, { utama: true, dalam: kk });
      ctx.butang('↺ Pulihkan tetapan SSeM', () => { S.pulih(); tanya(); }, { dalam: kk });
      ctx.nota('Cuba matikan rule 6. Soalan dari Internet tetap ditolak oleh rule terakhir. Hanya chain input yang dipaparkan.');
      tanya();
    },
  };

  MG.daftarBab({
    id: 'dns', no: 4, tajuk: 'DNS & OpenDNS', sub: 'DNS cari alamat, routing pilih jalan', status: 'siap',
    ringkas: 'Nama laman → alamat IP. DNS cari alamat; routing pilih jalan.',
    langkah: [L1, L2, L3, L4],
    ikonMenu(s) {
      el('rect', { x: 40, y: 34, width: 130, height: 40, rx: 20, fill: '#fff', stroke: '#3B4648', 'stroke-width': 4 }, s);
      el('circle', { cx: 66, cy: 54, r: 9, fill: 'none', stroke: '#3B4648', 'stroke-width': 4 }, s);
      el('path', { d: 'M180 54 H222', stroke: '#B4462E', 'stroke-width': 5, 'stroke-linecap': 'round' }, s);
      el('path', { d: 'M214 44 L226 54 L214 64', fill: 'none', stroke: '#B4462E', 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, s);
      el('rect', { x: 234, y: 40, width: 40, height: 28, rx: 5, fill: '#3B4648' }, s);
    },
  });
})();
