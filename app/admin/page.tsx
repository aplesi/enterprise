// app/admin/page.tsx
import Link from 'next/link'
import { getAllArtikel } from '@/lib/db/artikel'

export default async function AdminDashboard() {
  const artikelList = getAllArtikel()
  const totalArtikel = artikelList.length
  const artikelHariIni = artikelList.filter(
    (a) => a.tanggal === new Date().toISOString().split('T')[0]
  ).length

  const stats = [
    { label: 'Total Artikel', value: totalArtikel, icon: '📝', href: '/admin/artikel' },
    { label: 'Terbit Hari Ini', value: artikelHariIni, icon: '✅', href: '/admin/artikel' },
    { label: 'Auto-post Aktif', value: '07:00 WIB', icon: '⏰', href: '/admin/jadwal' },
    { label: 'Kategori', value: '8', icon: '🗂️', href: '/admin/kategori' },
  ]

  const menuUtama = [
    {
      href: '/admin/generate',
      icon: '🤖',
      judul: 'Generate Artikel',
      deskripsi: 'Buat artikel baru dengan AI (Groq + Cloudflare AI)',
      warna: 'border-green-200 hover:bg-green-50',
    },
    {
      href: '/admin/jadwal',
      icon: '📅',
      judul: 'Jadwal Auto-Post',
      deskripsi: 'Atur jadwal posting otomatis harian',
      warna: 'border-blue-200 hover:bg-blue-50',
    },
    {
      href: '/admin/kategori',
      icon: '🗂️',
      judul: 'Kategori & Tag',
      deskripsi: 'Kelola kategori dan tag artikel',
      warna: 'border-purple-200 hover:bg-purple-50',
    },
    {
      href: '/admin/analytics',
      icon: '📊',
      judul: 'Analytics',
      deskripsi: 'Pantau traffic dan performa artikel',
      warna: 'border-orange-200 hover:bg-orange-50',
    },
    {
      href: '/admin/afiliasi',
      icon: '💰',
      judul: 'Afiliasi',
      deskripsi: 'Kelola link afiliasi dan komisi',
      warna: 'border-yellow-200 hover:bg-yellow-50',
    },
    {
      href: '/admin/pengguna',
      icon: '👥',
      judul: 'Pengguna',
      deskripsi: 'Kelola editor dan admin (Super Admin only)',
      warna: 'border-red-200 hover:bg-red-50',
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Selamat datang di panel admin Aplesi
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href} className="admin-card hover:border-green-300 transition-colors">
            <div className="text-2xl mb-2">{stat.icon}</div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
          </Link>
        ))}
      </div>

      {/* Menu Utama */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Menu Utama</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {menuUtama.map((menu) => (
            <Link
              key={menu.href}
              href={menu.href}
              className={`admin-card border-2 transition-colors ${menu.warna}`}
            >
              <div className="text-3xl mb-3">{menu.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-1">{menu.judul}</h3>
              <p className="text-sm text-gray-500">{menu.deskripsi}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Artikel Terbaru */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Artikel Terbaru</h2>
          <Link href="/admin/artikel" className="text-green-600 text-sm hover:underline">
            Lihat semua
          </Link>
        </div>
        <div className="admin-card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Judul</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium hidden md:table-cell">Kategori</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium hidden md:table-cell">Tanggal</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {artikelList.slice(0, 5).map((artikel) => (
                <tr key={artikel.slug} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/artikel/${artikel.slug}`}
                      target="_blank"
                      className="text-gray-900 hover:text-green-600 font-medium line-clamp-1"
                    >
                      {artikel.judul}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                    {artikel.kategori}
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                    {artikel.tanggal}
                  </td>
                  <td className="px-4 py-3">
                    <span className="badge-green">Published</span>
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
