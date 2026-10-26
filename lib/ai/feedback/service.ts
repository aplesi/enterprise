import { QualityReport } from '../../quality/types'
import { FeedbackResult, FeedbackServiceConfig } from './types'
import { buildCorrectionPrompt } from './builder'

export function processQualityReport(
  report: QualityReport, 
  currentRetry: number, 
  config: FeedbackServiceConfig = { maxRetries: 2 }
): FeedbackResult {
  
  if (report.status === 'PASS' || report.status === 'WARNING') {
    return {
      needsRegeneration: false,
      promptSuffix: '',
      retryCount: currentRetry
    }
  }

  // If FAIL, check if we exceeded max retries
  if (currentRetry >= config.maxRetries) {
    console.warn(`[FeedbackService] Max retries (${config.maxRetries}) reached for failed article. Sending to Manual Review Queue.`)
    return {
      needsRegeneration: false,
      promptSuffix: '',
      retryCount: currentRetry
    }
  }

  // We need regeneration
  const promptSuffix = buildCorrectionPrompt(report)

  return {
    needsRegeneration: true,
    promptSuffix,
    retryCount: currentRetry + 1
  }
}
