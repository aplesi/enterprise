import { groqChatWithRotation } from '../../groq'
import { Chunk, GenerationContext, SectionBlueprint } from '../types'
import { buildChunkContext } from './context'
import { buildTechnicalDomainBounds } from '../../skills/article-writer-skill'

export async function generateChunk(
  chunk: Chunk, 
  context: GenerationContext,
  completedSections: SectionBlueprint[]
): Promise<{ rawMarkdown: string }> {
  
  const chunkCtx = buildChunkContext(completedSections, chunk.sections)
  
  let internalLinkInstruction = ''
  if (context.internalLinkTargets && context.internalLinkTargets.length > 0) {
    internalLinkInstruction = `\n7. JIKA RELEVAN, sisipkan 1 tautan internal menggunakan format Markdown: [Anchor Text Alami](/artikel/slug-artikel) memilih dari daftar artikel resmi APLESI berikut:
${context.internalLinkTargets.map(t => `- [${t.judul}](/artikel/${t.slug})`).join('\n')}
(Jangan paksa jika tidak relevan, dan DILARANG membuat link ke slug lain di luar daftar di atas).`
  }

  const prompt = `Tuliskan konten artikel bagian ini secara mendalam berstandar Master Article Writer APLESI.
Topik Utama Artikel: ${context.topik}
Kategori: ${context.kategori}
Tone: ${context.tone}

${buildTechnicalDomainBounds()}

${chunkCtx}

ATURAN PENULISAN (GEO & TEKNIS):
1. HANYA tulis konten untuk "TUGASMU SAAT INI". Jangan tulis pendahuluan ulang atau kesimpulan jika bukan babnya.
2. Gunakan markdown (## untuk heading utama bab, ### untuk sub-bab).
3. DIRECT ANSWER LEAD-IN: Awali setiap heading ## dengan 40–60 kata paragraf pembuka yang langsung memberikan jawaban lugas, definisi, atau kesimpulan faktual sebelum menguraikan detail.
4. Penuhi "Target Kata" dengan WAJIB menulis minimal 3-5 paragraf mendalam per sub-topik.
5. Jika bab ini memuat tabel atau formula SOP, formatlah dengan tabel Markdown (| Parameter | Nilai | ...) dan rumus matematis yang jelas.
6. Gunakan semua entitas/keyword teknis yang diminta tanpa basa-basi (fluff-free).${internalLinkInstruction}
8. Langsung keluarkan output Markdown murni, tanpa pengantar seperti "Berikut adalah...".`

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
