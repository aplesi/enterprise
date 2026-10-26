import matter from 'gray-matter'
import { marked } from 'marked'
import { AplesiDocument, AplesiSection } from './types'

function wordCount(text: string): number {
  if (!text) return 0
  return text.trim().split(/\s+/).filter(Boolean).length
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export function parseMarkdown(rawContent: string): AplesiDocument {
  const { data: frontmatter, content } = matter(rawContent)
  const tokens = marked.lexer(content)
  
  const sections: AplesiSection[] = []
  let currentSection: AplesiSection | null = null
  let totalWords = 0

  for (const token of tokens) {
    if (token.type === 'heading' && token.depth === 2) {
      // If we already have a section, push it
      if (currentSection) {
        currentSection.wordCount = wordCount(currentSection.content)
        totalWords += currentSection.wordCount
        sections.push(currentSection)
      }
      
      currentSection = {
        id: slugify(token.text),
        title: token.text,
        content: '',
        wordCount: 0,
        depth: token.depth
      }
    } else if (currentSection && token.raw) {
      currentSection.content += token.raw
    }
  }

  // Push the last section
  if (currentSection) {
    currentSection.wordCount = wordCount(currentSection.content)
    totalWords += currentSection.wordCount
    sections.push(currentSection)
  }

  return {
    rawMarkdown: content,
    frontmatter,
    sections,
    totalWords
  }
}
