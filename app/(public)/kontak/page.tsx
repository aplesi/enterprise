import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kontak — APLESI',
  description: 'Hubungi tim APLESI untuk pertanyaan, kerja sama, atau konsultasi budidaya.',
}

export default function KontakPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-black text-white mb-8">Hubungi Kami</h1>
      
      <div className="prose prose-invert max-w-none mb-12">
        <p>
          Apakah Anda memiliki pertanyaan seputar budidaya ikan, ingin mengajak kerja sama, atau ingin melaporkan kendala teknis pada situs kami? Tim APLESI selalu siap mendengarkan Anda.
        </p>
        
        <div className="not-prose mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-2">Email Resmi</h3>
            <p className="text-gray-400 mb-4">Untuk pertanyaan umum, tawaran kerja sama, dan pemasangan iklan (advertisement).</p>
            <a href="mailto:admin@aplesi.my.id" className="text-aqua-glow font-medium hover:underline">
              admin@aplesi.my.id
            </a>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-2">Konsultasi Bibit/Produk</h3>
            <p className="text-gray-400 mb-4">Untuk pemesanan benih lele Masamo, peralatan kolam, dan bantuan produk afiliasi.</p>
            <span className="text-white font-medium">
              Senin - Jumat (08:00 - 16:00 WIB)
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
