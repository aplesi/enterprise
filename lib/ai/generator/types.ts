import { z } from 'zod'

export const SectionBlueprintSchema = z.object({
  id: z.string().describe('ID unik section (slug dari heading)'),
  heading: z.string().describe('Heading H2 dari section ini (tanpa prefix #)'),
  intent: z.string().describe('Tujuan spesifik dari section ini dan apa yang harus dijawab/dibahas'),
  targetWords: z.number().describe('Target budget jumlah kata untuk section ini'),
  entitiesToCover: z.array(z.string()).describe('Entitas, istilah, atau keyword yang wajib muncul'),
  faqsToAnswer: z.array(z.string()).optional().describe('Daftar pertanyaan FAQ (hanya jika ini section FAQ)'),
  isFaq: z.boolean().default(false).describe('Apakah ini section khusus FAQ?')
})

export type SectionBlueprint = z.infer<typeof SectionBlueprintSchema>

export const ArticleBlueprintSchema = z.object({
  title: z.string().describe('Judul utama artikel (H1)'),
  sections: z.array(SectionBlueprintSchema).min(8).max(15).describe('Daftar urutan section dari atas ke bawah')
})

export type ArticleBlueprint = z.infer<typeof ArticleBlueprintSchema>

export interface Chunk {
  id: string
  sections: SectionBlueprint[]
}

export interface GenerationContext {
  topik: string
  kategori: string
  keywords: string[]
  tone: string
  previousContentSummary: string
  completedSections: string[]
}
