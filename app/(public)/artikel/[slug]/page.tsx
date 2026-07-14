// app/(blog)/artikel/[slug]/page.tsx

import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getArtikelBySlug, getAllSlugs, getArtikelTerkait } from '@/lib/db/artikel'
import { generateMetaArtikel, generateJsonLd } from '@/lib/seo'
import { formatTanggal } from '@/lib/utils'
import { BreadcrumbJsonLd, FaqJsonLd, HowToJsonLd } from '@/components/seo/JsonLd'
import { extractFaq } from '@/lib/seo/faq'
import { extractHowToSteps } from '@/lib/seo/howto'

export const revalidate = 300 // cache 5 menit

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
              <div className="flex items-center gap-2 mb-3">
                <Link
                  href={`/kategori/${artikel.kategori.toLowerCase()}`}
                  className="badge-green hover:bg-green-200 transition-colors"
                >
                  {artikel.kategori}
                </Link>
                <span className="text-gray-300">·</span>
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
                {artikel.diperbarui && (
                  <>
                    <span>·</span>
                    <span>Diperbarui {formatTanggal(artikel.diperbarui)}</span>
                  </>
                )}
              </div>
            </header>

            {/* Gambar Utama */}
            {artikel.gambar && (
              <div className="relative w-full h-64 md:h-96 rounded-2xl overflow-hidden mb-8 bg-gray-100">
                <Image
                  src={artikel.gambar}
                  alt={artikel.judul}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, 700px"
                />
              </div>
            )}

            {/* Box Atribusi — hanya untuk artikel recap kategori "Berita Terkini",
                jujur nunjukkin ini berbasis laporan sumber eksternal (bukan
                liputan asli Aplesi) sesuai kesepakatan etika kutipan */}
            {artikel.sumberBerita && (
              <div className="mb-8 px-5 py-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-gray-700">
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

            {/* Konten Artikel -- pre-rendered HTML dari D1 database.
                Markdown→HTML dikonversi sekali saat insert/update via marked(),
                menghilangkan 100% CPU overhead react-markdown di render-time.
                (Sebelumnya react-markdown + remark-gfm memicu Error 1102 karena
                melebihi batas CPU 50ms Cloudflare Worker pada artikel panjang) */}
            <article
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: artikel.kontenHtml || artikel.konten }}
            />

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

              {/* Daftar Isi */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="font-semibold text-gray-800 mb-3 text-sm">📋 Daftar Isi</h3>
                <TableOfContents konten={artikel.konten} />
              </div>

              {/* Newsletter */}
              <div className="bg-green-700 text-white rounded-xl p-5">
                <h3 className="font-semibold mb-2">📬 Tips Gratis</h3>
                <p className="text-green-100 text-sm mb-4">
                  Dapatkan artikel budidaya ikan terbaru setiap hari.
                </p>
                <form action="/api/subscriber" method="POST" className="space-y-2">
                  <input type="email" name="email" placeholder="email@kamu.com"
                    className="w-full px-3 py-2 rounded-lg text-gray-800 text-sm focus:outline-none" required />
                  <button type="submit"
                    className="w-full bg-white text-green-700 font-medium py-2 rounded-lg text-sm hover:bg-green-50 transition-colors">
                    Daftar Gratis
                  </button>
                </form>
              </div>

              {/* Artikel Terkait */}
              {artikelTerkait.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <h3 className="font-semibold text-gray-800 mb-3 text-sm">📚 Artikel Terkait</h3>
                  <div className="space-y-3">
                    {artikelTerkait.map((a) => (
                      <Link key={a.slug} href={`/artikel/${a.slug}`}
                        className="block group">
                        <p className="text-sm text-gray-700 group-hover:text-green-600 transition-colors line-clamp-2 font-medium">
                          {a.judul}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{formatTanggal(a.tanggal)}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* AdSense Placeholder */}
              <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-5 text-center">
                <p className="text-xs text-gray-400">Iklan Google AdSense</p>
                <p className="text-xs text-gray-300 mt-1">300×250</p>
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
                  <div className="relative h-36 bg-gray-100">
                    {a.gambar && (
                      <Image src={a.gambar} alt={a.judul} fill className="object-cover" />
                    )}
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

// Komponen Daftar Isi (Table of Contents)
function TableOfContents({ konten }: { konten: string }) {
  const headings = konten.match(/^#{2,3}\s+.+$/gm) || []
  if (headings.length === 0) return <p className="text-xs text-gray-400">Tidak ada daftar isi</p>

  return (
    <nav aria-label="Daftar isi artikel">
      <ul className="space-y-1.5">
        {headings.map((h, i) => {
          const level = h.startsWith('### ') ? 3 : 2
          const text = h.replace(/^#{2,3}\s+/, '')
          const anchor = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-')
          return (
            <li key={i} className={level === 3 ? 'pl-3' : ''}>
              <a href={`#${anchor}`}
                className="text-xs text-gray-600 hover:text-green-600 transition-colors line-clamp-2 block leading-relaxed">
                {level === 3 ? '↳ ' : '• '}{text}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
