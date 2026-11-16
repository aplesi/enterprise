import { groqChatWithRotation } from '../../groq'
import { ArticleBlueprint } from '../types'
import { buildTechnicalDomainBounds } from '../../skills/article-writer-skill'

export interface BuildOutlineRequest {
  topik: string
  kategori: string
  keywords: string[]
  targetWords: number
  existingTitles?: string[]
  retryErrors?: string[]
  attempt?: number
}

export async function buildOutline(req: BuildOutlineRequest): Promise<ArticleBlueprint> {
  const existingWarning = req.existingTitles && req.existingTitles.length > 0
    ? `\n9. DILARANG KERAS MENGULANG SUDUT PANDANG dari artikel-artikel yang sudah ada di database kami berikut:
${req.existingTitles.slice(0, 15).map(t => `- "${t}"`).join('\n')}
Pastikan judul dan struktur pembahasan mengambil sudut pandang baru, studi kasus praktis terkini, dan kata kunci turunan yang belum pernah dibahas untuk mencegah kanibalisasi kata kunci SEO.`
    : ''

  const retryFeedback = req.retryErrors && req.retryErrors.length > 0
    ? `\n\n⚠️ CATATAN PERBAIKAN WAJIB DARI PERCOBAAN SEBELUMNYA (Percobaan ke-${(req.attempt ?? 1) + 1}):
Percobaan sebelumnya ditolak validasi otomatis karena kesalahan berikut:
${req.retryErrors.map((err, i) => `  ${i + 1}. ${err}`).join('\n')}

PERBAIKAN MUTLAK YANG WAJIB DITERAPKAN:
- Buat minimal 8 hingga 15 bab (sections) H2 lengkap dan mendalam.
- Sertakan tepat satu bab khusus FAQ dengan properti "isFaq": true dan minimal 4-5 pertanyaan teknis di "faqsToAnswer".
- Alokasikan targetWords setiap bab sehingga total seluruh bab minimal ${req.targetWords} kata (jangan sampai di bawah target).
- Jangan gunakan karakter '#' pada nilai teks heading.
- Format respon HARUS berupa JSON valid tanpa teks pembuka/penutup di luar JSON.`
    : ''

  const prompt = `Buatkan struktur outline hierarkis untuk artikel blog AI-First APLESI berstandar Master Article Writer.
Topik: ${req.topik}
Kategori: ${req.kategori}
Keywords: ${req.keywords.join(', ')}
Target Kata Total: ${req.targetWords}

${buildTechnicalDomainBounds(req.topik)}

ATURAN STRUKTUR (GEO & SEO STANDAR):
1. Bagi artikel menjadi minimal 10 dan maksimal 15 section (H2).
2. Section 1 (Pembukaan): Wajib menyertakan blok "Ringkasan Inti (Key Takeaways)" berupa callout [!NOTE].
3. Wajib ada minimal satu section teknis yang memuat TABEL PARAMETER/KOMPARASI terstruktur.
4. Wajib ada minimal satu section yang memuat SOP BERTINGKAT atau FORMULA PERHITUNGAN matematis konkret (misal: FCR, dosis pakan biomassa, atau C/N rasio).
5. Tentukan targetWords untuk setiap section sehingga totalnya sekitar ${req.targetWords} kata.
6. Wajib ada minimal satu section khusus FAQ dengan 4-5 pertanyaan teknis spesifik.
7. Section terakhir harus berisi Kesimpulan dan Rekomendasi Aksi.
8. JANGAN gunakan bahasa yang bertele-tele di intent.${existingWarning}
9. JANGAN tambahkan karakter '#' pada properti heading.
10. TAHUN DAN WAKTU: Tahun saat ini adalah 2026. DILARANG KERAS mencantumkan tahun lampau seperti 2023, 2024, atau 2025 di judul maupun heading. Jika membutuhkan konteks waktu/tahun, gunakan '2026' atau format evergreen tanpa tahun.
11. GAMBAR UTAMA: Buat juga "imagePrompt" dalam Bahasa Inggris yang mendeskripsikan satu adegan visual dokumenter konkret dan spesifik di lapangan budidaya Indonesia (contoh: "Indonesian aquaculture technician checking lively whiteleg shrimp on a feeding tray outside pond edge").
12. Kamu WAJIB merespons dengan JSON valid yang sesuai persis dengan skema berikut:

{
  "title": "Judul SEO Friendly dan Otoritatif (Maks 60 Karakter)",
  "imagePrompt": "Deskripsi adegan visual dokumenter akuakultur konkret dalam Bahasa Inggris",
  "sections": [
    {
      "id": "slug-huruf-kecil-strip",
      "heading": "Teks Heading Section",
      "intent": "Deskripsi spesifik apa yang harus dibahas AI di bab ini agar mendalam dan tidak melenceng",
      "targetWords": 300,
      "entitiesToCover": ["keyword1", "parameter_sni", "istilah2"],
      "faqsToAnswer": ["Tanya teknis 1?", "Tanya teknis 2?"], // Opsional, wajib 4-5 tanya jika isFaq = true
      "isFaq": false // true/false
    }
  ]
}${retryFeedback}`

  const attempt = req.attempt || 0
  let temperature = 0.2
  if (attempt === 1) {
    temperature = 0.35
  } else if (attempt >= 2) {
    temperature = 0.45
  }

  let raw = await groqChatWithRotation({
    model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
    messages: [
      { role: 'system', content: 'Kamu adalah Principal Content Architect yang ahli merancang cetak biru (blueprint/outline) untuk artikel SEO super panjang, mendalam, tanpa fluff, dan berstruktur rapi.' },
      { role: 'user', content: prompt }
    ],
    temperature,
    response_format: { type: 'json_object' }
  })
  
  return parseOutlineJson(raw)
}

/**
 * Robust JSON extractor and parser for Groq outline responses.
 * Handles markdown code fences, surrounding conversational prose, and raw JSON strings.
 */
export function parseOutlineJson(raw: string): ArticleBlueprint {
  let s = raw.trim()
  const fenceMatch = s.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/)
  if (fenceMatch) {
    s = fenceMatch[1].trim()
  } else {
    const firstBrace = s.indexOf('{')
    const lastBrace = s.lastIndexOf('}')
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      s = s.slice(firstBrace, lastBrace + 1).trim()
    }
  }

  try {
    return JSON.parse(s) as ArticleBlueprint
  } catch (err: any) {
    try {
      return JSON.parse(raw.trim()) as ArticleBlueprint
    } catch {
      throw new Error(`Gagal parse JSON outline: ${err.message}. Output (150 char pertama): ${raw.slice(0, 150)}`)
    }
  }
}
