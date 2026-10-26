import { describe, it, expect } from 'vitest'
import { MinimumFaqRule, MinimumLinksRule } from '@/lib/quality/rules/seo'
import { RuleContext } from '@/lib/quality/engine/context'
import { AplesiRichDocument } from '@/lib/quality/domain/rich-document'
import { DEFAULT_CONFIG } from '@/lib/quality/engine/config'

describe('SEO Rules', () => {
  it('MinimumFaqRule should pass if FAQ section has >= 4 H3s', () => {
    const doc = {
      sections: [{
        id: 'faq',
        content: '### Q1\nA1\n### Q2\nA2\n### Q3\nA3\n### Q4\nA4\n'
      }]
    } as unknown as AplesiRichDocument
    const ctx: RuleContext = { document: doc, config: DEFAULT_CONFIG }
    
    const result = MinimumFaqRule.evaluate(ctx)
    expect(result.passed).toBe(true)
    expect(result.score).toBe(10)
  })

  it('MinimumFaqRule should fail if FAQ section missing', () => {
    const doc = { sections: [] } as unknown as AplesiRichDocument
    const ctx: RuleContext = { document: doc, config: DEFAULT_CONFIG }
    
    const result = MinimumFaqRule.evaluate(ctx)
    expect(result.passed).toBe(false)
    expect(result.score).toBe(0)
  })

  it('MinimumLinksRule should pass if internal and external link exist', () => {
    const doc = {
      globalLinks: [
        { isInternal: true, text: 'A', href: '/a' },
        { isInternal: false, text: 'B', href: 'https://b.com' }
      ]
    } as unknown as AplesiRichDocument
    const ctx: RuleContext = { document: doc, config: DEFAULT_CONFIG }
    
    const result = MinimumLinksRule.evaluate(ctx)
    expect(result.passed).toBe(true)
    expect(result.score).toBe(5)
  })
})
