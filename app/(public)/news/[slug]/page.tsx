import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'

// Sample data - nanti bisa diganti dengan fetch dari API/database
const NEWS_DETAIL = {
  'pemerintah-alokasi-dana-budidaya': {
    judul: 'Pemerintah Alokasikan Rp 500 M untuk Pengembangan Budidaya Perikanan',
    ringkasan: 'Kementerian Kelautan dan Perikanan mengalokasikan dana untuk mendukung pembudidaya ikan di seluruh Indonesia',
    kategori: 'Kebijakan',
    tanggal: '2024-06-25',
    penulis: 'Tim Redaksi Aplesi',
    gambar: '/images/news/news-1.jpg',
    konten: `
Jakarta - Kementerian Kelautan dan Perikanan (KKP) mengumumkan alokasi anggaran sebesar Rp 500 miliar untuk program pengembangan budidaya perikanan tahun ini. Dana ini akan disalurkan melalui berbagai skema bantuan kepada pembudidaya ikan di seluruh Indonesia.

Menteri Kelautan dan Perikanan menyatakan bahwa program ini bertujuan untuk meningkatkan produksi perikanan nasional sekaligus meningkatkan kesejahteraan para pembudidaya.

## Program Bantuan

Program bantuan yang akan disalurkan mencakup:

- Bantuan bibit ikan berkualitas
- Bantuan pakan ternak
- Peralatan budidaya modern
- Pelatihan dan pendampingan teknis
- Akses permodalan dengan bunga rendah

## Target Penerima

Program ini menargetkan 50.000 pembudidaya di 34 provinsi dengan prioritas pada:

1. Pembudidaya skala kecil dan menengah
2. Kelompok pembudidaya yang terdaftar
3. Daerah dengan potensi budidaya tinggi
4. Pembudidaya yang mengadopsi teknologi ramah lingkungan

Pendaftaran program akan dibuka mulai bulan depan melalui Dinas Perikanan setempat.
    `
  }
}

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}): Promise<Metadata> {
  const { slug } = await params
  const news = NEWS_DETAIL[slug as keyof typeof NEWS_DETAIL]
  
  if (!news) {
    return {
      title: 'Berita Tidak Ditemukan'
    }
  }

  return {
    title: news.judul,
    description: news.ringkasan,
    alternates: { canonical: `https://www.aplesi.my.id/news/${slug}` },
  }
}

export default async function NewsDetailPage({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  const { slug } = await params
  const news = NEWS_DETAIL[slug as keyof typeof NEWS_DETAIL]

  if (!news) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="bg-gradient-to-b from-gray-50 to-white pt-32 pb-16">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-8">
              <Link href="/" className="hover:text-azure transition-colors">Beranda</Link>
              <span>/</span>
              <Link href="/news" className="hover:text-azure transition-colors">News</Link>
              <span>/</span>
              <span className="text-midnight font-medium">{news.kategori}</span>
            </div>

            {/* Category Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-azure/10 text-azure rounded-full text-sm font-bold mb-6">
              <span>{news.kategori}</span>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-midnight mb-6 leading-tight">
              {news.judul}
            </h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-6 text-gray-600 pb-8 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <span className="text-sm">{news.penulis}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
                  <line x1="16" x2="16" y1="2" y2="6"/>
                  <line x1="8" x2="8" y1="2" y2="6"/>
                  <line x1="3" x2="21" y1="10" y2="10"/>
                </svg>
                <span className="text-sm">{news.tanggal}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container-custom py-12">
        <div className="max-w-4xl mx-auto">
          {/* Featured Image */}
          <div className="relative h-[400px] md:h-[500px] rounded-3xl overflow-hidden bg-gray-100 mb-12">
            <div className="absolute inset-0 bg-gradient-to-t from-midnight/20 to-transparent"></div>
          </div>

          {/* Article Content */}
          <div className="prose prose-lg max-w-none">
            {news.konten.split('\n').map((paragraph, idx) => {
              if (paragraph.trim().startsWith('##')) {
                return <h2 key={idx} className="text-2xl font-bold mt-8 mb-4">{paragraph.replace('##', '').trim()}</h2>
              } else if (paragraph.trim().startsWith('-')) {
                return <li key={idx} className="ml-6">{paragraph.replace('-', '').trim()}</li>
              } else if (paragraph.trim().match(/^\d+\./)) {
                return <li key={idx} className="ml-6">{paragraph.replace(/^\d+\./, '').trim()}</li>
              } else if (paragraph.trim()) {
                return <p key={idx} className="mb-4 text-gray-700 leading-relaxed">{paragraph.trim()}</p>
              }
              return null
            })}
          </div>

          {/* Share */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-gray-700">Bagikan:</span>
              <div className="flex gap-2">
                <button className="w-10 h-10 rounded-full bg-gray-100 hover:bg-azure hover:text-white transition-all flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </button>
                <button className="w-10 h-10 rounded-full bg-gray-100 hover:bg-azure hover:text-white transition-all flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </button>
                <button className="w-10 h-10 rounded-full bg-gray-100 hover:bg-emerald hover:text-white transition-all flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Back to News */}
          <div className="mt-12">
            <Link href="/news" className="inline-flex items-center gap-2 text-azure font-semibold hover:gap-3 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m12 19-7-7 7-7"/>
                <path d="M19 12H5"/>
              </svg>
              Kembali ke Berita
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
