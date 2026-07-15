// app/admin/(dashboard)/generate/page.tsx
'use client'

import { useState, useMemo } from 'react'
import { Loader2, Sparkles, XCircle, CheckCircle2, Send, Lightbulb, Eye, Code } from 'lucide-react'
import { KATEGORI_LIST as KATEGORI_TAKSONOMI } from '@/config/kategori'
import { marked } from 'marked'

const KATEGORI_LIST = KATEGORI_TAKSONOMI.map((k) => k.nama)

const TOPIK_SARAN = [
  'Cara budidaya ikan nila untuk pemula',
  'Pakan alternatif hemat untuk ikan',
  'Mengatasi penyakit white spot pada ikan',
  'Kolam terpal vs kolam tanah perbandingan',
  'Sistem bioflok untuk budidaya ikan intensif',
  'Cara panen ikan yang benar dan menguntungkan',
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
  const [previewMode, setPreviewMode] = useState<'preview' | 'raw'>('preview')

  // Pre-render markdown → HTML untuk preview
  const previewHtml = useMemo(() => {
    if (!hasil?.konten) return ''
    return marked.parse(hasil.konten) as string
  }, [hasil?.konten])

  async function handleGenerate() {
    if (!topik.trim()) return
    setLoading(true)
    setError('')
    setHasil(null)
    setPublished(false)

    // Timeout 120 detik — generate artikel panjang bisa 30-60 detik
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 120_000)

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
        signal: controller.signal,
      })

      clearTimeout(timeout)

      if (!res.ok) {
        const text = await res.text()
        let errorMsg = text
        try {
          const json = JSON.parse(text)
          if (json.error) errorMsg = json.error
        } catch {
          // text bukan JSON, pakai apa adanya
        }
        throw new Error(errorMsg)
      }

      setLoadingStep('Memproses hasil...')
      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error || 'Generate gagal, respons tidak valid')
      }

      setHasil(data.data)
    } catch (err: unknown) {
      clearTimeout(timeout)
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError('Request timeout — koneksi ke AI terlalu lama (>120 detik). Coba lagi atau pilih panjang artikel yang lebih pendek.')
      } else if (err instanceof TypeError && err.message === 'Failed to fetch') {
        setError('Gagal terhubung ke server. Pastikan koneksi internet stabil dan dev server berjalan.')
      } else {
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan tidak diketahui')
      }
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
      if (!res.ok) {
        const text = await res.text()
        try {
          const json = JSON.parse(text)
          throw new Error(json.error || text)
        } catch {
          throw new Error(text)
        }
      }
      setPublished(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal publish')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white">Generate Artikel dengan AI</h1>
        <p className="text-white/60 text-sm mt-1">
          Powered by Groq (LLaMA 3.3 70B) + Cloudflare AI
        </p>
      </div>

      {/* Form */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl space-y-5">
        {/* Topik Artikel */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
            Topik Artikel *
          </label>
          <input
            type="text"
            value={topik}
            onChange={(e) => setTopik(e.target.value)}
            placeholder="cth: cara budidaya ikan nila untuk pemula"
            className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-aqua-glow/60 focus:bg-white/10 focus:outline-none transition-all"
          />
          <div className="flex flex-wrap gap-2 mt-3">
            <div className="flex items-center gap-1.5 text-xs text-white/50">
              <Lightbulb className="h-3.5 w-3.5" />
              <span>Saran:</span>
            </div>
            {TOPIK_SARAN.map((s) => (
              <button
                key={s}
                onClick={() => setTopik(s)}
                className="text-xs bg-white/10 hover:bg-aqua-glow/20 hover:text-aqua-glow text-white/70 px-2.5 py-1 rounded-full transition-all"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Kategori */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
              Kategori
            </label>
            <select
              value={kategori}
              onChange={(e) => setKategori(e.target.value)}
              className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-aqua-glow/60 focus:bg-white/10 focus:outline-none transition-all"
            >
              {KATEGORI_LIST.map((k) => (
                <option key={k} value={k} className="bg-navy-deep text-white">{k}</option>
              ))}
            </select>
          </div>

          {/* Panjang */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
              Panjang Artikel
            </label>
            <select
              value={panjang}
              onChange={(e) => setPanjang(e.target.value as typeof panjang)}
              className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-aqua-glow/60 focus:bg-white/10 focus:outline-none transition-all"
            >
              <option value="pendek" className="bg-navy-deep text-white">Pendek (500-700 kata)</option>
              <option value="sedang" className="bg-navy-deep text-white">Sedang (1000-1500 kata)</option>
              <option value="panjang" className="bg-navy-deep text-white">Panjang (2000-2500 kata)</option>
            </select>
          </div>

          {/* Tone */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
              Gaya Penulisan
            </label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value as typeof tone)}
              className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-aqua-glow/60 focus:bg-white/10 focus:outline-none transition-all"
            >
              <option value="informatif" className="bg-navy-deep text-white">Informatif</option>
              <option value="tutorial" className="bg-navy-deep text-white">Tutorial Step-by-Step</option>
              <option value="berita" className="bg-navy-deep text-white">Berita / News</option>
            </select>
          </div>
        </div>

        {/* Keywords */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
            Keywords (pisah dengan koma)
          </label>
          <input
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="cth: ikan nila, budidaya ikan, kolam terpal"
            className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-aqua-glow/60 focus:bg-white/10 focus:outline-none transition-all"
          />
        </div>

        {/* Generate Gambar */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="generateGambar"
            checked={generateGambar}
            onChange={(e) => setGenerateGambar(e.target.checked)}
            className="w-4 h-4 rounded accent-aqua-glow"
          />
          <label htmlFor="generateGambar" className="text-sm text-white/70 font-semibold">
            Generate gambar otomatis (Cloudflare AI)
          </label>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || !topik.trim()}
          className="flex w-full items-center justify-center gap-2 rounded-lg gradient-aqua px-6 py-3 font-bold text-white shadow-glow hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              {loadingStep || 'Generating...'}
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" />
              Generate Artikel Sekarang
            </>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-300">
          <XCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Hasil */}
      {hasil && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-aqua-glow" />
              <h2 className="text-lg font-bold text-white">Artikel Berhasil Digenerate</h2>
            </div>
            {published ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-aqua-glow/20 px-3 py-1 text-xs font-bold text-aqua-glow">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Published
              </span>
            ) : (
              <button
                onClick={handlePublish}
                disabled={loading}
                className="flex items-center gap-2 rounded-lg gradient-aqua px-4 py-2 text-sm font-bold text-white shadow-glow hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Publish Artikel
                  </>
                )}
              </button>
            )}
          </div>

          {hasil.gambarUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={hasil.gambarUrl}
              alt={hasil.judul}
              className="w-full h-64 object-cover rounded-lg border border-white/10"
            />
          )}

          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-white/70 mb-2">Judul</div>
            <div className="text-xl font-bold text-white">{hasil.judul}</div>
          </div>

          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-white/70 mb-2">Ringkasan</div>
            <div className="text-white/60 text-sm leading-relaxed">{hasil.ringkasan}</div>
          </div>

          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-white/70 mb-2">SEO Title</div>
            <div className="text-sm text-white/60">{hasil.seoTitle}</div>
          </div>

          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-white/70 mb-2">Tags</div>
            <div className="flex flex-wrap gap-2">
              {hasil.tags.map((tag) => (
                <span key={tag} className="inline-flex items-center rounded-full bg-aqua-glow/20 px-2.5 py-0.5 text-xs font-bold text-aqua-glow">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-bold uppercase tracking-wider text-white/70">Preview Konten</div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPreviewMode('preview')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                    previewMode === 'preview'
                      ? 'bg-aqua-glow/20 text-aqua-glow'
                      : 'bg-white/5 text-white/40 hover:text-white/60'
                  }`}
                >
                  <Eye className="h-3 w-3" />
                  Preview
                </button>
                <button
                  onClick={() => setPreviewMode('raw')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                    previewMode === 'raw'
                      ? 'bg-aqua-glow/20 text-aqua-glow'
                      : 'bg-white/5 text-white/40 hover:text-white/60'
                  }`}
                >
                  <Code className="h-3 w-3" />
                  Markdown
                </button>
              </div>
            </div>
            {previewMode === 'preview' ? (
              <div
                className="prose prose-invert prose-sm max-w-none rounded-lg border border-white/15 bg-white/5 p-5 overflow-y-auto max-h-[500px]"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            ) : (
              <textarea
                value={hasil.konten}
                readOnly
                rows={12}
                className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 font-mono text-xs text-white/80 placeholder:text-white/40 focus:border-aqua-glow/60 focus:bg-white/10 focus:outline-none transition-all resize-y"
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
