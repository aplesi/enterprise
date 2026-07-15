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
        <div className="p-4 border-b border-white/10">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg gradient-aqua shadow-glow">
              <Fish className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
            <div className="leading-tight">
              <div className="text-base font-bold tracking-tight text-white">Aplesi</div>
              <div className="text-[9px] font-medium uppercase tracking-wider text-white/40">Admin Panel</div>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5">
          {navAdmin.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-white/60 hover:bg-aqua-glow/10 hover:text-aqua-glow transition-colors text-xs font-medium"
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-white/10 space-y-1.5">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-2 text-xs text-white/40 hover:text-white/70 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Lihat website</span>
          </Link>
          <a
            href="/api/auth/logout"
            className="flex items-center gap-2 text-xs text-red-300/60 hover:text-red-300 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Logout</span>
          </a>
        </div>
      </aside>

      {/* Main content */}
      <div className="relative flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="border-b border-white/10 bg-white/5 backdrop-blur-xl px-5 py-3 flex items-center justify-between">
          <div className="text-xs text-white/50">
            Panel Admin — <span className="text-white/80 font-medium">aplesi.my.id</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-aqua-glow rounded-full shadow-glow"></span>
            <span className="text-xs font-medium text-white/60">Super Admin</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-5 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
