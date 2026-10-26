import { groqChatWithRotation } from '../../groq'
import { ArticleBlueprint } from '../types'

export async function buildOutline(req: { topik: string, kategori: string, keywords: string[], targetWords: number }): Promise<ArticleBlueprint> {
  const prompt = `Buatkan struktur outline hierarkis untuk artikel blog AI-First APLESI.
Topik: ${req.topik}
Kategori: ${req.kategori}
Keywords: ${req.keywords.join(', ')}
Target Kata Total: ${req.targetWords}

ATURAN:
1. Bagi artikel menjadi minimal 10 dan maksimal 15 section (H2).
2. Tentukan targetWords untuk setiap section sehingga totalnya sekitar ${req.targetWords} kata. Berikan budget yang logis (misal: 150 untuk pembukaan, 350-500 untuk inti, 400 untuk FAQ).
3. Harus ada minimal satu section khusus FAQ.
4. Section terakhir harus berisi Kesimpulan.
5. JANGAN gunakan bahasa yang bertele-tele di intent.
6. JANGAN tambahkan karakter '#' pada properti heading.
7. Kamu WAJIB merespons dengan JSON valid yang sesuai persis dengan skema berikut:

{
  "title": "Judul SEO Friendly (Maks 60 Karakter)",
  "sections": [
    {
      "id": "slug-huruf-kecil-strip",
      "heading": "Teks Heading Section",
      "intent": "Deskripsi spesifik apa yang harus dibahas AI di bab ini agar tidak melenceng",
      "targetWords": 300,
      "entitiesToCover": ["keyword1", "istilah2"],
      "faqsToAnswer": ["Tanya 1?", "Tanya 2?"], // Opsional, wajib isi jika isFaq = true
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
