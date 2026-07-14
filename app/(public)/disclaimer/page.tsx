import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Disclaimer — APLESI',
  description: 'Penyangkalan (Disclaimer) penggunaan informasi di APLESI Enterprise.',
}

export default function DisclaimerPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-black text-white mb-8">Disclaimer</h1>
      
      <div className="prose prose-invert max-w-none prose-a:text-aqua-glow hover:prose-a:text-aqua">
        <p>
          Jika Anda memerlukan informasi lebih lanjut atau memiliki pertanyaan tentang penafian (disclaimer) situs kami, jangan ragu untuk menghubungi kami melalui halaman Kontak.
        </p>

        <h2>Penyangkalan untuk APLESI</h2>
        <p>
          Semua informasi di situs web ini (https://www.aplesi.my.id) diterbitkan dengan itikad baik dan hanya untuk tujuan informasi umum mengenai budidaya ikan dan perikanan. APLESI tidak memberikan jaminan apa pun tentang kelengkapan, keandalan, dan keakuratan informasi ini.
        </p>
        <p>
          Segala tindakan yang Anda ambil atas informasi yang Anda temukan di situs web ini (APLESI), adalah sepenuhnya merupakan risiko Anda sendiri. APLESI tidak akan bertanggung jawab atas kerugian dan/atau kerusakan apa pun sehubungan dengan penggunaan situs web kami, termasuk namun tidak terbatas pada kerugian finansial akibat kegagalan panen, penyakit ikan, atau risiko teknis operasional perikanan.
        </p>

        <h2>Tautan Eksternal</h2>
        <p>
          Dari situs web kami, Anda dapat mengunjungi situs web lain dengan mengikuti hyperlink ke situs eksternal tersebut. Meskipun kami berusaha untuk hanya memberikan tautan berkualitas ke situs web yang berguna dan etis, kami tidak memiliki kontrol atas konten dan sifat dari situs tersebut.
          Tautan ini ke situs web lain tidak menyiratkan rekomendasi untuk semua konten yang ditemukan di situs-situs ini. Pemilik situs dan konten dapat berubah tanpa pemberitahuan dan dapat terjadi sebelum kami memiliki kesempatan untuk menghapus tautan yang mungkin sudah 'buruk' (mati).
        </p>

        <h2>Persetujuan</h2>
        <p>
          Dengan menggunakan situs web kami, Anda dengan ini menyetujui penafian kami dan menyetujui ketentuan-ketentuannya.
        </p>

        <h2>Pembaruan</h2>
        <p>
          Jika kami memperbarui, mengubah, atau membuat perubahan apa pun pada dokumen ini, perubahan tersebut akan diunggah dengan jelas di sini.
        </p>
      </div>
    </div>
  )
}
