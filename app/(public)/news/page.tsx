import type { Metadata } from 'next'
import Link from 'next/link'
import { getBeritaPerikanan } from '@/lib/news/scraper'
import { waktuRelatif, formatTanggal } from '@/lib/utils'
import { ItemListJsonLd } from '@/components/seo/JsonLd'

export const revalidate = 300 // cache 5 menit

export const metadata: Metadata = {
  title: 'Berita Perikanan Terkini',
  description:
    'Kumpulan berita perikanan dan budidaya ikan terbaru dari media Indonesia maupun internasional, diperbarui otomatis.',
  alternates: { canonical: 'https://www.aplesi.my.id/news' },
}

const FILTER_OPTIONS: { label: string; value: string }[] = [
  { label: 'Semua', value: 'semua' },
  { label: 'Nasional', value: 'nasional' },
  { label: 'Internasional', value: 'internasional' },
]

function labelKategori(kategori: string): string {
  return kategori === 'internasional' ? 'Internasional' : 'Nasional'
}

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ kategori?: string; limit?: string }>
}) {
  const params = await searchParams
  const kategoriAktif = params.kategori === 'nasional' || params.kategori === 'internasional'
    ? params.kategori
    : 'semua'
  const limit = Math.max(parseInt(params.limit || '13', 10) || 13, 1)

  const { data, updatedAt } = await getBeritaPerikanan()

  const filtered =
    kategoriAktif === 'semua' ? data : data.filter((n) => n.kategori === kategoriAktif)

  const ditampilkan = filtered.slice(0, limit)
  const featured = ditampilkan[0]
  const sisanya = ditampilkan.slice(1)
  const masihAda = filtered.length > limit

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white">
      <ItemListJsonLd
        namaHalaman="Berita Perikanan Terkini"
        deskripsi="Kumpulan berita perikanan dan budidaya ikan terbaru dari media Indonesia maupun internasional, diperbarui otomatis."
        urlHalaman="https://www.aplesi.my.id/news"
        items={ditampilkan.map((n) => ({ nama: n.judul, url: n.url }))}
      />
      <div className="container-custom pt-28 pb-16">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-midnight/5 rounded-full mb-6">
            <div className="w-2 h-2 rounded-full bg-azure animate-pulse"></div>
            <span className="text-sm font-semibold text-midnight">
              Diperbarui {waktuRelatif(updatedAt)}
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-midnight mb-6 tracking-tight">
            Berita <span className="text-gradient-ocean">Perikanan</span>
          </h1>

          <p className="text-xl text-gray-600">
            Berita perikanan &amp; budidaya ikan terbaru dari media Indonesia dan internasional
          </p>
        </div>

        {/* Filter Kategori */}
        <div className="mb-12">
          <div className="flex gap-2 flex-wrap justify-center">
            {FILTER_OPTIONS.map((opt) => (
              <Link
                key={opt.value}
                href={opt.value === 'semua' ? '/news' : `/news?kategori=${opt.value}`}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  kategoriAktif === opt.value
                    ? 'bg-azure text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-azure hover:text-white'
                }`}
              >
                {opt.label}
              </Link>
            ))}
          </div>
        </div>

        {ditampilkan.length === 0 ? (
          <div className="text-center text-gray-500 py-24">
            <p className="text-lg font-semibold text-midnight mb-2">Belum ada berita yang berhasil diambil</p>
            <p className="text-sm">Sumber berita mungkin sedang tidak bisa diakses. Coba muat ulang halaman ini beberapa saat lagi.</p>
          </div>
        ) : (
          <>
            {/* Featured News */}
            {featured && (
              <div className="mb-12">
                <a href={featured.url} target="_blank" rel="noopener noreferrer nofollow" className="group block">
                  <div className="card-modern overflow-hidden hover:shadow-luxury-lg transition-all duration-500 hover:-translate-y-1">
                    <div className="grid lg:grid-cols-2 gap-0">
                      {/* Image — dari RSS atau gradient fallback */}
                      <div className="relative h-64 lg:h-full min-h-[280px] overflow-hidden">
                        {featured.imageUrl ? (
                          <img
                            src={featured.imageUrl}
                            alt={featured.judul}
                            className="absolute inset-0 w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-azure/25 via-midnight/10 to-midnight/40 flex items-center justify-center">
                            <span className="relative text-white font-bold text-xl px-8 text-center drop-shadow">
                              {featured.sumber}
                            </span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-midnight/60 to-transparent"></div>
                        <div className="absolute top-6 left-6">
                          <span className="px-4 py-2 bg-azure text-white rounded-full text-xs font-bold shadow-lg flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                            Terbaru
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-8 lg:p-12 flex flex-col justify-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-azure/10 text-azure rounded-full text-xs font-bold mb-4 w-fit">
                          <span>{labelKategori(featured.kategori)}</span>
                          <span className="opacity-40">•</span>
                          <span>{featured.sumber}</span>
                        </div>

                        <h2 className="text-3xl lg:text-4xl font-bold text-midnight mb-4 group-hover:text-azure transition-colors leading-tight">
                          {featured.judul}
                        </h2>

                        {featured.ringkasan && (
                          <p className="text-gray-600 mb-6 line-clamp-3 leading-relaxed text-lg">
                            {featured.ringkasan}
                          </p>
                        )}

                        <div className="flex items-center gap-6 text-sm text-gray-500 mb-6">
                          <div className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
                              <line x1="16" x2="16" y1="2" y2="6"/>
                              <line x1="8" x2="8" y1="2" y2="6"/>
                              <line x1="3" x2="21" y1="10" y2="10"/>
                            </svg>
                            <span>{formatTanggal(featured.tanggal)}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-azure font-bold group-hover:gap-4 transition-all">
                          <span>Baca di {featured.sumber}</span>
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14"/>
                            <path d="m12 5 7 7-7 7"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </a>
              </div>
            )}

            {/* News Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {sisanya.map((news, idx) => (
                <a
                  key={`${news.url}-${idx}`}
                  href={news.url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="group"
                >
                  <article className="card-modern overflow-hidden hover:shadow-luxury transition-all duration-500 hover:-translate-y-2 h-full flex flex-col">
                    <div className="relative h-36 overflow-hidden">
                      {news.imageUrl ? (
                        <img
                          src={news.imageUrl}
                          alt={news.judul}
                          className="absolute inset-0 w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-azure/10 via-white to-midnight/10 flex items-center justify-center">
                          <span className="text-midnight/70 font-bold text-sm px-4 text-center">{news.sumber}</span>
                        </div>
                      )}
                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1.5 bg-white/95 backdrop-blur-sm text-midnight rounded-full text-xs font-bold">
                          {labelKategori(news.kategori)}
                        </span>
                      </div>
                    </div>

                    <div className="p-6 flex flex-col flex-1">
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
                          <line x1="16" x2="16" y1="2" y2="6"/>
                          <line x1="8" x2="8" y1="2" y2="6"/>
                          <line x1="3" x2="21" y1="10" y2="10"/>
                        </svg>
                        <span>{formatTanggal(news.tanggal)}</span>
                      </div>

                      <h3 className="text-xl font-bold text-midnight mb-3 line-clamp-2 group-hover:text-azure transition-colors leading-snug">
                        {news.judul}
                      </h3>

                      {news.ringkasan && (
                        <p className="text-gray-600 text-sm line-clamp-3 mb-4 leading-relaxed flex-1">
                          {news.ringkasan}
                        </p>
                      )}

                      <div className="flex items-center gap-2 text-azure font-semibold text-sm pt-4 border-t border-gray-100 mt-auto">
                        <span>Baca di {news.sumber}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform">
                          <path d="M5 12h14"/>
                          <path d="m12 5 7 7-7 7"/>
                        </svg>
                      </div>
                    </div>
                  </article>
                </a>
              ))}
            </div>

            {/* Load More */}
            {masihAda && (
              <div className="text-center mt-12">
                <Link
                  href={`/news?kategori=${kategoriAktif}&limit=${limit + 12}`}
                  className="inline-block px-8 py-3 bg-white border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:border-azure hover:text-azure transition-all"
                >
                  Muat Lebih Banyak
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
