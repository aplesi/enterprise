import { describe, it, expect } from 'vitest'
import { AI_STRUCTURE_PROMPT } from '@/prompts/index.mjs'

describe('Prompt Registry Regression', () => {
  it('should contain all 12 required sections in instructions', () => {
    // If someone modifies the AI instructions and removes these, 
    // the AI will stop generating them, breaking our Quality Engine.
    // This test prevents such regression.
    
    expect(AI_STRUCTURE_PROMPT).toContain('## Ringkasan Singkat')
    expect(AI_STRUCTURE_PROMPT).toContain('## Definisi')
    expect(AI_STRUCTURE_PROMPT).toContain('## Jawaban Singkat')
    expect(AI_STRUCTURE_PROMPT).toContain('## Penjelasan Lengkap')
    expect(AI_STRUCTURE_PROMPT).toContain('## Langkah-Langkah')
    expect(AI_STRUCTURE_PROMPT).toContain('## Tabel')
    expect(AI_STRUCTURE_PROMPT).toContain('## Checklist')
    expect(AI_STRUCTURE_PROMPT).toContain('## Studi Kasus')
    expect(AI_STRUCTURE_PROMPT).toContain('## FAQ')
    expect(AI_STRUCTURE_PROMPT).toContain('## Catatan Ahli APLESI')
    expect(AI_STRUCTURE_PROMPT).toContain('## Referensi')
    expect(AI_STRUCTURE_PROMPT).toContain('## Ringkasan Poin Penting')
  })
})
