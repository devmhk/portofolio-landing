# Tes

Status: `npm test` = `node --test tests/static.test.mjs` (cek statis tanpa browser: AC2, AC3, AC4, AC6, AC7, AC8, AC9, AC10; butuh `BASE_URL`, diisi service `test`). `tests/browser.test.mjs` (WORK-28) menjalankan Chromium dari image Playwright lewat CDP tanpa dependensi baru: AC3 (klik kartu → detail → kembali), AC4 (motion normal, reduced, tanpa JS), AC7 (Tab/Shift+Tab, fokus terlihat, skip link, form), AC10 (toggle, persist, prefers-color-scheme). AC5 (Lighthouse) dan AC6 (axe) belum ada: butuh dependensi baru, menunggu PM. Jalankan lewat Docker: `docker compose -f compose.dev.yaml --profile test run --build --rm test` (static) dan `docker compose -f compose.dev.yaml --profile test run --build --rm test node --test tests/browser.test.mjs` (browser). Laporan dan screenshot di `reports/` (gitignored).

| AC | Alat | Perintah / bukti |
|---|---|---|
| AC1 build sukses | Docker | `docker compose -f compose.dev.yaml build app; echo $?` = 0 |
| AC2 9 section berurutan | Playwright | `[data-section]` tepat 9, urutan id sesuai AGENTS.md |
| AC3 3 halaman detail + navigasi | Chromium (CDP) | `tests/browser.test.mjs`: klik kartu → detail (h1) → klik "Kembali" |
| AC4 animasi + reduced motion | Chromium (CDP) | `tests/browser.test.mjs`: scroll bertahap (normal) dan `prefers-reduced-motion: reduce` |
| AC5 Lighthouse ≥ 90 | `tests/lighthouse.mjs` (belum ada) | 4 URL, median 3 run, performance + accessibility; menunggu PM (dependensi baru) |
| AC6 kontras AA | `@axe-core/playwright` | `color-contrast`, 4 halaman × light/dark |
| AC7 keyboard | Chromium (CDP) | `tests/browser.test.mjs`: Tab melewati semua elemen interaktif, fokus terlihat, tanpa jebakan, Shift+Tab mundur |
| AC8 localhost-only | docker CLI | `docker compose -f compose.dev.yaml port app 8080` = `127.0.0.1:18130`; `ss -ltn \| grep 18130`; `curl -sI http://127.0.0.1:18130/` = 200 |
| AC9 konten fiktif | `tests/content-check.mjs` + review owner | grep pola terlarang; daftar entitas fiktif dicatat di sini saat konten ditulis |
| AC10 tema | Chromium (CDP) | `tests/browser.test.mjs`: `prefers-color-scheme: dark`, toggle, persist setelah reload |

Catatan: Chromium di image test memaksa HTTPS untuk nama satu label (`app`), jadi `browser.test.mjs` memakai IP kontainer dari `BASE_URL`.

Manual (owner/Dev1): kesan visual dan animasi; lihat `reports/ac10-light.png` dan `reports/ac10-dark.png`.
