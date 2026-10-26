import { describe, it, expect } from 'vitest'
import { enrichDocument } from '@/lib/quality/enrichment/enricher'
import { AplesiDocument } from '@/lib/markdown/types'

describe('Document Enricher', () => {
  it('should extract internal and external links', () => {
    const doc: AplesiDocument = {
      rawMarkdown: '',
      frontmatter: {},
      totalWords: 10,
      sections: [
        {
          id: 'test',
          title: 'Test',
          content: 'Ini [Internal](/link) dan [Eksternal](https://google.com).',
          wordCount: 10,
          depth: 2
        }
      ]
    }

    const rich = enrichDocument(doc)
    expect(rich.globalLinks.length).toBe(2)
    
    const internal = rich.globalLinks.find(l => l.text === 'Internal')
    const external = rich.globalLinks.find(l => l.text === 'Eksternal')
    
    expect(internal?.isInternal).toBe(true)
    expect(external?.isInternal).toBe(false)
  })

  it('should detect tables and lists', () => {
    const doc: AplesiDocument = {
      rawMarkdown: '',
      frontmatter: {},
      totalWords: 20,
      sections: [
        {
          id: 's1',
          title: 'Table Section',
          content: '| A | B |\n|---|---|\n| 1 | 2 |',
          wordCount: 10,
          depth: 2
        },
        {
          id: 's2',
          title: 'List Section',
          content: '- List 1\n- List 2',
          wordCount: 10,
          depth: 2
        }
      ]
    }

    const rich = enrichDocument(doc)
    expect(rich.sections[0].hasTable).toBe(true)
    expect(rich.sections[0].hasList).toBe(false)
    expect(rich.sections[1].hasTable).toBe(false)
    expect(rich.sections[1].hasList).toBe(true)
  })
})
