import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
// Gambar berita pakai <img> biasa karena URL dari domain eksternal (OG image)
import Link from 'next/link'
import { getBeritaBySlug, getBeritaTerbaru } from '@/lib/db/berita'
import { formatTanggal, bersihkanRingkasan } from '@/lib/utils'
import { BreadcrumbJsonLd } from '@/components/seo/JsonLd'
import { extractFaq } from '@/lib/seo/faq'
import { AdsenseDisplay } from '@/components/ads/AdsenseDisplay'
import { marked } from 'marked'
import { NewsImageWithFallback } from '@/components/news/NewsImageWithFallback'

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

  const ringkasanBersih = bersihkanRingkasan(news.ringkasan, news.sumber)
  
  return {
    title: `${news.judul} | Aplesi News`,
    description: ringkasanBersih || `Berita selengkapnya mengenai ${news.judul} di Aplesi News.`,
    openGraph: {
      title: news.judul,
      description: ringkasanBersih,
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
  
  if (!news) notFound()

  // Ambil berita terbaru untuk sidebar
  const beritaTerbaru = await getBeritaTerbaru(5)
  // Filter out berita ini dari berita terbaru
  const beritaLainnya = beritaTerbaru.filter(b => b.slug !== slug).slice(0, 3)

  // Konten utama: gunakan konten_recap jika ada, atau buat bulletin jurnalistik terstruktur
  const kontenMarkdown = (news.kontenRecap && news.kontenRecap.trim().length > 50)
    ? news.kontenRecap
    : `## Duduk Perkara & Poin Kunci Berita

${bersihkanRingkasan(news.ringkasan, news.sumber) || news.judul}

Laporan terkini ini menyoroti dinamika penting pada sektor perikanan dan budidaya nasional yang berdampak langsung pada ekosistem budidaya ikan di Indonesia.

## Konteks & Dinamika Industri

Sektor perikanan budidaya nasional, khususnya komoditas unggulan seperti lele, nila, patin, dan udang, senantiasa dipengaruhi oleh faktor stabilitas bahan baku pakan, kondisi iklim perairan, serta regulasi distribusi pasar. Informasi dan pembaruan dari lapangan menjadi landasan bagi pembudidaya dalam mengambil keputusan operasional yang presisi.

## Analisis Lapangan: Dampak bagi Pembudidaya Rakyat

Bagi pembudidaya kolam terpal, kolam tanah, maupun sistem bioflok di tingkat akar rumput, perkembangan ini memerlukan langkah antisipasi terukur:
- **Efisiensi Pakan & FCR:** Mengontrol rasio pemberian pakan harian agar tidak terjadi pemborosan operasional di kolam.
- **Manajemen Mutu Air:** Memperhatikan sirkulasi dan aerasi air secara berkala untuk menjaga daya tahan ikan terhadap perubahan cuaca.
- **Kesiapan Panen & Pasar:** Menjalin komunikasi intensif dengan kelompok tani dan pengepul lokal untuk mengamankan harga serap pasar.

## Catatan Redaksi APLESI

Tim Redaksi APLESI menggarisbawahi pentingnya penerapan Cara Budidaya Ikan yang Baik (CBIB) serta kemandirian formulasi pakan alternatif bernutrisi tinggi sebagai tameng pelindung margin pembudidaya menghadapi fluktuasi ekonomi perikanan.`

  const faqItems = extractFaq(kontenMarkdown)

  const breadcrumbs = [
    { name: 'Beranda', url: 'https://www.aplesi.my.id' },
    { name: 'News', url: 'https://www.aplesi.my.id/news' },
    { name: news.judul, url: `https://www.aplesi.my.id/news/${news.slug || slug}` },
  ]

  // Render markdown to HTML
  const kontenHtml = await marked.parse(kontenMarkdown)

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
            <NewsImageWithFallback
              src={news.imageUrl}
              alt={news.judul}
              judul={news.judul}
              kategori={news.kategori}
              variant="detail"
            />

            {/* Konten Recap */}
            <article
              className="prose prose-lg prose-azure max-w-none prose-headings:text-midnight prose-p:text-gray-700 prose-a:text-azure"
              dangerouslySetInnerHTML={{ __html: kontenHtml }}
            />

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
                        className="flex flex-col gap-3 group items-start w-full">
                        <NewsImageWithFallback
                          src={b.imageUrl}
                          alt={b.judul}
                          judul={b.judul}
                          kategori="nasional"
                          variant="sidebar"
                        />
                        <div>
                          <p className="text-sm font-bold text-midnight group-hover:text-azure transition-colors line-clamp-2 leading-snug mb-2">
                            {b.judul}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
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
