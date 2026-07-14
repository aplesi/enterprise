import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tentang Kami — APLESI',
  description: 'Mengenal lebih dekat APLESI Enterprise, portal edukasi dan inovasi budidaya lele dan perikanan Indonesia.',
}

export default function TentangKamiPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-black text-white mb-8">Tentang Kami</h1>
      
      <div className="prose prose-invert max-w-none">
        <p className="lead text-xl text-gray-300 mb-8">
          APLESI (Asosiasi Peternak Lele Seluruh Indonesia) Enterprise hadir sebagai pusat informasi, inovasi, dan edukasi bagi para pembudidaya ikan air tawar, khususnya lele, di seluruh nusantara.
        </p>

        <h2>Visi Kami</h2>
        <p>
          Menjadi rujukan utama dan platform terpercaya bagi para pembudidaya ikan di Indonesia untuk mencapai kemandirian, efisiensi, dan hasil panen yang optimal melalui penerapan teknologi modern dan cara budidaya ikan yang baik (CBIB).
        </p>

        <h2>Misi Kami</h2>
        <ul>
          <li><strong>Edukasi Berkelanjutan:</strong> Menyediakan artikel panduan step-by-step, tips praktis, dan riset terbaru di dunia perikanan yang mudah dipahami oleh peternak pemula hingga profesional.</li>
          <li><strong>Inovasi Teknologi:</strong> Mendorong penerapan teknologi seperti sistem bioflok, manajemen kualitas air digital, dan pakan alternatif.</li>
          <li><strong>Pemberdayaan Ekonomi:</strong> Membantu peternak menekan angka FCR (Feed Conversion Ratio) dan menekan mortalitas bibit agar mendapatkan keuntungan maksimal.</li>
        </ul>

        <h2>Mengapa APLESI?</h2>
        <p>
          Dikelola oleh praktisi dan ahli yang telah lama terjun langsung di lapangan, setiap konten yang disajikan di APLESI telah melalui proses kurasi dan bersumber dari pengalaman nyata. Kami percaya bahwa dengan informasi yang tepat, semua orang bisa sukses dalam budidaya perikanan.
        </p>
      </div>
    </div>
  )
}
