import { buildOutline } from './outline/builder'
import { validateOutline } from './outline/validator'
import { healOutlineIfNeeded, generateEmergencyFallbackBlueprint } from './outline/healer'
import { generateChunk } from './chunk/engine'
import { validateChunk } from './chunk/validator'
import { assembleArticle } from './assembler/compiler'
import { ArticleBlueprint, Chunk, GenerationContext, SectionBlueprint } from './types'

export interface V2GeneratorRequest {
  topik: string
  kategori: string
  keywords: string[]
  targetWords: number
  tone: string
  existingTitles?: string[]
  internalLinkTargets?: Array<{ slug: string; judul: string }>
}

export async function generateArticleV2(req: V2GeneratorRequest): Promise<{ konten: string, blueprint: ArticleBlueprint }> {
  console.log('[V2] 1. Generating Outline Blueprint with Master Writer Skill...')
  
  let blueprint: ArticleBlueprint | null = null
  let outlineValidation: { valid: boolean; errors: string[] } = { valid: false, errors: [] }
  let retryErrors: string[] = []

  // Multi-Tier Resilience Loop (Lapis 1 - 3)
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`[V2] Outline Retry (attempt ${attempt + 1}) with errors feedback: ${retryErrors.join('; ')}`)
      }

      const rawBlueprint = await buildOutline({
        ...req,
        retryErrors: retryErrors.length > 0 ? retryErrors : undefined,
        attempt
      })

      // Lapis 2: Self-Healing Engine (Auto-Repair untuk 6-7 bab, FAQ, & word budget)
      const healedBlueprint = healOutlineIfNeeded(rawBlueprint, req.targetWords)
      const validation = validateOutline(healedBlueprint, req.targetWords)

      if (validation.valid) {
        blueprint = healedBlueprint
        outlineValidation = validation
        break
      } else {
        console.warn(`[V2] Outline Validation Failed (attempt ${attempt + 1}): ${validation.errors.join(', ')}`)
        retryErrors = validation.errors
      }
    } catch (err: any) {
      console.warn(`[V2] Outline Generation Exception (attempt ${attempt + 1}):`, err.message)
      retryErrors = [`Gagal parse respon outline: ${err.message}`]
    }
  }

  // Lapis 4: Emergency Fallback Template (Jaminan Zero Failure jika seluruh percobaan LLM gagal)
  if (!blueprint || !outlineValidation.valid) {
    console.warn(`[V2] ⚠️ Seluruh percobaan outline LLM ditolak/gagal. Mengaktifkan Lapis 4: Emergency Fallback Blueprint...`)
    const emergencyBlueprint = generateEmergencyFallbackBlueprint(req)
    blueprint = healOutlineIfNeeded(emergencyBlueprint, req.targetWords)
    outlineValidation = validateOutline(blueprint, req.targetWords)
    console.log(`[V2] Emergency Fallback Blueprint aktif: "${blueprint.title}" (${blueprint.sections.length} bab).`)
  }

  console.log(`[V2] Outline Validated. Title: ${blueprint.title}. Sections: ${blueprint.sections.length}`)
  
  // Create Chunks (Group every 1 section into 1 chunk to force deep generation)
  const chunkSize = 1
  const chunks: Chunk[] = []
  for (let i = 0; i < blueprint.sections.length; i += chunkSize) {
    chunks.push({
      id: `chunk-${i/chunkSize + 1}`,
      sections: blueprint.sections.slice(i, i + chunkSize)
    })
  }
  
  console.log(`[V2] Created ${chunks.length} Chunks for generation.`)
  
  const context: GenerationContext = {
    topik: req.topik,
    kategori: req.kategori,
    keywords: req.keywords,
    tone: req.tone,
    previousContentSummary: '',
    completedSections: [],
    internalLinkTargets: req.internalLinkTargets,
  }
  
  const chunksMarkdown: string[] = []
  const completedSections: SectionBlueprint[] = []
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    console.log(`\n[V2] Generating Chunk ${i+1}/${chunks.length} (${chunk.sections.map(s => s.heading).join(', ')})`)
    
    let chunkMarkdown = ''
    let chunkRetry = 0
    let chunkValid = false
    
    while (!chunkValid && chunkRetry < 3) {
      const result = await generateChunk(chunk, context, completedSections)
      chunkMarkdown = result.rawMarkdown
      
      const validation = validateChunk(chunk, chunkMarkdown)
      if (validation.valid) {
        chunkValid = true
      } else {
        console.log(`[V2] Chunk Validation Failed: ${validation.errors.join(', ')}. Retrying chunk...`)
        chunkRetry++
      }
    }
    
    chunksMarkdown.push(chunkMarkdown)
    completedSections.push(...chunk.sections)
  }
  
  console.log('\n[V2] All chunks generated. Assembling Article...')
  const finalContent = assembleArticle(blueprint, chunksMarkdown)
  
  return { konten: finalContent, blueprint }
}
