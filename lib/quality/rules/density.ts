import { RuleContext, QualityRule } from '../engine/context'
import { AplesiRichDocument } from '../domain/rich-document'

export const InformationDensityRule: QualityRule = {
  id: 'content-density',
  title: 'Information Density Validator (TTR)',
  category: 'READABILITY',
  severity: 'CRITICAL',
  maxScore: 15,
  evaluate: (ctx: RuleContext) => {
    const doc: AplesiRichDocument = ctx.document
    
    // Hitung Lexical Diversity (Type-Token Ratio)
    // TTR = Unique Words / Total Words
    const words = doc.rawMarkdown.toLowerCase().match(/\b\w+\b/g) || []
    if (words.length === 0) {
      return { passed: false, score: 0, message: 'Artikel kosong', recommendation: '' }
    }
    
    const uniqueWords = new Set(words)
    const ttr = uniqueWords.size / words.length
    
    // Ambang batas TTR untuk artikel teknis panjang biasanya > 0.35 (35%)
    // Jika artikel > 2000 kata, TTR wajar menurun ke ~0.25 - 0.35
    const threshold = 0.25
    const passed = ttr >= threshold
    
    const score = passed ? 15 : Math.max(0, Math.floor((ttr / threshold) * 15))
    
    return {
      passed,
      score,
      message: `TTR (Information Density): ${(ttr * 100).toFixed(1)}%. Ambang batas: ${(threshold * 100).toFixed(1)}%`,
      recommendation: passed ? '' : 'Artikel ini terdeteksi menggunakan banyak kata berulang (fluff/repetitif). Pertimbangkan untuk menggunakan kosakata yang lebih kaya dan memperluas topik.'
    }
  }
}
