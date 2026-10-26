export function extractReferensi(konten: string): string[] {
  const lines = konten.split('\n')
  let inSection = false
  const referensiUrls: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    if (line.startsWith('## ')) {
      const heading = line.replace(/^##\s+/, '').trim().toLowerCase()
      if (heading === 'referensi') {
        inSection = true
        continue
      } else if (inSection) {
        break // Selesai
      }
    }

    if (inSection) {
      // Cari URL di dalam line, misalnya [Teks](URL) atau hanya URL biasa
      // Ini regex sederhana untuk markdown links
      const mdLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g
      let match
      while ((match = mdLinkRegex.exec(line)) !== null) {
        referensiUrls.push(match[2])
      }
      
      // Jika tidak ada format markdown, mungkin URL polos tapi diawali bullet
      if (!line.match(mdLinkRegex)) {
        const urlRegex = /(https?:\/\/[^\s]+)/g
        let urlMatch
        while ((urlMatch = urlRegex.exec(line)) !== null) {
          referensiUrls.push(urlMatch[1])
        }
      }
    }
  }

  // Hapus duplikat
  return Array.from(new Set(referensiUrls))
}
