'use client'

import { useState, useEffect } from 'react'

interface JadwalItem {
  id: string
  topik: string
  kategori: string
  waktu: string
  status: 'menunggu' | 'proses' | 'selesai' | 'gagal'
  panjang: string
  generateGambar: boolean
}

const KATEGORI_LIST = [
  'Pembenihan', 'Pakan', 'Penyakit & Pengobatan',
  'Manajemen Kolam', 'Panen & Pascapanen',
  'Bisnis & Pemasaran', 'Tips & Trik', 'Teknologi'
]

const TOPIK_OTOMATIS = [
  'cara budidaya lele dumbo untuk pemula',
  'pakan alternatif hemat untuk lele',
  'mengatasi penyakit white spot pada lele',
  'kolam terpal vs kolam tanah perbandingan',
  'sistem bioflok untuk budidaya lele intensif',
  'cara panen lele yang benar dan menguntungkan',
  'manajemen kualitas air kolam lele',
  'suplemen probiotik untuk pertumbuhan lele',
  'bisnis olahan lele peluang usaha menjanjikan',
  'teknik pembenihan lele modern',
]

const HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']

export default function JadwalPage() {
  const [jadwalList, setJadwalList] = useState<JadwalItem[]>([])
  const [modeTambah, setModeTambah] = useState(false)
  const [formTopik, setFormTopik] = useState('')
  const [formKategori, setFormKategori] = useState(KATEGORI_LIST[0])
  const [formWaktu, setFormWaktu] = useState('07:00')
  const [formPanjang, setFormPanjang] = useState('sedang')
  const [formGambar, setFormGambar] = useState(true)
  const [autoPostAktif, setAutoPostAktif] = useState(true)
  const [jamAutoPost, setJamAutoPost] = useState('07:00')
  const [hariAktif, setHariAktif] = useState<string[]>(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'])
  const [loading, setLoading] = useState(false)
  const [konfirmasiHapus, setKonfirmasiHapus] = useState<string | null>(null)

  // Load jadwal dari localStorage (simulasi — production pakai Cloudflare KV)
  useEffect(() => {
    const saved = localStorage.getItem('aplesi_jadwal')
    if (saved) setJadwalList(JSON.parse(saved))
    const settings = localStorage.getItem('aplesi_autopost')
    if (settings) {
      const s = JSON.parse(settings)
      setAutoPostAktif(s.aktif ?? true)
      setJamAutoPost(s.jam ?? '07:00')
      setHariAktif(s.hari ?? ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'])
    }
  }, [])

  function simpanJadwal(list: JadwalItem[]) {
    setJadwalList(list)
    localStorage.setItem('aplesi_jadwal', JSON.stringify(list))
  }

  function tambahJadwal() {
    if (!formTopik.trim()) return
    const baru: JadwalItem = {
      id: Date.now().toString(),
      topik: formTopik,
      kategori: formKategori,
      waktu: formWaktu,
      status: 'menunggu',
      panjang: formPanjang,
      generateGambar: formGambar,
    }
    simpanJadwal([...jadwalList, baru])
    setFormTopik('')
    setModeTambah(false)
  }

  function hapusJadwal(id: string) {
    simpanJadwal(jadwalList.filter((j) => j.id !== id))
    setKonfirmasiHapus(null)
  }

  function simpanSettings() {
    localStorage.setItem('aplesi_autopost', JSON.stringify({
      aktif: autoPostAktif,
      jam: jamAutoPost,
      hari: hariAktif,
    }))
    alert('✅ Pengaturan auto-post disimpan!')
  }

  function toggleHari(hari: string) {
    setHariAktif(prev =>
      prev.includes(hari) ? prev.filter(h => h !== hari) : [...prev, hari]
    )
  }

  async function jalankanSekarang(item: JadwalItem) {
    setLoading(true)
    const updated = jadwalList.map(j =>
      j.id === item.id ? { ...j, status: 'proses' as const } : j
    )
    simpanJadwal(updated)

    try {
      const res = await fetch('/api/generate/artikel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topik: item.topik,
          kategori: item.kategori,
          keywords: [],
          panjang: item.panjang,
          tone: 'informatif',
          generateGambar: item.generateGambar,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        await fetch('/api/generate/artikel/publish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ artikel: data.data, kategori: item.kategori }),
        })
        simpanJadwal(jadwalList.map(j =>
          j.id === item.id ? { ...j, status: 'selesai' as const } : j
        ))
      } else {
        throw new Error('Generate gagal')
      }
    } catch {
      simpanJadwal(jadwalList.map(j =>
        j.id === item.id ? { ...j, status: 'gagal' as const } : j
      ))
    } finally {
      setLoading(false)
    }
  }

  const statusBadge: Record<string, string> = {
    menunggu: 'bg-yellow-100 text-yellow-700',
    proses: 'bg-blue-100 text-blue-700',
    selesai: 'bg-green-100 text-green-700',
    gagal: 'bg-red-100 text-red-700',
  }

  const statusIcon: Record<string, string> = {
    menunggu: '⏳', proses: '⚙️', selesai: '✅', gagal: '❌'
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Jadwal Auto-Post</h1>
        <p className="text-gray-500 text-sm mt-1">
          Atur jadwal posting otomatis harian via GitHub Actions
        </p>
      </div>

      {/* Pengaturan Global */}
      <div className="admin-card space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">⚙️ Pengaturan Auto-Post</h2>
          <label className="flex items-center gap-2 cursor-pointer">
            <div className={`relative w-11 h-6 rounded-full transition-colors ${autoPostAktif ? 'bg-green-500' : 'bg-gray-300'}`}
              onClick={() => setAutoPostAktif(!autoPostAktif)}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${autoPostAktif ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-sm font-medium text-gray-700">
              {autoPostAktif ? 'Aktif' : 'Nonaktif'}
            </span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="admin-label">Jam Posting (WIB)</label>
            <input
              type="time"
              value={jamAutoPost}
              onChange={(e) => setJamAutoPost(e.target.value)}
              className="admin-input"
              disabled={!autoPostAktif}
            />
            <p className="text-xs text-gray-400 mt-1">
              GitHub Actions berjalan di UTC — {jamAutoPost} WIB = jam {
                String(parseInt(jamAutoPost) - 7).padStart(2, '0')
              }:00 UTC
            </p>
          </div>

          <div>
            <label className="admin-label">Hari Posting</label>
            <div className="flex flex-wrap gap-2">
              {HARI.map(hari => (
                <button
                  key={hari}
                  onClick={() => toggleHari(hari)}
                  disabled={!autoPostAktif}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border
                    ${hariAktif.includes(hari)
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-green-400'
                    } disabled:opacity-50`}
                >
                  {hari.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
          <strong className="text-gray-800">Cron expression saat ini:</strong>{' '}
          <code className="bg-white border border-gray-200 px-2 py-0.5 rounded font-mono text-green-700">
            0 {String(parseInt(jamAutoPost) - 7).padStart(2, '0')} * * {
              hariAktif.map(h => HARI.indexOf(h) + 1).sort().join(',')
            }
          </code>
          <p className="mt-1 text-xs text-gray-400">
            Update nilai ini di <code>.github/workflows/auto-post.yml</code> → schedule → cron
          </p>
        </div>

        <button onClick={simpanSettings} className="btn-primary">
          💾 Simpan Pengaturan
        </button>
      </div>

      {/* Daftar Topik Terjadwal */}
      <div className="admin-card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">📋 Antrian Topik</h2>
          <button
            onClick={() => setModeTambah(!modeTambah)}
            className="btn-primary text-sm"
          >
            + Tambah Topik
          </button>
        </div>

        {/* Form Tambah */}
        {modeTambah && (
          <div className="border border-green-200 bg-green-50 rounded-lg p-4 space-y-3">
            <h3 className="font-medium text-gray-800">Tambah Topik Baru</h3>
            <div>
              <label className="admin-label">Topik</label>
              <input
                type="text"
                value={formTopik}
                onChange={(e) => setFormTopik(e.target.value)}
                placeholder="cth: cara membuat kolam terpal untuk lele"
                className="admin-input"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {TOPIK_OTOMATIS.slice(0, 4).map(t => (
                  <button key={t} onClick={() => setFormTopik(t)}
                    className="text-xs bg-white border border-gray-200 hover:border-green-400 text-gray-600 px-2 py-1 rounded-full">
                    {t.slice(0, 30)}...
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="admin-label">Kategori</label>
                <select value={formKategori} onChange={(e) => setFormKategori(e.target.value)} className="admin-input">
                  {KATEGORI_LIST.map(k => <option key={k}>{k}</option>)}
                </select>
              </div>
              <div>
                <label className="admin-label">Panjang</label>
                <select value={formPanjang} onChange={(e) => setFormPanjang(e.target.value)} className="admin-input">
                  <option value="pendek">Pendek</option>
                  <option value="sedang">Sedang</option>
                  <option value="panjang">Panjang</option>
                </select>
              </div>
              <div>
                <label className="admin-label">Jam Khusus</label>
                <input type="time" value={formWaktu} onChange={(e) => setFormWaktu(e.target.value)} className="admin-input" />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={formGambar} onChange={(e) => setFormGambar(e.target.checked)} className="w-4 h-4 text-green-600" />
              Generate gambar otomatis
            </label>
            <div className="flex gap-2">
              <button onClick={tambahJadwal} className="btn-primary text-sm">✅ Tambahkan</button>
              <button onClick={() => setModeTambah(false)} className="btn-secondary text-sm">Batal</button>
            </div>
          </div>
        )}

        {/* Tabel Jadwal */}
        {jadwalList.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <div className="text-4xl mb-2">📅</div>
            <p className="text-sm">Belum ada topik dalam antrian</p>
            <p className="text-xs mt-1">Klik "+ Tambah Topik" untuk menambahkan</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {jadwalList.map((item) => (
              <div key={item.id} className="flex items-start justify-between py-3 gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`badge ${statusBadge[item.status]}`}>
                      {statusIcon[item.status]} {item.status}
                    </span>
                    <span className="badge bg-gray-100 text-gray-600">{item.kategori}</span>
                    <span className="badge bg-gray-100 text-gray-600">📷 {item.generateGambar ? 'Ya' : 'Tidak'}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-800 mt-1 line-clamp-1">{item.topik}</p>
                  <p className="text-xs text-gray-400 mt-0.5">⏰ {item.waktu} WIB · {item.panjang}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {item.status !== 'selesai' && (
                    <button
                      onClick={() => jalankanSekarang(item)}
                      disabled={loading || item.status === 'proses'}
                      className="text-xs btn-primary py-1 disabled:opacity-50"
                    >
                      {item.status === 'proses' ? '⚙️...' : '▶ Jalankan'}
                    </button>
                  )}
                  {konfirmasiHapus === item.id ? (
                    <>
                      <button onClick={() => hapusJadwal(item.id)} className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded-lg">Hapus?</button>
                      <button onClick={() => setKonfirmasiHapus(null)} className="text-xs btn-secondary py-1">Batal</button>
                    </>
                  ) : (
                    <button onClick={() => setKonfirmasiHapus(item.id)} className="text-xs text-gray-400 hover:text-red-500 px-2 py-1 rounded-lg">🗑</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info GitHub Actions */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-sm text-blue-800">
        <h3 className="font-semibold mb-2">ℹ️ Cara Kerja Auto-Post</h3>
        <ol className="space-y-1 text-blue-700 list-decimal list-inside">
          <li>GitHub Actions berjalan sesuai jadwal cron</li>
          <li>Script memanggil Groq API → generate artikel otomatis</li>
          <li>Cloudflare AI generate gambar thumbnail</li>
          <li>Artikel di-commit ke repo GitHub sebagai file <code className="bg-blue-100 px-1 rounded">.md</code></li>
          <li>Cloudflare Pages auto-deploy → artikel langsung live</li>
        </ol>
        <p className="mt-3 text-xs text-blue-600">
          Untuk mengubah jadwal permanen: edit <code>.github/workflows/auto-post.yml</code> → <code>schedule.cron</code>
        </p>
      </div>
    </div>
  )
}
