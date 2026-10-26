export function extractRingkasanSingkat(konten: string): string | null {
  const lines = konten.split('\n')
  let inSection = false
  let ringkasan = ''

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    if (line.startsWith('## ')) {
      const heading = line.replace(/^##\s+/, '').trim().toLowerCase()
      if (heading === 'ringkasan singkat') {
        inSection = true
        continue
      } else if (inSection) {
        break // Selesai jika ketemu heading lain
      }
    }

    if (inSection && line) {
      ringkasan += line + ' '
    }
  }

  return ringkasan.trim() || null
}
