# Handoff REQ-20261013-portofolio-landing — Landing page portofolio software engineer fiktif (Dita Ayu Prameswari)

Dibuat: 2026-10-13 19:09 WIB oleh engineering-management (task t_f9bfe378, board engineering).
State: READY_FOR_MULTICA (belum dieksekusi). Status deploy: NOT DEPLOYED.
Batas: dokumen ini TIDAK membuat project/issue Multica, branch, build, atau deploy. Langkah Multica menunggu approval KEDUA owner.

## 1. Request ID + PRD yang disetujui

- Request ID: `REQ-20261013-portofolio-landing`
- Plane key: `PORTF-1`
- Jalur: BESAR (ditetapkan owner; `prd-workflow` §2a)
- PRD disetujui: `/opt/hermes/home/prd/REQ-20261013-portofolio-landing/PRD-v1.md`
  (20538 B, md5 `455c576ef828aa0d7f6b207b24412587`) — versi ini yang di-approve, tidak diubah.
- Catatan state: `/opt/hermes/home/prd/REQ-20261013-portofolio-landing/status.md`
- Catatan approval: `/opt/hermes/home/prd/REQ-20261013-portofolio-landing/approvals.md`

## 2. Versi PRD + approver + timestamp

- Versi: **PRD v1**
- Approver: **artrios** (via Hermes CLI, `--source artrios`, atas instruksi eksplisit owner raka)
- Kutipan persis raka (sesi artrios 2026-10-13): "approve PRD v1 REQ-20261013-portofolio-landing"
- Waktu keputusan diteruskan ke HQ: 2026-10-13 19:08 WIB (dicatat HQ di `reports/ops-feed.md`)
- Dicatat engineering-management: 2026-10-13 19:09 WIB (task t_f9bfe378)
- Approval terikat VERSI v1 (md5 `455c576ef828aa0d7f6b207b24412587`) saja. Perubahan material apa pun -> kembali ke OWNER_REVIEW. Approval PRD bukan approval langkah Multica.

## 3. Target repo + permissions yang diizinkan

- Repo sumber: `devmhk/portofolio-landing` (public, branch `master`, isi baru README).
- Fork target kerja squad: `rakarangga/portofolio-landing`.
- Project Multica: `portofolio-landing` (project BARU; issue induk BARU; Plane key `PORTF-1`).
- Izin yang diminta (setelah approval KEDUA): buat/ubah berkas HANYA di dalam fork, pada BRANCH saja.
- Tidak ada kredensial produksi. Tidak ada izin produksi.
- BATAS KERAS: tanpa merge, tanpa deploy, tanpa menyentuh repo/infra/project lain.

## 4. Scope, non-goals, acceptance criteria, risiko, dependencies

### Scope (PRD v1 bagian 9)
1. Landing page statis satu halaman dengan TEPAT 9 section, urut: (1) Hero, (2) Proof strip, (3) Studi kasus, (4) Keahlian, (5) Cara kerja, (6) Tulisan, (7) Testimoni, (8) Kontak, (9) Footer.
2. 3 kartu studi kasus fiktif -> 3 halaman detail `/studi-kasus/<slug>`, masing-masing punya jalan kembali ke halaman utama.
3. Transisi animasi per section saat scroll + penghormatan `prefers-reduced-motion`.
4. Satu tujuan CTA yang SAMA diulang 3x (Hero, blok setelah Studi kasus, Footer).
5. Mode light/dark (toggle), menghormati `prefers-color-scheme` awal.
6. Konten Markdown fiktif di repo (3 studi kasus minimal; item tulisan & testimoni).
7. Form kontak tampilan-saja (tanpa backend/email/penyimpanan).
8. Berkas `docker compose` menjalankan situs lokal di `127.0.0.1` (bind HANYA 127.0.0.1).
9. Acceptance criteria AC1–AC10 (bagian 12) + bukti pengujian.

### Non-goals (PRD v1 bagian 10) — eksplisit TIDAK dikerjakan
- Terminal mini; slider sebelum/sesudah.
- Backend/API, pengiriman email, penyimpanan data form.
- Data perusahaan nyata / data pribadi nyata / klaim faktual apa pun (semua isi fiktif).
- Halaman artikel terpisah untuk section "tulisan" (kecuali owner memutuskan lain; OQ4).
- Hosting/publikasi/domain/TLS/deploy (hanya lokal).
- CMS, analitik/tracker, komentar pengunjung, multi-bahasa.
- Perubahan pada repo/infra/project Multica lain.

### Acceptance criteria (PRD v1 bagian 12 — testable, bernomor)
- AC1. Build lulus tanpa error (exit code 0, tanpa error di log).
- AC2. Semua 9 section tampil di satu halaman, urutan sesuai brief (inspeksi DOM).
- AC3. Ketiga halaman detail `/studi-kasus/<slug>` dapat dibuka dari kartu dan kembali ke halaman utama (3 URL -> 200 + tautan kembali).
- AC4. Transisi per section berjalan saat scroll; dimatikan saat `prefers-reduced-motion: reduce`.
- AC5. Lighthouse mobile Performa >= 90 dan Aksesibilitas >= 90 (per halaman).
- AC6. Kontras teks >= 4.5:1 di light DAN dark.
- AC7. Semua link/tombol/form bisa dipakai dengan keyboard saja (fokus terlihat, tanpa jebakan fokus).
- AC8. Jalan lokal dengan `docker compose` di 127.0.0.1; port TIDAK terikat ke `0.0.0.0`.
- AC9. Tidak ada data perusahaan/pribadi nyata; seluruh isi fiktif dan konsisten.
- AC10. Mode light/dark keduanya dapat diaktifkan dan preferensi dikenali.

Ukuran sukses: UK1 (Lighthouse mobile Performa & Aksesibilitas >= 90 di halaman utama + 3 detail), UK2 (AC1–AC8 lulus dengan bukti), UK3 (kontras >= 4.5:1 di light & dark) — PRD bagian 1.

### Risiko (PRD v1 bagian 16) — level keseluruhan LOW
- R1 LOW: isi fiktif tidak sesuai harapan owner. Mitigasi: OQ5, review owner.
- R2 LOW: bahasa konten salah pilih -> rework teks. Mitigasi: OQ1.
- R3 LOW: Lighthouse mobile gagal >= 90. Mitigasi: JS/CSS minimal, 2 keluarga font, aset lokal, uji Lighthouse sebelum review.
- R4 LOW: animasi mengganggu aksesibilitas. Mitigasi: AC4 + AC7.
- R5 LOW: scope melebar (mis. halaman artikel "tulisan", terminal mini). Mitigasi: Non-goals bagian 10; penambahan scope -> PRD baru + OWNER_REVIEW.
- R6 LOW: port lokal terikat `0.0.0.0`. Mitigasi: C2 + AC8.
- R7 LOW: fork/akses repo belum siap menghambat handoff. Mitigasi: D3, langkah pertama PM `repo-access`.

### Dependencies (PRD v1 bagian 15)
- D1 SELESAI: approval owner PRD v1 (gate 1) — 2026-10-13 19:08 WIB.
- D2: approval owner LANGKAH MULTICA (gate 2) — BELUM.
- D3: fork `rakarangga/portofolio-landing` dari `devmhk/portofolio-landing` siap + akses squad (dibuat/disiapkan via skill `repo-access`; BUKAN oleh PRD ini).
- D4: project Multica `portofolio-landing` + squad Project Manager tersedia (dibuat pada langkah Multica setelah approval KEDUA).
- D5: konten fiktif disetujui owner (OQ5) — diterima apa adanya bersama approval PRD v1.

## 5. Cek/tes yang harus dijalankan + kriteria selesai

Jalankan dan catat bukti (perintah/output) untuk AC1–AC10 (bagian 4 di atas):
- Build: jalankan perintah build repo, catat exit code + log (AC1).
- DOM halaman utama: hitung & urutkan section (AC2).
- HTTP check 3 URL `/studi-kasus/<slug>` + tautan kembali (AC3).
- Uji 2 kondisi motion (normal vs `prefers-reduced-motion: reduce`) (AC4).
- Lighthouse mobile per halaman, catat skor Performa & Aksesibilitas (AC5).
- Cek kontras pasangan warna utama light & dark (AC6).
- Navigasi `Tab`/`Shift+Tab` menyeluruh (AC7).
- `docker compose up`, halaman terbuka di `127.0.0.1:<port>`, port tidak di `0.0.0.0` (AC8).
- Inspeksi teks fiktif/konsistensi (AC9) + toggle light/dark (AC10).

Kriteria selesai (PRD v1 bagian 19): AC1–AC8 lulus dengan bukti (AC9–AC10 bukti tambahan); 9 section urut + 3 detail dapat dibuka/kembali; `docker compose` jalan lokal di `127.0.0.1`; Lighthouse mobile >= 90; kontras >= 4.5:1; keyboard-only bersih; isi fiktif konsisten; tanpa terminal mini/slider; diserahkan sebagai laporan "siap review owner" dengan bukti uji; tanpa merge/deploy.

## 6. Batas

- Branch saja; TANPA merge, TANPA deploy, TANPA kredensial produksi.
- Hanya di dalam fork `rakarangga/portofolio-landing`; tidak menyentuh repo/infra/project lain.
- Situs hanya dijalankan lokal di `127.0.0.1`; jangan bind `0.0.0.0` (`org-operating-rules` §6).
- PM WAJIB meng-commit lampiran `PRD-v1.md` (disetujui artrios 2026-10-13 19:08 WIB) dan `handoff.md` apa adanya ke `docs/prd/REQ-20261013-portofolio-landing/` di branch integrasi sebelum PR di akhir.

## 7. Apa yang harus dikembalikan + reviewer berikutnya

- Yang dikembalikan: laporan "siap review owner" berisi bukti uji AC1–AC10 (perintah + output), daftar berkas yang dibuat, dan tautan PR/branch di fork. Tanpa merge/deploy.
- Reviewer berikutnya: **owner raka** (Telegram 5625664463) atau artrios via Hermes CLI (`--source artrios`). engineering-management TIDAK menyetujui merge/deploy.
- Pantauan progres: read-only, lewat job cron HQ (`multica-handoff` §7); notifikasi ke owner hanya lewat HQ.

---

## Langkah pertama Project Manager (wajib disebut di deskripsi issue induk)

- Langkah pertama: jalankan skill `repo-access` (HERM-35).
- Project BARU -> langkah 0 = scaffold (HERM-36).
- Bila squad/Project Manager BELUM ada di Multica: JANGAN membuat squad/agent sendiri; ini PRASYARAT TERBUKA — laporkan ke HQ dan tunggu.
