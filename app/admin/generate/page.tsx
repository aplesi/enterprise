// app/admin/generate/page.tsx
'use client'

import { useState } from 'react'

const KATEGORI_LIST = [
  'Pembenihan', 'Pakan', 'Penyakit & Pengobatan',
  'Manajemen Kolam', 'Panen & Pascapanen',
  'Bisnis & Pemasaran', 'Tips & Trik', 'Teknologi'
]

const TOPIK_SARAN = [
  'Cara budidaya lele dumbo untuk pemula',
  'Pakan alternatif hemat untuk lele',
  'Mengatasi penyakit white spot pada lele',
  'Kolam terpal vs kolam tanah perbandingan',
  'Sistem bioflok untuk budidaya lele intensif',
  'Cara panen lele yang benar dan menguntungkan',
]

interface HasilGenerate {
  judul: string
  ringkasan: string
  konten: string
  tags: string[]
  seoTitle: string
  seoDesc: string
  slug: string
  gambarUrl?: string
}

export default function GeneratePage() {
  const [topik, setTopik] = useState('')
  const [kategori, setKategori] = useState(KATEGORI_LIST[0])
  const [keywords, setKeywords] = useState('')
  const [panjang, setPanjang] = useState<'pendek' | 'sedang' | 'panjang'>('sedang')
  const [tone, setTone] = useState<'informatif' | 'tutorial' | 'berita'>('informatif')
  const [generateGambar, setGenerateGambar] = useState(true)
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState('')
  const [hasil, setHasil] = useState<HasilGenerate | null>(null)
  const [error, setError] = useState('')
  const [published, setPublished] = useState(false)

  async function handleGenerate() {
    if (!topik.trim()) return
    setLoading(true)
    setError('')
    setHasil(null)
    setPublished(false)

    try {
      setLoadingStep('Menghubungi Groq AI...')
      const res = await fetch('/api/generate/artikel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topik,
          kategori,
          keywords: keywords.split(',').map((k) => k.trim()).filter(Boolean),
          panjang,
          tone,
          generateGambar,
        }),
      })

      if (!res.ok) throw new Error(await res.text())

      setLoadingStep('Memproses hasil...')
      const data = await res.json()
      setHasil(data.data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
      setLoadingStep('')
    }
  }

  async function handlePublish() {
    if (!hasil) return
    setLoading(true)
    try {
      const res = await fetch('/api/generate/artikel/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artikel: hasil, kategori }),
      })
      if (!res.ok) throw new Error(await res.text())
      setPublished(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal publish')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Generate Artikel dengan AI</h1>
        <p className="text-gray-500 text-sm mt-1">
          Powered by Groq (LLaMA 3.3 70B) + Cloudflare AI
        </p>
      </div>

      {/* Form */}
      <div className="admin-card space-y-5">
        {/* Topik Saran */}
        <div>
          <label className="admin-label">Topik Artikel *</label>
          <input
            type="text"
            value={topik}
            onChange={(e) => setTopik(e.target.value)}
            placeholder="cth: cara budidaya lele dumbo untuk pemula"
            className="admin-input"
          />
          <div className="flex flex-wrap gap-2 mt-2">
            {TOPIK_SARAN.map((s) => (
              <button
                key={s}
                onClick={() => setTopik(s)}
                className="text-xs bg-gray-100 hover:bg-green-100 hover:text-green-700 text-gray-600 px-2 py-1 rounded-full transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Kategori */}
          <div>
            <label className="admin-label">Kategori</label>
            <select
              value={kategori}
              onChange={(e) => setKategori(e.target.value)}
              className="admin-input"
            >
              {KATEGORI_LIST.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>

          {/* Panjang */}
          <div>
            <label className="admin-label">Panjang Artikel</label>
            <select
              value={panjang}
              onChange={(e) => setPanjang(e.target.value as typeof panjang)}
              className="admin-input"
            >
              <option value="pendek">Pendek (500-700 kata)</option>
              <option value="sedang">Sedang (1000-1500 kata)</option>
              <option value="panjang">Panjang (2000-2500 kata)</option>
            </select>
          </div>

          {/* Tone */}
          <div>
            <label className="admin-label">Gaya Penulisan</label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value as typeof tone)}
              className="admin-input"
            >
              <option value="informatif">Informatif</option>
              <option value="tutorial">Tutorial Step-by-Step</option>
              <option value="berita">Berita / News</option>
            </select>
          </div>
        </div>

        {/* Keywords */}
        <div>
          <label className="admin-label">Keywords (pisah dengan koma)</label>
          <input
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="cth: lele dumbo, budidaya lele, kolam terpal"
            className="admin-input"
          />
        </div>

        {/* Generate Gambar */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="generateGambar"
            checked={generateGambar}
            onChange={(e) => setGenerateGambar(e.target.checked)}
            className="w-4 h-4 text-green-600"
          />
          <label htmlFor="generateGambar" className="text-sm text-gray-700">
            Generate gambar otomatis (Cloudflare AI)
          </label>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || !topik.trim()}
          className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">⚙️</span>
              {loadingStep || 'Generating...'}
            </span>
          ) : (
            '🤖 Generate Artikel Sekarang'
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          ❌ {error}
        </div>
      )}

      {/* Hasil */}
      {hasil && (
        <div className="admin-card space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">✅ Artikel Berhasil Digenerate</h2>
            {published ? (
              <span className="badge-green px-3 py-1">✓ Published</span>
            ) : (
              <button
                onClick={handlePublish}
                disabled={loading}
                className="btn-primary disabled:opacity-50"
              >
                {loading ? 'Publishing...' : '🚀 Publish Artikel'}
              </button>
            )}
          </div>

          {hasil.gambarUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={hasil.gambarUrl}
              alt={hasil.judul}
              className="w-full h-64 object-cover rounded-lg"
            />
          )}

          <div>
            <div className="admin-label">Judul</div>
            <div className="text-xl font-bold text-gray-900">{hasil.judul}</div>
          </div>

          <div>
            <div className="admin-label">Ringkasan</div>
            <div className="text-gray-600 text-sm">{hasil.ringkasan}</div>
          </div>

          <div>
            <div className="admin-label">SEO Title</div>
            <div className="text-sm text-gray-600">{hasil.seoTitle}</div>
          </div>

          <div>
            <div className="admin-label">Tags</div>
            <div className="flex flex-wrap gap-2">
              {hasil.tags.map((tag) => (
                <span key={tag} className="badge-green">{tag}</span>
              ))}
            </div>
          </div>

          <div>
            <div className="admin-label">Preview Konten (Markdown)</div>
            <textarea
              value={hasil.konten}
              readOnly
              rows={12}
              className="admin-input font-mono text-xs resize-y"
            />
          </div>
        </div>
      )}
    </div>
  )
}
