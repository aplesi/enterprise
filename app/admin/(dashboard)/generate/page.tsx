// app/admin/(dashboard)/generate/page.tsx
'use client'

import { useState, useMemo } from 'react'
import {
  Loader2,
  Sparkles,
  XCircle,
  CheckCircle2,
  Send,
  Lightbulb,
  Eye,
  Code,
  X,
  Plus,
  Tag,
  Globe,
  FileEdit,
  Hash,
} from 'lucide-react'
import { KATEGORI_LIST as KATEGORI_TAKSONOMI } from '@/config/kategori'
import { marked } from 'marked'
import { slugify } from '@/lib/utils'

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
  imagePrompt?: string
}

function getCharCountColor(length: number, max: number): string {
  if (length === 0) return 'text-white/40'
  if (length > max) return 'text-red-400 font-semibold'
  if (length > max * 0.9) return 'text-amber-400 font-semibold'
  return 'text-aqua-glow'
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
  const [newTagInput, setNewTagInput] = useState('')
  const [error, setError] = useState('')
  const [published, setPublished] = useState(false)
  const [previewMode, setPreviewMode] = useState<'preview' | 'raw'>('preview')

  // Pre-render markdown → HTML untuk preview secara reaktif
  const previewHtml = useMemo(() => {
    if (!hasil?.konten) return ''
    return marked.parse(hasil.konten) as string
  }, [hasil?.konten])

  const wordCount = useMemo(() => {
    if (!hasil?.konten) return 0
    return hasil.konten.trim().split(/\s+/).filter(Boolean).length
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

  function handleAddTag() {
    if (!newTagInput.trim() || !hasil) return
    const splitTags = newTagInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
    const currentTags = hasil.tags || []
    const updated = Array.from(new Set([...currentTags, ...splitTags]))
    setHasil({ ...hasil, tags: updated })
    setNewTagInput('')
  }

  function handleRemoveTag(tagToRemove: string) {
    if (!hasil) return
    setHasil({ ...hasil, tags: (hasil.tags || []).filter((t) => t !== tagToRemove) })
  }

  async function handlePublish() {
    if (!hasil) return
    setError('')

    // Validasi kelayakan sebelum publish
    if (!hasil.judul.trim()) {
      setError('Judul artikel tidak boleh kosong.')
      return
    }
    if (!hasil.slug.trim()) {
      setError('Slug URL artikel tidak boleh kosong.')
      return
    }
    if (!hasil.konten.trim()) {
      setError('Konten artikel tidak boleh kosong.')
      return
    }

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
        <h1 className="text-xl font-semibold tracking-tight text-white">Generate Artikel dengan AI</h1>
        <p className="text-white/60 text-sm mt-1">
          Powered by Groq (LLaMA 3.3 70B) + Cloudflare AI
        </p>
      </div>

      {/* Form Input Generator */}
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

      {/* Error Alert */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-300">
          <XCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Hasil & Interactive Editable Form */}
      {hasil && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl space-y-6">
          {/* Header Panel Hasil */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-aqua-glow" />
                <h2 className="text-lg font-bold text-white">Review & Edit Artikel Sebelum Publish</h2>
              </div>
              <p className="text-xs text-white/50 mt-1">
                Silakan periksa atau sesuaikan judul, ringkasan, metadata SEO, kategori, tags, dan konten sebelum disimpan ke Cloudflare D1 & GitHub.
              </p>
            </div>
            <div>
              {published ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-aqua-glow/20 px-3.5 py-1.5 text-xs font-bold text-aqua-glow">
                  <CheckCircle2 className="h-4 w-4" />
                  Telah Dipublikasikan
                </span>
              ) : (
                <button
                  onClick={handlePublish}
                  disabled={loading}
                  className="flex items-center gap-2 rounded-lg gradient-aqua px-5 py-2.5 text-sm font-bold text-white shadow-glow hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Publish Artikel Sekarang
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Gambar Artikel Preview */}
          {hasil.gambarUrl && (
            <div className="space-y-1.5">
              <div className="text-xs font-bold uppercase tracking-wider text-white/70">
                Gambar Utama
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={hasil.gambarUrl}
                alt={hasil.judul}
                className="w-full h-64 sm:h-80 object-cover rounded-lg border border-white/10 shadow-lg"
              />
            </div>
          )}

          {/* Judul Artikel (Editable) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-white/70 flex items-center gap-1.5">
                <FileEdit className="h-3.5 w-3.5 text-aqua-glow" />
                Judul Artikel *
              </label>
              <span className="text-xs text-white/40">{hasil.judul.length} karakter</span>
            </div>
            <input
              type="text"
              value={hasil.judul}
              onChange={(e) => setHasil({ ...hasil, judul: e.target.value })}
              placeholder="Judul artikel utama..."
              className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-base font-semibold text-white placeholder:text-white/40 focus:border-aqua-glow/60 focus:bg-white/10 focus:outline-none transition-all"
            />
          </div>

          {/* Slug URL (Editable) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-white/70 flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-aqua-glow" />
                Slug URL (Permalink) *
              </label>
              <span className="text-xs text-white/40 font-mono">/artikel/{hasil.slug}</span>
            </div>
            <div className="flex rounded-lg border border-white/15 bg-white/5 focus-within:border-aqua-glow/60 focus-within:bg-white/10 transition-all overflow-hidden">
              <span className="px-3.5 py-2.5 text-xs text-white/40 bg-white/5 border-r border-white/10 select-none flex items-center font-mono">
                /artikel/
              </span>
              <input
                type="text"
                value={hasil.slug}
                onChange={(e) => setHasil({ ...hasil, slug: slugify(e.target.value) })}
                placeholder="slug-url-artikel"
                className="w-full bg-transparent px-3.5 py-2.5 text-sm text-white placeholder:text-white/40 font-mono focus:outline-none"
              />
            </div>
          </div>

          {/* Ringkasan Excerpt (Editable) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-white/70">
                Ringkasan (Excerpt) *
              </label>
              <span className={`text-xs ${getCharCountColor(hasil.ringkasan.length, 160)}`}>
                {hasil.ringkasan.length}/160 karakter
              </span>
            </div>
            <textarea
              rows={3}
              value={hasil.ringkasan}
              onChange={(e) => setHasil({ ...hasil, ringkasan: e.target.value })}
              placeholder="Ringkasan singkat artikel max 160 karakter..."
              className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white/90 leading-relaxed placeholder:text-white/40 focus:border-aqua-glow/60 focus:bg-white/10 focus:outline-none transition-all resize-y"
            />
          </div>

          {/* SEO Metadata: Title & Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-white/70">
                  SEO Title (Google SERP)
                </label>
                <span className={`text-xs ${getCharCountColor(hasil.seoTitle.length, 60)}`}>
                  {hasil.seoTitle.length}/60 karakter
                </span>
              </div>
              <input
                type="text"
                value={hasil.seoTitle}
                onChange={(e) => setHasil({ ...hasil, seoTitle: e.target.value })}
                placeholder="Judul SEO untuk Google Search..."
                className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-aqua-glow/60 focus:bg-white/10 focus:outline-none transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-white/70">
                  SEO Description
                </label>
                <span className={`text-xs ${getCharCountColor(hasil.seoDesc.length, 160)}`}>
                  {hasil.seoDesc.length}/160 karakter
                </span>
              </div>
              <textarea
                rows={2}
                value={hasil.seoDesc}
                onChange={(e) => setHasil({ ...hasil, seoDesc: e.target.value })}
                placeholder="Meta description untuk Google Search..."
                className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/90 placeholder:text-white/40 focus:border-aqua-glow/60 focus:bg-white/10 focus:outline-none transition-all resize-y"
              />
            </div>
          </div>

          {/* Kategori & Tags Editor */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* Kategori Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                Kategori Publish
              </label>
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-aqua-glow/60 focus:bg-white/10 focus:outline-none transition-all"
              >
                {KATEGORI_LIST.map((k) => (
                  <option key={k} value={k} className="bg-navy-deep text-white">
                    {k}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags Editor */}
            <div className="md:col-span-2 space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
                Tags Artikel (Tekan Enter atau tanda koma)
              </label>
              <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-lg border border-white/15 bg-white/5 focus-within:border-aqua-glow/60 focus-within:bg-white/10 transition-all min-h-[46px]">
                {(hasil.tags || []).map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 rounded-full bg-aqua-glow/20 border border-aqua-glow/30 px-3 py-1 text-xs font-bold text-aqua-glow"
                  >
                    <Hash className="h-3 w-3" />
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-white transition-colors"
                      title={`Hapus tag ${tag}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <div className="flex items-center gap-1 flex-1 min-w-[150px]">
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault()
                        handleAddTag()
                      }
                    }}
                    placeholder="Tambah tag baru..."
                    className="w-full bg-transparent text-xs text-white placeholder:text-white/40 focus:outline-none px-1"
                  />
                  {newTagInput.trim() && (
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="text-xs text-aqua-glow hover:text-white px-2 py-0.5 rounded bg-white/10"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Markdown Content Editor & Preview */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-white/70">
                  Konten Artikel
                </span>
                <span className="text-xs text-aqua-glow font-mono bg-aqua-glow/10 px-2 py-0.5 rounded">
                  {wordCount} kata
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPreviewMode('preview')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all ${
                    previewMode === 'preview'
                      ? 'bg-aqua-glow/20 text-aqua-glow'
                      : 'bg-white/5 text-white/40 hover:text-white/60'
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  Preview Render
                </button>
                <button
                  onClick={() => setPreviewMode('raw')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all ${
                    previewMode === 'raw'
                      ? 'bg-aqua-glow/20 text-aqua-glow'
                      : 'bg-white/5 text-white/40 hover:text-white/60'
                  }`}
                >
                  <Code className="h-3.5 w-3.5" />
                  Edit Markdown
                </button>
              </div>
            </div>

            {previewMode === 'preview' ? (
              <div
                className="prose prose-invert prose-sm max-w-none rounded-lg border border-white/15 bg-white/5 p-6 overflow-y-auto max-h-[550px]"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            ) : (
              <div className="space-y-2">
                <textarea
                  value={hasil.konten}
                  onChange={(e) => setHasil({ ...hasil, konten: e.target.value })}
                  rows={16}
                  placeholder="Ketik atau edit konten markdown artikel di sini..."
                  className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 font-mono text-xs text-white/90 placeholder:text-white/40 focus:border-aqua-glow/60 focus:bg-white/10 focus:outline-none transition-all resize-y leading-relaxed"
                />
                <p className="text-[11px] text-white/40 italic">
                  💡 Tip: Anda dapat mengedit teks, heading, tabel, atau rumus markdown di atas. Beralih ke tab &quot;Preview Render&quot; untuk melihat tampilan visual secara instan sebelum dipublish.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
