import { Chunk } from '../types'

export interface ChunkValidationResult {
  valid: boolean
  errors: string[]
}

export function validateChunk(chunk: Chunk, markdown: string): ChunkValidationResult {
  const errors: string[] = []
  
  // Word count check
  const wordCount = markdown.split(/\s+/).filter(Boolean).length
  const targetTotal = chunk.sections.reduce((acc, s) => acc + s.targetWords, 0)
  
  // Toleransi 30% dari target kata (LLM kadang kesulitan sangat presisi)
  const minWords = targetTotal * 0.7
  if (wordCount < minWords) {
    errors.push(`Chunk [${chunk.id}] terlalu pendek. Target: ~${targetTotal} kata. Aktual: ${wordCount} kata.`)
  }
  
  // Check headings exist
  const hasH2 = /^##\s+/m.test(markdown)
  if (!hasH2) {
    errors.push(`Chunk [${chunk.id}] tidak memiliki satupun Heading H2 (##).`)
  }
  
  return { valid: errors.length === 0, errors }
}
