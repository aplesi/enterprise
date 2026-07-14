// app/sitemap.ts
// Auto-generate sitemap.xml — wajib untuk Google & AI crawlers

import type { MetadataRoute } from 'next'
import { getAllArtikel } from '@/lib/db/artikel'
import { KATEGORI_LIST } from '@/config/kategori'

const SITE_URL = 'https://www.aplesi.my.id'

const KATEGORI_SLUGS = KATEGORI_LIST.map((k) => k.slug)

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const artikelList = await getAllArtikel()

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
      url: `${SITE_URL}/news`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.7,
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
