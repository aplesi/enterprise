'use client'

// app/admin/(dashboard)/groq/page.tsx
// Halaman monitoring status & quota API key Groq di admin panel

import { useState, useEffect, useCallback } from 'react'
import { Cpu, RefreshCw, CheckCircle2, XCircle, Clock, Key, Zap } from 'lucide-react'

interface GroqKeyInfo {
  label: string
  keySuffix: string
  isAvailable: boolean
  successCount: number
  failCount: number
  rateLimitedAt: number | null
  retryAfterSec: number
  readyAt: number | null
}

interface GroqStatus {
  totalKeys: number
  available: number
  rateLimited: number
  keys: GroqKeyInfo[]
}

export default function GroqPage() {
  const [status, setStatus] = useState<GroqStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchStatus = useCallback(() => {
    setLoading(true)
    fetch('/api/groq/status')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setStatus(data.data)
          setError('')
        } else {
          setError('Gagal memuat status Groq')
        }
      })
      .catch(() => setError('Gagal terhubung ke server'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchStatus()
    // Auto-refresh setiap 30 detik
    const interval = setInterval(fetchStatus, 30000)
    return () => clearInterval(interval)
  }, [fetchStatus])

  function formatTimeRemaining(readyAt: number): string {
    const now = Date.now()
    const diff = readyAt - now
    if (diff <= 0) return 'Siap digunakan'
    const minutes = Math.floor(diff / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)
    return `${minutes}m ${seconds}s lagi`
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-black text-white">
            <div className="grid h-10 w-10 place-items-center rounded-xl gradient-aqua shadow-glow">
              <Cpu className="h-5 w-5" />
            </div>
            Groq AI — Status API Key
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitoring realtime kuota dan rotasi API key Groq untuk generate artikel AI.
          </p>
        </div>
        <button
          onClick={fetchStatus}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-muted-foreground transition-all hover:border-aqua/50 hover:text-primary disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {status && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-500/10">
                  <Key className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Key</p>
                  <p className="text-2xl font-black text-white">{status.totalKeys}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-green-500/10">
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Tersedia</p>
                  <p className="text-2xl font-black text-green-400">{status.available}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-red-500/10">
                  <XCircle className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Rate Limited</p>
                  <p className="text-2xl font-black text-red-400">{status.rateLimited}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Capacity Bar */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Zap className="h-4 w-4 text-aqua-glow" />
                Kapasitas Harian
              </h3>
              <span className="text-xs text-muted-foreground">
                {status.totalKeys} key × 100.000 token = {(status.totalKeys * 100000).toLocaleString('id-ID')} token/hari
              </span>
            </div>
            <div className="h-4 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full transition-all duration-500 gradient-aqua"
                style={{ width: `${(status.available / Math.max(status.totalKeys, 1)) * 100}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {status.available} dari {status.totalKeys} key aktif ({Math.round((status.available / Math.max(status.totalKeys, 1)) * 100)}% kapasitas)
            </p>
          </div>

          {/* Key Detail Table */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="border-b border-border px-6 py-4">
              <h3 className="text-sm font-bold text-white">Detail Per API Key</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="px-6 py-3 text-left">Key</th>
                    <th className="px-6 py-3 text-left">Status</th>
                    <th className="px-6 py-3 text-right">Sukses</th>
                    <th className="px-6 py-3 text-right">Gagal</th>
                    <th className="px-6 py-3 text-left">Pulih Dalam</th>
                  </tr>
                </thead>
                <tbody>
                  {status.keys.map((key, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Key className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-white">{key.label}</span>
                          <span className="text-xs text-muted-foreground">(...{key.keySuffix})</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {key.isAvailable ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-semibold text-green-400">
                            <CheckCircle2 className="h-3 w-3" />
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-400">
                            <XCircle className="h-3 w-3" />
                            Rate Limited
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-green-400">
                        {key.successCount}
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-red-400">
                        {key.failCount}
                      </td>
                      <td className="px-6 py-4">
                        {key.readyAt ? (
                          <span className="flex items-center gap-1 text-xs text-yellow-400">
                            <Clock className="h-3 w-3" />
                            {formatTimeRemaining(key.readyAt)}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* API Key Settings */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="border-b border-border px-6 py-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Key className="h-4 w-4 text-aqua-glow" />
                Pengaturan API Key
              </h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-muted-foreground mb-4">
                Dapatkan API Key gratis (100.000 token/hari) di <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="text-aqua-glow hover:underline">console.groq.com/keys</a>. Masukkan hingga 5 key untuk kapasitas 500.000 token/hari.
              </p>
              
              <GroqKeyForm />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function GroqKeyForm() {
  const [keys, setKeys] = useState({
    GROQ_API_KEY: '',
    GROQ_API_KEY_2: '',
    GROQ_API_KEY_3: '',
    GROQ_API_KEY_4: '',
    GROQ_API_KEY_5: '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setKeys({
            GROQ_API_KEY: data.data?.GROQ_API_KEY || '',
            GROQ_API_KEY_2: data.data?.GROQ_API_KEY_2 || '',
            GROQ_API_KEY_3: data.data?.GROQ_API_KEY_3 || '',
            GROQ_API_KEY_4: data.data?.GROQ_API_KEY_4 || '',
            GROQ_API_KEY_5: data.data?.GROQ_API_KEY_5 || '',
          })
        }
      })
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSaved(false)
    
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(keys),
      })
      const data = await res.json()
      
      if (data.success) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
        setError(data.error || 'Gagal menyimpan key')
      }
    } catch (err) {
      setError('Terjadi kesalahan jaringan')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {Object.keys(keys).map((keyName, i) => (
        <div key={keyName} className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-white">
            {keyName === 'GROQ_API_KEY' ? 'Key Utama (GROQ_API_KEY)' : `Key Cadangan ${i} (${keyName})`}
          </label>
          <input
            type="password"
            value={keys[keyName as keyof typeof keys]}
            onChange={(e) => setKeys({ ...keys, [keyName]: e.target.value })}
            placeholder="gsk_..."
            className="rounded-lg border border-border bg-black/50 px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:border-aqua-glow focus:outline-none focus:ring-1 focus:ring-aqua-glow"
          />
        </div>
      ))}
      
      {error && <p className="text-sm text-red-400">{error}</p>}
      
      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl gradient-aqua px-4 py-2.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {saving ? (
          <span className="flex items-center gap-2">Memproses...</span>
        ) : saved ? (
          <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Tersimpan!</span>
        ) : (
          'Simpan API Key'
        )}
      </button>
      <p className="text-xs text-center text-yellow-500/80 mt-2">
        Catatan: Setelah menyimpan key baru, tekan tombol <strong>Refresh</strong> di atas atau muat ulang halaman untuk melihat status terbaru. Skrip <i>rewrite</i> juga otomatis menggunakan key dari sini.
      </p>
    </div>
  )
}
