'use client'

import { useState, useEffect, useCallback } from 'react'
import { ShoppingBag, Plus, Edit, Trash2, ExternalLink, Eye, EyeOff, Save, X, Image as ImageIcon } from 'lucide-react'

interface ProdukItem {
  id: number
  slug: string
  nama: string
  deskripsi: string
  harga: number
  hargaAsli: number | null
  gambar: string[]
  kategori: string
  platform: string
  urlAfiliasi: string
  rating: number | null
  terjual: number
  aktif: boolean
  createdAt: string
}

const KATEGORI_LIST = ['Pakan', 'Bibit & Induk', 'Peralatan Kolam', 'Obat & Suplemen', 'Buku & Kursus', 'Lainnya']
const PLATFORM_LIST = ['Shopee', 'Tokopedia', 'Bukalapak', 'Blibli', 'Website Sendiri', 'Lainnya']

const FORM_DEFAULT = {
  nama: '',
  deskripsi: '',
  harga: '',
  hargaAsli: '',
  gambarUrl: '',
  kategori: KATEGORI_LIST[0],
  platform: PLATFORM_LIST[0],
  urlAfiliasi: '',
  rating: '',
  terjual: '',
}

function formatRupiah(n: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
}

export default function AdminProdukPage() {
  const [produkList, setProdukList] = useState<ProdukItem[]>([])
  const [loading, setLoading] = useState(true)
  const [modeTambah, setModeTambah] = useState(false)
  const [modeEdit, setModeEdit] = useState<number | null>(null)
  const [form, setForm] = useState(FORM_DEFAULT)
  const [submitting, setSubmitting] = useState(false)
  const [pesan, setPesan] = useState<{ teks: string; tipe: 'sukses' | 'error' } | null>(null)
  const [konfirmasiHapus, setKonfirmasiHapus] = useState<number | null>(null)

  const fetchProduk = useCallback(async () => {
    try {
      const res = await fetch('/api/produk')
      const data = await res.json()
      if (data.success && data.data) {
        setProdukList(data.data)
      }
    } catch {
      setPesan({ teks: 'Gagal memuat data produk', tipe: 'error' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchProduk() }, [fetchProduk])

  function tampilPesan(teks: string, tipe: 'sukses' | 'error') {
    setPesan({ teks, tipe })
    setTimeout(() => setPesan(null), 4000)
  }

  function mulaiEdit(p: ProdukItem) {
    setModeEdit(p.id)
    setModeTambah(false)
    setForm({
      nama: p.nama,
      deskripsi: p.deskripsi,
      harga: String(p.harga),
      hargaAsli: p.hargaAsli ? String(p.hargaAsli) : '',
      gambarUrl: p.gambar[0] || '',
      kategori: p.kategori,
      platform: p.platform,
      urlAfiliasi: p.urlAfiliasi,
      rating: p.rating ? String(p.rating) : '',
      terjual: String(p.terjual),
    })
  }

  function batal() {
    setModeTambah(false)
    setModeEdit(null)
    setForm(FORM_DEFAULT)
  }

  async function simpan() {
    if (!form.nama || !form.urlAfiliasi) {
      tampilPesan('Nama produk dan URL afiliasi wajib diisi', 'error')
      return
    }
    setSubmitting(true)
    try {
      const payload = {
        nama: form.nama,
        deskripsi: form.deskripsi,
        harga: Number(form.harga) || 0,
        hargaAsli: form.hargaAsli ? Number(form.hargaAsli) : null,
        gambar: form.gambarUrl ? [form.gambarUrl] : [],
        kategori: form.kategori,
        platform: form.platform,
        urlAfiliasi: form.urlAfiliasi,
        rating: form.rating ? Number(form.rating) : null,
        terjual: form.terjual ? Number(form.terjual) : 0,
      }

      if (modeEdit) {
        await fetch('/api/produk', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: modeEdit, ...payload }),
        })
        tampilPesan('Produk berhasil diperbarui', 'sukses')
      } else {
        await fetch('/api/produk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        tampilPesan(`Produk "${form.nama}" berhasil ditambahkan`, 'sukses')
      }

      batal()
      await fetchProduk()
    } catch {
      tampilPesan('Gagal menyimpan produk', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  async function hapus(id: number) {
    try {
      await fetch(`/api/produk?id=${id}`, { method: 'DELETE' })
      tampilPesan('Produk berhasil dihapus', 'sukses')
      setKonfirmasiHapus(null)
      await fetchProduk()
    } catch {
      tampilPesan('Gagal menghapus produk', 'error')
    }
  }

  async function toggleAktif(p: ProdukItem) {
    try {
      await fetch('/api/produk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: p.id, aktif: !p.aktif }),
      })
      await fetchProduk()
    } catch {
      tampilPesan('Gagal mengubah status produk', 'error')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <ShoppingBag className="h-7 w-7 text-aqua-glow" />
            Manajemen Produk
          </h1>
          <p className="text-white/60 mt-1">Kelola produk afiliasi Shopee yang ditampilkan di website</p>
        </div>
        {!modeTambah && !modeEdit && (
          <button
            onClick={() => { setModeTambah(true); setForm(FORM_DEFAULT) }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-aqua text-white font-semibold text-sm shadow-glow hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" /> Tambah Produk
          </button>
        )}
      </div>

      {/* Pesan */}
      {pesan && (
        <div className={`p-4 rounded-xl border text-sm font-medium ${pesan.tipe === 'sukses' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
          {pesan.teks}
        </div>
      )}

      {/* Form Tambah / Edit */}
      {(modeTambah || modeEdit) && (
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-white">{modeEdit ? 'Edit Produk' : 'Tambah Produk Baru'}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* URL Afiliasi */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-white/70 mb-1">URL Afiliasi Shopee *</label>
              <input
                type="url"
                value={form.urlAfiliasi}
                onChange={(e) => setForm({ ...form, urlAfiliasi: e.target.value })}
                placeholder="https://s.shopee.co.id/AKYyISBZop"
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-aqua-glow/50"
              />
            </div>

            {/* Nama */}
            <div>
              <label className="block text-sm font-semibold text-white/70 mb-1">Nama Produk *</label>
              <input
                type="text"
                value={form.nama}
                onChange={(e) => setForm({ ...form, nama: e.target.value })}
                placeholder="Pakan Ikan HiPro-Vite 781"
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-aqua-glow/50"
              />
            </div>

            {/* Harga */}
            <div>
              <label className="block text-sm font-semibold text-white/70 mb-1">Harga (Rp)</label>
              <input
                type="number"
                value={form.harga}
                onChange={(e) => setForm({ ...form, harga: e.target.value })}
                placeholder="150000"
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-aqua-glow/50"
              />
            </div>

            {/* Harga Asli (sebelum diskon) */}
            <div>
              <label className="block text-sm font-semibold text-white/70 mb-1">Harga Asli (sebelum diskon)</label>
              <input
                type="number"
                value={form.hargaAsli}
                onChange={(e) => setForm({ ...form, hargaAsli: e.target.value })}
                placeholder="200000"
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-aqua-glow/50"
              />
            </div>

            {/* Kategori */}
            <div>
              <label className="block text-sm font-semibold text-white/70 mb-1">Kategori</label>
              <select
                value={form.kategori}
                onChange={(e) => setForm({ ...form, kategori: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-aqua-glow/50"
              >
                {KATEGORI_LIST.map((k) => <option key={k} value={k} className="bg-slate-800">{k}</option>)}
              </select>
            </div>

            {/* Platform */}
            <div>
              <label className="block text-sm font-semibold text-white/70 mb-1">Platform</label>
              <select
                value={form.platform}
                onChange={(e) => setForm({ ...form, platform: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-aqua-glow/50"
              >
                {PLATFORM_LIST.map((p) => <option key={p} value={p} className="bg-slate-800">{p}</option>)}
              </select>
            </div>

            {/* Rating */}
            <div>
              <label className="block text-sm font-semibold text-white/70 mb-1">Rating (0-5)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={form.rating}
                onChange={(e) => setForm({ ...form, rating: e.target.value })}
                placeholder="4.8"
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-aqua-glow/50"
              />
            </div>

            {/* URL Gambar */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-white/70 mb-1">URL Gambar Produk</label>
              <input
                type="url"
                value={form.gambarUrl}
                onChange={(e) => setForm({ ...form, gambarUrl: e.target.value })}
                placeholder="https://cf.shopee.co.id/file/..."
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-aqua-glow/50"
              />
            </div>

            {/* Deskripsi */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-white/70 mb-1">Deskripsi Singkat</label>
              <textarea
                value={form.deskripsi}
                onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
                placeholder="Deskripsi produk untuk ditampilkan di website..."
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-aqua-glow/50 resize-none"
              />
            </div>
          </div>

          {/* Tombol Simpan / Batal */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={simpan}
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl gradient-aqua text-white font-semibold text-sm shadow-glow hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Save className="h-4 w-4" /> {submitting ? 'Menyimpan...' : 'Simpan'}
            </button>
            <button
              onClick={batal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-white/60 hover:text-white hover:border-white/30 transition-colors text-sm"
            >
              <X className="h-4 w-4" /> Batal
            </button>
          </div>
        </div>
      )}

      {/* Daftar Produk */}
      {loading ? (
        <div className="text-center py-12 text-white/40">Memuat data produk...</div>
      ) : produkList.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-white/10 bg-white/5">
          <ShoppingBag className="h-12 w-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/50 font-semibold">Belum ada produk</p>
          <p className="text-white/30 text-sm mt-1">Klik &quot;Tambah Produk&quot; untuk menambahkan produk afiliasi pertama Anda</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {produkList.map((p) => (
            <div key={p.id} className={`rounded-2xl border bg-white/5 backdrop-blur-xl overflow-hidden transition-all ${p.aktif ? 'border-white/10' : 'border-red-500/20 opacity-60'}`}>
              {/* Gambar */}
              <div className="h-40 bg-white/5 flex items-center justify-center">
                {p.gambar[0] ? (
                  <img src={p.gambar[0]} alt={p.nama} className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon className="h-12 w-12 text-white/15" />
                )}
              </div>

              {/* Info */}
              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-white text-sm leading-tight line-clamp-2">{p.nama}</h3>
                  <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full font-bold ${p.aktif ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {p.aktif ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-aqua-glow font-bold">{formatRupiah(p.harga)}</span>
                  {p.hargaAsli && p.hargaAsli > p.harga && (
                    <span className="text-white/30 text-xs line-through">{formatRupiah(p.hargaAsli)}</span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-white/40">
                  <span>{p.platform}</span>
                  <span>•</span>
                  <span>{p.kategori}</span>
                  {p.rating && (
                    <>
                      <span>•</span>
                      <span>⭐ {p.rating}</span>
                    </>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                  <button onClick={() => mulaiEdit(p)} className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors" title="Edit">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button onClick={() => toggleAktif(p)} className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors" title={p.aktif ? 'Nonaktifkan' : 'Aktifkan'}>
                    {p.aktif ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <a href={p.urlAfiliasi} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors" title="Buka di Shopee">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  {konfirmasiHapus === p.id ? (
                    <button onClick={() => hapus(p.id)} className="ml-auto px-3 py-1 rounded-lg bg-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/30 transition-colors">
                      Yakin Hapus?
                    </button>
                  ) : (
                    <button onClick={() => setKonfirmasiHapus(p.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-colors ml-auto" title="Hapus">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
