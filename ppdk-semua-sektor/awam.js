/* PPDK.CH semua sektor — paparan contoh. Data ilustrasi (nama, sekolah dan angka rekaan). */
(function () {
  'use strict';
  var DESC = {
    SPr: 'Data murid dan sekolah, unjuran enrolmen, perancangan pembangunan dan EMIS.',
    SPb: 'Kurikulum, bimbingan guru (SISC+), literasi dan numerasi.',
    SPS: 'Pengurusan dan pentadbiran sekolah, audit program sekolah.',
    SPbM: 'Sukan, kokurikulum, disiplin dan kesejahteraan murid.',
    SPsK: 'Psikologi, kaunseling dan sokongan psikososial.',
    SPP: 'Pentaksiran, peperiksaan awam dan PBD.',
    Pengurusan: 'Pentadbiran, kewangan, sumber manusia dan Unit ICT.'
  };
  var KETUA = { SPr: 'Hasnah Ibrahim', SPb: 'Rahman Jali', SPS: 'Wong Kah Leng', SPbM: 'Mohd Ridzuan Ali', SPsK: 'Salmah Abdullah', SPP: 'Jonathan Sim', Pengurusan: 'Noraini Kassim' };
  var EXTRA = [
    { id: 'P1', tarikh: '2026-10-05', sek: 'SPbM', tajuk: 'Kejohanan Olahraga MSSD Kuching', sekolah: ['SK Pantai Damai'], mod: 'fizikal', lokasi: '', peserta: [] },
    { id: 'P2', tarikh: '2026-10-02', sek: 'SPb', tajuk: 'Karnival Literasi Daerah', sekolah: ['SK Sungai Teduh', 'SJK(C) Chung Hwa Damai'], mod: 'fizikal', lokasi: '', peserta: [] },
    { id: 'P3', tarikh: '2026-09-29', sek: 'SPr', tajuk: 'Taklimat Pengisian Data Murid 2027', sekolah: [], mod: 'atas_talian', lokasi: 'Google Meet', peserta: [] },
    { id: 'P4', tarikh: '2026-09-24', sek: 'SPS', tajuk: 'Audit Program Susu Sekolah (Siri 1/3)', sekolah: ['SK Bukit Indah'], mod: 'fizikal', lokasi: '', peserta: [] }
  ];
  var pub = D.REKOD.filter(function (r) { return r.tahap === 'umum'; }).sort(function (a, b) { return a.tarikh < b.tarikh ? 1 : -1; });
  function place(r) { return r.mod === 'atas_talian' ? 'Atas talian' : r.sekolah.length ? r.sekolah.join(', ') : r.lokasi; }
  function short(k) { return M.sekName(k).replace('Sektor ', '').replace(' (termasuk Unit ICT)', ''); }
  function color(k) { return 'var(--s-' + (k === 'Pengurusan' ? 'PGR' : k) + ')'; }
  function item(r) {
    return '<a class="it" href="laporan.html?id=' + r.id + '"><div class="ph">Gambar</div><div><div class="m">' + M.sk(r.sek) + '<span>' + M.fmtDate(r.tarikh, false) + '</span></div><h3>' + M.esc(r.tajuk) + '</h3><p>' + M.esc(place(r)) + '</p></div></a>';
  }
  function header(active) {
    var nav = [['portal.html', 'Aktiviti', 'aktiviti'], ['sektor.html', 'Sektor', 'sektor'], ['tentang.html', 'Tentang', 'tentang']];
    var h = document.createElement('header'); h.className = 'ptop';
    h.innerHTML = '<a class="brand" href="portal.html">PPDK<i>.CH</i></a><nav class="pnav" aria-label="Portal">' + nav.map(function (n) { return '<a href="' + n[0] + '"' + (n[2] === active ? ' aria-current="page"' : '') + '>' + n[1] + '</a>'; }).join('') + '</nav><a class="btn btn-dark btn-sm" href="log-masuk.html">Log masuk staf</a>';
    var c = document.getElementById('content'); c.insertBefore(h, c.firstChild);
    var f = document.createElement('footer'); f.className = 'pf';
    f.innerHTML = '<span>Pejabat Pendidikan Daerah Kuching</span><span><a href="tentang.html#hubungi">Hubungi</a> · <a href="#" onclick="return false">Dashboard ICT (ict.ppdk.ch)</a></span>';
    c.appendChild(f);
  }
  window.AW = { DESC: DESC, KETUA: KETUA, pub: pub, place: place, short: short, color: color, item: item, header: header };
})();
