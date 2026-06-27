// app/(blog)/layout.tsx
import Link from 'next/link'
import { OrganizationJsonLd, WebsiteJsonLd } from '@/components/seo/JsonLd'

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Schema global — untuk brand authority di AI */}
      <OrganizationJsonLd />
      <WebsiteJsonLd />

      <div className="min-h-screen flex flex-col bg-white">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <span className="text-2xl">🐟</span>
              <div className="hidden sm:block">
                <div className="font-bold text-gray-900 leading-none">Aplesi</div>
                <div className="text-xs text-gray-400 leading-none">Budidaya Lele</div>
              </div>
            </Link>

            {/* Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {[
                { href: '/artikel', label: 'Artikel' },
                { href: '/kategori/pembenihan', label: 'Pembenihan' },
                { href: '/kategori/pakan', label: 'Pakan' },
                { href: '/kategori/penyakit', label: 'Penyakit' },
                { href: '/produk', label: 'Produk' },
              ].map((nav) => (
                <Link
                  key={nav.href}
                  href={nav.href}
                  className="px-3 py-2 text-sm text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors font-medium"
                >
                  {nav.label}
                </Link>
              ))}
            </nav>

            {/* Kanan */}
            <div className="flex items-center gap-2">
              <Link href="/cari" className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" aria-label="Cari artikel">
                🔍
              </Link>
              <Link href="/rss.xml" className="p-2 text-gray-500 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors" aria-label="RSS Feed" target="_blank">
                📡
              </Link>
              <Link href="/admin" className="hidden sm:block btn-primary text-sm py-1.5">
                Admin
              </Link>
            </div>
          </div>
        </header>

        {/* Konten utama */}
        <main className="flex-1">{children}</main>

        {/* Footer */}
        <footer className="bg-gray-900 text-gray-300 mt-16">
          <div className="max-w-6xl mx-auto px-4 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
              {/* Brand */}
              <div className="md:col-span-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">🐟</span>
                  <span className="font-bold text-white text-lg">Aplesi</span>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Portal budidaya lele terlengkap di Indonesia. Update artikel setiap hari.
                </p>
                <div className="flex gap-3 mt-4">
                  {['Facebook', 'Instagram', 'YouTube'].map((s) => (
                    <a key={s} href="#" className="text-xs text-gray-500 hover:text-white transition-colors">{s}</a>
                  ))}
                </div>
              </div>

              {/* Kategori */}
              <div>
                <h3 className="font-semibold text-white mb-3 text-sm">Kategori</h3>
                <ul className="space-y-2">
                  {[
                    ['Pembenihan', '/kategori/pembenihan'],
                    ['Pakan', '/kategori/pakan'],
                    ['Penyakit', '/kategori/penyakit'],
                    ['Manajemen Kolam', '/kategori/kolam'],
                    ['Panen', '/kategori/panen'],
                  ].map(([label, href]) => (
                    <li key={href}>
                      <Link href={href} className="text-sm text-gray-400 hover:text-white transition-colors">
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Tautan */}
              <div>
                <h3 className="font-semibold text-white mb-3 text-sm">Tautan</h3>
                <ul className="space-y-2">
                  {[
                    ['Artikel Terbaru', '/artikel'],
                    ['Produk', '/produk'],
                    ['Tentang Kami', '/tentang'],
                    ['Kontak', '/kontak'],
                    ['Kebijakan Privasi', '/privasi'],
                  ].map(([label, href]) => (
                    <li key={href}>
                      <Link href={href} className="text-sm text-gray-400 hover:text-white transition-colors">
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Newsletter */}
              <div>
                <h3 className="font-semibold text-white mb-3 text-sm">Newsletter</h3>
                <p className="text-sm text-gray-400 mb-3">Dapatkan tips budidaya lele gratis.</p>
                <form action="/api/subscriber" method="POST" className="space-y-2">
                  <input
                    type="email"
                    name="email"
                    placeholder="email@kamu.com"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
                    required
                  />
                  <button type="submit" className="w-full btn-primary text-sm py-2">
                    Daftar Gratis
                  </button>
                </form>
              </div>
            </div>

            {/* Bottom bar */}
            <div className="pt-6 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-gray-500">
              <p>© {new Date().getFullYear()} Aplesi. Hak cipta dilindungi.</p>
              <div className="flex items-center gap-4">
                <Link href="/sitemap.xml" className="hover:text-gray-300">Sitemap</Link>
                <Link href="/rss.xml" className="hover:text-gray-300">RSS Feed</Link>
                <Link href="/admin" className="hover:text-gray-300">Admin</Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
