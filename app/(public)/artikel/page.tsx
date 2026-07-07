import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Home, Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react'
import { getAllArtikel } from '@/lib/db/artikel'
import { formatTanggal, estimasiWacaBaca } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Artikel Budidaya Ikan — APLESI',
  description: 'Kumpulan panduan, tips, dan riset budidaya ikan dari para ahli APLESI untuk pembudidaya Indonesia.',
  alternates: { canonical: 'https://www.aplesi.my.id/artikel' },
}

const KATEGORI_LIST = [
  { label: 'Semua', value: '' },
  { label: '🥚 Pembenihan', value: 'Pembenihan' },
  { label: '🌿 Pakan', value: 'Pakan' },
  { label: '💊 Penyakit & Pengobatan', value: 'Penyakit & Pengobatan' },
  { label: '🏊 Manajemen Kolam', value: 'Manajemen Kolam' },
  { label: '🎣 Panen & Pascapanen', value: 'Panen & Pascapanen' },
  { label: '💰 Bisnis & Pemasaran', value: 'Bisnis & Pemasaran' },
  { label: '💡 Tips & Trik', value: 'Tips & Trik' },
  { label: '🔬 Teknologi', value: 'Teknologi' },
]

const PER_HALAMAN = 9

function Breadcrumb() {
  return (
    <nav className="mb-8 flex items-center gap-2 text-sm text-white/50">
      <Link href="/" className="flex items-center gap-1 transition-colors hover:text-aqua-glow">
        <Home className="h-4 w-4" />
        Beranda
      </Link>
      <span>›</span>
      <span className="text-aqua-glow">Artikel</span>
    </nav>
  )
}

export default async function ArtikelPage({
  searchParams,
}: {
  searchParams: { kategori?: string; halaman?: string }
}) {
  const semuaArtikel = getAllArtikel()
  const kategoriAktif = searchParams.kategori || ''
  const halaman = Math.max(1, parseInt(searchParams.halaman || '1'))

  // Filter
  const artikelFiltered = kategoriAktif
    ? semuaArtikel.filter((a) =>
        a.kategori.toLowerCase().includes(kategoriAktif.toLowerCase())
      )
    : semuaArtikel

  const total = artikelFiltered.length
  const totalHalaman = Math.max(1, Math.ceil(total / PER_HALAMAN))
  const artikelHalaman = artikelFiltered.slice(
    (halaman - 1) * PER_HALAMAN,
    halaman * PER_HALAMAN
  )

  function buildUrl(params: { kategori?: string; halaman?: number }) {
    const p = new URLSearchParams()
    const kat = params.kategori ?? kategoriAktif
    const hal = params.halaman ?? halaman
    if (kat) p.set('kategori', kat)
    if (hal > 1) p.set('halaman', String(hal))
    const s = p.toString()
    return `/artikel${s ? `?${s}` : ''}`
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-28">
        {/* Page Header */}
        <section className="relative overflow-hidden gradient-hero py-14">
          <div className="pointer-events-none absolute -top-32 -left-32 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -right-32 h-72 w-72 rounded-full bg-aqua-glow/15 blur-3xl" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Breadcrumb />
            <div className="max-w-2xl">
              <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-aqua-glow">
                Artikel & Panduan
              </div>
              <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
                Kabar & Panduan Budidaya
              </h1>
              <p className="mt-3 text-white/60">
                {total} artikel tersedia · Update setiap hari
              </p>
            </div>
          </div>
        </section>

        {/* Filter Kategori */}
        <div className="sticky top-[64px] z-40 border-b border-border bg-background/95 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex gap-2 overflow-x-auto py-3 scrollbar-hide">
              {KATEGORI_LIST.map((kat) => (
                <Link
                  key={kat.value}
                  href={buildUrl({ kategori: kat.value, halaman: 1 })}
                  className={`flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
                    kategoriAktif === kat.value
                      ? 'gradient-aqua text-white shadow-glow'
                      : 'border border-border bg-card text-muted-foreground hover:border-aqua/50 hover:text-primary'
                  }`}
                >
                  {kat.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Article Grid */}
        <section className="py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

            {artikelHalaman.length === 0 ? (
              <div className="py-24 text-center">
                <div className="mb-4 text-5xl">🐟</div>
                <h3 className="text-xl font-bold text-primary">Belum ada artikel</h3>
                <p className="mt-2 text-muted-foreground">
                  Belum ada artikel di kategori ini. Coba kategori lain.
                </p>
                <Link
                  href="/artikel"
                  className="mt-6 inline-flex items-center gap-2 rounded-full gradient-aqua px-5 py-2.5 text-sm font-semibold text-white shadow-glow"
                >
                  Lihat Semua Artikel
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
                {artikelHalaman.map((artikel) => {
                  const readTime = estimasiWacaBaca(artikel.konten)
                  return (
                    <Link
                      key={artikel.slug}
                      href={`/artikel/${artikel.slug}`}
                      className="group overflow-hidden rounded-2xl bg-card shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-card-hover"
                    >
                      {/* Gambar */}
                      <div className="relative aspect-[16/10] overflow-hidden bg-secondary">
                        {artikel.gambar ? (
                          <Image
                            src={artikel.gambar}
                            alt={artikel.judul}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-4xl opacity-30">
                            🐟
                          </div>
                        )}
                        <span className="absolute left-4 top-4 rounded-full gradient-aqua px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-glow">
                          {artikel.kategori}
                        </span>
                      </div>

                      {/* Konten */}
                      <div className="p-6">
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatTanggal(artikel.tanggal)}
                          </span>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {readTime} menit
                          </span>
                        </div>
                        <h3 className="mt-2 line-clamp-2 text-base font-bold leading-snug text-primary transition-colors group-hover:text-accent">
                          {artikel.judul}
                        </h3>
                        {artikel.ringkasan && (
                          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                            {artikel.ringkasan}
                          </p>
                        )}
                        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                          <span className="font-medium">{artikel.penulis}</span>
                          <span className="text-accent font-semibold group-hover:underline">
                            Baca →
                          </span>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}

            {/* Pagination */}
            {totalHalaman > 1 && (
              <div className="mt-12 flex items-center justify-center gap-2">
                {halaman > 1 && (
                  <Link
                    href={buildUrl({ halaman: halaman - 1 })}
                    className="flex items-center gap-1 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-muted-foreground transition-all hover:border-aqua/50 hover:text-primary"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Sebelumnya
                  </Link>
                )}

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalHalaman, 5) }, (_, i) => {
                    let p: number
                    if (totalHalaman <= 5) {
                      p = i + 1
                    } else if (halaman <= 3) {
                      p = i + 1
                    } else if (halaman >= totalHalaman - 2) {
                      p = totalHalaman - 4 + i
                    } else {
                      p = halaman - 2 + i
                    }
                    return (
                      <Link
                        key={p}
                        href={buildUrl({ halaman: p })}
                        className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-all ${
                          p === halaman
                            ? 'gradient-aqua text-white shadow-glow'
                            : 'border border-border bg-card text-muted-foreground hover:border-aqua/50 hover:text-primary'
                        }`}
                      >
                        {p}
                      </Link>
                    )
                  })}
                </div>

                {halaman < totalHalaman && (
                  <Link
                    href={buildUrl({ halaman: halaman + 1 })}
                    className="flex items-center gap-1 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-muted-foreground transition-all hover:border-aqua/50 hover:text-primary"
                  >
                    Berikutnya
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            )}

            {/* Info pagination */}
            {total > 0 && (
              <p className="mt-4 text-center text-xs text-muted-foreground">
                Menampilkan {(halaman - 1) * PER_HALAMAN + 1}–{Math.min(halaman * PER_HALAMAN, total)} dari {total} artikel
              </p>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
