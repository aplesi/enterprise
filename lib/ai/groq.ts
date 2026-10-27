// lib/ai/groq.ts
// Generate artikel menggunakan Groq API (gratis & super cepat)

import type { GenerateArtikelRequest, GenerateArtikelResponse, BeritaItem } from '@/types'
import { slugify } from '@/lib/utils'
import { templateFaqPrompt } from '@/lib/seo/faq'
import { templateHowToPrompt } from '@/lib/seo/howto'
import { getArtikelTerkait } from '@/lib/db/artikel'
import { AI_STRUCTURE_PROMPT, JOURNALISM_NEWS_PROMPT } from '@/prompts/index.mjs'
import {
  getAvailableKey,
  markRateLimited,
  markSuccess,
  parseRetryAfter,
  GroqPoolExhaustedError,
  groqFetchChatCompletion,
  type GroqChatParams,
} from '@/lib/ai/groq-pool'

/**
 * Rakit image prompt deterministik dari judul + kategori.
 * Dioptimalkan untuk model FLUX-1 Schnell agar menghasilkan fotografi dokumenter
 * budidaya perikanan Indonesia yang realistis, bukan anatomi ikan close-up CGI/mutasi aneh.
 */
export function buildFallbackImagePrompt(judul: string, kategori: string): string {
  const cleanJudul = judul.replace(/[^\w\s-]/g, ' ').replace(/\s+/g, ' ').trim()

  const kategoriMap: Record<string, string> = {
    'Pembenihan': 'Indonesian freshwater fish hatchery facility, round nursery tanks with aeration, Indonesian aquaculture specialist inspecting clean water quality, morning daylight',
    'Pakan': 'Indonesian fish farmer scattering floating feed pellets into a large round biofloc pond, water splashes, wearing straw hat and farm boots, lush tropical farm backdrop',
    'Penyakit & Pengobatan': 'Indonesian fish farm technician testing water parameters with digital dissolved oxygen and pH probe at a biofloc pond, natural outdoor daylight',
    'Penyakit': 'Indonesian fish farm technician testing water parameters with digital dissolved oxygen and pH probe at a biofloc pond, natural outdoor daylight',
    'Manajemen Kolam': 'Rows of commercial round tarpaulin biofloc ponds under UV greenhouse net canopy in Indonesia, aerator splashing water, clean modern aquaculture infrastructure',
    'Kolam': 'Rows of commercial round tarpaulin biofloc ponds under UV greenhouse net canopy in Indonesia, aerator splashing water, clean modern aquaculture infrastructure',
    'Panen & Pascapanen': 'Indonesian local fish farmers sorting freshly harvested freshwater fish into clean plastic crates, sorting basin with clear water, early morning market preparation',
    'Panen': 'Indonesian local fish farmers sorting freshly harvested freshwater fish into clean plastic crates, sorting basin with clear water, early morning market preparation',
    'Bisnis & Pemasaran': 'Indonesian modern aquaculture agribusiness facility, catfish distribution center with aeration tanks, authentic rural commercial setting',
    'Bisnis': 'Indonesian modern aquaculture agribusiness facility, catfish distribution center with aeration tanks, authentic rural commercial setting',
    'Teknologi': 'Modern IoT-equipped Indonesian fish farm, smart water monitoring sensors mounted on round biofloc tank edge, clean technical setup, natural sunlight',
    'Tips & Trik': 'Experienced Indonesian fish farmer sharing practical knowledge beside outdoor fish ponds, friendly expression, authentic Indonesian rural setting',
    'Tips': 'Experienced Indonesian fish farmer sharing practical knowledge beside outdoor fish ponds, friendly expression, authentic Indonesian rural setting',
    'Berita Terkini': 'Indonesian fisheries and aquaculture port or commercial freshwater fish center, vibrant activity, authentic Indonesian maritime sector',
    'Berita': 'Indonesian fisheries and aquaculture port or commercial freshwater fish center, vibrant activity, authentic Indonesian maritime sector',
  }

  const scene = kategoriMap[kategori] || 'Indonesian fish farming facility with round biofloc tarpaulin tanks, lush tropical rural background'
  return `${scene}, context: ${cleanJudul.slice(0, 80)}, 35mm documentary photography, photojournalism style, natural ambient daylight, sharp focus, authentic Indonesian setting, no CGI, no cartoon, no distorted anatomy`
}

const MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b'

/**
 * Strip markdown code fence (```json ... ```) dari output Groq sebelum JSON.parse.
 * Groq kadang membungkus JSON di dalam fence meski sudah minta response_format: json_object.
 * Ini murah (regex) dan menghindari retry API call yang boros kuota.
 */
function stripJsonFence(raw: string): string {
  let s = raw.trim()
  // Strip ```json ... ``` atau ``` ... ```
  const fenceMatch = s.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?\s*```$/)
  if (fenceMatch) {
    s = fenceMatch[1].trim()
  }
  return s
}

/**
 * Parse JSON dari Groq dengan strip-fence otomatis.
 * Gagal → throw error yang jelas.
 */
function safeParseGroqJson<T>(raw: string): T {
  const stripped = stripJsonFence(raw)
  try {
    return JSON.parse(stripped) as T
  } catch {
    // Kalau strip gagal, coba parse raw asli (siapa tahu beda format)
    try {
      return JSON.parse(raw) as T
    } catch {
      throw new Error(
        `Gagal parse JSON dari Groq. Output (200 char pertama): ${raw.slice(0, 200)}`
      )
    }
  }
}

/**
 * Hitung jumlah kata dalam string markdown.
 * Strip heading markers, link syntax, dll untuk hitung lebih akurat.
 */
function countWords(text: string): number {
  return text
    .replace(/#{1,6}\s+/g, '')       // strip heading markers
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // [text](url) → text
    .replace(/[*_~`]+/g, '')          // strip emphasis markers
    .split(/\s+/)
    .filter((w) => w.length > 0).length
}

/**
 * Wrapper untuk chat completion Groq dengan rotasi key otomatis (raw fetch).
 * Jika key aktif kena 429, tandai rate limited lalu coba key berikutnya.
 * Maksimum 5 percobaan (sesuai jumlah key).
 */
export async function groqChatWithRotation(
  params: GroqChatParams

): Promise<string> {
  const maxAttempts = 5
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const state = await getAvailableKey()
    try {
      // Timeout 90 detik per percobaan — mencegah hang tanpa batas
      const content = await Promise.race([
        groqFetchChatCompletion(state.key, params),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Groq API timeout setelah 90 detik')), 90_000)
        ),
      ])
      markSuccess(state)
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
      // Connection error — langsung throw dengan pesan jelas
      if (errMsg.includes('fetch failed') || errMsg.includes('ECONNREFUSED') || errMsg.includes('ENOTFOUND') || errMsg.includes('UND_ERR_CONNECT_TIMEOUT')) {
        throw new Error(`Gagal terhubung ke Groq API (${state.label}): ${errMsg}`)
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

/**
 * Sisipkan section "Artikel Terkait" di akhir konten secara deterministik.
 * Query D1 by kategori — zero LLM cost, zero risk hallucinated slugs.
 */
async function appendInternalLinks(konten: string, kategori: string, slug: string): Promise<string> {
  try {
    const terkait = await getArtikelTerkait(kategori, slug, 3)
    if (terkait.length === 0) return konten

    const linksSection = terkait
      .map((a) => `- [${a.judul}](/artikel/${a.slug})`)
      .join('\n')

    return `${konten}\n\n## Baca Juga\n\n${linksSection}`
  } catch {
    // Gagal query D1 — kembalikan konten asli tanpa perubahan
    return konten
  }
}

export async function generateArtikel(
  req: GenerateArtikelRequest
): Promise<GenerateArtikelResponse> {
  const panjangMap = {
    pendek: { label: '500-700 kata', minWords: 500, maxTokens: 4096 },
    sedang: { label: '1000-1500 kata', minWords: 1000, maxTokens: 6144 },
    panjang: { label: '2000-2500 kata', minWords: 2000, maxTokens: 8192 },
  }

  const toneMap = {
    informatif: 'informatif dan edukatif, gaya bahasa formal tapi mudah dipahami',
    tutorial: 'step-by-step tutorial yang jelas dengan contoh praktis',
    berita: 'gaya jurnalistik, ringkas dan faktual',
  }

  const panjangConfig = panjangMap[req.panjang] || panjangMap['sedang']

  const systemPrompt = `Kamu adalah penulis konten profesional untuk website budidaya ikan "Aplesi" (aplesi.my.id), menulis atas nama Tim Redaksi APLESI berdasarkan praktik budidaya nyata.
Selalu tulis dalam Bahasa Indonesia yang baik dan benar.
Fokus pada konten praktis dan berguna untuk peternak ikan di Indonesia.
Gunakan heading H2 dan H3 yang terstruktur logis dan komprehensif.

⚠️ KUALITAS & KEDALAMAN KONTEN (PENTING):
- Target panjang konten: ${panjangConfig.label}.
- Prioritaskan KEDALAMAN MATERI (Deep Dive) daripada sekadar memperpanjang kalimat. Bahas sub-topik secara komprehensif (misal: Persiapan Kolam, Pemilihan Benih, Manajemen Pakan, Kualitas Air, Penanganan Penyakit, Pemanenan).
- HINDARI pengulangan kalimat (fluff) atau basa-basi yang tidak perlu hanya untuk menambah jumlah kata. Setiap paragraf harus memberikan nilai atau informasi teknis baru.
- Setiap section HARUS berisi penjelasan teknis yang mendalam, BUKAN hanya daftar bullet point dangkal.

⚠️ PENCEGAHAN HALUSINASI DATA:
- Sertakan estimasi data (durasi, ukuran kolam, padat tebar), namun PASTIKAN masuk akal secara keilmuan perikanan.
- Untuk data Harga (Rupiah) dan Dosis Obat/Kimia, JANGAN mengarang angka pasti yang berisiko menyesatkan peternak. Gunakan kata "estimasi rentang" (contoh: Rp 2.000.000 - Rp 3.000.000) dan tekankan bahwa harga/dosis "dapat bervariasi tergantung lokasi dan anjuran kemasan pabrik".

ATURAN FORMAT WAJIB (penting untuk SEO & agar dikutip AI/Google):
1. ANSWER-FIRST: di bawah SETIAP heading H2/H3, kalimat PERTAMA harus langsung menjawab inti topik heading tersebut -- bukan basa-basi pembuka. Kalimat selanjutnya baru berisi detail pendukung, alasan, atau langkah-langkah.
2. STRUKTUR PARAGRAF: Tiap paragraf sekitar 60-100 kata, satu ide utama per paragraf. Pecah paragraf yang terlalu panjang agar mudah dibaca di HP.
3. PANDUAN LANGKAH: Jika artikel berupa panduan langkah-demi-langkah, gunakan heading H3 bernomor eksplisit ("### 1. Nama Langkah", "### 2. Nama Langkah", dst).
4. KONTEKS LOKAL INDONESIA: Sebutkan tren pasar perikanan lokal, kondisi iklim tropis, atau referensi ke standar praktik KKP (Kementerian Kelautan dan Perikanan) jika relevan agar artikel terasa akrab bagi peternak lokal.

SETELAH menulis artikel, buat juga "imagePrompt": prompt image-generation dalam Bahasa Inggris untuk model FLUX-1. Prompt HARUS menggambarkan SATU adegan visual KONKRET dan SPESIFIK dari isi artikel yang baru kamu tulis (bukan dari judul saja). Ikuti aturan ketat ini:
- WAJIB sebutkan: jenis ikan/spesies yang dibahas, jenis kolam/media yang disebutkan, alat/bahan yang dipakai, tahapan spesifik yang sedang dijelaskan
- WAJIB sebutkan setting: indoor/outdoor, waktu (pagi/siang/sore), kondisi cuaca
- WAJIB sebutkan detail visual: warna air, warna ikan, tekstur pakan, material kolam
- KRITIS (IDENTITAS IKAN): Jika membahas ikan Lele/Lele Dumbo, KAMU WAJIB menggunakan bahasa Inggris: "African catfish, dark black skin, long whiskers/barbels, no scales, elongated body". JANGAN pernah hanya menulis "fish" atau AI akan menggambar ikan Koi/Mas. Jika membahas ikan Nila, gunakan "Tilapia fish".
- WAJIB akhiri dengan: "Indonesian aquaculture, natural lighting, editorial photography"
- JANGAN gunakan kata-kata abstrak seperti "modern", "professional", "advanced"
- JANGAN buat prompt umum — harus spesifik ke konten artikel
Contoh benar: "a young Indonesian farmer releasing thousands of tiny silver catfish fry into a rectangular concrete pond filled with green-tinged water, morning sunlight casting long shadows, plastic bucket nearby, rural Java village background, Indonesian aquaculture, natural lighting, editorial photography"
Contoh SALAH: "modern fish farming technology in Indonesia" (terlalu umum)`

  const userPrompt = `Tulis artikel tentang: "${req.topik}"

Kategori: ${req.kategori}
Keywords yang harus ada: ${req.keywords?.join(', ') || '-'}
Panjang: ${panjangConfig.label} — INI WAJIB DIPENUHI, jangan kurang dari ${panjangConfig.minWords} kata.
Gaya penulisan: ${toneMap[req.tone] || toneMap['informatif']}

${AI_STRUCTURE_PROMPT}

Target panjang total: 2000-3000 kata.

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
    max_tokens: panjangConfig.maxTokens,
    response_format: { type: 'json_object' },
  })

  let parsed = safeParseGroqJson<{
    judul: string
    ringkasan: string
    konten: string
    tags: string[]
    seoTitle: string
    seoDesc: string
    imagePrompt: string
  }>(raw)

  // --- Retry min-words: kalau konten terlalu pendek, minta model memperluas ---
  const actualWords = countWords(parsed.konten)
  if (actualWords < panjangConfig.minWords) {
    console.warn(
      `[Groq] Konten terlalu pendek: ${actualWords}/${panjangConfig.minWords} kata. Retry dengan prompt perluas...`
    )
    const retryRaw = await groqChatWithRotation({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
        { role: 'assistant', content: JSON.stringify(parsed) },
        {
          role: 'user',
          content: `Artikel di atas hanya ${actualWords} kata, kurang dari target ${panjangConfig.minWords} kata. PERLUAS artikel ini menjadi ${panjangConfig.label} dengan menambahkan:
- Detail lebih dalam di setiap section yang sudah ada
- Tambahkan 2-3 section baru yang relevan
- Sertakan lebih banyak data konkret (angka, biaya, durasi)
- Jangan hapus konten yang sudah ada, hanya TAMBAH dan PERLUAS

Respons format JSON yang sama.`,
        },
      ],
      temperature: 0.7,
      max_tokens: panjangConfig.maxTokens,
      response_format: { type: 'json_object' },
    })

    const retryParsed = safeParseGroqJson<typeof parsed>(retryRaw)
    const retryWords = countWords(retryParsed.konten)
    // Pakai hasil retry kalau lebih panjang
    if (retryWords > actualWords) {
      console.warn(`[Groq] Retry berhasil: ${actualWords} → ${retryWords} kata`)
      parsed = retryParsed
    }
  }

  const slug = slugify(parsed.judul)
  const kontenDenganLinks = await appendInternalLinks(parsed.konten, req.kategori, slug)

  return {
    judul: parsed.judul,
    ringkasan: parsed.ringkasan,
    konten: kontenDenganLinks,
    tags: parsed.tags || [],
    seoTitle: parsed.seoTitle || parsed.judul.slice(0, 60),
    seoDesc: parsed.seoDesc || parsed.ringkasan.slice(0, 160),
    imagePrompt: parsed.imagePrompt || buildFallbackImagePrompt(parsed.judul, req.kategori),
    slug,
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

  const parsed = safeParseGroqJson<{ judul: string[]; titles: string[] }>(raw)
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
  const systemPrompt = `Kamu adalah Redaktur Berita Agribisnis APLESI (aplesi.my.id).
Tugasmu: menulis ulang judul dan ringkasan berita perikanan menjadi berita jurnalistik yang tajam, kredibel, dan informatif.

ATURAN WAJIB:
1. JUDUL: Buat judul berita jurnalistik yang padat, lugas, dan akurat (maks 14 kata). Hindari judul kaku atau terjemahan mesin.
2. RINGKASAN: Tulis 1-2 kalimat (maks 180 karakter) menggunakan prinsip 5W+1H — langsung sebutkan peristiwa utama, pelaku/lembaga, dan dampaknya.
3. FAKTA TETAP 100% AKURAT: Jangan menambah fakta fiktif. Jika berita internasional (Inggris), terjemahkan ke Bahasa Indonesia jurnalistik yang mengalir alami.
4. BEBAS KODE HTML: Dilarang keras menyertakan tag HTML apa pun (<a, <font, &nbsp;, dll) dalam output.
5. Pertahankan field "id" persis sama seperti input, untuk mencocokkan hasil.

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

  const parsed = safeParseGroqJson<{ hasil: HasilRewriteBerita[] }>(raw)
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
  const systemPrompt = `Kamu adalah Redaktur Senior & Wartawan Investigasi Agribisnis Perikanan APLESI (aplesi.my.id), menulis liputan mendalam, kritis, dan berbobot berdasarkan fakta perikanan terkini.

ATURAN WAJIB (Jurnalisme Berkualitas, Anti-Thin-Content, Anti-Plagiarisme, Standar Google AdSense):
1. Tulis ULANG berita secara KOMPREHENSIF dengan sudut pandang jurnalisme agribisnis — JANGAN menyalin kalimat dari sumber. Gunakan piramida terbalik (5W+1H pada lead paragraf pertama).
2. WAJIB memasukkan SEMUA fakta, data kuantitatif, regulasi, nama pihak/lembaga, dan kutipan narasumber. KEMBANGKAN dengan analisis dampak ekonomi dan teknis.
3. SUDUT PANDANG PETERNAK RAKYAT: kupas tuntas dampaknya bagi pembudidaya ikan skala kecil-menengah di Indonesia (biaya pakan, benih, margin laba per kg, risiko air/cuaca, akses pasar).
4. DILARANG menggunakan kata klise AI seperti: "Di era digital yang pesat...", "Mari kita telusuri...", "Penting untuk diingat bahwa...", "Tidak dapat dipungkiri...".
5. WAJIB sertakan kalimat atribusi eksplisit di AKHIR konten: "Artikel analisis ini disusun oleh Tim Redaksi APLESI berdasarkan data dan laporan dari [Nama Sumber] ([tanggal])."
6. Panjang total 1000-1500 kata, format Markdown, heading H2/H3.
7. Tulis dalam Bahasa Indonesia baku, lugas, mengalir, dan bernas.`

  const userPrompt = `Buat artikel berita analisis mendalam berdasarkan informasi berikut:

Judul asli: "${berita.judul}"
Ringkasan asli: "${berita.ringkasan}"
Sumber: ${berita.sumberNama}
Tanggal: ${berita.tanggal}
Asal: ${berita.asal === 'internasional' ? 'media internasional (berbahasa Inggris)' : 'media Indonesia'}

${JOURNALISM_NEWS_PROMPT}

Setelah artikel, buat juga "imagePrompt": prompt image-generation dalam Bahasa Inggris untuk FLUX-1 / Stable Diffusion dengan gaya photojournalism dokumenter autentik (contoh: "editorial documentary photography, Indonesian fish farmers inspecting aquaculture pond at morning, realistic texture, natural lighting, shot on 35mm lens, high resolution photojournalism, authentic, no CGI, no 3D cartoon").

Respons hanya JSON:
{
  "judul": "...",
  "ringkasan": "... (max 160 karakter)",
  "konten": "... (markdown, 1000-1500 kata)",
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

  let parsed = safeParseGroqJson<{
    judul: string
    ringkasan: string
    konten: string
    tags: string[]
    seoTitle: string
    seoDesc: string
    imagePrompt: string
  }>(raw)

  // --- Retry min-words: kalau konten terlalu pendek, minta model memperluas ---
  const minWordsBerita = 800
  const actualWords = countWords(parsed.konten)
  if (actualWords < minWordsBerita) {
    console.warn(
      `[Groq] Konten berita terlalu pendek: ${actualWords}/${minWordsBerita} kata. Retry...`
    )
    const retryRaw = await groqChatWithRotation({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
        { role: 'assistant', content: JSON.stringify(parsed) },
        {
          role: 'user',
          content: `Artikel recap di atas hanya ${actualWords} kata, kurang dari target 800-1200 kata. PERLUAS dengan:
- Tambahkan analisis dampak lebih mendalam bagi pembudidaya
- Tambahkan data/contoh spesifik terkait topik berita
- Tambahkan section baru: "Dampak bagi Pembudidaya Lokal" dan "Langkah yang Bisa Diambil"
- Jangan hapus konten yang sudah ada, hanya TAMBAH dan PERLUAS

Respons format JSON yang sama.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 4096,
      response_format: { type: 'json_object' },
    })

    const retryParsed = safeParseGroqJson<typeof parsed>(retryRaw)
    const retryWords = countWords(retryParsed.konten)
    if (retryWords > actualWords) {
      console.warn(`[Groq] Retry berita berhasil: ${actualWords} → ${retryWords} kata`)
      parsed = retryParsed
    }
  }

  return {
    judul: parsed.judul,
    ringkasan: parsed.ringkasan,
    konten: parsed.konten,
    tags: parsed.tags || [],
    seoTitle: parsed.seoTitle || parsed.judul.slice(0, 60),
    seoDesc: parsed.seoDesc || parsed.ringkasan.slice(0, 160),
    imagePrompt: parsed.imagePrompt || buildFallbackImagePrompt(parsed.judul, 'Berita'),
    slug: slugify(parsed.judul),
    sumberAsli: { nama: berita.sumberNama, url: berita.link },
  }
}
