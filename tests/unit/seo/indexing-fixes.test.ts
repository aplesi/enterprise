import { describe, it, expect, vi, beforeEach } from 'vitest'
import { XMLParser } from 'fast-xml-parser'
import { match } from 'path-to-regexp'
import fs from 'node:fs'
import path from 'node:path'
import * as dbArtikel from '@/lib/db/artikel'
import * as dbProduk from '@/lib/db/produk'
import * as dbBerita from '@/lib/db/berita'
import { cariKategoriByNama } from '@/config/kategori'
import { generateMetadata as generateMetadataArtikel } from '@/app/(public)/artikel/[slug]/page'
import { generateMetadata as generateMetadataKategori } from '@/app/(public)/kategori/[slug]/page'
import { generateMetadata as generateMetadataPenulis } from '@/app/(public)/penulis/[nama]/page'
import { generateMetadata as generateMetadataProduk } from '@/app/(public)/produk/[slug]/page'
import { generateMetadata as generateMetadataNews } from '@/app/(public)/news/[slug]/page'
import { GET as getRss } from '@/app/rss.xml/route'
import nextConfig from '@/next.config.js'

describe('Technical SEO Indexing & Crawlability Fixes', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('1. Dynamic Route generateMetadata notFound() triggers', () => {
    it('memanggil notFound() jika artikel tidak ditemukan (mencegah Soft-404)', async () => {
      vi.spyOn(dbArtikel, 'getArtikelBySlug').mockResolvedValueOnce(undefined)
      await expect(
        generateMetadataArtikel({ params: Promise.resolve({ slug: 'artikel-tidak-ada' }) })
      ).rejects.toThrow()
    })

    it('mengembalikan metadata jika artikel ditemukan', async () => {
      vi.spyOn(dbArtikel, 'getArtikelBySlug').mockResolvedValueOnce({
        slug: 'lele-bioflok',
        judul: 'Panduan Budidaya Lele Bioflok',
        ringkasan: 'Ringkasan panduan budidaya lele.',
        konten: 'Konten lengkap...',
        gambar: '/images/artikel/lele.webp',
        kategori: 'Manajemen Kolam',
        tags: ['lele', 'bioflok'],
        penulis: 'Tim Redaksi APLESI',
        tanggal: '2026-11-20',
        status: 'published',
      })

      const meta = await generateMetadataArtikel({ params: Promise.resolve({ slug: 'lele-bioflok' }) })
      expect(meta.title).toBeDefined()
    })

    it('memanggil notFound() jika kategori tidak valid', async () => {
      await expect(
        generateMetadataKategori({ params: Promise.resolve({ slug: 'kategori-fiktif-123' }) })
      ).rejects.toThrow()
    })

    it('mengembalikan metadata jika kategori valid', async () => {
      const meta = await generateMetadataKategori({ params: Promise.resolve({ slug: 'kolam' }) })
      expect(meta.title).toContain('Manajemen Kolam')
    })

    it('memanggil notFound() jika penulis tidak ditemukan', async () => {
      await expect(
        generateMetadataPenulis({ params: Promise.resolve({ nama: 'penulis-anonim' }) })
      ).rejects.toThrow()
    })

    it('mengembalikan metadata jika penulis ditemukan', async () => {
      const meta = await generateMetadataPenulis({ params: Promise.resolve({ nama: 'tim-redaksi-aplesi' }) })
      expect(meta.title).toContain('Tim Redaksi APLESI')
    })

    it('memanggil notFound() jika produk tidak ditemukan', async () => {
      vi.spyOn(dbProduk, 'getProdukBySlug').mockResolvedValueOnce(null)
      await expect(
        generateMetadataProduk({ params: Promise.resolve({ slug: 'produk-palsu' }) })
      ).rejects.toThrow()
    })

    it('memanggil notFound() jika news tidak ditemukan', async () => {
      vi.spyOn(dbBerita, 'getBeritaBySlug').mockResolvedValueOnce(null)
      await expect(
        generateMetadataNews({ params: Promise.resolve({ slug: 'berita-tidak-ada' }) })
      ).rejects.toThrow()
    })
  })

  describe('2. RSS Feed CDATA & XML Parsing', () => {
    it('membungkus kategori dan tag dalam CDATA agar karakter ampersand (&) tidak merusak parser XML', async () => {
      vi.spyOn(dbArtikel, 'getRssData').mockResolvedValueOnce([
        {
          slug: 'analisis-pemasaran-ikan',
          judul: 'Analisis Pemasaran & Distribusi Ikan 2026',
          ringkasan: 'Strategi pemasaran dan distribusi ikan air tawar & laut.',
          konten: 'Konten...',
          gambar: 'https://images.example.com/cover.webp?w=1200&format=webp',
          kategori: 'Bisnis & Pemasaran',
          tags: ['Panen & Pascapanen', 'Tips & Trik'],
          penulis: 'Tim Redaksi APLESI',
          tanggal: '2026-11-20',
          status: 'published',
        },
      ])

      const response = await getRss()
      const xmlText = await response.text()

      expect(xmlText).toContain('<category><![CDATA[Bisnis & Pemasaran]]></category>')
      expect(xmlText).toContain('<category><![CDATA[Panen & Pascapanen]]></category>')
      expect(xmlText).toContain('<category><![CDATA[Tips & Trik]]></category>')
      expect(xmlText).toContain('&amp;format=webp')

      // Parsing XML harus sukses tanpa throwing XML syntax error
      const parser = new XMLParser({
        ignoreAttributes: false,
        processEntities: true,
      })
      const parsed = parser.parse(xmlText)
      expect(parsed.rss).toBeDefined()
      expect(parsed.rss.channel.title).toContain('Aplesi')
    })

    it('menangani artikel dengan tag kosong atau tanggal tidak valid secara aman', async () => {
      vi.spyOn(dbArtikel, 'getRssData').mockResolvedValueOnce([
        {
          slug: 'artikel-minimal',
          judul: 'Artikel Minimal',
          ringkasan: 'Ringkasan minimal',
          konten: 'Konten...',
          gambar: '',
          kategori: 'Umum',
          tags: [] as string[],
          penulis: 'Tim Redaksi APLESI',
          tanggal: 'invalid-date-string',
          status: 'published',
        },
      ])

      const response = await getRss()
      const xmlText = await response.text()
      const parser = new XMLParser({ ignoreAttributes: false })
      const parsed = parser.parse(xmlText)
      expect(parsed.rss.channel.item).toBeDefined()
    })
  })

  describe('3. Legacy Blogger 301 Redirects Configuration', () => {
    it('mengembalikan redirect rules 301 untuk struktur URL Blogger lama dan cocok dengan pola URL', async () => {
      expect(nextConfig.redirects).toBeDefined()
      const redirects = await nextConfig.redirects!()

      const bloggerYearMonthRedirect = redirects.find(
        (r) => r.source === '/:year(\\d{4})/:month(\\d{2})/:slug([a-zA-Z0-9_-]+).html'
      )
      expect(bloggerYearMonthRedirect).toBeDefined()
      expect(bloggerYearMonthRedirect?.destination).toBe('/artikel/:slug')
      expect(bloggerYearMonthRedirect?.permanent).toBe(true)

      // Verifikasi regex matching
      const matchYearMonth = match(bloggerYearMonthRedirect!.source)
      const res1 = matchYearMonth('/2023/05/cara-budidaya-lele.html')
      expect(res1).not.toBe(false)
      if (res1) {
        expect((res1.params as Record<string, string>).slug).toBe('cara-budidaya-lele')
      }

      const bloggerSlugRedirect = redirects.find((r) => r.source === '/:slug([a-zA-Z0-9_-]+).html')
      expect(bloggerSlugRedirect).toBeDefined()
      expect(bloggerSlugRedirect?.destination).toBe('/artikel/:slug')
      expect(bloggerSlugRedirect?.permanent).toBe(true)

      const matchSlug = match(bloggerSlugRedirect!.source)
      const res2 = matchSlug('/cara-budidaya-lele.html')
      expect(res2).not.toBe(false)
      if (res2) {
        expect((res2.params as Record<string, string>).slug).toBe('cara-budidaya-lele')
      }

      const bloggerLabelRedirect = redirects.find((r) => r.source === '/search/label/:label*')
      expect(bloggerLabelRedirect).toBeDefined()
      expect(bloggerLabelRedirect?.destination).toBe('/artikel')
      expect(bloggerLabelRedirect?.permanent).toBe(true)

      const matchLabel = match(bloggerLabelRedirect!.source)
      expect(matchLabel('/search/label/Pembenihan')).not.toBe(false)

      const bloggerFeedsRedirect = redirects.find((r) => r.source === '/feeds/posts/default')
      expect(bloggerFeedsRedirect).toBeDefined()
      expect(bloggerFeedsRedirect?.destination).toBe('/rss.xml')
      expect(bloggerFeedsRedirect?.permanent).toBe(true)

      const matchFeeds = match(bloggerFeedsRedirect!.source)
      expect(matchFeeds('/feeds/posts/default')).not.toBe(false)
    })
  })

  describe('4. Category link and fallback helper behavior', () => {
    it('mencari kategori terdaftar dengan benar (termasuk case-insensitive & trim)', () => {
      const kolam = cariKategoriByNama('Manajemen Kolam')
      expect(kolam).toBeDefined()
      expect(kolam?.slug).toBe('kolam')

      const panen = cariKategoriByNama('Panen & Pascapanen')
      expect(panen).toBeDefined()
      expect(panen?.slug).toBe('panen')

      const pembenihanLower = cariKategoriByNama('pembenihan')
      expect(pembenihanLower).toBeDefined()
      expect(pembenihanLower?.slug).toBe('pembenihan')
    })

    it('mengembalikan undefined untuk kategori yang tidak terdaftar (seperti Blog)', () => {
      const blog = cariKategoriByNama('Blog')
      expect(blog).toBeUndefined()
    })
  })

  describe('5. Scripts URL standardization and deprecated ping removal', () => {
    it('scripts/auto-post.ts menggunakan apex domain aplesi.my.id', () => {
      const content = fs.readFileSync(path.join(process.cwd(), 'scripts/auto-post.ts'), 'utf-8')
      expect(content).not.toContain('https://www.aplesi.my.id')
    })

    it('scripts/generate-berita-artikel.mjs tidak mengandung www.aplesi.my.id dan menghapus ping sitemap google', () => {
      const content = fs.readFileSync(path.join(process.cwd(), 'scripts/generate-berita-artikel.mjs'), 'utf-8')
      expect(content).not.toContain('www.aplesi.my.id')
      expect(content).not.toContain('google.com/ping?sitemap')
    })
  })
})
