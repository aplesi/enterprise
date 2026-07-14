// app/rss.xml/route.ts
// RSS Feed — penting untuk subscriber & AI crawlers (Perplexity, dll)

import { NextResponse } from 'next/server'
import { getAllArtikel } from '@/lib/db/artikel'


const SITE_URL = 'https://www.aplesi.my.id'
const SITE_NAME = 'Aplesi — Portal Budidaya Ikan'
const SITE_DESC = 'Tips, tutorial, dan panduan lengkap budidaya ikan terlengkap di Indonesia'


export async function GET() {
  const artikelList = (await getAllArtikel()).slice(0, 50) // 50 artikel terbaru

  const rssItems = artikelList
    .map(
      (artikel) => `
    <item>
      <title><![CDATA[${artikel.judul}]]></title>
      <link>${SITE_URL}/artikel/${artikel.slug}</link>
      <guid isPermaLink="true">${SITE_URL}/artikel/${artikel.slug}</guid>
      <description><![CDATA[${artikel.ringkasan}]]></description>
      <pubDate>${new Date(artikel.tanggal).toUTCString()}</pubDate>
      <author>redaksi@aplesi.my.id (${artikel.penulis})</author>
      <category>${artikel.kategori}</category>
      ${artikel.tags.map((tag) => `<category>${tag}</category>`).join('\n      ')}
      ${artikel.gambar ? `<enclosure url="${artikel.gambar.startsWith('http') ? artikel.gambar : SITE_URL + artikel.gambar}" type="image/jpeg" length="0" />` : ''}
      <content:encoded><![CDATA[
        <img src="${artikel.gambar?.startsWith('http') ? artikel.gambar : SITE_URL + (artikel.gambar || '')}" alt="${artikel.judul}" />
        <p>${artikel.ringkasan}</p>
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
