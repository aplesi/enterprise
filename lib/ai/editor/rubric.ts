import { ArticleType, EditorRubric } from './types'

export const RUBRICS: Record<ArticleType, EditorRubric> = {
  panduan: {
    articleType: 'panduan',
    priorities: [
      'Actionability (Dapat dipraktikkan langsung)',
      'Logika langkah-demi-langkah yang koheren',
      'Kelengkapan peralatan dan bahan'
    ],
    strictRequirements: [
      'Jangan gunakan bahasa teoretis yang mengawang-awang.',
      'Setiap langkah teknis harus masuk akal dan urut.',
      'Berikan solusi untuk kemungkinan masalah kegagalan.'
    ],
    toneOfVoice: 'Profesional, mendidik, praktis, dan langsung ke intinya.'
  },
  berita: {
    articleType: 'berita',
    priorities: [
      'Aktualitas dan urgensi (Freshness)',
      'Keseimbangan informasi (5W1H)',
      'Daya tarik judul dan paragraf pembuka'
    ],
    strictRequirements: [
      'Hindari opini pribadi AI.',
      'Sertakan referensi waktu kejadian.',
      'Gunakan bahasa jurnalistik baku.'
    ],
    toneOfVoice: 'Objektif, informatif, dan ringkas.'
  },
  opini: {
    articleType: 'opini',
    priorities: [
      'Kekuatan argumen',
      'Kekayaan kosakata dan retorika',
      'Perspektif unik yang memancing diskusi'
    ],
    strictRequirements: [
      'Argumen harus didukung oleh data (tidak asal bicara).',
      'Hindari bahasa yang terlalu kaku atau mekanis.'
    ],
    toneOfVoice: 'Persuasif, otoriatif, namun terbuka terhadap diskusi.'
  },
  studi_kasus: {
    articleType: 'studi_kasus',
    priorities: [
      'Metodologi dan pengumpulan data',
      'Analisis sebelum dan sesudah (Before-After)',
      'Kesimpulan berbasis empiris'
    ],
    strictRequirements: [
      'Harus menyertakan angka atau metrik keberhasilan.',
      'Jangan melebih-lebihkan hasil tanpa bukti logis.'
    ],
    toneOfVoice: 'Analitis, objektif, dan akademis-ringan.'
  }
}

export function loadRubric(type: ArticleType): EditorRubric {
  return RUBRICS[type] || RUBRICS.panduan
}
