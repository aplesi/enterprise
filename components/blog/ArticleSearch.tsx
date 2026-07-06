'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

const SUGGESTIONS = [
  'Budidaya ikan',
  'Budidaya nila',
  'Pakan ikan',
  'Kolam terpal',
  'Bioflok',
  'Penyakit ikan',
  'CBIB',
  'Probiotik',
]

export function ArticleSearch() {
  const [query, setQuery] = useState('')
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (q) router.push(`/cari?q=${encodeURIComponent(q)}`)
  }

  function handleSuggestion(tag: string) {
    setQuery(tag)
    router.push(`/cari?q=${encodeURIComponent(tag)}`)
  }

  return (
    <div className="w-full max-w-2xl">
      <form onSubmit={handleSubmit} className="relative">
        <div className="group relative flex items-center rounded-full border border-white/20 bg-white/5 shadow-glow backdrop-blur-xl transition-all focus-within:border-aqua-glow/60 focus-within:bg-white/10">
          <div className="pointer-events-none flex items-center pl-5 text-white/60">
            <Search className="h-5 w-5" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari panduan, artikel, atau topik budidaya ikan..."
            className="h-16 flex-1 bg-transparent px-3 pr-32 text-base text-white placeholder:text-white/50 focus:outline-none"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 h-12 -translate-y-1/2 rounded-full gradient-aqua px-6 text-sm font-semibold text-white shadow-glow hover:opacity-95 transition-opacity"
          >
            Cari
          </button>
        </div>
      </form>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-2">
        <span className="text-xs text-white/50">Populer:</span>
        {SUGGESTIONS.map((tag) => (
          <button
            key={tag}
            onClick={() => handleSuggestion(tag)}
            className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-medium text-white/70 transition-all hover:border-aqua-glow/50 hover:bg-aqua-glow/10 hover:text-aqua-glow"
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  )
}
