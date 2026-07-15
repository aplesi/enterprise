import Link from 'next/link'
import Image from 'next/image'
import { 
  ArrowRight, 
  Calendar,
  Clock,
  Sparkles, 
  GraduationCap, 
  Sprout, 
  ShoppingBag, 
  ShieldCheck,
  BookOpen,
  Users,
  MapPin,
  Award,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getArtikelTerbaru } from '@/lib/db/artikel'
import { formatTanggal } from '@/lib/utils'
import { ArticleSearch } from '@/components/blog/ArticleSearch'

export const revalidate = 300 // cache 5 menit


function Hero() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden gradient-hero pt-32 pb-20">
      <div className="pointer-events-none absolute -top-40 -left-40 h-[28rem] w-[28rem] rounded-full bg-accent/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[28rem] w-[28rem] rounded-full bg-aqua-glow/20 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[40rem] w-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-aqua/10 blur-3xl" />

      <div className="relative mx-auto flex w-full max-w-4xl flex-col items-center px-4 text-center sm:px-6 lg:px-8">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full glass-dark px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-aqua-glow">
          <Sparkles className="h-3.5 w-3.5" />
          Mesin Pencari Budidaya Ikan Nusantara
        </div>
        <h1 className="text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
          Cari Apa Saja Tentang{' '}
          <span className="text-gradient-aqua">Budidaya Ikan</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
          Panduan, riset, dan praktik terbaik dari para ahli APLESI — semua dalam satu pencarian.
        </p>

        <div className="mt-10 flex w-full justify-center">
          <ArticleSearch />
        </div>

        {/* Stats */}
        <div className="mt-14 grid grid-cols-3 gap-6">
          {[
            { icon: BookOpen, num: '1.000+', label: 'Artikel & Panduan' },
            { icon: Users, num: '12.000+', label: 'Anggota Aktif' },
            { icon: MapPin, num: '34', label: 'Provinsi Terjangkau' },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-1">
              <div className="mb-1 grid h-10 w-10 place-items-center rounded-xl gradient-aqua shadow-glow">
                <stat.icon className="h-5 w-5 text-white" />
              </div>
              <div className="text-2xl font-black text-white">{stat.num}</div>
              <div className="text-xs text-white/60">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ArticlesSection({ articles }: { articles: any[] }) {
  return (
    <section className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-accent">Artikel</div>
            <h2 className="text-3xl font-black tracking-tight text-primary sm:text-4xl">Kabar & Panduan Budidaya</h2>
          </div>
          <Link
            href="/artikel"
            prefetch={false}
            className="group inline-flex items-center gap-1 text-sm font-semibold text-accent transition-colors hover:text-primary"
          >
            Lihat Semua <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
          {articles.slice(0, 6).map((artikel) => {
            return (
              <Link
                key={artikel.slug}
                href={`/artikel/${artikel.slug}`}
                prefetch={false}
                className="group overflow-hidden rounded-2xl bg-card shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-card-hover"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-secondary">
                  {artikel.gambar ? (
                    <Image
                      src={artikel.gambar}
                      alt={artikel.judul}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-4xl opacity-20">🐟</div>
                  )}
                  <span className="absolute left-4 top-4 rounded-full gradient-aqua px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-glow">
                    {artikel.kategori}
                  </span>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatTanggal(artikel.tanggal)}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {artikel.waktuBaca} mnt
                    </span>
                  </div>
                  <h3 className="mt-2 line-clamp-2 text-base font-bold leading-snug text-primary transition-colors group-hover:text-accent">
                    {artikel.judul}
                  </h3>
                  {artikel.ringkasan && (
                    <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
                      {artikel.ringkasan}
                    </p>
                  )}
                  <div className="mt-4 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{artikel.penulis}</span>
                    <span className="font-semibold text-accent group-hover:underline">Baca →</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function Programs() {
  const items = [
    {
      icon: GraduationCap,
      title: 'Pelatihan & Edukasi',
      desc: 'Kurikulum budidaya modern dari ahli perikanan bersertifikat.',
    },
    {
      icon: Sprout,
      title: 'Pendampingan Tambak',
      desc: 'Tim lapangan APLESI siap mendampingi siklus budidaya Anda.',
    },
    {
      icon: ShoppingBag,
      title: 'Koperasi & Pasar',
      desc: 'Akses harga anggota dan jaringan pembeli skala nasional.',
    },
    {
      icon: ShieldCheck,
      title: 'Sertifikasi Mutu',
      desc: 'Dukungan sertifikasi CBIB dan standar ekspor.',
    },
  ]
  
  return (
    <section id="program" className="relative bg-secondary/50 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-accent">Program Unggulan</div>
          <h2 className="text-3xl font-black tracking-tight text-primary sm:text-4xl">
            Dukungan Lengkap untuk Pembudidaya
          </h2>
          <p className="mt-4 text-muted-foreground">
            Empat pilar layanan APLESI yang membantu anggota dari hulu ke hilir.
          </p>
        </div>
        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <div
              key={item.title}
              className="group rounded-2xl border border-border bg-card p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
            >
              <div className="mb-5 grid h-12 w-12 place-items-center rounded-xl gradient-aqua shadow-glow transition-transform group-hover:scale-110">
                <item.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-primary">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CtaBand() {
  return (
    <section className="relative overflow-hidden py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl gradient-hero px-6 py-12 sm:px-12 sm:py-16">
          <div className="pointer-events-none absolute -top-24 right-0 h-64 w-64 rounded-full bg-aqua/20 blur-3xl" />
          <div className="relative flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-2xl font-black text-white sm:text-3xl">
                Jadi Bagian dari Komunitas Pembudidaya Ikan Terbesar di Indonesia
              </h2>
              <p className="mt-3 max-w-xl text-white/75">
                Daftar keanggotaan APLESI untuk akses program, harga koperasi, dan jaringan pasar nasional.
              </p>
            </div>
            <Link href="/kontak" className="shrink-0 inline-flex items-center gap-1 rounded-full bg-white px-7 py-3 text-sm font-bold text-[#0a1628] shadow-card hover:bg-white/90 transition-colors">
              Daftar Anggota Sekarang <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default async function HomePage() {
  const artikelTerbaru = await getArtikelTerbaru(6)
  
  return (
    <main className="min-h-screen bg-background">
      <Hero />
      <ArticlesSection articles={artikelTerbaru} />
      <Programs />
      <CtaBand />
    </main>
  )
}
