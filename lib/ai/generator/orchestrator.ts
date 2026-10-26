import { buildOutline } from './outline/builder'
import { validateOutline } from './outline/validator'
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
}

export async function generateArticleV2(req: V2GeneratorRequest): Promise<{ konten: string, blueprint: ArticleBlueprint }> {
  console.log('[V2] 1. Generating Outline Blueprint...')
  let blueprint = await buildOutline(req)
  
  let outlineValidation = validateOutline(blueprint, req.targetWords)
  let retryCount = 0
  while (!outlineValidation.valid && retryCount < 3) {
    console.log(`[V2] Outline Validation Failed: ${outlineValidation.errors.join(', ')}. Retrying...`)
    blueprint = await buildOutline(req)
    outlineValidation = validateOutline(blueprint, req.targetWords)
    retryCount++
  }
  
  if (!outlineValidation.valid) {
    throw new Error(`Gagal membuat Outline yang valid setelah 3 percobaan: ${outlineValidation.errors.join(', ')}`)
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
    completedSections: []
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
