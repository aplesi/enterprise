import type { Metadata } from 'next'
import Link from 'next/link'
import { Home, Calendar, ChevronLeft, ChevronRight, Clock, BookOpen, Newspaper, Sparkles } from 'lucide-react'
import { getArtikelListing, countArtikelFiltered } from '@/lib/db/artikel'
import { formatTanggal } from '@/lib/utils'
import { ArticleImageWithFallback } from '@/components/blog/ArticleImageWithFallback'

export const revalidate = 300 // cache 5 menit

import { KATEGORI_LIST as KATEGORI_TAKSONOMI } from '@/config/kategori'

export const metadata: Metadata = {
  title: 'Artikel & Panduan Budidaya Ikan — APLESI',
  description: 'Kumpulan panduan teknis mendalam dan analisis berita perikanan terpercaya dari para ahli APLESI untuk pembudidaya Indonesia.',
  alternates: { canonical: 'https://www.aplesi.my.id/artikel' },
}

const KATEGORI_LIST = [
  { label: 'Semua Kategori', value: '' },
  ...KATEGORI_TAKSONOMI.map((k) => ({ label: k.nama, value: k.nama })),
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

export default async function ArtikelPage(
  props: {
    searchParams: Promise<{ kategori?: string; halaman?: string; tipe?: 'semua' | 'panduan' | 'berita' }>
  }
) {
  const searchParams = await props.searchParams;
  const kategoriAktif = searchParams.kategori || ''
  const tipeAktif = searchParams.tipe || 'semua'
  const halaman = Math.max(1, parseInt(searchParams.halaman || '1'))

  // Query ringan: tanpa konten, filter kategori + tipe konten + pagination di SQL
  const [artikelHalaman, total] = await Promise.all([
    getArtikelListing({
      kategori: kategoriAktif || undefined,
      tipe: tipeAktif,
      limit: PER_HALAMAN,
      offset: (halaman - 1) * PER_HALAMAN,
    }),
    countArtikelFiltered(kategoriAktif || undefined, tipeAktif),
  ])

  const totalHalaman = Math.max(1, Math.ceil(total / PER_HALAMAN))

  function buildUrl(params: { kategori?: string; halaman?: number; tipe?: 'semua' | 'panduan' | 'berita' }) {
    const p = new URLSearchParams()
    const kat = params.kategori !== undefined ? params.kategori : kategoriAktif
    const hal = params.halaman !== undefined ? params.halaman : halaman
    const tip = params.tipe !== undefined ? params.tipe : tipeAktif

    if (kat) p.set('kategori', kat)
    if (tip && tip !== 'semua') p.set('tipe', tip)
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
            <div className="max-w-3xl">
              <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-aqua-glow flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5" />
                Knowledge Base &amp; Intelligence APLESI
              </div>
              <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
                Kabar &amp; Panduan Budidaya
              </h1>
              <p className="mt-3 text-white/70 max-w-2xl text-sm md:text-base">
                Temukan panduan teknis mendalam budidaya lele dan analisis berita industri perikanan Indonesia terkini.
              </p>

              {/* TABS FILTER: Pillar 1 (Evergreen) vs News Recap */}
              <div className="mt-8 flex flex-wrap gap-2.5">
                <Link
                  href={buildUrl({ tipe: 'semua', halaman: 1 })}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm ${
                    tipeAktif === 'semua'
                      ? 'bg-white text-midnight shadow-lg'
                      : 'bg-white/10 text-white/80 hover:bg-white/20'
                  }`}
                >
                  <Sparkles className="h-4 w-4" />
                  Semua ({total})
                </Link>
                <Link
                  href={buildUrl({ tipe: 'panduan', halaman: 1 })}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm ${
                    tipeAktif === 'panduan'
                      ? 'bg-aqua text-white shadow-lg'
                      : 'bg-white/10 text-white/80 hover:bg-white/20'
                  }`}
                >
                  <BookOpen className="h-4 w-4" />
                  📚 Panduan Budidaya
                </Link>
                <Link
                  href={buildUrl({ tipe: 'berita', halaman: 1 })}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm ${
                    tipeAktif === 'berita'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-white/10 text-white/80 hover:bg-white/20'
                  }`}
                >
                  <Newspaper className="h-4 w-4" />
                  📰 Berita &amp; Analisis
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Filter Kategori Taksonomi */}
        <div className="sticky top-[64px] z-40 border-b border-border bg-background/95 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex gap-2 overflow-x-auto py-3 scrollbar-hide">
              {KATEGORI_LIST.map((kat) => (
                <Link
                  key={kat.value}
                  href={buildUrl({ kategori: kat.value, halaman: 1 })}
                  prefetch={false}
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
                <h3 className="text-xl font-bold text-primary">Belum ada artikel ditemukan</h3>
                <p className="mt-2 text-muted-foreground">
                  Tidak ada artikel dengan filter saat ini. Coba pilih kategori atau tab lainnya.
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
                  const isNewsRecap = artikel.kategori === 'Berita Terkini' || Boolean(artikel.sumberBerita)
                  return (
                    <Link
                      key={artikel.slug}
                      href={`/artikel/${artikel.slug}`}
                      prefetch={false}
                      className="group overflow-hidden rounded-2xl bg-card shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-card-hover flex flex-col justify-between"
                    >
                      <div>
                        {/* Gambar dengan Fallback Resilient */}
                        <div className="relative aspect-[16/10] overflow-hidden bg-secondary">
                          <ArticleImageWithFallback
                            src={artikel.gambar}
                            alt={artikel.judul}
                            judul={artikel.judul}
                            kategori={artikel.kategori}
                            variant="card"
                          />
                          
                          {/* Badge Pembeda Pilar 1 (Evergreen) vs News Recap */}
                          {isNewsRecap ? (
                            <span className="absolute left-4 top-4 rounded-full bg-blue-600/95 backdrop-blur-sm px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-md flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-pulse"></span>
                              Berita Terkini
                            </span>
                          ) : (
                            <span className="absolute left-4 top-4 rounded-full gradient-aqua px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-glow">
                              {artikel.kategori}
                            </span>
                          )}
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
                              {artikel.waktuBaca || 5} mnt baca
                            </span>
                          </div>
                          <h3 className="mt-2.5 line-clamp-2 text-base font-bold leading-snug text-primary transition-colors group-hover:text-accent">
                            {artikel.judul}
                          </h3>
                          {artikel.ringkasan && (
                            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                              {artikel.ringkasan}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="px-6 pb-6 pt-0 flex items-center justify-between text-xs text-muted-foreground border-t border-border/40 mt-2">
                        <span className="font-medium truncate max-w-[150px]">
                          {artikel.sumberBerita ? `Sumber: ${artikel.sumberBerita.nama}` : artikel.penulis}
                        </span>
                        <span className="text-accent font-semibold group-hover:underline">
                          Baca Lengkap →
                        </span>
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
                    prefetch={false}
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
                        prefetch={false}
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
                    prefetch={false}
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
