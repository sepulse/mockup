/* PPDK.CH semua sektor — paparan contoh. Data ilustrasi (nama, sekolah dan angka rekaan). */
(function () {
  'use strict';
  M.mount({page:'aktiviti'});
  var $ = function (id) { return document.getElementById(id); }, esc = M.esc;
  var params = new URLSearchParams(location.search), id = params.get('id');
  var r = D.REKOD.find(function (x) { return x.id === id; });
  var fields = ['ruj','obj','per','cat','rum','imp','ts'], draft, view = 'edit', dirty = false, uploading = false, undo;
  function eligible() { return r && r.status !== 'dibatalkan' && (r.status === 'selesai' || r.tamat < M.TODAY); }
  function editable() { return eligible() && r.owner === M.me().name && !D.ict(r) && r.tahap !== 'umum' && !r.mohon; }
  if (!r || (r.tahap === 'sulit' && !D.canSulit(r)) || (!D.involves(r,M.me().name) && M.role() !== 'kppd' && !(M.role() === 'ketua' && M.me().sek === r.sek))) {
    $('heading').textContent = 'Laporan tidak tersedia';
    $('main').innerHTML = '<p class="empty">Rekod tidak ditemui atau anda tiada akses kepada laporan ini.</p>';
    return;
  }
  document.documentElement.style.setProperty('--sc','var(--s-' + (r.sek === 'Pengurusan' ? 'PGR' : r.sek) + ')');
  $('ctx').innerHTML = esc(r.id) + ' · ' + M.sk(r.sek) + ' · ' + (r.tahap === 'umum' ? 'Umum' : r.mohon ? 'Menunggu penerbit' : 'Dalaman');
  function snapshot() {
    var d = {peserta:(r.peserta || []).slice(),bil:(r.bil || ['','','']).slice(),photos:(r.photos || []).slice(),ai:!!r.ai};
    fields.forEach(function (f) { d[f] = r[f] || (f === 'cat' ? r.catatan || '' : ''); });
    return d;
  }
  draft = JSON.parse(JSON.stringify(editable() && r.drafLaporan ? r.drafLaporan : snapshot()));
  var checked = false;
  function team() { return [r.owner].concat(draft.peserta || []); }
  function place() { return (r.sekolah || []).join(', ') || r.lokasi || (r.mod === 'atas_talian' ? 'Atas talian' : 'Belum dinyatakan'); }
  function date() { return D.tarikhLabel(r) + ' · ' + (r.sehari ? 'Sehari' : r.mula + '–' + r.akhir); }
  function lines(t) { return String(t || '').split(/\n+/).map(function (s) { return s.replace(/^\s*(?:\d+[.)]|[-•*])\s*/,'').trim(); }).filter(Boolean); }
  function numbered(t) { return lines(t).map(function (s,i) { return (i+1) + '. ' + s; }).join('\n'); }
  function mark() { dirty = true; checked = false; $('status').textContent = 'Perubahan belum disimpan'; }
  function collect() {
    if (view !== 'edit') return;
    fields.forEach(function (f) { if ($(f)) draft[f] = $(f).value.trim(); });
    draft.bil = ['guru','murid','luar'].map(function (k) { return $(k).value === '' ? '' : Number($(k).value); });
  }
  function persistDraft() {
    var previous = r.drafLaporan;
    r.drafLaporan = JSON.parse(JSON.stringify(draft));
    if (!D.persist()) { r.drafLaporan = previous; return false; }
    dirty = false; $('status').textContent = 'Draf disimpan · sesi pelayar ini'; return true;
  }
  function error(msg, focus) {
    $('error').textContent = msg;
    if (focus && $(focus)) { var details = $(focus).closest('details'); if (details) details.open = true; $(focus).focus(); }
  }
  function field(f,label,rows,hint) {
    return '<div class="field"><label class="lbl" for="' + f + '">' + label + '</label><textarea id="' + f + '" rows="' + rows + '">' + esc(draft[f]) + '</textarea>' + (hint ? '<p class="hint">' + hint + '</p>' : '') + '</div>';
  }
  function head() {
    return '<div class="record-head"><h2>' + esc(r.tajuk) + '</h2><p>' + esc(date()) + '</p><p>' + esc(place()) + (r.mod === 'atas_talian' ? ' · Atas talian' : r.mod === 'hibrid' ? ' · Hibrid' : '') + '</p></div>';
  }
  function edit() {
    view = 'edit'; $('heading').textContent = 'Lengkapkan laporan';
    $('main').innerHTML = head() + '<form id="report-form" novalidate>' +
      '<details class="r-section" id="maklumat"><summary><span class="num">01</span> Maklumat daripada rekod</summary>' +
      '<p class="hint">Tarikh, masa, tempat dan jenis aktiviti sudah diisi. Tiada rekod baharu dibuat.</p><dl class="dl"><dt>Jenis aktiviti</dt><dd>' + esc(r.jenis) + '</dd><dt>Pegawai pelapor</dt><dd>' + esc(r.owner) + '</dd></dl>' +
      '<div class="field"><span class="lbl">Pegawai terlibat</span><div class="team" id="team"></div><div class="add-person"><label class="sr" for="pegawai">Tambah pegawai terlibat</label><select id="pegawai"></select><button class="btn btn-line" id="add-person" type="button">Tambah</button></div></div>' +
      '<div class="field"><label class="lbl" for="ruj">No. rujukan · pilihan</label><input id="ruj" value="' + esc(draft.ruj) + '" placeholder="Rujukan surat / tiket"></div></details>' +
      '<section class="r-section"><h2><span class="num">02</span> Ceritakan hasil aktiviti</h2><p class="hint">Rumusan sahaja diperlukan untuk melengkapkan laporan.</p>' +
      '<details class="ai-helper"><summary>Bantu susun catatan dengan AI</summary><p>Simulasi tempatan: ayat daripada catatan anda sahaja. Tiada fakta, impak atau tindakan baharu direka. Gantikan rumusan hanya jika anda mahu.</p>' +
      field('cat','Catatan ringkas pegawai',4,'Satu fakta satu baris. Gunakan awalan “Impak:” atau “Tindak susul:” jika ada dapatan tersebut.') +
      '<div class="ai-actions" style="margin-top:12px"><button type="button" class="btn btn-line" id="ai">Susun draf daripada catatan</button><button type="button" class="text-btn" id="undo-ai" hidden>Undur draf</button></div><p id="ai-status" role="status"></p></details>' +
      '<div style="margin-top:18px" id="ai-tag"' + (draft.ai ? '' : ' hidden') + '><span class="draft-tag">Draf · semak fakta</span></div>' +
      field('rum','Rumusan <span class="muted">· wajib</span>',6,'Nyatakan apa yang berlaku dan dapatan sebenar. Anda boleh menulis terus tanpa bantuan AI.') +
      '<details class="r-section" id="kandungan" style="margin-top:22px"><summary>Tambah objektif &amp; perincian</summary>' + field('obj','Objektif · pilihan',3) + field('per','Perincian pelaksanaan · pilihan',4) + '</details>' +
      '<details class="r-section" id="tambahan"><summary>Tambah impak, tindak susul &amp; peserta</summary>' + field('imp','Impak · pilihan',3,'Satu dapatan setiap baris; dinomborkan dalam laporan.') + field('ts','Tindak susul · pilihan',3,'Teks dalam laporan. Tiada penjejakan tugasan.') +
      '<div class="field"><span class="lbl">Bilangan peserta · pilihan, tanpa nama</span><div class="counts">' + [['guru','Guru'],['murid','Murid'],['luar','Pihak luar']].map(function (a,i) { return '<label for="' + a[0] + '">' + a[1] + '<input id="' + a[0] + '" type="number" inputmode="numeric" min="0" step="1" value="' + esc(draft.bil[i]) + '"></label>'; }).join('') + '</div></div></details></section>' +
      '<details class="r-section" id="bukti"><summary><span class="num">03</span> Gambar bukti · pilihan</summary><p class="hint">Tiada minimum gambar. Maksimum 6 gambar untuk paparan contoh; disimpan dalam sesi pelayar ini sahaja.</p>' +
      '<div class="field"><label class="lbl" for="photos">Pilih gambar</label><input id="photos" type="file" accept="image/jpeg,image/png,image/webp" multiple></div><p class="hint" id="photo-status" role="status"></p><div class="photo-list" id="photo-list"></div></details>' +
      '<p id="error" class="report-error" role="alert"></p><div class="r-actions"><button type="button" class="text-btn" id="save-draft">Simpan draf</button><button type="submit" class="btn btn-ink">Pratonton laporan →</button></div><p class="tiny">Paparan contoh · data ilustrasi. Draf kekal dalam sesi pelayar ini; tutup sesi untuk mengosongkannya.</p></form>';
    renderTeam(); renderPhotos();
    ['kandungan','tambahan','bukti'].forEach(function (key) { if (key === 'kandungan' ? draft.obj || draft.per : key === 'tambahan' ? draft.imp || draft.ts || draft.bil.some(function (n) { return n !== ''; }) : draft.photos.length) $(key).open = true; });
    $('report-form').addEventListener('input',mark);
    $('report-form').addEventListener('submit',function (e) {
      e.preventDefault(); collect();
      if (uploading) return error('Tunggu gambar selesai diproses.');
      if (!draft.rum) return error('Isi rumusan dahulu.','rum');
      var invalid = ['guru','murid','luar'].find(function (k) { return !$(k).validity.valid; });
      if (invalid) return error('Bilangan peserta mesti nombor bulat sifar atau lebih.',invalid);
      review(); window.scrollTo(0,0);
    });
  }
  function renderTeam() {
    $('team').innerHTML = team().map(function (name,i) { return '<span>' + esc(name) + (i ? '<button type="button" data-remove-person="' + (i-1) + '" aria-label="Buang ' + esc(name) + '">×</button>' : ' · pelapor') + '</span>'; }).join('');
    var options = D.STAF.filter(function (s) { return team().indexOf(s.n) < 0; });
    $('pegawai').innerHTML = options.map(function (s) { return '<option value="' + esc(s.n) + '">' + esc(s.n) + '</option>'; }).join('');
    $('add-person').disabled = !options.length;
  }
  function renderPhotos() {
    $('photo-list').innerHTML = draft.photos.map(function (p,i) { return '<figure><img src="' + esc(p.src) + '" alt="Bukti aktiviti ' + (i+1) + '"><figcaption><span>' + esc(p.name) + '</span><button type="button" class="text-btn" data-remove-photo="' + i + '" aria-label="Buang gambar ' + (i+1) + '">Buang</button></figcaption></figure>'; }).join('');
  }
  function makeDraft() {
    collect(); var notes = lines(draft.cat);
    if (!notes.length) return error('Isi catatan ringkas dahulu.','cat');
    undo = {rum:draft.rum,imp:draft.imp,ts:draft.ts,ai:draft.ai};
    var imp = [], ts = [], rum = [];
    notes.forEach(function (line) {
      if (/^impak\s*:/i.test(line)) { var a = line.replace(/^impak\s*:\s*/i,''); if (a) imp.push(a); }
      else if (/^tindak susul\s*:/i.test(line)) { var b = line.replace(/^tindak susul\s*:\s*/i,''); if (b) ts.push(b); }
      else rum.push(line);
    });
    draft.rum = (rum.length ? rum : notes).join('\n');
    if (imp.length) draft.imp = numbered(imp.join('\n'));
    if (ts.length) draft.ts = numbered(ts.join('\n'));
    draft.ai = true; ['rum','imp','ts'].forEach(function (f) { $(f).value = draft[f]; });
    $('ai-tag').hidden = false; $('undo-ai').hidden = false;
    $('ai-status').textContent = 'Draf disusun. Semak dan sunting fakta sebelum simpan.';
    if (imp.length || ts.length) $('tambahan').open = true;
    mark();
  }
  function listHtml(t) { return '<ol>' + lines(t).map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>'; }
  function doc() {
    var counts = draft.bil.some(function (n) { return n !== ''; }) ? ['Guru','Murid','Pihak luar'].map(function (k,i) { return k + ': ' + (draft.bil[i] === '' ? '—' : draft.bil[i]); }).join(' · ') : '';
    var rows = [['Tarikh / masa',date()],['Tempat / platform',place()],['Jenis aktiviti',r.jenis],['Pegawai terlibat',team().join(', ')]];
    if (draft.ruj) rows.push(['No. rujukan',draft.ruj]); if (counts) rows.push(['Bilangan peserta',counts]);
    return '<article class="official" id="official"><header><b>PEJABAT PENDIDIKAN DAERAH KUCHING</b><span>' + esc(M.sekName(r.sek)) + ' · Laporan aktiviti · ' + esc(r.id) + '</span></header>' +
      ((editable() && view !== 'saved') ? '<p class="draft-watermark">PRATONTON DRAF · Belum disahkan pegawai</p>' : '') + '<h2>' + esc(r.tajuk) + '</h2><table><tbody>' + rows.map(function (row) { return '<tr><td>' + row[0] + '</td><td>' + esc(row[1]) + '</td></tr>'; }).join('') + '</tbody></table>' +
      (draft.obj ? '<h3>Objektif</h3><p>' + esc(draft.obj) + '</p>' : '') + (draft.per ? '<h3>Perincian pelaksanaan</h3><p>' + esc(draft.per) + '</p>' : '') +
      '<h3>Rumusan</h3><p>' + esc(draft.rum || 'Rumusan belum diisi.') + '</p>' + (draft.imp ? '<h3>Impak</h3>' + listHtml(draft.imp) : '') + (draft.ts ? '<h3>Tindak susul</h3>' + listHtml(draft.ts) : '') +
      (draft.photos.length ? '<h3>Bukti bergambar</h3><div class="doc-photos">' + draft.photos.map(function (p,i) { return '<figure><img src="' + esc(p.src) + '" alt="Bukti aktiviti ' + (i+1) + '"><figcaption>Gambar ' + (i+1) + ' · ' + esc(p.name) + '</figcaption></figure>'; }).join('') + '</div>' : '') +
      '<footer>Disediakan oleh ' + esc(r.owner) + '<br>' + esc(D.staf(r.owner).jaw) + (r.disahkanPada && view === 'saved' ? '<br>Disahkan pegawai pada ' + esc(r.disahkanPada) : '') + '<br>Paparan contoh · data ilustrasi</footer></article>';
  }
  function review(saved) {
    view = saved ? 'saved' : 'review';
    $('heading').textContent = saved ? 'Laporan disimpan' : 'Semak laporan';
    var locked = !editable(), msg = '';
    if (locked) msg = D.ict(r) ? 'Laporan ini datang daripada rekod ICT. Ubah melalui rekod ICT; tidak perlu merekod semula.' : r.tahap === 'umum' ? 'Laporan ini telah diterbitkan. Paparan baca sahaja.' : r.mohon ? 'Laporan sedang disemak penerbit. Paparan baca sahaja.' : !eligible() ? 'Laporan tersedia selepas tugas ditamatkan. Kembali ke Hari ini untuk menamatkan tugas.' : 'Paparan laporan untuk pegawai yang dibenarkan.';
    var canPub = saved && r.tahap === 'dalaman' && !r.mohon && r.sek !== 'SPsK' && r.sek !== 'SPP';
    $('main').innerHTML = '<div id="review">' +
      (saved ? '<div class="saved"><h2>Lengkap, kekal dalaman.</h2><p>Rekod yang sama kini dikira dalam Ringkasan Bulanan. Terbit kepada orang awam ialah langkah berasingan.</p>' + (canPub ? '<a class="btn btn-ink" href="aktiviti.html?terbit=' + encodeURIComponent(r.id) + '">Mohon terbit →</a><p>Penerbit sektor akan membuat tiga semakan sebelum laporan muncul di portal. Kapsyen Facebook tersedia dalam pratonton penerbitan.</p>' : '<p>Penerbitan awam tidak tersedia untuk laporan ini.</p>') + '</div>' : locked ? '<p class="flag">' + esc(msg) + '</p>' : '<p class="hint" style="margin-bottom:16px">Baca seperti laporan rasmi. Kembali sunting jika ada fakta yang perlu dibetulkan.</p>') +
      '<div class="review-tools">' + (!locked && !saved ? '<button type="button" class="btn btn-line" id="edit">← Sunting</button>' : '') + '<button class="btn btn-line" type="button" id="print">Cetak PDF</button><button class="btn btn-line" type="button" id="whatsapp">Salin WhatsApp</button></div>' + doc() +
      (!locked && !saved ? '<div class="checks"><p><b>Pengesahan pegawai</b></p><label><input type="checkbox" id="confirm"' + (checked ? ' checked' : '') + '> Saya telah menyemak fakta, senarai pegawai dan kandungan laporan' + (draft.ai ? ', termasuk draf bantuan AI' : '') + '.</label><p class="tiny">Laporan disimpan untuk kegunaan dalaman. Gambar dan bilangan peserta adalah pilihan.</p></div><p id="error" class="report-error" role="alert"></p><div class="r-actions"><button type="button" class="text-btn" id="save-draft">Simpan draf</button><button type="button" class="btn btn-ink" id="save-report">Simpan laporan dalaman</button></div>' : '<div class="r-actions"><a class="text-btn" href="aktiviti.html">Kembali ke Rekod Aktiviti</a><a class="text-btn" href="ringkasan.html">Ringkasan Bulanan →</a></div>') + '<div class="copy-manual" id="copy-manual" hidden></div></div>';
  }
  function whatsapp() {
    var text = '*' + r.tajuk + '*\n' + date() + '\n' + place() + '\nPegawai: ' + team().join(', ') + (draft.ruj ? '\nRujukan: ' + draft.ruj : '') + (draft.obj ? '\n\n*Objektif*\n' + draft.obj : '') + (draft.per ? '\n\n*Perincian*\n' + draft.per : '') + '\n\n*Rumusan*\n' + draft.rum + (draft.imp ? '\n\n*Impak*\n' + numbered(draft.imp) : '') + (draft.ts ? '\n\n*Tindak susul*\n' + numbered(draft.ts) : '') + (draft.bil.some(function (n) { return n !== ''; }) ? '\n\nBilangan peserta: ' + ['Guru','Murid','Pihak luar'].map(function (label,i) { return label + ' ' + (draft.bil[i] === '' ? '—' : draft.bil[i]); }).join(', ') : '') + '\n\n' + (view === 'saved' || !editable() ? 'Laporan dalaman · kongsi kepada penerima dibenarkan sahaja.' : 'DRAF · belum disahkan pegawai.') + '\nPaparan contoh · data ilustrasi';
    function manual() { var box = $('copy-manual'); box.hidden = false; box.innerHTML = '<label class="lbl" for="copy-text">Salin teks secara manual</label><textarea id="copy-text" readonly>' + esc(text) + '</textarea>'; $('copy-text').select(); M.toast('Pilih dan salin teks laporan'); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { M.toast('Teks WhatsApp disalin'); },manual); else manual();
  }
  async function readPhoto(file) {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw Error('Pilih gambar JPEG, PNG atau WebP.');
    if (file.size > 12*1024*1024) throw Error('Gambar melebihi 12 MB. Pilih fail lebih kecil.');
    var url = URL.createObjectURL(file);
    try {
      var img = new Image(); img.src = url; await img.decode();
      var scale = Math.min(1,960/Math.max(img.width,img.height)), canvas = document.createElement('canvas');
      canvas.width = Math.max(1,Math.round(img.width*scale)); canvas.height = Math.max(1,Math.round(img.height*scale));
      var ctx = canvas.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.drawImage(img,0,0,canvas.width,canvas.height);
      return {name:file.name,src:canvas.toDataURL('image/jpeg',0.72)};
    } finally { URL.revokeObjectURL(url); }
  }
  document.addEventListener('click',function (e) {
    var t = e.target.closest('button'); if (!t) return;
    if (t.id === 'print') { window.print(); return; }
    if (t.id === 'whatsapp') { whatsapp(); return; }
    if (!editable()) return;
    if (t.id === 'save-draft') { collect(); if (uploading) return M.toast('Tunggu gambar selesai diproses'); if (persistDraft()) M.toast('Draf disimpan · laporan belum dimuktamadkan'); }
    if (t.id === 'edit') { checked = !!$('confirm').checked; edit(); window.scrollTo(0,0); }
    if (t.id === 'add-person') { var name = $('pegawai').value; if (name && team().indexOf(name) < 0) { draft.peserta.push(name); mark(); renderTeam(); } }
    if (t.hasAttribute('data-remove-person')) { draft.peserta.splice(Number(t.dataset.removePerson),1); mark(); renderTeam(); }
    if (t.hasAttribute('data-remove-photo')) { draft.photos.splice(Number(t.dataset.removePhoto),1); mark(); renderPhotos(); }
    if (t.id === 'ai') makeDraft();
    if (t.id === 'undo-ai' && undo) { Object.assign(draft,undo); ['rum','imp','ts'].forEach(function (f) { $(f).value = draft[f]; }); $('ai-tag').hidden = !draft.ai; t.hidden = true; $('ai-status').textContent = 'Kandungan sebelum draf dipulihkan.'; mark(); }
    if (t.id === 'save-report') {
      if (!$('confirm').checked) return error('Sahkan semakan fakta sebelum simpan.','confirm');
      if (!draft.rum.trim()) return error('Rumusan diperlukan. Kembali ke Sunting.');
      var previous = JSON.parse(JSON.stringify(r));
      fields.forEach(function (f) { r[f] = draft[f]; }); r.peserta = draft.peserta.slice(); r.bil = draft.bil.slice(); r.photos = draft.photos.slice(); r.gam = r.photos.length; r.ai = draft.ai;
      r.status = 'selesai'; r.laporan = 'lengkap'; r.tahap = r.tahap === 'sulit' ? 'sulit' : 'dalaman'; r.mohon = false;
      r.disahkanPada = new Date().toLocaleString('ms-MY',{timeZone:'Asia/Kuala_Lumpur'}); delete r.drafLaporan;
      if (!D.persist()) { Object.keys(r).forEach(function (k) { delete r[k]; }); Object.assign(r,previous); return; }
      dirty = false; $('status').textContent = 'Disimpan · dalaman'; review(true); window.scrollTo(0,0);
    }
  });
  document.addEventListener('change',async function (e) {
    if (e.target.id !== 'photos' || !editable()) return;
    var files = Array.from(e.target.files), slots = 6-draft.photos.length;
    if (files.length > slots) { $('photo-status').textContent = 'Maksimum 6 gambar. Pilih sehingga ' + slots + ' gambar lagi.'; e.target.value = ''; return; }
    uploading = true; e.target.disabled = true; $('photo-status').textContent = 'Memproses gambar…';
    try { var additions = []; for (var i=0;i<files.length;i++) additions.push(await readPhoto(files[i])); draft.photos = draft.photos.concat(additions); mark(); renderPhotos(); $('photo-status').textContent = draft.photos.length + ' gambar dilampirkan.'; }
    catch (err) { $('photo-status').textContent = err.message || 'Gambar tidak dapat dibaca. Cuba fail lain.'; }
    finally { uploading = false; e.target.disabled = false; e.target.value = ''; }
  });
  window.addEventListener('beforeunload',function (e) { if (dirty || uploading) { e.preventDefault(); e.returnValue = ''; } });
  document.addEventListener('rolechange',function () { location.reload(); });
  if (editable()) { edit(); if (params.get('papar') === '1' && draft.rum) review(); }
  else review();
})();
