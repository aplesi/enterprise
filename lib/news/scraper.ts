// lib/news/scraper.ts
// Ambil RSS dari semua sumber di lib/news/sources.ts secara paralel, parse,
// gabungkan, buang duplikat, filter relevansi kata kunci perikanan, lalu
// urutkan dari yang terbaru. Stateless -- tidak disimpan ke DB, cukup
// di-fetch ulang tiap kali admin buka halaman Berita (datanya memang
// selalu "live").

import { SUMBER_BERITA } from './sources'
import { parseRSSFeed } from './rss-parser'
import type { BeritaItem, NewsItem } from '@/types'

const KATA_KUNCI_RELEVAN = [
  'ikan', 'fish', 'perikanan', 'fisheries', 'akuakultur', 'aquaculture',
  'budidaya', 'nelayan', 'tambak', 'kolam', 'udang', 'shrimp', 'prawn',
  'lele', 'nila', 'tilapia', 'catfish', 'salmon', 'lobster', 'kepiting',
  'crab', 'kkp', 'seafood', 'pakan ikan', 'hatchery', 'pembenihan',
  'bioflok', 'karamba', 'mina', 'laut', 'marine', 'ekspor ikan', 'oyster',
  'kerang', 'rumput laut', 'seaweed', 'mangrove',
]

function relevan(judul: string, ringkasan: string): boolean {
  const teks = `${judul} ${ringkasan}`.toLowerCase()
  return KATA_KUNCI_RELEVAN.some((kw) => teks.includes(kw))
}

// ID stabil dari URL, dipakai untuk dedup & React key
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
        .filter((m) => relevan(m.judul, m.ringkasan))
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

// --- Wrapper untuk halaman /news & /api/news ---
// Alur: scrape RSS -> cek berita mana yang BELUM pernah di-rewrite (dari KV) ->
// rewrite (parafrase + auto-translate kalau internasional) HANYA untuk yang baru ->
// simpan hasil rewrite ke KV (persisten, lintas request/edge node) -> tampilkan.
// Ditambah cache in-memory 10 menit sebagai fast-path supaya tidak bolak-balik ke KV
// saat banyak pengunjung buka /news dalam waktu berdekatan.

import { kvGet, kvSet } from '@/lib/cloudflare/kv'
import { rewriteBeritaBatch } from '@/lib/ai/groq'

interface GetBeritaResult {
  data: NewsItem[]
  fromCache: boolean
  updatedAt: string
}

const CACHE_TTL_MS = 10 * 60 * 1000 // 10 menit, fast-path in-memory
const KV_KEY_REWRITE_MAP = 'berita:rewrite-map'

interface EntriRewrite {
  judul: string
  ringkasan: string
}

let cache: { data: NewsItem[]; updatedAt: string; fetchedAt: number } | null = null

function keBeritaItemKeNewsItem(item: BeritaItem, rewrite?: EntriRewrite): NewsItem {
  return {
    judul: rewrite?.judul || item.judul,
    ringkasan: rewrite?.ringkasan || item.ringkasan,
    url: item.link,
    sumber: item.sumberNama,
    tanggal: item.tanggal,
    kategori: item.asal === 'indonesia' ? 'nasional' : 'internasional',
  }
}

async function ambilPetaRewrite(): Promise<Record<string, EntriRewrite>> {
  try {
    const raw = await kvGet(KV_KEY_REWRITE_MAP)
    if (!raw) return {}
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

export async function getBeritaPerikanan(
  opts: { forceRefresh?: boolean } = {}
): Promise<GetBeritaResult> {
  const cacheMasihValid =
    cache !== null && Date.now() - cache.fetchedAt < CACHE_TTL_MS

  if (!opts.forceRefresh && cacheMasihValid && cache) {
    return { data: cache.data, fromCache: true, updatedAt: cache.updatedAt }
  }

  const { items } = await scrapeBeritaPerikanan()

  // Peta berita yang SUDAH pernah di-rewrite sebelumnya (persisten di KV)
  const petaRewrite = await ambilPetaRewrite()

  // Berita baru yang belum ada di peta -> perlu di-rewrite sekarang
  const beritaBaru = items.filter((item) => !petaRewrite[item.id])

  if (beritaBaru.length > 0) {
    try {
      const hasilRewrite = await rewriteBeritaBatch(beritaBaru)
      for (const r of hasilRewrite) {
        petaRewrite[r.id] = { judul: r.judul, ringkasan: r.ringkasan }
      }
    } catch {
      // Kalau Groq gagal total (rate limit/API down), berita baru tampil mentah
      // dulu (fallback di keBeritaItemKeNewsItem), akan dicoba rewrite lagi di
      // refresh berikutnya karena belum masuk petaRewrite.
    }
  }

  // Buang entri rewrite untuk berita yang sudah tidak muncul lagi di scrape
  // terbaru (sudah lewat/kadaluwarsa dari RSS), supaya peta tidak membengkak terus.
  const idAktif = new Set(items.map((i) => i.id))
  const petaTerpangkas: Record<string, EntriRewrite> = {}
  for (const id of Object.keys(petaRewrite)) {
    if (idAktif.has(id)) petaTerpangkas[id] = petaRewrite[id]
  }

  try {
    await kvSet(KV_KEY_REWRITE_MAP, JSON.stringify(petaTerpangkas))
  } catch {
    // Gagal simpan ke KV bukan masalah fatal -- rewrite akan diulang lagi
    // di request berikutnya (sedikit boros API call, tapi tetap tampil benar).
  }

  const data = items.map((item) => keBeritaItemKeNewsItem(item, petaTerpangkas[item.id]))
  const updatedAt = new Date().toISOString()

  cache = { data, updatedAt, fetchedAt: Date.now() }

  return { data, fromCache: false, updatedAt }
}
