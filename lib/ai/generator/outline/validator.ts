import { ArticleBlueprint, ArticleBlueprintSchema } from '../types'

export interface OutlineValidationResult {
  valid: boolean
  errors: string[]
}

export function validateOutline(blueprint: ArticleBlueprint, targetWords: number = 2000): OutlineValidationResult {
  const errors: string[] = []
  
  // 1. Zod Schema Validation
  const parsed = ArticleBlueprintSchema.safeParse(blueprint)
  if (!parsed.success) {
    parsed.error.errors.forEach(e => {
      errors.push(`Format Error [${e.path.join('.')}]: ${e.message}`)
    })
    return { valid: false, errors } // Return early if schema fails
  }
  
  // 2. Business Logic Validation
  const totalWords = blueprint.sections.reduce((acc, sec) => acc + sec.targetWords, 0)
  
  if (totalWords < targetWords - 200) {
    errors.push(`Total word budget (${totalWords}) jauh di bawah target minimum (${targetWords}).`)
  }
  
  const hasFaq = blueprint.sections.some(s => s.isFaq)
  if (!hasFaq) {
    errors.push('Outline harus memiliki setidaknya satu section khusus FAQ (isFaq = true).')
  }
  
  // Check section properties
  blueprint.sections.forEach((sec, idx) => {
    if (sec.heading.includes('#')) {
      errors.push(`Section [${sec.id}] memiliki karakter '#' pada heading. Heading harus plain text.`)
    }
    if (sec.isFaq && (!sec.faqsToAnswer || sec.faqsToAnswer.length === 0)) {
      errors.push(`Section [${sec.id}] ditandai isFaq = true, tapi faqsToAnswer kosong.`)
    }
    if (sec.targetWords < 100) {
      errors.push(`Section [${sec.id}] targetWords terlalu sedikit (${sec.targetWords}). Minimal 100 kata per bab.`)
    }
  })
  
  return { valid: errors.length === 0, errors }
}
