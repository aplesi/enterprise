import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Disclaimer — APLESI',
  description: 'Penyangkalan (Disclaimer) penggunaan informasi di APLESI (https://aplesi.my.id).',
}

export default function DisclaimerPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-8">Disclaimer</h1>

      <div className="prose max-w-none">
        <p>
          Jika Anda memerlukan informasi lebih lanjut atau memiliki pertanyaan tentang penafian (disclaimer) situs kami, jangan ragu untuk menghubungi kami melalui halaman <Link href="/kontak">Kontak</Link> atau email <a href="mailto:admin@aplesi.my.id">admin@aplesi.my.id</a>.
        </p>

        <h2>Penyangkalan untuk APLESI</h2>
        <p>
          Semua informasi di situs web ini (https://aplesi.my.id) diterbitkan dengan itikad baik dan hanya untuk tujuan informasi umum serta edukasi mengenai budidaya ikan dan perikanan air tawar. APLESI tidak memberikan jaminan apa pun tentang kelengkapan, keandalan, dan keakuratan mutlak informasi ini di setiap kondisi kolam yang berbeda.
        </p>
        <p>
          Segala tindakan yang Anda ambil atas informasi yang Anda temukan di situs web ini (APLESI) adalah sepenuhnya merupakan risiko Anda sendiri. APLESI tidak akan bertanggung jawab atas kerugian dan/atau kerusakan apa pun sehubungan dengan penggunaan situs web kami, termasuk namun tidak terbatas pada kerugian finansial akibat kegagalan panen, penyakit ikan, atau risiko teknis operasional perikanan.
        </p>

        <h2>Tautan Eksternal</h2>
        <p>
          Dari situs web kami, Anda dapat mengunjungi situs web lain dengan mengikuti tautan ke situs eksternal tersebut. Meskipun kami berusaha untuk hanya memberikan tautan ke situs web yang berguna dan relevan, kami tidak memiliki kontrol atas konten dan sifat dari situs tersebut. Tautan ini tidak menyiratkan rekomendasi untuk semua konten yang ditemukan di situs eksternal tersebut.
        </p>

        <h2>Persetujuan</h2>
        <p>
          Dengan menggunakan situs web kami, Anda dengan ini menyetujui penafian kami dan menyetujui ketentuan-ketentuannya.
        </p>

        <h2>Pembaruan</h2>
        <p>
          Jika kami memperbarui, mengubah, atau membuat perubahan apa pun pada dokumen ini, perubahan tersebut akan dipublikasikan secara jelas pada halaman ini.
        </p>
      </div>
    </div>
  )
}
