const root = document.documentElement;
const button = document.querySelector<HTMLButtonElement>('[data-theme-toggle]');

const current = () =>
  root.dataset.theme ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

if (button) {
  button.setAttribute('aria-pressed', String(current() === 'dark'));
  button.addEventListener('click', () => {
    const next = current() === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch {}
    button.setAttribute('aria-pressed', String(next === 'dark'));
  });
}
