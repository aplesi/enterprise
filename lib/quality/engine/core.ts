import { parseMarkdown } from '../../markdown/parse'
import { enrichDocument } from '../enrichment/enricher'
import { DEFAULT_CONFIG, EngineConfig } from './config'
import { registry } from './registry'
import { aggregate } from './aggregator'
import { scoreAggregatedResults } from './scorer'
import { QualityReport } from '../types'

// Ensure we load rules
import '../rules'

export function evaluateMarkdown(
  markdown: string, 
  config: EngineConfig = DEFAULT_CONFIG,
  meta?: { keywords?: string[], entities?: string[] }
): QualityReport {
  const startTime = Date.now()

  // 1. Parse and Enrich
  const baseDoc = parseMarkdown(markdown)
  const richDoc = enrichDocument(baseDoc)

  // 2. Setup Context
  const context = {
    document: richDoc,
    config,
    meta
  }

  // 3. Aggregate Rules
  const rules = registry.getRules()
  const aggregated = aggregate(rules, context)

  // 4. Score
  const scoreResult = scoreAggregatedResults(aggregated)

  // 5. Determine Gate Status
  let status: 'PASS' | 'WARNING' | 'FAIL' = 'PASS'
  if (scoreResult.overall < config.failThreshold) {
    status = 'FAIL'
  } else if (scoreResult.overall < config.warningThreshold) {
    status = 'WARNING'
  }

  const durationMs = Date.now() - startTime

  return {
    status,
    overall: scoreResult.overall,
    durationMs,
    engineVersion: '1.0.0',
    promptVersion: 3, // Assuming version 3 based on structure setup
    categories: scoreResult.categories,
    rules: aggregated.rules,
    warnings: aggregated.warnings,
    recommendations: aggregated.recommendations
  }
}
