# portofolio-landing

Landing page statis portofolio software engineer fiktif (Dita Ayu Prameswari). Konten Markdown → Astro → `dist/` → nginx di Docker. Tanpa backend, database, atau layanan eksternal. Semua konten fiktif.

PRD dan handoff: `docs/prd/REQ-20261013-portofolio-landing/`. Arsitektur: `docs/architecture.md`.

## Stack
- Astro `^7.3.8` (`output: 'static'`, `build.format: 'file'`), dikunci `package-lock.json`.
- Build: `node:24-alpine`. Penyaji: `nginxinc/nginx-unprivileged:1.28-alpine`, port container 8080.
- Tes: `node:test` (`tests/static.test.mjs`) lewat target `test` di `.docker/Dockerfile`; Playwright + axe-core + Lighthouse belum ada (sub-issue berikutnya).
- Toolchain tidak dipasang di host; semua lewat Docker.

## Run
Port host: **127.0.0.1:18130** (dicek bebas dengan `ss -ltn` pada 2026-10-13; PRD A7 memakai 8080 tetapi aturan `docker-runtime` melarangnya).
```
docker compose -f compose.dev.yaml up -d --build      # buka http://127.0.0.1:18130
docker compose -f compose.dev.yaml --profile test run --rm test
docker compose -f compose.dev.yaml down
```

## Test
Lihat `tests/README.md` (tabel AC1-AC10 → alat → perintah). `npm test` = `node --test tests/static.test.mjs` (butuh `BASE_URL`; service `test` mengisinya ke `http://app:8080`).

## Layout
`content/` (Markdown per koleksi), `src/` (layouts, pages, components, data, styles), `public/`, `.docker/`, `tests/`, `docs/`. Rincian di `docs/architecture.md`.

## Konvensi
- Teks UI Bahasa Indonesia (`lang="id"`), slug kebab-case ASCII.
- Semua nama, perusahaan, email, dan angka fiktif; konsisten dari frontmatter.
- Sembilan section ber-`id` + `data-section`: hero, bukti, studi-kasus, keahlian, cara-kerja, tulisan, testimoni, kontak, footer.

## Batas
- Kerja di branch `agent/<agent>/<issue>`; tanpa push ke master/main, tanpa merge ke master/main, tanpa deploy, tanpa kredensial production.
- Non-goals: terminal mini, slider, backend, halaman artikel, analitik, deploy (lihat `.claude/rules/scope.md`).
- Aturan: `.claude/rules/`.
