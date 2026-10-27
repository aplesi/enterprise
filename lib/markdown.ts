import { marked, Token, TokensList } from 'marked'
import { sanitizeLatexMath } from './ai/skills/article-writer-skill'

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
    
    const groupHtml = marked.parser(tokenList)
    
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
