import { AplesiDocument, AplesiSection } from '../../markdown/types'
import { AplesiRichDocument, AplesiRichSection, RichLink } from '../domain/rich-document'

function extractLinks(markdown: string): RichLink[] {
  const links: RichLink[] = []
  // Match markdown links: [text](url)
  const regex = /\[([^\]]+)\]\(([^)]+)\)/g
  let match
  while ((match = regex.exec(markdown)) !== null) {
    const text = match[1]
    const href = match[2]
    links.push({
      href,
      text,
      isInternal: href.startsWith('/') || href.startsWith('#') || href.includes('aplesi.my.id')
    })
  }
  return links
}

function hasTable(markdown: string): boolean {
  return /\|.*\|.*\n\|[-:| ]+\|/m.test(markdown)
}

function hasList(markdown: string): boolean {
  return /^[-*+]\s+|^[0-9]+\.\s+/m.test(markdown)
}

export function enrichDocument(doc: AplesiDocument): AplesiRichDocument {
  const globalLinks: RichLink[] = []
  const headingsCount: Record<number, number> = {}
  
  const richSections: AplesiRichSection[] = doc.sections.map((section: AplesiSection) => {
    const links = extractLinks(section.content)
    globalLinks.push(...links)
    
    // Track heading depths
    headingsCount[section.depth] = (headingsCount[section.depth] || 0) + 1

    return {
      ...section,
      links,
      hasTable: hasTable(section.content),
      hasList: hasList(section.content)
    }
  })

  return {
    ...doc,
    sections: richSections,
    globalLinks,
    headingsCount
  }
}
