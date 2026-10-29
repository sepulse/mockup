/* Variasi C · three.js: pemandangan 3D sebenar dengan kamera boleh dipusing (seret tetikus).
   Label ialah lapisan HTML 2D supaya teks kekal tajam. Data VLAN, subnet, pool dan komen rule
   ialah config sebenar router SSeM (grep bertapis daripada RSC 22 Okt 2026).
   Tiga adegan: "kawasan" (B1–B2), "port" (close-up switch blok; Access port dibuang 29 Okt, tidak digunakan) dan "rangkaian"
   (B3–B6: kawasan + trunk + router + Local Tech Bridge + Internet). */
(function () {
  "use strict";
  var T = window.THREE, jam = S01Jam.cipta();
  var WARNA = { 10: 0x2563EB, 20: 0x16A34A, 25: 0x06B6D4, 30: 0x8B5CF6, 40: 0xF59E0B };
  var TERRA = 0xC8643B, BATA = 0xA9362C, LULUS = 0x15803D, AMBAR = 0xF59E0B;
  var GRAFIT = 0x2E2B28, NEUTRAL_ATAP = 0x8C857B, KELABU = 0xB9AFA0, ASFALT = 0x6B665F;
  var URUTAN = [10, 20, 25, 30, 40];
  var ZON = {
    10: { nama: "Kewangan", utara: true, lorong: -18, xs: [-330, -290], subnet: "172.16.12.0/24", gw: "172.16.12.1" },
    20: { nama: "Staff", utara: true, lorong: -10, xs: [-215, -175, -135, -95], subnet: "172.16.22.0/23", gw: "172.16.22.1" },
    25: { nama: "Executive", utara: true, lorong: -2, xs: [-10, 30], subnet: "172.16.26.0/24", gw: "172.16.26.1" },
    30: { nama: "Student", utara: false, lorong: 8, xs: [-310, -270, -230, -190], subnet: "192.168.32.0/23", gw: "192.168.32.1" },
    40: { nama: "Guest", utara: false, lorong: 17, xs: [-85, -45, -5], subnet: "192.168.42.0/24", gw: "192.168.42.1" }
  };
  var DHCP = {
    /* contoh = alamat pertama pool, untuk ilustrasi; alamat sebenar bergantung pada lease semasa. */
    30: { pool: "192.168.32.10 – 192.168.33.250", lease: "1d", dns: "208.67.222.222", contoh: "192.168.32.10" },
    40: { pool: "192.168.42.10 – 192.168.42.250", lease: "5h", dns: "208.67.222.222", contoh: "192.168.42.10" }
  };
  /* Petikan chain forward router SSeM, susunan asal (rule lain tidak dipaparkan). */
  var RULE = [
    { komen: "Allow Established/Related", terima: true },
    { komen: "Allow LAN to WAN", terima: true },
    { komen: "Allow Staff/Exec to Local LAN Resources", terima: true },
    { komen: "VLAN 30 -> Deny to VLAN 20", terima: false },
    { komen: "VLAN 40 -> Deny ALL local VLANs", terima: false },
    { komen: "VLAN 99 -> Block user access", terima: false },
    { komen: "DEFAULT DENY - Drop all unmatched forward traffic", terima: false, lalai: true }
  ];
  var UJIAN = {
    "staff-ltb": { dari: [20, 3], ke: "ltb", padan: 3, nama: "Staff → Local Tech Bridge" },
    "student-staff": { dari: [30, 3], ke: [20, 1], padan: 4, nama: "Student → Staff" },
    "guest-staff": { dari: [40, 0], ke: [20, 1], padan: 5, nama: "Guest → Staff" },
    "guest-internet": { dari: [40, 0], ke: "internet", padan: 2, nama: "Guest → Internet" },
    "student-kewangan": { dari: [30, 0], ke: [10, 1], padan: 7, nama: "Student → Kewangan" }
  };

  /* Susun atur (unit dunia; v(x, y, tinggi) dengan y = arah selatan). */
  var SW_X = 110, TRUNK_X1 = 300, RX0 = 330, RX1 = 430, PUSAT = [368, 0], LTB = [380, -172], NET = [532, 0];
  var GATE_Y = { 10: -60, 20: -30, 25: 0, 30: 30, 40: 60 };
  var PORT_X = [], PORT_ASAL = [10, 10, 20, 20, 20, 25, 30, 40], PORT_PILIH = 4;
  for (var i0 = 0; i0 < 8; i0++) PORT_X.push(-119 + i0 * 34);

  var PERANTI = [];
  URUTAN.forEach(function (z) {
    ZON[z].xs.forEach(function (x, j) { PERANTI.push({ zon: z, x: x, j: j }); });
  });
  PERANTI.forEach(function (p, n) {
    p.n = n; p.utara = ZON[p.zon].utara; p.cy = p.utara ? -122 : 116;
    p.pintuY = p.utara ? p.cy + 15 : p.cy - 15;
    p.baru = (p.zon === 30 && p.j === 3) || (p.zon === 40 && p.j === 2);
  });
  function peranti(z, j) { return PERANTI.filter(function (p) { return p.zon === z && p.j === j; })[0]; }

  var renderer, scene, camera, controls, bekas, lapisLabel, label = [], lekatan = [], dinamik;
  var gKawasan, gRangkaian, gPort;
  var bumbung = [], lampu = [], pagar = {}, lorong = [], garisTengah, gerbang = {}, kaunter = {}, pos = {}, pintuPort = [], atapPort = [], ledPort = [];
  var keadaan = { warna: false, bahagi: false, beban: 15, adegan: "kawasan" }, labelMod = "analogi", beban = false, adaGL = true;
  var vlanPort = PORT_ASAL.slice(), tanpaDefault = false, paparFrame = false, babakLakar = null;
  var elPapan, elBingkai, elTajuk;

  function v(x, y, z) { return new T.Vector3(x, z || 0, y); }
  function css(h) { return "#" + h.toString(16).padStart(6, "0"); }
  function bahan(warna, o) { return new T.MeshStandardMaterial(Object.assign({ color: warna, roughness: 0.82, metalness: 0 }, o || {})); }
  function tepi(mesh, warna) {
    var e = new T.LineSegments(new T.EdgesGeometry(mesh.geometry, 30), new T.LineBasicMaterial({ color: warna || GRAFIT, transparent: true, opacity: 0.85 }));
    mesh.add(e);
    return mesh;
  }
  function kotak(w, h, d, warna, x, y, z, o) {
    var m = new T.Mesh(new T.BoxGeometry(w, h, d), bahan(warna, o));
    m.position.set(x, y, z);
    m.castShadow = true; m.receiveShadow = true;
    return m;
  }
  /* Kotak nipis dari titik a ke b di atas tanah (jalan pendek serong). */
  function jalur(ax, ay, bx, by, lebar, tinggi, warna, aras) {
    var L = Math.hypot(bx - ax, by - ay), m = kotak(L, tinggi, lebar, warna, (ax + bx) / 2, aras, (ay + by) / 2);
    m.rotation.y = Math.atan2(-(by - ay), bx - ax);
    m.castShadow = false;
    return m;
  }
  function bacaan(t) { if (api.bacaan) api.bacaan(t); }
  function buang(o) {
    if (!o) return;
    if (o.parent) o.parent.remove(o);
    o.traverse(function (c) { if (c.geometry) c.geometry.dispose(); if (c.material) c.material.dispose(); });
  }

  /* ---------- Bina pemandangan ---------- */
  function bina() {
    scene = new T.Scene();
    scene.background = new T.Color(0xF4EDE1);
    scene.add(new T.HemisphereLight(0xFFFBF3, 0xD9CFBE, 1.6));
    var mat = new T.DirectionalLight(0xFFFFFF, 2.0);
    mat.position.set(-170, 420, 180);
    mat.target.position.set(90, 0, 0);
    mat.castShadow = true;
    mat.shadow.mapSize.set(2048, 2048);
    var sc = mat.shadow.camera; sc.left = -560; sc.right = 560; sc.top = 400; sc.bottom = -400; sc.near = 10; sc.far = 1400;
    mat.shadow.bias = -0.0008;
    scene.add(mat); scene.add(mat.target);

    var lantai = new T.Mesh(new T.PlaneGeometry(5000, 5000), bahan(0xEAE0CE));
    lantai.rotation.x = -Math.PI / 2; lantai.position.y = -14.5; lantai.receiveShadow = true;
    scene.add(lantai);

    gKawasan = new T.Group(); gRangkaian = new T.Group(); gPort = new T.Group();
    scene.add(gKawasan); scene.add(gRangkaian); scene.add(gPort);
    binaKawasan();
    binaRangkaian();
    binaPort();

    dinamik = new T.Group();
    scene.add(dinamik);
  }

  function binaKawasan() {
    var g = gKawasan;
    g.add(tepi(kotak(540, 14, 360, 0xFFFBF3, -120, -7, -3), 0xA69E91));
    g.add(kotak(500, 1.2, 48, ASFALT, -130, 0.6, 0));
    garisTengah = new T.Group();
    for (var x = -372; x < 96; x += 22) garisTengah.add(kotak(11, 0.4, 2.2, 0xFFFBF3, x + 5.5, 1.4, 0));
    g.add(garisTengah);

    URUTAN.forEach(function (kz) {
      var x0 = Math.min.apply(null, ZON[kz].xs) - 8, L = SW_X - x0;
      var m = kotak(L, 0.5, 6, WARNA[kz], x0 + L / 2, 1.5, ZON[kz].lorong, { transparent: true, opacity: 0 });
      m.castShadow = false;
      lorong.push(m); g.add(m);
    });

    PERANTI.forEach(function (p) {
      var ya = p.utara ? p.pintuY : 24, yb = p.utara ? -24 : p.pintuY;
      g.add(kotak(14, 0.8, Math.abs(yb - ya), 0xB5AEA3, p.x, 0.4, (ya + yb) / 2));
      var lj = kotak(3, 0.5, Math.abs(yb - ya), WARNA[p.zon], p.x, 1.2, (ya + yb) / 2, { transparent: true, opacity: 0 });
      lj.castShadow = false;
      lorong.push(lj); g.add(lj);
      var r = rumah(p.x, p.cy, 1);
      bumbung.push({ m: r.atap, zon: p.zon });
      p.objek = r.g;
      g.add(r.g);
    });

    URUTAN.forEach(binaPagar);
    binaGantri();
  }

  function rumah(x, y, s) {
    var g = new T.Group();
    g.position.set(x, 0, y);
    g.scale.setScalar(s);
    g.add(tepi(kotak(30, 16, 26, 0xF3EEE4, 0, 8, 0)));
    g.add(kotak(6, 9.5, 0.6, 0x57534E, 0, 4.75, 13.1));
    g.add(kotak(6, 5.5, 0.6, 0xB9CDD6, -9, 8.8, 13.1));
    g.add(kotak(6, 5.5, 0.6, 0xB9CDD6, 9, 8.8, 13.1));
    var bentuk = new T.Shape();
    bentuk.moveTo(-14.6, 0); bentuk.lineTo(14.6, 0); bentuk.lineTo(0, 10); bentuk.lineTo(-14.6, 0);
    var geo = new T.ExtrudeGeometry(bentuk, { depth: 33.2, bevelEnabled: false });
    geo.rotateY(Math.PI / 2); geo.translate(-16.6, 16, 0);
    var atap = new T.Mesh(geo, bahan(NEUTRAL_ATAP));
    atap.castShadow = true; atap.receiveShadow = true;
    g.add(tepi(atap));
    return { g: g, atap: atap.material };
  }

  function binaPagar(kz) {
    var z = ZON[kz], xs = z.xs;
    var x0 = Math.min.apply(null, xs) - 24, x1 = Math.max.apply(null, xs) + 24;
    var y0 = z.utara ? -150 : 92, y1 = z.utara ? -96 : 146, sisiJalan = z.utara ? y1 : y0;
    var g = new T.Group(), m = bahan(WARNA[kz]);
    function seg(ax, ay, bx, by) {
      var L = Math.hypot(bx - ax, by - ay), n = Math.max(1, Math.round(L / 11));
      var rel = new T.Mesh(new T.BoxGeometry(ax === bx ? 1.4 : L, 1.4, ax === bx ? L : 1.4), m);
      rel.position.set((ax + bx) / 2, 5.7, (ay + by) / 2); rel.castShadow = true; g.add(rel);
      for (var i = 0; i <= n; i++) {
        var t = new T.Mesh(new T.CylinderGeometry(1.1, 1.1, 8, 8), m);
        t.position.set(ax + (bx - ax) * i / n, 4, ay + (by - ay) * i / n); t.castShadow = true; g.add(t);
      }
    }
    var mula = x0;
    xs.forEach(function (x) { if (x - 10 > mula) seg(mula, sisiJalan, x - 10, sisiJalan); mula = x + 10; });
    if (x1 > mula) seg(mula, sisiJalan, x1, sisiJalan);
    seg(x0, z.utara ? y0 : y1, x1, z.utara ? y0 : y1);
    seg(x0, y0, x0, y1);
    seg(x1, y0, x1, y1);
    g.scale.y = 0.001; g.visible = false;
    pagar[kz] = g;
    gKawasan.add(g);
    papan(v(x0, sisiJalan, 26), "zon", function (l) {
      l.papar = keadaan.adegan !== "port";
      var nama = !keadaan.bahagi ? z.nama : (labelMod === "teknikal" ? "VLAN " : "Zon ") + kz + " · " + z.nama;
      l.el.innerHTML = nama + (keadaan.alamat ? "<small>" + z.subnet + "</small>" : "");
      l.el.classList.toggle("berwarna", keadaan.warna);
    }, { zon: kz });
  }

  function binaGantri() {
    var g = new T.Group();
    g.position.x = SW_X;
    [-31, 31].forEach(function (y) {
      g.add(kotak(12, 2, 12, 0xD6CDBE, 0, 1.8, y));
      g.add(tepi(kotak(6, 44, 6, 0x9A938A, 0, 24, y)));
    });
    g.add(tepi(kotak(24, 14, 76, GRAFIT, 0, 53, 0), 0x57534E));
    PERANTI.forEach(function (p, n) {
      var l = new T.Mesh(new T.BoxGeometry(3.2, 1.4, 2.6), new T.MeshStandardMaterial({ color: 0xE4DCCD, emissive: 0x000000, roughness: 0.5 }));
      l.position.set(4, 60.6, -31 + n * (62 / 14));
      g.add(l);
      lampu.push({ m: l.material, zon: p.zon });
    });
    gKawasan.add(g);
    papan(v(SW_X, -38, 70), "switch", function (l) {
      l.papar = keadaan.adegan !== "port";
      l.el.textContent = labelMod === "teknikal" ? "Switch" : "Bangunan switch";
    });
  }

  function binaRangkaian() {
    var g = gRangkaian;
    g.add(tepi(kotak(436, 14, 320, 0xFFFBF3, 368, -7, -55), 0xA69E91));
    /* Trunk: satu jalan dari gantri switch ke router. */
    var L = TRUNK_X1 - (SW_X + 12);
    g.add(kotak(L, 1.2, 20, 0x4A4540, SW_X + 12 + L / 2, 0.6, 0));
    [-10.5, 10.5].forEach(function (y) { var s = kotak(L, 1.4, 1.6, TERRA, SW_X + 12 + L / 2, 0.8, y); s.castShadow = false; g.add(s); });
    for (var x = SW_X + 20; x < TRUNK_X1 - 10; x += 22) g.add(kotak(11, 0.4, 1.6, 0xFFFBF3, x + 5.5, 1.4, 0));
    /* Label di selatan jalan, bukan di atasnya, supaya kereta dan bendera kelihatan. */
    papan(v(SW_X + 4, 14, 0), "trunk", function (l) {
      l.papar = keadaan.adegan === "rangkaian";
      l.el.innerHTML = (labelMod === "teknikal" ? "ether16-TRUNK" : "Jalan penghubung (trunk)") +
        (keadaan.trunkSsem ? "<small>Tag: 10 · 20 · 25 · 30 · 40 · 98 · 99</small>" : "");
    });

    /* Simpang router: lantai terbuka, gerbang setiap VLAN di sisi barat. */
    g.add(tepi(kotak(RX1 - RX0, 1.2, 160, 0xE4DCCD, (RX0 + RX1) / 2, 0.6, 0), TERRA));
    URUTAN.forEach(function (z) {
      var gy = GATE_Y[z];
      g.add(jalur(TRUNK_X1, 0, RX0, gy, 9, 1.1, ASFALT, 0.55));
      var lj = jalur(TRUNK_X1, 0, RX0, gy, 2.4, 0.5, WARNA[z], 1.25); g.add(lj);
      var gr = new T.Group();
      gr.position.set(RX0, 0, gy);
      [-10, 10].forEach(function (dy) { gr.add(tepi(kotak(2.6, 20, 2.6, WARNA[z], 0, 10, dy))); });
      gr.add(tepi(kotak(3, 3.4, 23, WARNA[z], 0, 21.5, 0)));
      var lengan = new T.Group();
      lengan.position.set(1.6, 8, -10);
      var batang = kotak(1.4, 1.6, 19, BATA, 0, 0, 9.5);
      lengan.add(batang);
      gr.add(lengan);
      g.add(gr);
      gerbang[z] = { g: gr, lengan: lengan, batang: batang.material, buka: 0 };
      var k = new T.Group();
      k.position.set(RX0 + 20, 0, gy - 11);
      k.add(tepi(kotak(10, 9, 8, 0xF3EEE4, 0, 4.5, 0)));
      k.add(tepi(kotak(12, 1.6, 10, WARNA[z], 0, 9.8, 0)));
      k.visible = false;
      g.add(k);
      kaunter[z] = k;
    });
    /* Label gateway di timur lantai simpang, sebaris dengan gerbangnya, supaya laluan kereta kelihatan. */
    papan(v(RX1 + 6, GATE_Y[20], 2), "gw", function (l) {
      l.papar = keadaan.adegan === "rangkaian" && !!keadaan.alamat && !!keadaan.gateway;
      l.el.textContent = "GW " + ZON[20].gw;
    }, { zon: 20 });
    papan(v(RX1 + 6, GATE_Y[30], 2), "gw", function (l) {
      l.papar = keadaan.adegan === "rangkaian" && !!keadaan.alamat && !!keadaan.gateway;
      l.el.textContent = "GW " + ZON[30].gw;
    }, { zon: 30 });

    var cpu = new T.Group();
    cpu.position.set(408, 0, 52);
    cpu.add(tepi(kotak(30, 22, 30, GRAFIT, 0, 11, 0), 0x57534E));
    cpu.add(tepi(kotak(32, 3, 32, TERRA, 0, 23.5, 0)));
    for (var n = 0; n < 5; n++) cpu.add(kotak(3, 1.4, 1, 0x7CD992, -10 + n * 5, 16, 15.2, { emissive: 0x2E8B57, emissiveIntensity: 0.6 }));
    g.add(cpu);
    papan(v(408, 70, 0), "router", function (l) {
      l.papar = keadaan.adegan === "rangkaian";
      l.el.textContent = labelMod === "teknikal" ? "Router MikroTik (Layer 3)" : "Simpang router";
    });

    /* Pos firewall di tengah simpang. */
    var p = new T.Group();
    p.position.set(392, 0, -26);
    p.add(tepi(kotak(14, 16, 14, 0xFFFBF3, 0, 8, 0)));
    p.add(tepi(kotak(18, 2.4, 18, BATA, 0, 17.2, 0)));
    var lamp = new T.Mesh(new T.SphereGeometry(3.4, 16, 12), new T.MeshStandardMaterial({ color: 0xE4DCCD, emissive: 0x000000 }));
    lamp.position.y = 22;
    p.add(lamp);
    p.visible = false;
    g.add(p);
    pos = { g: p, lampu: lamp.material };
    papan(v(RX1 + 6, -26, 2), "pos", function (l) {
      l.papar = keadaan.adegan === "rangkaian" && !!keadaan.firewall;
      l.el.textContent = labelMod === "teknikal" ? "Firewall · chain forward" : "Pos pemeriksaan";
    });

    /* Local Tech Bridge (bridge-lan, ether2–ether12) di utara router. */
    var yU = LTB[1] + 17;
    g.add(kotak(16, 1.2, -80 - yU, ASFALT, LTB[0], 0.6, (-80 + yU) / 2));
    var b = new T.Group();
    b.position.set(LTB[0], 0, LTB[1]);
    b.add(tepi(kotak(56, 20, 34, 0xF3EEE4, 0, 10, 0)));
    b.add(tepi(kotak(60, 3, 38, 0x57534E, 0, 21.5, 0)));
    for (var r = 0; r < 3; r++) b.add(kotak(10, 12, 0.6, 0x3B4648, -18 + r * 18, 8, 17.2));
    g.add(b);
    papan(v(LTB[0] - 96, LTB[1] + 18, 26), "ltb", function (l) {
      l.papar = keadaan.adegan === "rangkaian";
      l.el.innerHTML = "Local Tech Bridge" + (labelMod === "teknikal" || keadaan.alamat ? "<small>192.168.6.0/24</small>" : "");
    });

    /* Internet (WAN) di timur router. */
    g.add(kotak(NET[0] - 22 - RX1, 1.2, 16, ASFALT, (RX1 + NET[0] - 22) / 2, 0.6, 0));
    var dunia = new T.Group();
    dunia.position.set(NET[0], 0, NET[1]);
    dunia.add(tepi(kotak(20, 6, 20, 0xD6CDBE, 0, 3, 0)));
    var bola = new T.Mesh(new T.IcosahedronGeometry(17, 1), bahan(0xB9CDD6, { flatShading: true }));
    bola.position.y = 25; bola.castShadow = true;
    dunia.add(tepi(bola, 0x57534E));
    g.add(dunia);
    papan(v(NET[0] - 30, NET[1] + 22, 0), "net", function (l) {
      l.papar = keadaan.adegan === "rangkaian";
      l.el.textContent = "Internet (WAN)";
    });
  }

  function binaPort() {
    var g = gPort;
    g.add(tepi(kotak(340, 10, 250, 0xFFFBF3, 0, -5, 22), 0xA69E91));
    g.add(tepi(kotak(300, 40, 46, GRAFIT, 0, 20, -60), 0x57534E));
    g.add(tepi(kotak(304, 3, 50, 0x57534E, 0, 41.5, -60)));
    PORT_X.forEach(function (x, i) {
      g.add(kotak(10, 0.8, 104, 0xB5AEA3, x, 0.4, 27));
      var pintu = kotak(20, 22, 1.2, WARNA[PORT_ASAL[i]], x, 12, -36.4);
      g.add(tepi(pintu));
      pintuPort.push(pintu.material);
      var led = new T.Mesh(new T.BoxGeometry(5, 2.4, 1), new T.MeshStandardMaterial({ color: 0xE4DCCD, emissive: 0x000000 }));
      led.position.set(x, 29, -36.4);
      g.add(led);
      ledPort.push(led.material);
      var r = rumah(x, 92, 0.82);
      r.g.rotation.y = Math.PI;
      atapPort.push(r.atap);
      g.add(r.g);
      papan(v(x, -36, 36), "nombor", function (l) { l.papar = keadaan.adegan === "port"; l.el.textContent = String(i + 1); });
    });
    papan(v(-150, -60, 50), "switch", function (l) {
      l.papar = keadaan.adegan === "port";
      l.el.textContent = labelMod === "teknikal" ? "Switch · 8 access port" : "Bangunan switch blok";
    });
    papan(v(PORT_X[PORT_PILIH] + 14, 70, 26), "port", function (l) {
      l.papar = keadaan.adegan === "port";
      l.el.innerHTML = "Port 5 · VLAN " + vlanPort[PORT_PILIH] + " (access)<small>Komputer di port 5</small>";
      l.el.style.setProperty("--z", css(WARNA[vlanPort[PORT_PILIH]]));
    });
  }

  /* ---------- Label HTML ---------- */
  function papan(titik, jenis, kemas, o) {
    var l = { titik: titik, jenis: jenis, kemas: kemas, zon: o && o.zon, el: null, papar: true };
    label.push(l);
    return l;
  }
  function binaLabel() {
    lapisLabel = document.createElement("div");
    lapisLabel.className = "label-c";
    bekas.appendChild(lapisLabel);
    label.forEach(function (l) {
      l.el = document.createElement("div");
      l.el.className = "papan-c papan-c-" + l.jenis;
      if (l.zon) { l.el.style.setProperty("--z", css(WARNA[l.zon])); l.el.classList.add("berwarna"); }
      lapisLabel.appendChild(l.el);
    });
    elTajuk = document.createElement("div");
    elTajuk.className = "tajuk-c";
    lapisLabel.appendChild(elTajuk);
    var hint = document.createElement("div");
    hint.className = "hint-c";
    hint.textContent = "Seret untuk memutar · Skrol untuk zum · Klik dua kali untuk pandangan asal";
    lapisLabel.appendChild(hint);
    elPapan = document.createElement("div");
    elPapan.className = "papan-rule";
    lapisLabel.appendChild(elPapan);
    elBingkai = document.createElement("div");
    elBingkai.className = "bingkai-c";
    lapisLabel.appendChild(elBingkai);
  }
  function teksLabel() {
    label.forEach(function (l) { l.kemas(l); l.el.style.display = l.papar ? "" : "none"; });
    label.filter(function (l) { return l.jenis === "zon"; }).forEach(function (l) { l.el.classList.toggle("berwarna", keadaan.warna); });
    var a = labelMod !== "teknikal", ad = keadaan.adegan, t;
    if (ad === "port") t = a ? "Setiap pintu, satu zon" : "Access port: satu VLAN setiap port";
    else if (ad === "rangkaian") {
      if (keadaan.firewall) t = "";
      else if (keadaan.dhcp) t = a ? "Kaunter pas setiap zon" : "DHCP server setiap VLAN";
      else if (keadaan.gateway) t = a ? "Gerbang ke rangkaian lain" : "Inter-VLAN routing";
      else t = a ? "Jalan penghubung ke router" : "Trunk 802.1Q ke router";
    } else t = keadaan.bahagi ? (a ? "Lima zon, satu kawasan" : "Lima broadcast domain") : (a ? "Satu kawasan, tiada pagar" : "Satu broadcast domain");
    elTajuk.textContent = t;
    lapisLabel.dataset.adegan = ad;
    lukisPapan();
    lukisBingkai();
  }
  function lukisPapan() {
    var nyala = keadaan.adegan === "rangkaian" && keadaan.firewall;
    elPapan.style.display = nyala ? "" : "none";
    if (!nyala) return;
    var a = labelMod !== "teknikal";
    elPapan.innerHTML = "<b>" + (a ? "Papan rule (chain forward)" : "Firewall · chain forward") + "</b><ol>" +
      RULE.map(function (r, n) {
        var buangLalai = r.lalai && tanpaDefault;
        return '<li data-n="' + n + '"' + (buangLalai ? ' class="dibuang"' : "") + "><code>" + r.komen + '</code><span class="tindakan ' + (r.terima ? "ok" : "tolak") + '">' +
          (r.terima ? (a ? "DIBENARKAN" : "accept") : (a ? "DITOLAK" : "drop")) + "</span></li>";
      }).join("") + "</ol><p>Petikan 7 rule, susunan asal. Rule lain tidak dipaparkan.</p>";
  }
  function lukisBingkai() {
    var nyala = paparFrame && keadaan.adegan === "rangkaian";
    elBingkai.style.display = nyala ? "" : "none";
    if (!nyala) return;
    elBingkai.innerHTML = "<span>MAC destinasi</span><span>MAC sumber</span>" +
      (keadaan.tag ? '<span class="tag">Tag 802.1Q · VLAN 20</span>' : '<span class="tiada">Tiada tag</span>') + "<span>Data</span>";
  }
  var sementara = new T.Vector3();
  function letakLabel() {
    var w = bekas.clientWidth, h = bekas.clientHeight;
    function skrin(t) {
      sementara.copy(t).project(camera);
      return [Math.round((sementara.x + 1) / 2 * w), Math.round((1 - sementara.y) / 2 * h), sementara.z < 1];
    }
    label.forEach(function (l) {
      if (!l.papar) return;
      var s = skrin(l.titik);
      l.el.style.transform = "translate(" + s[0] + "px," + s[1] + "px)";
      l.el.style.visibility = s[2] ? "visible" : "hidden";
    });
    lekatan.forEach(function (k) {
      if (k.tetap) return;
      if (k.obj) { k.obj.getWorldPosition(sementara); sementara.y += k.dy || 0; } else sementara.copy(k.titik);
      var p = sementara.clone(), s = skrin(p);
      k.el.style.left = s[0] + "px"; k.el.style.top = s[1] + "px";
      k.el.style.visibility = s[2] && k.papar !== false ? "visible" : "hidden";
    });
  }
  /* Label sementara yang mengikut objek (bendera tag, tanda ✓/✕, kad DHCP). Dibuang oleh henti(). */
  function lekat(html, kelas, obj, dy, titik) {
    var el = document.createElement("div");
    el.className = kelas;
    el.innerHTML = html;
    lapisLabel.appendChild(el);
    var k = { el: el, obj: obj, dy: dy, titik: titik, papar: true };
    lekatan.push(k);
    return k;
  }
  function lepas(k) {
    var i = lekatan.indexOf(k);
    if (i >= 0) lekatan.splice(i, 1);
    if (k && k.el.parentNode) k.el.parentNode.removeChild(k.el);
  }
  function tanda(ok, titik, teks) {
    return lekat((ok ? "✓" : "✕") + (teks ? "<small>" + teks + "</small>" : ""), "tanda-c " + (ok ? "ok" : "tolak"), null, 0, titik);
  }

  /* ---------- Keadaan ---------- */
  function setWarna(benar, animasi) {
    var dari = bumbung.map(function (b) { return b.m.color.clone(); });
    var ke = bumbung.map(function (b) { return new T.Color(benar ? WARNA[b.zon] : NEUTRAL_ATAP); });
    if (!animasi) { bumbung.forEach(function (b, i) { b.m.color.copy(ke[i]); }); return; }
    jam.tween(600, function (q) { bumbung.forEach(function (b, i) { b.m.color.copy(dari[i]).lerp(ke[i], q); }); });
  }
  function setLampu() {
    lampu.forEach(function (l) {
      l.m.color.set(keadaan.bahagi ? WARNA[l.zon] : 0xE4DCCD);
      l.m.emissive.set(keadaan.bahagi ? WARNA[l.zon] : 0x000000);
      l.m.emissiveIntensity = 0.35;
    });
    ledPort.forEach(function (m, i) { m.color.set(WARNA[vlanPort[i]]); m.emissive.set(WARNA[vlanPort[i]]); m.emissiveIntensity = 0.3; });
    if (pos.lampu) { pos.lampu.color.set(0xE4DCCD); pos.lampu.emissive.set(0x000000); }
  }
  var genBahagi = 0;
  function setBahagi(benar, animasi) {
    var gen = ++genBahagi;
    if (!animasi) {
      URUTAN.forEach(function (kz) { pagar[kz].visible = benar; pagar[kz].scale.y = benar ? 1 : 0.001; });
      lorong.forEach(function (m) { m.material.opacity = benar ? 0.9 : 0; });
      garisTengah.visible = !benar;
      setLampu();
      return Promise.resolve();
    }
    garisTengah.visible = !benar;
    jam.tween(700, function (q) { lorong.forEach(function (m) { m.material.opacity = (benar ? q : 1 - q) * 0.9; }); });
    return Promise.all(URUTAN.map(function (kz, i) {
      return jam.tunggu(i * 220).then(function () {
        if (gen !== genBahagi) return;
        pagar[kz].visible = true;
        return jam.tween(700, function (q) {
          var e = jam.lembut(q);
          pagar[kz].scale.y = Math.max(0.001, benar ? e : 1 - e);
        }).then(function () { if (gen === genBahagi) pagar[kz].visible = benar; });
      });
    })).then(function () { if (gen === genBahagi) setLampu(); });
  }
  function setGerbang(buka, animasi) {
    URUTAN.forEach(function (z) {
      var gr = gerbang[z], dari = gr.buka, ke = buka ? 1 : 0;
      function f(q) {
        var b = dari + (ke - dari) * q;
        gr.buka = b;
        gr.lengan.rotation.x = -b * 1.35;
        gr.batang.color.set(b > 0.5 ? WARNA[z] : BATA);
      }
      if (animasi && dari !== ke) jam.tween(700, function (q) { f(jam.lembut(q)); }); else f(1);
    });
  }
  function setPort() {
    pintuPort.forEach(function (m, i) { m.color.set(WARNA[vlanPort[i]]); });
    atapPort.forEach(function (m, i) { m.color.set(WARNA[vlanPort[i]]); });
    setLampu();
  }
  function setPerantiBaru(sorok) {
    PERANTI.forEach(function (p) {
      if (!p.baru) return;
      p.objek.visible = !sorok;
      p.objek.scale.y = sorok ? 0.001 : 1;
    });
  }

  /* ---------- Kamera ---------- */
  var KAMERA = {
    kawasan: { pos: [280, 400, 508], sasaran: [-92, 0, 10] },
    port: { pos: [190, 300, 420], sasaran: [0, 0, 20] },
    rangkaian: { pos: [262, 1080, 552], sasaran: [112, 0, -78] },
    firewall: { pos: [312, 1166, 530], sasaran: [150, 0, -150] }
  };
  var adeganKamera = "kawasan", gerakKamera = null;
  function keKamera(nama, animasi) {
    var k = KAMERA[nama], kePos = new T.Vector3().fromArray(k.pos), keSas = new T.Vector3().fromArray(k.sasaran);
    adeganKamera = nama;
    if (!animasi) {
      gerakKamera = null; controls.enabled = true;
      camera.position.copy(kePos); controls.target.copy(keSas); controls.update();
      return;
    }
    gerakKamera = { t: 0, ms: 1400, dariPos: camera.position.clone(), dariSas: controls.target.clone(), kePos: kePos, keSas: keSas };
    controls.enabled = false;
  }
  function langkahKamera(dt, dijeda) {
    if (!gerakKamera || dijeda) return;
    var g = gerakKamera;
    g.t += dt;
    var q = jam.lembut(Math.min(1, g.t / g.ms));
    camera.position.copy(g.dariPos).lerp(g.kePos, q);
    controls.target.copy(g.dariSas).lerp(g.keSas, q);
    if (q >= 1) { gerakKamera = null; controls.enabled = true; }
  }
  function bakiKamera() { return gerakKamera ? Math.max(0, gerakKamera.ms - gerakKamera.t) * 0.6 : 0; }
  function pandanganAsal() { keKamera(adeganKamera, false); }

  /* ---------- Objek bergerak ---------- */
  function laluan(p, zonSahaja) {
    var ly = zonSahaja ? ZON[p.zon].lorong : 0;
    return [v(p.x, p.pintuY, 2), v(p.x, ly, 2), v(SW_X, ly, 2)];
  }
  function keRouter(z) { return [v(SW_X, ZON[z].lorong, 2), v(SW_X + 16, 0, 2), v(TRUNK_X1, 0, 2), v(RX0, GATE_Y[z], 2)]; }
  function dalamRouter(z) { return [v(RX0, GATE_Y[z], 2), v(RX0 + 14, GATE_Y[z], 2), v(PUSAT[0], PUSAT[1], 2)]; }
  function rumahKePusat(p) { return laluan(p, true).concat(keRouter(p.zon).slice(1), dalamRouter(p.zon).slice(1)); }
  function sepanjang(titik, laju, fn) {
    var seg = [], jumlah = 0;
    for (var i = 1; i < titik.length; i++) { var d = titik[i].distanceTo(titik[i - 1]); seg.push(d); jumlah += d; }
    var p = new T.Vector3();
    return jam.tween(jumlah / laju * 1000, function (q) {
      var jarak = q * jumlah, j = 0;
      while (j < seg.length - 1 && jarak > seg[j]) { jarak -= seg[j]; j++; }
      p.copy(titik[j]).lerp(titik[j + 1], seg[j] ? Math.min(1, jarak / seg[j]) : 1);
      fn(p, titik[j + 1].clone().sub(titik[j]), q);
    });
  }
  function kereta(warna) {
    var g = new T.Group();
    g.add(tepi(kotak(18, 5, 10, 0xE8E2D6, 0, 4, 0)));
    g.add(tepi(kotak(9, 3.6, 8, 0xD5DEE2, -0.5, 8.3, 0)));
    var jalurK = kotak(18.2, 1.4, 10.2, warna, 0, 3, 0);
    g.add(jalurK);
    g.userData.jalur = jalurK.material;
    dinamik.add(g);
    return g;
  }
  /* Bendera tag pada kereta: tiang + kain berwarna (3D) dan nombor VLAN (label HTML). */
  function bendera(k, z) {
    var b = new T.Group();
    var tiang = new T.Mesh(new T.CylinderGeometry(0.6, 0.6, 16, 6), bahan(GRAFIT));
    tiang.position.set(-6, 14, 0); b.add(tiang);
    b.add(tepi(kotak(10, 6.5, 0.8, WARNA[z], -0.6, 18.8, 0)));
    b.visible = false;
    k.add(b);
    var lab = lekat(String(z), "lencana-c", k, 30);
    lab.el.style.setProperty("--z", css(WARNA[z]));
    lab.papar = false;
    return { set: function (ya) { b.visible = ya; lab.papar = ya; }, lepas: function () { lepas(lab); } };
  }
  function pudar(o, ms) {
    var m = [];
    o.traverse(function (c) { if (c.material) { c.material.transparent = true; m.push(c.material); } });
    return jam.tween(ms, function (q) { m.forEach(function (x) { x.opacity = 1 - q; }); });
  }
  function denyut(warna) {
    var m = new T.Mesh(new T.SphereGeometry(4, 16, 12), new T.MeshBasicMaterial({ color: warna }));
    var h = new T.Mesh(new T.SphereGeometry(7.5, 16, 12), new T.MeshBasicMaterial({ color: warna, transparent: true, opacity: 0.25 }));
    m.add(h);
    dinamik.add(m);
    return m;
  }
  function cincin(pos, warna, besar, ms) {
    var m = new T.Mesh(new T.RingGeometry(0.85, 1, 48), new T.MeshBasicMaterial({ color: warna, transparent: true, side: T.DoubleSide }));
    m.rotation.x = -Math.PI / 2; m.position.copy(pos);
    dinamik.add(m);
    return jam.tween(ms, function (q) {
      var r = 6 + besar * q; m.scale.set(r, r, r); m.material.opacity = 1 - q;
    }).then(function () { buang(m); });
  }
  function kilatPeranti(p, warna) { return cincin(v(p.x, p.cy, 1.5), warna, 30, 900); }
  function kilatLampu(n) {
    var l = lampu[n];
    l.m.emissive.set(TERRA); l.m.emissiveIntensity = 1.2;
    return jam.tunggu(500).then(setLampu);
  }
  function kilatBahan(m, warna, ms) {
    m.emissive.set(warna); m.emissiveIntensity = 0.9;
    return jam.tunggu(ms || 600).then(function () { m.emissive.set(0x000000); m.emissiveIntensity = 0; });
  }
  /* Kereta melalui trunk: bendera dipasang di antara switch dan router jika tag aktif. */
  function pantauTrunk(b) {
    return function (p) { b.set(!!keadaan.tag && p.x > SW_X + 12 && p.x < RX0 - 1); };
  }

  /* ---------- Tindakan B1–B2 ---------- */
  function unicast() {
    var tk = jam.token(), dari = peranti(20, 1), ke = peranti(25, 0);
    var jalan = laluan(dari).concat(laluan(ke).slice(0, 2).reverse());
    var k = kereta(keadaan.warna ? WARNA[dari.zon] : KELABU), hidup = false;
    bacaan("Dari: " + ZON[dari.zon].nama + " → Ke: " + ZON[ke.zon].nama);
    return sepanjang(jalan, 150, function (p, arah, q) {
      if (tk !== jam.token()) return;
      k.position.set(p.x, 0, p.z);
      k.rotation.y = Math.atan2(-arah.z, arah.x);
      if (!hidup && q > 0.5) { hidup = true; kilatLampu(ke.n); }
    }).then(function () {
      if (tk !== jam.token()) return;
      kilatPeranti(ke, keadaan.warna ? WARNA[ke.zon] : TERRA);
      bacaan("Penerima: 1 · rumah lain tidak terlibat");
      return jam.tunggu(900).then(function () { if (tk === jam.token()) buang(k); });
    });
  }

  function siaran(zonSahaja) {
    var tk = jam.token();
    var dari = zonSahaja ? peranti(30, 1) : peranti(20, 1);
    var sasaran = PERANTI.filter(function (p) { return p !== dari && (!zonSahaja || p.zon === dari.zon); });
    var warna = zonSahaja ? WARNA[30] : TERRA, kiraan = 0;
    bacaan("Penerima: 0");
    var atas = v(dari.x, dari.cy, 28);
    cincin(atas, warna, 26, 900);
    return jam.tunggu(250).then(function () { if (tk !== jam.token()) return; cincin(atas, warna, 26, 900); return jam.tunggu(450); }).then(function () {
      if (tk !== jam.token()) return;
      var d = denyut(warna);
      return sepanjang(laluan(dari, zonSahaja), 280, function (p) { d.position.copy(p); }).then(function () {
        buang(d);
        if (tk !== jam.token()) return;
        sasaran.forEach(function (p) { kilatLampu(p.n); });
        return Promise.all(sasaran.map(function (p) {
          var dd = denyut(warna);
          return sepanjang(laluan(p, zonSahaja).reverse(), 280, function (q) { dd.position.copy(q); }).then(function () {
            buang(dd);
            if (tk !== jam.token()) return;
            kiraan++;
            bacaan("Penerima: " + kiraan + (kiraan === sasaran.length ? (zonSahaja ? " · zon Student sahaja" : " · semua peranti lain") : ""));
            return kilatPeranti(p, warna);
          });
        }));
      });
    });
  }

  function mulaBeban() {
    var tk = jam.token();
    beban = true;
    function satu() {
      if (tk !== jam.token()) return;
      var n = keadaan.beban, dari = PERANTI[Math.floor(Math.random() * PERANTI.length)];
      cincin(v(dari.x, dari.cy, 28), TERRA, 24, 800);
      jam.tunggu(380).then(function () {
        if (tk !== jam.token()) return;
        PERANTI.forEach(function (p) { if (p !== dari) kilatPeranti(p, TERRA); });
      });
      bacaan("Peranti: " + n + " · setiap pengumuman sampai ke " + (n - 1) + " peranti lain");
      jam.tunggu(Math.max(180, Math.min(2400, 2400 * 15 / n))).then(satu);
    }
    satu();
    return new Promise(function () {});
  }

  /* ---------- (tidak digunakan) Access port ---------- */
  function portHantar() {
    var tk = jam.token(), x = PORT_X[PORT_PILIH], z = vlanPort[PORT_PILIH];
    var k = kereta(KELABU);
    bacaan("Komputer di port 5 menghantar frame · tiada tag");
    return sepanjang([v(x, 78, 2), v(x, -30, 2)], 110, function (p, arah) {
      if (tk !== jam.token()) return;
      k.position.set(p.x, 0, p.z);
      k.rotation.y = Math.atan2(-arah.z, arah.x);
    }).then(function () {
      if (tk !== jam.token()) return;
      kilatBahan(ledPort[PORT_PILIH], WARNA[z], 900);
      var dari = k.userData.jalur.color.clone(), ke = new T.Color(WARNA[z]);
      jam.tween(500, function (q) { k.userData.jalur.color.copy(dari).lerp(ke, q); });
      var lab = lekat("Masuk ke VLAN " + z, "lencana-c lebar", null, 0, v(x, -36, 52));
      lab.el.style.setProperty("--z", css(WARNA[z]));
      bacaan("Port 5 ialah access port VLAN " + z + " · switch meletakkan frame dalam VLAN " + z);
      return jam.tunggu(1400).then(function () { if (tk === jam.token()) return pudar(k, 500); });
    });
  }
  function portSiaran() {
    var tk = jam.token(), x = PORT_X[PORT_PILIH], z = vlanPort[PORT_PILIH], warna = WARNA[z], kiraan = 0;
    var sasaran = []; vlanPort.forEach(function (vz, i) { if (i !== PORT_PILIH && vz === z) sasaran.push(i); });
    bacaan("Siaran dari port 5 (VLAN " + z + ") · Penerima: 0");
    cincin(v(x, 92, 26), warna, 22, 900);
    return jam.tunggu(450).then(function () {
      if (tk !== jam.token()) return;
      var d = denyut(warna);
      return sepanjang([v(x, 78, 3), v(x, -30, 3)], 240, function (p) { d.position.copy(p); }).then(function () {
        buang(d);
        if (tk !== jam.token()) return;
        if (!sasaran.length) { bacaan("Port 5 (VLAN " + z + ") · Penerima: 0 · tiada port lain dalam VLAN " + z); return; }
        return Promise.all(sasaran.map(function (i) {
          kilatBahan(ledPort[i], warna, 900);
          var dd = denyut(warna);
          return sepanjang([v(x, -30, 3), v(PORT_X[i], -30, 3), v(PORT_X[i], 78, 3)], 240, function (p) { dd.position.copy(p); }).then(function () {
            buang(dd);
            if (tk !== jam.token()) return;
            kiraan++;
            bacaan("Siaran dari port 5 (VLAN " + z + ") · Penerima: " + kiraan + (kiraan === sasaran.length ? " · VLAN " + z + " sahaja" : ""));
            return cincin(v(PORT_X[i], 92, 1.5), warna, 24, 900);
          });
        }));
      });
    });
  }
  function portTukar(z) {
    var tk = jam.token(), m = atapPort[PORT_PILIH], dari = m.color.clone(), ke = new T.Color(WARNA[z]);
    vlanPort[PORT_PILIH] = z;
    pintuPort[PORT_PILIH].color.set(WARNA[z]);
    setLampu();
    teksLabel();
    return jam.tween(600, function (q) { m.color.copy(dari).lerp(ke, q); }).then(function () { if (tk === jam.token()) return portSiaran(); });
  }

  /* ---------- B3 · Trunk ---------- */
  function trunk() {
    var tk = jam.token(), zon = keadaan.trunkSsem ? URUTAN : [20, 30, 40], tiba = 0;
    bacaan(keadaan.tag ? "Bendera tag dipasang di pintu trunk" : "Tag dibuang · kereta masuk ke trunk tanpa bendera");
    return Promise.all(zon.map(function (z, n) {
      return jam.tunggu(n * 650).then(function () {
        if (tk !== jam.token()) return;
        var p = peranti(z, 0), k = kereta(WARNA[z]), b = bendera(k, z), pantau = pantauTrunk(b);
        var akhir = keadaan.tag ? [v(RX0 + 16, GATE_Y[z], 2)] : [v(TRUNK_X1 + 6, 0, 2)];
        var jalan = laluan(p, true).concat(keadaan.tag ? keRouter(z).slice(1) : keRouter(z).slice(1, 3), akhir);
        return sepanjang(jalan, 190, function (q, arah) {
          if (tk !== jam.token()) return;
          k.position.set(q.x, 0, q.z);
          k.rotation.y = Math.atan2(-arah.z, arah.x);
          pantau(q);
        }).then(function () {
          if (tk !== jam.token()) return;
          tiba++;
          if (keadaan.tag) {
            var lab = lekat(labelMod === "teknikal" ? "VLAN" + z + "-" + ZON[z].nama : "Pintu zon " + z, "lencana-c lebar kanan", null, 0, v(RX0 + 8, GATE_Y[z], 6));
            lab.el.style.setProperty("--z", css(WARNA[z]));
            bacaan("Tiba di router: " + tiba + " · setiap kereta masuk ke pintu VLAN sendiri");
            return jam.tunggu(1500).then(function () { if (tk === jam.token()) { lepas(lab); return pudar(k, 500); } });
          }
          lekat("?", "tanda-c tanya", k, 30);
          bacaan("Tiba di router: " + tiba + " · tiada tag, VLAN asal tidak diketahui");
        });
      });
    }));
  }

  /* ---------- B4 · Antara VLAN ---------- */
  function keLtb() {
    var tk = jam.token(), p = peranti(20, 3), k = kereta(WARNA[20]), b = bendera(k, 20), pantau = pantauTrunk(b);
    var jalan = laluan(p, true).concat(keRouter(20).slice(1));
    if (keadaan.gateway) jalan = jalan.concat(dalamRouter(20).slice(1), [v(LTB[0], -80, 2), v(LTB[0], LTB[1] + 26, 2)]);
    else jalan[jalan.length - 1] = v(RX0 - 7, GATE_Y[20], 2);
    bacaan("Staff (172.16.22.0/23) → Local Tech Bridge (192.168.6.0/24)");
    var lalu = false;
    return sepanjang(jalan, 190, function (q, arah) {
      if (tk !== jam.token()) return;
      k.position.set(q.x, 0, q.z);
      k.rotation.y = Math.atan2(-arah.z, arah.x);
      pantau(q);
      if (keadaan.gateway && !lalu && q.x > RX0) { lalu = true; bacaan("Masuk ke gateway " + ZON[20].gw + " · router menghantar ke 192.168.6.0/24"); }
    }).then(function () {
      if (tk !== jam.token()) return;
      if (!keadaan.gateway) {
        tanda(false, v(RX0 - 10, GATE_Y[20], 34), "Tiada gateway");
        bacaan("VLAN 20 berakhir di sini · tiada laluan Layer 3");
        return;
      }
      tanda(true, v(LTB[0] + 44, LTB[1] + 26, 20));
      bacaan("Sampai: Staff → gateway " + ZON[20].gw + " → Local Tech Bridge");
    });
  }

  /* ---------- B6 · Firewall ---------- */
  function sorotBaris(n, kelas) {
    Array.prototype.forEach.call(elPapan.querySelectorAll("li"), function (li, i) {
      li.classList.toggle("semak", kelas === "semak" && i === n);
      if (kelas !== "semak" && i === n) li.classList.add(kelas);
    });
  }
  function bersihPapan() {
    Array.prototype.forEach.call(elPapan.querySelectorAll("li"), function (li) { li.classList.remove("semak", "padan-ok", "padan-tolak"); });
  }
  function uji(nama) {
    var tk = jam.token(), u = UJIAN[nama], dari = peranti(u.dari[0], u.dari[1]);
    var padan = u.padan === 7 && tanpaDefault ? null : u.padan;
    var k = kereta(WARNA[dari.zon]), b = bendera(k, dari.zon), pantau = pantauTrunk(b);
    bersihPapan();
    bacaan(u.nama + " · menuju ke pos pemeriksaan");
    function gerak(jalan) {
      return sepanjang(jalan, 200, function (q, arah) {
        if (tk !== jam.token()) return;
        k.position.set(q.x, 0, q.z);
        k.rotation.y = Math.atan2(-arah.z, arah.x);
        pantau(q);
      });
    }
    return gerak(rumahKePusat(dari)).then(function () {
      if (tk !== jam.token()) return;
      pos.lampu.color.set(AMBAR); pos.lampu.emissive.set(AMBAR); pos.lampu.emissiveIntensity = 0.8;
      var had = padan || RULE.length, n = 0;
      function seterusnya() {
        if (tk !== jam.token()) return;
        if (n >= had) return Promise.resolve();
        if (RULE[n].lalai && tanpaDefault) { n++; return seterusnya(); }
        sorotBaris(n, "semak");
        n++;
        return jam.tunggu(420).then(seterusnya);
      }
      return seterusnya().then(function () {
        if (tk !== jam.token()) return;
        sorotBaris(-1, "semak");
        var terima = padan ? RULE[padan - 1].terima : true;
        if (padan) sorotBaris(padan - 1, terima ? "padan-ok" : "padan-tolak");
        pos.lampu.color.set(terima ? LULUS : BATA); pos.lampu.emissive.set(terima ? LULUS : BATA);
        var sebab = padan ? "rule " + padan + ": " + RULE[padan - 1].komen.replace(/ - Drop.*$/, "") : "tiada rule padan → diterima (lalai)";
        bacaan(u.nama + " · " + sebab + " · " + (terima ? "DIBENARKAN" : "DITOLAK"));
        var titikPusat = v(PUSAT[0] - 16, PUSAT[1] + 16, 12);
        if (!terima) {
          tanda(false, titikPusat);
          return jam.tunggu(900).then(function () { if (tk === jam.token()) return pudar(k, 800); });
        }
        tanda(true, titikPusat);
        var jalan;
        if (u.ke === "ltb") jalan = [v(PUSAT[0], PUSAT[1], 2), v(LTB[0], -80, 2), v(LTB[0], LTB[1] + 26, 2)];
        else if (u.ke === "internet") jalan = [v(PUSAT[0], PUSAT[1], 2), v(RX1, 0, 2), v(NET[0] - 24, 0, 2)];
        else {
          b.set(false);
          b = bendera(k, u.ke[0]);
          pantau = pantauTrunk(b);
          jalan = rumahKePusat(peranti(u.ke[0], u.ke[1])).reverse();
        }
        return jam.tunggu(500).then(function () { if (tk === jam.token()) return gerak(jalan); }).then(function () {
          if (tk !== jam.token()) return;
          bacaan(u.nama + " · sampai");
          return jam.tunggu(700).then(function () { if (tk === jam.token()) return pudar(k, 500); });
        });
      });
    });
  }
  function togolDefault() {
    tanpaDefault = !tanpaDefault;
    lukisPapan();
    return uji("student-kewangan");
  }

  /* ---------- B5 · DHCP: Discover → Offer → Request → ACK ---------- */
  var DORA = [["Discover", "cari server"], ["Offer", "tawarkan IP"], ["Request", "minta IP"], ["ACK", "sahkan IP"]];
  function dhcp(z) {
    var tk = jam.token(), p = PERANTI.filter(function (x) { return x.zon === z && x.baru; })[0], d = DHCP[z], warna = WARNA[z];
    var jiran = PERANTI.filter(function (x) { return x.zon === z && x !== p; });
    var a = labelMod !== "teknikal", masuk = keRouter(z).concat([v(RX0 + 12, GATE_Y[z], 2)]);
    setPerantiBaru(true);
    p.objek.visible = true; p.objek.scale.y = 0.001;
    bacaan("Peranti baharu bersambung ke zon " + ZON[z].nama + " · belum ada IP");
    var lbBaru = lekat("Tiada IP", "lencana-c lebar putih", null, 0, v(p.x, p.cy, 48));
    var pool = lekat("<b>" + (a ? "Kaunter pas · " : "") + "DHCP server VLAN" + z + "-" + ZON[z].nama + "</b>" +
      "<span>Pool " + d.pool + "</span><span>Gateway " + ZON[z].gw + "</span>", "pool-c", null, 0, v(RX0 + 10, 84, 0));
    pool.el.style.setProperty("--z", css(warna));
    var jalur = lekat(DORA.map(function (x, n) {
      return "<span><b>" + (n + 1) + "</b> " + x[0] + (a ? "<small>" + x[1] + "</small>" : "") + "</span>";
    }).join(""), "dora-c", null, 0, null);
    jalur.tetap = true;
    jalur.el.style.setProperty("--z", css(warna));
    function langkahDora(n) {
      Array.prototype.forEach.call(jalur.el.children, function (c, m) { c.className = m < n ? "siap" : m === n ? "kini" : ""; });
    }
    /* Satu perjalanan mesej antara rumah dan kaunter; lencana VLAN hanya kelihatan di trunk. */
    function hantar(keServer, warnaDenyut) {
      var titik = keServer ? laluan(p, true).concat(masuk) : masuk.slice().reverse().concat(laluan(p, true).reverse().slice(1));
      var dt = denyut(warnaDenyut), lab = lekat(String(z), "lencana-c", dt, 14);
      lab.el.style.setProperty("--z", css(warna));
      lab.papar = false;
      return sepanjang(titik, 260, function (q) { dt.position.copy(q); lab.papar = q.x > SW_X + 12 && q.x < RX0 - 1; }).then(function () {
        buang(dt); lepas(lab);
      });
    }
    function kilatKaunter() { kaunter[z].traverse(function (c) { if (c.material && c.material.emissive) kilatBahan(c.material, warna, 900); }); }
    return jam.tween(600, function (q) { p.objek.scale.y = Math.max(0.001, jam.lembut(q)); }).then(function () {
      if (tk !== jam.token()) return;
      langkahDora(0);
      cincin(v(p.x, p.cy, 28), warna, 26, 900);
      bacaan("1 · DHCP Discover (broadcast): mencari DHCP server · kekal dalam VLAN " + z);
      return jam.tunggu(450);
    }).then(function () {
      if (tk !== jam.token()) return;
      /* Discover ialah broadcast: jiran dalam zon yang sama turut menerimanya. */
      var dd = denyut(warna);
      return sepanjang(laluan(p, true), 260, function (q) { dd.position.copy(q); }).then(function () {
        buang(dd);
        if (tk !== jam.token()) return;
        jiran.forEach(function (j) {
          var dj = denyut(warna);
          sepanjang(laluan(j, true).reverse(), 260, function (q) { dj.position.copy(q); }).then(function () { buang(dj); if (tk === jam.token()) kilatPeranti(j, warna); });
        });
        var dt = denyut(warna), lab = lekat(String(z), "lencana-c", dt, 14);
        lab.el.style.setProperty("--z", css(warna));
        lab.papar = false;
        return sepanjang(masuk, 260, function (q) { dt.position.copy(q); lab.papar = q.x > SW_X + 12 && q.x < RX0 - 1; }).then(function () {
          buang(dt); lepas(lab);
        });
      });
    }).then(function () {
      if (tk !== jam.token()) return;
      langkahDora(1);
      kilatKaunter();
      bacaan("2 · DHCP Offer: server menawarkan " + d.contoh + " daripada pool");
      return jam.tunggu(600).then(function () { if (tk === jam.token()) return hantar(false, 0xFFFBF3); });
    }).then(function () {
      if (tk !== jam.token()) return;
      langkahDora(2);
      bacaan("3 · DHCP Request: peranti meminta " + d.contoh);
      return hantar(true, warna);
    }).then(function () {
      if (tk !== jam.token()) return;
      langkahDora(3);
      kilatKaunter();
      bacaan("4 · DHCP ACK: server mengesahkan " + d.contoh + " · lease " + d.lease);
      return jam.tunggu(500).then(function () { if (tk === jam.token()) return hantar(false, 0xFFFBF3); });
    }).then(function () {
      if (tk !== jam.token()) return;
      langkahDora(4);
      lepas(lbBaru);
      kilatPeranti(p, warna);
      var ipRumah = lekat("IP " + d.contoh, "lencana-c lebar", null, 0, v(p.x, p.cy, 48));
      ipRumah.el.style.setProperty("--z", css(warna));
      var kad = lekat("<b>" + (a ? "Pas diterima" : "DHCP ACK · VLAN" + z + "-" + ZON[z].nama) + "</b>" +
        "<span>IP " + d.contoh + " (contoh daripada pool)</span><span>Gateway " + ZON[z].gw + " · DNS " + d.dns + "</span><span>Lease " + d.lease + "</span>",
        "kad-dhcp-c", null, 0, null);
      kad.tetap = true;
      kad.el.style.setProperty("--z", css(warna));
      bacaan("Peranti " + ZON[z].nama + " menerima IP " + d.contoh + " · lease " + d.lease);
    });
  }

  /* ---------- B5 · Tempoh lease: dua peranti, jam dipercepat ---------- */
  var JAM_LEASE = { 30: 24, 40: 5 };
  function lease() {
    var tk = jam.token();
    setPerantiBaru(true);
    var rumah = [30, 40].map(function (z) {
      var p = PERANTI.filter(function (x) { return x.zon === z && x.baru; })[0];
      p.objek.visible = true; p.objek.scale.y = 1;
      var l = lekat("IP " + DHCP[z].contoh, "lencana-c lebar", null, 0, v(p.x, p.cy, 48));
      l.el.style.setProperty("--z", css(WARNA[z]));
      return { z: z, p: p, l: l };
    });
    var panel = lekat('<div class="masa-jam"><small>Masa berlalu (dipercepat)</small><b>0 jam</b></div>' +
      rumah.map(function (r) {
        return '<div class="masa-baris" data-z="' + r.z + '"><span class="nama">' + ZON[r.z].nama + " · lease " + DHCP[r.z].lease +
          '</span><span class="trek"><s style="width:' + (JAM_LEASE[r.z] / 24 * 100) + '%"></s><i></i></span><span class="baki"></span></div>';
      }).join("") +
      '<div class="masa-paksi"><span>0</span><span>6</span><span>12</span><span>18</span><span>24 jam</span></div>', "masa-c", null, 0, null);
    panel.tetap = true;
    var elJam = panel.el.querySelector(".masa-jam b");
    var baris = rumah.map(function (r) {
      var e = panel.el.querySelector('[data-z="' + r.z + '"]');
      e.style.setProperty("--z", css(WARNA[r.z]));
      return { r: r, e: e, isi: e.querySelector("i"), baki: e.querySelector(".baki"), tamat: false };
    });
    /* Bar = baki lease pada paksi 24 jam; lease yang tamat menukar label rumah. */
    function pada(t) {
      if (tk !== jam.token()) return;
      elJam.textContent = Math.floor(t) + " jam";
      baris.forEach(function (b) {
        var L = JAM_LEASE[b.r.z], sisa = Math.max(0, L - t);
        b.isi.style.width = (sisa / 24 * 100) + "%";
        b.baki.textContent = sisa > 0 ? "baki " + Math.ceil(sisa) + " jam" : "tamat";
        if (!b.tamat && t >= L) {
          b.tamat = true;
          b.e.classList.add("tamat");
          b.r.l.el.className = "lencana-c lebar putih";
          b.r.l.el.textContent = "Lease tamat";
          kilatPeranti(b.r.p, WARNA[b.r.z]);
          bacaan("Selepas " + L + " jam: lease " + ZON[b.r.z].nama + " tamat · IP " + DHCP[b.r.z].contoh + " kembali ke pool jika tidak diperbaharui");
        }
      });
    }
    pada(0);
    bacaan("Student dan Guest menerima IP pada masa yang sama · jam dipercepat");
    return jam.tunggu(900).then(function () {
      if (tk !== jam.token()) return;
      return jam.tween(2600, function (q) { pada(q * 5); });
    }).then(function () {
      if (tk !== jam.token()) return;
      return jam.tunggu(1600);
    }).then(function () {
      if (tk !== jam.token()) return;
      return jam.tween(4200, function (q) { pada(5 + q * 19); });
    }).then(function () {
      if (tk !== jam.token()) return;
      return jam.tunggu(1400);
    }).then(function () {
      if (tk !== jam.token()) return;
      bacaan("Lease Guest 5 jam · lease Student 1 hari (24 jam)");
    });
  }

  /* ---------- Saiz ---------- */
  function ubahSaiz() {
    var w = bekas.clientWidth, h = bekas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  /* ---------- Fallback tanpa WebGL: lakaran pegun babak semasa ---------- */
  function lakarFallback(babak) {
    if (!babak || babak === babakLakar || !window.S01Lakaran) return;
    babakLakar = babak;
    var isi = bekas.querySelector(".tiada-gl-lakaran");
    isi.innerHTML = "";
    S01Lakaran.lukis(babak.toLowerCase(), isi);
  }

  /* ---------- API ---------- */
  var api = {
    init: function (b) {
      bekas = b;
      try {
        var uji = document.createElement("canvas");
        adaGL = !!(uji.getContext("webgl2") || uji.getContext("webgl"));
        if (adaGL) renderer = new T.WebGLRenderer({ antialias: true });
      } catch (e) { adaGL = false; }
      if (!adaGL) {
        bekas.innerHTML = '<div class="tiada-gl"><p>WebGL tidak tersedia pada pelayar ini. Lakaran pegun babak dipaparkan; teks langkah dan panel kekal.</p><div class="tiada-gl-lakaran"></div></div>';
        return;
      }
      renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = T.PCFSoftShadowMap;
      bekas.appendChild(renderer.domElement);
      bina();
      camera = new T.PerspectiveCamera(30, 1440 / 880, 10, 5000);
      controls = new T.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.minPolarAngle = 0.25; controls.maxPolarAngle = 1.2;
      controls.minDistance = 200; controls.maxDistance = 1800;
      controls.enablePan = false;
      renderer.domElement.addEventListener("dblclick", pandanganAsal);
      binaLabel();
      ubahSaiz();
      keKamera("kawasan", false);
      api.setKeadaan(keadaan, {});
      jam.setiapBingkai(function (dt, dijeda) {
        langkahKamera(dt, dijeda);
        controls.update();
        renderer.render(scene, camera);
        letakLabel();
      });
    },
    setKeadaan: function (k, o) {
      if (!adaGL) { if (bekas) lakarFallback(k.babak); return; }
      var animasi = !!(o && o.animasi), lama = keadaan;
      var ad = k.adegan || "kawasan", adeganBerubah = ad !== lama.adegan;
      var kunciKamera = ad === "rangkaian" && k.firewall ? "firewall" : ad, kameraBerubah = kunciKamera !== adeganKamera;
      var bahagiBerubah = k.bahagi !== lama.bahagi, warnaBerubah = k.warna !== lama.warna;
      keadaan = Object.assign({}, k, { adegan: ad, beban: k.beban || 15 });
      gKawasan.visible = ad !== "port";
      gRangkaian.visible = ad === "rangkaian";
      gPort.visible = ad === "port";
      if (kameraBerubah) keKamera(kunciKamera, animasi);
      if (warnaBerubah || !animasi) setWarna(keadaan.warna, animasi && !adeganBerubah);
      if (bahagiBerubah || !animasi) setBahagi(keadaan.bahagi, animasi && bahagiBerubah && !adeganBerubah);
      if (ad === "port") {
        vlanPort = PORT_ASAL.slice();
        vlanPort[PORT_PILIH] = keadaan.portVlan || 20;
        setPort();
      }
      setGerbang(!!keadaan.gateway || !!keadaan.dhcp, animasi && !adeganBerubah);
      pos.g.visible = !!keadaan.firewall;
      URUTAN.forEach(function (z) { kaunter[z].visible = !!keadaan.dhcp; });
      setPerantiBaru(!!keadaan.dhcp);
      tanpaDefault = false;
      if (lama.babak !== keadaan.babak || !animasi) paparFrame = false;
      teksLabel();
      if (beban) bacaan("Peranti: " + keadaan.beban + " · setiap pengumuman sampai ke " + (keadaan.beban - 1) + " peranti lain");
    },
    main: function (nama) {
      if (!adaGL) return Promise.resolve();
      if (nama === "frame") { paparFrame = !paparFrame; lukisBingkai(); return Promise.resolve(); }
      var tk = jam.token();
      return jam.tunggu(bakiKamera()).then(function () {
        if (tk !== jam.token()) return;
        if (nama === "unicast") return unicast();
        if (nama === "siaran") return siaran(false);
        if (nama === "siaran-zon") return siaran(true);
        if (nama === "beban") return mulaBeban();
        if (nama === "bahagi") { keadaan.bahagi = true; teksLabel(); return setBahagi(true, true); }
        if (nama === "port-hantar") return portHantar();
        if (/^port-\d+$/.test(nama)) return portTukar(+nama.slice(5));
        if (nama === "trunk") return trunk();
        if (nama === "ke-ltb") return keLtb();
        if (nama.indexOf("uji-") === 0) return uji(nama.slice(4));
        if (nama === "togol-default") return togolDefault();
        if (nama === "dhcp-30") return dhcp(30);
        if (nama === "dhcp-40") return dhcp(40);
        if (nama === "lease") return lease();
      });
    },
    henti: function () {
      if (!adaGL) return;
      jam.batal();
      beban = false;
      while (dinamik.children.length) buang(dinamik.children[0]);
      lekatan.slice().forEach(lepas);
      if (elPapan) bersihPapan();
      setLampu();
    },
    jeda: function (b) { jam.jeda(b); },
    setLabel: function (m) { labelMod = m; if (adaGL) teksLabel(); },
    ubahSaiz: function () { if (adaGL) ubahSaiz(); }
  };
  window.S01RenderC = api;
})();
