// app/(blog)/artikel/[slug]/page.tsx

import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getArtikelBySlug, getAllSlugs, getArtikelTerkait } from '@/lib/db/artikel'
import { generateMetaArtikel, generateJsonLd } from '@/lib/seo'
import { formatTanggal } from '@/lib/utils'
import { BreadcrumbJsonLd, FaqJsonLd, HowToJsonLd } from '@/components/seo/JsonLd'
import { extractFaq } from '@/lib/seo/faq'
import { extractHowToSteps } from '@/lib/seo/howto'
import { AdsenseDisplay } from '@/components/ads/AdsenseDisplay'
import { ArticleImageWithFallback } from '@/components/blog/ArticleImageWithFallback'

export const revalidate = 300 // cache 5 menit
export const dynamicParams = true // Mengizinkan artikel D1 baru langsung dirender tanpa menunggu rebuild statis

// Generate static params untuk semua artikel
export async function generateStaticParams() {
  const slugs = await getAllSlugs()
  return slugs.map((slug) => ({ slug }))
}

// Generate metadata per artikel (SEO otomatis)
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const artikel = await getArtikelBySlug(slug)
  if (!artikel) return { title: 'Artikel tidak ditemukan' }
  return generateMetaArtikel(artikel)
}

export default async function ArtikelDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const artikel = await getArtikelBySlug(slug)
  if (!artikel) notFound()

  // Ambil artikel terkait (kategori sama, bukan artikel ini)
  // Ambil artikel terkait (kategori sama, bukan artikel ini)
  const artikelTerkait = await getArtikelTerkait(artikel.kategori, artikel.slug, 3)

  // Extract FAQ dari konten artikel (heading yang berbentuk pertanyaan)
  const faqItems = extractFaq(artikel.konten)

  // Extract langkah-langkah HowTo dari konten artikel (heading bernomor)
  const howToSteps = extractHowToSteps(artikel.konten)

  const breadcrumbs = [
    { name: 'Beranda', url: 'https://www.aplesi.my.id' },
    { name: artikel.kategori, url: `https://www.aplesi.my.id/kategori/${artikel.kategori.toLowerCase()}` },
    { name: artikel.judul, url: `https://www.aplesi.my.id/artikel/${artikel.slug}` },
  ]

  return (
    <>
      {/* === JSON-LD Schema === */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: generateJsonLd(artikel) }}
      />
      <BreadcrumbJsonLd items={breadcrumbs} />
      {faqItems.length > 0 && <FaqJsonLd items={faqItems} />}
      {howToSteps.length >= 2 && (
        <HowToJsonLd
          nama={artikel.judul}
          deskripsi={artikel.ringkasan}
          steps={howToSteps}
          gambar={artikel.gambar || undefined}
        />
      )}

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex gap-8">

          {/* === KONTEN UTAMA === */}
          <main className="flex-1 min-w-0">

            {/* Breadcrumb */}
            <nav aria-label="breadcrumb" className="flex items-center gap-2 text-sm text-gray-400 mb-6">
              <Link href="/" className="hover:text-green-600">Beranda</Link>
              <span>›</span>
              <Link href={`/kategori/${artikel.kategori.toLowerCase()}`} className="hover:text-green-600">
                {artikel.kategori}
              </Link>
              <span>›</span>
              <span className="text-gray-600 line-clamp-1">{artikel.judul}</span>
            </nav>

            {/* Header Artikel */}
            <header className="mb-8">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Link
                  href={`/kategori/${artikel.kategori.toLowerCase()}`}
                  className="badge-green hover:bg-green-200 transition-colors"
                >
                  {artikel.kategori}
                </Link>
                <time itemProp="dateModified" dateTime={artikel.diperbarui || artikel.tanggal} className="px-3 py-1 bg-green-50 text-green-700 font-medium rounded-full text-xs flex items-center gap-1 border border-green-100">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  Data diperbarui: {formatTanggal(artikel.diperbarui || artikel.tanggal)}
                </time>
                <span className="text-gray-300 ml-1">·</span>
                <span className="text-sm text-gray-400">{(artikel.waktuBaca ?? 0) > 0 ? artikel.waktuBaca : 1} menit baca</span>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-4">
                {artikel.judul}
              </h1>

              <p className="text-lg text-gray-600 leading-relaxed mb-5">
                {artikel.ringkasan}
              </p>

              {/* Meta Info */}
              <div className="flex items-center gap-4 text-sm text-gray-500 pb-5 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-sm">
                    {artikel.penulis.charAt(0)}
                  </div>
                  <span>{artikel.penulis}</span>
                </div>
                <span>·</span>
                <time dateTime={artikel.tanggal}>
                  {formatTanggal(artikel.tanggal)}
                </time>
              </div>
            </header>

            {/* Gambar Utama */}
            <ArticleImageWithFallback
              src={artikel.gambar}
              alt={artikel.judul}
              judul={artikel.judul}
              kategori={artikel.kategori}
              variant="detail"
              priority
            />

            {/* Konten Artikel -- pre-rendered HTML dari D1 database.
                Markdown→HTML dikonversi sekali saat insert/update via marked(),
                menghilangkan 100% CPU overhead react-markdown di render-time.
                (Sebelumnya react-markdown + remark-gfm memicu Error 1102 karena
                melebihi batas CPU 50ms Cloudflare Worker pada artikel panjang) */}
            <article
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: artikel.kontenHtml || artikel.konten }}
            />

            {/* Box Atribusi — hanya untuk artikel recap kategori "Berita Terkini",
                ditempatkan di akhir konten agar tidak mengganggu pengalaman baca */}
            {artikel.sumberBerita && (
              <div className="mt-8 px-5 py-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-gray-700">
                📰 Artikel ini merupakan rangkuman &amp; analisis berdasarkan laporan dari{' '}
                <a
                  href={artikel.sumberBerita.url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="font-semibold text-blue-700 hover:underline"
                >
                  {artikel.sumberBerita.nama}
                </a>
                {artikel.tanggalBerita && `, ${formatTanggal(artikel.tanggalBerita)}`}.
              </div>
            )}

            {/* Tags */}
            {artikel.tags.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <span className="text-sm font-medium text-gray-600 mr-3">Tag:</span>
                <div className="inline-flex flex-wrap gap-2">
                  {artikel.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/tag/${tag.toLowerCase().replace(/\s+/g, '-')}`}
                      className="text-sm bg-gray-100 hover:bg-green-100 hover:text-green-700 text-gray-600 px-3 py-1 rounded-full transition-colors"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* FAQ Section — penting untuk AI & Google SGE */}
            {faqItems.length > 0 && (
              <section className="mt-10" aria-label="Pertanyaan yang Sering Diajukan">
                <h2 className="text-xl font-bold text-gray-900 mb-5">
                  ❓ Pertanyaan yang Sering Diajukan
                </h2>
                <div className="space-y-4">
                  {faqItems.map((faq, i) => (
                    <details key={i} className="group border border-gray-200 rounded-xl overflow-hidden">
                      <summary className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 font-medium text-gray-800">
                        {faq.pertanyaan}
                        <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                      </summary>
                      <div className="px-5 pb-4 text-gray-600 text-sm leading-relaxed border-t border-gray-100">
                        {faq.jawaban}
                      </div>
                    </details>
                  ))}
                </div>
              </section>
            )}

            {/* Share */}
            <div className="mt-8 p-5 bg-green-50 rounded-xl border border-green-100">
              <p className="text-sm font-medium text-gray-700 mb-3">
                📢 Bagikan artikel ini:
              </p>
              <div className="flex gap-2 flex-wrap">
                {[
                  { label: 'WhatsApp', url: `https://wa.me/?text=${encodeURIComponent(artikel.judul + ' - https://aplesi.my.id/artikel/' + artikel.slug)}`, warna: 'bg-green-500 hover:bg-green-600' },
                  { label: 'Facebook', url: `https://facebook.com/sharer/sharer.php?u=https://aplesi.my.id/artikel/${artikel.slug}`, warna: 'bg-blue-600 hover:bg-blue-700' },
                  { label: 'Twitter/X', url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(artikel.judul)}&url=https://aplesi.my.id/artikel/${artikel.slug}`, warna: 'bg-gray-800 hover:bg-gray-900' },
                ].map((s) => (
                  <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer"
                    className={`text-sm text-white px-4 py-2 rounded-lg font-medium transition-colors ${s.warna}`}>
                    {s.label}
                  </a>
                ))}
              </div>
            </div>
          </main>

          {/* === SIDEBAR === */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-6 space-y-6">

              {/* Artikel Terkait */}
              {artikelTerkait.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider">🔥 Artikel Terkait</h3>
                  <div className="space-y-4">
                    {artikelTerkait.map((a) => (
                      <Link key={a.slug} href={`/artikel/${a.slug}`}
                        className="flex gap-3 group items-center">
                        <ArticleImageWithFallback
                          src={a.gambar}
                          alt={a.judul}
                          judul={a.judul}
                          kategori={a.kategori}
                          variant="sidebar"
                        />
                        <div>
                          <p className="text-sm text-gray-800 group-hover:text-green-600 transition-colors line-clamp-2 font-medium leading-tight">
                            {a.judul}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* AdSense Vertical Banner */}
              <div className="w-full min-h-[600px] bg-gray-50 rounded-xl overflow-hidden">
                <AdsenseDisplay client="ca-pub-6392184859535334" slot="4847648907" />
              </div>
            </div>
          </aside>
        </div>

        {/* Artikel Terkait (mobile) */}
        {artikelTerkait.length > 0 && (
          <section className="mt-12 pt-8 border-t border-gray-200 lg:hidden">
            <h2 className="text-xl font-bold text-gray-900 mb-5">Artikel Terkait</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {artikelTerkait.map((a) => (
                <Link key={a.slug} href={`/artikel/${a.slug}`} className="card">
                  <div className="relative h-36 bg-gray-100 overflow-hidden rounded-t-xl">
                    <ArticleImageWithFallback
                      src={a.gambar}
                      alt={a.judul}
                      judul={a.judul}
                      kategori={a.kategori}
                      variant="card"
                    />
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium text-gray-800 line-clamp-2">{a.judul}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  )
}

