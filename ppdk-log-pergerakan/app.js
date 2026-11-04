/* Paparan contoh Log Pergerakan (tanpa fungsi laporan). Data ILUSTRASI (nama, tempat dan masa rekaan).
   Suis peranan dan masa demo ialah alat mockup, BUKAN kawalan keselamatan. */
(function () {
  'use strict';
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  var ss = {
    get: function (k, d) { try { var v = sessionStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } },
    set: function (k, v) { try { sessionStorage.setItem(k, v); return true; } catch (e) { return false; } },
    del: function (k) { try { sessionStorage.removeItem(k); } catch (e) {} }
  };

  /* ---------- Ikon (gaya garis A-1) ---------- */
  var P = {
    office: '<path d="M4 21V5l8-3 8 3v16M9 21v-5h6v5M8 9h2M14 9h2M8 13h2M14 13h2"/>',
    out: '<path d="M10 4H4v16h6M14 8l4 4-4 4M18 12H9"/>',
    in: '<path d="M14 4h6v16h-6M10 8l-4 4 4 4M6 12h9"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/>',
    book: '<path d="M4 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4z"/><path d="M20 4h-4a2 2 0 0 0-2 2"/><path d="M20 4v14h-6"/>',
    pin: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    cal: '<rect x="3" y="5" width="18" height="16"/><path d="M3 10h18M8 3v4M16 3v4M9.5 14.5l5 5M14.5 14.5l-5 5"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3.6-3.6a4 4 0 0 0-5.7-5.7L12 6.3"/><path d="M14 10a4 4 0 0 0-5.7 0l-3.6 3.6a4 4 0 0 0 5.7 5.7L12 17.7"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    back: '<path d="M15 18l-6-6 6-6"/>',
    next: '<path d="m9 18 6-6-6-6"/>',
    check: '<path d="m5 12 5 5 9-10"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
    lock: '<rect x="4" y="10" width="16" height="11"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    home: '<path d="M3 11 12 4l9 7M5 10v10h14V10"/>',
    warn: '<path d="M12 3 2 21h20z"/><path d="M12 10v5M12 18v.5"/>',
    download: '<path d="M12 4v11M7 10l5 5 5-5M4 20h16"/>',
    print: '<path d="M6 9V3h12v6M6 18H3v-8h18v8h-3"/><rect x="6" y="14" width="12" height="7"/>',
    logout: '<path d="M15 4h5v16h-5M10 8l-4 4 4 4M6 12h11"/>'
  };
  function icon(n, cls) { return '<svg class="i ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (P[n] || '') + '</svg>'; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  /* ---------- Data ilustrasi ---------- */
  var SEKTOR = [
    { k: 'SPr', n: 'Sektor Perancangan' }, { k: 'SPb', n: 'Sektor Pembelajaran' },
    { k: 'SPS', n: 'Sektor Pengurusan Sekolah' }, { k: 'SPbM', n: 'Sektor Pembangunan Murid' },
    { k: 'SPsK', n: 'Sektor Psikologi & Kaunseling' }, { k: 'SPP', n: 'Sektor Pentaksiran & Peperiksaan' },
    { k: 'Pengurusan', n: 'Pengurusan (termasuk Unit ICT)' }
  ];
  function sekName(k) { for (var i = 0; i < SEKTOR.length; i++) if (SEKTOR[i].k === k) return SEKTOR[i].n; return k; }
  function sk(k) { return '<span class="sk" style="--sc:var(--s-' + (k === 'Pengurusan' ? 'PGR' : k) + ')" title="' + sekName(k) + '">' + (k === 'Pengurusan' ? 'PGR' : k) + '</span>'; }

  var STAF = [
    { id: 's1', n: 'Nur Aina Hashim', sek: 'SPb', jaw: 'Pegawai SISC+ Matematik' },
    { id: 's2', n: 'Rahman Jali', sek: 'SPb', jaw: 'Ketua Sektor Pembelajaran', ketua: true },
    { id: 's3', n: 'Ahmad Faizal Rosli', sek: 'SPb', jaw: 'Pegawai SISC+ Sains' },
    { id: 's4', n: 'Lim Mei Ling', sek: 'SPb', jaw: 'Pegawai SISC+ Bahasa Inggeris' },
    { id: 's5', n: 'Siti Hajar Osman', sek: 'SPS', jaw: 'Ketua Sektor Pengurusan Sekolah', ketua: true },
    { id: 's6', n: 'Kevin anak Jimbun', sek: 'SPS', jaw: 'Pegawai Pengurusan Sekolah' },
    { id: 's7', n: 'Norazlina Kamal', sek: 'SPbM', jaw: 'Ketua Sektor Pembangunan Murid', ketua: true },
    { id: 's8', n: 'Hafiz Rahim', sek: 'SPbM', jaw: 'Pegawai Sukan' },
    { id: 's16', n: 'Patricia anak Nyandang', sek: 'SPsK', jaw: 'Ketua Sektor Psikologi & Kaunseling', ketua: true },
    { id: 's9', n: 'Dayang Norliza Abang', sek: 'SPsK', jaw: 'Pegawai Psikologi' },
    { id: 's17', n: 'Tan Boon Huat', sek: 'SPP', jaw: 'Ketua Sektor Pentaksiran & Peperiksaan', ketua: true },
    { id: 's10', n: 'Jason Ting', sek: 'SPP', jaw: 'Pegawai Peperiksaan' },
    { id: 's11', n: 'Rosnah Abdullah', sek: 'SPr', jaw: 'Ketua Sektor Perancangan', ketua: true },
    { id: 's12', n: 'Mohd Amirul Hakim', sek: 'SPr', jaw: 'Pegawai Data' },
    { id: 's18', n: 'Salmah Bujang', sek: 'Pengurusan', jaw: 'Ketua Unit Pengurusan', ketua: true },
    { id: 's13', n: 'Wong Kah Seng', sek: 'Pengurusan', jaw: 'Juruteknik Unit ICT' },
    { id: 's14', n: 'Farah Nadia Yusof', sek: 'Pengurusan', jaw: 'Pembantu Tadbir' },
    { id: 's15', n: 'Ismail Bujang', sek: 'Pengurusan', jaw: 'Pemandu' },
    { id: 's0', n: 'Zulkifli Ahmad', sek: 'Pengurusan', jaw: 'Ketua Pegawai Pendidikan Daerah', kppd: true }
  ];
  function staf(id) { for (var i = 0; i < STAF.length; i++) if (STAF[i].id === id) return STAF[i]; return null; }
  /* Penyemak Buku bagi setiap sektor (Pengurusan: Ketua Unit Pengurusan). KPPD menyemak semua. */
  function ketuaOf(sek) { for (var i = 0; i < STAF.length; i++) if (STAF[i].sek === sek && STAF[i].ketua) return STAF[i]; return null; }
  function ini(n) { var p = n.replace(/\b(anak|bin|binti)\b/gi, '').split(/\s+/).filter(Boolean); return (p[0][0] + (p[1] ? p[1][0] : '')).toUpperCase(); }
  function first(n) { var p = n.split(' '); return p.length > 2 ? p[0] + ' ' + p[1] : p[0]; }

  var ROLES = {
    staf: { id: 'staf', label: 'Staf', sid: 's1' },
    ketua: { id: 'ketua', label: 'Ketua Sektor', sid: 's2' },
    kppd: { id: 'kppd', label: 'KPPD', sid: 's0' }
  };
  var TUJUAN = ['Lawatan sekolah', 'Mesyuarat', 'Bengkel / kursus', 'Program / acara', 'Urusan rasmi lain', 'Urusan peribadi'];
  var TEMPAT = ['SK Bukit Indah', 'SMK Permata Kuching', 'SK Seri Rimba', 'SMK Taman Mutiara', 'SK Desa Cempaka', 'SK Sungai Teduh',
    'SJK(C) Chung Hwa Damai', 'SK Sri Kenyalang', 'SMK Bandar Baru Kenari', 'SK Pantai Damai', 'SK Kampung Pinang', 'SK Lembah Hijau',
    'SMK Seri Matang Baru', 'SK Tanjung Mawar', 'SK Puncak Batu', 'SMK Teluk Bayu', 'Jabatan Pendidikan Negeri', 'Pejabat Pos', 'Bank'];
  var TODAY = '2026-10-15', TAMAT_KERJA = '17:00';
  /* Peraturan integriti (dalam produksi dikuatkuasakan oleh pelayan, jam pelayan). */
  var HAD_LEWAT = 15;      /* minit: rekod keluar dibuat lebih lewat daripada ini ditanda "Direkod lewat" */
  var HAD_UNDUR = 120;     /* minit: masa pergi tidak boleh lebih awal daripada ini sebelum sekarang */
  var HAD_BATAL = 15;      /* minit selepas masa keluar: selepas itu rekod tidak boleh dibatalkan */
  var HAD_HARI = 14;       /* tugas luar paling lama (hari) dalam satu rekod */
  var SIMPAN_BULAN = 12;   /* tempoh simpan Buku (cadangan) */
  var JENIS_CUTI = ['Cuti rehat', 'Cuti sakit', 'Cuti lain'];

  /* Rekod: satu baris = satu kali keluar. masuk null = masih di luar. jangka null + pulang = tidak kembali hari ini.
     hingga = tarikh akhir tugas luar beberapa hari. dibuat = masa rekod disimpan (jam pelayan).
     batal = masa dibatalkan (rekod kekal untuk jejak audit). betul = tarikh masa masuk diisi kemudian. */
  function seed() {
    var L = [], n = 0;
    function a(sid, d, kel, jangka, masuk, dest, tuj, extra) {
      var r = { id: 'G' + (++n), sid: sid, d: d, keluar: kel, jangka: jangka, masuk: masuk, dest: dest, tuj: tuj };
      if (extra) for (var k in extra) r[k] = extra[k];
      L.push(r);
    }
    /* Hari lepas */
    a('s1', '2026-10-12', '08:30', '12:00', '11:48', 'SK Desa Cempaka', 'Lawatan sekolah');
    a('s1', '2026-10-12', '14:30', '16:00', '15:52', 'SMK Taman Mutiara', 'Lawatan sekolah');
    a('s3', '2026-10-12', '08:15', '13:00', '13:20', 'SK Sungai Teduh', 'Lawatan sekolah');
    a('s5', '2026-10-12', '09:00', '11:00', '10:40', 'Jabatan Pendidikan Negeri', 'Mesyuarat');
    a('s15', '2026-10-12', '10:00', '10:45', '10:35', 'Pejabat Pos', 'Urusan rasmi lain');
    a('s14', '2026-10-12', '12:40', '13:30', '13:25', 'Klinik Kesihatan', 'Urusan peribadi');
    a('s1', '2026-10-13', '08:05', null, null, 'Jabatan Pendidikan Negeri', 'Bengkel / kursus', { pulang: true });
    a('s4', '2026-10-13', '08:20', '12:30', '12:15', 'SK Bukit Indah', 'Lawatan sekolah');
    a('s8', '2026-10-13', '07:40', null, null, 'Stadium Negeri', 'Program / acara', { pulang: true });
    a('s10', '2026-10-13', '09:30', '11:00', '11:05', 'SMK Teluk Bayu', 'Urusan rasmi lain');
    a('s11', '2026-10-13', '14:00', '16:30', '16:10', 'Jabatan Pendidikan Negeri', 'Mesyuarat');
    a('s1', '2026-10-14', '09:00', '12:30', '12:41', 'SK Seri Rimba', 'Lawatan sekolah');
    a('s1', '2026-10-14', '14:15', '16:00', null, 'SK Lembah Hijau', 'Lawatan sekolah'); /* lupa rekod masuk */
    a('s2', '2026-10-14', '08:30', '10:30', '10:20', 'Jabatan Pendidikan Negeri', 'Mesyuarat');
    a('s4', '2026-10-14', '07:45', null, null, 'IPG Kampus Batu Lintang', 'Bengkel / kursus', { pulang: true, hingga: '2026-10-16', nota: 'Kursus Pentaksiran Bilik Darjah 3 hari' });
    a('s9', '2026-10-14', '10:00', '11:00', null, 'SK Sri Kenyalang', 'Lawatan sekolah', { batal: '10:06' });
    a('s6', '2026-10-14', '14:10', '16:00', null, 'SK Pantai Damai', 'Lawatan sekolah'); /* lupa rekod masuk */
    a('s9', '2026-10-14', '08:45', '12:00', '11:50', 'SMK Seri Matang Baru', 'Program / acara');
    a('s13', '2026-10-14', '10:15', '11:30', '11:25', 'SK Kampung Pinang', 'Urusan rasmi lain');
    a('s12', '2026-10-14', '16:20', null, null, 'Bank', 'Urusan peribadi', { pulang: true });
    /* Hari ini, sebelum 08:42 */
    a('s3', TODAY, '08:10', '12:30', null, 'SK Seri Rimba', 'Lawatan sekolah');
    a('s5', TODAY, '08:00', '11:00', null, 'Jabatan Pendidikan Negeri', 'Mesyuarat');
    a('s8', TODAY, '07:45', null, null, 'Stadium Negeri', 'Program / acara', { pulang: true });
    a('s10', TODAY, '08:15', '08:35', null, 'SMK Taman Mutiara', 'Urusan rasmi lain', { dibuat: '08:38' }); /* direkod lewat */
    a('s15', TODAY, '08:30', '10:00', null, 'Pejabat Pos', 'Urusan rasmi lain');
    a('s14', TODAY, '07:50', '08:30', '08:25', 'Klinik Kesihatan', 'Urusan peribadi');
    a('s13', TODAY, '08:05', '09:30', null, 'SK Bukit Indah', 'Urusan rasmi lain');
    L.forEach(function (r) { if (!r.dibuat) r.dibuat = r.keluar; });
    return L;
  }
  /* Cuti / tidak hadir: dari–hingga (termasuk). Jenis hanya dilihat pemilik, ketua sektornya dan KPPD. */
  function seedCuti() {
    return [
      { id: 'C1', sid: 's7', dari: TODAY, hingga: '2026-10-16', jenis: 'Cuti rehat' },
      { id: 'C2', sid: 's12', dari: TODAY, hingga: TODAY, jenis: 'Cuti sakit' },
      { id: 'C3', sid: 's1', dari: '2026-10-22', hingga: '2026-10-23', jenis: 'Cuti rehat' }
    ];
  }
  var KEY = 'ppdk-gerak-v2', KCUTI = 'ppdk-gerak-cuti-v2', KJAM = 'ppdk-gerak-jam';
  var LOG, CUTI;
  try { LOG = JSON.parse(ss.get(KEY, 'null')) || seed(); } catch (e) { LOG = seed(); }
  try { CUTI = JSON.parse(ss.get(KCUTI, 'null')) || seedCuti(); } catch (e) { CUTI = seedCuti(); }
  function persist() { return ss.set(KEY, JSON.stringify(LOG)) && ss.set(KCUTI, JSON.stringify(CUTI)); }
  var seq = LOG.reduce(function (m, r) { return Math.max(m, +r.id.slice(1) || 0); }, 0);
  var seqC = CUTI.reduce(function (m, r) { return Math.max(m, +r.id.slice(1) || 0); }, 0);

  /* ---------- Masa (jam demo; dalam produksi = jam pelayan) ---------- */
  function toMin(t) { var p = t.split(':'); return +p[0] * 60 + +p[1]; }
  function hhmm(m) { m = Math.max(0, Math.min(23 * 60 + 59, m)); return ('0' + Math.floor(m / 60)).slice(-2) + ':' + ('0' + m % 60).slice(-2); }
  function now() { return ss.get(KJAM, '08:42'); }
  function setNow(t) { ss.set(KJAM, t); document.dispatchEvent(new Event('jamchange')); }
  function dur(min) { min = Math.abs(min); var h = Math.floor(min / 60), m = min % 60; return (h ? h + ' j ' : '') + (m || !h ? m + ' min' : '').trim(); }
  var HARI = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];
  var BULAN = ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'];
  function dObj(iso) { var p = iso.split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); }
  function fmtDate(iso, yr) { var d = dObj(iso); return HARI[d.getDay()] + ', ' + d.getDate() + ' ' + BULAN[d.getMonth()] + (yr ? ' ' + d.getFullYear() : ''); }
  function addDays(iso, n) { var d = dObj(iso); d.setDate(d.getDate() + n); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function greet() { var m = toMin(now()); return m < 12 * 60 ? 'Selamat pagi' : m < 14 * 60 ? 'Selamat tengah hari' : m < 19 * 60 ? 'Selamat petang' : 'Selamat malam'; }

  /* ---------- Status ---------- */
  function fmtShort(iso) { var d = dObj(iso); return HARI[d.getDay()].slice(0, 3) + ' ' + d.getDate() + ' ' + BULAN[d.getMonth()].slice(0, 3); }
  /* Rekod meliputi tarikh d: keluar pada d, atau tugas luar beberapa hari yang merentasi d (dan belum ditutup sebelum d). */
  function covers(r, d) { return r.d === d || (!!r.hingga && r.d < d && d <= r.hingga && !(r.masukD && r.masukD < d)); }
  function openOf(sid) { /* rekod hari ini (atau tugas luar yang masih berjalan) yang belum ditutup */
    for (var i = LOG.length - 1; i >= 0; i--) { var r = LOG[i]; if (r.sid === sid && !r.masuk && !r.batal && covers(r, TODAY)) return r; }
    return null;
  }
  function today(sid) {
    return LOG.filter(function (r) { return r.sid === sid && !r.batal && covers(r, TODAY); })
      .sort(function (a, b) { return (a.d < TODAY ? -1 : toMin(a.keluar)) - (b.d < TODAY ? -1 : toMin(b.keluar)); });
  }
  /* Rekod hari lepas yang tiada masa masuk (lupa tekan Masuk pejabat). */
  function tertunggak(sid) { return LOG.filter(function (r) { return r.sid === sid && r.d < TODAY && !r.masuk && !r.batal && !r.pulang; }); }
  function cutiOn(sid, d) {
    for (var i = 0; i < CUTI.length; i++) { var c = CUTI[i]; if (c.sid === sid && !c.batal && c.dari <= d && d <= c.hingga) return c; }
    return null;
  }
  function cutiSaya() { var id = me().id; return CUTI.filter(function (c) { return c.sid === id && !c.batal && c.hingga >= TODAY; }).sort(function (a, b) { return a.dari < b.dari ? -1 : 1; }); }
  /* k: pejabat | luar | lewat | pulang (tidak kembali hari ini / tugas luar) | cuti (tidak hadir) */
  function status(sid) {
    var r = openOf(sid);
    if (r && r.d === TODAY && toMin(r.keluar) > toMin(now())) return { k: 'pejabat', r: null, akan: r };
    if (!r) { var c = cutiOn(sid, TODAY); return c ? { k: 'cuti', r: null, c: c } : { k: 'pejabat', r: null }; }
    if (r.pulang) return { k: 'pulang', r: r };
    if (r.jangka && toMin(now()) > toMin(r.jangka)) return { k: 'lewat', r: r, lebih: toMin(now()) - toMin(r.jangka) };
    return { k: 'luar', r: r, baki: r.jangka ? toMin(r.jangka) - toMin(now()) : null };
  }
  var STL = { pejabat: 'Di pejabat', luar: 'Di luar pejabat', lewat: 'Melepasi jangka pulang', pulang: 'Tidak kembali hari ini', cuti: 'Tidak hadir' };
  function stLabel(st) { return st.k === 'pulang' && st.r && st.r.hingga && st.r.hingga > TODAY ? 'Tugas luar' : STL[st.k]; }
  function stChip(k, st) {
    var ic = { pejabat: 'office', luar: 'out', lewat: 'clock', pulang: 'home', cuti: 'cal' }[k];
    return '<span class="gst ' + k + '">' + icon(ic) + (st ? stLabel(st) : STL[k]) + '</span>';
  }
  /* Butiran peribadi (destinasi urusan peribadi, jenis cuti, tanda audit) hanya dilihat oleh pemilik,
     ketua sektornya dan KPPD. Ketua Unit Pengurusan tidak melihat butiran peribadi KPPD. */
  function canSeeFor(sid) {
    var m = me(), s = staf(sid);
    return m.id === sid || role() === 'kppd' || (role() === 'ketua' && !!s && s.sek === m.sek && !s.kppd);
  }
  function canSeePrivate(r) { return canSeeFor(r.sid); }
  function destOf(r) { return r.tuj === 'Urusan peribadi' && !canSeePrivate(r) ? '<span class="muted">Urusan peribadi</span>' : esc(r.dest); }
  function tujOf(r) { return r.tuj === 'Urusan peribadi' && !canSeePrivate(r) ? '' : esc(r.tuj); }
  function jenisCuti(c) { return canSeeFor(c.sid) ? esc(c.jenis) : 'Tidak hadir'; }
  /* Audit: rekod disimpan lebih HAD_LEWAT minit selepas masa keluar yang diisi. */
  function lewatRekod(r) { return r.dibuat && toMin(r.dibuat) - toMin(r.keluar) > HAD_LEWAT ? r.dibuat : null; }
  function bolehBatal(r) { return r.d === TODAY && toMin(now()) - toMin(r.keluar) <= HAD_BATAL; }
  function hinggaTxt(r) { return r.hingga && r.hingga > TODAY ? 'hingga ' + fmtShort(r.hingga) : 'tidak kembali'; }

  /* Satu baris pegawai untuk Papan dan Status saya. */
  function prRow(s, opts) {
    var st = status(s.id), r = st.r, w, tm;
    if (st.k === 'cuti') {
      w = '<span class="muted">' + jenisCuti(st.c) + '</span>';
      tm = '<b><span class="pl-n">' + (st.c.hingga > TODAY ? 'hingga ' + fmtShort(st.c.hingga) : 'hari ini') + '</span></b>';
    } else if (!r) {
      w = st.akan ? '<span class="muted">Akan keluar ' + st.akan.keluar + '</span>' : '';
      tm = '';
    } else {
      var t = tujOf(r);
      w = destOf(r) + (t ? '<small>' + t + '</small>' : '');
      /* Satu baris masa: keluar → jangka pulang; baris kedua = baki / lepas jangka. */
      tm = r.d !== TODAY ? '<b><span class="pl-n">' + hinggaTxt(r) + '</span></b><small>sejak ' + fmtShort(r.d) + '</small>' : '<b>' + r.keluar + ' → ' + (r.pulang ? '<span class="pl-n">' + hinggaTxt(r) + '</span>' : r.jangka) + '</b>' +
        (st.k === 'lewat' ? '<small class="lw">Lepas ' + dur(st.lebih) + '</small>' : st.k === 'luar' && st.baki != null ? '<small>lagi ' + dur(st.baki) + '</small>' : '');
    }
    return '<button type="button" class="pr' + (r ? '' : ' pej') + '" data-sid="' + s.id + '"><span class="avatar' + (r ? '' : ' pej') + '">' + ini(s.n) + '</span>' +
      '<div><div class="n">' + esc(s.n) + (s.id === me().id ? ' <span class="muted">(saya)</span>' : '') + '</div><div>' + sk(s.sek) + (opts && opts.noSt ? '' : stChip(st.k, st)) + '</div></div>' +
      '<div class="w">' + w + '</div><div class="tm">' + tm + '</div></button>';
  }
  /* Laci butiran pegawai: pergerakan hari ini. */
  function openPerson(sid) {
    var s = staf(sid), st = status(sid), list = today(sid);
    var body = '<div class="tags" style="margin-bottom:14px">' + sk(s.sek) + stChip(st.k, st) + '</div>' +
      '<dl class="dl"><dt>Jawatan</dt><dd>' + esc(s.jaw) + '</dd><dt>Sektor</dt><dd>' + esc(sekName(s.sek)) + '</dd>' +
      (st.k === 'cuti' ? '<dt>Tidak hadir</dt><dd>' + jenisCuti(st.c) + ' · ' + (st.c.dari === st.c.hingga ? fmtShort(st.c.dari) : fmtShort(st.c.dari) + ' – ' + fmtShort(st.c.hingga)) + '</dd>' : '') + '</dl>' +
      '<div class="section-t">Pergerakan hari ini</div>' + (list.length ? tlHtml(list) : '<p class="muted">Tiada rekod keluar hari ini.</p>');
    drawer({ kicker: fmtDate(TODAY), title: esc(s.n), body: body });
  }
  function tlHtml(list) {
    var ev = [];
    list.forEach(function (r) {
      var t = tujOf(r), lw = canSeeFor(r.sid) && r.d === TODAY ? lewatRekod(r) : null;
      if (r.d !== TODAY) {
        ev.push('<div class="ev o"><div class="t">—</div><div class="dot"></div><div class="b">Tugas luar · ' + destOf(r) + '<small>' + (t ? t + ' · ' : '') + 'sejak ' + fmtShort(r.d) + ', ' + hinggaTxt(r) + '</small></div></div>');
      } else {
        ev.push('<div class="ev o"><div class="t">' + r.keluar + '</div><div class="dot"></div><div class="b">Keluar · ' + destOf(r) + '<small>' + (t ? t + ' · ' : '') + (r.pulang ? (r.hingga ? 'tugas luar ' + hinggaTxt(r) : 'tidak kembali hari ini') : 'jangka pulang ' + r.jangka) + '</small>' +
          (lw ? '<small class="flag">Direkod lewat · disimpan ' + lw + '</small>' : '') + '</div></div>');
      }
      if (r.masuk) ev.push('<div class="ev"><div class="t">' + r.masuk + '</div><div class="dot"></div><div class="b">Masuk pejabat<small>' + (r.d === TODAY ? dur(toMin(r.masuk) - toMin(r.keluar)) + ' di luar' : 'tugas luar selesai') + '</small></div></div>');
    });
    return '<div class="tl">' + ev.join('') + '</div>';
  }

  /* ---------- Tindakan ---------- */
  function tryWrite(fn) { /* gagal simpan → kembalikan keadaan asal */
    var snap = JSON.stringify(LOG), snapC = JSON.stringify(CUTI); fn();
    if (!persist()) { LOG = JSON.parse(snap); CUTI = JSON.parse(snapC); toast('Tidak dapat disimpan. Cuba lagi.'); return false; }
    return true;
  }
  /* Dalam produksi: pelayan menolak masa pergi > HAD_UNDUR minit ke belakang dan merekod `dibuat` dengan jamnya sendiri. */
  function keluar(o) {
    var r = null;
    var ok = tryWrite(function () {
      r = { id: 'G' + (++seq), sid: me().id, d: TODAY, keluar: o.keluar, jangka: o.pulang ? null : o.jangka, masuk: null, dest: o.dest, tuj: o.tuj, dibuat: now(), baru: true };
      if (o.pulang) r.pulang = true;
      if (o.pulang && o.hingga && o.hingga > TODAY) r.hingga = o.hingga;
      if (o.nota) r.nota = o.nota;
      LOG.push(r);
    });
    return ok ? r : null;
  }
  function masuk(r, t) { return tryWrite(function () { r.masuk = t || now(); r.masukD = TODAY; }); }
  /* Isi masa masuk untuk rekod hari lepas: ditanda "dibetulkan" dengan masa pembetulan. */
  function isiMasuk(r, t) { return tryWrite(function () { r.masuk = t; r.betul = fmtShort(TODAY) + ' ' + now(); }); }
  function ubahJangka(r, t, pulang) { return tryWrite(function () { if (pulang) { r.pulang = true; r.jangka = null; } else { delete r.pulang; delete r.hingga; r.jangka = t; } }); }
  /* Batal = tanda sahaja; rekod kekal dalam Buku untuk ketua sektor & KPPD. */
  function batal(r) { if (!bolehBatal(r)) return false; return tryWrite(function () { r.batal = now(); }); }
  function cutiTambah(o) {
    var c = null;
    var ok = tryWrite(function () { c = { id: 'C' + (++seqC), sid: me().id, dari: o.dari, hingga: o.hingga, jenis: o.jenis, dibuat: now() }; CUTI.push(c); });
    return ok ? c : null;
  }
  function cutiBatal(c) { return tryWrite(function () { c.batal = now(); }); }

  /* ---------- Peranan & tema ---------- */
  function role() { var r = new URLSearchParams(location.search).get('role') || store.get('ppdk-gerak-peranan', 'staf'); return ROLES[r] ? r : 'staf'; }
  function me() { return staf(ROLES[role()].sid); }
  function setRole(r) { store.set('ppdk-gerak-peranan', r); document.documentElement.setAttribute('data-role', r); refreshBars(); document.dispatchEvent(new CustomEvent('rolechange', { detail: r })); }
  function theme() { var t = store.get('ppdk-demo-tema', ''); if (!t) t = (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light'; return t; }
  function setTheme(t) { store.set('ppdk-demo-tema', t); document.documentElement.setAttribute('data-theme', t); refreshBars(); }
  document.documentElement.setAttribute('data-role', role());
  document.documentElement.setAttribute('data-theme', theme());

  /* ---------- Shell: 3 menu ---------- */
  var NAV = [
    { id: 'saya', href: 'saya.html', ic: 'office', l: 'Status saya', m: 'Saya' },
    { id: 'papan', href: 'papan.html', ic: 'users', l: 'Papan Pergerakan', m: 'Papan' },
    { id: 'buku', href: 'buku.html', ic: 'book', l: 'Buku Pergerakan', m: 'Buku' },
    { id: 'pautan', href: 'pautan.html', ic: 'link', l: 'Pautan & QR', m: 'QR' }
  ];
  function toolHtml() {
    var r = role(), t = theme();
    return '<div class="mpanel" id="mpanel" hidden><div class="mono">Demo · data ilustrasi</div>' +
      '<div class="mlbl">Lihat sebagai</div><div class="seg" data-mock="role" role="group" aria-label="Lihat sebagai">' + ['staf', 'ketua', 'kppd'].map(function (k) { return '<button type="button" data-v="' + k + '" aria-pressed="' + (r === k) + '">' + ROLES[k].label + '</button>'; }).join('') + '</div>' +
      '<div class="mlbl">Masa demo · <b id="mjam">' + now() + '</b></div><div class="seg" data-mock="jam" role="group" aria-label="Masa demo"><button type="button" data-v="-30">−30 min</button><button type="button" data-v="30">+30 min</button><button type="button" data-v="60">+1 jam</button></div>' +
      '<div class="mlbl">Tema</div><div class="seg" data-mock="theme" role="group" aria-label="Tema"><button type="button" data-v="light" aria-pressed="' + (t === 'light') + '">Cerah</button><button type="button" data-v="dark" aria-pressed="' + (t === 'dark') + '">Gelap</button></div>' +
      '<div class="mlinks"><a href="index.html" target="_top">Halaman utama</a> <a href="#" id="mreset">Set semula data</a></div></div>' +
      '<button type="button" class="mfab" id="mfab" aria-expanded="false" aria-controls="mpanel">Demo · ' + ROLES[r].label + ' · ' + now() + '</button>';
  }
  function refreshBars() {
    var tl = document.getElementById('mtool');
    if (tl) { var open = !document.getElementById('mpanel').hidden; tl.innerHTML = toolHtml(); if (open) { document.getElementById('mpanel').hidden = false; document.getElementById('mfab').setAttribute('aria-expanded', 'true'); } }
    var who = document.getElementById('who'); if (who) who.innerHTML = whoHtml();
    var ma = document.getElementById('mavatar'); if (ma) ma.textContent = ini(me().n);
  }
  function whoHtml() { var m = me(); return '<span class="avatar">' + ini(m.n) + '</span><div><b>' + esc(m.n) + '</b><span>' + esc(m.jaw) + '</span></div>'; }
  document.addEventListener('jamchange', refreshBars);

  function mount(opts) {
    var body = document.body, content = document.getElementById('content');
    var tool = document.createElement('div'); tool.id = 'mtool'; tool.className = 'mtool'; tool.innerHTML = toolHtml();
    if (window.self === window.top) body.appendChild(tool);
    tool.addEventListener('click', function (e) {
      if (e.target.closest('#mreset')) { e.preventDefault(); ss.del(KEY); ss.del(KCUTI); ss.del(KJAM); ss.del('ppdk-gerak-pautan'); location.reload(); return; }
      if (e.target.closest('#mfab')) { var p = document.getElementById('mpanel'); p.hidden = !p.hidden; e.target.closest('#mfab').setAttribute('aria-expanded', !p.hidden); return; }
      var b = e.target.closest('button[data-v]'); if (!b) return;
      var g = b.parentNode.getAttribute('data-mock'), v = b.getAttribute('data-v');
      if (g === 'role') setRole(v);
      else if (g === 'theme') setTheme(v);
      else if (g === 'jam') setNow(hhmm(Math.max(7 * 60, Math.min(18 * 60, toMin(now()) + +v))));
    });
    if (opts.bare) return;
    var shell = document.createElement('div'); shell.className = 'shell';
    var navHtml = NAV.map(function (n, i) {
      return '<a href="' + n.href + '" class="' + (n.id === opts.page ? 'on' : '') + '"' + (n.id === opts.page ? ' aria-current="page"' : '') + '>' + icon(n.ic) + '<span>' + n.l + '</span><span class="k">0' + (i + 1) + '</span></a>';
    }).join('');
    shell.innerHTML =
      '<aside class="side"><a class="brand" href="saya.html">PPDK<i>.CH</i></a><div class="brand-sub mono">Log Pergerakan · data rekaan</div>' +
      '<nav class="nav" aria-label="Ruang kerja">' + navHtml + '</nav>' +
      '<div class="side-foot"><div class="who" id="who">' + whoHtml() + '</div>' +
      '<a href="index.html">' + icon('logout') + 'Log keluar</a></div></aside>' +
      '<div class="main"><header class="mtop"><a class="brand" href="saya.html">PPDK<i>.CH</i></a><span class="avatar" id="mavatar" title="' + esc(me().n) + '">' + ini(me().n) + '</span></header></div>';
    body.insertBefore(shell, content);
    shell.querySelector('.main').appendChild(content);
    var bn = document.createElement('nav'); bn.className = 'bnav'; bn.setAttribute('aria-label', 'Navigasi utama');
    bn.innerHTML = NAV.map(function (n) {
      return '<a href="' + n.href + '" class="' + (n.id === opts.page ? 'on' : '') + '"' + (n.id === opts.page ? ' aria-current="page"' : '') + '>' + icon(n.ic) + '<span>' + n.m + '</span></a>';
    }).join('');
    body.appendChild(bn);
  }

  /* ---------- Laci & toast ---------- */
  function drawer(o) {
    closeDrawer();
    var opener = document.activeElement;
    var s = document.createElement('div'); s.className = 'scrim'; s.id = 'dscrim';
    var d = document.createElement('aside'); d.className = 'drawer'; d.id = 'drawer'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-labelledby', 'drawer-title');
    d.innerHTML = '<div class="drawer-h"><div><div class="mono muted">' + (o.kicker || '') + '</div><h2 id="drawer-title">' + o.title + '</h2></div><button class="iconbtn" type="button" data-close aria-label="Tutup">' + icon('x') + '</button></div>' +
      '<div class="drawer-b">' + o.body + '</div>' + (o.foot ? '<div class="drawer-f">' + o.foot + '</div>' : '');
    document.body.appendChild(s); document.body.appendChild(d);
    s.addEventListener('click', closeDrawer);
    d.addEventListener('click', function (e) { if (e.target.closest('[data-close]')) closeDrawer(); });
    function onKey(e) { if (e.key === 'Escape') { e.preventDefault(); closeDrawer(); } }
    document.addEventListener('keydown', onKey, true);
    d._release = function () { document.removeEventListener('keydown', onKey, true); if (opener && opener.isConnected) opener.focus(); };
    var f = d.querySelector('[data-close]'); if (f) f.focus();
    if (o.onOpen) o.onOpen(d);
    return d;
  }
  function closeDrawer() {
    var d = document.getElementById('drawer'), rel = d && d._release;
    ['drawer', 'dscrim'].forEach(function (id) { var el = document.getElementById(id); if (el) el.remove(); });
    if (rel) rel();
  }
  var tt;
  function toast(html) {
    var old = document.querySelector('.toast'); if (old) old.remove();
    var t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.innerHTML = '<span>' + html + '</span>'; document.body.appendChild(t);
    clearTimeout(tt); tt = setTimeout(function () { t.remove(); }, 4200);
  }

  window.G = {
    icon: icon, esc: esc, sk: sk, sekName: sekName, ini: ini, first: first,
    SEKTOR: SEKTOR, STAF: STAF, TUJUAN: TUJUAN, TEMPAT: TEMPAT, TODAY: TODAY, TAMAT_KERJA: TAMAT_KERJA, JENIS_CUTI: JENIS_CUTI,
    HAD_LEWAT: HAD_LEWAT, HAD_UNDUR: HAD_UNDUR, HAD_BATAL: HAD_BATAL, HAD_HARI: HAD_HARI, SIMPAN_BULAN: SIMPAN_BULAN,
    get LOG() { return LOG; }, get CUTI() { return CUTI; }, staf: staf, ketuaOf: ketuaOf, role: role, me: me, mount: mount, drawer: drawer, closeDrawer: closeDrawer, toast: toast,
    now: now, toMin: toMin, hhmm: hhmm, dur: dur, fmtDate: fmtDate, fmtShort: fmtShort, addDays: addDays, greet: greet,
    openOf: openOf, today: today, covers: covers, tertunggak: tertunggak, cutiOn: cutiOn, cutiSaya: cutiSaya, status: status, STL: STL, stLabel: stLabel, stChip: stChip,
    destOf: destOf, tujOf: tujOf, jenisCuti: jenisCuti, canSeePrivate: canSeePrivate, canSeeFor: canSeeFor, lewatRekod: lewatRekod, bolehBatal: bolehBatal, hinggaTxt: hinggaTxt,
    prRow: prRow, openPerson: openPerson, tlHtml: tlHtml,
    keluar: keluar, masuk: masuk, isiMasuk: isiMasuk, ubahJangka: ubahJangka, batal: batal, cutiTambah: cutiTambah, cutiBatal: cutiBatal, ss: ss, store: store
  };
})();
