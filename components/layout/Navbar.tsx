'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Fish, Menu, X } from 'lucide-react'

const navLinks = [
  { label: 'Beranda', href: '/' },
  { label: 'Artikel', href: '/artikel' },
  { label: 'Tentang Kami', href: '/tentang-kami' },
  { label: 'Kontak', href: '/kontak' },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(href)
  }

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? 'glass shadow-card' : 'bg-background/90 backdrop-blur-sm border-b border-gray-100'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl gradient-aqua shadow-glow">
            <Fish className="h-6 w-6 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <div className="min-w-0 leading-tight">
            <div className="text-xl font-black tracking-tight text-primary">APLESI</div>
            <div className="hidden text-[11px] font-bold uppercase tracking-wider text-foreground/60 sm:block">
              Portal Edukasi Budidaya Ikan
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              prefetch={false}
              className={`relative text-[15px] font-semibold transition-colors hover:text-primary after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:bg-accent after:transition-all hover:after:w-full ${
                isActive(link.href) ? 'text-primary' : 'text-foreground/70'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="/artikel"
            prefetch={false}
            className="inline-flex items-center justify-center rounded-lg gradient-aqua px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition-opacity hover:opacity-95"
          >
            Baca Panduan
          </Link>
        </div>

        <button
          className="grid h-10 w-10 place-items-center rounded-lg text-primary lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <div className="glass border-t border-border/50 lg:hidden">
          <div className="space-y-1 px-4 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                prefetch={false}
                onClick={() => setOpen(false)}
                className={`block rounded-lg px-3 py-2 text-sm font-medium hover:bg-primary/5 hover:text-primary ${
                  isActive(link.href) ? 'text-primary' : 'text-foreground/80'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3">
              <Link
                href="/artikel"
                prefetch={false}
                onClick={() => setOpen(false)}
                className="block w-full rounded-lg gradient-aqua px-4 py-2.5 text-center text-sm font-semibold text-white"
              >
                Baca Panduan
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
