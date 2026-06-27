'use client'

import { useState, useEffect } from 'react'

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
  { label: 'Hijau', value: 'green', kelas: 'bg-green-100 text-green-700 border-green-200' },
  { label: 'Biru', value: 'blue', kelas: 'bg-blue-100 text-blue-700 border-blue-200' },
  { label: 'Kuning', value: 'yellow', kelas: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { label: 'Merah', value: 'red', kelas: 'bg-red-100 text-red-700 border-red-200' },
  { label: 'Ungu', value: 'purple', kelas: 'bg-purple-100 text-purple-700 border-purple-200' },
  { label: 'Abu', value: 'gray', kelas: 'bg-gray-100 text-gray-700 border-gray-200' },
]

const ICON_OPTIONS = ['🥚', '🌿', '💊', '🏊', '🎣', '💰', '🛒', '💡', '🔬', '📊', '🌊', '🐟']

const KATEGORI_DEFAULT: Kategori[] = [
  { id: '1', nama: 'Pembenihan', slug: 'pembenihan', deskripsi: 'Panduan pembenihan dan pembibitan lele', icon: '🥚', warna: 'green', jumlahArtikel: 0, aktif: true },
  { id: '2', nama: 'Pakan', slug: 'pakan', deskripsi: 'Tips pakan dan nutrisi lele', icon: '🌿', warna: 'green', jumlahArtikel: 0, aktif: true },
  { id: '3', nama: 'Penyakit & Pengobatan', slug: 'penyakit', deskripsi: 'Diagnosis dan pengobatan penyakit lele', icon: '💊', warna: 'red', jumlahArtikel: 0, aktif: true },
  { id: '4', nama: 'Manajemen Kolam', slug: 'kolam', deskripsi: 'Pengelolaan kolam budidaya lele', icon: '🏊', warna: 'blue', jumlahArtikel: 0, aktif: true },
  { id: '5', nama: 'Panen & Pascapanen', slug: 'panen', deskripsi: 'Teknik panen dan pengolahan lele', icon: '🎣', warna: 'yellow', jumlahArtikel: 0, aktif: true },
  { id: '6', nama: 'Bisnis & Pemasaran', slug: 'bisnis', deskripsi: 'Strategi bisnis dan pemasaran lele', icon: '💰', warna: 'yellow', jumlahArtikel: 0, aktif: true },
  { id: '7', nama: 'Tips & Trik', slug: 'tips', deskripsi: 'Tips praktis budidaya lele', icon: '💡', warna: 'purple', jumlahArtikel: 0, aktif: true },
  { id: '8', nama: 'Teknologi', slug: 'teknologi', deskripsi: 'Inovasi teknologi budidaya lele', icon: '🔬', warna: 'blue', jumlahArtikel: 0, aktif: true },
]

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim()
}

export default function KategoriPage() {
  const [tab, setTab] = useState<'kategori' | 'tag'>('kategori')
  const [kategoriList, setKategoriList] = useState<Kategori[]>(KATEGORI_DEFAULT)
  const [tagList, setTagList] = useState<Tag[]>([])
  const [modeEdit, setModeEdit] = useState<string | null>(null)
  const [modeTambah, setModeTambah] = useState(false)
  const [form, setForm] = useState({ nama: '', deskripsi: '', icon: '🐟', warna: 'green' })
  const [tagInput, setTagInput] = useState('')
  const [konfirmasiHapus, setKonfirmasiHapus] = useState<string | null>(null)

  useEffect(() => {
    const savedKat = localStorage.getItem('aplesi_kategori')
    if (savedKat) setKategoriList(JSON.parse(savedKat))
    const savedTag = localStorage.getItem('aplesi_tags')
    if (savedTag) setTagList(JSON.parse(savedTag))
  }, [])

  function simpanKategori(list: Kategori[]) {
    setKategoriList(list)
    localStorage.setItem('aplesi_kategori', JSON.stringify(list))
  }

  function simpanTag(list: Tag[]) {
    setTagList(list)
    localStorage.setItem('aplesi_tags', JSON.stringify(list))
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
    setForm({ nama: '', deskripsi: '', icon: '🐟', warna: 'green' })
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
        <h1 className="text-2xl font-bold text-gray-900">Kategori & Tag</h1>
        <p className="text-gray-500 text-sm mt-1">Kelola kategori dan tag artikel Aplesi</p>
      </div>

      {/* Tab */}
      <div className="flex border-b border-gray-200">
        {(['kategori', 'tag'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors capitalize ${
              tab === t
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'kategori' ? '🗂️ Kategori' : '🏷️ Tag'}
          </button>
        ))}
      </div>

      {/* === TAB KATEGORI === */}
      {tab === 'kategori' && (
        <div className="space-y-4">
          {/* Tombol Tambah */}
          <div className="flex justify-end">
            <button onClick={() => setModeTambah(!modeTambah)} className="btn-primary text-sm">
              + Tambah Kategori
            </button>
          </div>

          {/* Form Tambah */}
          {modeTambah && (
            <div className="admin-card border-2 border-green-200 bg-green-50 space-y-4">
              <h3 className="font-semibold text-gray-800">Tambah Kategori Baru</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="admin-label">Nama Kategori *</label>
                  <input value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })}
                    placeholder="cth: Nutrisi Lele" className="admin-input" />
                  {form.nama && (
                    <p className="text-xs text-gray-400 mt-1">slug: /{slugify(form.nama)}</p>
                  )}
                </div>
                <div>
                  <label className="admin-label">Deskripsi</label>
                  <input value={form.deskripsi} onChange={e => setForm({ ...form, deskripsi: e.target.value })}
                    placeholder="Deskripsi singkat kategori" className="admin-input" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="admin-label">Icon</label>
                  <div className="flex flex-wrap gap-2 p-2 border border-gray-300 rounded-lg bg-white">
                    {ICON_OPTIONS.map(ic => (
                      <button key={ic} onClick={() => setForm({ ...form, icon: ic })}
                        className={`text-xl p-1 rounded ${form.icon === ic ? 'bg-green-100 ring-2 ring-green-500' : 'hover:bg-gray-100'}`}>
                        {ic}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="admin-label">Warna</label>
                  <div className="flex flex-wrap gap-2">
                    {WARNA_OPTIONS.map(w => (
                      <button key={w.value} onClick={() => setForm({ ...form, warna: w.value })}
                        className={`px-3 py-1.5 rounded-lg border text-sm font-medium ${w.kelas} ${form.warna === w.value ? 'ring-2 ring-offset-1 ring-gray-400' : ''}`}>
                        {w.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={tambahKategori} className="btn-primary text-sm">✅ Simpan</button>
                <button onClick={() => setModeTambah(false)} className="btn-secondary text-sm">Batal</button>
              </div>
            </div>
          )}

          {/* Grid Kategori */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {kategoriList.map(kat => (
              <div key={kat.id} className={`admin-card ${!kat.aktif ? 'opacity-60' : ''}`}>
                {modeEdit === kat.id ? (
                  <div className="space-y-3">
                    <input value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })}
                      className="admin-input font-medium" />
                    <input value={form.deskripsi} onChange={e => setForm({ ...form, deskripsi: e.target.value })}
                      className="admin-input text-sm" placeholder="Deskripsi" />
                    <div className="flex flex-wrap gap-1.5">
                      {ICON_OPTIONS.map(ic => (
                        <button key={ic} onClick={() => setForm({ ...form, icon: ic })}
                          className={`text-lg p-1 rounded ${form.icon === ic ? 'bg-green-100 ring-2 ring-green-500' : 'hover:bg-gray-100'}`}>
                          {ic}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => updateKategori(kat.id)} className="btn-primary text-xs">Simpan</button>
                      <button onClick={() => setModeEdit(null)} className="btn-secondary text-xs">Batal</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`text-2xl p-2 rounded-lg border ${warnaKelas(kat.warna)}`}>
                          {kat.icon}
                        </span>
                        <div>
                          <h3 className="font-semibold text-gray-900">{kat.nama}</h3>
                          <p className="text-xs text-gray-400">/{kat.slug} · {kat.jumlahArtikel} artikel</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => toggleAktif(kat.id)}
                          className={`text-xs px-2 py-1 rounded-full font-medium ${kat.aktif ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {kat.aktif ? 'Aktif' : 'Nonaktif'}
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">{kat.deskripsi}</p>
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => { setModeEdit(kat.id); setForm({ nama: kat.nama, deskripsi: kat.deskripsi, icon: kat.icon, warna: kat.warna }) }}
                        className="text-xs btn-secondary py-1">✏️ Edit</button>
                      {konfirmasiHapus === kat.id ? (
                        <>
                          <button onClick={() => hapusKategori(kat.id)} className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded-lg">Hapus?</button>
                          <button onClick={() => setKonfirmasiHapus(null)} className="text-xs btn-secondary py-1">Batal</button>
                        </>
                      ) : (
                        <button onClick={() => setKonfirmasiHapus(kat.id)} className="text-xs text-gray-400 hover:text-red-500 px-2 py-1 rounded-lg">🗑</button>
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
          <div className="admin-card">
            <h3 className="font-semibold text-gray-800 mb-3">Tambah Tag Baru</h3>
            <div className="flex gap-2">
              <input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && tambahTag()}
                placeholder="ketik tag, pisah dengan koma: lele dumbo, pakan alami, kolam terpal"
                className="admin-input flex-1"
              />
              <button onClick={tambahTag} className="btn-primary whitespace-nowrap">+ Tambah</button>
            </div>
            <p className="text-xs text-gray-400 mt-2">Pisahkan beberapa tag dengan koma. Tekan Enter untuk menambah.</p>
          </div>

          {tagList.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <div className="text-4xl mb-2">🏷️</div>
              <p className="text-sm">Belum ada tag</p>
            </div>
          ) : (
            <div className="admin-card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">Semua Tag ({tagList.length})</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {tagList.map(tag => (
                  <div key={tag.id}
                    className="flex items-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm">
                    <span>{tag.nama}</span>
                    <span className="text-gray-400 text-xs">({tag.jumlahArtikel})</span>
                    <button onClick={() => hapusTag(tag.id)}
                      className="ml-1 text-gray-400 hover:text-red-500 leading-none">×</button>
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
