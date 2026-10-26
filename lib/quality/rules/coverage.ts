import { RuleContext, QualityRule } from '../engine/context'
import { AplesiRichDocument } from '../domain/rich-document'

export const CoverageSuiteRule: QualityRule = {
  id: 'content-coverage-suite',
  title: 'Coverage Suite (Entity, Keyword, FAQ)',
  category: 'ENTITY',
  severity: 'WARNING',
  maxScore: 20,
  evaluate: (ctx: RuleContext) => {
    const doc: AplesiRichDocument = ctx.document
    const meta = ctx.meta || {}
    const textLower = doc.rawMarkdown.toLowerCase()
    
    let score = 20
    const missing: string[] = []
    
    // 1. Entity & Keyword Coverage
    const allKeywords = [...(meta.keywords || []), ...(meta.entities || [])]
    const uniqueKeywords = [...new Set(allKeywords.map(k => k.toLowerCase()))]
    
    if (uniqueKeywords.length > 0) {
      let foundCount = 0
      for (const kw of uniqueKeywords) {
        if (textLower.includes(kw)) {
          foundCount++
        } else {
          missing.push(`Keyword: ${kw}`)
        }
      }
      const coverageRatio = foundCount / uniqueKeywords.length
      if (coverageRatio < 0.8) {
        score -= 10
      }
    }
    
    // 2. Internal Link & Reference Coverage (Simplistic check)
    if (doc.globalLinks.length === 0) {
      missing.push('Tidak ada external/internal links')
      score -= 5
    }
    
    // 3. FAQ Coverage
    const hasFaq = doc.sections.some(s => s.id.includes('faq') || s.id.includes('pertanyaan'))
    if (!hasFaq) {
      missing.push('FAQ Section Missing')
      score -= 5
    }

    const passed = score >= 15
    
    return {
      passed,
      score: Math.max(0, score),
      message: passed ? 'Coverage sangat baik' : `Terdapat coverage yang kurang: ${missing.join(', ')}`,
      recommendation: passed ? '' : `Pastikan untuk memasukkan keywords/entitas berikut ke dalam artikel dan lengkapi FAQ serta referensi.`
    }
  }
}
