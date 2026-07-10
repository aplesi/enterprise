'use client'

import { useState, useEffect } from 'react'
import { Clock, Loader2, CheckCircle2, XCircle, Settings, Save, ClipboardList, Calendar, Camera, Trash2, Info, Check, Plus, Play, Lightbulb } from 'lucide-react'
import { KATEGORI_LIST as KATEGORI_TAKSONOMI } from '@/config/kategori'

interface JadwalItem {
  id: string
  topik: string
  kategori: string
  waktu: string
  status: 'menunggu' | 'proses' | 'selesai' | 'gagal'
  panjang: string
  generateGambar: boolean
}

const KATEGORI_LIST = KATEGORI_TAKSONOMI.map((k) => k.nama)

const TOPIK_OTOMATIS = [
  'cara budidaya ikan nila untuk pemula',
  'pakan alternatif hemat untuk ikan',
  'mengatasi penyakit white spot pada ikan',
  'kolam terpal vs kolam tanah perbandingan',
  'sistem bioflok untuk budidaya ikan intensif',
  'cara panen ikan yang benar dan menguntungkan',
  'manajemen kualitas air kolam ikan',
  'suplemen probiotik untuk pertumbuhan ikan',
  'bisnis olahan ikan peluang usaha menjanjikan',
  'teknik pembenihan ikan modern',
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

  useEffect(() => {
    // Load Jadwal
    fetch('/api/jadwal')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setJadwalList(data.data)
        }
      })
      .catch(() => {})

    // Load Settings
    fetch('/api/jadwal/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          const s = data.data
          setAutoPostAktif(s.aktif ?? true)
          setJamAutoPost(s.jam ?? '07:00')
          setHariAktif(s.hari ?? ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'])
        }
      })
      .catch(() => {})
  }, [])

  async function simpanJadwal(list: JadwalItem[]) {
    setJadwalList(list)
    try {
      await fetch('/api/jadwal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(list),
      })
    } catch (err) {
      console.error('Gagal simpan jadwal', err)
    }
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

  async function simpanSettings() {
    try {
      const res = await fetch('/api/jadwal/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aktif: autoPostAktif,
          jam: jamAutoPost,
          hari: hariAktif,
        }),
      })
      if (res.ok) {
        alert('Pengaturan auto-post disimpan!')
      } else {
        alert('Gagal menyimpan pengaturan')
      }
    } catch (err) {
      alert('Error saat menyimpan pengaturan')
    }
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

  const statusConfig: Record<string, { badge: string; icon: typeof Clock }> = {
    menunggu: { badge: 'bg-amber-400/20 text-amber-300', icon: Clock },
    proses: { badge: 'bg-accent/20 text-accent', icon: Loader2 },
    selesai: { badge: 'bg-aqua-glow/20 text-aqua-glow', icon: CheckCircle2 },
    gagal: { badge: 'bg-red-400/20 text-red-300', icon: XCircle },
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white">Jadwal Auto-Post</h1>
        <p className="text-white/60 text-sm mt-1">
          Atur jadwal posting otomatis harian via GitHub Actions
        </p>
      </div>

      {/* Pengaturan Global */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-aqua-glow" />
            <h2 className="text-lg font-bold text-white">Pengaturan Auto-Post</h2>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              className={`relative w-11 h-6 rounded-full transition-colors ${autoPostAktif ? 'bg-aqua-glow' : 'bg-white/20'}`}
              onClick={() => setAutoPostAktif(!autoPostAktif)}
            >
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-lg transition-transform ${autoPostAktif ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-sm font-bold text-white/80">
              {autoPostAktif ? 'Aktif' : 'Nonaktif'}
            </span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
              Jam Posting (WIB)
            </label>
            <input
              type="time"
              value={jamAutoPost}
              onChange={(e) => setJamAutoPost(e.target.value)}
              className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-aqua-glow/60 focus:bg-white/10 focus:outline-none transition-all disabled:opacity-50"
              disabled={!autoPostAktif}
            />
            <p className="text-xs text-white/40 mt-1.5">
              GitHub Actions berjalan di UTC — {jamAutoPost} WIB = jam {String(parseInt(jamAutoPost) - 7).padStart(2, '0')}:00 UTC
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
              Hari Posting
            </label>
            <div className="flex flex-wrap gap-2">
              {HARI.map(hari => (
                <button
                  key={hari}
                  onClick={() => toggleHari(hari)}
                  disabled={!autoPostAktif}
                  className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all border
                    ${hariAktif.includes(hari)
                      ? 'bg-aqua-glow border-aqua-glow text-white'
                      : 'bg-white/5 text-white/60 border-white/20 hover:border-aqua-glow/40'
                    } disabled:opacity-30`}
                >
                  {hari.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-accent/30 bg-accent/10 p-4 text-sm text-white/80">
          <strong className="text-white font-bold">Cron expression saat ini:</strong>{' '}
          <code className="bg-white/10 border border-white/20 px-2 py-1 rounded font-mono text-aqua-glow">
            0 {String(parseInt(jamAutoPost) - 7).padStart(2, '0')} * * {hariAktif.map(h => HARI.indexOf(h) + 1).sort().join(',')}
          </code>
          <p className="mt-2 text-xs text-white/50">
            Update nilai ini di <code className="bg-white/10 px-1 rounded">.github/workflows/auto-post.yml</code> → schedule → cron
          </p>
        </div>

        <button
          onClick={simpanSettings}
          className="flex items-center justify-center gap-2 rounded-lg gradient-aqua px-6 py-2.5 font-bold text-white shadow-glow hover:opacity-90 transition-opacity"
        >
          <Save className="h-4 w-4" />
          Simpan Pengaturan
        </button>
      </div>

      {/* Daftar Topik Terjadwal */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-aqua-glow" />
            <h2 className="text-lg font-bold text-white">Antrian Topik</h2>
          </div>
          <button
            onClick={() => setModeTambah(!modeTambah)}
            className="flex items-center gap-2 rounded-lg gradient-aqua px-4 py-2 text-sm font-bold text-white shadow-glow hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" />
            Tambah Topik
          </button>
        </div>

        {/* Form Tambah */}
        {modeTambah && (
          <div className="rounded-lg border-2 border-aqua-glow/30 bg-aqua-glow/5 p-4 space-y-3">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Tambah Topik Baru
            </h3>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">Topik</label>
              <input
                type="text"
                value={formTopik}
                onChange={(e) => setFormTopik(e.target.value)}
                placeholder="cth: cara membuat kolam terpal untuk ikan"
                className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-aqua-glow/60 focus:bg-white/10 focus:outline-none transition-all"
              />
              <div className="flex flex-wrap gap-2 mt-2">
                <div className="flex items-center gap-1.5 text-xs text-white/50">
                  <Lightbulb className="h-3.5 w-3.5" />
                  <span>Saran:</span>
                </div>
                {TOPIK_OTOMATIS.slice(0, 4).map(t => (
                  <button
                    key={t}
                    onClick={() => setFormTopik(t)}
                    className="text-xs bg-white/10 border border-white/20 hover:border-aqua-glow/40 hover:bg-aqua-glow/10 text-white/70 px-2 py-1 rounded-full transition-all"
                  >
                    {t.slice(0, 30)}...
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">Kategori</label>
                <select
                  value={formKategori}
                  onChange={(e) => setFormKategori(e.target.value)}
                  className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-aqua-glow/60 focus:bg-white/10 focus:outline-none transition-all"
                >
                  {KATEGORI_LIST.map(k => <option key={k} className="bg-navy-deep text-white">{k}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">Panjang</label>
                <select
                  value={formPanjang}
                  onChange={(e) => setFormPanjang(e.target.value)}
                  className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-aqua-glow/60 focus:bg-white/10 focus:outline-none transition-all"
                >
                  <option value="pendek" className="bg-navy-deep text-white">Pendek</option>
                  <option value="sedang" className="bg-navy-deep text-white">Sedang</option>
                  <option value="panjang" className="bg-navy-deep text-white">Panjang</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">Jam Khusus</label>
                <input
                  type="time"
                  value={formWaktu}
                  onChange={(e) => setFormWaktu(e.target.value)}
                  className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-aqua-glow/60 focus:bg-white/10 focus:outline-none transition-all"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-white/70 font-semibold">
              <input
                type="checkbox"
                checked={formGambar}
                onChange={(e) => setFormGambar(e.target.checked)}
                className="w-4 h-4 rounded accent-aqua-glow"
              />
              Generate gambar otomatis
            </label>
            <div className="flex gap-2">
              <button
                onClick={tambahJadwal}
                className="flex items-center gap-1.5 rounded-lg gradient-aqua px-4 py-2 text-sm font-bold text-white shadow-glow hover:opacity-90 transition-opacity"
              >
                <Check className="h-4 w-4" />
                Tambahkan
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

        {/* Tabel Jadwal */}
        {jadwalList.length === 0 ? (
          <div className="text-center py-10 text-white/40">
            <Calendar className="h-12 w-12 mx-auto mb-3 text-white/30" />
            <p className="text-sm font-semibold">Belum ada topik dalam antrian</p>
            <p className="text-xs mt-1">Klik "Tambah Topik" untuk menambahkan</p>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {jadwalList.map((item) => {
              const StatusIcon = statusConfig[item.status].icon
              return (
                <div key={item.id} className="flex items-start justify-between py-3 gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${statusConfig[item.status].badge}`}>
                        <StatusIcon className="h-3.5 w-3.5" />
                        {item.status}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-bold text-white/70">
                        {item.kategori}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-bold text-white/70">
                        <Camera className="h-3 w-3" />
                        {item.generateGambar ? 'Ya' : 'Tidak'}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-white mt-1.5 line-clamp-1">{item.topik}</p>
                    <p className="text-xs text-white/40 mt-0.5 flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      {item.waktu} WIB · {item.panjang}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {item.status !== 'selesai' && (
                      <button
                        onClick={() => jalankanSekarang(item)}
                        disabled={loading || item.status === 'proses'}
                        className="flex items-center gap-1.5 rounded-lg gradient-aqua px-3 py-1.5 text-xs font-bold text-white shadow-glow hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        {item.status === 'proses' ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Play className="h-3.5 w-3.5" />
                        )}
                        {item.status === 'proses' ? 'Proses...' : 'Jalankan'}
                      </button>
                    )}
                    {konfirmasiHapus === item.id ? (
                      <>
                        <button
                          onClick={() => hapusJadwal(item.id)}
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
                        onClick={() => setKonfirmasiHapus(item.id)}
                        className="text-white/40 hover:text-red-300 px-2 py-1.5 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Info GitHub Actions */}
      <div className="rounded-xl border border-accent/30 bg-accent/10 p-5 text-sm">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-accent shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-white mb-2">Cara Kerja Auto-Post</h3>
            <ol className="space-y-1 text-white/70 list-decimal list-inside">
              <li>GitHub Actions berjalan sesuai jadwal cron</li>
              <li>Script memanggil Groq API → generate artikel otomatis</li>
              <li>Cloudflare AI generate gambar thumbnail</li>
              <li>Artikel di-commit ke repo GitHub sebagai file <code className="bg-white/10 px-1 rounded">.md</code></li>
              <li>Cloudflare Pages auto-deploy → artikel langsung live</li>
            </ol>
            <p className="mt-3 text-xs text-white/50">
              Untuk mengubah jadwal permanen: edit <code className="bg-white/10 px-1 rounded">.github/workflows/auto-post.yml</code> → <code>schedule.cron</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
