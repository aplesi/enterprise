import { QualityReport } from '../../quality/types'

export function buildCorrectionPrompt(report: QualityReport): string {
  if (report.recommendations.length === 0) {
    return ''
  }

  let prompt = `\n\n[KOREKSI WAJIB]\nArtikel yang Anda hasilkan sebelumnya GAGAL memenuhi standar kualitas kami (Skor: ${report.overall}).\n`
  prompt += `Perbaiki artikel Anda dengan FOKUS pada instruksi berikut tanpa merusak bagian lain yang sudah benar:\n\n`
  
  report.recommendations.forEach((rec, index) => {
    prompt += `${index + 1}. ${rec}\n`
  })

  prompt += `\nPastikan format tetap menggunakan struktur 12 Section AI-First yang diinstruksikan sebelumnya.`

  return prompt
}
