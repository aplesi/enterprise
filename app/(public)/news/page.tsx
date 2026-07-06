import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Berita Perikanan Terkini',
  description: 'Update berita dan informasi terkini seputar dunia perikanan dan budidaya Indonesia',
  alternates: { canonical: 'https://www.aplesi.my.id/news' },
}

// Sample news data - nanti bisa diganti dengan data dari API atau database
const NEWS_DATA = [
  {
    id: 1,
    judul: 'Pemerintah Alokasikan Rp 500 M untuk Pengembangan Budidaya Perikanan',
    ringkasan: 'Kementerian Kelautan dan Perikanan mengalokasikan dana untuk mendukung pembudidaya ikan di seluruh Indonesia',
    kategori: 'Kebijakan',
    tanggal: '2024-06-25',
    gambar: '/images/news/news-1.jpg',
    slug: 'pemerintah-alokasi-dana-budidaya'
  },
  {
    id: 2,
    judul: 'Harga Lele Konsumsi Naik 15% di Pasar Tradisional',
    ringkasan: 'Kenaikan permintaan menjelang lebaran membuat harga lele konsumsi meningkat signifikan',
    kategori: 'Pasar',
    tanggal: '2024-06-24',
    gambar: '/images/news/news-2.jpg',
    slug: 'harga-lele-naik'
  },
  {
    id: 3,
    judul: 'Teknologi Bioflok Tingkatkan Produktivitas Pembudidaya',
    ringkasan: 'Adopsi teknologi bioflok terbukti meningkatkan hasil panen hingga 40% dengan efisiensi pakan lebih baik',
    kategori: 'Teknologi',
    tanggal: '2024-06-23',
    gambar: '/images/news/news-3.jpg',
    slug: 'teknologi-bioflok'
  },
  {
    id: 4,
    judul: 'Ekspor Perikanan Indonesia Tembus USD 6 Miliar',
    ringkasan: 'Nilai ekspor produk perikanan Indonesia mencapai rekor baru dengan pertumbuhan 12% year-on-year',
    kategori: 'Ekspor',
    tanggal: '2024-06-22',
    gambar: '/images/news/news-4.jpg',
    slug: 'ekspor-perikanan'
  },
  {
    id: 5,
    judul: 'Pembudidaya Diminta Waspadai Penyakit Musim Hujan',
    ringkasan: 'Dinas Perikanan menghimbau pembudidaya untuk meningkatkan monitoring kualitas air dan kesehatan ikan',
    kategori: 'Peringatan',
    tanggal: '2024-06-21',
    gambar: '/images/news/news-5.jpg',
    slug: 'waspadai-penyakit'
  },
  {
    id: 6,
    judul: 'Koperasi Perikanan Raih Penghargaan Terbaik Nasional',
    ringkasan: 'Koperasi pembudidaya lele di Jawa Barat meraih penghargaan sebagai koperasi perikanan terbaik tahun ini',
    kategori: 'Prestasi',
    tanggal: '2024-06-20',
    gambar: '/images/news/news-6.jpg',
    slug: 'koperasi-terbaik'
  }
]

const KATEGORI_NEWS = ['Semua', 'Kebijakan', 'Pasar', 'Teknologi', 'Ekspor', 'Peringatan', 'Prestasi']

export default function NewsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white">
      <div className="container-custom pt-28 pb-16">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-midnight/5 rounded-full mb-6">
            <div className="w-2 h-2 rounded-full bg-azure animate-pulse"></div>
            <span className="text-sm font-semibold text-midnight">Update Terkini</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-midnight mb-6 tracking-tight">
            Berita <span className="text-gradient-ocean">Perikanan</span>
          </h1>
          
          <p className="text-xl text-gray-600">
            Informasi dan update terkini seputar dunia perikanan Indonesia
          </p>
        </div>

        {/* Filter Kategori */}
        <div className="mb-12">
          <div className="flex gap-2 flex-wrap justify-center">
            {KATEGORI_NEWS.map((kat) => (
              <button
                key={kat}
                className="px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-700 hover:bg-azure hover:text-white transition-all"
              >
                {kat}
              </button>
            ))}
          </div>
        </div>

        {/* Featured News */}
        <div className="mb-12">
          <Link href={`/news/${NEWS_DATA[0].slug}`} className="group block">
            <div className="card-modern overflow-hidden hover:shadow-luxury-lg transition-all duration-500 hover:-translate-y-1">
              <div className="grid lg:grid-cols-2 gap-0">
                {/* Image */}
                <div className="relative h-64 lg:h-full min-h-[320px] overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                  <div className="absolute inset-0 bg-gradient-to-t from-midnight/60 to-transparent"></div>
                  <div className="absolute top-6 left-6">
                    <span className="px-4 py-2 bg-azure text-white rounded-full text-xs font-bold shadow-lg flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                      Breaking News
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-8 lg:p-12 flex flex-col justify-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-azure/10 text-azure rounded-full text-xs font-bold mb-4 w-fit">
                    <span>{NEWS_DATA[0].kategori}</span>
                  </div>
                  
                  <h2 className="text-3xl lg:text-4xl font-bold text-midnight mb-4 group-hover:text-azure transition-colors leading-tight">
                    {NEWS_DATA[0].judul}
                  </h2>
                  
                  <p className="text-gray-600 mb-6 line-clamp-3 leading-relaxed text-lg">
                    {NEWS_DATA[0].ringkasan}
                  </p>
                  
                  <div className="flex items-center gap-6 text-sm text-gray-500 mb-6">
                    <div className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
                        <line x1="16" x2="16" y1="2" y2="6"/>
                        <line x1="8" x2="8" y1="2" y2="6"/>
                        <line x1="3" x2="21" y1="10" y2="10"/>
                      </svg>
                      <span>{NEWS_DATA[0].tanggal}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-azure font-bold group-hover:gap-4 transition-all">
                    <span>Baca Selengkapnya</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14"/>
                      <path d="m12 5 7 7-7 7"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* News Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {NEWS_DATA.slice(1).map((news) => (
            <Link key={news.id} href={`/news/${news.slug}`} className="group">
              <article className="card-modern overflow-hidden hover:shadow-luxury transition-all duration-500 hover:-translate-y-2 h-full flex flex-col">
                {/* Image */}
                <div className="relative h-56 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1.5 bg-white/95 backdrop-blur-sm text-midnight rounded-full text-xs font-bold">
                      {news.kategori}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
                      <line x1="16" x2="16" y1="2" y2="6"/>
                      <line x1="8" x2="8" y1="2" y2="6"/>
                      <line x1="3" x2="21" y1="10" y2="10"/>
                    </svg>
                    <span>{news.tanggal}</span>
                  </div>

                  <h3 className="text-xl font-bold text-midnight mb-3 line-clamp-2 group-hover:text-azure transition-colors leading-snug">
                    {news.judul}
                  </h3>
                  
                  <p className="text-gray-600 text-sm line-clamp-3 mb-4 leading-relaxed flex-1">
                    {news.ringkasan}
                  </p>
                  
                  <div className="flex items-center gap-2 text-azure font-semibold text-sm pt-4 border-t border-gray-100">
                    <span>Baca berita</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform">
                      <path d="M5 12h14"/>
                      <path d="m12 5 7 7-7 7"/>
                    </svg>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-12">
          <button className="px-8 py-3 bg-white border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:border-azure hover:text-azure transition-all">
            Muat Lebih Banyak
          </button>
        </div>
      </div>
    </div>
  )
}
