import { AplesiRichDocument } from '../../quality/domain/rich-document'
import { QualityReport } from '../../quality/types'
import { loadRubric } from './rubric'
import { ArticleType, EditorContext, ReviewHistoryEntry } from './types'

export function buildEditorContext(
  richDocument: AplesiRichDocument,
  qualityReport: QualityReport,
  articleType: ArticleType,
  reviewHistory: ReviewHistoryEntry[] = []
): EditorContext {
  const rubric = loadRubric(articleType)

  return {
    richDocument,
    qualityReport,
    rubric,
    reviewHistory
  }
}

export function formatContextForLLM(context: EditorContext): string {
  const { richDocument, qualityReport, rubric, reviewHistory } = context

  let out = `=======================================\n`
  out += `METADATA ARTIKEL\n`
  out += `=======================================\n`
  out += `Tipe Artikel: ${rubric.articleType.toUpperCase()}\n`
  out += `Judul: ${richDocument.frontmatter.judul || 'Tanpa Judul'}\n`
  out += `Total Kata: ${richDocument.totalWords}\n\n`

  out += `=======================================\n`
  out += `RUBRIK EDITORIAL (WAJIB DIPATUHI)\n`
  out += `=======================================\n`
  out += `Prioritas Evaluasi:\n${rubric.priorities.map(p => `- ${p}`).join('\n')}\n\n`
  out += `Aturan Ketat:\n${rubric.strictRequirements.map(s => `- ${s}`).join('\n')}\n\n`
  out += `Tone of Voice: ${rubric.toneOfVoice}\n\n`

  out += `=======================================\n`
  out += `LAPORAN MESIN KUALITAS (LINTER)\n`
  out += `=======================================\n`
  out += `Skor Mekanis: ${qualityReport.overall}/100\n`
  if (qualityReport.recommendations.length > 0) {
    out += `Masalah Tersisa:\n${qualityReport.recommendations.map(r => `- ${r}`).join('\n')}\n`
  } else {
    out += `Status Linter: Lulus Sempurna.\n`
  }
  out += `\n`

  if (reviewHistory.length > 0) {
    out += `=======================================\n`
    out += `RIWAYAT REVIEW SEBELUMNYA\n`
    out += `=======================================\n`
    out += `Penulis AI telah mencoba memperbaiki artikel ini ${reviewHistory.length} kali.\n`
    const lastReview = reviewHistory[reviewHistory.length - 1]
    out += `Skor Review Terakhir: ${lastReview.score}/100\n`
    out += `Action List yang seharusnya diperbaiki penulis:\n`
    lastReview.actionList.forEach(a => {
      out += `- [${a.targetSection}] ${a.type}: ${a.instruction}\n`
    })
    out += `\nPERINGATAN: Periksa apakah penulis AI benar-benar memperbaiki hal di atas. Jika mereka mengabaikannya, hukum skor mereka dengan keras.\n\n`
  }

  out += `=======================================\n`
  out += `KONTEN ARTIKEL (MARKDOWN)\n`
  out += `=======================================\n`
  out += `${richDocument.rawMarkdown}\n`

  return out
}
