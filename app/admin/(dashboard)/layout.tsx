// app/admin/(dashboard)/layout.tsx
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Fish, ExternalLink, LogOut } from 'lucide-react'
import { navAdmin } from '@/config/navigation'

import { checkAuth } from '@/lib/auth'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const isAuth = await checkAuth()
  if (!isAuth) redirect('/admin/login')

  return (
    <div className="relative min-h-screen flex gradient-hero">
      {/* Background blur circles */}
      <div className="pointer-events-none fixed -top-40 -left-40 h-[28rem] w-[28rem] rounded-full bg-accent/20 blur-3xl" />
      <div className="pointer-events-none fixed -bottom-40 -right-40 h-[28rem] w-[28rem] rounded-full bg-aqua-glow/15 blur-3xl" />

      {/* Sidebar */}
      <aside className="relative w-64 flex-shrink-0 hidden md:flex flex-col border-r border-white/10 bg-white/5 backdrop-blur-xl">
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl gradient-aqua shadow-glow">
              <Fish className="h-6 w-6 text-white" strokeWidth={2.5} />
            </div>
            <div className="leading-tight">
              <div className="text-lg font-black tracking-tight text-white">Aplesi</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-white/50">Admin Panel</div>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {navAdmin.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/70 hover:bg-aqua-glow/10 hover:text-aqua-glow transition-colors text-sm font-semibold"
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 space-y-2">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-2 text-sm text-white/50 hover:text-white/80 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            <span>Lihat website</span>
          </Link>
          <a
            href="/api/auth/logout"
            className="flex items-center gap-2 text-sm text-red-300/70 hover:text-red-300 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </a>
        </div>
      </aside>

      {/* Main content */}
      <div className="relative flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="border-b border-white/10 bg-white/5 backdrop-blur-xl px-6 py-4 flex items-center justify-between">
          <div className="text-sm text-white/60">
            Panel Admin — <span className="text-white font-semibold">aplesi.my.id</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 bg-aqua-glow rounded-full shadow-glow"></span>
            <span className="text-sm font-semibold text-white/80">Super Admin</span>
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
