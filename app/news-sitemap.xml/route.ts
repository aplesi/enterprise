// app/news-sitemap.xml/route.ts
// Dedicated Google News XML Sitemap — Standar Resmi Google Search Central
// xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"

import { NextResponse } from 'next/server'
import { getLatestBeritaForNewsSitemap } from '@/lib/db/berita'
import { query } from '@/lib/db/d1'

export const revalidate = 1800 // Revalidate setiap 30 menit

const SITE_URL = 'https://www.aplesi.my.id'
const PUBLICATION_NAME = 'APLESI Enterprise'
const LANGUAGE = 'id'

function escapeXml(unsafe: string): string {
  if (!unsafe) return ''
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function formatIsoDate(dateStr?: string): string {
  if (!dateStr) return new Date().toISOString()
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString()
}

export async function GET() {
  try {
    // 1. Ambil 100 berita industri terkini dari D1
    const beritaItems = await getLatestBeritaForNewsSitemap(100).catch((err) => {
      console.warn('[NewsSitemap] Gagal mengambil berita dari D1:', err)
      return []
    })

    // 2. Ambil artikel edukasi terkini yang baru dipublikasikan
    const { results: recentArtikel } = await query<{ slug: string; judul: string; tanggal: string }>(
      `SELECT slug, judul, tanggal FROM artikel WHERE status = 'published' ORDER BY tanggal DESC LIMIT 25`
    ).catch((err) => {
      console.warn('[NewsSitemap] Gagal mengambil artikel dari D1:', err)
      return { results: [] }
    })

    // Gabungkan list item berita dan artikel terbaru
    type NewsEntry = { loc: string; title: string; date: string }
    const entries: NewsEntry[] = [
      ...beritaItems.map((b) => ({
        loc: `${SITE_URL}/news/${b.slug}`,
        title: b.judul,
        date: formatIsoDate(b.tanggal),
      })),
      ...recentArtikel.map((a) => ({
        loc: `${SITE_URL}/artikel/${a.slug}`,
        title: a.judul,
        date: formatIsoDate(a.tanggal),
      })),
    ]

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${entries
  .map(
    (item) => `  <url>
    <loc>${item.loc}</loc>
    <news:news>
      <news:publication>
        <news:name>${escapeXml(PUBLICATION_NAME)}</news:name>
        <news:language>${LANGUAGE}</news:language>
      </news:publication>
      <news:publication_date>${item.date}</news:publication_date>
      <news:title>${escapeXml(item.title)}</news:title>
    </news:news>
  </url>`
  )
  .join('\n')}
</urlset>`

    return new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=1800, s-maxage=1800, stale-while-revalidate=86400',
      },
    })
  } catch (err: unknown) {
    console.error('[NewsSitemap] Error generating XML:', err)
    return new NextResponse('Error generating news sitemap', { status: 500 })
  }
}
