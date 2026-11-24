// app/rss.xml/route.ts
// RSS Feed — penting untuk subscriber & AI crawlers (Perplexity, dll)

import { NextResponse } from 'next/server'
import { getRssData } from '@/lib/db/artikel'

const SITE_URL = 'https://aplesi.my.id'
const SITE_NAME = 'Aplesi — Portal Budidaya Ikan'
const SITE_DESC = 'Tips, tutorial, dan panduan lengkap budidaya ikan terlengkap di Indonesia'

function escapeXmlAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function escapeCdata(str: string): string {
  return str.replace(/]]>/g, ']]]]><![CDATA[>')
}

function parseSafeDate(dateStr?: string): Date {
  if (!dateStr) return new Date()
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? new Date() : d
}

export async function GET() {
  const artikelList = await getRssData() // 50 artikel terbaru

  const rssItems = artikelList
    .map(
      (artikel) => `
    <item>
      <title><![CDATA[${escapeCdata(artikel.judul || '')}]]></title>
      <link>${SITE_URL}/artikel/${artikel.slug}</link>
      <guid isPermaLink="true">${SITE_URL}/artikel/${artikel.slug}</guid>
      <description><![CDATA[${escapeCdata(artikel.ringkasan || '')}]]></description>
      <pubDate>${parseSafeDate(artikel.tanggal).toUTCString()}</pubDate>
      <author>redaksi@aplesi.my.id (${escapeCdata(artikel.penulis || 'Tim Redaksi APLESI')})</author>
      <category><![CDATA[${escapeCdata(artikel.kategori || '')}]]></category>
      ${(artikel.tags || []).map((tag) => `<category><![CDATA[${escapeCdata(tag)}]]></category>`).join('\n      ')}
      ${artikel.gambar ? `<enclosure url="${escapeXmlAttr(artikel.gambar.startsWith('http') ? artikel.gambar : SITE_URL + artikel.gambar)}" type="image/jpeg" length="0" />` : ''}
      <content:encoded><![CDATA[
        <img src="${escapeXmlAttr(artikel.gambar?.startsWith('http') ? artikel.gambar : SITE_URL + (artikel.gambar || ''))}" alt="${escapeXmlAttr(artikel.judul || '')}" />
        <p>${artikel.ringkasan || ''}</p>
        <p><a href="${SITE_URL}/artikel/${artikel.slug}">Baca artikel lengkap →</a></p>
      ]]></content:encoded>
    </item>`
    )
    .join('')

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${SITE_NAME}</title>
    <link>${SITE_URL}</link>
    <description>${SITE_DESC}</description>
    <language>id-ID</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <managingEditor>redaksi@aplesi.my.id (Tim Aplesi)</managingEditor>
    <webMaster>webmaster@aplesi.my.id</webMaster>
    <image>
      <url>${SITE_URL}/images/logo.png</url>
      <title>${SITE_NAME}</title>
      <link>${SITE_URL}</link>
    </image>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    ${rssItems}
  </channel>
</rss>`

  return new NextResponse(rss, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
