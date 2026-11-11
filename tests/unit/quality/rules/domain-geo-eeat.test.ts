import { describe, it, expect } from 'vitest'
import '@/lib/quality/rules'
import {
  GeoFormattingRule,
  EeatCredibilityRule,
  TechnicalAccuracyRule,
  FreshnessRule
} from '@/lib/quality/rules/domain-geo-eeat'
import { registry } from '@/lib/quality/engine/registry'
import { CategoryWeights } from '@/lib/quality/config/weights'
import { RuleContext } from '@/lib/quality/engine/context'
import { AplesiRichDocument } from '@/lib/quality/domain/rich-document'
import { DEFAULT_CONFIG } from '@/lib/quality/engine/config'
import { QualityReport } from '@/lib/quality/types'
import { buildEditorContext, formatContextForLLM } from '@/lib/ai/editor/context'
import { renderMarkdown } from '@/lib/markdown'

function makeContext(rawMarkdown: string, judul = 'Panduan Budidaya Lele Sangkuriang'): RuleContext {
  const doc = {
    rawMarkdown,
    frontmatter: { judul },
    sections: [],
    totalWords: rawMarkdown.trim() ? rawMarkdown.trim().split(/\s+/).length : 0,
    globalLinks: [],
    headingsCount: 0
  } as unknown as AplesiRichDocument

  return { document: doc, config: DEFAULT_CONFIG }
}

describe('Phase 3 Quality Rules (GEO, EEAT, TECHNICAL, FRESHNESS)', () => {
  it('registers rules covering 100% of CategoryWeights categories', () => {
    const registeredCategories = new Set<string>(registry.getRules().map(rule => rule.category))
    for (const category of Object.keys(CategoryWeights)) {
      expect(registeredCategories.has(category)).toBe(true)
    }
  })

  describe('GeoFormattingRule', () => {
    it('passes with score 100 when > [!NOTE] callout is present and no raw LaTeX exists', () => {
      const ctx = makeContext(
        '> [!NOTE]\n> **Ringkasan Inti:** Gunakan pembibisan anaerob selama 48 jam.\n\n- Poin 1\n- Poin 2'
      )
      const result = GeoFormattingRule.evaluate(ctx)
      expect(result.passed).toBe(true)
      expect(result.score).toBe(100)
    })

    it('passes with score 90 when structured bullets/table exist without > [!NOTE] and no LaTeX exists', () => {
      const ctx = makeContext('## Ringkasan Poin Penting\n\n- Padat tebar ideal 100 ekor/m2\n- DO minimal 3 mg/L')
      const result = GeoFormattingRule.evaluate(ctx)
      expect(result.passed).toBe(true)
      expect(result.score).toBe(90)
    })

    it('fails with score 0 when raw LaTeX syntax ($$, \\frac, \\times, \\text{}) is present', () => {
      const ctx = makeContext(
        '> [!NOTE]\n> Rumus pakan: $$FCR = \\frac{\\text{Pakan}}{\\text{Bobot}} \\times 100$$'
      )
      const result = GeoFormattingRule.evaluate(ctx)
      expect(result.passed).toBe(false)
      expect(result.score).toBe(0)
      expect(result.recommendation).toContain('LaTeX')
    })

    it('guards cleanly against empty/missing rawMarkdown without throwing', () => {
      const ctx = makeContext('')
      const result = GeoFormattingRule.evaluate(ctx)
      expect(result.passed).toBe(false)
      expect(result.score).toBe(40)
    })
  })

  describe('EeatCredibilityRule', () => {
    it('passes with score 100 on factual SNI/KKP content without fabricated claims', () => {
      const ctx = makeContext(
        'Berdasarkan prinsip Cara Budidaya Ikan yang Baik (CBIB) KKP dan SNI 6484.3:2014, pergantian air dilakukan bertahap.'
      )
      const result = EeatCredibilityRule.evaluate(ctx)
      expect(result.passed).toBe(true)
      expect(result.score).toBe(100)
    })

    it('fails on fabricated multi-location claim ("diuji pada lebih dari 20 lokasi")', () => {
      const ctx = makeContext('Formula probiotik ini telah diuji pada lebih dari 20 lokasi di Indonesia.')
      const result = EeatCredibilityRule.evaluate(ctx)
      expect(result.passed).toBe(false)
      expect(result.score).toBe(0)
    })

    it('fails on fabricated "laboratorium APLESI" or unverified "et al. (YYYY)" / fake journal citations', () => {
      const labResult = EeatCredibilityRule.evaluate(
        makeContext('Hasil uji laboratorium APLESI menunjukkan peningkatan FCR.')
      )
      expect(labResult.passed).toBe(false)
      expect(labResult.score).toBe(0)

      const citeResult = EeatCredibilityRule.evaluate(
        makeContext('Menurut Van der Meulen et al. (2020) di Journal of Fish Biology.')
      )
      expect(citeResult.passed).toBe(false)
      expect(citeResult.score).toBe(0)
    })
  })

  describe('TechnicalAccuracyRule', () => {
    it('passes when aquaculture parameters and practical SOP terms are consistent', () => {
      const ctx = makeContext(
        'Ikan nila dipanen pada ukuran 200-350 g dalam 90-120 hari dengan feeding rate 3% biomassa/hari dan fermentasi wadah tertutup.'
      )
      const result = TechnicalAccuracyRule.evaluate(ctx)
      expect(result.passed).toBe(true)
      expect(result.score).toBe(100)
    })

    it('fails on unrealistic growth rate (>=100 g/minggu)', () => {
      const ctx = makeContext('Ikan nila mampu tumbuh hingga 120 g per minggu jika diberi pakan fermentasi.')
      const result = TechnicalAccuracyRule.evaluate(ctx)
      expect(result.passed).toBe(false)
      expect(result.score).toBe(0)
    })

    it('fails when mixing densitas tebar with % berat badan/biomassa or using laboratory SOP terms', () => {
      const mixResult = TechnicalAccuracyRule.evaluate(
        makeContext('Terapkan densitas tebar 2-3 % berat badan ikan per hari.')
      )
      expect(mixResult.passed).toBe(false)
      expect(mixResult.score).toBe(0)

      const labEquipResult = TechnicalAccuracyRule.evaluate(
        makeContext('Semprot pakan memakai sprayer stainless steel lalu lakukan uji cepat plate count CFU.')
      )
      expect(labEquipResult.passed).toBe(false)
      expect(labEquipResult.score).toBe(0)
    })
  })

  describe('FreshnessRule', () => {
    it('passes when content avoids outdated 2020-2025 year markers', () => {
      const ctx = makeContext('Panduan praktis pembenihan ikan nila sistem bioflok modern.', 'Panduan Budidaya Nila')
      const result = FreshnessRule.evaluate(ctx)
      expect(result.passed).toBe(true)
      expect(result.score).toBe(100)
    })

    it('fails when outdated year framing like "di tahun 2023" or "tren 2024" is present', () => {
      const bodyResult = FreshnessRule.evaluate(makeContext('Metode ini populer di tahun 2023 lalu.'))
      expect(bodyResult.passed).toBe(false)
      expect(bodyResult.score).toBe(0)

      const titleResult = FreshnessRule.evaluate(
        makeContext('Konten pembuka', 'Panduan Budidaya Lele Terbaru 2024')
      )
      expect(titleResult.passed).toBe(false)
      expect(titleResult.score).toBe(0)
    })
  })
})

describe('Editor Context SNI/KKP Injection', () => {
  it('injects commodity SNI/KKP bounds into formatContextForLLM output', () => {
    const doc = {
      frontmatter: { judul: 'Cara Budidaya Ikan Nila Bioflok yang Menguntungkan' },
      totalWords: 1200,
      rawMarkdown: 'Panduan kolam ikan nila agar FCR optimal.'
    } as unknown as AplesiRichDocument
    const report = {
      overall: 92,
      recommendations: []
    } as unknown as QualityReport

    const editorContext = buildEditorContext(doc, report, 'panduan')
    const formatted = formatContextForLLM(editorContext)

    expect(formatted).toContain('STANDAR TEKNIS SNI / KKP KOMODITAS (NILA)')
    expect(formatted).toContain('SNI')
  })
})

describe('renderMarkdown GFM Callouts', () => {
  it('converts > [!NOTE] blockquote into callout-box div and strips raw [!NOTE] token', () => {
    const md = [
      '> [!NOTE]',
      '> **Ringkasan Inti:** Gunakan wadah tertutup bersih saat membilis pakan.',
      '',
      'Paragraf biasa setelah callout.'
    ].join('\n')

    const html = renderMarkdown(md)
    expect(html).toContain('data-callout="note"')
    expect(html).toContain('callout-box')
    expect(html).toContain('<strong>Ringkasan Inti:</strong>')
    expect(html).not.toContain('[!NOTE]')
    expect(html).not.toContain('<blockquote>')
  })

  it('converts > [!WARNING] followed by a bullet list cleanly', () => {
    const md = ['> [!WARNING]', '>', '> - Jangan memberi pakan berlebih saat hujan deras'].join('\n')

    const html = renderMarkdown(md)
    expect(html).toContain('data-callout="warning"')
    expect(html).toContain('<li>Jangan memberi pakan berlebih saat hujan deras</li>')
    expect(html).not.toContain('[!WARNING]')
    expect(html).not.toContain('<blockquote>')
  })

  it('keeps regular blockquotes untouched as <blockquote>', () => {
    const md = '> Kutipan pengalaman pembudidaya kolam tanah di Sleman.'
    const html = renderMarkdown(md)
    expect(html).toContain('<blockquote>')
    expect(html).not.toContain('data-callout=')
  })
})
