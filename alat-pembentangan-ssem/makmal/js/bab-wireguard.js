/* Bab 9 — WireGuard ke HQ: packet dalaman dibungkus dalam kotak berkunci dan merentas Internet.
   Ikut eksport SSeM 22 Okt: wireguard1 10.255.0.5/24, peer-HQ allowed-address 10.255.0.0/24,192.168.0.0/24,
   route 192.168.0.0/24 → 10.255.0.1, srcnat "Masquerade to HQ WireGuard", dua rule forward WireGuard.
   Endpoint, kunci dan IP WAN TIDAK dipapar. */
(function () {
  'use strict';
  const { el, teks, W, KUMP } = MG;
  const G = MG.g;

  const LORONG = 612, TIUB_Y = 740;
  const STN = { route: { y: 290, h: 100 }, fw: { y: 400, h: 100 }, nat: { y: 510, h: 100 }, wg: { y: 620, h: 160 } };
  Object.values(STN).forEach((s) => (s.cy = s.y + s.h / 2));
  const PC = { x: 160, y: STN.route.cy };
  const SERVER = { x: 1166, y: 370 }, LAPTOP = { x: 1166, y: 562 };
  const ASAL = { route: true, allowed: true, fw: true, fwHq: true };

  function kotakKunci(induk) {
    const g = G(induk);
    const isi = G(g);
    el('rect', { x: -40, y: -30, width: 80, height: 60, rx: 9, fill: '#2B3437', stroke: W.dakwat, 'stroke-width': 3 }, isi);
    el('rect', { x: -34, y: -24, width: 68, height: 6, rx: 3, fill: '#fff', opacity: 0.08 }, isi);
    el('path', { d: 'M-9 -4 V-11 a9 9 0 0 1 18 0 V-4', fill: 'none', stroke: '#E9E6DE', 'stroke-width': 4 }, isi);
    el('rect', { x: -14, y: -5, width: 28, height: 22, rx: 4, fill: '#D9B65C', stroke: W.dakwat, 'stroke-width': 2 }, isi);
    el('circle', { cx: 0, cy: 5, r: 3, fill: W.dakwat }, isi);
    teks(isi, 0, 50, 'UDP · disulitkan', { 'font-size': 15, 'font-weight': 800, 'text-anchor': 'middle', fill: W.dakwat, stroke: W.kertas, 'stroke-width': 5, 'paint-order': 'stroke' });
    g.x = 0; g.y = 0; g.s = 1;
    g.ke = (x, y) => { g.x = x; g.y = y; MG.pindah(g, x, y, g.s); };
    g.skala = (s) => { g.s = Math.max(0.01, s); MG.pindah(g, g.x, g.y, g.s); };
    return g;
  }

  function binaWg(ctx, o) {
    const lap = {};
    ['dasar', 'stesen', 'paket', 'cop'].forEach((n) => (lap[n] = ctx.lapisan(n)));
    const cfg = Object.assign({}, ASAL);

    // kad packet
    const kad = G(lap.dasar);
    el('rect', { x: 420, y: 20, width: 880, height: 152, rx: 16, fill: W.kad, stroke: W.garis, 'stroke-width': 2 }, kad);
    teks(kad, 442, 52, 'PACKET', { 'font-size': 16, 'font-weight': 800, fill: W.pudar, 'letter-spacing': 0.8 });
    const md = {};
    [['isi', 'Isi (dalam)', 88], ['luar', 'Bungkusan luar', 122], ['laluan', 'Laluan', 156]].forEach((m) => {
      teks(kad, 442, m[2], m[1], { 'font-size': 16, 'font-weight': 700, fill: W.pudar });
      md[m[0]] = teks(kad, 600, m[2], '—', { 'font-size': 19, 'font-weight': 700 });
    });

    // sekolah
    const kg = KUMP.staf;
    MG.zon({ x: 20, y: 230, width: 284, height: 640, rx: 18, fill: kg.cerah, stroke: kg.warna, 'stroke-width': 2.5 }, lap.dasar);
    teks(lap.dasar, 38, 266, 'Sekolah (SSeM)', { 'font-size': 22, 'font-weight': 800 });
    MG.peranti(lap.dasar, 'pc', PC.x, PC.y, { warna: kg.warna, skrin: '#fff' });
    teks(lap.dasar, PC.x, PC.y + 70, 'PC Staf', { 'font-size': 17, 'font-weight': 800, 'text-anchor': 'middle' });
    teks(lap.dasar, PC.x, PC.y + 92, '172.16.22.57', { 'font-size': 16, class: 'mono', 'text-anchor': 'middle' });
    el('line', { x1: PC.x + 40, y1: PC.y, x2: 320, y2: PC.y, stroke: kg.warna, 'stroke-width': 5 }, lap.dasar);
    teks(lap.dasar, 38, 560, 'VLAN 20 · Staff', { 'font-size': 16, 'font-weight': 700, fill: W.pudar });
    teks(lap.dasar, 38, 584, 'Hujung tunnel: 10.255.0.5', { 'font-size': 16, 'font-weight': 700, fill: W.pudar });

    // router SSeM + stesen
    MG.rak(lap.dasar, 320, 230, 330, 640, 'ROUTER', 'SSeM');
    MG.garisan(lap.dasar, [{ x: LORONG, y: 300 }, { x: LORONG, y: 846 }], { stroke: '#5E6B6E', 'stroke-width': 4, 'stroke-dasharray': '2 6', 'stroke-linecap': 'round' });
    const st = {};
    [['route', '1 · Routing'], ['fw', '2 · Firewall forward'], ['nat', '3 · NAT srcnat'], ['wg', '4 · wireguard1']].forEach((s) => {
      const b = STN[s[0]];
      const kotak = el('rect', { x: 338, y: b.y, width: 250, height: b.h - 8, rx: 10, fill: '#F4F2EC', stroke: '#8E897D', 'stroke-width': 2 }, lap.stesen);
      teks(lap.stesen, 352, b.y + 28, s[1], { 'font-size': 17, 'font-weight': 800 });
      const t2 = teks(lap.stesen, 352, b.y + 54, '', { 'font-size': 14, class: 'mono', fill: W.dakwat2 });
      const t3 = teks(lap.stesen, 352, b.y + 78, '', { 'font-size': 15, 'font-weight': 800 });
      st[s[0]] = { kotak, t2, t3 };
    });
    teks(lap.stesen, 352, STN.wg.y + 104, 'peer-HQ allowed-address', { 'font-size': 13.5, fill: W.pudar });
    const tAllowed = teks(lap.stesen, 352, STN.wg.y + 124, '', { 'font-size': 13.5, class: 'mono', fill: W.dakwat2 });

    // Internet + tiub
    MG.awan(lap.dasar, 846, 772, 1.45, null, '#EEF2F3');
    teks(lap.dasar, 846, 702, 'Internet', { 'font-size': 22, 'font-weight': 800, 'text-anchor': 'middle', fill: W.dakwat2 });
    el('line', { x1: 650, y1: TIUB_Y, x2: 1046, y2: TIUB_Y, stroke: '#3B4648', 'stroke-width': 44, 'stroke-linecap': 'round' }, lap.dasar);
    el('line', { x1: 650, y1: TIUB_Y, x2: 1046, y2: TIUB_Y, stroke: '#D5DEE1', 'stroke-width': 36, 'stroke-linecap': 'round' }, lap.dasar);
    el('line', { x1: 662, y1: TIUB_Y - 11, x2: 1034, y2: TIUB_Y - 11, stroke: '#fff', 'stroke-width': 4, opacity: 0.7, 'stroke-linecap': 'round' }, lap.dasar);
    for (let x = 700; x <= 1000; x += 60) el('line', { x1: x, y1: TIUB_Y - 18, x2: x, y2: TIUB_Y + 18, stroke: '#3B4648', 'stroke-width': 2, opacity: 0.35 }, lap.dasar);
    teks(lap.dasar, 672, TIUB_Y + 46, 'tunnel WireGuard', { 'font-size': 16, 'font-weight': 800, fill: W.dakwat2, stroke: '#EEF2F3', 'stroke-width': 5, 'paint-order': 'stroke' });
    MG.garisan(lap.dasar, [{ x: LORONG, y: 846 }, { x: 650, y: 846 }, { x: 740, y: 846 }], { stroke: W.dakwat2, 'stroke-width': 5 });
    teks(lap.dasar, 666, 868, 'pppoe-unifi (biasa)', { 'font-size': 14, 'font-weight': 700, fill: W.pudar });

    // HQ
    MG.zon({ x: 1032, y: 230, width: 268, height: 640, rx: 18, fill: '#E6EEF2', stroke: '#4B6B8A', 'stroke-width': 2.5 }, lap.dasar);
    teks(lap.dasar, 1050, 266, 'HQ (pejabat)', { 'font-size': 22, 'font-weight': 800 });
    teks(lap.dasar, 1050, 290, '192.168.0.0/24', { 'font-size': 15, class: 'mono', fill: W.pudar });
    MG.peranti(lap.dasar, 'pelayan', SERVER.x, SERVER.y, { warna: '#4B6B8A', skrin: '#fff' });
    teks(lap.dasar, SERVER.x, SERVER.y + 64, 'Server HQ', { 'font-size': 17, 'font-weight': 800, 'text-anchor': 'middle' });
    teks(lap.dasar, SERVER.x, SERVER.y + 85, '192.168.0.x', { 'font-size': 15, class: 'mono', 'text-anchor': 'middle' });
    MG.peranti(lap.dasar, 'laptop', LAPTOP.x, LAPTOP.y, { warna: '#4B6B8A', skrin: '#fff' });
    teks(lap.dasar, LAPTOP.x, LAPTOP.y + 60, 'Komputer HQ', { 'font-size': 17, 'font-weight': 800, 'text-anchor': 'middle' });
    teks(lap.dasar, LAPTOP.x, LAPTOP.y + 81, '192.168.0.x', { 'font-size': 15, class: 'mono', 'text-anchor': 'middle' });
    MG.rak(lap.dasar, 1046, 688, 240, 110, 'HQ', null);
    teks(lap.dasar, 1166, 780, '10.255.0.1', { 'font-size': 15, class: 'mono', fill: '#B9C2C4', 'text-anchor': 'middle' });
    el('line', { x1: SERVER.x, y1: SERVER.y + 96, x2: SERVER.x, y2: LAPTOP.y - 36, stroke: '#4B6B8A', 'stroke-width': 4 }, lap.dasar);
    el('line', { x1: LAPTOP.x, y1: LAPTOP.y + 92, x2: LAPTOP.x, y2: 688, stroke: '#4B6B8A', 'stroke-width': 4 }, lap.dasar);

    // pemerhati (HTML supaya teks boleh berbalut)
    const pm = document.createElement('div');
    Object.assign(pm.style, { position: 'absolute', left: '662px', top: '236px', width: '326px', background: W.kad, border: '2px solid ' + W.garis, borderRadius: '14px', padding: '12px 14px', fontSize: '18px', lineHeight: '1.3', boxShadow: '0 6px 16px rgba(17,24,25,.07)' });
    pm.innerHTML = '<div style="display:flex;gap:10px;align-items:center;font-weight:800;font-size:17px;color:' + W.pudar + ';text-transform:uppercase;letter-spacing:.6px"><svg width="34" height="22" viewBox="0 0 34 22"><path d="M2 11 Q17 -4 32 11 Q17 26 2 11 Z" fill="#fff" stroke="#111819" stroke-width="2.5"/><circle cx="17" cy="11" r="5.5" fill="#111819"/></svg>Pemerhati di Internet</div><div class="isiPm" style="margin-top:6px">Belum ada packet lalu.</div>';
    ctx.html.appendChild(pm);
    const pmIsi = pm.querySelector('.isiPm');
    const lihat = (h, jenis) => { pmIsi.innerHTML = h; pm.style.borderColor = jenis === 'sekat' ? W.sekat : jenis === 'benar' ? W.benar : W.garis; };

    function tulisStesen(arah, dest) {
      const viaWg = arah === 'masuk' || (dest === 'hq' && cfg.route);
      const set = (k, t2, t3, w) => { st[k].t2.textContent = t2; st[k].t3.textContent = t3 || ''; st[k].t3.setAttribute('fill', w || W.dakwat2); };
      tAllowed.textContent = cfg.allowed ? '10.255.0.0/24, 192.168.0.0/24' : '10.255.0.0/24';
      tAllowed.setAttribute('fill', cfg.allowed ? W.dakwat2 : W.sekat);
      if (arah === 'masuk') {
        set('route', '172.16.22.0/23 (connected)', '');
        set('fw', cfg.fwHq ? 'Allow HQ WireGuard to access…' : 'DEFAULT DENY', '');
        set('nat', '(tiada NAT arah ini)', '');
        set('wg', 'buka kunci, semak peer', '');
        return;
      }
      set('route', viaWg ? '192.168.0.0/24 → 10.255.0.1' : dest === 'hq' ? 'tiada route HQ → 0.0.0.0/0' : '0.0.0.0/0 → pppoe-unifi', viaWg ? '→ keluar wireguard1' : '→ keluar pppoe-unifi');
      set('fw', viaWg ? (cfg.fw ? 'Allow Site LAN to HQ…' : 'DEFAULT DENY') : 'Allow LAN to WAN', '');
      set('nat', viaWg ? 'Masquerade to HQ WireGuard' : 'masquerade ke WAN', '');
      set('wg', viaWg ? 'kunci & bungkus' : '(tidak dilalui)', '');
    }

    function sorot(k, w) { Object.keys(st).forEach((x) => { st[x].kotak.setAttribute('stroke', x === k ? (w || W.dakwat) : '#8E897D'); st[x].kotak.setAttribute('stroke-width', x === k ? 4 : 2); }); }

    const S = { cfg };
    S.bersih = () => { MG.kosong(lap.paket); MG.kosong(lap.cop); sorot(null); };
    S.pulih = () => Object.assign(cfg, ASAL);

    async function gagal(s, x, y, teks2, sebab) {
      await MG.cop(s, lap.cop, x, y, teks2, 'sekat');
      if (o.padaHasil) o.padaHasil(false, sebab);
    }

    S.hantar = async (s, arah, dest) => {
      S.bersih();
      tulisStesen(arah, dest);
      const kerja = { teks: (k, t, w) => { st[k].t3.textContent = t; st[k].t3.setAttribute('fill', w || W.dakwat2); } };
      if (arah === 'masuk') return masuk(s, kerja);
      const keHq = dest === 'hq';
      const dIp = keHq ? '192.168.0.x' : 'laman web';
      md.isi.textContent = `172.16.22.57 → ${dIp}`; md.luar.textContent = '—'; md.laluan.textContent = '…';
      lihat('Belum ada packet lalu.');
      const env = MG.sampul(lap.paket, { warna: KUMP.staf.warna, label: '172.16.22.57', saiz: 1.1 });
      await MG.gerak(s, env, [{ x: PC.x + 40, y: PC.y }, { x: LORONG, y: PC.y }], { laju: 600 });
      // 1 routing
      sorot('route');
      const viaWg = keHq && cfg.route;
      kerja.teks('route', viaWg ? '→ keluar wireguard1 ✓' : '→ keluar pppoe-unifi', viaWg ? W.benar : W.dakwat2);
      md.laluan.textContent = viaWg ? 'wireguard1 → peer-HQ' : 'pppoe-unifi (tanpa tunnel)';
      await s.tunggu(900);
      // 2 firewall
      await MG.gerak(s, env, [{ x: LORONG, y: env.y }, { x: LORONG, y: STN.fw.cy }], { laju: 420, ease: MG.ease.io });
      sorot('fw');
      if (viaWg && !cfg.fw) {
        kerja.teks('fw', '✗ DROP', W.sekat); sorot('fw', W.sekat);
        return gagal(s, LORONG - 120, STN.fw.cy + 4, 'DROP', 'Rule “Allow Site LAN to HQ WireGuard” dimatikan → DEFAULT DENY. Route yang betul tidak mencukupi; firewall mesti membenarkannya.');
      }
      kerja.teks('fw', '✓ accept', W.benar);
      await s.tunggu(700);
      // 3 NAT
      await MG.gerak(s, env, [{ x: LORONG, y: env.y }, { x: LORONG, y: STN.nat.cy }], { laju: 420, ease: MG.ease.io });
      sorot('nat');
      if (viaWg) {
        env.setLabel('10.255.0.5');
        md.isi.textContent = `10.255.0.5 → ${dIp}`;
        kerja.teks('nat', 'src → 10.255.0.5', W.aksen);
      } else {
        env.setLabel('IP WAN sekolah');
        kerja.teks('nat', 'src → IP WAN (Unifi)', W.aksen);
      }
      await s.tunggu(900);
      if (!viaWg) {
        await MG.gerak(s, env, [{ x: LORONG, y: env.y }, { x: LORONG, y: 846 }, { x: 740, y: 846 }], { laju: 520 });
        sorot(null);
        if (keHq) {
          lihat('Nampak <b>semuanya</b>: alamat 192.168.0.x dan kandungan packet (tiada kunci WireGuard).', 'sekat');
          return gagal(s, 790, 650, 'HILANG', 'Tanpa route ke HQ, packet keluar melalui Unifi. 192.168.0.x ialah alamat IP private — Internet tidak tahu ke mana, jadi ia dibuang.');
        }
        lihat('Nampak alamat laman web. Isi dilindungi oleh HTTPS laman itu sendiri, bukan oleh tunnel.', 'benar');
        await MG.cop(s, lap.cop, 790, 650, 'KE INTERNET', 'benar');
        if (o.padaHasil) o.padaHasil(true, 'Trafik Internet biasa <b>tidak</b> masuk ke tunnel. Hanya destinasi dalam route HQ (192.168.0.0/24) dibungkus.');
        return;
      }
      // 4 wireguard1
      await MG.gerak(s, env, [{ x: LORONG, y: env.y }, { x: LORONG, y: STN.wg.cy }], { laju: 420, ease: MG.ease.io });
      sorot('wg');
      await s.tunggu(400);
      if (!cfg.allowed) {
        kerja.teks('wg', '✗ tiada peer padan', W.sekat); sorot('wg', W.sekat);
        return gagal(s, LORONG - 130, STN.wg.cy - 14, 'DIBUANG', '192.168.0.x tiada dalam allowed-address mana-mana peer. WireGuard tidak tahu ke peer mana hendak dihantar, jadi packet dibuang.');
      }
      kerja.teks('wg', '✓ peer-HQ · dikunci', W.benar);
      const kk = kotakKunci(lap.paket);
      kk.ke(LORONG, STN.wg.cy); kk.skala(0.01);
      await s.tween(500, (p) => kk.skala(p), MG.ease.keluarLantun);
      env.setAttribute('visibility', 'hidden');
      md.luar.textContent = 'WAN sekolah → endpoint HQ · UDP · disulitkan';
      await s.tunggu(500);
      await MG.gerak(s, kk, [{ x: LORONG, y: STN.wg.cy }, { x: LORONG, y: TIUB_Y }, { x: 846, y: TIUB_Y }], { laju: 460 });
      lihat('Hanya nampak: <b>sekolah → HQ, UDP</b>. Alamat 192.168.0.x dan isi <b>tidak</b> boleh dibaca.', 'benar');
      await s.tunggu(1200);
      await MG.gerak(s, kk, [{ x: 846, y: TIUB_Y }, { x: SERVER.x, y: TIUB_Y }], { laju: 460 });
      await s.tween(400, (p) => kk.skala(1 - p), MG.ease.io);
      kk.remove();
      env.removeAttribute('visibility'); env.ke(SERVER.x, TIUB_Y);
      env.setLabel('');
      await MG.gerak(s, env, [{ x: SERVER.x, y: TIUB_Y }, { x: SERVER.x, y: SERVER.y + 110 }, { x: SERVER.x - 66, y: SERVER.y + 110 }, { x: SERVER.x - 66, y: SERVER.y + 10 }], { laju: 520 });
      await MG.cop(s, lap.cop, SERVER.x + 16, SERVER.y + 118, 'SAMPAI', 'benar');
      if (o.padaHasil) o.padaHasil(true, 'Server HQ menerima packet daripada <b>10.255.0.5</b> (selepas masquerade), bukan 172.16.22.57.');
    };

    async function masuk(s, kerja) {
      md.isi.textContent = '192.168.0.x → 172.16.22.57'; md.luar.textContent = '…'; md.laluan.textContent = 'peer-HQ → wireguard1';
      lihat('Belum ada packet lalu.');
      const env = MG.sampul(lap.paket, { warna: '#4B6B8A', label: '192.168.0.x', saiz: 1.1 });
      await MG.gerak(s, env, [{ x: LAPTOP.x, y: LAPTOP.y + 40 }, { x: LAPTOP.x, y: TIUB_Y }], { laju: 520 });
      const kk = kotakKunci(lap.paket);
      kk.ke(LAPTOP.x, TIUB_Y); kk.skala(0.01);
      await s.tween(450, (p) => kk.skala(p), MG.ease.keluarLantun);
      env.setAttribute('visibility', 'hidden');
      md.luar.textContent = 'endpoint HQ → WAN sekolah · UDP · disulitkan';
      await MG.gerak(s, kk, [{ x: LAPTOP.x, y: TIUB_Y }, { x: 846, y: TIUB_Y }], { laju: 460 });
      lihat('Hanya nampak: <b>HQ → sekolah, UDP</b>. Isi tidak boleh dibaca.', 'benar');
      await s.tunggu(900);
      await MG.gerak(s, kk, [{ x: 846, y: TIUB_Y }, { x: LORONG, y: TIUB_Y }, { x: LORONG, y: STN.wg.cy }], { laju: 460 });
      sorot('wg');
      await s.tween(400, (p) => kk.skala(1 - p), MG.ease.io);
      kk.remove();
      env.removeAttribute('visibility'); env.ke(LORONG, STN.wg.cy);
      kerja.teks('wg', '✓ dibuka · sumber dibenarkan', W.benar);
      await s.tunggu(700);
      // susunan sebenar: routing dahulu, kemudian firewall forward; tiada srcnat untuk arah ini
      await MG.gerak(s, env, [{ x: LORONG, y: STN.wg.cy }, { x: LORONG, y: STN.route.cy }], { laju: 420, ease: MG.ease.io });
      sorot('route'); kerja.teks('route', '→ terus ke VLAN 20 ✓', W.benar);
      await s.tunggu(700);
      await MG.gerak(s, env, [{ x: LORONG, y: STN.route.cy }, { x: LORONG, y: STN.fw.cy }], { laju: 420, ease: MG.ease.io });
      sorot('fw');
      if (!cfg.fwHq) {
        kerja.teks('fw', '✗ DROP', W.sekat); sorot('fw', W.sekat);
        return gagal(s, LORONG - 120, STN.fw.cy + 4, 'DROP', 'Tunnel hidup, tetapi rule “Allow HQ WireGuard to access Site LAN” dimatikan. Tunnel tidak memintas firewall.');
      }
      kerja.teks('fw', '✓ accept (in wireguard1)', W.benar);
      await s.tunggu(700);
      await MG.gerak(s, env, [{ x: LORONG, y: STN.fw.cy }, { x: LORONG, y: STN.route.cy }, { x: PC.x + 40, y: PC.y }], { laju: 600 });
      sorot(null);
      await MG.cop(s, lap.cop, PC.x, PC.y + 150, 'SAMPAI', 'benar');
      if (o.padaHasil) o.padaHasil(true, 'Admin HQ boleh sampai ke rangkaian sekolah kerana rule forward khusus untuk <b>in-interface=wireguard1</b>.');
    }

    tulisStesen('keluar', 'hq');
    return S;
  }

  const RSC = {
    kod: [
      '/interface wireguard peers\nadd <mark>allowed-address=10.255.0.0/24,192.168.0.0/24</mark> comment="Peer to HQ Server" \\\n    <i>(endpoint &amp; kunci disembunyikan)</i> interface=wireguard1 name=peer-HQ',
      '/ip route\nadd comment="Route to HQ Office LAN" <mark>dst-address=192.168.0.0/24</mark> gateway=\\\n    <mark>10.255.0.1</mark> routing-table=main',
      '/ip firewall nat\nadd action=<mark>masquerade</mark> chain=srcnat comment="Masquerade to HQ WireGuard" \\\n    out-interface=wireguard1',
    ],
    fungsi: 'Route memilih tunnel; allowed-address menentukan peer mana; firewall memberi kebenaran; masquerade menukar sumber kepada 10.255.0.5. (Petikan sebenar SSeM; endpoint dan kunci tidak dipaparkan.)',
  };

  function langkah(tajuk, teks2, pilihan, extra) {
    return Object.assign({
      tajuk, teks: teks2, rsc: RSC,
      bina(ctx) {
        const papan = ctx.papan({ mula: ['WireGuard', '—', 'Tekan Hantar.'] });
        const S = binaWg(ctx, { padaHasil: (ok, ket) => papan.set('Keputusan', ok ? 'Berjaya' : 'Gagal', ket, ok ? 'benar' : 'sekat') });
        let arah = 'keluar', dest = 'hq';
        const hantar = () => { papan.set('WireGuard', '…', 'Packet sedang bergerak.'); return ctx.jalan((s) => S.hantar(s, arah, dest)); };
        if (pilihan.dest) ctx.segmen('Destinasi', [{ v: 'hq', t: 'Server HQ' }, { v: 'internet', t: 'Laman Internet' }], dest, (v) => { dest = v; hantar(); });
        if (pilihan.arah) ctx.segmen('Arah', [{ v: 'keluar', t: 'Sekolah → HQ' }, { v: 'masuk', t: 'HQ → Sekolah' }], arah, (v) => { arah = v; hantar(); });
        const togol = [];
        if (pilihan.syarat) {
          const k = ctx.kumpulan('Tiga syarat (klik untuk matikan)');
          togol.push(['route', ctx.togol('Route 192.168.0.0/24', true, (v) => { S.cfg.route = v; hantar(); }, { dalam: k })]);
          togol.push(['allowed', ctx.togol('allowed-address HQ', true, (v) => { S.cfg.allowed = v; hantar(); }, { dalam: k })]);
          togol.push(['fw', ctx.togol('Firewall: Site LAN → HQ', true, (v) => { S.cfg.fw = v; hantar(); }, { dalam: k })]);
        }
        if (pilihan.arah) togol.push(['fwHq', ctx.togol('Firewall: HQ → Site LAN', true, (v) => { S.cfg.fwHq = v; hantar(); })]);
        const k2 = ctx.kumpulan();
        ctx.butang('▶ Hantar packet', hantar, { utama: true, dalam: k2 });
        if (togol.length) ctx.butang('↺ Pulihkan tetapan SSeM', () => { S.pulih(); togol.forEach((t) => t[1].set(true)); hantar(); }, { dalam: k2 });
        if (this.nota) ctx.nota(this.nota);
        hantar();
      },
    }, extra || {});
  }

  const L1 = langkah('Tunnel ke HQ',
    'Sekolah dan HQ berada di dua tempat, dihubungkan melalui Internet. <b>WireGuard</b> membungkus packet dalaman ke dalam bungkusan berkunci, lalu menghantarnya kepada router HQ.',
    {}, { analogi: 'Surat dalaman dimasukkan ke dalam beg berkunci dan dihantar melalui pos awam. Posmen tahu beg itu dari sekolah ke HQ, tetapi tidak boleh membuka dan membaca surat di dalamnya.' });
  const L2 = langkah('Hanya trafik HQ masuk ke tunnel',
    'Tunnel bukan untuk semua trafik. Route <b>192.168.0.0/24</b> sahaja yang menghala ke tunnel; laman Internet biasa keluar melalui Unifi seperti biasa.',
    { dest: true }, { nota: 'Lihat kotak “Pemerhati di Internet”: apa yang orang luar boleh nampak bagi setiap jalan.' });
  const L3 = langkah('Tiga syarat mesti betul',
    'Untuk sampai ke HQ, tiga perkara perlu betul: <b>route</b> (pilih tunnel), <b>allowed-address</b> (WireGuard tahu peer mana), dan <b>firewall</b> (beri kebenaran). Matikan satu demi satu dan lihat di mana packet berhenti.',
    { syarat: true });
  const L4 = langkah('Arah balik: HQ ke sekolah',
    'Admin HQ juga boleh masuk ke rangkaian sekolah melalui tunnel yang sama. Firewall SSeM ada rule berasingan untuk arah ini.',
    { arah: true }, { nota: 'Tunnel tidak memintas firewall. Setiap arah perlu rule forward sendiri.' });

  MG.daftarBab({
    id: 'wireguard', no: 9, tajuk: 'WireGuard ke HQ', sub: 'Tunnel berkunci merentas Internet', status: 'siap',
    ringkas: 'Packet dalaman dibungkus dan dikunci; Internet hanya nampak sekolah → HQ.',
    langkah: [L1, L2, L3, L4],
    ikonMenu(s) {
      el('line', { x1: 34, y1: 60, x2: 266, y2: 60, stroke: '#2B3437', 'stroke-width': 26, 'stroke-linecap': 'round' }, s);
      el('rect', { x: 150, y: 48, width: 30, height: 24, rx: 4, fill: '#D9B65C', stroke: '#111819', 'stroke-width': 2 }, s);
      el('path', { d: 'M157 48 V42 a8 8 0 0 1 16 0 V48', fill: 'none', stroke: '#E9E6DE', 'stroke-width': 3 }, s);
    },
  });
})();
