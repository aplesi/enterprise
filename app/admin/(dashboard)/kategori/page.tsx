'use client'
export const runtime = 'edge';

import { useState, useEffect } from 'react'
import { Folder, Tag as TagIcon, Check, Edit, Trash2, Plus, X } from 'lucide-react'

interface Kategori {
  id: string
  nama: string
  slug: string
  deskripsi: string
  icon: string
  warna: string
  jumlahArtikel: number
  aktif: boolean
}

interface Tag {
  id: string
  nama: string
  slug: string
  jumlahArtikel: number
}

const WARNA_OPTIONS = [
  { label: 'Aqua', value: 'aqua', kelas: 'bg-aqua-glow/20 text-aqua-glow border-aqua-glow/30' },
  { label: 'Accent', value: 'accent', kelas: 'bg-accent/20 text-accent border-accent/30' },
  { label: 'Amber', value: 'amber', kelas: 'bg-amber-400/20 text-amber-300 border-amber-400/30' },
  { label: 'Red', value: 'red', kelas: 'bg-red-400/20 text-red-300 border-red-400/30' },
  { label: 'Purple', value: 'purple', kelas: 'bg-purple-400/20 text-purple-300 border-purple-400/30' },
  { label: 'Gray', value: 'gray', kelas: 'bg-white/10 text-white/70 border-white/20' },
]

const ICON_OPTIONS = ['🥚', '🌿', '💊', '🏊', '🎣', '💰', '🛒', '💡', '🔬', '📊', '🌊', '🐟']

const KATEGORI_DEFAULT: Kategori[] = [
  { id: '1', nama: 'Pembenihan', slug: 'pembenihan', deskripsi: 'Panduan pembenihan dan pembibitan lele', icon: '🥚', warna: 'aqua', jumlahArtikel: 0, aktif: true },
  { id: '2', nama: 'Pakan', slug: 'pakan', deskripsi: 'Tips pakan dan nutrisi lele', icon: '🌿', warna: 'aqua', jumlahArtikel: 0, aktif: true },
  { id: '3', nama: 'Penyakit & Pengobatan', slug: 'penyakit', deskripsi: 'Diagnosis dan pengobatan penyakit lele', icon: '💊', warna: 'red', jumlahArtikel: 0, aktif: true },
  { id: '4', nama: 'Manajemen Kolam', slug: 'kolam', deskripsi: 'Pengelolaan kolam budidaya lele', icon: '🏊', warna: 'accent', jumlahArtikel: 0, aktif: true },
  { id: '5', nama: 'Panen & Pascapanen', slug: 'panen', deskripsi: 'Teknik panen dan pengolahan lele', icon: '🎣', warna: 'amber', jumlahArtikel: 0, aktif: true },
  { id: '6', nama: 'Bisnis & Pemasaran', slug: 'bisnis', deskripsi: 'Strategi bisnis dan pemasaran lele', icon: '💰', warna: 'amber', jumlahArtikel: 0, aktif: true },
  { id: '7', nama: 'Tips & Trik', slug: 'tips', deskripsi: 'Tips praktis budidaya lele', icon: '💡', warna: 'purple', jumlahArtikel: 0, aktif: true },
  { id: '8', nama: 'Teknologi', slug: 'teknologi', deskripsi: 'Inovasi teknologi budidaya lele', icon: '🔬', warna: 'accent', jumlahArtikel: 0, aktif: true },
]

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9\\s-]/g, '').replace(/\\s+/g, '-').replace(/-+/g, '-').trim()
}

export default function KategoriPage() {
  const [tab, setTab] = useState<'kategori' | 'tag'>('kategori')
  const [kategoriList, setKategoriList] = useState<Kategori[]>(KATEGORI_DEFAULT)
  const [tagList, setTagList] = useState<Tag[]>([])
  const [modeEdit, setModeEdit] = useState<string | null>(null)
  const [modeTambah, setModeTambah] = useState(false)
  const [form, setForm] = useState({ nama: '', deskripsi: '', icon: '🐟', warna: 'aqua' })
  const [tagInput, setTagInput] = useState('')
  const [konfirmasiHapus, setKonfirmasiHapus] = useState<string | null>(null)

  useEffect(() => {
    // Load Kategori
    fetch('/api/kategori')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data && data.data.length > 0) {
          setKategoriList(data.data)
        }
      })
      .catch(() => {})

    // Load Tags
    fetch('/api/kategori/tags')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setTagList(data.data)
        }
      })
      .catch(() => {})
  }, [])

  async function simpanKategori(list: Kategori[]) {
    setKategoriList(list)
    try {
      await fetch('/api/kategori', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(list),
      })
    } catch (err) {
      console.error('Gagal simpan kategori', err)
    }
  }

  async function simpanTag(list: Tag[]) {
    setTagList(list)
    try {
      await fetch('/api/kategori/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(list),
      })
    } catch (err) {
      console.error('Gagal simpan tag', err)
    }
  }

  function tambahKategori() {
    if (!form.nama.trim()) return
    const baru: Kategori = {
      id: Date.now().toString(),
      nama: form.nama,
      slug: slugify(form.nama),
      deskripsi: form.deskripsi,
      icon: form.icon,
      warna: form.warna,
      jumlahArtikel: 0,
      aktif: true,
    }
    simpanKategori([...kategoriList, baru])
    setForm({ nama: '', deskripsi: '', icon: '🐟', warna: 'aqua' })
    setModeTambah(false)
  }

  function updateKategori(id: string) {
    simpanKategori(kategoriList.map(k =>
      k.id === id ? { ...k, ...form, slug: slugify(form.nama) } : k
    ))
    setModeEdit(null)
  }

  function toggleAktif(id: string) {
    simpanKategori(kategoriList.map(k => k.id === id ? { ...k, aktif: !k.aktif } : k))
  }

  function hapusKategori(id: string) {
    simpanKategori(kategoriList.filter(k => k.id !== id))
    setKonfirmasiHapus(null)
  }

  function tambahTag() {
    const tags = tagInput.split(',').map(t => t.trim()).filter(Boolean)
    const baru: Tag[] = tags
      .filter(t => !tagList.find(tg => tg.nama.toLowerCase() === t.toLowerCase()))
      .map(t => ({ id: Date.now().toString() + t, nama: t, slug: slugify(t), jumlahArtikel: 0 }))
    simpanTag([...tagList, ...baru])
    setTagInput('')
  }

  function hapusTag(id: string) {
    simpanTag(tagList.filter(t => t.id !== id))
  }

  const warnaKelas = (w: string) => WARNA_OPTIONS.find(o => o.value === w)?.kelas || WARNA_OPTIONS[0].kelas

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white">Kategori & Tag</h1>
        <p className="text-white/60 text-sm mt-1">Kelola kategori dan tag artikel Aplesi</p>
      </div>

      {/* Tab */}
      <div className="flex border-b border-white/10">
        {(['kategori', 'tag'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all capitalize ${
              tab === t
                ? 'border-aqua-glow text-aqua-glow'
                : 'border-transparent text-white/60 hover:text-white/80'
            }`}
          >
            {t === 'kategori' ? <Folder className="h-4 w-4" /> : <TagIcon className="h-4 w-4" />}
            {t}
          </button>
        ))}
      </div>

      {/* === TAB KATEGORI === */}
      {tab === 'kategori' && (
        <div className="space-y-4">
          {/* Tombol Tambah */}
          <div className="flex justify-end">
            <button
              onClick={() => setModeTambah(!modeTambah)}
              className="flex items-center gap-2 rounded-lg gradient-aqua px-4 py-2 text-sm font-bold text-white shadow-glow hover:opacity-90 transition-opacity"
            >
              <Plus className="h-4 w-4" />
              Tambah Kategori
            </button>
          </div>

          {/* Form Tambah */}
          {modeTambah && (
            <div className="rounded-xl border-2 border-aqua-glow/30 bg-aqua-glow/5 p-5 backdrop-blur-xl space-y-4">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Tambah Kategori Baru
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                    Nama Kategori *
                  </label>
                  <input
                    value={form.nama}
                    onChange={e => setForm({ ...form, nama: e.target.value })}
                    placeholder="cth: Nutrisi Lele"
                    className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-aqua-glow/60 focus:bg-white/10 focus:outline-none transition-all"
                  />
                  {form.nama && (
                    <p className="text-xs text-white/40 mt-1">slug: /{slugify(form.nama)}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                    Deskripsi
                  </label>
                  <input
                    value={form.deskripsi}
                    onChange={e => setForm({ ...form, deskripsi: e.target.value })}
                    placeholder="Deskripsi singkat kategori"
                    className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-aqua-glow/60 focus:bg-white/10 focus:outline-none transition-all"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">Icon</label>
                  <div className="flex flex-wrap gap-2 p-3 border border-white/15 rounded-lg bg-white/5">
                    {ICON_OPTIONS.map(ic => (
                      <button
                        key={ic}
                        onClick={() => setForm({ ...form, icon: ic })}
                        className={`text-xl p-2 rounded-lg transition-all ${
                          form.icon === ic
                            ? 'bg-aqua-glow/20 ring-2 ring-aqua-glow'
                            : 'hover:bg-white/10'
                        }`}
                      >
                        {ic}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">Warna</label>
                  <div className="flex flex-wrap gap-2">
                    {WARNA_OPTIONS.map(w => (
                      <button
                        key={w.value}
                        onClick={() => setForm({ ...form, warna: w.value })}
                        className={`px-3 py-1.5 rounded-lg border text-sm font-bold transition-all ${w.kelas} ${
                          form.warna === w.value ? 'ring-2 ring-offset-1 ring-offset-navy-deep ring-aqua-glow' : ''
                        }`}
                      >
                        {w.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={tambahKategori}
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

          {/* Grid Kategori */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {kategoriList.map(kat => (
              <div
                key={kat.id}
                className={`rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl ${
                  !kat.aktif ? 'opacity-50' : ''
                }`}
              >
                {modeEdit === kat.id ? (
                  <div className="space-y-3">
                    <input
                      value={form.nama}
                      onChange={e => setForm({ ...form, nama: e.target.value })}
                      className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white font-semibold focus:border-aqua-glow/60 focus:bg-white/10 focus:outline-none transition-all"
                    />
                    <input
                      value={form.deskripsi}
                      onChange={e => setForm({ ...form, deskripsi: e.target.value })}
                      className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-aqua-glow/60 focus:bg-white/10 focus:outline-none transition-all"
                      placeholder="Deskripsi"
                    />
                    <div className="flex flex-wrap gap-2">
                      {ICON_OPTIONS.map(ic => (
                        <button
                          key={ic}
                          onClick={() => setForm({ ...form, icon: ic })}
                          className={`text-lg p-2 rounded-lg transition-all ${
                            form.icon === ic
                              ? 'bg-aqua-glow/20 ring-2 ring-aqua-glow'
                              : 'hover:bg-white/10'
                          }`}
                        >
                          {ic}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateKategori(kat.id)}
                        className="flex items-center gap-1.5 rounded-lg gradient-aqua px-3 py-1.5 text-xs font-bold text-white shadow-glow hover:opacity-90 transition-opacity"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Simpan
                      </button>
                      <button
                        onClick={() => setModeEdit(null)}
                        className="rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/80 hover:bg-white/10 transition-all"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`text-2xl p-2.5 rounded-lg border ${warnaKelas(kat.warna)}`}>
                          {kat.icon}
                        </span>
                        <div>
                          <h3 className="font-bold text-white">{kat.nama}</h3>
                          <p className="text-xs text-white/40">/{kat.slug} · {kat.jumlahArtikel} artikel</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleAktif(kat.id)}
                          className={`text-xs px-2.5 py-1 rounded-full font-bold transition-all ${
                            kat.aktif
                              ? 'bg-aqua-glow/20 text-aqua-glow'
                              : 'bg-white/10 text-white/50'
                          }`}
                        >
                          {kat.aktif ? 'Aktif' : 'Nonaktif'}
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-white/60 mt-3">{kat.deskripsi}</p>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => {
                          setModeEdit(kat.id)
                          setForm({ nama: kat.nama, deskripsi: kat.deskripsi, icon: kat.icon, warna: kat.warna })
                        }}
                        className="flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/80 hover:bg-white/10 transition-all"
                      >
                        <Edit className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      {konfirmasiHapus === kat.id ? (
                        <>
                          <button
                            onClick={() => hapusKategori(kat.id)}
                            className="text-xs bg-red-500/20 hover:bg-red-500/30 text-red-300 px-3 py-1.5 rounded-lg font-bold transition-all"
                          >
                            Hapus?
                          </button>
                          <button
                            onClick={() => setKonfirmasiHapus(null)}
                            className="text-xs border border-white/20 bg-white/5 hover:bg-white/10 text-white/80 px-3 py-1.5 rounded-lg font-bold transition-all"
                          >
                            Batal
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setKonfirmasiHapus(kat.id)}
                          className="text-white/40 hover:text-red-300 px-2 py-1.5 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* === TAB TAG === */}
      {tab === 'tag' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <h3 className="font-bold text-white mb-3 flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Tambah Tag Baru
            </h3>
            <div className="flex gap-2">
              <input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && tambahTag()}
                placeholder="ketik tag, pisah dengan koma: lele dumbo, pakan alami, kolam terpal"
                className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-aqua-glow/60 focus:bg-white/10 focus:outline-none transition-all flex-1"
              />
              <button
                onClick={tambahTag}
                className="flex items-center gap-2 rounded-lg gradient-aqua px-4 py-2.5 font-bold text-white shadow-glow hover:opacity-90 transition-opacity whitespace-nowrap"
              >
                <Plus className="h-4 w-4" />
                Tambah
              </button>
            </div>
            <p className="text-xs text-white/40 mt-2">Pisahkan beberapa tag dengan koma. Tekan Enter untuk menambah.</p>
          </div>

          {tagList.length === 0 ? (
            <div className="text-center py-10 text-white/40">
              <TagIcon className="h-12 w-12 mx-auto mb-3 text-white/30" />
              <p className="text-sm font-semibold">Belum ada tag</p>
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <TagIcon className="h-4 w-4" />
                  Semua Tag ({tagList.length})
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {tagList.map(tag => (
                  <div
                    key={tag.id}
                    className="flex items-center gap-2 bg-white/10 text-white/80 px-3 py-1.5 rounded-full text-sm font-semibold"
                  >
                    <span>{tag.nama}</span>
                    <span className="text-white/40 text-xs">({tag.jumlahArtikel})</span>
                    <button
                      onClick={() => hapusTag(tag.id)}
                      className="ml-1 text-white/40 hover:text-red-300 leading-none transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
