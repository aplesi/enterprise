// scripts/rewrite-blogger.mjs
// Rewrite artikel Blogger lama dengan AI Groq — mendukung rotasi multi API key
import { readFile, writeFile, readdir } from 'fs/promises'
import { join } from 'path'
import Groq from 'groq-sdk'

// --- Multi API Key Pool ---
const ENV_KEYS = ['GROQ_API_KEY', 'GROQ_API_KEY_2', 'GROQ_API_KEY_3', 'GROQ_API_KEY_4', 'GROQ_API_KEY_5']
const keyPool = []

for (const envName of ENV_KEYS) {
  const key = process.env[envName]
  if (key && key.length > 10) {
    keyPool.push({
      label: envName,
      client: new Groq({ apiKey: key }),
      rateLimitedAt: 0,
      retryAfterSec: 0,
    })
  }
}

if (keyPool.length === 0) {
  console.error('❌ Tidak ada GROQ_API_KEY yang ditemukan di environment!')
  process.exit(1)
}

console.log(`🔑 Ditemukan ${keyPool.length} API key Groq`)

function parseRetryAfter(msg) {
  const match = msg.match(/try again in (\d+)m([\d.]+)s/)
  if (match) return parseInt(match[1]) * 60 + parseFloat(match[2])
  const secMatch = msg.match(/try again in ([\d.]+)s/)
  if (secMatch) return parseFloat(secMatch[1])
  return 60
}

function getAvailableKey() {
  const now = Date.now()
  for (const state of keyPool) {
    if (state.rateLimitedAt === 0) return state
    const elapsed = (now - state.rateLimitedAt) / 1000
    if (elapsed >= state.retryAfterSec) {
      state.rateLimitedAt = 0
      state.retryAfterSec = 0
      return state
    }
  }
  // Semua rate limited — cari yang paling cepat pulih
  const sorted = [...keyPool].sort((a, b) => {
    return (a.rateLimitedAt + a.retryAfterSec * 1000) - (b.rateLimitedAt + b.retryAfterSec * 1000)
  })
  const earliest = sorted[0]
  const waitMs = earliest.rateLimitedAt + earliest.retryAfterSec * 1000 - now
  return { ...earliest, mustWait: Math.max(0, waitMs) }
}

const MODEL = 'llama-3.3-70b-versatile'

// D1 Helper
const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID
const CF_API_TOKEN = process.env.CF_API_TOKEN
const CF_D1_DATABASE_ID = process.env.CF_D1_DATABASE_ID
const D1_URL = CF_D1_DATABASE_ID
  ? `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${CF_D1_DATABASE_ID}/query`
  : null

async function d1UpdateArtikel(slug, judul, ringkasan, konten, tags, seoTitle, seoDesc) {
  if (!D1_URL) return
  const res = await fetch(D1_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${CF_API_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sql: `UPDATE artikel SET judul = ?, ringkasan = ?, konten = ?, tags = ?, seo_title = ?, seo_desc = ?, penulis = ?, updated_at = datetime('now') WHERE slug = ?`,
      params: [judul, ringkasan, konten, JSON.stringify(tags), seoTitle, seoDesc, 'Tim Redaksi APLESI', slug],
    }),
  })
  if (!res.ok) throw new Error(`D1 HTTP ${res.status}: ${await res.text()}`)
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function rewriteArtikel(judulLama, kontenLama) {
  const maxAttempts = keyPool.length + 1
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const state = getAvailableKey()

    // Jika semua key habis dan harus menunggu
    if (state.mustWait && state.mustWait > 0) {
      const waitSec = Math.ceil(state.mustWait / 1000)
      console.log(`   ⏳ Semua key habis. Menunggu ${waitSec} detik...`)
      await delay(state.mustWait + 1000)
      state.rateLimitedAt = 0
      state.retryAfterSec = 0
    }

    try {
      const completion = await state.client.chat.completions.create({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: `Kamu adalah Pakar SEO dan GEO (Generative Engine Optimization) sekaligus penulis konten profesional untuk website budidaya ikan "APLESI".
Tugasmu adalah merevisi dan menulis ulang (rewrite) artikel lama agar kualitasnya sangat tinggi, relevan, dan disukai oleh Google Search maupun mesin AI (Google SGE, ChatGPT, Perplexity).

ATURAN WAJIB GEO & SEO:
1. ANSWER-FIRST: Di bawah setiap heading H2/H3, kalimat PERTAMA harus langsung menjawab inti dari topik tersebut, jangan gunakan basa-basi.
2. STRUKTUR: Gunakan H2 untuk bagian utama, H3 untuk sub-bagian. Paragraf pendek (60-100 kata).
3. DATA & FAKTA: Ubah klaim generik menjadi lebih spesifik jika memungkinkan, gunakan format bullet point untuk langkah-langkah atau daftar agar mudah dibaca AI.
4. FAQ WAJIB: Di akhir artikel, WAJIB buat section "Pertanyaan yang Sering Diajukan". Buat 3 pertanyaan relevan (gunakan heading H3 dengan format "### Pertanyaan?").
5. TONE: Profesional, edukatif, namun mudah dipahami peternak ikan Indonesia. Bahasa Indonesia baku yang luwes.

Format Output WAJIB JSON:
{
  "judul": "Judul SEO baru yang sangat memikat klik",
  "ringkasan": "1-2 kalimat ringkasan padat (max 160 karakter)",
  "konten": "Isi artikel lengkap dalam Markdown",
  "tags": ["tag1", "tag2", "tag3"],
  "seoTitle": "Judul untuk Meta SEO (max 60 karakter)",
  "seoDesc": "Deskripsi untuk Meta SEO (max 160 karakter)"
}`,
          },
          {
            role: 'user',
            content: `Tulis ulang artikel ini agar sesuai standar GEO dan SEO APLESI.\nJudul Lama: "${judulLama}"\n\nKonten Lama:\n${kontenLama.substring(0, 3000)}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 4096,
        response_format: { type: 'json_object' },
      })

      const raw = completion.choices[0]?.message?.content
      if (!raw) throw new Error('Groq tidak merespons')
      return JSON.parse(raw)
    } catch (err) {
      const msg = err.message || ''
      if (msg.includes('429') || msg.includes('rate_limit')) {
        const retryAfter = parseRetryAfter(msg)
        state.rateLimitedAt = Date.now()
        state.retryAfterSec = retryAfter
        console.log(`   ⚠️ Key ${state.label} kena limit (${Math.ceil(retryAfter)}s). Mencoba key lain...`)
        continue
      }
      throw err
    }
  }
  throw new Error('Semua API key Groq habis setelah semua percobaan.')
}

function esc(str) {
  return String(str).replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

async function main() {
  const dir = join(process.cwd(), 'content', 'artikel')
  const files = await readdir(dir)

  console.log(`🔍 Memeriksa ${files.length} artikel...`)

  const targetFiles = []
  for (const file of files) {
    if (!file.endsWith('.md')) continue
    const filePath = join(dir, file)
    const content = await readFile(filePath, 'utf8')
    if (content.includes('penulis: "Admin"')) {
      targetFiles.push({ file, filePath, content })
    }
  }

  console.log(`📝 Ditemukan ${targetFiles.length} artikel lama yang perlu di-rewrite.`)
  if (targetFiles.length === 0) {
    console.log('✅ Semua artikel sudah di-rewrite!')
    return
  }

  let sukses = 0
  let gagal = 0

  for (let i = 0; i < targetFiles.length; i++) {
    const { file, filePath, content } = targetFiles[i]
    const slugLama = file.replace('.md', '')

    const judulMatch = content.match(/judul:\s*"([^"]+)"/)
    const gambarMatch = content.match(/gambar:\s*"([^"]+)"/)
    const kategoriMatch = content.match(/kategori:\s*"([^"]+)"/)
    const tanggalMatch = content.match(/tanggal:\s*"([^"]+)"/)

    const judulLama = judulMatch ? judulMatch[1] : slugLama
    const gambarLama = gambarMatch ? gambarMatch[1] : '/images/og-default.png'
    const kategoriLama = kategoriMatch ? kategoriMatch[1] : 'Blog'
    const tanggalLama = tanggalMatch ? tanggalMatch[1] : new Date().toISOString().split('T')[0]

    const parts = content.split('---')
    const isiLama = parts.length > 2 ? parts.slice(2).join('---').trim() : content

    console.log(`\n⏳ [${i + 1}/${targetFiles.length}] Menulis ulang: "${judulLama}"`)

    try {
      const hasil = await rewriteArtikel(judulLama, isiLama)

      const frontmatter = `---
judul: "${esc(hasil.judul)}"
slug: "${slugLama}"
ringkasan: "${esc(hasil.ringkasan)}"
gambar: "${esc(gambarLama)}"
kategori: "${esc(kategoriLama)}"
tags: [${(hasil.tags || []).map((t) => `"${esc(t)}"`).join(', ')}]
penulis: "Tim Redaksi APLESI"
tanggal: "${tanggalLama}"
status: "published"
seoTitle: "${esc(hasil.seoTitle || hasil.judul)}"
seoDesc: "${esc(hasil.seoDesc || hasil.ringkasan)}"
---

${hasil.konten}
`
      await writeFile(filePath, frontmatter)
      await d1UpdateArtikel(slugLama, hasil.judul, hasil.ringkasan, hasil.konten, hasil.tags || [], hasil.seoTitle || hasil.judul, hasil.seoDesc || hasil.ringkasan)

      console.log(`   ✅ Selesai`)
      sukses++

      if (i < targetFiles.length - 1) {
        await delay(3000) // Jeda 3 detik antar artikel
      }
    } catch (err) {
      console.error(`   ❌ Gagal:`, err.message)
      gagal++
      await delay(5000)
    }
  }

  console.log(`\n🎉 Proses Rewrite Selesai! ${sukses} sukses, ${gagal} gagal.`)
}

main().catch(console.error)
