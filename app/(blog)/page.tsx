// app/(blog)/page.tsx
import Link from 'next/link'
import Image from 'next/image'
import { getAllArtikel, getArtikelTerbaru } from '@/lib/db/artikel'
import { formatTanggal, estimasiWacaBaca } from '@/lib/utils'

export default async function HomePage() {
  const artikelTerbaru = await getArtikelTerbaru(6)

  return (
    <main>
      {/* Hero */}
      <section className="bg-gradient-to-br from-green-700 to-green-900 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <span className="badge bg-green-500/30 text-green-100 mb-4 inline-block">
            Portal Budidaya Lele #1 Indonesia
          </span>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            Sukses Budidaya Lele<br />Mulai dari Sini
          </h1>
          <p className="text-green-100 text-lg mb-8 max-w-2xl mx-auto">
            Tips, tutorial, dan panduan lengkap budidaya lele dari para ahli.
            Update artikel setiap hari.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/artikel" className="btn-primary bg-white text-green-700 hover:bg-green-50">
              Baca Artikel
            </Link>
            <Link href="/produk" className="btn-secondary border-white/30 text-white hover:bg-white/10">
              Lihat Produk
            </Link>
          </div>
        </div>
      </section>

      {/* Artikel Terbaru */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Artikel Terbaru</h2>
          <Link href="/artikel" className="text-green-600 hover:text-green-700 text-sm font-medium">
            Lihat semua →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {artikelTerbaru.map((artikel) => (
            <Link key={artikel.slug} href={`/artikel/${artikel.slug}`} className="card group">
              <div className="relative h-48 bg-gray-100">
                {artikel.gambar && (
                  <Image
                    src={artikel.gambar}
                    alt={artikel.judul}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                )}
                <span className="absolute top-3 left-3 badge-green">
                  {artikel.kategori}
                </span>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-green-600 transition-colors">
                  {artikel.judul}
                </h3>
                <p className="text-gray-500 text-sm line-clamp-2 mb-3">
                  {artikel.ringkasan}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{formatTanggal(artikel.tanggal)}</span>
                  <span>{estimasiWacaBaca(artikel.konten)} menit baca</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Kategori */}
      <section className="bg-gray-50 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Jelajahi Kategori</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { nama: 'Pembenihan', icon: '🥚', slug: 'pembenihan' },
              { nama: 'Pakan', icon: '🌿', slug: 'pakan' },
              { nama: 'Penyakit', icon: '💊', slug: 'penyakit' },
              { nama: 'Panen', icon: '🎣', slug: 'panen' },
              { nama: 'Kolam', icon: '🏊', slug: 'kolam' },
              { nama: 'Bisnis', icon: '💰', slug: 'bisnis' },
              { nama: 'Produk', icon: '🛒', slug: 'produk' },
              { nama: 'Tips', icon: '💡', slug: 'tips' },
            ].map((kat) => (
              <Link
                key={kat.slug}
                href={`/kategori/${kat.slug}`}
                className="card p-4 text-center hover:border-green-300 hover:bg-green-50"
              >
                <div className="text-3xl mb-2">{kat.icon}</div>
                <div className="font-medium text-gray-700 text-sm">{kat.nama}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          Dapatkan Tips Budidaya Lele Gratis
        </h2>
        <p className="text-gray-500 mb-6">
          Daftar newsletter dan dapatkan artikel terbaru langsung di email kamu.
        </p>
        <form className="flex gap-2 max-w-md mx-auto" action="/api/subscriber" method="POST">
          <input
            type="email"
            name="email"
            placeholder="email@kamu.com"
            className="admin-input flex-1"
            required
          />
          <button type="submit" className="btn-primary whitespace-nowrap">
            Daftar Gratis
          </button>
        </form>
      </section>
    </main>
  )
}
