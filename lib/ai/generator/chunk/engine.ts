import { groqChatWithRotation } from '../../groq'
import { Chunk, GenerationContext, SectionBlueprint } from '../types'
import { buildChunkContext } from './context'

export async function generateChunk(
  chunk: Chunk, 
  context: GenerationContext,
  completedSections: SectionBlueprint[]
): Promise<{ rawMarkdown: string }> {
  
  const chunkCtx = buildChunkContext(completedSections, chunk.sections)
  
  const prompt = `Tuliskan konten artikel bagian ini secara mendalam.
Topik Utama Artikel: ${context.topik}
Kategori: ${context.kategori}
Tone: ${context.tone}

${chunkCtx}

ATURAN KETAT:
1. HANYA tulis konten untuk "TUGASMU SAAT INI". Jangan tulis pendahuluan ulang atau kesimpulan jika bukan babnya.
2. Gunakan markdown (## untuk heading utama bab, ### untuk sub-bab).
3. Penuhi "Target Kata" dengan WAJIB menulis minimal 3-5 paragraf mendalam per sub-topik.
4. Jangan pelit kata. Berikan elaborasi, studi kasus, contoh nyata, data statistik imajiner yang masuk akal, dan analogi (tanpa kalimat basa-basi).
5. Gunakan semua entitas/keyword yang diminta.
6. Langsung keluarkan output Markdown murni, tanpa pengantar seperti "Berikut adalah...".
`

  let raw = await groqChatWithRotation({
    model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
    messages: [
      { role: 'system', content: 'Kamu adalah Pakar Konten APLESI yang menulis markdown teknis, mendalam, tanpa basa-basi (fluff-free).' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.3, // Rendah agar faktual dan terstruktur
  })
  
  let stripped = raw.trim()
  const match = stripped.match(/^```(?:markdown)?\s*\n?([\s\S]*?)\n?\s*```$/)
  if (match) stripped = match[1].trim()
  
  return { rawMarkdown: stripped }
}
