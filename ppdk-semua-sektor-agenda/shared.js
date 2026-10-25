/* PPDK.CH semua sektor — paparan contoh. Data ilustrasi (nama, sekolah dan angka rekaan). */
(function () {
  'use strict';
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  /* ---------- Ikon (gaya garis A-1) ---------- */
  var P = {
    today: '<rect x="3" y="4" width="18" height="17"/><path d="M3 9h18M8 2v4M16 2v4"/><path d="m9 15 2 2 4-4"/>',
    cal: '<rect x="3" y="4" width="18" height="17"/><path d="M3 9h18M8 2v4M16 2v4M7 13h3M7 17h3M14 13h3"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    list: '<path d="M14 3H6v18h12V7z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
    slides: '<rect x="2" y="4" width="20" height="13"/><path d="M8 21h8M12 17v4M6 13l4-4 3 3 4-5"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    filter: '<path d="M3 5h18l-7 8v6l-4 2v-8z"/>',
    pin: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    online: '<rect x="2" y="5" width="14" height="14"/><path d="m16 10 6-3v10l-6-3"/>',
    office: '<path d="M4 21V5l8-3 8 3v16M9 21v-5h6v5M8 9h2M14 9h2M8 13h2M14 13h2"/>',
    lock: '<rect x="4" y="10" width="16" height="11"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    away: '<circle cx="12" cy="12" r="9"/><path d="M8 12h8"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    back: '<path d="M15 18l-6-6 6-6"/>',
    next: '<path d="m9 18 6-6-6-6"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6"/>',
    check: '<path d="m5 12 5 5 9-10"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/>',
    eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18"/>',
    camera: '<path d="M4 7h4l2-3h4l2 3h4v13H4z"/><circle cx="12" cy="13" r="4"/>',
    copy: '<rect x="8" y="8" width="13" height="13"/><path d="M16 8V3H3v13h5"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
    logout: '<path d="M15 4h5v16h-5M10 8l-4 4 4 4M6 12h11"/>',
    send: '<path d="M21 3 3 10l7 3 3 7z"/><path d="m10 13 4-4"/>',
    repeat: '<path d="M4 9V7h14l-3-3M20 15v2H6l3 3"/>',
    hybrid: '<rect x="2" y="6" width="10" height="9"/><path d="M12 9l4-2v8l-4-2M17 20s3-2.7 3-5a3 3 0 0 0-6 0c0 2.3 3 5 3 5z"/>',
    expand: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
    map: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
    fb: '<path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8z"/>'
  };
  function icon(n, cls) { return '<svg class="i ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (P[n] || '') + '</svg>'; }

  /* ---------- Data ilustrasi ---------- */
  var SEKTOR = [
    { k: 'SPr', n: 'Sektor Perancangan' },
    { k: 'SPb', n: 'Sektor Pembelajaran' },
    { k: 'SPS', n: 'Sektor Pengurusan Sekolah' },
    { k: 'SPbM', n: 'Sektor Pembangunan Murid' },
    { k: 'SPsK', n: 'Sektor Psikologi & Kaunseling' },
    { k: 'SPP', n: 'Sektor Pentaksiran & Peperiksaan' },
    { k: 'Pengurusan', n: 'Pengurusan (termasuk Unit ICT)' }
  ];
  var SEKOLAH = [
    { n: 'SK Bukit Indah', z: 1 }, { n: 'SMK Permata Kuching', z: 1 },
    { n: 'SK Seri Rimba', z: 2 }, { n: 'SMK Taman Mutiara', z: 2 }, { n: 'SK Desa Cempaka', z: 2 },
    { n: 'SK Sungai Teduh', z: 3 }, { n: 'SJK(C) Chung Hwa Damai', z: 3 },
    { n: 'SK Sri Kenyalang', z: 4 }, { n: 'SMK Bandar Baru Kenari', z: 4 },
    { n: 'SK Pantai Damai', z: 5 }, { n: 'SK Kampung Pinang', z: 5 },
    { n: 'SK Lembah Hijau', z: 6 }, { n: 'SMK Seri Matang Baru', z: 6 },
    { n: 'SK Tanjung Mawar', z: 7 }, { n: 'SK Puncak Batu', z: 7 },
    { n: 'SMK Teluk Bayu', z: 8 }
  ];
  var KATALOG = { /* katalog jenis aktiviti = input wajib sektor sebelum lancar (contoh SPb) */
    SPb: ['Lawatan pemantauan PdP', 'Bimbingan guru (SISC+)', 'Bengkel / kursus', 'Mesyuarat', 'Program murid', 'Audit / pemeriksaan', 'Lain-lain'],
    _: ['Lawatan sekolah', 'Mesyuarat', 'Bengkel / kursus', 'Program', 'Audit / pemeriksaan', 'Lain-lain']
  };
  var ROLES = {
    staf: { id: 'staf', label: 'Staf', name: 'Nur Aina Hashim', ini: 'NA', sek: 'SPb', jaw: 'Pegawai SISC+ Matematik' },
    ketua: { id: 'ketua', label: 'Ketua Sektor', name: 'Rahman Jali', ini: 'RJ', sek: 'SPb', jaw: 'Ketua Sektor Pembelajaran · penerbit SPb' },
    kppd: { id: 'kppd', label: 'KPPD', name: 'KPPD', ini: 'KP', sek: 'Pengurusan', jaw: 'Ketua Pegawai Pendidikan Daerah' }
  };
  function zoneOf(name) { for (var i = 0; i < SEKOLAH.length; i++) if (SEKOLAH[i].n === name) return SEKOLAH[i].z; return 0; }
  function zb(z) { return z ? '<span class="zb" style="--c:var(--z' + z + ')">ZON ' + z + '</span>' : ''; }
  function sk(k) { return '<span class="sk" style="--sc:var(--s-' + (k === 'Pengurusan' ? 'PGR' : k) + ')" title="' + sekName(k) + '">' + k + '</span>'; }
  function sekName(k) { for (var i = 0; i < SEKTOR.length; i++) if (SEKTOR[i].k === k) return SEKTOR[i].n; return k; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  /* ---------- Peranan & tema ---------- */
  function role() { var r = new URLSearchParams(location.search).get('role') || store.get('ppdk-demo-peranan', 'staf'); return ROLES[r] ? r : 'staf'; }
  function me() { return ROLES[role()]; }
  function setRole(r) { store.set('ppdk-demo-peranan', r); document.documentElement.setAttribute('data-role', r); refreshBars(); document.dispatchEvent(new CustomEvent('rolechange', { detail: r })); }
  function theme() { var t = store.get('ppdk-demo-tema', '') || document.documentElement.getAttribute('data-theme') || ''; if (!t) t =(window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light'; return t; }
  function setTheme(t) { store.set('ppdk-demo-tema', t); document.documentElement.setAttribute('data-theme', t); refreshBars(); }
  document.documentElement.setAttribute('data-role', role());
  document.documentElement.setAttribute('data-theme', theme());

  /* ---------- Shell ---------- */
  var NAV = [
    { id: 'hari', href: 'hari-ini.html', ic: 'today', l: 'Hari ini', m: 'Hari ini' },
    { id: 'jadual', href: 'jadual.html', ic: 'cal', l: 'Jadual', m: 'Jadual' },
    { id: 'rekod', href: 'rekod.html', ic: 'plus', l: 'Rekod', m: 'Rekod', plus: true },
    { id: 'aktiviti', href: 'aktiviti.html', ic: 'list', l: 'Rekod Aktiviti', m: 'Aktiviti' },
    { id: 'ringkasan', href: 'ringkasan.html', ic: 'slides', l: 'Ringkasan Bulanan', m: 'Ringkasan' }
  ];
  /* */
  function toolHtml(opts) {
    var r = role(), t = theme();
    return '<div class="mpanel" id="mpanel" hidden><div class="mono">Demo · data ilustrasi</div>' +
      (opts.noRole ? '' : '<div class="mlbl">Lihat sebagai</div><div class="seg" data-mock="role" role="group" aria-label="Lihat sebagai">' + ['staf', 'ketua', 'kppd'].map(function (k) { return '<button type="button" data-v="' + k + '" aria-pressed="' + (r === k) + '">' + ROLES[k].label + '</button>'; }).join('') + '</div>') +
      '<div class="mlbl">Tema</div><div class="seg" data-mock="theme" role="group" aria-label="Tema"><button type="button" data-v="light" aria-pressed="' + (t === 'light') + '">Cerah</button><button type="button" data-v="dark" aria-pressed="' + (t === 'dark') + '">Gelap</button></div>' +
      '<div class="mlinks"><a href="index.html" target="_top">Halaman utama</a> <a href="#" id="mreset">Set semula data</a></div></div>' +
      '<button type="button" class="mfab" id="mfab" aria-expanded="false" aria-controls="mpanel">Demo · ' + (opts.noRole ? 'Awam' : ROLES[r].label) + '</button>';
  }
  function refreshBars() {
    var tl = document.getElementById('mtool'); if (tl) { var open = !document.getElementById('mpanel').hidden; tl.innerHTML = toolHtml(tl._opts); if (open) { document.getElementById('mpanel').hidden = false; document.getElementById('mfab').setAttribute('aria-expanded', 'true'); } }
    var who = document.getElementById('who'); if (who) who.innerHTML = whoHtml();
    var ma = document.getElementById('mavatar'); if (ma) ma.textContent = me().ini;
  }
  function whoHtml() { var m = me(); return '<span class="avatar">' + m.ini + '</span><div><b>' + esc(m.name) + '</b><span>' + esc(m.jaw) + '</span></div>'; }

  function mount(opts) {
    var body = document.body;
    var content = document.getElementById('content');
    var tool = document.createElement('div'); tool.id = 'mtool'; tool.className = 'mtool'; tool._opts = opts; tool.innerHTML = toolHtml(opts);
    if (window.self === window.top) body.appendChild(tool);
    tool.addEventListener('click', function (e) {
      if (e.target.closest('#mreset')) { e.preventDefault(); sessionStorage.removeItem('ppdk-demo-data-v2'); sessionStorage.removeItem('ppdk-demo-mula'); location.reload(); return; }
      if (e.target.closest('#mfab')) { var p = document.getElementById('mpanel'); p.hidden = !p.hidden; e.target.closest('#mfab').setAttribute('aria-expanded', !p.hidden); return; }
      var b = e.target.closest('button[data-v]'); if (!b) return;
      var g = b.parentNode.getAttribute('data-mock');
      if (g === 'role') setRole(b.getAttribute('data-v'));
      else if (g === 'theme') setTheme(b.getAttribute('data-v'));
    });
    if (opts.bare) return;

    var shell = document.createElement('div'); shell.className = 'shell';
    var navHtml = NAV.filter(function (n) { return !n.plus; }).map(function (n) {
      return '<a href="' + n.href + '" class="' + (n.id === opts.page ? 'on' : '') + '"' + (n.id === opts.page ? ' aria-current="page"' : '') + '>' + icon(n.ic) + '<span>' + n.l + '</span><span></span></a>';
    }).join('');
    shell.innerHTML =
      '<aside class="side"><a class="brand" href="hari-ini.html">PPDK<i>.CH</i></a><div class="brand-sub mono">Staf · data rekaan</div>' +
      '<div class="side-cta"><a class="btn btn-ink btn-block" href="rekod.html">' + icon('plus') + 'Rekod</a></div>' +
      '<nav class="nav" aria-label="Ruang kerja">' + navHtml + '</nav>' +
      '<div class="side-foot"><a class="who" id="who" href="profil.html"' + (opts.page === 'profil' ? ' aria-current="page"' : '') + '>' + whoHtml() + '</a>' +
      '<a href="portal.html">' + icon('globe') + 'ppdk.ch</a>' +
      '<a href="log-masuk.html">' + icon('logout') + 'Log keluar</a></div></aside>' +
      '<div class="main"><header class="mtop"><a class="brand" href="hari-ini.html">PPDK<i>.CH</i> <small style="font:500 10px var(--mono)">· Demo</small></a><a class="avatar" id="mavatar" href="profil.html" aria-label="Profil saya">' + me().ini + '</a></header></div>';
    body.insertBefore(shell, content);
    shell.querySelector('.main').appendChild(content);
    var bn = document.createElement('nav'); bn.className = 'bnav'; bn.setAttribute('aria-label', 'Navigasi utama');
    bn.innerHTML = NAV.map(function (n) {
      var inner = n.plus ? '<span class="pbox">' + icon('plus') + '</span>' : icon(n.ic);
      return '<a href="' + n.href + '" class="' + (n.plus ? 'plus ' : '') + (n.id === opts.page ? 'on' : '') + '"' + (n.id === opts.page ? ' aria-current="page"' : '') + '>' + inner + '<span>' + n.m + '</span></a>';
    }).join('');
    body.appendChild(bn);
  }

  /* ---------- Laci & toast ---------- */
  function trapDialog(panel, opener, onEscape) {
    var previous = opener && opener.isConnected ? opener : document.activeElement;
    panel.setAttribute('tabindex', '-1');
    function focusable() {
      return [].filter.call(panel.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])'), function (el) {
        return el.getClientRects().length > 0 && el.getAttribute('aria-hidden') !== 'true';
      });
    }
    function onKey(e) {
      if (e.key === 'Escape') {
        e.preventDefault(); e.stopPropagation(); onEscape(); return;
      }
      if (e.key !== 'Tab') return;
      var items = focusable(), first = items[0], last = items[items.length - 1];
      if (!items.length) { e.preventDefault(); panel.focus(); return; }
      var active = document.activeElement;
      if (!panel.contains(active) || active === panel) {
        e.preventDefault(); (e.shiftKey ? last : first).focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault(); first.focus();
      }
    }
    document.addEventListener('keydown', onKey, true);
    var initial = panel.querySelector('[data-close], [data-n="x"]') || focusable()[0];
    if (initial) initial.focus(); else panel.focus();
    return function () {
      document.removeEventListener('keydown', onKey, true);
      if (previous && previous.isConnected) previous.focus();
    };
  }
  /* Senarai–butiran (komputer ≥1100px): laci bertanda `pane` dipapar dalam panel halaman, bukan di atas kandungan. */
  var paneHost = null;
  function setPane(el) { paneHost = el; }
  function paneOn() { return !!paneHost && window.matchMedia('(min-width:1100px)').matches; }
  function drawer(o) {
    if (o.pane && paneOn()) {
      closeModal(); var old = document.getElementById('pdrawer'); if (old) old.remove();
      var p = document.createElement('section'); p.className = 'drawer in-pane'; p.id = 'pdrawer'; p.setAttribute('aria-labelledby', 'pdrawer-title');
      p.innerHTML = '<div class="drawer-h"><div><div class="mono muted">' + (o.kicker || '') + '</div><h2 id="pdrawer-title" tabindex="-1">' + o.title + '</h2></div><button class="iconbtn" type="button" data-close aria-label="Tutup">' + icon('x') + '</button></div>' +
        '<div class="drawer-b">' + o.body + '</div>' + (o.foot ? '<div class="drawer-f">' + o.foot + '</div>' : '');
      paneHost.innerHTML = ''; paneHost.appendChild(p);
      p.addEventListener('click', function (e) { if (e.target.closest('[data-close]')) closeDrawer(); });
      paneHost.dispatchEvent(new Event('paneopen'));
      if (o.onOpen) o.onOpen(p);
      return p;
    }
    closeModal();
    var opener = document.activeElement;
    var s = document.createElement('div'); s.className = 'scrim'; s.id = 'dscrim';
    var d = document.createElement('aside'); d.className = 'drawer' + (o.wide ? ' wide' : ''); d.id = 'drawer'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-labelledby', 'drawer-title');
    d.innerHTML = '<div class="drawer-h"><div><div class="mono muted">' + (o.kicker || '') + '</div><h2 id="drawer-title">' + o.title + '</h2></div><button class="iconbtn" type="button" data-close aria-label="Tutup">' + icon('x') + '</button></div>' +
      '<div class="drawer-b">' + o.body + '</div>' + (o.foot ? '<div class="drawer-f">' + o.foot + '</div>' : '');
    document.body.appendChild(s); document.body.appendChild(d);
    s.addEventListener('click', closeDrawer);
    d.addEventListener('click', function (e) { if (e.target.closest('[data-close]')) closeDrawer(); });
    d._releaseFocus = trapDialog(d, opener, closeDrawer);
    if (o.onOpen) o.onOpen(d);
    return d;
  }
  /* Tutup laci modal dahulu; jika tiada, tutup butiran dalam panel. */
  function closeDrawer() {
    if (document.getElementById('drawer')) { closeModal(); return; }
    var p = document.getElementById('pdrawer'); if (p) { p.remove(); if (paneHost) paneHost.dispatchEvent(new Event('paneclose')); }
  }
  function closeModal() {
    var d = document.getElementById('drawer');
    var release = d && d._releaseFocus;
    ['drawer', 'dscrim'].forEach(function (id) { var el = document.getElementById(id); if (el) el.remove(); });
    if (release) release();
  }
  var tt;
  function toast(html) {
    var old = document.querySelector('.toast'); if (old) old.remove();
    var t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.innerHTML = html; document.body.appendChild(t);
    clearTimeout(tt); tt = setTimeout(function () { t.remove(); }, 4200);
  }

  /* ---------- Utiliti tarikh ---------- */
  var HARI = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];
  var BULAN = ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'];
  function fmtDate(iso, withDay) {
    var p = iso.split('-').map(Number); var d = new Date(p[0], p[1] - 1, p[2]);
    return (withDay !== false ? HARI[d.getDay()] + ', ' : '') + p[2] + ' ' + BULAN[p[1] - 1] + ' ' + p[0];
  }
  function dayName(iso) { var p = iso.split('-').map(Number); return HARI[new Date(p[0], p[1] - 1, p[2]).getDay()]; }

  window.M = {
    icon: icon, esc: esc, zb: zb, sk: sk, sekName: sekName, zoneOf: zoneOf,
    SEKTOR: SEKTOR, SEKOLAH: SEKOLAH, KATALOG: KATALOG, ROLES: ROLES,
    role: role, me: me, mount: mount, drawer: drawer, closeDrawer: closeDrawer, setPane: setPane, paneOn: paneOn, trapDialog: trapDialog, toast: toast,
    fmtDate: fmtDate, dayName: dayName, HARI: HARI, BULAN: BULAN, TODAY: '2026-10-15', store: store
  };
})();
