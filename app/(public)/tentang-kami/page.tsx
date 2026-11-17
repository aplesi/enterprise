import type { Metadata } from 'next'
import Link from 'next/link'
import { ShieldCheck, BookOpenCheck, Users, Mail } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Tentang Kami — APLESI',
  description: 'Mengenal lebih dekat APLESI Enterprise, tim redaksi, dan standar editorial portal edukasi budidaya lele serta perikanan Indonesia.',
}

export default function TentangKamiPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-black text-white mb-6">Tentang Kami</h1>

      <div className="prose prose-invert max-w-none prose-a:text-aqua-glow hover:prose-a:text-aqua">
        <p className="lead text-xl text-gray-300 mb-8">
          APLESI (Asosiasi Peternak Lele Seluruh Indonesia) Enterprise hadir sebagai pusat informasi, inovasi, dan edukasi bagi para pembudidaya ikan air tawar, khususnya lele, di seluruh nusantara.
        </p>

        <h2>Visi &amp; Misi</h2>
        <p>
          Kami bertujuan menjadi rujukan terpercaya bagi pembudidaya ikan di Indonesia untuk mencapai kemandirian, efisiensi pakan, dan hasil panen yang optimal melalui penerapan Cara Budidaya Ikan yang Baik (CBIB).
        </p>
        <ul>
          <li><strong>Edukasi Berkelanjutan:</strong> Menyajikan panduan teknis langkah demi langkah yang mudah dipahami oleh peternak pemula hingga skala komersial.</li>
          <li><strong>Inovasi Teknologi:</strong> Mendorong penerapan sistem bioflok, manajemen kualitas air terukur, serta formulasi pakan alternatif yang efisien.</li>
          <li><strong>Pemberdayaan Ekonomi:</strong> Membantu peternak menekan angka FCR (<em>Feed Conversion Ratio</em>) dan tingkat mortalitas benih agar usaha budidaya lebih menguntungkan.</li>
        </ul>

        <h2>Profil Tim Redaksi &amp; Praktisi</h2>
        <p>
          Seluruh materi edukasi di APLESI disusun dan ditinjau oleh tim lintas peran untuk memastikan akurasi teknis sebelum dipublikasikan:
        </p>
      </div>

      <div className="mt-6 mb-10 grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-card border border-border rounded-xl p-5">
          <Users className="h-6 w-6 text-aqua-glow mb-3" />
          <h3 className="text-base font-bold text-white mb-1.5">Tim Redaksi APLESI</h3>
          <p className="text-sm text-gray-400 leading-relaxed">
            Bertanggung jawab menyusun struktur panduan, menyunting bahasa agar mudah dipahami pembudidaya pemula, dan menjaga konsistensi materi.
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <BookOpenCheck className="h-6 w-6 text-aqua-glow mb-3" />
          <h3 className="text-base font-bold text-white mb-1.5">Praktisi &amp; Konsultan Kolam</h3>
          <p className="text-sm text-gray-400 leading-relaxed">
            Meninjau aspek teknis lapangan seperti padat tebar, manajemen kualitas air (pH, amonia, oksigen), pemijahan, serta penanganan penyakit ikan.
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <ShieldCheck className="h-6 w-6 text-aqua-glow mb-3" />
          <h3 className="text-base font-bold text-white mb-1.5">Editor Kualitas &amp; Referensi</h3>
          <p className="text-sm text-gray-400 leading-relaxed">
            Memverifikasi rujukan standar perikanan, memperbarui artikel lama secara berkala, dan memastikan kepatuhan informasi terhadap pedoman publikasi.
          </p>
        </div>
      </div>

      <div className="prose prose-invert max-w-none prose-a:text-aqua-glow hover:prose-a:text-aqua">
        <h2>Standar Editorial &amp; Verifikasi Konten</h2>
        <p>
          Setiap panduan di APLESI disusun berdasarkan praktik budidaya yang teruji, literatur akuakultur, serta standar teknis perikanan air tawar. Kami menghindari klaim hasil panen yang berlebihan tanpa dasar teknis dan secara berkala meninjau ulang artikel agar tetap relevan dengan kondisi lapangan.
        </p>
        <p>
          Untuk menjaga transparansi, informasi mengenai batasan tanggung jawab teknis dapat dibaca di halaman <Link href="/disclaimer">Disclaimer</Link>, serta pengelolaan data pengunjung di halaman <Link href="/privacy-policy">Privacy Policy</Link>.
        </p>

        <h2>Kontak Redaksi Resmi</h2>
        <p>
          Apabila Anda menemukan kekeliruan teknis pada artikel, ingin mengajukan koreksi data, atau menjalin kerja sama edukasi, silakan hubungi tim redaksi kami melalui saluran resmi:
        </p>
      </div>

      <div className="mt-4 bg-card border border-border rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Mail className="h-5 w-5 text-aqua-glow shrink-0" />
          <div>
            <div className="text-sm font-semibold text-white">Email Redaksi &amp; Administrasi</div>
            <a href="mailto:admin@aplesi.my.id" className="text-sm text-aqua-glow hover:underline">
              admin@aplesi.my.id
            </a>
          </div>
        </div>
        <Link
          href="/kontak"
          className="inline-flex items-center justify-center rounded-lg border border-border px-4 py-2 text-sm font-medium text-white hover:border-aqua-glow transition-colors"
        >
          Lihat Halaman Kontak
        </Link>
      </div>
    </div>
  )
}
