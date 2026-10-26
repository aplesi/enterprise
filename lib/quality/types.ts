export interface RuleResult {
  id: string
  title: string
  category: 'CONTENT' | 'SEO' | 'GEO' | 'ENTITY' | 'EEAT' | 'TECHNICAL' | 'READABILITY' | 'FRESHNESS'
  severity: 'CRITICAL' | 'WARNING' | 'INFO'
  score: number
  maxScore: number
  passed: boolean
  message: string
  recommendation: string
}

export interface QualityReportCategory {
  score: number
  maxScore: number
  percentage: number
}

export interface QualityReport {
  status: 'PASS' | 'WARNING' | 'FAIL'
  overall: number
  durationMs: number
  engineVersion: string
  promptVersion: number
  categories: Record<string, QualityReportCategory>
  rules: RuleResult[]
  warnings: string[]
  recommendations: string[]
}
