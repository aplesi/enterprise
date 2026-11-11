import { QualityRule, RuleContext } from '../engine/context'

const RAW_LATEX_PATTERN = /\$\$|\\frac\b|\\times\b|\\text\s*\{/
const GFM_CALLOUT_PATTERN = /^\s*>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/im
const MARKDOWN_TABLE_PATTERN = /\n\|[^\n]+\|\n\|[\s:-]+\|/
const BULLET_LIST_PATTERN = /^\s*[-*]\s+.+/m

const FAKE_CLAIM_PATTERNS: ReadonlyArray<{ label: string; regex: RegExp }> = [
  {
    label: 'klaim pengujian multi-lokasi fiktif',
    regex: /\b(?:diuji(?:\s+coba)?\s+(?:di|pada)|lebih\s+dari)\s+\d+\s+(?:lokasi|kolam|tambak|peternakan)\b/i
  },
  {
    label: 'klaim laboratorium internal APLESI',
    regex: /\blaboratorium\s+aplesi\b/i
  },
  {
    label: 'sitasi akademis et al. tidak terverifikasi',
    regex: /\bet\s+al\.?\s*(?:\(\s*\d{4}\s*\)|,\s*\d{4})/i
  },
  {
    label: 'rujukan jurnal akademis berisiko halusinasi',
    regex: /\b(?:Journal\s+of\s+Fish\s+Biology|Aquaculture\s+Nutrition)\b/i
  }
]

const TECHNICAL_ANOMALY_PATTERNS: ReadonlyArray<{ label: string; regex: RegExp }> = [
  {
    label: 'klaim pertambahan bobot tidak realistis (>=100 g/minggu)',
    regex: /\b(?:1\d{2}|[2-9]\d{2})\s*(?:g|gram)\s*(?:per\s+|\/)\s*minggu\b/i
  },
  {
    label: 'pencampuran istilah densitas tebar dengan feeding rate (% biomassa/berat badan)',
    regex: /\bdensitas\s+tebar\b[^.\n]{0,60}%\s*(?:berat\s+badan|biomassa)\b/i
  },
  {
    label: 'peralatan laboratoris tidak membumi (sprayer stainless steel)',
    regex: /\bsprayer\s+stainless\s+steel\b/i
  },
  {
    label: 'prosedur laboratoris tidak membumi (plate count CFU)',
    regex: /\b(?:uji\s+(?:cepat\s+)?plate\s+count|plate\s+count\s*(?:\(\s*CFU\s*\)|CFU))\b/i
  }
]

const OUTDATED_YEAR_PATTERN =
  /\b(?:tahun|di\s+tahun|terbaru|tren|panduan|edisi)\s+\(?(?:2020|2021|2022|2023|2024|2025)\)?\b/i

function findMatchedLabels(
  text: string,
  patterns: ReadonlyArray<{ label: string; regex: RegExp }>
): string[] {
  return patterns.filter(item => item.regex.test(text)).map(item => item.label)
}

export const GeoFormattingRule: QualityRule = {
  id: 'geo-formatting',
  title: 'Kepatuhan Format GEO & Bebas LaTeX',
  category: 'GEO',
  severity: 'WARNING',
  maxScore: 100,
  evaluate(ctx: RuleContext) {
    const rawMarkdown = ctx.document.rawMarkdown || ''

    if (RAW_LATEX_PATTERN.test(rawMarkdown)) {
      return {
        passed: false,
        score: 0,
        message: 'Ditemukan sintaks LaTeX mentah ($$, \\frac, \\times, atau \\text{}) pada konten markdown.',
        recommendation:
          'Hapus seluruh sintaks LaTeX mentah dan tulis rumus menggunakan teks biasa atau simbol Unicode (×, ÷, =).'
      }
    }

    const hasGfmCallout = GFM_CALLOUT_PATTERN.test(rawMarkdown)
    if (hasGfmCallout) {
      return {
        passed: true,
        score: 100,
        message: 'Format GEO terpenuhi: blok callout ringkasan inti tersedia dan bebas sintaks LaTeX mentah.',
        recommendation: ''
      }
    }

    const hasTableOrBullets =
      MARKDOWN_TABLE_PATTERN.test(rawMarkdown) || BULLET_LIST_PATTERN.test(rawMarkdown)

    if (hasTableOrBullets) {
      return {
        passed: true,
        score: 90,
        message:
          'Struktur GEO memadai (bebas LaTeX dan memiliki poin/tabel terstruktur); tambahkan blok > [!NOTE] untuk skor optimal.',
        recommendation: ''
      }
    }

    return {
      passed: false,
      score: 40,
      message: 'Belum ditemukan blok > [!NOTE] Ringkasan Inti maupun tabel/daftar poin terstruktur untuk GEO.',
      recommendation:
        'Tambahkan blok > [!NOTE] Ringkasan Inti di awal artikel serta tabel perbandingan atau daftar poin terstruktur.'
    }
  }
}

export const EeatCredibilityRule: QualityRule = {
  id: 'eeat-credibility',
  title: 'Kredibilitas E-E-A-T & Anti-Halusinasi Sitasi',
  category: 'EEAT',
  severity: 'CRITICAL',
  maxScore: 100,
  evaluate(ctx: RuleContext) {
    const rawMarkdown = ctx.document.rawMarkdown || ''
    const matched = findMatchedLabels(rawMarkdown, FAKE_CLAIM_PATTERNS)

    if (matched.length > 0) {
      return {
        passed: false,
        score: 0,
        message: `Terdeteksi indikasi klaim atau sitasi berisiko halusinasi: ${matched.join('; ')}.`,
        recommendation:
          'Hapus klaim pengujian fiktif (seperti "diuji di X lokasi" atau "laboratorium APLESI") dan sitasi jurnal rekaan; gunakan acuan resmi SNI, Ditjen Perikanan Budidaya KKP (CBIB), atau FAO.'
      }
    }

    return {
      passed: true,
      score: 100,
      message: 'Konten bebas dari klaim uji fiktif dan sitasi akademis karangan.',
      recommendation: ''
    }
  }
}

export const TechnicalAccuracyRule: QualityRule = {
  id: 'technical-accuracy',
  title: 'Akurasi Parameter Teknis Budidaya (SNI/KKP)',
  category: 'TECHNICAL',
  severity: 'CRITICAL',
  maxScore: 100,
  evaluate(ctx: RuleContext) {
    const rawMarkdown = ctx.document.rawMarkdown || ''
    const matched = findMatchedLabels(rawMarkdown, TECHNICAL_ANOMALY_PATTERNS)

    if (matched.length > 0) {
      return {
        passed: false,
        score: 0,
        message: `Ditemukan ketidakakuratan istilah atau parameter teknis: ${matched.join('; ')}.`,
        recommendation:
          'Sesuaikan parameter teknis dengan standar SNI/KKP (pisahkan padat tebar ekor/m² vs feeding rate % biomassa/hari) dan gunakan metode praktis kolam rakyat yang membumi.'
      }
    }

    return {
      passed: true,
      score: 100,
      message: 'Parameter teknis dan istilah budidaya konsisten serta bebas anomali.',
      recommendation: ''
    }
  }
}

export const FreshnessRule: QualityRule = {
  id: 'content-freshness',
  title: 'Kesegaran Konten & Relevansi Tahun',
  category: 'FRESHNESS',
  severity: 'WARNING',
  maxScore: 100,
  evaluate(ctx: RuleContext) {
    const judul = String(ctx.document.frontmatter?.judul || '')
    const rawMarkdown = ctx.document.rawMarkdown || ''
    const combinedText = `${judul}\n${rawMarkdown}`
    const match = combinedText.match(OUTDATED_YEAR_PATTERN)

    if (match) {
      return {
        passed: false,
        score: 0,
        message: `Ditemukan penanda tahun usang ("${match[0]}") yang menurunkan kesegaran konten.`,
        recommendation:
          'Perbarui penanda tahun lama (2020–2025) menjadi konteks tahun berjalan atau gunakan redaksi evergreen.'
      }
    }

    return {
      passed: true,
      score: 100,
      message: 'Konten bebas dari penanda tahun usang.',
      recommendation: ''
    }
  }
}
