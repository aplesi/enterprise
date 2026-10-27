import { groqChatWithRotation } from '../../groq'
import { ArticleBlueprint } from '../types'
import { buildTechnicalDomainBounds } from '../../skills/article-writer-skill'

export async function buildOutline(req: { topik: string, kategori: string, keywords: string[], targetWords: number, existingTitles?: string[] }): Promise<ArticleBlueprint> {
  const existingWarning = req.existingTitles && req.existingTitles.length > 0
    ? `\n9. DILARANG KERAS MENGULANG SUDUT PANDANG dari artikel-artikel yang sudah ada di database kami berikut:
${req.existingTitles.slice(0, 15).map(t => `- "${t}"`).join('\n')}
Pastikan judul dan struktur pembahasan mengambil sudut pandang baru, studi kasus praktis terkini, dan kata kunci turunan yang belum pernah dibahas untuk mencegah kanibalisasi kata kunci SEO.`
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
11. Kamu WAJIB merespons dengan JSON valid yang sesuai persis dengan skema berikut:

{
  "title": "Judul SEO Friendly dan Otoritatif (Maks 60 Karakter)",
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
}`

  let raw = await groqChatWithRotation({
    model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
    messages: [
      { role: 'system', content: 'Kamu adalah Principal Content Architect yang ahli merancang cetak biru (blueprint/outline) untuk artikel SEO super panjang, mendalam, tanpa fluff, dan berstruktur rapi.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.2,
    response_format: { type: 'json_object' }
  })
  
  let stripped = raw.trim()
  const match = stripped.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?\s*```$/)
  if (match) stripped = match[1].trim()
  
  return JSON.parse(stripped) as ArticleBlueprint
}
