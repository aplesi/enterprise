// lib/seo/faq.ts
// Extract FAQ dari konten artikel Markdown
// Pola yang dikenali: heading H2/H3 yang berbentuk pertanyaan (mengandung kata tanya)

const KATA_TANYA = [
  'apa', 'apakah', 'bagaimana', 'berapa', 'kapan', 'kenapa',
  'mengapa', 'dimana', 'di mana', 'siapa', 'bisakah', 'bisa',
  'bolehkah', 'haruskah', 'cara', 'how', 'what', 'why', 'when',
  'where', 'which', 'who', 'can', 'should', 'perbedaan', 'bedanya',
]

interface FaqItem {
  pertanyaan: string
  jawaban: string
}

export function extractFaq(konten: string): FaqItem[] {
  const lines = konten.split('\n')
  const faqItems: FaqItem[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // Deteksi heading H2 atau H3
    const isHeading = line.startsWith('## ') || line.startsWith('### ')
    if (!isHeading) continue

    const headingText = line.replace(/^#{2,3}\s+/, '').trim()
    const lowerText = headingText.toLowerCase()

    // Cek apakah heading berbentuk pertanyaan
    const adaKataTanya = KATA_TANYA.some((kata) => lowerText.startsWith(kata) || lowerText.includes(` ${kata} `))
    const adaTandaTanya = headingText.endsWith('?')
    const adalahPertanyaan = adaKataTanya || adaTandaTanya

    if (!adalahPertanyaan) continue

    // Ambil paragraf jawaban setelah heading (sampai heading berikutnya)
    const jawabanLines: string[] = []
    for (let j = i + 1; j < lines.length; j++) {
      const nextLine = lines[j].trim()

      // Berhenti jika ketemu heading baru
      if (nextLine.startsWith('#')) break

      // Ambil paragraf yang tidak kosong
      if (nextLine && !nextLine.startsWith('```') && !nextLine.startsWith('|')) {
        // Bersihkan markdown formatting
        const bersih = nextLine
          .replace(/\*\*(.*?)\*\*/g, '$1') // bold
          .replace(/\*(.*?)\*/g, '$1')     // italic
          .replace(/\[(.*?)\]\(.*?\)/g, '$1') // link
          .replace(/`(.*?)`/g, '$1')       // code
          .trim()

        if (bersih) jawabanLines.push(bersih)
        if (jawabanLines.length >= 3) break // max 3 paragraf untuk FAQ
      }
    }

    if (jawabanLines.length > 0) {
      const pertanyaan = adaTandaTanya ? headingText : `${headingText}?`
      faqItems.push({
        pertanyaan,
        jawaban: jawabanLines.join(' '),
      })
    }

    // Batasi max 6 FAQ per artikel
    if (faqItems.length >= 6) break
  }

  return faqItems
}

// Buat FAQ otomatis dari topik artikel (digunakan saat generate dengan Groq)
export function templateFaqPrompt(topik: string): string {
  return `
Di akhir artikel, tambahkan section "## Pertanyaan yang Sering Diajukan" dengan 3-5 pertanyaan relevan tentang "${topik}" beserta jawabannya yang singkat dan informatif. Format:

## Pertanyaan yang Sering Diajukan

### Apa itu [topik terkait]?
[Jawaban singkat 2-3 kalimat]

### Bagaimana cara [aksi terkait topik]?
[Jawaban singkat 2-3 kalimat]

[dst...]
`
}
