'use client'

import { useState, useEffect } from 'react'

interface LinkAfiliasi {
  id: string
  nama: string
  url: string
  platform: string
  kategori: string
  komisiPersen: number
  totalKlik: number
  totalKomisi: number
  aktif: boolean
  createdAt: string
}

const PLATFORM_LIST = ['Tokopedia', 'Shopee', 'Lazada', 'Bukalapak', 'Blibli', 'Website Sendiri', 'Lainnya']
const KATEGORI_LIST = ['Pakan', 'Bibit & Induk', 'Peralatan Kolam', 'Obat & Suplemen', 'Buku & Kursus', 'Lainnya']

const DATA_DEFAULT: LinkAfiliasi[] = [
  { id: '1', nama: 'Pakan Lele HiPro-Vite 781', url: 'https://tokopedia.com/xxx', platform: 'Tokopedia', kategori: 'Pakan', komisiPersen: 5, totalKlik: 234, totalKomisi: 185000, aktif: true, createdAt: '2024-01-15' },
  { id: '2', nama: 'Benih Lele Dumbo Unggul', url: 'https://shopee.co.id/xxx', platform: 'Shopee', kategori: 'Bibit & Induk', komisiPersen: 8, totalKlik: 187, totalKomisi: 320000, aktif: true, createdAt: '2024-01-20' },
  { id: '3', nama: 'Probiotik EM4 Peternakan', url: 'https://tokopedia.com/xxx', platform: 'Tokopedia', kategori: 'Obat & Suplemen', komisiPersen: 6, totalKlik: 156, totalKomisi: 125000, aktif: true, createdAt: '2024-02-01' },
  { id: '4', nama: 'Aerator Kolam 50 Watt', url: 'https://lazada.co.id/xxx', platform: 'Lazada', kategori: 'Peralatan Kolam', komisiPersen: 4, totalKlik: 98, totalKomisi: 210000, aktif: false, createdAt: '2024-02-10' },
]

function slugLink(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')
}

export default function AfiliasiPage() {
  const [links, setLinks] = useState<LinkAfiliasi[]>(DATA_DEFAULT)
  const [modeTambah, setModeTambah] = useState(false)
  const [modeEdit, setModeEdit] = useState<string | null>(null)
  const [filterKategori, setFilterKategori] = useState('Semua')
  const [salinId, setSalinId] = useState<string | null>(null)
  const [konfirmasiHapus, setKonfirmasiHapus] = useState<string | null>(null)
  const [form, setForm] = useState({
    nama: '', url: '', platform: PLATFORM_LIST[0],
    kategori: KATEGORI_LIST[0], komisiPersen: 5,
  })

  useEffect(() => {
    const saved = localStorage.getItem('aplesi_afiliasi')
    if (saved) setLinks(JSON.parse(saved))
  }, [])

  function simpan(list: LinkAfiliasi[]) {
    setLinks(list)
    localStorage.setItem('aplesi_afiliasi', JSON.stringify(list))
  }

  function tambah() {
    if (!form.nama || !form.url) return
    const baru: LinkAfiliasi = {
      id: Date.now().toString(),
      ...form,
      totalKlik: 0, totalKomisi: 0,
      aktif: true,
      createdAt: new Date().toISOString().split('T')[0],
    }
    simpan([...links, baru])
    setForm({ nama: '', url: '', platform: PLATFORM_LIST[0], kategori: KATEGORI_LIST[0], komisiPersen: 5 })
    setModeTambah(false)
  }

  function update(id: string) {
    simpan(links.map(l => l.id === id ? { ...l, ...form } : l))
    setModeEdit(null)
  }

  function toggleAktif(id: string) {
    simpan(links.map(l => l.id === id ? { ...l, aktif: !l.aktif } : l))
  }

  function hapus(id: string) {
    simpan(links.filter(l => l.id !== id))
    setKonfirmasiHapus(null)
  }

  function salinLink(link: LinkAfiliasi) {
    // Buat tracking URL via API route
    const trackingUrl = `https://aplesi.my.id/go/${slugLink(link.nama)}`
    navigator.clipboard.writeText(trackingUrl)
    setSalinId(link.id)
    setTimeout(() => setSalinId(null), 2000)
  }

  const linkFiltered = filterKategori === 'Semua'
    ? links
    : links.filter(l => l.kategori === filterKategori)

  const totalKomisi = links.reduce((s, l) => s + l.totalKomisi, 0)
  const totalKlik = links.reduce((s, l) => s + l.totalKlik, 0)
  const linkAktif = links.filter(l => l.aktif).length

  const PLATFORM_WARNA: Record<string, string> = {
    Tokopedia: 'bg-green-100 text-green-700',
    Shopee: 'bg-orange-100 text-orange-700',
    Lazada: 'bg-blue-100 text-blue-700',
    Bukalapak: 'bg-red-100 text-red-700',
    Blibli: 'bg-sky-100 text-sky-700',
    default: 'bg-gray-100 text-gray-600',
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Manajemen Afiliasi</h1>
        <p className="text-gray-500 text-sm mt-1">Kelola link afiliasi dan pantau komisi</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Komisi', value: `Rp ${totalKomisi.toLocaleString('id-ID')}`, icon: '💰', warna: 'text-green-600' },
          { label: 'Total Klik', value: totalKlik.toLocaleString('id-ID'), icon: '👆', warna: 'text-blue-600' },
          { label: 'Link Aktif', value: `${linkAktif}/${links.length}`, icon: '🔗', warna: 'text-purple-600' },
        ].map(s => (
          <div key={s.label} className="admin-card text-center">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className={`text-xl font-bold ${s.warna}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter & Tombol Tambah */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2 flex-wrap">
          {['Semua', ...KATEGORI_LIST].map(k => (
            <button key={k} onClick={() => setFilterKategori(k)}
              className={`px-3 py-1.5 text-sm rounded-lg border font-medium transition-colors ${
                filterKategori === k
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-green-400'
              }`}>
              {k}
            </button>
          ))}
        </div>
        <button onClick={() => setModeTambah(!modeTambah)} className="btn-primary text-sm">
          + Tambah Link Afiliasi
        </button>
      </div>

      {/* Form Tambah */}
      {modeTambah && (
        <div className="admin-card border-2 border-green-200 bg-green-50 space-y-4">
          <h3 className="font-semibold text-gray-800">Tambah Link Afiliasi Baru</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="admin-label">Nama Produk *</label>
              <input value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })}
                placeholder="cth: Pakan Lele HiPro-Vite 781" className="admin-input" />
            </div>
            <div>
              <label className="admin-label">URL Afiliasi *</label>
              <input value={form.url} onChange={e => setForm({ ...form, url: e.target.value })}
                placeholder="https://tokopedia.com/xxx?aff=xxx" className="admin-input" />
            </div>
            <div>
              <label className="admin-label">Platform</label>
              <select value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value })} className="admin-input">
                {PLATFORM_LIST.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="admin-label">Kategori</label>
              <select value={form.kategori} onChange={e => setForm({ ...form, kategori: e.target.value })} className="admin-input">
                {KATEGORI_LIST.map(k => <option key={k}>{k}</option>)}
              </select>
            </div>
            <div>
              <label className="admin-label">Komisi (%)</label>
              <input type="number" value={form.komisiPersen} onChange={e => setForm({ ...form, komisiPersen: Number(e.target.value) })}
                min={1} max={100} className="admin-input" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={tambah} className="btn-primary text-sm">✅ Simpan</button>
            <button onClick={() => setModeTambah(false)} className="btn-secondary text-sm">Batal</button>
          </div>
        </div>
      )}

      {/* Tabel Link */}
      <div className="admin-card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Produk</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium hidden md:table-cell">Platform</th>
              <th className="text-right px-4 py-3 text-gray-600 font-medium hidden md:table-cell">Klik</th>
              <th className="text-right px-4 py-3 text-gray-600 font-medium hidden md:table-cell">Komisi</th>
              <th className="text-center px-4 py-3 text-gray-600 font-medium">Status</th>
              <th className="text-center px-4 py-3 text-gray-600 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {linkFiltered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-gray-400">
                  <div className="text-3xl mb-2">🔗</div>
                  Belum ada link afiliasi
                </td>
              </tr>
            ) : linkFiltered.map(link => (
              <tr key={link.id} className={`hover:bg-gray-50 ${!link.aktif ? 'opacity-60' : ''}`}>
                <td className="px-4 py-3">
                  {modeEdit === link.id ? (
                    <div className="space-y-2">
                      <input value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })} className="admin-input text-xs" />
                      <input value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} className="admin-input text-xs" placeholder="URL" />
                      <div className="flex gap-1">
                        <button onClick={() => update(link.id)} className="text-xs btn-primary py-0.5 px-2">Simpan</button>
                        <button onClick={() => setModeEdit(null)} className="text-xs btn-secondary py-0.5 px-2">Batal</button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="font-medium text-gray-900 line-clamp-1">{link.nama}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{link.kategori} · {link.komisiPersen}% komisi</div>
                      <a href={link.url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:underline truncate block max-w-xs">{link.url}</a>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className={`badge ${PLATFORM_WARNA[link.platform] || PLATFORM_WARNA.default}`}>
                    {link.platform}
                  </span>
                </td>
                <td className="px-4 py-3 text-right hidden md:table-cell">
                  <span className="font-medium text-gray-800">{link.totalKlik.toLocaleString('id-ID')}</span>
                </td>
                <td className="px-4 py-3 text-right hidden md:table-cell">
                  <span className="font-medium text-green-600">Rp {link.totalKomisi.toLocaleString('id-ID')}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => toggleAktif(link.id)}
                    className={`text-xs px-2 py-1 rounded-full font-medium ${link.aktif ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {link.aktif ? 'Aktif' : 'Off'}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => salinLink(link)}
                      className={`text-xs px-2 py-1 rounded-lg transition-colors ${salinId === link.id ? 'bg-green-100 text-green-700' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}>
                      {salinId === link.id ? '✅' : '📋'}
                    </button>
                    <button onClick={() => { setModeEdit(link.id); setForm({ nama: link.nama, url: link.url, platform: link.platform, kategori: link.kategori, komisiPersen: link.komisiPersen }) }}
                      className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded-lg">
                      ✏️
                    </button>
                    {konfirmasiHapus === link.id ? (
                      <>
                        <button onClick={() => hapus(link.id)} className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded-lg">Hapus?</button>
                        <button onClick={() => setKonfirmasiHapus(null)} className="text-xs btn-secondary py-1 px-2">×</button>
                      </>
                    ) : (
                      <button onClick={() => setKonfirmasiHapus(link.id)} className="text-xs text-gray-400 hover:text-red-500 px-1 py-1 rounded-lg">🗑</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Info Cara Pakai */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 text-sm">
        <h3 className="font-semibold text-yellow-800 mb-2">💡 Cara Pakai Link Afiliasi di Artikel</h3>
        <p className="text-yellow-700 mb-2">
          Saat generate artikel, AI akan otomatis menyisipkan link afiliasi yang relevan.
          Atau, salin tracking URL dan tempel manual di konten artikel:
        </p>
        <code className="block bg-white border border-yellow-200 px-3 py-2 rounded-lg text-xs text-gray-700 font-mono">
          https://aplesi.my.id/go/nama-produk
        </code>
        <p className="text-xs text-yellow-600 mt-2">
          Tracking URL ini akan redirect ke URL afiliasi asli dan mencatat klik secara otomatis.
        </p>
      </div>
    </div>
  )
}
