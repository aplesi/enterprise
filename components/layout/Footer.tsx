import Link from 'next/link'
import { Mail, Clock, Fish, BookOpen } from 'lucide-react'
import { KATEGORI_LIST } from '@/config/kategori'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="relative bg-navy-deep pt-16 pb-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          {/* Brand Section */}
          <div className="lg:col-span-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl gradient-aqua shadow-glow">
                <Fish className="h-6 w-6 text-primary-foreground" strokeWidth={2.5} />
              </div>
              <div>
                <div className="text-xl font-black text-white">APLESI</div>
                <div className="text-[10px] font-medium uppercase tracking-wider text-white/60">
                  Portal Edukasi Budidaya Ikan Indonesia
                </div>
              </div>
            </Link>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-white/70">
              Pusat panduan teknis dan edukasi budidaya ikan air tawar Indonesia — mulai dari persiapan kolam, sistem bioflok, manajemen kualitas air, hingga penanganan penyakit ikan.
            </p>
          </div>

          {/* Kategori Budidaya */}
          <div className="lg:col-span-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-aqua-glow">Kategori Budidaya</h4>
            <ul className="mt-5 space-y-2.5 text-sm text-white/70">
              {KATEGORI_LIST.map((kat) => (
                <li key={kat.slug}>
                  <Link href={`/kategori/${kat.slug}`} prefetch={false} className="transition-colors hover:text-aqua-glow">
                    {kat.nama}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2">
            <h4 className="text-sm font-bold uppercase tracking-wider text-aqua-glow">Tautan Cepat</h4>
            <ul className="mt-5 space-y-3 text-sm text-white/70">
              {[
                { label: 'Beranda', href: '/' },
                { label: 'Daftar Artikel', href: '/artikel' },
                { label: 'Tentang Kami', href: '/tentang-kami' },
                { label: 'Kontak Redaksi', href: '/kontak' },
              ].map((link) => (
                <li key={link.label}>
                  <Link href={link.href} prefetch={false} className="transition-colors hover:text-aqua-glow">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="lg:col-span-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-aqua-glow">Kontak Redaksi</h4>
            <ul className="mt-5 space-y-3 text-sm text-white/70">
              <li className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-aqua" />
                <a href="mailto:admin@aplesi.my.id" className="hover:text-aqua-glow transition-colors">
                  admin@aplesi.my.id
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-aqua" />
                <span>Senin – Jumat, 08:00 – 16:00 WIB</span>
              </li>
              <li className="flex items-start gap-3">
                <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-aqua" />
                <span>Portal Edukasi Akuakultur — aplesi.my.id</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-white/60 sm:flex-row">
          <div>© {currentYear} APLESI (aplesi.my.id). Seluruh hak cipta dilindungi.</div>
          <div className="flex gap-6">
            <Link href="/privacy-policy" prefetch={false} className="hover:text-aqua-glow">
              Kebijakan Privasi
            </Link>
            <Link href="/disclaimer" prefetch={false} className="hover:text-aqua-glow">
              Disclaimer
            </Link>
            <Link href="/tentang-kami" prefetch={false} className="hover:text-aqua-glow">
              Tentang Kami
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
