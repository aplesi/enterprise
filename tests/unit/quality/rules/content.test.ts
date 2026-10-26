import { describe, it, expect } from 'vitest'
import { MinimumWordCountRule, RequiredSectionsRule } from '@/lib/quality/rules/content'
import { RuleContext } from '@/lib/quality/engine/context'
import { AplesiRichDocument } from '@/lib/quality/domain/rich-document'
import { DEFAULT_CONFIG } from '@/lib/quality/engine/config'

describe('Content Rules', () => {
  it('MinimumWordCountRule should fail if words < 1000', () => {
    const doc = { totalWords: 500 } as AplesiRichDocument
    const ctx: RuleContext = { document: doc, config: DEFAULT_CONFIG }
    
    const result = MinimumWordCountRule.evaluate(ctx)
    expect(result.passed).toBe(false)
    expect(result.score).toBe(5) // 500/1000 * 10
  })

  it('RequiredSectionsRule should fail if missing sections', () => {
    const doc = { 
      sections: [{ id: 'ringkasan-singkat' }] 
    } as AplesiRichDocument
    
    const ctx: RuleContext = { document: doc, config: DEFAULT_CONFIG }
    const result = RequiredSectionsRule.evaluate(ctx)
    
    expect(result.passed).toBe(false)
    // 1 section present, 10 missing, penalty is 10 * 2 = 20. Score should be max(0, 20-20) = 0
    expect(result.score).toBe(0)
  })
})
