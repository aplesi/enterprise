// lib/db/artikel.ts
// Baca artikel dari data JSON yang di-generate saat build (content/artikel-data.generated.json)
// dari file .md di folder content/artikel/.
//
// PENTING: file ini TIDAK boleh memanggil `fs` — harus tetap bisa jalan di Cloudflare
// edge runtime, yang tidak punya akses filesystem. Data sudah dibundel sebagai JSON
// oleh scripts/generate-artikel-data.mjs (dijalankan via `prebuild`).

import artikelData from '@/content/artikel-data.generated.json'
import type { Artikel } from '@/types'

const semuaArtikelMentah = artikelData as unknown as Artikel[]

export function getAllArtikel(): Artikel[] {
  return semuaArtikelMentah
    .filter((a) => a.status === 'published')
    .slice()
    .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
}

export function getArtikelTerbaru(n = 6): Artikel[] {
  return getAllArtikel().slice(0, n)
}

export function getArtikelBySlug(slug: string): Artikel | undefined {
  return semuaArtikelMentah.find((a) => a.slug === slug)
}

export function getArtikelByKategori(kategori: string): Artikel[] {
  return getAllArtikel().filter(
    (a) => a.kategori.toLowerCase() === kategori.toLowerCase()
  )
}

export function getAllSlugs(): string[] {
  return semuaArtikelMentah.map((a) => a.slug)
}
