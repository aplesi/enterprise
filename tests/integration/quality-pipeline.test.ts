import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { evaluateMarkdown } from '@/lib/quality/engine/core'
import { processQualityReport } from '@/lib/ai/feedback/service'

describe('Quality Pipeline Integration', () => {
  it('should pass perfect article', () => {
    const raw = fs.readFileSync(path.join(__dirname, '../fixtures/markdown/article-perfect.md'), 'utf-8')
    const report = evaluateMarkdown(raw)
    
    // Check report status
    if (report.status !== 'PASS') {
      console.log('FAILING RECOMMENDATIONS:', report.recommendations)
      console.log('OVERALL SCORE:', report.overall)
      console.log('CATEGORIES:', report.categories)
    }
    expect(report.status).toBe('PASS')
    expect(report.overall).toBeGreaterThanOrEqual(90)
    
    // Feedback service should say no regeneration needed
    const feedback = processQualityReport(report, 0)
    expect(feedback.needsRegeneration).toBe(false)

    // Snapshot the report to catch unintended changes (ignoring dynamic duration)
    const { durationMs, ...snapshotReport } = report
    expect(snapshotReport).toMatchSnapshot()
  })

  it('should fail article missing FAQ', () => {
    const raw = fs.readFileSync(path.join(__dirname, '../fixtures/markdown/article-missing-faq.md'), 'utf-8')
    const report = evaluateMarkdown(raw)
    
    // Check report status
    expect(report.status).toBe('FAIL')
    expect(report.overall).toBeLessThan(80)
    expect(report.recommendations.length).toBeGreaterThan(0)
    
    // Feedback service should construct prompt
    const feedback = processQualityReport(report, 0)
    expect(feedback.needsRegeneration).toBe(true)
    expect(feedback.promptSuffix).toContain('FAQ')

    const { durationMs, ...snapshotReport } = report
    expect(snapshotReport).toMatchSnapshot()
  })
})
