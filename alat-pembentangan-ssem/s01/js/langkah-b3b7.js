/* S01 · Babak B3–B6 (Access port dibuang 29 Okt: tiada dalam config SSeM): teks dan keadaan langkah (variasi C), disambung ke S01_LANGKAH.
   Data daripada RSC router SSeM (grep bertapis): VLAN, subnet, pool, lease dan komen rule firewall.
   Medan keadaan tambahan (dibaca oleh render-c.js):
     adegan: "kawasan" | "port" | "rangkaian"   portVlan: VLAN port 5 dalam adegan port
     tag, trunkSsem, alamat, gateway, firewall, dhcp: boolean */
(function () {
  "use strict";
  var ASAS = { warna: true, bahagi: true };
  function k(o) { return Object.assign({}, ASAS, o); }
  window.S01_LANGKAH = window.S01_LANGKAH.concat([
    {
      babak: "B3", namaBabak: "Trunk port", sub: 1,
      tajuk: "Satu kabel. Banyak VLAN.",
      keadaan: k({ adegan: "rangkaian", tag: true }),
      banding: "tag",
      auto: "trunk",
      butang: [{ label: "Hantar melalui trunk", main: "trunk" }, { label: "Tunjuk frame", main: "frame" }],
      analogi: "Satu jalan penghubung dari bangunan switch ke router. Di pintu jalan itu, setiap kereta dipasang <b>bendera nombor zon</b>.",
      teknikal: "<b>Trunk port</b> membawa banyak VLAN pada satu link. <b>Tag 802.1Q</b> menyimpan VLAN ID dalam frame.",
      had: "Bendera hanya gambaran. Tag 802.1Q ialah 4 bait tambahan dalam frame."
    },
    {
      babak: "B3", namaBabak: "Trunk port", sub: 2,
      tajuk: "Tanpa tag, router tidak tahu zon.",
      keadaan: k({ adegan: "rangkaian", tag: false }),
      banding: "tag",
      auto: "trunk",
      butang: [{ label: "Hantar melalui trunk", main: "trunk" }, { label: "Tunjuk frame", main: "frame" }],
      analogi: "Jika bendera dibuang, kereta tiba di router tanpa nombor zon. Router tidak dapat memilih pintu VLAN yang betul.",
      teknikal: "Frame tanpa tag pada trunk tidak membawa VLAN ID asal. Ia masuk ke VLAN native (PVID) port itu.",
      had: "VLAN native tidak dilukis. Tekan <b>Sebelum | Selepas</b> untuk membandingkan keadaan bertag dengan tanpa tag."
    },
    {
      babak: "B3", namaBabak: "Trunk port", sub: 3,
      tajuk: "Trunk SSeM: ether16-TRUNK.",
      keadaan: k({ adegan: "rangkaian", tag: true, trunkSsem: true }),
      auto: "trunk",
      butang: [{ label: "Hantar melalui trunk", main: "trunk" }],
      analogi: "Satu jalan penghubung membawa tujuh nombor zon.",
      teknikal: "<code>ether16-TRUNK</code> dalam <code>bridge-trunk</code> (<code>vlan-filtering=yes</code>) membawa tag 10, 20, 25, 30, 40, 98 dan 99.",
      had: "VLAN 98 dan 99 tidak dilukis sebagai zon. Switch di hujung trunk dan AP/WAC tiada dalam RSC."
    },
    {
      babak: "B4", namaBabak: "Komunikasi antara VLAN", sub: 1,
      tajuk: "Layer 2 tidak merentas VLAN.",
      keadaan: k({ adegan: "rangkaian", tag: true, gateway: false }),
      auto: "ke-ltb",
      butang: [{ label: "Staff → Local Tech Bridge", main: "ke-ltb" }],
      analogi: "Kereta Staff mahu ke Local Tech Bridge. Ia berhenti di pintu router kerana pintu itu belum menjadi gerbang ke rangkaian lain.",
      teknikal: "Switch Layer 2 hanya menghantar frame dalam VLAN yang sama. Untuk ke subnet lain, <b>gateway Layer 3</b> diperlukan.",
      had: "Local Tech Bridge (192.168.6.0/24) ialah rangkaian pada port ether2–ether12 router, bukan VLAN."
    },
    {
      babak: "B4", namaBabak: "Komunikasi antara VLAN", sub: 2,
      tajuk: "VLAN ID bukan alamat IP.",
      keadaan: k({ adegan: "rangkaian", tag: true, gateway: false, alamat: true }),
      kad: {
        jenis: "kesimpulan",
        html: "VLAN ID = nombor zon. Alamat IP = alamat rumah. <strong>Dua perkara berbeza.</strong><br><br>VLAN 20 Staff menggunakan 172.16.22.0/23. VLAN 30 Student menggunakan 192.168.32.0/23."
      },
      analogi: "Nombor zon tidak semestinya sama dengan alamat rumah dalam zon itu.",
      teknikal: "Setiap VLAN di SSeM ada <b>subnet</b> sendiri. Nombor VLAN dan nombor dalam alamat IP tidak perlu sama.",
      had: "Tekan <b>A ↔ T</b> untuk melihat label teknikal."
    },
    {
      babak: "B4", namaBabak: "Komunikasi antara VLAN", sub: 3,
      tajuk: "Gateway menyambungkan subnet.",
      keadaan: k({ adegan: "rangkaian", tag: true, gateway: true, alamat: true }),
      banding: "gateway",
      auto: "ke-ltb",
      butang: [{ label: "Staff → Local Tech Bridge", main: "ke-ltb" }],
      analogi: "Setiap zon ada pintu gerbang di router. Kereta Staff masuk gerbang 20, melalui simpang router, lalu keluar ke Local Tech Bridge.",
      teknikal: "<b>Inter-VLAN routing</b>: router MikroTik ialah gateway bagi setiap VLAN, contohnya Staff 172.16.22.1 dan Student 192.168.32.1.",
      had: "Routing juga boleh dibuat oleh switch Layer 3. Di SSeM, router yang melakukannya. Laluan ini dibenarkan oleh rule firewall (Babak 7)."
    },
    {
      babak: "B5", namaBabak: "VLAN dan DHCP", sub: 1,
      tajuk: "Setiap VLAN, kaunter pas sendiri.",
      keadaan: k({ adegan: "rangkaian", tag: true, gateway: true, dhcp: true }),
      auto: "dhcp-30",
      butang: [{ label: "Sambung peranti Student", main: "dhcp-30" }, { label: "Sambung peranti Guest", main: "dhcp-40" }],
      analogi: "Peranti baharu belum ada alamat. Kaunter pas VLAN 30 menawarkan alamat daripada pool, peranti memintanya, lalu kaunter mengesahkannya.",
      teknikal: "4 langkah DHCP: <b>Discover</b>, <b>Offer</b>, <b>Request</b>, <b>ACK</b>. Sebagai broadcast, Discover kekal dalam VLAN 30.",
      had: "IP 192.168.32.10 sekadar contoh (alamat pertama dalam pool) dan bergantung pada lease semasa. Selepas menerima IP, peranti Student dan Guest perlu log masuk HotSpot (di luar skop modul ini)."
    },
    {
      babak: "B5", namaBabak: "VLAN dan DHCP", sub: 2,
      tajuk: "Pas Guest lebih singkat.",
      keadaan: k({ adegan: "rangkaian", tag: true, gateway: true, dhcp: true }),
      auto: "lease",
      butang: [{ label: "Jalankan masa lease", main: "lease" }, { label: "Sambung peranti Guest", main: "dhcp-40" }],
      analogi: "Pas Guest sah 5 jam sahaja. Pas Student sah 1 hari. Jam dipercepat supaya perbezaannya jelas.",
      teknikal: "VLAN40-Guest: pool 192.168.42.10 – 192.168.42.250, lease 5h. VLAN30-Student: pool 192.168.32.10 – 192.168.33.250, lease 1d.",
      had: "Peranti yang masih bersambung memperbaharui lease sebelum tamat tempoh. Jika tidak diperbaharui, alamat IP kembali ke pool. IP 192.168.42.10 sekadar contoh (alamat pertama dalam pool)."
    },
    {
      babak: "B6", namaBabak: "Firewall", sub: 1,
      tajuk: "Rule dibaca dari atas.",
      keadaan: k({ adegan: "rangkaian", tag: true, gateway: true, firewall: true }),
      auto: "uji-staff-ltb",
      butang: [{ label: "Staff → Local Tech Bridge", main: "uji-staff-ltb" }],
      analogi: "Pos pemeriksaan di simpang router membaca papan dari atas. Rule pertama yang padan menentukan keputusan.",
      teknikal: "Rule <b>firewall</b> (chain forward) disemak mengikut susunan. Keputusan diambil pada rule pertama yang padan.",
      had: "Papan hanya memaparkan 7 rule forward SSeM, dalam susunan asal. Rule lain tidak dipaparkan."
    },
    {
      babak: "B6", namaBabak: "Firewall", sub: 2,
      tajuk: "Siapa boleh lalu?",
      keadaan: k({ adegan: "rangkaian", tag: true, gateway: true, firewall: true }),
      auto: "uji-student-staff",
      butang: [
        { label: "Student → Staff", main: "uji-student-staff" },
        { label: "Guest → Staff", main: "uji-guest-staff" },
        { label: "Guest → Internet", main: "uji-guest-internet" }
      ],
      analogi: "Student dan Guest tidak boleh masuk ke zon Staff. Guest masih boleh keluar ke Internet.",
      teknikal: "<code>VLAN 30 -> Deny to VLAN 20</code> dan <code>VLAN 40 -> Deny ALL local VLANs</code> menolak trafik. <code>Allow LAN to WAN</code> membenarkan trafik ke Internet.",
      had: "Rule ini menyemak alamat sumber dan destinasi, bukan warna pagar."
    },
    {
      babak: "B6", namaBabak: "Firewall", sub: 3,
      tajuk: "Jalan wujud. Polisi menentukan.",
      keadaan: k({ adegan: "rangkaian", tag: true, gateway: true, firewall: true }),
      auto: "uji-student-kewangan",
      butang: [
        { label: "Student → Kewangan", main: "uji-student-kewangan" },
        { label: "Buang / Pulihkan DEFAULT DENY", main: "togol-default" }
      ],
      analogi: "Tiada rule khusus untuk Student ke Kewangan, jadi rule terakhir menolaknya. Buang rule terakhir dan lihat apa yang berlaku.",
      teknikal: "Jika tiada rule yang padan, RouterOS <b>menerima</b> trafik. <code>DEFAULT DENY</code> di hujung menutup kelemahan ini.",
      had: "Kotak pasir sahaja. Router SSeM sebenar kekal dengan DEFAULT DENY."
    }
  ]);
})();
