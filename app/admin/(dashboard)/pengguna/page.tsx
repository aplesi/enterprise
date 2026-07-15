'use client'

import { useState, useEffect } from 'react'
import { Check, X, Info, Send, Trash2, Shield, UserPlus, ChevronDown, ChevronUp } from 'lucide-react'

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
    warna: 'bg-red-400/20 text-red-300 border-red-400/30',
    izin: ['Generate artikel', 'Publish artikel', 'Hapus artikel', 'Kelola kategori', 'Kelola afiliasi', 'Lihat analytics', 'Kelola pengguna', 'Ubah pengaturan'],
  },
  admin: {
    label: 'Admin',
    warna: 'bg-purple-400/20 text-purple-300 border-purple-400/30',
    izin: ['Generate artikel', 'Publish artikel', 'Hapus artikel', 'Kelola kategori', 'Kelola afiliasi', 'Lihat analytics'],
  },
  editor: {
    label: 'Editor',
    warna: 'bg-aqua-glow/20 text-aqua-glow border-aqua-glow/30',
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
    fetch('/api/pengguna')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data && data.data.length > 0) {
          setUsers(data.data)
        }
      })
      .catch(() => {})
  }, [])

  async function simpan(list: User[]) {
    setUsers(list)
    try {
      await fetch('/api/pengguna', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(list),
      })
    } catch (err) {
      console.error('Gagal simpan pengguna', err)
    }
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
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-white">Manajemen Pengguna</h1>
        <p className="text-white/60 text-sm mt-1">Kelola akses editor dan admin (Super Admin only)</p>
      </div>

      {/* Role Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(Object.entries(ROLE_CONFIG) as [Role, typeof ROLE_CONFIG[Role]][]).map(([role, config]) => (
          <button
            key={role}
            onClick={() => setRoleDetail(roleDetail === role ? null : role)}
            className={`rounded-xl border bg-white/5 p-5 backdrop-blur-xl text-left hover:bg-white/10 transition-all ${
              roleDetail === role ? 'border-aqua-glow/40 bg-aqua-glow/5' : 'border-white/10'
            }`}
          >
            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold mb-2 ${config.warna}`}>
              {config.label}
            </span>
            <p className="text-xs text-white/60">{config.izin.length} izin akses</p>
            <p className="text-xs text-aqua-glow mt-1 flex items-center gap-1">
              {roleDetail === role ? (
                <>
                  <ChevronUp className="h-3 w-3" />
                  Sembunyikan
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3" />
                  Lihat izin
                </>
              )}
            </p>
          </button>
        ))}
      </div>

      {/* Detail Izin */}
      {roleDetail && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
          <h3 className="font-bold text-white mb-3 flex items-center gap-2">
            Izin{' '}
            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${ROLE_CONFIG[roleDetail].warna}`}>
              {ROLE_CONFIG[roleDetail].label}
            </span>
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {ROLE_CONFIG[roleDetail].izin.map(iz => (
              <div key={iz} className="flex items-center gap-1.5 text-sm text-white/80">
                <Check className="h-4 w-4 text-aqua-glow shrink-0" />
                {iz}
              </div>
            ))}
            {/* Tampilkan yang tidak diizinkan */}
            {Object.values(ROLE_CONFIG).flatMap(c => c.izin)
              .filter((v, i, a) => a.indexOf(v) === i)
              .filter(iz => !ROLE_CONFIG[roleDetail].izin.includes(iz))
              .map(iz => (
                <div key={iz} className="flex items-center gap-1.5 text-sm text-white/30">
                  <X className="h-4 w-4 text-red-300/50 shrink-0" />
                  {iz}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Tombol Tambah */}
      <div className="flex justify-end">
        <button
          onClick={() => setModeTambah(!modeTambah)}
          className="flex items-center gap-2 rounded-lg gradient-aqua px-4 py-2 text-sm font-bold text-white shadow-glow hover:opacity-90 transition-opacity"
        >
          <UserPlus className="h-4 w-4" />
          Undang Pengguna Baru
        </button>
      </div>

      {/* Form Tambah */}
      {modeTambah && (
        <div className="rounded-xl border-2 border-aqua-glow/30 bg-aqua-glow/5 p-5 backdrop-blur-xl space-y-4">
          <h3 className="font-bold text-white flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Undang Pengguna Baru
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">Nama Lengkap *</label>
              <input
                value={form.nama}
                onChange={e => setForm({ ...form, nama: e.target.value })}
                placeholder="cth: Budi Santoso"
                className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-aqua-glow/60 focus:bg-white/10 focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="budi@email.com"
                className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-aqua-glow/60 focus:bg-white/10 focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">Role</label>
              <select
                value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value as Role })}
                className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-aqua-glow/60 focus:bg-white/10 focus:outline-none transition-all"
              >
                <option value="editor" className="bg-navy-deep text-white">Editor</option>
                <option value="admin" className="bg-navy-deep text-white">Admin</option>
                <option value="super_admin" className="bg-navy-deep text-white">Super Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">Password Sementara</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="Min. 8 karakter"
                className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-aqua-glow/60 focus:bg-white/10 focus:outline-none transition-all"
              />
            </div>
          </div>
          <div className="flex items-start gap-2 text-xs text-white/60">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <span>Pengguna akan menerima email undangan dan diminta mengganti password saat login pertama.</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={tambahUser}
              className="flex items-center gap-1.5 rounded-lg gradient-aqua px-4 py-2 text-sm font-bold text-white shadow-glow hover:opacity-90 transition-opacity"
            >
              <Send className="h-4 w-4" />
              Kirim Undangan
            </button>
            <button
              onClick={() => setModeTambah(false)}
              className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-bold text-white/80 hover:bg-white/10 transition-all"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Tabel Pengguna */}
      <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>
              <th className="text-left px-4 py-3 text-white/70 font-bold">Pengguna</th>
              <th className="text-left px-4 py-3 text-white/70 font-bold hidden md:table-cell">Role</th>
              <th className="text-left px-4 py-3 text-white/70 font-bold hidden md:table-cell">Login Terakhir</th>
              <th className="text-right px-4 py-3 text-white/70 font-bold hidden md:table-cell">Artikel</th>
              <th className="text-center px-4 py-3 text-white/70 font-bold">Status</th>
              <th className="text-center px-4 py-3 text-white/70 font-bold">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {users.map(user => (
              <tr key={user.id} className={`hover:bg-white/5 transition-colors ${!user.aktif ? 'opacity-50' : ''}`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-aqua-glow to-accent flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-glow">
                      {user.nama.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-white">{user.nama}</div>
                      <div className="text-xs text-white/40">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <select
                    value={user.role}
                    onChange={e => ubahRole(user.id, e.target.value as Role)}
                    disabled={user.role === 'super_admin' && users.filter(u => u.role === 'super_admin').length <= 1}
                    className={`text-xs px-2.5 py-1 rounded-full font-bold border-0 cursor-pointer ${ROLE_CONFIG[user.role].warna}`}
                    style={{ backgroundColor: 'transparent' }}
                  >
                    <option value="editor" className="bg-navy-deep text-white">Editor</option>
                    <option value="admin" className="bg-navy-deep text-white">Admin</option>
                    <option value="super_admin" className="bg-navy-deep text-white">Super Admin</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-xs text-white/60 hidden md:table-cell">
                  {user.lastLogin || '-'}
                </td>
                <td className="px-4 py-3 text-right text-sm font-bold text-white hidden md:table-cell">
                  {user.jumlahArtikel}
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => toggleAktif(user.id)}
                    disabled={user.role === 'super_admin'}
                    className={`text-xs px-2.5 py-1 rounded-full font-bold disabled:opacity-30 transition-all ${
                      user.aktif ? 'bg-aqua-glow/20 text-aqua-glow' : 'bg-white/10 text-white/50'
                    }`}
                  >
                    {user.aktif ? 'Aktif' : 'Nonaktif'}
                  </button>
                </td>
                <td className="px-4 py-3 text-center">
                  {user.role !== 'super_admin' ? (
                    konfirmasiHapus === user.id ? (
                      <div className="flex gap-1 justify-center">
                        <button
                          onClick={() => hapus(user.id)}
                          className="text-xs bg-red-500/20 hover:bg-red-500/30 text-red-300 px-2 py-1 rounded-lg font-bold transition-all"
                        >
                          Hapus?
                        </button>
                        <button
                          onClick={() => setKonfirmasiHapus(null)}
                          className="text-xs border border-white/20 bg-white/5 hover:bg-white/10 text-white/80 px-2 py-1 rounded-lg font-bold transition-all"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setKonfirmasiHapus(user.id)}
                        className="text-white/40 hover:text-red-300 px-2 py-1 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )
                  ) : (
                    <span className="text-xs text-white/20">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-accent/30 bg-accent/10 p-4 text-sm">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-accent shrink-0 mt-0.5" />
          <div>
            <strong className="text-white font-bold">Keamanan:</strong>{' '}
            <span className="text-white/70">
              Pastikan setiap pengguna menggunakan password unik dan kuat.
              Untuk production, aktifkan Two-Factor Authentication (2FA) via NextAuth dengan provider Google atau GitHub.
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
