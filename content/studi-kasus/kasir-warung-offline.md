---
title: "Kasir Warung Offline"
slug: "kasir-warung-offline"
order: 1
ringkasan: "Aplikasi kasir untuk warung dengan sinyal tidak stabil, tetap bisa mencatat transaksi tanpa internet."
peran: "Lead engineer"
tahun: 2024
stack: ["TypeScript", "React", "IndexedDB", "Node.js"]
metrik:
  - label: "Waktu input transaksi"
    nilai: "-38%"
  - label: "Toko aktif"
    nilai: "1.200"
  - label: "Transaksi gagal tersimpan"
    nilai: "0,3%"
---
## Latar belakang
Pemilik warung kecil kehilangan catatan penjualan saat sinyal hilang. Tim Warung Nusa (perusahaan fiktif) meminta kasir yang tetap berjalan tanpa jaringan.

## Pendekatan
Transaksi disimpan lebih dulu di perangkat (IndexedDB), lalu disinkronkan di latar belakang dengan antrean yang aman diulang. Konflik diselesaikan dengan aturan sederhana: catatan terbaru per transaksi menang.

## Hasil
Waktu input transaksi turun setelah alur layar dipangkas menjadi tiga ketukan. Di seluruh toko aktif, hanya sebagian kecil transaksi yang gagal tersimpan. Angka terukur ada pada ringkasan metrik di atas.

## Pelajaran
Mulai dari kondisi terburuk (tanpa sinyal) membuat desain sinkronisasi lebih sederhana daripada menambalnya belakangan.
