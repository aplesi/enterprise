'use client'
// app/admin/(dashboard)/page.tsx
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { FileText, Clock, Folder, Sparkles, Calendar, BarChart3, DollarSign, Users } from 'lucide-react'

interface ArtikelItem {
  slug: string
  judul: string
  kategori: string
  tanggal: string
  status: string
}

export default function AdminDashboard() {
  const [artikelList, setArtikelList] = useState<ArtikelItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/articles')
      .then(r => r.json())
      .then(d => {
        setArtikelList(d.data ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const totalArtikel = artikelList.length
  const today = new Date().toISOString().split('T')[0]
  const artikelHariIni = artikelList.filter(a => a.tanggal === today).length

  const stats = [
    { label: 'Total Artikel', value: loading ? '...' : totalArtikel, icon: FileText, href: '/admin/artikel' },
    { label: 'Terbit Hari Ini', value: loading ? '...' : artikelHariIni, icon: FileText, href: '/admin/artikel' },
    { label: 'Auto-post Aktif', value: '07:00 WIB', icon: Clock, href: '/admin/jadwal' },
    { label: 'Kategori', value: '8', icon: Folder, href: '/admin/kategori' },
  ]

  const menuUtama = [
    {
      href: '/admin/generate',
      icon: Sparkles,
      judul: 'Generate Artikel',
      deskripsi: 'Buat artikel baru dengan AI (Groq + Cloudflare AI)',
      accent: 'border-aqua-glow/30 hover:border-aqua-glow/60',
    },
    {
      href: '/admin/jadwal',
      icon: Calendar,
      judul: 'Jadwal Auto-Post',
      deskripsi: 'Atur jadwal posting otomatis harian',
      accent: 'border-accent/30 hover:border-accent/60',
    },
    {
      href: '/admin/kategori',
      icon: Folder,
      judul: 'Kategori & Tag',
      deskripsi: 'Kelola kategori dan tag artikel',
      accent: 'border-aqua-glow/30 hover:border-aqua-glow/60',
    },
    {
      href: '/admin/analytics',
      icon: BarChart3,
      judul: 'Analytics',
      deskripsi: 'Pantau traffic dan performa artikel',
      accent: 'border-accent/30 hover:border-accent/60',
    },
    {
      href: '/admin/afiliasi',
      icon: DollarSign,
      judul: 'Afiliasi',
      deskripsi: 'Kelola link afiliasi dan komisi',
      accent: 'border-aqua-glow/30 hover:border-aqua-glow/60',
    },
    {
      href: '/admin/pengguna',
      icon: Users,
      judul: 'Pengguna',
      deskripsi: 'Kelola editor dan admin (Super Admin only)',
      accent: 'border-accent/30 hover:border-accent/60',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-white">Dashboard</h1>
        <p className="text-white/50 text-xs mt-0.5">
          Selamat datang di panel admin Aplesi
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="rounded-lg border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all hover:border-aqua-glow/40 hover:bg-white/10"
            >
              <Icon className="h-4 w-4 text-aqua-glow mb-1.5" />
              <div className="text-lg font-bold text-white">{stat.value}</div>
              <div className="text-xs text-white/50 mt-0.5">{stat.label}</div>
            </Link>
          )
        })}
      </div>

      {/* Menu Utama */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3">Menu Utama</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {menuUtama.map((menu) => {
            const Icon = menu.icon
            return (
              <Link
                key={menu.href}
                href={menu.href}
                className={`rounded-lg border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all hover:border-aqua-glow/40 hover:bg-white/10 ${menu.accent}`}
              >
                <Icon className="h-5 w-5 text-white/70 mb-2" />
                <h3 className="text-sm font-semibold text-white mb-0.5">{menu.judul}</h3>
                <p className="text-xs text-white/50">{menu.deskripsi}</p>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Artikel Terbaru */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white">Artikel Terbaru</h2>
          <Link href="/admin/artikel" className="text-aqua-glow text-xs font-medium hover:underline">
            Lihat semua
          </Link>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="text-left px-3 py-2.5 text-white/60 font-medium">Judul</th>
                <th className="text-left px-3 py-2.5 text-white/60 font-medium hidden md:table-cell">Kategori</th>
                <th className="text-left px-3 py-2.5 text-white/60 font-medium hidden md:table-cell">Tanggal</th>
                <th className="text-left px-3 py-2.5 text-white/60 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {artikelList.slice(0, 5).map((artikel) => (
                <tr key={artikel.slug} className="hover:bg-white/5 transition-colors">
                  <td className="px-3 py-2.5">
                    <Link
                      href={`/artikel/${artikel.slug}`}
                      target="_blank"
                      className="text-white hover:text-aqua-glow font-medium line-clamp-1 transition-colors"
                    >
                      {artikel.judul}
                    </Link>
                  </td>
                  <td className="px-3 py-2.5 text-white/50 hidden md:table-cell">
                    {artikel.kategori}
                  </td>
                  <td className="px-3 py-2.5 text-white/50 hidden md:table-cell">
                    {artikel.tanggal}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="inline-flex items-center rounded-full bg-aqua-glow/15 px-2 py-0.5 text-[10px] font-medium text-aqua-glow">
                      Published
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
