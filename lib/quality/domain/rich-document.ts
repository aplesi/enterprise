import { AplesiDocument, AplesiSection } from '../../markdown/types'

export interface RichLink {
  href: string
  text: string
  isInternal: boolean
}

export interface AplesiRichSection extends AplesiSection {
  links: RichLink[]
  hasTable: boolean
  hasList: boolean
}

export interface AplesiRichDocument extends AplesiDocument {
  sections: AplesiRichSection[]
  globalLinks: RichLink[]
  headingsCount: Record<number, number>
}
