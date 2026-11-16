import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  DEDUP_STOPWORDS,
  extractTopicKeywords,
  isTopicDuplicate,
  buildCommoditySummary,
  MORNING_CLUSTER,
  MIDDAY_CLUSTER,
  EVENING_CLUSTER,
  getBatchClusterTarget,
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

  describe('Tri-Daily Cadence & getBatchClusterTarget', () => {
    const originalEnv = process.env.BATCH_TYPE

    beforeEach(() => {
      delete process.env.BATCH_TYPE
    })

    afterEach(() => {
      if (originalEnv !== undefined) {
        process.env.BATCH_TYPE = originalEnv
      } else {
        delete process.env.BATCH_TYPE
      }
      vi.useRealTimers()
    })

    it('mendefinisikan klaster kategori yang sesuai spesifikasi 3 batch harian', () => {
      expect(MORNING_CLUSTER).toEqual(['Manajemen Kolam', 'Pakan', 'Teknologi'])
      expect(MIDDAY_CLUSTER).toEqual(['Penyakit & Pengobatan', 'Pembenihan', 'Tips & Trik'])
      expect(EVENING_CLUSTER).toEqual(['Bisnis & Pemasaran', 'Panen & Pascapanen'])
    })

    it('mendukung manual override melalui env BATCH_TYPE', () => {
      process.env.BATCH_TYPE = 'morning'
      expect(getBatchClusterTarget().categories).toEqual(MORNING_CLUSTER)

      process.env.BATCH_TYPE = 'midday'
      expect(getBatchClusterTarget().categories).toEqual(MIDDAY_CLUSTER)

      process.env.BATCH_TYPE = 'evening'
      expect(getBatchClusterTarget().categories).toEqual(EVENING_CLUSTER)

      // Mendukung sinonim Bahasa Indonesia
      process.env.BATCH_TYPE = 'pagi'
      expect(getBatchClusterTarget().categories).toEqual(MORNING_CLUSTER)

      process.env.BATCH_TYPE = 'siang'
      expect(getBatchClusterTarget().categories).toEqual(MIDDAY_CLUSTER)

      process.env.BATCH_TYPE = 'malam'
      expect(getBatchClusterTarget().categories).toEqual(EVENING_CLUSTER)
    })

    it('fallback ke deteksi waktu UTC jika BATCH_TYPE tidak dikenali', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-11-16T23:00:00Z'))

      process.env.BATCH_TYPE = 'unrecognized_cluster'
      const batch = getBatchClusterTarget()
      expect(batch.name).toContain('Morning Batch')
      expect(batch.categories).toEqual(MORNING_CLUSTER)
    })

    it('mengarahkan 23:00 UTC (06:00 WIB) ke batch Pagi', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-11-16T23:00:00Z'))

      const batch = getBatchClusterTarget()
      expect(batch.name).toContain('Morning Batch')
      expect(batch.categories).toEqual(MORNING_CLUSTER)
    })

    it('mengarahkan 05:00 UTC (12:00 WIB) ke batch Siang', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-11-16T05:00:00Z'))

      const batch = getBatchClusterTarget()
      expect(batch.name).toContain('Midday Batch')
      expect(batch.categories).toEqual(MIDDAY_CLUSTER)
    })

    it('mengarahkan 12:00 UTC (19:00 WIB) ke batch Malam', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-11-16T12:00:00Z'))

      const batch = getBatchClusterTarget()
      expect(batch.name).toContain('Evening Batch')
      expect(batch.categories).toEqual(EVENING_CLUSTER)
    })

    it('menangani batas jam UTC pagi (21:00 - 02:59 UTC)', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-11-16T21:00:00Z'))
      expect(getBatchClusterTarget().categories).toEqual(MORNING_CLUSTER)

      vi.setSystemTime(new Date('2026-11-16T02:00:00Z'))
      expect(getBatchClusterTarget().categories).toEqual(MORNING_CLUSTER)
    })

    it('menangani batas jam UTC siang (03:00 - 08:59 UTC)', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-11-16T03:00:00Z'))
      expect(getBatchClusterTarget().categories).toEqual(MIDDAY_CLUSTER)

      vi.setSystemTime(new Date('2026-11-16T08:59:00Z'))
      expect(getBatchClusterTarget().categories).toEqual(MIDDAY_CLUSTER)
    })

    it('menangani batas jam UTC malam (09:00 - 20:59 UTC)', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-11-16T09:00:00Z'))
      expect(getBatchClusterTarget().categories).toEqual(EVENING_CLUSTER)

      vi.setSystemTime(new Date('2026-11-16T20:59:00Z'))
      expect(getBatchClusterTarget().categories).toEqual(EVENING_CLUSTER)
    })
  })
})
