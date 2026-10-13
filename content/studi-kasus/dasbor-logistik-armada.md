---
title: "Dasbor Logistik Armada"
slug: "dasbor-logistik-armada"
order: 2
ringkasan: "Dasbor pemantauan armada pengiriman yang menggantikan rekap manual harian."
peran: "Full-stack engineer"
tahun: 2023
stack: ["TypeScript", "Vue", "PostgreSQL", "Docker"]
metrik:
  - label: "Waktu rekap harian"
    nilai: "3 jam → 10 menit"
  - label: "Armada terpantau"
    nilai: "340 kendaraan"
  - label: "Ketepatan jadwal"
    nilai: "+12%"
---
## Latar belakang
Tim operasional Logistik Bahari (perusahaan fiktif) merekap posisi dan status kendaraan dari lembar kerja setiap pagi, memakan sekitar tiga jam.

## Pendekatan
Data posisi dan status digabung dalam satu basis data, ditampilkan di dasbor dengan filter per rute dan per sopir. Peringatan keterlambatan dihitung di sisi server dan tampil sebagai daftar prioritas.

## Hasil
Rekap harian yang dulu memakan separuh pagi kini selesai dalam sekejap untuk seluruh armada, dan ketepatan jadwal meningkat. Angka terukur ada pada ringkasan metrik di atas.

## Pelajaran
Daftar prioritas yang pendek lebih berguna bagi operator daripada peta yang penuh titik.
