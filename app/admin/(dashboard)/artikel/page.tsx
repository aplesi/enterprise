// app/admin/(dashboard)/artikel/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  FileText,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Image as ImageIcon,
  Calendar,
  Eye,
} from 'lucide-react'

interface ArtikelItem {
  slug: string
  judul: string
  ringkasan: string
  gambar: string
  kategori: string
  penulis: string
  tanggal: string
  status: string
  waktuBaca?: number
}

const LIMIT = 20

export default function AdminArtikelPage() {
  const [artikelList, setArtikelList] = useState<ArtikelItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [filterKategori, setFilterKategori] = useState('')
  const [loading, setLoading] = useState(true)
  const [kategoriList, setKategoriList] = useState<string[]>([])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        limit: String(LIMIT),
        offset: String(page * LIMIT),
      })
      if (search) params.set('search', search)
      if (filterKategori) params.set('kategori', filterKategori)

      const res = await fetch(`/api/articles?${params}`)
      const data = await res.json()

      if (data.data) {
        setArtikelList(data.data)
        setTotal(data.total ?? data.data.length)
      }

      // Ambil daftar kategori unik (hanya sekali)
      if (kategoriList.length === 0 && data.data?.length > 0) {
        const allRes = await fetch('/api/articles?limit=500')
        const allData = await allRes.json()
        if (allData.data) {
          const cats = [...new Set(allData.data.map((a: ArtikelItem) => a.kategori))] as string[]
          setKategoriList(cats.sort())
        }
      }
    } catch (err) {
      console.error('Gagal memuat artikel:', err)
    } finally {
      setLoading(false)
    }
  }, [page, search, filterKategori, kategoriList.length])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const totalPages = Math.ceil(total / LIMIT)

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setPage(0)
      fetchData()
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white flex items-center gap-3">
            <FileText className="h-6 w-6 text-aqua-glow" />
            Semua Artikel
          </h1>
          <p className="text-white/50 text-sm mt-1">
            {loading ? 'Memuat...' : `${total} artikel ditemukan`}
          </p>
        </div>
        <button
          onClick={() => { setPage(0); fetchData() }}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-all text-sm font-semibold disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input
            type="text"
            placeholder="Cari judul artikel..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearch}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-aqua-glow/50 transition-colors"
          />
        </div>

        {/* Filter Kategori */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => { setFilterKategori(''); setPage(0) }}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
              !filterKategori
                ? 'bg-aqua-glow/20 text-aqua-glow border border-aqua-glow/30'
                : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
            }`}
          >
            Semua
          </button>
          {kategoriList.map((kat) => (
            <button
              key={kat}
              onClick={() => { setFilterKategori(kat); setPage(0) }}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                filterKategori === kat
                  ? 'bg-aqua-glow/20 text-aqua-glow border border-aqua-glow/30'
                  : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
              }`}
            >
              {kat}
            </button>
          ))}
        </div>
      </div>

      {/* Artikel List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="h-6 w-6 text-aqua-glow animate-spin" />
          </div>
        ) : artikelList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/40">
            <FileText className="h-12 w-12 mb-3" />
            <p className="font-semibold">Tidak ada artikel ditemukan</p>
          </div>
        ) : (
          artikelList.map((artikel) => (
            <div
              key={artikel.slug}
              className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 hover:border-aqua-glow/30 hover:bg-white/[0.07] transition-all"
            >
              <div className="flex gap-4">
                {/* Thumbnail */}
                {artikel.gambar && (
                  <div className="relative w-20 h-20 md:w-28 md:h-20 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                    <Image
                      src={artikel.gambar}
                      alt={artikel.judul}
                      fill
                      className="object-cover"
                      sizes="112px"
                    />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-white truncate">
                        {artikel.judul}
                      </h3>
                      <p className="text-xs text-white/40 mt-1 line-clamp-1">
                        {artikel.ringkasan}
                      </p>
                    </div>
                    <Link
                      href={`/artikel/${artikel.slug}`}
                      target="_blank"
                      className="flex-shrink-0 p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-aqua-glow transition-colors"
                      title="Lihat artikel"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-3 mt-2.5 flex-wrap">
                    <span className="inline-flex items-center rounded-full bg-aqua-glow/10 px-2 py-0.5 text-[10px] font-bold text-aqua-glow">
                      {artikel.kategori}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-white/40">
                      <Calendar className="h-3 w-3" />
                      {artikel.tanggal}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-white/40">
                      <Eye className="h-3 w-3" />
                      {(artikel.waktuBaca ?? 1)} mnt baca
                    </span>
                    {artikel.gambar && artikel.gambar !== '/images/og-default.png' && (
                      <span className="flex items-center gap-1 text-[11px] text-emerald-400/70">
                        <ImageIcon className="h-3 w-3" />
                        gambar
                      </span>
                    )}
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      artikel.status === 'published'
                        ? 'bg-emerald-400/10 text-emerald-400'
                        : 'bg-amber-400/10 text-amber-400'
                    }`}>
                      {artikel.status === 'published' ? 'Published' : 'Draft'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-white/40">
            {total} artikel · Halaman {page + 1} dari {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 disabled:opacity-30 transition-all"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 disabled:opacity-30 transition-all"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
