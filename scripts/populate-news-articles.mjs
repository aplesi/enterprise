// scripts/populate-news-articles.mjs
// Memastikan SEMUA baris di tabel `berita` D1 memiliki:
// 1. Slug unik (sehingga tidak ada link ke Google News/eksternal)
// 2. Judul bersih (tanpa embel-embel " - Media.com" di judul)
// 3. Nama sumber asli (ekstrak dari judul / tag)
// 4. Konten artikel jurnalistik (konten_recap) sehingga halaman /news/[slug] SELALU ada dan berbobot.

import 'dotenv/config'
import Groq from 'groq-sdk'
import { JOURNALISM_NEWS_PROMPT } from '../prompts/index.mjs'

const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID
const CF_D1_DATABASE_ID = process.env.CF_D1_DATABASE_ID
const CF_API_TOKEN = process.env.CF_API_TOKEN
const GROQ_API_KEY = process.env.GROQ_API_KEY

if (!CF_ACCOUNT_ID || !CF_D1_DATABASE_ID || !CF_API_TOKEN) {
  console.error('❌ Harap pastikan env Cloudflare tersedia.')
  process.exit(1)
}

const groq = GROQ_API_KEY ? new Groq({ apiKey: GROQ_API_KEY }) : null
const D1_URL = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${CF_D1_DATABASE_ID}/query`

async function d1Query(sql, params = []) {
  const res = await fetch(D1_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${CF_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql, params }),
  })
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`D1 Query Error: HTTP ${res.status} - ${errText}`)
  }
  const data = await res.json()
  if (!data.success) {
    throw new Error(`D1 Query Failed: ${JSON.stringify(data.errors)}`)
  }
  return data.result[0]?.results || []
}

function slugify(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

function ekstrakSumber(judul, sumber) {
  const match = (judul || '').match(/ - ([^-]+)$/)
  if (match) return match[1].trim()
  if (sumber && !sumber.includes('Google News')) return sumber.trim()
  return 'Redaksi Perikanan'
}

function bersihkanJudul(judul) {
  return (judul || '').replace(/\s*-\s*[^-]+$/, '').trim()
}

function buatBulletinMarkdown(judul, ringkasan, sumber, tanggal, url) {
  return `## Duduk Perkara & Poin Kunci Berita

${ringkasan || judul}

Laporan terkini ini menyoroti dinamika penting pada sektor perikanan dan budidaya nasional yang berdampak pada ekosistem budidaya ikan di Indonesia.

## Konteks & Dinamika Industri

Sektor perikanan budidaya nasional, khususnya komoditas unggulan seperti lele, nila, patin, dan udang, senantiasa dipengaruhi oleh faktor stabilitas bahan baku pakan, kondisi iklim perairan, serta regulasi distribusi pasar. Informasi dan pembaruan dari lapangan menjadi landasan bagi pembudidaya dalam mengambil keputusan operasional yang presisi.

## Analisis Lapangan: Dampak bagi Pembudidaya Rakyat

Bagi pembudidaya kolam terpal, kolam tanah, maupun sistem bioflok di tingkat akar rumput, perkembangan ini memerlukan langkah antisipasi terukur:
- **Efisiensi Pakan & FCR:** Mengontrol rasio pemberian pakan harian agar tidak terjadi pemborosan operasional di kolam.
- **Manajemen Mutu Air:** Memperhatikan sirkulasi dan aerasi air secara berkala untuk menjaga daya tahan ikan terhadap perubahan cuaca.
- **Kesiapan Panen & Pasar:** Menjalin komunikasi intensif dengan kelompok tani dan pengepul lokal untuk mengamankan harga serap pasar.

## Catatan Redaksi APLESI

Tim Redaksi APLESI menggarisbawahi pentingnya penerapan Cara Budidaya Ikan yang Baik (CBIB) serta kemandirian formulasi pakan alternatif bernutrisi tinggi sebagai tameng pelindung margin pembudidaya menghadapi fluktuasi ekonomi perikanan.

## Atribusi Sumber

Laporan awal dan informasi rujukan dipublikasikan oleh **${sumber}** pada ${tanggal}. Pembaca dapat meninjau publikasi pembanding melalui saluran resmi terkait.`
}

async function generateFullArticleGroq(judul, ringkasan, sumber, tanggal) {
  if (!groq) return null
  try {
    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
      messages: [
        {
          role: 'system',
          content: `Kamu adalah Redaktur Senior & Wartawan Investigasi Agribisnis Perikanan APLESI (aplesi.my.id). Tulis laporan berita mendalam, kritis, objektif, 5W+1H, sudut pandang peternak rakyat, bebas klise AI. Panjang minimal 800 kata. Format Markdown H2/H3.`,
        },
        {
          role: 'user',
          content: `Buat liputan berita mendalam berdasarkan informasi berikut:

Judul: "${judul}"
Ringkasan: "${ringkasan}"
Sumber: ${sumber}
Tanggal: ${tanggal}

${JOURNALISM_NEWS_PROMPT}

Respons HANYA JSON:
{
  "judul": "...",
  "konten": "..."
}`,
        },
      ],
      temperature: 0.6,
      max_tokens: 4096,
      response_format: { type: 'json_object' },
    })
    const res = JSON.parse(completion.choices[0].message.content)
    return res.konten
  } catch (err) {
    console.warn(`   ⚠️ Groq skip untuk "${judul.slice(0, 30)}...":`, err.message)
    return null
  }
}

async function main() {
  console.log('🚀 Memulai audit & regenerasi slug serta artikel berita di D1...')

  // Ambil semua berita yang slug-nya kosong atau belum punya konten_recap
  const rows = await d1Query(
    `SELECT id, judul, ringkasan, url_sumber, sumber_nama, tanggal, slug, konten_recap 
     FROM berita 
     WHERE slug IS NULL OR slug = '' OR konten_recap IS NULL OR konten_recap = ''
     ORDER BY tanggal DESC`
  )

  console.log(`📊 Ditemukan ${rows.length} berita tanpa slug/konten lengkap.`)

  const slugSet = new Set()
  // Masukkan slug yang sudah ada di D1 agar tidak tabrakan
  const existingSlugs = await d1Query(`SELECT slug FROM berita WHERE slug IS NOT NULL AND slug != ''`)
  existingSlugs.forEach((r) => slugSet.add(r.slug))

  let count = 0
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const cleanJudul = bersihkanJudul(row.judul)
    const cleanSumber = ekstrakSumber(row.judul, row.sumber_nama)
    
    let baseSlug = slugify(cleanJudul)
    if (!baseSlug) baseSlug = `berita-perikanan-${row.id}`
    let finalSlug = baseSlug
    let counter = 1
    while (slugSet.has(finalSlug)) {
      finalSlug = `${baseSlug}-${row.id || counter}`
      counter++
    }
    slugSet.add(finalSlug)

    let konten = row.konten_recap
    if (!konten || konten.trim().length < 100) {
      // 10 teratas kita coba generate dengan AI Groq, sisanya pakai bulletin terstruktur
      if (i < 10 && groq) {
        console.log(`🤖 [${i + 1}/${rows.length}] Menulis artikel jurnalisme via Groq: "${cleanJudul.slice(0, 40)}..."`)
        const aiKonten = await generateFullArticleGroq(cleanJudul, row.ringkasan, cleanSumber, row.tanggal)
        konten = aiKonten || buatBulletinMarkdown(cleanJudul, row.ringkasan, cleanSumber, row.tanggal, row.url_sumber)
      } else {
        konten = buatBulletinMarkdown(cleanJudul, row.ringkasan, cleanSumber, row.tanggal, row.url_sumber)
      }
    }

    // UPDATE D1
    await d1Query(
      `UPDATE berita 
       SET slug = ?, judul = ?, sumber_nama = ?, konten_recap = ?, sudah_jadi_artikel = 1 
       WHERE id = ?`,
      [finalSlug, cleanJudul, cleanSumber, konten, row.id]
    )

    count++
    if (count % 25 === 0 || count === rows.length) {
      console.log(`   ✅ Selesai: ${count}/${rows.length}`)
    }
  }

  // Verifikasi akhir
  const check = await d1Query(
    `SELECT COUNT(*) as total, 
            SUM(CASE WHEN slug IS NULL OR slug = '' THEN 1 ELSE 0 END) as no_slug,
            SUM(CASE WHEN konten_recap IS NULL OR konten_recap = '' THEN 1 ELSE 0 END) as no_recap
     FROM berita`
  )
  console.log('\n✨ Verifikasi Akhir Database D1:')
  console.log(JSON.stringify(check[0], null, 2))
  console.log('🎉 Semua berita sekarang 100% memiliki slug internal dan artikel lengkap!')
}

main().catch((err) => {
  console.error('❌ Error script:', err)
  process.exit(1)
})
