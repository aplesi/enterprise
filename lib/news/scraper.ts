// lib/news/scraper.ts
// Sistem berita perikanan APLESI — sekarang menggunakan D1 sebagai sumber utama.
//
// ARSITEKTUR BARU:
//   Cron/Admin → scrape RSS → rewrite AI → INSERT ke D1
//   Pengunjung buka /news → SELECT dari D1 (instan, tanpa scrape live)
//
// Fungsi scrapeBeritaPerikanan() tetap dipertahankan untuk digunakan oleh
// cron script (simpan ke D1) dan sebagai fallback jika D1 kosong.

import { SUMBER_BERITA } from './sources'
import { parseRSSFeed } from './rss-parser'
import type { BeritaItem, NewsItem } from '@/types'
import { getBeritaTerbaru, insertBeritaBatch, countBerita, updateGambarUrl } from '@/lib/db/berita'
import { rewriteBeritaBatch } from '@/lib/ai/groq'
import { downloadDanSimpanGambar, generateGambarDanSimpan } from '@/lib/ai/cloudflare-image'
import { buildFallbackImagePrompt } from '@/lib/ai/groq'
import { slugify } from '@/lib/utils'

const KATA_KUNCI_ID = [
  'budidaya ikan indonesia', 'produksi perikanan nasional', 'ekspor udang',
  'ekspor ikan', 'kebijakan perikanan', 'kkp perikanan', 'harga ikan',
  'sertifikasi perikanan', 'bioflok budidaya', 'kesehatan ikan',
  'penyakit ikan', 'pakan ikan', 'benih ikan', 'budidaya lele',
  'budidaya nila', 'rumput laut', 'kerapu tambak', 'sidat ekspor',
  'iot perikanan', 'el nino perikanan', 'banjir tambak', 'karantina ikan',
  'mutu hasil perikanan', 'bantuan perikanan pemerintah',
]

const KATA_KUNCI_EN = [
  'ras aquaculture', 'recirculating aquaculture system', 'aquaponics',
  'biofloc technology', 'precision aquaculture', 'iot aquaculture',
  'smart fish farming', 'ai aquaculture', 'offshore aquaculture',
  'land-based fish farming', 'indoor fish farming', 'aquaculture feed',
  'fish feed', 'fishmeal alternative', 'insect meal fish',
  'plant-based fish feed', 'feed conversion ratio aquaculture',
  'microalgae fish feed', 'sustainable fish feed', 'soy aquaculture feed',
]

function relevan(judul: string, ringkasan: string, asal: string): boolean {
  const teks = `${judul} ${ringkasan}`.toLowerCase()
  const kataKunci = asal === 'en' ? KATA_KUNCI_EN : KATA_KUNCI_ID
  return kataKunci.some((kw) => teks.includes(kw))
}

function normalisasiJudul(judul: string): string {
  return (judul || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim()
}

function buatId(link: string): string {
  let hash = 0
  for (let i = 0; i < link.length; i++) {
    hash = (hash * 31 + link.charCodeAt(i)) | 0
  }
  return Math.abs(hash).toString(36)
}

export interface HasilScrape {
  items: BeritaItem[]
  sumberGagal: string[]
}

/**
 * Scrape RSS dari semua sumber secara paralel.
 * Dipanggil oleh cron script untuk mengisi D1, BUKAN oleh pengunjung /news.
 */
export async function scrapeBeritaPerikanan(): Promise<HasilScrape> {
  const sumberGagal: string[] = []

  const hasil = await Promise.allSettled(
    SUMBER_BERITA.map(async (sumber) => {
      const res = await fetch(sumber.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; AplesiNewsBot/1.0; +https://aplesi.my.id)',
          Accept: 'application/rss+xml, application/xml, text/xml, */*',
        },
        signal: AbortSignal.timeout(12000),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const xml = await res.text()
      const mentah = parseRSSFeed(xml)

      return mentah
        .filter((m) => relevan(m.judul, m.ringkasan, sumber.asal))
        .map(
          (m): BeritaItem => ({
            id: buatId(m.link),
            judul: m.judul,
            ringkasan: m.ringkasan,
            link: m.link,
            sumberId: sumber.id,
            sumberNama: sumber.nama,
            asal: sumber.asal,
            tanggal: m.tanggal,
            imageUrl: m.imageUrl || '',
          })
        )
    })
  )

  const semua: BeritaItem[] = []
  hasil.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      semua.push(...r.value)
    } else {
      sumberGagal.push(SUMBER_BERITA[i].nama)
    }
  })

  // Dedup cerdas: berdasarkan ID link dan normalisasi judul
  const peta = new Map<string, BeritaItem>()
  const setJudul = new Set<string>()
  for (const item of semua) {
    const norm = normalisasiJudul(item.judul)
    if (!norm || setJudul.has(norm)) continue
    if (!peta.has(item.id)) {
      setJudul.add(norm)
      peta.set(item.id, item)
    }
  }

  const items = Array.from(peta.values()).sort(
    (a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
  )

  return { items, sumberGagal }
}

/**
 * Scrape + rewrite + simpan ke D1.
 * Dijalankan oleh cron script secara periodik.
 *
 * Hybrid image pipeline:
 * - Ada imageUrl dari RSS? → download & simpan ke GitHub (0 AI call)
 * - Tidak ada imageUrl? → generate via FLUX-1 (2 AI call: Groq prompt + FLUX-1)
 */
export async function scrapeAndSaveToDB(): Promise<{ inserted: number; total: number }> {
  const { items } = await scrapeBeritaPerikanan()
  if (items.length === 0) return { inserted: 0, total: 0 }

  // Rewrite judul & ringkasan via Groq AI
  let rewriteMap: Record<string, { judul: string; ringkasan: string }> = {}
  try {
    const hasilRewrite = await rewriteBeritaBatch(items)
    for (const r of hasilRewrite) {
      rewriteMap[r.id] = { judul: r.judul, ringkasan: r.ringkasan }
    }
  } catch {
    // Fallback: simpan tanpa rewrite
  }

  // Simpan ke D1
  const dataInsert = items.map((item) => {
    const rewrite = rewriteMap[item.id]
    const cleanJudul = (rewrite?.judul || item.judul).replace(/\s*-\s*[^-]+$/, '').trim()
    const cleanSumber = (item.judul.match(/ - ([^-]+)$/)?.[1] || item.sumberNama || 'Redaksi Perikanan').trim()
    return {
      extId: item.id,
      judul: cleanJudul,
      judulAsli: item.judul,
      ringkasan: rewrite?.ringkasan || item.ringkasan,
      ringkasanAsli: item.ringkasan,
      urlSumber: item.link,
      sumberId: item.sumberId,
      sumberNama: cleanSumber,
      asal: item.asal as 'indonesia' | 'internasional',
      tanggal: item.tanggal,
      gambarUrl: item.imageUrl || '',
      slug: `${slugify(cleanJudul)}-${item.id}`,
    }
  })

  const inserted = await insertBeritaBatch(dataInsert)

  // Proses gambar untuk berita yang baru di-insert
  // Await supaya gambar pasti tersimpan sebelum selesai (penting untuk cron)
  try {
    await prosesGambarBerita(items, rewriteMap)
  } catch (err) {
    console.error('[News] Image processing failed:', err)
  }

  return { inserted, total: items.length }
}

/**
 * Direct decode base64 dari token Google News (CBMi...)
 */
function decodeCBMiDirect(token: string): string | null {
  try {
    const b64 = token.replace(/-/g, '+').replace(/_/g, '/')
    const pad = b64.length % 4
    const padded = pad ? b64 + '='.repeat(4 - pad) : b64
    const decoded = Buffer.from(padded, 'base64').toString('latin1')
    const urlMatch = decoded.match(/https?:\/\/[a-zA-Z0-9-._~:\/?#[\]@!$&'()*+,;=%]+/)
    if (urlMatch && !urlMatch[0].includes('google.com')) {
      return urlMatch[0]
    }
  } catch {}
  return null
}

/**
 * Decode URL Google News (news.google.com/rss/articles/...) menjadi URL penerbit asli.
 * Menggunakan direct Base64 decode atau Google Batchexecute RPC (Fbv4je).
 */
export async function resolveGoogleNewsUrl(googleUrl: string): Promise<string> {
  if (!googleUrl || !googleUrl.includes('news.google.com')) return googleUrl

  const match = googleUrl.match(/(?:articles|read)\/([^?&/]+)/)
  if (!match) return googleUrl
  const base64Str = match[1]

  // 1. Direct Base64 check (cepat, tanpa HTTP request)
  const direct = decodeCBMiDirect(base64Str)
  if (direct) return direct

  // 2. Fetch Google page untuk ambil signature (data-n-a-sg) & timestamp (data-n-a-ts)
  try {
    const pageUrl = `https://news.google.com/rss/articles/${base64Str}`
    const pageRes = await fetch(pageUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(6000),
    })

    if (!pageRes.ok) return googleUrl
    const html = await pageRes.text()

    const sg = html.match(/data-n-a-sg="([^"]+)"/)?.[1]
    const ts = html.match(/data-n-a-ts="([^"]+)"/)?.[1]
    if (!sg || !ts) return googleUrl

    // 3. Panggil batchexecute RPC (Fbv4je / garturlreq)
    const payload = [
      'Fbv4je',
      `["garturlreq",[["X","X",["X","X"],null,null,1,1,"US:en",null,1,null,null,null,null,null,0,1],"X","X",1,[1,1,1],1,1,null,0,0,null,0],"${base64Str}",${ts},"${sg}"]`,
    ]
    const reqData = `f.req=${encodeURIComponent(JSON.stringify([[payload]]))}`

    const rpcRes = await fetch('https://news.google.com/_/DotsSplashUi/data/batchexecute?rpcids=Fbv4je', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
      },
      body: reqData,
      signal: AbortSignal.timeout(6000),
    })

    if (!rpcRes.ok) return googleUrl
    const text = await rpcRes.text()
    const splitParts = text.split('\n\n')
    if (splitParts.length >= 2) {
      const parsedData = JSON.parse(splitParts[1])
      const row = parsedData.find(
        (d: unknown[]) => Array.isArray(d) && (d[0] === 'wrb.fr' || d[0] === 'w779db') && d[1] === 'Fbv4je'
      )
      if (row && row[2]) {
        const inner = JSON.parse(row[2])
        const decodedUrl = inner[1]
        if (decodedUrl && typeof decodedUrl === 'string' && decodedUrl.startsWith('http')) {
          return decodedUrl
        }
      }
    }
  } catch {
    // Fallback ke original url jika terjadi kegagalan
  }

  return googleUrl
}

export function resolveBingNewsUrl(bingUrl: string): string {
  try {
    const parsed = new URL(bingUrl)
    const target = parsed.searchParams.get('url')
    if (target) {
      return decodeURIComponent(target)
    }
  } catch {}
  return bingUrl
}

function isValidImageUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false
  if (!url.startsWith('http://') && !url.startsWith('https://')) return false
  if (url.includes('googleusercontent.com')) return false
  if (url.includes('w3.org') || url.includes('schema.org')) return false
  return true
}

/**
 * Scrape og:image / twitter:image dari halaman web artikel asli.
 * Otomatis mendecode Google News / Bing News token terlebih dahulu.
 */
export async function scrapeOgImage(pageUrl: string): Promise<string> {
  try {
    let targetUrl = pageUrl
    if (pageUrl.includes('news.google.com')) {
      targetUrl = await resolveGoogleNewsUrl(pageUrl)
    } else if (pageUrl.includes('bing.com/news/apiclick')) {
      targetUrl = resolveBingNewsUrl(pageUrl)
    }

    if (!targetUrl || targetUrl.includes('news.google.com')) return ''

    const res = await fetch(targetUrl, {
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) return ''
    const html = await res.text()

    // 1. og:image
    const ogMatch =
      html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i)
    if (ogMatch && isValidImageUrl(ogMatch[1])) return ogMatch[1].trim()

    // 2. twitter:image
    const twMatch =
      html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]*property=["']twitter:image["'][^>]*content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i)
    if (twMatch && isValidImageUrl(twMatch[1])) return twMatch[1].trim()

    // 3. link rel="image_src"
    const linkMatch = html.match(/<link[^>]*rel=["']image_src["'][^>]*href=["']([^"']+)["']/i)
    if (linkMatch && isValidImageUrl(linkMatch[1])) return linkMatch[1].trim()

    return ''
  } catch {
    return ''
  }
}

/**
 * Proses gambar untuk berita baru — hybrid pipeline.
 * Dijalankan sebagai background task (tidak blocking response).
 *
 * Prioritas:
 * 1. Ada imageUrl dari RSS → gunakan
 * 2. Scrape og:image dari situs asli
 * 3. Generate via FLUX-1 dari judul
 */
async function prosesGambarBerita(
  items: BeritaItem[],
  rewriteMap: Record<string, { judul: string; ringkasan: string }>
): Promise<void> {
  const batch = items.slice(0, 10)

  for (const item of batch) {
    try {
      const judul = rewriteMap[item.id]?.judul || item.judul
      let gambarUrl = item.imageUrl || ''

      // Prioritas 1: Download gambar dari RSS jika valid
      if (item.imageUrl) {
        gambarUrl = await downloadDanSimpanGambar(item.imageUrl, item.id)
      }

      // Prioritas 2: Scrape og:image dari situs asli jika RSS tidak ada gambar
      if (!gambarUrl) {
        gambarUrl = await scrapeOgImage(item.link)
      }

      // Prioritas 3: Generate via FLUX-1 jika og:image juga nihil
      if (!gambarUrl) {
        const prompt = buildFallbackImagePrompt(judul, 'berita')
        gambarUrl = await generateGambarDanSimpan(prompt, `news-${item.id}`)
      }

      // Update D1 dengan URL gambar
      if (gambarUrl) {
        await updateGambarUrl(item.id, gambarUrl)
        console.log(`[News] Gambar disimpan untuk "${judul.slice(0, 40)}...": ${gambarUrl}`)
      }
    } catch (err) {
      console.warn(`[News] Gagal proses gambar untuk "${item.judul.slice(0, 40)}...":`, err)
    }
  }
}

// --- Wrapper untuk halaman /news & /api/news ---
// Sekarang baca dari D1. Jika D1 kosong (pertama kali), fallback ke live scrape.

interface GetBeritaResult {
  data: NewsItem[]
  fromCache: boolean
  updatedAt: string
}

export async function getBeritaPerikanan(
  opts: { forceRefresh?: boolean } = {}
): Promise<GetBeritaResult> {
  // Coba baca dari D1 dulu
  const jumlahD1 = await countBerita()

  if (jumlahD1 > 0 && !opts.forceRefresh) {
    // Data ada di D1, langsung serve
    const data = await getBeritaTerbaru(50)
    return {
      data,
      fromCache: true,
      updatedAt: new Date().toISOString(),
    }
  }

  // D1 kosong atau force refresh → scrape + simpan ke D1
  try {
    await scrapeAndSaveToDB()
  } catch (err) {
    console.error('[News] Gagal scrape & save:', err)
  }

  // Baca hasil dari D1
  const data = await getBeritaTerbaru(50)
  return {
    data,
    fromCache: false,
    updatedAt: new Date().toISOString(),
  }
}
