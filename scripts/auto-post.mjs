// scripts/auto-post.mjs
// Script yang dijalankan oleh GitHub Actions setiap hari

import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

// Daftar topik yang dirotasi otomatis
const TOPIK_ROTASI = [
  'cara budidaya lele dumbo untuk pemula',
  'pakan lele organik hemat biaya',
  'mengatasi penyakit white spot pada lele',
  'kolam terpal vs kolam tanah untuk lele',
  'teknik pembenihan lele modern',
  'manajemen kualitas air kolam lele',
  'panen lele yang menguntungkan',
  'bisnis lele asap peluang usaha menjanjikan',
  'suplemen probiotik untuk pertumbuhan lele',
  'sistem bioflok budidaya lele intensif',
]

function pilihTopik() {
  const custom = process.env.TOPIK_CUSTOM
  if (custom) return custom

  // Rotasi berdasarkan hari dalam tahun
  const hari = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
  return TOPIK_ROTASI[hari % TOPIK_ROTASI.length]
}

function slugify(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

async function generateArtikel(topik) {
  console.log(`📝 Generating artikel: "${topik}"`)

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: 'Kamu adalah penulis konten profesional untuk website budidaya lele. Tulis dalam Bahasa Indonesia yang baik. Selalu kembalikan respons dalam format JSON valid.'
      },
      {
        role: 'user',
        content: `Tulis artikel lengkap tentang: "${topik}"
        
Panjang: 1000-1500 kata, format Markdown, dengan heading H2 dan H3.

Setelah itu buat juga "imagePrompt": prompt image-generation dalam Bahasa
Inggris untuk Stable Diffusion, menggambarkan SATU adegan visual konkret
yang benar-benar dibahas di artikel ini (spesies ikan, jenis kolam, alat,
tahapan yang dijelaskan, dsb) -- BUKAN judul artikel, BUKAN deskripsi
generik seperti "fish farming Indonesia". Contoh: "close-up of catfish
fingerlings in a blue tarpaulin pond, hand feeding pellets, morning
light, rural Indonesian aquaculture, realistic photography".

Respons hanya JSON:
{
  "judul": "...",
  "ringkasan": "... (max 160 karakter)",
  "konten": "... (markdown)",
  "tags": ["tag1", "tag2", "tag3"],
  "seoTitle": "... (max 60 karakter)",
  "seoDesc": "... (max 160 karakter)",
  "kategori": "...",
  "imagePrompt": "..."
}`
      }
    ],
    temperature: 0.7,
    max_tokens: 4096,
    response_format: { type: 'json_object' }
  })

  return JSON.parse(completion.choices[0].message.content)
}

async function generateGambar(prompt) {
  console.log(`🖼️ Generating gambar...`)
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/ai/run/@cf/stabilityai/stable-diffusion-xl-base-1.0`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.CF_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `${prompt}, fish farming Indonesia, professional photography, high quality`,
          num_steps: 20,
          width: 1200,
          height: 630,
        }),
      }
    )
    if (!response.ok) throw new Error(await response.text())
    return Buffer.from(await response.arrayBuffer())
  } catch (err) {
    console.warn('⚠️ Generate gambar gagal:', err.message)
    return null
  }
}

// ---------- Kuota harian generate gambar (dibagi dgn generate-berita-artikel.mjs) ----------
// @cf/stabilityai/stable-diffusion-xl-base-1.0 saat ini masih status Beta di
// Cloudflare Workers AI ($0.00/step, belum masuk hitungan 10.000 Neuron/hari
// gratis). TAPI status beta bisa berubah kapan saja jadi GA (berbayar/masuk
// kuota Neuron). Counter ini jaga-jaga: begitu kuota harian gabungan (kedua
// script) tercapai, generate gambar di-skip dan pakai fallback og-default.png
// -- supaya kalau beta berakhir, kita tidak kebobolan tagihan/limit mendadak.
const BATAS_GAMBAR_PER_HARI = 15

function kvKuotaKey() {
  const tanggalUTC = new Date().toISOString().split('T')[0]
  return `neuron-image-usage:${tanggalUTC}`
}
function kvHeaders() {
  return {
    Authorization: `Bearer ${process.env.CF_API_TOKEN}`,
    'Content-Type': 'application/json',
  }
}
function kvBaseUrl() {
  return `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/storage/kv/namespaces/${process.env.CF_KV_NAMESPACE_ID}`
}

async function kvAmbilKuotaGambarHariIni() {
  try {
    const res = await fetch(`${kvBaseUrl()}/values/${kvKuotaKey()}`, { headers: kvHeaders() })
    if (!res.ok) return 0
    const text = await res.text()
    return text ? parseInt(text, 10) || 0 : 0
  } catch {
    return 0 // Kalau KV lagi error, jangan blok generate -- fail open
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
    console.warn('⚠️ Gagal update kuota gambar KV:', err.message)
  }
}

async function generateGambarDenganKuota(prompt) {
  const kuotaSekarang = await kvAmbilKuotaGambarHariIni()
  if (kuotaSekarang >= BATAS_GAMBAR_PER_HARI) {
    console.warn(`⚠️ Kuota gambar harian tercapai (${kuotaSekarang}/${BATAS_GAMBAR_PER_HARI}), skip generate gambar -- pakai fallback.`)
    return null
  }
  const buffer = await generateGambar(prompt)
  if (buffer) await kvTambahKuotaGambar(kuotaSekarang)
  return buffer
}

async function main() {
  const jumlah = parseInt(process.env.JUMLAH_ARTIKEL || '1')
  const tanggal = new Date().toISOString().split('T')[0]

  for (let i = 0; i < jumlah; i++) {
    try {
      const topik = pilihTopik()
      const artikel = await generateArtikel(topik)
      const slug = slugify(artikel.judul)

      // Generate dan simpan gambar, pakai imagePrompt spesifik dari
      // isi artikel (bukan judul artikel yang generik)
      let gambarPath = '/images/og-default.png'
      const promptGambar = artikel.imagePrompt || `${artikel.judul}, Indonesian aquaculture, realistic photography`
      const gambarBuffer = await generateGambarDenganKuota(promptGambar)
      if (gambarBuffer) {
        const imgDir = join(process.cwd(), 'public', 'images', 'artikel')
        await mkdir(imgDir, { recursive: true })
        const imgFile = `${slug}.png`
        await writeFile(join(imgDir, imgFile), gambarBuffer)
        gambarPath = `/images/artikel/${imgFile}`
        console.log(`✅ Gambar disimpan: ${imgFile}`)
      }

      // Buat file markdown dengan frontmatter
      const frontmatter = `---
judul: "${artikel.judul}"
slug: "${slug}"
ringkasan: "${artikel.ringkasan}"
gambar: "${gambarPath}"
kategori: "${artikel.kategori || 'Budidaya'}"
tags: [${artikel.tags.map(t => `"${t}"`).join(', ')}]
penulis: "Tim Redaksi APLESI"
tanggal: "${tanggal}"
status: "published"
seoTitle: "${artikel.seoTitle}"
seoDesc: "${artikel.seoDesc}"
---

${artikel.konten}`

      const artikelDir = join(process.cwd(), 'content', 'artikel')
      await mkdir(artikelDir, { recursive: true })
      await writeFile(join(artikelDir, `${slug}.md`), frontmatter)

      console.log(`✅ Artikel disimpan: ${slug}.md`)
    } catch (err) {
      console.error(`❌ Error generate artikel ${i + 1}:`, err.message)
    }
  }

  console.log('🎉 Auto-post selesai!')
}

main()
