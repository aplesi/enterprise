import { AplesiRichDocument } from '../domain/rich-document'
import { EngineConfig } from './config'

export interface RuleContext {
  document: AplesiRichDocument
  config: EngineConfig
  meta?: {
    keywords?: string[]
    entities?: string[]
  }
}

export interface QualityRule {
  id: string
  title: string
  category: 'CONTENT' | 'SEO' | 'GEO' | 'ENTITY' | 'EEAT' | 'TECHNICAL' | 'READABILITY' | 'FRESHNESS'
  severity: 'CRITICAL' | 'WARNING' | 'INFO'
  maxScore: number
  evaluate: (ctx: RuleContext) => {
    passed: boolean
    score: number
    message: string
    recommendation: string
  }
}
