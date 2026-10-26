export function extractChecklist(konten: string): string[] {
  const lines = konten.split('\n')
  let inSection = false
  const checklistItems: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    if (line.startsWith('## ')) {
      const heading = line.replace(/^##\s+/, '').trim().toLowerCase()
      if (heading === 'checklist') {
        inSection = true
        continue
      } else if (inSection) {
        break // Selesai
      }
    }

    if (inSection) {
      if (line.startsWith('- [ ] ') || line.startsWith('- [x] ') || line.startsWith('- [X] ')) {
        const itemText = line.replace(/^- \[[ xX]\] /, '').trim()
        if (itemText) {
          checklistItems.push(itemText)
        }
      }
    }
  }

  return checklistItems
}
