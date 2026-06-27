'use client'

import { useState, useEffect } from 'react'

type Role = 'super_admin' | 'admin' | 'editor'

interface User {
  id: string
  nama: string
  email: string
  role: Role
  aktif: boolean
  createdAt: string
  lastLogin?: string
  jumlahArtikel: number
}

const ROLE_CONFIG: Record<Role, { label: string; warna: string; izin: string[] }> = {
  super_admin: {
    label: 'Super Admin',
    warna: 'bg-red-100 text-red-700',
    izin: ['Generate artikel', 'Publish artikel', 'Hapus artikel', 'Kelola kategori', 'Kelola afiliasi', 'Lihat analytics', 'Kelola pengguna', 'Ubah pengaturan'],
  },
  admin: {
    label: 'Admin',
    warna: 'bg-purple-100 text-purple-700',
    izin: ['Generate artikel', 'Publish artikel', 'Hapus artikel', 'Kelola kategori', 'Kelola afiliasi', 'Lihat analytics'],
  },
  editor: {
    label: 'Editor',
    warna: 'bg-blue-100 text-blue-700',
    izin: ['Generate artikel', 'Publish artikel (perlu review)', 'Kelola kategori'],
  },
}

const USER_DEFAULT: User[] = [
  { id: '1', nama: 'Super Admin', email: 'admin@aplesi.my.id', role: 'super_admin', aktif: true, createdAt: '2024-01-01', lastLogin: '2024-06-26', jumlahArtikel: 48 },
  { id: '2', nama: 'Budi Santoso', email: 'budi@aplesi.my.id', role: 'editor', aktif: true, createdAt: '2024-03-15', lastLogin: '2024-06-25', jumlahArtikel: 12 },
]

export default function PenggunaPage() {
  const [users, setUsers] = useState<User[]>(USER_DEFAULT)
  const [modeTambah, setModeTambah] = useState(false)
  const [roleDetail, setRoleDetail] = useState<Role | null>(null)
  const [form, setForm] = useState({ nama: '', email: '', role: 'editor' as Role, password: '' })
  const [konfirmasiHapus, setKonfirmasiHapus] = useState<string | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('aplesi_users')
    if (saved) setUsers(JSON.parse(saved))
  }, [])

  function simpan(list: User[]) {
    setUsers(list)
    localStorage.setItem('aplesi_users', JSON.stringify(list))
  }

  function tambahUser() {
    if (!form.nama || !form.email) return
    const baru: User = {
      id: Date.now().toString(),
      nama: form.nama,
      email: form.email,
      role: form.role,
      aktif: true,
      createdAt: new Date().toISOString().split('T')[0],
      jumlahArtikel: 0,
    }
    simpan([...users, baru])
    setForm({ nama: '', email: '', role: 'editor', password: '' })
    setModeTambah(false)
  }

  function ubahRole(id: string, role: Role) {
    simpan(users.map(u => u.id === id ? { ...u, role } : u))
  }

  function toggleAktif(id: string) {
    simpan(users.map(u => u.id === id ? { ...u, aktif: !u.aktif } : u))
  }

  function hapus(id: string) {
    simpan(users.filter(u => u.id !== id))
    setKonfirmasiHapus(null)
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Manajemen Pengguna</h1>
        <p className="text-gray-500 text-sm mt-1">Kelola akses editor dan admin (Super Admin only)</p>
      </div>

      {/* Role Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(Object.entries(ROLE_CONFIG) as [Role, typeof ROLE_CONFIG[Role]][]).map(([role, config]) => (
          <button key={role} onClick={() => setRoleDetail(roleDetail === role ? null : role)}
            className={`admin-card text-left hover:border-gray-300 transition-colors ${roleDetail === role ? 'border-green-300 bg-green-50' : ''}`}>
            <span className={`badge ${config.warna} mb-2`}>{config.label}</span>
            <p className="text-xs text-gray-500">{config.izin.length} izin akses</p>
            <p className="text-xs text-green-600 mt-1">{roleDetail === role ? '▲ Sembunyikan' : '▼ Lihat izin'}</p>
          </button>
        ))}
      </div>

      {/* Detail Izin */}
      {roleDetail && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <h3 className="font-semibold text-gray-800 mb-2">
            Izin <span className={`badge ${ROLE_CONFIG[roleDetail].warna}`}>{ROLE_CONFIG[roleDetail].label}</span>
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {ROLE_CONFIG[roleDetail].izin.map(iz => (
              <div key={iz} className="flex items-center gap-1.5 text-sm text-gray-700">
                <span className="text-green-500">✓</span> {iz}
              </div>
            ))}
            {/* Tampilkan yang tidak diizinkan */}
            {Object.values(ROLE_CONFIG).flatMap(c => c.izin)
              .filter((v, i, a) => a.indexOf(v) === i)
              .filter(iz => !ROLE_CONFIG[roleDetail].izin.includes(iz))
              .map(iz => (
                <div key={iz} className="flex items-center gap-1.5 text-sm text-gray-400">
                  <span className="text-red-300">✗</span> {iz}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Tombol Tambah */}
      <div className="flex justify-end">
        <button onClick={() => setModeTambah(!modeTambah)} className="btn-primary text-sm">
          + Undang Pengguna Baru
        </button>
      </div>

      {/* Form Tambah */}
      {modeTambah && (
        <div className="admin-card border-2 border-green-200 bg-green-50 space-y-4">
          <h3 className="font-semibold text-gray-800">Undang Pengguna Baru</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="admin-label">Nama Lengkap *</label>
              <input value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })}
                placeholder="cth: Budi Santoso" className="admin-input" />
            </div>
            <div>
              <label className="admin-label">Email *</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="budi@email.com" className="admin-input" />
            </div>
            <div>
              <label className="admin-label">Role</label>
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value as Role })} className="admin-input">
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
            <div>
              <label className="admin-label">Password Sementara</label>
              <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="Min. 8 karakter" className="admin-input" />
            </div>
          </div>
          <p className="text-xs text-gray-500">
            ℹ️ Pengguna akan menerima email undangan dan diminta mengganti password saat login pertama.
          </p>
          <div className="flex gap-2">
            <button onClick={tambahUser} className="btn-primary text-sm">✅ Kirim Undangan</button>
            <button onClick={() => setModeTambah(false)} className="btn-secondary text-sm">Batal</button>
          </div>
        </div>
      )}

      {/* Tabel Pengguna */}
      <div className="admin-card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Pengguna</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium hidden md:table-cell">Role</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium hidden md:table-cell">Login Terakhir</th>
              <th className="text-right px-4 py-3 text-gray-600 font-medium hidden md:table-cell">Artikel</th>
              <th className="text-center px-4 py-3 text-gray-600 font-medium">Status</th>
              <th className="text-center px-4 py-3 text-gray-600 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map(user => (
              <tr key={user.id} className={`hover:bg-gray-50 ${!user.aktif ? 'opacity-60' : ''}`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {user.nama.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{user.nama}</div>
                      <div className="text-xs text-gray-400">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <select
                    value={user.role}
                    onChange={e => ubahRole(user.id, e.target.value as Role)}
                    disabled={user.role === 'super_admin' && users.filter(u => u.role === 'super_admin').length <= 1}
                    className={`text-xs px-2 py-1 rounded-full font-medium border-0 cursor-pointer ${ROLE_CONFIG[user.role].warna}`}
                  >
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500 hidden md:table-cell">
                  {user.lastLogin || '-'}
                </td>
                <td className="px-4 py-3 text-right text-sm font-medium text-gray-800 hidden md:table-cell">
                  {user.jumlahArtikel}
                </td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => toggleAktif(user.id)}
                    disabled={user.role === 'super_admin'}
                    className={`text-xs px-2 py-1 rounded-full font-medium disabled:opacity-50 ${user.aktif ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {user.aktif ? 'Aktif' : 'Nonaktif'}
                  </button>
                </td>
                <td className="px-4 py-3 text-center">
                  {user.role !== 'super_admin' ? (
                    konfirmasiHapus === user.id ? (
                      <div className="flex gap-1 justify-center">
                        <button onClick={() => hapus(user.id)} className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded-lg">Hapus?</button>
                        <button onClick={() => setKonfirmasiHapus(null)} className="text-xs btn-secondary py-1 px-2">×</button>
                      </div>
                    ) : (
                      <button onClick={() => setKonfirmasiHapus(user.id)}
                        className="text-xs text-gray-400 hover:text-red-500 px-2 py-1 rounded-lg">🗑</button>
                    )
                  ) : (
                    <span className="text-xs text-gray-300">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
        <strong className="text-blue-800">🔐 Keamanan:</strong> Pastikan setiap pengguna menggunakan password unik dan kuat.
        Untuk production, aktifkan Two-Factor Authentication (2FA) via NextAuth dengan provider Google atau GitHub.
      </div>
    </div>
  )
}
