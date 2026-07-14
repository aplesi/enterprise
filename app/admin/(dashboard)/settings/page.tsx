'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Cloud, FileCode2, Mail, Lock, DollarSign,
  Settings as SettingsIcon, Loader2, Save, XCircle, Check,
  Eye, EyeOff, ExternalLink, RefreshCw, CheckCircle2,
  Clock, Key, Zap, Cpu
} from 'lucide-react'

interface SettingField {
  key: string
  label: string
  placeholder: string
  tipe: 'text' | 'password' | 'url' | 'email'
  required: boolean
  keterangan: string
  link?: string
  linkLabel?: string
}

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

const SETTINGS: { grup: string; icon: typeof Cloud; fields: SettingField[] }[] = [
  {
    grup: 'Cloudflare',
    icon: Cloud,
    fields: [
      {
        key: 'CF_ACCOUNT_ID',
        label: 'Cloudflare Account ID',
        placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        tipe: 'text',
        required: true,
        keterangan: 'Dari Cloudflare Dashboard → kanan bawah',
      },
      {
        key: 'CF_API_TOKEN',
        label: 'Cloudflare API Token',
        placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        tipe: 'password',
        required: true,
        keterangan: 'Dashboard → My Profile → API Tokens',
        link: 'https://dash.cloudflare.com/profile/api-tokens',
        linkLabel: 'Buat API Token',
      },
      {
        key: 'CF_KV_NAMESPACE_ID',
        label: 'KV Namespace ID',
        placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        tipe: 'text',
        required: false,
        keterangan: 'Untuk menyimpan settings. Buat via: wrangler kv:namespace create aplesi-kv',
      },
    ],
  },
  {
    grup: 'GitHub — Auto Publish',
    icon: FileCode2,
    fields: [
      {
        key: 'GITHUB_TOKEN',
        label: 'GitHub Personal Access Token',
        placeholder: 'ghp_xxxxxxxxxxxxxxxxxxxx',
        tipe: 'password',
        required: true,
        keterangan: 'Untuk auto-commit artikel ke repo. Perlu scope: repo',
        link: 'https://github.com/settings/tokens/new',
        linkLabel: 'Buat token di GitHub',
      },
      {
        key: 'GITHUB_OWNER',
        label: 'GitHub Username',
        placeholder: 'username_github_kamu',
        tipe: 'text',
        required: true,
        keterangan: 'Username GitHub pemilik repo',
      },
      {
        key: 'GITHUB_REPO',
        label: 'Nama Repository',
        placeholder: 'aplesi-enterprise',
        tipe: 'text',
        required: true,
        keterangan: 'Nama repo GitHub project ini',
      },
    ],
  },
  {
    grup: 'Email — Newsletter',
    icon: Mail,
    fields: [
      {
        key: 'RESEND_API_KEY',
        label: 'Resend API Key',
        placeholder: 're_xxxxxxxxxxxxxxxxxxxx',
        tipe: 'password',
        required: false,
        keterangan: 'Untuk kirim email newsletter ke subscriber. Gratis 3000 email/bulan',
        link: 'https://resend.com',
        linkLabel: 'Daftar di resend.com',
      },
      {
        key: 'EMAIL_FROM',
        label: 'Email Pengirim',
        placeholder: 'noreply@aplesi.my.id',
        tipe: 'email',
        required: false,
        keterangan: 'Alamat email pengirim newsletter',
      },
    ],
  },
  {
    grup: 'Admin Panel',
    icon: Lock,
    fields: [
      {
        key: 'ADMIN_EMAIL',
        label: 'Email Admin',
        placeholder: 'admin@aplesi.my.id',
        tipe: 'email',
        required: true,
        keterangan: 'Email untuk login ke admin panel',
      },
      {
        key: 'ADMIN_PASSWORD',
        label: 'Password Admin',
        placeholder: 'min. 12 karakter',
        tipe: 'password',
        required: true,
        keterangan: 'Password harus kuat: huruf besar, angka, dan simbol',
      },
      {
        key: 'NEXTAUTH_SECRET',
        label: 'NextAuth Secret',
        placeholder: 'random string 32 karakter',
        tipe: 'password',
        required: true,
        keterangan: 'Generate dengan: openssl rand -base64 32',
      },
    ],
  },
  {
    grup: 'Analitik & Monetisasi',
    icon: DollarSign,
    fields: [
      {
        key: 'NEXT_PUBLIC_GA_ID',
        label: 'Google Analytics 4 ID',
        placeholder: 'G-XXXXXXXXXX',
        tipe: 'text',
        required: false,
        keterangan: 'Measurement ID dari Google Analytics 4',
      },
      {
        key: 'AFFILIATE_SECRET',
        label: 'Affiliate Secret Key',
        placeholder: 'random string untuk HMAC',
        tipe: 'password',
        required: false,
        keterangan: 'Secret untuk tracking link afiliasi',
      },
    ],
  },
]

const GROQ_KEYS = [
  { key: 'GROQ_API_KEY', label: 'Key Utama (GROQ_API_KEY)' },
  { key: 'GROQ_API_KEY_2', label: 'Key Cadangan 2 (GROQ_API_KEY_2)' },
  { key: 'GROQ_API_KEY_3', label: 'Key Cadangan 3 (GROQ_API_KEY_3)' },
  { key: 'GROQ_API_KEY_4', label: 'Key Cadangan 4 (GROQ_API_KEY_4)' },
  { key: 'GROQ_API_KEY_5', label: 'Key Cadangan 5 (GROQ_API_KEY_5)' },
]

export default function SettingsPage() {
  const [values, setValues] = useState<Record<string, string>>({})
  const [show, setShow] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState<Record<string, boolean>>({})
  const [error, setError] = useState('')

  // Groq status
  const [groqStatus, setGroqStatus] = useState<GroqStatus | null>(null)
  const [groqLoading, setGroqLoading] = useState(true)

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => { if (data.success) setValues(data.data || {}) })
      .catch(() => {})
  }, [])

  const fetchGroqStatus = useCallback(() => {
    setGroqLoading(true)
    fetch('/api/groq/status')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setGroqStatus(data.data)
      })
      .catch(() => {})
      .finally(() => setGroqLoading(false))
  }, [])

  useEffect(() => {
    fetchGroqStatus()
    const interval = setInterval(fetchGroqStatus, 30000)
    return () => clearInterval(interval)
  }, [fetchGroqStatus])

  async function simpanSemua() {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      const allKeys = Object.fromEntries(Object.keys(values).map((k) => [k, true]))
      setSaved(allKeys)
      setTimeout(() => setSaved({}), 3000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  function formatTimeRemaining(readyAt: number): string {
    const now = Date.now()
    const diff = readyAt - now
    if (diff <= 0) return 'Siap digunakan'
    const minutes = Math.floor(diff / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)
    return `${minutes}m ${seconds}s lagi`
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <SettingsIcon className="h-7 w-7 text-aqua-glow" />
            Settings
          </h1>
          <p className="text-white/60 text-sm mt-1">
            API keys & konfigurasi disimpan di Cloudflare KV — aman dan terenkripsi
          </p>
        </div>
        <button
          onClick={simpanSemua}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg gradient-aqua px-4 py-2.5 font-bold text-white shadow-glow hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Simpan Semua
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-300">
          <XCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* ==================== GROQ AI API KEYS ==================== */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-white text-base flex items-center gap-2">
            <Cpu className="h-5 w-5 text-aqua-glow" />
            Groq AI — API Keys
          </h2>
          <button
            onClick={fetchGroqStatus}
            disabled={groqLoading}
            className="flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/70 hover:bg-white/10 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${groqLoading ? 'animate-spin' : ''}`} />
            Refresh Status
          </button>
        </div>

        <p className="text-xs text-white/50">
          Dapatkan API Key gratis (14.400 request/hari) di{' '}
          <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="text-aqua-glow hover:underline inline-flex items-center gap-1">
            console.groq.com/keys <ExternalLink className="h-3 w-3" />
          </a>
          . Masukkan hingga 5 key untuk kapasitas lebih besar.
        </p>

        {/* Quota Status Cards */}
        {groqStatus && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-2.5">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-blue-500/10">
                  <Key className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">Total Key</p>
                  <p className="text-lg font-black text-white">{groqStatus.totalKeys}</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-2.5">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-green-500/10">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">Tersedia</p>
                  <p className="text-lg font-black text-green-400">{groqStatus.available}</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-2.5">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-red-500/10">
                  <XCircle className="h-4 w-4 text-red-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">Rate Limited</p>
                  <p className="text-lg font-black text-red-400">{groqStatus.rateLimited}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Capacity Bar */}
        {groqStatus && (
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-aqua-glow" />
                Kapasitas
              </h3>
              <span className="text-[10px] text-white/50">
                {groqStatus.available} dari {groqStatus.totalKeys} key aktif ({Math.round((groqStatus.available / Math.max(groqStatus.totalKeys, 1)) * 100)}%)
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full transition-all duration-500 gradient-aqua"
                style={{ width: `${(groqStatus.available / Math.max(groqStatus.totalKeys, 1)) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Per-Key Status Table */}
        {groqStatus && groqStatus.keys.length > 0 && (
          <div className="rounded-lg border border-white/10 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/10 text-[10px] font-bold uppercase tracking-wider text-white/50">
                  <th className="px-4 py-2.5 text-left">Key</th>
                  <th className="px-4 py-2.5 text-left">Status</th>
                  <th className="px-4 py-2.5 text-right">Sukses</th>
                  <th className="px-4 py-2.5 text-right">Gagal</th>
                  <th className="px-4 py-2.5 text-left">Pulih Dalam</th>
                </tr>
              </thead>
              <tbody>
                {groqStatus.keys.map((keyInfo, i) => (
                  <tr key={i} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <Key className="h-3 w-3 text-white/40" />
                        <span className="font-semibold text-white">{keyInfo.label}</span>
                        <span className="text-white/40">(...{keyInfo.keySuffix})</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      {keyInfo.isAvailable ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-bold text-green-400">
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-400">
                          <XCircle className="h-2.5 w-2.5" />
                          Limited
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-green-400">{keyInfo.successCount}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-red-400">{keyInfo.failCount}</td>
                    <td className="px-4 py-2.5">
                      {keyInfo.readyAt ? (
                        <span className="flex items-center gap-1 text-yellow-400">
                          <Clock className="h-2.5 w-2.5" />
                          {formatTimeRemaining(keyInfo.readyAt)}
                        </span>
                      ) : (
                        <span className="text-white/30">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 5 API Key Inputs */}
        <div className="space-y-3 pt-2 border-t border-white/10">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/60 flex items-center gap-1.5">
            <Key className="h-3.5 w-3.5" />
            Masukkan API Key (hingga 5)
          </h3>
          {GROQ_KEYS.map((gk) => (
            <div key={gk.key}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-white/70">
                  {gk.label}
                </label>
                {saved[gk.key] && (
                  <span className="flex items-center gap-1 text-xs text-aqua-glow font-bold">
                    <Check className="h-3.5 w-3.5" />
                    Tersimpan
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type={show[gk.key] ? 'text' : 'password'}
                  value={values[gk.key] || ''}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, [gk.key]: e.target.value }))
                  }
                  placeholder="gsk_..."
                  className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 pr-10 text-sm text-white placeholder:text-white/40 focus:border-aqua-glow/60 focus:bg-white/10 focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() =>
                    setShow((prev) => ({ ...prev, [gk.key]: !prev[gk.key] }))
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                >
                  {show[gk.key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          ))}
          <p className="text-xs text-white/40">
            Setelah menyimpan key baru, tekan <strong>Refresh Status</strong> untuk melihat status terbaru.
          </p>
        </div>
      </div>

      {/* ==================== OTHER SETTINGS ==================== */}
      {SETTINGS.map((grup) => {
        const Icon = grup.icon
        return (
          <div key={grup.grup} className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl space-y-4">
            <h2 className="font-bold text-white text-base flex items-center gap-2">
              <Icon className="h-5 w-5 text-aqua-glow" />
              {grup.grup}
            </h2>
            <div className="space-y-4">
              {grup.fields.map((field) => (
                <div key={field.key}>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
                      {field.label}
                      {field.required && <span className="text-red-300 ml-1">*</span>}
                    </label>
                    {saved[field.key] && (
                      <span className="flex items-center gap-1 text-xs text-aqua-glow font-bold">
                        <Check className="h-3.5 w-3.5" />
                        Tersimpan
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={show[field.key] ? 'text' : field.tipe}
                      value={values[field.key] || ''}
                      onChange={(e) =>
                        setValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                      }
                      placeholder={field.placeholder}
                      className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 pr-10 text-sm text-white placeholder:text-white/40 focus:border-aqua-glow/60 focus:bg-white/10 focus:outline-none transition-all"
                    />
                    {field.tipe === 'password' && (
                      <button
                        type="button"
                        onClick={() =>
                          setShow((prev) => ({ ...prev, [field.key]: !prev[field.key] }))
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                      >
                        {show[field.key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-white/50 mt-1.5">
                    {field.keterangan}
                    {field.link && (
                      <>
                        {' — '}
                        <a
                          href={field.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-aqua-glow hover:underline inline-flex items-center gap-1"
                        >
                          {field.linkLabel}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </>
                    )}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      <div className="rounded-xl border border-accent/30 bg-accent/10 p-4 text-sm">
        <div className="flex items-start gap-3">
          <Lock className="h-5 w-5 text-accent shrink-0 mt-0.5" />
          <div>
            <strong className="text-white font-bold">Keamanan:</strong>{' '}
            <span className="text-white/70">
              Semua API keys disimpan di Cloudflare KV yang terenkripsi. Tidak ada key yang tersimpan di database atau file kode.
              File <code className="bg-white/10 px-1 rounded">.env.local</code> lokal tetap bisa dipakai untuk development,
              tapi tidak perlu di-commit ke GitHub.
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
