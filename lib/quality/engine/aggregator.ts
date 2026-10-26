import { RuleResult } from '../types'
import { QualityRule, RuleContext } from './context'

export interface AggregatedResults {
  rules: RuleResult[]
  groupedByCategory: Record<string, RuleResult[]>
  warnings: string[]
  recommendations: string[]
}

export function aggregate(rules: QualityRule[], context: RuleContext): AggregatedResults {
  const aggregated: AggregatedResults = {
    rules: [],
    groupedByCategory: {},
    warnings: [],
    recommendations: []
  }

  for (const rule of rules) {
    const resultRaw = rule.evaluate(context)
    const result: RuleResult = {
      id: rule.id,
      title: rule.title,
      category: rule.category,
      severity: rule.severity,
      maxScore: rule.maxScore,
      passed: resultRaw.passed,
      score: resultRaw.score,
      message: resultRaw.message,
      recommendation: resultRaw.recommendation
    }

    aggregated.rules.push(result)
    
    if (!aggregated.groupedByCategory[result.category]) {
      aggregated.groupedByCategory[result.category] = []
    }
    aggregated.groupedByCategory[result.category].push(result)

    if (!result.passed) {
      if (result.severity === 'CRITICAL' || result.severity === 'WARNING') {
        aggregated.recommendations.push(result.recommendation)
      }
      if (result.severity === 'WARNING') {
        aggregated.warnings.push(result.message)
      }
    }
  }

  return aggregated
}
