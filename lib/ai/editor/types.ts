import { AplesiRichDocument } from '../../quality/domain/rich-document'
import { QualityReport } from '../../quality/types'

export type ArticleType = 'panduan' | 'opini' | 'berita' | 'studi_kasus'

export interface EditorRubric {
  articleType: ArticleType
  priorities: string[]
  strictRequirements: string[]
  toneOfVoice: string
}

export interface ReviewHistoryEntry {
  iteration: number
  score: number
  actionList: EditorialActionItem[]
}

export interface EditorContext {
  richDocument: AplesiRichDocument
  qualityReport: QualityReport
  reviewHistory: ReviewHistoryEntry[]
  rubric: EditorRubric
}

export type ActionPriority = 'HIGH' | 'MEDIUM' | 'LOW'
export type ActionType = 'REWRITE_SECTION' | 'ADD_FAQ' | 'REPLACE_TERM' | 'ADD_REFERENCE' | 'EXPAND_SECTION' | 'CLARIFY_CONCEPT' | 'ADD_SECTION'

export interface EditorialActionItem {
  type: ActionType
  targetSection: string
  instruction: string
  priority: ActionPriority
}

export interface EditorialMetrics {
  accuracy: number
  clarity: number
  consistency: number
}

export interface EditorialReport {
  status: 'PASS' | 'WARNING' | 'FAIL'
  confidenceScore: number
  needsHumanVerification: boolean
  overall: number
  metrics: EditorialMetrics
  hallucinationRisk: 'LOW' | 'MEDIUM' | 'HIGH'
  missingTopics: string[]
  weakSections: string[]
  strengths: string[]
  editorNotes: string[]
  actionList: EditorialActionItem[]
}
