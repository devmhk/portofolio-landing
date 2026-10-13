// Tes QA WORK-28: cek AC3, AC4, AC7, AC10 di Chromium (binary dari image Playwright, tanpa dependensi baru).
// Driver CDP minimal: hanya Node built-in (WebSocket global). AC5 (Lighthouse) butuh dependensi baru: menunggu PM.
// Jalankan di Docker: docker compose -f compose.dev.yaml --profile test run --rm test node --test tests/browser.test.mjs
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { lookup } from 'node:dns/promises';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASE_URL = (process.env.BASE_URL ?? 'http://127.0.0.1:18130').replace(/\/$/, '');
// Diisi di before(): nama satu label (mis. app) dipaksa HTTPS oleh Chromium, jadi dipakai IP-nya.
let base = BASE_URL;
const CHROME = process.env.CHROME_PATH ?? '/ms-playwright/chromium-1248/chrome-linux64/chrome';
const REPORTS = join(root, 'reports');
const VIEW = { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Klien CDP: satu koneksi WebSocket ke browser, perintah per sesi halaman.
class Cdp {
  #id = 0;
  #pending = new Map();
  #listeners = new Set();
  constructor(ws) {
    this.ws = ws;
    ws.onmessage = ({ data }) => {
      const msg = JSON.parse(data);
      if (msg.id) {
        const p = this.#pending.get(msg.id);
        this.#pending.delete(msg.id);
        if (msg.error) p.reject(new Error(`${msg.error.message}: ${msg.error.data ?? ''}`));
        else p.resolve(msg.result);
      } else {
        for (const l of this.#listeners) l(msg);
      }
    };
  }
  send(method, params = {}, sessionId) {
    const id = ++this.#id;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    this.ws.send(JSON.stringify(payload));
    return new Promise((resolve, reject) => this.#pending.set(id, { resolve, reject }));
  }
  on(listener) {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }
}

class Page {
  constructor(cdp, sessionId) {
    this.cdp = cdp;
    this.sid = sessionId;
  }
  send(method, params) {
    return this.cdp.send(method, params, this.sid);
  }
  async eval(expression) {
    const r = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? 'evaluate gagal');
    return r.result.value;
  }
  // Menunggu event halaman (mis. Page.loadEventFired) sebelum/sesudah aksi.
  nextEvent(method, ms = 15000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        off();
        reject(new Error(`timeout menunggu ${method}`));
      }, ms);
      const off = this.cdp.on((msg) => {
        if (msg.sessionId === this.sid && msg.method === method) {
          clearTimeout(timer);
          off();
          resolve(msg.params);
        }
      });
    });
  }
  async goto(path) {
    const loaded = this.nextEvent('Page.loadEventFired');
    const r = await this.send('Page.navigate', { url: base + path });
    assert.equal(r.errorText, undefined, `navigasi ${path} gagal: ${r.errorText}`);
    await loaded;
    await this.eval('document.fonts.ready.then(() => true)');
  }
  // Klik dengan mouse sungguhan di tengah elemen (hit test ke DOM).
  async click(selector) {
    const pt = await this.eval(`(() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return null;
      el.scrollIntoView({ block: 'center', behavior: 'instant' });
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    })()`);
    assert.ok(pt, `elemen ${selector} tidak ditemukan`);
    const btn = { x: pt.x, y: pt.y, button: 'left', clickCount: 1 };
    await this.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: pt.x, y: pt.y });
    await this.send('Input.dispatchMouseEvent', { type: 'mousePressed', ...btn });
    await this.send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...btn });
  }
  async key(key, { code = key, keyCode = 0, text, modifiers = 0 } = {}) {
    const base = { key, code, windowsVirtualKeyCode: keyCode, nativeVirtualKeyCode: keyCode, modifiers };
    await this.send('Input.dispatchKeyEvent', { type: 'keyDown', ...base, ...(text ? { text } : {}) });
    await this.send('Input.dispatchKeyEvent', { type: 'keyUp', ...base });
  }
  tab({ shift = false } = {}) {
    return this.key('Tab', { keyCode: 9, modifiers: shift ? 8 : 0 });
  }
  async screenshot(file) {
    const { data } = await this.send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(join(REPORTS, file), Buffer.from(data, 'base64'));
  }
}

let browser;

before(async () => {
  mkdirSync(REPORTS, { recursive: true });
  const u = new URL(BASE_URL);
  if (!u.hostname.includes('.')) {
    u.hostname = (await lookup(u.hostname, { family: 4 })).address;
  }
  base = u.origin;
  const profile = mkdtempSync(join(tmpdir(), 'qa-chrome-'));
  const proc = spawn(
    CHROME,
    ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
      '--disable-features=HttpsUpgrades,HttpsFirstBalancedModeAutoEnable,HttpsFirstModeIncognito',
      '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'],
    { stdio: ['ignore', 'ignore', 'pipe'] },
  );
  const wsUrl = await new Promise((resolve, reject) => {
    let buf = '';
    const timer = setTimeout(() => reject(new Error('Chromium tidak siap dalam 20 detik')), 20000);
    proc.stderr.on('data', (d) => {
      buf += d;
      const m = buf.match(/DevTools listening on (ws:\/\/\S+)/);
      if (m) {
        clearTimeout(timer);
        resolve(m[1]);
      }
    });
    proc.on('exit', (code) => reject(new Error(`Chromium keluar dengan kode ${code}`)));
  });
  const ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => {
    ws.onopen = res;
    ws.onerror = () => rej(new Error('WebSocket CDP gagal'));
  });
  browser = { proc, cdp: new Cdp(ws) };
});

after(() => {
  browser?.cdp.ws.close();
  browser?.proc.kill();
});

// Satu konteks browser terpisah per halaman: localStorage tidak bocor antar tes.
async function openPage({ scheme = 'light', reduced = false, jsEnabled = true } = {}) {
  const { browserContextId } = await browser.cdp.send('Target.createBrowserContext');
  const { targetId } = await browser.cdp.send('Target.createTarget', { url: 'about:blank', browserContextId });
  const { sessionId } = await browser.cdp.send('Target.attachToTarget', { targetId, flatten: true });
  const page = new Page(browser.cdp, sessionId);
  await page.send('Page.enable');
  await page.send('Runtime.enable');
  await page.send('Emulation.setDeviceMetricsOverride', VIEW);
  await page.send('Emulation.setEmulatedMedia', {
    features: [
      { name: 'prefers-color-scheme', value: scheme },
      { name: 'prefers-reduced-motion', value: reduced ? 'reduce' : 'no-preference' },
    ],
  });
  if (!jsEnabled) await page.send('Emulation.setScriptExecutionDisabled', { value: true });
  return page;
}

// AC3: tiga kartu studi kasus bisa diklik ke detail, lalu kembali ke beranda lewat klik.
test('AC3: 3 kartu studi kasus dibuka lewat klik dan kembali ke beranda', async () => {
  const page = await openPage();
  await page.goto('/');
  const hrefs = await page.eval(
    `[...new Set([...document.querySelectorAll('a[href^="/studi-kasus/"]')].map((a) => a.getAttribute('href')))]`,
  );
  assert.equal(hrefs.length, 3, `kartu harus menaut 3 studi kasus unik, ditemukan ${hrefs.length}`);
  for (const href of hrefs) {
    await page.goto('/');
    const opened = page.nextEvent('Page.loadEventFired');
    await page.click(`a[href="${href}"]`);
    await opened;
    assert.equal(await page.eval('location.pathname'), href, `klik kartu tidak membuka ${href}`);
    const h1 = await page.eval(`document.querySelector('h1')?.textContent?.trim() ?? ''`);
    assert.ok(h1.length > 0, `${href}: h1 kosong`);
    const back = page.nextEvent('Page.loadEventFired');
    await page.click('a[href="/"]');
    await back;
    assert.equal(await page.eval('location.pathname'), '/', `${href}: tautan kembali tidak ke beranda`);
    assert.equal(await page.eval(`document.querySelectorAll('[data-section]').length`), 9);
  }
});

// AC10: toggle bekerja, tersimpan di localStorage, dan bertahan setelah reload.
test('AC10: toggle tema light/dark bekerja dan bertahan setelah reload', async () => {
  const page = await openPage({ scheme: 'light' });
  await page.goto('/');
  const state = () => page.eval(`({
    theme: document.documentElement.dataset.theme ?? null,
    pressed: document.querySelector('[data-theme-toggle]').getAttribute('aria-pressed'),
    bg: getComputedStyle(document.body).backgroundColor,
    stored: localStorage.getItem('theme'),
  })`);
  const s0 = await state();
  assert.equal(s0.theme, null, 'tanpa pilihan tersimpan, data-theme belum diset');
  assert.equal(s0.pressed, 'false');

  await page.click('[data-theme-toggle]');
  const s1 = await state();
  assert.equal(s1.theme, 'dark');
  assert.equal(s1.pressed, 'true');
  assert.equal(s1.stored, 'dark');
  assert.notEqual(s1.bg, s0.bg, 'warna latar tidak berubah setelah toggle');

  const reloaded = page.nextEvent('Page.loadEventFired');
  await page.send('Page.reload');
  await reloaded;
  const s2 = await state();
  assert.equal(s2.theme, 'dark', 'pilihan dark hilang setelah reload');
  assert.equal(s2.pressed, 'true');
  await page.screenshot('ac10-dark.png');

  await page.click('[data-theme-toggle]');
  const s3 = await state();
  assert.equal(s3.theme, 'light');
  assert.equal(s3.stored, 'light');
  await page.screenshot('ac10-light.png');
});

// AC10: tanpa pilihan tersimpan, tema awal mengikuti prefers-color-scheme.
test('AC10: tema awal mengikuti prefers-color-scheme: dark', async () => {
  const page = await openPage({ scheme: 'dark' });
  await page.goto('/');
  const r = await page.eval(`({
    theme: document.documentElement.dataset.theme ?? null,
    pressed: document.querySelector('[data-theme-toggle]').getAttribute('aria-pressed'),
    bg: getComputedStyle(document.body).backgroundColor,
  })`);
  assert.equal(r.theme, null);
  assert.equal(r.pressed, 'true', 'aria-pressed harus true saat sistem dark');
  const [R, G, B] = r.bg.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number);
  const luminance = (0.2126 * R + 0.7152 * G + 0.0722 * B) / 255;
  assert.ok(luminance < 0.3, `latar ${r.bg} tidak gelap`);
});

// AC4: motion normal. Elemen reveal tersembunyi sebelum scroll, lalu tampil dengan transisi.
test('AC4: motion normal: reveal muncul saat scroll dengan transisi', async () => {
  const page = await openPage({ reduced: false });
  await page.goto('/');
  const before = await page.eval(`(() => {
    const all = [...document.querySelectorAll('[data-reveal]')];
    const last = all.at(-1);
    return {
      total: all.length,
      hiddenBefore: all.filter((e) => !e.classList.contains('is-visible')).length,
      lastOpacity: getComputedStyle(last).opacity,
      duration: getComputedStyle(last).transitionDuration,
    };
  })()`);
  assert.ok(before.total > 0, 'tidak ada elemen reveal');
  assert.ok(before.hiddenBefore > 0, 'tidak ada elemen reveal tersembunyi sebelum scroll');
  assert.equal(before.lastOpacity, '0', 'elemen paling bawah seharusnya opacity 0 sebelum scroll');
  assert.match(before.duration, /0\.6s/, 'durasi transisi reveal tidak 0.6s');

  // Scroll bertahap seperti pengguna: elemen di tengah halaman hanya terlihat saat melewati viewport.
  const maxY = await page.eval('document.body.scrollHeight');
  for (let y = 0; y <= maxY; y += 300) {
    await page.eval(`window.scrollTo({ top: ${y}, behavior: 'instant' }) || true`);
    await sleep(120);
  }
  await sleep(1000);
  const after = await page.eval(`(() => {
    const all = [...document.querySelectorAll('[data-reveal]')];
    return {
      notVisible: all.filter((e) => !e.classList.contains('is-visible')).length,
      notOpaque: all.filter((e) => getComputedStyle(e).opacity !== '1').length,
    };
  })()`);
  assert.equal(after.notVisible, 0, 'masih ada elemen reveal yang belum tampil setelah scroll');
  assert.equal(after.notOpaque, 0, 'masih ada elemen reveal yang belum opacity 1');
});

// AC4: prefers-reduced-motion: reduce. Tanpa transisi dan konten langsung tampil.
test('AC4: reduced motion: tanpa transisi dan konten langsung tampil', async () => {
  const page = await openPage({ reduced: true });
  await page.goto('/');
  const r = await page.eval(`(() => {
    const all = [...document.querySelectorAll('[data-reveal]')];
    return {
      total: all.length,
      notVisible: all.filter((e) => !e.classList.contains('is-visible')).length,
      notOpaque: all.filter((e) => getComputedStyle(e).opacity !== '1').length,
      transitions: [...new Set(all.map((e) => getComputedStyle(e).transitionDuration))],
      transforms: [...new Set(all.map((e) => getComputedStyle(e).transform))],
    };
  })()`);
  assert.ok(r.total > 0, 'tidak ada elemen reveal');
  assert.equal(r.notVisible, 0);
  assert.equal(r.notOpaque, 0);
  assert.deepEqual(r.transitions, ['0s']);
  assert.deepEqual(r.transforms, ['none']);
});

// AC4 (pendukung): tanpa JS, konten tetap tampil (aturan sembunyi hanya aktif lewat .js).
test('AC4: tanpa JS, konten reveal tetap terlihat', async () => {
  const page = await openPage({ jsEnabled: false });
  await page.goto('/');
  const r = await page.eval(`(() => {
    const all = [...document.querySelectorAll('[data-reveal]')];
    return { total: all.length, notOpaque: all.filter((e) => getComputedStyle(e).opacity !== '1').length };
  })()`);
  assert.ok(r.total > 0, 'tidak ada elemen reveal');
  assert.equal(r.notOpaque, 0, 'ada konten reveal yang tersembunyi tanpa JS');
});

// AC7: Tab menelusuri semua elemen interaktif sesuai urutan DOM, fokus terlihat, tanpa jebakan.
test('AC7: Tab menelusuri semua elemen interaktif, fokus terlihat, tanpa jebakan', async () => {
  const page = await openPage();
  await page.goto('/');
  const elems = await page.eval(`(() => {
    const sel = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
    const els = [...document.querySelectorAll(sel)].filter((e) => e.getClientRects().length > 0);
    els.forEach((e, i) => e.setAttribute('data-qa-id', String(i)));
    return els.map((e, i) => ({
      id: String(i),
      label: (e.textContent || e.getAttribute('aria-label') || e.tagName).trim().replace(/\\s+/g, ' ').slice(0, 40),
    }));
  })()`);
  const total = elems.length;
  assert.ok(total > 0, 'tidak ada elemen interaktif');

  const focusState = `(() => {
    const a = document.activeElement;
    if (!a || a === document.body) return null;
    const cs = getComputedStyle(a);
    return { id: a.getAttribute('data-qa-id'), outlineStyle: cs.outlineStyle, outlineWidth: cs.outlineWidth, shadow: cs.boxShadow };
  })()`;

  const order = [];
  const unfocusable = [];
  for (let i = 0; i < total + 2; i++) {
    await page.tab();
    const st = await page.eval(focusState);
    if (!st) {
      order.push(null);
      break;
    }
    order.push(st.id);
    const visible = (st.outlineStyle !== 'none' && st.outlineWidth !== '0px') || st.shadow !== 'none';
    if (!visible) unfocusable.push(elems[Number(st.id)].label);
  }

  assert.equal(order.at(-1), null, `Tab tidak keluar dari halaman: kemungkinan jebakan fokus (${order.join(',')})`);
  const visited = order.filter((x) => x !== null);
  assert.deepEqual(visited, elems.map((e) => e.id), 'urutan Tab tidak sama dengan urutan DOM atau ada elemen terlewat');
  assert.deepEqual(unfocusable, [], `fokus tidak terlihat pada: ${unfocusable.join(', ')}`);
  assert.equal(elems[0].label, 'Lewati ke konten utama', 'Tab pertama harus skip link');

  // Shift+Tab: urutan mundur harus kebalikan urutan maju.
  const reverse = [];
  for (let i = 0; i < total + 2; i++) {
    await page.tab({ shift: true });
    const st = await page.eval(focusState);
    if (!st) break;
    reverse.push(st.id);
  }
  // Di batas dokumen headless, Shift+Tab membungkus ke elemen terakhir; cukup bandingkan satu putaran penuh.
  assert.deepEqual(reverse.slice(0, visited.length), [...visited].reverse(), 'Shift+Tab tidak menelusuri urutan mundur');
});

// AC7: skip link dan tombol form bisa diaktifkan dengan keyboard.
test('AC7: skip link dan form kontak bisa dipakai keyboard', async () => {
  const page = await openPage();
  await page.goto('/');
  await page.tab(); // skip link
  assert.equal(await page.eval(`document.activeElement.getAttribute('href')`), '#main');
  await page.key('Enter', { keyCode: 13, text: '\r' });
  assert.equal(await page.eval('location.hash'), '#main', 'Enter pada skip link tidak mengarah ke #main');

  await page.eval(`document.querySelector('#kontak input[type="text"]').focus() || true`);
  await page.send('Input.insertText', { text: 'Tes QA' });
  assert.equal(await page.eval(`document.querySelector('#kontak input[type="text"]').value`), 'Tes QA');

  await page.eval(`document.querySelector('#kontak .btn').focus() || true`);
  await page.key('Enter', { keyCode: 13, text: '\r' });
  const status = await page.eval(`document.querySelector('[data-form-status]').textContent.trim()`);
  assert.ok(status.length > 0, 'Enter pada tombol Kirim tidak memunculkan status');
});

// AC5: Lighthouse mobile belum bisa dijalankan: butuh dependensi baru (lighthouse), menunggu PM.
test('AC5: Lighthouse mobile Performa dan Aksesibilitas >= 90', { todo: 'butuh dependensi Lighthouse, menunggu PM' }, () => {});
