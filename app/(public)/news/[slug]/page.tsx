import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
// Gambar berita pakai <img> biasa karena URL dari domain eksternal (OG image)
import Link from 'next/link'
import { getBeritaBySlug, getBeritaTerbaru } from '@/lib/db/berita'
import { formatTanggal } from '@/lib/utils'
import { BreadcrumbJsonLd } from '@/components/seo/JsonLd'
import { extractFaq } from '@/lib/seo/faq'
import { AdsenseDisplay } from '@/components/ads/AdsenseDisplay'
import { marked } from 'marked'

export const revalidate = 300 // cache 5 menit

// Generate metadata per artikel (SEO otomatis)
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const news = await getBeritaBySlug(slug)
  
  if (!news) return { title: 'Berita tidak ditemukan' }
  
  return {
    title: `${news.judul} | Aplesi News`,
    description: news.ringkasan || `Berita selengkapnya mengenai ${news.judul} dari ${news.sumber}.`,
    openGraph: {
      title: news.judul,
      description: news.ringkasan,
      type: 'article',
      publishedTime: news.tanggal,
      images: news.imageUrl ? [news.imageUrl] : [],
    }
  }
}

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const news = await getBeritaBySlug(slug)
  
  if (!news || !news.kontenRecap) notFound()

  // Ambil berita terbaru untuk sidebar
  const beritaTerbaru = await getBeritaTerbaru(5)
  // Filter out berita ini dari berita terbaru
  const beritaLainnya = beritaTerbaru.filter(b => b.slug !== slug).slice(0, 3)

  const faqItems = extractFaq(news.kontenRecap)

  const breadcrumbs = [
    { name: 'Beranda', url: 'https://www.aplesi.my.id' },
    { name: 'News', url: 'https://www.aplesi.my.id/news' },
    { name: news.judul, url: `https://www.aplesi.my.id/news/${news.slug}` },
  ]

  // Render markdown to HTML
  const kontenHtml = await marked.parse(news.kontenRecap)

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} />
      
      {/* Article Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "NewsArticle",
            "headline": news.judul,
            "image": news.imageUrl ? [news.imageUrl] : [],
            "datePublished": news.tanggal,
            "author": [{
              "@type": "Organization",
              "name": "Aplesi AI News"
            }],
            "isBasedOn": {
              "@type": "CreativeWork",
              "url": news.url,
              "publisher": {
                "@type": "Organization",
                "name": news.sumber
              }
            }
          })
        }}
      />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex gap-8">

          {/* === KONTEN UTAMA === */}
          <main className="flex-1 min-w-0">

            {/* Breadcrumb */}
            <nav aria-label="breadcrumb" className="flex items-center gap-2 text-sm text-gray-400 mb-6">
              <Link href="/" className="hover:text-azure transition-colors">Beranda</Link>
              <span>›</span>
              <Link href="/news" className="hover:text-azure transition-colors">News</Link>
              <span>›</span>
              <span className="text-gray-600 line-clamp-1">{news.judul}</span>
            </nav>

            {/* Header Artikel */}
            <header className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-3 py-1 bg-azure/10 text-azure rounded-full text-xs font-bold uppercase tracking-wider">
                  {news.kategori === 'nasional' ? 'Indonesia' : 'Internasional'}
                </span>
                <span className="text-gray-300">·</span>
                <span className="text-sm text-gray-500 font-medium">Berita Terkini</span>
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-midnight leading-tight mb-6">
                {news.judul}
              </h1>

              {/* Meta Info */}
              <div className="flex items-center gap-4 text-sm text-gray-500 pb-6 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-azure/10 rounded-full flex items-center justify-center text-azure font-bold text-sm">
                    A
                  </div>
                  <span className="font-semibold text-gray-700">Aplesi AI News</span>
                </div>
                <span>·</span>
                <time dateTime={news.tanggal} className="font-medium">
                  {formatTanggal(news.tanggal)}
                </time>
              </div>
            </header>

            {/* Gambar Utama */}
            {news.imageUrl && (
              <div className="relative w-full h-64 md:h-[400px] rounded-2xl overflow-hidden mb-10 bg-gray-50 border border-gray-100 shadow-sm">
                <img
                  src={news.imageUrl}
                  alt={news.judul}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="eager"
                />
              </div>
            )}

            {/* Konten Recap */}
            <article
              className="prose prose-lg prose-azure max-w-none prose-headings:text-midnight prose-p:text-gray-700 prose-a:text-azure"
              dangerouslySetInnerHTML={{ __html: kontenHtml }}
            />

            {/* Box Atribusi — sangat penting untuk etika AI & AdSense */}
            <div className="mt-12 px-6 py-5 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-700 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0 shadow-sm border border-gray-100">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                  <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/>
                  <path d="M18 14h-8"/>
                  <path d="M15 18h-5"/>
                  <path d="M10 6h8v4h-8V6Z"/>
                </svg>
              </div>
              <div>
                <p className="font-medium mb-1 text-midnight">Sumber Informasi</p>
                <p className="text-gray-600 leading-relaxed">
                  Artikel di atas merupakan ringkasan yang ditulis ulang secara otomatis oleh AI berdasarkan laporan berita dari{' '}
                  <a
                    href={news.url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="font-semibold text-azure hover:underline inline-flex items-center gap-1"
                  >
                    {news.sumber}
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M7 7h10v10"/><path d="M7 17 17 7"/>
                    </svg>
                  </a>. Silakan kunjungi tautan tersebut untuk membaca berita selengkapnya dari sumber aslinya.
                </p>
              </div>
            </div>

            {/* FAQ Section */}
            {faqItems.length > 0 && (
              <section className="mt-12" aria-label="Pertanyaan yang Sering Diajukan">
                <h2 className="text-2xl font-bold text-midnight mb-6 flex items-center gap-3">
                  <span className="text-azure">❓</span> Pertanyaan Seputar Topik Ini
                </h2>
                <div className="space-y-4">
                  {faqItems.map((faq, i) => (
                    <details key={i} className="group border border-gray-200 rounded-xl overflow-hidden bg-white">
                      <summary className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-gray-50 font-semibold text-midnight transition-colors">
                        {faq.pertanyaan}
                        <span className="text-gray-400 group-open:rotate-180 transition-transform">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                        </span>
                      </summary>
                      <div className="px-6 pb-5 pt-1 text-gray-600 text-base leading-relaxed">
                        {faq.jawaban}
                      </div>
                    </details>
                  ))}
                </div>
              </section>
            )}
          </main>

          {/* === SIDEBAR === */}
          <aside className="hidden lg:block w-[320px] flex-shrink-0">
            <div className="sticky top-6 space-y-8">

              {/* Berita Terbaru */}
              {beritaLainnya.length > 0 && (
                <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                  <h3 className="font-bold text-midnight mb-5 text-sm uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-azure"></span>
                    Berita Lainnya
                  </h3>
                  <div className="space-y-6">
                    {beritaLainnya.map((b) => (
                      <Link key={b.url} href={b.slug ? `/news/${b.slug}` : b.url} target={b.slug ? undefined : "_blank"}
                        className="flex flex-col gap-3 group items-start">
                        {b.imageUrl && (
                          <div className="relative w-full h-32 bg-gray-100 rounded-xl overflow-hidden">
                            <img src={b.imageUrl} alt={b.judul} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-bold text-midnight group-hover:text-azure transition-colors line-clamp-2 leading-snug mb-2">
                            {b.judul}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                            <span>{b.sumber}</span>
                            <span>•</span>
                            <span>{formatTanggal(b.tanggal).split(' ')[0] + ' ' + formatTanggal(b.tanggal).split(' ')[1]}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* AdSense Vertical Banner */}
              <div className="w-full min-h-[600px] bg-gray-50 border border-gray-100 rounded-2xl overflow-hidden flex flex-col items-center justify-center">
                <span className="text-gray-400 text-sm font-medium mb-4">Advertisement</span>
                <AdsenseDisplay client="ca-pub-6392184859535334" slot="4847648907" />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  )
}
