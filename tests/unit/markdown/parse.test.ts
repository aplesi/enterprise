import { describe, it, expect } from 'vitest'
import { parseMarkdown } from '@/lib/markdown/parse'

describe('Markdown Parser', () => {
  it('should parse frontmatter and content correctly', () => {
    const raw = `---
title: "Test"
---
## Heading 1
Content 1
`
    const doc = parseMarkdown(raw)
    
    expect(doc.frontmatter.title).toBe('Test')
    expect(doc.sections.length).toBe(1)
    expect(doc.sections[0].id).toBe('heading-1')
    expect(doc.sections[0].title).toBe('Heading 1')
    expect(doc.sections[0].content).toContain('Content 1')
  })

  it('should calculate word count properly', () => {
    const raw = `## Section A
Satu dua tiga empat lima.`
    const doc = parseMarkdown(raw)
    expect(doc.totalWords).toBe(5)
    expect(doc.sections[0].wordCount).toBe(5)
  })
})
