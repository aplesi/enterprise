// app/(blog)/artikel/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { getAllArtikel } from '@/lib/db/artikel'
import { formatTanggal, estimasiWacaBaca } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Artikel Budidaya Lele Terlengkap',
  description: 'Kumpulan artikel, tips, dan panduan budidaya lele terlengkap. Update setiap hari dengan konten berkualitas dari para ahli.',
  alternates: { canonical: 'https://www.aplesi.my.id/artikel' },
}

const KATEGORI_LIST = ['Semua', 'Pembenihan', 'Pakan', 'Penyakit & Pengobatan', 'Manajemen Kolam', 'Panen & Pascapanen', 'Bisnis & Pemasaran', 'Tips & Trik', 'Teknologi']

export default function ArtikelIndexPage({
  searchParams,
}: {
  searchParams: { kategori?: string; halaman?: string }
}) {
  const kategoriAktif = searchParams.kategori || 'Semua'
  const halaman = parseInt(searchParams.halaman || '1')
  const perHalaman = 12

  let semuaArtikel = getAllArtikel()
  if (kategoriAktif !== 'Semua') {
    semuaArtikel = semuaArtikel.filter((a) => a.kategori === kategoriAktif)
  }

  const total = semuaArtikel.length
  const totalHalaman = Math.ceil(total / perHalaman)
  const artikelHalaman = semuaArtikel.slice((halaman - 1) * perHalaman, halaman * perHalaman)
  const artikelUtama = halaman === 1 ? artikelHalaman[0] : null
  const artikelSisa = artikelUtama ? artikelHalaman.slice(1) : artikelHalaman

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Artikel Budidaya Lele</h1>
        <p className="text-gray-500">
          {total} artikel tersedia · Update setiap hari
        </p>
      </div>

      {/* Filter Kategori */}
      <div className="flex gap-2 flex-wrap mb-8 pb-6 border-b border-gray-200">
        {KATEGORI_LIST.map((kat) => (
          <Link
            key={kat}
            href={kat === 'Semua' ? '/artikel' : `/artikel?kategori=${encodeURIComponent(kat)}`}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
              kategoriAktif === kat
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-green-400 hover:text-green-600'
            }`}
          >
            {kat}
          </Link>
        ))}
      </div>

      {/* Artikel Utama (Featured) */}
      {artikelUtama && (
        <Link href={`/artikel/${artikelUtama.slug}`} className="block mb-10 group">
          <div className="grid md:grid-cols-2 gap-6 bg-white rounded-2xl overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="relative h-64 md:h-full min-h-[240px] bg-gray-100">
              {artikelUtama.gambar && (
                <Image src={artikelUtama.gambar} alt={artikelUtama.judul} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
              )}
              <span className="absolute top-4 left-4 badge-green">Featured</span>
            </div>
            <div className="p-6 flex flex-col justify-center">
              <span className="badge bg-green-50 text-green-600 mb-3 w-fit">{artikelUtama.kategori}</span>
              <h2 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-green-600 transition-colors leading-tight">
                {artikelUtama.judul}
              </h2>
              <p className="text-gray-500 mb-5 line-clamp-3">{artikelUtama.ringkasan}</p>
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <span>{formatTanggal(artikelUtama.tanggal)}</span>
                <span>·</span>
                <span>{estimasiWacaBaca(artikelUtama.konten)} menit baca</span>
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* Grid Artikel */}
      {artikelSisa.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {artikelSisa.map((artikel) => (
            <Link key={artikel.slug} href={`/artikel/${artikel.slug}`} className="card group">
              <div className="relative h-48 bg-gray-100">
                {artikel.gambar && (
                  <Image src={artikel.gambar} alt={artikel.judul} fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300" />
                )}
                <span className="absolute top-3 left-3 badge-green">{artikel.kategori}</span>
              </div>
              <div className="p-4">
                <h2 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-green-600 transition-colors">
                  {artikel.judul}
                </h2>
                <p className="text-gray-500 text-sm line-clamp-2 mb-3">{artikel.ringkasan}</p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{formatTanggal(artikel.tanggal)}</span>
                  <span>{estimasiWacaBaca(artikel.konten)} mnt</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">📝</div>
          <p>Belum ada artikel di kategori ini.</p>
        </div>
      )}

      {/* Pagination */}
      {totalHalaman > 1 && (
        <div className="flex justify-center gap-2 mt-12">
          {halaman > 1 && (
            <Link href={`/artikel?halaman=${halaman - 1}${kategoriAktif !== 'Semua' ? `&kategori=${encodeURIComponent(kategoriAktif)}` : ''}`}
              className="btn-secondary px-5">← Sebelumnya</Link>
          )}
          {Array.from({ length: totalHalaman }, (_, i) => i + 1).map((p) => (
            <Link key={p}
              href={`/artikel?halaman=${p}${kategoriAktif !== 'Semua' ? `&kategori=${encodeURIComponent(kategoriAktif)}` : ''}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                p === halaman
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-green-400'
              }`}>
              {p}
            </Link>
          ))}
          {halaman < totalHalaman && (
            <Link href={`/artikel?halaman=${halaman + 1}${kategoriAktif !== 'Semua' ? `&kategori=${encodeURIComponent(kategoriAktif)}` : ''}`}
              className="btn-secondary px-5">Berikutnya →</Link>
          )}
        </div>
      )}
    </div>
  )
}
