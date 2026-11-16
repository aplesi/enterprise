import { describe, it, expect } from 'vitest'
import { healOutlineIfNeeded, generateEmergencyFallbackBlueprint } from '../../../lib/ai/generator/outline/healer'
import { validateOutline } from '../../../lib/ai/generator/outline/validator'
import { parseOutlineJson } from '../../../lib/ai/generator/outline/builder'
import { ArticleBlueprint } from '../../../lib/ai/generator/types'

describe('Self-Healing Engine (healOutlineIfNeeded)', () => {
  it('menyembuhkan outline 6 bab tanpa FAQ menjadi 8 bab valid dengan bab FAQ dan rebalance kata', () => {
    const rawOutline: ArticleBlueprint = {
      title: 'Panduan Budidaya Udang Vaname Tambak Salinitas Rendah',
      imagePrompt: 'Indonesian aquaculture technician checking water salinity meter at shrimp pond',
      sections: [
        {
          id: 'pendahuluan',
          heading: 'Tantangan dan Potensi Budidaya Vaname Salinitas Rendah',
          intent: 'Membahas latar belakang, peluang ekonomi, dan ringkasan kunci.',
          targetWords: 300,
          entitiesToCover: ['salinitas rendah', 'udang vaname', 'biosekuriti'],
          isFaq: false
        },
        {
          id: 'kualitas-air',
          heading: 'Manajemen Parameter Kualitas Air dan Ion Kritis',
          intent: 'Membahas parameter DO, pH, suhu, dan rasio ion Ca:Mg.',
          targetWords: 500, // Bab panjang >450 kata yang harus dipecah
          entitiesToCover: ['kalsium', 'magnesium', 'alkalinitas', 'rasio ion'],
          isFaq: false
        },
        {
          id: 'persiapan-kolam',
          heading: 'SOP Sterilisasi dan Pengisian Air Tambak',
          intent: 'Prosedur sterilisasi air dan penumbuhan plankton awal.',
          targetWords: 350,
          entitiesToCover: ['kaporit', 'plankton', 'sterilisasi tambak'],
          isFaq: false
        },
        {
          id: 'manajemen-pakan',
          heading: 'Strategi Manajemen Pakan dan Kontrol Anco DOC 1-90',
          intent: 'Menjelaskan feeding rate berdasarkan biomassa udang.',
          targetWords: 350,
          entitiesToCover: ['kontrol anco', 'feeding rate', 'FCR vaname'],
          isFaq: false
        },
        {
          id: 'pencegahan-penyakit',
          heading: 'Mitigasi Penyakit dan Gejala Molting Bermasalah',
          intent: 'Gejala klinis udang gagal molting dan kram otot akibat defisit mineral.',
          targetWords: 350,
          entitiesToCover: ['gagal molting', 'kram otot udang', 'suplemen mineral'],
          isFaq: false
        },
        {
          id: 'kesimpulan',
          heading: 'Kesimpulan dan Rekomendasi Aksi Budidaya Sukses',
          intent: 'Rangkuman tindakan operasional dan roadmap panen.',
          targetWords: 200,
          entitiesToCover: ['kesimpulan', 'rekomendasi aksi'],
          isFaq: false
        }
      ]
    }

    const healed = healOutlineIfNeeded(rawOutline, 2500)

    // Validasi jumlah bab
    expect(healed.sections.length).toBeGreaterThanOrEqual(8)

    // Validasi keberadaan FAQ
    const faqSec = healed.sections.find(s => s.isFaq)
    expect(faqSec).toBeDefined()
    expect(faqSec?.faqsToAnswer).toBeDefined()
    expect(faqSec?.faqsToAnswer?.length).toBeGreaterThanOrEqual(4)

    // Validasi pemecahan bab panjang
    const hasSplitPrinsip = healed.sections.some(s => s.id.includes('prinsip'))
    const hasSplitAplikasi = healed.sections.some(s => s.id.includes('aplikasi'))
    expect(hasSplitPrinsip || hasSplitAplikasi).toBe(true)

    // Validasi rebalance total targetWords
    const totalWords = healed.sections.reduce((sum, s) => sum + s.targetWords, 0)
    expect(totalWords).toBeGreaterThanOrEqual(2500)

    // Validasi melalui validator resmi sistem
    const validation = validateOutline(healed, 2500)
    expect(validation.valid).toBe(true)
    expect(validation.errors).toEqual([])
  })

  it('menyembuhkan outline 7 bab dengan bab panjang (>450 kata) menjadi 8 bab', () => {
    const rawOutline: ArticleBlueprint = {
      title: 'Strategi Pembenihan Nila Monoseks Jantan',
      sections: [
        { id: 'intro', heading: 'Pendahuluan Pembenihan Nila', intent: 'Latar belakang', targetWords: 250, entitiesToCover: ['nila monoseks'], isFaq: false },
        { id: 'seleksi', heading: 'Seleksi Indukan Unggul', intent: 'Kriteria induk', targetWords: 300, entitiesToCover: ['induk nila'], isFaq: false },
        { id: 'pemijahan', heading: 'Teknik Pemijahan Massal di Kolam Beton', intent: 'SOP pemijahan', targetWords: 300, entitiesToCover: ['pemijahan massal'], isFaq: false },
        { id: 'sex-reversal', heading: 'SOP Sex Reversal Hormon Metiltestosteron', intent: 'Prosedur detail oral hormon', targetWords: 600, entitiesToCover: ['17a-metiltestosteron', 'pakan larva'], isFaq: false },
        { id: 'pendederan', heading: 'Manajemen Pendederan Benih Nila', intent: 'Pendederan larva', targetWords: 300, entitiesToCover: ['pendederan'], isFaq: false },
        { id: 'faq', heading: 'Pertanyaan Teknis Seputar Pembenihan Nila (FAQ)', intent: 'Tanya jawab', targetWords: 250, entitiesToCover: ['FAQ'], faqsToAnswer: ['Berapa dosis hormon?', 'Kapan waktu pemberian?'], isFaq: true },
        { id: 'penutup', heading: 'Kesimpulan dan Analisis Kelayakan Usaha', intent: 'Analisis usaha', targetWords: 250, entitiesToCover: ['analisis usaha'], isFaq: false }
      ]
    }

    const healed = healOutlineIfNeeded(rawOutline, 2400)
    expect(healed.sections.length).toBeGreaterThanOrEqual(8)

    const validation = validateOutline(healed, 2400)
    expect(validation.valid).toBe(true)
    expect(validation.errors).toEqual([])
  })

  it('membersihkan karakter # di awal, tengah, dan akhir heading serta title', () => {
    const rawOutline: ArticleBlueprint = {
      title: '## Panduan Budidaya Bioflok #1 di Indonesia ##',
      sections: [
        { id: 'sec-1', heading: '# 1. Pengenalan Bioflok', intent: 'Intro', targetWords: 300, entitiesToCover: ['bioflok'], isFaq: false },
        { id: 'sec-2', heading: '## 2. Persiapan Air ##', intent: 'Air', targetWords: 400, entitiesToCover: ['persiapan air'], isFaq: false },
        { id: 'sec-3', heading: '3. Probiotik # Molase # Kritis', intent: 'Molase', targetWords: 500, entitiesToCover: ['molase'], isFaq: false },
        { id: 'sec-4', heading: '## 4. Aerasi Kolam', intent: 'Aerasi', targetWords: 300, entitiesToCover: ['aerasi'], isFaq: false },
        { id: 'sec-5', heading: '## 5. Penebaran Benih', intent: 'Tebar', targetWords: 300, entitiesToCover: ['benih'], isFaq: false },
        { id: 'sec-6', heading: '## 6. Evaluasi Harian ##', intent: 'Evaluasi', targetWords: 300, entitiesToCover: ['evaluasi'], isFaq: false }
      ]
    }

    const healed = healOutlineIfNeeded(rawOutline, 2400)

    expect(healed.title).not.toContain('#')
    for (const sec of healed.sections) {
      expect(sec.heading).not.toContain('#')
    }

    const validation = validateOutline(healed, 2400)
    expect(validation.valid).toBe(true)
  })

  it('mengisi faqsToAnswer hingga minimal 4 jika bab ditandai isFaq tapi faqsToAnswer kurang dari 4', () => {
    const rawOutline: ArticleBlueprint = {
      title: 'Manajemen Kolam Terpal Lele',
      sections: [
        { id: 's1', heading: 'Bab 1', intent: 'Intro', targetWords: 300, entitiesToCover: ['lele'], isFaq: false },
        { id: 's2', heading: 'Bab 2', intent: 'Kolam', targetWords: 500, entitiesToCover: ['kolam'], isFaq: false },
        { id: 's3', heading: 'Bab 3', intent: 'Air', targetWords: 300, entitiesToCover: ['air'], isFaq: false },
        { id: 's4', heading: 'Bab 4', intent: 'Pakan', targetWords: 300, entitiesToCover: ['pakan'], isFaq: false },
        { id: 's5', heading: 'Bab 5', intent: 'Penyakit', targetWords: 300, entitiesToCover: ['penyakit'], isFaq: false },
        { id: 's6', heading: 'Bab 6 FAQ', intent: 'FAQ', targetWords: 250, entitiesToCover: ['FAQ'], faqsToAnswer: ['Hanya satu pertanyaan saja?'], isFaq: true },
        { id: 's7', heading: 'Bab 7', intent: 'Penutup', targetWords: 200, entitiesToCover: ['penutup'], isFaq: false }
      ]
    }

    const healed = healOutlineIfNeeded(rawOutline, 2400)
    const faq = healed.sections.find(s => s.isFaq)
    expect(faq?.faqsToAnswer && faq.faqsToAnswer.length >= 4).toBe(true)
    expect(faq?.faqsToAnswer?.[0]).toBe('Hanya satu pertanyaan saja?')

    const validation = validateOutline(healed, 2400)
    expect(validation.valid).toBe(true)
  })

  it('memastikan tepat satu bab FAQ jika model AI menandai multiple bab sebagai isFaq', () => {
    const rawOutline: ArticleBlueprint = {
      title: 'Pemeliharaan Gurame di Kolam Tanah',
      sections: [
        { id: 's1', heading: 'Pendahuluan', intent: 'Intro', targetWords: 300, entitiesToCover: ['gurame'], isFaq: false },
        { id: 's2', heading: 'Persiapan Kolam', intent: 'Kolam', targetWords: 350, entitiesToCover: ['kolam tanah'], isFaq: false },
        { id: 's3', heading: 'FAQ Pembenihan', intent: 'Tanya benih', targetWords: 250, entitiesToCover: ['benih'], faqsToAnswer: ['Tanya 1?', 'Tanya 2?'], isFaq: true },
        { id: 's4', heading: 'Pemberian Pakan', intent: 'Pakan', targetWords: 350, entitiesToCover: ['pakan'], isFaq: false },
        { id: 's5', heading: 'Penyakit Gurame', intent: 'Penyakit', targetWords: 350, entitiesToCover: ['penyakit'], isFaq: false },
        { id: 's6', heading: 'FAQ Pembesaran', intent: 'Tanya besar', targetWords: 250, entitiesToCover: ['panen'], faqsToAnswer: [], isFaq: true },
        { id: 's7', heading: 'Kesimpulan', intent: 'Penutup', targetWords: 250, entitiesToCover: ['kesimpulan'], isFaq: false }
      ]
    }

    const healed = healOutlineIfNeeded(rawOutline, 2400)
    const faqSections = healed.sections.filter(s => s.isFaq)
    expect(faqSections.length).toBe(1)
    expect(faqSections[0].faqsToAnswer?.length).toBeGreaterThanOrEqual(4)

    const validation = validateOutline(healed, 2400)
    expect(validation.valid).toBe(true)
  })

  it('memastikan setiap section memiliki targetWords minimal 100 dan ID slug unik', () => {
    const rawOutline: ArticleBlueprint = {
      title: 'Peluang Usaha Lobster Air Tawar',
      sections: [
        { id: 'sec duplicate with spaces', heading: 'Peluang Bisnis', intent: 'Intro', targetWords: 80, entitiesToCover: ['lobster'], isFaq: false },
        { id: 'sec duplicate with spaces', heading: 'Persiapan Wadah', intent: 'Wadah', targetWords: 500, entitiesToCover: ['wadah'], isFaq: false },
        { id: 'sec-3', heading: 'Kualitas Air', intent: 'Air', targetWords: 300, entitiesToCover: ['air'], isFaq: false },
        { id: 'sec-4', heading: 'Pemberian Pakan', intent: 'Pakan', targetWords: 300, entitiesToCover: ['pakan'], isFaq: false },
        { id: 'sec-5', heading: 'Pencegahan Hama', intent: 'Hama', targetWords: 300, entitiesToCover: ['hama'], isFaq: false },
        { id: 'sec-6', heading: 'Panen dan Sortir', intent: 'Panen', targetWords: 300, entitiesToCover: ['panen'], isFaq: false }
      ]
    }

    const healed = healOutlineIfNeeded(rawOutline, 2200)

    const ids = healed.sections.map(s => s.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)

    for (const sec of healed.sections) {
      expect(sec.targetWords).toBeGreaterThanOrEqual(100)
      expect(sec.id).not.toContain(' ')
    }

    const validation = validateOutline(healed, 2200)
    expect(validation.valid).toBe(true)
  })

  it('menangani batas atas Zod schema (max 16 bab) dengan aman jika input memiliki 16 bab tanpa FAQ', () => {
    const rawOutline: ArticleBlueprint = {
      title: 'Ensiklopedi Budidaya Udang Modern',
      sections: Array.from({ length: 16 }, (_, i) => ({
        id: `bab-${i + 1}`,
        heading: `Pembahasan Teknis Bagian ${i + 1}`,
        intent: `Materi detail bagian ${i + 1}`,
        targetWords: 150,
        entitiesToCover: [`entitas-${i + 1}`],
        isFaq: false
      }))
    }

    const healed = healOutlineIfNeeded(rawOutline, 2400)
    expect(healed.sections.length).toBeLessThanOrEqual(16)
    expect(healed.sections.some(s => s.isFaq)).toBe(true)

    const validation = validateOutline(healed, 2400)
    expect(validation.valid).toBe(true)
    expect(validation.errors).toEqual([])
  })

  it('menangani kasus ekstrem outline < 6 bab dengan ekspansi deterministik hingga minimal 8 bab valid', () => {
    const rawOutline: ArticleBlueprint = {
      title: 'Teknologi Kincir Air Hemat Energi',
      sections: [
        { id: 'sec-1', heading: 'Pendahuluan', intent: 'Latar belakang', targetWords: 400, entitiesToCover: ['kincir'], isFaq: false },
        { id: 'sec-2', heading: 'Prinsip Kincir', intent: 'Mekanik', targetWords: 600, entitiesToCover: ['aerasi'], isFaq: false },
        { id: 'sec-3', heading: 'Penutup', intent: 'Kesimpulan', targetWords: 200, entitiesToCover: ['kesimpulan'], isFaq: false }
      ]
    }

    const healed = healOutlineIfNeeded(rawOutline, 2000)

    expect(healed.sections.length).toBeGreaterThanOrEqual(8)
    const validation = validateOutline(healed, 2000)
    expect(validation.valid).toBe(true)
  })

  it('menghasilkan Emergency Fallback Blueprint valid ketika seluruh percobaan LLM gagal (Layer 4)', () => {
    const fallback = generateEmergencyFallbackBlueprint({
      topik: 'Manajemen Amonia Kolam Bioflok Lele',
      kategori: 'Manajemen Kolam',
      keywords: ['amonia bioflok', 'lele intensif'],
      targetWords: 2400
    })

    expect(fallback.sections.length).toBe(8)
    expect(fallback.sections.some(s => s.isFaq)).toBe(true)

    const healed = healOutlineIfNeeded(fallback, 2400)
    const validation = validateOutline(healed, 2400)
    expect(validation.valid).toBe(true)
    expect(validation.errors).toEqual([])
  })
})

describe('Builder JSON Parser (parseOutlineJson)', () => {
  it('berhasil mem-parse JSON murni dari model LLM', () => {
    const jsonStr = JSON.stringify({
      title: 'Panduan Budidaya Lele',
      sections: [
        { id: 'intro', heading: 'Intro', intent: 'Intro', targetWords: 200, entitiesToCover: ['lele'], isFaq: false }
      ]
    })
    const res = parseOutlineJson(jsonStr)
    expect(res.title).toBe('Panduan Budidaya Lele')
  })

  it('berhasil mengekstrak JSON di dalam markdown code block dengan teks pengantar dan penutup', () => {
    const rawWithChatter = `Tentu, berikut outline yang Anda minta:
\`\`\`json
{
  "title": "Analisa BEP Tambak Udang 2026",
  "sections": [
    { "id": "bep", "heading": "Analisis BEP", "intent": "Hitung BEP", "targetWords": 300, "entitiesToCover": ["BEP"], "isFaq": false }
  ]
}
\`\`\`
Semoga outline ini bermanfaat untuk pembudidaya!`

    const res = parseOutlineJson(rawWithChatter)
    expect(res.title).toBe('Analisa BEP Tambak Udang 2026')
    expect(res.sections.length).toBe(1)
  })

  it('berhasil mengekstrak objek JSON di antara kurung kurawal tanpa code block', () => {
    const rawWithoutFence = `Berikut respons terstruktur: {"title": "Sistem RAS Apartemen Kepiting", "sections": [{"id": "ras", "heading": "Sistem RAS", "intent": "RAS", "targetWords": 250, "entitiesToCover": ["RAS"], "isFaq": false}]} Terima kasih.`
    const res = parseOutlineJson(rawWithoutFence)
    expect(res.title).toBe('Sistem RAS Apartemen Kepiting')
  })

  it('melempar error deskriptif jika output bukan JSON yang valid', () => {
    expect(() => parseOutlineJson('Maaf, saya tidak dapat membuat JSON saat ini.')).toThrow(/Gagal parse JSON outline/)
  })
})
