'use client'

import { useState } from 'react'
import { Sparkles, Loader2, Image as ImageIcon, X } from 'lucide-react'

interface AdminImageGeneratorProps {
  slug: string
  onSuccess?: () => void
}

export function AdminImageGenerator({ slug, onSuccess }: AdminImageGeneratorProps) {
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
        setIsOpen(false)
        setPrompt('')
        if (onSuccess) onSuccess()
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
      <button
        onClick={() => setIsOpen(true)}
        className="flex-shrink-0 p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-aqua-glow transition-colors"
        title="Ubah Gambar (AI)"
      >
        <Sparkles className="h-4 w-4" />
      </button>

      {/* Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 flex items-center gap-2 text-lg">
                <ImageIcon className="w-5 h-5 text-aqua-glow" />
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
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-aqua-glow/50 focus:ring-1 focus:ring-aqua-glow/50 outline-none transition-all resize-y min-h-[100px]"
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
                className="flex items-center gap-2 bg-aqua-glow hover:bg-aqua-glow/90 text-white px-5 py-2 text-sm font-bold rounded-lg shadow-md transition-colors disabled:opacity-50"
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
