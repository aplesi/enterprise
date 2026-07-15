// lib/news/rss-parser.ts
// Parser RSS/Atom ringan berbasis regex.
//
// PENTING: sengaja TIDAK pakai library XML/DOM (mis. xmldom, fast-xml-parser
// yang berat, atau DOMParser bawaan browser) karena harus tetap jalan di
// Cloudflare edge runtime tanpa dependency tambahan. Regex cukup untuk pola
// RSS 2.0 / Atom standar yang dipakai Google News, WordPress, dan Blogger.

export interface RSSItemMentah {
  judul: string
  link: string
  tanggal: string
  ringkasan: string
  imageUrl: string
}

function decodeEntities(str: string): string {
  return str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code: string) => {
      try {
        return String.fromCodePoint(Number(code))
      } catch {
        return ''
      }
    })
    .replace(/&amp;/g, '&')
}

function stripCdata(str: string): string {
  return str.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
}

function stripHtmlTags(str: string): string {
  return str.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function bersihkanTeks(raw: string): string {
  return decodeEntities(stripHtmlTags(stripCdata(raw))).trim()
}

function extractTag(block: string, tag: string): string {
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i')
  const m = block.match(re)
  return m ? m[1] : ''
}

function extractSelfClosingHref(block: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*\\shref=["']([^"']+)["'][^>]*/?>`, 'i')
  const m = block.match(re)
  return m ? m[1] : ''
}

function truncateRingkasan(text: string, max = 500): string {
  if (text.length <= max) return text
  return text.slice(0, max).trim() + '...'
}

/**
 * Extract URL gambar dari blok RSS/Atom.
 * Prioritas: media:content > media:thumbnail > enclosure > img di description
 */
function extractImageUrl(block: string): string {
  // 1. <media:content url="..."> atau <media:content medium="image" url="...">
  const mediaContent = block.match(
    /<media:content[^>]*\surl=["']([^"']+)["'][^>]*/i
  )
  if (mediaContent) return mediaContent[1]

  // 2. <media:thumbnail url="...">
  const mediaThumbnail = block.match(
    /<media:thumbnail[^>]*\surl=["']([^"']+)["'][^>]*/i
  )
  if (mediaThumbnail) return mediaThumbnail[1]

  // 3. <enclosure url="..." type="image/...">
  const enclosure = block.match(
    /<enclosure[^>]*\surl=["']([^"']+)["'][^>]*\stype=["']image\/[^"']+["'][^>]*/i
  )
  if (enclosure) return enclosure[1]

  // 4. <img src="..."> di dalam description/content
  const imgInContent = block.match(/<img[^>]*\ssrc=["']([^"']+)["'][^>]*/i)
  if (imgInContent) return imgInContent[1]

  return ''
}

/**
 * Parse feed RSS 2.0 (<item>) atau Atom (<entry>).
 * Google News, WordPress, dan Blogger (?alt=rss) semuanya format RSS 2.0.
 */
export function parseRSSFeed(xml: string): RSSItemMentah[] {
  const isAtom = /<feed[\s>]/i.test(xml) && !/<rss[\s>]/i.test(xml)
  const blockTag = isAtom ? 'entry' : 'item'
  const blockRe = new RegExp(`<${blockTag}[\\s>][\\s\\S]*?<\\/${blockTag}>`, 'gi')
  const blocks = xml.match(blockRe) || []

  const items: RSSItemMentah[] = []

  for (const block of blocks) {
    const judul = bersihkanTeks(extractTag(block, 'title'))
    if (!judul) continue

    let link = ''
    if (isAtom) {
      link = extractSelfClosingHref(block, 'link') || bersihkanTeks(extractTag(block, 'link'))
    } else {
      link = bersihkanTeks(extractTag(block, 'link'))
    }
    if (!link) continue

    const tanggalRaw =
      extractTag(block, 'pubDate') ||
      extractTag(block, 'published') ||
      extractTag(block, 'updated') ||
      extractTag(block, 'dc:date')
    const tanggalParsed = new Date(bersihkanTeks(tanggalRaw))
    const tanggal = isNaN(tanggalParsed.getTime())
      ? new Date().toISOString()
      : tanggalParsed.toISOString()

    const ringkasanRaw =
      extractTag(block, 'description') ||
      extractTag(block, 'summary') ||
      extractTag(block, 'content')
    const ringkasan = truncateRingkasan(bersihkanTeks(ringkasanRaw))

    const imageUrl = extractImageUrl(block)

    items.push({ judul, link, tanggal, ringkasan, imageUrl })
  }

  return items
}
