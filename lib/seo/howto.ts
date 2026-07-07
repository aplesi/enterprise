// lib/seo/howto.ts
// Extract langkah-langkah (HowTo steps) dari konten artikel Markdown.
// Pola yang dikenali: section H2/H3 dengan heading yang diawali angka
// ("1. Persiapan Kolam", "### 2. Penebaran Benih", dst) -- pola yang
// sudah dipakai natural di beberapa artikel panduan APLESI.

export interface HowToStep {
  nama: string
  teks: string
}

const NUMBERED_HEADING = /^#{2,3}\s+(\d+)[.)]\s*(.+)$/

export function extractHowToSteps(konten: string): HowToStep[] {
  const lines = konten.split('\n')
  const steps: HowToStep[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    const match = line.match(NUMBERED_HEADING)
    if (!match) continue

    const nama = match[2].trim()

    // Ambil isi section sampai heading berikutnya
    const isiLines: string[] = []
    for (let j = i + 1; j < lines.length; j++) {
      const nextLine = lines[j].trim()
      if (nextLine.startsWith('#')) break
      if (nextLine && !nextLine.startsWith('```')) {
        const bersih = nextLine
          .replace(/\*\*(.*?)\*\*/g, '$1')
          .replace(/\*(.*?)\*/g, '$1')
          .replace(/\[(.*?)\]\(.*?\)/g, '$1')
          .replace(/`(.*?)`/g, '$1')
          .replace(/^[-*]\s+/, '')
          .trim()
        if (bersih) isiLines.push(bersih)
      }
      if (isiLines.length >= 4) break
    }

    if (isiLines.length > 0) {
      steps.push({ nama, teks: isiLines.join(' ') })
    }
  }

  return steps
}

// Panduan format bagi Groq AI saat generate artikel baru, supaya langkah-langkah
// otomatis terdeteksi extractHowToSteps() di atas.
export function templateHowToPrompt(topik: string): string {
  return `
Jika artikel ini berbentuk panduan langkah-demi-langkah tentang "${topik}", susun bagian langkah-langkahnya sebagai heading H3 bernomor eksplisit, contoh:

### 1. [Nama langkah pertama]
[Penjelasan langkah, 100-150 kata]

### 2. [Nama langkah kedua]
[Penjelasan langkah, 100-150 kata]

[dst, minimal 3 langkah]
`
}
