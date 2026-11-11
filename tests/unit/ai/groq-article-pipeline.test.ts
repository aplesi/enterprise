import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { generateArtikel, truncateAtWordBoundary } from '@/lib/ai/groq'
import { clearPoolCache } from '@/lib/ai/groq-pool'
import * as kvModule from '@/lib/cloudflare/kv'
import * as artikelDb from '@/lib/db/artikel'
import * as indexerModule from '@/lib/seo/indexer'
import { POST as publishHandler } from '@/app/api/generate/artikel/publish/route'
import type { InsertArtikelData } from '@/lib/db/artikel'

function buildPaddingWords(count: number): string {
  return Array.from({ length: count }, (_, idx) => `pakan${idx + 1}`).join(' ')
}

describe('truncateAtWordBoundary', () => {
  it('mempertahankan string yang panjangnya di bawah atau sama dengan batas', () => {
    const input = 'Panduan Fermentasi Pakan Pelet Nila'
    expect(truncateAtWordBoundary(input, 60)).toBe(input)
  })

  it('memotong string > 60 karakter pada batas kata tanpa tanda baca menggantung', () => {
    const titleWithColon =
      'Panduan Praktis Fermentasi Pakan Pelet Ikan Nila Unggul: Teknik Kolam Rakyat'
    const truncatedColon = truncateAtWordBoundary(titleWithColon, 60)

    expect(truncatedColon.length).toBeLessThanOrEqual(60)
    expect(truncatedColon).toBe('Panduan Praktis Fermentasi Pakan Pelet Ikan Nila Unggul')
    expect(truncatedColon).not.toMatch(/[,:;\-–—]$/)

    const titleLongWords =
      'Fermentasi Pakan Nila dengan Probiotik: Turunkan FCR & Tingkatkan Pertumbuhan'
    const truncatedLong = truncateAtWordBoundary(titleLongWords, 60)

    expect(truncatedLong.length).toBeLessThanOrEqual(60)
    expect(truncatedLong.endsWith('Tingkatkan')).toBe(false)
    expect(truncatedLong).toBe('Fermentasi Pakan Nila dengan Probiotik: Turunkan FCR &')
  })

  it('memotong string > 160 karakter pada batas kata dengan aman', () => {
    const longDesc =
      'Pelajari cara praktis fermentasi pakan pelet ikan nila memakai ember tertutup, probiotik EM4 perikanan, dan molase untuk menekan FCR kolam rakyat secara efisien, hemat biaya, serta berkelanjutan sepanjang siklus budidaya.'
    const truncated = truncateAtWordBoundary(longDesc, 160)

    expect(truncated.length).toBeLessThanOrEqual(160)
    expect(truncated).not.toMatch(/[,:;\-–—]$/)
    expect(longDesc.startsWith(truncated)).toBe(true)
  })

  it('memotong tepat di maxLength bila tidak terdapat spasi sama sekali', () => {
    const noSpaces = 'A'.repeat(80)
    const truncated = truncateAtWordBoundary(noSpaces, 60)
    expect(truncated).toHaveLength(60)
  })
})

describe('generateArtikel Phase 2 integration', () => {
  const originalEnv = process.env
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    vi.restoreAllMocks()
    clearPoolCache()
    process.env = {
      ...originalEnv,
      GROQ_API_KEY: 'gsk_test_phase2_mock_key_123456',
    }
    delete process.env.CF_ACCOUNT_ID
    delete process.env.CF_API_TOKEN
    delete process.env.CF_KV_NAMESPACE_ID
    delete process.env.GITHUB_TOKEN
  })

  afterEach(() => {
    clearPoolCache()
    process.env = originalEnv
    globalThis.fetch = originalFetch
  })

  it('menyuntikkan domain SNI/KKP, GEO rules, menghormati panjang pendek, membersihkan LaTeX/link halusinasi, dan memotong SEO metadata', async () => {
    vi.spyOn(kvModule, 'kvGet').mockResolvedValue(null)
    vi.spyOn(kvModule, 'kvSet').mockResolvedValue(true)
    vi.spyOn(kvModule, 'kvList').mockResolvedValue([])
    vi.spyOn(artikelDb, 'getArtikelTerkait').mockResolvedValue([
      {
        slug: 'pakan-alternatif-hemat-untuk-ikan-nila',
        judul: 'Pakan Alternatif Hemat untuk Ikan Nila',
        ringkasan: '',
        konten: '',
        gambar: '/images/og-default.png',
        kategori: 'Pakan',
        tags: [],
        penulis: 'Tim Redaksi APLESI',
        tanggal: '2026-11-10',
        status: 'published',
      },
    ])

    let capturedRequestBody: {
      messages?: Array<{ role: string; content: string }>
    } = {}

    const rawKonten = `
## Ringkasan Singkat
Panduan singkat fermentasi pakan ikan nila untuk kolam rakyat. ${buildPaddingWords(550)}

> [!NOTE]
> **Ringkasan Inti (Key Takeaways):**
> - DO kolam nila harus dijaga > 4.0 mg/L.

Rumus FCR kolam: $$FCR = \\frac{Total\\ Pakan}{Pertambahan\\ Bobot} \\times 100$$ pada tahun 2024.

Baca juga referensi lain: [Panduan Palsu Halusinasi](/artikel/slug-halusinasi-tidak-ada).

## FAQ

### Berapa lama pembibisan pakan nila dilakukan?
Cukup 15-30 menit dalam ember plastik sebelum ditebar ke kolam ikan nila.
`

    const mockFetch = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      if (typeof init?.body === 'string') {
        capturedRequestBody = JSON.parse(init.body) as {
          messages?: Array<{ role: string; content: string }>
        }
      }

      return new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  judul: 'Cara Fermentasi Pakan Pelet Ikan Nila dengan Probiotik Kolam Rakyat',
                  ringkasan:
                    'Panduan praktis pembibisan dan fermentasi pakan pelet ikan nila dengan probiotik EM4 serta molase di ember tertutup agar pakan lebih mudah dicerna, FCR lebih rendah, dan kolam tetap bersih.',
                  konten: rawKonten,
                  tags: ['fermentasi pakan nila', 'probiotik em4'],
                  seoTitle:
                    'Fermentasi Pakan Pelet Ikan Nila: Metode Praktis Kolam Rakyat Hemat Biaya',
                  seoDesc:
                    'Pelajari teknik pembibisan dan fermentasi pakan pelet ikan nila menggunakan probiotik EM4 dan molase dalam wadah ember tertutup agar efisiensi FCR optimal serta menekan amonia kolam.',
                  imagePrompt:
                    'Indonesian fish farmer standing outside concrete tilapia pond pouring feed pellets',
                }),
              },
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    })

    globalThis.fetch = mockFetch as unknown as typeof fetch

    const result = await generateArtikel({
      topik: 'Cara fermentasi pakan pelet ikan nila dengan probiotik',
      kategori: 'Pakan',
      keywords: ['fermentasi pakan nila', 'probiotik EM4'],
      panjang: 'pendek',
      tone: 'tutorial',
      generateGambar: false,
    })

    expect(mockFetch).toHaveBeenCalledTimes(1)

    const systemContent =
      capturedRequestBody.messages?.find((m) => m.role === 'system')?.content || ''
    const userContent =
      capturedRequestBody.messages?.find((m) => m.role === 'user')?.content || ''

    // Verifikasi injeksi SNI/KKP komoditas nila, GEO, dan anti-SOP laboratorium
    expect(systemContent).toContain('Oreochromis niloticus')
    expect(systemContent).toContain('> 4.0 mg/L')
    expect(systemContent).toContain('Ringkasan Inti (Key Takeaways)')
    expect(systemContent).toContain('sprayer stainless steel')

    // Verifikasi panjang 'pendek' dipatuhi tanpa konflik 2000-3000 kata
    expect(userContent).toContain('Target panjang total: 500-700 kata (minimal 500 kata).')
    expect(userContent).not.toContain('Target panjang total: 2000-3000 kata.')

    // Verifikasi panjang metadata SEO deterministik
    expect(result.seoTitle.length).toBeLessThanOrEqual(60)
    expect(result.seoDesc.length).toBeLessThanOrEqual(160)
    expect(result.ringkasan.length).toBeLessThanOrEqual(160)

    // Verifikasi sanitasi LaTeX, tahun usang, link halusinasi, serta internal link sah D1
    expect(result.konten).not.toContain('\\frac')
    expect(result.konten).not.toContain('\\times')
    expect(result.konten).not.toContain('$$')
    expect(result.konten).toContain('÷')
    expect(result.konten).toContain('×')
    expect(result.konten).not.toContain('2024')
    expect(result.konten).toContain('2026')
    expect(result.konten).not.toContain('/artikel/slug-halusinasi-tidak-ada')
    expect(result.konten).toContain('Panduan Palsu Halusinasi')
    expect(result.konten).toContain(
      '[Pakan Alternatif Hemat untuk Ikan Nila](/artikel/pakan-alternatif-hemat-untuk-ikan-nila)'
    )
  })
})

describe('POST /api/generate/artikel/publish sanitization & truncation', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.restoreAllMocks()
    process.env = { ...originalEnv }
    delete process.env.GITHUB_TOKEN
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('mensanitasi konten dan memotong seoTitle/seoDesc/ringkasan sebelum insert ke D1', async () => {
    vi.spyOn(artikelDb, 'generateUniqueSlug').mockResolvedValue('fermentasi-pakan-nila-2026')
    const insertSpy = vi.spyOn(artikelDb, 'insertArtikel').mockResolvedValue(1)
    vi.spyOn(indexerModule, 'notifySearchEngines').mockResolvedValue(undefined)

    const req = new NextRequest('http://localhost:3000/api/generate/artikel/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kategori: 'Pakan',
        artikel: {
          judul: 'Panduan Fermentasi Pakan Pelet Nila Hemat Biaya',
          slug: 'panduan-fermentasi-pakan-pelet-nila-hemat-biaya',
          ringkasan:
            'Ringkasan sangat panjang tentang cara fermentasi pakan pelet ikan nila memakai ember tertutup, probiotik EM4 perikanan, dan molase untuk menurunkan rasio konversi pakan serta menjaga amonia kolam tetap rendah.',
          konten:
            '## Rumus Pakan\n\n$$FCR = \\frac{Pakan}{Bobot}$$\n\n## Baca Juga\n\n- [Pakan Nila](/artikel/pakan-nila)',
          tags: ['nila', 'pakan'],
          seoTitle:
            'Panduan Lengkap Fermentasi Pakan Pelet Nila dengan Probiotik: Menekan FCR Kolam',
          seoDesc:
            'Deskripsi SEO melebihi seratus enam puluh karakter untuk menguji apakah endpoint publish memotong teks pada batas kata terdekat tanpa memotong kata secara sembarangan di akhir kalimat.',
          imagePrompt: 'farmer feeding tilapia from outside pond',
          gambarUrl: 'https://cdn.jsdelivr.net/gh/aplesi/enterprise@main/public/images/artikel/test.jpg',
        },
      }),
    })

    const res = await publishHandler(req)
    expect(res.status).toBe(200)
    expect(insertSpy).toHaveBeenCalledTimes(1)

    const insertedArg: InsertArtikelData = insertSpy.mock.calls[0][0]
    expect(insertedArg.seoTitle).toBeDefined()
    expect((insertedArg.seoTitle || '').length).toBeLessThanOrEqual(60)
    expect((insertedArg.seoDesc || '').length).toBeLessThanOrEqual(160)
    expect(insertedArg.ringkasan.length).toBeLessThanOrEqual(160)
    expect(insertedArg.konten).not.toContain('\\frac')
    expect(insertedArg.konten).not.toContain('$$')
    expect(insertedArg.konten).toContain('÷')
    expect(insertedArg.konten).toContain('[Pakan Nila](/artikel/pakan-nila)')
  })
})
