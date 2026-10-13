export const persona = {
  nama: 'Dita Ayu Prameswari',
  peran: 'Software Engineer',
  tagline: 'Membangun perangkat lunak yang sederhana, cepat, dan bisa dipakai semua orang.',
  email: 'dita@example.com',
};

export const cta = { label: 'Ajak bicara proyekmu', href: '#kontak' };

export const pengalaman = '6 tahun';

// Metrik proof strip dibaca dari frontmatter koleksi studi-kasus (content-fiktif.md): [label metrik, label tampilan].
export const proofMetrik: [string, string][] = [
  ['Toko aktif', 'toko memakai kasir buatan saya'],
  ['Skor aksesibilitas', 'skor aksesibilitas tertinggi'],
];

export const keahlian = [
  { kelompok: 'Frontend', item: ['TypeScript', 'React', 'Vue', 'Astro', 'Aksesibilitas'] },
  { kelompok: 'Backend', item: ['Node.js', 'PostgreSQL', 'REST API'] },
  { kelompok: 'Praktik', item: ['Docker', 'Playwright', 'Code review', 'Dokumentasi'] },
];

export const caraKerja = [
  { judul: 'Pahami', isi: 'Mulai dari masalah pengguna dan batasan nyata, bukan daftar fitur.' },
  { judul: 'Bangun kecil', isi: 'Kirim potongan kecil yang bisa diuji dan dilihat pemangku kepentingan.' },
  { judul: 'Ukur', isi: 'Tetapkan metrik sejak awal dan laporkan apa adanya.' },
  { judul: 'Serahkan', isi: 'Dokumentasi dan tes ikut diserahkan agar tim bisa melanjutkan.' },
];
