// lib/ai/groq.ts
// Generate artikel menggunakan Groq API (gratis & super cepat)

import type { GenerateArtikelRequest, GenerateArtikelResponse, BeritaItem } from '@/types'
import { slugify } from '@/lib/utils'
import { templateFaqPrompt } from '@/lib/seo/faq'
import { templateHowToPrompt } from '@/lib/seo/howto'
import {
  getAvailableClient,
  markRateLimited,
  markSuccess,
  parseRetryAfter,
  GroqPoolExhaustedError,
} from '@/lib/ai/groq-pool'

const MODEL = 'llama-3.3-70b-versatile'

/**
 * Wrapper untuk chat completion Groq dengan rotasi key otomatis.
 * Jika key aktif kena 429, tandai rate limited lalu coba key berikutnya.
 * Maksimum 5 percobaan (sesuai jumlah key).
 */
async function groqChatWithRotation(
  params: Parameters<InstanceType<typeof import('groq-sdk').default>['chat']['completions']['create']>[0]
): Promise<string> {
  const maxAttempts = 5
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const { client, state } = getAvailableClient()
    try {
      const completion = await client.chat.completions.create(params) as import('groq-sdk/resources/chat/completions').ChatCompletion
      markSuccess(state)
      const content = completion.choices[0]?.message?.content
      if (!content) throw new Error('Groq tidak mengembalikan respons')
      return content
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err)
      // Rate limit 429 — tandai key ini, coba key berikutnya
      if (errMsg.includes('429') || errMsg.includes('rate_limit')) {
        const retryAfter = parseRetryAfter(errMsg)
        markRateLimited(state, retryAfter)
        console.warn(`[Groq Pool] Key ${state.label} kena rate limit, retry after ${retryAfter}s. Mencoba key lain...`)
        continue
      }
      // Error lain — langsung throw
      throw err
    }
  }
  throw new GroqPoolExhaustedError(
    'Semua API key Groq kena rate limit setelah 5 percobaan.',
    60
  )
}

export async function generateArtikel(
  req: GenerateArtikelRequest
): Promise<GenerateArtikelResponse> {
  const panjangMap = {
    pendek: '500-700 kata',
    sedang: '1000-1500 kata',
    panjang: '2000-2500 kata',
  }

  const toneMap = {
    informatif: 'informatif dan edukatif, gaya bahasa formal tapi mudah dipahami',
    tutorial: 'step-by-step tutorial yang jelas dengan contoh praktis',
    berita: 'gaya jurnalistik, ringkas dan faktual',
  }

  const systemPrompt = `Kamu adalah penulis konten profesional untuk website budidaya ikan "Aplesi" (aplesi.my.id), menulis atas nama Tim Redaksi APLESI berdasarkan praktik budidaya nyata.
Selalu tulis dalam Bahasa Indonesia yang baik dan benar.
Fokus pada konten praktis dan berguna untuk peternak ikan di Indonesia.
Gunakan heading H2 dan H3 yang relevan.
Sertakan tips praktis dan pengalaman lapangan, data spesifik (angka, rentang biaya, durasi), bukan klaim generik.

ATURAN FORMAT WAJIB (penting untuk SEO & agar dikutip AI/Google):
1. ANSWER-FIRST: di bawah SETIAP heading H2/H3, kalimat PERTAMA harus langsung menjawab inti topik heading tersebut -- bukan basa-basi pembuka. Kalimat 2-4 berisi detail pendukung (data/angka), lalu bullet points jika ada langkah/daftar.
2. PANJANG PER SECTION: setiap section di bawah satu H2/H3 sebaiknya 150-200 kata (minimum 100, maksimum 300). Jangan buat section super singkat (di bawah 50 kata) -- itu terlalu dangkal. Jangan juga lewat 300 kata untuk satu poin -- pecah jadi sub-heading baru kalau perlu.
3. PANJANG PARAGRAF: tiap paragraf sekitar 60-100 kata, satu ide utama per paragraf.
4. Jika artikel ini berupa panduan langkah-demi-langkah, gunakan heading H3 bernomor eksplisit ("### 1. Nama Langkah", "### 2. Nama Langkah", dst).

SETELAH menulis artikel, buat juga "imagePrompt": prompt image-generation dalam Bahasa Inggris untuk model Stable Diffusion, yang menggambarkan SATU adegan visual KONKRET dan SPESIFIK yang benar-benar dibahas di artikel ini (bukan judul artikel, bukan deskripsi generik "fish farming"). Ambil detail nyata dari isi artikel: jenis ikan/spesies, jenis kolam/media, alat/bahan yang disebutkan, tahapan yang sedang dijelaskan, atau kondisi visual yang relevan (warna air, tekstur pakan, dsb). Contoh format yang benar: "close-up of catfish fingerlings being released into a blue tarpaulin pond, clear morning light, hand visible pouring fish from a plastic bag, rural Indonesian aquaculture setting, realistic photography style". Jangan buat prompt umum seperti "fish farming pond Indonesia" -- harus spesifik ke isi artikel.`

  const userPrompt = `Tulis artikel tentang: "${req.topik}"

Kategori: ${req.kategori}
Keywords yang harus ada: ${req.keywords.join(', ')}
Panjang: ${panjangMap[req.panjang]}
Gaya penulisan: ${toneMap[req.tone]}

${templateHowToPrompt(req.topik)}
${templateFaqPrompt(req.topik)}

Format respons HARUS dalam JSON valid seperti ini:
{
  "judul": "judul artikel yang menarik dan mengandung keyword utama",
  "ringkasan": "ringkasan 1-2 kalimat untuk meta description (max 160 karakter)",
  "konten": "konten artikel lengkap dalam format Markdown",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "seoTitle": "judul SEO (max 60 karakter)",
  "seoDesc": "deskripsi SEO (max 160 karakter)",
  "imagePrompt": "prompt gambar dalam Bahasa Inggris, spesifik ke adegan konkret di isi artikel ini (lihat instruksi di atas)"
}

Pastikan respons hanya JSON, tanpa teks tambahan apapun.`

  const raw = await groqChatWithRotation({
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 4096,
    response_format: { type: 'json_object' },
  })

  const parsed = JSON.parse(raw)

  return {
    judul: parsed.judul,
    ringkasan: parsed.ringkasan,
    konten: parsed.konten,
    tags: parsed.tags || [],
    seoTitle: parsed.seoTitle || parsed.judul.slice(0, 60),
    seoDesc: parsed.seoDesc || parsed.ringkasan.slice(0, 160),
    imagePrompt: parsed.imagePrompt || `${parsed.judul}, Indonesian aquaculture, realistic photography`,
    slug: slugify(parsed.judul),
  }
}

export async function generateJudul(topik: string, jumlah = 5): Promise<string[]> {
  const raw = await groqChatWithRotation({
    model: MODEL,
    messages: [
      {
        role: 'user',
        content: `Buat ${jumlah} judul artikel menarik tentang "${topik}" untuk website budidaya ikan.
Judul harus SEO-friendly, mengandung angka atau power word jika relevan.
Respons hanya array JSON: ["judul1", "judul2", ...]`,
      },
    ],
    temperature: 0.8,
    max_tokens: 512,
    response_format: { type: 'json_object' },
  })

  const parsed = JSON.parse(raw)
  return parsed.judul || parsed.titles || []
}

// --- Rewrite batch berita hasil scrape ---
// Parafrase judul+ringkasan (kata/kalimat diubah, makna & fakta tetap sama).
// Berita internasional (asal='internasional') sekaligus diterjemahkan ke Bahasa Indonesia.
// Dipanggil otomatis oleh scraper untuk berita yang belum pernah di-rewrite (lihat lib/news/scraper.ts).

interface HasilRewriteBerita {
  id: string
  judul: string
  ringkasan: string
}

const UKURAN_BATCH_REWRITE = 8 // jumlah berita per panggilan Groq, jaga agar tetap di bawah limit token

async function rewriteSatuBatch(items: BeritaItem[]): Promise<HasilRewriteBerita[]> {
  const systemPrompt = `Kamu adalah editor konten untuk website budidaya ikan APLESI (aplesi.my.id).
Tugasmu: menulis ULANG (parafrase) judul dan ringkasan tiap berita di bawah ini.

ATURAN WAJIB:
1. Ganti kata dan susunan kalimat dari aslinya, TAPI makna dan fakta harus tetap 100% sama -- jangan menambah, mengurangi, atau mengubah informasi apapun.
2. Untuk berita dengan asal "internasional" (aslinya berbahasa Inggris): TERJEMAHKAN sekaligus ke Bahasa Indonesia yang natural saat memparafrase -- jangan terjemahan literal kata-per-kata.
3. Untuk berita dengan asal "indonesia": tetap dalam Bahasa Indonesia, cukup ubah kata/susunan kalimatnya.
4. Judul hasil rewrite: maksimal sekitar 15 kata.
5. Ringkasan hasil rewrite: 1-2 kalimat, maksimal sekitar 200 karakter.
6. Pertahankan field "id" persis sama seperti input, untuk mencocokkan hasil.

Balas HANYA JSON valid dengan format:
{"hasil": [{"id": "...", "judul": "...", "ringkasan": "..."}]}`

  const userPrompt = `Parafrase (dan terjemahkan jika internasional) berita-berita berikut:

${JSON.stringify(
    items.map((i) => ({ id: i.id, judul: i.judul, ringkasan: i.ringkasan, asal: i.asal })),
    null,
    2
  )}`

  const raw = await groqChatWithRotation({
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.6,
    max_tokens: 4096,
    response_format: { type: 'json_object' },
  })

  const parsed = JSON.parse(raw)
  return parsed.hasil || []
}

export async function rewriteBeritaBatch(items: BeritaItem[]): Promise<HasilRewriteBerita[]> {
  if (items.length === 0) return []

  const batches: BeritaItem[][] = []
  for (let i = 0; i < items.length; i += UKURAN_BATCH_REWRITE) {
    batches.push(items.slice(i, i + UKURAN_BATCH_REWRITE))
  }

  const hasilSemua = await Promise.allSettled(batches.map(rewriteSatuBatch))

  const gabungan: HasilRewriteBerita[] = []
  for (const hasil of hasilSemua) {
    if (hasil.status === 'fulfilled') {
      gabungan.push(...hasil.value)
    }
    // Kalau satu batch gagal (rate limit/error), item di batch itu nanti
    // di-fallback ke versi asli (mentah) oleh pemanggil -- lihat lib/news/scraper.ts
  }

  return gabungan
}

// --- Generate artikel recap 800-1200 kata dari satu berita hasil scrape ---
// Dipakai oleh scripts/generate-berita-artikel.mjs (cron, kategori "Berita
// Terkini") -- disediakan juga di sini sebagai fungsi TS yang bisa dipakai
// admin panel nanti kalau perlu trigger manual dari UI (bukan cuma cron).
// CATATAN: scripts/generate-berita-artikel.mjs punya salinan prompt yang
// sama persis (Node ESM plain tidak bisa import modul TypeScript ini
// langsung) -- kalau prompt di sini diubah, sesuaikan juga di sana.
export async function generateArtikelDariBerita(
  berita: BeritaItem
): Promise<GenerateArtikelResponse & { sumberAsli: { nama: string; url: string } }> {
  const systemPrompt = `Kamu adalah Tim Redaksi APLESI (aplesi.my.id), menulis artikel recap & analisis berdasarkan berita perikanan yang sedang beredar.

ATURAN WAJIB (etis, anti-thin-content, anti-plagiarisme):
1. JANGAN menerjemahkan/menyalin ulang secara dekat dari ringkasan sumber -- tulis dari sudut pandang baru dengan analisis ASLI.
2. WAJIB ada nilai tambah nyata: apa artinya berita ini bagi pembudidaya ikan skala kecil-menengah di Indonesia? Dampak praktis, peluang, atau risiko apa yang relevan?
3. Kaitkan dengan topik budidaya ikan Aplesi yang relevan jika masuk akal (pakan, kolam, penyakit, dsb) -- tapi jangan dipaksakan.
4. WAJIB sertakan kalimat atribusi eksplisit di awal konten, contoh format: "Berdasarkan laporan dari [Nama Sumber] ([tanggal]), ..." -- ganti [Nama Sumber] dan [tanggal] sesuai data yang diberikan.
5. Panjang total 800-1200 kata, format Markdown, heading H2/H3, jawab inti tiap heading di kalimat pertama section itu (answer-first).
6. Tulis dalam Bahasa Indonesia yang baik dan benar.`

  const userPrompt = `Buat artikel recap & analisis dari berita berikut:

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
}`

  const raw = await groqChatWithRotation({
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 4096,
    response_format: { type: 'json_object' },
  })

  const parsed = JSON.parse(raw)

  return {
    judul: parsed.judul,
    ringkasan: parsed.ringkasan,
    konten: parsed.konten,
    tags: parsed.tags || [],
    seoTitle: parsed.seoTitle || parsed.judul.slice(0, 60),
    seoDesc: parsed.seoDesc || parsed.ringkasan.slice(0, 160),
    imagePrompt: parsed.imagePrompt || `${parsed.judul}, Indonesian aquaculture, realistic photography`,
    slug: slugify(parsed.judul),
    sumberAsli: { nama: berita.sumberNama, url: berita.link },
  }
}
