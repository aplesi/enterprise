import { describe, it, expect } from 'vitest'
import {
  DEDUP_STOPWORDS,
  extractTopicKeywords,
  isTopicDuplicate,
  buildCommoditySummary,
} from '../../../scripts/auto-post'

describe('Auto-Post Multi-Commodity & Stopwords Logic', () => {
  describe('DEDUP_STOPWORDS', () => {
    it('tidak memuat kata lele agar tidak mendistorsi perbandingan komoditas', () => {
      expect(DEDUP_STOPWORDS.has('lele')).toBe(false)
    })

    it('tetap memuat stopword umum dan tahun', () => {
      expect(DEDUP_STOPWORDS.has('dan')).toBe(true)
      expect(DEDUP_STOPWORDS.has('panduan')).toBe(true)
      expect(DEDUP_STOPWORDS.has('budidaya')).toBe(true)
      expect(DEDUP_STOPWORDS.has('2026')).toBe(true)
    })

    it('menjaga lele sebagai kata kunci pembeda topik', () => {
      const keywords = extractTopicKeywords('teknik pembenihan lele bioflok')
      expect(keywords.has('lele')).toBe(true)
      expect(keywords.has('pembenihan')).toBe(true)
      expect(keywords.has('bioflok')).toBe(true)
    })

    it('membedakan topik nila vs lele sehingga tidak dianggap duplikat palsu karena perbedaan kata komoditas', () => {
      // Dengan kata komoditas (lele & nila) diperhitungkan:
      // existing: grading, lele, kolam, terpal (4 kata)
      // new:      grading, nila, kolam, semen (4 kata)
      // Overlap: 2/4 = 0.50 (< 0.6) -> TIDAK dianggap duplikat.
      // Jika lele diabaikan sebagai stopword: overlap 2/3 = 0.67 (>= 0.6) -> DUPLIKAT PALSU!
      const existingTitles = ['Teknik grading lele kolam terpal']
      const existingSlugs = new Set(['teknik-grading-lele-kolam-terpal'])

      const isDup = isTopicDuplicate(
        'Teknik grading nila kolam semen',
        existingTitles,
        existingSlugs
      )

      expect(isDup).toBe(false)
    })
  })

  describe('buildCommoditySummary', () => {
    it('menghasilkan ringkasan dan seoDesc dinamis untuk komoditas Ikan Nila', () => {
      const res = buildCommoditySummary('cara budidaya ikan nila bioflok', 'Tips & Trik', ['nila', 'bioflok'])
      expect(res.targetKomoditas).toBe('Ikan Nila')
      expect(res.ringkasan).toBe(
        'Panduan lengkap mengenai cara budidaya ikan nila bioflok untuk pembudidaya Ikan Nila di Indonesia.'
      )
      expect(res.seoDesc).toBe(res.ringkasan)
      expect(res.ringkasan.length).toBeLessThanOrEqual(160)
    })

    it('menghasilkan ringkasan dan seoDesc dinamis untuk komoditas Udang Vaname', () => {
      const res = buildCommoditySummary('manajemen kualitas air tambak vaname', 'Manajemen Kolam', ['vaname', 'kincir'])
      expect(res.targetKomoditas).toBe('Udang Vaname')
      expect(res.ringkasan).toBe(
        'Panduan lengkap mengenai manajemen kualitas air tambak vaname untuk pembudidaya Udang Vaname di Indonesia.'
      )
      expect(res.seoDesc).toBe(res.ringkasan)
    })

    it('menghasilkan ringkasan dan seoDesc dinamis untuk komoditas Lobster Air Tawar', () => {
      const res = buildCommoditySummary('teknik pembenihan lobster red claw', 'Pembenihan', ['lobster', 'shelter'])
      expect(res.targetKomoditas).toBe('Lobster Air Tawar')
      expect(res.ringkasan).toContain('pembudidaya Lobster Air Tawar di Indonesia.')
    })

    it('menghasilkan ringkasan dan seoDesc dinamis untuk komoditas Ikan Gurame', () => {
      const res = buildCommoditySummary('pakan hijauan fermentasi untuk gurame', 'Pakan', ['gurame', 'daun sente'])
      expect(res.targetKomoditas).toBe('Ikan Gurame')
      expect(res.ringkasan).toContain('pembudidaya Ikan Gurame di Indonesia.')
    })

    it('menghasilkan ringkasan dan seoDesc dinamis untuk komoditas Ikan Patin', () => {
      const res = buildCommoditySummary('pembesaran ikan patin kolam terpal', 'Manajemen Kolam', ['patin', 'kolam terpal'])
      expect(res.targetKomoditas).toBe('Ikan Patin')
      expect(res.ringkasan).toContain('pembudidaya Ikan Patin di Indonesia.')
    })

    it('menghasilkan ringkasan khusus komoditas Ikan Lele ketika topik membahas lele', () => {
      const res = buildCommoditySummary('seleksi indukan lele matang gonad', 'Pembenihan', ['lele', 'indukan'])
      expect(res.targetKomoditas).toBe('Ikan Lele')
      expect(res.ringkasan).toBe(
        'Panduan lengkap mengenai seleksi indukan lele matang gonad untuk pembudidaya Ikan Lele di Indonesia.'
      )
    })

    it('menggunakan fallback ramah perikanan dan akuakultur jika komoditas general', () => {
      const res = buildCommoditySummary('cara membuat probiotik fermentasi air kolam', 'Tips & Trik', ['fermentasi'])
      expect(res.targetKomoditas).toBe('perikanan dan akuakultur')
      expect(res.ringkasan).toBe(
        'Panduan lengkap mengenai cara membuat probiotik fermentasi air kolam untuk pembudidaya perikanan dan akuakultur di Indonesia.'
      )
    })

    it('memotong ringkasan dan seoDesc pada batas kata jika kalimat melebihi 160 karakter', () => {
      const longTopic =
        'analisis kelayakan usaha budidaya pembesaran komersial intensif dengan teknologi mikroenkapsulasi pakan apung buatan berdaya cerna tinggi'
      const res = buildCommoditySummary(longTopic, 'Bisnis & Pemasaran', ['vaname'])

      expect(res.ringkasan.length).toBeLessThanOrEqual(160)
      expect(res.seoDesc.length).toBeLessThanOrEqual(160)
      expect(res.ringkasan).not.toMatch(/[,:;\-–—]$/)
    })
  })
})
