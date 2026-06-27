// app/admin/layout.tsx
import Link from 'next/link'
import { redirect } from 'next/navigation'

// Simple auth check - ganti dengan NextAuth di production
async function checkAuth() {
  // TODO: Implement NextAuth session check
  return true
}

const navItems = [
  { href: '/admin', icon: '🏠', label: 'Dashboard' },
  { href: '/admin/generate', icon: '🤖', label: 'Generate Artikel' },
  { href: '/admin/jadwal', icon: '📅', label: 'Jadwal Auto-Post' },
  { href: '/admin/kategori', icon: '🗂️', label: 'Kategori & Tag' },
  { href: '/admin/analytics', icon: '📊', label: 'Analytics' },
  { href: '/admin/afiliasi', icon: '💰', label: 'Afiliasi' },
  { href: '/admin/pengguna', icon: '👥', label: 'Pengguna' },
]

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const isAuth = await checkAuth()
  if (!isAuth) redirect('/admin/login')

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0 hidden md:flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🐟</span>
            <div>
              <div className="font-bold text-gray-900">Aplesi</div>
              <div className="text-xs text-gray-500">Admin Panel</div>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-green-50 hover:text-green-700 transition-colors text-sm font-medium"
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
          >
            <span>↗</span>
            <span>Lihat website</span>
          </Link>
          <Link
            href="/admin/logout"
            className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 mt-2"
          >
            <span>🚪</span>
            <span>Logout</span>
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Panel Admin — <span className="text-gray-900 font-medium">aplesi.my.id</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span className="text-sm text-gray-600">Super Admin</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
