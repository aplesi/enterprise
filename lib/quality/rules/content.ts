import { RuleContext, QualityRule } from '../engine/context'
import { AplesiRichDocument } from '../domain/rich-document'

const REQUIRED_SECTIONS = [
  'ringkasan-singkat',
  'definisi',
  'jawaban-singkat',
  'penjelasan-lengkap',
  'langkah-langkah',
  'checklist',
  'studi-kasus',
  'faq',
  'catatan-ahli-aplesi',
  'referensi',
  'ringkasan-poin-penting'
]

export const MinimumWordCountRule: QualityRule = {
  id: 'content-min-words',
  title: 'Minimum Word Count',
  category: 'CONTENT',
  severity: 'CRITICAL',
  maxScore: 10,
  evaluate: (ctx: RuleContext) => {
    const doc: AplesiRichDocument = ctx.document
    const minWords = 1000
    const passed = doc.totalWords >= minWords
    
    return {
      passed,
      score: passed ? 10 : Math.max(0, Math.floor((doc.totalWords / minWords) * 10)),
      message: `Total kata: ${doc.totalWords}. Target: ${minWords}.`,
      recommendation: passed ? '' : `Artikel terlalu pendek (${doc.totalWords} kata). Tambahkan penjelasan lebih mendalam pada bagian Penjelasan Lengkap agar mencapai minimal ${minWords} kata.`
    }
  }
}

export const RequiredSectionsRule: QualityRule = {
  id: 'content-required-sections',
  title: 'Required Dynamic Sections AI-First',
  category: 'CONTENT',
  severity: 'CRITICAL',
  maxScore: 20,
  evaluate: (ctx: RuleContext) => {
    const doc: AplesiRichDocument = ctx.document
    const missing: string[] = []

    if (doc.sections.length < 8) {
      missing.push(`Minimal 8 sections H2 (ditemukan ${doc.sections.length})`)
    }

    const hasFaq = doc.sections.some(s => s.id.includes('faq') || s.id.includes('pertanyaan'))
    if (!hasFaq) {
      missing.push('Section khusus FAQ')
    }

    const passed = missing.length === 0
    const score = passed ? 20 : 0

    return {
      passed,
      score,
      message: passed ? 'Semua section dasar lengkap' : `Missing structure: ${missing.join(', ')}`,
      recommendation: passed ? '' : `Pastikan kerangka outline memiliki setidaknya 8 bab dan mencakup bab FAQ.`
    }
  }
}
