// lib/seo/index.ts — UPDATE dengan dynamic OG image & AI optimization

import type { Metadata } from 'next'
import type { Artikel } from '@/types'

const SITE_URL = process.env.SITE_URL || 'https://www.aplesi.my.id'
const SITE_NAME = 'Aplesi'

export function generateMetaArtikel(artikel: Artikel): Metadata {
  const url = `${SITE_URL}/artikel/${artikel.slug}`

  // Gunakan gambar generated jika ada, fallback ke dynamic OG
  const ogImage = artikel.gambar && artikel.gambar.startsWith('/')
    ? `${SITE_URL}${artikel.gambar}`
    : artikel.gambar || `${SITE_URL}/og?judul=${encodeURIComponent(artikel.judul)}&kategori=${encodeURIComponent(artikel.kategori)}&tanggal=${encodeURIComponent(artikel.tanggal)}`

  return {
    title: artikel.seoTitle || artikel.judul,
    description: artikel.seoDesc || artikel.ringkasan,
    keywords: artikel.tags.join(', '),
    authors: [{ name: artikel.penulis }],

    openGraph: {
      title: artikel.seoTitle || artikel.judul,
      description: artikel.seoDesc || artikel.ringkasan,
      url,
      siteName: SITE_NAME,
      images: [{ url: ogImage, width: 1200, height: 630, alt: artikel.judul }],
      type: 'article',
      publishedTime: new Date(artikel.tanggal).toISOString(),
      modifiedTime: artikel.diperbarui ? new Date(artikel.diperbarui).toISOString() : undefined,
      tags: artikel.tags,
      locale: 'id_ID',
    },

    twitter: {
      card: 'summary_large_image',
      title: artikel.seoTitle || artikel.judul,
      description: artikel.seoDesc || artikel.ringkasan,
      images: [ogImage],
    },

    alternates: {
      canonical: url,
      types: { 'application/rss+xml': `${SITE_URL}/rss.xml` },
    },

    robots: {
      index: artikel.status === 'published',
      follow: true,
      googleBot: { index: artikel.status === 'published', follow: true },
    },
  }
}

export function generateJsonLd(artikel: Artikel): string {
  const ogImage = artikel.gambar
    ? `${SITE_URL}${artikel.gambar.startsWith('/') ? '' : '/'}${artikel.gambar}`
    : `${SITE_URL}/og?judul=${encodeURIComponent(artikel.judul)}`

  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: artikel.judul,
    description: artikel.ringkasan,
    image: [ogImage],
    author: {
      '@type': 'Person',
      name: artikel.penulis,
      url: `${SITE_URL}/penulis/${artikel.penulis.toLowerCase().replace(/\s+/g, '-')}`,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/images/logo.png` },
    },
    datePublished: new Date(artikel.tanggal).toISOString(),
    dateModified: artikel.diperbarui
      ? new Date(artikel.diperbarui).toISOString()
      : new Date(artikel.tanggal).toISOString(),
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/artikel/${artikel.slug}` },
    keywords: artikel.tags.join(', '),
    articleSection: artikel.kategori,
    inLanguage: 'id-ID',
    about: {
      '@type': 'Thing',
      name: artikel.kategori,
      description: `Informasi tentang ${artikel.kategori} dalam budidaya ikan`,
    },
  })
}

export function generateSitemap(slugs: string[]): string {
  const urls = slugs.map(
    (slug) => `
  <url>
    <loc>${SITE_URL}/artikel/${slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
  )
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE_URL}</loc><changefreq>daily</changefreq><priority>1.0</priority></url>
  ${urls.join('')}
</urlset>`
}
