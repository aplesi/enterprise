// scripts/generate-berita-artikel.mjs
// Dijalankan oleh GitHub Actions tiap 3 jam (.github/workflows/generate-berita.yml).
//
// Alur: scrape RSS -> cek registry KV (berita yg SUDAH pernah dijadikan
// artikel) -> untuk berita baru (maks MAKS_ARTIKEL_PER_SIKLUS/siklus),
// generate recap 800-1200 kata via Groq -> simpan .md baru di
// content/artikel/ (kategori "Berita Terkini") -> workflow yang commit+push
// (bukan script ini -- pola sama seperti scripts/auto-post.mjs).
//
// CATATAN: sengaja TIDAK import lib/*.ts -- Node ESM plain tidak bisa
// menjalankan TypeScript langsung tanpa loader (proyek ini tidak pakai
// ts-node/tsx). Logika RSS scraping & KV di bawah adalah duplikat ringkas
// dari lib/news/{sources,rss-parser,scraper}.ts dan lib/cloudflare/kv.ts,
// konsisten dengan pola auto-post.mjs yang juga tidak reuse lib/ai/groq.ts.
// Kalau salah satu sumber di lib/news/sources.ts berubah, sesuaikan juga
// daftar SUMBER_BERITA di bawah ini.

import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import Groq from 'groq-sdk'
import { marked } from 'marked'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

// --- D1 Helper ---
const D1_URL = process.env.CF_D1_DATABASE_ID
  ? `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/d1/database/${process.env.CF_D1_DATABASE_ID}/query`
  : null

async function d1InsertArtikel(slug, artikel, gambarPath, tanggal, berita, kontenHtml) {
  if (!D1_URL) return
  const res = await fetch(D1_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.CF_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sql: `INSERT OR IGNORE INTO artikel (slug, judul, ringkasan, konten, konten_html, gambar, kategori, tags, penulis, tanggal, seo_title, seo_desc, status, sumber_berita_nama, sumber_berita_url, tanggal_berita)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      params: [
        slug,
        artikel.judul,
        artikel.ringkasan || '',
        artikel.konten,
        kontenHtml || null,
        gambarPath,
        'Berita Terkini',
        JSON.stringify(artikel.tags || []),
        'Tim Redaksi APLESI',
        tanggal,
        artikel.seoTitle || null,
        artikel.seoDesc || null,
        'published',
        berita.sumberNama || null,
        berita.link || null,
        berita.tanggal || null,
      ],
    }),
  })
  if (!res.ok) throw new Error(`D1 HTTP ${res.status}`)
}

const MAKS_ARTIKEL_PER_SIKLUS = 5
const KV_KEY_REGISTRY = 'berita:sudah-jadi-artikel'

// ---------- Sumber RSS (duplikat dari lib/news/sources.ts) ----------
const SUMBER_BERITA = [
  { id: 'gnews-id-perikanan', nama: 'Google News — Perikanan & Budidaya Ikan', url: 'https://news.google.com/rss/search?q=%22budidaya%20ikan%22%20OR%20perikanan%20OR%20nelayan%20when:2d&hl=id&gl=ID&ceid=ID:id', asal: 'indonesia' },
  { id: 'gnews-id-kkp', nama: 'Google News — Kebijakan KKP', url: 'https://news.google.com/rss/search?q=%22Kementerian%20Kelautan%20dan%20Perikanan%22%20OR%20KKP%20when:3d&hl=id&gl=ID&ceid=ID:id', asal: 'indonesia' },
  { id: 'gnews-id-udang-tambak', nama: 'Google News — Udang & Tambak', url: 'https://news.google.com/rss/search?q=%22budidaya%20udang%22%20OR%20tambak%20when:3d&hl=id&gl=ID&ceid=ID:id', asal: 'indonesia' },
  { id: 'gnews-id-ekspor', nama: 'Google News — Ekspor Hasil Laut RI', url: 'https://news.google.com/rss/search?q=%22ekspor%20perikanan%22%20OR%20%22ekspor%20udang%22%20Indonesia%20when:5d&hl=id&gl=ID&ceid=ID:id', asal: 'indonesia' },
  { id: 'gnews-en-aquaculture', nama: 'Google News — Aquaculture Industry', url: 'https://news.google.com/rss/search?q=aquaculture%20when:2d&hl=en-US&gl=US&ceid=US:en', asal: 'internasional' },
  { id: 'gnews-en-fisheries', nama: 'Google News — Fisheries & Seafood', url: 'https://news.google.com/rss/search?q=%22fisheries%22%20OR%20%22seafood%20industry%22%20when:2d&hl=en-US&gl=US&ceid=US:en', asal: 'internasional' },
  { id: 'gnews-en-shrimp', nama: 'Google News — Shrimp Farming', url: 'https://news.google.com/rss/search?q=%22shrimp%20farming%22%20OR%20%22shrimp%20aquaculture%22%20when:5d&hl=en-US&gl=US&ceid=US:en', asal: 'internasional' },
  { id: 'aquaculturemag', nama: 'Aquaculture Magazine', url: 'https://aquaculturemag.com/feed/', asal: 'internasional' },
  { id: 'worldwideaquaculture', nama: 'WorldWide Aquaculture', url: 'https://worldwideaquaculture.com/feed/', asal: 'internasional' },
  { id: 'aquaculturists', nama: 'The Aquaculturists', url: 'https://theaquaculturists.blogspot.com/feeds/posts/default?alt=rss', asal: 'internasional' },
]

const KATA_KUNCI_RELEVAN = [
  'ikan', 'fish', 'perikanan', 'fisheries', 'akuakultur', 'aquaculture',
  'budidaya', 'nelayan', 'tambak', 'kolam', 'udang', 'shrimp', 'prawn',
  'lele', 'nila', 'tilapia', 'catfish', 'salmon', 'lobster', 'kepiting',
  'crab', 'kkp', 'seafood', 'pakan ikan', 'hatchery', 'pembenihan',
  'bioflok', 'karamba', 'mina', 'laut', 'marine', 'ekspor ikan', 'oyster',
  'kerang', 'rumput laut', 'seaweed', 'mangrove',
]

function relevan(judul, ringkasan) {
  const teks = `${judul} ${ringkasan}`.toLowerCase()
  return KATA_KUNCI_RELEVAN.some((kw) => teks.includes(kw))
}

function buatId(link) {
  let hash = 0
  for (let i = 0; i < link.length; i++) {
    hash = (hash * 31 + link.charCodeAt(i)) | 0
  }
  return Math.abs(hash).toString(36)
}

// ---------- Parser RSS ringan (duplikat dari lib/news/rss-parser.ts) ----------
function decodeEntities(str) {
  return str
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'").replace(/&apos;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => { try { return String.fromCodePoint(Number(code)) } catch { return '' } })
    .replace(/&amp;/g, '&')
}
function stripCdata(str) { return str.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1') }
function stripHtmlTags(str) { return str.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() }
function bersihkanTeks(raw) { return decodeEntities(stripHtmlTags(stripCdata(raw))).trim() }

function extractTag(block, tag) {
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i')
  const m = block.match(re)
  return m ? m[1] : ''
}
function extractSelfClosingHref(block, tag) {
  const re = new RegExp(`<${tag}[^>]*\\shref=["']([^"']+)["'][^>]*/?>`, 'i')
  const m = block.match(re)
  return m ? m[1] : ''
}
function truncateRingkasan(text, max = 500) {
  if (text.length <= max) return text
  return text.slice(0, max).trim() + '...'
}

/**
 * Ekstrak URL gambar dari blok RSS/Atom.
 * Prioritas: media:content > media:thumbnail > enclosure > img in description
 */
function extractImageUrl(block) {
  // media:content url="..."
  const mediaContent = block.match(/<media:content[^>]*\surl=["']([^"']+)["']/i)
  if (mediaContent?.[1]) return mediaContent[1]

  // media:thumbnail url="..."
  const mediaThumb = block.match(/<media:thumbnail[^>]*\surl=["']([^"']+)["']/i)
  if (mediaThumb?.[1]) return mediaThumb[1]

  // enclosure url="..." type="image/..."
  const enclosure = block.match(/<enclosure[^>]*\surl=["']([^"']+)["'][^>]*\stype=["']image\//i)
  if (enclosure?.[1]) return enclosure[1]

  // <img src="..."> dalam description
  const descBlock = extractTag(block, 'description')
  const imgInDesc = descBlock.match(/<img[^>]*\ssrc=["']([^"']+)["']/i)
  if (imgInDesc?.[1]) return imgInDesc[1]

  return ''
}

function parseRSSFeed(xml) {
  const isAtom = /<feed[\s>]/i.test(xml) && !/<rss[\s>]/i.test(xml)
  const blockTag = isAtom ? 'entry' : 'item'
  const blockRe = new RegExp(`<${blockTag}[\\s>][\\s\\S]*?<\\/${blockTag}>`, 'gi')
  const blocks = xml.match(blockRe) || []
  const items = []

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

// ---------- Scrape semua sumber, dedup, sort terbaru (duplikat dari lib/news/scraper.ts) ----------
async function scrapeBeritaPerikanan() {
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
        .map((m) => ({
          id: buatId(m.link),
          judul: m.judul,
          ringkasan: m.ringkasan,
          link: m.link,
          sumberId: sumber.id,
          sumberNama: sumber.nama,
          asal: sumber.asal,
          tanggal: m.tanggal,
          imageUrl: m.imageUrl || '',
        }))
    })
  )

  const semua = []
  hasil.forEach((r) => {
    if (r.status === 'fulfilled') semua.push(...r.value)
  })

  const peta = new Map()
  for (const item of semua) {
    if (!peta.has(item.id)) peta.set(item.id, item)
  }

  return Array.from(peta.values()).sort(
    (a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
  )
}

// ---------- Registry KV anti-duplikat (duplikat ringkas dari lib/cloudflare/kv.ts) ----------
function kvBaseUrl() {
  return `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/storage/kv/namespaces/${process.env.CF_KV_NAMESPACE_ID}`
}
function kvHeaders() {
  return {
    Authorization: `Bearer ${process.env.CF_API_TOKEN}`,
    'Content-Type': 'application/json',
  }
}

async function kvGetRegistry() {
  try {
    const res = await fetch(`${kvBaseUrl()}/values/${KV_KEY_REGISTRY}`, { headers: kvHeaders() })
    if (!res.ok) return []
    const text = await res.text()
    return text ? JSON.parse(text) : []
  } catch {
    return []
  }
}

async function kvSetRegistry(list) {
  try {
    const res = await fetch(`${kvBaseUrl()}/values/${KV_KEY_REGISTRY}`, {
      method: 'PUT',
      headers: kvHeaders(),
      body: JSON.stringify(list),
    })
    if (!res.ok) console.warn('⚠️ Gagal update registry KV: HTTP', res.status)
  } catch (err) {
    console.warn('⚠️ Gagal update registry KV:', err.message)
  }
}

// ---------- Generate recap artikel via Groq ----------
function slugify(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

async function generateRecapArtikel(berita) {
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: `Kamu adalah Tim Redaksi APLESI (aplesi.my.id), menulis artikel recap & analisis berdasarkan berita perikanan yang sedang beredar.

ATURAN WAJIB (etis, anti-thin-content, anti-plagiarisme):
1. JANGAN menerjemahkan/menyalin ulang secara dekat dari ringkasan sumber -- tulis dari sudut pandang baru dengan analisis ASLI.
2. WAJIB ada nilai tambah nyata: apa artinya berita ini bagi pembudidaya ikan skala kecil-menengah di Indonesia? Dampak praktis, peluang, atau risiko apa yang relevan?
3. Kaitkan dengan topik budidaya ikan Aplesi yang relevan jika masuk akal (pakan, kolam, penyakit, dsb) -- tapi jangan dipaksakan.
4. WAJIB sertakan kalimat atribusi eksplisit di AKHIR konten (sebelum FAQ jika ada), contoh format: "Artikel ini merupakan rangkuman & analisis berdasarkan laporan dari [Nama Sumber] ([tanggal])." -- ganti [Nama Sumber] dan [tanggal] sesuai data yang diberikan. JANGAN taruh atribusi di awal artikel.
5. Panjang total 800-1200 kata, format Markdown, heading H2/H3, jawab inti tiap heading di kalimat pertama section itu (answer-first).
6. Tulis dalam Bahasa Indonesia yang baik dan benar.`,
      },
      {
        role: 'user',
        content: `Buat artikel recap & analisis dari berita berikut:

Judul asli: "${berita.judul}"
Ringkasan asli: "${berita.ringkasan}"
Sumber: ${berita.sumberNama}
Tanggal: ${berita.tanggal}
Asal: ${berita.asal === 'internasional' ? 'media internasional (berbahasa Inggris)' : 'media Indonesia'}

Setelah artikel, buat juga "imagePrompt": prompt image-generation dalam Bahasa Inggris untuk Stable Diffusion, menggambarkan SATU adegan visual konkret yang relevan dengan topik berita ini (bukan judul, bukan generik).

Respons hanya JSON:
{
  "judul": "...",
  "ringkasan": "... (max 160 karakter)",
  "konten": "... (markdown, 800-1200 kata)",
  "tags": ["tag1", "tag2", "tag3"],
  "seoTitle": "... (max 60 karakter)",
  "seoDesc": "... (max 160 karakter)",
  "imagePrompt": "..."
}`,
      },
    ],
    temperature: 0.7,
    max_tokens: 4096,
    response_format: { type: 'json_object' },
  })

  return JSON.parse(completion.choices[0].message.content)
}

// ---------- GitHub Image Storage (duplikat dari lib/ai/cloudflare-image.ts) ----------
async function uploadToGithub(buffer, destPath) {
  const token = process.env.GITHUB_TOKEN
  const owner = process.env.GITHUB_OWNER
  const repo = process.env.GITHUB_REPO
  if (!token || !owner || !repo) return ''

  try {
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${destPath}`
    const existing = await fetch(apiUrl, {
      headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'aplesi-enterprise' },
    })

    let sha
    if (existing.ok) {
      const data = await existing.json()
      sha = data.sha
    }

    const res = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'aplesi-enterprise',
      },
      body: JSON.stringify({
        message: `chore: add image for ${destPath.split('/').pop()}`,
        content: buffer.toString('base64'),
        ...(sha ? { sha } : {}),
      }),
    })

    if (!res.ok) {
      console.warn(`   ⚠️ GitHub upload gagal: ${res.status}`)
      return ''
    }

    return `https://cdn.jsdelivr.net/gh/${owner}/${repo}@main/${destPath}`
  } catch (err) {
    console.warn(`   ⚠️ GitHub upload error:`, err.message)
    return ''
  }
}

/**
 * Download gambar dari URL eksternal & simpan ke GitHub.
 * Return raw URL atau '' jika gagal.
 */
async function downloadDanSimpanGambar(imageUrl, id) {
  try {
    const res = await fetch(imageUrl, {
      signal: AbortSignal.timeout(10000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AplesiBot/1.0)' },
    })
    if (!res.ok) return ''
    const contentType = res.headers.get('content-type') || ''
    if (!contentType.includes('image')) return ''

    const buffer = Buffer.from(await res.arrayBuffer())
    if (buffer.length < 1000) return ''

    const ext = contentType.includes('webp') ? 'webp' : contentType.includes('png') ? 'png' : 'jpg'
    const destPath = `public/images/news/${id}-${Date.now()}.${ext}`
    return await uploadToGithub(buffer, destPath)
  } catch {
    return ''
  }
}

// ---------- Generate gambar via FLUX-1 Schnell (duplikat dari lib/ai/cloudflare-image.ts) ----------
async function generateGambar(prompt) {
  console.log('   🖼️ Generating gambar via FLUX-1...')
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/ai/run/@cf/black-forest-labs/flux-1-schnell`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.CF_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `${prompt}, professional photography, high quality, 4k`,
          num_steps: 4,
          width: 1024,
          height: 576,
        }),
      }
    )
    if (!response.ok) throw new Error(await response.text())
    const data = await response.json()
    if (!data.result?.image) throw new Error('No image in FLUX-1 response')
    // Decode base64 image to Buffer
    return Buffer.from(data.result.image, 'base64')
  } catch (err) {
    console.warn('   ⚠️ Generate gambar gagal:', err.message)
    return null
  }
}

// ---------- Kuota harian generate gambar (dibagi dgn scripts/auto-post.mjs) ----------
// FLUX-1 Schnell: 10.000 Neuron gratis/bulan (~10.000 langkah).
// num_steps=4 → ~2.500 gambar/bulan. Counter jaga-jaga.
const BATAS_GAMBAR_PER_HARI = 50

function kvKuotaKey() {
  const tanggalUTC = new Date().toISOString().split('T')[0]
  return `neuron-image-usage:${tanggalUTC}`
}

async function kvAmbilKuotaGambarHariIni() {
  try {
    const res = await fetch(`${kvBaseUrl()}/values/${kvKuotaKey()}`, { headers: kvHeaders() })
    if (!res.ok) return 0
    const text = await res.text()
    return text ? parseInt(text, 10) || 0 : 0
  } catch {
    return 0
  }
}

async function kvTambahKuotaGambar(nilaiSekarang) {
  try {
    await fetch(`${kvBaseUrl()}/values/${kvKuotaKey()}`, {
      method: 'PUT',
      headers: kvHeaders(),
      body: String(nilaiSekarang + 1),
    })
  } catch (err) {
    console.warn('   ⚠️ Gagal update kuota gambar KV:', err.message)
  }
}

async function generateGambarDenganKuota(prompt) {
  const kuotaSekarang = await kvAmbilKuotaGambarHariIni()
  if (kuotaSekarang >= BATAS_GAMBAR_PER_HARI) {
    console.warn(`   ⚠️ Kuota gambar harian tercapai (${kuotaSekarang}/${BATAS_GAMBAR_PER_HARI}), skip generate gambar -- pakai fallback.`)
    return null
  }
  const buffer = await generateGambar(prompt)
  if (buffer) await kvTambahKuotaGambar(kuotaSekarang)
  return buffer
}

// Escape untuk value string di dalam frontmatter YAML sederhana
function esc(str) {
  return String(str).replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

async function main() {
  console.log('🔍 Scrape sumber RSS...')
  const semuaBerita = await scrapeBeritaPerikanan()
  console.log(`   ${semuaBerita.length} berita relevan ditemukan.`)

  const registry = await kvGetRegistry()
  const registrySet = new Set(registry)

  const beritaBaru = semuaBerita
    .filter((b) => !registrySet.has(b.id))
    .slice(0, MAKS_ARTIKEL_PER_SIKLUS)

  if (beritaBaru.length === 0) {
    console.log('✅ Tidak ada berita baru yang perlu dijadikan artikel.')
    return
  }

  console.log(`📝 ${beritaBaru.length} berita baru akan dijadikan artikel (maks ${MAKS_ARTIKEL_PER_SIKLUS}/siklus)...`)

  const registryBaru = [...registry]

  for (const berita of beritaBaru) {
    try {
      console.log(`   → "${berita.judul}"`)
      const artikel = await generateRecapArtikel(berita)
      const slug = slugify(artikel.judul)
      const tanggal = new Date().toISOString().split('T')[0]

      let gambarPath = '/images/og-default.png'

      // Hybrid image pipeline: RSS image → download, atau generate via FLUX-1
      if (berita.imageUrl) {
        console.log('   📥 Download gambar dari RSS...')
        const downloaded = await downloadDanSimpanGambar(berita.imageUrl, berita.id)
        if (downloaded) {
          gambarPath = downloaded
          console.log(`   ✅ Gambar RSS tersimpan: ${gambarPath}`)
        }
      }

      if (gambarPath === '/images/og-default.png') {
        const promptGambar = artikel.imagePrompt || `${artikel.judul}, Indonesian aquaculture, realistic photography`
        const gambarBuffer = await generateGambarDenganKuota(promptGambar)
        if (gambarBuffer) {
          const imgFile = `artikel/${slug}-${Date.now()}.jpg`
          const githubUrl = await uploadToGithub(gambarBuffer, `public/images/${imgFile}`)
          if (githubUrl) {
            gambarPath = githubUrl
          } else {
            // Fallback: simpan lokal (untuk CI/CD yang commit dulu)
            const imgDir = join(process.cwd(), 'public', 'images', 'artikel')
            await mkdir(imgDir, { recursive: true })
            await writeFile(join(imgDir, `${slug}.jpg`), gambarBuffer)
            gambarPath = `/images/artikel/${slug}.jpg`
          }
        }
      }

      const frontmatter = `---
judul: "${esc(artikel.judul)}"
slug: "${slug}"
ringkasan: "${esc(artikel.ringkasan)}"
gambar: "${gambarPath}"
kategori: "Berita Terkini"
tags: [${(artikel.tags || []).map((t) => `"${esc(t)}"`).join(', ')}]
penulis: "Tim Redaksi APLESI"
tanggal: "${tanggal}"
status: "published"
seoTitle: "${esc(artikel.seoTitle)}"
seoDesc: "${esc(artikel.seoDesc)}"
sumberBerita:
  nama: "${esc(berita.sumberNama)}"
  url: "${esc(berita.link)}"
tanggalBerita: "${berita.tanggal}"
---

${artikel.konten}`

      const artikelDir = join(process.cwd(), 'content', 'artikel')
      await mkdir(artikelDir, { recursive: true })
      await writeFile(join(artikelDir, `${slug}.md`), frontmatter)

      console.log(`   ✅ Disimpan: ${slug}.md`)

      // Pre-render markdown → HTML dan simpan ke D1
      try {
        const kontenHtml = await marked(artikel.konten)
        await d1InsertArtikel(slug, artikel, gambarPath, tanggal, berita, kontenHtml)
        console.log(`   ✅ Disimpan ke D1: ${slug}`)
      } catch (err) {
        console.warn(`   ⚠️ Gagal simpan ke D1 (artikel tetap ada di .md):`, err.message)
      }

      registryBaru.push(berita.id)
    } catch (err) {
      console.error(`   ❌ Gagal generate artikel dari berita "${berita.judul}":`, err.message)
      // Sengaja TIDAK ditambah ke registry -- akan dicoba lagi di siklus
      // cron berikutnya (bukan hilang permanen kalau Groq/CF sempat error).
    }
  }

  await kvSetRegistry(registryBaru)
  console.log('🎉 generate-berita-artikel selesai!')
}

main().catch((err) => {
  console.error('❌ Fatal error:', err)
  process.exit(1)
})
