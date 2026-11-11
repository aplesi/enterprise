import { describe, it, expect } from 'vitest'
import { extractFaq } from '@/lib/seo/faq'

describe('extractFaq', () => {
  it('mengekstrak FAQ dari heading standar "## FAQ"', () => {
    const markdown = `
## Ringkasan Singkat
Ringkasan artikel budidaya nila.

## FAQ

### Apa fungsi probiotik pada pakan ikan nila?
Probiotik membantu menyeimbangkan mikroflora usus ikan nila sehingga pencernaan pakan lebih efisien.

### Berapa kali sehari pakan diberikan?
Pakan diberikan 2 hingga 3 kali sehari sesuai nafsu makan dan bobot biomassa kolam.

## Ringkasan Poin Penting
- Poin satu
`
    const result = extractFaq(markdown)

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({
      pertanyaan: 'Apa fungsi probiotik pada pakan ikan nila?',
      jawaban: 'Probiotik membantu menyeimbangkan mikroflora usus ikan nila sehingga pencernaan pakan lebih efisien.',
    })
    expect(result[1]).toEqual({
      pertanyaan: 'Berapa kali sehari pakan diberikan?',
      jawaban: 'Pakan diberikan 2 hingga 3 kali sehari sesuai nafsu makan dan bobot biomassa kolam.',
    })
  })

  it('mengekstrak FAQ dari heading standar "## Pertanyaan yang Sering Diajukan"', () => {
    const markdown = `
## Pertanyaan yang Sering Diajukan

### Bagaimana cara memilih benih ikan nila yang sehat?
Pilih benih yang aktif berenang, ukuran seragam, dan tidak memiliki luka pada sisik.
`
    const result = extractFaq(markdown)

    expect(result).toHaveLength(1)
    expect(result[0].pertanyaan).toBe('Bagaimana cara memilih benih ikan nila yang sehat?')
    expect(result[0].jawaban).toContain('Pilih benih yang aktif berenang')
  })

  it('mengekstrak FAQ dari heading dinamis "## FAQ Teknis Fermentasi Pakan Nila"', () => {
    const markdown = `
## Langkah-Langkah
### Mengapa air bersih penting?
Bukan FAQ karena berada di luar section FAQ.

## FAQ Teknis Fermentasi Pakan Nila

### Berapa lama proses bibis pakan ikan nila?
Proses pembibisan pakan cukup **15–30 menit** sebelum ditebar ke kolam agar pelet tidak hancur.

### Apakah pakan hasil fermentasi boleh disimpan lama?
Pakan bibis sebaiknya langsung habis sekali tebar, sedangkan fermentasi anaerob wadah tertutup dapat disimpan sesuai panduan [CBIB KKP](/artikel/cbib).

## Catatan Ahli APLESI
### Mengapa sanitasi ember pakan krusial?
Heading ini berada setelah section FAQ sehingga tidak boleh masuk JSON-LD FAQ.
`
    const result = extractFaq(markdown)

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({
      pertanyaan: 'Berapa lama proses bibis pakan ikan nila?',
      jawaban: 'Proses pembibisan pakan cukup 15–30 menit sebelum ditebar ke kolam agar pelet tidak hancur.',
    })
    expect(result[1]).toEqual({
      pertanyaan: 'Apakah pakan hasil fermentasi boleh disimpan lama?',
      jawaban: 'Pakan bibis sebaiknya langsung habis sekali tebar, sedangkan fermentasi anaerob wadah tertutup dapat disimpan sesuai panduan CBIB KKP.',
    })
  })

  it('mengekstrak FAQ dari heading dinamis "Tanya Jawab" dan "Pertanyaan Kunci"', () => {
    const markdownTanyaJawab = `
## Tanya Jawab Seputar Pakan

### Apakah ikan nila cocok diberi pakan azolla?
Ya, azolla segar dapat diberikan sebagai pakan tambahan hingga 20% untuk menekan biaya pelet pabrikan.
`
    const resTanyaJawab = extractFaq(markdownTanyaJawab)
    expect(resTanyaJawab).toHaveLength(1)
    expect(resTanyaJawab[0].pertanyaan).toBe('Apakah ikan nila cocok diberi pakan azolla?')
    expect(resTanyaJawab[0].jawaban).toContain('azolla segar')

    const markdownPertanyaanKunci = `
## Pertanyaan Kunci Seputar Nila

### Kapan waktu ideal mengukur oksigen terlarut?
Pengukuran oksigen terlarut paling krusial dilakukan menjelang fajar saat kadar oksigen berada pada titik terendah.
`
    const resPertanyaan = extractFaq(markdownPertanyaanKunci)
    expect(resPertanyaan).toHaveLength(1)
    expect(resPertanyaan[0].pertanyaan).toBe('Kapan waktu ideal mengukur oksigen terlarut?')
    expect(resPertanyaan[0].jawaban).toContain('menjelang fajar')
  })
})
