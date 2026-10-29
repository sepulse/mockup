/* S01 · Babak B1–B2: teks dan keadaan langkah (variasi C).
   Hanya VLAN dan config sebenar router SSeM (keputusan pemilik 29 Okt 2026). */
window.S01_LANGKAH = [
  {
    babak: "B1", namaBabak: "Satu LAN", sub: 1,
    tajuk: "Satu kawasan. Satu LAN.",
    keadaan: { warna: false, bahagi: false },
    analogi: "Lima belas rumah dalam satu kawasan. Semua berkongsi jalan dan satu bangunan switch. Belum ada pagar.",
    teknikal: "<b>LAN</b>: rangkaian setempat. Semua peranti di sini berada dalam satu <b>broadcast domain</b>.",
    had: "Rumah = peranti (komputer, laptop, telefon). Jalan = kabel dan switch yang dikongsi."
  },
  {
    babak: "B1", namaBabak: "Satu LAN", sub: 2,
    tajuk: "Kebanyakan trafik hanya untuk satu penerima.",
    keadaan: { warna: false, bahagi: false },
    auto: "unicast",
    butang: [{ label: "Hantar biasa (unicast)", main: "unicast" }],
    analogi: "Sebuah kereta keluar dari satu rumah dan pergi ke <b>satu</b> rumah sahaja. Rumah lain tidak terlibat.",
    teknikal: "Frame <b>unicast</b>: switch menghantarnya ke port penerima sahaja.",
    had: "Kereta = trafik dari peranti; peranti sebenar tidak bergerak. Jika switch belum kenal alamat penerima, ia boleh menghantar frame ke semua port buat sementara waktu. Ini tidak dilukis."
  },
  {
    babak: "B1", namaBabak: "Satu LAN", sub: 3,
    tajuk: "Pengumuman sampai ke semua.",
    keadaan: { warna: false, bahagi: false },
    auto: "siaran",
    butang: [{ label: "Hantar siaran (broadcast)", main: "siaran" }],
    analogi: "Satu rumah membuat pengumuman. Bangunan switch menyalurkannya ke <b>setiap</b> rumah dalam kawasan.",
    teknikal: "<b>Broadcast</b> (contoh: ARP, DHCP Discover) dihantar ke semua port dalam broadcast domain yang sama.",
    had: "Pembesar suara hanya gambaran. Broadcast tetap bergerak melalui kabel dan switch, bukan melalui udara."
  },
  {
    babak: "B1", namaBabak: "Satu LAN", sub: 4,
    tajuk: "Semakin banyak peranti, semakin banyak siaran.",
    keadaan: { warna: false, bahagi: false },
    auto: "beban",
    slider: { min: 15, max: 300, step: 5, label: "Bilangan peranti" },
    analogi: "Semakin ramai penghuni, semakin kerap pengumuman, dan setiap pengumuman didengar oleh lebih ramai orang.",
    teknikal: "Setiap broadcast diterima oleh <b>semua peranti lain</b> dalam domain. Domain besar bermakna lebih banyak gangguan yang tidak perlu.",
    had: "Lukisan hanya menunjukkan 15 rumah. Kekerapan pengumuman ialah ilustrasi, bukan ukuran sebenar."
  },
  {
    babak: "B1", namaBabak: "Satu LAN", sub: 5,
    tajuk: "Apakah masalah sebenarnya?",
    keadaan: { warna: false, bahagi: false },
    kad: {
      jenis: "kesimpulan",
      html: "<strong>Bukan</strong> semua trafik perlu dihantar kepada semua peranti.<br><br>Masalah sebenar: pengumuman sampai ke semua dan <strong>tiada pengasingan kumpulan</strong>. Peranti Guest dan Student berada dalam kumpulan yang sama dengan Kewangan."
    },
    analogi: "Kawasan terlalu besar dan tiada pagar antara kumpulan.",
    teknikal: "Broadcast domain terlalu besar, dan tiada pengasingan logik antara kumpulan pengguna.",
    had: "Unicast tetap dihantar kepada satu penerima. Bukan semua trafik ialah broadcast."
  },
  {
    babak: "B2", namaBabak: "Mengapa banyak VLAN?", sub: 1,
    tajuk: "Lima kumpulan, satu kawasan.",
    keadaan: { warna: true, bahagi: false },
    analogi: "Rumah diwarnakan mengikut kumpulan pengguna dalam router SSeM: Kewangan, Staff, Executive, Student dan Guest. Pagar belum dibina.",
    teknikal: "VLAN pada router SSeM: <b>10</b> Kewangan, <b>20</b> Staff, <b>25</b> Executive, <b>30</b> Student, <b>40</b> Guest.",
    had: "Router SSeM juga ada VLAN 98 dan VLAN 99 Management. Kedua-duanya tidak dilukis sebagai zon."
  },
  {
    babak: "B2", namaBabak: "Mengapa banyak VLAN?", sub: 2,
    tajuk: "Bahagikan rangkaian.",
    keadaan: { warna: true, bahagi: false },
    banding: true,
    butang: [{ label: "Bahagikan Rangkaian", main: "bahagi" }],
    analogi: "Pagar rendah membahagikan kawasan kepada lima zon. <b>Jalan dan bangunan switch tidak berubah.</b>",
    teknikal: "Switch yang sama kini membawa lima <b>VLAN</b>. Setiap port ditetapkan kepada satu VLAN.",
    had: "Pagar dan lorong berwarna ialah pengasingan <b>logik</b>. Tiada kabel atau jalan baharu dibina."
  },
  {
    babak: "B2", namaBabak: "Mengapa banyak VLAN?", sub: 3,
    tajuk: "Pengumuman kekal dalam zon.",
    keadaan: { warna: true, bahagi: true },
    banding: true,
    auto: "siaran-zon",
    butang: [{ label: "Siaran dari zon Student", main: "siaran-zon" }],
    analogi: "Pengumuman dari zon Student hanya didengar oleh rumah dalam zon Student.",
    teknikal: "Broadcast VLAN 30 dihantar ke port VLAN 30 sahaja. Broadcast domain menjadi lebih kecil.",
    had: "Tekan <b>Sebelum | Selepas</b> untuk membuat perbandingan dengan kawasan tanpa pagar."
  },
  {
    babak: "B2", namaBabak: "Mengapa banyak VLAN?", sub: 4,
    tajuk: "Mengapa banyak VLAN?",
    keadaan: { warna: true, bahagi: true },
    senarai: {
      tajuk: "Lima manfaat:",
      item: [
        "Broadcast domain lebih kecil.",
        "Pengurusan mengikut kumpulan.",
        "Polisi keselamatan lebih mudah dilaksanakan.",
        "Akses antara kumpulan boleh dikawal.",
        "Masalah lebih mudah diasingkan semasa troubleshooting."
      ]
    },
    analogi: "Setiap zon boleh diurus, diberi peraturan dan diperiksa secara berasingan.",
    teknikal: "Di SSeM, setiap VLAN ada subnet dan DHCP server sendiri, dan rule firewall boleh ditulis mengikut VLAN.",
    had: "Manfaat 3 dan 4 memerlukan router atau switch Layer 3 dan rule firewall (Babak 5 dan 7)."
  },
  {
    babak: "B2", namaBabak: "Mengapa banyak VLAN?", sub: 5,
    tajuk: "VLAN memisahkan. VLAN bukan firewall.",
    keadaan: { warna: true, bahagi: true },
    banding: true,
    kad: {
      jenis: "amaran",
      html: "Pagar zon <strong>tidak memeriksa</strong> sesiapa.<br><br>Jika router menyambungkan zon dan tiada rule, trafik antara VLAN boleh lalu. Trafik yang dibenarkan ditentukan oleh <b>rule firewall</b> pada router (Babak 5 dan 7)."
    },
    analogi: "Pagar memisahkan zon. Pos pemeriksaan (firewall) ialah perkara berasingan.",
    teknikal: "VLAN = pengasingan Layer 2. Kawalan akses antara VLAN dibuat di Layer 3 oleh firewall atau ACL.",
    had: "VLAN sahaja tidak menjamin keselamatan."
  }
];
