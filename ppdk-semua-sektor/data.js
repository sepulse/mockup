/* ADR-005 — data ILUSTRASI untuk mockup. Nama, sekolah dan angka rekaan.
   Satu rekod = satu aktiviti (bukan satu laporan setiap peserta). Cuti = jadual berasingan `ketidakhadiran`. */
(function () {
  'use strict';
  var STAF = [
    ['Nur Aina Hashim', 'SPb', 'Pegawai SISC+ Matematik'],
    ['Rahman Jali', 'SPb', 'Ketua Sektor Pembelajaran'],
    ['Ahmad Faizal Rosli', 'SPb', 'Pegawai SISC+ Sains'],
    ['Irwan Sulaiman', 'SPb', 'Penolong PPD Kurikulum'],
    ['Nancy Lim', 'SPb', 'Pegawai SISC+ Bahasa Inggeris'],
    ['Chong Mei Ling', 'SPP', 'Penolong PPD Peperiksaan'],
    ['Kong Wei Jie', 'SPP', 'Pegawai Pentaksiran'],
    ['Priya Nair', 'SPP', 'Pegawai Pentaksiran'],
    ['Dayang Norhayati', 'SPsK', 'Pegawai Psikologi'],
    ['Umi Kalsom', 'SPsK', 'Kaunselor Daerah'],
    ['Elvis Jimbun', 'SPS', 'Penolong PPD Pengurusan Sekolah'],
    ['Jamilah Bakar', 'SPS', 'Pegawai Pengurusan Sekolah'],
    ['Osman Kadir', 'SPS', 'Pegawai Pengurusan Sekolah'],
    ['Farah Wahida', 'SPbM', 'Penolong PPD Sukan'],
    ['Lina Marlissa', 'SPbM', 'Penolong PPD Kokurikulum'],
    ['Rosnah Ali', 'SPbM', 'Pegawai HEM'],
    ['Gerald Ujih', 'SPr', 'Penolong PPD Perancangan'],
    ['Mohd Hakimi', 'SPr', 'Pegawai Data'],
    ['Quek Siew Ling', 'SPr', 'Pegawai Perancangan'],
    ['Hafizah Osman', 'Pengurusan', 'Juruteknik Komputer · Unit ICT'],
    ['Tan Boon Hock', 'Pengurusan', 'Pegawai Teknologi Maklumat · Unit ICT'],
    ['KPPD', 'Pengurusan', 'Ketua Pegawai Pendidikan Daerah']
  ].map(function (a) { return { n: a[0], sek: a[1], jaw: a[2] }; });

  function R(o) {
    o.tamat = o.tamat || o.tarikh; o.peserta = o.peserta || []; o.sekolah = o.sekolah || [];
    o.status = o.status || 'dirancang'; o.laporan = o.laporan || 'belum'; o.tahap = o.tahap || 'dalaman';
    return o;
  }
  var REKOD = [
    /* --- Nur Aina (staf contoh) --- */
    R({ id: 'A101', tarikh: '2026-10-12', mula: '08:00', akhir: '12:00', owner: 'Nur Aina Hashim', sek: 'SPb', jenis: 'Bimbingan guru (SISC+)', tajuk: 'Bimbingan PdP Matematik Tahun 4', mod: 'fizikal', sekolah: ['SK Bukit Indah'], status: 'selesai', laporan: 'lengkap', tahap: 'umum', siri: 'Bimbingan PdP Matematik' }),
    R({ id: 'A102', tarikh: '2026-10-13', mula: '08:00', akhir: '13:00', owner: 'Nur Aina Hashim', sek: 'SPb', jenis: 'Bengkel / kursus', tajuk: 'Bengkel PBD Matematik Menengah Rendah', mod: 'fizikal', sekolah: ['SMK Taman Mutiara'], peserta: ['Ahmad Faizal Rosli'], status: 'selesai' }),
    R({ id: 'A103', tarikh: '2026-10-14', mula: '08:30', akhir: '12:00', owner: 'Nur Aina Hashim', sek: 'SPb', jenis: 'Lawatan pemantauan PdP', tajuk: 'Pemantauan PdP Matematik', mod: 'fizikal', sekolah: ['SK Desa Cempaka'], status: 'selesai', laporan: 'lengkap', mohon: true }),
    R({ id: 'A104', tarikh: '2026-10-15', mula: '08:00', akhir: '12:30', owner: 'Nur Aina Hashim', sek: 'SPb', jenis: 'Lawatan pemantauan PdP', tajuk: 'Pemantauan PdP Matematik', mod: 'fizikal', sekolah: ['SK Seri Rimba'] }),
    R({ id: 'A105', tarikh: '2026-10-15', mula: '14:30', akhir: '16:00', owner: 'Nur Aina Hashim', sek: 'SPb', jenis: 'Mesyuarat', tajuk: 'Mesyuarat JK Kurikulum Matematik Daerah', mod: 'atas_talian', lokasi: 'Google Meet', peserta: ['Rahman Jali'] }),
    R({ id: 'A106', tarikh: '2026-10-16', mula: '08:00', akhir: '11:30', owner: 'Nur Aina Hashim', sek: 'SPb', jenis: 'Bimbingan guru (SISC+)', tajuk: 'Bimbingan PdP Matematik Tahun 4', mod: 'fizikal', sekolah: ['SK Sungai Teduh', 'SJK(C) Chung Hwa Damai'], siri: 'Bimbingan PdP Matematik' }),
    R({ id: 'A107', tarikh: '2026-10-16', mula: '14:00', akhir: '16:00', owner: 'Nur Aina Hashim', sek: 'SPb', jenis: 'Mesyuarat', tajuk: 'Mesyuarat Panitia Matematik', mod: 'fizikal', sekolah: ['SK Sungai Teduh'], status: 'dibatalkan', batal: 'Ditunda oleh penganjur' }),
    R({ id: 'A108', tarikh: '2026-10-20', mula: '08:00', akhir: '12:00', owner: 'Nur Aina Hashim', sek: 'SPb', jenis: 'Lawatan pemantauan PdP', tajuk: 'Pemantauan PdP Matematik', mod: 'fizikal', sekolah: ['SK Kampung Pinang'] }),
    R({ id: 'A109', tarikh: '2026-10-22', mula: '08:00', akhir: '16:30', owner: 'Rahman Jali', sek: 'SPb', jenis: 'Bengkel / kursus', tajuk: 'Kursus Pembimbing PBD Daerah', mod: 'fizikal', lokasi: 'Dewan Seminar PPD Kuching', peserta: ['Nur Aina Hashim', 'Ahmad Faizal Rosli', 'Irwan Sulaiman'] }),

    /* --- Hari ini, pegawai lain --- */
    R({ id: 'B201', tarikh: '2026-10-15', mula: '09:00', akhir: '11:00', owner: 'KPPD', sek: 'Pengurusan', jenis: 'Mesyuarat', tajuk: 'Mesyuarat Pengurusan PPD Bil. 10/2026', mod: 'fizikal', lokasi: 'Pejabat PPD Kuching', peserta: ['Rahman Jali', 'Osman Kadir', 'Gerald Ujih'] }),
    R({ id: 'B202', tarikh: '2026-10-15', mula: '14:30', akhir: '17:00', owner: 'KPPD', sek: 'Pengurusan', jenis: 'Lawatan sekolah', tajuk: 'Ziarah Kepimpinan Sekolah', mod: 'fizikal', sekolah: ['SMK Permata Kuching'] }),
    R({ id: 'B203', tarikh: '2026-10-15', mula: '14:00', akhir: '16:30', owner: 'Rahman Jali', sek: 'SPb', jenis: 'Lawatan pemantauan PdP', tajuk: 'Pemantauan Program Literasi', mod: 'fizikal', sekolah: ['SK Kampung Pinang'] }),
    R({ id: 'B204', tarikh: '2026-10-15', mula: '08:00', akhir: '13:00', owner: 'Ahmad Faizal Rosli', sek: 'SPb', jenis: 'Bimbingan guru (SISC+)', tajuk: 'Bimbingan PdP Sains', mod: 'fizikal', sekolah: ['SMK Taman Mutiara', 'SK Desa Cempaka'] }),
    R({ id: 'B205', tarikh: '2026-10-15', mula: '08:00', akhir: '17:00', owner: 'Chong Mei Ling', sek: 'SPP', jenis: 'Mesyuarat', tajuk: 'Penyelarasan Logistik Peperiksaan SPM', mod: 'fizikal', lokasi: 'Pejabat PPD Kuching' }),
    R({ id: 'B206', tarikh: '2026-10-15', mula: '09:00', akhir: '12:00', owner: 'Dayang Norhayati', sek: 'SPsK', jenis: 'Lawatan sekolah', tajuk: 'Lawatan kes kaunseling', mod: 'fizikal', sekolah: ['SK Lembah Hijau'], tahap: 'sulit' }),
    R({ id: 'B207', tarikh: '2026-10-15', mula: '07:30', akhir: '13:00', owner: 'Farah Wahida', sek: 'SPbM', jenis: 'Program', tajuk: 'Karnival Sukan Murid Daerah', mod: 'fizikal', sekolah: ['SK Pantai Damai'] }),
    R({ id: 'B208', tarikh: '2026-10-15', mula: '10:00', akhir: '12:00', owner: 'Gerald Ujih', sek: 'SPr', jenis: 'Mesyuarat', tajuk: 'Semakan Data EMIS Suku 3', mod: 'atas_talian', lokasi: 'Microsoft Teams' }),
    R({ id: 'B209', tarikh: '2026-10-15', mula: '08:30', akhir: '16:30', owner: 'Hafizah Osman', sek: 'Pengurusan', jenis: 'Lawatan sekolah', tajuk: 'Sokongan Teknikal ICT', mod: 'fizikal', sekolah: ['SK Tanjung Mawar', 'SK Puncak Batu'] }),
    R({ id: 'B210', tarikh: '2026-10-14', tamat: '2026-10-16', mula: '08:00', akhir: '17:00', owner: 'Irwan Sulaiman', sek: 'SPb', jenis: 'Bengkel / kursus', tajuk: 'Bengkel Penulisan Modul Literasi', mod: 'fizikal', lokasi: 'Auditorium JPN Sarawak' }),
    R({ id: 'B211', tarikh: '2026-10-15', mula: '08:00', akhir: '10:00', owner: 'Kong Wei Jie', sek: 'SPP', jenis: 'Audit / pemeriksaan', tajuk: 'Pemantauan Peperiksaan Percubaan', mod: 'fizikal', sekolah: ['SMK Teluk Bayu'] }),
    R({ id: 'B212', tarikh: '2026-10-15', mula: '14:00', akhir: '17:00', owner: 'Lina Marlissa', sek: 'SPbM', jenis: 'Program', tajuk: 'Taklimat Kokurikulum 2027', mod: 'hibrid', sekolah: ['SK Sri Kenyalang'], lokasi: 'Dewan sekolah + Google Meet' }),
    R({ id: 'B213', tarikh: '2026-10-15', mula: '08:00', akhir: '17:00', owner: 'Mohd Hakimi', sek: 'SPr', jenis: 'Bengkel / kursus', tajuk: 'Bengkel Unjuran Enrolmen 2027', mod: 'fizikal', lokasi: 'Pejabat PPD Kuching' }),
    R({ id: 'B214', tarikh: '2026-10-15', mula: '08:00', akhir: '12:00', owner: 'Nancy Lim', sek: 'SPb', jenis: 'Lawatan pemantauan PdP', tajuk: 'Pemantauan PdP Bahasa Inggeris', mod: 'fizikal', sekolah: ['SK Bukit Indah'], status: 'dibatalkan', batal: 'Sekolah ada program mengejut' }),

    /* --- Sejarah lain (untuk Rekod Aktiviti & portal) --- */
    R({ id: 'C301', tarikh: '2026-10-09', mula: '08:00', akhir: '12:00', owner: 'Osman Kadir', sek: 'SPS', jenis: 'Audit / pemeriksaan', tajuk: 'Audit Program Susu Sekolah (Siri 2/3)', mod: 'fizikal', sekolah: ['SK Kampung Pinang', 'SK Pantai Damai'], status: 'selesai', laporan: 'lengkap', tahap: 'umum', siri: 'Audit Program Susu Sekolah' }),
    R({ id: 'C302', tarikh: '2026-10-08', mula: '09:00', akhir: '12:30', owner: 'Quek Siew Ling', sek: 'SPr', jenis: 'Mesyuarat', tajuk: 'Taklimat Perancangan Enrolmen 2027', mod: 'fizikal', lokasi: 'Dewan Seminar PPD Kuching', status: 'selesai', laporan: 'lengkap', tahap: 'umum' }),
    R({ id: 'C303', tarikh: '2026-10-07', mula: '08:30', akhir: '13:00', owner: 'Chong Mei Ling', sek: 'SPP', jenis: 'Mesyuarat', tajuk: 'Taklimat Pengurusan Peperiksaan SPM 2026', mod: 'fizikal', lokasi: 'Auditorium JPN Sarawak', status: 'selesai', laporan: 'lengkap' }),
    R({ id: 'C304', tarikh: '2026-10-13', mula: '20:00', akhir: '21:30', owner: 'Ahmad Faizal Rosli', sek: 'SPb', jenis: 'Program murid', tajuk: 'ChemEasy SPM — Sesi 12', mod: 'atas_talian', lokasi: 'Google Meet', status: 'selesai', laporan: 'lengkap', tahap: 'umum', siri: 'ChemEasy SPM' }),
    R({ id: 'C305', tarikh: '2026-10-09', mula: '08:30', akhir: '16:00', owner: 'Tan Boon Hock', sek: 'Pengurusan', jenis: 'Lawatan sekolah', tajuk: 'Sokongan Teknikal ICT', mod: 'fizikal', sekolah: ['SK Lembah Hijau'], status: 'selesai', laporan: 'lengkap', tahap: 'umum' }),
    R({ id: 'C306', tarikh: '2026-10-08', mula: '08:00', akhir: '12:00', owner: 'Rosnah Ali', sek: 'SPbM', jenis: 'Program', tajuk: 'Program Murid Sihat', mod: 'fizikal', sekolah: ['SMK Seri Matang Baru', 'SK Lembah Hijau'], status: 'selesai', laporan: 'lengkap', tahap: 'umum' }),
    R({ id: 'C307', tarikh: '2026-10-01', mula: '08:00', akhir: '13:00', owner: 'Umi Kalsom', sek: 'SPsK', jenis: 'Program', tajuk: 'Program Kesejahteraan Psikososial Murid', mod: 'fizikal', sekolah: ['SMK Seri Matang Baru'], status: 'selesai', laporan: 'lengkap' }),
    R({ id: 'C308', tarikh: '2026-10-06', mula: '08:00', akhir: '12:00', owner: 'Rahman Jali', sek: 'SPb', jenis: 'Lawatan pemantauan PdP', tajuk: 'Pemantauan Program Literasi', mod: 'fizikal', sekolah: ['SK Sri Kenyalang', 'SMK Bandar Baru Kenari'], status: 'selesai', laporan: 'lengkap', tahap: 'umum' })
  ];

  /* Ketidakhadiran: makluman sahaja (bukan kelulusan HRMIS). Jenis hanya dalam butiran terhad. */
  var CUTI = [
    { id: 'L1', owner: 'Elvis Jimbun', sek: 'SPS', dari: '2026-10-15', hingga: '2026-10-15', jenis: 'Cuti rehat' },
    { id: 'L2', owner: 'Jamilah Bakar', sek: 'SPS', dari: '2026-10-14', hingga: '2026-10-16', jenis: 'Cuti sakit', sakit: true },
    { id: 'L3', owner: 'Priya Nair', sek: 'SPP', dari: '2026-10-19', hingga: '2026-10-20', jenis: 'Cuti rehat' }
  ];

  function onDate(r, iso) { return r.tarikh <= iso && iso <= r.tamat; }
  function involves(r, name) { return r.owner === name || r.peserta.indexOf(name) >= 0; }
  function staf(name) { for (var i = 0; i < STAF.length; i++) if (STAF[i].n === name) return STAF[i]; return { n: name, sek: '', jaw: '' }; }

  /* Akses (ilustrasi dasar, bukan kod sebenar): sulit → pemilik/peserta, ketua sektor sama, KPPD. */
  function canSulit(r) {
    var m = M.me();
    return involves(r, m.name) || M.role() === 'kppd' || (M.role() === 'ketua' && m.sek === r.sek);
  }
  /* Jenis cuti: KPPD butiran berizin; ketua sektor sendiri bukan-sakit sahaja; staf tidak. */
  function canCutiType(c) {
    if (M.role() === 'kppd') return true;
    if (M.role() === 'ketua') return c.sek === M.me().sek && !c.sakit;
    return false;
  }
  function modIcon(r) { return r.mod === 'atas_talian' ? 'online' : r.mod === 'hibrid' ? 'hybrid' : (r.sekolah.length ? 'pin' : 'office'); }
  function where(r) {
    if (r.tahap === 'sulit' && !canSulit(r)) return { t: 'Tugas rasmi — lokasi dirahsiakan', ic: 'lock', hidden: true };
    if (r.mod === 'atas_talian') return { t: 'Tugas rasmi — Atas talian', ic: 'online' };
    var place = r.sekolah.length ? (r.sekolah.length > 2 ? r.sekolah.length + ' sekolah' : r.sekolah.join(', ')) : r.lokasi;
    return { t: 'Tugas rasmi — ' + (r.mod === 'hibrid' ? 'Hibrid · ' : '') + place, ic: modIcon(r) };
  }
  function zones(r) {
    var zs = []; r.sekolah.forEach(function (s) { var z = M.zoneOf(s); if (z && zs.indexOf(z) < 0) zs.push(z); });
    return zs.sort();
  }
  function zoneBadges() { return ''; } /* zon = konsep Unit ICT sahaja; tidak dipapar di staf.ppdk.ch */
  function timeLabel(r, iso) {
    if (r.tarikh !== r.tamat) {
      var a = Number(r.tarikh.slice(8)), b = Number(r.tamat.slice(8));
      return iso && r.tarikh < iso ? 'Hari ' + (Number(iso.slice(8)) - a + 1) + '/' + (b - a + 1) : a + '–' + b + ' Okt';
    }
    return r.mula + '–' + r.akhir;
  }
  function statusHtml(r, today) {
    if (r.status === 'dibatalkan') return '<span class="st cancel">' + M.icon('x') + 'Dibatalkan</span>';
    if (r.status === 'selesai' || r.tamat < (today || M.TODAY)) {
      if (r.laporan !== 'lengkap') return '<span class="st need">' + M.icon('clock') + 'Laporan belum lengkap</span>';
      if (r.tahap === 'umum') return '<span class="st pub">' + M.icon('globe') + 'Diterbitkan</span>';
      return '<span class="st done">' + M.icon('check') + (r.mohon ? 'Menunggu penerbit' : 'Laporan lengkap') + '</span>';
    }
    return '<span class="st plan">' + M.icon('clock') + 'Dirancang</span>';
  }
  function lvlHtml(r) {
    if (r.tahap === 'umum') return '<span class="lvl umum">' + M.icon('globe') + 'Umum</span>';
    if (r.tahap === 'sulit') return '<span class="lvl sulit">' + M.icon('lock') + 'Sulit</span>';
    return '<span class="lvl">' + M.icon('eye') + 'Dalaman</span>';
  }

  function tarikhLabel(r) { return r.tarikh === r.tamat ? M.fmtDate(r.tarikh) : M.fmtDate(r.tarikh) + ' – ' + M.fmtDate(r.tamat); }
  /* Versi tenang: satu blok utama (bila, di mana, siapa), satu tindakan utama, butiran lain dilipat. */
  function openRecord(r) {
    var m = M.me(), mine = r.owner === m.name, hid = r.tahap === 'sulit' && !canSulit(r);
    var w = where(r), past = r.tamat < M.TODAY || r.status === 'selesai';
    var when = tarikhLabel(r) + '<br><span class="big-t">' + (r.tarikh === r.tamat ? r.mula + '–' + r.akhir : r.mula + '–' + r.akhir + ' setiap hari') + '</span>';
    var body;
    if (hid) {
      body = '<div class="kv2"><div>' + when + '</div><div>' + M.icon('lock') + ' Tugas rasmi — lokasi dirahsiakan</div><div>' + M.esc(r.owner) + ' ' + M.sk(r.sek) + '</div></div>' +
        '<p class="hint" style="margin-top:14px">Butiran hanya untuk ketua sektor ' + r.sek + ' dan KPPD.</p>';
    } else {
      var place = r.mod === 'atas_talian' ? 'Atas talian' + (r.lokasi ? ' · ' + M.esc(r.lokasi) : '') : (r.sekolah.length ? r.sekolah.map(M.esc).join('<br>') : M.esc(r.lokasi || ''));
      if (r.mod === 'hibrid') place = 'Hibrid · ' + place;
      var flag = '';
      if (r.status === 'dibatalkan') flag = '<p class="flag">Dibatalkan' + (r.batal ? ' — ' + M.esc(r.batal) : '') + '</p>';
      else if (past && r.laporan !== 'lengkap') flag = '<p class="flag warn">Laporan belum lengkap</p>';
      else if (r.tahap === 'umum') flag = '<p class="flag ok">Diterbitkan di ppdk.ch</p>';
      else if (r.mohon) flag = '<p class="flag">Menunggu penerbit ' + r.sek + '</p>';
      body = flag + '<div class="kv2"><div>' + when + '</div><div>' + M.icon(w.ic) + '<span>' + place + '</span></div>' +
        '<div>' + M.icon('users') + '<span>' + M.esc(r.owner) + ' ' + M.sk(r.sek) + (r.peserta.length ? '<br>' + r.peserta.map(M.esc).join(', ') : '') + '</span></div></div>' +
        '<details class="more"><summary>Butiran lain</summary><dl class="dl" style="margin-top:10px"><dt>Jenis</dt><dd>' + M.esc(r.jenis) + '</dd>' +
        (r.siri ? '<dt>Siri</dt><dd>' + M.esc(r.siri) + '</dd>' : '') +
        '<dt>Akses</dt><dd>' + (r.tahap === 'umum' ? 'Umum' : r.tahap === 'sulit' ? 'Sulit' : 'Dalaman (staf sahaja)') + '</dd><dt>Rujukan</dt><dd>' + r.id + '</dd></dl></details>';
    }
    var foot = '<button class="btn btn-line" data-close>Tutup</button>';
    if (!hid && mine && r.status !== 'dibatalkan') {
      if (!past) foot = '<span class="links"><button class="text-btn" data-act="batal">Batal</button><a class="text-btn" href="rekod.html?salin=' + r.id + '">Salin</a></span><a class="btn btn-ink" href="rekod.html?ubah=' + r.id + '">Ubah</a>';
      else if (r.laporan !== 'lengkap') foot = '<span class="links"><a class="text-btn" href="rekod.html?salin=' + r.id + '">Salin</a></span><a class="btn btn-ink" href="aktiviti.html?lapor=' + r.id + '">Lengkapkan laporan</a>';
      else if (r.tahap === 'dalaman' && !r.mohon) foot = '<span class="links"><a class="text-btn" href="rekod.html?salin=' + r.id + '">Salin</a></span><a class="btn btn-ink" href="aktiviti.html?terbit=' + r.id + '">Mohon terbit</a>';
    }
    if (!hid && !mine && M.role() === 'ketua' && r.sek === m.sek && r.laporan === 'lengkap' && r.tahap === 'dalaman' && r.mohon)
      foot = '<button class="btn btn-line" data-close>Tutup</button><a class="btn btn-ink" href="aktiviti.html?terbit=' + r.id + '">Semak &amp; terbit</a>';
    var d = M.drawer({ title: hid ? 'Tugas rasmi' : M.esc(r.tajuk), body: body, foot: foot });
    var b = d.querySelector('[data-act="batal"]');
    if (b) b.addEventListener('click', function () {
      d.querySelector('.drawer-b').insertAdjacentHTML('beforeend', '<div class="restricted"><label class="lbl" for="sb">Sebab (pilihan)</label><input id="sb" type="text" placeholder="cth. Ditunda oleh sekolah"><div style="margin-top:10px"><button class="btn btn-dark btn-sm" data-act="sah">Sahkan batal</button></div></div>');
      b.disabled = true;
      d.querySelector('[data-act="sah"]').addEventListener('click', function () {
        r.status = 'dibatalkan'; r.batal = d.querySelector('#sb').value || '';
        M.closeDrawer(); M.toast('Rancangan dibatalkan'); document.dispatchEvent(new Event('datachange'));
      });
    });
  }
  function openCuti(c) {
    var allow = canCutiType(c), mine = c.owner === M.me().name;
    var tempoh = c.dari === c.hingga ? M.fmtDate(c.dari) + ' · Sehari' : M.fmtDate(c.dari) + ' – ' + M.fmtDate(c.hingga);
    var body = '<dl class="dl"><dt>Pegawai</dt><dd>' + M.esc(c.owner) + ' ' + M.sk(c.sek) + '</dd><dt>Tempoh</dt><dd>' + tempoh + '</dd><dt>Jadual</dt><dd>' + M.icon('away') + ' Tidak di pejabat</dd></dl>' +
      (allow ? '<div class="restricted" id="rst"><div class="mono muted">Butiran terhad</div><p class="hint" style="margin:6px 0 10px">Akses direkod.</p><button class="btn btn-dark btn-sm" data-act="open">' + M.icon('lock') + 'Buka butiran terhad</button></div>'
        : '<p class="note box" style="margin-top:16px">' + M.icon('info') + '<span>Makluman sahaja.</span></p>');
    var d = M.drawer({ kicker: 'Ketidakhadiran', title: 'Tidak di pejabat', body: body, foot: mine ? '<a class="btn btn-ink" href="rekod.html?jenis=cuti">Ubah makluman</a>' : '<button class="btn btn-line" data-close>Tutup</button>' });
    var b = d.querySelector('[data-act="open"]');
    if (b) b.addEventListener('click', function () {
      d.querySelector('#rst').innerHTML = '<div class="mono muted">Butiran terhad</div><dl class="dl" style="margin-top:10px"><dt>Jenis</dt><dd><b>' + c.jenis + '</b></dd><dt>Sumber</dt><dd>Makluman pegawai · disahkan HR</dd></dl><p class="hint" style="margin-top:10px">Tiada diagnosis, destinasi atau lampiran disimpan. Panel ditutup bila anda tukar rekod.</p>';
    });
  }

  function ini(n) { if (n === 'KPPD') return 'KP'; return n.split(/\s+/).slice(0, 2).map(function (w) { return w[0]; }).join('').toUpperCase(); }
  function emel(n) { return n.toLowerCase().replace(/[^a-z]+/g, '.').replace(/^\.|\.$/g, '') + '@moe.gov.my'; }
  /* Kad pegawai: identiti + jadual hari ini. Asas Direktori Staf kemudian. */
  function openKad(n) {
    var s = staf(n), T = M.TODAY, es = [];
    REKOD.forEach(function (r) { if (onDate(r, T) && r.status !== 'dibatalkan' && involves(r, n)) es.push({ r: r }); });
    CUTI.forEach(function (c) { if (c.dari <= T && T <= c.hingga && c.owner === n) es.push({ c: c }); });
    es.sort(function (a, b) { return (a.r ? a.r.mula : '') < (b.r ? b.r.mula : '') ? -1 : 1; });
    var list = es.map(function (e) {
      if (e.c) return '<button class="li" data-c="' + e.c.id + '"><span class="t">Sehari</span><span><span class="n">Tidak di pejabat</span></span><span></span></button>';
      var w = where(e.r);
      return '<button class="li" data-r="' + e.r.id + '"><span class="t">' + timeLabel(e.r, T) + '</span><span><span class="n">' + M.esc(w.t.replace('Tugas rasmi — ', '')) + '</span>' + (w.hidden ? '' : '<span class="s" style="display:block">' + M.esc(e.r.tajuk) + '</span>') + '</span><span></span></button>';
    }).join('') || '<div class="empty">Tiada jadual direkodkan hari ini.</div>';
    var d = M.drawer({ title: 'Pegawai', body: '<div class="kad-h"><span class="avatar lg">' + ini(n) + '</span><div><b>' + M.esc(n) + '</b><span>' + M.esc(s.jaw) + '</span><span>' + M.sk(s.sek) + ' ' + M.esc(M.sekName(s.sek)) + '</span></div></div>' +
      '<dl class="dl"><dt>E-mel rasmi</dt><dd><a class="text-btn" href="mailto:' + emel(n) + '" onclick="return false">' + emel(n) + '</a></dd></dl>' +
      '<div class="sec-t" style="margin-top:22px"><h2>Hari ini</h2><span>ikut rekod</span></div><div class="list">' + list + '</div>' });
    d.addEventListener('click', function (e) {
      var t = e.target.closest('[data-r]'), c = e.target.closest('[data-c]');
      if (t) openRecord(REKOD.filter(function (x) { return x.id === t.getAttribute('data-r'); })[0]);
      if (c) openCuti(CUTI.filter(function (x) { return x.id === c.getAttribute('data-c'); })[0]);
    });
  }

  window.D = { STAF: STAF, ini: ini, emel: emel, openKad: openKad, tarikhLabel: tarikhLabel, openRecord: openRecord, openCuti: openCuti, REKOD: REKOD, CUTI: CUTI, onDate: onDate, involves: involves, staf: staf,
    canSulit: canSulit, canCutiType: canCutiType, where: where, zones: zones, zoneBadges: zoneBadges,
    timeLabel: timeLabel, statusHtml: statusHtml, lvlHtml: lvlHtml, modIcon: modIcon };
})();
