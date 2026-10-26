import { RuleContext, QualityRule } from '../engine/context'
import { AplesiRichDocument } from '../domain/rich-document'

export const MinimumFaqRule: QualityRule = {
  id: 'seo-min-faq',
  title: 'Minimum FAQ Elements',
  category: 'SEO',
  severity: 'CRITICAL',
  maxScore: 10,
  evaluate: (ctx: RuleContext) => {
    const doc: AplesiRichDocument = ctx.document
    
    // Find the FAQ section
    const faqSection = doc.sections.find(s => s.id === 'faq')
    if (!faqSection) {
      return {
        passed: false,
        score: 0,
        message: 'Section FAQ tidak ditemukan.',
        recommendation: 'Buat heading H2 dengan judul "FAQ" dan berikan daftar pertanyaan dan jawaban.'
      }
    }

    // In a real implementation, we'd use the faq extractor here
    // But since the extractor isn't fully ported to standard yet, we'll do a simple heuristic
    // or we can just count H3s inside the FAQ section.
    const h3CountInFaq = faqSection.content.match(/^### /gm)?.length || 0
    
    const passed = h3CountInFaq >= 4

    return {
      passed,
      score: passed ? 10 : Math.max(0, h3CountInFaq * 2),
      message: `Ditemukan ${h3CountInFaq} FAQ (Target: 4-6)`,
      recommendation: passed ? '' : `Tambahkan minimal 4 pertanyaan FAQ. Anda hanya membuat ${h3CountInFaq} pertanyaan.`
    }
  }
}

export const MinimumLinksRule: QualityRule = {
  id: 'seo-min-links',
  title: 'Minimum Internal/External Links',
  category: 'SEO',
  severity: 'WARNING',
  maxScore: 5,
  evaluate: (ctx: RuleContext) => {
    const doc: AplesiRichDocument = ctx.document
    
    const internalLinks = doc.globalLinks.filter(l => l.isInternal).length
    const externalLinks = doc.globalLinks.filter(l => !l.isInternal).length

    const passed = internalLinks >= 1 && externalLinks >= 1

    let score = 0
    if (internalLinks > 0) score += 2
    if (externalLinks > 0) score += 3

    return {
      passed,
      score,
      message: `Internal: ${internalLinks}, External: ${externalLinks}`,
      recommendation: passed ? '' : `Pastikan untuk menambahkan setidaknya 1 link internal dan 1 link eksternal yang relevan.`
    }
  }
}
