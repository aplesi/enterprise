import { getProdukBySlug, getAllProduk } from '@/lib/db/produk'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ShoppingBag, Star, ArrowLeft, ExternalLink } from 'lucide-react'
import type { Metadata } from 'next'


interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const produk = await getProdukBySlug(slug)
  if (!produk) return { title: 'Produk Tidak Ditemukan' }
  return {
    title: `${produk.nama} — Aplesi`,
    description: produk.deskripsi || `Beli ${produk.nama} dengan harga terbaik di ${produk.platform}`,
  }
}

function formatRupiah(n: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
}

export default async function ProdukDetailPage({ params }: Props) {
  const { slug } = await params
  const produk = await getProdukBySlug(slug)
  if (!produk) notFound()

  const diskon = produk.hargaAsli && produk.hargaAsli > produk.harga
    ? Math.round(((produk.hargaAsli - produk.harga) / produk.hargaAsli) * 100)
    : null

  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      {/* Breadcrumb */}
      <Link href="/produk" className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-aqua-glow transition-colors mb-6">
        <ArrowLeft className="h-4 w-4" /> Kembali ke Produk
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Gambar */}
        <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden aspect-square flex items-center justify-center">
          {produk.gambar[0] ? (
            <img src={produk.gambar[0]} alt={produk.nama} className="h-full w-full object-cover" />
          ) : (
            <ShoppingBag className="h-20 w-20 text-white/10" />
          )}
        </div>

        {/* Detail */}
        <div className="space-y-5">
          <div>
            <span className="text-xs font-bold text-aqua-glow/70 uppercase tracking-wider">{produk.kategori}</span>
            <h1 className="text-2xl font-bold text-white mt-1">{produk.nama}</h1>
          </div>

          {/* Harga */}
          <div className="space-y-1">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-aqua-glow">{formatRupiah(produk.harga)}</span>
              {diskon && (
                <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs font-bold">
                  -{diskon}%
                </span>
              )}
            </div>
            {produk.hargaAsli && produk.hargaAsli > produk.harga && (
              <span className="text-white/30 line-through">{formatRupiah(produk.hargaAsli)}</span>
            )}
          </div>

          {/* Rating & Terjual */}
          <div className="flex items-center gap-4 text-sm text-white/50">
            {produk.rating && (
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                {produk.rating}
              </span>
            )}
            {produk.terjual > 0 && <span>{produk.terjual} terjual</span>}
            <span>{produk.platform}</span>
          </div>

          {/* Deskripsi */}
          {produk.deskripsi && (
            <div className="rounded-xl bg-white/5 border border-white/10 p-4">
              <p className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap">{produk.deskripsi}</p>
            </div>
          )}

          {/* CTA */}
          <a
            href={`/go/${produk.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full px-6 py-3.5 rounded-xl gradient-aqua text-white font-bold text-base shadow-glow hover:opacity-90 transition-opacity"
          >
            <ExternalLink className="h-5 w-5" />
            Beli di {produk.platform}
          </a>

          <p className="text-[11px] text-white/30 text-center">
            * Anda akan diarahkan ke halaman produk di {produk.platform}. Harga dapat berubah sewaktu-waktu.
          </p>
        </div>
      </div>
    </div>
  )
}
