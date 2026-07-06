'use client'
export const runtime = 'edge';
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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white">Dashboard</h1>
        <p className="text-white/60 text-sm mt-1">
          Selamat datang di panel admin Aplesi
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl transition-all hover:border-aqua-glow/40 hover:bg-white/10"
            >
              <Icon className="h-6 w-6 text-aqua-glow mb-2" />
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-sm text-white/60 mt-1">{stat.label}</div>
            </Link>
          )
        })}
      </div>

      {/* Menu Utama */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4">Menu Utama</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {menuUtama.map((menu) => {
            const Icon = menu.icon
            return (
              <Link
                key={menu.href}
                href={menu.href}
                className={`rounded-xl border-2 bg-white/5 p-5 backdrop-blur-xl transition-all ${menu.accent}`}
              >
                <Icon className="h-8 w-8 text-white/80 mb-3" />
                <h3 className="font-bold text-white mb-1">{menu.judul}</h3>
                <p className="text-sm text-white/60">{menu.deskripsi}</p>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Artikel Terbaru */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Artikel Terbaru</h2>
          <Link href="/admin/artikel" className="text-aqua-glow text-sm font-semibold hover:underline">
            Lihat semua
          </Link>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="text-left px-4 py-3 text-white/70 font-semibold">Judul</th>
                <th className="text-left px-4 py-3 text-white/70 font-semibold hidden md:table-cell">Kategori</th>
                <th className="text-left px-4 py-3 text-white/70 font-semibold hidden md:table-cell">Tanggal</th>
                <th className="text-left px-4 py-3 text-white/70 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {artikelList.slice(0, 5).map((artikel) => (
                <tr key={artikel.slug} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/artikel/${artikel.slug}`}
                      target="_blank"
                      className="text-white hover:text-aqua-glow font-semibold line-clamp-1 transition-colors"
                    >
                      {artikel.judul}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-white/60 hidden md:table-cell">
                    {artikel.kategori}
                  </td>
                  <td className="px-4 py-3 text-white/60 hidden md:table-cell">
                    {artikel.tanggal}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full bg-aqua-glow/20 px-2.5 py-0.5 text-xs font-bold text-aqua-glow">
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
