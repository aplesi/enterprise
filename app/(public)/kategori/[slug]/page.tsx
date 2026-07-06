// app/(blog)/kategori/[slug]/page.tsx

import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { getArtikelByKategori, getAllArtikel } from '@/lib/db/artikel'
import { formatTanggal, estimasiWacaBaca } from '@/lib/utils'

const KATEGORI_INFO: Record<string, { nama: string; deskripsi: string; icon: string }> = {
  pembenihan:       { nama: 'Pembenihan',            icon: '🥚', deskripsi: 'Panduan lengkap pembenihan dan pembibitan ikan, dari pemilihan induk hingga penetasan telur.' },
  pakan:            { nama: 'Pakan',                 icon: '🌿', deskripsi: 'Tips pakan dan nutrisi optimal untuk pertumbuhan ikan yang cepat dan hemat biaya.' },
  penyakit:         { nama: 'Penyakit & Pengobatan', icon: '💊', deskripsi: 'Cara mengenali, mencegah, dan mengobati berbagai penyakit umum pada ikan.' },
  kolam:            { nama: 'Manajemen Kolam',       icon: '🏊', deskripsi: 'Panduan pengelolaan kolam budidaya ikan, dari kolam terpal hingga bioflok.' },
  panen:            { nama: 'Panen & Pascapanen',    icon: '🎣', deskripsi: 'Teknik panen ikan yang benar dan cara pengolahan pascapanen untuk memaksimalkan keuntungan.' },
  bisnis:           { nama: 'Bisnis & Pemasaran',    icon: '💰', deskripsi: 'Strategi bisnis, analisa usaha, dan tips pemasaran produk ikan.' },
  tips:             { nama: 'Tips & Trik',           icon: '💡', deskripsi: 'Tips dan trik praktis dari para peternak ikan berpengalaman.' },
  teknologi:        { nama: 'Teknologi',             icon: '🔬', deskripsi: 'Inovasi dan teknologi terbaru dalam budidaya ikan modern.' },
}

export async function generateStaticParams() {
  return Object.keys(KATEGORI_INFO).map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const info = KATEGORI_INFO[slug]
  if (!info) return { title: 'Kategori tidak ditemukan' }
  return {
    title: `${info.nama} — Artikel Budidaya Ikan`,
    description: info.deskripsi,
    alternates: { canonical: `https://www.aplesi.my.id/kategori/${slug}` },
    openGraph: { title: `${info.nama} | Aplesi`, description: info.deskripsi },
  }
}

export default async function KategoriPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const info = KATEGORI_INFO[slug]
  if (!info) notFound()

  const artikelList = getArtikelByKategori(info.nama)

  // JSON-LD BreadcrumbList
  const breadcrumbJsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Beranda', item: 'https://www.aplesi.my.id' },
      { '@type': 'ListItem', position: 2, name: 'Kategori', item: 'https://www.aplesi.my.id/artikel' },
      { '@type': 'ListItem', position: 3, name: info.nama, item: `https://www.aplesi.my.id/kategori/${slug}` },
    ],
  })

  // Kategori lain untuk navigasi
  const kategoriLain = Object.entries(KATEGORI_INFO)
    .filter(([s]) => s !== slug)
    .slice(0, 6)

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: breadcrumbJsonLd }} />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link href="/" className="hover:text-green-600">Beranda</Link>
          <span>›</span>
          <Link href="/artikel" className="hover:text-green-600">Artikel</Link>
          <span>›</span>
          <span className="text-gray-600">{info.nama}</span>
        </nav>

        {/* Header Kategori */}
        <header className="mb-10">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-5xl">{info.icon}</span>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{info.nama}</h1>
              <p className="text-gray-500 mt-1">{artikelList.length} artikel tersedia</p>
            </div>
          </div>
          <p className="text-gray-600 max-w-2xl leading-relaxed">{info.deskripsi}</p>
        </header>

        <div className="flex gap-8">
          {/* Artikel Grid */}
          <main className="flex-1 min-w-0">
            {artikelList.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <div className="text-4xl mb-3">{info.icon}</div>
                <p>Belum ada artikel di kategori {info.nama}.</p>
                <p className="text-sm mt-2">Artikel akan segera hadir. Kembali lagi nanti!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {artikelList.map((artikel) => (
                  <Link key={artikel.slug} href={`/artikel/${artikel.slug}`} className="card group">
                    <div className="relative h-48 bg-gray-100">
                      {artikel.gambar && (
                        <Image src={artikel.gambar} alt={artikel.judul} fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300" />
                      )}
                    </div>
                    <div className="p-4">
                      <h2 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-green-600 transition-colors">
                        {artikel.judul}
                      </h2>
                      <p className="text-gray-500 text-sm line-clamp-2 mb-3">{artikel.ringkasan}</p>
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>{formatTanggal(artikel.tanggal)}</span>
                        <span>{estimasiWacaBaca(artikel.konten)} mnt baca</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </main>

          {/* Sidebar Kategori Lain */}
          <aside className="hidden lg:block w-56 flex-shrink-0">
            <div className="sticky top-6">
              <h3 className="font-semibold text-gray-800 mb-3 text-sm">Kategori Lainnya</h3>
              <div className="space-y-1">
                {kategoriLain.map(([slug, kat]) => (
                  <Link key={slug} href={`/kategori/${slug}`}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-green-50 hover:text-green-700 transition-colors">
                    <span>{kat.icon}</span>
                    <span>{kat.nama}</span>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  )
}
