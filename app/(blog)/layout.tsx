// app/(blog)/layout.tsx
import Link from 'next/link'
import { OrganizationJsonLd, WebsiteJsonLd } from '@/components/seo/JsonLd'
import { SiteHeader } from '@/components/blog/SiteHeader'

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Schema global — untuk brand authority di AI */}
      <OrganizationJsonLd />
      <WebsiteJsonLd />

      <div className="min-h-screen flex flex-col bg-slate-50">
        {/* Header (Scroll-reactive) */}
        <SiteHeader />

        {/* Konten utama */}
        <main className="flex-1 w-full bg-slate-50">{children}</main>

        {/* Footer */}
        <footer className="bg-gray-900 text-gray-300 mt-16">
          <div className="max-w-6xl mx-auto px-4 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
              {/* Brand */}
              <div className="md:col-span-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-aqua">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6.5 12c.94-3.46 4.94-6 8.5-6 3.56 0 6.06 2.54 6 6-.06 3.46-2.44 6-6 6-3.56 0-7.56-2.54-8.5-6Z"/><path d="M18 12v.01"/><path d="M11.52 17c-2.28 1.7-5.52 1.46-7.52-1C1.6 13.16 2.5 10 5 9c2.5-1 3.9-3.16 6-5"/></svg>
                  </span>
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
