'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  FileText, 
  Image as ImageIcon,
  Tag,
  AlertCircle
} from 'lucide-react'
import Image from 'next/image'

interface ArticleForm {
  judul: string
  ringkasan: string
  kategori: string
  tags: string
  status: 'draft' | 'published'
  seoTitle: string
  seoDesc: string
  konten: string
}

export default function EditArtikelPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [gambarUtama, setGambarUtama] = useState('')
  
  const [formData, setFormData] = useState<ArticleForm>({
    judul: '',
    ringkasan: '',
    kategori: '',
    tags: '',
    status: 'draft',
    seoTitle: '',
    seoDesc: '',
    konten: ''
  })

  useEffect(() => {
    async function fetchArticle() {
      try {
        const res = await fetch(`/api/admin/artikel/${slug}`)
        const data = await res.json()
        
        if (data.success && data.data) {
          const art = data.data
          setFormData({
            judul: art.judul || '',
            ringkasan: art.ringkasan || '',
            kategori: art.kategori || '',
            tags: Array.isArray(art.tags) ? art.tags.join(', ') : (art.tags || ''),
            status: art.status || 'draft',
            seoTitle: art.seoTitle || '',
            seoDesc: art.seoDesc || '',
            konten: art.konten || ''
          })
          setGambarUtama(art.gambar || '')
        } else {
          setError(data.error || 'Artikel tidak ditemukan')
        }
      } catch (err: unknown) {
        setError('Gagal memuat artikel: ' + (err instanceof Error ? err.message : String(err)))
      } finally {
        setLoading(false)
      }
    }
    fetchArticle()
  }, [slug])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setSuccess(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)

    try {
      const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(Boolean)
      
      const payload = {
        ...formData,
        tags: tagsArray
      }

      const res = await fetch(`/api/admin/artikel/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (data.success) {
        setSuccess(true)
        // Auto scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        throw new Error(data.error || 'Gagal menyimpan artikel')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-aqua-glow" />
        <p className="text-white/60">Memuat data artikel...</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/artikel"
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-aqua-glow" />
              Edit Artikel
            </h1>
            <p className="text-xs text-white/50 mt-1 font-mono">{slug}</p>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex items-center gap-2 bg-aqua-glow text-white px-5 py-2.5 rounded-lg font-bold hover:bg-aqua-glow/90 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center gap-3 text-sm">
          <FileText className="w-5 h-5 flex-shrink-0" />
          Perubahan berhasil disimpan! Perubahan akan segera tersedia di publik.
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri (Utama) */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-white/80 mb-1.5">Judul Artikel</label>
              <input
                type="text"
                name="judul"
                value={formData.judul}
                onChange={handleChange}
                required
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-aqua-glow/50"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-white/80 mb-1.5">Ringkasan</label>
              <textarea
                name="ringkasan"
                value={formData.ringkasan}
                onChange={handleChange}
                rows={3}
                required
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-aqua-glow/50 resize-y"
              />
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4 flex flex-col h-[600px]">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-semibold text-white/80">Konten (Markdown)</label>
              <a href="https://www.markdownguide.org/cheat-sheet/" target="_blank" className="text-xs text-aqua-glow hover:underline">
                Panduan Markdown
              </a>
            </div>
            <textarea
              name="konten"
              value={formData.konten}
              onChange={handleChange}
              required
              className="w-full flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-aqua-glow/50 resize-none"
            />
          </div>
        </div>

        {/* Kolom Kanan (Sidebar Edit) */}
        <div className="space-y-5">
          {/* Gambar Preview */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-aqua-glow" />
              Gambar Utama
            </h3>
            {gambarUtama ? (
              <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black/40">
                <Image src={gambarUtama} alt="Thumbnail" fill className="object-cover" sizes="300px" />
              </div>
            ) : (
              <div className="w-full aspect-video rounded-lg bg-black/20 border border-white/5 flex items-center justify-center text-white/30 text-sm">
                Tidak ada gambar
              </div>
            )}
            <p className="text-xs text-white/40 mt-3 italic">
              Untuk mengubah gambar, kembali ke halaman daftar artikel dan klik ikon "Generate Ulang Gambar".
            </p>
          </div>

          {/* Meta Info */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-white/80 mb-1.5 flex items-center gap-2">
                <Tag className="w-4 h-4 text-aqua-glow" /> Kategori
              </label>
              <input
                type="text"
                name="kategori"
                value={formData.kategori}
                onChange={handleChange}
                required
                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-aqua-glow/50"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-white/80 mb-1.5">
                Tags <span className="text-white/40 font-normal">(pisahkan dgn koma)</span>
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-aqua-glow/50"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-white/80 mb-1.5">Status Publish</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-aqua-glow/50"
              >
                <option value="published">Published (Terbit)</option>
                <option value="draft">Draft (Konsep)</option>
              </select>
            </div>
          </div>

          {/* SEO Info */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white/80 border-b border-white/10 pb-2">
              SEO Optimization
            </h3>
            
            <div>
              <label className="block text-xs font-semibold text-white/60 mb-1.5">SEO Title (Max 60 chars)</label>
              <input
                type="text"
                name="seoTitle"
                value={formData.seoTitle}
                onChange={handleChange}
                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-aqua-glow/50"
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-white/60 mb-1.5">SEO Description (Max 160 chars)</label>
              <textarea
                name="seoDesc"
                value={formData.seoDesc}
                onChange={handleChange}
                rows={4}
                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-aqua-glow/50 resize-none"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
