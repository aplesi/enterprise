// scripts/test-journalist-prompt.mjs
// Uji coba prompt jurnalisme perikanan (JOURNALISM_NEWS_PROMPT) dengan Groq API
import 'dotenv/config'
import Groq from 'groq-sdk'
import { JOURNALISM_NEWS_PROMPT } from '../prompts/index.mjs'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

async function run() {
  console.log('📰 Menguji prompt Skill Wartawan Perikanan (JOURNALISM_NEWS_PROMPT)...')

  const sampleNews = {
    judul: "Ekspor Udang Sulawesi Selatan Tembus Rp148 Miliar, Barantin Perkuat Sistem Karantina Mutu",
    ringkasan: "Badan Karantina Indonesia (Barantin) memastikan percepatan layanan karantina dan jaminan mutu komoditas ekspor udang asal Sulawesi Selatan yang menembus nilai Rp148,2 miliar ke pasar Amerika Serikat dan Jepang.",
    sumberNama: "Antara News",
    tanggal: "2026-10-25",
    asal: "indonesia"
  }

  const completion = await groq.chat.completions.create({
    model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
    messages: [
      {
        role: 'system',
        content: `Kamu adalah Redaktur Senior & Wartawan Investigasi Agribisnis Perikanan APLESI (aplesi.my.id), menulis laporan berita mendalam, kritis, dan berbobot berdasarkan fakta perikanan terkini.

ATURAN WAJIB:
1. Tulis ULANG berita secara KOMPREHENSIF dengan sudut pandang jurnalisme agribisnis — JANGAN menyalin kalimat dari sumber. Gunakan piramida terbalik (5W+1H pada lead paragraf pertama).
2. WAJIB memasukkan SEMUA fakta, data kuantitatif, regulasi, nama pihak/lembaga, dan kutipan narasumber. KEMBANGKAN dengan analisis dampak ekonomi dan teknis.
3. SUDUT PANDANG PETERNAK RAKYAT: kupas tuntas dampaknya bagi pembudidaya ikan skala kecil-menengah di Indonesia (biaya pakan, benih, margin laba per kg, risiko air/cuaca, akses pasar).
4. DILARANG menggunakan kata klise AI seperti: "Di era digital yang pesat...", "Mari kita telusuri...", "Penting untuk diingat bahwa...", "Tidak dapat dipungkiri...".
5. WAJIB sertakan kalimat atribusi eksplisit di AKHIR konten: "Artikel analisis ini disusun oleh Tim Redaksi APLESI berdasarkan data dan laporan dari [Nama Sumber] ([tanggal])."
6. Panjang minimal 800 kata. Format Markdown, heading H2/H3.
7. Tulis dalam Bahasa Indonesia baku, lugas, mengalir, dan bernas.`
      },
      {
        role: 'user',
        content: `Buat liputan berita mendalam berdasarkan informasi berikut:

Judul: "${sampleNews.judul}"
Ringkasan: "${sampleNews.ringkasan}"
Sumber: ${sampleNews.sumberNama}
Tanggal: ${sampleNews.tanggal}

${JOURNALISM_NEWS_PROMPT}

Setelah artikel, buat juga "imagePrompt": prompt image-generation dalam Bahasa Inggris untuk FLUX-1 dengan gaya photojournalism dokumenter autentik.

Respons HANYA JSON:
{
  "judul": "...",
  "ringkasan": "...",
  "konten": "...",
  "imagePrompt": "..."
}`
      }
    ],
    temperature: 0.6,
    max_tokens: 4096,
    response_format: { type: 'json_object' }
  })

  const result = JSON.parse(completion.choices[0].message.content)
  console.log('\n--- HASIL UJI COBA GENERASI BERITA JURNALISTIK ---')
  console.log('📌 Judul:', result.judul)
  console.log('📝 Ringkasan (Lead):', result.ringkasan)
  console.log('📸 Image Prompt:', result.imagePrompt)
  console.log('\n📄 Cuplikan Konten (400 Karakter Pertama):')
  console.log(result.konten.slice(0, 400))
  console.log('\n📄 Bagian Heading Artikel:')
  const headings = result.konten.match(/^##\s+.+$/gm) || []
  headings.forEach(h => console.log('   ', h))
  console.log('\n✨ Total Kata:', result.konten.split(/\s+/).length)
}

run().catch(err => {
  console.error('❌ Error test journalist prompt:', err)
  process.exit(1)
})
