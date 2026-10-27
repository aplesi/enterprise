// app/sitemap.ts
// Dynamic real-time sitemap.xml — terhubung langsung ke Cloudflare D1
// Mengindeks artikel edukasi, berita industri akuakultur, kategori, dan halaman statis

import type { MetadataRoute } from 'next'
import { getSitemapData } from '@/lib/db/artikel'
import { getBeritaSitemapData } from '@/lib/db/berita'
import { KATEGORI_LIST } from '@/config/kategori'

export const revalidate = 3600 // Auto-revalidate setiap 1 jam di Cloudflare Edge / Pages

const SITE_URL = 'https://www.aplesi.my.id'

const KATEGORI_SLUGS = KATEGORI_LIST.map((k) => k.slug)

function parseSafeDate(dateStr?: string): Date {
  if (!dateStr) return new Date()
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? new Date() : d
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Query paralel dari Cloudflare D1
  const [artikelList, beritaList] = await Promise.all([
    getSitemapData().catch((err) => {
      console.warn('[Sitemap] Gagal mengambil artikel dari D1:', err)
      return []
    }),
    getBeritaSitemapData(1000).catch((err) => {
      console.warn('[Sitemap] Gagal mengambil berita dari D1:', err)
      return []
    }),
  ])

  const now = new Date()

  // 1. Halaman statis inti
  const halamanStatis: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/artikel`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/news`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/produk`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    // Mandatory Pages untuk AdSense & Kepatuhan Legalitas
    {
      url: `${SITE_URL}/privacy-policy`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/disclaimer`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/kontak`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/tentang-kami`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]

  // 2. Halaman kategori budidaya
  const halamanKategori: MetadataRoute.Sitemap = KATEGORI_SLUGS.map((slug) => ({
    url: `${SITE_URL}/kategori/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  // 3. Halaman artikel panduan pilar edukasi (D1 `artikel` table)
  const halamanArtikel: MetadataRoute.Sitemap = artikelList.map((artikel) => ({
    url: `${SITE_URL}/artikel/${artikel.slug}`,
    lastModified: parseSafeDate(artikel.diperbarui || artikel.tanggal),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  // 4. Halaman berita industri akuakultur (D1 `berita` table)
  const halamanBerita: MetadataRoute.Sitemap = beritaList.map((berita) => ({
    url: `${SITE_URL}/news/${berita.slug}`,
    lastModified: parseSafeDate(berita.tanggal),
    changeFrequency: 'daily',
    priority: 0.7,
  }))

  return [...halamanStatis, ...halamanKategori, ...halamanArtikel, ...halamanBerita]
}
