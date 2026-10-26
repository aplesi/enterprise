import { ArticleBlueprint } from '../types'

export function assembleArticle(blueprint: ArticleBlueprint, chunksMarkdown: string[]): string {
  let finalMarkdown = ''
  
  chunksMarkdown.forEach((chunk, index) => {
    finalMarkdown += chunk.trim()
    if (index < chunksMarkdown.length - 1) {
      finalMarkdown += '\n\n'
    }
  })
  
  // Smart Assembler / Deterministic Harmonizer
  // 1. Cleanup excessive newlines
  finalMarkdown = finalMarkdown.replace(/\n{3,}/g, '\n\n')
  
  // 2. Ensure headings have a space after hashes (e.g. ##Heading -> ## Heading)
  finalMarkdown = finalMarkdown.replace(/^(#+)([^#\s])/gm, '$1 $2')
  
  // 3. Ensure bullet lists have a space after dash or asterisk
  finalMarkdown = finalMarkdown.replace(/^([-*])([^-\s])/gm, '$1 $2')
  
  // 4. Standardize bold formatting so there's no space inside asterisks (e.g. ** bold ** -> **bold**)
  finalMarkdown = finalMarkdown.replace(/\*\*\s+(.*?)\s+\*\*/g, '**$1**')
  
  return finalMarkdown.trim()
}
