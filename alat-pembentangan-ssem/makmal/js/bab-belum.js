/* Bab yang belum dibina — dipaparkan di menu dengan status jelas. */
(function () {
  'use strict';
  const { el } = MG;
  const lakar = (s, f) => { const g = MG.g(s, { opacity: 0.5 }); f(g); };
  void el;
  // Semua 10 bab sudah dibina (29 Okt 2026). Tambah entri di sini jika ada bab baharu yang belum siap.
  [
  ].forEach((b) => MG.daftarBab({ id: b.id, no: b.no, tajuk: b.tajuk, ringkas: b.ringkas, status: 'belum', langkah: [], ikonMenu: (s) => lakar(s, b.ikon) }));
})();
