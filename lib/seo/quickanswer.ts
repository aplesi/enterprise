export function extractQuickAnswer(konten: string): string | null {
  const lines = konten.split('\n')
  let inSection = false
  let quickAnswer = ''

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    if (line.startsWith('## ')) {
      const heading = line.replace(/^##\s+/, '').trim().toLowerCase()
      if (heading === 'jawaban singkat') {
        inSection = true
        continue
      } else if (inSection) {
        break // Selesai jika ketemu heading lain
      }
    }

    if (inSection && line) {
      quickAnswer += line + ' '
    }
  }

  return quickAnswer.trim() || null
}
