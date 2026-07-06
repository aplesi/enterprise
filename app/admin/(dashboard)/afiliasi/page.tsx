'use client'

import { useState, useEffect } from 'react'
import { DollarSign, MousePointerClick, Link2, Check, Copy, Edit, Trash2, Lightbulb, Plus, ExternalLink } from 'lucide-react'

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
  { id: '1', nama: 'Pakan Ikan HiPro-Vite 781', url: 'https://tokopedia.com/xxx', platform: 'Tokopedia', kategori: 'Pakan', komisiPersen: 5, totalKlik: 234, totalKomisi: 185000, aktif: true, createdAt: '2024-01-15' },
  { id: '2', nama: 'Benih Ikan Nila Unggul', url: 'https://shopee.co.id/xxx', platform: 'Shopee', kategori: 'Bibit & Induk', komisiPersen: 8, totalKlik: 187, totalKomisi: 320000, aktif: true, createdAt: '2024-01-20' },
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
    fetch('/api/afiliasi')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data && data.data.length > 0) {
          setLinks(data.data)
        }
      })
      .catch(() => {})
  }, [])

  async function simpan(list: LinkAfiliasi[]) {
    setLinks(list)
    try {
      await fetch('/api/afiliasi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(list),
      })
    } catch (err) {
      console.error('Gagal simpan afiliasi', err)
    }
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
    Tokopedia: 'bg-aqua-glow/20 text-aqua-glow border-aqua-glow/30',
    Shopee: 'bg-accent/20 text-accent border-accent/30',
    Lazada: 'bg-accent/20 text-accent border-accent/30',
    Bukalapak: 'bg-red-400/20 text-red-300 border-red-400/30',
    Blibli: 'bg-aqua-glow/20 text-aqua-glow border-aqua-glow/30',
    default: 'bg-white/10 text-white/70 border-white/20',
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white">Manajemen Afiliasi</h1>
        <p className="text-white/60 text-sm mt-1">Kelola link afiliasi dan pantau komisi</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Komisi', value: `Rp ${totalKomisi.toLocaleString('id-ID')}`, icon: DollarSign, warna: 'text-aqua-glow' },
          { label: 'Total Klik', value: totalKlik.toLocaleString('id-ID'), icon: MousePointerClick, warna: 'text-accent' },
          { label: 'Link Aktif', value: `${linkAktif}/${links.length}`, icon: Link2, warna: 'text-purple-300' },
        ].map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl text-center">
              <Icon className="h-6 w-6 mx-auto mb-2 text-white/60" />
              <div className={`text-xl font-bold ${s.warna}`}>{s.value}</div>
              <div className="text-xs text-white/60 mt-1">{s.label}</div>
            </div>
          )
        })}
      </div>

      {/* Filter & Tombol Tambah */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2 flex-wrap">
          {['Semua', ...KATEGORI_LIST].map(k => (
            <button
              key={k}
              onClick={() => setFilterKategori(k)}
              className={`px-3 py-1.5 text-sm rounded-lg border font-bold transition-all ${
                filterKategori === k
                  ? 'bg-aqua-glow border-aqua-glow text-white'
                  : 'bg-white/5 text-white/70 border-white/20 hover:border-aqua-glow/40'
              }`}
            >
              {k}
            </button>
          ))}
        </div>
        <button
          onClick={() => setModeTambah(!modeTambah)}
          className="flex items-center gap-2 rounded-lg gradient-aqua px-4 py-2 text-sm font-bold text-white shadow-glow hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" />
          Tambah Link Afiliasi
        </button>
      </div>

      {/* Form Tambah */}
      {modeTambah && (
        <div className="rounded-xl border-2 border-aqua-glow/30 bg-aqua-glow/5 p-5 backdrop-blur-xl space-y-4">
          <h3 className="font-bold text-white flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Tambah Link Afiliasi Baru
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">Nama Produk *</label>
              <input
                value={form.nama}
                onChange={e => setForm({ ...form, nama: e.target.value })}
                placeholder="cth: Pakan Ikan HiPro-Vite 781"
                className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-aqua-glow/60 focus:bg-white/10 focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">URL Afiliasi *</label>
              <input
                value={form.url}
                onChange={e => setForm({ ...form, url: e.target.value })}
                placeholder="https://tokopedia.com/xxx?aff=xxx"
                className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-aqua-glow/60 focus:bg-white/10 focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">Platform</label>
              <select
                value={form.platform}
                onChange={e => setForm({ ...form, platform: e.target.value })}
                className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-aqua-glow/60 focus:bg-white/10 focus:outline-none transition-all"
              >
                {PLATFORM_LIST.map(p => <option key={p} className="bg-navy-deep text-white">{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">Kategori</label>
              <select
                value={form.kategori}
                onChange={e => setForm({ ...form, kategori: e.target.value })}
                className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-aqua-glow/60 focus:bg-white/10 focus:outline-none transition-all"
              >
                {KATEGORI_LIST.map(k => <option key={k} className="bg-navy-deep text-white">{k}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">Komisi (%)</label>
              <input
                type="number"
                value={form.komisiPersen}
                onChange={e => setForm({ ...form, komisiPersen: Number(e.target.value) })}
                min={1}
                max={100}
                className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-aqua-glow/60 focus:bg-white/10 focus:outline-none transition-all"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={tambah}
              className="flex items-center gap-1.5 rounded-lg gradient-aqua px-4 py-2 text-sm font-bold text-white shadow-glow hover:opacity-90 transition-opacity"
            >
              <Check className="h-4 w-4" />
              Simpan
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

      {/* Tabel Link */}
      <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>
              <th className="text-left px-4 py-3 text-white/70 font-bold">Produk</th>
              <th className="text-left px-4 py-3 text-white/70 font-bold hidden md:table-cell">Platform</th>
              <th className="text-right px-4 py-3 text-white/70 font-bold hidden md:table-cell">Klik</th>
              <th className="text-right px-4 py-3 text-white/70 font-bold hidden md:table-cell">Komisi</th>
              <th className="text-center px-4 py-3 text-white/70 font-bold">Status</th>
              <th className="text-center px-4 py-3 text-white/70 font-bold">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {linkFiltered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-white/40">
                  <Link2 className="h-10 w-10 mx-auto mb-2 text-white/30" />
                  Belum ada link afiliasi
                </td>
              </tr>
            ) : linkFiltered.map(link => (
              <tr key={link.id} className={`hover:bg-white/5 transition-colors ${!link.aktif ? 'opacity-50' : ''}`}>
                <td className="px-4 py-3">
                  {modeEdit === link.id ? (
                    <div className="space-y-2">
                      <input
                        value={form.nama}
                        onChange={e => setForm({ ...form, nama: e.target.value })}
                        className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white focus:border-aqua-glow/60 focus:bg-white/10 focus:outline-none transition-all"
                      />
                      <input
                        value={form.url}
                        onChange={e => setForm({ ...form, url: e.target.value })}
                        className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white placeholder:text-white/40 focus:border-aqua-glow/60 focus:bg-white/10 focus:outline-none transition-all"
                        placeholder="URL"
                      />
                      <div className="flex gap-1">
                        <button
                          onClick={() => update(link.id)}
                          className="flex items-center gap-1 rounded-lg gradient-aqua px-2 py-1 text-xs font-bold text-white shadow-glow hover:opacity-90 transition-opacity"
                        >
                          <Check className="h-3 w-3" />
                          Simpan
                        </button>
                        <button
                          onClick={() => setModeEdit(null)}
                          className="rounded-lg border border-white/20 bg-white/5 px-2 py-1 text-xs font-bold text-white/80 hover:bg-white/10 transition-all"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="font-semibold text-white line-clamp-1">{link.nama}</div>
                      <div className="text-xs text-white/40 mt-0.5">{link.kategori} · {link.komisiPersen}% komisi</div>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-aqua-glow hover:underline truncate flex items-center gap-1 max-w-xs mt-0.5"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {link.url}
                      </a>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${PLATFORM_WARNA[link.platform] || PLATFORM_WARNA.default}`}>
                    {link.platform}
                  </span>
                </td>
                <td className="px-4 py-3 text-right hidden md:table-cell">
                  <span className="font-bold text-white">{link.totalKlik.toLocaleString('id-ID')}</span>
                </td>
                <td className="px-4 py-3 text-right hidden md:table-cell">
                  <span className="font-bold text-aqua-glow">Rp {link.totalKomisi.toLocaleString('id-ID')}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => toggleAktif(link.id)}
                    className={`text-xs px-2.5 py-1 rounded-full font-bold transition-all ${
                      link.aktif ? 'bg-aqua-glow/20 text-aqua-glow' : 'bg-white/10 text-white/50'
                    }`}
                  >
                    {link.aktif ? 'Aktif' : 'Off'}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => salinLink(link)}
                      className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg font-bold transition-all ${
                        salinId === link.id
                          ? 'bg-aqua-glow/20 text-aqua-glow'
                          : 'bg-white/10 hover:bg-white/15 text-white/70'
                      }`}
                      title="Salin tracking URL"
                    >
                      {salinId === link.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      onClick={() => {
                        setModeEdit(link.id)
                        setForm({ nama: link.nama, url: link.url, platform: link.platform, kategori: link.kategori, komisiPersen: link.komisiPersen })
                      }}
                      className="bg-white/10 hover:bg-white/15 text-white/70 px-2 py-1 rounded-lg transition-all"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    {konfirmasiHapus === link.id ? (
                      <>
                        <button
                          onClick={() => hapus(link.id)}
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
                      </>
                    ) : (
                      <button
                        onClick={() => setKonfirmasiHapus(link.id)}
                        className="text-white/40 hover:text-red-300 px-1 py-1 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Info Cara Pakai */}
      <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-5 text-sm">
        <div className="flex items-start gap-3">
          <Lightbulb className="h-5 w-5 text-amber-300 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-white mb-2">Cara Pakai Link Afiliasi di Artikel</h3>
            <p className="text-white/70 mb-2">
              Saat generate artikel, AI akan otomatis menyisipkan link afiliasi yang relevan.
              Atau, salin tracking URL dan tempel manual di konten artikel:
            </p>
            <code className="block rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-aqua-glow font-mono">
              https://aplesi.my.id/go/nama-produk
            </code>
            <p className="text-xs text-white/50 mt-2">
              Tracking URL ini akan redirect ke URL afiliasi asli dan mencatat klik secara otomatis.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
