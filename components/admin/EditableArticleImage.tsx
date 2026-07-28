'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Edit3, Loader2, Image as ImageIcon, X } from 'lucide-react'

interface EditableArticleImageProps {
  slug: string
  gambar: string
  judul: string
}

export function EditableArticleImage({ slug, gambar: initialGambar, judul }: EditableArticleImageProps) {
  const [gambar, setGambar] = useState(initialGambar)
  const [isOpen, setIsOpen] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/admin/artikel/${slug}/image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
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

      const data = await res.json()
      if (data.success && data.data?.gambarUrl) {
        setGambar(data.data.gambarUrl)
        setIsOpen(false)
        setPrompt('')
      } else {
        throw new Error(data.error || 'Gagal mengubah gambar')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="relative w-full h-64 md:h-96 rounded-2xl overflow-hidden mb-8 bg-gray-100 group">
        <Image
          src={gambar}
          alt={judul}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 768px) 100vw, 700px"
        />
        
        {/* Hover Overlay & Edit Button (Only visible on hover) */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 border border-white/50 backdrop-blur-md text-white px-5 py-2.5 rounded-full font-bold shadow-xl transition-all"
          >
            <Edit3 className="w-4 h-4" />
            Ubah Gambar (AI)
          </button>
        </div>
      </div>

      {/* Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 flex items-center gap-2 text-lg">
                <ImageIcon className="w-5 h-5 text-green-600" />
                Generate Ulang Gambar
              </h3>
              <button
                onClick={() => !loading && setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                disabled={loading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Image Prompt (Bahasa Inggris)
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. close-up photograph of a farmer feeding tilapia in a round tarpaulin biofloc pond, golden morning light..."
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all resize-y min-h-[100px]"
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl">
                  {error}
                </div>
              )}
            </div>

            <div className="p-5 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setIsOpen(false)}
                disabled={loading}
                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleGenerate}
                disabled={loading || !prompt.trim()}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2 text-sm font-bold rounded-lg shadow-md transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Gambar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
