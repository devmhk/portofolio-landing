# Tes

Status: belum ada tes otomatis; `npm test` masih placeholder. Tabel di bawah adalah rencana dari `docs/architecture.md` (diimplementasikan sub-issue berikutnya). Jalankan lewat Docker: `docker compose -f compose.dev.yaml --profile test run --rm test`. Laporan di `reports/` (gitignored).

| AC | Alat | Perintah / bukti |
|---|---|---|
| AC1 build sukses | Docker | `docker compose -f compose.dev.yaml build app; echo $?` = 0 |
| AC2 9 section berurutan | Playwright | `[data-section]` tepat 9, urutan id sesuai AGENTS.md |
| AC3 3 halaman detail + navigasi | Playwright | `/studi-kasus/<slug>` 200 dan ada `h1`; kartu → detail → "Kembali" |
| AC4 animasi + reduced motion | Playwright | konteks normal dan `reducedMotion: 'reduce'` |
| AC5 Lighthouse ≥ 90 | `tests/lighthouse.mjs` | 4 URL, median 3 run, performance + accessibility |
| AC6 kontras AA | `@axe-core/playwright` | `color-contrast`, 4 halaman × light/dark |
| AC7 keyboard | Playwright | Tab melewati semua elemen interaktif, fokus terlihat, tanpa jebakan |
| AC8 localhost-only | docker CLI | `docker compose -f compose.dev.yaml port app 8080` = `127.0.0.1:18130`; `ss -ltn \| grep 18130`; `curl -sI http://127.0.0.1:18130/` = 200 |
| AC9 konten fiktif | `tests/content-check.mjs` + review owner | grep pola terlarang; daftar entitas fiktif dicatat di sini saat konten ditulis |
| AC10 tema | Playwright | `colorScheme: 'dark'`, toggle, persist setelah reload |

Manual (owner/Dev1): kesan visual dan animasi.
