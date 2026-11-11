import { marked, Token, TokensList } from 'marked'
import { sanitizeLatexMath } from './ai/skills/article-writer-skill'

const CALLOUT_SELF_CLOSE_REGEX =
  /^\s*<p>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*<\/p>\s*([\s\S]*)$/i
const CALLOUT_INLINE_REGEX =
  /^\s*<p>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\](?:(?:\s*<br\s*\/?>\s*)+|\s+)([\s\S]*)$/i

function transformCalloutBlockquotes(html: string): string {
  return html.replace(/<blockquote>([\s\S]*?)<\/blockquote>/gi, (fullMatch, innerHtml: string) => {
    const selfClosedMatch = innerHtml.match(CALLOUT_SELF_CLOSE_REGEX)
    if (selfClosedMatch) {
      const calloutType = selfClosedMatch[1].toLowerCase()
      const bodyHtml = selfClosedMatch[2].trim()
      return `<div class="my-6 rounded-xl border border-aqua-glow/30 bg-aqua-glow/5 p-4 not-prose callout-box" data-callout="${calloutType}">\n${bodyHtml}\n</div>`
    }

    const inlineMatch = innerHtml.match(CALLOUT_INLINE_REGEX)
    if (inlineMatch) {
      const calloutType = inlineMatch[1].toLowerCase()
      const bodyHtml = `<p>${inlineMatch[2].trimStart()}`.trim()
      return `<div class="my-6 rounded-xl border border-aqua-glow/30 bg-aqua-glow/5 p-4 not-prose callout-box" data-callout="${calloutType}">\n${bodyHtml}\n</div>`
    }

    return fullMatch
  })
}

export function renderMarkdown(markdown: string): string {
  const cleanMarkdown = sanitizeLatexMath(markdown)
  const tokens = marked.lexer(cleanMarkdown)
  const groupedTokens: Token[][] = []
  let currentGroup: Token[] = []

  for (const token of tokens) {
    if (token.type === 'heading' && token.depth === 2) {
      if (currentGroup.length > 0) {
        groupedTokens.push(currentGroup)
      }
      currentGroup = [token]
    } else {
      currentGroup.push(token)
    }
  }
  
  if (currentGroup.length > 0) {
    groupedTokens.push(currentGroup)
  }

  let finalHtml = ''
  for (const group of groupedTokens) {
    const firstToken = group[0]
    
    // Cast kembali ke TokensList karena marked.parser membutuhkannya
    const tokenList = group as TokensList
    tokenList.links = tokens.links // Penting agar referensi link [id] tetap jalan
    
    const groupHtml = transformCalloutBlockquotes(marked.parser(tokenList))
    
    if (firstToken && firstToken.type === 'heading' && firstToken.depth === 2) {
      // Hilangkan karakter khusus untuk membuat id yang valid
      const id = firstToken.text.toLowerCase().replace(/[^\w]+/g, '-')
      finalHtml += `<section id="${id}">\n${groupHtml}</section>\n`
    } else {
      finalHtml += groupHtml
    }
  }

  return finalHtml
}
