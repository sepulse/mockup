/* Pemetaan babak S01 ke bab dan slaid deck SSeM. Nombor slaid ialah kedudukan slaid (seperti PowerPoint, termasuk slaid tersembunyi) dalam
   SSeM-Pembentangan-WebFig.pptx (29 Okt 2026). Satu sumber untuk index, simulator dan pautan slaid → HTML kelak. */
var S01_SLAID = {
  deck: "SSeM-Pembentangan-WebFig.pptx",
  bab: {
    "01": { nama: "Interface, Bridge & VLAN", slaid: "6–16" },
    "02": { nama: "IP, DHCP & DNS", slaid: "17–23" },
    "04": { nama: "Firewall & Pengurusan", slaid: "37–49" }
  },
  babak: {
    B1: { bab: "01", slaid: [[7, "Video: apa itu VLAN?"]] },
    B2: { bab: "01", slaid: [[7, "Video: apa itu VLAN?"], [14, "Cari: senarai VLAN dalam router"]] },
    B3: { bab: "01", slaid: [[9, "Video: satu trunk, tujuh VLAN"], [11, "Tujuh VLAN, satu kabel trunk"]] },
    B4: { bab: "02", slaid: [[20, "Cari: gateway dan DNS yang diberi kepada Murid"]] },
    B5: { bab: "02", slaid: [[19, "DHCP VLAN 30: pool, server, network"], [20, "Cari: gateway dan DNS yang diberi kepada Murid"]] },
    B6: { bab: "04", slaid: [[39, "Dua pintu kawalan: INPUT dan FORWARD"], [40, "Video: rule pertama yang padan"], [42, "Rule disemak dari atas ke bawah"], [45, "Cari: rule yang menyekat Murid daripada Staf"]] }
  }
};
