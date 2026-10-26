import { SectionBlueprint } from '../types'

export function buildChunkContext(
  completedSections: SectionBlueprint[],
  currentSections: SectionBlueprint[]
): string {
  let ctx = ''
  
  if (completedSections.length > 0) {
    ctx += 'BAB SEBELUMNYA (JANGAN DIULANG ATAU DIDEFINISIKAN ULANG):\n'
    completedSections.forEach(s => {
      ctx += `- ${s.heading}\n`
    })
    ctx += '\n'
  }
  
  ctx += 'TUGASMU SAAT INI (TULIS BAB BERIKUT INI):\n'
  currentSections.forEach(s => {
    ctx += `## ${s.heading}\n`
    ctx += `Target Kata: ${s.targetWords} kata\n`
    ctx += `Intent/Tujuan Bab: ${s.intent}\n`
    ctx += `Wajib Dibahas (Entities): ${s.entitiesToCover.join(', ')}\n`
    if (s.isFaq && s.faqsToAnswer && s.faqsToAnswer.length > 0) {
      ctx += `Daftar FAQ (Gunakan ### untuk tiap tanya): ${s.faqsToAnswer.join(', ')}\n`
    }
    ctx += '\n'
  })
  
  return ctx
}
