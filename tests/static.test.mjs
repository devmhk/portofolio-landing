// Tes QA WORK-25: cek AC dari PRD v1 yang bisa dijalankan tanpa browser.
// Jalankan di Docker (lihat tests/README.md). Tanpa dependensi: node:test + fetch bawaan.
// Cek yang butuh browser (keyboard, animasi saat scroll, Lighthouse) TIDAK ada di sini.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASE_URL = (process.env.BASE_URL ?? 'http://127.0.0.1:18130').replace(/\/$/, '');

const get = async (path) => {
  const res = await fetch(BASE_URL + path);
  return { status: res.status, body: await res.text() };
};

const home = await get('/');
const cssLinks = [...home.body.matchAll(/href="(\/_astro\/[^"]+\.css)"/g)];
const stylesheet = (await Promise.all(cssLinks.map((m) => get(m[1])))).map((r) => r.body).join('\n');

const studiDir = join(root, 'content', 'studi-kasus');
const cases = readdirSync(studiDir)
  .filter((f) => f.endsWith('.md'))
  .map((f) => {
    const text = readFileSync(join(studiDir, f), 'utf8');
    const front = text.split('---')[1];
    const slug = front.match(/^slug:\s*"([^"]+)"/m)[1];
    const metrik = [...front.matchAll(/label:\s*"([^"]+)"\s*\n\s*nilai:\s*"([^"]+)"/g)].map((m) => ({
      label: m[1],
      nilai: m[2],
    }));
    return { slug, metrik };
  });

// AC2: tepat 9 section, urutan sesuai brief.
test('AC2: halaman utama memuat 9 section berurutan', () => {
  const ids = [...home.body.matchAll(/data-section="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(ids, [
    'hero', 'bukti', 'studi-kasus', 'keahlian', 'cara-kerja',
    'tulisan', 'testimoni', 'kontak', 'footer',
  ]);
});

// AC3: 3 halaman detail 200, memuat h1, dan ada tautan kembali ke "/" yang berfungsi.
test('AC3: 3 halaman detail studi kasus dapat dibuka dan kembali ke beranda', async () => {
  const linked = [...new Set([...home.body.matchAll(/href="\/studi-kasus\/([^"]+)"/g)].map((m) => m[1]))];
  assert.equal(linked.length, 3, 'kartu harus menaut 3 studi kasus unik');
  assert.deepEqual(linked.sort(), cases.map((c) => c.slug).sort());
  for (const slug of linked) {
    const page = await get(`/studi-kasus/${slug}`);
    assert.equal(page.status, 200, `/studi-kasus/${slug} harus 200`);
    assert.match(page.body, /<h1[^>]*>[^<]+<\/h1>/, `${slug} harus punya h1`);
    assert.match(page.body, /href="\/"/, `${slug} harus punya tautan kembali ke /`);
  }
  assert.equal((await get('/')).status, 200);
});

// Metrik kartu/detail = frontmatter (issue WORK-25 cek konten).
test('konten: metrik tiap studi kasus tampil sama dengan frontmatter', async () => {
  for (const c of cases) {
    const page = await get(`/studi-kasus/${c.slug}`);
    for (const m of c.metrik) {
      assert.ok(page.body.includes(m.label), `${c.slug}: label "${m.label}" tidak ada`);
      assert.ok(page.body.includes(m.nilai), `${c.slug}: nilai "${m.nilai}" tidak ada`);
    }
  }
});

// AC9 (bagian otomatis): email dan URL di konten hanya domain fiktif (content-fiktif.md).
// Cek ini pola saja; kesesuaian isi tetap review manual owner.
test('AC9: email/URL di konten memakai domain fiktif', () => {
  const dirs = ['studi-kasus', 'testimoni', 'tulisan'].map((d) => join(root, 'content', d));
  const files = dirs.flatMap((d) => readdirSync(d).filter((f) => f.endsWith('.md')).map((f) => join(d, f)));
  const fictional = /^(example\.(com|org|net|id)|[^@/]+\.test)$/;
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    const hosts = [
      ...[...text.matchAll(/[\w.+-]+@([\w.-]+\.\w+)/g)].map((m) => m[1]),
      ...[...text.matchAll(/https?:\/\/([^/\s"')]+)/g)].map((m) => m[1]),
    ];
    for (const h of hosts) assert.match(h, fictional, `${file}: host "${h}" bukan fiktif`);
  }
});

// Kartu studi kasus dan CTA: satu tujuan (#kontak) diulang 3x (PRD C10).
test('CTA: tautan ke #kontak muncul minimal 3x di halaman utama', () => {
  const n = (home.body.match(/href="#kontak"/g) ?? []).length;
  assert.ok(n >= 3, `ditemukan ${n} tautan #kontak`);
});

// AC8 (bagian statis): halaman tidak memanggil host eksternal / CDN.
test('AC8/REQ: tidak ada sumber eksternal (CDN, pihak ketiga)', async () => {
  const pages = [home.body, (await get('/studi-kasus/' + cases[0].slug)).body];
  for (const html of pages) {
    const external = [...html.matchAll(/(?:src|href)="(https?:\/\/[^"]+)"/g)].map((m) => m[1]);
    const nonLocal = external.filter((u) => !/^https?:\/\/(127\.0\.0\.1|localhost)[:/]/.test(u));
    assert.deepEqual(nonLocal, []);
  }
});

// Skrip: hanya theme dan reveal (issue WORK-24 cek).
test('skrip: hanya dua bundle (theme dan reveal)', () => {
  const scripts = [...home.body.matchAll(/<script[^>]*>/g)].map((m) => m[0]);
  assert.equal(scripts.length, 2, `ditemukan ${scripts.length} tag script`);
});

// AC4 (statis): ada aturan prefers-reduced-motion yang mematikan transisi reveal.
test('AC4: aturan prefers-reduced-motion mematikan animasi reveal', () => {
  const block = stylesheet.match(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*?\}\s*\}/);
  assert.ok(block, 'blok @media prefers-reduced-motion tidak ditemukan');
  assert.match(block[0], /transition:\s*none/);
});

// Reveal tidak menyembunyikan konten tanpa JS: aturan opacity:0 harus dibatasi ke .js.
test('reveal: aturan sembunyi hanya berlaku saat kelas .js aktif', () => {
  const hiding = stylesheet
    .split('}')
    .filter((rule) => /data-reveal/.test(rule) && /opacity:\s*0/.test(rule));
  assert.ok(hiding.length > 0, 'aturan reveal tidak ditemukan');
  for (const rule of hiding) {
    assert.match(rule.trim(), /^\.js\s/, `aturan tanpa .js: ${rule.trim()}`);
  }
});

// AC7 (statis): skip link, target #main, fokus terlihat, setiap input punya label.
test('AC7: skip link, fokus terlihat, dan input berlabel (statis)', () => {
  assert.match(home.body, /<a[^>]*class="skip-link"[^>]*href="#main"/);
  assert.match(home.body, /id="main"/);
  assert.match(stylesheet, /:focus-visible\s*\{[^}]*outline/);
  const inputs = [...home.body.matchAll(/<(input|textarea)\b[^>]*>/g)].length;
  const labelled = [...home.body.matchAll(/<label>[\s\S]*?<(input|textarea)\b/g)].length;
  assert.ok(inputs > 0 && labelled === inputs, `input ${inputs}, berlabel ${labelled}`);
});

// Form tampilan saja: tanpa atribut name (tidak dikirim) dan region aria-live.
test('kontak: form tanpa atribut name dan region aria-live', () => {
  const form = home.body.match(/<form[\s\S]*?<\/form>/)?.[0] ?? '';
  assert.ok(form, 'form tidak ditemukan');
  assert.doesNotMatch(form, /\sname=/);
  assert.match(form, /aria-live=/);
});

// AC10 (statis): toggle tema dengan aria-pressed dan skrip tema.
test('AC10: toggle tema ada dengan aria-pressed', () => {
  assert.match(home.body, /data-theme-toggle[^>]*aria-pressed=/);
});

// AC6 (statis, hitung dari token): kontras teks >= 4.5:1 di light dan dark.
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (fg, bg, w) => fg.map((c, i) => w * c + (1 - w) * bg[i]);
const lum = (rgb) => {
  const [r, g, b] = rgb.map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const tokens = readFileSync(join(root, 'src', 'styles', 'tokens.css'), 'utf8');
const vars = (block) =>
  Object.fromEntries([...block.matchAll(/--([a-z-]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [m[1], hex(m[2])]));
const lightBlock = tokens.match(/:root,\s*:root\[data-theme='light'\]\s*\{([\s\S]*?)\}/)[1];
const darkBlock = tokens.match(/:root\[data-theme='dark'\]\s*\{([\s\S]*?)\}/)[1];
const modes = {
  light: { ...vars(lightBlock) },
  dark: { ...vars(lightBlock), ...vars(darkBlock) },
};
for (const [name, v] of Object.entries(modes)) {
  test(`AC6: kontras teks >= 4.5:1 (${name})`, () => {
    // --muted dan --surface memakai color-mix(fg/bg); dihitung ulang dengan nilai mode ini.
    const muted = mix(v.fg, v.bg, 0.72);
    const surface = mix(v.fg, v.bg, 0.05);
    const pairs = {
      'fg/bg': [v.fg, v.bg],
      'muted/bg': [muted, v.bg],
      'accent/bg': [v.accent, v.bg],
      'warm/bg': [v.warm, v.bg],
      'mint/bg': [v.mint, v.bg],
      'fg/surface': [v.fg, surface],
      'on-accent/accent': [v['on-accent'] ?? v.bg, v.accent],
    };
    for (const [label, [a, b]] of Object.entries(pairs)) {
      const r = ratio(a, b);
      assert.ok(r >= 4.5, `${name} ${label} = ${r.toFixed(2)}:1`);
    }
  });
}

// Proof strip: angka metrik harus berasal dari frontmatter studi-kasus (content-fiktif.md).
test('proof strip: angka metrik sama dengan frontmatter', () => {
  const strip = home.body.match(/<ul class="proof">[\s\S]*?<\/ul>/)?.[0] ?? '';
  const all = cases.flatMap((c) => c.metrik);
  for (const label of ['Toko aktif', 'Skor aksesibilitas']) {
    const m = all.find((x) => x.label === label);
    assert.ok(m && strip.includes(`<strong>${m.nilai}</strong>`), `proof strip tidak memuat ${label}`);
  }
});
