import { describe, it, expect } from 'vitest'
import {
  validatePrePublishQualityGates,
  sanitizeLatexMath,
  detectCommodity,
  COMMODITY_STANDARDS,
} from '@/lib/ai/skills/article-writer-skill'

describe('article-writer-skill Pre-Publish Quality Gates', () => {
  it('validates a well-formed markdown article with callout, table, and FAQ', () => {
    const markdown = `# Manajemen Kualitas Air Budidaya Lele

> [!NOTE]
> Kualitas air optimal adalah kunci pencegahan penyakit pada budidaya lele bioflok.

## Parameter Kualitas Air SNI
Berikut tabel parameter standar:

| Parameter | Ambang Batas | Satuan |
| :--- | :--- | :--- |
| Suhu | 25 - 30 | °C |
| pH | 6.5 - 8.5 | - |
| DO | > 3.0 | mg/L |

Formula perhitungan dosis pakan biomassa: Pakan = Biomassa x 3% per hari.

## Pertanyaan yang Sering Diajukan (FAQ)

### Berapa frekuensi pergantian air kolam lele?
Air diganti 10-20% setiap 1-2 minggu tergantung kejernihan dan amonia.

### Bagaimana cara mengukur amonia terlarut?
Gunakan test kit fotometer atau strip uji amonia secara berkala.

### Kapan probiotik harus ditambahkan?
Probiotik diberikan setiap 3-5 hari atau setelah penambahan air baru.
`

    const report = validatePrePublishQualityGates(markdown)
    expect(report.valid).toBe(true)
    expect(report.errors).toHaveLength(0)
    expect(report.sanitized).toContain('> [!NOTE]')
  })

  it('catches missing callout, missing table, and incomplete FAQ', () => {
    const invalidMarkdown = `# Judul Tanpa Komponen Wajib

Ini adalah konten polos tanpa intisari callout dan tanpa tabel apapun.

## FAQ
### Hanya satu tanya?
Jawaban singkat.
`

    const report = validatePrePublishQualityGates(invalidMarkdown)
    expect(report.valid).toBe(false)
    expect(report.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('blok ringkasan intisari callout'),
        expect.stringContaining('tabel parameter'),
        expect.stringContaining('Seksi FAQ baru memiliki 1 pertanyaan'),
      ])
    )
  })

  it('sanitizes inline LaTeX leaks automatically', () => {
    const markdownWithLatex = `# Judul Artikel

> [!NOTE]
> Ringkasan inti teknis.

Kadar $CaCO_3$ kolam harus dijaga. Rumus: $\\text{FCR} = \\frac{\\text{Pakan}}{\\text{Biomassa}}$.

| Bahan | Takaran |
| :--- | :--- |
| Kapur | 50 g/m2 |
`

    const report = validatePrePublishQualityGates(markdownWithLatex)
    expect(report.sanitized).not.toContain('$')
    expect(report.sanitized).not.toContain('\\frac')
    expect(report.sanitized).not.toContain('\\text')
    expect(report.sanitized).toContain('CaCO3')
    expect(report.sanitized).toContain('FCR')
  })

  it('has standards for all 12 SNI commodities', () => {
    const commodities = [
      'lele', 'nila', 'patin', 'gurame', 'gabus', 'bawal',
      'udang_galah', 'kakap', 'bandeng', 'vaname', 'lobster', 'kepiting'
    ]
    for (const c of commodities) {
      expect(COMMODITY_STANDARDS[c as keyof typeof COMMODITY_STANDARDS]).toBeDefined()
      expect(COMMODITY_STANDARDS[c as keyof typeof COMMODITY_STANDARDS].scientificName).toBeTruthy()
      expect(COMMODITY_STANDARDS[c as keyof typeof COMMODITY_STANDARDS].temperature).toBeTruthy()
    }
  })
})
