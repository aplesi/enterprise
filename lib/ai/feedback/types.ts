import { QualityReport } from '../../quality/types'

export interface FeedbackResult {
  needsRegeneration: boolean
  promptSuffix: string
  retryCount: number
}

export interface FeedbackServiceConfig {
  maxRetries: number
}
