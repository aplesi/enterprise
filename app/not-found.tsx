// app/not-found.tsx
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-7xl mb-6">🐟</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-3">404</h1>
        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          Halaman tidak ditemukan
        </h2>
        <p className="text-gray-500 mb-8">
          Maaf, halaman yang kamu cari tidak ada atau sudah dipindahkan.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link href="/" className="btn-primary">🏠 Ke Beranda</Link>
          <Link href="/artikel" className="btn-secondary">📝 Lihat Artikel</Link>
          <Link href="/cari" className="btn-secondary">🔍 Cari Artikel</Link>
        </div>
      </div>
    </div>
  )
}
