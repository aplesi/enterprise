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

  // Dedup berdasarkan id (hash dari link)
  const peta = new Map<string, BeritaItem>()
  for (const item of semua) {
    if (!peta.has(item.id)) peta.set(item.id, item)
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
    return {
      extId: item.id,
      judul: rewrite?.judul || item.judul,
      judulAsli: item.judul,
      ringkasan: rewrite?.ringkasan || item.ringkasan,
      ringkasanAsli: item.ringkasan,
      urlSumber: item.link,
      sumberId: item.sumberId,
      sumberNama: item.sumberNama,
      asal: item.asal as 'indonesia' | 'internasional',
      tanggal: item.tanggal,
      gambarUrl: item.imageUrl || '',
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
 * Proses gambar untuk berita baru — hybrid pipeline.
 * Dijalankan sebagai background task (tidak blocking response).
 *
 * Prioritas:
 * 1. Ada imageUrl dari RSS → download & simpan
 * 2. Tidak ada → generate via FLUX-1 dari judul
 */
async function prosesGambarBerita(
  items: BeritaItem[],
  rewriteMap: Record<string, { judul: string; ringkasan: string }>
): Promise<void> {
  // Proses max 5 berita per batch (hemat resource)
  const batch = items.slice(0, 5)

  for (const item of batch) {
    try {
      const judul = rewriteMap[item.id]?.judul || item.judul
      let gambarUrl = ''

      // Prioritas 1: Download gambar dari RSS
      if (item.imageUrl) {
        gambarUrl = await downloadDanSimpanGambar(item.imageUrl, item.id)
      }

      // Prioritas 2: Generate via FLUX-1 jika tidak ada gambar RSS
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
