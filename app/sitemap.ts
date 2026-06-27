// app/sitemap.ts
// Auto-generate sitemap.xml — wajib untuk Google & AI crawlers

import type { MetadataRoute } from 'next'
import { getAllArtikel } from '@/lib/db/artikel'

const SITE_URL = 'https://www.aplesi.my.id'

const KATEGORI_SLUGS = [
  'pembenihan', 'pakan', 'penyakit', 'kolam',
  'panen', 'bisnis', 'tips', 'teknologi',
]

export default function sitemap(): MetadataRoute.Sitemap {
  const artikelList = getAllArtikel()

  // Halaman statis
  const halamanStatis: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/artikel`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/produk`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ]

  // Halaman kategori
  const halamanKategori: MetadataRoute.Sitemap = KATEGORI_SLUGS.map((slug) => ({
    url: `${SITE_URL}/kategori/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  // Halaman artikel
  const halamanArtikel: MetadataRoute.Sitemap = artikelList.map((artikel) => ({
    url: `${SITE_URL}/artikel/${artikel.slug}`,
    lastModified: new Date(artikel.diperbarui || artikel.tanggal),
    changeFrequency: 'monthly',
    priority: 0.8,
  }))

  return [...halamanStatis, ...halamanKategori, ...halamanArtikel]
}
