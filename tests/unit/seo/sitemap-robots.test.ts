import { describe, it, expect, vi, beforeEach } from 'vitest'
import robots from '@/app/robots'
import sitemap from '@/app/sitemap'
import * as dbArtikel from '@/lib/db/artikel'

describe('SEO sitemap & robots configuration', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('robots()', () => {
    it('mengembalikan hanya satu sitemap https://www.aplesi.my.id/sitemap.xml tanpa news-sitemap.xml', () => {
      const robotsConfig = robots()
      expect(robotsConfig.sitemap).toBe('https://www.aplesi.my.id/sitemap.xml')
      expect(robotsConfig.host).toBe('https://www.aplesi.my.id')
    })

    it('memiliki aturan untuk Googlebot dan crawler AdSense yang mengizinkan crawl', () => {
      const robotsConfig = robots()
      const rules = Array.isArray(robotsConfig.rules) ? robotsConfig.rules : [robotsConfig.rules]

      const googlebotRule = rules.find((r) => r.userAgent === 'Googlebot')
      expect(googlebotRule).toBeDefined()
      expect(googlebotRule?.allow).toBe('/')

      const adsenseRule = rules.find((r) => r.userAgent === 'Mediapartners-Google')
      expect(adsenseRule).toBeDefined()
      expect(adsenseRule?.allow).toBe('/')
    })
  })

  describe('sitemap()', () => {
    it('menghasilkan sitemap valid dengan halaman statis, kategori, dan artikel', async () => {
      vi.spyOn(dbArtikel, 'getSitemapData').mockResolvedValueOnce([
        {
          slug: 'panduan-budidaya-lele-bioflok',
          tanggal: '2026-11-17',
          diperbarui: '2026-11-17',
        },
        {
          slug: 'hubungi-kami', // Harus di-filter oleh EXCLUDED_SLUGS
          tanggal: '2026-11-17',
        },
      ])

      const sitemapEntries = await sitemap()

      // Memastikan URL root, artikel, privacy-policy, disclaimer ada
      const urls = sitemapEntries.map((e) => e.url)
      expect(urls).toContain('https://www.aplesi.my.id')
      expect(urls).toContain('https://www.aplesi.my.id/artikel')
      expect(urls).toContain('https://www.aplesi.my.id/privacy-policy')
      expect(urls).toContain('https://www.aplesi.my.id/disclaimer')
      expect(urls).toContain('https://www.aplesi.my.id/kontak')
      expect(urls).toContain('https://www.aplesi.my.id/tentang-kami')

      // Artikel yang di-exclude tidak boleh masuk
      expect(urls).not.toContain('https://www.aplesi.my.id/artikel/hubungi-kami')

      // Artikel yang valid harus masuk
      expect(urls).toContain('https://www.aplesi.my.id/artikel/panduan-budidaya-lele-bioflok')

      // Validasi struktur setiap entry
      for (const entry of sitemapEntries) {
        expect(entry.url).toMatch(/^https:\/\/www\.aplesi\.my\.id/)
        expect(entry.lastModified).toBeInstanceOf(Date)
        expect(entry.changeFrequency).toBeDefined()
        expect(typeof entry.priority).toBe('number')
      }
    })

    it('tetap mengembalikan halaman statis dan kategori jika getSitemapData gagal', async () => {
      vi.spyOn(dbArtikel, 'getSitemapData').mockRejectedValueOnce(new Error('D1 connection timeout'))

      const sitemapEntries = await sitemap()
      expect(sitemapEntries.length).toBeGreaterThan(0)
      const urls = sitemapEntries.map((e) => e.url)
      expect(urls).toContain('https://www.aplesi.my.id')
      expect(urls).toContain('https://www.aplesi.my.id/kategori/pembenihan')
    })
  })
})
