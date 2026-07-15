// app/admin/(dashboard)/riwayat/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  ClipboardList,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  FileText,
  Image as ImageIcon,
  TrendingUp,
} from 'lucide-react'

interface GenerateLog {
  id: number
  topik: string
  kategori: string
  panjang: string
  tone: string
  status: 'pending' | 'success' | 'error' | 'partial'
  slug: string | null
  judul: string | null
  wordCount: number
  hasGambar: boolean
  errorMessage: string | null
  errorStage: string | null
  durationMs: number
  groqTokens: number
  createdAt: string
  publishedAt: string | null
}

interface Stats {
  total: number
  success: number
  error: number
  partial: number
  avgDurationMs: number
  successRate: number
  topErrors: { message: string; count: number }[]
}

const STATUS_CONFIG = {
  success: { label: 'Berhasil', color: 'text-emerald-400', bg: 'bg-emerald-400/10', icon: CheckCircle2 },
  error: { label: 'Gagal', color: 'text-red-400', bg: 'bg-red-400/10', icon: XCircle },
  partial: { label: 'Sebagian', color: 'text-amber-400', bg: 'bg-amber-400/10', icon: AlertTriangle },
  pending: { label: 'Pending', color: 'text-white/50', bg: 'bg-white/5', icon: Clock },
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`
}

function formatTanggal(iso: string): string {
  if (!iso) return '-'
  const d = new Date(iso)
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function RiwayatGeneratePage() {
  const [logs, setLogs] = useState<GenerateLog[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const limit = 15

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: String(limit), offset: String(page * limit) })
      if (filterStatus) params.set('status', filterStatus)

      const [logsRes, statsRes] = await Promise.all([
        fetch(`/api/generate/log?${params}`),
        fetch('/api/generate/log?action=stats'),
      ])

      const logsData = await logsRes.json()
      const statsData = await statsRes.json()

      if (logsData.success) {
        setLogs(logsData.data.logs)
        setTotal(logsData.data.total)
      }
      if (statsData.success) {
        setStats(statsData.data)
      }
    } catch (err) {
      console.error('Gagal memuat riwayat:', err)
    } finally {
      setLoading(false)
    }
  }, [page, filterStatus])

  useEffect(() => { fetchData() }, [fetchData])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <ClipboardList className="h-7 w-7 text-aqua-glow" />
            Riwayat Generate
          </h1>
          <p className="text-white/50 text-sm mt-1">Log semua aktivitas generate artikel AI</p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-all text-sm font-semibold disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Generate" value={String(stats.total)} icon={FileText} />
          <StatCard label="Berhasil" value={`${stats.successRate}%`} icon={TrendingUp} accent="emerald" />
          <StatCard label="Rata-rata Waktu" value={formatDuration(stats.avgDurationMs)} icon={Clock} />
          <StatCard label="Gagal" value={String(stats.error)} icon={XCircle} accent="red" />
        </div>
      )}

      {/* Top Errors */}
      {stats && stats.topErrors.length > 0 && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5">
          <h3 className="text-sm font-bold text-red-400 mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Error Paling Sering
          </h3>
          <div className="space-y-2">
            {stats.topErrors.map((err, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-white/60 truncate max-w-lg">{err.message}</span>
                <span className="text-red-400 font-bold ml-4">{err.count}x</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-2">
        {['', 'success', 'error', 'partial'].map((s) => (
          <button
            key={s}
            onClick={() => { setFilterStatus(s); setPage(0) }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterStatus === s
                ? 'bg-aqua-glow/20 text-aqua-glow border border-aqua-glow/30'
                : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
            }`}
          >
            {s === '' ? 'Semua' : STATUS_CONFIG[s as keyof typeof STATUS_CONFIG].label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="h-6 w-6 text-aqua-glow animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/40">
            <ClipboardList className="h-12 w-12 mb-3" />
            <p className="font-semibold">Belum ada riwayat generate</p>
            <p className="text-sm mt-1">Mulai generate artikel dari halaman Generate</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-white/50">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-white/50">Topik / Judul</th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-white/50">Kategori</th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-white/50">Detail</th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-white/50">Waktu</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const cfg = STATUS_CONFIG[log.status]
                  const StatusIcon = cfg.icon
                  return (
                    <tr key={log.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-bold ${cfg.bg} ${cfg.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-white font-semibold truncate max-w-xs">{log.judul || log.topik}</div>
                        {log.slug && (
                          <div className="text-white/40 text-xs mt-0.5">/artikel/{log.slug}</div>
                        )}
                        {log.errorMessage && log.status === 'error' && (
                          <div className="text-red-400/70 text-xs mt-1 truncate max-w-xs">{log.errorMessage}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-white/60">{log.kategori}</span>
                        <div className="text-white/30 text-xs">{log.panjang} · {log.tone}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 text-xs text-white/50">
                          {log.wordCount > 0 && (
                            <span className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {log.wordCount.toLocaleString()} kata
                            </span>
                          )}
                          {log.hasGambar && (
                            <span className="flex items-center gap-1 text-aqua-glow">
                              <ImageIcon className="h-3 w-3" />
                              gambar
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-white/60 text-xs">{formatTanggal(log.createdAt)}</div>
                        {log.durationMs > 0 && (
                          <div className="text-white/30 text-xs mt-0.5">{formatDuration(log.durationMs)}</div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
            <span className="text-xs text-white/40">
              {total} total · Halaman {page + 1} dari {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 disabled:opacity-30 transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 disabled:opacity-30 transition-all"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, icon: Icon, accent }: {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  accent?: 'emerald' | 'red'
}) {
  const accentClass = accent === 'emerald' ? 'text-emerald-400' : accent === 'red' ? 'text-red-400' : 'text-aqua-glow'
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`h-4 w-4 ${accentClass}`} />
        <span className="text-xs font-bold uppercase tracking-wider text-white/50">{label}</span>
      </div>
      <div className={`text-2xl font-black ${accentClass}`}>{value}</div>
    </div>
  )
}
