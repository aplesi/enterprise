'use client'

import Link from 'next/link'
import { Share2, Mail, MapPin, Phone, Send, Fish } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function Footer() {
  const handleNewsletterSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // TODO: Integrate with /api/subscriber endpoint
    const formData = new FormData(e.currentTarget)
    const email = formData.get('email')
    console.log('Newsletter subscription:', email)
  }

  return (
    <footer className="relative bg-navy-deep pt-20 pb-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          {/* Brand Section */}
          <div className="lg:col-span-4">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl gradient-aqua shadow-glow">
                <Fish className="h-6 w-6 text-primary-foreground" strokeWidth={2.5} />
              </div>
              <div>
                <div className="text-xl font-black text-primary-foreground">APLESI</div>
                <div className="text-[10px] font-medium uppercase tracking-wider text-primary-foreground/60">
                  Asosiasi Pembudidaya Ikan Indonesia
                </div>
              </div>
            </div>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-primary-foreground/70">
              Asosiasi resmi yang mewadahi pembudidaya ikan di seluruh Indonesia untuk tumbuh bersama melalui teknologi, edukasi, dan kolaborasi.
            </p>
            <div className="mt-6 flex gap-3">
              {[
                { label: 'Facebook', href: '#' },
                { label: 'Instagram', href: '#' },
                { label: 'YouTube', href: '#' }
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 bg-white/5 transition-colors hover:bg-aqua hover:text-navy-deep"
                  aria-label={social.label}
                >
                  <Share2 className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2">
            <h4 className="text-sm font-bold uppercase tracking-wider text-aqua-glow">Tautan Cepat</h4>
            <ul className="mt-5 space-y-3 text-sm text-primary-foreground/70">
              {[
                { label: 'Tentang Kami', href: '/' },
                { label: 'Artikel', href: '/artikel' },
                { label: 'Berita', href: '/news' },
                { label: 'Produk', href: '/produk' },
                { label: 'Kontak', href: '/' },
              ].map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="transition-colors hover:text-aqua-glow">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="lg:col-span-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-aqua-glow">Hubungi Sekretariat</h4>
            <ul className="mt-5 space-y-3 text-sm text-primary-foreground/70">
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-aqua" />
                Gedung Mina Bahari III, Jl. Medan Merdeka Timur, Jakarta Pusat
              </li>
              <li className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-aqua" />
                +62 21 3500 8000
              </li>
              <li className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-aqua" />
                sekretariat@aplesi.or.id
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="lg:col-span-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-aqua-glow">Dapatkan Buletin Perikanan</h4>
            <p className="mt-5 text-sm text-primary-foreground/70">Update teknologi, harga pasar, dan program eksklusif anggota.</p>
            <form
              onSubmit={handleNewsletterSubmit}
              className="mt-4 flex gap-2 rounded-xl border border-white/10 bg-white/5 p-1.5"
            >
              <Input
                type="email"
                name="email"
                placeholder="Email Anda"
                required
                className="border-0 bg-transparent text-primary-foreground placeholder:text-primary-foreground/50 focus-visible:ring-0"
              />
              <Button type="submit" className="gradient-aqua text-primary-foreground shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-primary-foreground/60 sm:flex-row">
          <div>© 2024 Asosiasi Pembudidaya Ikan Indonesia (APLESI). All rights reserved.</div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-aqua-glow">
              Kebijakan Privasi
            </a>
            <a href="#" className="hover:text-aqua-glow">
              Syarat & Ketentuan
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
