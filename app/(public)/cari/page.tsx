// app/(blog)/cari/page.tsx

import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { getAllArtikel } from '@/lib/db/artikel'
import { formatTanggal, estimasiWacaBaca } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Cari Artikel',
  description: 'Cari artikel budidaya ikan di Aplesi',
  robots: { index: false }, // jangan index halaman hasil pencarian
}

export default async function CariPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const query = q?.toLowerCase().trim() || ''

  const semuaArtikel = await getAllArtikel()
  const hasil = query
    ? semuaArtikel.filter(
        (a) =>
          a.judul.toLowerCase().includes(query) ||
          a.ringkasan.toLowerCase().includes(query) ||
          a.tags.some((t) => t.toLowerCase().includes(query)) ||
          a.kategori.toLowerCase().includes(query)
      )
    : []

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Search bar */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {query ? `Hasil pencarian: "${query}"` : 'Cari Artikel'}
        </h1>
        <form action="/cari" method="GET">
          <div className="flex gap-2">
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Cari artikel budidaya ikan..."
              className="admin-input flex-1 text-base py-3"
              autoFocus
            />
            <button type="submit" className="btn-primary px-6">
              🔍 Cari
            </button>
          </div>
        </form>
      </div>

      {/* Hasil */}
      {query && (
        <div>
          <p className="text-sm text-gray-500 mb-6">
            Ditemukan <strong>{hasil.length}</strong> artikel untuk "{query}"
          </p>

          {hasil.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">🔍</div>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                Artikel tidak ditemukan
              </h2>
              <p className="text-gray-500 mb-6">
                Coba gunakan kata kunci yang berbeda
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {['ikan nila', 'pakan', 'penyakit', 'kolam terpal', 'panen'].map((saran) => (
                  <Link
                    key={saran}
                    href={`/cari?q=${encodeURIComponent(saran)}`}
                    className="badge-green px-3 py-1.5 hover:bg-green-200 transition-colors"
                  >
                    {saran}
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {hasil.map((artikel) => (
                <Link
                  key={artikel.slug}
                  href={`/artikel/${artikel.slug}`}
                  className="flex gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md hover:border-green-300 transition-all group"
                >
                  {artikel.gambar && (
                    <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                      <Image
                        src={artikel.gambar}
                        alt={artikel.judul}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="badge-green text-xs">{artikel.kategori}</span>
                    </div>
                    <h2 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors mb-1 line-clamp-1">
                      {highlight(artikel.judul, query)}
                    </h2>
                    <p className="text-sm text-gray-500 line-clamp-2">
                      {artikel.ringkasan}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                      <span>{formatTanggal(artikel.tanggal)}</span>
                      <span>·</span>
                      <span>{estimasiWacaBaca(artikel.konten)} mnt baca</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pencarian populer (jika belum ada query) */}
      {!query && (
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Pencarian Populer</h2>
          <div className="flex flex-wrap gap-2">
            {[
              'budidaya ikan nila', 'pakan ikan alami', 'kolam terpal',
              'penyakit white spot', 'cara panen ikan', 'bioflok',
              'nila merah', 'probiotik ikan', 'analisa usaha ikan',
            ].map((topik) => (
              <Link
                key={topik}
                href={`/cari?q=${encodeURIComponent(topik)}`}
                className="px-4 py-2 bg-gray-100 hover:bg-green-100 hover:text-green-700 text-gray-700 rounded-full text-sm transition-colors"
              >
                🔍 {topik}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Highlight kata yang dicari dalam teks
function highlight(text: string, query: string): React.ReactNode {
  if (!query) return text
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  const parts = text.split(regex)
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-yellow-100 text-yellow-800 rounded px-0.5">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  )
}
