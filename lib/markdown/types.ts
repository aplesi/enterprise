export interface AplesiSection {
  id: string
  title: string
  content: string
  wordCount: number
  depth: number
}

export interface AplesiDocument {
  rawMarkdown: string
  frontmatter: Record<string, any>
  sections: AplesiSection[]
  totalWords: number
}
