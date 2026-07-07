// app/(public)/penulis/[nama]/page.tsx
// Halaman profil penulis — bagian dari perbaikan E-E-A-T (Experience, Expertise,
// Authoritativeness, Trustworthiness). Halaman ini adalah target dari author.url
// di JSON-LD Article schema (lib/seo/index.ts), jadi harus benar-benar ada agar
// tidak jadi broken link di mata crawler.

import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { getAllArtikel } from '@/lib/db/artikel'
import { formatTanggal, estimasiWacaBaca } from '@/lib/utils'
import { siteConfig } from '@/config/site'

interface PenulisInfo {
  nama: string
  peran: string
  bio: string
  kredensial: string[]
}

// Profil penulis/tim redaksi. Tambahkan entri baru di sini kalau ada
// kontributor lain di masa depan.
const PENULIS_INFO: Record<string, PenulisInfo> = {
  'tim-redaksi-aplesi': {
    nama: 'Tim Redaksi APLESI',
    peran: 'Redaksi — Asosiasi Pembudidaya Ikan Seluruh Indonesia',
    bio: 'Tim Redaksi APLESI menyusun dan meninjau setiap panduan budidaya ikan di situs ini berdasarkan praktik lapangan anggota asosiasi, referensi teknis budidaya perikanan air tawar, dan masukan dari pembudidaya berpengalaman di berbagai daerah. Setiap artikel diperbarui secara berkala mengikuti perkembangan teknik budidaya.',
    kredensial: [
      'Berafiliasi dengan Asosiasi Pembudidaya Ikan Seluruh Indonesia (APLESI)',
      'Konten disusun berdasarkan praktik budidaya nyata dari jaringan anggota asosiasi',
      'Ditinjau ulang secara berkala untuk akurasi teknis',
    ],
  },
}

export async function generateStaticParams() {
  return Object.keys(PENULIS_INFO).map((nama) => ({ nama }))
}

export async function generateMetadata({ params }: { params: Promise<{ nama: string }> }): Promise<Metadata> {
  const { nama } = await params
  const info = PENULIS_INFO[nama]
  if (!info) return { title: 'Penulis tidak ditemukan' }
  return {
    title: `${info.nama} — Profil Penulis | ${siteConfig.name}`,
    description: info.bio,
    alternates: { canonical: `${siteConfig.url}/penulis/${nama}` },
  }
}

export default async function PenulisPage({ params }: { params: Promise<{ nama: string }> }) {
  const { nama } = await params
  const info = PENULIS_INFO[nama]
  if (!info) notFound()

  const artikelPenulis = getAllArtikel().filter((a) => a.penulis === info.nama)

  const personJsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: info.nama,
    url: `${siteConfig.url}/penulis/${nama}`,
    description: info.bio,
    memberOf: {
      '@type': 'Organization',
      name: siteConfig.fullName,
      url: siteConfig.url,
    },
    worksFor: {
      '@type': 'Organization',
      name: siteConfig.fullName,
    },
  })

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: personJsonLd }} />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link href="/" className="hover:text-green-600">Beranda</Link>
          <span>›</span>
          <span className="text-gray-600">Penulis</span>
          <span>›</span>
          <span className="text-gray-600">{info.nama}</span>
        </nav>

        <header className="mb-8 pb-8 border-b border-gray-100">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">{info.nama}</h1>
          <p className="text-green-700 font-medium mb-4">{info.peran}</p>
          <p className="text-gray-600 leading-relaxed max-w-2xl">{info.bio}</p>

          <ul className="mt-5 space-y-2">
            {info.kredensial.map((k, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>{k}</span>
              </li>
            ))}
          </ul>
        </header>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Artikel oleh {info.nama} ({artikelPenulis.length})
          </h2>

          {artikelPenulis.length === 0 ? (
            <p className="text-gray-400">Belum ada artikel yang tayang.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {artikelPenulis.map((artikel) => (
                <Link key={artikel.slug} href={`/artikel/${artikel.slug}`} className="card group">
                  <div className="relative h-40 bg-gray-100">
                    {artikel.gambar && (
                      <Image src={artikel.gambar} alt={artikel.judul} fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300" />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-green-600 transition-colors">
                      {artikel.judul}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>{formatTanggal(artikel.tanggal)}</span>
                      <span>{estimasiWacaBaca(artikel.konten)} mnt baca</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  )
}
