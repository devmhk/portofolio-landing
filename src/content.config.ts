import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const studiKasus = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/studi-kasus' }),
  schema: z.object({
    title: z.string(),
    slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
    order: z.number().int().min(1).max(3),
    ringkasan: z.string(),
    peran: z.string(),
    tahun: z.number().int(),
    stack: z.array(z.string()),
    metrik: z.array(z.object({ label: z.string(), nilai: z.string() })),
  }),
});

const tulisan = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/tulisan' }),
  schema: z.object({
    title: z.string(),
    tanggal: z.coerce.date(),
    ringkasan: z.string(),
  }),
});

const testimoni = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/testimoni' }),
  schema: z.object({
    nama: z.string(),
    peran: z.string(),
    organisasi: z.string(),
  }),
});

export const collections = { 'studi-kasus': studiKasus, tulisan, testimoni };
