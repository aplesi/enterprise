'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Cloud, FileCode2, Mail, Lock, DollarSign,
  Settings as SettingsIcon, Loader2, Save, XCircle, Check,
  Eye, EyeOff, ExternalLink, RefreshCw, CheckCircle2,
  Clock, Key, Zap, Cpu, Plus, Trash2, AlertTriangle,
  Sparkles, Image as ImageIcon
} from 'lucide-react'
import type { AiImageTestResult } from '@/types'

const IMAGE_MODEL_PRESETS = [
  'ag/gemini-3.1-flash-image',
  '@cf/black-forest-labs/flux-1-schnell',
  '@cf/leonardoai/phoenix-1.0',
  '@cf/stabilityai/stable-diffusion-xl-base-1.0',
]

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

interface GroqKeyEntry {
  label: string
  keySuffix: string
  isSet: boolean
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

export default function SettingsPage() {
  const [values, setValues] = useState<Record<string, string>>({})
  const [show, setShow] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState<Record<string, boolean>>({})
  const [error, setError] = useState('')

  // Groq status
  const [groqStatus, setGroqStatus] = useState<GroqStatus | null>(null)
  const [groqLoading, setGroqLoading] = useState(true)

  // Dynamic Groq key management
  const [groqKeys, setGroqKeys] = useState<GroqKeyEntry[]>([])
  const [newKeyValue, setNewKeyValue] = useState('')
  const [addingKey, setAddingKey] = useState(false)
  const [deletingKey, setDeletingKey] = useState<string | null>(null)
  const [keyActionMsg, setKeyActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // AI Image Router state
  const [testingImage, setTestingImage] = useState(false)
  const [imageTestResult, setImageTestResult] = useState<AiImageTestResult | null>(null)
  const [isCustomModel, setIsCustomModel] = useState(false)

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          const loaded = data.data || {}
          setValues(loaded)
          if (loaded.IMAGE_ROUTER_MODEL && !IMAGE_MODEL_PRESETS.includes(loaded.IMAGE_ROUTER_MODEL)) {
            setIsCustomModel(true)
          }
        }
      })
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
    fetchGroqKeys()
    const interval = setInterval(fetchGroqStatus, 30000)
    return () => clearInterval(interval)
  }, [fetchGroqStatus])

  // Fetch dynamic Groq keys from KV
  const fetchGroqKeys = useCallback(() => {
    fetch('/api/groq/keys')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setGroqKeys(data.data.keys || [])
      })
      .catch(() => {})
  }, [])

  // Add new Groq API key
  async function tambahGroqKey() {
    if (!newKeyValue.trim() || newKeyValue.trim().length < 10) {
      setKeyActionMsg({ type: 'error', text: 'API key tidak valid (minimal 10 karakter)' })
      return
    }
    setAddingKey(true)
    setKeyActionMsg(null)
    try {
      const res = await fetch('/api/groq/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: newKeyValue.trim() }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      setKeyActionMsg({ type: 'success', text: data.message })
      setNewKeyValue('')
      fetchGroqKeys()
      fetchGroqStatus()
    } catch (err: unknown) {
      setKeyActionMsg({ type: 'error', text: err instanceof Error ? err.message : 'Gagal menambahkan key' })
    } finally {
      setAddingKey(false)
    }
  }

  // Delete Groq API key
  async function hapusGroqKey(label: string) {
    if (!confirm(`Yakin ingin menghapus ${label}? Key ini tidak akan bisa dipakai lagi untuk generate.`)) return
    setDeletingKey(label)
    setKeyActionMsg(null)
    try {
      const res = await fetch('/api/groq/keys', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      setKeyActionMsg({ type: 'success', text: data.message })
      fetchGroqKeys()
      fetchGroqStatus()
    } catch (err: unknown) {
      setKeyActionMsg({ type: 'error', text: err instanceof Error ? err.message : 'Gagal menghapus key' })
    } finally {
      setDeletingKey(null)
    }
  }

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

  async function testImageGeneration() {
    setTestingImage(true)
    setImageTestResult(null)
    try {
      const res = await fetch('/api/settings/test-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseUrl: values['IMAGE_ROUTER_URL'] || '',
          apiKey: values['IMAGE_ROUTER_KEY'] || '',
          model: values['IMAGE_ROUTER_MODEL'] || '@cf/black-forest-labs/flux-1-schnell',
          enabled: values['IMAGE_ROUTER_ENABLED'] === 'true',
        }),
      })
      const data: AiImageTestResult = await res.json()
      setImageTestResult(data)
    } catch (err: unknown) {
      setImageTestResult({
        success: false,
        message: err instanceof Error ? err.message : 'Koneksi gagal atau jaringan terputus',
      })
    } finally {
      setTestingImage(false)
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
          <h1 className="text-xl font-semibold tracking-tight text-white flex items-center gap-2">
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
                  <p className="text-base font-semibold text-white">{groqStatus.totalKeys}</p>
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
                  <p className="text-base font-semibold text-green-400">{groqStatus.available}</p>
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
                  <p className="text-base font-semibold text-red-400">{groqStatus.rateLimited}</p>
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

        {/* Dynamic API Key Management */}
        <div className="space-y-4 pt-2 border-t border-white/10">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white/60 flex items-center gap-1.5">
              <Key className="h-3.5 w-3.5" />
              Kelola API Key ({groqKeys.length} terdaftar)
            </h3>
          </div>

          {/* Action message */}
          {keyActionMsg && (
            <div className={`flex items-start gap-3 rounded-lg p-3 text-xs ${
              keyActionMsg.type === 'success'
                ? 'border border-green-400/30 bg-green-500/10 text-green-300'
                : 'border border-red-400/30 bg-red-500/10 text-red-300'
            }`}>
              {keyActionMsg.type === 'success'
                ? <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                : <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              }
              <span>{keyActionMsg.text}</span>
            </div>
          )}

          {/* Existing keys list */}
          {groqKeys.length > 0 && (
            <div className="space-y-2">
              {groqKeys.map((gk) => (
                <div
                  key={gk.label}
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-8 w-8 place-items-center rounded-lg bg-aqua-glow/10">
                      <Key className="h-4 w-4 text-aqua-glow" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{gk.label}</p>
                      <p className="text-[10px] text-white/40 font-mono">...{gk.keySuffix}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => hapusGroqKey(gk.label)}
                    disabled={deletingKey === gk.label}
                    className="flex items-center gap-1.5 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-300 hover:bg-red-500/20 transition-all disabled:opacity-50"
                  >
                    {deletingKey === gk.label ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                    Hapus
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add new key */}
          <div className="rounded-lg border border-dashed border-white/20 bg-white/[0.02] p-4 space-y-3">
            <label className="block text-xs font-bold text-white/60">
              Tambah API Key Baru
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={show['new_groq_key'] ? 'text' : 'password'}
                  value={newKeyValue}
                  onChange={(e) => setNewKeyValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') tambahGroqKey() }}
                  placeholder="gsk_xxxxxxxxxxxxxxxxxxxx"
                  className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 pr-10 text-sm text-white placeholder:text-white/40 focus:border-aqua-glow/60 focus:bg-white/10 focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShow((prev) => ({ ...prev, 'new_groq_key': !prev['new_groq_key'] }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                >
                  {show['new_groq_key'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <button
                onClick={tambahGroqKey}
                disabled={addingKey || !newKeyValue.trim()}
                className="flex items-center gap-1.5 rounded-lg gradient-aqua px-4 py-2.5 text-sm font-bold text-white shadow-glow hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0"
              >
                {addingKey ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Tambah
              </button>
            </div>
            <p className="text-[10px] text-white/40">
              Dapatkan API Key gratis di{' '}
              <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="text-aqua-glow hover:underline">
                console.groq.com/keys
              </a>
              {' '}— maksimal 10 key. Setiap key = ~14.400 request/hari.
            </p>
          </div>
        </div>
      </div>

      {/* ==================== AI IMAGE GENERATOR & ROUTER ==================== */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="font-bold text-white text-base flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-aqua-glow" />
              AI Image Generator &amp; Router
            </h2>
            <p className="text-xs text-white/50 mt-1">
              Atur router visual AI eksternal (misal: 9Router, Cloudflare AI Gateway) atau gunakan Cloudflare Workers AI langsung.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => {
                const nextVal = values['IMAGE_ROUTER_ENABLED'] === 'true' ? 'false' : 'true'
                setValues((prev) => ({ ...prev, IMAGE_ROUTER_ENABLED: nextVal }))
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                values['IMAGE_ROUTER_ENABLED'] === 'true' ? 'bg-aqua-glow' : 'bg-white/20'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-slate-900 transition-transform ${
                  values['IMAGE_ROUTER_ENABLED'] === 'true' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="text-xs font-semibold text-white/80">
              {values['IMAGE_ROUTER_ENABLED'] === 'true' ? (
                <span className="text-aqua-glow font-bold">Gunakan AI Image Router</span>
              ) : (
                <span className="text-white/40">Direct Cloudflare</span>
              )}
            </span>
          </div>
        </div>

        {/* Info Box */}
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4 text-xs text-white/60 space-y-1">
          <p>
            💡 <strong className="text-white">Catatan:</strong> Pengaturan ini <span className="text-aqua-glow font-semibold">khusus untuk pembuatan gambar</span> artikel (visual). Teks artikel tetap dikelola secara terpisah oleh Groq AI (LLaMA 3.3 70B).
          </p>
          {values['IMAGE_ROUTER_ENABLED'] !== 'true' && (
            <p className="text-white/40 text-[11px] pt-1 border-t border-white/5">
              Saat router dinonaktifkan, generator memakai kredensial Cloudflare Workers AI langsung dari kartu Cloudflare di bawah.
            </p>
          )}
        </div>

        {/* Router Fields */}
        <div className="space-y-4">
          {/* Base URL */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
                Image Router Base URL
              </label>
              {saved['IMAGE_ROUTER_URL'] && (
                <span className="flex items-center gap-1 text-xs text-aqua-glow font-bold">
                  <Check className="h-3.5 w-3.5" />
                  Tersimpan
                </span>
              )}
            </div>
            <input
              type="text"
              value={values['IMAGE_ROUTER_URL'] || ''}
              onChange={(e) => setValues((prev) => ({ ...prev, IMAGE_ROUTER_URL: e.target.value }))}
              placeholder="https://ai.aplesi.my.id/v1"
              className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-aqua-glow/60 focus:bg-white/10 focus:outline-none transition-all"
            />
            <p className="text-xs text-white/50 mt-1.5">
              URL endpoint proxy router (misal: 9Router, Cloudflare AI Gateway, LiteLLM). Default placeholder: <code className="text-white/70">https://ai.aplesi.my.id/v1</code>
            </p>
          </div>

          {/* API Key */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
                Image Router API Key
              </label>
              {saved['IMAGE_ROUTER_KEY'] && (
                <span className="flex items-center gap-1 text-xs text-aqua-glow font-bold">
                  <Check className="h-3.5 w-3.5" />
                  Tersimpan
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type={show['IMAGE_ROUTER_KEY'] ? 'text' : 'password'}
                value={values['IMAGE_ROUTER_KEY'] || ''}
                onChange={(e) => setValues((prev) => ({ ...prev, IMAGE_ROUTER_KEY: e.target.value }))}
                placeholder="Bearer token / API Key router"
                className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 pr-10 text-sm text-white placeholder:text-white/40 focus:border-aqua-glow/60 focus:bg-white/10 focus:outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShow((prev) => ({ ...prev, IMAGE_ROUTER_KEY: !prev['IMAGE_ROUTER_KEY'] }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
              >
                {show['IMAGE_ROUTER_KEY'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-white/50 mt-1.5">
              Token autentikasi Bearer untuk router visual. Biarkan kosong jika router lokal tanpa otorisasi.
            </p>
          </div>

          {/* Model Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
                Pilihan Model Gambar
              </label>
              {saved['IMAGE_ROUTER_MODEL'] && (
                <span className="flex items-center gap-1 text-xs text-aqua-glow font-bold">
                  <Check className="h-3.5 w-3.5" />
                  Tersimpan
                </span>
              )}
            </div>
            <div className="space-y-2">
              <select
                value={
                  isCustomModel
                    ? 'custom'
                    : (values['IMAGE_ROUTER_MODEL'] || '@cf/black-forest-labs/flux-1-schnell')
                }
                onChange={(e) => {
                  const val = e.target.value
                  if (val === 'custom') {
                    setIsCustomModel(true)
                    if (IMAGE_MODEL_PRESETS.includes(values['IMAGE_ROUTER_MODEL'] || '')) {
                      setValues((prev) => ({ ...prev, IMAGE_ROUTER_MODEL: '' }))
                    }
                  } else {
                    setIsCustomModel(false)
                    setValues((prev) => ({ ...prev, IMAGE_ROUTER_MODEL: val }))
                  }
                }}
                className="w-full rounded-lg border border-white/15 bg-[#121824] px-4 py-2.5 text-sm text-white focus:border-aqua-glow/60 focus:outline-none transition-all"
              >
                <option value="ag/gemini-3.1-flash-image">
                  Google Gemini Flash Image (ag/gemini-3.1-flash-image) — 9Router Antigravity
                </option>
                <option value="@cf/black-forest-labs/flux-1-schnell">
                  FLUX-1 Schnell (@cf/black-forest-labs/flux-1-schnell) — Rekomendasi (Cepat &amp; Tajam)
                </option>
                <option value="@cf/leonardoai/phoenix-1.0">
                  Leonardo Phoenix (@cf/leonardoai/phoenix-1.0) — Fotografi Sinematik Realistis
                </option>
                <option value="@cf/stabilityai/stable-diffusion-xl-base-1.0">
                  SDXL Base (@cf/stabilityai/stable-diffusion-xl-base-1.0) — Stable Diffusion XL
                </option>
                <option value="custom">Model Kustom Lainnya...</option>
              </select>

              {isCustomModel && (
                <input
                  type="text"
                  value={values['IMAGE_ROUTER_MODEL'] || ''}
                  onChange={(e) => setValues((prev) => ({ ...prev, IMAGE_ROUTER_MODEL: e.target.value }))}
                  placeholder="Masukkan nama model kustom (misal: lucid-origin, dall-e-3, dll)"
                  className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-aqua-glow/60 focus:bg-white/10 focus:outline-none transition-all"
                />
              )}
            </div>
            <p className="text-xs text-white/50 mt-1.5">
              Model visual yang digunakan untuk generate gambar artikel. Default: <code className="text-white/70">@cf/black-forest-labs/flux-1-schnell</code>
            </p>
          </div>

          {/* Action & Test Area */}
          <div className="pt-2 border-t border-white/10">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={testImageGeneration}
                disabled={testingImage}
                className="flex items-center gap-2 rounded-lg border border-aqua-glow/30 bg-aqua-glow/10 px-4 py-2 text-sm font-bold text-aqua-glow hover:bg-aqua-glow/20 transition-all disabled:opacity-50"
              >
                {testingImage ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Menguji Generate Gambar...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Uji Generate Gambar
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={async () => {
                  setSaving(true)
                  try {
                    const res = await fetch('/api/settings', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        IMAGE_ROUTER_ENABLED: values['IMAGE_ROUTER_ENABLED'] || 'false',
                        IMAGE_ROUTER_URL: values['IMAGE_ROUTER_URL'] || '',
                        IMAGE_ROUTER_KEY: values['IMAGE_ROUTER_KEY'] || '',
                        IMAGE_ROUTER_MODEL: values['IMAGE_ROUTER_MODEL'] || '@cf/black-forest-labs/flux-1-schnell',
                      }),
                    })
                    const data = await res.json()
                    if (!data.success) throw new Error(data.error)
                    setSaved((prev) => ({
                      ...prev,
                      IMAGE_ROUTER_ENABLED: true,
                      IMAGE_ROUTER_URL: true,
                      IMAGE_ROUTER_KEY: true,
                      IMAGE_ROUTER_MODEL: true,
                    }))
                    setTimeout(() => {
                      setSaved((prev) => {
                        const copy = { ...prev }
                        delete copy.IMAGE_ROUTER_ENABLED
                        delete copy.IMAGE_ROUTER_URL
                        delete copy.IMAGE_ROUTER_KEY
                        delete copy.IMAGE_ROUTER_MODEL
                        return copy
                      })
                    }, 3000)
                  } catch (err: unknown) {
                    setError(err instanceof Error ? err.message : 'Gagal menyimpan pengaturan router')
                  } finally {
                    setSaving(false)
                  }
                }}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white transition-all disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Simpan Pengaturan Router
                  </>
                )}
              </button>

              <Link
                href="/admin/ai-accounts"
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#38bdf8]/70 bg-[#0e2a47] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#163d66] transition"
              >
                <Key className="w-3.5 h-3.5 text-aqua-glow" />
                Kelola Akun Google AI (OAuth &amp; Kuota)
              </Link>

              <span className="text-[11px] text-white/40">
                Uji koneksi router/Cloudflare dan tampilkan latency serta preview gambar sampel
              </span>
            </div>

            {/* Test Result Feedback */}
            {imageTestResult && (
              <div className={`mt-4 rounded-xl border p-4 text-xs transition-all ${
                imageTestResult.success
                  ? 'border-green-400/30 bg-green-500/10 text-green-300'
                  : 'border-red-400/30 bg-red-500/10 text-red-300'
              }`}>
                <div className="flex items-start gap-3">
                  {imageTestResult.success ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-green-400 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 shrink-0 text-red-400 mt-0.5" />
                  )}
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="font-semibold text-sm">
                        {imageTestResult.success ? 'Koneksi Berhasil!' : 'Koneksi Gagal'}
                      </span>
                      {imageTestResult.latencyMs !== undefined && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-mono text-white/80">
                          <Zap className="h-3 w-3 text-aqua-glow" />
                          {imageTestResult.latencyMs} ms
                        </span>
                      )}
                    </div>
                    <p className="text-xs opacity-90">{imageTestResult.message}</p>

                    {/* Image Preview Thumbnail */}
                    {imageTestResult.previewUrl && (
                      <div className="pt-2">
                        <p className="text-[10px] uppercase font-bold text-white/50 mb-1.5">Hasil Gambar Preview:</p>
                        <img
                          src={imageTestResult.previewUrl}
                          alt="Preview hasil generate"
                          className="h-36 w-36 object-cover rounded-lg border border-white/20 shadow-md"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
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
