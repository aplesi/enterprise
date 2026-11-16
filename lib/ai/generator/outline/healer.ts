import { ArticleBlueprint, SectionBlueprint } from '../types'

/**
 * Deterministic self-healing engine for ArticleBlueprint outlines (Layer 2 of Multi-Tier Resilience).
 * Handles outlines with 6 or 7 sections and resolves validation edge cases by:
 * 1. Sanitizing headings and titles (stripping all '#' characters and trimming excess spaces).
 * 2. Detecting or injecting a structured FAQ section if absent, and ensuring >= 4 technical questions.
 * 3. Enforcing single FAQ section constraint (consolidating multiple isFaq flags).
 * 4. Splitting large sections (>450 words or largest candidate) into 2 focused sub-sections until reaching >= 8 sections.
 * 5. Capping sections at max 16 to respect Zod schema limits.
 * 6. Rebalancing section word budgets so the total reaches the target word budget.
 * 7. Ensuring all sections satisfy validator constraints (min 100 words per section, sanitized unique slug IDs).
 */
export function healOutlineIfNeeded(blueprint: ArticleBlueprint, targetWords: number = 2500): ArticleBlueprint {
  const sanitizeText = (txt?: string, fallback: string = ''): string => {
    return (txt || fallback).replace(/#/g, '').replace(/\s+/g, ' ').trim() || fallback
  }

  const slugifyId = (idStr: string, idx: number): string => {
    const slug = idStr.toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '')
    return slug || `section-${idx + 1}`
  }

  // Deep clone to avoid mutating the original blueprint object
  const healed: ArticleBlueprint = {
    title: sanitizeText(blueprint.title, 'Panduan Budidaya Perikanan Indonesia'),
    imagePrompt: blueprint.imagePrompt,
    sections: (blueprint.sections || []).map((sec, idx) => ({
      id: slugifyId(sec.id || `section-${idx + 1}`, idx),
      heading: sanitizeText(sec.heading, `Bagian ${idx + 1}`),
      intent: sec.intent || 'Pembahasan mendalam aspek teknis budidaya.',
      targetWords: typeof sec.targetWords === 'number' && !isNaN(sec.targetWords) ? Math.max(100, sec.targetWords) : 200,
      entitiesToCover: Array.isArray(sec.entitiesToCover) && sec.entitiesToCover.length > 0 ? [...sec.entitiesToCover] : ['parameter budidaya'],
      faqsToAnswer: Array.isArray(sec.faqsToAnswer) ? [...sec.faqsToAnswer] : undefined,
      isFaq: Boolean(sec.isFaq)
    }))
  }

  const standardFaqs = [
    'Berapa standar parameter kualitas air yang harus dipertahankan setiap hari?',
    'Bagaimana tindakan mitigasi pertama jika terjadi stres atau penurunan nafsu makan?',
    'Berapa rasio konversi pakan (FCR) ideal untuk komoditas ini?',
    'Kapan waktu paling efektif untuk pemberian pakan dan pengecekan kesehatan kolam?'
  ]

  // 1. Deteksi atau perbaiki section FAQ
  const naturalFaqIndices: number[] = []
  healed.sections.forEach((s, idx) => {
    if (s.isFaq || /\b(faq|tanya|jawab|pertanyaan)\b/i.test(s.heading)) {
      naturalFaqIndices.push(idx)
    }
  })

  let primaryFaqIdx = naturalFaqIndices.length > 0 ? naturalFaqIndices[0] : -1

  // Pastikan hanya satu bab yang memiliki isFaq = true (hindari duplikasi FAQ)
  healed.sections.forEach((s, idx) => {
    if (idx === primaryFaqIdx) {
      s.isFaq = true
    } else if (s.isFaq) {
      s.isFaq = false
    }
  })

  if (primaryFaqIdx !== -1) {
    const faqSec = healed.sections[primaryFaqIdx]
    const existingFaqs = faqSec.faqsToAnswer || []
    if (existingFaqs.length < 4) {
      const needed = 4 - existingFaqs.length
      const addedFaqs = standardFaqs.slice(0, needed)
      faqSec.faqsToAnswer = [...existingFaqs, ...addedFaqs]
    }
  } else {
    // Suntikkan bab FAQ terstruktur jika belum ada sama sekali
    const injectedFaq: SectionBlueprint = {
      id: 'faq-pertanyaan-teknis-lapangan',
      heading: 'Pertanyaan Teknis yang Sering Diajukan Pembudidaya (FAQ)',
      intent: 'Menjawab 4-5 pertanyaan praktis krusial seputar SOP harian, parameter air, formula pakan, dan mitigasi risiko budidaya.',
      targetWords: 250,
      entitiesToCover: ['FAQ akuakultur', 'parameter teknis', 'solusi kendala', 'rekomendasi budidaya'],
      faqsToAnswer: [...standardFaqs],
      isFaq: true
    }

    if (healed.sections.length >= 16) {
      // Jika sudah mencapai batas maksimal 16 bab, ganti bab kedua dari belakang menjadi FAQ
      const replaceIdx = Math.max(0, healed.sections.length - 2)
      healed.sections[replaceIdx] = injectedFaq
    } else if (healed.sections.length > 1) {
      // Tempatkan FAQ sebelum bab terakhir (kesimpulan)
      healed.sections.splice(healed.sections.length - 1, 0, injectedFaq)
    } else {
      healed.sections.push(injectedFaq)
    }
  }

  // 2. Ekspansi hingga minimal 8 bab jika jumlah bab < 8 (secara deterministik)
  const fallbackTemplates = [
    {
      id: 'sop-monitoring-evaluasi-berkala',
      heading: 'SOP Monitoring Berkala dan Evaluasi Efisiensi Budidaya',
      intent: 'Menjelaskan tabel checklist operasional harian, parameter kontrol rutin, dan audit performa teknis secara teratur.',
      entitiesToCover: ['checklist monitoring', 'audit operasional', 'evaluasi efisiensi'],
    },
    {
      id: 'mitigasi-risiko-darurat-teknis',
      heading: 'Mitigasi Risiko Darurat dan Penanganan Kendala Lapangan',
      intent: 'Mengidentifikasi kendala kritis seperti fluktuasi parameter mendadak, cuaca ekstrem, dan tindakan darurat.',
      entitiesToCover: ['mitigasi risiko', 'troubleshooting kolam', 'tindakan darurat'],
    },
    {
      id: 'analisis-nutrisi-dan-manajemen-pakan',
      heading: 'Analisis Kebutuhan Nutrisi dan Manajemen Pakan Cadangan',
      intent: 'Membahas komposisi nutrisi pakan pendukung, formulasi ransum efisien, dan strategi penekanan FCR.',
      entitiesToCover: ['nutrisi pakan', 'manajemen pakan', 'efisiensi biaya'],
    }
  ]

  let loopCount = 0
  while (healed.sections.length < 8 && healed.sections.length < 16 && loopCount < 10) {
    loopCount++

    // Cari kandidat bab non-FAQ untuk dipecah (prioritaskan >450 kata, lalu kata terbanyak >= 200)
    let candidateIdx = -1
    let maxWords = -1

    for (let i = 0; i < healed.sections.length; i++) {
      const s = healed.sections[i]
      if (s.isFaq) continue
      // Prioritaskan section > 450 kata
      if (s.targetWords > 450) {
        candidateIdx = i
        break
      }
      if (s.targetWords > maxWords && s.targetWords >= 200) {
        maxWords = s.targetWords
        candidateIdx = i
      }
    }

    if (candidateIdx !== -1) {
      const cand = healed.sections[candidateIdx]
      const halfWords = Math.floor(cand.targetWords / 2)
      const w1 = Math.max(100, halfWords)
      const w2 = Math.max(100, cand.targetWords - w1)

      const halfEnt = Math.ceil(cand.entitiesToCover.length / 2)
      const ent1 = cand.entitiesToCover.slice(0, halfEnt)
      const ent2 = cand.entitiesToCover.slice(halfEnt)

      const part1: SectionBlueprint = {
        id: `${cand.id}-prinsip`,
        heading: `${cand.heading}: Prinsip Teknis & Parameter Kunci`,
        intent: `${cand.intent} Fokus pada parameter kritis, kriteria standar, dan dasar biologis/kimiawi.`,
        targetWords: w1,
        entitiesToCover: ent1.length > 0 ? ent1 : ['standar teknis'],
        isFaq: false
      }

      const part2: SectionBlueprint = {
        id: `${cand.id}-aplikasi`,
        heading: `${cand.heading}: SOP Aplikasi & Tindakan Lapangan`,
        intent: `${cand.intent} Fokus pada langkah operasional praktis, monitoring berkala, dan evaluasi hasil di kolam.`,
        targetWords: w2,
        entitiesToCover: ent2.length > 0 ? ent2 : ['SOP operasional lapangan'],
        isFaq: false
      }

      healed.sections.splice(candidateIdx, 1, part1, part2)
    } else {
      // Jika tidak ada bab yang bisa dipecah lagi, suntikkan bab terfokus unik dari fallback template
      const template = fallbackTemplates[(loopCount - 1) % fallbackTemplates.length]
      const insertIdx = healed.sections.length > 1 ? healed.sections.length - 1 : healed.sections.length
      healed.sections.splice(insertIdx, 0, {
        id: `${template.id}-${loopCount}`,
        heading: template.heading,
        intent: template.intent,
        targetWords: 200,
        entitiesToCover: [...template.entitiesToCover],
        isFaq: false
      })
    }
  }

  // 3. Batasi jika jumlah bab melebihi batas skema Zod (maksimal 16 bab)
  if (healed.sections.length > 16) {
    // Pertahankan bab pembuka, bab penutup, dan bab FAQ
    const faqItem = healed.sections.find(s => s.isFaq)
    const nonFaqItems = healed.sections.filter(s => !s.isFaq)
    const trimmedNonFaq = nonFaqItems.slice(0, 15)
    healed.sections = faqItem ? [...trimmedNonFaq.slice(0, 14), faqItem, trimmedNonFaq[trimmedNonFaq.length - 1]] : trimmedNonFaq.slice(0, 16)
  }

  // 4. Pastikan setiap bab minimal memiliki 100 kata (sesuai validator)
  for (const sec of healed.sections) {
    if (sec.targetWords < 100) {
      sec.targetWords = 100
    }
  }

  // 5. Rebalance Word Budget: Pastikan total targetWords memenuhi targetWords
  const currentTotal = healed.sections.reduce((sum, s) => sum + s.targetWords, 0)
  if (currentTotal < targetWords) {
    const deficit = targetWords - currentTotal
    const nonFaqSections = healed.sections.filter(s => !s.isFaq)
    if (nonFaqSections.length > 0) {
      const perSec = Math.floor(deficit / nonFaqSections.length)
      let remainder = deficit % nonFaqSections.length

      for (const sec of nonFaqSections) {
        sec.targetWords += perSec + (remainder > 0 ? 1 : 0)
        if (remainder > 0) remainder--
      }
    }
  }

  // 6. Pastikan ID section unik
  const idCounts = new Map<string, number>()
  for (const sec of healed.sections) {
    const count = idCounts.get(sec.id) || 0
    if (count > 0) {
      sec.id = `${sec.id}-${count + 1}`
    }
    idCounts.set(sec.id, count + 1)
  }

  return healed
}

/**
 * Emergency Fallback Blueprint Generator (Layer 4 of Multi-Tier Resilience).
 * Generates a deterministically valid 8-section ArticleBlueprint tailored to the topic
 * when all LLM retry attempts are exhausted or network/parsing catastrophically fails.
 */
export function generateEmergencyFallbackBlueprint(req: {
  topik: string
  kategori: string
  keywords?: string[]
  targetWords?: number
}): ArticleBlueprint {
  const targetWords = req.targetWords || 2500
  const keywords = req.keywords && req.keywords.length > 0 ? req.keywords : [req.topik]
  const cleanTopik = req.topik.replace(/#/g, '').trim()

  const perSectionWords = Math.floor(targetWords / 8)

  return {
    title: `Panduan Praktis ${cleanTopik}: Standar Budidaya dan SOP Lapangan`,
    imagePrompt: `Indonesian aquaculture technician conducting field inspection at pond edge for ${cleanTopik}, high quality documentary photography`,
    sections: [
      {
        id: 'pendahuluan-dan-ringkasan-inti',
        heading: `Tantangan dan Potensi ${cleanTopik}`,
        intent: `Membahas latar belakang pentingnya ${cleanTopik}, tantangan budidaya terkini, dan blok ringkasan inti berupa callout [!NOTE].`,
        targetWords: perSectionWords,
        entitiesToCover: [keywords[0], 'biosekuriti', 'parameter operasional'],
        isFaq: false
      },
      {
        id: 'standar-kualitas-air-dan-lingkungan',
        heading: 'Standar Kualitas Air dan Parameter Lingkungan Kolam',
        intent: 'Menyajikan tabel parameter teknis kualitas air kritis (pH, DO, suhu, amonia, alkalinitas) sesuai standar baku mutu perikanan.',
        targetWords: perSectionWords,
        entitiesToCover: ['kualitas air', 'oksigen terlarut', 'pH kolam', 'baku mutu'],
        isFaq: false
      },
      {
        id: 'persiapan-wadah-dan-biosekuriti',
        heading: 'SOP Sterilisasi Wadah Kolam dan Biosekuriti Awal',
        intent: 'Prosedur bertingkat sterilisasi kolam, pengeringan, pengapuran, dan pengisian air baku sebelum operasional.',
        targetWords: perSectionWords,
        entitiesToCover: ['sterilisasi kolam', 'pengapuran', 'biosekuriti'],
        isFaq: false
      },
      {
        id: 'manajemen-pakan-dan-nutrisi',
        heading: 'Formula Perhitungan Dosis Pakan dan Efisiensi FCR',
        intent: 'Menyajikan formula matematis perhitungan kebutuhan pakan harian berdasarkan estimasi biomassa dan target FCR rendah.',
        targetWords: perSectionWords,
        entitiesToCover: ['formula pakan', 'biomassa kolam', 'FCR rendah', 'feeding rate'],
        isFaq: false
      },
      {
        id: 'sop-pemeliharaan-harian',
        heading: 'SOP Pemeliharaan Harian dan Checklist Kontrol Lapangan',
        intent: 'Panduan operasional pagi, siang, dan malam beserta checklist pengawasan teknisi lapangan.',
        targetWords: perSectionWords,
        entitiesToCover: ['SOP harian', 'monitoring berkala', 'kontrol kolam'],
        isFaq: false
      },
      {
        id: 'pencegahan-dan-pengobatan-penyakit',
        heading: 'Mitigasi Risiko Penyakit dan Gejala Abnormalitas Ikan',
        intent: 'Mengenali gejala klinis abnormalitas, langkah karantina awal, dan penanganan terapeutik yang aman tanpa antibiotik terlarang.',
        targetWords: perSectionWords,
        entitiesToCover: ['penyakit ikan', 'gejala klinis', 'mitigasi darurat'],
        isFaq: false
      },
      {
        id: 'pertanyaan-teknis-lapangan-faq',
        heading: 'Pertanyaan Teknis yang Sering Diajukan Pembudidaya (FAQ)',
        intent: 'Menjawab 4 pertanyaan teknis esensial seputar penanganan kendala, FCR, parameter air, dan jadwal pemeliharaan.',
        targetWords: perSectionWords,
        entitiesToCover: ['FAQ teknis', 'solusi kendala', 'rekomendasi ahli'],
        faqsToAnswer: [
          'Berapa standar parameter kualitas air yang harus dipertahankan setiap hari?',
          'Bagaimana tindakan mitigasi pertama jika terjadi stres atau penurunan nafsu makan?',
          'Berapa rasio konversi pakan (FCR) ideal untuk komoditas ini?',
          'Kapan waktu paling efektif untuk pemberian pakan dan pengecekan kesehatan kolam?'
        ],
        isFaq: true
      },
      {
        id: 'kesimpulan-dan-analisis-usaha',
        heading: 'Kesimpulan dan Rekomendasi Aksi Budidaya Sukses',
        intent: 'Rangkuman tindakan operasional kunci, analisa kelayakan usaha sederhana, dan roadmap implementasi peternak.',
        targetWords: perSectionWords,
        entitiesToCover: ['kesimpulan', 'rekomendasi aksi', 'kelayakan usaha'],
        isFaq: false
      }
    ]
  }
}
