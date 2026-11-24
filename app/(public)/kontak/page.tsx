import type { Metadata } from 'next'
import Link from 'next/link'
import { Mail, Clock, BookOpen } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Kontak — APLESI',
  description: 'Hubungi tim redaksi APLESI untuk pertanyaan budidaya, koreksi artikel, atau kerja sama edukasi.',
}

export default function KontakPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-6">Hubungi Kami</h1>

      <div className="prose max-w-none mb-10">
        <p className="text-lg text-gray-700 leading-relaxed">
          Apakah Anda memiliki pertanyaan seputar budidaya ikan air tawar, ingin mengajukan koreksi teknis pada artikel, menjalin kerja sama edukasi, atau melaporkan kendala pada situs kami? Tim redaksi APLESI siap membantu Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <Mail className="h-6 w-6 text-blue-600 mb-3" />
          <h2 className="text-lg font-bold text-gray-900 mb-2">Email Resmi Redaksi</h2>
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            Untuk pertanyaan umum, masukan konten, koreksi data teknis, serta tawaran kerja sama dan periklanan.
          </p>
          <a
            href="mailto:admin@aplesi.my.id"
            className="text-blue-600 font-semibold hover:underline"
          >
            admin@aplesi.my.id
          </a>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <Clock className="h-6 w-6 text-blue-600 mb-3" />
          <h2 className="text-lg font-bold text-gray-900 mb-2">Jam Operasional Redaksi</h2>
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            Pesan yang masuk melalui email akan kami tinjau dan balas pada hari kerja berikut:
          </p>
          <span className="text-gray-900 font-semibold text-sm">
            Senin – Jumat (08:00 – 16:00 WIB)
          </span>
        </div>
      </div>

      <div className="mt-8 bg-gray-50 border border-gray-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <BookOpen className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
          <div>
            <h3 className="text-base font-bold text-gray-900">Mencari Panduan Budidaya?</h3>
            <p className="text-sm text-gray-600 mt-1">
              Temukan puluhan panduan teknis budidaya lele, sistem bioflok, manajemen air, dan penanganan penyakit ikan secara gratis.
            </p>
          </div>
        </div>
        <Link
          href="/artikel"
          className="shrink-0 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          Buka Daftar Artikel
        </Link>
      </div>
    </div>
  )
}
