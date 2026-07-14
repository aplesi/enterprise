import { getAllProduk, getKategoriProduk } from '@/lib/db/produk'
import Link from 'next/link'
import { ShoppingBag, Star, ExternalLink } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Produk Rekomendasi — Aplesi',
  description: 'Produk peralatan budidaya ikan pilihan dan terverifikasi oleh Tim Aplesi',
}

function formatRupiah(n: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
}

export default async function ProdukPage() {
  const produkList = await getAllProduk()
  const kategoriList = await getKategoriProduk()

  if (produkList.length === 0) {
    return (
      <div className="container mx-auto py-16 px-4 text-center">
        <ShoppingBag className="h-16 w-16 text-white/20 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-white mb-2">Produk Rekomendasi</h1>
        <p className="text-white/50">Produk rekomendasi akan segera hadir. Pantau terus!</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Produk Rekomendasi</h1>
        <p className="text-white/60">Peralatan dan kebutuhan budidaya ikan pilihan Tim Aplesi</p>
      </div>

      {/* Filter Kategori */}
      {kategoriList.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {kategoriList.map((k) => (
            <span key={k} className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/60 text-xs font-semibold">
              {k}
            </span>
          ))}
        </div>
      )}

      {/* Grid Produk */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {produkList.map((p) => (
          <Link
            key={p.id}
            href={`/produk/${p.slug}`}
            className="group rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden hover:border-aqua-glow/30 transition-all hover:shadow-glow"
          >
            {/* Gambar */}
            <div className="h-48 bg-white/5 flex items-center justify-center overflow-hidden">
              {p.gambar[0] ? (
                <img
                  src={p.gambar[0]}
                  alt={p.nama}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <ShoppingBag className="h-12 w-12 text-white/10" />
              )}
            </div>

            {/* Info */}
            <div className="p-4 space-y-2">
              <h2 className="font-bold text-white text-sm leading-tight line-clamp-2 group-hover:text-aqua-glow transition-colors">
                {p.nama}
              </h2>

              <div className="flex items-baseline gap-2">
                <span className="text-aqua-glow font-bold text-lg">{formatRupiah(p.harga)}</span>
                {p.hargaAsli && p.hargaAsli > p.harga && (
                  <span className="text-white/30 text-xs line-through">{formatRupiah(p.hargaAsli)}</span>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-white/40">
                {p.rating && (
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    {p.rating}
                  </span>
                )}
                {p.terjual > 0 && <span>{p.terjual} terjual</span>}
                <span className="ml-auto">{p.platform}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
