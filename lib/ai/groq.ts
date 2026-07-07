// lib/ai/groq.ts
// Generate artikel menggunakan Groq API (gratis & super cepat)

import Groq from 'groq-sdk'
import type { GenerateArtikelRequest, GenerateArtikelResponse } from '@/types'
import { slugify } from '@/lib/utils'
import { templateFaqPrompt } from '@/lib/seo/faq'
import { templateHowToPrompt } from '@/lib/seo/howto'

let groqClient: Groq | null = null
const getGroq = () => {
  if (!groqClient) {
    groqClient = new Groq({
      apiKey: process.env.GROQ_API_KEY || 'dummy_key',
    })
  }
  return groqClient
}

const MODEL = 'llama-3.3-70b-versatile'

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
4. Jika artikel ini berupa panduan langkah-demi-langkah, gunakan heading H3 bernomor eksplisit ("### 1. Nama Langkah", "### 2. Nama Langkah", dst).`

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
  "seoDesc": "deskripsi SEO (max 160 karakter)"
}

Pastikan respons hanya JSON, tanpa teks tambahan apapun.`

  const completion = await getGroq().chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 4096,
    response_format: { type: 'json_object' },
  })

  const raw = completion.choices[0]?.message?.content
  if (!raw) throw new Error('Groq tidak mengembalikan respons')

  const parsed = JSON.parse(raw)

  return {
    judul: parsed.judul,
    ringkasan: parsed.ringkasan,
    konten: parsed.konten,
    tags: parsed.tags || [],
    seoTitle: parsed.seoTitle || parsed.judul.slice(0, 60),
    seoDesc: parsed.seoDesc || parsed.ringkasan.slice(0, 160),
    slug: slugify(parsed.judul),
  }
}

export async function generateJudul(topik: string, jumlah = 5): Promise<string[]> {
  const completion = await getGroq().chat.completions.create({
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

  const raw = completion.choices[0]?.message?.content || '{"judul":[]}'
  const parsed = JSON.parse(raw)
  return parsed.judul || parsed.titles || []
}
