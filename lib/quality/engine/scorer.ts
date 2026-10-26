import { AggregatedResults } from './aggregator'
import { CategoryWeights } from '../config/weights'
import { QualityReportCategory } from '../types'

export interface ScorerResult {
  overall: number
  categories: Record<string, QualityReportCategory>
}

export function scoreAggregatedResults(aggregated: AggregatedResults): ScorerResult {
  const categories: Record<string, QualityReportCategory> = {}
  let overallScore = 0

  let totalWeightUsed = 0

  for (const [category, rules] of Object.entries(aggregated.groupedByCategory)) {
    let score = 0
    let maxScore = 0

    for (const rule of rules) {
      score += rule.score
      maxScore += rule.maxScore
    }

    const percentage = maxScore === 0 ? 100 : (score / maxScore) * 100
    categories[category] = { score, maxScore, percentage }

    const weight = CategoryWeights[category] || 0
    overallScore += (percentage * weight)
    totalWeightUsed += weight
  }

  // Normalize if not all categories have rules implemented yet
  if (totalWeightUsed > 0 && totalWeightUsed < 1) {
    overallScore = overallScore / totalWeightUsed
  }

  return {
    overall: Math.round(overallScore),
    categories
  }
}
